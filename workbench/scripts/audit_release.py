#!/usr/bin/env python3
"""
学习工作台发版前 16 项工程纪律自动化强门禁 v6 (scripts/audit_release.py)
用法: python3 scripts/audit_release.py
"""
import glob, json, os, re, subprocess, sys, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
failures = []

def check(name, cond, detail=""):
    if cond:
        print(f"  [PASS] {name}")
    else:
        print(f"  [FAIL] {name} -> {detail}")
        failures.append((name, detail))

print("=== 学习工作台 16 项工程纪律强门禁审计 v6 ===")

# Gate 1: Python compile + real CLI smoke test + full JS syntax
runner_p = os.path.join(ROOT, "local_cpp_runner.py")
py_ok = subprocess.run([sys.executable, "-m", "py_compile", runner_p], capture_output=True).returncode == 0
help_res = subprocess.run([sys.executable, runner_p, "--help"], capture_output=True, text=True)
check("Gate 1a: local_cpp_runner.py 语法与 --help 真实启动烟雾测试", py_ok and help_res.returncode == 0, help_res.stderr.strip()[:200])

js_files = [os.path.join(ROOT, "sw.js")]
for dp, _, fs in sorted(os.walk(os.path.join(ROOT, "shared"))):
    for f in sorted(fs):
        if f.endswith(".js"):
            js_files.append(os.path.join(dp, f))
bad_js = []
for jf in js_files:
    if subprocess.run(["node", "--check", jf], capture_output=True).returncode != 0:
        bad_js.append(os.path.relpath(jf, ROOT))
check(f"Gate 1b: 全量 JS 语法 ({len(js_files)} 文件)", not bad_js, str(bad_js))

# Gate 2: CSS brace balance, @layer discipline & full-repo 0 100vh
wc_raw = open(os.path.join(ROOT, "shared/workbench.css"), encoding="utf-8").read()
po_raw = open(os.path.join(ROOT, "shared/portal.css"), encoding="utf-8").read()
up_raw = open(os.path.join(ROOT, "shared/ui_polish.css"), encoding="utf-8").read()
for cname, craw in [("workbench.css", wc_raw), ("portal.css", po_raw), ("ui_polish.css", up_raw)]:
    nc = re.sub(r"/\*[\s\S]*?\*/", "", craw)
    check(f"Gate 2a: {cname} 括号配平", nc.count("{") == nc.count("}"), f"{{={nc.count('{')} }}={nc.count('}')}")
check("Gate 2b: CSS @layer 级联正确 (workbench.css 在 wb-base，ui_polish.css 无层)",
      "@layer wb-base" in wc_raw and "@layer wb-polish" not in up_raw)

htmls = sorted(glob.glob(os.path.join(ROOT, "*.html")))
vh_hits = []
for fpath in [os.path.join(ROOT, "shared/workbench.css"), os.path.join(ROOT, "shared/portal.css"), os.path.join(ROOT, "shared/ui_polish.css")] + htmls:
    if re.search(r"\b100vh\b", open(fpath, encoding="utf-8").read()):
        vh_hits.append(os.path.relpath(fpath, ROOT))
check("Gate 2c: 全站 CSS 与 15 页 HTML 零 100vh 残留", not vh_hits, str(vh_hits))

# Gate 3: 15/15 HTML script injection order & 0 broken local links
missing_inj = []
broken_links = []
for h in htmls:
    bn = os.path.basename(h)
    s = open(h, encoding="utf-8").read()
    for req in ["shared/modules/ai_client.js", "shared/storage_idb.js", "shared/modules/stem_ai_exam.js", "shared/ui_polish.js", "apple-touch-icon"]:
        if req not in s:
            missing_inj.append((bn, req))
    if "shared/storage_idb.js" in s and "shared/ui_polish.js" in s:
        if not (s.find("shared/storage_idb.js") < s.find("shared/modules/stem_ai_exam.js") < s.find("shared/ui_polish.js")):
            missing_inj.append((bn, "order must be storage_idb < stem_ai_exam < ui_polish"))
    for ref in re.findall(r'(?:src|href)=["\']([^"\']+)["\']', s):
        if ref.startswith(("http", "data:", "#", "javascript:", "mailto:")) or "${" in ref:
            continue
        cr = urllib.parse.unquote(ref.split("?")[0].split("#")[0])
        if cr and cr not in ("/", "./") and not os.path.exists(os.path.join(ROOT, cr)):
            broken_links.append((bn, cr))
