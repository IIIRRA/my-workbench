#!/usr/bin/env node
/**
 * 十四合一学习工作台核心前端单元测试套件（零外部依赖，由 verify_workbench.py 自动调用）
 * 覆盖：
 *   1. storage_idb.js QuotaExceededError 代理读写 + sessionStorage 隔离 + clear()
 *   2. storage_idb.js LWW 墓碑多轮同步（删除 → 同步 → 重建/重加 → 再同步）与同毫秒单调递增
 *   3. storage_idb.js hydrateToMemory() vs 早期同步 removeItem() 竞态防护
 *   4. workbench_engine.js inlineFmt() 数学下标、代码标识防误伤与裸 URL + 中文/加粗保护
 *   5. ui_polish.js WB_BUS 事件总线 + [data-wb-action] 委托 + 暖纸(sepia)持久化与 toggle-theme 同步
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

class MockStorage {
  constructor(quotaFailKeys = new Set()) {
    this._map = new Map();
    this._quotaFailKeys = quotaFailKeys;
  }
  get length() { return this._map.size; }
  key(i) { return Array.from(this._map.keys())[i] || null; }
  getItem(k) { return this._map.has(k) ? this._map.get(k) : null; }
  setItem(k, v) {
    if (this._quotaFailKeys.has(k)) throw new Error('QuotaExceededError');
    this._map.set(k, String(v));
  }
  removeItem(k) { this._map.delete(k); }
  clear() { this._map.clear(); }
}

async function testStorageIdb() {
  const idbRows = [
    { key: 'wb_race_key', value: 'stale_idb' },
    { key: 'wb_hydrate_ok', value: 'fresh_idb' },
  ];
  let runCursor = null;
  const mockIndexedDB = {
    open() {
      const req = {};
      setTimeout(() => {
        req.result = {
          objectStoreNames: { contains: () => true },
          transaction: () => ({
            objectStore: () => ({
              openCursor: () => {
                const creq = {};
                runCursor = () => {
                  let i = 0;
                  const next = () => {
                    if (i < idbRows.length) {
                      const row = idbRows[i++];
                      creq.onsuccess({ target: { result: { value: row, continue: next } } });
                    } else {
                      creq.onsuccess({ target: { result: null } });
                    }
                  };
                  next();
                };
                return creq;
              },
              put: () => {},
              delete: () => {},
              clear: () => {},
              get: () => ({}),
            }),
            set oncomplete(fn) { fn && fn(); },
          }),
        };
        req.onsuccess && req.onsuccess();
      }, 0);
      return req;
    },
  };

  const ls = new MockStorage(new Set(['stem_wrong_bank_v1']));
  const ss = new MockStorage();
  const fixedNow = 1795000000000;
  const sb = {
    window: {},
    localStorage: ls,
    sessionStorage: ss,
    Storage: MockStorage,
    indexedDB: mockIndexedDB,
    location: { protocol: 'http:' },
    setTimeout,
    Date: class extends Date { static now() { return fixedNow; } },
    CustomEvent: function (n, o) { this.name = n; this.detail = o && o.detail; },
  };
  sb.window = sb;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'shared/storage_idb.js'), 'utf8'), sb);

  // Race: early removeItem before IDB hydration finishes
  sb.localStorage.removeItem('wb_race_key');
  await new Promise((r) => setTimeout(r, 10));
  if (runCursor) runCursor();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(sb.localStorage.getItem('wb_race_key'), null);
  assert.equal(sb.localStorage.getItem('wb_hydrate_ok'), 'fresh_idb');

  // Quota fallback + sessionStorage isolation
  sb.sessionStorage.setItem('sess_only', 'ok');
  sb.localStorage.setItem('stem_wrong_bank_v1', JSON.stringify([{ id: 'p1' }, { id: 'p2' }]));
  assert.equal(ls._map.has('stem_wrong_bank_v1'), false);
  assert.equal(sb.localStorage.getItem('stem_wrong_bank_v1'), JSON.stringify([{ id: 'p1' }, { id: 'p2' }]));

  // Multi-round LWW array delete -> sync -> re-add -> sync
  sb.localStorage.setItem('stem_wrong_bank_v1', JSON.stringify([{ id: 'p2' }]));
  const ts1 = sb.WB_STORE.getTombstones();
  const r1 = sb.WB_STORE._mergeDatasetsWithTombstones(
    { stem_wrong_bank_v1: JSON.stringify([{ id: 'p2' }]), wb_tombstones_v1: JSON.stringify(ts1) },
    { stem_wrong_bank_v1: JSON.stringify([{ id: 'p1' }, { id: 'p2' }]) }
  );
  assert.deepEqual(JSON.parse(r1.merged.stem_wrong_bank_v1).map((x) => x.id), ['p2']);

  sb.localStorage.setItem('stem_wrong_bank_v1', JSON.stringify([{ id: 'p2' }, { id: 'p1' }]));
  const ts2 = sb.WB_STORE.getTombstones();
  const r2 = sb.WB_STORE._mergeDatasetsWithTombstones(
    { stem_wrong_bank_v1: JSON.stringify([{ id: 'p2' }, { id: 'p1' }]), wb_tombstones_v1: JSON.stringify(ts2) },
    r1.merged
  );
  assert.deepEqual(JSON.parse(r2.merged.stem_wrong_bank_v1).map((x) => x.id).sort(), ['p1', 'p2']);

  // Same-ms monotonic delete -> recreate -> delete
  sb.localStorage.setItem('k_mono', '1');
  sb.localStorage.removeItem('k_mono');
  const m1 = sb.WB_STORE.getTombstones().keys.k_mono;
  sb.localStorage.setItem('k_mono', '2');
  const m2 = sb.WB_STORE.getTombstones().keys.k_mono;
  sb.localStorage.removeItem('k_mono');
  const m3 = sb.WB_STORE.getTombstones().keys.k_mono;
  assert.ok(m1.op === 'del' && m2.op === 'add' && m3.op === 'del');
  assert.ok(m3.ts > m2.ts && m2.ts > m1.ts);

  // clear() isolation
  sb.localStorage.clear();
  assert.equal(sb.localStorage.getItem('stem_wrong_bank_v1'), null);
  assert.equal(sb.sessionStorage.getItem('sess_only'), 'ok');
}

function testInlineFmt() {
  const src = fs.readFileSync(path.join(ROOT, 'shared/workbench_engine.js'), 'utf8');
  const escMatch = src.match(/function escapeHtml\([\s\S]*?\n\}/);
  const fmtMatch = src.match(/function inlineFmt\([\s\S]*?\n\}/);
  assert.ok(escMatch && fmtMatch);
  const ctx = {};
  vm.runInNewContext(escMatch[0] + '\n' + fmtMatch[0], ctx);

  const out = ctx.inlineFmt('参考https://example.com/a_b，其中a_i、ex_01与**https://foo.bar/x_1**和**重点**');
  assert.ok(out.includes('https://example.com/a_b'));
  assert.ok(out.includes('<span class="math-var">a<sub>i</sub></span>'));
  assert.ok(out.includes('ex_01') && !out.includes('ex<sub>01</sub>'));
  assert.ok(out.includes('<strong>https://foo.bar/x_1</strong>'));
  assert.ok(out.includes('<strong>重点</strong>'));
}

function testEventBus() {
  const src = fs.readFileSync(path.join(ROOT, 'shared/ui_polish.js'), 'utf8');
  const listeners = new Map();
  const docListeners = new Map();
  const makeEl = (attrs = {}) => ({
    attrs: { ...attrs },
    getAttribute(k) { return this.attrs[k] ?? null; },
    closest(sel) { return sel === '[data-wb-action]' && this.attrs['data-wb-action'] ? this : null; },
  });
  const sb = {
    window: {},
    document: {
      readyState: 'complete',
      documentElement: (() => {
        const a = { 'data-theme': 'light' };
        return {
          style: { setProperty() {}, removeProperty() {} },
          getAttribute: (k) => (k in a ? a[k] : null),
          setAttribute: (k, v) => { a[k] = String(v); },
          removeAttribute: (k) => { delete a[k]; },
        };
      })(),
      body: { appendChild: () => {}, contains: () => true },
      addEventListener(ev, fn) { (docListeners.get(ev) || docListeners.set(ev, []).get(ev)).push(fn); },
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, contains: () => false }, setAttribute() {}, removeAttribute() {}, getAttribute: () => null, addEventListener() {}, appendChild() {}, querySelector: () => null, querySelectorAll: () => [] }),
      contains: () => true,
    },
    localStorage: new MockStorage(),
    location: { protocol: 'file:', hash: '', pathname: '/index.html' },
    history: { state: null, pushState() {}, replaceState() {} },
    navigator: {},
    innerWidth: 1440,
    setTimeout: () => 0,
    clearTimeout: () => {},
    addEventListener(ev, fn) { (listeners.get(ev) || listeners.set(ev, []).get(ev)).push(fn); },
    removeEventListener(ev, fn) {
      const arr = listeners.get(ev) || [];
      listeners.set(ev, arr.filter((x) => x !== fn));
    },
    dispatchEvent(ev) {
      (listeners.get(ev.type) || []).forEach((fn) => fn(ev));
    },
    CustomEvent: function (type, opts) { this.type = type; this.detail = opts && opts.detail; },
  };
  sb.localStorage.setItem('wb_read_prefs_v1', JSON.stringify({ fs: 'md', lh: 'comfort', paper: 'sepia' }));
  sb.window = sb;
  vm.runInNewContext(src, sb);

  assert.ok(sb.WB_BUS && typeof sb.WB_BUS.emit === 'function');
  let fired = 0;
  const h = (e) => { fired += e.detail.n; };
  sb.WB_BUS.on('wb:test-ev', h);
  sb.WB_BUS.emit('wb:test-ev', { n: 2 });
  sb.WB_BUS.off('wb:test-ev', h);
  sb.WB_BUS.emit('wb:test-ev', { n: 5 });
  assert.equal(fired, 2);

  let actionHit = false;
  sb.WB_BUS.registerAction('unit-act', () => { actionHit = true; });
  const btn = makeEl({ 'data-wb-action': 'unit-act' });
  (docListeners.get('click') || []).forEach((fn) => fn({ target: btn }));
  assert.equal(actionHit, true);

  // Verify sepia persistence is NOT clobbered by ThemeController.apply('light')
  assert.equal(sb.document.documentElement.getAttribute('data-read-paper'), 'sepia');
  assert.equal(JSON.parse(sb.localStorage.getItem('wb_read_prefs_v1')).paper, 'sepia');

  // Verify non-#themeBtn [data-wb-action="toggle-theme"] toggles theme & syncs paper to dark
  const themeTrigger = makeEl({ 'data-wb-action': 'toggle-theme' });
  (docListeners.get('click') || []).forEach((fn) => fn({ target: themeTrigger }));
  assert.equal(sb.document.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(JSON.parse(sb.localStorage.getItem('wb_read_prefs_v1')).paper, 'dark');
}

await testStorageIdb();
testInlineFmt();
testEventBus();
console.log('[PASS] test_core_unit.mjs: storage_idb (LWW/quota/race/clear) + inlineFmt + WB_BUS all passed');
