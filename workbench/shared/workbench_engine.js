
(function() {
  try {
    var savedTheme = localStorage.getItem('wb_theme_v1');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  } catch(e) {}
})();


(function() {
  const loadedScripts = new Set();
  const pendingCbs = {};
  window.__wbLoadScript = function(src, cb) {
    if (loadedScripts.has(src)) { if (cb) cb(); return; }
    if (pendingCbs[src]) { if (cb) pendingCbs[src].push(cb); return; }
    pendingCbs[src] = cb ? [cb] : [];
    const s = document.createElement('script');
    s.src = src;
    s.onload = function() {
      loadedScripts.add(src);
      const q = pendingCbs[src] || [];
      delete pendingCbs[src];
      q.forEach(fn => { try { fn(); } catch(e) { console.error(e); } });
    };
    s.onerror = function() {
      const q = pendingCbs[src] || [];
      delete pendingCbs[src];
      q.forEach(fn => { try { fn(); } catch(e) {} });
    };
    document.head.appendChild(s);
  };
  window.__WB_HYDRATE_DOCS__ = function(map) {
    const docs = window.__WB_DOCS__ || [];
    for (let i = 0; i < docs.length; i++) {
      const d = docs[i];
      if (Object.prototype.hasOwnProperty.call(map, d.id)) {
        d.content = map[d.id];
        d._loaded = true;
      }
    }
  };
  window.__WB_HYDRATE_BANK__ = function(map) {
    const bank = window.__WB_BANK__ || [];
    for (let i = 0; i < bank.length; i++) {
      const p = bank[i];
      if (Object.prototype.hasOwnProperty.call(map, p.pid)) {
        Object.assign(p, map[p.pid]);
        p._loaded = true;
      }
    }
  };
})();





const DOCS = window.__WB_DOCS__ || JSON.parse(document.getElementById('docs-data').textContent);
DOCS.forEach(d => {
  if (!Array.isArray(d.pills)) d.pills = [];
  if (typeof d.sub !== "string") d.sub = "";
  if (typeof d.chars !== "number") d.chars = (d.content || "").length;
});
const ROADMAP = window.__WB_ROADMAP__ || JSON.parse(document.getElementById('roadmap-data').textContent);
const PROBLEM_BANK = window.__WB_BANK__ || [];
const MASTERY_KEY = 'icpc_full_mastery_v2';
const STAR_KEY = 'icpc_full_stars_v2';
const NOTE_KEY = 'icpc_full_notes_v2';
const MASTERY_DATE_KEY = 'icpc_full_mastery_dates_v1';
const STATUS_KEY = 'icpc_full_status_v1';
const MYCODE_KEY = 'icpc_full_mycode_v1';

function safeGet(k, def) {
  try { return JSON.parse(localStorage.getItem(k) || def); } catch (e) { return JSON.parse(def); }
}
let mastery = safeGet(MASTERY_KEY, '{}');
let stars = safeGet(STAR_KEY, '{}');
let notes = safeGet(NOTE_KEY, '{}');
let masteryDates = safeGet(MASTERY_DATE_KEY, '{}');
let studyStatus = safeGet(STATUS_KEY, '{}');
let myAcCodes = safeGet(MYCODE_KEY, '{}');
const BANK_DONE_KEY = ((window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc') + '_bank_done_v1';
let bankDone = safeGet(BANK_DONE_KEY, '{}');
let activeId = null;
let activeView = 'home';
var spoilerMode = false;
let activeTab = (window.__WB_CONFIG__ && window.__WB_CONFIG__.activeTab) || 'ALL';
let sbFilter = 'all';
let showLimit = 24;
let particlesEnabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function saveState() {
  try {
    localStorage.setItem(MASTERY_KEY, JSON.stringify(mastery));
    localStorage.setItem(STAR_KEY, JSON.stringify(stars));
    localStorage.setItem(NOTE_KEY, JSON.stringify(notes));
    localStorage.setItem(MASTERY_DATE_KEY, JSON.stringify(masteryDates));
    localStorage.setItem(STATUS_KEY, JSON.stringify(studyStatus));
    localStorage.setItem(MYCODE_KEY, JSON.stringify(myAcCodes));
  } catch (e) {}
}
function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function highlightCpp(code) {
  const tokenRe = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|^\s*#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:int|long|void|bool|char|double|float|const|auto|return|if|else|for|while|do|break|continue|switch|case|default|struct|class|using|namespace|typedef|template|typename|public|private|true|false|nullptr|sizeof|inline|static|unsigned|signed|ll|ull|vector|string|pair|map|unordered_map|set|unordered_set|queue|stack|priority_queue|deque|bitset|array|tuple|min|max|swap|sort|reverse|lower_bound|upper_bound|memset|memcpy|printf|scanf|cin|cout|endl|ios|tie|main|std)\b|\b\d+(?:\.\d+)?(?:LL|ULL|ll|ull)?\b)/gm;
  let out = '';
  let last = 0;
  let m;
  while ((m = tokenRe.exec(code)) !== null) {
    if (m.index > last) out += escapeHtml(code.slice(last, m.index));
    const tok = m[0];
    let cls = 'tok-kw';
    if (tok.startsWith('//') || tok.startsWith('/*')) cls = 'tok-com';
    else if (tok.trimStart().startsWith('#')) cls = 'tok-pre';
    else if (tok.startsWith('"') || tok.startsWith("'")) cls = 'tok-str';
    else if (/^\d/.test(tok)) cls = 'tok-num';
    out += `<span class="${cls}">${escapeHtml(tok)}</span>`;
    last = tokenRe.lastIndex;
  }
  if (last < code.length) out += escapeHtml(code.slice(last));
  return out;
}
function inlineFmt(s) {
  const inlineCodes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    const idx = inlineCodes.length;
    inlineCodes.push(`<code>${escapeHtml(c)}</code>`);
    return `@@INLINECODE_${idx}@@`;
  });
  const mathProtected = [];
  s = s.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, m => {
    const idx = mathProtected.length;
    mathProtected.push(escapeHtml(m));
    return `@@MATHPROT_${idx}@@`;
  });
  s = escapeHtml(s);
  const linkProtected = [];
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, label, url) => {
    const idx = linkProtected.length;
    linkProtected.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    return `@@LINKPROT_${idx}@@`;
  });
  s = s.replace(/https?:\/\/[A-Za-z0-9\-._~:\/?#\[\]@!$&'()+;,=%]+/g, (bareUrl) => {
    const idx = linkProtected.length;
    linkProtected.push(bareUrl);
    return `@@LINKPROT_${idx}@@`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Luogu-style intuitive subscripts/superscripts for bare math in prose (e.g., b_j, V_i, m^n, 10^460, a_{i,j})
  s = s.replace(/\b([A-Za-z]+)_\{([A-Za-z0-9,+\-]+)\}\^\{([A-Za-z0-9,+\-]+)\}/g, '<span class="math-var">$1<sub>$2</sub><sup>$3</sup></span>');
  s = s.replace(/\b([A-Za-z]+)_\{([A-Za-z0-9,+\-]+)\}/g, '<span class="math-var">$1<sub>$2</sub></span>');
  s = s.replace(/\b([A-Za-z]+)\^\{([A-Za-z0-9,+\-]+)\}/g, '<span class="math-var">$1<sup>$2</sup></span>');
  s = s.replace(/\b(\d+)\^\{([A-Za-z0-9,+\-]+)\}/g, '<span class="math-num">$1<sup>$2</sup></span>');
  const _nonMathSubPrefix = /^(?:ex|id|os|db|io|ui|js|py|md|ok|in|to|by|of|on|at|is|if|do|go|no|up|ch|c4)$/i;
  s = s.replace(/\b([A-Za-z]{1,3})_([A-Za-z0-9]{1,3})\b/g, (full, p1, p2) => {
    if (_nonMathSubPrefix.test(p1) || /^0\d+$/.test(p2)) return full;
    return `<span class="math-var">${p1}<sub>${p2}</sub></span>`;
  });
  s = s.replace(/\b([A-Za-z]{1,3})\^([A-Za-z0-9]{1,4})\b/g, '<span class="math-var">$1<sup>$2</sup></span>');
  s = s.replace(/\b(\d+)\^([A-Za-z0-9]{1,4})\b/g, '<span class="math-num">$1<sup>$2</sup></span>');
  s = s.replace(/@@LINKPROT_(\d+)@@/g, (_, idx) => linkProtected[Number(idx)] || '');
  s = s.replace(/@@MATHPROT_(\d+)@@/g, (_, idx) => mathProtected[Number(idx)] || '');
  s = s.replace(/@@INLINECODE_(\d+)@@/g, (_, idx) => inlineCodes[Number(idx)] || '');
  return s;
}
function renderMarkdown(md) {
  const codeBlocks = [];
  md = md.replace(/```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push({ lang: (lang || '').toLowerCase(), code });
    return `@@CODEBLOCK_${idx}@@`;
  });
  const lines = md.split('\n');
  let html = ''; let inList = false; let inOList = false; let inTable = false;
  const closeLists = () => {
    if (inList) { html += '</ul>'; inList = false; }
    if (inOList) { html += '</ol>'; inOList = false; }
  };
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (/^\s*@@CODEBLOCK_(\d+)@@\s*$/.test(line)) {
      closeLists();
      if (inTable) { html += '</tbody></table>'; inTable = false; }
      const idx = parseInt(line.match(/@@CODEBLOCK_(\d+)@@/)[1], 10);
      const blk = codeBlocks[idx];
      const useCpp = !blk.lang || blk.lang === 'cpp' || blk.lang === 'c++' || blk.lang === 'c';
      const codeHtml = useCpp ? highlightCpp(blk.code) : escapeHtml(blk.code);
      const langLabel = blk.lang ? blk.lang.toUpperCase() : 'C++17';
      const runBtnHtml = useCpp ? `<button class="copy-btn" onclick="runCodeBlockInIde(this)" style="margin-right:6px;">▶ 运行</button>` : '';
      html += `<div class="code-wrap"><div class="code-head"><span class="code-lang-badge">CODE · ${escapeHtml(langLabel)}</span><div>${runBtnHtml}<button class="copy-btn" onclick="copyCode(this)">复制代码</button></div></div><pre><code>${codeHtml}</code></pre></div>`;
      continue;
    }
    if (/^\|.+\|$/.test(line.trim())) {
      closeLists();
      const cells = ((row) => {
        const out = [];
        let cur = '', inCode = false, inMath = false;
        for (let k = 0; k < row.length; k++) {
          const ch = row[k];
          if (ch === '\\' && k + 1 < row.length && row[k + 1] === '|') { cur += '|'; k++; continue; }
          if (ch === '`' && !inMath) { inCode = !inCode; cur += ch; continue; }
          if (ch === '$' && !inCode && (k === 0 || row[k - 1] !== '\\')) { inMath = !inMath; cur += ch; continue; }
          if (ch === '|' && !inCode && !inMath) { out.push(cur.trim()); cur = ''; continue; }
          cur += ch;
        }
        out.push(cur.trim());
        return out;
      })(line.trim().slice(1, -1));
      if (cells.every(c => /^[-:]+$/.test(c))) continue;
      if (!inTable) { html += '<table><thead><tr>' + cells.map(c => `<th>${inlineFmt(c)}</th>`).join('') + '</tr></thead><tbody>'; inTable = true; }
      else { html += '<tr>' + cells.map((c, ci) => {
        const _hm = (ci === 0 && window.__WB_CONFIG__ && window.__WB_CONFIG__.slug === 'c4') ? c.trim().match(/^#(\d{1,3})$/) : null;
        if (_hm) {
          const _pid = 'c' + String(_hm[1]).padStart(3, '0');
          return `<td><button type="button" class="btn" style="height:26px;padding:0 8px;font-size:12px;white-space:nowrap;" onclick="openBankProblem('${_pid}')">#${_hm[1]} ↗</button></td>`;
        }
        return `<td>${inlineFmt(c)}</td>`;
      }).join('') + '</tr>'; }
      continue;
    } else if (inTable) { html += '</tbody></table>'; inTable = false; }
    const hm = line.match(/^(#{1,4})\s+(.*)$/);
    if (hm) {
      closeLists();
      const lvl = hm[1].length; const text = hm[2];
      const pid = text.match(/^(S\d+-\d+)/);
      html += `<h${lvl}${pid ? ` id="${pid[1]}"` : ''}>${inlineFmt(text)}</h${lvl}>`;
      continue;
    }
    if (/^---+$/.test(line.trim())) { closeLists(); html += '<hr style="border:none;border-top:1px solid var(--border);margin:28px 0;">'; continue; }
    if (line.startsWith('> ')) { closeLists(); html += `<blockquote>${inlineFmt(line.slice(2))}</blockquote>`; continue; }
    const lm = line.match(/^\s*[-*]\s+(.*)$/);
    if (lm) {
      if (inOList) { html += '</ol>'; inOList = false; }
      if (!inList) { html += '<ul>'; inList = true; }
      const _tm = lm[1].match(/^\[([ xX])\]\s+(.*)$/);
      if (_tm) {
        const _chk = _tm[1].toLowerCase() === 'x' ? 'checked' : '';
        html += `<li class="wb-task-li" style="list-style:none;margin-left:-18px;margin-bottom:6px;"><label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;"><input type="checkbox" ${_chk} style="margin-top:4px;width:15px;height:15px;flex-shrink:0;accent-color:var(--sg-accent,#2563eb);"><span>${inlineFmt(_tm[2])}</span></label></li>`;
      } else {
        html += `<li>${inlineFmt(lm[1])}</li>`;
      }
      continue;
    }
    const olm = line.match(/^\s*\d+\.\s+(.*)$/);
    if (olm) {
      if (inList) { html += '</ul>'; inList = false; }
      if (!inOList) { html += '<ol>'; inOList = true; }
      html += `<li>${inlineFmt(olm[1])}</li>`;
      continue;
    }
    if (line.trim() === '') { closeLists(); continue; }
    closeLists();
    html += `<p>${inlineFmt(line)}</p>`;
  }
  closeLists(); if (inTable) html += '</tbody></table>';
  return html;
}
window.copyCode = function(btn) {
  const wrap = btn.closest('.code-wrap'); const txt = wrap ? wrap.querySelector('pre').innerText : '';
  const done = () => { btn.innerText = '已复制'; setTimeout(() => btn.innerText = '复制代码', 1400); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(done).catch(() => { fallbackCopy(txt); done(); });
  } else { fallbackCopy(txt); done(); }
};
function fallbackCopy(txt) {
  const ta = document.createElement('textarea');
  ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}
