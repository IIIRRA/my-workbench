/* === Portal Unified Controller (consolidated from index.html in R14 Step 1) === */

/* --- 1. Global Full-Library Search (Lazy-Load + Precomputed Index + 120ms Debounce + Early-Exit) --- */
(function () {
  function initGlobalSearch() {
    let list = (window.GLOBAL_SEARCH_INDEX || window.__WB_GLOBAL_INDEX__) || [];
    let gsiLoading = false;
    let gsiCbs = [];
    let debounceTimer = null;

    function prepareIndex(raw) {
      if (!Array.isArray(raw)) return [];
      for (let i = 0; i < raw.length; i++) {
        const x = raw[i];
        if (x && typeof x._q !== 'string') {
          x._q = ((x.id || '') + ' ' + (x.t || x.title || '') + ' ' + (x.s || x.sub || '') + ' ' + (x.w || x.wb || '')).toLowerCase();
        }
      }
      return raw;
    }

    if (list.length) list = prepareIndex(list);

    function ensureGlobalIndex(cb, onErr) {
      const existing = window.GLOBAL_SEARCH_INDEX || window.__WB_GLOBAL_INDEX__;
      if (existing) {
        list = prepareIndex(existing);
        if (cb) cb();
        return;
      }
      if (cb) gsiCbs.push({ ok: cb, err: onErr });
      if (gsiLoading) return;
      gsiLoading = true;
      const s = document.createElement('script');
      s.src = 'books_data/global_search_index.js';
      s.onload = function () {
        gsiLoading = false;
        list = prepareIndex(window.GLOBAL_SEARCH_INDEX || window.__WB_GLOBAL_INDEX__ || []);
        const q = gsiCbs;
        gsiCbs = [];
        q.forEach(function (item) { try { if (item.ok) item.ok(); } catch (_) {} });
      };
      s.onerror = function () {
        gsiLoading = false;
        try { s.remove(); } catch (_) {}
        const q = gsiCbs;
        gsiCbs = [];
        q.forEach(function (item) { try { if (item.err) item.err(); } catch (_) {} });
      };
      document.head.appendChild(s);
    }

    const cntEl = document.getElementById('globalSearchCount');
    const inp = document.getElementById('globalHubSearchInput');
    const res = document.getElementById('globalHubSearchRes');
    if (cntEl) cntEl.textContent = `已索引 ${(window.__WB_GLOBAL_INDEX_COUNT__ || list.length).toLocaleString()} 条课程 / 习题 / 词典 / 教材分册`;
    if (!inp || !res) return;

    const _esc = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    function runSearch() {
      const q = inp.value.trim().toLowerCase();
      if (!q) { res.innerHTML = ''; return; }
      if (!(window.GLOBAL_SEARCH_INDEX || window.__WB_GLOBAL_INDEX__)) {
        res.innerHTML = '<div style="padding:10px;color:var(--muted);font-size:13px;">正在加载全库索引，请稍候...</div>';
        ensureGlobalIndex(
          function () { runSearch(); },
          function () { res.innerHTML = '<div style="padding:10px;color:#dc2626;font-size:13px;">全库索引加载失败（离线未缓存或文件缺失），请联网或重新点击输入框重试。</div>'; }
        );
        return;
      }
      const hits = [];
      const MAX_HITS = 24;
      for (let i = 0; i < list.length; i++) {
        const x = list[i];
        if (x && x._q && x._q.indexOf(q) !== -1) {
          hits.push(x);
          if (hits.length >= MAX_HITS) break;
        }
      }
      res.innerHTML = hits.length ? hits.map((h) => {
        const w = h.w || h.wb || '';
        const k = h.k || h.kind || '条目';
        const t = _esc(h.t || h.title || '');
        const s = _esc(h.s || h.sub || '');
        const _hid = h.id ? ('#' + (k === 'prob' ? 'prob=' : 'doc=') + encodeURIComponent(h.id)) : '';
        return `<a href="./${encodeURI(w)}${_hid}" style="text-decoration:none;color:inherit;padding:10px 12px;border-radius:12px;border:1px solid var(--border-strong,#cbd5e1);background:var(--surface,rgba(127,127,127,0.04));display:block;">` +
          `<div style="font-size:12px;color:#3b82f6;font-weight:700;">${_esc(w.replace('.html', ''))} · ${_esc(k)}</div>` +
          `<div style="font-weight:700;font-size:13px;margin:3px 0;">${t}</div>` +
          `<div style="font-size:12px;color:var(--muted,#64748b);">${s}</div>` +
          `</a>`;
      }).join('') : '<div style="color:var(--muted);font-size:13px;">未找到匹配条目，换个关键词试试。</div>';
    }

    inp.addEventListener('focus', function () { ensureGlobalIndex(function () { if (inp.value.trim()) runSearch(); }); });
    inp.addEventListener('input', function () {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runSearch, 120);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initGlobalSearch);
  else initGlobalSearch();
})();

/* --- 2. Portal Workbenches Grid, Sync & Progress --- */
const WORKBENCHES = [
  { id: 'icpc', name: '1. ICPC 算法工作台', href: './ICPC全库学习工作台.html', tag: '核心主战 · 1,000题 · 10真题+5模拟', desc: '304 题零基础精解 + 696 题分级盲做 + 12 卷术语词典 + 14 类可视化、对拍器与 C++ 编译器。', total: 1000, key: 'icpc_bank1000_done_v1', focusHint: '每日 2 道模板题 + 1 道思维盲做，夯实竞赛手感' },
  { id: 'math', name: '2. 数学分析 学习工作台', href: './C4_数学分析学习工作台.html', tag: '基础底座 · 477题 · 73真题+5模拟', desc: '15 阶段 497 题零基础精讲与分级强化 + 6 大微积分可视化实验室 + 70 套校内真题。', total: 477, key: 'c4_math_workbench_v2', focusHint: '过一遍 ε-δ 极限与泰勒展开推导，扫清分析盲区' },
  { id: 'linalg', name: '3. 线性代数工作台', href: './线性代数工作台.html', tag: '基础底座 · 42课+210题 · 18真题+5模拟', desc: '42 讲深度精讲 + 85 条词典 + RREF/SVD 实验室 + 18 套真题与 5 套模拟卷。', total: 210, key: 'linalg_ex200_done_v1', focusHint: '精练特征值分解与正交投影，打通机器学习矩阵直觉' },
  { id: 'prob', name: '4. 概率统计工作台', href: './概率统计工作台.html', tag: '量化底座 · 40课+200题 · 14真题+5模拟', desc: '40 讲深度精讲 + 84 条词典 + CLT/马尔可夫链实验室 + 14 套真题与 5 套模拟卷。', total: 200, key: 'prob_wb_ex_done_v1', focusHint: '巩固贝叶斯更新与期望方差计算，支撑量化与 AI 推理' },
  { id: 'quant', name: '5. 零基础量化交易工作台', href: './量化交易工作台.html', tag: '交叉进阶 · 42课+200题 · 5实战模拟', desc: '42 讲精讲 + 84 条词典 + Python 回测/Greeks 实验室 + 5 套量化笔试模拟卷。', total: 200, key: 'quant_wb_ex_done_v1', focusHint: '完成 1 组因子正交化与凯利公式仓位推导题' },
  { id: 'dm', name: '6. 离散数学工作台', href: './离散数学工作台.html', tag: 'CS 底座 · 40课+200题 · 15真题+5模拟', desc: '40 讲精讲 + 80+ 词典 + 哈斯图/NFA 实验室 + 15 套离散/组合/图论真题与模拟卷。', total: 200, key: 'dm_wb_ex_done_v1', focusHint: '刷图论连通性、生成函数与自动机状态转移练习' },
  { id: 'phys', name: '7. 大学物理工作台', href: './大学物理工作台.html', tag: '理工底座 · 40课+200题 · 21真题+5模拟', desc: '40 讲精讲 + 80+ 词典 + 不确定度拟合/静电场/卡诺实验室 + 20 套真题与模拟卷。', total: 200, key: 'phy_wb_ex_done_v1', focusHint: '结合微积分推导刚体转动与简谐振动微分方程' },
  { id: 'dsos', name: '8. 数据结构与 OS 底层', href: './数据结构与OS工作台.html', tag: '系统底层 · 40课+200题 · 14真题+5模拟', desc: '40 讲精讲 + 80+ 词典 + 银行家算法/B+树实验室 + 14 套数据结构与 OS 真题。', total: 200, key: 'os_wb_ex_done_v1', focusHint: '重点突破 Cache Line、虚拟页表与无锁并发原语' },
  { id: 'cpp', name: '9. C++20 与量化工程实战', href: './C++20与量化工程工作台.html', tag: '工程实战 · 40课+200题 · 5实战模拟', desc: '40 讲精讲 + 80+ 词典 + C++ 微基准对比器 + 5 套大厂/HFT 笔试模拟卷。', total: 200, key: 'eng_wb_ex_done_v1', focusHint: '手写 SPSC 无锁队列并对比 Perf 缓存命中率' },
  { id: 'ai', name: '10. 人工智能底层原理与前沿', href: './人工智能工作台.html', tag: '前沿热点 · 40课+200题 · 11真题+5模拟', desc: '40 讲精讲 + 85 条词典 + 优化器地形/KV Cache 实验室 + 11 套 AI 真题与模拟卷。', total: 200, key: 'ai_wb_ex_done_v1', focusHint: '深入 Mini-GPT、LoRA、FlashAttention 与显存计算实验' },
  { id: 'arch', name: '11. 计算机硬件与体系结构工作台', href: './计算机硬件与体系结构工作台.html', tag: '硬件底座 · 40课+200题 · 25真题+5模拟', desc: '40 讲精讲 + 90 条词典 + 5级流水线/Cache 模拟器 + 25 套数电/电路/计组真题。', total: 200, key: 'arch_wb_ex_done_v1', focusHint: '打通 RISC-V 数据通路、分支预测与 Cache 映射计算' },
  { id: 'net', name: '12. 计算机网络与通信工作台', href: './计算机网络与通信工作台.html', tag: '通信底座 · 40课+200题 · 35真题+5模拟', desc: '40 讲精讲 + 89 条词典 + CIDR/拥塞控制模拟器 + 35 套计网/交换/密码学真题。', total: 200, key: 'net_wb_ex_done_v1', focusHint: '精练 TCP 三次握手状态机、拥塞窗口演进与子网划分' },
  { id: 'db', name: '13. 数据库与软件工程工作台', href: './数据库与软件工程工作台.html', tag: '数据与工程 · 40课+200题 · 10真题+5模拟', desc: '40 讲精讲 + 87 条词典 + BCNF/冲突可串行化检测器 + 10 套数据库与软工真题。', total: 200, key: 'db_wb_ex_done_v1', focusHint: '突破 InnoDB MVCC ReadView、两阶段锁与 SQL 查询优化' },
  { id: 'compiler', name: '14. 编译原理与形式语言工作台', href: './编译原理与形式语言工作台.html', tag: '语言理论 · 40课+200题 · 7真题+5模拟', desc: '40 讲精讲 + 91 条词典 + NFA/DFA 与 LL(1) 分析表生成器 + 7 套编译/形式语言真题。', total: 200, key: 'compiler_wb_ex_done_v1', focusHint: '手推 FIRST/FOLLOW 集、LR(1) 项目集规范族与图着色' }
];

const KNOWLEDGE_GRAPH = {
  '特征值': {
    summary: '特征值与特征向量是刻画线性变换主轴、系统稳定性与高维降维的核心不变量。',
    links: [
      { id: 'linalg', role: '矩阵对角化、谱定理与 SVD/PCA 降维推导' },
      { id: 'ai', role: 'LoRA 低秩分解、协方差矩阵谱分析与梯度病态条件数' },
      { id: 'quant', role: '多因子风险模型 (Barra) 主成分提取与协方差阵去噪' },
      { id: 'phys', role: '耦合振子简正模频率与量子力学定态薛定谔方程本征值' },
      { id: 'icpc', role: '矩阵快速幂加速线性递推与图论邻接矩阵谱性质' }
    ]
  },
  '梯度与微积分': {
    summary: '微分与梯度流连接了连续变化率、极值优化与物理动力学演化。',
    links: [
      { id: 'math', role: '多元偏导、链式法则、泰勒二阶近似与隐函数定理' },
      { id: 'ai', role: '反向传播自动微分、SGD/Momentum/Adam 优化器与交叉熵梯度' },
      { id: 'quant', role: '期权 Greeks (Delta/Gamma/Vega) 对冲与凸优化资产配置' },
      { id: 'phys', role: '拉格朗日动力学变分原理、麦克斯韦方程组与梯度场' }
    ]
  },
  '概率期望': {
    summary: '概率空间、条件期望与信息熵构成了不确定性建模与统计推断的通用语言。',
    links: [
      { id: 'prob', role: '贝叶斯公式、大数定律、中心极限定理与马尔可夫稳态' },
      { id: 'ai', role: '交叉熵/KL 散度、Softmax 温度采样与 Speculative Decoding 接受率' },
      { id: 'quant', role: '凯利最优仓位、随机游走布朗运动与期望收益风险比 (Sharpe)' },
      { id: 'icpc', role: '期望 DP、随机化算法复杂度分析与哈希碰撞概率' }
    ]
  },
  '图论与状态机': {
    summary: '离散图结构与有限状态自动机统领路径搜索、依赖调度与形式化推理。',
    links: [
      { id: 'dm', role: '偏序格、Warshall 传递闭包、DFA/NFA 与正则表达式自动机' },
      { id: 'icpc', role: '最短路、网络流、强连通分量与 AC 自动机字符串匹配' },
      { id: 'ai', role: '计算图反向拓扑排序、Transformer 因果掩码 DAG 与 Agent 工具调用循环' },
      { id: 'dsos', role: '进程调度状态机、死锁资源分配图与分布式共识状态机' },
      { id: 'compiler', role: '词法 DFA/NFA 转换、LL(1)/LR(1) 下推自动机与控制流图 CFG' },
      { id: 'net', role: 'TCP 连接状态机、OSPF 最短路径树与 BGP 路由收敛图' }
    ]
  },
  '内存与并发': {
    summary: '硬件存储层级、缓存局部性与无锁同步决定了高吞吐系统的真实性能上限。',
    links: [
      { id: 'dsos', role: 'CPU L1/L2 Cache Line、虚拟内存分页与原子 CAS 无锁原语' },
      { id: 'cpp', role: 'C++20 memory_order、SPSC 无锁环形队列与内存池零分配' },
      { id: 'ai', role: 'FlashAttention SRAM 分块、KV Cache 量化与显存带宽瓶颈优化' },
      { id: 'quant', role: 'L2 高频订单簿微秒级撮合、零拷贝网络与低延迟风控引擎' },
      { id: 'arch', role: 'RISC-V 流水线冒险、MESI 缓存一致性协议与内存屏障' },
      { id: 'db', role: 'Buffer Pool 页替换、B+ 树锁耦合与 MVCC 无锁快照读' }
    ]
  }
};

let activeConceptKey = '特征值';

const WB_SLUG_MAP = { math: 'c4', linalg: 'la', db: 'dbse', compiler: 'comp' };
function getWbProgress(w) {
  const slug = WB_SLUG_MAP[w.id] || w.id;
  try {
    const summary = JSON.parse(localStorage.getItem('wb_progress_summary_v1') || '{}');
    if (summary && summary[slug] && typeof summary[slug].bankDone === 'number') {
      const total = summary[slug].bankTotal || w.total;
      return { dn: Math.min(total, summary[slug].bankDone), total };
    }
  } catch (e) {}
  return { dn: Math.min(w.total, countDone(w.key)), total: w.total };
}
function countDone(k) {
  try { const o = JSON.parse(localStorage.getItem(k) || '{}'); return Object.values(o).filter(Boolean).length; }
  catch (e) { return 0; }
}

function getTodayRecommendations() {
  return WORKBENCHES
    .map((w, idx) => {
      const p = getWbProgress(w);
      const ratio = p.total > 0 ? p.dn / p.total : 0;
      return { ...w, total: p.total, dn: p.dn, pct: Math.round(ratio * 100), ratio, idx };
    })
    .sort((a, b) => a.ratio - b.ratio || a.idx - b.idx)
    .slice(0, 3);
}

window.selectConcept = function(key) {
  if (!KNOWLEDGE_GRAPH[key]) return;
  activeConceptKey = key;
  renderKnowledgeGraphBody();
  renderInnoTracker();
};

function renderKnowledgeGraphBody() {
  const pillsEl = document.getElementById('kgPills');
  const bodyEl = document.getElementById('kgBody');
  if (!pillsEl || !bodyEl) return;
  pillsEl.innerHTML = Object.keys(KNOWLEDGE_GRAPH).map(k =>
    `<button class="concept-pill ${k === activeConceptKey ? 'active' : ''}" onclick="selectConcept('${k}')">${k}</button>`
  ).join('');
  const g = KNOWLEDGE_GRAPH[activeConceptKey];
  const wbMap = Object.fromEntries(WORKBENCHES.map(w => [w.id, w]));
  bodyEl.innerHTML = `
    <div style="font-size:13px;color:var(--muted);">${g.summary}</div>
    <div class="kg-links">
      ${g.links.map(l => {
        const w = wbMap[l.id];
        if (!w) return '';
        return `<a class="kg-node" href="${w.href}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
            <strong style="font-size:13px;">${w.name}</strong>
            <span style="font-size:12px;color:var(--accent);font-weight:600;">直达 ↗</span>
          </div>
          <div style="font-size:12px;color:var(--muted);">${l.role}</div>
        </a>`;
      }).join('')}
    </div>`;
}


const INNO_KEY = 'bupt_innovation_credits_v1';
const INNO_PRESETS = [
  { label: 'S 类竞赛 · 国家级一等奖 (8分)', cat: 'S/A+/A/B+竞赛', name: 'S类竞赛国家级一等奖（如国创赛/挑战杯/ICPC亚洲区金奖）', pts: 8.0 },
  { label: 'S 类竞赛 · 国家级二等奖 (6分)', cat: 'S/A+/A/B+竞赛', name: 'S类竞赛国家级二等奖', pts: 6.0 },
  { label: 'A+ 类竞赛 · 国家级一等奖 (6分)', cat: 'S/A+/A/B+竞赛', name: 'A+类竞赛国家级一等奖', pts: 6.0 },
  { label: 'A+ 类竞赛 · 省部级一等奖 (3分)', cat: 'S/A+/A/B+竞赛', name: 'A+类竞赛省部级一等奖', pts: 3.0 },
  { label: 'A / B+ 类竞赛 · 省部级获奖 (2分)', cat: 'S/A+/A/B+竞赛', name: 'A/B+类竞赛省部级获奖', pts: 2.0 },
  { label: '大创 · 国家级结题优秀/通过 (4分)', cat: '大创/雏雁', name: '国家级大学生创新创业训练计划结题', pts: 4.0 },
  { label: '大创 · 北京市级结题 (3分)', cat: '大创/雏雁', name: '北京市级大创项目结题', pts: 3.0 },
  { label: '雏雁计划 · 结题通过 (1.5分)', cat: '大创/雏雁', name: '北邮“雏雁计划”项目结题', pts: 1.5 },
  { label: '高水平论文 / 国家发明专利授权 (4分)', cat: '论文/专利', name: '核心期刊/高水平会议论文或发明专利授权', pts: 4.0 },
  { label: '科研训练 / 实验室项目 (1.5分)', cat: '科研训练/学术讲座', name: '本科生科研训练 / 导师实验室项目', pts: 1.5 },
  { label: '学术讲座 / 双创沙龙 (0.5分)', cat: '科研训练/学术讲座', name: '创新创业大讲堂 / 学术前沿讲座', pts: 0.5 }
];

function loadInnoItems() {
  try {
    const raw = localStorage.getItem(INNO_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}
function saveInnoItems(arr) {
  localStorage.setItem(INNO_KEY, JSON.stringify(arr));
}
function getInnoRating(pts) {
  if (pts > 10) return { label: '优秀 (>10分)', cls: 'rating-ex', tip: '已达最高档「优秀」标准，可稳妥认定 4 学分并冲刺推免加分！' };
  if (pts >= 8) return { label: '良好 (≥8分)', cls: 'rating-gd', tip: `已达「良好」，再积 ${(10.1 - pts).toFixed(1)} 分即突破 10 分「优秀」线。` };
  if (pts >= 6) return { label: '中评 (≥6分)', cls: 'rating-md', tip: `已达「中评」，距离「良好 (≥8)」还差 ${(8 - pts).toFixed(1)} 分。` };
  if (pts >= 4) return { label: '合格 (≥4分)', cls: 'rating-ps', tip: `已达 4 学分「合格」底线，距离「中评 (≥6)」还差 ${(6 - pts).toFixed(1)} 分。` };
  return { label: '不合格 (<4分)', cls: 'rating-fl', tip: `当前未满 4 分「合格」线，还需至少 ${(4 - pts).toFixed(1)} 分方可获得创新实践 4 学分。` };
}

window.applyInnoPreset = function(idx) {
  const p = INNO_PRESETS[idx];
  if (!p) return;
  const catEl = document.getElementById('innoCat');
  const nameEl = document.getElementById('innoName');
  const ptsEl = document.getElementById('innoPts');
  if (catEl) catEl.value = p.cat;
  if (nameEl) nameEl.value = p.name;
  if (ptsEl) ptsEl.value = p.pts;
};

window.addInnoItem = function() {
  const cat = document.getElementById('innoCat')?.value || 'S/A+/A/B+竞赛';
  const name = (document.getElementById('innoName')?.value || '').trim();
  const pts = parseFloat(document.getElementById('innoPts')?.value || '0');
  if (!name) { alert('请填写项目或成果名称'); return; }
  if (!Number.isFinite(pts) || pts <= 0) { alert('请输入大于 0 的积分分值'); return; }
  const arr = loadInnoItems();
  arr.unshift({ id: 'in_' + Date.now(), cat, name, pts: Math.round(pts * 100) / 100 });
  saveInnoItems(arr);
  renderInnoTracker();
};

window.removeInnoItem = function(idx) {
  const arr = loadInnoItems();
  arr.splice(idx, 1);
  saveInnoItems(arr);
  renderInnoTracker();
};

function renderInnoTracker() {
  const box = document.getElementById('innoTrackerBody');
  if (!box) return;
  const arr = loadInnoItems();
  const total = Math.round(arr.reduce((s, it) => s + (Number(it.pts) || 0), 0) * 100) / 100;
  const rate = getInnoRating(total);
  const pct = Math.min(100, Math.round((total / 12) * 100));
  const cats = ['S/A+/A/B+竞赛', '大创/雏雁', '论文/专利', '科研训练/学术讲座'];
  const catSums = cats.map(c => {
    const s = arr.filter(x => x.cat === c).reduce((a, b) => a + (Number(b.pts) || 0), 0);
    return `${c}: ${Math.round(s * 100) / 100}分`;
  }).join(' · ');

  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;">
        <span style="font-size:28px;font-weight:800;letter-spacing:-0.02em;">${total}</span>
        <span style="font-size:13px;color:var(--muted);">总积分（依据北邮附录 5 规则）</span>
        <span class="rating-pill ${rate.cls}">${rate.label}</span>
      </div>
      <div style="font-size:12px;color:var(--muted);">${rate.tip}</div>
    </div>
    <div>
      <div class="bar" style="height:8px;"><i style="width:${pct}%;background:${total>10?'var(--green)':(total>=4?'var(--accent)':'#e11d48')};"></i></div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-top:4px;">
        <span>0</span><span>合格 ≥4</span><span>中评 ≥6</span><span>良好 ≥8</span><span>优秀 &gt;10</span>
      </div>
    </div>
    <div style="font-size:12px;color:var(--muted);">分类小计：${catSums}</div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <select class="inno-select" style="max-width:300px;" onchange="if(this.value!=='')applyInnoPreset(+this.value)">
        <option value="">⚡ 快速填入附录 5 常见积分模板...</option>
        ${INNO_PRESETS.map((p, i) => `<option value="${i}">${p.label}</option>`).join('')}
      </select>
    </div>
    <div class="inno-form">
      <select id="innoCat" class="inno-select">
        ${cats.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
      <input id="innoName" class="inno-input" placeholder="输入成果名称（如：蓝桥杯省一 / 雏雁结题 / 专利）" />
      <input id="innoPts" type="number" step="0.1" min="0.1" class="inno-input" placeholder="积分" value="2.0" />
      <button class="btn btn-primary" onclick="addInnoItem()">+ 添加积分</button>
    </div>
    <div class="inno-list">
      ${arr.length ? arr.map((it, i) => `
        <div class="inno-row">
          <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1;">
            <span class="badge">${it.cat}</span>
            <span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${it.name.replace(/</g,'&lt;')}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
            <strong style="color:var(--accent);">+${it.pts} 分</strong>
            <button class="btn" style="height:26px;padding:0 10px;font-size:12px;" onclick="removeInnoItem(${i})">删除</button>
          </div>
        </div>
      `).join('') : '<div style="font-size:12.5px;color:var(--muted);padding:8px 0;">暂无记录，可从上方模板快速填入或手动添加你的竞赛、大创、论文/专利与科研训练积分（数据实时保存在 localStorage）。</div>'}
    </div>
  `;
}

function renderPortal() {
  const totalItems = WORKBENCHES.reduce((s, w) => s + w.total, 0);
  const totalDone = WORKBENCHES.reduce((s, w) => { const _p = getWbProgress(w); return s + Math.min(_p.total || w.total, _p.dn); }, 0);
  const recs = getTodayRecommendations();
  (document.getElementById('portalDynamicHost') || document.getElementById('portalMain')).innerHTML = `
    <details class="wb-cat-collapse" style="margin:6px 0 14px 0;">
      <summary class="wb-cat-summary">
        <span class="wb-cat-cur">🧭 <strong>今日智能学习建议与总控概览</strong></span>
        <span class="wb-cat-toggle">展开 ▾</span>
      </summary>
      <div style="padding:10px 12px;">
        <section class="hero">
      <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:8px;">大一 CS × ICPC × 量化研究 全栈知识体系</div>
      <h1>十四合一全栈培养方案总控门户</h1>
      <p>统一入口汇总 ${WORKBENCHES.length} 大核心与选修工作台（全库 42,794 道分级习题 + 2,000+ 篇零基础精讲），当前总计已完成 <b>${totalDone}</b> 项；点击任意卡片直接进入。</p>
    </section>
    <div style="padding:14px 18px;border-radius:16px;background:var(--card);border:1px solid var(--border);font-size:13.5px;color:var(--muted);">
      <b>推荐跨学科学习链路：</b> 数学分析 + 线性代数 + 概率统计 → 量化交易 & AI 前沿 | 离散数学 + 体系结构 + 编译原理 + OS 底层 + 计网 + 数据库 → 全栈系统工程与 ICPC 竞赛
    </div>
    <div class="intel-grid">
      <section class="panel-card">
        <div class="panel-head">
          <h2 class="panel-title">今日全栈智能学习建议</h2>
          <span class="badge">自动识别最低进度 · 3科聚焦</span>
        </div>
        <div style="font-size:13px;color:var(--muted);">根据浏览器 <code>localStorage</code> 实时完成率，自动锁定当前进度最低的 3 个工作台作为今日主攻：</div>
        <div class="rec-list">
          ${recs.map((w, i) => `
            <a class="rec-item" href="${w.href}">
              <div style="min-width:0;flex:1;">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <span class="badge">TOP ${i + 1} · ${w.pct}%</span>
                  <strong style="font-size:13.5px;">${w.name}</strong>
                  <span style="font-size:12px;color:var(--muted);">${w.dn} / ${w.total}</span>
                </div>
                <div style="font-size:12px;color:var(--muted);margin-top:3px;">${w.focusHint}</div>
              </div>
              <span style="font-size:12.5px;font-weight:600;color:var(--accent);white-space:nowrap;">开始学习 →</span>
            </a>
          `).join('')}
        </div>
      </section>
      <section class="panel-card">
        <div class="panel-head">
          <h2 class="panel-title">跨学科知识联动图谱</h2>
          <span class="badge">点击概念查看十四库关联</span>
        </div>
        <div class="pill-row" id="kgPills"></div>
        <div id="kgBody" style="display:flex;flex-direction:column;gap:10px;"></div>
      </section>
    </div>
    <section class="panel-card inno-card">
      <div class="panel-head">
        <h2 class="panel-title">北邮创新实践 4 学分积分追踪器</h2>
        <span class="badge">附录 5 规则 · localStorage 实时计算评级</span>
      </div>
      <div id="innoTrackerBody" style="display:flex;flex-direction:column;gap:12px;"></div>
    </section>
    
      </div>
    </details>
    <div class="grid">
      ${WORKBENCHES.map(w => {
        const _p = getWbProgress(w); const dn = _p.dn;
        const pct = _p.total ? Math.round((dn / _p.total) * 100) : 0;
        return `<a class="card" href="${w.href}">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
              <span class="badge">${w.tag}</span>
              <span style="font-size:12px;color:var(--muted);">${dn} / ${_p.total}</span>
            </div>
            <div style="font-size:18px;font-weight:700;margin-bottom:6px;">${w.name}</div>
            <div style="font-size:13px;color:var(--muted);">${w.desc}</div>
          </div>
          <div>
            <div class="bar"><i style="width:${pct}%"></i></div>
            <div style="font-size:12px;color:var(--accent);font-weight:600;margin-top:8px;">进入工作台 →</div>
          </div>
        </a>`;
      }).join('')}
    </div>`;
  renderKnowledgeGraphBody();
  if (typeof renderInnoTracker === 'function') renderInnoTracker();
}
window.__sanitizeBackupDump = function() {
  const dump = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    let v = localStorage.getItem(k);
    if (/ai_cfg|ai_feed_cfg/i.test(k || '') && v) {
      try { const cfg = JSON.parse(v); if (cfg && typeof cfg === 'object') { cfg.apiKey = ''; v = JSON.stringify(cfg); } } catch (_) {}
    }
    dump[k] = v;
  }
  return dump;
};
window.exportAll = async function() {
  const dump = (window.WB_STORE && typeof window.WB_STORE.exportAll === 'function')
    ? await window.WB_STORE.exportAll()
    : window.__sanitizeBackupDump();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' }));
  a.download = 'fourteen_workbenches_full_backup.json'; a.click();
};
window.importAll = function() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
  inp.onchange = e => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const raw = JSON.parse(r.result);
        const payload = (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) ? raw.data : raw;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Backup must be a JSON object');
        let restored = 0;
        if (window.WB_STORE && typeof window.WB_STORE.importAll === 'function') {
          restored = await window.WB_STORE.importAll(payload);
        } else {
          Object.entries(payload).forEach(([k, v]) => {
            if (typeof k === 'string' && typeof v === 'string') {
              try { localStorage.setItem(k, v); restored++; } catch (_) {}
            }
          });
        }
        renderPortal();
        alert(`已成功恢复 ${restored} 条学习进度记录（已同步写入本地与 IndexedDB）！`);
      }
      catch (err) { alert('JSON 备份格式无效，请选择通过工作台导出的进度文件。'); }
    };
    r.readAsText(f);
  };
  inp.click();
};
window.syncLanProgress = async function() {
  const btn = document.getElementById('lanSyncBtn');
  const orig = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '同步中...'; }
  try {
    if (!window.WB_STORE || typeof window.WB_STORE.syncWithLan !== 'function') {
      throw new Error('同步存储模块尚未就绪，请刷新页面后重试');
    }
    const res = await window.WB_STORE.syncWithLan();
    const _t = localStorage.getItem('wb_theme_v1'); if (_t === 'dark' || _t === 'light') document.documentElement.setAttribute('data-theme', _t);
    renderPortal();
    alert(`局域网双向同步完成！共合并保存 ${res.count} 条学习记录（API Key 已自动脱敏）。`);
  } catch (err) {
    alert('局域网同步失败：' + (err && err.message ? err.message : err) + '\n提示：请确认已通过 local_cpp_runner.py 启动服务。');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = orig || '🔄 局域网同步'; }
  }
};
renderPortal();

/* --- 3. Cross-Subject Wrong Book Hub --- */
(function(){
  const SEARCH_DATA = Array.isArray(window.__WB_CROSS_SEARCH_DATA__) ? window.__WB_CROSS_SEARCH_DATA__ : [];
  const WRONG_KEY = 'stem_wrong_bank_v1';
  function loadWrongs(){ try{ const _w = JSON.parse(localStorage.getItem(WRONG_KEY) || '[]'); return Array.isArray(_w) ? _w : []; }catch(e){ return []; } }
  function saveWrongs(a){ localStorage.setItem(WRONG_KEY, JSON.stringify(a)); }

  const hubBtn = document.createElement('button');
  hubBtn.id = 'wbHubWrongBtn';
  hubBtn.className = 'stem-pill-btn';
  hubBtn.style.cssText = 'position:fixed;right:20px;bottom:70px;z-index:45;background:linear-gradient(135deg,#ff3b30,#ff9500);color:#fff;border:none;border-radius:999px;padding:10px 16px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.18)';
  function refreshHubBadge(){
    hubBtn.innerHTML = '📕 错题本 (' + loadWrongs().length + ') · 🔍 跨科直达';
  }
  refreshHubBadge();
  window.addEventListener('wb:idb-hydrated', () => { try { refreshHubBadge(); } catch (_) {} try { if (typeof renderPortal === 'function') renderPortal(); } catch (_) {} });
  document.body.appendChild(hubBtn);

  const ov = document.createElement('div');
  ov.className = 'stem-overlay';
  ov.innerHTML = `
    <div class="stem-modal" style="width:min(980px,95vw)">
      <div class="stem-mhead">
        <div class="stem-tabs">
          <button class="stem-tab active" data-htab="search">🔍 全站跨科直达 (${SEARCH_DATA.length} 套卷)</button>
          <button class="stem-tab" data-htab="wrong">📕 全站统一错题本 (<span id="hub-wrong-cnt">0</span>)</button>
          <button class="stem-tab" data-htab="gh">🐙 GitHub 开源仓库直达 (8)</button>
        </div>
        <button class="stem-close" id="hub-close">✕</button>
      </div>
      <div class="stem-mbody" id="hub-body"></div>
    </div>`;
  document.body.appendChild(ov);
  ov.querySelector('#hub-close').onclick = () => ov.classList.remove('open');
  ov.onclick = e => { if(e.target === ov) ov.classList.remove('open'); };

  let htab = 'search';
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function renderHub(){
    const wrongs = loadWrongs();
    ov.querySelector('#hub-wrong-cnt').textContent = wrongs.length;
    refreshHubBadge();
    ov.querySelectorAll('[data-htab]').forEach(b => {
      b.classList.toggle('active', b.dataset.htab === htab);
      b.onclick = () => { htab = b.dataset.htab; renderHub(); };
    });
    const body = ov.querySelector('#hub-body');
    if(htab === 'search'){
      body.innerHTML = `
        <input class="stem-input" id="hub-q" placeholder="输入关键词搜索全站 14 科真题与模拟卷（如：信号量、MVCC、LR(1)、SVD、OSPF、期中）..." style="margin-bottom:12px"/>
        <div id="hub-res" style="display:grid;gap:8px;max-height:60dvh;overflow:auto"></div>`;
      const draw = (kw) => {
        const k = (kw||'').trim().toLowerCase();
        const hits = SEARCH_DATA.filter(x => !k || (x.wb+' '+x.title+' '+x.tags+' '+x.type).toLowerCase().includes(k)).slice(0, 60);
        body.querySelector('#hub-res').innerHTML = hits.map(x => `
          <a href="${esc(x.href)}" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-radius:10px;border:1px solid var(--border,rgba(0,0,0,.1));text-decoration:none;color:inherit;gap:10px">
            <div>
              <div style="font-size:13.5px;font-weight:600">${esc(x.title)}</div>
              <div style="font-size:12px;color:#6e6e73;margin-top:2px">${esc(x.wb)} · ${esc(x.tags)}</div>
            </div>
            <span class="stem-badge">${esc(x.type)}</span>
          </a>`).join('') || '<div style="padding:24px;text-align:center;color:#6e6e73">未找到匹配试卷。</div>';
      };
      draw('');
      body.querySelector('#hub-q').oninput = e => draw(e.target.value);
    } else if(htab === 'gh'){
      const gh = JSON.parse((document.getElementById('gh-repos-data')||{}).textContent||'[]');
      body.innerHTML = '<div style="display:grid;gap:8px">' + gh.map(g => `<a href="${esc(g.url)}" target="_blank" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-radius:10px;border:1px solid var(--border,rgba(0,0,0,.1));text-decoration:none;color:inherit"><div><div style="font-weight:700;font-size:14px">🐙 ${esc(g.name)}</div><div style="font-size:12px;color:#6e6e73;margin-top:2px">${esc(g.desc)}</div></div><span class="stem-badge">打开仓库 ↗</span></a>`).join('') + '</div>';
    } else {
      body.innerHTML = wrongs.length ? `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-size:13px;color:#6e6e73">共收录 ${wrongs.length} 道全站错题（在任意工作台交卷判分或点击「记错题」自动同步到这里）</span>
          <button class="stem-btn ghost" id="hub-clear-wrong">清空错题本</button>
        </div>
        <div style="display:grid;gap:10px">
          ${wrongs.map((w, i) => `
            <div class="stem-q-card">
              <div class="stem-q-meta">
                <span class="stem-badge">${esc(w.subject)}</span>
                <strong>${esc(w.paperTitle)} · 第 ${esc(w.qid)} 题</strong>
                <span style="font-size:12px;color:#6e6e73;margin-left:auto">${esc(w.ts||'')}</span>
                <button class="stem-btn ghost" style="padding:2px 8px;font-size:12px" data-delw="${i}">移除</button>
              </div>
              <div style="font-size:13.5px;line-height:1.68">${esc(w.prompt || '')}</div>
              <details style="margin-top:8px">
                <summary style="cursor:pointer;font-size:12px;font-weight:600;color:#0071e3">查看答案与精解</summary>
                <div class="stem-sol-box"><div><strong>【答案】</strong>${esc(w.answer||'')}</div><div style="margin-top:6px">${esc(w.solution||'').replace(/\n/g,'<br>')}</div></div>
              </details>
            </div>`).join('')}
        </div>` : '<div style="padding:40px;text-align:center;color:#6e6e73">全站错题本目前为空。在任意工作台打开「历年真题与梯度组卷」作答并点击「交卷判分」或「记错题」，即可在这里集中复盘！</div>';
      if(body.querySelector('#hub-clear-wrong')){
        body.querySelector('#hub-clear-wrong').onclick = () => { saveWrongs([]); renderHub(); };
      }
      body.querySelectorAll('[data-delw]').forEach(b => {
        b.onclick = () => {
          const arr = loadWrongs();
          arr.splice(+b.dataset.delw, 1);
          saveWrongs(arr);
          renderHub();
        };
      });
    }
  }
  hubBtn.onclick = () => { ov.classList.add('open'); renderHub(); };
})();

/* --- 4. AI Feed Modal --- */
(function(){
  const PAGE_KEY = (function(){ var raw = location.pathname.split('/').pop() || document.title || 'workbench'; try { raw = decodeURIComponent(raw); } catch(_) {} return raw.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_'); })();
  const STORE_KEY = 'wb_custom_ai_docs_v1:' + PAGE_KEY;
  const isICPC = document.title.includes('ICPC') || !!document.getElementById('docs-data');
  const isWbData = !!document.getElementById('wb-data');

  function escHtml(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function mdToSafeHtml(md){
    const stash = [];
    let s = String(md||'');
    s = s.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+?\$/g, m => { stash.push(m); return '\u0000M'+(stash.length-1)+'\u0000'; });
    s = s.replace(/```([\w+-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      stash.push('<pre><code>' + escHtml(code) + '</code></pre>');
      return '\u0000M'+(stash.length-1)+'\u0000';
    });
    s = s.replace(/`([^`\n]+?)`/g, (_, c) => {
      stash.push('<code>' + escHtml(c) + '</code>');
      return '\u0000M'+(stash.length-1)+'\u0000';
    });
    const lines = s.split(/\r?\n/);
    const out = [];
    let inUl = false;
    for(const raw of lines){
      const t = raw.trim();
      if(!t){ if(inUl){ out.push('</ul>'); inUl=false; } continue; }
      if(t.startsWith('### ')){ if(inUl){out.push('</ul>');inUl=false;} out.push('<h4>'+escHtml(t.slice(4))+'</h4>'); }
      else if(t.startsWith('## ')){ if(inUl){out.push('</ul>');inUl=false;} out.push('<h3>'+escHtml(t.slice(3))+'</h3>'); }
      else if(t.startsWith('# ')){ if(inUl){out.push('</ul>');inUl=false;} out.push('<h3>'+escHtml(t.slice(2))+'</h3>'); }
      else if(/^[-*]\s+/.test(t)){ if(!inUl){out.push('<ul>');inUl=true;} out.push('<li>'+escHtml(t.replace(/^[-*]\s+/,''))+'</li>'); }
      else if(/^\d+\.\s+/.test(t)){ if(!inUl){out.push('<ul>');inUl=true;} out.push('<li>'+escHtml(t)+'</li>'); }
      else { if(inUl){out.push('</ul>');inUl=false;} out.push('<p>'+escHtml(t)+'</p>'); }
    }
    if(inUl) out.push('</ul>');
    let res = out.join('\n').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    res = res.replace(/\u0000M(\d+)\u0000/g, (_, idx) => stash[Number(idx)] || '');
    return res;
  }

  function loadSavedDocs(){
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch(e){ return []; }
  }
  function saveDocsList(list){
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  }
  function loadAiConfig(){
    if (window.WB_AI && typeof window.WB_AI.loadConfig === 'function') {
      return window.WB_AI.loadConfig();
    }
    let c1 = {}, c2 = {};
    try { c1 = JSON.parse(localStorage.getItem('stem_ai_cfg_v1') || '{}'); } catch(e){}
    try { c2 = JSON.parse(localStorage.getItem('icpc_ai_cfg_v1') || '{}'); } catch(e){}
    const base = isICPC ? Object.assign({}, c1, c2) : Object.assign({}, c2, c1);
    return {
      provider: base.provider || (base.baseUrl && !base.baseUrl.includes('generativelanguage') ? 'openai' : 'gemini'),
      baseUrl: base.baseUrl || 'https://api.openai.com/v1',
      model: base.model || (base.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash'),
      apiKey: base.apiKey || ''
    };
  }
  function saveAiConfig(cfg){
    if (window.WB_AI && typeof window.WB_AI.saveConfig === 'function') {
      window.WB_AI.saveConfig(cfg);
      return;
    }
    try {
      const k = isICPC ? 'icpc_ai_cfg_v1' : 'stem_ai_cfg_v1';
      const old = JSON.parse(localStorage.getItem(k) || '{}');
      localStorage.setItem(k, JSON.stringify(Object.assign({}, old, cfg)));
    } catch(e){}
  }

  function getGroupChoices(){
    if(typeof DOCS !== 'undefined' && Array.isArray(DOCS)){
      const gs = [...new Set(DOCS.map(d => d.group).filter(Boolean))];
      if(!gs.includes('🤖 AI 喂题题解库')) gs.unshift('🤖 AI 喂题题解库');
      return gs;
    }
    return ['🤖 AI 喂题题解库'];
  }

  function injectDocIntoWorkbench(docObj){
    if(typeof DOCS !== 'undefined' && Array.isArray(DOCS)){
      const idx = DOCS.findIndex(d => d.id === docObj.id);
      if(idx >= 0) DOCS[idx] = docObj;
      else DOCS.unshift(docObj);
      if(typeof renderSidebar === 'function') renderSidebar();
      if(typeof openDoc === 'function') openDoc(docObj.id);
      return true;
    }
    return false;
  }

  function restorePersistedDocs(){
    const saved = loadSavedDocs();
    if(!saved.length) return;
    if(typeof DOCS !== 'undefined' && Array.isArray(DOCS)){
      for(let i = saved.length - 1; i >= 0; i--){
        const d = saved[i];
        if(!DOCS.some(x => x.id === d.id)) DOCS.unshift(d);
      }
      if(typeof renderSidebar === 'function') renderSidebar();
    }
  }

  function renderSavedList(){
    const saved = loadSavedDocs();
    const countEl = document.getElementById('aifSavedCount');
    const wrap = document.getElementById('aifSavedItems');
    if(!countEl || !wrap) return;
    countEl.textContent = String(saved.length);
    if(!saved.length){
      wrap.innerHTML = '<div style="font-size:12.5px;opacity:0.65;">暂无已导入的 AI 题解，在上方输入题目即可一键生成并导入。</div>';
      return;
    }
    wrap.innerHTML = saved.map(d => `
      <div class="aif-saved-item">
        <div style="min-width:0;flex:1;">
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(d.title)}</div>
          <div style="font-size:12px;opacity:0.65;">${escHtml(d.group || '🤖 AI 喂题题解库')} · ${escHtml(d.sub || '')}</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="aif-btn aif-btn-ghost" type="button" data-aif-open="${escHtml(d.id)}" style="padding:5px 10px;font-size:12px;">打开</button>
          <button class="aif-btn aif-btn-danger" type="button" data-aif-del="${escHtml(d.id)}" style="padding:5px 10px;font-size:12px;">删除</button>
        </div>
      </div>
    `).join('');
    wrap.querySelectorAll('[data-aif-open]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-aif-open');
        const item = loadSavedDocs().find(x => x.id === id);
        if(!item) return;
        if(injectDocIntoWorkbench(item)){
          document.getElementById('aiFeedOverlay').classList.remove('open');
        } else {
          const box = document.getElementById('aifPreviewBox');
          box.style.display = 'block';
          box.innerHTML = '<h3>' + escHtml(item.title) + '</h3>' + mdToSafeHtml(item.content || '');
          if(window.renderMathInElement) renderMathInElement(box);
        }
      };
    });
    wrap.querySelectorAll('[data-aif-del]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-aif-del');
        const next = loadSavedDocs().filter(x => x.id !== id);
        saveDocsList(next);
        if(typeof DOCS !== 'undefined' && Array.isArray(DOCS)){
          const idx = DOCS.findIndex(x => x.id === id);
          if(idx >= 0) DOCS.splice(idx, 1);
          if(typeof renderSidebar === 'function') renderSidebar();
        }
        renderSavedList();
      };
    });
  }

  function setStatus(msg, cls){
    const el = document.getElementById('aifStatus');
    el.className = 'aif-status show ' + (cls || 'info');
    el.textContent = msg;
  }

  let imgBase64 = null, imgMime = null;
  document.getElementById('aifImageInput').addEventListener('change', function(ev){
    const f = ev.target.files && ev.target.files[0];
    if(!f){ imgBase64 = null; imgMime = null; return; }
    imgMime = f.type || 'image/png';
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || '');
      imgBase64 = res.includes(',') ? res.split(',')[1] : res;
    };
    reader.readAsDataURL(f);
  });

  function openModal(){
    const cfg = loadAiConfig();
    document.getElementById('aifProvider').value = cfg.provider;
    document.getElementById('aifBaseUrl').value = cfg.baseUrl;
    document.getElementById('aifModel').value = cfg.model;
    document.getElementById('aifApiKey').value = cfg.apiKey;
    const sel = document.getElementById('aifTargetGroup');
    sel.innerHTML = getGroupChoices().map(g => `<option value="${escHtml(g)}">${escHtml(g)}</option>`).join('');
    renderSavedList();
    document.getElementById('aiFeedOverlay').classList.add('open');
  }

  document.getElementById('aiFeedFab').onclick = openModal;
  document.getElementById('aiFeedClose').onclick = () => document.getElementById('aiFeedOverlay').classList.remove('open');
  document.getElementById('aiFeedOverlay').onclick = (e) => { if(e.target.id === 'aiFeedOverlay') e.target.classList.remove('open'); };
  document.addEventListener('keydown', (e) => { if(e.altKey && (e.key === 'i' || e.key === 'I')){ e.preventDefault(); openModal(); } });

  document.getElementById('aifExportBtn').onclick = () => {
    const saved = loadSavedDocs();
    const blob = new Blob([JSON.stringify(saved, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = PAGE_KEY + '_AI题解库.json';
    a.click();
  };

  async function callAiModel(cfg, sysPrompt, userText){
    if(cfg.provider === 'gemini'){
      const m = cfg.model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`;
      const parts = [{text: sysPrompt + '\n\n【用户题目】\n' + userText}];
      if(imgBase64 && imgMime) parts.push({inlineData: {mimeType: imgMime, data: imgBase64}});
      const r = await fetch(url, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({contents: [{role: 'user', parts}]})
      });
      const j = await r.json();
      if(!r.ok) throw new Error(j.error?.message || ('HTTP ' + r.status));
      return j.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    } else {
      const base = (cfg.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const content = imgBase64 && imgMime
        ? [{type:'text', text: userText}, {type:'image_url', image_url: {url: `data:${imgMime};base64,${imgBase64}`}}]
        : userText;
      const r = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey},
        body: JSON.stringify({
          model: cfg.model || 'gpt-4o-mini',
          messages: [{role: 'system', content: sysPrompt}, {role: 'user', content}]
        })
      });
      const j = await r.json();
      if(!r.ok) throw new Error(j.error?.message || ('HTTP ' + r.status));
      return j.choices?.[0]?.message?.content || '';
    }
  }

  document.getElementById('aifRunBtn').onclick = async () => {
    const cfg = {
      provider: document.getElementById('aifProvider').value,
      baseUrl: document.getElementById('aifBaseUrl').value.trim(),
      model: document.getElementById('aifModel').value.trim(),
      apiKey: document.getElementById('aifApiKey').value.trim()
    };
    const userPrompt = document.getElementById('aifPrompt').value.trim();
    const targetGroup = document.getElementById('aifTargetGroup').value || '🤖 AI 喂题题解库';
    if(!cfg.apiKey){ setStatus('请先填写有效的 API Key（会自动保存在本地浏览器）', 'err'); return; }
    if(!userPrompt && !imgBase64){ setStatus('请先输入不会的题目或上传题目截图', 'err'); return; }
    saveAiConfig(cfg);

    const sysPrompt = isICPC
      ? `你是当前「${document.title}」的 ICPC 金牌教练。请严格按以下工作台 8 段式标准规范输出完整题解（全部使用规范 LaTeX 公式 $...$ / $$...$$ 与可编译 C++17 代码，不要输出寒暄）：
首行必须严格以 "# 标题：<简明题名>" 开头，第二行以 "摘要：<一句话核心方法与复杂度>" 开头，随后严格包含以下 8 节：
## 一、题目原意与核心直觉
## 二、数学建模与关键转化
## 三、算法流程与正确性证明
## 四、复杂度分析与边界条件
## 五、标准参考代码（C++17）
## 六、逐行代码精讲
## 七、常见易错点与卡常陷阱
## 八、举一反三、变式与参考对照`
      : `你是当前「${document.title}」的资深本科课程助教。请严格按以下工作台标准规范输出零基础也能看懂的完整精解（所有数学公式严格使用 LaTeX $...$ 或 $$...$$，不要输出寒暄）：
首行必须严格以 "# 标题：<简明题名>" 开头，第二行以 "摘要：<一句话核心考点与方法>" 开头，随后严格包含以下 7 节：
## 一、题目原意与考点定位
## 二、核心定义与定理公式
## 三、关键思路与破题突破口
## 四、详细分步精解
## 五、最终答案与检验
## 六、常见易错点与陷阱
## 七、举一反三与教材对照`;

    const btn = document.getElementById('aifRunBtn');
    btn.disabled = true;
    setStatus('正在调用 AI 生成工作台标准规范题解，完成后将自动导入…', 'info');
    try {
      const raw = await callAiModel(cfg, sysPrompt, userPrompt || '请识别图片中的题目并按标准规范给出完整精解');
      const lines = raw.split(/\r?\n/);
      let title = 'AI 精解：' + (userPrompt.slice(0, 26) || '图片题目');
      let sub = 'AI 自动生成 · 标准工作台精解';
      const bodyLines = [];
      for(const l of lines){
        const m1 = l.match(/^#*\s*标题[：:]\s*(.+)$/);
        const m2 = l.match(/^摘要[：:]\s*(.+)$/);
        if(m1) title = '🤖 ' + m1[1].trim();
        else if(m2) sub = m2[1].trim();
        else bodyLines.push(l);
      }
      const cleanMd = bodyLines.join('\n').trim() || raw;
      const docId = 'ai_custom_' + Date.now();
      const docObj = isICPC ? {
        id: docId, group: targetGroup, sub, filename: docId + '.md',
        title, chars: cleanMd.length, pills: ['AI喂题精解', '标准8段式', '已自动导入'], content: cleanMd
      } : {
        id: docId, group: targetGroup, tier: 'AI喂题精解', zeroFriendly: true, treeNode: 'AI喂题导入',
        title, sub, prereqs: [], content: mdToSafeHtml(cleanMd), quiz: []
      };

      const saved = loadSavedDocs();
      saved.unshift(docObj);
      saveDocsList(saved);
      renderSavedList();

      if(injectDocIntoWorkbench(docObj)){
        setStatus('✅ 已生成并自动导入工作台，正在为你打开该题解！', 'ok');
        setTimeout(() => document.getElementById('aiFeedOverlay').classList.remove('open'), 700);
      } else {
        setStatus('✅ 已生成并保存到本工作台 AI 题解库！', 'ok');
        const box = document.getElementById('aifPreviewBox');
        box.style.display = 'block';
        box.innerHTML = '<h3>' + escHtml(docObj.title) + '</h3>' + (isICPC ? mdToSafeHtml(docObj.content) : docObj.content);
        if(window.renderMathInElement) renderMathInElement(box);
      }
    } catch(err){
      setStatus('❌ 生成失败：' + (err.message || err), 'err');
    } finally {
      btn.disabled = false;
    }
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restorePersistedDocs);
  else restorePersistedDocs();
})();

/* --- 5. Portal Extended Toolbar & UX Enhancements (r14/r15/r17/iter10/c4-std) --- */
(function() {
  if (window.__r14Inited) return;
  window.__r14Inited = true;

  // Cmd/Ctrl + K focuses search box
  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      const sb = document.querySelector('.search-box, #globalSearch, input[type="search"], input[placeholder*="搜"]');
      if (sb) { e.preventDefault(); sb.focus(); sb.select(); }
    }
  });

  // Inject Focus Reading + Progress Export bar & Mobile Quick Dock
  (function(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); })(function() {
    const mainEl = document.querySelector('.main, main');
    if (mainEl && !document.getElementById('r14Toolbar')) {
      const bar = document.createElement('div');
      bar.id = 'r14Toolbar';
      bar.className = 'r14-toolbar';
      bar.innerHTML =
        '<button class="r14-chip" id="r14FocusBtn" title="隐藏侧栏并优化阅读行宽">🎯 专注阅读</button>' +
        '<button class="r14-chip" id="r14ExportBtn" title="导出本地收藏与学习进度 JSON">💾 导出学习进度</button>' +
        '<span class="r14-chip" style="cursor:default;opacity:0.85;">⌘K 快速检索</span>' +
        '<a class="r14-chip" href="index.html" style="text-decoration:none;">🏠 总览导航</a>';
      mainEl.insertBefore(bar, mainEl.firstChild);

      document.getElementById('r14FocusBtn').addEventListener('click', function() {
        document.body.classList.toggle('r14-focus-mode');
        this.classList.toggle('active');
      });
      document.getElementById('r14ExportBtn').addEventListener('click', function() {
        const dump = typeof window.__sanitizeBackupDump === 'function' ? window.__sanitizeBackupDump() : {};
        const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data: dump }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'workbench_progress_backup.json';
        a.click();
      });
    }
    // [R14] Removed dead r14MobileDock branch (superseded by MobileDockController)
  });
})();

