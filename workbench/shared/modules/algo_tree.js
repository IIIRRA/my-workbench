/* === Module: Subject Knowledge / Algorithm Tree & Tiered Bank === */
function isBankProbDone(p) {
  if (!p) return false;
  if (p.isMotherDoc && p.key && isProbDone(p.key)) return true;
  return !!bankDone[p.key];
}
window.toggleBankProbDone = function(key) {
  bankDone[key] = !bankDone[key];
  try { localStorage.setItem(BANK_DONE_KEY, JSON.stringify(bankDone)); } catch (e) {}
  if (typeof syncPortalProgress === 'function') syncPortalProgress();
  const p = PROBLEM_BANK.find(x => x.key === key);
  if (p) openBankProblem(p.order);
};

const ALGO_TREE_BRANCHES = [
  {
    name: '分支一 · 基础思维、模拟、贪心与构造',
    tierRange: 'L0 – L3',
    nodes: [
      { id: 'basics_sim', name: '基础模拟与枚举', range: 'L0–L1' },
      { id: 'basics_greedy', name: '贪心与排序策略', range: 'L0–L3' },
      { id: 'basics_bsearch', name: '二分查找与双指针', range: 'L1–L3' },
      { id: 'basics_adhoc', name: '思维构造 Ad-hoc', range: 'L1–L3' }
    ]
  },
  {
    name: '分支二 · 搜索、图论与网络流',
    tierRange: 'L1 – L5',
    nodes: [
      { id: 'graph_search', name: 'DFS / BFS 与拓扑序', range: 'L1–L2' },
      { id: 'graph_sp', name: '最短路与差分约束', range: 'L2–L4' },
      { id: 'graph_conn', name: '生成树、Tarjan 与 2-SAT', range: 'L2–L4' },
      { id: 'graph_tree', name: '树上问题、LCA 与树剖', range: 'L2–L4' },
      { id: 'graph_flow', name: '网络流与二分图匹配', range: 'L3–L5' }
    ]
  },
  {
    name: '分支三 · 动态规划全阶梯',
    tierRange: 'L0 – L5',
    nodes: [
      { id: 'dp_linear', name: '线性 DP 与背包模型', range: 'L0–L2' },
      { id: 'dp_tree_interval', name: '区间 DP 与树状/换根 DP', range: 'L2–L4' },
      { id: 'dp_bitmask_digit', name: '状压 DP 与数位 DP', range: 'L2–L4' },
      { id: 'dp_opt', name: 'DP 优化（单调队列/斜率/数据结构）', range: 'L3–L5' }
    ]
  },
  {
    name: '分支四 · 数据结构与离线分治',
    tierRange: 'L0 – L5',
    nodes: [
      { id: 'ds_basic', name: '前缀和、单调栈/队列与堆', range: 'L0–L2' },
      { id: 'ds_dsu_bit', name: '并查集、ST表与树状数组', range: 'L1–L3' },
      { id: 'ds_segtree', name: '线段树与扫描线', range: 'L2–L4' },
      { id: 'ds_adv', name: '可持久化、平衡树与 LCT', range: 'L3–L5' },
      { id: 'ds_offline', name: '分块、莫队、CDQ 与整体二分', range: 'L3–L5' }
    ]
  },
  {
    name: '分支五 · 字符串、数论、多项式与计算几何',
    tierRange: 'L1 – L5',
    nodes: [
      { id: 'str_kmp_trie', name: '哈希、KMP、Trie 与 AC自动机', range: 'L1–L3' },
      { id: 'str_sam_sa', name: '后缀数组、SAM 与回文自动机', range: 'L3–L5' },
      { id: 'math_nt', name: '素数筛、逆元、数论分块与反演', range: 'L1–L4' },
      { id: 'math_combo_poly', name: '组合计数、容斥与 FFT/NTT', range: 'L2–L5' },
      { id: 'math_linalg_game', name: '高斯消元、线性基与博弈论', range: 'L2–L4' },
      { id: 'geo_all', name: '计算几何（凸包/半平面交/卡壳）', range: 'L2–L5' }
    ]
  },
  {
    name: '分支六 · ICPC 区域赛 / EC-Final / WF 实战套题',
    tierRange: 'L1 – L5',
    nodes: [
      { id: 'icpc_signin', name: 'ICPC 签到与铜牌题', range: 'L1–L2' },
      { id: 'icpc_regional', name: 'ICPC 银牌与金牌中档题', range: 'L3–L4' },
      { id: 'icpc_wf', name: 'ICPC EC-Final / WF 压轴题', range: 'L4–L5' }
    ]
  }
];