function docMatchesQuery(d, q) {
  if (!q) return true;
  if (d.title.toLowerCase().includes(q) || d.sub.toLowerCase().includes(q) || d.group.toLowerCase().includes(q)) return true;
  if (d.pills && d.pills.some(p => (typeof p === "string" ? p : (p && (p.label || p.text) || "")).toLowerCase().includes(q))) return true;
  return (d.content || '').toLowerCase().includes(q);
}
function getFiltered(tabOverride) {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const tab = tabOverride || activeTab;
  return DOCS.filter(d => {
    // Global search: ignore category/status filters when user enters a search query
    if (q) return docMatchesQuery(d, q);
    const matchTab = tab === 'ALL' || (tab === 'STARRED' ? !!stars[d.id] : (d.group === tab || d.sub === tab));
    const matchF = sbFilter === 'all' ? true : (sbFilter === 'doing' ? getDocStatus(d.id)==='doing' : (sbFilter === 'todo' ? !mastery[d.id] : !!(notes[d.id] && notes[d.id].trim())));
    return matchTab && matchF;
  });
}
window.setSbFilter = function(f) { sbFilter = f; renderSidebar(); if (activeView === 'home') renderHome(true); };
function renderSidebar() {
  const sb = document.getElementById('sidebar');
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const _dynGroups = [...new Set(DOCS.map(d => d.group).filter(Boolean))];
  const _cfgGroups = (window.__WB_CONFIG__ && window.__WB_CONFIG__.groups) ? window.__WB_CONFIG__.groups : _dynGroups;
  const groups = [...new Set([..._cfgGroups, ..._dynGroups])];
  const navTopHtml = `<div class="nav-section-title" style="margin-top:4px;">工作台视图</div>
    <button class="nav-item ${activeView==='home'?'active':''}" onclick="renderHome()"><span class="nav-item-text">总览与题库</span><span class="badge">${DOCS.length}</span></button>
    <button class="nav-item ${activeView==='tree'?'active':''}" onclick="renderAlgoTree()"><span class="nav-item-text">${(window.__WB_CONFIG__ && window.__WB_CONFIG__.slug !== "icpc") ? "知识树状图" : "算法树状图"}</span><span class="badge">${PROBLEM_BANK.length}题</span></button>
    <button class="nav-item ${activeView==='roadmap'?'active':''}" onclick="renderRoadmap()"><span class="nav-item-text">80天路线</span><span class="badge">D${roadmapState.currentDay||1}</span></button>
    <button class="nav-item ${vizState.open?'active':''}" onclick="toggleVizSidebar()"><span class="nav-item-text">${(!window.__WB_CONFIG__ || window.__WB_CONFIG__.slug === "icpc") ? "算法可视化" : (window.__WB_CONFIG__.slug === "c4" ? "微积分可视化" : "交互可视化")}</span><span class="badge">${(!window.__WB_CONFIG__ || window.__WB_CONFIG__.slug === "icpc") ? "14类" : (window.__WB_CONFIG__.slug === "c4" ? "8模式" : "实验室")}</span></button>
    <button class="nav-item" onclick="toggleAiDrawer()"><span class="nav-item-text">AI 助教</span><span class="badge">问答</span></button>
    <button class="nav-item" onclick="openCommandPalette()"><span class="nav-item-text">工具箱 ⌘K</span><span class="badge">工具</span></button>`;
  const filterHtml = `<div class="nav-section-title">文档筛选</div><div class="sb-filter-row">
    <button class="sb-filter-btn ${sbFilter==='all'?'active':''}" onclick="setSbFilter('all')">全部</button>
    <button class="sb-filter-btn ${sbFilter==='doing'?'active':''}" onclick="setSbFilter('doing')">学习中</button>
    <button class="sb-filter-btn ${sbFilter==='todo'?'active':''}" onclick="setSbFilter('todo')">未掌握</button>
    <button class="sb-filter-btn ${sbFilter==='notes'?'active':''}" onclick="setSbFilter('notes')">笔记</button>
  </div>`;
  sb.innerHTML = navTopHtml + filterHtml + groups.map(g => {
    const items = DOCS.filter(d => d.group === g && docMatchesQuery(d, q));
    if (!items.length) return '';
    return `<div class="nav-section-title">${g} (${items.length})</div>` + items.map(d => {
      const done = !!mastery[d.id];
      const star = stars[d.id] ? '★ ' : '';
      return `<div class="nav-item ${activeId === d.id ? 'active' : ''}" onclick="openDoc('${d.id}')">
        <span class="nav-item-text" style="margin-right:10px;">${star}${escapeHtml(d.title)}</span>
        <span class="badge ${done ? 'done' : ''}">${done ? '已掌握' : escapeHtml((d.sub || '').split(' ')[0])}</span>
      </div>`;
    }).join('');
  }).join('');
}
window.setTab = function(t) { activeTab = t; showLimit = 24; renderHome(true); };
window.showMore = function() { showLimit += 24; renderHome(true); };
window.clearSearch = function() {
  const inp = document.getElementById('searchInput');
  if (inp) inp.value = '';
  if (activeView === 'home') renderHome(true); else renderSidebar();
};
window.renderHome = function(preserveScroll) {
  const wasHome = (activeView === "home");
  const savedY = (preserveScroll && wasHome) ? (window.scrollY || 0) : 0;
  if (!preserveScroll) triggerMainAnim();
  activeView = 'home';
  activeId = null;
  renderSidebar();
  const q = document.getElementById('searchInput').value.trim();
  const list = getFiltered(q ? 'ALL' : activeTab);
  const visible = list.slice(0, showLimit);
  const doneAll = DOCS.filter(d => mastery[d.id]).length;
  const starAll = DOCS.filter(d => stars[d.id]).length;
  const rmDone = (ROADMAP.problems || []).filter(p => isProbDone(p.key)).length;
  const dynGroups = [...new Set(DOCS.map(d => d.group).filter(Boolean))];
  const tabs = [
    ...dynGroups.map(g => [g, g + ` (${DOCS.filter(d => d.group === g).length}篇)`]),
    ['STARRED', `★ 已收藏 (${starAll})`],
    ['ALL', `全部 (${DOCS.length}篇)`]
  ];
  const searchBanner = q ? `<div class="search-banner"><span>全库检索「${escapeHtml(q)}」：共命中 ${list.length} 篇文档（已自动跨分类与状态全局匹配）</span><button class="btn" style="height:28px;padding:0 12px;font-size:12px;" onclick="clearSearch()">清空搜索</button></div>` : '';
  document.getElementById('main').innerHTML = `
    <section class="hero">
      <div class="hero-eyebrow">${(window.__WB_CONFIG__ && window.__WB_CONFIG__.heroEyebrow) || "学习工作台"}</div>
      <h1>${(window.__WB_CONFIG__ && window.__WB_CONFIG__.heroTitle) || "学习工作台"}</h1>
      <p>整合全库 ${DOCS.length} 篇核心文档，支持动态刷题路线、全正文 Markdown 排版、全文秒级检索与个人笔记本地留存。</p>
      <div class="stats-row">
        <div class="stat-pill" style="cursor:pointer;border-color:var(--accent);" onclick="renderRoadmap()">
          <div class="stat-val" style="color:var(--accent);">Day ${roadmapState.currentDay || 1} / 80 →</div>
          <div class="stat-lbl">全科题库 (${rmDone}/${PROBLEM_BANK.length.toLocaleString()}题)</div>
        </div>
        <div class="stat-pill"><div class="stat-val">${PROBLEM_BANK.length.toLocaleString()}</div><div class="stat-lbl">Markdown 分层习题</div></div>
        <div class="stat-pill"><div class="stat-val">${doneAll} / ${DOCS.length}</div><div class="stat-lbl">当前已掌握篇数</div></div>
      </div>
    </section>
    ${renderHomeQuickBar()}
    ${(() => {
      const curPair = tabs.find(([k]) => !q && activeTab === k) || tabs[0];
      const curLbl = curPair ? curPair[1] : '全部分类';
      return `<details class="wb-cat-collapse">
      <summary class="wb-cat-summary">
        <span class="wb-cat-cur">📂 分类：<strong class="wb-cat-cur-name">${escapeHtml(curLbl)}</strong></span>
        <span class="wb-cat-toggle">切换分类 (${tabs.length}) ▾</span>
      </summary>
      <div class="filter-tabs">
        ${tabs.map(([k, lbl]) => `<button class="btn ${(!q && activeTab === k) ? 'btn-primary' : ''}" onclick="setTab('${k}')">${lbl}</button>`).join('')}
      </div>
    </details>`;
    })()}
    ${searchBanner}
    <div class="bento-grid">
      ${visible.length ? visible.map((d, idx) => {
        const done = !!mastery[d.id];
        const statusTxt = done ? '✓ 已掌握' : (getDocStatus(d.id)==='doing' ? '学习中' : '待练习');
        const _p = Array.isArray(d.pills) ? d.pills : []; const corner = `${_p.length ? _p.length + '题 · ' : ''}${Math.round((d.chars||0)/1000)}k字`;
        return `<div class="card" onclick="openDoc('${d.id}')">
          <div class="card-head-row">
            <span class="card-source">${escapeHtml(d.sub || d.group)}</span>
            <span class="card-corner-badge ${done ? 'done' : ''}">${stars[d.id] ? '★ ' : ''}${corner}</span>
          </div>
          <div class="card-title">${escapeHtml(d.title)}</div>
          <div class="card-sub">
            <span>${(d.group && d.group.includes('词典')) ? '术语词典 · 点击查阅白话释义' : (_p.length ? ((window.__WB_CONFIG__ && !['icpc','cpp','dsos'].includes(window.__WB_CONFIG__.slug)) ? `包含 ${_p.length} 节精讲与例题` : `包含 ${_p.length} 道逐题精讲与代码`) : escapeHtml(d.group))}</span>
            <span>${statusTxt}</span>
          </div>
        </div>`;
      }).join('') : `<div class="card" style="grid-column:1/-1;text-align:center;padding:36px;"><div class="card-title">未找到匹配文档</div><div class="card-sub" style="justify-content:center;">请尝试更换关键词，或点击上方「清空搜索」</div></div>`}
    </div>
    ${list.length > showLimit ? `<div class="load-more-wrap"><button class="btn" onclick="showMore()">展开更多（剩余 ${list.length - showLimit} 篇）</button></div>` : ''}`;
  scheduleMathRender();
  if (preserveScroll) {
    window.scrollTo({ top: savedY, behavior: 'instant' });
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
};


// === Universal Multi-Problem Single-Page Splitter & Default-Collapsed Solutions (All 13 Workbenches) ===
function splitDocIntoProblemPages(doc) {
  const raw = String((doc && doc.content) || '');
  if (!raw || raw.length < 2500) return null;

  // Pattern A: ICPC WF/专题母题文档含「## 附 C：题单逐题精讲」与多道 ### Sxx-k 题目
  const appCMatch = raw.match(/^##\s*附\s*C[：:][^\n]*/m);
  if (appCMatch) {
    const splitPos = appCMatch.index;
    const headPart = raw.slice(0, splitPos).trim();
    const tailPart = raw.slice(splitPos).trim();
    const subParts = tailPart.split(/(?=^###\s+)/m).filter(s => /^###\s+/.test(s.trim()));
    if (subParts.length >= 2) {
      const pages = [{
        title: '专题主母题与方法精讲',
        md: headPart
      }];
      subParts.forEach((sp, i) => {
        const m = sp.match(/^###\s+([^\n]+)/);
        const t = m ? m[1].trim() : ('第 ' + (i + 1) + ' 题');
        pages.push({ title: t, md: sp.trim() });
      });
      return pages;
    }
  }

  // Pattern B: 全科分层习题合集 (*_exbook_*) 或包含 >= 4 道 ## 独立题目的长文档
  const h2Matches = [...raw.matchAll(/^##\s+([^\n]+)/gm)];
  const isExbook = /_exbook_/i.test(doc.id || '') || /分层习题|习题.*合集|题单|真题/.test(doc.title || '');
  const looksLikeProblemList = h2Matches.length >= 4 && (
    isExbook ||
    h2Matches.filter(m => /\[L\d\]|题|CF\s*\d+|P\d{4}|例\s*\d+|^\d+[\.、·\s]/.test(m[1])).length >= 4
  );
  if (looksLikeProblemList) {
    const firstIdx = h2Matches[0].index;
    const preamble = raw.slice(0, firstIdx).trim();
    const pages = [];
    for (let i = 0; i < h2Matches.length; i++) {
      const start = h2Matches[i].index;
      const end = (i + 1 < h2Matches.length) ? h2Matches[i + 1].index : raw.length;
      const chunk = raw.slice(start, end).trim();
      pages.push({ title: h2Matches[i][1].trim(), md: chunk });
    }
    if (pages.length >= 2) {
      pages._preamble = preamble;
      return pages;
    }
  }

  return null;
}

function collapseSolutionSections(container) {
  if (!container) return;
  const solRe = /完整分步解答|完整解答|参考解答|参考解析|标准解答|答案与评分标准|五、代码双版|代码双版|参考\s*AC\s*标程|参考代码|代码实现/;
  const heads = Array.from(container.querySelectorAll('h2, h3, h4'));
  heads.forEach(h => {
    if (h.closest('details')) return;
    const text = (h.textContent || '').trim();
    if (!solRe.test(text)) return;
    const level = parseInt(h.tagName.slice(1), 10);
    const toWrap = [];
    let cur = h.nextElementSibling;
    while (cur) {
      if (/^H[1-6]$/.test(cur.tagName) && parseInt(cur.tagName.slice(1), 10) <= level) break;
      const nxt = cur.nextElementSibling;
      toWrap.push(cur);
      cur = nxt;
    }
    if (!toWrap.length) return;
    const det = document.createElement('details');
    det.className = 'hint-card wb-sol-collapse';
    det.style.cssText = 'margin:14px 0;border:1px solid var(--border,rgba(148,163,184,0.25));border-radius:12px;overflow:hidden;';
    const sum = document.createElement('summary');
    sum.style.cssText = 'cursor:pointer;padding:10px 14px;font-weight:700;font-size:14px;background:var(--bg2,rgba(59,130,246,0.06));user-select:none;';
    sum.textContent = '👁️ 点击展开：' + text;
    const body = document.createElement('div');
    body.style.cssText = 'padding:12px 16px;';
    toWrap.forEach(el => body.appendChild(el));
    det.appendChild(sum);
    det.appendChild(body);
    h.replaceWith(det);
  });
}

window.__wbDocPageState = { docId: '', pageIdx: 0, showAll: false };
window.openDocPage = function(docId, pageIdx, showAll) {
  window.__wbDocPageState = { docId, pageIdx: Math.max(0, Number(pageIdx) || 0), showAll: !!showAll };
  window.openDoc(docId, '');
};

window.openDoc = function(id, anchor, vizHint, forceOpenViz) {
  const d = DOCS.find(x => x.id === id);
  if (!d) return;
  if (d._loaded === false && window.__wbHydrateAllDocs) {
    window.__wbHydrateAllDocs(function() {
      d._loaded = true;
      window.openDoc(id, anchor, vizHint, forceOpenViz);
    });
    return;
  }
  triggerMainAnim();
  activeView = 'reader';
  activeId = id;
  vizState.activeSub = null;
  renderSidebar();
  const done = !!mastery[d.id];
  const starred = !!stars[d.id];
  const noteText = notes[d.id] || '';
  const recViz = vizHint || (ROADMAP.docViz || {})[d.id] || 'segtree:lazy';
  const _dp = Array.isArray(d.pills) ? d.pills : []; const pills = _dp.length ? `<div class="prob-pills">${_dp.filter(p => p && (p.label || p.text)).map(p => `<a class="pill" href="#${p.id}" onclick="return onPillClick('${p.id}', '${escapeHtml(p.label || p.text || p.id || "").replace(/'/g, "\\'")}')">${escapeHtml(p.label || p.text || p.id || "")}</a>`).join('')}</div>` : '';
  document.getElementById('main').innerHTML = `
    <div class="reader-shell">
      <div class="reader-toolbar">
        <div class="toolbar-group">
          <button class="btn" onclick="renderRoadmap()">路线</button>
          <button class="btn" onclick="document.getElementById('noteDrawer').classList.toggle('open')">笔记${noteText.trim() ? '·有' : ''}</button>
          ${(!window.__WB_CONFIG__ || ['icpc','cpp','dsos'].includes(window.__WB_CONFIG__.slug)) ? `<button class="btn" onclick="document.getElementById('myCodeDrawer').classList.toggle('open')">我的AC${myAcCodes[d.id] && myAcCodes[d.id].trim() ? '·有' : ''}</button>` : ''}
          <details class="reader-more-details">
            <summary class="btn">更多 ▾</summary>
            <div class="reader-more-menu">
              <button class="btn" onclick="window.toggleZenMode ? window.toggleZenMode() : document.body.classList.toggle('zen-mode')">专注模式</button>
              <button class="btn ${spoilerMode ? 'btn-primary' : ''}" onclick="toggleSpoilerMode()">${spoilerMode ? '关闭防剧透' : '防剧透模式'}</button>
              <button class="btn" onclick="openDictModal()">查术语词典</button>
              ${(!window.__WB_CONFIG__ || ['icpc','cpp','dsos'].includes(window.__WB_CONFIG__.slug)) ? `<button class="btn" onclick="openTemplateModal()">查模板库</button>` : ''}
              <a class="btn" href="./index.html" style="text-decoration:none;">🏠 返回全科门户</a>
            </div>
          </details>
        </div>
        <div class="toolbar-group">
          ${getOjLinkHtml(d)}
          <button class="btn btn-primary" onclick="${(window.__WB_CONFIG__ && window.__WB_CONFIG__.slug === 'c4') ? "openCalculusSpecialLab('viz')" : 'applyCurrentProblemToViz()'}">${(window.__WB_CONFIG__ && window.__WB_CONFIG__.slug === 'c4') ? '📊 打开微积分可视化' : '一键应用到可视化'}</button>
          <button id="wbStarBtn" class="btn" onclick="toggleStar('${d.id}')" title="收藏本题">${starred ? '★' : '☆'}</button>
          <button id="wbMasteryBtn" class="btn ${done ? 'btn-primary' : ''}" style="${getDocStatus(d.id)==='doing' ? 'color:var(--amber);' : ''}" onclick="toggleMastery('${d.id}', event)">${done ? '✓ 已掌握' : (getDocStatus(d.id)==='doing' ? '学习中' : '未开始')}</button>
        </div>
      </div>
      <div class="note-drawer ${noteText.trim() ? 'open' : ''}" id="noteDrawer">
        <div style="font-size:13px;color:var(--muted);margin-bottom:8px;">个人学习笔记 / 错题复盘（自动保存在本地浏览器）</div>
        <textarea placeholder="记录这道题或词条的关键推导、易错点..." oninput="saveNote('${d.id}', this.value)">${escapeHtml(noteText)}</textarea>
      </div>
      <div class="note-drawer" id="myCodeDrawer">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:13px;color:var(--muted);">我的 AC 代码存档（自动保存，可随时与题解标程对照或送入编译器运行）</span>
          <button class="btn" style="padding:3px 10px;font-size:12px;" onclick="openIdeModal(myAcCodes['${d.id}'] || '')">▶ 送入编译器</button>
        </div>
        <textarea style="font-family:'JetBrains Mono',Consolas,monospace;font-size:12.5px;min-height:150px;" placeholder="粘贴你的 AC 代码..." oninput="myAcCodes['${d.id}']=this.value;saveState()">${escapeHtml(myAcCodes[d.id] || '')}</textarea>
      </div>
      ${pills}
      ${renderPrereqCardHtml(d)}
      ${(!window.__WB_CONFIG__ || window.__WB_CONFIG__.slug === 'icpc') ? buildSampleTraceCard(d) : ''}
      <div id="wbProblemPagerTop"></div>
      <div id="tocContainer"></div>
      <article class="md-body" id="mdArticle">${(() => {
        const _pages = splitDocIntoProblemPages(d);
        window.__wbCurDocPages = _pages;
        if (!_pages || (window.__wbDocPageState.docId === d.id && window.__wbDocPageState.showAll)) {
          return renderMarkdown(d.content);
        }
        let _idx = (window.__wbDocPageState.docId === d.id) ? window.__wbDocPageState.pageIdx : 0;
        if (anchor) {
          const _norm = s => String(s || '').replace(/\s+/g, '').toLowerCase();
          const _an = _norm(anchor);
          let _hit = _pages.findIndex(pg => _norm(pg.title).includes(_an));
          if (_hit < 0) {
            _hit = _pages.findIndex(pg => (pg.md.match(/^#{2,4}\s+.+$/gm) || []).some(h => _norm(h).includes(_an)));
          }
          if (_hit < 0) {
            let bestScore = 0;
            _pages.forEach((pg, pi) => {
              const nm = _norm(pg.md);
              const cnt = _an ? nm.split(_an).length - 1 : 0;
              if (cnt > bestScore) { bestScore = cnt; _hit = pi; }
            });
          }
          if (_hit >= 0) _idx = _hit;
        }
        _idx = Math.max(0, Math.min(_pages.length - 1, _idx));
        window.__wbDocPageState = { docId: d.id, pageIdx: _idx, showAll: false };
        return renderMarkdown(_pages[_idx].md);
      })()}</article>
      <div id="wbProblemPagerBottom"></div>
      ${buildCheckpointQuizHtml(d)}
      ${(() => {
        const _i = DOCS.findIndex(x => x.id === d.id);
        const _prev = _i > 0 ? DOCS[_i - 1] : null;
        const _next = (_i >= 0 && _i < DOCS.length - 1) ? DOCS[_i + 1] : null;
        if (!_prev && !_next) return '';
        const _pHtml = _prev
          ? `<button type="button" class="wb-chap-btn wb-chap-prev" onclick="openDoc('${_prev.id}')"><span class="wb-chap-dir">← 上一章</span><span class="wb-chap-title">${escapeHtml(_prev.title || _prev.id)}</span></button>`
          : `<div class="wb-chap-spacer"></div>`;
        const _nHtml = _next
          ? `<button type="button" class="wb-chap-btn wb-chap-next" onclick="openDoc('${_next.id}')"><span class="wb-chap-dir">下一章 →</span><span class="wb-chap-title">${escapeHtml(_next.title || _next.id)}</span></button>`
          : `<div class="wb-chap-spacer"></div>`;
        return `<nav class="wb-chapter-nav" aria-label="章节切换">${_pHtml}${_nHtml}</nav>`;
      })()}
    </div>`;
  if (forceOpenViz || vizState.open) {
    applyCurrentProblemToViz();
  }
  if (anchor) {
    setTimeout(() => {
      const target = document.getElementById(anchor);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  renderSampleTraceTable();
  if (!anchor) { window.scrollTo({ top: 0, behavior: 'instant' }); }
  if (anchor) {
    setTimeout(function() {
      const rawNorm = String(anchor).replace(/[`*_]/g, '').trim().toLowerCase();
      const coreNorm = rawNorm.replace(/^\s*(?:\d+(?:\.\d+)*[\.、\)\s]+|[①-⑳]\s*)/, '').split(/[（(]/)[0].trim();
      const heads = Array.from(document.querySelectorAll('#main h2, #main h3, #main h4'));
      let matched = heads.find(h => (h.textContent || '').trim().toLowerCase() === rawNorm)
        || heads.find(h => (h.textContent || '').trim().toLowerCase().includes(rawNorm))
        || (coreNorm.length >= 2 ? heads.find(h => (h.textContent || '').trim().toLowerCase().includes(coreNorm)) : null);
      if (matched) {
        // If inside a collapsed <details>, open it automatically
        let det = matched.closest('details');
        while (det) { det.open = true; det = det.parentElement && det.parentElement.closest('details'); }
        matched.scrollIntoView({ behavior: 'smooth', block: 'center' });
        matched.style.transition = 'background 0.35s ease, box-shadow 0.35s ease';
        matched.style.background = 'rgba(59, 130, 246, 0.22)';
        matched.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.14)';
        matched.style.borderRadius = '8px';
        matched.style.padding = '4px 10px';
        setTimeout(function() { matched.style.background = ''; matched.style.boxShadow = ''; }, 3200);
      }
    }, 200);
  }

  const mdArtEl = document.getElementById('mdArticle');
  // Render independent single-problem pager bar when doc was split
  const _pgs = window.__wbCurDocPages;
  if (_pgs && _pgs.length >= 2) {
    const _st = window.__wbDocPageState || { docId: d.id, pageIdx: 0, showAll: false };
    const _cur = _st.pageIdx || 0;
    const _eid = String(d.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const _opts = _pgs.map((pg, i) => `<option value="${i}" ${i === _cur ? 'selected' : ''}>${i + 1} / ${_pgs.length} · ${escapeHtml(pg.title.slice(0, 44))}</option>`).join('');
    const _barHtml = _st.showAll
      ? `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:10px 14px;margin:12px 0;border-radius:12px;background:var(--bg2,rgba(59,130,246,0.08));border:1px solid var(--border,rgba(148,163,184,0.25));">
          <span style="font-size:13px;font-weight:600;">📄 当前为全文合集视图（共 ${_pgs.length} 题）</span>
          <button class="btn btn-primary" style="height:30px;padding:0 12px;font-size:12.5px;" onclick="openDocPage('${_eid}', 0, false)">📑 切回单题独立页面</button>
        </div>`
      : `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:10px 14px;margin:12px 0;border-radius:12px;background:var(--bg2,rgba(59,130,246,0.08));border:1px solid var(--border,rgba(148,163,184,0.25));">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <button class="btn" style="height:30px;padding:0 11px;font-size:12.5px;" ${_cur <= 0 ? 'disabled' : ''} onclick="openDocPage('${_eid}', ${_cur - 1}, false)">← 上一题</button>
            <select class="calc-input" style="height:30px;max-width:min(360px,72vw);padding:0 8px;font-size:12.5px;" onchange="openDocPage('${_eid}', Number(this.value), false)">${_opts}</select>
            <button class="btn btn-primary" style="height:30px;padding:0 11px;font-size:12.5px;" ${_cur >= _pgs.length - 1 ? 'disabled' : ''} onclick="openDocPage('${_eid}', ${_cur + 1}, false)">下一题 →</button>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:12px;color:var(--muted);">独立单题页 ${_cur + 1} / ${_pgs.length}</span>
            <button class="btn" style="height:28px;padding:0 10px;font-size:12px;" onclick="openDocPage('${_eid}', ${_cur}, true)">📄 查看全文</button>
          </div>
        </div>`;
    const topBar = document.getElementById('wbProblemPagerTop');
    const botBar = document.getElementById('wbProblemPagerBottom');
    if (topBar) topBar.innerHTML = _barHtml;
    if (botBar && !_st.showAll) botBar.innerHTML = _barHtml;
  }
  collapseSolutionSections(mdArtEl);
  applyFourStageStepper(mdArtEl);
  enhanceCodeBlocks(mdArtEl);
  buildArticleToc();
  applySpoilerLadder();
  if (typeof highlightAlgTerms === "function") highlightAlgTerms(mdArtEl);
  scheduleMathRender();
};
window.saveNote = function(id, val) { notes[id] = val; saveState(); };
window.toggleStar = function(id) {
  stars[id] = !stars[id];
  saveState();
  const btn = document.getElementById('wbStarBtn');
  if (btn && activeId === id) btn.textContent = stars[id] ? '★' : '☆';
  renderSidebar();
};
window.getDocStatus = function(id) {
  if (mastery[id]) return 'done';
  return studyStatus[id] === 'doing' ? 'doing' : 'todo';
};
window.toggleMastery = function(id, ev) {
  const cur = getDocStatus(id);
  const next = cur === 'todo' ? 'doing' : (cur === 'doing' ? 'done' : 'todo');
  studyStatus[id] = next;
  mastery[id] = (next === 'done');
  if (next === 'done') masteryDates[id] = Date.now(); else delete masteryDates[id];
  saveState();
  // Sync with roadmap subDone
  (ROADMAP.problems || []).filter(p => p.docId === id).forEach(p => {
    if (mastery[id]) roadmapState.subDone[p.key] = roadmapState.currentDay || 1;
    else delete roadmapState.subDone[p.key];
  });
  saveRoadmapState();
  if (mastery[id] && ev && particlesEnabled) spawnBurst(ev.clientX, ev.clientY);
  const btn = document.getElementById('wbMasteryBtn');
  if (btn && activeId === id) {
    btn.classList.toggle('btn-primary', next === 'done');
    btn.style.color = next === 'doing' ? 'var(--amber)' : '';
    btn.textContent = next === 'done' ? '✓ 已掌握' : (next === 'doing' ? '学习中' : '未开始');
  }
  renderSidebar();
};
/* Legacy cycleFont removed; typography prefs managed by TypographyPrefsController in ui_polish.js */
document.getElementById('searchInput')?.addEventListener('input', () => {
  showLimit = 24; if (activeView === 'home') renderHome(activeView === "home"); else renderSidebar();
});
document.getElementById('homeBtn')?.addEventListener('click', () => renderHome());
document.getElementById('roadmapBtn')?.addEventListener('click', () => renderRoadmap());
document.getElementById('vizTopBtn')?.addEventListener('click', () => toggleVizSidebar());
window.setSidebarOpen = function(isOpen) {
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  const open = !!isOpen;
  sb.classList.toggle('open', open);
  sb.classList.toggle('collapsed', !open);
  let bd = document.getElementById('wbSidebarBackdrop');
  if (open && window.innerWidth <= 900) {
    if (!bd) {
      bd = document.createElement('div');
      bd.id = 'wbSidebarBackdrop';
      bd.setAttribute('aria-hidden', 'true');
      bd.addEventListener('click', () => window.setSidebarOpen(false));
      document.body.appendChild(bd);
    }
    bd.classList.add('open');
  } else if (bd) {
    bd.classList.remove('open');
  }
};
window.toggleSidebar = function(force) {
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  const isCurrentlyOpen = sb.classList.contains('open') || !sb.classList.contains('collapsed');
  const next = typeof force === 'boolean' ? force : !isCurrentlyOpen;
  window.setSidebarOpen(next);
};
document.getElementById('toggleSidebar')?.addEventListener('click', () => window.toggleSidebar());
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    const bd = document.getElementById('wbSidebarBackdrop');
    if (bd) bd.classList.remove('open');
  }
}, { passive: true });
document.getElementById('themeBtn')?.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', next); try { localStorage.setItem('wb_theme_v1', next); } catch(e) {}
});
document.getElementById('particleBtn')?.addEventListener('click', () => {
  particlesEnabled = !particlesEnabled;
  document.getElementById('particleBtn').innerText = particlesEnabled ? '粒子动效：开' : '粒子动效：关';
});
/* Reading progress scroll listener consolidated in passive listener below */

const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, mouse = { x: -9999, y: -9999 }, bursts = [], pts = [];
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
resize();
for (let i = 0; i < 48; i++) {
  pts.push({ x: Math.random()*W, y: Math.random()*H, vx: (Math.random()-0.5)*0.35, vy: (Math.random()-0.5)*0.35, r: Math.random()*2.0+1.2, alpha: Math.random()*0.42+0.34 });
}
function spawnBurst(x, y) {
  for (let i = 0; i < 18; i++) {
    const ang = (Math.PI*2*i)/18 + Math.random()*0.2, spd = Math.random()*3.2+1.5;
    bursts.push({ x, y, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd, life: 1.0, r: Math.random()*2.5+1.5 });
  }
}
function tick() {
  ctx.clearRect(0, 0, W, H);
  if (particlesEnabled) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const dotRgb = isDark ? '147, 197, 253' : '37, 99, 235';
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], dx = mouse.x - p.x, dy = mouse.y - p.y, dist = Math.hypot(dx, dy);
      if (dist < 160 && dist > 1) { p.x -= (dx/dist)*0.45; p.y -= (dy/dist)*0.45; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fillStyle = `rgba(${dotRgb}, ${p.alpha})`; ctx.fill();
    }
  }
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i]; b.x += b.vx; b.y += b.vy; b.vx *= 0.94; b.vy *= 0.94; b.life -= 0.03;
    if (b.life <= 0) { bursts.splice(i, 1); continue; }
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fillStyle = `rgba(16, 185, 129, ${b.life})`; ctx.fill();
  }
  if (particlesEnabled && !document.hidden) {
    requestAnimationFrame(tick);
  }
}
window.toggleParticles = function() {
  particlesEnabled = !particlesEnabled;
  const btn = document.getElementById('particleBtn');
  if (btn) btn.textContent = particlesEnabled ? '✨ 粒子:开' : '✨ 粒子:关';
  if (particlesEnabled) {
    requestAnimationFrame(tick);
  } else if (typeof ctx !== 'undefined') {
    ctx.clearRect(0, 0, W, H);
  }
};
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && particlesEnabled) requestAnimationFrame(tick);
});

// ===== 80-Day Dynamic Adaptive Roadmap Engine =====

window.addEventListener('scroll', () => {
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docH > 0 ? Math.min(100, Math.max(0, (window.scrollY / docH) * 100)) : 0;
  const bar = document.getElementById('readProgress');
  if (bar) bar.style.width = pct + '%';
  const topBtn = document.getElementById('backToTop');
  if (topBtn) topBtn.classList.toggle('show', window.scrollY > 420);
}, { passive: true });


let DICT_INDEX = null;
function getDictIndex() {
  if (DICT_INDEX && DICT_INDEX.length > 0) return DICT_INDEX;
  DICT_INDEX = [];
  DOCS.filter(d => (d.id.startsWith('dict_') || d.id.includes('glossary') || (d.title && d.title.includes('词典'))) && !d.id.includes('00_')).forEach(d => {
    const parts = (d.content || '').split(/\n(?=###\s+)/);
    parts.forEach(p => {
      const m = p.match(/^###\s+(.+)/);
      if (m) {
        DICT_INDEX.push({ title: m[1].trim(), vol: d.title, docId: d.id, body: p.replace(/^###\s+.+\n?/, '').trim() });
      }
    });
  });
  return DICT_INDEX;
}

let TPL_INDEX = null;
function getTplIndex() {
  if (TPL_INDEX && TPL_INDEX.length) return TPL_INDEX;
  TPL_INDEX = [];
  const tplDoc = DOCS.find(d => d.id.includes('标准代码模板库')) || DOCS.find(d => d.group === '模板与总纲');
  if (tplDoc) {
    const parts = (tplDoc.content || '').split(/\n(?=##\s+|###\s+)/);
    parts.forEach(p => {
      const m = p.match(/^#{2,3}\s+(.+)/);
      const codeM = p.match(/```[a-zA-Z0-9_+]*\n([\s\S]*?)```/);
      if (m && codeM) {
        TPL_INDEX.push({ title: m[1].trim(), code: codeM[1].trim() });
      }
    });
  }
  return TPL_INDEX;
}

window.closeExtModal = function() {
  const bd = document.getElementById('extModalBackdrop');
  if (bd) bd.classList.remove('open');
};

window.openDictModal = function(initQ, _hydrated) {
  if (!_hydrated && window.__wbHydrateAllDocs && DOCS.some(d => (d.id.includes('glossary') || d.id.startsWith('dict_') || (d.title && d.title.includes('词典'))) && !d.content)) {
    window.__wbHydrateAllDocs(function() { DICT_INDEX = null; window.openDictModal(initQ, true); });
    return;
  }
  const bd = document.getElementById('extModalBackdrop');
  const titleEl = document.getElementById('extModalTitle');
  const bodyEl = document.getElementById('extModalBody');
  if (!bd || !bodyEl) return;
  const entries = getDictIndex();
  titleEl.textContent = `${window.__WB_SUBJECT_NAME__ || "学科"} · 术语词典速查（共 ${entries.length} 条）`;
  bodyEl.innerHTML = `
    <input id="dictModalInput" class="ext-search" type="text" placeholder="输入术语关键词搜索（支持中英文与白话释义）..." value="${escapeHtml(initQ || '')}" oninput="renderDictResults(this.value)" />
    <div id="dictModalResults" style="display:flex;flex-direction:column;gap:10px;"></div>`;
  bd.classList.add('open');
  renderDictResults(initQ || '');
  setTimeout(() => document.getElementById('dictModalInput')?.focus(), 50);
};

window.renderDictResults = function(q) {
  const box = document.getElementById('dictModalResults');
  if (!box) return;
  const kw = (q || '').trim().toLowerCase();
  const list = getDictIndex().filter(e => !kw || e.title.toLowerCase().includes(kw) || e.body.toLowerCase().includes(kw)).slice(0, 18);
  if (!list.length) { box.innerHTML = '<div style="color:var(--muted);font-size:13px;">未找到匹配术语，请换个关键词。</div>'; return; }
  window.__dictFilter = window.__dictFilter || '';
  box.innerHTML = list.map(e => `
    <div class="ext-item" style="cursor:pointer;" onclick="closeExtModal();openDoc('${e.docId}', '${escapeHtml(e.title).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')">
      <div class="ext-item-head">
        <span class="ext-item-title">${escapeHtml(e.title)}</span>
        <span class="ext-item-tag">${escapeHtml(e.vol.slice(0, 18))}</span>
      </div>
      <div class="ext-item-body">${escapeHtml(e.body.slice(0, 460))}${e.body.length > 460 ? '...' : ''}</div>
    </div>`).join('');
  if (window.renderMathInElement) { try { renderMathInElement(box, { delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}], throwOnError: false }); } catch(e){} }
};

window.openTemplateModal = function(initQ, _hydrated) {
  if (!_hydrated && typeof window.__wbHydrateAllDocs === 'function' && (!TPL_INDEX || !TPL_INDEX.length)) {
    window.__wbHydrateAllDocs(function() { TPL_INDEX = null; window.openTemplateModal(initQ, true); });
    return;
  }
  const bd = document.getElementById('extModalBackdrop');
  const titleEl = document.getElementById('extModalTitle');
  const bodyEl = document.getElementById('extModalBody');
  if (!bd || !bodyEl) return;
  const tpls = getTplIndex();
  const _isIcpcTpl = !window.__WB_CONFIG__ || window.__WB_CONFIG__.slug === 'icpc';
  const _tplSubj = window.__WB_SUBJECT_NAME__ || (window.__WB_CONFIG__ && window.__WB_CONFIG__.brandTitle) || '本学科';
  titleEl.textContent = _isIcpcTpl
    ? `ICPC 赛场代码模板速查（共 ${tpls.length} 个板子）`
    : `${_tplSubj} · 核心模板与方法速查（共 ${tpls.length} 项）`;
  const _tplPh = _isIcpcTpl
    ? '搜索模板：线段树、并查集、Dinic、KMP、AC自动机...'
    : `搜索 ${_tplSubj} 核心模板、公式或推导步骤...`;
  bodyEl.innerHTML = `
    <input id="tplModalInput" class="ext-search" type="text" placeholder="${escapeHtml(_tplPh)}" value="${escapeHtml(initQ || '')}" oninput="renderTplResults(this.value)" />
    <div id="tplModalResults" style="display:flex;flex-direction:column;gap:10px;"></div>`;
  bd.classList.add('open');
  renderTplResults(initQ || '');
  setTimeout(() => document.getElementById('tplModalInput')?.focus(), 50);
};

window.renderTplResults = function(q) {
  const box = document.getElementById('tplModalResults');
  if (!box) return;
  const kw = (q || '').trim().toLowerCase();
  const list = getTplIndex().filter(t => !kw || t.title.toLowerCase().includes(kw) || t.code.toLowerCase().includes(kw)).slice(0, 14);
  if (!list.length) { box.innerHTML = '<div style="color:var(--muted);font-size:13px;">未找到匹配模板。</div>'; return; }
  box.innerHTML = list.map(t => `
    <div class="ext-item">
      <div class="ext-item-head">
        <span class="ext-item-title">${escapeHtml(t.title)}</span>
        <button class="btn" style="padding:3px 10px;font-size:11.5px;" onclick="navigator.clipboard?.writeText(getTplIndex()[${getTplIndex().indexOf(t)}].code);this.textContent='已复制';setTimeout(()=>this.textContent='复制板子',1200)">复制板子</button>
      </div>
      <pre style="margin:0;padding:10px 12px;font-size:12px;max-height:190px;"><code>${highlightCpp(t.code)}</code></pre>
    </div>`).join('');
};

let timerState = { sec: 0, running: false, limitMin: 0, iv: null, alerted: false };
function renderTimerUI() {
  const txt = document.getElementById('timerText');
  const btn = document.getElementById('timerToggleBtn');
  const pill = document.getElementById('timerPill');
  if (!txt || !btn || !pill) return;
  const m = String(Math.floor(timerState.sec / 60)).padStart(2, '0');
  const s = String(timerState.sec % 60).padStart(2, '0');
  txt.textContent = `⏱ ${m}:${s}`;
  btn.textContent = timerState.running ? '⏸' : '▶';
  pill.classList.toggle('running', timerState.running);
  const over = timerState.limitMin > 0 && timerState.sec >= timerState.limitMin * 60;
  pill.classList.toggle('overtime', over);
  if (over && !timerState.alerted) {
    timerState.alerted = true;
    txt.textContent = `⏰ ${m}:${s} 已到时`;
  }
}
window.toggleContestTimer = function() {
  timerState.running = !timerState.running;
  if (timerState.running) {
    timerState.iv = setInterval(() => { timerState.sec++; renderTimerUI(); }, 1000);
  } else if (timerState.iv) {
    clearInterval(timerState.iv); timerState.iv = null;
  }
  renderTimerUI();
};
window.resetContestTimer = function() {
  if (timerState.iv) { clearInterval(timerState.iv); timerState.iv = null; }
  timerState.sec = 0; timerState.running = false; timerState.alerted = false;
  renderTimerUI();
};
window.setTimerLimit = function(val) {
  timerState.limitMin = Number(val) || 0;
  timerState.alerted = false;
  renderTimerUI();
};

function getDueReviewDocs() {
  const now = Date.now();
  const intervals = [1, 3, 7, 15];
  return DOCS.filter(d => {
    if (!mastery[d.id] || !masteryDates[d.id]) return false;
    const days = (now - masteryDates[d.id]) / 86400000;
    return intervals.some(iv => days >= iv && days < iv + 1.5);
  });
}

let activeMockSet = null;
window.drawBlindProblem = function() {
  if (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug !== 'icpc' && PROBLEM_BANK.length) {
    const todo = PROBLEM_BANK.filter(p => !isBankProbDone(p));
    const src = todo.length ? todo : PROBLEM_BANK;
    const pick = src[Math.floor(Math.random() * src.length)];
    if (pick) { openBankProblem(pick.order); return; }
  }
  const pool = DOCS.filter(d => (d.group === '洛谷104题' || d.group === 'WF专题200题') && !mastery[d.id]);
  const src = pool.length ? pool : (DOCS.filter(d => d.group === '洛谷104题').length ? DOCS.filter(d => d.group === '洛谷104题') : DOCS.filter(d => d.group !== '术语词典'));
  const pick = src[Math.floor(Math.random() * src.length)];
  if (pick) openDoc(pick.id);
};

window.startMockContest = function() {
  const luogu = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug !== 'icpc') ? DOCS.filter(d => d.group !== '术语词典') : DOCS.filter(d => d.group === '洛谷104题');
  const wf = DOCS.filter(d => d.group === 'WF专题200题' && d.id !== 'v4_00_index');
  const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];
  activeMockSet = [
    { tag: 'A 题', doc: pickOne(luogu.slice(0, 50)) || pickOne(luogu), wa: 0, acMin: null },
    { tag: 'B 题', doc: pickOne(luogu.slice(50)) || pickOne(luogu), wa: 0, acMin: null },
    { tag: 'C 题', doc: pickOne(wf) || pickOne(luogu), wa: 0, acMin: null }
  ].filter(x => x.doc);
  resetContestTimer();
  const sel = document.getElementById('timerLimitSel');
  if (sel) { sel.value = '90'; setTimerLimit(90); }
  toggleContestTimer();
  renderHome(activeView === "home");
  setTimeout(() => { const mc = document.querySelector(".mock-card"); if (mc) mc.scrollIntoView({ behavior: "smooth", block: "center" }); }, 60);
};

window.mockMarkWa = function(idx) {
  if (!activeMockSet || !activeMockSet[idx]) return;
  activeMockSet[idx].wa++;
  renderHome(activeView === "home");
};

window.mockMarkAc = function(idx) {
  if (!activeMockSet || !activeMockSet[idx]) return;
  activeMockSet[idx].acMin = Math.max(1, Math.round(timerState.sec / 60));
  renderHome(activeView === "home");
};

function renderHomeQuickBar() {
  const due = getDueReviewDocs();
  let mockHtml = '';
  if (activeMockSet) {
    const solved = activeMockSet.filter(m => m.acMin !== null).length;
    const penalty = activeMockSet.reduce((acc, m) => acc + (m.acMin !== null ? m.acMin + m.wa * 20 : 0), 0);
    mockHtml = `
    <div class="mock-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <strong style="font-size:14px;">${(!window.__WB_CONFIG__ || window.__WB_CONFIG__.slug === 'icpc') ? `ICPC 模拟赛 · 已过 ${solved} 题 · 罚时 ${penalty} min` : `${window.__WB_SUBJECT_NAME__ || '本学科'} 限时自测 · 已完成 ${solved} / ${activeMockSet.length} 题`}</strong>
        <button class="btn" onclick="activeMockSet=null;if(typeof resetContestTimer==='function')resetContestTimer();renderHome()">结束模拟</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${activeMockSet.map((m, i) => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;background:var(--bg);padding:8px 12px;border-radius:10px;">
            <button class="btn" style="border:none;background:transparent;padding:0;font-weight:600;" onclick="openDoc('${m.doc.id}')">${escapeHtml(m.tag)} · ${escapeHtml(m.doc.title.slice(0, 28))}</button>
            <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;">
              <span style="color:${m.acMin!==null?'var(--green)':'var(--muted)'};font-weight:600;">${m.acMin!==null ? `AC (${m.acMin}m)` : '未通过'} ${m.wa ? `(-${m.wa})` : ''}</span>
              <button class="btn" style="height:28px;padding:0 10px;font-size:12px;" onclick="mockMarkWa(${i})">+WA</button>
              <button class="btn btn-primary" style="height:28px;padding:0 10px;font-size:12px;" onclick="mockMarkAc(${i})">AC</button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  }
  return `
    <div class="home-quick-bar">
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
        <button class="btn btn-primary" onclick="drawBlindProblem()">随机刷一题</button>
        <button class="btn" onclick="startMockContest()">${(window.__WB_CONFIG__ && window.__WB_CONFIG__.slug !== "icpc") ? "3 题限时自测" : "3 题模拟赛"}</button>
        ${(window.__WB_CONFIG__ && window.__WB_CONFIG__.slug === "c4") ? `<button class="btn" onclick="openCalculusSpecialLab('fault')">∫ 找错 & 8模式画图</button>` : ""}
        ${(window.__WB_CONFIG__ && window.__WB_CONFIG__.slug === "icpc") ? `<button class="btn" onclick="openVpModal()">5h 组队 VP</button>` : ""}
        ${(!window.__WB_CONFIG__ || ["icpc","cpp","dsos"].includes(window.__WB_CONFIG__.slug)) ? `<button class="btn" onclick="openIdeModal()">C++ 编译器</button>` : ""}
        ${(window.__WB_CONFIG__ && window.__WB_CONFIG__.slug === "icpc") ? `<button class="btn" onclick="openOjModal()">OJ 直连</button>` : ""}
      </div>
      <div style="font-size:13px;color:var(--muted);">
        待复习 <strong style="color:var(--text);">${due.length}</strong> 题
        ${due.length ? `<button class="btn" style="margin-left:8px;height:28px;padding:0 10px;font-size:12px;" onclick="openDoc('${due[0].id}')">开始复习</button>` : ''}
      </div>
    </div>
    ${mockHtml}`;
}

// === Custom Problem Importer (Local Storage) ===
const CUSTOM_DOCS_KEY = 'icpc_full_custom_docs_v1';
let customDocs = safeGet(CUSTOM_DOCS_KEY, '[]');
if (Array.isArray(customDocs) && customDocs.length) {
  customDocs.forEach(cd => {
    if (!DOCS.some(d => d.id === cd.id)) DOCS.unshift(cd);
  });
}

window.openAddProblemModal = function() {
  const bd = document.getElementById('extModalBackdrop');
  const titleEl = document.getElementById('extModalTitle');
  const bodyEl = document.getElementById('extModalBody');
  if (!bd || !bodyEl) return;
  titleEl.textContent = '导入自定义新题解（保存至本地题库）';
  bodyEl.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <input id="custTitle" class="ext-search" type="text" placeholder="题目标题，如：CF1900D Small GCD" />
      <select id="custGroup" class="ext-search" aria-label="选择目标题库">
        <option value="" disabled>请选择加入题库分类...</option>
        <option value="洛谷104题">加入题库：洛谷精解题库</option>
        <option value="WF专题200题">加入题库：WF 专题题库</option>
      </select>
      <textarea id="custBody" class="ide-editor" style="min-height:220px;" placeholder="粘贴题目描述、推导过程（支持 $LaTeX$ 公式）与 C++ 代码..."></textarea>
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button class="btn" onclick="closeExtModal()">取消</button>
        <button class="btn btn-primary" onclick="saveCustomProblem()">保存并打开</button>
      </div>
    </div>`;
  bd.classList.add('open');
  setTimeout(() => document.getElementById('custTitle')?.focus(), 50);
};

window.saveCustomProblem = function() {
  const title = (document.getElementById('custTitle')?.value || '').trim();
  const group = document.getElementById('custGroup')?.value || '洛谷104题';
  const content = (document.getElementById('custBody')?.value || '').trim();
  if (!title || !content) { alert('请填写题目标题与内容'); return; }
  const doc = {
    id: 'custom_' + Date.now(),
    group,
    sub: '自定义导入',
    filename: title + '.md',
    title,
    chars: content.length,
    pills: [],
    content: `# ${title}\n\n` + content
  };
  customDocs.unshift(doc);
  try { localStorage.setItem(CUSTOM_DOCS_KEY, JSON.stringify(customDocs)); } catch (e) {}
  DOCS.unshift(doc);
  closeExtModal();
  renderSidebar();
  openDoc(doc.id);
};

// === ⌘K Command Palette ===
const CMD_ACTIONS = [
  { label: '打开 AI 随身助教（带当前题目上下文提问）', key: 'ai 助教 提问 chat gpt gemini', run: () => { closeExtModal(); toggleAiDrawer(true); } },
  { label: '对接洛谷 / Codeforces / AtCoder（抓样例 + 同步 AC + 跳转提交）', key: 'oj 洛谷 luogu cf codeforces atcoder 同步 抓取', domains: ['icpc'], run: () => openOjModal() },
  { label: '打开内置 C++20 / Python 编译器（实时时空判题）', key: '编译器 ide compile cpp python', domains: ['icpc', 'cpp', 'dsos', 'comp', 'ai', 'quant', 'arch', 'net', 'dbse'], run: () => openIdeModal() },
  { label: '打开本地在线自动对拍器 (Stress Test)', key: '对拍 stress hack', domains: ['icpc', 'cpp'], run: () => openStressModal() },
  { label: '打开离线对拍脚本生成器 (gen/brute/sol + check.sh)', key: '对拍 脚本 生成器 stress gen brute sol check.sh check.bat', domains: ['icpc', 'cpp'], run: () => openStressGenModal() },
  { label: '打开 5 小时 ICPC 组队 VP 模拟赛 (Team Simulator)', key: 'vp 模拟赛 team contest 5小时 regional wf', domains: ['icpc'], run: () => openVpModal() },
  { label: '打开交互式图论 / 树形草稿画板', key: '画图 graph tree sketch', domains: ['icpc', 'dm', 'dsos', 'net', 'comp'], run: () => openGraphSketchModal() },
  { label: '打开高频踩坑与核心概念闪卡记忆', key: '闪卡 flashcard memory', run: () => openFlashcardModal() },
  { label: '导出纸质速查手册 (TRD 双栏 PDF)', key: '打印 trd pdf 纸质模板', domains: ['icpc', 'cpp'], run: () => openTrdPrintModal() },
  { label: '查看个人能力雷达图与 80 天热力图', key: '看板 雷达图 热力图 analytics', run: () => openAnalyticsModal() },
  { label: '打开 TLE / MLE 复杂度与内存估算器', key: '估算 复杂度 内存 tle mle', domains: ['icpc', 'cpp', 'dsos', 'ai', 'arch'], run: () => openCalcModal() },
  { label: '速查学科术语词典', key: '词典 dict 术语', run: () => openDictModal() },
  { label: '速查标准代码 / 推导模板库', key: '模板 template 板子', domains: ['icpc', 'cpp', 'dsos', 'ai', 'quant'], run: () => openTemplateModal() },
  { label: '导入自定义新题解 / 笔记', key: '导入 新增 题目 custom', run: () => openAddProblemModal() },
  { label: '盲抽一道未掌握的题', key: '盲抽 随机 random', run: () => { closeExtModal(); drawBlindProblem(); } },
  { label: '开始 90 分钟 3 题限时模拟测验', key: '模拟赛 mock contest', run: () => { closeExtModal(); startMockContest(); } },
  { label: '导出学习进度存档 (JSON)', key: '导出 备份 export json', run: () => { closeExtModal(); exportProgressJson(); } },
  { label: '📂 导入学习进度存档 (JSON)', key: '导入 恢复 import json', run: () => { closeExtModal(); importProgressJson(); } },
  { label: '✨ 切换背景粒子特效', key: '粒子 particle', run: () => { closeExtModal(); toggleParticles(); } }
];

window.openCommandPalette = function() {
  if (window.innerWidth <= 900 && typeof window.setSidebarOpen === 'function') window.setSidebarOpen(false);
  const bd = document.getElementById('extModalBackdrop');
  const titleEl = document.getElementById('extModalTitle');
  const bodyEl = document.getElementById('extModalBody');
  if (!bd || !bodyEl) return;
  titleEl.textContent = '⌘K 万能命令面板（搜工具 / 搜全库题目）';
  bodyEl.innerHTML = `
    <input id="cmdPalInput" class="ext-search" type="text" placeholder="${((window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc') === 'icpc' ? '输入命令或题名，如：对拍、画图、TRD、AC自动机、线段树...' : '输入命令、讲义或题名（如：AI助教、词典、闪卡、盲抽）...'}"  oninput="renderCmdPalette(this.value)" />
    <div id="cmdPalList" style="display:flex;flex-direction:column;gap:6px;"></div>`;
  bd.classList.add('open');
  renderCmdPalette('');
  setTimeout(() => document.getElementById('cmdPalInput')?.focus(), 40);
};

window.renderCmdPalette = function(q) {
  const box = document.getElementById('cmdPalList');
  if (!box) return;
  const kw = (q || '').trim().toLowerCase();
  const _curSlug = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc';
  const acts = CMD_ACTIONS.filter(a => (!a.domains || a.domains.includes(_curSlug)) && (!kw || a.label.toLowerCase().includes(kw) || a.key.includes(kw)));
  const docs = kw ? DOCS.filter(d => d.title.toLowerCase().includes(kw) || d.id.toLowerCase().includes(kw)).slice(0, 8) : [];
  let out = acts.map((a, idx) => `<button class="btn" style="text-align:left;justify-content:flex-start;padding:8px 12px;" onclick="CMD_ACTIONS[${CMD_ACTIONS.indexOf(a)}].run()">${escapeHtml(a.label)}</button>`).join('');
  if (docs.length) {
    out += `<div style="font-size:11.5px;color:var(--muted);margin-top:6px;">匹配题解 / 讲义：</div>` +
      docs.map(d => { const _eid = String(d.id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"); return `<button class="btn" style="text-align:left;justify-content:flex-start;padding:7px 12px;" onclick="closeExtModal();openDoc('${_eid}')">📄 ${escapeHtml(d.title)}</button>`; }).join('');
  }
  box.innerHTML = out || '<div style="color:var(--muted);font-size:13px;">无匹配项</div>';
};


// === Luogu / Codeforces / AtCoder Direct Connector ===
function detectProblemOjUrl(doc) {
  if (!doc) return null;
  const s = doc.title + ' ' + doc.id;
  const lg = s.match(/\b(P\d{4,5})\b/i);
  if (lg) return { oj: '洛谷', pid: lg[1].toUpperCase(), url: `https://www.luogu.com.cn/problem/${lg[1].toUpperCase()}` };
  const cf = s.match(/\bCF\s*(\d{3,4})([A-Za-z]\d?)\b/i);
  if (cf) return { oj: 'CF', pid: `CF${cf[1]}${cf[2].toUpperCase()}`, url: `https://codeforces.com/contest/${cf[1]}/problem/${cf[2].toUpperCase()}` };
  return null;
}

function getOjLinkHtml(doc) {
  const info = detectProblemOjUrl(doc);
  if (!info) return '';
  return `<a class="btn" href="${info.url}" target="_blank" rel="noopener noreferrer" title="打开 ${info.oj} 原题页面">🔗 ${info.pid}</a>`;
}

let ojState = { query: 'CF1900D', cfHandle: '', atcHandle: '', lastFetched: null };

window.openOjModal = function(presetQ) {
  if (presetQ) ojState.query = presetQ;
  const bd = document.getElementById('extModalBackdrop');
  const titleEl = document.getElementById('extModalTitle');
  const bodyEl = document.getElementById('extModalBody');
  const modalBox = bd?.querySelector('.ext-modal');
  if (modalBox) modalBox.style.width = 'min(880px, 95vw)';
  if (!bd || !bodyEl) return;
  titleEl.textContent = '洛谷 / Codeforces / AtCoder 直连中心';
  bodyEl.innerHTML = `
    <div class="calc-box">
      <div style="font-weight:700;font-size:13.5px;">📥 1. 抓取题面与样例一键导入内置编译器（需运行 local_cpp_runner.py）</div>
      <div class="calc-row">
        <input id="ojQueryInput" class="ext-search" style="flex:1;" type="text" value="${escapeHtml(ojState.query)}" placeholder="输入题号或 URL：如 P1001、CF1900D、abc350_d" oninput="ojState.query=this.value" />
        <button id="ojFetchBtn" class="btn btn-primary" onclick="fetchOjIntoWorkbench()">抓取样例</button>
        <button class="btn" onclick="openOjDirectUrl()">🔗 打开原题</button>
      </div>
      <div id="ojFetchResult" style="font-size:12.5px;color:var(--muted);">支持：洛谷 (P1001)、Codeforces (CF1900D)、AtCoder (abc350_d) 或完整链接。</div>
    </div>

    <div class="calc-box">
      <div style="font-weight:700;font-size:13.5px;">2. 同步 Codeforces / AtCoder 个人 AC 记录到工作台进度</div>
      <div class="calc-row">
        <input id="cfHandleInput" class="calc-input" type="text" value="${escapeHtml(ojState.cfHandle)}" placeholder="Codeforces Handle (如 tourist)" oninput="ojState.cfHandle=this.value" />
        <button class="btn" onclick="syncCfSubmissions()">同步 CF AC</button>
        <input id="atcHandleInput" class="calc-input" type="text" value="${escapeHtml(ojState.atcHandle)}" placeholder="AtCoder ID" oninput="ojState.atcHandle=this.value" />
        <button class="btn" onclick="syncAtcoderSubmissions()">同步 AtCoder AC</button>
      </div>
      <div id="ojSyncResult" style="font-size:12.5px;color:var(--muted);">通过官方公开 API 拉取已 AC 题号，自动将工作台内匹配的题目设为「✓ 已掌握」。</div>
    </div>`;
  bd.classList.add('open');
};

window.openOjDirectUrl = function() {
  const q = (ojState.query || '').trim();
  let url = q;
  if (/^https?:\/\//i.test(q)) url = q;
  else if (/^(P|B)\d+/i.test(q)) url = `https://www.luogu.com.cn/problem/${q.toUpperCase()}`;
  else {
    const m = q.match(/^(?:CF)?(\d+)([A-Za-z]\d?)$/i);
    if (m) url = `https://codeforces.com/contest/${m[1]}/problem/${m[2].toUpperCase()}`;
    else if (/^[a-z]+\d+_[a-z0-9]+$/i.test(q)) {
      url = `https://atcoder.jp/contests/${q.toLowerCase().replace(/_[^_]+$/, '')}/tasks/${q.toLowerCase()}`;
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

window.fetchOjIntoWorkbench = async function() {
  const btn = document.getElementById('ojFetchBtn');
  const box = document.getElementById('ojFetchResult');
  if (!btn || !box) return;
  btn.disabled = true; btn.textContent = '抓取中...';
  try {
    const resp = await fetch(`${getRunnerApiBase()}/fetch_oj`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: ojState.query })
    });
    const res = await resp.json();
    if (!res.ok) {
      box.innerHTML = `<span style="color:#ef4444;">${escapeHtml(res.error || '抓取失败')}</span>` +
        (res.url ? ` <a href="${res.url}" target="_blank" rel="noopener">打开原题页</a>` : '');
    } else {
      ojState.lastFetched = res;
      box.innerHTML = `
        <div style="color:var(--green);font-weight:600;margin-bottom:6px;">✓ 已抓取 [${escapeHtml(res.oj)}] ${escapeHtml(res.title)}（时限 ${res.time_limit_ms}ms / 内存 ${res.mem_limit_mb}MB / 样例 ${res.samples.length} 组）</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-primary" style="font-size:12px;" onclick="applyFetchedOjToIde()">▶ 带入编译器评测</button>
          <a class="btn" style="font-size:12px;" href="${res.submit_url || res.url}" target="_blank" rel="noopener">🚀 复制当前代码并去提交</a>
        </div>`;
    }
  } catch (e) {
    box.innerHTML = '<span style="color:#ef4444;">未检测到本地桥接服务，请先在目录运行：<code>python3 local_cpp_runner.py</code></span>';
  } finally {
    btn.disabled = false; btn.textContent = '抓取样例';
  }
};

window.applyFetchedOjToIde = function() {
  const res = ojState.lastFetched;
  if (!res) return;
  const s0 = (res.samples && res.samples[0]) ? res.samples[0] : {};
  const rawIn = String(s0.stdin || s0.in || '');
  const rawOut = String(s0.expected || s0.out || '');
  const tpl = `// ${res.title || ojState.query || 'OJ Problem'}\n#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    return 0;\n}`;
  if (typeof window.openIdeModal === 'function') window.openIdeModal(tpl, { stdin: rawIn, expected: rawOut, title: res.title || ojState.query || 'OJ Problem' });
};

window.syncCfSubmissions = async function() {
  const h = (ojState.cfHandle || '').trim();
  const box = document.getElementById('ojSyncResult');
  if (!h || !box) return;
  box.textContent = `正在从 Codeforces 官方 API 拉取 ${h} 的 AC 记录...`;
  try {
    const resp = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(h)}&from=1&count=500`);
    const data = await resp.json();
    if (data.status !== 'OK') { box.textContent = '拉取失败：' + (data.comment || 'Handle 不存在'); return; }
    const acSet = new Set();
    (data.result || []).forEach(sub => {
      if (sub.verdict === 'OK' && sub.problem) acSet.add(`${sub.problem.contestId}${sub.problem.index}`);
    });
    let matched = 0;
    DOCS.forEach(d => {
      const m = (d.title + ' ' + d.content.slice(0, 600)).match(/CF\s*(\d+)([A-Za-z]\d?)/i);
      if (m && acSet.has(`${m[1]}${m[2].toUpperCase()}`)) {
        mastery[d.id] = true; studyStatus[d.id] = 'done'; masteryDates[d.id] = masteryDates[d.id] || Date.now();
        matched++;
      }
    });
    saveState(); renderSidebar();
    box.innerHTML = `<span style="color:var(--green);">✓ 同步成功！共拉取 ${acSet.size} 道 CF AC 题，自动点亮工作台内 ${matched} 篇对应题解。</span>`;
  } catch (e) {
    box.textContent = '请求 Codeforces API 失败（请检查网络连接）。';
  }
};

window.syncAtcoderSubmissions = async function() {
  const h = (ojState.atcHandle || '').trim();
  const box = document.getElementById('ojSyncResult');
  if (!h || !box) return;
  box.textContent = `正在从 AtCoder Problems API 拉取 ${h} 的 AC 记录...`;
  try {
    const resp = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(h)}&from_second=0`);
    const list = await resp.json();
    const acSet = new Set();
    (Array.isArray(list) ? list : []).forEach(sub => { if (sub.result === 'AC') acSet.add(sub.problem_id); });
    box.innerHTML = `<span style="color:var(--green);">✓ 已获取 ${acSet.size} 道 AtCoder AC 记录（如：${Array.from(acSet).slice(0, 5).join(', ')}）。</span>`;
  } catch (e) {
    box.textContent = '请求 AtCoder Problems API 失败（请检查网络连接）。';
  }
};


window.toggleSpoilerMode = function() {
  spoilerMode = !spoilerMode;
  if (activeId) openDoc(activeId);
};

function applySpoilerLadder() {
  const art = document.getElementById('mdArticle');
  if (!art || !spoilerMode) return;
  const children = Array.from(art.children);
  let stage = 0;
  const buckets = { 1: [], 2: [], 3: [] };
  children.forEach(el => {
    if (/^H[123]$/.test(el.tagName)) {
      const txt = el.textContent;
      if (txt.includes('二、') || txt.includes('核心直觉') || txt.includes('题眼')) stage = 1;
      else if (txt.includes('三、') || txt.includes('四、') || txt.includes('建模') || txt.includes('推导')) stage = Math.max(stage, 2);
      else if (txt.includes('五、') || txt.includes('代码') || txt.includes('六、') || txt.includes('七、') || txt.includes('八、')) stage = 3;
      else if (stage === 0 && (txt.includes('思路') || txt.includes('解法'))) stage = 2;
    }
    if (stage > 0) {
      el.classList.add('spoiler-hidden');
      el.dataset.spoilerStage = String(stage);
      buckets[stage].push(el);
    }
  });
  const labels = {
    1: ['提示 1：核心直觉与切入点', '解锁提示 1'],
    2: ['提示 2：建模与状态推导', '解锁提示 2'],
    3: ['完整题解、C++ 代码与踩坑总结', '全部解锁']
  };
  [1, 2, 3].forEach(st => {
    if (!buckets[st].length) return;
    const gate = document.createElement('div');
    gate.className = 'spoiler-gate';
    gate.id = 'spoilerGate_' + st;
    gate.innerHTML = `<span style="font-size:13px;font-weight:600;">${labels[st][0]}</span><button class="btn btn-primary" style="height:28px;padding:0 12px;font-size:12px;" onclick="unlockSpoilerStage(${st})">${labels[st][1]}</button>`;
    art.insertBefore(gate, buckets[st][0]);
  });
}

window.unlockSpoilerStage = function(st) {
  const art = document.getElementById('mdArticle');
  if (!art) return;
  art.querySelectorAll(`[data-spoiler-stage="${st}"]`).forEach(el => el.classList.remove('spoiler-hidden'));
  const gate = document.getElementById('spoilerGate_' + st);
  if (gate) gate.remove();
};

window.openAnalyticsModal = function() {
  const bd = document.getElementById('extModalBackdrop');
  const titleEl = document.getElementById('extModalTitle');
  const bodyEl = document.getElementById('extModalBody');
  if (!bd || !bodyEl) return;
  const domains = [
    { name: '动态规划', keys: ['dp', '背包', '状压', '区间', '树形'] },
    { name: '图论网络流', keys: ['图', '最短路', 'tarjan', '缩点', '最大流', '生成树', '拓扑', '2sat'] },
    { name: '数据结构', keys: ['线段树', '树状数组', 'st表', '并查集', '堆', '栈', '可持久化', '平衡树'] },
    { name: '字符串', keys: ['字符串', 'kmp', 'ac自动机', '字典树', '哈希', '后缀'] },
    { name: '数论几何', keys: ['素数', '筛', '逆元', '快速幂', '矩阵', '凸包', '几何', '博弈', '线性基', '莫比乌斯', 'fft'] },
    { name: '搜索与贪心', keys: ['搜索', 'dfs', 'bfs', '二分', '贪心', '排序', '构造', '分治'] }
  ];
  const probDocs = DOCS.filter(d => d.group === '洛谷104题' || (d.group === 'WF专题200题' && d.id !== 'v4_00_index'));
  const scores = domains.map(dom => {
    const matched = probDocs.filter(d => dom.keys.some(k => (d.title + d.id).toLowerCase().includes(k)));
    const tot = Math.max(1, matched.length);
    const done = matched.filter(d => mastery[d.id]).length;
    return { name: dom.name, done, tot, pct: Math.round((done / tot) * 100) };
  });
  const cx = 130, cy = 130, R = 88;
  const pt = (i, r) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
    return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
  };
  const rings = [0.33, 0.66, 1].map(f => `<polygon points="${[0,1,2,3,4,5].map(i => pt(i, R*f).map(v=>v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="var(--border-strong)" stroke-width="1"/>`).join('');
  const axes = [0,1,2,3,4,5].map(i => {
    const [x, y] = pt(i, R);
    const [lx, ly] = pt(i, R + 18);
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="1"/>
            <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="var(--text)" font-size="11">${scores[i].name}</text>`;
  }).join('');
  const polyPts = scores.map((s, i) => pt(i, R * Math.max(0.12, s.pct / 100)).map(v => v.toFixed(1)).join(',')).join(' ');
  const dayCounts = new Array(80).fill(0);
  if (typeof roadmapState !== 'undefined' && roadmapState.subDone) {
    Object.values(roadmapState.subDone).forEach(d => { if (d >= 1 && d <= 80) dayCounts[d - 1]++; });
  }
  const hmHtml = dayCounts.map((c, i) => `<div class="hm-cell ${c >= 3 ? 'l3' : c === 2 ? 'l2' : c === 1 ? 'l1' : ''}" title="Day ${i+1}: ${c}"></div>`).join('');
  titleEl.textContent = '能力雷达图与 80 天热力图';
  bodyEl.innerHTML = `
    <div class="radar-wrap">
      <svg width="260" height="260" viewBox="0 0 260 260">${rings}${axes}<polygon points="${polyPts}" fill="var(--accent-glow)" stroke="var(--accent)" stroke-width="2"/></svg>
      <div style="flex:1;min-width:220px;display:flex;flex-direction:column;gap:8px;">
        ${scores.map(s => `<div style="display:flex;align-items:center;gap:8px;font-size:12.5px;"><span style="width:82px;font-weight:600;">${s.name}</span><div style="flex:1;height:6px;border-radius:999px;background:var(--border);overflow:hidden;"><div style="height:100%;width:${s.pct}%;background:var(--accent);"></div></div><span style="width:68px;text-align:right;color:var(--muted);">${s.done}/${s.tot} (${s.pct}%)</span></div>`).join('')}
      </div>
    </div>
    <div style="padding-top:8px;border-top:1px solid var(--border);"><div style="font-size:13px;font-weight:600;margin-bottom:4px;">80 天路线热力图</div><div class="heatmap-grid">${hmHtml}</div></div>`;
  bd.classList.add('open');
};

window.openCalcModal = function() {
  const bd = document.getElementById('extModalBackdrop');
  const titleEl = document.getElementById('extModalTitle');
  const bodyEl = document.getElementById('extModalBody');
  if (!bd || !bodyEl) return;
  titleEl.textContent = '复杂度与内存估算器';
  bodyEl.innerHTML = `
    <div class="calc-grid">
      <div class="calc-box">
        <div style="font-weight:600;font-size:14px;">时间复杂度估算 (1s ≈ 10⁸)</div>
        <div class="calc-row"><span style="font-size:12.5px;">n =</span><input id="calcN" class="calc-input" type="number" value="200000" oninput="updateTleCalc()" /></div>
        <div class="calc-row"><select id="calcComp" class="calc-input" onchange="updateTleCalc()"><option value="n">O(n)</option><option value="nlogn" selected>O(n log n)</option><option value="nlog2n">O(n log² n)</option><option value="nsqrtn">O(n √n)</option><option value="n2">O(n²)</option><option value="2n">O(2ⁿ)</option></select></div>
        <div id="tleVerdict" class="calc-verdict"></div>
      </div>
      <div class="calc-box">
        <div style="font-weight:600;font-size:14px;">数组内存估算</div>
        <div class="calc-row"><input id="memD1" class="calc-input" type="number" value="200005" oninput="updateMleCalc()" /><span>×</span><input id="memD2" class="calc-input" type="number" value="20" oninput="updateMleCalc()" /></div>
        <div class="calc-row"><select id="memType" class="calc-input" onchange="updateMleCalc()"><option value="4">int (4B)</option><option value="8" selected>long long (8B)</option><option value="1">bool (1B)</option></select></div>
        <div id="mleVerdict" class="calc-verdict"></div>
      </div>
    </div>`;
  bd.classList.add('open');
  updateTleCalc();
  updateMleCalc();
};

window.updateTleCalc = function() {
  const n = Math.max(1, Number(document.getElementById('calcN')?.value) || 1);
  const c = document.getElementById('calcComp')?.value || 'nlogn';
  let ops = n; const lg = Math.log2(n);
  if (c === 'nlogn') ops = n * lg; else if (c === 'nlog2n') ops = n * lg * lg; else if (c === 'nsqrtn') ops = n * Math.sqrt(n); else if (c === 'n2') ops = n * n; else if (c === '2n') ops = Math.pow(2, Math.min(n, 60));
  const el = document.getElementById('tleVerdict');
  if (el) el.textContent = `预计操作数：${ops.toExponential(2)} · ${ops <= 1e7 ? '安全' : ops <= 1e8 ? '临界' : '易超时'}`;
};

window.updateMleCalc = function() {
  const d1 = Math.max(1, Number(document.getElementById('memD1')?.value) || 1);
  const d2 = Math.max(1, Number(document.getElementById('memD2')?.value) || 1);
  const sz = Number(document.getElementById('memType')?.value) || 8;
  const mb = (d1 * d2 * sz) / (1024 * 1024);
  const el = document.getElementById('mleVerdict');
  if (el) el.textContent = `占用空间：${mb.toFixed(2)} MB · ${mb <= 128 ? '安全' : mb <= 450 ? '偏大' : '超限风险'}`;
};


function buildArticleToc() {
  const tocEl = document.getElementById('tocContainer');
  const art = document.getElementById('mdArticle');
  if (!tocEl || !art) return;
  const heads = Array.from(art.querySelectorAll('h2, h3')).slice(0, 24);
  if (heads.length < 3) { tocEl.innerHTML = ''; return; }
  heads.forEach((h, i) => { if (!h.id) h.id = 'sec_' + i; });
  tocEl.innerHTML = `<details class="toc-drawer"><summary>本篇大纲（共 ${heads.length} 节）</summary><div class="toc-list">${heads.map(h => `<a class="toc-link" onclick="document.getElementById('${h.id}')?.scrollIntoView({behavior:'smooth',block:'start'})">${escapeHtml(h.textContent.slice(0, 26))}</a>`).join('')}</div></details>`;
}

window.exportProgressJson = function() {
  const payload = { exportedAt: new Date().toISOString(), mastery, stars, notes, masteryDates, studyStatus, myAcCodes, roadmapState: typeof roadmapState !== 'undefined' ? roadmapState : {} };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(window.__WB_SUBJECT_NAME__ || '学习工作台')}存档_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};

window.importProgressJson = function() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.mastery) mastery = data.mastery;
        if (data.stars) stars = data.stars;
        if (data.notes) notes = data.notes;
        if (data.masteryDates) masteryDates = data.masteryDates;
        if (data.studyStatus) studyStatus = data.studyStatus;
        if (data.myAcCodes) myAcCodes = data.myAcCodes;
        saveState();
        if (data.roadmapState && typeof roadmapState !== 'undefined') { Object.assign(roadmapState, data.roadmapState); if (typeof saveRoadmapState === 'function') saveRoadmapState(); }
        renderSidebar();
        if (activeId) openDoc(activeId); else renderHome(activeView === "home");
        alert('学习存档恢复成功');
      } catch (e) { alert('存档格式无效：' + e.message); }
    };
    reader.readAsText(file);
  };
  inp.click();
};


let mathRetryTimer = null;
function scheduleMathRender(attempt) {
  const n = attempt || 0;
  if (mathRetryTimer) { clearTimeout(mathRetryTimer); mathRetryTimer = null; }
  const mEl = document.getElementById('mdArticle') || document.getElementById('main');
  if (!mEl) return;
  bindTermPopoverEvents();
  if (window.renderMathInElement && window.katex) {
    requestAnimationFrame(() => {
      renderMathInElement(mEl, {
        delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}],
        throwOnError: false
      });
      if (n === 0 && mEl.id === 'mdArticle') highlightAlgTerms(mEl);
    });
  } else {
    if (n === 0 && mEl.id === 'mdArticle') highlightAlgTerms(mEl);
    if (n < 12) {
      mathRetryTimer = setTimeout(() => scheduleMathRender(n + 1), 220);
    } else {
      applyOfflineMathFallback(mEl);
    }
  }
}


function triggerMainAnim() {
  const m = document.getElementById('main');
  if (!m || !m.classList) return;
  m.classList.remove('view-animate');
  requestAnimationFrame(() => m.classList.add('view-animate'));
}



(function() {
  function hydrateAllDocs(cb) {
    const cfg = window.__WB_CONFIG__ || {};
    const chunks = cfg.docChunks || [];
    if (!chunks.length) { if (cb) cb(); return; }
    let idx = 0;
    function next() {
      if (idx >= chunks.length) { if (cb) cb(); return; }
      window.__wbLoadScript(chunks[idx++], next);
    }
    next();
  }
  function hydrateAllBank(cb) {
    const cfg = window.__WB_CONFIG__ || {};
    const chunks = cfg.bankChunks || [];
    if (!chunks.length) { if (cb) cb(); return; }
    let idx = 0;
    function next() {
      if (idx >= chunks.length) { if (cb) cb(); return; }
      window.__wbLoadScript(chunks[idx++], next);
    }
    next();
  }
  window.__wbHydrateAllDocs = hydrateAllDocs;
  window.__wbHydrateAllBank = hydrateAllBank;
  window.addEventListener('DOMContentLoaded', function() {
    const si = document.getElementById('searchInput');
    if (si) {
      si.addEventListener('focus', function() { hydrateAllDocs(); }, { once: true });
    }
    setTimeout(function() {
      hydrateAllDocs(function() {
        setTimeout(function() { hydrateAllBank(); }, 400);
      });
    }, 350);
  });
})();


window.renderIcpcTextbooks = function() {
  window.scrollTo({ top: 0, behavior: "instant" });
  const main = document.getElementById('main') || document.querySelector('main');
  if (!main) return;
  activeView = 'textbook';
  activeId = null;
  if (typeof renderSidebar === 'function') renderSidebar();
  const tbList = (window.__WB_TEXTBOOK__ || []);
  const pageName = decodeURIComponent((location.pathname || '').split('/').pop() || '');
  const catList = (window.__WB_BOOK_CATALOG__ && window.__WB_BOOK_CATALOG__[pageName]) ? window.__WB_BOOK_CATALOG__[pageName] : [];
  const catBtnsHtml = catList.length ? `<div style="margin-bottom:14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">` + catList.map(b => {
    const tag = b.hasRaw ? '📖 原书逐页原文' : '📝 精编讲义版';
    return `<button class="btn btn-primary" onclick="if(typeof openGenericBookBundle==='function')openGenericBookBundle('wb-catalog-book-host','${b.id}','${b.file}','${(b.title||'').replace(/'/g,'')}');">${tag} · ${b.title}</button>`;
  }).join('') + `</div><div id="wb-catalog-book-host"></div>` : '';
  const tbDocs = (DOCS || []).filter(d => /教材|进阶指南|算法导论|紫书|蓝书|入门|零基础|先导|基础/.test((d.title||'') + (d.sub||'') + (d.group||'')));
  const list = tbDocs.length ? tbDocs : (DOCS || []).slice(0, 30);
  const subj = window.__WB_SUBJECT_NAME__ || '当前学科';
  const booksHtml = tbList.length ? `<div style="margin-bottom:22px;">
    <h3 style="margin:0 0 10px;font-size:15px;">📖 经典教材对照目录（${tbList.length} 本）</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">
      ${tbList.map(b => `<div class="doc-card" style="cursor:default;"><div style="font-weight:700;font-size:14px;margin-bottom:4px;">${escapeHtml(b.name || b.title || '')}</div><div style="font-size:12px;color:var(--muted);">${escapeHtml(b.author || '')}</div></div>`).join('')}
    </div>
  </div>` : '';
  main.innerHTML = `<div style="padding:20px;max-width:1100px;margin:0 auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
      <div>
        <h2 style="margin:0;">📚 ${escapeHtml(subj)} · 教材与零基础起步中心</h2>
        <p style="margin:4px 0 0;color:var(--muted);font-size:13px;">汇总经典教材与零基础入门精讲（共 ${list.length} 篇），点击任意卡片直接进入阅读</p>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn" onclick="renderAlgoTree()">🌳 3D 知识树</button>
        <button class="btn" onclick="openDictModal()">📖 术语词典</button>
        <button class="btn" onclick="renderHome()">← 返回总览</button>
      </div>
    </div>
    ${catBtnsHtml}${booksHtml}
    <h3 style="margin:0 0 10px;font-size:15px;">🌱 零基础与核心讲义（${list.length} 篇）</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px;">
      ${list.map((d, i) => `<div class="doc-card" tabindex="0" role="button" onclick="openDoc('${d.id}')">
        <div style="font-size:11px;color:#10b981;font-weight:700;margin-bottom:4px;">#${i+1} · ${escapeHtml(d.group || '核心专题')}</div>
        <div style="font-weight:700;font-size:14px;line-height:1.4;">${escapeHtml(d.title)}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:6px;">${escapeHtml((d.sub || '').slice(0, 60))}</div>
      </div>`).join('')}
    </div>
  </div>`;
};


function syncPortalProgress() {
  try {
    const slug = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc';
    const raw = JSON.parse(localStorage.getItem('wb_progress_summary_v1') || '{}');
    const docDone = Object.keys(mastery || {}).filter(k => mastery[k] && DOCS.some(d => d.id === k)).length;
    const bankDone = PROBLEM_BANK.filter(p => isBankProbDone(p)).length;
    raw[slug] = { docsDone: docDone, docsTotal: DOCS.length, bankDone: bankDone, bankTotal: PROBLEM_BANK.length };
    localStorage.setItem('wb_progress_summary_v1', JSON.stringify(raw));
  } catch(e) {}
}

window.addEventListener("DOMContentLoaded", function(){ setTimeout(syncPortalProgress, 200); });


(function() {
  window.addEventListener('DOMContentLoaded', function() {
    const slug = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc';
    const subj = window.__WB_SUBJECT_NAME__ || '学科';
    if (slug === 'icpc') return;
    const aiTitle = document.querySelector('#aiDrawer .ai-head strong, #aiDrawer h3, #aiDrawer .ai-title');
    if (aiTitle) aiTitle.textContent = 'AI ' + subj + '助教';
    const aiWelcome = document.querySelector('#aiMessages .ai-msg.assistant');
    if (aiWelcome && aiWelcome.textContent.includes('ICPC')) {
      aiWelcome.textContent = '你好！我是你的 ' + subj + ' 随身助教。遇到公式推导、概念理解或习题卡壳，都可以直接问我。';
    }
    const aiInp = document.getElementById('aiInput');
    if (aiInp) aiInp.placeholder = '输入 ' + subj + ' 相关问题、公式或推导疑问...';
    const chips = document.querySelectorAll('#aiDrawer .ai-chip, #aiDrawer button[onclick*="askAiQuick"]');
    const newChips = [
      ['梳理核心概念与直觉', '请用大白话梳理当前专题的核心概念与直觉。'],
      ['典型例题分步推导', '请给出一道当前专题的典型例题并做分步推导。'],
      ['常见易错点避坑', '总结这一块最容易踩的坑和易错点。']
    ];
    chips.forEach(function(ch, i) {
      if (newChips[i]) {
        ch.textContent = newChips[i][0];
        ch.setAttribute('onclick', "askAiQuick('" + newChips[i][1] + "')");
      }
    });
  });
})();


// === DEBUG FIX: Missing Command Palette Tools (Stress / GraphSketch / Flashcard / TRD Print) & Hash Deep-Link Routing ===
if (typeof window.openStressModal !== 'function') {
  window.openStressModal = function() {
    const bd = document.getElementById('extModalBackdrop');
    const modalBox = bd && bd.querySelector('.ext-modal');
    const titleEl = document.getElementById('extModalTitle');
    const bodyEl = document.getElementById('extModalBody');
    if (!bd || !bodyEl) return;
    if (modalBox) modalBox.style.width = 'min(980px, 96vw)';
    titleEl.textContent = '⚡ 本地在线自动对拍器 (Stress Test · 直连 /stress)';
    const defGen = '#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n    mt19937 rng(chrono::steady_clock::now().time_since_epoch().count());\n    int a = rng() % 1000, b = rng() % 1000;\n    cout << a << " " << b << "\\n";\n    return 0;\n}';
    const defBf = '#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n    long long a, b; cin >> a >> b;\n    cout << a + b << "\\n";\n    return 0;\n}';
    const defSol = '#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n    long long a, b; cin >> a >> b;\n    cout << a + b << "\\n";\n    return 0;\n}';
    bodyEl.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;">
        <label style="font-size:13px;">对拍轮数：<input id="wbStressRounds" type="number" min="1" max="100" value="20" class="calc-input" style="width:76px;padding:4px 8px;" /></label>
        <button id="wbStressRunBtn" class="btn btn-primary" onclick="window.runWbStressTest()">▶ 启动在线对拍</button>
        <button class="btn" onclick="if(typeof openStressGenModal==='function')openStressGenModal()">📄 导出离线脚本</button>
        <button class="btn" onclick="closeExtModal()">关闭</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;">
        <div><div style="font-size:12px;font-weight:700;margin-bottom:4px;">1. 数据生成器 (gen.cpp)</div><textarea id="wbStressGen" class="stem-textarea" spellcheck="false" style="width:100%;min-height:175px;font-family:monospace;font-size:12px;"></textarea></div>
        <div><div style="font-size:12px;font-weight:700;margin-bottom:4px;">2. 暴力标程 (brute.cpp)</div><textarea id="wbStressBf" class="stem-textarea" spellcheck="false" style="width:100%;min-height:175px;font-family:monospace;font-size:12px;"></textarea></div>
        <div><div style="font-size:12px;font-weight:700;margin-bottom:4px;">3. 待测正解 (sol.cpp)</div><textarea id="wbStressSol" class="stem-textarea" spellcheck="false" style="width:100%;min-height:175px;font-family:monospace;font-size:12px;"></textarea></div>
      </div>
      <div id="wbStressOut" style="margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--bg2,rgba(148,163,184,0.1));font-family:monospace;font-size:12.5px;white-space:pre-wrap;min-height:60px;">就绪：点击「▶ 启动在线对拍」将自动编译并在本地运行多轮随机对拍，发现 WA/TLE/RE 立即输出最小 Hack 反例。</div>`;
    document.getElementById('wbStressGen').value = window.__wbStressCache?.gen || defGen;
    document.getElementById('wbStressBf').value = window.__wbStressCache?.bf || defBf;
    document.getElementById('wbStressSol').value = window.__wbStressCache?.sol || defSol;
    bd.classList.add('open');
  };
  window.runWbStressTest = async function() {
    const btn = document.getElementById('wbStressRunBtn');
    const out = document.getElementById('wbStressOut');
    const gen = document.getElementById('wbStressGen')?.value || '';
    const bf = document.getElementById('wbStressBf')?.value || '';
    const sol = document.getElementById('wbStressSol')?.value || '';
    const rounds = Math.max(1, Math.min(100, parseInt(document.getElementById('wbStressRounds')?.value || '20', 10) || 20));
    window.__wbStressCache = { gen, bf, sol };
    if (btn) { btn.disabled = true; btn.textContent = '对拍运行中...'; }
    if (out) out.textContent = `正在编译 gen / brute / sol 并执行 ${rounds} 轮对拍...`;
    try {
      const base = (typeof getRunnerApiBase === 'function') ? getRunnerApiBase() : location.origin;
      const resp = await fetch(base + '/stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gen, bf, sol, rounds })
      });
      const res = await resp.json();
      if (res.ok) {
        out.textContent = `✅ [AC] 全部 ${res.rounds} 轮对拍通过，未发现反例！`;
      } else {
        const lines = [`❌ [${res.verdict || 'ERR'}]${res.round ? ' 第 ' + res.round + '/' + res.rounds + ' 轮触发异常' : ''}`];
        if (res.stderr) lines.push('--- stderr ---\n' + res.stderr);
        if (res.hack_input !== undefined) lines.push('--- Hack Input ---\n' + res.hack_input);
        if (res.bf_out !== undefined) lines.push('--- Brute Out ---\n' + res.bf_out);
        if (res.sol_out !== undefined) lines.push('--- Sol Out ---\n' + res.sol_out);
        out.textContent = lines.join('\n');
      }
    } catch (e) {
      out.textContent = '无法连接本地运行器（请先启动 python3 local_cpp_runner.py）：' + (e.message || e);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '▶ 启动在线对拍'; }
    }
  };
}

if (typeof window.openGraphSketchModal !== 'function') {
  window.openGraphSketchModal = function() {
    const bd = document.getElementById('extModalBackdrop');
    const titleEl = document.getElementById('extModalTitle');
    const bodyEl = document.getElementById('extModalBody');
    if (!bd || !bodyEl) return;
    const modalBox = bd.querySelector('.ext-modal');
    if (modalBox) modalBox.style.width = 'min(820px, 95vw)';
    titleEl.textContent = '交互式图论 / 树形草稿画板';
    bodyEl.innerHTML = `
      <div style="display:grid;grid-template-columns:220px 1fr;gap:12px;align-items:start;">
        <div style="display:flex;flex-direction:column;gap:8px;">
          <label style="font-size:12px;color:var(--muted);">每行一条边：<code>u v [w]</code></label>
          <textarea id="gsEdgeInput" class="calc-input" style="min-height:220px;font-family:monospace;padding:8px;">1 2 4\n1 3 2\n2 4 5\n3 4 1\n3 5 7\n4 6 3\n5 6 2</textarea>
          <label style="font-size:12px;display:flex;align-items:center;gap:6px;"><input id="gsDirected" type="checkbox" onchange="window._renderGraphSketch()"> 有向图</label>
          <button class="btn btn-primary" onclick="window._renderGraphSketch()">重新绘制</button>
        </div>
        <div id="gsSvgHost" style="border:1px solid var(--border);border-radius:12px;background:var(--bg);min-height:320px;display:flex;align-items:center;justify-content:center;overflow:hidden;"></div>
      </div>`;
    bd.classList.add('open');
    window._renderGraphSketch = function() {
      const txt = (document.getElementById('gsEdgeInput')?.value || '').trim();
      const directed = !!document.getElementById('gsDirected')?.checked;
      const host = document.getElementById('gsSvgHost');
      if (!host) return;
      const edges = [];
      const nodesSet = new Set();
      txt.split(/\n+/).forEach(line => {
        const p = line.trim().split(/\s+/);
        if (p.length >= 2) {
          nodesSet.add(p[0]); nodesSet.add(p[1]);
          edges.push({ u: p[0], v: p[1], w: p[2] || '' });
        } else if (p.length === 1 && p[0]) {
          nodesSet.add(p[0]);
        }
      });
      const nodes = Array.from(nodesSet);
      const W = 520, H = 320, cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.36;
      const pos = {};
      nodes.forEach((n, i) => {
        const ang = (2 * Math.PI * i) / Math.max(1, nodes.length) - Math.PI / 2;
        pos[n] = { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
      });
      const defs = directed ? '<defs><marker id="gsArr" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#3b82f6"/></marker></defs>' : '';
      const edgeSvg = edges.map(e => {
        const a = pos[e.u], b = pos[e.v];
        if (!a || !b) return '';
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#64748b" stroke-width="2" ${directed ? 'marker-end="url(#gsArr)"' : ''}/>` +
          (e.w ? `<text x="${mx.toFixed(1)}" y="${(my - 4).toFixed(1)}" text-anchor="middle" font-size="11" fill="#3b82f6" font-weight="700">${escapeHtml(e.w)}</text>` : '');
      }).join('');
      const nodeSvg = nodes.map(n => {
        const p = pos[n];
        return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="16" fill="#2563eb" stroke="#ffffff" stroke-width="2"/><text x="${p.x.toFixed(1)}" y="${(p.y + 4).toFixed(1)}" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="700">${escapeHtml(n)}</text>`;
      }).join('');
      host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:320px;">${defs}${edgeSvg}${nodeSvg}</svg>`;
    };
    window._renderGraphSketch();
  };
}

if (typeof window.openFlashcardModal !== 'function') {
  window.openFlashcardModal = function() {
    const bd = document.getElementById('extModalBackdrop');
    const titleEl = document.getElementById('extModalTitle');
    const bodyEl = document.getElementById('extModalBody');
    if (!bd || !bodyEl) return;
    titleEl.textContent = '高频踩坑与核心概念闪卡记忆';
    const cards = [];
    if (Array.isArray(window.__WB_BANK__)) {
      window.__WB_BANK__.filter(p => p && p.keyInsight).slice(0, 60).forEach(p => {
        cards.push({ front: (p.pid ? p.pid + ' · ' : '') + (p.title || ''), back: p.keyInsight, tag: p.topic || p.tier || '题库要点' });
      });
    }
    if (cards.length < 10 && typeof DOCS !== 'undefined' && Array.isArray(DOCS)) {
      DOCS.slice(0, 40).forEach(d => {
        cards.push({ front: d.title || d.id, back: d.sub || '点击对应讲义查看完整推导与边界反例。', tag: d.group || '核心讲义' });
      });
    }
    if (!cards.length) {
      bodyEl.innerHTML = '<div style="color:var(--muted);padding:20px;">当前工作台暂无闪卡数据。</div>';
      bd.classList.add('open');
      return;
    }
    window.__fcState = { idx: 0, flipped: false, cards };
    window._renderFlashcard = function() {
      const st = window.__fcState;
      const c = st.cards[st.idx];
      bodyEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:12px;color:var(--muted);">
          <span>标签：${escapeHtml(c.tag)}</span>
          <span>第 ${st.idx + 1} / ${st.cards.length} 张</span>
        </div>
        <div onclick="window.__fcState.flipped=!window.__fcState.flipped;window._renderFlashcard();" style="cursor:pointer;min-height:170px;padding:22px;border-radius:14px;border:1.5px solid var(--accent,#2563eb);background:var(--bg);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:10px;">
          <div style="font-size:11.5px;color:var(--accent,#2563eb);font-weight:700;">${st.flipped ? '核心解析（点击翻回题目）' : '问题 / 概念（点击翻看解析）'}</div>
          <div style="font-size:15px;font-weight:600;line-height:1.65;">${escapeHtml(st.flipped ? c.back : c.front)}</div>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;">
          <button class="btn" onclick="window.__fcState.idx=(window.__fcState.idx-1+window.__fcState.cards.length)%window.__fcState.cards.length;window.__fcState.flipped=false;window._renderFlashcard();">← 上一张</button>
          <button class="btn btn-primary" onclick="window.__fcState.flipped=!window.__fcState.flipped;window._renderFlashcard();">翻转卡片</button>
          <button class="btn" onclick="window.__fcState.idx=(window.__fcState.idx+1)%window.__fcState.cards.length;window.__fcState.flipped=false;window._renderFlashcard();">下一张 →</button>
          <button class="btn" onclick="window.__fcState.idx=Math.floor(Math.random()*window.__fcState.cards.length);window.__fcState.flipped=false;window._renderFlashcard();">🎲 随机抽卡</button>
        </div>`;
    };
    bd.classList.add('open');
    window._renderFlashcard();
  };
}

if (typeof window.openTrdPrintModal !== 'function') {
  window.openTrdPrintModal = function() {
    const bd = document.getElementById('extModalBackdrop');
    const titleEl = document.getElementById('extModalTitle');
    const bodyEl = document.getElementById('extModalBody');
    if (!bd || !bodyEl) return;
    titleEl.textContent = '导出纸质参考模板 (TRD 双栏打印 / PDF)';
    const docs = (typeof DOCS !== 'undefined' && Array.isArray(DOCS)) ? DOCS : [];
    const tplDocs = docs.filter(d => /模板|词典|速查|TRD|公式/.test((d.title || '') + (d.group || ''))).slice(0, 20);
    const list = tplDocs.length ? tplDocs : docs.slice(0, 15);
    bodyEl.innerHTML = `
      <p style="font-size:12.5px;color:var(--muted);margin:0 0 10px;">勾选要纳入纸质模板（TRD）的专题文档，点击打印后选择「另存为 PDF」即可导出双栏参考手册：</p>
      <div id="trdDocChecks" style="max-height:240px;overflow:auto;display:grid;gap:6px;margin-bottom:12px;">
        ${list.map((d, i) => `<label style="display:flex;align-items:center;gap:8px;font-size:13px;"><input type="checkbox" value="${escapeHtml(d.id)}" ${i < 3 ? 'checked' : ''}/> ${escapeHtml(d.title)}</label>`).join('')}
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn" onclick="closeExtModal()">取消</button>
        <button class="btn btn-primary" onclick="window._doTrdPrint()">🖨️ 生成并打印 / 导出 PDF</button>
      </div>`;
    window._doTrdPrint = function() {
      const checked = Array.from(document.querySelectorAll('#trdDocChecks input:checked')).map(el => el.value);
      const area = document.getElementById('trdPrintArea');
      if (area) {
        const html = checked.map(id => {
          const d = docs.find(x => x.id === id);
          return d ? `<section style="margin-bottom:18px;break-inside:avoid;"><h2>${escapeHtml(d.title)}</h2><pre style="white-space:pre-wrap;font-size:11px;">${escapeHtml((d.content || d.sub || '').slice(0, 6000))}</pre></section>` : '';
        }).join('');
        area.innerHTML = html || '<p>未选择任何文档</p>';
      }
      closeExtModal();
      setTimeout(() => window.print(), 120);
    };
    bd.classList.add('open');
  };
}

// Deep-link hash routing (#doc=<id> and #prob=<pid>)
(function() {
  function applyWorkbenchHash() {
    if (Date.now() < (window.__wbSuppressHashUntil || 0)) return;
    const raw = (location.hash || '').replace(/^#/, '');
    if (!raw) return;
    const params = new URLSearchParams(raw);
    const docId = params.get('doc');
    const probId = params.get('prob');
    if (docId && typeof window.openDoc === 'function') {
      const exists = typeof DOCS !== 'undefined' && DOCS.some(d => d.id === docId);
      if (exists) {
        const pParam = params.get('p');
        if (pParam !== null && typeof window.openDocPage === 'function') {
          window.openDocPage(docId, Math.max(0, (parseInt(pParam, 10) || 1) - 1), false);
        } else {
          window.openDoc(docId);
        }
        return;
      }
    }
    if (probId && typeof PROBLEM_BANK !== 'undefined' && Array.isArray(PROBLEM_BANK)) {
      const target = PROBLEM_BANK.find(p => String(p.order) === String(probId) || p.pid === probId || p.key === probId);
      if (target && typeof window.openBankProblem === 'function') {
        window.openBankProblem(target.order);
      }
    }
  }
  window.addEventListener('hashchange', applyWorkbenchHash);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(applyWorkbenchHash, 80));
  } else {
    setTimeout(applyWorkbenchHash, 80);
  }
})();

// === SPA Internal History Stack & Pill-to-Page Router (http:// & file:// safe) ===
;(function() {
  if (window.__wbSpaHistoryInited) return;
  window.__wbSpaHistoryInited = true;
  let restoring = false;
  window.__wbNavDepth = 0;

  function closeMobileSidebar() {
    if (window.innerWidth <= 900) {
      if (typeof window.setSidebarOpen === 'function') {
        window.setSidebarOpen(false);
      } else {
        const sb = document.getElementById('sidebar') || document.querySelector('aside.sidebar, .sidebar');
        if (sb) { sb.classList.remove('open'); sb.classList.add('collapsed'); }
      }
    }
  }

  function pushNav(kind, arg, pageIdx) {
    closeMobileSidebar();
    if (restoring || !window.history || !window.history.pushState) return;
    try {
      const pIdx = (kind === 'doc' && typeof pageIdx === 'number') ? pageIdx : 0;
      const cur = window.history.state;
      if (cur && cur.__wb === 'stem' && cur.kind === kind && cur.arg === arg && (cur.pageIdx || 0) === pIdx) {
        window.dispatchEvent(new CustomEvent('wb:viewchange', { detail: { view: kind, id: arg || null } }));
        return;
      }
      const hash = kind === 'doc'
        ? ('#doc=' + encodeURIComponent(arg) + (pIdx > 0 ? ('&p=' + (pIdx + 1)) : ''))
        : (kind === 'prob' ? ('#prob=' + encodeURIComponent(arg)) : ('#view=' + encodeURIComponent(kind)));
      const nextIdx = (cur && cur.__wb === 'stem' && typeof cur.navIdx === 'number') ? (cur.navIdx + 1) : ((window.__wbNavDepth || 0) + 1);
      window.history.pushState({ __wb: 'stem', kind, arg, pageIdx: pIdx, navIdx: nextIdx }, '', hash);
      window.__wbNavDepth = nextIdx;
      try {
        window.dispatchEvent(new CustomEvent('wb:viewchange', { detail: { view: kind, id: arg || null } }));
      } catch (_) {}
    } catch (_) {}
  }

  function wrapOnce(fnName, kind, argPicker) {
    const orig = window[fnName];
    if (typeof orig !== 'function' || orig.__wbWrappedHist) return;
    const wrapped = function() {
      const res = orig.apply(this, arguments);
      const arg = argPicker ? argPicker.apply(this, arguments) : '';
      const pIdx = (kind === 'doc' && window.__wbDocPageState && window.__wbDocPageState.docId === arg)
        ? (window.__wbDocPageState.pageIdx || 0)
        : 0;
      pushNav(kind, arg, pIdx);
      return res;
    };
    wrapped.__wbWrappedHist = true;
    window[fnName] = wrapped;
  }

  function installHooks() {
    try {
      if (!window.history.state || window.history.state.__wb !== 'stem') {
        const rawH = (location.hash || '').replace(/^#/, '');
        const hp = new URLSearchParams(rawH);
        const curDoc = (typeof activeId === 'string' && activeView === 'reader') ? activeId : '';
        const curProb = (activeView === 'bank_reader' && hp.get('prob')) ? hp.get('prob') : '';
        const initState = curDoc
          ? { __wb: 'stem', kind: 'doc', arg: curDoc, pageIdx: (window.__wbDocPageState?.pageIdx || 0), navIdx: 0 }
          : (curProb
            ? { __wb: 'stem', kind: 'prob', arg: curProb, pageIdx: 0, navIdx: 0 }
            : { __wb: 'stem', kind: 'home', arg: '', pageIdx: 0, navIdx: 0 });
        window.history.replaceState(initState, '', location.hash || '#view=home');
      }
    } catch (_) {}

    wrapOnce('renderHome', 'home');
    wrapOnce('renderAlgoTree', 'tree');
    wrapOnce('renderRoadmap', 'roadmap');
    wrapOnce('renderIcpcTextbooks', 'books');
    wrapOnce('openDoc', 'doc', (id) => id);
    wrapOnce('openBankProblem', 'prob', (ord) => ord);

    // Hook onPillClick so problem pills jump to the matching independent split page
    const origPill = window.onPillClick;
    window.onPillClick = function(anchorId, label) {
      const pgs = window.__wbCurDocPages;
      if (pgs && pgs.length >= 2 && typeof activeId === 'string' && activeId) {
        const kw1 = String(anchorId || '').trim().toLowerCase();
        const kw2 = String(label || '').trim().toLowerCase();
        const hit = pgs.findIndex(pg => {
          const t = (pg.title || '').toLowerCase();
          return (kw1 && t.includes(kw1)) || (kw2 && t.includes(kw2));
        });
        if (hit >= 0) {
          window.openDocPage(activeId, hit, false);
          return false;
        }
      }
      if (typeof origPill === 'function') return origPill.apply(this, arguments);
      return true;
    };
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(installHooks, 120));
  window.addEventListener('popstate', (ev) => {
    const st = ev.state;
    if (!st || st.__wb !== 'stem') return;
    window.__wbSuppressHashUntil = Date.now() + 250;
    window.__wbNavDepth = typeof st.navIdx === 'number' ? st.navIdx : Math.max(0, (window.__wbNavDepth || 1) - 1);
    restoring = true;
    try {
      closeMobileSidebar();
      if (st.kind === 'home' && typeof window.renderHome === 'function') window.renderHome();
      else if (st.kind === 'tree' && typeof window.renderAlgoTree === 'function') window.renderAlgoTree();
      else if (st.kind === 'roadmap' && typeof window.renderRoadmap === 'function') window.renderRoadmap();
      else if (st.kind === 'books' && typeof window.renderIcpcTextbooks === 'function') window.renderIcpcTextbooks();
      else if (st.kind === 'doc' && st.arg && typeof window.openDoc === 'function') {
        window.__wbDocPageState = { docId: st.arg, pageIdx: Number(st.pageIdx) || 0, showAll: false };
        window.openDoc(st.arg, '');
      }
      else if (st.kind === 'prob' && st.arg !== '' && typeof window.openBankProblem === 'function') window.openBankProblem(st.arg);
    } finally {
      restoring = false;
      try {
        window.dispatchEvent(new CustomEvent('wb:viewchange', { detail: { view: st.kind || 'home', id: st.arg || null } }));
      } catch (_) {}
    }
  });
})();