(function() {
  if (window.__r15Inited) return;
  window.__r15Inited = true;
  const savedSkin = localStorage.getItem('wb_r15_skin') || 'default';
  if (savedSkin !== 'default') document.documentElement.setAttribute('data-r15-skin', savedSkin);

  (function(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); })(function() {
    const bar = document.getElementById('r14Toolbar');
    if (bar && !document.getElementById('r15SkinSel')) {
      const sel = document.createElement('select');
      sel.id = 'r15SkinSel';
      sel.className = 'r15-skin-sel';
      sel.innerHTML =
        '<option value="default">🎨 默认风格</option>' +
        '<option value="swiss">🎨 瑞士网格</option>' +
        '<option value="oled">🎨 OLED 暗黑</option>' +
        '<option value="washi">🎨 日式和纸</option>' +
        '<option value="quant">🎨 量化终端</option>';
      sel.value = savedSkin;
      sel.addEventListener('change', function() {
        localStorage.setItem('wb_r15_skin', sel.value);
        if (sel.value === 'default') document.documentElement.removeAttribute('data-r15-skin');
        else document.documentElement.setAttribute('data-r15-skin', sel.value);
      });
      bar.appendChild(sel);

      const impBtn = document.createElement('button');
      impBtn.className = 'r14-chip';
      impBtn.textContent = '📥 导入 .md 题';
      const impInp = document.createElement('input');
      impInp.type = 'file';
      impInp.accept = '.md,.markdown,.txt';
      impInp.multiple = true;
      impInp.style.display = 'none';
      impBtn.addEventListener('click', function() { impInp.click(); });
      impInp.addEventListener('change', async function() {
        const files = Array.from(impInp.files || []);
        if (!files.length) return;
        const key = 'wb_r15_custom_md_' + (function(){ try { return decodeURIComponent(location.pathname); } catch(_) { return location.pathname; } })();
        let cur = []; try { const _p = JSON.parse(localStorage.getItem(key) || '[]'); cur = Array.isArray(_p) ? _p : []; } catch (_) { cur = []; }
        for (const f of files) {
          cur.unshift({ name: f.name, content: await f.text(), ts: Date.now() });
        }
        localStorage.setItem(key, JSON.stringify(cur.slice(0, 100)));
        alert(`已离线导入 ${files.length} 个 .md 文件到浏览器本地存储（共 ${cur.length} 条自定义记录）。`);
        impInp.value = '';
      });
      bar.appendChild(impBtn);
      bar.appendChild(impInp);
    }
  });
})();