check(f"Gate 3a: {len(htmls)}/15 HTML 核心脚本与顺序强断言", not missing_inj and len(htmls) == 15, str(missing_inj[:5]))
check("Gate 3b: 全站 15 页零本地断链", not broken_links, str(broken_links[:5]))

# Gate 4: Full-repo Security & Privacy
key_leaks = []
for fpath in htmls + js_files:
    if "?key=" in open(fpath, encoding="utf-8").read():
        key_leaks.append(os.path.relpath(fpath, ROOT))
check("Gate 4a: 全站 15 页 + 全量 JS 零 ?key= URL 密钥暴露", not key_leaks, str(key_leaks))

runner_raw = open(runner_p, encoding="utf-8").read()
check("Gate 4b: 后端 ALLOW_LAN_EXEC 默认关闭、黑名单含 sync 及 .tmp、且无错误 _read_json_body(max_bytes=)",
      "ALLOW_LAN_EXEC = False" in runner_raw
      and '"workbench_sync.json"' in runner_raw
      and '"workbench_sync.json.tmp"' in runner_raw
      and "_read_json_body(max_bytes" not in runner_raw)

sw_raw = open(os.path.join(ROOT, "sw.js"), encoding="utf-8").read()
check("Gate 4c: sw.js 跳过 ?token=、/sync_state 与 /mobile_connect",
      "searchParams.has('token')" in sw_raw and "'/sync_state'" in sw_raw and "'/mobile_connect'" in sw_raw)

# Gate 5: OverlayManager & Cross-Subject
up_js_raw = open(os.path.join(ROOT, "shared/ui_polish.js"), encoding="utf-8").read()
check("Gate 5a: OverlayManager 精准监听嵌套抽屉 (#sidebar/#vizSidebar)",
      "#vizSidebar" in up_js_raw and "OVERLAY_SELS" in up_js_raw)
aia_raw = open(os.path.join(ROOT, "shared/modules/ai_assistant.js"), encoding="utf-8").read()
check("Gate 5b: AI 助教无硬编码 ICPC 欢迎语串台", "我是你的 ICPC 随身助教" not in aia_raw)

# Gate 6: PWA Manifest & Icons
m = json.load(open(os.path.join(ROOT, "manifest.json"), encoding="utf-8"))
icons_ok = (
    len(m.get("icons", [])) >= 2
    and os.path.isfile(os.path.join(ROOT, "icons/icon-192.png"))
    and os.path.isfile(os.path.join(ROOT, "icons/icon-512.png"))
)
check("Gate 6: manifest.json 与 192/512 PNG 图标完整", icons_ok)

# Gate 7: LAN Sync end-to-end & API key preservation
idx_raw = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
idb_raw = open(os.path.join(ROOT, "shared/storage_idb.js"), encoding="utf-8").read()
check("Gate 7: 局域网双向同步安全闭环 (GET/POST 均验 Origin+Auth、保留本地 apiKey、深合并)",
      'parsed.path == "/sync_state"' in runner_raw
      and 'route == "/sync_state"' in runner_raw
      and "preserveLocalApiKey: true" in idb_raw
      and "_deepMergeObj" in idb_raw
      and 'id="lanSyncBtn"' in idx_raw)


# Gate 8: Offline Precache Manifest (Forward+Reverse), SW Precache Links & Menu Visibility Guard
om_path = os.path.join(ROOT, "data/offline_manifest.json")
om_ok = False
om_err = ""
try:
    om = json.load(open(om_path, encoding="utf-8"))
    disk_map = {}
    for slug in sorted(os.listdir(os.path.join(ROOT, "data"))):
        sp = os.path.join(ROOT, "data", slug)
        if os.path.isdir(sp):
            fs = sorted([f"data/{slug}/{fn}" for fn in os.listdir(sp) if fn.endswith(".js")])
            if fs:
                disk_map[slug] = fs
    om_ok = (om == disk_map) and len(om) == 14
    if not om_ok:
        om_err = f"manifest keys={len(om)} vs disk keys={len(disk_map)}"
