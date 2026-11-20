#!/usr/bin/env python3
"""ICPC/全科工作台本地一体化服务（静态文件服务 + C++20/Python 编译运行判题 + 在线对拍 + OJ 抓取 + AI 代理）"""
import html as _html
import ipaddress
import gzip
import json
import mimetypes
import os
import re as _re
import secrets
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
import urllib.request as _urllib_req
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = "127.0.0.1"
PORT = 8765
AUTH_TOKEN = None
ALLOW_LAN_EXEC = False
ACTIVE_MOBILE_URL = ""
ACTIVE_LOCAL_URL = ""
_GZIP_CACHE = {}  # (path, mtime_ns, size) -> bytes
_GZIP_CACHE_MAX = 48
_GZIP_LOCK = threading.Lock()
MAX_OUTPUT_CHARS = 512 * 1024  # 512 KB cap for stdout/stderr

_BLOCKED_STATIC_DIRS = {"scripts", "markdown_src", "labs_harness", "__pycache__", ".runner_tmp", ".lab_tmp", ".git"}
_BLOCKED_STATIC_EXTS = {".py", ".pyc", ".pyo", ".bat", ".command", ".sh", ".ps1"}
_BLOCKED_STATIC_FILES = {"maintenance_state.json", "build_data.py", "local_cpp_runner.py", "workbench_sync.json", "workbench_sync.json.tmp"}


def _detect_cpp_compiler():
    for exe in ("g++", "clang++"):
        if shutil.which(exe):
            return exe
    return None


