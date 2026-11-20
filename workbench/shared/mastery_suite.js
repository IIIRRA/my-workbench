/* === 14-Subject Master Closure Lab Suite (HiDPI Sandboxes + Bidirectional SM-2 + Context-Aware Feynman Oral Defense) === */
(function () {
  if (window.__wbMasterySuiteInited) return;
  window.__wbMasterySuiteInited = true;

  function detectSlug() {
    if (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) return String(window.__WB_CONFIG__.slug).toLowerCase();
    const t = (document.title || '') + ' ' + decodeURIComponent(location.pathname || '');
    if (/C4|数学分析/i.test(t)) return 'c4';
    if (/ICPC/i.test(t)) return 'icpc';
    if (/C\+\+20|C\+\+/i.test(t)) return 'cpp';
    if (/人工智能|AI/i.test(t)) return 'ai';
    if (/量化交易/i.test(t)) return 'quant';
    if (/大学物理|物理/i.test(t)) return 'phys';
    if (/线性代数/i.test(t)) return 'la';
    if (/概率统计|概率/i.test(t)) return 'prob';
    if (/离散数学/i.test(t)) return 'dm';
    if (/数据库|软件工程/i.test(t)) return 'dbse';
    if (/数据结构|OS|操作系统/i.test(t)) return 'dsos';
    if (/编译原理|形式语言/i.test(t)) return 'comp';
    if (/硬件|体系结构/i.test(t)) return 'arch';
    if (/网络|通信/i.test(t)) return 'net';
    return 'icpc';
  }

  const SLUG = detectSlug();
  const FSRS_KEY = 'wb_mastery_sm2_v2_' + SLUG;
  const DEFENSE_KEY = 'wb_mastery_defense_v2_' + SLUG;

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function loadJSON(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v == null ? fallback : v; } catch (_) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }

  // === 14-Subject Dedicated Sandbox Registry ===
  const SANDBOX_CATALOG = [
    { id: 'c4', label: '∫ 数学分析 · 泰勒级数逼近与余项误差' },
    { id: 'la', label: '📐 线性代数 · 2×2 矩阵形变、行列式与特征方向' },
    { id: 'prob', label: '🎲 概率统计 · 中心极限定理 (CLT) 实时收敛' },
    { id: 'phys', label: '⚛️ 大学物理 · 辛积分 (Verlet) vs 显式 Euler 能量守恒' },
    { id: 'dm', label: '🔗 离散数学 · Kruskal 最小生成树与连通分量' },
    { id: 'icpc', label: '🏆 ICPC 竞赛 · 线段树区间加与 Lazy 懒标记下传' },
    { id: 'cpp', label: '⚡ C++20 工程 · 无锁 SPSC 环形缓冲与内存序' },
    { id: 'arch', label: '🖥️ 体系结构 · 5 级流水线冒险与 Forwarding 旁路' },
    { id: 'dsos', label: '💾 数据结构与 OS · 页面缓存 LRU vs 2Q 抗扫描污染' },
    { id: 'net', label: '🌐 计算机网络 · CUBIC vs BBR 浅/深缓冲博弈' },
    { id: 'dbse', label: '🗄️ 数据库系统 · MVCC 快照隔离写偏斜 vs SSI' },
    { id: 'comp', label: '⚙️ 编译原理 · 正则 DFA 状态机实时步进识别' },
    { id: 'ai', label: '🧠 人工智能 · SGD / Momentum / Adam 病态曲面轨迹' },
    { id: 'quant', label: '📈 量化交易 · 限价订单簿 (LOB) 深度与冲击滑点' }
  ];

  // === 14-Subject Native Deep-Water Oral Defense Bank ===
  const ORAL_BANK = {
    c4: [
      { q: '举出 1 个「单点导数 f\'(0) > 0 但在 0 的任何邻域都不单调」的经典反例，并说明为什么不矛盾？', ref: 'f(x)=x+2x^2 sin(1/x) (x≠0), f(0)=0。f\'(0)=1>0 仅刻画割线极限，而 f\'(x)=1+4x sin(1/x)-2cos(1/x) 在 0 附近因 -2cos(1/x) 无限次变号，故任何邻域都不单调。' },
      { q: '为什么函数项级数逐项求导需要「导函数列一致收敛」，而不能只要求原函数列一致收敛？', ref: '反例 f_n(x)=sin(nx)/n 一致收敛到 0，但 f_n\'(x)=cos(nx) 处处不收敛。微分算子是无界算子，高频小振幅扰动求导后会被放大 n 倍。' },
      { q: 'Cauchy 收敛准则为什么不需要预先知道极限值 A？它与实数完备性的等价性体现在哪？', ref: 'Cauchy 列只刻画数列自身尾部任意两项距离趋于 0；在有理数域 Q 中 Cauchy 列未必收敛（如逼近 √2），实数完备性保证每个 Cauchy 列必有极限。' }
    ],
    la: [
      { q: '为什么数值求解 Ax = b 几乎永远不应先显式求 A^{-1} 再乘 b？', ref: '显式求逆计算量约为 LU 分解的 3 倍，且在条件数 κ(A) 较大时舍入误差急剧放大；工程上统一用 LU / Cholesky / QR 分解回代。' },
      { q: '从几何直观解释秩-零度定理 dim C(A) + dim N(A) = n，以及为何 Ax=b 有解等价于 rank(A)=rank([A|b])？', ref: 'n 维输入空间被 A 映射到列空间 C(A)（保留的维度=rank），被拍扁成 0 的维度就是零空间 N(A)；b 落在 C(A) 内就不会增加增广矩阵的列空间维度。' },
      { q: '实对称矩阵为什么一定可以正交对角化？SVD 与特征值分解的本质区别是什么？', ref: '谱定理保证实对称矩阵不同特征值对应特征向量正交且无亏损；SVD 适用于任意 m×n 矩阵，用两组正交基 U、V 分别对齐输出与输入空间的主轴。' }
    ],
    prob: [
      { q: '为什么「不相关 (Cov=0)」不能推出「独立」？请给一个最简洁的对称分布反例。', ref: '令 X~N(0,1)，Y=X^2。由对称性 E[X]=0 且 E[XY]=E[X^3]=0，故 Cov(X,Y)=0，但 Y 完全由 X 决定，强非线性依赖。' },
      { q: '中心极限定理 (CLT) 在什么分布下会彻底失效？工程中遇到重尾数据怎么处理？', ref: '柯西分布等方差不存在（二阶矩发散）的分布不满足 CLT，样本均值依然服从柯西分布不收敛；重尾数据需用中位数/分位数/稳定分布或稳健估计。' },
      { q: '多重假设检验下为什么 20 次独立 p<0.05 检验大概率出现假阳性？BH-FDR 与 Bonferroni 的取舍是什么？', ref: '20 次检验至少出现 1 次假阳性的概率为 1-0.95^20≈64%。Bonferroni 严格控 FWER 但过于保守、功效低；BH-FDR 控错误发现率，适合高维特征筛选。' }
    ],
    phys: [
      { q: '为什么天体力学和物理引擎仿真必须用 Velocity-Verlet 辛积分而不能用显式 Euler？', ref: '显式 Euler 步进雅可比行列式 1+ω^2 dt^2 > 1，不断扩大相空间体积导致能量单调爆炸；辛积分严格保相空间面积，能量误差有界震荡。' },
      { q: '静电场与感生涡旋电场的本质区别是什么？为什么含变磁场的闭合回路中电压表读数与摆放路径有关？', ref: '静电场 ∇×E=0 是保守场、可定义电势；感生电场 ∇×E=-∂B/∂t 是有旋非保守场，两点间线积分依赖路径所包围的磁通变化率。' },
      { q: '双线绕制无感电阻器为什么能把自感 L 压到几乎为 0？', ref: '相邻两股导线电流等大反向，在空间激发的磁场几乎处处抵消，总磁链 Ψ=NΦ_B→0，从而 L=Ψ/I→0。' }
    ],
    dm: [
      { q: '拟阵交（Matroid Intersection）为何能统一解决二分图最大匹配与彩色生成树？', ref: '二分图匹配是左右两个划分拟阵的交；彩色生成树是图拟阵（无环）与颜色划分拟阵（每色至多 1 条）的交，均可由增广路在多项式时间内求最大独立集。' },
      { q: '举出 1 个「每个顶点度数 ≥ 2 但既不连通或无哈密顿回路」的图论反例。', ref: '两个不相交三角形 K3∪K3 处处度数=2 但不连通；Petersen 图是 3-正则连通图但不存在哈密顿回路。' },
      { q: '容斥原理与莫比乌斯反演在偏序集视角下是什么关系？', ref: '容斥原理是布尔格 (2^S, ⊆) 上的莫比乌斯反演，数论莫比乌斯反演是整除偏序格 (N, |) 上的特例，本质都是求偏序集 Zeta 矩阵的逆。' }
    ],
    icpc: [
      { q: '线段树区间修改时，为什么必须在递归进入左右子树前执行 pushdown 下传懒标记？', ref: '懒标记延迟了子区间的更新；若不先下传，子节点保存的是过期旧值，后续查询或叠加新修改（尤其是乘加混合标记）会破坏运算顺序。' },
      { q: 'DSU on Tree（树上启发式合并）为什么总复杂度严格为 O(N log N)？', ref: '每次保留重儿子信息、暴力合并轻儿子；任意节点到根路径至多经过 log2(N) 条轻边，故每个点至多被暴力遍历 O(log N) 次。' },
      { q: '0-1 背包一维滚动数组为何内层倒序，而完全背包正序？非负权最短路为何禁用 SPFA？', ref: '倒序读上一层旧 dp[j-w] 防重复选；正序允许同物品多次转移。网格/菊花图可将 SPFA 卡到 O(VE)，非负权图必须用堆优化 Dijkstra O(E log V)。' }
    ],
    cpp: [
      { q: '为什么 volatile 在 C++20 多线程中绝不能替代 std::atomic？', ref: 'volatile 仅阻止编译器优化 MMIO 读写，不保证读写原子性，也不提供 Acquire-Release 内存序或 CPU 硬件屏障；跨线程同步必须用 std::atomic。' },
      { q: '低延迟 SPSC 无锁环形队列中，为什么 head 和 tail 要 alignas(64) 隔离？', ref: '防止两原子变量落在同一 64B Cache Line 触发伪共享（False Sharing），否则生产者和消费者核心每次写入都会使对方缓存行失效，吞吐暴跌。' },
      { q: '对 const 对象调用 std::move 会发生什么？为什么 noexcept 对 std::vector 扩容至关重要？', ref: 'const T&& 无法绑定非 const 右值引用，会静默退化为拷贝构造；vector 扩容时只有移动构造标记 noexcept 才会启用移动，否则为保强异常安全退化为拷贝。' }
    ],
    arch: [
      { q: '为什么 MESI 缓存一致性协议正常工作时，x86-TSO 仍会出现 StoreLoad 乱序？', ref: '每核私有 Store Buffer 允许后续不同地址的 Load 旁路提前执行，导致两核观测到 (r1,r2)=(0,0)；需 mfence 或 lock 前缀排空 Store Buffer。' },
      { q: 'VIPT L1 Cache 出现虚拟地址同义词（Synonym）的充要条件是什么？如何消除？', ref: '当 Cache_Capacity / Associativity > Page_Size 时，Index 位溢出进入 VPN，同一物理页会映射到不同组；可用页着色或 L2 反向探测消除。' },
      { q: '5 级经典流水线中，Data Forwarding 旁路能解决哪些数据冒险？哪类冒险仍必须插 1 个气泡（Stall）？', ref: 'ALU→ALU 依赖可由 EX/MEM 或 MEM/WB 旁路零气泡解决；Load-Use 冒险在 MEM 级末才读出数据，下一条指令 EX 级已需要，必插 1 拍气泡。' }
    ],
    dsos: [
      { q: '为什么顺序全表扫描会「污染」传统 LRU 页面缓存？2Q / LRU-K 如何解决？', ref: '一次性顺序扫描把大量只用一次的冷页塞进 LRU 头部，把真正高频访问的热点页挤出缓存；2Q 让新页先入 FIFO 试用队列，仅二次命中才晋升热 LRU。' },
      { q: '多级页表为什么能大幅节省进程页表内存？TLB 未命中时硬件/OS 会发生什么？', ref: '进程虚拟地址空间极度稀疏，未映射的高层页目录项直接置空无需分配下级页表；TLB miss 触发硬件 Page Walk（x86）查多级页表并回填 TLB，缺页则陷入缺页中断。' },
      { q: '红黑树与 B+ 树分别适合内存索引还是磁盘索引？为什么？', ref: '红黑树节点扇出为 2、树高 O(log2 N) 且指针随机跳跃，适合内存；B+ 树按 4KB/16KB 页高扇出（数百路），树高仅 3–4 层且叶子链表利于磁盘顺序范围扫描。' }
    ],
    net: [
      { q: 'TCP BBRv1 在浅缓冲与深缓冲瓶颈上与 CUBIC 共存时，吞吐占比为何完全反转？', ref: 'BBRv1 按 2 BDP 发包不响应丢包；浅缓冲被 BBR 撑爆持续丢包使 CUBIC 反复减窗被饿死，深缓冲被 CUBIC 填满队列反而挤占了 BBR 份额。' },
      { q: 'QUIC 如何防止连接迁移被利用发动反射放大攻击？为什么 0-RTT 禁止非幂等写？', ref: '验证新路径前严格执行 3 倍字节放大限制，并通过 PATH_CHALLENGE/RESPONSE 校验来源 IP；0-RTT 缺少服务端新鲜随机盐，易遭中间人重放攻击。' },
      { q: 'TCP 三次握手为什么不能减为两次？半连接队列（SYN Queue）溢出如何排查？', ref: '两次握手无法防止延迟失效的旧 SYN 报文建立虚假连接浪费资源；半连接溢出可查 netstat -s 中 SYNs to LISTEN sockets dropped，调大 tcp_max_syn_backlog 并开 syncookies。' }
    ],
    dbse: [
      { q: '为什么 MySQL/PostgreSQL 的 REPEATABLE READ（快照隔离）仍会出现 Write Skew 写偏斜？', ref: '两并发事务读同一快照并修改互不重叠的行（如两名值班医生同时请假），无写-写冲突但共同违反全局不变量；需 SSI 可串行化或 SELECT ... FOR UPDATE 显式加锁。' },
      { q: 'WAL（预写日志）为什么能把随机写变成顺序写并保证崩溃恢复的 ACID？', ref: '提交前只需顺序追加日志到磁盘即可返回，脏页异步刷盘；崩溃后 ARIES 算法通过 Analysis → Redo（重放已提交）→ Undo（回滚未提交）精确恢复一致状态。' },
      { q: 'Raft 如何保证线性一致读（Linearizable Read）？直接读 Follower 为什么不行？', ref: '旧 Leader 分区或滞后 Follower 会返回过期值；Leader 需用 ReadIndex 向多数派确认自己仍是最新 Leader，并等本地状态机应用至 commitIndex 后再读。' }
    ],
    comp: [
      { q: '为什么 LL(1) 文法不能包含左递归？消除左递归后为什么还可能需要提取左公因子？', ref: 'LL(1) 自顶向下预测遇到 A→Aα 会无限递归展开；若 A→αβ | αγ 共享前缀 α，仅看 1 个向前看符号无法唯一决定产生式，必须提取左公因子。' },
      { q: 'Cytron 最小 SSA 构造中，为什么必须迭代计算支配边界 DF+(S)？', ref: '在支配边界插入的 φ-节点本身构成了对变量的新定义，这个新定义可能在其自身的支配边界再次与其他路径汇合，因此必须求不动点闭包。' },
      { q: 'Chaitin-Briggs 乐观图着色寄存器分配相比悲观着色好在哪里？', ref: '遇到所有节点度数 ≥ K 时不立刻溢出，而是先标记为潜在溢出压栈；出栈着色时若多个邻居恰好共用同色，当前节点仍可能分配到真实寄存器。' }
    ],
    ai: [
      { q: '为什么标准 Self-Attention 的推理/训练瓶颈往往是 HBM 显存带宽而非 GPU 算力？FlashAttention 如何破解？', ref: 'N×N 注意力分数矩阵反复在 HBM 读写，算术强度极低；FlashAttention 通过片上 SRAM 分块融合 + Online Softmax 增量归一化，完全避免将 N×N 矩阵写回 HBM。' },
      { q: '为什么训练深度网络前必做「单 Batch（4 条样本）过拟合测试」？', ref: '若连 4 条样本 Loss 都无法收敛到 0，100% 存在代码 Bug（如张量广播错位、忘调 zero_grad、标签对齐错误或学习率差数量级），继续大规模调参毫无意义。' },
      { q: '对比 SGD、Momentum 与 Adam 在高条件数病态山谷曲面上的收敛行为。', ref: '普通 SGD 沿陡峭方向剧烈震荡、沿平坦方向寸步难行；Momentum 累积惯性抑制震荡加速主轴；Adam 结合一二阶矩自适应缩放每维步长，在高条件数下收敛最稳健。' }
    ],
    quant: [
      { q: '对同一历史回测跑 1000 组参数挑最高夏普，实盘大概率亏损的统计学本质是什么？怎么修正？', ref: '多重假设检验选择偏误（Backtest Overfitting）；必须计算 Deflated Sharpe Ratio (DSR) 与 CSCV 过拟合概率，并在样本外采用 Purged Walk-Forward 检验。' },
      { q: '什么是时间因果单测（Time-Causality Unit Test）？如何用它自动抓未来函数？', ref: '随机篡改任意时刻 t 之后的全部行情与基本面数据，断言策略在 t 及之前输出的所有因子值、交易信号和持仓必须逐位完全一致。' },
      { q: '为什么 T < N 时直接对样本协方差矩阵求逆做马科维茨优化会产生极端错误权重？', ref: '样本协方差矩阵秩亏（存在 0 特征值）且条件数极大，微小的估计噪声会被逆矩阵放大成极端多空杠杆；工程上需用 Ledoit-Wolf 收缩或因子风险模型。' }
    ]
  };

  // === Context Detection: Currently open problem or doc ===
  function getCurrentStudyItem() {
    // 1. C4 Math Workbench
    if (SLUG === 'c4' && window.state && window.MATH_DATA) {
      if (state.currentView === 'detail' && state.currentProbId) {
        const p = (MATH_DATA.problems || []).find(x => x.id === state.currentProbId);
        if (p) return { id: 'c4:' + p.id, title: 'C4 题 ' + (p.title || p.id), kind: 'c4_prob', target: p.id, snippet: (p.prompt || '').slice(0, 220) };
      }
      return null;
    }
    // 2. 13 Workbenches (ICPC + 12 STEM)
    if (typeof activeView !== 'undefined' && typeof activeId !== 'undefined' && activeId) {
      if (activeView === 'bank_reader' && typeof PROBLEM_BANK !== 'undefined') {
        const p = PROBLEM_BANK.find(x => x.key === activeId || x.pid === activeId);
        if (p) return { id: 'prob:' + p.order, title: (p.pid ? p.pid + ' · ' : '') + (p.title || ''), kind: 'bank_prob', target: p.order, snippet: (p.keyInsight || '').slice(0, 220) };
      }
      if (activeView === 'reader' && typeof DOCS !== 'undefined') {
        const d = DOCS.find(x => x.id === activeId);
        if (d) {
          const pgIdx = (window.__wbDocPageState && window.__wbDocPageState.docId === d.id) ? (window.__wbDocPageState.pageIdx || 0) : 0;
          const pgTitle = (window.__wbCurDocPages && window.__wbCurDocPages[pgIdx]) ? (' · ' + window.__wbCurDocPages[pgIdx].title) : '';
          return { id: 'doc:' + d.id + ':' + pgIdx, title: (d.title || d.id) + pgTitle, kind: 'doc', target: d.id, pageIdx: pgIdx, snippet: (d.sub || '').slice(0, 200) };
        }
      }
    }
    return null;
  }

  function jumpToItem(it) {
    if (!it) return;
    drawer.classList.remove('open');
    if (it.kind === 'c4_prob' && typeof window.openProblem === 'function') {
      window.openProblem(it.target);
    } else if (it.kind === 'bank_prob' && typeof window.openBankProblem === 'function') {
      window.openBankProblem(it.target);
    } else if (it.kind === 'doc') {
      if (typeof it.pageIdx === 'number' && typeof window.openDocPage === 'function') window.openDocPage(it.target, it.pageIdx, false);
      else if (typeof window.openDoc === 'function') window.openDoc(it.target);
    }
  }

  function seedDefaultQueue() {
    const out = [];
    const seen = new Set();
    const push = (obj) => {
      if (!obj || !obj.id || seen.has(obj.id)) return;
      seen.add(obj.id);
      out.push(Object.assign({ ef: 2.5, interval: 0, reps: 0, due: Date.now() }, obj));
    };
    if (SLUG === 'c4' && window.MATH_DATA) {
      // Pull wrong problems first, then capstone/L4
      const wrongs = (window.state && state.wrong) ? Object.keys(state.wrong).filter(k => state.wrong[k]) : [];
      wrongs.slice(0, 12).forEach(pid => {
        const p = (MATH_DATA.problems || []).find(x => x.id === pid);
        if (p) push({ id: 'c4:' + p.id, title: '📕 错题 · ' + p.title, kind: 'c4_prob', target: p.id });
      });
      (MATH_DATA.problems || []).filter(p => p.stage_id === 'stage_capstone' || p.boxed === 'L4').slice(0, 12).forEach(p => {
        push({ id: 'c4:' + p.id, title: '⭐ 核心 · ' + p.title, kind: 'c4_prob', target: p.id });
      });
    } else {
      if (Array.isArray(window.__WB_BANK__)) {
        window.__WB_BANK__.filter(p => p.tier === 'L5' || p.tier === 'L4').slice(0, 16).forEach(p => {
          push({ id: 'prob:' + p.order, title: `[${p.tier}] ${p.pid || ''} · ${p.title || ''}`, kind: 'bank_prob', target: p.order });
        });
      }
      if (Array.isArray(window.__WB_DOCS__)) {
        window.__WB_DOCS__.filter(d => String(d.id || '').startsWith('expert_')).slice(0, 8).forEach(d => {
          push({ id: 'doc:' + d.id + ':0', title: '📖 精讲 · ' + d.title, kind: 'doc', target: d.id, pageIdx: 0 });
        });
      }
    }
    return out.slice(0, 24);
  }

  // === Adaptive Light/Dark Apple-Clean Styling ===
  const style = document.createElement('style');
  style.textContent = `
    #wb-mastery-fab {
      position: fixed; right: 18px; bottom: 132px; z-index: 46;
      display: flex; gap: 7px; align-items: center;
      background: var(--card, #ffffff); color: var(--text, #0f172a);
      border: 1px solid var(--border, rgba(148,163,184,0.35)); border-radius: 999px;
      padding: 8px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer;
      box-shadow: 0 8px 24px rgba(15,23,42,.14); backdrop-filter: blur(12px);
      transition: transform .15s ease, box-shadow .15s ease;
    }
    #wb-mastery-fab:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(37,99,235,.22); }
    #wb-mastery-fab .ms-badge { background: var(--accent, #2563eb); color: #fff; border-radius: 999px; padding: 1px 7px; font-size: 11px; }
    #wb-mastery-drawer {
      position: fixed; right: 20px; bottom: 68px; width: min(740px, calc(100vw - 28px));
      max-height: min(84dvh, 780px); z-index: 9996; display: none; flex-direction: column;
      background: var(--card, #ffffff); color: var(--text, #0f172a);
      border: 1px solid var(--border, rgba(148,163,184,0.28)); border-radius: 18px;
      box-shadow: 0 24px 64px rgba(2,6,23,.28); overflow: hidden;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }
    #wb-mastery-drawer.open { display: flex; }
    .ms-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg2, rgba(148,163,184,0.08)); border-bottom: 1px solid var(--border, rgba(148,163,184,0.2)); }
    .ms-tabs { display: flex; gap: 6px; padding: 10px 16px; border-bottom: 1px solid var(--border, rgba(148,163,184,0.16)); flex-wrap: wrap; }
    .ms-tab { background: transparent; color: var(--muted, #64748b); border: 1px solid var(--border, rgba(148,163,184,0.25)); border-radius: 999px; padding: 5px 13px; font-size: 12px; cursor: pointer; font-weight: 600; transition: all .15s; }
    .ms-tab.active { background: var(--accent, #2563eb); color: #fff; border-color: var(--accent, #2563eb); }
    .ms-body { padding: 15px 16px; overflow-y: auto; flex: 1; font-size: 13px; line-height: 1.62; }
    .ms-card { background: var(--bg, rgba(148,163,184,0.06)); border: 1px solid var(--border, rgba(148,163,184,0.2)); border-radius: 14px; padding: 14px; margin-bottom: 12px; }
    .ms-btn { background: var(--accent, #2563eb); color: #fff; border: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .ms-btn.sec { background: var(--bg2, rgba(148,163,184,0.16)); color: var(--text, #0f172a); }
    .ms-btn.warn { background: #dc2626; color: #fff; }
    .ms-btn.ok { background: #059669; color: #fff; }
    .ms-btn.mid { background: #d97706; color: #fff; }
    .ms-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .ms-input, .ms-textarea, .ms-select { width: 100%; background: var(--card, #fff); color: var(--text, #0f172a); border: 1px solid var(--border, rgba(148,163,184,0.32)); border-radius: 9px; padding: 7px 10px; font-size: 12.5px; box-sizing: border-box; }
    canvas.ms-canvas { width: 100%; height: 260px; border: 1px solid var(--border, rgba(148,163,184,0.25)); border-radius: 12px; display: block; }
    .ms-q-link { color: var(--accent, #2563eb); font-weight: 600; cursor: pointer; text-decoration: none; text-align: left; background: none; border: none; padding: 0; font-size: 13px; }
    .ms-q-link:hover { text-decoration: underline; }
    .ms-rubric label { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; padding: 4px 9px; border-radius: 8px; border: 1px solid var(--border, rgba(148,163,184,0.25)); cursor: pointer; }
    @media (max-width: 760px) { #wb-mastery-fab { bottom: 72px; right: 12px; padding: 7px 12px; font-size: 12px; } }
  `;
  document.head.appendChild(style);

  const fab = document.createElement('button');
  fab.id = 'wb-mastery-fab';
  fab.innerHTML = '<span>⚡ 大师实验室</span><span class="ms-badge" id="ms-due-badge">0</span>';

  const drawer = document.createElement('div');
  drawer.id = 'wb-mastery-drawer';
  drawer.innerHTML = `
    <div class="ms-head">
      <div style="font-weight:700;font-size:14px;">⚡ 大师闭环实验室 · <span style="font-weight:500;opacity:.75;">${escHtml(window.__WB_SUBJECT_NAME__ || SLUG.toUpperCase())}</span></div>
      <button class="ms-btn sec" id="ms-close-btn">关闭 (Esc)</button>
    </div>
    <div class="ms-tabs">
      <button class="ms-tab active" data-tab="viz">🔬 学科专属沙盒 (14科)</button>
      <button class="ms-tab" data-tab="fsrs">🧠 SM-2 间隔复习 (可直达原题)</button>
      <button class="ms-tab" data-tab="defense">🎤 费曼口试 & AI 批改</button>
    </div>
    <div class="ms-body" id="ms-body"></div>
  `;

  function getQueue() {
    let items = loadJSON(FSRS_KEY, null);
    if (!Array.isArray(items) || items.length === 0) {
      items = seedDefaultQueue();
      saveJSON(FSRS_KEY, items);
    }
    return items;
  }

  function updateBadge() {
    const items = getQueue();
    const now = Date.now();
    const due = items.filter(it => (it.due || 0) <= now).length;
    const b = document.getElementById('ms-due-badge');
    if (b) b.textContent = String(due);
  }

  // === HiDPI Canvas Helper ===
  function setupHiDPI(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(320, Math.round(rect.width || 660));
    const h = 260;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.fillStyle = isDark ? '#0b1120' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);
    return { ctx, w, h, isDark, fg: isDark ? '#e2e8f0' : '#0f172a', grid: isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)', muted: isDark ? '#94a3b8' : '#64748b' };
  }

  // === TAB 1: 14-Subject Dedicated HiDPI Sandboxes ===
  function renderViz(container) {
    const defId = SANDBOX_CATALOG.some(s => s.id === SLUG) ? SLUG : 'icpc';
    container.innerHTML = `
      <div class="ms-card">
        <div class="ms-row" style="justify-content:space-between;margin-bottom:10px;">
          <strong style="font-size:13px;">当前学科互动沙盒：</strong>
          <select class="ms-select" id="ms-viz-sel" style="width:auto;min-width:270px;flex:1;">
            ${SANDBOX_CATALOG.map(s => `<option value="${s.id}" ${s.id === defId ? 'selected' : ''}>${escHtml(s.label)}</option>`).join('')}
          </select>
        </div>
        <div id="ms-viz-controls" class="ms-row" style="margin-bottom:10px;font-size:12px;"></div>
        <canvas id="ms-viz-canvas" class="ms-canvas"></canvas>
        <div id="ms-viz-caption" style="margin-top:9px;font-size:12.5px;color:var(--muted,#64748b);line-height:1.55;"></div>
      </div>
    `;
    const sel = document.getElementById('ms-viz-sel');

    function mountSandbox(mode) {
      const ctrl = document.getElementById('ms-viz-controls');
      const cap = document.getElementById('ms-viz-caption');
      const canvas = document.getElementById('ms-viz-canvas');

      if (mode === 'c4') {
        ctrl.innerHTML = `函数：<select id="ms-c4-fn" class="ms-select" style="width:auto;padding:4px 8px;"><option value="sin">sin(x)</option><option value="exp">e^x</option><option value="ln">ln(1+x)</option></select> 阶数 N=<strong id="ms-c4-nv">3</strong><input type="range" id="ms-c4-n" min="1" max="13" step="2" value="3" style="width:130px;">`;
        const draw = () => {
          const fn = document.getElementById('ms-c4-fn').value;
          const N = parseInt(document.getElementById('ms-c4-n').value, 10);
          document.getElementById('ms-c4-nv').textContent = N;
          const { ctx, w, h, fg, grid } = setupHiDPI(canvas);
          const ox = w * 0.5, oy = h * 0.52, sx = w / 10, sy = h / 4.2;
          ctx.strokeStyle = grid; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();
          const fTrue = x => fn === 'sin' ? Math.sin(x) : (fn === 'exp' ? Math.exp(x) : (x > -0.98 ? Math.log(1 + x) : NaN));
          const fTaylor = x => {
            let s = 0, fact = 1;
            if (fn === 'sin') {
              for (let k = 0; 2 * k + 1 <= N; k++) {
                const p = 2 * k + 1; fact = 1; for (let j = 2; j <= p; j++) fact *= j;
                s += (k % 2 ? -1 : 1) * Math.pow(x, p) / fact;
              }
            } else if (fn === 'exp') {
              for (let k = 0; k <= N; k++) { if (k > 0) fact *= k; s += Math.pow(x, k) / fact; }
            } else {
              for (let k = 1; k <= N; k++) s += ((k % 2 ? 1 : -1) * Math.pow(x, k)) / k;
            }
            return s;
          };
          // True curve
          ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2.4; ctx.beginPath();
          let started = false;
          for (let px = 0; px <= w; px += 2) {
            const x = (px - ox) / sx, y = fTrue(x);
            if (!isFinite(y) || Math.abs(y) > 4) { started = false; continue; }
            const py = oy - y * sy;
            if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
          }
          ctx.stroke();
          // Taylor curve
          ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath();
          started = false;
          for (let px = 0; px <= w; px += 2) {
            const x = (px - ox) / sx, y = fTaylor(x);
            if (!isFinite(y) || Math.abs(y) > 4) { started = false; continue; }
            const py = oy - y * sy;
            if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
          }
          ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#3b82f6'; ctx.font = '600 12px system-ui'; ctx.fillText(`— 精确函数 ${fn === 'ln' ? 'ln(1+x)' : (fn === 'exp' ? 'e^x' : 'sin(x)')}`, 14, 22);
          ctx.fillStyle = '#f43f5e'; ctx.fillText(`-- ${N} 阶麦克劳林多项式 T_${N}(x)`, 175, 22);
          cap.textContent = fn === 'ln'
            ? '注意收敛半径 R=1：无论把阶数 N 调多高，ln(1+x) 的泰勒级数在 |x|>1 处都会剧烈发散！'
            : `拖动阶数 N 观察多项式如何在 x=0 邻域贴合原函数，以及拉格朗日余项在远离展开点时的迅速增长。`;
        };
        ctrl.querySelectorAll('input,select').forEach(el => el.addEventListener('input', draw));
        draw();
      } else if (mode === 'la') {
        ctrl.innerHTML = `a=<input type="range" id="ms-la-a" min="-2" max="2" step="0.1" value="1.4" style="width:72px;"> b=<input type="range" id="ms-la-b" min="-2" max="2" step="0.1" value="0.6" style="width:72px;"> c=<input type="range" id="ms-la-c" min="-2" max="2" step="0.1" value="0.2" style="width:72px;"> d=<input type="range" id="ms-la-d" min="-2" max="2" step="0.1" value="0.9" style="width:72px;">`;
        const draw = () => {
          const a = +document.getElementById('ms-la-a').value, b = +document.getElementById('ms-la-b').value;
          const c = +document.getElementById('ms-la-c').value, d = +document.getElementById('ms-la-d').value;
          const det = a * d - b * c, tr = a + d, disc = tr * tr - 4 * det;
          const { ctx, w, h, fg, grid } = setupHiDPI(canvas);
          const ox = w * 0.5, oy = h * 0.52, sc = 48;
          // Transformed grid
          ctx.strokeStyle = grid; ctx.lineWidth = 1;
          for (let i = -4; i <= 4; i++) {
            const x1 = ox + (a * i + b * -4) * sc, y1 = oy - (c * i + d * -4) * sc;
            const x2 = ox + (a * i + b * 4) * sc, y2 = oy - (c * i + d * 4) * sc;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            const u1 = ox + (a * -4 + b * i) * sc, v1 = oy - (c * -4 + d * i) * sc;
            const u2 = ox + (a * 4 + b * i) * sc, v2 = oy - (c * 4 + d * i) * sc;
            ctx.beginPath(); ctx.moveTo(u1, v1); ctx.lineTo(u2, v2); ctx.stroke();
          }
          // Unit square image (area = |det|)
          ctx.fillStyle = det >= 0 ? 'rgba(59,130,246,0.18)' : 'rgba(244,63,94,0.20)';
          ctx.beginPath();
          ctx.moveTo(ox, oy); ctx.lineTo(ox + a * sc, oy - c * sc);
          ctx.lineTo(ox + (a + b) * sc, oy - (c + d) * sc); ctx.lineTo(ox + b * sc, oy - d * sc); ctx.closePath(); ctx.fill();
          // Unit circle -> Ellipse
          ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2.2; ctx.beginPath();
          for (let t = 0; t <= 64; t++) {
            const ang = (t / 64) * Math.PI * 2, ux = Math.cos(ang), uy = Math.sin(ang);
            const px = ox + (a * ux + b * uy) * sc, py = oy - (c * ux + d * uy) * sc;
            if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();
          // Basis vectors Ae1, Ae2
          const drawVec = (vx, vy, col, lbl) => {
            ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.6;
            ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + vx * sc, oy - vy * sc); ctx.stroke();
            ctx.beginPath(); ctx.arc(ox + vx * sc, oy - vy * sc, 4, 0, Math.PI * 2); ctx.fill();
            ctx.font = '700 12px monospace'; ctx.fillText(lbl, ox + vx * sc + 6, oy - vy * sc - 4);
          };
          drawVec(a, c, '#10b981', `Ae₁(${a.toFixed(1)},${c.toFixed(1)})`);
          drawVec(b, d, '#f59e0b', `Ae₂(${b.toFixed(1)},${d.toFixed(1)})`);
          ctx.fillStyle = fg; ctx.font = '600 12px monospace';
          const eigTxt = disc >= 0 ? `λ₁=${((tr + Math.sqrt(disc)) / 2).toFixed(2)}, λ₂=${((tr - Math.sqrt(disc)) / 2).toFixed(2)}` : `共轭复特征值 ${(tr / 2).toFixed(2)}±${(Math.sqrt(-disc) / 2).toFixed(2)}i`;
          ctx.fillText(`det(A) = ${det.toFixed(2)} | tr(A) = ${tr.toFixed(2)} | ${eigTxt}`, 14, 22);
          cap.textContent = Math.abs(det) < 0.08
            ? '⚠️ det(A) ≈ 0：矩阵奇异（降秩），整个二维平面被拍扁成一条线，零空间 N(A) 出现非零维度！'
            : (det < 0 ? '🔄 det(A) < 0：空间定向发生翻转（手性反转），紫线为单位圆变换后的奇异值椭圆。' : '阴影面积 = |det(A)|，紫色椭圆长短半轴即为矩阵的奇异值 σ₁, σ₂。');
        };
        ctrl.querySelectorAll('input').forEach(el => el.addEventListener('input', draw));
        draw();
      } else if (mode === 'prob') {
        ctrl.innerHTML = `母分布：<select id="ms-p-dist" class="ms-select" style="width:auto;padding:4px 8px;"><option value="exp">指数分布 (强右偏)</option><option value="uni">均匀分布 U(0,1)</option><option value="bern">伯努利 (p=0.2)</option></select> 样本量 n=<strong id="ms-p-nv">12</strong><input type="range" id="ms-p-n" min="1" max="40" value="12" style="width:120px;"> <button class="ms-btn sec" id="ms-p-re">重抽 2000 组</button>`;
        const draw = () => {
          const dist = document.getElementById('ms-p-dist').value;
          const n = +document.getElementById('ms-p-n').value;
          document.getElementById('ms-p-nv').textContent = n;
          const sampleOne = () => dist === 'exp' ? -Math.log(Math.max(1e-6, Math.random())) : (dist === 'uni' ? Math.random() : (Math.random() < 0.2 ? 1 : 0));
          const mu = dist === 'exp' ? 1 : (dist === 'uni' ? 0.5 : 0.2);
          const sd = (dist === 'exp' ? 1 : (dist === 'uni' ? Math.sqrt(1 / 12) : Math.sqrt(0.16))) / Math.sqrt(n);
          const bins = new Array(32).fill(0);
          const lo = mu - 3.6 * sd, hi = mu + 3.6 * sd;
          for (let t = 0; t < 2000; t++) {
            let s = 0; for (let i = 0; i < n; i++) s += sampleOne();
            const m = s / n;
            const bi = Math.floor(((m - lo) / (hi - lo)) * bins.length);
            if (bi >= 0 && bi < bins.length) bins[bi]++;
          }
          const maxB = Math.max(1, ...bins);
          const { ctx, w, h, fg, grid } = setupHiDPI(canvas);
          const bw = (w - 48) / bins.length;
          bins.forEach((c, i) => {
            const bh = (c / maxB) * (h - 60);
            ctx.fillStyle = 'rgba(59,130,246,0.55)';
            ctx.fillRect(24 + i * bw + 1, h - 26 - bh, bw - 2, bh);
          });
          // Overlay theoretical Normal PDF
          ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2.4; ctx.beginPath();
          for (let px = 24; px <= w - 24; px += 2) {
            const z = ((px - 24) / (w - 48) - 0.5) * 7.2;
            const y = Math.exp(-0.5 * z * z) * (h - 60);
            if (px === 24) ctx.moveTo(px, h - 26 - y); else ctx.lineTo(px, h - 26 - y);
          }
          ctx.stroke();
          ctx.fillStyle = fg; ctx.font = '600 12px system-ui';
          ctx.fillText(`2000 组样本均值直方图 (n=${n}) vs 理论正态曲线 N(${mu.toFixed(2)}, ${(sd * sd).toFixed(4)})`, 18, 22);
          cap.textContent = n <= 2 ? 'n 很小时，样本均值仍明显保留原分布的偏度或离散特征。' : `n=${n} 时，即使母分布严重右偏或离散，样本均值已迅速贴合红色高斯钟形曲线（标准差按 1/√n 收缩）。`;
        };
        ctrl.querySelectorAll('input,select').forEach(el => el.addEventListener('input', draw));
        document.getElementById('ms-p-re').addEventListener('click', draw);
        draw();
      } else if (mode === 'phys') {
        ctrl.innerHTML = `步长 dt=<strong id="ms-ph-dtv">0.18</strong><input type="range" id="ms-ph-dt" min="0.04" max="0.35" step="0.02" value="0.18" style="width:140px;">`;
        const draw = () => {
          const dt = +document.getElementById('ms-ph-dt').value;
          document.getElementById('ms-ph-dtv').textContent = dt.toFixed(2);
          const { ctx, w, h, fg, grid } = setupHiDPI(canvas);
          const cx = w * 0.28, cy = h * 0.54, sc = 56;
          ctx.strokeStyle = grid; ctx.beginPath(); ctx.moveTo(16, cy); ctx.lineTo(w * 0.54, cy); ctx.moveTo(cx, 24); ctx.lineTo(cx, h - 16); ctx.stroke();
          // Simulate Euler vs Velocity-Verlet for harmonic oscillator q'' = -q
          let qe = 1, pe = 0, qv = 1, pv = 0;
          const eE = [], eV = [];
          ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx + qe * sc, cy - pe * sc);
          for (let i = 0; i < 120; i++) {
            const nq = qe + pe * dt, np = pe - qe * dt; qe = nq; pe = np;
            eE.push(0.5 * (qe * qe + pe * pe));
            ctx.lineTo(cx + Math.max(-2.2, Math.min(2.2, qe)) * sc, cy - Math.max(-2.2, Math.min(2.2, pe)) * sc);
          }
          ctx.stroke();
          ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(cx + qv * sc, cy - pv * sc);
          for (let i = 0; i < 120; i++) {
            const pHalf = pv - 0.5 * qv * dt;
            qv = qv + pHalf * dt;
            pv = pHalf - 0.5 * qv * dt;
            eV.push(0.5 * (qv * qv + pv * pv));
            ctx.lineTo(cx + qv * sc, cy - pv * sc);
          }
          ctx.stroke();
          // Right side: Energy E(t) plot
          const rx = w * 0.58, rw = w * 0.39;
          ctx.strokeStyle = grid; ctx.strokeRect(rx, 36, rw, h - 56);
          const plotE = (arr, col) => {
            ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
            arr.forEach((e, i) => {
              const px = rx + (i / arr.length) * rw;
              const py = h - 24 - Math.min(1, e / 3.0) * (h - 68);
              if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.stroke();
          };
          plotE(eE, '#f43f5e'); plotE(eV, '#10b981');
          ctx.fillStyle = fg; ctx.font = '600 11.5px system-ui';
          ctx.fillText('左：相空间轨迹 (q, p)', 16, 20); ctx.fillText('右：总能量 E(t) 漂移对比', rx, 20);
          ctx.fillStyle = '#f43f5e'; ctx.fillText(`Euler 末能量: ${eE[eE.length - 1].toFixed(2)}`, rx + 8, 52);
          ctx.fillStyle = '#10b981'; ctx.fillText(`Verlet 末能量: ${eV[eV.length - 1].toFixed(3)}`, rx + 8, 70);
          cap.textContent = '红色显式 Euler 在相空间不断向外螺旋发散（虚假注入能量）；绿色 Velocity-Verlet 辛积分严格闭合，能量长期守恒。';
        };
        document.getElementById('ms-ph-dt').addEventListener('input', draw);
        draw();
      } else if (mode === 'icpc') {
        ctrl.innerHTML = `<button class="ms-btn" id="ms-sg-add">区间 [2, 5] 整体 +3 (打 Lazy 标记)</button> <button class="ms-btn sec" id="ms-sg-push">执行 pushdown 下传</button> <button class="ms-btn sec" id="ms-sg-rst">重置</button>`;
        let lazyOn = false, pushed = false;
        const draw = () => {
          const { ctx, w, h, fg, muted } = setupHiDPI(canvas);
          const nodes = [
            { id: '[1,8]', x: 0.5, y: 42, sum: lazyOn ? 48 : 36, lz: 0 },
            { id: '[1,4]', x: 0.27, y: 112, sum: lazyOn ? 27 : 18, lz: (lazyOn && !pushed) ? 3 : 0 },
            { id: '[5,8]', x: 0.73, y: 112, sum: lazyOn ? 21 : 18, lz: 0 },
            { id: '[1,2]', x: 0.14, y: 192, sum: (lazyOn && pushed) ? 8 : 5, lz: 0 },
            { id: '[3,4]', x: 0.39, y: 192, sum: (lazyOn && pushed) ? 19 : 13, lz: 0 },
            { id: '[5,6]', x: 0.61, y: 192, sum: lazyOn ? 11 : 8, lz: 0 },
            { id: '[7,8]', x: 0.86, y: 192, sum: 10, lz: 0 }
          ];
          const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
          ctx.strokeStyle = 'rgba(148,163,184,0.45)'; ctx.lineWidth = 1.6;
          edges.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(nodes[a].x * w, nodes[a].y); ctx.lineTo(nodes[b].x * w, nodes[b].y); ctx.stroke(); });
          nodes.forEach(nd => {
            const nx = nd.x * w, ny = nd.y;
            ctx.fillStyle = nd.lz ? 'rgba(245,158,11,0.22)' : 'rgba(59,130,246,0.14)';
            ctx.strokeStyle = nd.lz ? '#f59e0b' : '#3b82f6'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(nx - 46, ny - 22, 92, 44, 10) : ctx.rect(nx - 46, ny - 22, 92, 44);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = fg; ctx.font = '700 11.5px monospace'; ctx.textAlign = 'center';
            ctx.fillText(`${nd.id} sum=${nd.sum}`, nx, ny - 3);
            ctx.fillStyle = nd.lz ? '#f59e0b' : muted; ctx.font = '600 11px monospace';
            ctx.fillText(nd.lz ? `lazy = +${nd.lz} ⏳` : 'lazy = 0', nx, ny + 14);
          });
          ctx.textAlign = 'left';
          cap.textContent = !lazyOn ? '点击「区间 [2,5] +3」观察 O(log N) 拆分与懒标记暂存，再点「pushdown」看标记如何精确下传到子区间。'
            : (!pushed ? '⏳ [1,4] 被整段覆盖暂存 lazy=+3，子树 [1,2]/[3,4] 暂未修改，本次更新仅访问 O(log N) 个节点！' : '✅ pushdown 后，[1,4] 懒标记清零，子树 [1,2]/[3,4] 的区间和精确补齐！');
        };
        document.getElementById('ms-sg-add').onclick = () => { lazyOn = true; pushed = false; draw(); };
        document.getElementById('ms-sg-push').onclick = () => { if (lazyOn) pushed = true; draw(); };
        document.getElementById('ms-sg-rst').onclick = () => { lazyOn = false; pushed = false; draw(); };
        draw();
      } else if (mode === 'ai') {
        ctrl.innerHTML = `条件数 κ=<strong id="ms-ai-kv">8</strong><input type="range" id="ms-ai-k" min="1" max="18" value="8" style="width:110px;"> 学习率 η=<strong id="ms-ai-lv">0.16</strong><input type="range" id="ms-ai-l" min="0.04" max="0.45" step="0.02" value="0.16" style="width:110px;">`;
        const draw = () => {
          const k = +document.getElementById('ms-ai-k').value, lr = +document.getElementById('ms-ai-l').value;
          document.getElementById('ms-ai-kv').textContent = k; document.getElementById('ms-ai-lv').textContent = lr.toFixed(2);
          const { ctx, w, h, grid } = setupHiDPI(canvas);
          const cx = w * 0.5, cy = h * 0.54;
          ctx.strokeStyle = grid; ctx.lineWidth = 1;
          for (let r = 36; r <= 180; r += 36) { ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.45, Math.max(8, (r * 1.45) / Math.sqrt(k)), 0, 0, Math.PI * 2); ctx.stroke(); }
          const sim = (type, col) => {
            let x = 200, y = 78, vx = 0, vy = 0, mx = 0, my = 0, v2x = 0, v2y = 0;
            ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(cx + x, cy + y);
            for (let t = 1; t <= 36; t++) {
              const gx = x * 0.25, gy = k * y * 0.25;
              if (type === 'sgd') { x -= lr * gx; y -= lr * gy; }
              else if (type === 'mom') { vx = 0.78 * vx + gx; vy = 0.78 * vy + gy; x -= lr * 0.55 * vx; y -= lr * 0.55 * vy; }
              else {
                mx = 0.85 * mx + 0.15 * gx; my = 0.85 * my + 0.15 * gy;
                v2x = 0.95 * v2x + 0.05 * gx * gx; v2y = 0.95 * v2y + 0.05 * gy * gy;
                x -= lr * 38 * mx / (Math.sqrt(v2x) + 1e-4); y -= lr * 38 * my / (Math.sqrt(v2y) + 1e-4);
              }
              ctx.lineTo(cx + Math.max(-cx + 8, Math.min(cx - 8, x)), cy + Math.max(-cy + 14, Math.min(cy - 14, y)));
            }
            ctx.stroke();
          };
          sim('sgd', '#f43f5e'); sim('mom', '#f59e0b'); sim('adam', '#10b981');
          ctx.font = '600 12px system-ui';
          ctx.fillStyle = '#f43f5e'; ctx.fillText('— SGD (锯齿震荡)', 16, 22);
          ctx.fillStyle = '#f59e0b'; ctx.fillText('— Momentum (惯性加速)', 150, 22);
          ctx.fillStyle = '#10b981'; ctx.fillText('— Adam (自适应步长直奔极小值)', 310, 22);
          cap.textContent = `在条件数 κ=${k} 的狭长山谷上，SGD 在陡峭纵轴剧烈震荡，而 Adam 通过二阶矩自适应缩放各维度步长平稳收敛。`;
        };
        ctrl.querySelectorAll('input').forEach(el => el.addEventListener('input', draw));
        draw();
      } else if (mode === 'quant') {
        ctrl.innerHTML = `市价买单量 Q=<strong id="ms-q-qv">180</strong> 手<input type="range" id="ms-q-q" min="20" max="400" step="10" value="180" style="width:130px;"> 流动性深度=<strong id="ms-q-dv">1.0</strong><input type="range" id="ms-q-d" min="0.4" max="2.0" step="0.2" value="1.0" style="width:100px;">`;
        const draw = () => {
          const Q = +document.getElementById('ms-q-q').value, depth = +document.getElementById('ms-q-d').value;
          document.getElementById('ms-q-qv').textContent = Q; document.getElementById('ms-q-dv').textContent = depth.toFixed(1);
          const { ctx, w, h, fg, grid } = setupHiDPI(canvas);
          const mid = w * 0.48, baseH = h - 32;
          // Bid cumulative curve (green, left)
          ctx.fillStyle = 'rgba(16,185,129,0.22)'; ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(mid - 14, baseH);
          for (let i = 1; i <= 10; i++) ctx.lineTo(mid - 14 - i * 24, baseH - Math.min(180, i * 16 * depth));
          ctx.lineTo(mid - 254, baseH); ctx.closePath(); ctx.fill(); ctx.stroke();
          // Ask cumulative curve (red, right)
          ctx.fillStyle = 'rgba(244,63,94,0.20)'; ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(mid + 14, baseH);
          for (let i = 1; i <= 10; i++) ctx.lineTo(mid + 14 + i * 24, baseH - Math.min(180, i * 17 * depth));
          ctx.lineTo(mid + 254, baseH); ctx.closePath(); ctx.fill(); ctx.stroke();
          // Market buy fill sweep highlight
          const levelsSwept = Math.min(10, Q / (36 * depth));
          const sweepX = mid + 14 + levelsSwept * 24;
          ctx.fillStyle = 'rgba(245,158,11,0.35)';
          ctx.fillRect(mid + 14, 42, Math.max(8, sweepX - mid - 14), baseH - 42);
          const slippageBps = (levelsSwept * 3.8).toFixed(1);
          ctx.fillStyle = fg; ctx.font = '600 12px monospace';
          ctx.fillText(`买盘 Bid 深度 ← | 中间价 100.00 | → 卖盘 Ask 吃单穿透 ${levelsSwept.toFixed(1)} 档 · 冲击滑点 ≈ ${slippageBps} bps`, 16, 22);
          cap.textContent = `市价吃单 ${Q} 手在流动性系数 ${depth.toFixed(1)} 下击穿卖盘 ${levelsSwept.toFixed(1)} 档，产生约 ${slippageBps} bps 市场冲击成本（实际工程需拆单 TWAP/VWAP）。`;
        };
        ctrl.querySelectorAll('input').forEach(el => el.addEventListener('input', draw));
        draw();
      } else if (mode === 'cpp') {
        ctrl.innerHTML = `<button class="ms-btn" id="ms-cpp-push">Producer push()</button> <button class="ms-btn sec" id="ms-cpp-pop">Consumer pop()</button> <label><input type="checkbox" id="ms-cpp-pad" checked> alignas(64) 隔离缓存行</label>`;
        let head = 0, tail = 3;
        const capN = 8;
        const draw = () => {
          const padded = document.getElementById('ms-cpp-pad').checked;
          const { ctx, w, h, fg, muted } = setupHiDPI(canvas);
          // Top: 8-slot SPSC ring buffer
          const slotW = Math.min(62, (w - 80) / capN);
          const startX = (w - slotW * capN) * 0.5;
          for (let i = 0; i < capN; i++) {
            const x = startX + i * slotW, y = 42;
            const filled = ((i - head + capN) % capN) < ((tail - head + capN) % capN);
            ctx.fillStyle = filled ? 'rgba(59,130,246,0.22)' : 'rgba(148,163,184,0.10)';
            ctx.strokeStyle = filled ? '#3b82f6' : 'rgba(148,163,184,0.35)'; ctx.lineWidth = 1.8;
            ctx.fillRect(x + 2, y, slotW - 4, 44); ctx.strokeRect(x + 2, y, slotW - 4, 44);
            ctx.fillStyle = fg; ctx.font = '700 12px monospace'; ctx.textAlign = 'center';
            ctx.fillText(filled ? ('#' + i) : '空', x + slotW / 2, y + 26);
            if (i === head) { ctx.fillStyle = '#10b981'; ctx.fillText('▲ head(C)', x + slotW / 2, y + 60); }
            if (i === tail) { ctx.fillStyle = '#f59e0b'; ctx.fillText('▼ tail(P)', x + slotW / 2, y - 8); }
          }
          // Bottom: 64B Cache Line layout (False Sharing vs alignas(64))
          ctx.textAlign = 'left';
          const cy = 148;
          if (padded) {
            ctx.fillStyle = 'rgba(16,185,129,0.16)'; ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
            ctx.fillRect(28, cy, w * 0.42, 54); ctx.strokeRect(28, cy, w * 0.42, 54);
            ctx.fillRect(w * 0.52, cy, w * 0.42, 54); ctx.strokeRect(w * 0.52, cy, w * 0.42, 54);
            ctx.fillStyle = fg; ctx.font = '700 12px monospace';
            ctx.fillText('Cache Line #0 (64B) · Core 0', 40, cy + 21);
            ctx.fillStyle = '#10b981'; ctx.fillText('alignas(64) atomic<size_t> head (acquire)', 40, cy + 40);
            ctx.fillStyle = fg; ctx.fillText('Cache Line #1 (64B) · Core 1', w * 0.52 + 12, cy + 21);
            ctx.fillStyle = '#f59e0b'; ctx.fillText('alignas(64) atomic<size_t> tail (release)', w * 0.52 + 12, cy + 40);
          } else {
            ctx.fillStyle = 'rgba(244,63,94,0.18)'; ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2.2;
            ctx.fillRect(28, cy, w - 56, 54); ctx.strokeRect(28, cy, w - 56, 54);
            ctx.fillStyle = '#f43f5e'; ctx.font = '700 12.5px monospace';
            ctx.fillText('⚠️ 同一 64B Cache Line（伪共享 False Sharing!）: [ head | tail | ... ]', 42, cy + 22);
            ctx.fillStyle = fg; ctx.font = '600 11.5px system-ui';
            ctx.fillText('Core 0 改 head 与 Core 1 改 tail 互相触发 MESI RFO 缓存行失效，吞吐量暴跌 5~10 倍！', 42, cy + 42);
          }
          const used = (tail - head + capN) % capN;
          cap.textContent = padded
            ? `✅ 当前环形队列占用 ${used}/${capN - 1}；head 与 tail 经 alignas(64) 隔离在不同缓存行，配合 memory_order_release/acquire 零锁零伪共享。`
            : `⚠️ 关闭 alignas(64) 后，head 与 tail 挤在同一 64 字节缓存行内，双核并发读写引发严重缓存行乒乓效应（False Sharing）。`;
        };
        document.getElementById('ms-cpp-push').onclick = () => { if (((tail + 1) % capN) !== head) tail = (tail + 1) % capN; draw(); };
        document.getElementById('ms-cpp-pop').onclick = () => { if (head !== tail) head = (head + 1) % capN; draw(); };
        document.getElementById('ms-cpp-pad').onchange = draw;
        draw();
      } else if (mode === 'arch') {
        ctrl.innerHTML = `<label><input type="checkbox" id="ms-ar-fwd" checked> 启用 EX/MEM Forwarding 旁路</label> <label><input type="checkbox" id="ms-ar-fence"> 插入 mfence / Store Buffer 排空</label>`;
        const draw = () => {
          const fwd = document.getElementById('ms-ar-fwd').checked, fence = document.getElementById('ms-ar-fence').checked;
          const { ctx, w, h, fg, muted } = setupHiDPI(canvas);
          const stages = ['IF', 'ID', 'EX', 'MEM', 'WB'];
          const cols = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#06b6d4'];
          const cw = Math.min(54, (w - 150) / 9);
          const instrs = [
            { name: 'ADD x1, x2, x3', off: 0 },
            { name: 'SUB x4, x1, x5', off: fwd ? 1 : 3 },
            { name: 'STORE [a], x4', off: (fwd ? 2 : 4) + (fence ? 1 : 0) }
          ];
          ctx.fillStyle = muted; ctx.font = '600 11px monospace';
          for (let c = 1; c <= 9; c++) ctx.fillText('C' + c, 134 + (c - 1) * cw + 14, 24);
          instrs.forEach((ins, r) => {
            const y = 44 + r * 58;
            ctx.fillStyle = fg; ctx.font = '600 12px monospace'; ctx.fillText(ins.name, 14, y + 22);
            if (!fwd && r === 1) {
              for (let s = 0; s < 2; s++) {
                ctx.fillStyle = 'rgba(244,63,94,0.22)'; ctx.strokeStyle = '#f43f5e';
                ctx.fillRect(134 + (1 + s) * cw, y, cw - 4, 34); ctx.strokeRect(134 + (1 + s) * cw, y, cw - 4, 34);
                ctx.fillStyle = '#f43f5e'; ctx.fillText('STALL', 134 + (1 + s) * cw + 5, y + 21);
              }
            }
            stages.forEach((st, si) => {
              const x = 134 + (ins.off + si) * cw;
              if (x + cw > w - 8) return;
              ctx.fillStyle = cols[si] + '33'; ctx.strokeStyle = cols[si]; ctx.lineWidth = 1.6;
              ctx.fillRect(x, y, cw - 4, 34); ctx.strokeRect(x, y, cw - 4, 34);
              ctx.fillStyle = fg; ctx.fillText(st, x + 12, y + 21);
            });
          });
          const totalCyc = (fwd ? 7 : 9) + (fence ? 1 : 0);
          cap.textContent = fwd
            ? `✅ 启用 EX→EX Forwarding 后，SUB 直接旁路读取 ADD 的运算结果，消除 2 拍数据冒险气泡（总耗时 ${totalCyc} 周期）${fence ? '；mfence 额外排空 Store Buffer 保证 TSO 顺序一致。' : '。'}`
            : `⚠️ 关闭旁路后，SUB 必须插入 2 个 STALL 气泡等待 ADD 写回 WB 阶段（总耗时升至 ${totalCyc} 周期）。`;
        };
        ctrl.querySelectorAll('input').forEach(el => el.addEventListener('change', draw));
        draw();
      } else if (mode === 'dsos') {
        ctrl.innerHTML = `顺序扫描污染比例：<strong id="ms-os-sv">40%</strong><input type="range" id="ms-os-s" min="0" max="80" step="10" value="40" style="width:140px;">`;
        const draw = () => {
          const scan = +document.getElementById('ms-os-s').value;
          document.getElementById('ms-os-sv').textContent = scan + '%';
          const { ctx, w, h, fg } = setupHiDPI(canvas);
          const lruHit = Math.max(12, 82 - scan * 0.85);
          const q2Hit = Math.max(38, 82 - scan * 0.42);
          const bars = [
            { name: '传统 LRU 命中率', val: lruHit, col: '#f43f5e' },
            { name: '2Q / CLOCK-Pro 命中率', val: q2Hit, col: '#10b981' }
          ];
          bars.forEach((b, i) => {
            const y = 60 + i * 82, bw = (w - 200) * (b.val / 100);
            ctx.fillStyle = fg; ctx.font = '600 13px system-ui'; ctx.fillText(b.name, 20, y + 22);
            ctx.fillStyle = b.col + '33'; ctx.fillRect(175, y, w - 200, 34);
            ctx.fillStyle = b.col; ctx.fillRect(175, y, bw, 34);
            ctx.fillStyle = '#fff'; ctx.font = '700 13px monospace'; ctx.fillText(b.val.toFixed(1) + '%', 185, y + 22);
          });
          cap.textContent = `当全表顺序扫描占 ${scan}% 时，2Q 凭「冷页先入试用 FIFO、二次命中才晋升热链」比传统 LRU 领先 +${(q2Hit - lruHit).toFixed(1)} 个百分点。`;
        };
        document.getElementById('ms-os-s').addEventListener('input', draw);
        draw();
      } else if (mode === 'net') {
        ctrl.innerHTML = `瓶颈缓冲：<strong id="ms-nt-bv">0.5 BDP</strong><input type="range" id="ms-nt-b" min="0.5" max="4.0" step="0.5" value="0.5" style="width:110px;"> 丢包：<strong id="ms-nt-lv">1.0%</strong><input type="range" id="ms-nt-l" min="0" max="5" step="0.5" value="1" style="width:100px;">`;
        const draw = () => {
          const buf = +document.getElementById('ms-nt-b').value, loss = +document.getElementById('ms-nt-l').value;
          document.getElementById('ms-nt-bv').textContent = buf.toFixed(1) + ' BDP'; document.getElementById('ms-nt-lv').textContent = loss.toFixed(1) + '%';
          const { ctx, w, h, grid } = setupHiDPI(canvas);
          ctx.strokeStyle = grid; ctx.beginPath(); for (let y = 44; y <= h - 30; y += 36) { ctx.moveTo(24, y); ctx.lineTo(w - 20, y); } ctx.stroke();
          ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.2; ctx.beginPath();
          let cwnd = 110;
          for (let x = 24; x <= w - 24; x += 6) {
            const t = x - 24;
            if ((loss > 0 && t > 0 && t % Math.max(36, Math.round(180 / loss)) === 0) || (buf < 1.5 && cwnd > 140)) cwnd = Math.max(28, cwnd * 0.7);
            else cwnd = Math.min(160 + buf * 12, cwnd + 3.4);
            const py = h - 26 - cwnd * 0.95;
            if (x === 24) ctx.moveTo(x, py); else ctx.lineTo(x, py);
          }
          ctx.stroke();
          ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.2; ctx.beginPath();
          for (let x = 24; x <= w - 24; x += 6) {
            const t = x - 24, bbr = (t % 220 === 198) ? 48 : 148 + Math.sin(t * 0.08) * 10;
            const py = h - 26 - bbr * 0.95;
            if (x === 24) ctx.moveTo(x, py); else ctx.lineTo(x, py);
          }
          ctx.stroke();
          ctx.font = '600 12px system-ui';
          ctx.fillStyle = '#f59e0b'; ctx.fillText('— CUBIC (丢包乘性减窗)', 24, 22);
          ctx.fillStyle = '#06b6d4'; ctx.fillText('— BBR (按 2 BDP 稳定节奏发包)', 210, 22);
          cap.textContent = buf <= 1.0 ? '浅缓冲下 BBRv1 不响应丢包持续占满 2 BDP，导致 CUBIC 频繁丢包被饿死；调大缓冲至 3+ BDP 可见 CUBIC 反向填满队列。' : '深缓冲下 CUBIC 不断填满队列扩张窗口，BBRv1 仍维持 2 BDP 控流，吞吐占比反转。';
        };
        ctrl.querySelectorAll('input').forEach(el => el.addEventListener('input', draw));
        draw();
      } else if (mode === 'dbse') {
        ctrl.innerHTML = `隔离级别：<select id="ms-db-iso" class="ms-select" style="width:auto;padding:4px 8px;"><option value="si">REPEATABLE READ (快照隔离 SI)</option><option value="ssi">SERIALIZABLE (可串行化 SSI)</option></select>`;
        const draw = () => {
          const iso = document.getElementById('ms-db-iso').value;
          const { ctx, w, h, fg } = setupHiDPI(canvas);
          const steps = [
            { tx: 0, x: 0.14, lbl: 'T1: 读值班=2人' }, { tx: 1, x: 0.28, lbl: 'T2: 读值班=2人' },
            { tx: 0, x: 0.50, lbl: 'T1: Alice 请假' }, { tx: 1, x: 0.68, lbl: 'T2: Bob 请假' }
          ];
          [75, 165].forEach((y, i) => {
            ctx.strokeStyle = i === 0 ? '#3b82f6' : '#8b5cf6'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(w - 30, y); ctx.stroke();
            ctx.fillStyle = fg; ctx.font = '700 12px monospace'; ctx.fillText(i === 0 ? 'T1' : 'T2', 14, y + 4);
          });
          steps.forEach(st => {
            const x = st.x * w, y = st.tx === 0 ? 75 : 165;
            ctx.fillStyle = st.tx === 0 ? '#3b82f6' : '#8b5cf6';
            ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = fg; ctx.font = '600 11.5px system-ui'; ctx.fillText(st.lbl, x - 34, y - 14);
          });
          ctx.fillStyle = iso === 'si' ? '#f43f5e' : '#10b981'; ctx.font = '700 13px system-ui';
          ctx.fillText(iso === 'si' ? '❌ 均提交成功 → 值班人数=0（Write Skew 写偏斜破坏约束！）' : '✅ SSI 检测到 rw-反依赖环 → 中止 T2，守住「至少1人值班」不变量！', 40, 228);
          cap.textContent = iso === 'si' ? '快照隔离下 T1 与 T2 修改互不重叠的行，无写-写冲突，双双提交却违背了全局业务约束。' : '切换到 SSI 后，数据库追踪 rw-依赖环并回滚冲突事务（或用 SELECT FOR UPDATE 显式加锁）。';
        };
        document.getElementById('ms-db-iso').addEventListener('change', draw);
        draw();
      } else if (mode === 'comp') {
        ctrl.innerHTML = `测试串（识别以 ab 结尾的 {a,b}*）：<input id="ms-cp-str" class="ms-input" style="width:160px;" value="baab" />`;
        const draw = () => {
          const s = (document.getElementById('ms-cp-str').value || '').toLowerCase();
          const { ctx, w, h, fg, muted } = setupHiDPI(canvas);
          let st = 0; const trace = [0];
          for (const ch of s) {
            if (ch === 'a') st = 1;
            else if (ch === 'b') st = (st === 1 ? 2 : 0);
            else { st = -1; break; }
            trace.push(st);
          }
          const pos = [{ x: w * 0.22, y: 125, l: 'q0 (初始)' }, { x: w * 0.50, y: 125, l: 'q1 (刚读a)' }, { x: w * 0.78, y: 125, l: 'q2 (接受ab)' }];
          ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(pos[0].x + 28, 125); ctx.lineTo(pos[1].x - 28, 125); ctx.moveTo(pos[1].x + 28, 125); ctx.lineTo(pos[2].x - 28, 125); ctx.stroke();
          pos.forEach((p, i) => {
            const act = (st === i);
            ctx.fillStyle = act ? (i === 2 ? 'rgba(16,185,129,0.28)' : 'rgba(59,130,246,0.25)') : 'rgba(148,163,184,0.12)';
            ctx.strokeStyle = act ? (i === 2 ? '#10b981' : '#3b82f6') : muted; ctx.lineWidth = act ? 3 : 1.6;
            ctx.beginPath(); ctx.arc(p.x, p.y, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            if (i === 2) { ctx.beginPath(); ctx.arc(p.x, p.y, 23, 0, Math.PI * 2); ctx.stroke(); }
            ctx.fillStyle = fg; ctx.font = '700 12px monospace'; ctx.textAlign = 'center'; ctx.fillText(p.l, p.x, p.y + 4);
          });
          ctx.textAlign = 'left'; ctx.fillStyle = st === 2 ? '#10b981' : '#f43f5e'; ctx.font = '700 13px monospace';
          ctx.fillText(`轨迹: ${trace.map(x => x < 0 ? 'ERR' : 'q' + x).join(' → ')} | 结果: ${st === 2 ? '✅ ACCEPT' : '❌ REJECT'}`, 20, 226);
          cap.textContent = '实时修改输入串，观察确定有限自动机 (DFA) 如何在 O(|s|) 单次扫描内无回溯判定词法模式。';
        };
        document.getElementById('ms-cp-str').addEventListener('input', draw);
        draw();
      } else {
        // dm: Kruskal MST interactive
        ctrl.innerHTML = `选取边数 k=<strong id="ms-dm-kv">5</strong> / 5<input type="range" id="ms-dm-k" min="0" max="5" value="5" style="width:140px;">`;
        const draw = () => {
          const k = +document.getElementById('ms-dm-k').value;
          document.getElementById('ms-dm-kv').textContent = k;
          const { ctx, w, h, fg, muted } = setupHiDPI(canvas);
          const pts = [[0.18, 0.5], [0.38, 0.25], [0.38, 0.78], [0.64, 0.25], [0.64, 0.78], [0.84, 0.52]];
          const allEdges = [[0, 1, 2], [1, 3, 3], [0, 2, 4], [2, 4, 5], [3, 5, 6], [1, 2, 7], [3, 4, 8], [4, 5, 9]];
          const mst = allEdges.slice(0, k);
          allEdges.forEach(([u, v, wt]) => {
            const inMst = mst.some(e => e[0] === u && e[1] === v);
            ctx.strokeStyle = inMst ? '#10b981' : 'rgba(148,163,184,0.32)'; ctx.lineWidth = inMst ? 3.2 : 1.3;
            ctx.beginPath(); ctx.moveTo(pts[u][0] * w, pts[u][1] * h); ctx.lineTo(pts[v][0] * w, pts[v][1] * h); ctx.stroke();
            ctx.fillStyle = inMst ? '#10b981' : muted; ctx.font = '700 11px monospace';
            ctx.fillText(String(wt), ((pts[u][0] + pts[v][0]) * 0.5) * w, ((pts[u][1] + pts[v][1]) * 0.5) * h - 4);
          });
          pts.forEach(([px, py], i) => {
            ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(px * w, py * h, 14, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = '700 12px monospace'; ctx.textAlign = 'center'; ctx.fillText('V' + (i + 1), px * w, py * h + 4);
          });
          ctx.textAlign = 'left';
          const sumW = mst.reduce((a, e) => a + e[2], 0);
          cap.textContent = `Kruskal 按边权从小到大贪心选边并查集判环：当前已选 ${k} 条边、总权值 = ${sumW}（${k === 5 ? '✅ 已形成连通最小生成树' : '拖动滑块步进观察连通分量合并'}）。`;
        };
        document.getElementById('ms-dm-k').addEventListener('input', draw);
        draw();
      }
    }

    sel.addEventListener('change', () => mountSandbox(sel.value));
    mountSandbox(sel.value);
  }

  // === TAB 2: Bidirectional SM-2 Spaced Repetition Queue (Click-to-Jump!) ===
  function renderFsrs(container) {
    const items = getQueue();
    const curStudy = getCurrentStudyItem();
    const now = Date.now();
    const dueList = items.filter(it => (it.due || 0) <= now);
    const current = dueList[0] || null;

    container.innerHTML = `
      ${curStudy ? `
      <div class="ms-card" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <div style="font-size:12.5px;">当前正在学习：<strong>${escHtml(curStudy.title)}</strong></div>
        <button class="ms-btn" id="ms-add-cur">+ 加入 SM-2 复习队列</button>
      </div>` : ''}
      <div class="ms-card">
        <div class="ms-row" style="justify-content:space-between;margin-bottom:8px;">
          <strong>🧠 SM-2 间隔复习队列（今日待复习 <span style="color:var(--accent,#2563eb);">${dueList.length}</span> / 总计 ${items.length}）</strong>
          <button class="ms-btn sec" id="ms-sync-queue">🔄 同步本学科错题/L4-L5</button>
        </div>
        ${current ? `
          <div style="padding:12px;border-radius:10px;background:var(--card,#fff);border:1px solid var(--border,rgba(148,163,184,0.28));margin-bottom:10px;">
            <div style="font-size:11.5px;color:var(--muted,#64748b);margin-bottom:4px;">点击下方标题直接跳转回原题/讲义进行复盘：</div>
            <button class="ms-q-link" id="ms-cur-jump">📄 ${escHtml(current.title)} ↗</button>
            <div style="font-size:11.5px;color:var(--muted,#64748b);margin-top:6px;">
              已复习 ${current.reps || 0} 次 · 难度因子 EF=${(current.ef || 2.5).toFixed(2)} · 上次间隔 ${current.interval || 0} 天
            </div>
          </div>
          <div class="ms-row">
            <button class="ms-btn warn" data-grade="1">忘了 (明天重来)</button>
            <button class="ms-btn mid" data-grade="3">模糊 (偏短间隔)</button>
            <button class="ms-btn ok" data-grade="4">顺畅 (标准递增)</button>
            <button class="ms-btn" data-grade="5">秒杀 (拉长间隔)</button>
          </div>
        ` : `<div style="color:#059669;font-weight:600;padding:8px 0;">✅ 今日到期卡片已全部复习完毕！可在上方将当前新题加入队列。</div>`}
      </div>
      <div class="ms-card">
        <div style="font-weight:700;font-size:12.5px;margin-bottom:8px;">队列全览（点击任意条直达原题）：</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:210px;overflow-y:auto;">
          ${items.map((it, idx) => {
            const daysLeft = Math.max(0, Math.ceil(((it.due || 0) - now) / 86400000));
            return `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;background:var(--card,#fff);border:1px solid var(--border,rgba(148,163,184,0.18));">
              <button class="ms-q-link" data-jidx="${idx}" style="font-size:12px;">${escHtml(it.title)}</button>
              <span style="font-size:11px;white-space:nowrap;color:${daysLeft === 0 ? '#ef4444' : 'var(--muted,#64748b)'};">${daysLeft === 0 ? '今日到期' : daysLeft + '天后'}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    const addCur = document.getElementById('ms-add-cur');
    if (addCur && curStudy) {
      const alreadyIn = items.some(x => x.id === curStudy.id);
      if (alreadyIn) { addCur.textContent = '✓ 已在队列中'; addCur.disabled = true; addCur.className = 'ms-btn sec'; }
      addCur.onclick = () => {
        if (!items.some(x => x.id === curStudy.id)) {
          items.unshift(Object.assign({ ef: 2.5, interval: 0, reps: 0, due: Date.now() }, curStudy));
          saveJSON(FSRS_KEY, items);
          updateBadge();
          renderFsrs(container);
        }
      };
    }
    const syncBtn = document.getElementById('ms-sync-queue');
    if (syncBtn) {
      syncBtn.onclick = () => {
        const fresh = seedDefaultQueue();
        fresh.forEach(f => { if (!items.some(x => x.id === f.id)) items.push(f); });
        saveJSON(FSRS_KEY, items);
        updateBadge();
        renderFsrs(container);
      };
    }
    const curJump = document.getElementById('ms-cur-jump');
    if (curJump && current) curJump.onclick = () => jumpToItem(current);
    container.querySelectorAll('[data-jidx]').forEach(btn => {
      btn.onclick = () => jumpToItem(items[+btn.dataset.jidx]);
    });
    container.querySelectorAll('[data-grade]').forEach(btn => {
      btn.onclick = () => {
        const q = +btn.dataset.grade;
        if (!current) return;
        if (q < 3) { current.reps = 0; current.interval = 1; }
        else {
          current.reps = (current.reps || 0) + 1;
          current.interval = current.reps === 1 ? 1 : (current.reps === 2 ? 6 : Math.round((current.interval || 6) * (current.ef || 2.5)));
          if (q === 5) current.interval = Math.round(current.interval * 1.3);
        }
        current.ef = Math.max(1.3, (current.ef || 2.5) + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
        current.due = Date.now() + current.interval * 86400000;
        saveJSON(FSRS_KEY, items);
        updateBadge();
        renderFsrs(container);
      };
    });
  }

  // === TAB 3: Context-Aware Feynman Oral Defense & Live AI Grader ===
  function renderDefense(container) {
    const bank = ORAL_BANK[SLUG] || ORAL_BANK.icpc;
    const curStudy = getCurrentStudyItem();
    const list = curStudy
      ? [{ q: `【当前页面口试】请合上参考解答，用 3 句话向零基础同学讲清「${curStudy.title}」的核心直觉、前置条件与最容易踩的 1 个反例坑点。`, ref: curStudy.snippet || '请对照原题核心思路与易错警示核验，或点击下方按钮让 AI 助教实时追问批改。', isDynamic: true }, ...bank]
      : bank;
    const saved = loadJSON(DEFENSE_KEY, { idx: 0, drafts: {} });
    const idx = Math.max(0, Math.min(list.length - 1, saved.idx || 0));
    const item = list[idx];
    const draft = (saved.drafts && saved.drafts[idx]) || '';

    container.innerHTML = `
      <div class="ms-card">
        <div class="ms-row" style="justify-content:space-between;margin-bottom:8px;">
          <strong>🎤 费曼白板口试（第 ${idx + 1} / ${list.length} 题${item.isDynamic ? ' · 实时联动当前题' : ' · 本学科深水题'}）</strong>
          <div class="ms-row">
            <button class="ms-btn sec" id="ms-def-prev">← 上一题</button>
            <button class="ms-btn sec" id="ms-def-next">下一题 →</button>
          </div>
        </div>
        <div style="font-weight:700;font-size:13.5px;margin-bottom:10px;line-height:1.55;">${escHtml(item.q)}</div>
        <textarea id="ms-def-txt" class="ms-textarea" rows="5" placeholder="先不看答案，用自己的大白话写出推导逻辑、边界条件与反例...">${escHtml(draft)}</textarea>
        <div class="ms-row ms-rubric" style="margin-top:9px;">
          <label><input type="checkbox"> 讲清核心直觉</label>
          <label><input type="checkbox"> 交代前置条件</label>
          <label><input type="checkbox"> 给出反例/边界</label>
          <label><input type="checkbox"> 说明复杂度/误差</label>
        </div>
        <div class="ms-row" style="margin-top:10px;">
          <button class="ms-btn" id="ms-def-ai">🤖 让 AI 助教实时批改并追问</button>
          <button class="ms-btn sec" id="ms-def-toggle">👁️ 展开参考要点</button>
        </div>
        <div id="ms-def-ref" style="display:none;margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--card,#fff);border-left:3px solid #10b981;font-size:12.5px;">
          <strong>参考要点：</strong>${escHtml(item.ref)}
        </div>
      </div>
    `;

    const txtEl = document.getElementById('ms-def-txt');
    txtEl.addEventListener('input', () => {
      saved.drafts = saved.drafts || {};
      saved.drafts[idx] = txtEl.value;
      saveJSON(DEFENSE_KEY, saved);
    });
    document.getElementById('ms-def-prev').onclick = () => { saved.idx = (idx - 1 + list.length) % list.length; saveJSON(DEFENSE_KEY, saved); renderDefense(container); };
    document.getElementById('ms-def-next').onclick = () => { saved.idx = (idx + 1) % list.length; saveJSON(DEFENSE_KEY, saved); renderDefense(container); };
    document.getElementById('ms-def-toggle').onclick = () => {
      const r = document.getElementById('ms-def-ref');
      const hidden = r.style.display === 'none';
      r.style.display = hidden ? 'block' : 'none';
      document.getElementById('ms-def-toggle').textContent = hidden ? '🙈 收起参考要点' : '👁️ 展开参考要点';
    };
    document.getElementById('ms-def-ai').onclick = () => {
      const ans = (txtEl.value || '').trim();
      const prompt = `【费曼口试批改】题目：${item.q}\n我的口述回答：${ans || '（我暂时还没思路，请用苏格拉底式反问一步步引导我）'}\n请从「直觉准确性、前置条件是否遗漏、边界反例」三个维度严厉打分（10分制）并提出 1 个最致命的追问。`;
      drawer.classList.remove('open');
      if (typeof window.toggleAiDrawer === 'function') window.toggleAiDrawer(true);
      if (typeof window.askAiQuick === 'function') {
        window.askAiQuick(prompt);
      } else {
        const c4Inp = document.getElementById('tutor-input');
        const c4Btn = document.getElementById('btn-tutor-send');
        if (typeof window.switchView === 'function') window.switchView('tutor');
        if (c4Inp) { c4Inp.value = prompt; if (c4Btn) c4Btn.click(); }
      }
    };
  }

  let currentTab = 'viz';
  function renderCurrentTab() {
    const body = document.getElementById('ms-body');
    if (!body) return;
    if (currentTab === 'viz') renderViz(body);
    else if (currentTab === 'fsrs') renderFsrs(body);
    else renderDefense(body);
  }

  function mount() {
    if (document.getElementById('wb-mastery-fab')) return;
    document.body.appendChild(fab);
    document.body.appendChild(drawer);
    updateBadge();
    fab.addEventListener('click', () => {
      drawer.classList.toggle('open');
      if (drawer.classList.contains('open')) renderCurrentTab();
    });
    document.getElementById('ms-close-btn').addEventListener('click', () => drawer.classList.remove('open'));
    drawer.querySelectorAll('.ms-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        drawer.querySelectorAll('.ms-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        renderCurrentTab();
      });
    });
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(() => {
        if (drawer.classList.contains('open') && currentTab === 'viz') renderCurrentTab();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