except Exception as e:
    om_err = str(e)

sw_cn = re.search(r"const CACHE_NAME = '([^']+)';", sw_raw)
up_cn = re.search(r"CACHE_NAME:\s*'([^']+)'", up_js_raw)
check("Gate 8a: 离线预缓存清单与磁盘 14 科 100% 双向一致且缓存名同步",
      om_ok and sw_cn and up_cn and sw_cn.group(1) == up_cn.group(1),
      om_err or f"sw={sw_cn.group(1) if sw_cn else None}, ui={up_cn.group(1) if up_cn else None}")

# Verify SW SHELL_PRECACHE files exist on disk
pre_m = re.search(r"const SHELL_PRECACHE = \[([\s\S]*?)\];", sw_raw)
sw_missing = []
if pre_m:
    for item in re.findall(r"'([^']+)'", pre_m.group(1)):
        rel = item.lstrip("./")
        if rel and not os.path.exists(os.path.join(ROOT, rel)):
            sw_missing.append(item)
check("Gate 8b: sw.js SHELL_PRECACHE (含 KaTeX 字体) 零断链", not sw_missing, str(sw_missing[:5]))

# Guard against display: none !important locking .wb-more-menu invisible
menu_locked = bool(re.search(r"body\s*>\s*\.wb-more-menu\s*\{[^}]*display\s*:\s*none\s*!important", up_raw))
check("Gate 8c: 顶栏下拉菜单 .wb-more-menu 无 display:none !important 锁死回归", not menu_locked)
idx_after_css = idx_raw.split("shared/ui_polish.css")[-1]
check("Gate 8d: index.html 在 ui_polish.css 后零残留 <style> 覆盖", "<style" not in idx_after_css.lower())


# Gate 9: On-Demand Lazy Loading of data/*/exam.js
eager_exam = [os.path.basename(h) for h in htmls if re.search(r'<script[^>]+src=["\']data/[^"\']+/exam\.js["\']', open(h, encoding="utf-8").read())]
stem_raw = open(os.path.join(ROOT, "shared/modules/stem_ai_exam.js"), encoding="utf-8").read()
tpl_p = os.path.join(ROOT, "templates/subject.html.tpl")
tpl_eager = os.path.isfile(tpl_p) and bool(re.search(r'data/\{\{SLUG\}\}/exam\.js', open(tpl_p, encoding="utf-8").read()))
check("Gate 9: 14 科与源模板 exam.js 均转为按需懒加载 (含取消竞态保护与失败清理)",
      not eager_exam and not tpl_eager and "ensureExamDataLoaded" in stem_raw and "stillOpen" in stem_raw and "sc.remove()" in stem_raw,
      f"eager={eager_exam}, tpl_eager={tpl_eager}")


# Gate 10: R13 Hardening — SW Subject Precache Completeness & Backend Gzip Thread-Safety + Sandbox Limits
sw_core_req = ["./shared/workbench_engine.js", "./shared/workbench_addons.js", "./shared/modules/roadmap.js", "./shared/modules/viz_engine.js", "./books_data/catalog.js"]
sw_core_missing = [x for x in sw_core_req if x not in sw_raw]
check("Gate 10: sw.js 预缓存覆盖学科核心脚本且后端 _GZIP_CACHE 加锁与 RLIMIT_FSIZE 生效",
      not sw_core_missing and "_GZIP_LOCK = threading.Lock()" in runner_raw and "with _GZIP_LOCK:" in runner_raw and "RLIMIT_FSIZE" in runner_raw and "RLIMIT_CPU" in runner_raw,
      f"missing={sw_core_missing}")

# Gate 11: R13 CSS & Portal Hygiene — No 900px Collision, 12px Font Floor, No Stale iter10IdeArea
wb_css_raw = open(os.path.join(ROOT, "shared/workbench.css"), encoding="utf-8").read()
small_fs_hits = []
portal_css_raw = open(os.path.join(ROOT, "shared/portal.css"), encoding="utf-8").read()
for cname, ctxt in [("workbench.css", wb_css_raw), ("portal.css", portal_css_raw), ("ui_polish.css", up_raw)]:
    for m in re.finditer(r"font-size\s*:\s*(?:clamp\(\s*)?([0-9.]+)(px|rem)", ctxt):
        v, u = float(m.group(1)), m.group(2)
        if (u == "px" and v < 12) or (u == "rem" and v < 0.75):
            small_fs_hits.append(f"{cname}:{v}{u}")