def _detect_lan_ip():
    """自动探测本机局域网 IPv4（不发出真实网络包，跨 Windows/macOS/Linux 通用）"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        if ip and not ip.startswith("127."):
            return ip
    except Exception:
        pass
    finally:
        s.close()
    try:
        ip = socket.gethostbyname(socket.gethostname())
        if ip and not ip.startswith("127."):
            return ip
    except Exception:
        pass
    return "127.0.0.1"


_LAN_IP_CACHE = _detect_lan_ip()
WORKBENCH_ROOT = os.path.dirname(os.path.abspath(__file__))
SYNC_STATE_FILE = os.path.join(WORKBENCH_ROOT, "workbench_sync.json")
_SYNC_LOCK = threading.Lock()


def _make_exec_tempdir():
    base = os.path.join(WORKBENCH_ROOT, ".runner_tmp")
    os.makedirs(base, exist_ok=True)
    return tempfile.TemporaryDirectory(dir=base)


def _truncate_output(text):
    if not text:
        return ""
    if len(text) > MAX_OUTPUT_CHARS:
        return text[:MAX_OUTPUT_CHARS] + f"\n... [输出超过 {MAX_OUTPUT_CHARS // 1024} KB 已截断]"
    return text


def _clean_html_pre(raw):
    raw = _re.sub(r"<br\s*/?>", "\n", raw, flags=_re.I)
    raw = _re.sub(r"</div>\s*<div[^>]*>", "\n", raw, flags=_re.I)
    raw = _re.sub(r"<[^>]+>", "", raw)
    return _html.unescape(raw).strip() + "\n"


def _is_safe_ai_target_url(target_url):
    """防 SSRF：仅允许公网 http/https 目标（放行本机 Ollama 11434 端口），返回 (ok, code, reason)"""
    if not isinstance(target_url, str) or not target_url.strip():
        return False, "BAD_URL", "缺少有效的目标 URL"
    try:
        u = urllib.parse.urlparse(target_url.strip())
        if u.scheme not in ("http", "https") or not u.hostname:
            return False, "BAD_URL", "仅支持 http/https URL"
        host = u.hostname.lower()
        # Allow local Ollama explicitly
        if host in ("localhost", "127.0.0.1") and u.port == 11434:
            return True, "OK", ""
        # Resolve & enforce strictly global IP (blocks private, loopback, link-local, CGNAT 100.64.0.0/10, multicast, reserved)
        try:
            infos = socket.getaddrinfo(host, u.port or (443 if u.scheme == "https" else 80))
        except socket.gaierror as e:
            return False, "DNS_ERROR", f"目标域名解析失败（可能离线或域名无效）: {e}"
        if not infos:
            return False, "DNS_ERROR", f"无法解析目标地址: {host}"
        for info in infos:
            ip = ipaddress.ip_address(info[4][0])
            if not ip.is_global:
                return False, "SSRF_BLOCKED", f"禁止代理请求内网、CGNAT 或保留地址: {host}"
        return True, "OK", ""
    except Exception as e:
        return False, "BAD_URL", f"目标地址校验失败: {e}"


class _SafeRedirectHandler(_urllib_req.HTTPRedirectHandler):
    """防止通过 HTTP 301/302/307/308 重定向绕过 SSRF 校验"""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        safe, err_code, reason = _is_safe_ai_target_url(newurl)
        if not safe:
            raise ValueError(f"SSRF_REDIRECT_BLOCKED: {reason}")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def _safe_urlopen(req, timeout=45):
    opener = _urllib_req.build_opener(_SafeRedirectHandler())
    return opener.open(req, timeout=timeout)


def fetch_oj_problem(query):
    if not isinstance(query, str) or not query.strip():
        return {"ok": False, "error": "请输入有效的题号或题目链接。", "url": ""}
    q = query.strip()
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

    oj = ""
    url = ""
    submit_url = ""
    if "luogu.com.cn" in q or _re.match(r"^(?:(?:P|B|AT|SP|UVA)\d+|AT_[A-Za-z0-9_]+)$", q, _re.I):
        m = _re.search(r"(?:problem/)?(AT_[A-Za-z0-9_]+|(?:P|B|AT|SP|UVA)\d+[A-Za-z0-9_]*)", q, _re.I)
        if m:
            pid = m.group(1)
            pid = pid[:3].upper() + pid[3:] if pid.upper().startswith("AT_") else pid.upper()
            oj = "Luogu"
            url = f"https://www.luogu.com.cn/problem/{pid}"
            submit_url = url
    elif "codeforces.com" in q or _re.match(r"^(?:CF)?\d+[A-Za-z]\d?$", q, _re.I):
        m = _re.search(r"(?:contest/|problemset/problem/|CF)?(\d+)[/_]?([A-Za-z]\d?)", q, _re.I)
        if m:
            cid, idx = m.group(1), m.group(2).upper()
            oj = "Codeforces"
            url = f"https://codeforces.com/contest/{cid}/problem/{idx}"
            submit_url = f"https://codeforces.com/contest/{cid}/submit"
    elif "atcoder.jp" in q or _re.match(r"^[a-z]+\d+_[a-z0-9]+$", q, _re.I):
        m = _re.search(r"(?:tasks/)?([a-z0-9_]+_[a-z0-9]+)", q, _re.I)
        if m:
            tid = m.group(1).lower()
            contest = tid.rsplit("_", 1)[0]
            oj = "AtCoder"
            url = f"https://atcoder.jp/contests/{contest}/tasks/{tid}"
            submit_url = f"https://atcoder.jp/contests/{contest}/submit?taskScreenName={tid}"

    if not url:
        return {"ok": False, "error": "无法识别题号格式，请使用如 P1001、AT_abc350_d、CF1900D、abc350_d 或直接粘贴完整题目 URL。", "url": q}

    try:
        req = _urllib_req.Request(url, headers=headers)
        with _urllib_req.urlopen(req, timeout=10) as resp:
            page = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        return {"ok": False, "oj": oj, "url": url, "submit_url": submit_url, "error": f"抓取 {oj} 页面失败: {e}"}

    title = url
    time_ms = 1000
    mem_mb = 256
    samples = []

    if oj == "Codeforces":
        tm = _re.search(r'<div class="title">([^<]+)</div>', page)
        if tm:
            title = _html.unescape(tm.group(1)).strip()
        tl = _re.search(r'time limit per test</div>(\d+(?:\.\d+)?)\s*second', page, _re.I)
        if tl:
            time_ms = int(float(tl.group(1)) * 1000)
        ml = _re.search(r'memory limit per test</div>(\d+)\s*megabyte', page, _re.I)
        if ml:
            mem_mb = int(ml.group(1))
        ins = _re.findall(r'<div class="input">\s*<div class="title">[^<]*</div>\s*<pre[^>]*>([\s\S]*?)</pre>', page)
        outs = _re.findall(r'<div class="output">\s*<div class="title">[^<]*</div>\s*<pre[^>]*>([\s\S]*?)</pre>', page)
        for i in range(min(len(ins), len(outs))):
            samples.append({"stdin": _clean_html_pre(ins[i]), "expected": _clean_html_pre(outs[i])})

    elif oj == "AtCoder":
        tm = _re.search(r"<title>([^<]+)</title>", page)
        if tm:
            title = _html.unescape(tm.group(1)).strip()
        tl = _re.search(r"Time Limit:\s*(\d+(?:\.\d+)?)\s*sec", page, _re.I)
        if tl:
            time_ms = int(float(tl.group(1)) * 1000)
        ml = _re.search(r"Memory Limit:\s*(\d+)\s*MB", page, _re.I)
        if ml:
            mem_mb = int(ml.group(1))
        ins = _re.findall(r"<h3>Sample Input\s*\d*</h3>\s*<pre>([\s\S]*?)</pre>", page)
        outs = _re.findall(r"<h3>Sample Output\s*\d*</h3>\s*<pre>([\s\S]*?)</pre>", page)
        for i in range(min(len(ins), len(outs))):
            samples.append({"stdin": _clean_html_pre(ins[i]), "expected": _clean_html_pre(outs[i])})

    elif oj == "Luogu":
        lm = _re.search(r'<script id="lentille-context" type="application/json">([\s\S]*?)</script>', page)
        if lm:
            try:
                j = json.loads(lm.group(1))
                prob = j.get("data", {}).get("problem", {})
                if prob.get("title"):
                    title = f"{prob.get('pid', '')} {prob.get('title', '')}".strip()
                if prob.get("limits", {}).get("time"):
                    time_ms = int(prob["limits"]["time"][0])
                if prob.get("limits", {}).get("memory"):
                    mem_mb = int(prob["limits"]["memory"][0]) // 1024
                for s in prob.get("samples", []):
                    if len(s) >= 2:
                        samples.append({"stdin": s[0].strip() + "\n", "expected": s[1].strip() + "\n"})
            except Exception:
                pass
        if not samples and "安全验证" in page:
            return {"ok": False, "oj": oj, "url": url, "submit_url": submit_url, "error": "洛谷当前触发了人机验证，无法后台直接抓取；可点击上方链接打开原题页复制样例。"}

    return {"ok": True, "oj": oj, "title": title, "url": url, "submit_url": submit_url, "time_limit_ms": time_ms, "mem_limit_mb": mem_mb, "samples": samples}


def _get_win_peak_mb(pid):
    try:
        import ctypes
        from ctypes import wintypes

        class PROCESS_MEMORY_COUNTERS(ctypes.Structure):
            _fields_ = [
                ("cb", wintypes.DWORD),
                ("PageFaultCount", wintypes.DWORD),
                ("PeakWorkingSetSize", ctypes.c_size_t),
                ("WorkingSetSize", ctypes.c_size_t),
                ("QuotaPeakPagedPoolUsage", ctypes.c_size_t),
                ("QuotaPagedPoolUsage", ctypes.c_size_t),
                ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
                ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
                ("PagefileUsage", ctypes.c_size_t),
                ("PeakPagefileUsage", ctypes.c_size_t),
            ]

        kernel32 = ctypes.windll.kernel32
        psapi = ctypes.windll.psapi
        h = kernel32.OpenProcess(0x0400 | 0x0010, False, pid)
        if not h:
            return 0.0
        pmc = PROCESS_MEMORY_COUNTERS()
        pmc.cb = ctypes.sizeof(pmc)
        ok = psapi.GetProcessMemoryInfo(h, ctypes.byref(pmc), pmc.cb)
        kernel32.CloseHandle(h)
        if ok:
            return pmc.PeakWorkingSetSize / (1024 * 1024)
    except Exception:
        pass
    return 0.0


def _read_linux_vmhwm_mb(pid):
    try:
        with open(f"/proc/{pid}/status", "r", encoding="utf-8") as fp:
            for line in fp:
                if line.startswith("VmHWM:"):
                    kb = int(line.split()[1])
                    return kb / 1024.0
    except Exception:
        pass
    return 0.0


def _kill_proc_tree(proc):
    """POSIX 杀死整个进程组，防止 fork 孙进程泄漏或阻塞管道"""
    try:
        if os.name == "posix":
            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        else:
            proc.kill()
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass


def run_with_limits(cmd, stdin_text, time_limit_ms, mem_limit_mb):
    if isinstance(cmd, str):
        cmd = [cmd]
    time_limit_s = max(0.1, min(15.0, time_limit_ms / 1000.0))
    mem_limit_mb = max(16, min(2048, mem_limit_mb))
    mem_bytes = mem_limit_mb * 1024 * 1024

    preexec = None
    popen_kwargs = {}
    if os.name == "posix":
        import resource

        def set_limits():
            try:
                os.setsid()
            except Exception:
                pass
            try:
                resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))
            except Exception:
                pass
            try:
                resource.setrlimit(resource.RLIMIT_FSIZE, (16 * 1024 * 1024, 16 * 1024 * 1024))
            except Exception:
                pass
            try:
                cpu_s = max(2, int(time_limit_s) + 2)
                resource.setrlimit(resource.RLIMIT_CPU, (cpu_s, cpu_s))
            except Exception:
                pass

        preexec = set_limits

    t0 = time.perf_counter()
    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        preexec_fn=preexec,
        **popen_kwargs,
    )

    peak_mb = 0.0
    mle_hit = False
    stop_evt = threading.Event()

    def watch_mem():
        nonlocal peak_mb, mle_hit
        while not stop_evt.is_set() and proc.poll() is None:
            m = _get_win_peak_mb(proc.pid) if os.name == "nt" else _read_linux_vmhwm_mb(proc.pid)
            if m > peak_mb:
                peak_mb = m
            if peak_mb > mem_limit_mb:
                mle_hit = True
                _kill_proc_tree(proc)
                break
            time.sleep(0.01)

    t_mem = threading.Thread(target=watch_mem, daemon=True)
    t_mem.start()

    try:
        stdout, stderr = proc.communicate(input=stdin_text, timeout=time_limit_s)
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
    except subprocess.TimeoutExpired:
        _kill_proc_tree(proc)
        try:
            proc.communicate(timeout=1.0)
        except Exception:
            pass
        stop_evt.set()
        return {
            "ok": False,
            "verdict": "TLE",
            "stage": "run",
            "elapsed_ms": round(time_limit_ms, 1),
            "peak_mb": round(peak_mb, 2),
            "stderr": f"超出时间限制（TLE > {time_limit_ms} ms）",
        }
    finally:
        stop_evt.set()
        t_mem.join(timeout=0.05)

    stdout = _truncate_output(stdout)
    stderr = _truncate_output(stderr)

    if mle_hit or peak_mb > mem_limit_mb or ("std::bad_alloc" in (stderr or "")) or ("MemoryError" in (stderr or "")):
        if peak_mb > mem_limit_mb:
            mle_msg = f"超出内存限制（MLE：峰值 {peak_mb:.1f} MB > {mem_limit_mb} MB）"
        else:
            mle_msg = f"超出内存限制（MLE：虚拟地址空间申请超过 {mem_limit_mb} MB，触发内存分配失败）"
        return {
            "ok": False,
            "verdict": "MLE",
            "stage": "run",
            "elapsed_ms": elapsed_ms,
            "peak_mb": round(peak_mb, 2),
            "stderr": mle_msg,
        }

    if proc.returncode != 0:
        return {
            "ok": False,
            "verdict": "RE",
            "stage": "run",
            "returncode": proc.returncode,
            "elapsed_ms": elapsed_ms,
            "peak_mb": round(peak_mb, 2),
            "stdout": stdout,
            "stderr": f"运行时错误（RE，退出码 {proc.returncode}）\n{stderr}".strip(),
        }

    return {
        "ok": True,
        "verdict": "OK",
        "stdout": stdout,
        "stderr": stderr.strip(),
        "returncode": 0,
        "elapsed_ms": elapsed_ms,
        "peak_mb": round(peak_mb, 2),
    }


class Handler(BaseHTTPRequestHandler):
    def _is_origin_allowed(self, origin):
        if not origin:
            return True
        if origin == "null":
            return False
        try:
            u = urllib.parse.urlparse(origin)
            if u.scheme not in ("http", "https") or not u.hostname:
                return False
            host = u.hostname.lower()
            allowed_hosts = {"127.0.0.1", "localhost", "127.0.0.2", "::1"}
            if _LAN_IP_CACHE:
                allowed_hosts.add(_LAN_IP_CACHE.lower())
            return host in allowed_hosts
        except Exception:
            return False

    def _send_cors(self):
        origin = self.headers.get("Origin", "").strip()
        if origin and self._is_origin_allowed(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-WB-Token, Authorization")

    def _check_origin(self):
        origin = self.headers.get("Origin", "").strip()
        if origin and not self._is_origin_allowed(origin):
            self._reply(403, {"ok": False, "error": f"Forbidden cross-origin request: {origin}"})
            return False
        return True

    def _reply(self, code, payload, head_only=False):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_cors()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def _is_static_path_allowed(self, clean_rel):
        parts = [p for p in clean_rel.replace("\\", "/").split("/") if p]
        if not parts:
            return True
        for part in parts:
            if part.startswith(".") or part in _BLOCKED_STATIC_DIRS:
                return False
        fname = parts[-1].lower()
        if fname in _BLOCKED_STATIC_FILES:
            return False
        _, ext = os.path.splitext(fname)
        if ext in _BLOCKED_STATIC_EXTS:
            return False
        return True

    def _serve_static(self, req_path, head_only=False):
        raw_path = urllib.parse.unquote(urllib.parse.urlparse(req_path).path)
        if "\x00" in raw_path:
            return self._reply(400, {"ok": False, "error": "Invalid path"}, head_only=head_only)
        clean = raw_path.lstrip("/")
        if not clean:
            clean = "index.html"
        if not self._is_static_path_allowed(clean):
            return self._reply(403, {"ok": False, "error": "Forbidden"}, head_only=head_only)
        try:
            target = os.path.realpath(os.path.join(WORKBENCH_ROOT, clean))
        except ValueError:
            return self._reply(400, {"ok": False, "error": "Invalid path"}, head_only=head_only)
        root_real = os.path.realpath(WORKBENCH_ROOT)
        if not (target == root_real or target.startswith(root_real + os.sep)):
            return self._reply(403, {"ok": False, "error": "Forbidden"}, head_only=head_only)
        if not os.path.isfile(target):
            return self._reply(404, {"ok": False, "error": f"Not found: {clean}"}, head_only=head_only)
        ctype, _ = mimetypes.guess_type(target)
        if not ctype:
            ctype = "application/octet-stream"
        if ctype.startswith(("text/", "application/javascript", "application/json")):
            ctype += "; charset=utf-8"

        file_size = os.path.getsize(target)
        range_hdr = self.headers.get("Range", "").strip()
        if range_hdr.startswith("bytes="):
            m = _re.match(r"^bytes=(\d*)-(\d*)$", range_hdr)
            if m:
                start_s, end_s = m.group(1), m.group(2)
                if start_s == "" and end_s != "":
                    length = int(end_s)
                    start = max(0, file_size - length)
                    end = file_size - 1
                else:
                    start = int(start_s) if start_s else 0
                    end = int(end_s) if end_s else file_size - 1
                if start >= file_size or end < start:
                    self.send_response(416)
                    self.send_header("Content-Range", f"bytes */{file_size}")
                    self._send_cors()
                    self.end_headers()
                    return
                end = min(end, file_size - 1)
                chunk_len = end - start + 1
                self.send_response(206)
                self.send_header("Content-Type", ctype)
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
                self.send_header("Content-Length", str(chunk_len))
                self._send_cors()
                self.end_headers()
                if not head_only:
                    with open(target, "rb") as fp:
                        fp.seek(start)
                        self.wfile.write(fp.read(chunk_len))
                return

        st = os.stat(target)
        etag = f'W/"{st.st_mtime_ns:x}-{file_size:x}"'
        is_html = target.lower().endswith((".html", ".htm")) or os.path.basename(target).lower() == "sw.js"
        cache_ctrl = "no-cache" if is_html else "public, max-age=3600"
        if self.headers.get("If-None-Match", "").strip() == etag:
            self.send_response(304)
            self.send_header("ETag", etag)
            self.send_header("Cache-Control", cache_ctrl)
            self._send_cors()
            self.end_headers()
            return

        ae = self.headers.get("Accept-Encoding", "")
        compressible = (
            "gzip" in ae.lower()
            and file_size >= 1024
            and ctype.startswith(("text/", "application/javascript", "application/json", "image/svg+xml"))
        )
        if compressible:
            cache_key = (target, st.st_mtime_ns, file_size)
            with _GZIP_LOCK:
                gz_bytes = _GZIP_CACHE.get(cache_key)
            if gz_bytes is None:
                with open(target, "rb") as fp:
                    gz_bytes = gzip.compress(fp.read(), compresslevel=6)
                with _GZIP_LOCK:
                    if len(_GZIP_CACHE) >= _GZIP_CACHE_MAX:
                        _GZIP_CACHE.pop(next(iter(_GZIP_CACHE)))
                    _GZIP_CACHE[cache_key] = gz_bytes
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")
            self.send_header("ETag", etag)
            self.send_header("Cache-Control", cache_ctrl)
            self._send_cors()
            self.send_header("Content-Length", str(len(gz_bytes)))
            self.end_headers()
            if not head_only:
                self.wfile.write(gz_bytes)
            return

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("ETag", etag)
        self.send_header("Cache-Control", cache_ctrl)
        self._send_cors()
        self.send_header("Content-Length", str(file_size))
        self.end_headers()
        if not head_only:
            with open(target, "rb") as fp:
                self.wfile.write(fp.read())

    def do_OPTIONS(self):
        origin = self.headers.get("Origin", "").strip()
        if origin and not self._is_origin_allowed(origin):
            self.send_response(403)
            self.end_headers()
            return
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_HEAD(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path == "/health":
                comp = _detect_cpp_compiler()
                return self._reply(200, {"ok": True, "compiler": f"{comp} -O2 -std=c++20" if comp else "static-only (no g++/clang++)"}, head_only=True)
            return self._serve_static(self.path, head_only=True)
        except Exception as e:
            return self._reply(500, {"ok": False, "error": f"Internal error: {e}"}, head_only=True)

    def do_GET(self):
        try:
            self._handle_get()
        except Exception as e:
            self._reply(500, {"ok": False, "error": f"Internal error: {e}"})

    def _handle_get(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        if AUTH_TOKEN and "token" in qs:
            q_tok = (qs["token"][0] or "").strip()
            if q_tok == AUTH_TOKEN:
                clean_path = parsed.path or "/"
                self.send_response(302)
                self.send_header("Set-Cookie", f"wb_auth_token={AUTH_TOKEN}; Path=/; HttpOnly; SameSite=Lax")
                self.send_header("Location", clean_path)
                self.end_headers()
                return
            return self._reply(401, {"ok": False, "error": "无效的访问令牌"})

        if parsed.path == "/mobile_connect":
            client_ip = (self.client_address[0] if self.client_address else "").strip()
            if client_ip not in ("127.0.0.1", "::1", "::ffff:127.0.0.1"):
                return self._reply(403, {"ok": False, "error": "仅允许电脑本机访问 /mobile_connect"})
            target_url = ACTIVE_MOBILE_URL or ACTIVE_LOCAL_URL or f"http://127.0.0.1:{PORT}/"
            qr_html = ""
            try:
                import qrcode, io
                qr = qrcode.QRCode(border=2, box_size=6)
                qr.add_data(target_url)
                qr.make(fit=True)
                m = qr.get_matrix()
                n = len(m)
                rects = "".join(f'<rect x="{c}" y="{r}" width="1" height="1"/>' for r in range(n) for c in range(n) if m[r][c])
                qr_html = f'<svg viewBox="0 0 {n} {n}" width="220" height="220" fill="#0f172a" style="background:#fff;padding:12px;border-radius:14px;border:1px solid #e2e8f0">{rects}</svg>'
            except Exception:
                qr_html = '<div style="padding:18px;border-radius:12px;background:#f1f5f9;color:#475569;font-size:13px;">提示：手机在同一 Wi-Fi 下直接打开下方链接即可免输令牌自动授权（安装 <code>pip install qrcode</code> 可显示本机扫码二维码）。</div>'
            safe_u = target_url.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
            html_page = f'''<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>手机局域网直连 · 学习工作台</title>
<style>body{{margin:0;min-height:100dvh;display:grid;place-items:center;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;color:#0f172a;padding:24px}}
.box{{max-width:460px;width:100%;background:#fff;border-radius:20px;padding:28px;box-shadow:0 16px 40px -16px rgba(15,23,42,.18);text-align:center}}
h1{{margin:0 0 8px;font-size:20px}}p{{margin:0 0 18px;font-size:13.5px;color:#475569;line-height:1.6}}
.url{{word-break:break-all;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font-family:ui-monospace,monospace;font-size:13px;margin:16px 0}}
button,a.btn{{display:inline-block;border:none;border-radius:999px;padding:10px 18px;font-size:13.5px;font-weight:600;cursor:pointer;text-decoration:none;margin:4px}}
.pri{{background:#2563eb;color:#fff}}.sec{{background:#e2e8f0;color:#0f172a}}</style></head>
<body><div class="box"><h1>手机局域网直连工作台</h1><p>确保手机与电脑连接同一 Wi-Fi，扫码或复制下方链接在手机浏览器打开即可自动完成安全授权。</p>
{qr_html}<div class="url" id="u">{safe_u}</div>
<button class="pri" onclick="navigator.clipboard.writeText(document.getElementById('u').textContent);this.textContent='✓ 已复制链接'">复制手机直连网址</button>
<a class="btn sec" href="/">返回工作台门户</a></div></body></html>'''
            body = html_page.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if parsed.path == "/sync_state":
            if not self._check_origin():
                return
            if not self._check_auth():
                return
            with _SYNC_LOCK:
                if os.path.isfile(SYNC_STATE_FILE):
                    try:
                        with open(SYNC_STATE_FILE, "r", encoding="utf-8") as fp:
                            payload = json.load(fp)
                    except Exception:
                        payload = {"updatedAt": 0, "data": {}}
                else:
                    payload = {"updatedAt": 0, "data": {}}
            return self._reply(200, {"ok": True, "updatedAt": payload.get("updatedAt", 0), "data": payload.get("data", {})})

        if parsed.path == "/ai_news":
            if not self._check_auth():
                return
            import xml.etree.ElementTree as ET
            items = []
            seen_keys = set()

            def _norm_key(title, url):
                m_arxiv = _re.search(r"(?:arxiv\.org/abs/|huggingface\.co/papers/)([0-9]{4}\.[0-9]{4,5})", url or "")
                if m_arxiv:
                    return "arxiv:" + m_arxiv.group(1)
                norm_t = _re.sub(r"\s+", " ", (title or "").strip().lower())
                return "title:" + norm_t if norm_t else "url:" + (url or "").strip().lower()

            def _add_item(item_dict):
                title = (item_dict.get("title") or "").strip()
                url = (item_dict.get("url") or "").strip()
                if not title or not url:
                    return
                key = _norm_key(title, url)
                if key in seen_keys:
                    return
                seen_keys.add(key)
                items.append(item_dict)

            try:
                req = _urllib_req.Request("https://huggingface.co/api/daily_papers?limit=12", headers={"User-Agent": "Mozilla/5.0"})
                with _urllib_req.urlopen(req, timeout=6) as r:
                    papers = json.loads(r.read().decode("utf-8"))
                    for it in papers[:10]:
                        pobj = it.get("paper", {})
                        _add_item({
                            "source": "HuggingFace Daily Papers",
                            "region": "海外",
                            "title": pobj.get("title", it.get("title", "")),
                            "url": "https://huggingface.co/papers/" + str(pobj.get("id", "")),
                            "summary": ((pobj.get("summary", "") or "").strip())[:180] + "...",
                            "date": (it.get("publishedAt", "") or "")[:10]
                        })
            except Exception:
                pass

            arxiv_feeds = [
                ("arXiv cs.AI", "https://export.arxiv.org/rss/cs.AI", "海外"),
                ("arXiv cs.LG", "https://export.arxiv.org/rss/cs.LG", "海外"),
                ("arXiv cs.CL", "https://export.arxiv.org/rss/cs.CL", "海外"),
            ]
            for src_name, feed_url, region in arxiv_feeds:
                try:
                    req = _urllib_req.Request(feed_url, headers={"User-Agent": "Mozilla/5.0"})
                    with _urllib_req.urlopen(req, timeout=6) as r:
                        root = ET.fromstring(r.read())
                        for item in root.findall(".//item")[:8]:
                            raw_desc = item.findtext("description") or ""
                            clean_desc = _re.sub(r"<[^>]+>", "", _html.unescape(raw_desc)).strip()
                            pub_date = (item.findtext("pubDate") or "").strip()
                            _add_item({
                                "source": src_name,
                                "region": region,
                                "title": (item.findtext("title") or "").strip(),
                                "url": (item.findtext("link") or "").strip(),
                                "summary": clean_desc[:180] + ("..." if len(clean_desc) > 180 else ""),
                                "date": pub_date[:16] if pub_date else "Latest"
                            })
                except Exception:
                    pass
            return self._reply(200, {"ok": True, "items": items})

        if parsed.path == "/health":
            comp = _detect_cpp_compiler()
            return self._reply(200, {"ok": True, "compiler": f"{comp} -O2 -std=c++20" if comp else "static-only (no g++/clang++)"})

        return self._serve_static(self.path)

    def _read_json_body(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return None, "Invalid Content-Length"
        if length < 0 or length > 10 * 1024 * 1024:
            return None, "Payload too large"
        raw = self.rfile.read(length)
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except Exception as e:
            return None, f"Invalid JSON: {e}"
        if not isinstance(parsed, dict):
            return None, "JSON body must be an object"
        return parsed, None

    def _extract_cookie_token(self):
        raw_cookie = self.headers.get("Cookie", "")
        for part in raw_cookie.split(";"):
            part = part.strip()
            if part.startswith("wb_auth_token="):
                return part.split("=", 1)[1].strip()
        return ""

    def _check_auth(self):
        if not AUTH_TOKEN:
            return True
        tok = self.headers.get("X-WB-Token", "").strip()
        if not tok:
            auth = self.headers.get("Authorization", "").strip()
            if auth.lower().startswith("bearer "):
                tok = auth[7:].strip()
        if not tok:
            tok = self._extract_cookie_token()
        if tok != AUTH_TOKEN:
            self._reply(401, {"ok": False, "error": "Unauthorized: 请使用启动终端打印的手机直连网址打开工作台以自动授权"})
            return False
        return True

    def do_POST(self):
        try:
            self._handle_post()
        except Exception as e:
            self._reply(500, {"ok": False, "error": f"Internal error: {e}"})

    def _handle_post(self):
        parsed = urllib.parse.urlparse(self.path)
        route = parsed.path

        if route in ("/run", "/stress", "/ai_chat", "/fetch_oj", "/sync_state"):
            if not self._check_origin():
                return
            if not self._check_auth():
                return
        if route in ("/run", "/stress"):
            client_ip = (self.client_address[0] if self.client_address else "").strip()
            is_loopback = client_ip in ("127.0.0.1", "::1", "::ffff:127.0.0.1")
            if not is_loopback and not ALLOW_LAN_EXEC:
                return self._reply(403, {
                    "ok": False,
                    "error": "安全策略：局域网设备默认禁止执行本机代码，如需允许请加 --allow-lan-exec 重启服务"
                })

        if route == "/sync_state":
            data, err = self._read_json_body()
            if err:
                return self._reply(400, {"ok": False, "error": err})
            incoming = data.get("data")
            if not isinstance(incoming, dict):
                return self._reply(400, {"ok": False, "error": "data 必须为 JSON 对象"})
            cleaned = {}
            for k, v in incoming.items():
                if not isinstance(k, str) or not isinstance(v, str):
                    continue
                if _re.search(r"ai_cfg|ai_feed_cfg", k, _re.I):
                    try:
                        obj = json.loads(v)
                        if isinstance(obj, dict) and "apiKey" in obj:
                            obj["apiKey"] = ""
                            v = json.dumps(obj, ensure_ascii=False)
                    except Exception:
                        pass
                cleaned[k] = v
            now_ms = int(time.time() * 1000)
            with _SYNC_LOCK:
                existing = {}
                if os.path.isfile(SYNC_STATE_FILE):
                    try:
                        with open(SYNC_STATE_FILE, "r", encoding="utf-8") as fp:
                            existing = json.load(fp).get("data", {})
                        if not isinstance(existing, dict):
                            existing = {}
                    except Exception:
                        existing = {}
                merged = dict(existing)
                merged.update(cleaned)
                tmp_path = SYNC_STATE_FILE + ".tmp"
                with open(tmp_path, "w", encoding="utf-8") as fp:
                    json.dump({"updatedAt": now_ms, "data": merged}, fp, ensure_ascii=False)
                os.replace(tmp_path, SYNC_STATE_FILE)
            return self._reply(200, {"ok": True, "count": len(merged), "updatedAt": now_ms})

        if route == "/ai_chat":
            data, err = self._read_json_body()
            if err:
                return self._reply(400, {"ok": False, "error": err})
            target_url = data.get("url", "")
            if not target_url and data.get("base_url"):
                target_url = str(data.get("base_url")).rstrip("/") + "/chat/completions"
                _h = {"Content-Type": "application/json"}
                if data.get("api_key"):
                    _h["Authorization"] = "Bearer " + str(data.get("api_key"))
                data["headers"] = _h
                data["body"] = {"model": data.get("model", "deepseek-chat"), "messages": data.get("messages", []), "temperature": 0.35}
            safe, err_code, reason = _is_safe_ai_target_url(target_url)
            if not safe:
                if err_code == "DNS_ERROR":
                    return self._reply(200, {"ok": False, "error": reason})
                return self._reply(403, {"ok": False, "error": reason})
            try:
                headers = data.get("headers", {})
                if not isinstance(headers, dict):
                    return self._reply(400, {"ok": False, "error": "headers 必须为 JSON 对象"})
                body = json.dumps(data.get("body", {})).encode("utf-8")
                req = _urllib_req.Request(target_url, data=body, headers=headers, method="POST")
                with _safe_urlopen(req, timeout=45) as resp:
                    resp_raw = resp.read().decode("utf-8", errors="ignore")
                self._reply(200, {"ok": True, "data": json.loads(resp_raw)})
            except ValueError as e:
                if "SSRF_REDIRECT_BLOCKED" in str(e):
                    return self._reply(403, {"ok": False, "error": str(e)})
                self._reply(200, {"ok": False, "error": str(e)})
            except Exception as e:
                self._reply(200, {"ok": False, "error": str(e)})
            return

        if route == "/fetch_oj":
            data, err = self._read_json_body()
            if err:
                return self._reply(400, {"ok": False, "error": err})
            query = data.get("query", "")
            if not isinstance(query, str):
                return self._reply(400, {"ok": False, "error": "query 必须为字符串"})
            self._reply(200, fetch_oj_problem(query))
            return

        if route == "/stress":
            data, err = self._read_json_body()
            if err:
                return self._reply(400, {"ok": False, "error": err})

            sol_code = data.get("sol", "")
            bf_code = data.get("bf", "")
            gen_code = data.get("gen", "")
            if not all(isinstance(x, str) for x in (sol_code, bf_code, gen_code)):
                return self._reply(400, {"ok": False, "error": "gen/bf/sol 必须为字符串"})
            try:
                rounds = max(1, min(100, int(data.get("rounds", 20) or 20)))
            except (ValueError, TypeError):
                return self._reply(400, {"ok": False, "error": "rounds 必须为整数"})

            with _make_exec_tempdir() as tmp:
                bins = {}
                comp_exe = _detect_cpp_compiler() or "g++"
                for name, code in [("gen", gen_code), ("bf", bf_code), ("sol", sol_code)]:
                    src = os.path.join(tmp, f"{name}.cpp")
                    exe = os.path.join(tmp, f"{name}.exe" if os.name == "nt" else name)
                    with open(src, "w", encoding="utf-8") as fp:
                        fp.write(code)
                    try:
                        c = subprocess.run([comp_exe, "-O2", "-std=c++20", src, "-o", exe], capture_output=True, text=True, timeout=12)
                    except Exception as e:
                        self._reply(200, {"ok": False, "verdict": "CE", "stderr": f"{name}.cpp 编译异常: {e}"})
                        return
                    if c.returncode != 0:
                        self._reply(200, {"ok": False, "verdict": "CE", "stderr": f"{name}.cpp 编译错误:\n{c.stderr}"})
                        return
                    bins[name] = exe

                norm = lambda x: "\n".join(line.rstrip() for line in (x or "").replace("\r\n", "\n").split("\n")).strip()
                for r in range(1, rounds + 1):
                    g = run_with_limits(bins["gen"], "", 3000, 256)
                    if not g.get("ok"):
                        self._reply(200, {"ok": False, "verdict": f"GEN_{g.get('verdict', 'RE')}", "round": r, "rounds": rounds, "stderr": g.get("stderr", "")})
                        return
                    inp = g.get("stdout", "")

                    b = run_with_limits(bins["bf"], inp, 3000, 256)
                    if not b.get("ok"):
                        self._reply(200, {"ok": False, "verdict": f"BF_{b.get('verdict', 'RE')}", "round": r, "rounds": rounds, "hack_input": inp, "stderr": b.get("stderr", "")})
                        return

                    s = run_with_limits(bins["sol"], inp, 3000, 256)
                    if not s.get("ok"):
                        self._reply(200, {
                            "ok": False, "verdict": s.get("verdict", "RE"),
                            "round": r, "rounds": rounds,
                            "hack_input": inp, "bf_out": b.get("stdout", ""), "sol_out": s.get("stdout", ""),
                            "stderr": s.get("stderr", "")
                        })
                        return

                    if norm(s.get("stdout", "")) != norm(b.get("stdout", "")):
                        self._reply(200, {
                            "ok": False, "verdict": "WA",
                            "round": r, "rounds": rounds,
                            "hack_input": inp, "bf_out": b.get("stdout", ""), "sol_out": s.get("stdout", "")
                        })
                        return

                self._reply(200, {"ok": True, "verdict": "AC", "rounds": rounds})
            return

        if route != "/run":
            self._reply(404, {"ok": False, "error": "Not found"})
            return

        data, err = self._read_json_body()
        if err:
            return self._reply(400, {"ok": False, "error": err})

        code = data.get("code", "")
        stdin_text = data.get("stdin", "")
        lang = str(data.get("lang", "cpp") or "cpp").strip().lower()
        if not isinstance(code, str) or not isinstance(stdin_text, str):
            return self._reply(400, {"ok": False, "error": "code 与 stdin 必须为字符串"})
        try:
            time_limit_ms = int(data.get("time_limit_ms", 1000) or 1000)
            mem_limit_mb = int(data.get("mem_limit_mb", 256) or 256)
        except (ValueError, TypeError):
            return self._reply(400, {"ok": False, "error": "time_limit_ms 与 mem_limit_mb 必须为整数"})

        with _make_exec_tempdir() as tmp:
            if lang in ("python", "py", "python3"):
                src = os.path.join(tmp, "main.py")
                with open(src, "w", encoding="utf-8") as fp:
                    fp.write(code)
                res = run_with_limits([sys.executable, src], stdin_text, time_limit_ms, mem_limit_mb)
                self._reply(200, res)
                return

            if lang not in ("cpp", "c++", "c++17", "c++20"):
                return self._reply(400, {"ok": False, "error": f"不支持的语言: {lang}（支持 cpp / c++20 / c++17 / python）"})

            std_flag = "-std=c++17" if lang == "c++17" else "-std=c++20"
            src = os.path.join(tmp, "main.cpp")
            exe = os.path.join(tmp, "main.exe" if os.name == "nt" else "main")
            with open(src, "w", encoding="utf-8") as fp:
                fp.write(code)
            try:
                comp = subprocess.run(
                    [_detect_cpp_compiler() or "g++", "-O2", std_flag, "-Wall", src, "-o", exe],
                    capture_output=True, text=True, timeout=12
                )
            except FileNotFoundError:
                self._reply(200, {"ok": False, "verdict": "CE", "stage": "compile", "stderr": "未检测到本机 g++，请先安装 MinGW / GCC 或切换为云端沙盒运行。"})
                return
            except subprocess.TimeoutExpired:
                self._reply(200, {"ok": False, "verdict": "CE", "stage": "compile", "stderr": "编译超时（>12s）。"})
                return

            if comp.returncode != 0:
                self._reply(200, {"ok": False, "verdict": "CE", "stage": "compile", "stderr": comp.stderr or "编译失败"})
                return

            res = run_with_limits(exe, stdin_text, time_limit_ms, mem_limit_mb)
            if comp.stderr and res.get("ok"):
                res["stderr"] = _truncate_output((comp.stderr + "\n" + res.get("stderr", "")).strip())
            self._reply(200, res)

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    import argparse
    import webbrowser
    parser = argparse.ArgumentParser(description="十四合一工作台本地一体化服务器 (电脑+手机局域网直连 + C++20/Python 判题 + 在线对拍 + OJ 抓取)")
    parser.add_argument("--lan", action="store_true", help="一键开启手机局域网模式（自动监听 0.0.0.0、探测局域网 IP 并生成免手填 Token 直连网址）")
    parser.add_argument("--host", default=HOST, help="监听地址 (默认 127.0.0.1；加 --lan 自动切 0.0.0.0)")
    parser.add_argument("--port", type=int, default=PORT, help=f"监听端口 (默认 {PORT})")
    parser.add_argument("--token", default="", help="自定义访问令牌（留空时，局域网模式自动生成一次性随机令牌）")
    parser.add_argument("--allow-lan-exec", action="store_true", help="显式允许局域网设备调用 /run 与 /stress（仅建议在可信私密网络开启）")
    parser.add_argument("--open", action="store_true", help="启动后自动在电脑默认浏览器打开工作台")
    args = parser.parse_args()

    ALLOW_LAN_EXEC = bool(args.allow_lan_exec)
    listen_host = "0.0.0.0" if args.lan else args.host
    if args.token:
        AUTH_TOKEN = args.token
    elif listen_host not in ("127.0.0.1", "127.0.0.2", "localhost", "::1"):
        AUTH_TOKEN = secrets.token_hex(8)

    try:
        server = ThreadingHTTPServer((listen_host, args.port), Handler)
    except OSError as e:
        print(f"错误：端口 {args.port} 启动失败（可能已被占用）: {e}")
        print(f"提示：可换用其他端口，例如 python3 local_cpp_runner.py --port {args.port + 1}")
        sys.exit(1)

    local_url = f"http://127.0.0.1:{args.port}/" + (f"?token={AUTH_TOKEN}" if AUTH_TOKEN else "")
    ACTIVE_LOCAL_URL = local_url
    print("=" * 64)
    print("  十四合一学习工作台已启动（电脑 + 手机全科通用）")
    print(f"  电脑本机打开 : {local_url}")
    if listen_host not in ("127.0.0.1", "127.0.0.2", "localhost", "::1"):
        lan_ip = _LAN_IP_CACHE
        mobile_url = f"http://{lan_ip}:{args.port}/" + (f"?token={AUTH_TOKEN}" if AUTH_TOKEN else "")
        ACTIVE_MOBILE_URL = mobile_url
        print(f"  手机同一Wi-Fi: {mobile_url}")
        print(f"  手机扫码直连 : http://127.0.0.1:{args.port}/mobile_connect")
        print("  提示：手机浏览器打开上方链接即可自动完成授权，全程免输令牌；")
        print("        若手机打不开，请检查电脑防火墙是否放行端口", args.port)
    else:
        print("  提示：如需手机在同一 Wi-Fi 下访问，请加 --lan 参数启动")
        print("        例如：python3 local_cpp_runner.py --lan")
    print("=" * 64)
    if args.open:
        threading.Timer(0.6, lambda: webbrowser.open(local_url)).start()
    server.serve_forever()
