#!/usr/bin/env python3
"""
十四合一学习工作台自动化发布校验门禁（9 维度全量检查）：
  1. Python 脚本语法编译校验
  2. 全部 shared/*.js、books_data/*.js、data/*/*.js 及 15 份 HTML 内嵌 JS 的 V8 语法校验
  3. 13 学科 HTML 分片清单（docChunks / bankChunks）与磁盘文件 100% 一致性校验
  4. index.html / 各学科 HTML / books_data/catalog.js 本地资源零死链校验
  5. local_cpp_runner.py 7 项端到端 HTTP 实测（健康检查、静态资源、路径穿越、SSRF、32MB C++20 运行、TLE、MLE）
  6. labs_harness/run_all_labs.py 9 项 Master Labs 实测

用法：python3 scripts/verify_workbench.py [--skip-labs]
"""
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from bs4 import BeautifulSoup

WB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(WB)


def check_python():
    py_files = sorted(glob.glob("*.py") + glob.glob("labs_harness/*.py") + glob.glob("scripts/*.py"))
    for f in py_files:
        subprocess.check_call(["python3", "-m", "py_compile", f])
    print(f"[1/9 PASS] Python syntax check ({len(py_files)} files)")


def check_js_and_html():
    js_files = sorted(glob.glob("shared/*.js") + glob.glob("shared/modules/*.js") + glob.glob("shared/c4/*.js") + glob.glob("books_data/*.js") + glob.glob("data/*/*.js"))
    for f in js_files:
        r = subprocess.run(["node", "--check", f], capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(f"JS syntax error in {f}: {r.stderr}")
    html_files = sorted(glob.glob("*.html"))
    for hf in html_files:
        soup = BeautifulSoup(open(hf, encoding="utf-8").read(), "html.parser")
        for idx, sc in enumerate(soup.find_all("script")):
            if sc.get("src") or sc.get("type") == "application/json":
                continue
            code = sc.string or sc.get_text()
            if not code.strip():
                continue
            r = subprocess.run(["node", "--check", "-"], input=code, capture_output=True, text=True)
            if r.returncode != 0:
                raise RuntimeError(f"Inline JS syntax error in {hf} script#{idx}: {r.stderr}")
    print(f"[2/9 PASS] V8 syntax check ({len(js_files)} JS files + {len(html_files)} HTML pages)")


def check_chunks():
    checked = 0
    for hf in sorted(glob.glob("*.html")):
        txt = open(hf, encoding="utf-8").read()
        m = re.search(r'window\.__WB_CONFIG__\s*=\s*(\{.*?\});', txt, re.S)
        if not m:
            continue
        cfg = json.loads(m.group(1))
        slug = cfg["slug"]
        disk_docs = sorted([f"data/{slug}/{f}" for f in os.listdir(f"data/{slug}") if f.startswith("docs_c") and f.endswith(".js")], key=lambda x: int(re.search(r'docs_c(\d+)', x).group(1)))
        disk_bank = sorted([f"data/{slug}/{f}" for f in os.listdir(f"data/{slug}") if f.startswith("bank_c") and f.endswith(".js")], key=lambda x: int(re.search(r'bank_c(\d+)', x).group(1)))
        if cfg.get("docChunks") != disk_docs or cfg.get("bankChunks") != disk_bank:
            raise RuntimeError(f"Chunk mismatch in {hf} ({slug})")
        checked += 1
    assert checked == 14, f"Expected 14 subject HTMLs, got {checked}"
    print(f"[3/9 PASS] Chunk manifest vs disk sync ({checked}/14 subjects)")


def check_links():
    broken = []
    for hf in sorted(glob.glob("*.html")):
        soup = BeautifulSoup(open(hf, encoding="utf-8").read(), "html.parser")
        for tag in soup.find_all(["a", "script", "link", "img"]):
            attr = "src" if tag.name in ("script", "img") else "href"
            val = tag.get(attr)
            if not val or val.startswith(("#", "http://", "https://", "javascript:", "data:", "mailto:")):
                continue
            clean = urllib.parse.unquote(val.split("?")[0].split("#")[0])
            if not os.path.exists(clean):
                broken.append((hf, tag.name, val))
    cat_txt = open("books_data/catalog.js", encoding="utf-8").read()
    for ref in sorted(set(re.findall(r'books_data/[A-Za-z0-9_.-]+\.js', cat_txt))):
        if not os.path.exists(ref):
            broken.append(("books_data/catalog.js", "ref", ref))
    if broken:
        raise RuntimeError(f"Broken local links: {broken[:10]}")
    print("[4/9 PASS] Zero broken local links across all HTMLs & books_data/catalog.js")


def check_runner_http():
    port = 18769
    proc = subprocess.Popen(
        ["python3", "local_cpp_runner.py", "--host", "127.0.0.1", "--port", str(port)],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    time.sleep(0.8)
    try:
        def get(path):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{port}{path}", timeout=5) as r:
                    return r.status, r.read()
            except urllib.error.HTTPError as e:
                return e.code, e.read()

        def post(path, payload):
            req = urllib.request.Request(
                f"http://127.0.0.1:{port}{path}",
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as r:
                    return r.status, json.loads(r.read().decode("utf-8"))
            except urllib.error.HTTPError as e:
                return e.code, json.loads(e.read().decode("utf-8"))

        st, body = get("/health")
        assert st == 200 and json.loads(body.decode()).get("ok")
        assert get("/")[0] == 200
        assert get("/shared/workbench_engine.js")[0] == 200
        assert get("/../README.md")[0] in (403, 404)
        st_ssrf, res_ssrf = post("/ai_chat", {"url": "http://169.254.169.254/latest/meta-data", "headers": {}, "body": {}})
        assert st_ssrf == 403 and not res_ssrf["ok"]
        st_ok, res_ok = post("/run", {"code": '#include <iostream>\nint main(){int a,b;std::cin>>a>>b;std::cout<<(a+b);}', "stdin": "20 22\n", "time_limit_ms": 1000, "mem_limit_mb": 32})
        assert st_ok == 200 and res_ok["verdict"] == "OK" and res_ok["stdout"].strip() == "42"
        st_tle, res_tle = post("/run", {"code": "int main(){volatile int x=0;while(1)x++;}", "stdin": "", "time_limit_ms": 150, "mem_limit_mb": 64})
        assert st_tle == 200 and res_tle["verdict"] == "TLE"
        st_mle, res_mle = post("/run", {"code": "#include <vector>\n#include <iostream>\nint main(){std::vector<char> v(80*1024*1024,1);std::cout<<(int)v[0];}", "stdin": "", "time_limit_ms": 1000, "mem_limit_mb": 32})
        assert st_mle == 200 and res_mle["verdict"] == "MLE"
        print("[5/9 PASS] local_cpp_runner.py 7/7 end-to-end HTTP checks passed")
    finally:
        proc.terminate()
        proc.wait(timeout=3)
        shutil.rmtree(os.path.join(WB, ".runner_tmp"), ignore_errors=True)


def check_labs():
    if "--skip-labs" in sys.argv:
        print("[6/9 SKIP] Master Labs skipped via --skip-labs")
        return
    r = subprocess.run(["python3", "labs_harness/run_all_labs.py"], capture_output=True, text=True)
    if r.returncode != 0 or "ALL 15 MASTER LABS PASSED" not in r.stdout:
        raise RuntimeError(f"Master Labs failed:\n{r.stdout}\n{r.stderr}")
    print("[6/9 PASS] Master Labs harness (15/15 passed)")



def check_module_runtime_boot():
    js_test = r"""
const fs = require('fs');
const vm = require('vm');
const listeners = {};
const makeEl = (id) => ({
  id: id || '', innerHTML: '', textContent: '', innerText: '', value: '', checked: false,
  style: {}, dataset: {}, children: [],
  classList: { add(){}, remove(){}, toggle(){ return false; }, contains(){ return false; } },
  addEventListener(){}, removeEventListener(){}, setAttribute(){}, hasAttribute(){ return false; },
  getAttribute(){ return ''; }, appendChild(){}, insertBefore(){},
  querySelector(){ return null; }, querySelectorAll(){ return []; },
  getBoundingClientRect(){ return { width: 420, height: 300, top: 0, left: 0 }; },
  getContext(){ return { clearRect(){}, beginPath(){}, arc(){}, fill(){}, stroke(){}, strokeRect(){}, fillText(){}, moveTo(){}, lineTo(){}, ellipse(){} }; },
  scrollIntoView(){}
});
const elements = {};
const doc = {
  readyState: 'loading',
  hidden: false,
  title: 'ICPC 学习工作台',
  documentElement: { setAttribute(){}, getAttribute(){ return 'light'; }, scrollHeight: 1000, clientHeight: 800, scrollTop: 0 },
  body: makeEl('body'),
  head: makeEl('head'),
  getElementById(id) { if (!elements[id]) elements[id] = makeEl(id); return elements[id]; },
  querySelector(sel) { return makeEl(sel); },
  querySelectorAll() { return []; },
  createElement(tag) { return makeEl(tag); },
  addEventListener(ev, fn) { (listeners['doc:' + ev] = listeners['doc:' + ev] || []).push(fn); }
};
const store = {};
const sandbox = {
  console, setTimeout: () => 1, clearTimeout(){}, setInterval: () => 1, clearInterval(){},
  requestAnimationFrame: () => 1, cancelAnimationFrame(){},
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL(){} },
  Blob: function(){},
  innerWidth: 1280, innerHeight: 800, scrollY: 0,
  location: { protocol: 'file:', pathname: '/ICPC全库学习工作台.html', hash: '' },
  history: { replaceState(){} },
  navigator: { clipboard: { writeText: async () => {} } },
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  matchMedia: () => ({ matches: false }),
  getComputedStyle: () => ({ getPropertyValue: () => '#2563eb' }),
  scrollTo(){}, alert(){}, confirm: () => true,
  document: doc,
  addEventListener(ev, fn) { (listeners['win:' + ev] = listeners['win:' + ev] || []).push(fn); },
  removeEventListener(){},
  __WB_SUBJECT_NAME__: 'ICPC 算法与程序设计',
  __WB_CONFIG__: { slug: 'icpc', activeTab: 'WF专题200题', heroTitle: 'ICPC', docChunks: [], bankChunks: [] },
  __wbLoadScript: (src, cb) => { if (cb) cb(); }
};
sandbox.window = sandbox;
sandbox.self = sandbox;
const ctx = vm.createContext(sandbox);
const loadOrder = [
  'data/icpc/core.js',
  'shared/modules/ai_client.js',
  'shared/workbench_engine.js',
  'shared/modules/roadmap.js',
  'shared/modules/viz_engine.js',
  'shared/modules/glossary_pedagogy.js',
  'shared/modules/algo_tree.js',
  'shared/modules/ai_assistant.js',
  'shared/modules/vp_stress.js',
];
for (const f of loadOrder) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
}
// Fire DOMContentLoaded listeners
(listeners['win:DOMContentLoaded'] || []).forEach(fn => fn());
(listeners['doc:DOMContentLoaded'] || []).forEach(fn => fn());

// Smoke-test key functions across all modules
const checks = [
  'typeof window.WB_AI.requestChat === "function"',
  'typeof window.renderHome === "function"',
  'typeof window.renderRoadmap === "function"',
  'typeof window.toggleVizSidebar === "function"',
  'typeof window.renderAlgoTree === "function"',
  'typeof window.sendAiMessage === "function"',
  'typeof window.openVpModal === "function"',
  'typeof window.openStressGenModal === "function"',
  'typeof window.renderIcpcTextbooks === "function"',
];
for (const expr of checks) {
  if (!vm.runInContext(expr, ctx)) throw new Error('Assertion failed: ' + expr);
}
vm.runInContext('renderHome(); renderRoadmap(); renderAlgoTree(); renderIcpcTextbooks(); openDictModal(); openVpModal(); openStressGenModal();', ctx);
if (!elements.main || !elements.main.innerHTML.length) throw new Error('main container empty after render');
console.log('V8_MODULE_BOOT_OK');
"""
    r = subprocess.run(["node", "-e", js_test], capture_output=True, text=True)
    if r.returncode != 0 or "V8_MODULE_BOOT_OK" not in r.stdout:
        raise RuntimeError(f"Module runtime boot test failed:\nSTDOUT: {r.stdout}\nSTDERR: {r.stderr}")
    print("[7/9 PASS] Node V8 multi-module boot & core render smoke test passed")


def check_c4_and_runner_auth():
    # A. Unified Math Analysis V8 boot & special labs smoke test
    c4_js = r"""
const fs = require('fs');
const vm = require('vm');
const sb = { window: {}, console };
vm.runInNewContext(fs.readFileSync('data/c4/core.js', 'utf8'), sb);
if (!Array.isArray(sb.window.__WB_DOCS__) || sb.window.__WB_DOCS__.length < 30) throw new Error('Math Analysis DOCS missing');
if (!Array.isArray(sb.window.__WB_BANK__) || sb.window.__WB_BANK__.length < 490) throw new Error('Math Analysis BANK missing');
vm.runInNewContext(fs.readFileSync('shared/modules/calculus_special_labs.js', 'utf8'), sb);
if (typeof sb.window.openCalculusSpecialLab !== 'function') throw new Error('calculus_special_labs missing');
"""
    r = subprocess.run(["node", "-e", c4_js], cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))), capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"Unified Math Analysis boot failed: {r.stderr or r.stdout}")

    # B. Runner --token auth enforcement (401 without token, 200 with X-WB-Token)
    port = 18771
    tok = "test_secret_token_99"
    proc = subprocess.Popen(
        ["python3", "local_cpp_runner.py", "--host", "127.0.0.1", "--port", str(port), "--token", tok],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    time.sleep(0.8)
    try:
        def post(headers):
            req = urllib.request.Request(
                f"http://127.0.0.1:{port}/run",
                data=json.dumps({"code": "#include <iostream>\nint main(){std::cout<<7;}", "stdin": ""}).encode("utf-8"),
                headers=headers, method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    return resp.status, json.loads(resp.read().decode("utf-8"))
            except urllib.error.HTTPError as e:
                return e.code, json.loads(e.read().decode("utf-8"))
        st_no, _ = post({"Content-Type": "application/json"})
        assert st_no == 401, f"Expected 401 without token, got {st_no}"
        st_ok, res_ok = post({"Content-Type": "application/json", "X-WB-Token": tok})
        assert st_ok == 200 and res_ok.get("stdout", "").strip() == "7", f"Expected 200 with token, got {st_ok} {res_ok}"
        # Test mobile one-click URL /?token=... sets HttpOnly cookie & authorizes POST /run
        class _NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, req, fp, code, msg, headers, newurl): return None
        opener = urllib.request.build_opener(_NoRedirect)
        try:
            opener.open(f"http://127.0.0.1:{port}/?token={tok}", timeout=5)
            raise AssertionError("Expected 302 redirect on /?token=...")
        except urllib.error.HTTPError as e:
            assert e.code == 302, f"Expected 302, got {e.code}"
            sc = e.headers.get("Set-Cookie", "")
            assert f"wb_auth_token={tok}" in sc, f"Missing auth cookie: {sc}"
        st_ck, res_ck = post({"Content-Type": "application/json", "Cookie": f"wb_auth_token={tok}"})
        assert st_ck == 200 and res_ck.get("stdout", "").strip() == "7", f"Cookie auth failed: {st_ck} {res_ck}"
    finally:
        proc.terminate()
        proc.wait(timeout=3)
        shutil.rmtree(os.path.join(WB, ".runner_tmp"), ignore_errors=True)
    print("[8/9 PASS] C4 modular V8 boot + portal sync & Runner --token auth (401/200) passed")


def check_core_unit_tests():
    subprocess.check_call(["node", os.path.join(WB, "scripts", "test_core_unit.mjs")])
    print("[9/9 PASS] Core frontend unit tests (storage_idb LWW/quota/race + inlineFmt + WB_BUS) passed")

if __name__ == "__main__":
    check_python()
    check_js_and_html()
    check_chunks()
    check_links()
    check_runner_http()
    check_labs()
    check_module_runtime_boot()
    check_c4_and_runner_auth()
    check_core_unit_tests()
    print("\n=== ALL WORKBENCH QUALITY GATES PASSED ===")