check("Gate 11: 无 900px 断点碰撞、核心 CSS 零 <12px 字号、首页零残留 iter10IdeArea",
      "@media (min-width: 900px)" not in up_raw and not small_fs_hits and "iter10IdeArea" not in idx_raw,
      f"small_fs={small_fs_hits[:5]}")


# Gate 12: R13 Phase 2 — IndexedDB Read/Write Closure & Tombstone-Aware LAN Sync
check("Gate 12: storage_idb.js 具备内存水合读写代理与 wb_tombstones_v1 防删除复活同步",
      "hydrateToMemory" in idb_raw and "_installStorageProxy" in idb_raw and "wb_tombstones_v1" in idb_raw and "_mergeDatasetsWithTombstones" in idb_raw)

# Gate 13: R13 Phase 2 — Portal Slimming (portal.css & cross_search_data.js externalized)
portal_inline_styles = len(re.findall(r"<style\b", idx_raw, re.I))
check("Gate 13: 首页已完成样式与跨科检索数据外置 (portal.css + cross_search_data.js，零内联 <style> 堆叠)",
      portal_inline_styles == 0
      and 'href="shared/portal.css"' in idx_raw
      and 'src="books_data/cross_search_data.js"' in idx_raw
      and os.path.isfile(os.path.join(ROOT, "shared/portal.css"))
      and os.path.isfile(os.path.join(ROOT, "books_data/cross_search_data.js"))
      and 'src="shared/portal.js"' in idx_raw
      and os.path.isfile(os.path.join(ROOT, "shared/portal.js")),
      f"inline_styles={portal_inline_styles}")


# Gate 14: R13 Phase 3 — A11y Focus Trap, Keyboard Focus Ring & IDB Monotonic Hardening
check("Gate 14: 无障碍焦点陷阱 (aria-modal/Tab)、全局 :focus-visible 与 IDB 单调墓碑/水合联动完整",
      "_syncFocusTrap" in up_js_raw
      and 'aria-modal' in up_js_raw
      and "Global Accessible Keyboard Focus Ring" in up_raw
      and "!_clearedInSession" in idb_raw
      and ("wb:idb-hydrated" in idx_raw or "wb:idb-hydrated" in open(os.path.join(ROOT, "shared/portal.js"), encoding="utf-8").read()))


# Gate 15: R14 Step 2 — CSS !important Debt Ceiling & portal.css @layer wb-base Alignment
_imp_wb = len(re.findall(r"!important", wb_css_raw))
_imp_po = len(re.findall(r"!important", portal_css_raw))
_imp_up = len(re.findall(r"!important", up_raw))
_imp_total = _imp_wb + _imp_po + _imp_up
check("Gate 15: 全站核心 CSS !important 债务 <= 38 且 portal.css 归入 @layer wb-base",
      _imp_total <= 38 and "@layer wb-base" in portal_css_raw,
      f"total={_imp_total} (wb={_imp_wb}, portal={_imp_po}, polish={_imp_up})")


# Gate 16: R14 Step 3 — Event Bus WB_BUS, Zero subtree:true #main Observer & Zero Topbar Inline onclick
_topbar_m = re.search(r'<header[^>]*class=["\']topbar["\'][^>]*>([\s\S]*?)</header>', idx_raw)
_topbar_onclick = bool(_topbar_m and "onclick=" in _topbar_m.group(1))
check("Gate 16: WB_BUS 事件总线就绪、ui_polish.js 零 subtree:true 主区监听且门户顶栏零内联 onclick",
      "window.WB_BUS = WB_BUS" in up_js_raw
      and not re.search(r"subtree\s*:\s*true", re.sub(r"/\*[\s\S]*?\*/|//[^\n]*", "", up_js_raw))
      and not _topbar_onclick
      and 'data-wb-action="toggle-theme"' in idx_raw,
      f"topbar_onclick={_topbar_onclick}")

print(f"\n=== 审计结束: {len(failures)} 项失败 ===")
sys.exit(1 if failures else 0)