(function() {
  (function(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); })(function() {
    // 1. Make r14Toolbar collapsible (collapsed by default to keep workspace clean)
    const bar = document.getElementById('r14Toolbar');
    if (bar && !document.getElementById('r17BarToggle')) {
      Array.from(bar.children).forEach(el => el.classList.add('r17-hideable'));
      const tg = document.createElement('button');
      tg.id = 'r17BarToggle';
      tg.className = 'r14-chip';
      tg.textContent = '🛠️ 扩展工具栏 ▾';
      bar.classList.add('r17-collapsed');
      tg.addEventListener('click', function() {
        bar.classList.toggle('r17-collapsed');
        tg.textContent = bar.classList.contains('r17-collapsed') ? '🛠️ 扩展工具栏 ▾' : '🛠️ 收起工具栏 ▴';
      });
      bar.insertBefore(tg, bar.firstChild);
    }

    // 2. Fallback subtle particles ONLY when workbench_engine has not claimed #particle-canvas
    const pc = document.getElementById('particle-canvas');
    if (pc && !pc.dataset.r17Particles && typeof window.toggleParticles !== 'function') {
      pc.dataset.r17Particles = '1';
      const ctx = pc.getContext('2d');
      const dots = Array.from({length: 28}, () => ({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: 1.2 + Math.random() * 1.6
      }));
      let accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2563eb';
      let rafId = null;
      function tick() {
        if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) { rafId = null; return; }
        if (pc.width !== innerWidth || pc.height !== innerHeight) { pc.width = innerWidth; pc.height = innerHeight; }
        ctx.clearRect(0, 0, pc.width, pc.height);
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.22;
        dots.forEach(d => {
          d.x = (d.x + d.vx + pc.width) % pc.width;
          d.y = (d.y + d.vy + pc.height) % pc.height;
          ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
        });
        rafId = requestAnimationFrame(tick);
      }
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !rafId) {
          accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2563eb';
          rafId = requestAnimationFrame(tick);
        }
      });
      tick();
    }
  });
})();