let activeTreeNode = 'ALL';
let activeTierFilter = 'ALL';
let treeZeroOnly = false;
let bankListLimit = 40;

window.selectTreeNode = function(nodeId) {
  activeTreeNode = nodeId;
  bankListLimit = 40;
  renderAlgoTree(true);
  const el = document.getElementById('treeProblemPanel');
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
window.setTreeTier = function(t) { activeTierFilter = t; bankListLimit = 40; renderAlgoTree(true); };
window.toggleTreeZeroOnly = function() { treeZeroOnly = !treeZeroOnly; bankListLimit = 40; renderAlgoTree(true); };
window.showMoreBank = function() { bankListLimit += 40; renderAlgoTree(true); };


function getSubjectTreeBranches() {
  if (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug === 'icpc') {
    return ALGO_TREE_BRANCHES.map(br => ({
      name: br.name,
      tierRange: br.tierRange,
      nodes: br.nodes.map(nd => {
        const items = PROBLEM_BANK.filter(p => p.treeNode === nd.id);
        return {
          id: nd.id,
          name: nd.name,
          range: nd.range,
          count: items.length,
          done: items.filter(p => isBankProbDone(p)).length,
          zeroCount: items.filter(p => p.zeroFriendly).length,
          filterType: 'treeNode'
        };
      })
    }));
  }
  const topicMap = {};
  PROBLEM_BANK.forEach(p => {
    const t = (p.topic || '综合练习').replace(/([A-Za-z0-9])\s+([\u4e00-\u9fa5])/g, '$1$2').replace(/([\u4e00-\u9fa5])\s+([A-Za-z0-9])/g, '$1$2');
    if (!topicMap[t]) topicMap[t] = [];
    topicMap[t].push(p);
  });
  const topics = Object.keys(topicMap);
  const bCount = Math.min(6, Math.max(3, Math.ceil(topics.length / 4)));
  const branches = Array.from({ length: bCount }, (_, i) => ({
    name: `分支 ${i + 1} · 核心专题集群`,
    tierRange: 'L1 – L3',
    nodes: []
  }));
  topics.forEach((t, idx) => {
    const items = topicMap[t];
    branches[idx % bCount].nodes.push({
      id: t,
      name: t,
      range: 'L1–L3',
      count: items.length,
      done: items.filter(p => isBankProbDone(p)).length,
      zeroCount: items.filter(p => p.zeroFriendly).length,
      filterType: 'topic'
    });
  });
  return branches.filter(b => b.nodes.length > 0);
}

window.renderAlgoTree = function(preserveScroll) {
  const wasTree = (activeView === "tree");
  const savedY = (preserveScroll && wasTree) ? (window.scrollY || 0) : 0;
  if (!preserveScroll) triggerMainAnim();
  activeView = 'tree';
  activeId = null;
  renderSidebar();

  const totalDone = PROBLEM_BANK.filter(p => isBankProbDone(p)).length;
  const zeroTotal = PROBLEM_BANK.filter(p => p.zeroFriendly).length;

  const dynBranches = getSubjectTreeBranches();
  const branchesHtml = dynBranches.map(br => {
    const nodesHtml = br.nodes.map(nd => {
      const items = nd.filterType === 'topic' ? PROBLEM_BANK.filter(p => (p.topic || '综合练习').replace(/([\u4e00-\u9fa5])\s+([A-Za-z0-9])/g, '$1$2').replace(/([A-Za-z0-9])\s+([\u4e00-\u9fa5])/g, '$1$2') === nd.id) : PROBLEM_BANK.filter(p => p.treeNode === nd.id);
      const doneN = items.filter(p => isBankProbDone(p)).length;
      const zeroN = items.filter(p => p.zeroFriendly).length;
      const pct = items.length ? Math.round((doneN / items.length) * 100) : 0;
      return `<button class="tree-node-card ${activeTreeNode === nd.id ? 'active' : ''}" onclick="selectTreeNode('${nd.id}')">
        <div class="tree-node-top">
          <span class="tree-node-name">${escapeHtml(nd.name)}</span>
          <span class="tier-badge">${nd.range}</span>
        </div>
        <div class="tree-node-meta">
          <span>${doneN} / ${items.length} 题</span>
          ${zeroN > 0 ? `<span class="zero-badge">零基础可看 ${zeroN}</span>` : '<span>进阶专题</span>'}
        </div>
        <div class="tree-node-bar"><i style="width:${pct}%"></i></div>
      </button>`;
    }).join('');
    return `<div class="tree-branch">
      <div class="tree-branch-head">
        <div class="tree-branch-title">${escapeHtml(br.name)}</div>
        <span class="tier-badge">${br.tierRange}</span>
      </div>
      <div class="tree-nodes-grid">${nodesHtml}</div>
    </div>`;
  }).join('');

  const filtered = PROBLEM_BANK.filter(p => {
    if (activeTreeNode !== 'ALL' && ((window.__WB_CONFIG__ && window.__WB_CONFIG__.slug !== "icpc") ? (((p.topic || "综合练习").replace(/([A-Za-z0-9])\s+([\u4e00-\u9fa5])/g, "$1$2").replace(/([\u4e00-\u9fa5])\s+([A-Za-z0-9])/g, "$1$2")) !== activeTreeNode) : (p.treeNode !== activeTreeNode))) return false;
    if (activeTierFilter !== 'ALL' && p.tier !== activeTierFilter) return false;
    if (treeZeroOnly && !p.zeroFriendly) return false;
    return true;
  });
  const visible = filtered.slice(0, bankListLimit);
  const curNodeLabel = activeTreeNode === 'ALL' ? `全部 ${(PROBLEM_BANK || []).length.toLocaleString()} 题（按 L0 → L5 推荐顺序）` : (ALGO_TREE_BRANCHES.flatMap(b => b.nodes).find(n => n.id === activeTreeNode)?.name || activeTreeNode);

  const listHtml = visible.map(p => {
    const done = isBankProbDone(p);
    const clickAttr = p.isMotherDoc
      ? `openDoc('${p.docId}', '${p.anchor || ''}')`
      : `openBankProblem(${p.order})`;
    return `<div class="bank-row" onclick="${clickAttr}">
      <div class="bank-row-left">
        <span class="bank-order">#${String(p.order).padStart(4, '0')}</span>
        <span class="tier-badge ${p.tier}">${p.tier}</span>
        ${p.zeroFriendly ? '<span class="zero-badge">零基础可看</span>' : ''}
        <span class="bank-title">${escapeHtml(p.pid)} · ${escapeHtml(p.title)}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
        <span style="font-size:12px;color:var(--muted);">${escapeHtml(p.oj)}${p.cfRating ? ' · ' + p.cfRating : ''}</span>
        <span class="badge ${done ? 'done' : ''}">${done ? '✓ 已掌握' : (p.isMotherDoc ? '零基础长文' : '3级Hint盲做')}</span>
      </div>
    </div>`;
  }).join('');

  document.getElementById('main').innerHTML = `<div class="tree-shell">
    <div class="tree-root-banner">
      <div>
        <div class="hero-eyebrow">${PROBLEM_BANK.length.toLocaleString()} 题分级体系 · 3D 知识树交互定位</div>
        <h1 style="margin:4px 0 6px;font-size:28px;">${window.__WB_SUBJECT_NAME__ || "ICPC"} · 3D 立体知识树与分级题库</h1>
        <p style="margin:0;color:var(--muted);font-size:14px;">点击下方任意${(window.__WB_CONFIG__ && window.__WB_CONFIG__.slug === "icpc") ? "算法树" : "知识树"}节点，即可按推荐顺序刷该分支题目；共 ${PROBLEM_BANK.length} 题（其中 ${zeroTotal} 题标注「零基础可看」，已完成 ${totalDone} 题）。</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn ${activeTreeNode==='ALL'?'btn-primary':''}" onclick="selectTreeNode('ALL')">显示全部 ${PROBLEM_BANK.length.toLocaleString()} 题顺序</button>
        <button class="btn ${treeZeroOnly?'btn-primary':''}" onclick="toggleTreeZeroOnly()">${treeZeroOnly ? '✓ 仅看零基础可看' : '筛选：仅零基础可看'}</button>
      </div>
    </div>
    <details class="wb-cat-collapse" ontoggle="if(this.open){setTimeout(()=>window.dispatchEvent(new Event('resize')),60);}">
      <summary class="wb-cat-summary">
        <span class="wb-cat-cur">🌳 <strong>3D 知识星图与专题分支导航</strong></span>
        <span class="wb-cat-toggle">展开浏览 ▾</span>
      </summary>
      <div class="tree-branches" style="margin-top:8px;"><div id="wbFineTree3D"></div>${branchesHtml}</div>
    </details>
    <div class="z2h-card" id="treeProblemPanel">
      <div class="z2h-head">
        <div class="z2h-title">${escapeHtml(curNodeLabel)} <span style="font-size:12.5px;color:var(--muted);font-weight:500;">（共命中 ${filtered.length} 题）</span></div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          ${['ALL','L0','L1','L2','L3','L4','L5'].map(t => `<button class="btn ${activeTierFilter===t?'btn-primary':''}" style="height:28px;padding:0 10px;font-size:12px;" onclick="setTreeTier('${t}')">${t==='ALL'?'全部级别':t}</button>`).join('')}
        </div>
      </div>
      <div class="bank-list">${listHtml || '<div style="padding:24px;text-align:center;color:var(--muted);">当前筛选条件下暂无题目</div>'}</div>
      ${filtered.length > bankListLimit ? `<div class="load-more-wrap" style="margin-top:14px;"><button class="btn" onclick="showMoreBank()">展开更多题目（剩余 ${filtered.length - bankListLimit} 题）</button></div>` : ''}
    </div>
  </div>`;
  if (window.mountFineTree3D) { window.mountFineTree3D(document.getElementById("wbFineTree3D"), dynBranches, { onNodeClick: function(nd){ selectTreeNode(nd.id); } }); }
  if (preserveScroll) window.scrollTo({ top: savedY, behavior: 'instant' });
  else window.scrollTo({ top: 0, behavior: 'instant' });
};

window.openBankProblem = function(order) {
  const _pchk = (PROBLEM_BANK || []).find(x => x.order === order || x.pid === order);
  if (_pchk && _pchk._loaded === false && typeof window.__wbHydrateAllBank === 'function') { window.__wbHydrateAllBank(() => { _pchk._loaded = true; window.openBankProblem(order); }); return; }

  const p = PROBLEM_BANK.find(x => x.order === order || x.pid === order);
  if (!p) return;
  if (p.isMotherDoc) { openDoc(p.docId, p.anchor || ''); return; }
  triggerMainAnim();
  activeView = 'bank_reader';
  activeId = p.key;
  renderSidebar();
  const done = isBankProbDone(p);
  const ojUrl = p.oj === 'Luogu' ? `https://www.luogu.com.cn/problem/${p.pid}`
    : (p.pid.startsWith('CF') ? `https://codeforces.com/problemset/problem/${p.pid.slice(2).replace(/([A-Z]\d*)$/,'/$1')}`
    : `https://vjudge.net/problem`);
  const prereqHtml = (p.prereqs || []).map((pr, idx) => {
    const _g = (typeof getActiveGlossary === 'function') ? getActiveGlossary() : (typeof ALG_GLOSSARY !== 'undefined' ? ALG_GLOSSARY : {});
    const _resolvedKey = _g[pr] ? pr : ((typeof ACTIVE_ALIAS_MAP !== 'undefined' && ACTIVE_ALIAS_MAP && ACTIVE_ALIAS_MAP.get(pr)) || '');
    const hasG = !!(_resolvedKey && _g[_resolvedKey]);
    const _safeKey = String(_resolvedKey || pr).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `${idx > 0 ? '<span class="prereq-arrow">→</span>' : ''}<button class="prereq-pill" data-pk="${escapeHtml(_resolvedKey || pr)}" onclick="${hasG ? `togglePrereqDetail('${_safeKey}')` : ''}">${escapeHtml(pr)}</button>`;
  }).join('');
  const hintsHtml = (p.hints || []).map((h, i) => `<details class="hint-card">
    <summary>第 ${i + 1} 级提示（点击展开，先独立思考再看）</summary>
    <div class="hint-card-body">${inlineFmt(h)}</div>
  </details>`).join('');
  const codeHtml = highlightCpp(p.cpp || '');
  const _rawAll = String(p.cpp || '');
  let _extractedPrompt = String(p.prompt || '');
  let _solWithoutPrompt = _rawAll;
  if (!_extractedPrompt) {
    const _pm = _rawAll.match(/^###\s*(?:题目描述|题目原文)\s*\n([\s\S]*?)(?=\n###\s|$)/);
    if (_pm) {
      _extractedPrompt = _pm[1].trim();
      _solWithoutPrompt = _rawAll.slice(_pm[0].length).trim();
    }
  }
  const _promptCardHtml = _extractedPrompt
    ? `<div class="z2h-card" style="border-left:3.5px solid var(--sg-accent,#2563eb);"><div class="z2h-title" style="margin-bottom:8px;">📝 题目原文</div><div class="md-body" style="font-size:15px;line-height:1.78;">${typeof renderMarkdown === 'function' ? renderMarkdown(_extractedPrompt) : inlineFmt(_extractedPrompt)}</div></div>`
    : '';

  document.getElementById('main').innerHTML = `<div class="reader-shell">
    <div class="reader-toolbar">
      <div class="toolbar-group">
        <button class="btn" onclick="renderAlgoTree()">← 返回${(window.__WB_CONFIG__ && window.__WB_CONFIG__.slug !== "icpc") ? "知识树状图" : "算法树状图"}</button>
        ${(() => { const _ci = PROBLEM_BANK.indexOf(p); const _prev = _ci > 0 ? PROBLEM_BANK[_ci - 1].order : null; const _next = (_ci >= 0 && _ci < PROBLEM_BANK.length - 1) ? PROBLEM_BANK[_ci + 1].order : null; return `<button class="btn" onclick="${_prev !== null ? `openBankProblem(${_prev})` : ''}" ${_prev === null ? 'disabled' : ''}>← 上一题</button>
        <button class="btn" onclick="${_next !== null ? `openBankProblem(${_next})` : ''}" ${_next === null ? 'disabled' : ''}>下一题 →</button>`; })()}
      </div>
      <div class="toolbar-group">
        ${(ojUrl && /^https?:\/\//.test(ojUrl)) ? `<a class="btn" href="${ojUrl}" target="_blank" rel="noopener noreferrer">原题链接 (${escapeHtml(p.pid)}) ↗</a>` : ''}
        <button class="btn ${done ? 'btn-primary' : ''}" onclick="toggleBankProbDone('${p.key}')">${done ? '✓ 已掌握' : '标记为已掌握'}</button>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
      <span class="tier-badge ${p.tier}">${p.tier}</span>
      ${p.zeroFriendly ? '<span class="zero-badge">零基础可看</span>' : '<span class="tier-badge">进阶独立盲做</span>'}
      <span style="font-size:13px;color:var(--muted);">推荐顺序 #${p.order} / ${PROBLEM_BANK.length} · ${escapeHtml(p.topic || '')}${p.contest ? ' · ' + escapeHtml(p.contest) : ''}${p.cfRating ? ' · Rating ' + p.cfRating : ''}</span>
    </div>
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.35;">${escapeHtml(p.pid)} · ${escapeHtml(p.title)}</h1>
    ${_promptCardHtml}
    ${prereqHtml ? `<div class="z2h-card"><div class="z2h-head"><div class="z2h-title">前置知识依赖</div></div><div class="z2h-pill-row">${prereqHtml}</div><div class="prereq-detail-box" id="prereqDetailBox"></div></div>` : ''}
    <div class="z2h-card" style="border-left:3.5px solid var(--accent);">
      <div class="z2h-title" style="margin-bottom:6px;">一句话题眼（核心突破口）</div>
      <div style="font-size:14.5px;line-height:1.65;">${inlineFmt(p.keyInsight || '')}</div>
      ${p.complexity ? `<div style="margin-top:8px;font-size:12.5px;color:var(--muted);">复杂度参考：${inlineFmt(p.complexity)}</div>` : ''}
    </div>
    <h2 style="font-size:18px;margin:20px 0 8px;">三级渐进提示（Hint Ladder）</h2>
    ${hintsHtml}
    ${(() => {
      const _rawSol = _solWithoutPrompt || String(p.cpp || '');
      const _isCodeSubj = !!(window.__WB_CONFIG__ && ["icpc","cpp","dsos"].includes(window.__WB_CONFIG__.slug));
      const _isMdSol = !_isCodeSubj || (/###\s|\*\*|\$[^$\n]+\$|\\(?:frac|sqrt|begin|text|implies|sum|int)/.test(_rawSol) && !/#include\s*<|int\s+main\s*\(/.test(_rawSol));
      if (_isMdSol) {
        const _mdRendered = (typeof renderMarkdown === 'function') ? renderMarkdown(_rawSol) : escapeHtml(_rawSol).replace(/\n/g, '<br>');
        return `<details class="hint-card" style="margin-top:16px;">
      <summary>📖 展开参考分步解析</summary>
      <div class="hint-card-body md-body" style="padding:16px 18px;line-height:1.8;">${_mdRendered}</div>
    </details>`;
      }
      return `<details class="hint-card" style="margin-top:16px;">
      <summary>展开参考 AC 标程（C++17）</summary>
      <div class="hint-card-body" style="padding:0;">
        <div class="code-wrap" style="margin:0;border:none !important;border-radius:0;">
          <div class="code-head"><span class="code-lang-badge">CODE · C++17</span><div><button class="copy-btn" onclick="runCodeBlockInIde(this)" style="margin-right:6px;">▶ 运行</button><button class="copy-btn" onclick="copyCode(this)">复制代码</button></div></div>
          <pre><code>${codeHtml}</code></pre>
        </div>
      </div>
    </details>`;
    })()}
  </div>`;
  if (typeof highlightAlgTerms === 'function') highlightAlgTerms(document.getElementById('main'));
  scheduleMathRender();
  window.scrollTo({ top: 0, behavior: 'instant' });
};

