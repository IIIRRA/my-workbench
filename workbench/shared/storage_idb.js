/* === Workbench IndexedDB Persistence Layer (Quota-Safe Read/Write Mirror, LWW Tombstone Sync & Async Store) === */
(function () {
  if (window.WB_STORE) return;

  const DB_NAME = 'workbench_studio_db';
  const DB_VER = 1;
  const STORE_NAME = 'kv';
  const TOMBSTONE_KEY = 'wb_tombstones_v1';
  const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  const MIRROR_PATTERN = /(wrong|ai_bank|ai_hist|notes|custom_docs|mastery|roadmap|wb_|stem_|icpc_|c4_)/i;

  let _dbPromise = null;
  let _syncInFlight = false;
  let _hydrated = false;
  let _clearedInSession = false;
  const _memCache = new Map();
  const _deletedInSession = new Set();

  // Capture native Storage methods before proxying
  const _proto = (typeof Storage !== 'undefined' && Storage.prototype) ? Storage.prototype : null;
  const _nativeGet = _proto ? _proto.getItem : null;
  const _nativeSet = _proto ? _proto.setItem : null;
  const _nativeRemove = _proto ? _proto.removeItem : null;
  const _nativeClear = _proto ? _proto.clear : null;

  function _lsGet(k) {
    try {
      if (_nativeGet && typeof localStorage !== 'undefined') return _nativeGet.call(localStorage, k);
      return localStorage.getItem(k);
    } catch (_) { return null; }
  }
  function _lsSet(k, v) {
    try {
      if (_nativeSet && typeof localStorage !== 'undefined') { _nativeSet.call(localStorage, k, v); return true; }
      localStorage.setItem(k, v);
      return true;
    } catch (_) { return false; }
  }
  function _lsRemove(k) {
    try {
      if (_nativeRemove && typeof localStorage !== 'undefined') _nativeRemove.call(localStorage, k);
      else localStorage.removeItem(k);
    } catch (_) {}
  }
  function _lsClear() {
    try {
      if (_nativeClear && typeof localStorage !== 'undefined') _nativeClear.call(localStorage);
      else localStorage.clear();
    } catch (_) {}
  }

  function _redactIfAiKey(k, v) {
    if (typeof k === 'string' && /ai_cfg|ai_feed_cfg/i.test(k) && typeof v === 'string' && v) {
      try {
        const obj = JSON.parse(v);
        if (obj && typeof obj === 'object' && 'apiKey' in obj) {
          obj.apiKey = '';
          return JSON.stringify(obj);
        }
      } catch (_) {}
    }
    return v;
  }

  function _itemKey(item) {
    return (item && typeof item === 'object')
      ? String(item.id || item.pid || item.key || JSON.stringify(item))
      : String(item);
  }

  // Normalize tombstone entry to LWW { op: 'del' | 'add', ts: number }
  function _normEntry(val) {
    if (typeof val === 'number' && Number.isFinite(val)) {
      return { op: 'del', ts: val };
    }
    if (val && typeof val === 'object' && typeof val.ts === 'number' && Number.isFinite(val.ts)) {
      return { op: val.op === 'add' ? 'add' : 'del', ts: val.ts };
    }
    return null;
  }

  function _pickNewerEntry(a, b) {
    const na = _normEntry(a);
    const nb = _normEntry(b);
    if (!na) return nb;
    if (!nb) return na;
    if (na.ts > nb.ts) return na;
    if (nb.ts > na.ts) return nb;
    // Tie-break at identical millisecond: prefer 'add' so explicit re-creation is not silently dropped
    return (na.op === 'add' || nb.op === 'add') ? { op: 'add', ts: na.ts } : na;
  }

  function _emptyTombstones() {
    return { keys: {}, items: {} };
  }

  function _parseTombstones(raw) {
    const out = _emptyTombstones();
    if (!raw || typeof raw !== 'string') return out;
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') {
        if (obj.keys && typeof obj.keys === 'object') {
          for (const [k, v] of Object.entries(obj.keys)) {
            const n = _normEntry(v);
            if (n) out.keys[k] = n;
          }
        }
        if (obj.items && typeof obj.items === 'object') {
          for (const [k, m] of Object.entries(obj.items)) {
            if (!m || typeof m !== 'object') continue;
            const kept = {};
            for (const [itemId, v] of Object.entries(m)) {
              const n = _normEntry(v);
              if (n) kept[itemId] = n;
            }
            if (Object.keys(kept).length) out.items[k] = kept;
          }
        }
      }
    } catch (_) {}
    return out;
  }

  function _pruneTombstones(tsObj, now) {
    const cutoff = (now || Date.now()) - TOMBSTONE_TTL_MS;
    const out = _emptyTombstones();
    for (const [k, raw] of Object.entries(tsObj.keys || {})) {
      const n = _normEntry(raw);
      if (n && n.ts >= cutoff) out.keys[k] = n;
    }
    for (const [k, map] of Object.entries(tsObj.items || {})) {
      if (!map || typeof map !== 'object') continue;
      const kept = {};
      for (const [itemId, raw] of Object.entries(map)) {
        const n = _normEntry(raw);
        if (n && n.ts >= cutoff) kept[itemId] = n;
      }
      if (Object.keys(kept).length) out.items[k] = kept;
    }
    return out;
  }

  function _mergeTombstones(localTs, remoteTs) {
    const merged = _emptyTombstones();
    for (const src of [remoteTs, localTs]) {
      for (const [k, raw] of Object.entries((src && src.keys) || {})) {
        const picked = _pickNewerEntry(merged.keys[k], raw);
        if (picked) merged.keys[k] = picked;
      }
      for (const [k, map] of Object.entries((src && src.items) || {})) {
        if (!map || typeof map !== 'object') continue;
        if (!merged.items[k]) merged.items[k] = {};
        for (const [itemId, raw] of Object.entries(map)) {
          const picked = _pickNewerEntry(merged.items[k][itemId], raw);
          if (picked) merged.items[k][itemId] = picked;
        }
      }
    }
    return _pruneTombstones(merged, Date.now());
  }

  function _readLocalTombstones() {
    const raw = _memCache.has(TOMBSTONE_KEY) ? _memCache.get(TOMBSTONE_KEY) : _lsGet(TOMBSTONE_KEY);
    return _pruneTombstones(_parseTombstones(raw), Date.now());
  }

  function _saveLocalTombstones(tsObj) {
    const serialized = JSON.stringify(_pruneTombstones(tsObj, Date.now()));
    _memCache.set(TOMBSTONE_KEY, serialized);
    _deletedInSession.delete(TOMBSTONE_KEY);
    _lsSet(TOMBSTONE_KEY, serialized);
    set(TOMBSTONE_KEY, serialized);
  }

  function _recordKeyDeletion(k) {
    if (!k || k === TOMBSTONE_KEY) return;
    const ts = _readLocalTombstones();
    const prevTs = ts.keys[k] ? ts.keys[k].ts : 0;
    ts.keys[k] = { op: 'del', ts: Math.max(Date.now(), prevTs + 1) };
    _saveLocalTombstones(ts);
  }

  function _recordKeyWrite(k) {
    if (!k || k === TOMBSTONE_KEY) return;
    const ts = _readLocalTombstones();
    // If key was previously tombstoned (or tracked), record newer 'add' so remote old 'del' cannot wipe it
    if (ts.keys[k] && ts.keys[k].op === 'del') {
      ts.keys[k] = { op: 'add', ts: Math.max(Date.now(), ts.keys[k].ts + 1) };
      _saveLocalTombstones(ts);
    }
  }

  function _trackArrayChanges(k, prevRaw, nextRaw) {
    if (!k || k === TOMBSTONE_KEY || !nextRaw || prevRaw === nextRaw) return;
    if (typeof nextRaw !== 'string' || !nextRaw.trim().startsWith('[')) return;
    try {
      const nextArr = JSON.parse(nextRaw);
      if (!Array.isArray(nextArr)) return;
      const nextKeys = new Set(nextArr.map(_itemKey));
      const ts = _readLocalTombstones();
      const now = Date.now();
      let changed = false;

      if (typeof prevRaw === 'string' && prevRaw.trim().startsWith('[')) {
        try {
          const prevArr = JSON.parse(prevRaw);
          if (Array.isArray(prevArr)) {
            for (const item of prevArr) {
              const ik = _itemKey(item);
              if (!nextKeys.has(ik)) {
                if (!ts.items[k]) ts.items[k] = {};
                const prevTs = ts.items[k][ik] ? ts.items[k][ik].ts : 0;
                ts.items[k][ik] = { op: 'del', ts: Math.max(now, prevTs + 1) };
                changed = true;
              }
            }
          }
        } catch (_) {}
      }

      // If any previously tombstoned item is re-added, record LWW 'add' with newer timestamp
      if (ts.items[k]) {
        for (const ik of nextKeys) {
          if (ts.items[k][ik] && ts.items[k][ik].op === 'del') {
            ts.items[k][ik] = { op: 'add', ts: Math.max(now, ts.items[k][ik].ts + 1) };
            changed = true;
          }
        }
      }

      if (changed) _saveLocalTombstones(ts);
    } catch (_) {}
  }

  function openDb() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
    });
    return _dbPromise;
  }

  async function get(key) {
    const k = String(key);
    if (_deletedInSession.has(k)) return null;
    if (_memCache.has(k)) return _memCache.get(k);
    if (_clearedInSession) return null;
    try {
      const db = await openDb();
      const val = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(k);
        req.onsuccess = () => resolve(req.result ? req.result.value : null);
        req.onerror = () => reject(req.error);
      });
      if (val !== null && val !== undefined && !_clearedInSession && !_deletedInSession.has(k)) {
        _memCache.set(k, val);
        return val;
      }
    } catch (_) {}
    return _lsGet(k);
  }

  async function set(key, value) {
    const k = String(key);
    const v = typeof value === 'string' ? value : JSON.stringify(value);
    _deletedInSession.delete(k);
    _memCache.set(k, v);
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({ key: k, value: v, updatedAt: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  async function remove(key) {
    const k = String(key);
    _deletedInSession.add(k);
    _memCache.delete(k);
    _lsRemove(k);
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(k);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  async function clearAll() {
    _clearedInSession = true;
    _memCache.clear();
    _deletedInSession.clear();
    _lsClear();
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  async function hydrateToMemory() {
    let count = 0;
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).openCursor();
        req.onsuccess = (ev) => {
          const cur = ev.target.result;
          if (cur) {
            const k = cur.value.key;
            const v = cur.value.value;
            if (typeof k === 'string' && typeof v === 'string') {
              // Respect synchronous writes, deletes, or clear() made earlier in this session
              if (!_clearedInSession && !_deletedInSession.has(k) && !_memCache.has(k)) {
                _memCache.set(k, v);
                if (_lsGet(k) === null) _lsSet(k, v);
                count++;
              }
            }
            cur.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (_) {}
    _hydrated = true;
    try {
      if (typeof window !== 'undefined' && typeof CustomEvent === 'function') {
        window.dispatchEvent(new CustomEvent('wb:idb-hydrated', { detail: { count } }));
      }
    } catch (_) {}
    return count;
  }

  function _installStorageProxy() {
    if (!_proto || _proto.__wbIdbProxied) return;
    _proto.__wbIdbProxied = true;

    _proto.getItem = function (key) {
      const k = String(key);
      if (this === window.localStorage) {
        if (_deletedInSession.has(k)) return null;
        if (_memCache.has(k)) return _memCache.get(k);
        if (_clearedInSession) return null;
      }
      return _nativeGet.call(this, k);
    };

    _proto.setItem = function (key, value) {
      const k = String(key);
      const v = String(value);
      if (this === window.localStorage) {
        const prev = _memCache.has(k) ? _memCache.get(k) : (_deletedInSession.has(k) ? null : _nativeGet.call(this, k));
        _deletedInSession.delete(k);
        _memCache.set(k, v);
        if (k !== TOMBSTONE_KEY) {
          _recordKeyWrite(k);
          _trackArrayChanges(k, prev, v);
        }
        let lsOk = false;
        try {
          _nativeSet.call(this, k, v);
          lsOk = true;
        } catch (_) {}
        if (!lsOk || MIRROR_PATTERN.test(k)) {
          set(k, v);
        }
        return;
      }
      return _nativeSet.call(this, k, v);
    };

    _proto.removeItem = function (key) {
      const k = String(key);
      if (this === window.localStorage) {
        _deletedInSession.add(k);
        _memCache.delete(k);
        if (k !== TOMBSTONE_KEY) {
          _recordKeyDeletion(k);
        }
        remove(k);
        return;
      }
      return _nativeRemove.call(this, k);
    };

    if (_nativeClear) {
      _proto.clear = function () {
        if (this === window.localStorage) {
          clearAll();
          return;
        }
        return _nativeClear.call(this);
      };
    }
  }

  async function exportAll() {
    const out = {};
    if (!_clearedInSession) {
      try {
        const db = await openDb();
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const req = tx.objectStore(STORE_NAME).openCursor();
          req.onsuccess = (ev) => {
            const cur = ev.target.result;
            if (cur) {
              if (!_deletedInSession.has(cur.value.key)) {
                out[cur.value.key] = _redactIfAiKey(cur.value.key, cur.value.value);
              }
              cur.continue();
            } else {
              resolve();
            }
          };
          req.onerror = () => reject(req.error);
        });
      } catch (_) {}
    }
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || _deletedInSession.has(k)) continue;
        const v = _lsGet(k);
        if (v !== null) out[k] = _redactIfAiKey(k, v);
      }
    } catch (_) {}
    for (const [k, v] of _memCache.entries()) {
      if (typeof v === 'string' && !_deletedInSession.has(k)) out[k] = _redactIfAiKey(k, v);
    }
    return out;
  }

  async function importAll(map, opts) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) return 0;
    const preserveLocalApiKey = !!(opts && opts.preserveLocalApiKey);
    let count = 0;
    for (const [k, rawV] of Object.entries(map)) {
      if (typeof rawV !== 'string') continue;
      let v = rawV;
      if (preserveLocalApiKey && /ai_cfg|ai_feed_cfg/i.test(k)) {
        try {
          const incomingObj = JSON.parse(v);
          const localRaw = _memCache.has(k) ? _memCache.get(k) : _lsGet(k);
          const localObj = localRaw ? JSON.parse(localRaw) : null;
          if (incomingObj && typeof incomingObj === 'object' && localObj && localObj.apiKey && !incomingObj.apiKey) {
            incomingObj.apiKey = localObj.apiKey;
            v = JSON.stringify(incomingObj);
          }
        } catch (_) {}
      }
      await set(k, v);
      _lsSet(k, v);
      count++;
    }
    return count;
  }

  async function syncFromLocalStorage() {
    let synced = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !MIRROR_PATTERN.test(k) || _deletedInSession.has(k)) continue;
        const v = _lsGet(k);
        if (v !== null) {
          await set(k, v);
          synced++;
        }
      }
    } catch (_) {}
    return synced;
  }

  function safeSetItem(key, value) {
    const k = String(key);
    const v = typeof value === 'string' ? value : JSON.stringify(value);
    const prev = _memCache.has(k) ? _memCache.get(k) : (_deletedInSession.has(k) ? null : _lsGet(k));
    _deletedInSession.delete(k);
    _memCache.set(k, v);
    if (k !== TOMBSTONE_KEY) {
      _recordKeyWrite(k);
      _trackArrayChanges(k, prev, v);
    }
    const lsOk = _lsSet(k, v);
    if (!lsOk || MIRROR_PATTERN.test(k)) {
      set(k, v);
    }
    return lsOk;
  }

  async function getStats() {
    let idbCount = 0;
    let idbBytes = 0;
    try {
      const all = await exportAll();
      idbCount = Object.keys(all).length;
      for (const v of Object.values(all)) {
        if (typeof v === 'string') idbBytes += v.length * 2;
      }
    } catch (_) {}
    return { count: idbCount, approxKB: Math.round(idbBytes / 1024), hydrated: _hydrated };
  }

  function _getRunnerBase() {
    if (window.WB_AI && typeof window.WB_AI.getRunnerApiBase === 'function') {
      return window.WB_AI.getRunnerApiBase();
    }
    if (location.protocol === 'http:' || location.protocol === 'https:') return '';
    return 'http://127.0.0.1:8765';
  }

  function _deepMergeObj(localObj, remoteObj, depth) {
    if (depth > 4) return localObj;
    const res = { ...remoteObj };
    for (const [k, lv] of Object.entries(localObj)) {
      const rv = remoteObj[k];
      if (lv === true || rv === true) {
        res[k] = true;
      } else if (lv && rv && typeof lv === 'object' && typeof rv === 'object' && !Array.isArray(lv) && !Array.isArray(rv)) {
        res[k] = _deepMergeObj(lv, rv, depth + 1);
      } else if (Array.isArray(lv) && Array.isArray(rv)) {
        res[k] = _unionArrays(lv, rv, null);
      } else if (lv !== undefined && lv !== null && lv !== '') {
        res[k] = lv;
      }
    }
    return res;
  }

  function _unionArrays(a, b, itemStateMap) {
    const seen = new Set();
    const out = [];
    for (const item of [...b, ...a]) {
      const key = _itemKey(item);
      const st = itemStateMap && itemStateMap[key] ? _normEntry(itemStateMap[key]) : null;
      if (st && st.op === 'del') continue;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(item);
      }
    }
    return out;
  }

  function _smartMergeValue(localVal, remoteVal, itemStateMap) {
    if (remoteVal == null) {
      if (itemStateMap && typeof localVal === 'string' && localVal.trim().startsWith('[')) {
        try {
          const arr = JSON.parse(localVal);
          if (Array.isArray(arr)) return JSON.stringify(_unionArrays(arr, [], itemStateMap));
        } catch (_) {}
      }
      return localVal;
    }
    if (localVal == null) {
      if (itemStateMap && typeof remoteVal === 'string' && remoteVal.trim().startsWith('[')) {
        try {
          const arr = JSON.parse(remoteVal);
          if (Array.isArray(arr)) return JSON.stringify(_unionArrays([], arr, itemStateMap));
        } catch (_) {}
      }
      return remoteVal;
    }
    if (localVal === remoteVal && !itemStateMap) return localVal;
    try {
      const a = JSON.parse(localVal);
      const b = JSON.parse(remoteVal);
      if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
        return JSON.stringify(_deepMergeObj(a, b, 0));
      }
      if (Array.isArray(a) && Array.isArray(b)) {
        return JSON.stringify(_unionArrays(a, b, itemStateMap));
      }
    } catch (_) {}
    return localVal.length >= remoteVal.length ? localVal : remoteVal;
  }

  function _mergeDatasetsWithTombstones(localData, remoteData) {
    const localTs = _parseTombstones(localData[TOMBSTONE_KEY]);
    const remoteTs = _parseTombstones(remoteData[TOMBSTONE_KEY]);
    const mergedTs = _mergeTombstones(localTs, remoteTs);

    const allKeys = new Set([...Object.keys(remoteData), ...Object.keys(localData)]);
    const merged = {};
    const deletedKeys = [];

    for (const k of allKeys) {
      if (k === TOMBSTONE_KEY) continue;
      const lv = typeof localData[k] === 'string' ? localData[k] : null;
      const rv = typeof remoteData[k] === 'string' ? remoteData[k] : null;
      const keyState = mergedTs.keys[k] ? _normEntry(mergedTs.keys[k]) : null;
      if (keyState && keyState.op === 'del') {
        if (lv === null || rv === null) {
          deletedKeys.push(k);
          continue;
        }
      }
      const itemStateMap = (mergedTs.items && mergedTs.items[k]) ? mergedTs.items[k] : null;
      const val = _smartMergeValue(lv, rv, itemStateMap);
      if (typeof val === 'string') {
        merged[k] = _redactIfAiKey(k, val);
      }
    }
    merged[TOMBSTONE_KEY] = JSON.stringify(mergedTs);
    return { merged, deletedKeys, tombstones: mergedTs };
  }

  async function syncWithLan() {
    if (_syncInFlight) throw new Error('正在同步中，请稍候...');
    if (location.protocol === 'file:') {
      throw new Error('当前为本地文件直接打开 (file://)，请通过 local_cpp_runner.py 启动后的 http:// 网址打开再同步');
    }
    _syncInFlight = true;
    try {
      const base = _getRunnerBase();
      const getResp = await fetch(`${base}/sync_state`, { method: 'GET', credentials: 'same-origin' });
      if (!getResp.ok) {
        throw new Error(getResp.status === 401 ? '未通过局域网令牌授权，请使用启动终端打印的直连网址打开' : `同步服务响应 HTTP ${getResp.status}`);
      }
      const remoteJson = await getResp.json();
      if (!remoteJson.ok) throw new Error(remoteJson.error || '读取远端同步状态失败');
      const remoteData = (remoteJson.data && typeof remoteJson.data === 'object') ? remoteJson.data : {};
      const localData = await exportAll();

      const { merged, deletedKeys } = _mergeDatasetsWithTombstones(localData, remoteData);

      for (const dk of deletedKeys) {
        await remove(dk);
      }
      // Write back locally while strictly preserving local API keys!
      await importAll(merged, { preserveLocalApiKey: true });

      const postResp = await fetch(`${base}/sync_state`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: merged }),
      });
      if (!postResp.ok) {
        throw new Error(`写入同步状态失败 (HTTP ${postResp.status})`);
      }
      const postJson = await postResp.json();
      if (!postJson.ok) throw new Error(postJson.error || '写入同步状态失败');
      return { ok: true, count: postJson.count || Object.keys(merged).length, updatedAt: postJson.updatedAt || Date.now() };
    } finally {
      _syncInFlight = false;
    }
  }

  _installStorageProxy();

  window.WB_STORE = {
    DB_NAME,
    TOMBSTONE_KEY,
    get,
    set,
    remove,
    clearAll,
    hydrateToMemory,
    exportAll,
    importAll,
    syncFromLocalStorage,
    safeSetItem,
    getStats,
    syncWithLan,
    getTombstones: _readLocalTombstones,
    _mergeDatasetsWithTombstones,
  };

  // Immediately hydrate IndexedDB into memory so quota-overflowed keys are readable
  hydrateToMemory().then(() => {
    const runIdleSync = () => { syncFromLocalStorage().catch(() => {}); };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(runIdleSync, { timeout: 3000 });
    } else {
      setTimeout(runIdleSync, 1200);
    }
  }).catch(() => {});
})();