(function() {
  if (window.__iter10Inited) return;
  window.__iter10Inited = true;

  // [R13] Removed stale copy-only openIdeModal stub & conflicting bubbling Escape handler (managed by ui_polish.js)

  // Iter 6: Debounced KaTeX MutationObserver on #main
  (function(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); })(function() {
    const mainEl = document.getElementById('main') || document.querySelector('.main');
    if (mainEl && typeof MutationObserver !== 'undefined') {
      let timer = null;
      const obs = new MutationObserver(function() {
        if (typeof window.renderMathInElement !== 'function') return;
        clearTimeout(timer);
        timer = setTimeout(function() {
          try {
            window.renderMathInElement(mainEl, {
              delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],
              throwOnError: false
            });
          } catch(_) {}
        }, 180);
      });
      obs.observe(mainEl, { childList: true, subtree: true });
    }
  });
})();

(function() {
  if (window.__c4StdInited) return;
  window.__c4StdInited = true;

  function attachCopyButtons() {
    document.querySelectorAll('.ex-card, .tb-fulltext-panel, #docCard').forEach(function(card) {
      if (card.querySelector('.c4-md-copy-btn')) return;
      const head = card.querySelector('.card-head-row, .reader-toolbar, h2, h3');
      if (!head) return;
      const btn = document.createElement('button');
      btn.className = 'c4-md-copy-btn';
      btn.textContent = '📋 复制 Markdown';
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const title = (card.querySelector('h2, h3, .card-title') || {}).innerText || '工作台笔记';
        const body = (card.querySelector('.md-body') || card).innerText || '';
        const md = '---\ntitle: ' + JSON.stringify(title.trim()) + '\n---\n\n## ' + title.trim() + '\n\n' + body.trim() + '\n';
        navigator.clipboard.writeText(md).then(() => {
          btn.textContent = '✓ 已复制 .md';
          setTimeout(() => { btn.textContent = '📋 复制 Markdown'; }, 1600);
        });
      });
      head.appendChild(btn);
    });
  }

  (function(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); })(function() {
    const mainEl = document.getElementById('main') || document.querySelector('.main');
    if (mainEl && typeof MutationObserver !== 'undefined') {
      let t = null;
      new MutationObserver(function() {
        clearTimeout(t);
        t = setTimeout(attachCopyButtons, 220);
      }).observe(mainEl, { childList: true, subtree: true });
      setTimeout(attachCopyButtons, 300);
    }
  });
})();
