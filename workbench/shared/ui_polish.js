/* ============================================================================
 * WORKBENCH SHELL CONTROLLER (Unified Architecture · All 15 Pages)
 * 6 cohesive modules: Theme, Particles, Topbar Menu, Mobile Dock, A11y, Back.
 * ============================================================================ */
(function () {
  if (window.__wbShellInited) return;
  window.__wbShellInited = true;


  /* === R14 Step 3 · Lightweight Event Bus & Declarative Action Delegation (file:// safe) === */
  const WB_BUS = (function () {
    const _actions = new Map();
    function on(eventName, handler) {
      if (typeof window !== 'undefined' && typeof handler === 'function') {
        window.addEventListener(eventName, handler);
      }
    }
    function off(eventName, handler) {
      if (typeof window !== 'undefined' && typeof handler === 'function') {
        window.removeEventListener(eventName, handler);
      }
    }
    function emit(eventName, detail) {
      if (typeof window !== 'undefined' && typeof CustomEvent === 'function') {
        try { window.dispatchEvent(new CustomEvent(eventName, { detail: detail || {} })); } catch (_) {}
      }
    }
    function registerAction(name, fn) {
      if (typeof name === 'string' && typeof fn === 'function') _actions.set(name, fn);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('click', (e) => {
        const target = e.target && e.target.closest ? e.target.closest('[data-wb-action]') : null;
        if (!target) return;
        const name = target.getAttribute('data-wb-action');
        const fn = _actions.get(name);
        if (fn) fn(target, e);
      });
    }
    return { on, off, emit, registerAction };
  })();
  if (typeof window !== 'undefined' && !window.WB_BUS) window.WB_BUS = WB_BUS;

  const STORAGE = {
    theme: 'wb_theme_v1',
    particles: 'wb_particles_v1',
  };

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function safeSet(key, val) {
    try { localStorage.setItem(key, val); } catch (_) {}
  }

  /* ------------------------------------------------------------------------
   * 1. ThemeController · Global Light/Dark Sync across all 15 pages
   * ------------------------------------------------------------------------ */
  const ThemeController = {
    init() {
      const saved = safeGet(STORAGE.theme);
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.setAttribute('data-theme', saved);
      }
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE.theme && (e.newValue === 'dark' || e.newValue === 'light')) {
          document.documentElement.setAttribute('data-theme', e.newValue);
          if (typeof TypographyPrefsController !== 'undefined') TypographyPrefsController.syncMenuState();
        }
      });
      const tb = document.getElementById('themeBtn') || document.getElementById('btn-toggle-theme');
      if (tb) {
        tb.addEventListener('click', () => {
          setTimeout(() => {
            if (typeof TypographyPrefsController !== 'undefined') {
              const curTheme = document.documentElement.getAttribute('data-theme');
              const curPaper = curTheme === 'dark'
                ? 'dark'
                : (document.documentElement.getAttribute('data-read-paper') === 'sepia' ? 'sepia' : 'default');
              const prefs = TypographyPrefsController.load();
              prefs.paper = curPaper;
              try { localStorage.setItem(TypographyPrefsController.KEY, JSON.stringify(prefs)); } catch (_) {}
              TypographyPrefsController.syncMenuState();
            }
          }, 0);
        });
      }
    },
    apply(mode) {
      const m = mode === 'dark' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', m);
      safeSet(STORAGE.theme, m);
      if (typeof TypographyPrefsController !== 'undefined') {
        const curPaper = m === 'dark'
          ? 'dark'
          : (document.documentElement.getAttribute('data-read-paper') === 'sepia' ? 'sepia' : 'default');
        const prefs = TypographyPrefsController.load();
        if (prefs.paper !== curPaper) {
          prefs.paper = curPaper;
          try { localStorage.setItem(TypographyPrefsController.KEY, JSON.stringify(prefs)); } catch (_) {}
          TypographyPrefsController.syncMenuState();
        }
      }
    },
    toggle() {
      const btn = document.getElementById('themeBtn') || document.getElementById('btn-toggle-theme');
      if (btn) {
        btn.click();
        return;
      }
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      safeSet(STORAGE.theme, next);
    },
  };

  /* ------------------------------------------------------------------------
   * 2. ParticleController · Global Background Particle Persistence
   * ------------------------------------------------------------------------ */
  const ParticleController = {
    isOff() {
      return safeGet(STORAGE.particles) === 'off';
    },
    apply(off) {
      if (off) document.documentElement.setAttribute('data-particles', 'off');
      else document.documentElement.removeAttribute('data-particles');
      const pc = document.getElementById('particle-canvas');
      if (pc) pc.style.display = off ? 'none' : '';
      safeSet(STORAGE.particles, off ? 'off' : 'on');
    },
    init() {
      if (this.isOff()) this.apply(true);
    },
    label() {
      return this.isOff() ? '✨ 背景粒子：关' : '✨ 背景粒子：开';
    },
    bindButton(btnEl) {
      btnEl.textContent = this.label();
      btnEl.onclick = null;
      btnEl.addEventListener('click', () => {
        const nextOff = !this.isOff();
        this.apply(nextOff);
        btnEl.textContent = this.label();
      });
    },
  };

  /* ------------------------------------------------------------------------
   * 3. TopbarMenuController · Unified "工具与视图 ▾" Portaled Dropdown
   * ------------------------------------------------------------------------ */
  const TopbarMenuController = {
    init() {
      const right = document.querySelector('.topbar-right');
      if (!right || right.querySelector('.wb-more-wrap')) return;

      const children = Array.from(right.children);
      if (children.length <= 4) return;

      const keepIds = new Set(['topHomeBtn', 'themeBtn', 'r14-focus-btn', 'btn-toggle-theme', 'global-search']);
      const keepText = new Set(['总览', 'AI 助教', '外观', '主题']);

      const toMove = children.filter((el) => {
        const id = el.id || '';
        const txt = (el.textContent || '').trim();
        return !(keepIds.has(id) || keepText.has(txt) || el.querySelector('input'));
      });
      if (toMove.length < 2) return;

      // Add 1-tap Mastery Lab entry inside 工具与视图 menu (eliminates mobile floating FAB obstruction)
      if (!toMove.some((el) => /大师实验室/.test(el.textContent || ''))) {
        const mBtn = document.createElement('button');
        mBtn.type = 'button';
        mBtn.className = 'btn';
        mBtn.textContent = '⚡ 大师闭环实验室';
        mBtn.addEventListener('click', () => {
          const fab = document.getElementById('wb-mastery-fab');
          if (fab) fab.click();
        });
        toMove.push(mBtn);
      }
      // Ensure every subject workbench has a unified 1-tap Particle toggle inside the menu
      // (Theme switching lives cleanly in the Readest 护眼底色 segmented control: 素白 / 暖纸 / 暗夜)
      const existingParticleBtn = toMove.find((el) => /粒子/.test(el.textContent || ''));
      if (existingParticleBtn) {
        ParticleController.bindButton(existingParticleBtn);
      } else {
        const pBtn = document.createElement('button');
        pBtn.type = 'button';
        pBtn.className = 'btn';
        pBtn.id = 'wbGlobalParticleBtn';
        ParticleController.bindButton(pBtn);
        toMove.push(pBtn);
      }
      if (window.__WB_CONFIG__ && !document.getElementById('wbOfflineCacheBtn')) {
        toMove.push(OfflinePrecacheController.buildButton());
      }

      const wrap = document.createElement('div');
      wrap.className = 'wb-more-wrap';

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'btn';
      trigger.style.cssText = 'height:30px;padding:0 12px;';
      trigger.textContent = '工具与视图 ▾';
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');

      const menu = document.createElement('div');
      menu.className = 'wb-more-menu';
      menu.setAttribute('role', 'menu');

      const close = () => {
        wrap.classList.remove('open');
        menu.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      };

      const position = () => {
        const r = trigger.getBoundingClientRect();
        const mw = Math.min(240, window.innerWidth - 20);
        menu.style.width = mw + 'px';
        const left = Math.max(10, Math.min(r.left, window.innerWidth - mw - 10));
        menu.style.top = Math.round(r.bottom + 8) + 'px';
        menu.style.left = Math.round(left) + 'px';
        const bottomReserve = window.innerWidth <= 768 ? 84 : 20;
        menu.style.maxHeight = Math.max(180, Math.floor(window.innerHeight - r.bottom - bottomReserve)) + 'px';
      };

      const viewsGroup = [];
      const labsGroup = [];
      const sysGroup = [];
      toMove.forEach((el) => {
        el.setAttribute('role', 'menuitem');
        if (el.id !== 'wbOfflineCacheBtn') el.addEventListener('click', close);
        const txt = (el.textContent || '').trim();
        if (el.id === 'wbGlobalParticleBtn' || el.id === 'wbOfflineCacheBtn' || /粒子|离线缓存/.test(txt)) {
          sysGroup.push(el);
        } else if (el.id === 'treeTopBtn' || /知识树|算法树|教材|路线|词典/.test(txt)) {
          viewsGroup.push(el);
        } else {
          labsGroup.push(el);
        }
      });
      const addSection = (title, list) => {
        if (!list.length) return;
        const lbl = document.createElement('div');
        lbl.className = 'wb-menu-group-label';
        lbl.textContent = title;
        menu.appendChild(lbl);
        list.forEach((el) => menu.appendChild(el));
      };
      addSection('学习视图', viewsGroup);
      addSection('实验室与工具', labsGroup);
      const prefLbl = document.createElement('div');
      prefLbl.className = 'wb-menu-group-label';
      prefLbl.textContent = '阅读与系统';
      menu.appendChild(prefLbl);
      menu.appendChild(TypographyPrefsController.buildMenuWidget());
      sysGroup.forEach((el) => menu.appendChild(el));

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (menu.classList.contains('open')) {
          close();
        } else {
          position();
          wrap.classList.add('open');
          menu.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target) && !menu.contains(e.target)) close();
      });
      window.addEventListener('resize', () => {
        if (menu.classList.contains('open')) position();
      });

      wrap.appendChild(trigger);
      document.body.appendChild(menu);

      const themeBtn = document.getElementById('themeBtn') || document.getElementById('btn-toggle-theme');
      if (themeBtn && themeBtn.parentNode === right) right.insertBefore(wrap, themeBtn);
      else right.appendChild(wrap);
      const topbarEl = right.closest('header.topbar, .topbar');
      if (topbarEl) topbarEl.classList.add('wb-has-more-menu');
    },
  };

  /* ------------------------------------------------------------------------
   * 4. MobileDockController · Unified Bottom Dock & Active View Sync
   * ------------------------------------------------------------------------ */
  const MobileDockController = {
    _currentView: 'home',
    _bar: null,
    _isPortal: false,
    setActive(key) {
      if (!this._bar) return;
      this._bar.querySelectorAll('.wb-mtab').forEach((b) => {
        b.classList.toggle('active', b.dataset.tabKey === key);
      });
    },
    syncFromView(viewOverride) {
      if (!this._bar) return;
      if (this._isPortal) {
        const y = window.scrollY || 0;
        this.setActive(y > 260 ? 'subjects' : 'home');
        return;
      }
      const v = viewOverride || this._currentView || 'home';
      const targetKey = (v === 'tree' || v === 'algo_tree') ? 'tree' : (v === 'home' ? 'home' : 'toc');
      this.setActive(targetKey);
    },
    init() {
      if (document.getElementById('wbMobileTabbar')) return;
      const isPortal = !window.__WB_CONFIG__;
      this._isPortal = isPortal;

      const bar = document.createElement('nav');
      bar.id = 'wbMobileTabbar';
      bar.setAttribute('aria-label', '移动端快捷导航');

      const items = isPortal
        ? [
            { key: 'home', ico: '🏠', label: '门户', fn: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
            { key: 'subjects', ico: '🧭', label: '学科', fn: () => { const g = document.querySelector('.wb-grid, #portalGrid, #portalMain .grid, main'); if (g) g.scrollIntoView({ behavior: 'smooth' }); } },
            { key: 'search', ico: '🔍', label: '搜索', fn: () => { const s = document.getElementById('globalHubSearchInput') || document.querySelector('input[type="search"]'); if (s) { s.scrollIntoView({ behavior: 'smooth', block: 'center' }); s.focus(); } } },
            { key: 'ai', ico: '✨', label: 'AI助教', fn: () => { const b = document.querySelector('.stem-ai-btn'); if (b) b.click(); } },
            { key: 'wrong', ico: '📕', label: '错题本', fn: () => { const b = document.getElementById('wbHubWrongBtn'); if (b) b.click(); } },
          ]
        : [
            { key: 'home', ico: '🏠', label: '总览', fn: () => { if (typeof window.renderHome === 'function') window.renderHome(); } },
            { key: 'toc', ico: '📑', label: '目录', fn: () => { document.getElementById('toggleSidebar')?.click(); } },
            { key: 'tree', ico: '🌳', label: '知识树', fn: () => { if (typeof window.renderAlgoTree === 'function') window.renderAlgoTree(); } },
            { key: 'dict', ico: '📖', label: '词典', fn: () => { if (typeof window.openDictModal === 'function') window.openDictModal(); } },
            { key: 'ai', ico: '🤖', label: 'AI助教', fn: () => { if (typeof window.toggleAiDrawer === 'function') window.toggleAiDrawer(); } },
          ];

      items.forEach((it, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wb-mtab' + (idx === 0 ? ' active' : '');
        btn.dataset.tabKey = it.key || String(idx);
        btn.innerHTML = `<span class="ico">${it.ico}</span><span>${it.label}</span>`;
        btn.addEventListener('click', () => {
          bar.querySelectorAll('.wb-mtab').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          try { it.fn(); } catch (_) {}
        });
        bar.appendChild(btn);
      });
      document.body.appendChild(bar);
      this._bar = bar;
      if (!isPortal) {
        window.addEventListener('wb:viewchange', (ev) => {
          const v = (ev && ev.detail && ev.detail.view) || 'home';
          this._currentView = v;
          this.syncFromView(v);
        });
        window.addEventListener('hashchange', () => {
          const h = (location.hash || '').replace(/^#/, '');
          const v = h.startsWith('view=') ? h.split('=')[1].split('&')[0] : (h ? 'doc' : 'home');
          this._currentView = v;
          this.syncFromView(v);
        });
      }
    },
  };

  /* ------------------------------------------------------------------------
   * 5. A11yShortcutController · Keyboard Navigation & Quick Search (/)
   * ------------------------------------------------------------------------ */
  const A11yShortcutController = {
    enhanceCards(root) {
      const scope = root || document;
      scope.querySelectorAll('.doc-card, .wb-card, .stage-card, .prob-card, .card[onclick], .ex-row[onclick]').forEach((el) => {
        if (el.tagName === 'A' || el.tagName === 'BUTTON') return;
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
        if (!el.dataset.wbKeyBound) {
          el.dataset.wbKeyBound = '1';
          el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              el.click();
            }
          });
        }
      });
    },
    initShortcuts() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.querySelectorAll('.wb-more-wrap.open, body > .wb-more-menu.open').forEach((el) => el.classList.remove('open'));
        }
        if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const tag = (document.activeElement && document.activeElement.tagName) || '';
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
          const si = document.getElementById('searchInput') || document.getElementById('globalHubSearchInput') || document.getElementById('global-search');
          if (si) {
            e.preventDefault();
            si.focus();
          }
        }
      });
    },
  };

  /* ------------------------------------------------------------------------
   * 6. AndroidBackController · Capacitor Edge-Swipe Back Priority Handler
   * ------------------------------------------------------------------------ */
  window.toggleZenMode = function (force) {
    const on = typeof force === 'boolean' ? force : !document.body.classList.contains('zen-mode');
    document.body.classList.toggle('zen-mode', on);
    if (on) {
      document.querySelectorAll('details.reader-more-details[open]').forEach((d) => { d.open = false; });
      if (window.innerWidth <= 900 && typeof window.setSidebarOpen === 'function') window.setSidebarOpen(false);
    }
    let btn = document.getElementById('wbZenExitBtn');
    if (on && !btn) {
      btn = document.createElement('button');
      btn.id = 'wbZenExitBtn';
      btn.type = 'button';
      btn.textContent = '退出专注 (Esc)';
      btn.addEventListener('click', () => window.toggleZenMode(false));
      document.body.appendChild(btn);
    }
    return on;
  };

  window.__wbHandleAndroidBack = function () {
    if (document.body.classList.contains('zen-mode')) {
      window.toggleZenMode(false);
      return true;
    }
    const closeSelectors = [
      'body > .wb-more-menu.open',
      '#wb-mastery-drawer.open',
      '#aiDrawer.open',
      '#extModalBackdrop.open',
      '.stem-overlay.open',
      '#aiFeedOverlay.open',
      '#vizSidebar.open',
      '#noteDrawer.open',
      '#dict-drawer.open',
    ];
    for (const sel of closeSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        if (sel === '#aiDrawer.open' && typeof window.toggleAiDrawer === 'function') {
          window.toggleAiDrawer(false);
        } else if (sel === '#vizSidebar.open' && typeof window.toggleVizSidebar === 'function') {
          window.toggleVizSidebar(false);
        } else if (sel === '#extModalBackdrop.open' && typeof window.closeExtModal === 'function') {
          window.closeExtModal();
        } else if ((sel === '#sidebar.open' || sel === '.sidebar.open') && typeof window.setSidebarOpen === 'function') {
          window.setSidebarOpen(false);
        } else {
          el.classList.remove('open');
        }
        if (sel === 'body > .wb-more-menu.open') {
          document.querySelectorAll('.wb-more-wrap.open').forEach((w) => w.classList.remove('open'));
        }
        MobileDockController.syncFromView();
        return true;
      }
    }
    if (window.innerWidth <= 900) {
      const sb = document.getElementById('sidebar') || document.querySelector('aside.sidebar, .sidebar');
      if (sb && (!sb.classList.contains('collapsed') || sb.getBoundingClientRect().right > 20)) {
        if (typeof window.setSidebarOpen === 'function') window.setSidebarOpen(false);
        else { sb.classList.remove('open'); sb.classList.add('collapsed'); }
        MobileDockController.syncFromView();
        return true;
      }
    }
    const calcLab = document.getElementById('wbCalcLabModal');
    if (calcLab && calcLab.style.display && calcLab.style.display !== 'none') {
      calcLab.style.display = 'none'; calcLab.classList.remove('open');
      MobileDockController.syncFromView();
      return true;
    }
    const c4Ov = document.getElementById('c4OverlayModal');
    if (c4Ov && c4Ov.style.display && c4Ov.style.display !== 'none') {
      c4Ov.style.display = 'none';
      MobileDockController.syncFromView();
      return true;
    }
    return false;
  };

  /* Unified Back Navigation: Overlay -> In-page History (__wbNavDepth > 0) -> Subject Home -> Portal */
  window.wbGoBack = function () {
    if (typeof window.__wbHandleAndroidBack === 'function' && window.__wbHandleAndroidBack()) {
      return true;
    }
    if (!window.__WB_CONFIG__) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    const hash = (location.hash || '').replace(/^#/, '');
    const inSubView = (hash && hash !== 'view=home') || (MobileDockController._currentView && MobileDockController._currentView !== 'home');
    if (inSubView) {
      const st = window.history && window.history.state;
      const canPopInPage = (st && st.__wb === 'stem' && typeof st.navIdx === 'number')
        ? st.navIdx > 0
        : (window.__wbNavDepth || 0) > 0;
      if (canPopInPage && window.history && window.history.length > 1) {
        window.history.back();
      } else if (typeof window.renderHome === 'function') {
        window.renderHome();
      }
      return true;
    }
    window.location.href = 'index.html';
    return true;
  };

  if (!window.__wbEscBound) {
    window.__wbEscBound = true;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && typeof window.__wbHandleAndroidBack === 'function') {
        if (window.__wbHandleAndroidBack()) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }
    }, true);
  }

  /* ------------------------------------------------------------------------
   * Boot Sequence
   * ------------------------------------------------------------------------ */
  const ReadingProgressController = {
    init() {
      // Reuse subject page native #readProgress (driven by workbench_engine.js) to avoid duplicate bars & listeners
      if (document.getElementById('readProgress') || document.getElementById('wbReadProgress')) return;
      const bar = document.createElement('div');
      bar.id = 'wbReadProgress';
      document.body.appendChild(bar);
      const update = () => {
        const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const pct = Math.min(100, Math.max(0, (window.scrollY / docH) * 100));
        bar.style.width = pct.toFixed(1) + '%';
      };
      window.addEventListener('scroll', update, { passive: true });
      update();
    },
  };



  /* ------------------------------------------------------------------------
   * 7. OverlayManager · VitePress/Vaul-Inspired Single-Overlay Mutex & Scroll Lock
   * ------------------------------------------------------------------------ */

  /* ------------------------------------------------------------------------
   * 8. TypographyPrefsController · Readest-Inspired Aa Font/Spacing/Paper Prefs
   * ------------------------------------------------------------------------ */
  const TypographyPrefsController = {
    KEY: 'wb_read_prefs_v1',
    FS_MAP: { sm: '14.5px', md: '15.5px', lg: '17px' },
    LH_MAP: { compact: '1.62', comfort: '1.78', airy: '1.96' },
    load() {
      try {
        const p = JSON.parse(localStorage.getItem(this.KEY) || '{}') || {};
        return { fs: p.fs || 'md', lh: p.lh || 'comfort', paper: p.paper || 'default' };
      } catch {
        return { fs: 'md', lh: 'comfort', paper: 'default' };
      }
    },
    apply(prefs) {
      const p = Object.assign(this.load(), prefs || {});
      try { localStorage.setItem(this.KEY, JSON.stringify(p)); } catch {}
      document.documentElement.style.setProperty('--wb-read-fs', this.FS_MAP[p.fs] || '15.5px');
      document.documentElement.style.setProperty('--wb-read-lh', this.LH_MAP[p.lh] || '1.78');
      if (prefs && Object.prototype.hasOwnProperty.call(prefs, 'paper')) {
        if (p.paper === 'sepia') {
          document.documentElement.setAttribute('data-read-paper', 'sepia');
          ThemeController.apply('light');
        } else if (p.paper === 'dark') {
          document.documentElement.removeAttribute('data-read-paper');
          ThemeController.apply('dark');
        } else {
          document.documentElement.removeAttribute('data-read-paper');
          ThemeController.apply('light');
        }
      }
      this.syncMenuState();
    },
    init() {
      const p = this.load();
      document.documentElement.style.setProperty('--wb-read-fs', this.FS_MAP[p.fs] || '15.5px');
      document.documentElement.style.setProperty('--wb-read-lh', this.LH_MAP[p.lh] || '1.78');
      if (p.paper === 'sepia' && document.documentElement.getAttribute('data-theme') !== 'dark') {
        document.documentElement.setAttribute('data-read-paper', 'sepia');
      }
    },
    syncMenuState() {
      const p = this.load();
      const curPaper = document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'dark'
        : (document.documentElement.getAttribute('data-read-paper') === 'sepia' ? 'sepia' : 'default');
      document.querySelectorAll('.wb-aa-panel button[data-aa-k]').forEach((b) => {
        const k = b.getAttribute('data-aa-k');
        const v = b.getAttribute('data-aa-v');
        const active = (k === 'fs' && p.fs === v) || (k === 'lh' && p.lh === v) || (k === 'paper' && curPaper === v);
        b.classList.toggle('active', active);
      });
    },
    buildMenuWidget() {
      const box = document.createElement('div');
      box.className = 'wb-aa-panel';
      box.innerHTML = `
        <div class="wb-aa-row">
          <span>Aa 字号</span>
          <div class="wb-aa-seg">
            <button type="button" data-aa-k="fs" data-aa-v="sm">小</button>
            <button type="button" data-aa-k="fs" data-aa-v="md">中</button>
            <button type="button" data-aa-k="fs" data-aa-v="lg">大</button>
          </div>
        </div>
        <div class="wb-aa-row">
          <span>行距</span>
          <div class="wb-aa-seg">
            <button type="button" data-aa-k="lh" data-aa-v="compact">紧</button>
            <button type="button" data-aa-k="lh" data-aa-v="comfort">适</button>
            <button type="button" data-aa-k="lh" data-aa-v="airy">宽</button>
          </div>
        </div>
        <div class="wb-aa-row">
          <span>护眼底色</span>
          <div class="wb-aa-seg">
            <button type="button" data-aa-k="paper" data-aa-v="default">素白</button>
            <button type="button" data-aa-k="paper" data-aa-v="sepia">暖纸</button>
            <button type="button" data-aa-k="paper" data-aa-v="dark">暗夜</button>
          </div>
        </div>
      `;
      box.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-aa-k]');
        if (!btn) return;
        e.stopPropagation();
        const k = btn.getAttribute('data-aa-k');
        const v = btn.getAttribute('data-aa-v');
        this.apply({ [k]: v });
      });
      setTimeout(() => this.syncMenuState(), 0);
      return box;
    },
  };

  const OverlayManager = {
    _lastOpen: null,
    _focusTrigger: null,
    _activeDialogEl: null,
    _focusableSelector: 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    _syncFocusTrap(panels) {
      const dialogIds = new Set(['extModalBackdrop', 'aiDrawer', 'wb-mastery-drawer', 'aiFeedOverlay', 'dict-drawer', 'wbCalcLabModal', 'c4OverlayModal']);
      const isDialogPanel = (p) => dialogIds.has(p.id) || p.id.startsWith('stem-overlay') || (p.el && p.el.classList && p.el.classList.contains('stem-overlay'));
      const dialogPanels = panels.filter(isDialogPanel);
      const openDialogs = dialogPanels.filter((p) => p.open);
      const topPanel = openDialogs.length ? openDialogs[openDialogs.length - 1] : null;
      const topEl = topPanel ? topPanel.el : null;

      // Always strip stale aria-modal from every dialog except the single active topEl
      dialogPanels.forEach((p) => {
        if (p.el && p.el !== topEl && p.el.hasAttribute('aria-modal')) {
          p.el.removeAttribute('aria-modal');
        }
      });
      if (this._activeDialogEl && this._activeDialogEl !== topEl) {
        this._activeDialogEl.removeAttribute('aria-modal');
      }

      if (topEl) {
        if (!topEl.getAttribute('role')) topEl.setAttribute('role', 'dialog');
        topEl.setAttribute('aria-modal', 'true');
        if (this._activeDialogEl !== topEl) {
          if (!this._activeDialogEl && document.activeElement && document.activeElement !== document.body) {
            this._focusTrigger = document.activeElement;
          }
          this._activeDialogEl = topEl;
          if (!topEl.contains(document.activeElement)) {
            const first = topEl.querySelector(this._focusableSelector);
            if (first && typeof first.focus === 'function') {
              try { first.focus({ preventScroll: true }); } catch (_) {}
            } else {
              if (!topEl.hasAttribute('tabindex')) topEl.setAttribute('tabindex', '-1');
              try { topEl.focus({ preventScroll: true }); } catch (_) {}
            }
          }
        }
      } else if (this._activeDialogEl) {
        this._activeDialogEl = null;
        const trig = this._focusTrigger;
        this._focusTrigger = null;
        if (trig && document.contains(trig) && typeof trig.focus === 'function') {
          try { trig.focus({ preventScroll: true }); } catch (_) {}
        }
      }
    },
    _panels() {
      const list = [];
      const sb = document.getElementById('sidebar');
      if (sb) {
        const isOpen = window.innerWidth <= 900
          ? (sb.classList.contains('open') || (!sb.classList.contains('collapsed') && sb.getBoundingClientRect().right > 20))
          : false;
        list.push({
          id: 'sidebar',
          el: sb,
          open: isOpen,
          close: () => {
            if (typeof window.setSidebarOpen === 'function') window.setSidebarOpen(false);
            else { sb.classList.remove('open'); sb.classList.add('collapsed'); }
          },
        });
      }
      const viz = document.getElementById('vizSidebar');
      if (viz) {
        list.push({
          id: 'vizSidebar',
          el: viz,
          open: viz.classList.contains('open'),
          close: () => {
            if (typeof window.toggleVizSidebar === 'function') window.toggleVizSidebar(false);
            else viz.classList.remove('open');
          },
        });
      }
      const aiDrawer = document.getElementById('aiDrawer');
      if (aiDrawer) {
        list.push({
          id: 'aiDrawer',
          el: aiDrawer,
          open: aiDrawer.classList.contains('open'),
          close: () => {
            if (typeof window.toggleAiDrawer === 'function') window.toggleAiDrawer(false);
            else aiDrawer.classList.remove('open');
          },
        });
      }
      const extModal = document.getElementById('extModalBackdrop');
      if (extModal) {
        list.push({
          id: 'extModalBackdrop',
          el: extModal,
          open: extModal.classList.contains('open'),
          close: () => {
            if (typeof window.closeExtModal === 'function') window.closeExtModal();
            else extModal.classList.remove('open');
          },
        });
      }
      document.querySelectorAll('.stem-overlay').forEach((el, idx) => {
        list.push({
          id: el.id || ('stem-overlay-' + idx),
          el,
          open: el.classList.contains('open'),
          close: () => el.classList.remove('open'),
        });
      });
      const mastery = document.getElementById('wb-mastery-drawer');
      if (mastery) {
        list.push({
          id: 'wb-mastery-drawer',
          el: mastery,
          open: mastery.classList.contains('open'),
          close: () => mastery.classList.remove('open'),
        });
      }
      const aiFeed = document.getElementById('aiFeedOverlay');
      if (aiFeed) {
        list.push({
          id: 'aiFeedOverlay',
          el: aiFeed,
          open: aiFeed.classList.contains('open'),
          close: () => aiFeed.classList.remove('open'),
        });
      }
      const dictDrawer = document.getElementById('dict-drawer');
      if (dictDrawer) {
        list.push({
          id: 'dict-drawer',
          el: dictDrawer,
          open: dictDrawer.classList.contains('open'),
          close: () => dictDrawer.classList.remove('open'),
        });
      }
      const calcLab = document.getElementById('wbCalcLabModal');
      if (calcLab) {
        const isCalcOpen = !!(calcLab.classList.contains('open') || (calcLab.style.display && calcLab.style.display !== 'none'));
        list.push({
          id: 'wbCalcLabModal',
          el: calcLab,
          open: isCalcOpen,
          close: () => { calcLab.style.display = 'none'; calcLab.classList.remove('open'); },
        });
      }
      const c4Ov = document.getElementById('c4OverlayModal');
      if (c4Ov) {
        const isC4Open = !!(c4Ov.classList.contains('open') || (c4Ov.style.display && c4Ov.style.display !== 'none'));
        list.push({
          id: 'c4OverlayModal',
          el: c4Ov,
          open: isC4Open,
          close: () => { c4Ov.style.display = 'none'; c4Ov.classList.remove('open'); },
        });
      }
      return list;
    },
    sync() {
      const prevOpen = this._lastOpen;
      const panels = this._panels();
      if (window.innerWidth > 768) {
        document.documentElement.removeAttribute('data-wb-overlay-open');
        this._lastOpen = null;
        this._syncFocusTrap(panels);
        return;
      }
      const opened = panels.filter((p) => p.open);
      if (opened.length > 1) {
        // Keep the newest opened overlay; close older conflicting drawers
        const keep = opened.find((p) => p.id !== this._lastOpen) || opened[opened.length - 1];
        opened.forEach((p) => {
          if (p.id !== keep.id) {
            p.close();
            p.open = false;
          }
        });
        this._lastOpen = keep.id;
      } else {
        this._lastOpen = opened.length === 1 ? opened[0].id : null;
      }
      this._syncFocusTrap(panels);
      if (this._lastOpen) {
        document.documentElement.setAttribute('data-wb-overlay-open', '1');
        if (this._lastOpen === 'aiDrawer') MobileDockController.setActive('ai');
        else if (this._lastOpen === 'sidebar') MobileDockController.setActive('toc');
      } else {
        document.documentElement.removeAttribute('data-wb-overlay-open');
        if (prevOpen) MobileDockController.syncFromView();
      }
    },
    init() {
      this.sync();
      if (typeof MutationObserver !== 'undefined' && document.body) {
        let t = null;
        const schedule = () => {
          if (t) clearTimeout(t);
          t = setTimeout(() => this.sync(), 40);
        };
        const watched = new WeakSet();
        const attrObs = new MutationObserver(schedule);
        const OVERLAY_SELS = '#sidebar, .sidebar, #vizSidebar, #aiDrawer, #extModalBackdrop, #wb-mastery-drawer, #aiFeedOverlay, .stem-overlay, #noteDrawer, #dict-drawer, #wbCalcLabModal, #c4OverlayModal';
        const attachAll = () => {
          document.querySelectorAll(OVERLAY_SELS).forEach((el) => {
            if (!watched.has(el)) {
              watched.add(el);
              attrObs.observe(el, { attributes: true, attributeFilter: ['class', 'style'] });
            }
          });
        };
        attachAll();
        new MutationObserver(() => {
          attachAll();
          schedule();
        }).observe(document.body, { childList: true, subtree: false });
      }
      window.addEventListener('resize', () => this.sync(), { passive: true });
      if (!this._tabBound) {
        this._tabBound = true;
        document.addEventListener('keydown', (e) => {
          if (e.key !== 'Tab' || !this._activeDialogEl) return;
          const container = this._activeDialogEl;
          if (!document.contains(container)) { this._activeDialogEl = null; return; }
          const focusables = Array.from(container.querySelectorAll(this._focusableSelector))
            .filter((el) => {
              const cs = typeof getComputedStyle === 'function' ? getComputedStyle(el) : null;
              if (cs && (cs.display === 'none' || cs.visibility === 'hidden')) return false;
              return el.offsetParent !== null || (cs && cs.position === 'fixed');
            });
          if (!focusables.length) {
            e.preventDefault();
            try { container.focus({ preventScroll: true }); } catch (_) {}
            return;
          }
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first || !container.contains(document.activeElement)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last || !container.contains(document.activeElement)) {
              e.preventDefault();
              first.focus();
            }
          }
        }, true);
      }
    },
  };

  const DesktopFabDockController = {
    sync() {
      const mastery = document.getElementById('wb-mastery-fab');
      const feeder = document.getElementById('aiFeedFab');
      const hubWrong = document.getElementById('wbHubWrongBtn');
      const floaters = [mastery, feeder, hubWrong].filter(Boolean);
      if (!floaters.length) return;

      let wrap = document.querySelector('.stem-fab-wrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'stem-fab-wrap';
        document.body.appendChild(wrap);
      }

      // Insert in clean top-to-bottom priority order above existing stem buttons
      const anchor = Array.from(wrap.children).find(
        (el) => el !== mastery && el !== feeder && el !== hubWrong
      ) || null;

      floaters.forEach((el) => {
        el.style.position = '';
        el.style.top = '';
        el.style.right = '';
        el.style.bottom = '';
        el.style.left = '';
        if (el.parentElement !== wrap) {
          wrap.insertBefore(el, anchor);
        }
      });
    },
  };


  /* ------------------------------------------------------------------------
   * 7. QuickBackBarController · Floating Reader Back Breadcrumb (Sub-views)
   * ------------------------------------------------------------------------ */
  const QuickBackBarController = {
    init() {
      if (!window.__WB_CONFIG__ || document.getElementById('wbQuickBackBar')) return;
      const bar = document.createElement('div');
      bar.id = 'wbQuickBackBar';
      bar.setAttribute('role', 'navigation');
      bar.setAttribute('aria-label', '快捷返回导航');
      bar.innerHTML =
        '<button type="button" class="wb-qbb-btn" id="wbQbbBack">← 返回</button>' +
        '<span class="wb-qbb-title" id="wbQbbTitle"></span>' +
        '<button type="button" class="wb-qbb-home" id="wbQbbHome">总览</button>';
      document.body.appendChild(bar);

      bar.querySelector('#wbQbbBack').addEventListener('click', () => {
        if (typeof window.wbGoBack === 'function') window.wbGoBack();
      });
      bar.querySelector('#wbQbbHome').addEventListener('click', () => {
        if (typeof window.renderHome === 'function') window.renderHome();
      });

      const sync = (detail) => {
        const hash = (location.hash || '').replace(/^#/, '');
        const view = (detail && detail.view) || (hash.startsWith('view=') ? hash.split('=')[1].split('&')[0] : (hash ? 'doc' : 'home'));
        const isHome = !view || view === 'home';
        bar.classList.toggle('visible', !isHome);
        if (view === 'doc' || view === 'prob' || view === 'problem') {
          document.documentElement.setAttribute('data-wb-reading', '1');
        } else {
          document.documentElement.removeAttribute('data-wb-reading');
        }
        if (!isHome) {
          setTimeout(() => {
            const h1 = document.querySelector('#main h1, #main h2, .reader-title');
            const labelMap = { roadmap: '80 天学习路线', tree: '知识树', algo_tree: '知识树', problem: '题库精讲', prob: '题库精讲', books: '教材与零基础' };
            const titleText = (h1 && h1.textContent.trim()) || labelMap[view] || '正在阅读';
            const tEl = document.getElementById('wbQbbTitle');
            if (tEl) tEl.textContent = titleText.slice(0, 32);
          }, 60);
        }
      };

      window.addEventListener('wb:viewchange', (ev) => sync(ev.detail));
      window.addEventListener('hashchange', () => sync());
      window.addEventListener('popstate', () => sync());
      sync();
    },
  };


  /* ------------------------------------------------------------------------
   * 8. OfflinePrecacheController · 1-Tap Subject Offline Precache (PWA)
   * ------------------------------------------------------------------------ */
  const OfflinePrecacheController = {
    CACHE_NAME: 'wb-cache-20261120-r14',
    _busy: false,
    _doneKey() {
      const slug = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'portal';
      return 'wb_offline_cached_' + slug;
    },
    isCached() {
      return ('caches' in window) && safeGet(this._doneKey()) === this.CACHE_NAME;
    },
    async verifyRealCache(btnEl) {
      if (!btnEl || !('caches' in window) || !this.isCached()) return;
      try {
        const cache = await caches.open(this.CACHE_NAME);
        const hit = await cache.match(location.pathname || './index.html', { ignoreSearch: true });
        if (!hit) {
          try { localStorage.removeItem(this._doneKey()); } catch (_) {}
          btnEl.textContent = '📥 离线缓存本学科';
        }
      } catch (_) {}
    },
    async run(btnEl) {
      if (this._busy) return;
      if (location.protocol === 'file:') {
        alert('当前为本地文件直接打开 (file://)，资源已在本地磁盘，无需在线预缓存。');
        return;
      }
      if (!('caches' in window)) {
        alert('当前为明文 HTTP 局域网地址，浏览器安全策略会禁用离线 Cache Storage。如需在手机端启用 PWA 离线缓存，请通过 HTTPS 反代、adb reverse 转发至本机 localhost 或使用安卓原生 APK。');
        return;
      }
      this._busy = true;
      const origText = btnEl ? btnEl.textContent : '';
      try {
        const slug = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || '';
        const urls = new Set();
        urls.add(location.pathname || './index.html');
        document.querySelectorAll('script[src], link[rel="stylesheet"][href]').forEach((el) => {
          const raw = el.getAttribute('src') || el.getAttribute('href') || '';
          if (!raw || raw.startsWith('http') || raw.startsWith('data:')) return;
          const clean = raw.split('?')[0].split('#')[0];
          if (clean) urls.add(clean);
        });
        let manifestOk = !slug;
        if (slug) {
          try {
            const mr = await fetch('data/offline_manifest.json', { credentials: 'same-origin' });
            if (mr.ok) {
              const map = await mr.json();
              if (map && Array.isArray(map[slug]) && map[slug].length > 0) {
                map[slug].forEach((u) => urls.add(u));
                manifestOk = true;
              }
            }
          } catch (_) {}
        }
        if (!manifestOk) {
          if (btnEl) btnEl.textContent = origText || '📥 离线缓存本学科';
          alert('无法读取离线分片清单 (data/offline_manifest.json)，请确认本地服务在线后重试。');
          return;
        }
        const list = Array.from(urls);
        const cache = await caches.open(this.CACHE_NAME);
        let okCount = 0;
        for (let i = 0; i < list.length; i++) {
          if (btnEl) btnEl.textContent = `⏳ 缓存中 (${i + 1}/${list.length})...`;
          try {
            const resp = await fetch(list[i], { credentials: 'same-origin' });
            if (resp && resp.ok) {
              await cache.put(list[i], resp.clone());
              okCount++;
            }
          } catch (_) {}
        }
        if (okCount === list.length && list.length > 0) {
          safeSet(this._doneKey(), this.CACHE_NAME);
          if (btnEl) btnEl.textContent = `✓ 已离线缓存 (${okCount} 项)`;
        } else if (okCount > 0) {
          if (btnEl) btnEl.textContent = `⚠️ 已缓存 ${okCount}/${list.length} 项`;
        } else {
          if (btnEl) btnEl.textContent = origText || '📥 离线缓存本学科';
          alert('离线预缓存失败，请确认网络连接正常。');
        }
      } finally {
        this._busy = false;
      }
    },
    buildButton() {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn';
      btn.id = 'wbOfflineCacheBtn';
      if (location.protocol !== 'file:' && !('caches' in window)) {
        btn.textContent = '📥 离线缓存（需 HTTPS/本机）';
        btn.style.opacity = '0.72';
      } else {
        btn.textContent = this.isCached() ? '✓ 本学科已离线缓存' : '📥 离线缓存本学科';
        this.verifyRealCache(btn);
      }
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.run(btn);
      });
      return btn;
    },
  };
  function boot() {
    ThemeController.init();
    TypographyPrefsController.init();
      // Assign subtle subject-family accent palette
      const slug = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || '';
      const groupMap = {
        c4: 'math', la: 'math', prob: 'math', dm: 'math', phys: 'math',
        icpc: 'algo', cpp: 'algo',
        dsos: 'sys', arch: 'sys', net: 'sys', dbse: 'sys', comp: 'sys',
        ai: 'aiquant', quant: 'aiquant',
      };
      if (groupMap[slug]) document.documentElement.setAttribute('data-subject-group', groupMap[slug]);
    ReadingProgressController.init();
    ParticleController.init();
    TopbarMenuController.init();
    MobileDockController.init();
    QuickBackBarController.init();
    DesktopFabDockController.sync();
    OverlayManager.init();
    window.addEventListener('load', () => DesktopFabDockController.sync(), { once: true });
    A11yShortcutController.enhanceCards(document);
    A11yShortcutController.initShortcuts();

    WB_BUS.registerAction('toggle-theme', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      ThemeController.apply(next);
    });
    WB_BUS.registerAction('export-all', () => { if (typeof window.exportAll === 'function') window.exportAll(); });
    WB_BUS.registerAction('import-all', () => { if (typeof window.importAll === 'function') window.importAll(); });
    WB_BUS.registerAction('lan-sync', () => { if (typeof window.syncLanProgress === 'function') window.syncLanProgress(); });

    // Targeted shallow observers & event-driven refresh (zero subtree:true churn on #main)
    WB_BUS.on('wb:viewchange', () => {
      A11yShortcutController.enhanceCards(document.getElementById('main') || document);
      DesktopFabDockController.sync();
    });
    WB_BUS.on('wb:idb-hydrated', () => {
      A11yShortcutController.enhanceCards(document.getElementById('main') || document);
    });
    if (typeof MutationObserver !== 'undefined') {
      const topbarEl = document.querySelector('header.topbar .topbar-right, .topbar .topbar-right, header.topbar, .topbar');
      if (topbarEl) {
        let tbTimer = null;
        new MutationObserver(() => {
          if (tbTimer) clearTimeout(tbTimer);
          tbTimer = setTimeout(() => TopbarMenuController.init(), 120);
        }).observe(topbarEl, { childList: true, subtree: false });
      }
      if (document.body) {
        let fabTimer = null;
        new MutationObserver(() => {
          if (fabTimer) clearTimeout(fabTimer);
          fabTimer = setTimeout(() => DesktopFabDockController.sync(), 150);
        }).observe(document.body, { childList: true, subtree: false });
      }
    }
  }


  /* Register Offline Service Worker cleanly under HTTP/HTTPS */
  if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
    }, { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
