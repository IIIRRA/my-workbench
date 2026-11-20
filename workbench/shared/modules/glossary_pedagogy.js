/* === Module: Offline Math Fallback, Glossary Popovers & Pedagogy === */
function formatTexOffline(tex) {
  let s = tex;
  const rep = [
    [/\\le/g, '≤'], [/\\ge/g, '≥'], [/\\ne/g, '≠'], [/\\approx/g, '≈'],
    [/\\times/g, '×'], [/\\cdot/g, '·'], [/\\sim/g, '~'], [/\\to/g, '→'],
    [/\\implies/g, '⇒'], [/\\in/g, '∈'], [/\\notin/g, '∉'], [/\\subseteq/g, '⊆'],
    [/\\cup/g, '∪'], [/\\cap/g, '∩'], [/\\sum/g, '∑'], [/\\prod/g, '∏'],
    [/\\infty/g, '∞'], [/\\dots|\\ldots/g, '…'], [/\\lfloor/g, '⌊'], [/\\rfloor/g, '⌋'],
    [/\\lceil/g, '⌈'], [/\\rceil/g, '⌉'], [/\\max/g, 'max'], [/\\min/g, 'min'],
    [/\\log/g, 'log'], [/\\gcd/g, 'gcd'], [/\\bmod/g, ' mod '],
    [/\\text\{([^}]*)\}/g, '$1'], [/\\mathrm\{([^}]*)\}/g, '$1'],
    [/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)'],
    [/\^\{([^}]*)\}/g, '<sup>$1</sup>'], [/_\{([^}]*)\}/g, '<sub>$1</sub>'],
    [/\^([A-Za-z0-9])/g, '<sup>$1</sup>'], [/_([A-Za-z0-9])/g, '<sub>$1</sub>'],
    [/\\/g, '']
  ];
  rep.forEach(([r, v]) => { s = s.replace(r, v); });
  return s;
}

function applyOfflineMathFallback(rootEl) {
  if (!rootEl || typeof NodeFilter === 'undefined') return;
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const p = n.parentElement;
      if (!p || p.closest('pre, code, .katex, .math-fallback, .math-fallback-block')) return NodeFilter.FILTER_REJECT;
      return n.nodeValue && n.nodeValue.includes('$') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  const nodes = [];
  let cur;
  while ((cur = walker.nextNode())) nodes.push(cur);
  nodes.forEach(node => {
    const txt = node.nodeValue;
    const parts = txt.split(/(\$\$[^$]+\$\$|\$[^$\n]+\$)/g);
    if (parts.length <= 1) return;
    const frag = document.createDocumentFragment();
    parts.forEach(part => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const sp = document.createElement('span');
        sp.className = 'math-fallback-block';
        sp.innerHTML = formatTexOffline(part.slice(2, -2));
        frag.appendChild(sp);
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const sp = document.createElement('span');
        sp.className = 'math-fallback';
        sp.innerHTML = formatTexOffline(part.slice(1, -1));
        frag.appendChild(sp);
      } else if (part) {
        frag.appendChild(document.createTextNode(part));
      }
    });
    node.parentNode.replaceChild(frag, node);
  });
}


// === Zero-Foundation Layered Algorithm Glossary & Auto-Highlighter ===
const ALG_GLOSSARY = {
  '树': {
    title: '树（Tree）',
    def: '一种没有环的连通图，像倒立的家族族谱：最上面是根节点，每个节点往下连着若干子节点，任意两点之间只有唯一一条路径。',
    docId: 'dict_06_树上问题'
  },
  '图': {
    title: '图（Graph）',
    def: '由「点（顶点）」和「连线（边）」组成的关系网络，用来表示城市与道路、人物关系或状态之间的转移。',
    docId: 'dict_05_图论'
  },
  '有向图': {
    title: '有向图（Directed Graph）',
    def: '每条边都有单向箭头的图（只能从 u 走到 v，不能反着走），常用来表示依赖关系或状态转移。',
    docId: 'dict_05_图论'
  },
  '二分图': {
    title: '二分图（Bipartite Graph）',
    def: '可以把所有点分成左右两组，使得每条边都只连接「左边一个点」和「右边一个点」，组内没有任何连线（等价于图里没有奇数长度的环）。',
    docId: 'dict_05_图论'
  },
  'DP': {
    title: 'DP（动态规划，Dynamic Programming）',
    def: '把大问题拆成重叠的小问题，先算出小问题的答案并存进数组里，再用「状态转移方程」一步步递推出大问题的答案，避免重复计算。',
    aliases: ['动态规划', 'DP', 'dp'],
    docId: 'dict_07_动态规划'
  },
  '状态压缩': {
    title: '状态压缩（Bitmask）',
    def: '用一个整数的二进制位（0 或 1）来同时表示一整组开关状态。比如 1011₂ 就代表第 0、1、3 号元素已选，第 2 号未选。',
    aliases: ['状态压缩', '状压'],
    docId: 'dict_02_数据结构_线性与集合'
  },
  '单调性': {
    title: '单调性（Monotonicity）',
    def: '序列或答案随着某个变量增大时「只增不减」或「只减不增」，这是使用二分查找、双指针、单调栈/队列加速的核心前提。',
    docId: 'dict_04_排序查找枚举与离线分治'
  },
  '栈': {
    title: '栈（Stack）',
    def: '「后进先出」的容器，就像一摞盘子：每次只能把新盘子放到最上面（入栈），也只能从最上面拿走（出栈）。',
    docId: 'dict_02_数据结构_线性与集合'
  },
  '队列': {
    title: '队列（Queue）',
    def: '「先进先出」的容器，就像排队买票：新人排在队尾（入队），先到的人从队头离开（出队）。',
    docId: 'dict_02_数据结构_线性与集合'
  },
  '堆': {
    title: '堆 / 优先队列（Heap / Priority Queue）',
    def: '能随时在 O(log n) 时间内取出当前「最大值」或「最小值」的树形容器，常用于贪心和 Dijkstra 最短路。',
    aliases: ['优先队列', '小根堆', '大根堆', '堆'],
    docId: 'dict_02_数据结构_线性与集合'
  },
  '前缀和': {
    title: '前缀和（Prefix Sum）',
    def: '预先算好数组前 i 项的累加和 sum[i]，之后想求任意区间 [L, R] 的和只需一步减法 sum[R] - sum[L-1]，查询从 O(n) 降到 O(1)。',
    docId: 'dict_02_数据结构_线性与集合'
  },
  '差分': {
    title: '差分（Difference Array）',
    def: '前缀和的逆运算：记录相邻两项的差值 d[i] = a[i] - a[i-1]。想给整段区间 [L, R] 同时加 k，只需改 d[L]+=k 和 d[R+1]-=k 两处即可。',
    docId: 'dict_02_数据结构_线性与集合'
  },
  '分治': {
    title: '分治（Divide and Conquer）',
    def: '「分而治之」：把一个大问题切成几个互不干扰的小块分别解决，最后再把小块的答案合并起来。',
    docId: 'dict_04_排序查找枚举与离线分治'
  },
  '分块': {
    title: '分块（Sqrt Decomposition）',
    def: '把长度为 n 的数组每 √n 个元素分成一块，整块直接打懒标记整体处理，散块暴力扫，优雅地把单次复杂度平衡到 O(√n)。',
    docId: 'dict_03_数据结构_区间与树形'
  },
  '倍增': {
    title: '倍增（Binary Lifting）',
    def: '每次跨步长 1, 2, 4, 8, ..., 2^k 跳跃，任何整数步数都能拆成二进制，从而把 O(n) 的一步步挪动加速到 O(log n)。',
    docId: 'dict_04_排序查找枚举与离线分治'
  },
  '可持久化': {
    title: '可持久化（Persistent）',
    def: '每次修改数据结构时，不覆盖旧版本，而是只新建发生变化的少数节点并共用未变部分，从而能随时查询任意历史版本。',
    docId: 'dict_03_数据结构_区间与树形'
  },
  '离线': {
    title: '离线算法（Offline Algorithm）',
    def: '先把所有询问全部读入内存，重新排序（如按右端点或时间排序）后再统一处理，最后按原编号输出答案。',
    aliases: ['离线算法', '离线查询', '离线'],
    docId: 'dict_04_排序查找枚举与离线分治'
  },
  '连通性': {
    title: '连通性（Connectivity）',
    def: '图上两个点之间存不存在一条可以走通的路径；若任意两点都能互相到达，则称整张图（或该子图）是连通的。',
    docId: 'dict_05_图论'
  },
  '最短路': {
    title: '最短路（Shortest Path）',
    def: '在带权图上，从起点走到终点经过所有边权总和最小的路径。常见算法有 BFS（无权图）、Dijkstra（非负权）和 Floyd（全源）。',
    docId: 'dict_05_图论'
  },
  '匹配': {
    title: '图匹配（Matching）',
    def: '在图中选出尽量多条「彼此没有公共端点」的边，就像给男女嘉宾一一配对，每个人最多只能牵手一位。',
    docId: 'dict_05_图论'
  },
  '凸包': {
    title: '凸包（Convex Hull）',
    def: '想象平面上钉着很多钉子，用一根橡皮筋绷紧包住所有钉子后形成的最小凸多边形；在 DP 优化中也指下凸/上凸壳。',
    docId: 'dict_10_计算几何'
  },
  '位运算': {
    title: '位运算（Bitwise Operation）',
    def: '直接在整数的二进制 0/1 位上做与(&)、或(|)、异或(^)、左移(<<)、右移(>>)操作，速度极快且常用于集合表示。',
    docId: 'dict_02_数据结构_线性与集合',
    anchor: '2.6 位压缩'
  },

  // === 复合术语（支持分层拆解：前置原子概念 + 当前完整释义）===
  '树状DP': {
    title: '树状 DP / 树形 DP',
    aliases: ['树状DP', '树状dp', '树形DP', '树形dp', '树上DP', '树上dp'],
    parts: ['树', 'DP', '树状DP'],
    def: '在「树」结构上做的动态规划：通常通过 DFS 从叶子节点一层层往上回溯，用所有子树的状态合并计算当前父节点的状态。',
    docId: 'dict_06_树上问题',
    anchor: '6.5 树上 DP'
  },
  '状压DP': {
    title: '状压 DP（状态压缩动态规划）',
    aliases: ['状压DP', '状压dp', '状态压缩DP', '状态压缩动态规划'],
    parts: ['状态压缩', 'DP', '状压DP'],
    def: '把「选了哪些点/物品」的集合状态压缩成一个二进制整数 mask 作为 DP 下标，适用于数据规模较小（通常 n ≤ 20）的组合决策问题。',
    docId: 'dict_07_动态规划',
    anchor: '7.4 树形、图上与状压'
  },
  '区间DP': {
    title: '区间 DP',
    aliases: ['区间DP', '区间dp'],
    parts: ['DP', '区间DP'],
    def: '以一段连续区间 [L, R] 作为 DP 状态，按区间长度从小到大枚举，并通过枚举中间分割点 k 把 [L, k] 和 [k+1, R] 合并。',
    docId: 'dict_07_动态规划',
    anchor: '7.3 线性与区间'
  },
  '数位DP': {
    title: '数位 DP',
    aliases: ['数位DP', '数位dp'],
    parts: ['DP', '数位DP'],
    def: '统计区间 [L, R] 内满足某种数字特征的整数个数：把数字按十进制（或二进制）一位一位从高到低填，配合「是否贴着上界 limit」记忆化搜索。',
    docId: 'dict_07_动态规划',
    anchor: '7.5 数位、概率与期望'
  },
  '背包DP': {
    title: '背包 DP（0-1 背包 / 完全背包）',
    aliases: ['0-1背包', '01背包', '完全背包', '多重背包', '分组背包', '背包DP'],
    parts: ['DP', '背包DP'],
    def: '在有限容量下挑选物品使价值最大（或方案数最多）：0-1 背包每件限选一次需倒序枚举容量，完全背包可无限选需正序枚举容量。',
    docId: 'dict_07_动态规划',
    anchor: '7.2 背包族'
  },
  '换根DP': {
    title: '换根 DP（二次扫描法）',
    aliases: ['换根DP', '换根dp'],
    parts: ['树', 'DP', '换根DP'],
    def: '要求出「以每个点分别作为树根」时的答案：先以 1 号点为根跑一次树状 DP，再从上往下用父节点信息 O(1) 推算子节点作为新根的结果。',
    docId: 'dict_06_树上问题',
    anchor: '6.5 树上 DP'
  },
  '斜率优化': {
    title: '斜率优化 DP',
    aliases: ['斜率优化', '凸壳优化'],
    parts: ['DP', '凸包', '斜率优化'],
    def: '当 DP 转移方程里出现「与 i 和 j 有关的乘积项」时，把转移写成直线截距形式，用单调队列或凸包维护最优决策点，将 O(n²) 降至 O(n) 或 O(n log n)。',
    docId: 'dict_07_动态规划'
  },
  '单调栈': {
    title: '单调栈（Monotonic Stack）',
    aliases: ['单调栈'],
    parts: ['栈', '单调性', '单调栈'],
    def: '栈内元素始终保持单调递增或单调递减：新元素入栈前先把破坏单调性的栈顶弹出，能在 O(n) 总时间内找出每个数左边/右边第一个更大或更小的数。',
    docId: 'dict_02_数据结构_线性与集合'
  },
  '单调队列': {
    title: '单调队列（Monotonic Queue）',
    aliases: ['单调队列'],
    parts: ['队列', '单调性', '单调队列'],
    def: '双端队列内元素保持单调有序：队头淘汰过期元素，队尾淘汰不如新元素优的旧元素，常用于 O(n) 解决滑动窗口最值与优化 DP。',
    docId: 'dict_02_数据结构_线性与集合'
  },
  '树状数组': {
    title: '树状数组（Fenwick Tree / BIT）',
    aliases: ['树状数组', 'BIT'],
    parts: ['前缀和', '位运算', '树状数组'],
    def: '利用 lowbit(x) = x & -x 把前缀和拆成不超过 log n 段管辖区间，代码仅十余行即可在 O(log n) 内完成单点修改与前缀和查询。',
    docId: 'dict_03_数据结构_区间与树形'
  },
  '线段树': {
    title: '线段树（Segment Tree）',
    aliases: ['线段树'],
    parts: ['树', '分治', '线段树'],
    def: '把区间 [1, n] 不断二分拆成一棵二叉树，配合懒标记（Lazy Tag），能在 O(log n) 时间内支持区间修改和区间查询（求和、最值等）。',
    docId: 'dict_03_数据结构_区间与树形'
  },
  '动态开点线段树': {
    title: '动态开点线段树',
    aliases: ['动态开点线段树', '动态开点'],
    parts: ['线段树', '动态开点线段树'],
    def: '当值域很大（如 10^9）时，不预先建满 4n 个节点，而是在真正访问/修改到某个区间时才临时分配节点编号。',
    docId: 'dict_03_数据结构_区间与树形'
  },
  '可持久化线段树': {
    title: '可持久化线段树（主席树）',
    aliases: ['可持久化线段树', '主席树'],
    parts: ['线段树', '可持久化', '可持久化线段树'],
    def: '每次单点修改只沿根到叶子新建 log n 个节点并复用其余子树，从而能以 O(log n) 解决静态/动态区间第 k 小等历史版本查询。',
    docId: 'dict_03_数据结构_区间与树形'
  },
  '并查集': {
    title: '并查集（Disjoint Set Union, DSU）',
    aliases: ['并查集', 'DSU'],
    parts: ['树', '连通性', '并查集'],
    def: '高效维护「元素属于哪个集合」的数据结构：支持把两个集合合并（Union）以及查询两点是否连通（Find），配合路径压缩单次接近 O(1)。',
    docId: 'dict_02_数据结构_线性与集合'
  },
  'ST表': {
    title: 'ST 表（Sparse Table）',
    aliases: ['ST表', 'ST 表', 'Sparse Table'],
    parts: ['倍增', 'ST表'],
    def: '利用倍增思想预处理出每个位置往后长度为 2^k 的区间最值，支持 O(n log n) 预处理、O(1) 回答静态区间最值（RMQ）查询。',
    docId: 'dict_03_数据结构_区间与树形',
    anchor: '3.3 静态区间查询与分块'
  },
  '启发式合并': {
    title: '启发式合并（Small-to-Large）',
    aliases: ['启发式合并', '树上启发式合并', 'DSU on Tree'],
    parts: ['分治', '并查集', '启发式合并'],
    def: '合并两个集合（或两棵子树的信息）时，永远把「元素更小的集合」暴力插进「更大的集合」里，每个元素最多被移动 log n 次，总复杂度 O(n log n)。',
    docId: 'dict_06_树上问题'
  },
  '点分治': {
    title: '点分治（Centroid Decomposition）',
    aliases: ['点分治'],
    parts: ['树', '分治', '点分治'],
    def: '每次找树的重心作为分治中心，先统计「经过重心」的路径答案，再删掉重心递归处理各棵子树，树高被压到 O(log n)，专治树上路径统计。',
    docId: 'dict_06_树上问题'
  },
  '树链剖分': {
    title: '树链剖分（重链剖分，HLD）',
    aliases: ['树链剖分', '重链剖分'],
    parts: ['树', '线段树', '树链剖分'],
    def: '把每个节点连向最大子树的边称为重边，连成重链并排成连续的 DFS 序，从而把树上任意两点路径拆成不超过 O(log n) 段区间交给线段树维护。',
    docId: 'dict_06_树上问题'
  },
  '最近公共祖先': {
    title: '最近公共祖先（LCA）',
    aliases: ['最近公共祖先', 'LCA'],
    parts: ['树', '倍增', '最近公共祖先'],
    def: '树上两个节点 u 和 v 的共同祖先中「离它们最近（深度最大）」的那个节点，常用倍增或树链剖分在 O(log n) 内求得。',
    docId: 'dict_06_树上问题'
  },
  'CDQ分治': {
    title: 'CDQ 分治',
    aliases: ['CDQ分治', 'CDQ 分治'],
    parts: ['分治', '离线', 'CDQ分治'],
    def: '处理多维偏序或动态修改查询的离线算法：先递归解决左半边与右半边，再专门计算「左半边的修改」对「右半边的询问」产生的贡献。',
    docId: 'dict_04_排序查找枚举与离线分治',
    anchor: '4.4 离线与分治'
  },
  '整体二分': {
    title: '整体二分',
    aliases: ['整体二分'],
    parts: ['分治', '离线', '二分答案', '整体二分'],
    def: '把所有询问放在一起做二分答案：利用数据结构判定哪些询问的答案在左半值域、哪些在右半值域，分别划入左右递归处理。',
    docId: 'dict_04_排序查找枚举与离线分治'
  },
  '莫队算法': {
    title: '莫队算法（Mo\'s Algorithm）',
    aliases: ['莫队算法', '普通莫队', '带修莫队', '回滚莫队', '莫队'],
    parts: ['分块', '离线', '莫队算法'],
    def: '把所有区间询问离线，按「左端点所在块编号为第一关键字、右端点为第二关键字」排序后移动左右指针，总指针移动次数控制在 O(n√n)。',
    docId: 'dict_04_排序查找枚举与离线分治'
  },
  '二分查找': {
    title: '二分查找（Binary Search）',
    aliases: ['二分查找'],
    parts: ['单调性', '二分查找'],
    def: '在有序序列中每次取中间元素比较并直接砍掉一半搜索区间，只需 O(log n) 次比较即可定位目标。',
    docId: 'dict_04_排序查找枚举与离线分治'
  },
  '二分答案': {
    title: '二分答案（Binary Search on Answer）',
    aliases: ['二分答案'],
    parts: ['单调性', '二分查找', '二分答案'],
    def: '当「直接求最优值很难，但给定一个值 x 判断它是否可行很容易」且答案具有单调性时，直接在值域上二分这个答案 x。',
    docId: 'dict_04_排序查找枚举与离线分治'
  },
  'DFS': {
    title: 'DFS（深度优先搜索）',
    aliases: ['深度优先搜索', 'DFS', 'dfs'],
    def: '「一条路走到黑，走不通再回头（回溯）」的搜索策略，天然适合枚举排列组合、走迷宫以及遍历树和图的连通块。',
    docId: 'dict_11_搜索与随机化近似'
  },
  'BFS': {
    title: 'BFS（广度优先搜索）',
    aliases: ['广度优先搜索', 'BFS', 'bfs'],
    parts: ['队列', 'BFS'],
    def: '像水波纹一样「一圈一圈由近及远」向外扩散搜索，借助队列实现，第一次到达终点时走的步数一定是最少的。',
    docId: 'dict_11_搜索与随机化近似'
  },
  '记忆化搜索': {
    title: '记忆化搜索（Memoization）',
    aliases: ['记忆化搜索'],
    parts: ['DFS', 'DP', '记忆化搜索'],
    def: '用 DFS 写递归搜索的同时，把算过的状态结果存进数组里；下次再遇到相同状态直接查表返回，本质上等价于自顶向下的 DP。',
    docId: 'dict_07_动态规划'
  },
  '拓扑排序': {
    title: '拓扑排序（Topological Sort）',
    aliases: ['拓扑排序', '拓扑序'],
    parts: ['有向图', '队列', '拓扑排序'],
    def: '在有向无环图（DAG）中给所有点排一个先后顺序，使得每条有向边 u → v 都满足 u 排在 v 前面（常见于课程先修顺序与 DAG 上 DP）。',
    docId: 'dict_05_图论'
  },
  '强连通分量': {
    title: '强连通分量（SCC / Tarjan）',
    aliases: ['强连通分量', 'SCC', 'Tarjan'],
    parts: ['有向图', '连通性', '强连通分量'],
    def: '在有向图中，如果一群点两两之间都能互相到达，这群点就构成一个强连通分量；用 Tarjan 算法缩点后可把有向图变成无环的 DAG。',
    docId: 'dict_05_图论'
  },
  '最小生成树': {
    title: '最小生成树（MST）',
    aliases: ['最小生成树', 'Kruskal', 'Prim', 'MST'],
    parts: ['图', '树', '最小生成树'],
    def: '从带权连通图中选出 n-1 条边把所有 n 个点连成一棵树，且总边权之和最小（常用 Kruskal 按边权从小到大配合并查集连边）。',
    docId: 'dict_05_图论'
  },
  'Dijkstra': {
    title: 'Dijkstra 最短路算法',
    aliases: ['Dijkstra', 'dijkstra'],
    parts: ['图', '堆', '最短路', 'Dijkstra'],
    def: '用优先队列每次取出当前距离起点最近且未确定的点去松弛邻居，在所有边权非负的图上能以 O((n+m) log n) 求出单源最短路。',
    docId: 'dict_05_图论'
  },
  '差分约束': {
    title: '差分约束系统',
    aliases: ['差分约束'],
    parts: ['有向图', '最短路', '差分约束'],
    def: '把形如 x_v - x_u ≤ w 的不等式组看成图上的最短路三角形不等式 dist[v] ≤ dist[u] + w，建有向边 (u→v, w) 跑最短路即可求出一组可行解。',
    docId: 'dict_05_图论'
  },
  '2-SAT': {
    title: '2-SAT 问题',
    aliases: ['2-SAT', '2SAT'],
    parts: ['有向图', '强连通分量', '2-SAT'],
    def: '每个布尔变量只能选真或假，给定若干「两者至少满足其一」的二元约束；把每个变量拆成真/假两点连推导边，用 Tarjan 强连通分量判无解并构造解。',
    docId: 'dict_05_图论'
  },
  '二分图匹配': {
    title: '二分图最大匹配（匈牙利算法）',
    aliases: ['二分图匹配', '二分图最大匹配', '匈牙利算法'],
    parts: ['二分图', '匹配', '二分图匹配'],
    def: '在二分图里找出最多的配对边：匈牙利算法每次尝试给左边点找右边对象，若右边已被占就尝试让原配「让步换人」（找增广路）。',
    docId: 'dict_05_图论'
  },
  '网络流': {
    title: '网络流 / 最大流（Dinic）',
    aliases: ['网络流', '最大流', '最小割', '费用流', 'Dinic'],
    parts: ['有向图', '网络流'],
    def: '把图看成自来水管网，每条边有最大流量限制；最大流求从源点到汇点最多能流多少水，最大流数值等于最小割容量。',
    docId: 'dict_05_图论'
  },
  'KMP': {
    title: 'KMP 字符串匹配',
    aliases: ['KMP', 'kmp', '前缀函数'],
    def: '失配时主串指针不回退，而是利用模式串自身的 next（前缀函数）数组直接跳到最长公共前后缀位置继续匹配，实现 O(n+m) 线性匹配。',
    docId: 'dict_08_字符串'
  },
  '字典树': {
    title: '字典树（Trie）',
    aliases: ['字典树', 'Trie', '01-Trie', '01Trie'],
    parts: ['树', '字典树'],
    def: '把许多字符串的公共前缀合并成一棵树，从根往下每条边代表一个字符（或二进制 0/1 位），常用于前缀统计或最大异或对查询。',
    docId: 'dict_08_字符串'
  },
  'AC自动机': {
    title: 'AC 自动机',
    aliases: ['AC自动机', 'AC 自动机'],
    parts: ['字典树', 'KMP', 'AC自动机'],
    def: '把多模式串建在字典树上，再像 KMP 一样为每个节点构造失配指针 fail，实现同时在主串中线性扫描匹配多个模式串。',
    docId: 'dict_08_字符串',
    anchor: '8.2 自动机与树'
  },
  '后缀数组': {
    title: '后缀数组（SA）',
    aliases: ['后缀数组'],
    parts: ['倍增', '后缀数组'],
    def: '把字符串的所有后缀按字典序从小到大排序，配合 height 数组（相邻后缀的最长公共前缀），能解决大量子串计数与重复子串问题。',
    docId: 'dict_08_字符串'
  },
  '后缀自动机': {
    title: '后缀自动机（SAM）',
    aliases: ['后缀自动机', 'SAM'],
    parts: ['有向图', '后缀自动机'],
    def: '用一个结构极紧凑的有向无环图精确压缩字符串的所有子串，点数和边数都仅 O(n)，从源点出发的每条路径都对应一个子串。',
    docId: 'dict_08_字符串'
  },
  '线性基': {
    title: '线性基（XOR Basis）',
    aliases: ['线性基'],
    parts: ['位运算', '线性基'],
    def: '类似向量的基：从一堆数里提炼出最多 log V 个代表数，原数组任意子集的异或和都能由它们异或凑出，从而 O(log V) 求最大异或和。',
    docId: 'dict_09_数学'
  },
  '快速幂': {
    title: '快速幂（Binary Exponentiation）',
    aliases: ['快速幂'],
    parts: ['位运算', '快速幂'],
    def: '把指数拆成二进制，利用 a^(2k) = (a^k)² 不断平方倍增，只需 O(log b) 次乘法即可算出 a^b mod m。',
    docId: 'dict_09_数学'
  },
  '数论分块': {
    title: '数论分块（整除分块）',
    aliases: ['数论分块', '整除分块'],
    def: '求和 ∑ ⌊n / i⌋ 时，很多连续的 i 算出的商 ⌊n / i⌋ 是完全一样的；每次直接跳到相同商的右端点 ⌊n / ⌊n / l⌋⌋，复杂度从 O(n) 降为 O(√n)。',
    docId: 'dict_09_数学'
  },
  '莫比乌斯反演': {
    title: '莫比乌斯反演',
    aliases: ['莫比乌斯反演', '莫比乌斯函数'],
    parts: ['数论分块', '容斥原理', '莫比乌斯反演'],
    def: '利用莫比乌斯函数 μ(n) 的性质 ∑_{d|n} μ(d) = [n=1]，把「求 gcd(i, j) = 1 的个数」巧妙转化为「枚举公约数 d 的倍数计数」。',
    docId: 'dict_09_数学'
  },
  '容斥原理': {
    title: '容斥原理（Inclusion-Exclusion）',
    aliases: ['容斥原理', '二项式反演'],
    def: '求多个集合并集大小时「奇加偶减」：先全部加起来，减去两两重复算的部分，再加上三个共同重复算的部分，以此类推不重不漏。',
    docId: 'dict_09_数学'
  },
  'FFT': {
    title: 'FFT / NTT（快速傅里叶 / 数论变换）',
    aliases: ['FFT', 'NTT', '快速傅里叶变换'],
    parts: ['分治', 'FFT'],
    def: '通过点值表示法把两个多项式相乘（卷积）从 O(n²) 加速到 O(n log n)；NTT 是模意义下的整数版 FFT，无精度误差。',
    docId: 'dict_09_数学'
  },
  '博弈论': {
    title: '组合博弈论 / SG 函数',
    aliases: ['博弈论', 'SG函数', 'SG 函数', 'Nim游戏'],
    parts: ['位运算', '博弈论'],
    def: '研究双方轮流操作、无随机因素的胜负判定：必败态只能走到必胜态，多堆独立游戏的总局势等于各堆 SG 值的异或和。',
    docId: 'dict_09_数学',
    anchor: '9.5 博弈与其他'
  },
  '逆元': {
    title: '乘法逆元',
    aliases: ['乘法逆元', '逆元'],
    parts: ['快速幂', '逆元'],
    def: '模意义下没有直接的除法，除以 a 等价于乘以它的逆元 a⁻¹（满足 a·a⁻¹ ≡ 1 (mod p)）；当 p 为质数时可用费马小定理快速幂求 a^(p-2)。',
    docId: 'dict_09_数学'
  },
  '扫描线': {
    title: '扫描线（Sweep Line）',
    aliases: ['扫描线'],
    parts: ['线段树', '离散化', '扫描线'],
    def: '想象一条垂直线从左往右扫过平面：每遇到矩形左边就给区间覆盖计数 +1，遇到右边就 -1，配合线段树即可快速求矩形面积并。',
    docId: 'dict_10_计算几何'
  },
  '离散化': {
    title: '离散化（Coordinate Compression）',
    aliases: ['离散化'],
    def: '当数值范围很大（如 10^9）但实际出现的数很少（如 10^5 个）时，把它们排序去重并映射成 1, 2, ..., k 的连续小下标，只保留大小相对关系。',
    docId: 'dict_04_排序查找枚举与离线分治'
  },
  '贪心': {
    title: '贪心算法（Greedy）',
    aliases: ['贪心算法', '贪心'],
    def: '每一步都做「当前看起来最优」的局部选择，不回头反悔；适用于具有「贪心选择性质」的问题（需注意用交换论证或反例验证正确性）。',
    docId: 'dict_04_排序查找枚举与离线分治'
  },
  '哈希': {
    title: '哈希（Hash / 字符串哈希）',
    aliases: ['字符串哈希', '双哈希', '哈希表', '哈希'],
    def: '把复杂对象或长字符串映射成一个大整数指纹，从而用 O(1) 的整数比较代替 O(n) 的逐字符比较（双模哈希可大幅降低冲突概率）。',
    docId: 'dict_08_字符串'
  }
};

// Build alias lookup & sorted regex
const TERM_ALIAS_MAP = new Map();
Object.keys(ALG_GLOSSARY).forEach(key => {
  const item = ALG_GLOSSARY[key];
  const list = item.aliases || [key];
  list.forEach(a => {
    if (!TERM_ALIAS_MAP.has(a)) TERM_ALIAS_MAP.set(a, key);
  });
});


// === Subject-Aware Dynamic Glossary & Exact-Anchor Dictionary Indexer (All 13 Workbenches) ===
let ACTIVE_GLOSSARY = null;
let ACTIVE_ALIAS_MAP = null;
let __dictHydrateRequested = false;

function _cleanTermDef(rawBody) {
  const mathSlots = [];
  let s = String(rawBody || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g, (m) => {
      mathSlots.push(m);
      return `@@M${mathSlots.length - 1}@@`;
    })
    .replace(/^\s*>+\s?/gm, '')
    .replace(/[#*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Prefer clean definition before "例子 / 直觉" if already informative
  const exIdx = s.indexOf('例子 / 直觉');
  if (exIdx > 36) s = s.slice(0, exIdx).trim();
  if (s.length > 220) {
    s = s.slice(0, 215).replace(/@@M\d*$/, '').trim() + '…';
  }
  s = s.replace(/@@M(\d+)@@/g, (_, idx) => mathSlots[Number(idx)] || '');
  // Safety guard: never leave an odd/unclosed $ sign
  const dollars = (s.match(/\$/g) || []).length;
  if (dollars % 2 === 1) s = s.slice(0, s.lastIndexOf('$')).trim() + '…';
  return s || '点击下方按钮跳转到本学科词典查看完整释义与示例。';
}

function _extractTermKeysFromHeading(rawTitle) {
  // Strip leading numbering like "1.2 " or "① " or "12、"
  let t = String(rawTitle || '').replace(/^\s*(?:\d+(?:\.\d+)*[\.\、\)\s]+|[①-⑳]\s*)/, '').trim();
  const keys = [];
  // Main part before （ or (
  const main = t.split(/[（(]/)[0].trim();
  main.split(/[\/／、·|]/).forEach(part => {
    const k = part.trim();
    if (k.length >= 2 && k.length <= 18 && /[A-Za-z\u4e00-\u9fff]/.test(k)) keys.push(k);
  });
  // Also extract meaningful English acronyms/terms inside parentheses if >= 3 chars
  const paren = t.match(/[（(]([^）)]+)[）)]/);
  if (paren) {
    paren[1].split(/[\/／,，]/).forEach(part => {
      const k = part.trim();
      if (k.length >= 3 && k.length <= 22 && /[A-Za-z\u4e00-\u9fff]/.test(k)) keys.push(k);
    });
  }
  return Array.from(new Set(keys));
}

function _buildActiveGlossary() {
  const slug = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc';
  const isIcpc = (slug === 'icpc');

  // If dictionary docs are not hydrated yet, trigger hydration once and refresh active view
  if (typeof DOCS !== 'undefined' && Array.isArray(DOCS) && !__dictHydrateRequested) {
    const unloadedDict = DOCS.some(d => (d.id.startsWith('dict_') || d.id.includes('glossary') || (d.title && d.title.includes('词典'))) && d._loaded === false);
    if (unloadedDict && typeof window.__wbHydrateAllDocs === 'function') {
      __dictHydrateRequested = true;
      window.__wbHydrateAllDocs(() => {
        if (typeof DICT_INDEX !== 'undefined') DICT_INDEX = null;
        ACTIVE_GLOSSARY = null;
        ACTIVE_ALIAS_MAP = null;
        ALG_TERM_REGEX = null;
        if (typeof activeView !== 'undefined' && activeView === 'reader' && typeof activeId === 'string' && activeId && typeof window.openDoc === 'function') {
          window.openDoc(activeId, '');
        }
      });
    }
  }

  const dictItems = (typeof getDictIndex === 'function') ? (getDictIndex() || []) : [];
  const g = {};
  const aliasMap = new Map();

  // On ICPC: seed with rich hand-crafted layered ALG_GLOSSARY and bind exact dictionary heading anchors
  if (isIcpc) {
    Object.keys(ALG_GLOSSARY).forEach(k => {
      const orig = ALG_GLOSSARY[k];
      const entry = Object.assign({}, orig);
      // Find best matching heading in dictItems for exact scroll-to-entry anchor
      const aliases = (entry.aliases || [k]).map(a => a.toLowerCase());
      const hit = dictItems.find(di => di.docId === entry.docId && aliases.some(a => di.title.toLowerCase().includes(a)))
        || dictItems.find(di => aliases.some(a => di.title.toLowerCase().includes(a)));
      if (hit) {
        entry.docId = hit.docId;
        entry.anchor = hit.title;
      } else {
        entry.anchor = k;
      }
      g[k] = entry;
      (entry.aliases || [k]).forEach(a => aliasMap.set(a, k));
      aliasMap.set(k, k);
    });
  }

  // Merge current subject's own dictionary entries (for ALL 13 workbenches, including 12 STEM subjects!)
  dictItems.forEach(di => {
    const keys = _extractTermKeysFromHeading(di.title);
    if (!keys.length) return;
    const primary = keys[0];
    if (!g[primary]) {
      g[primary] = {
        title: di.title,
        def: _cleanTermDef(di.body),
        docId: di.docId,
        anchor: di.title,
        aliases: keys
      };
    } else if (!g[primary].anchor) {
      g[primary].anchor = di.title;
    }
    keys.forEach(k => {
      if (!aliasMap.has(k)) aliasMap.set(k, primary);
    });
  });

  ACTIVE_GLOSSARY = g;
  ACTIVE_ALIAS_MAP = aliasMap;
  return g;
}

function getActiveGlossary() {
  if (!ACTIVE_GLOSSARY || Object.keys(ACTIVE_GLOSSARY).length === 0) {
    _buildActiveGlossary();
  }
  return ACTIVE_GLOSSARY || {};
}

let ALG_TERM_REGEX = null;
function ensureTermRegex() {
  getActiveGlossary();
  if (ALG_TERM_REGEX) return ALG_TERM_REGEX;
  const map = ACTIVE_ALIAS_MAP || new Map();
  const _csOk2 = new Set(['dp','os','ai','ml','ll','lr','ip','io']);
  const _slugNow = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc';
  const _isMathSubj = ['c4','la','prob','dm','phys'].includes(_slugNow);
  const aliases = Array.from(map.keys()).filter(a => {
    if (!a || a.length < 2) return false;
    if (/^[a-zA-Z0-9_+-]+$/.test(a)) {
      if (a.length <= 2) return !_isMathSubj && _csOk2.has(a.toLowerCase());
      if (a.length === 3 && _isMathSubj) return false;
    }
    return true;
  }).sort((a, b) => b.length - a.length);
  if (!aliases.length) return null;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Avoid matching ASCII words inside longer English identifiers
  const parts = aliases.map(a => /^[A-Za-z0-9_-]+$/.test(a) ? `(?<![A-Za-z0-9_])${esc(a)}(?![A-Za-z0-9_])` : esc(a));
  ALG_TERM_REGEX = new RegExp(`(${parts.join('|')})`, 'g');
  return ALG_TERM_REGEX;
}

function highlightAlgTerms(rootEl) {
  if (!rootEl || !document.createTreeWalker) return;
  const rx = ensureTermRegex();
  if (!rx) return;
  const skipTags = new Set(['H1', 'H2', 'H3', 'CODE', 'PRE', 'A', 'SCRIPT', 'STYLE', 'TEXTAREA', 'BUTTON', 'INPUT', 'SELECT']);
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      let p = node.parentNode;
      while (p && p !== rootEl) {
        if (skipTags.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        if (p.classList && ((p.classList.contains('katex') || p.classList.contains('katex-html') || p.classList.contains('katex-mathml') || p.classList.contains('mord')) || p.classList.contains('math-var') || p.classList.contains('math-num') || p.classList.contains('alg-term') || p.classList.contains('code-head'))) {
          return NodeFilter.FILTER_REJECT;
        }
        p = p.parentNode;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  let cur;
  while ((cur = walker.nextNode())) nodes.push(cur);
  nodes.forEach(node => {
    const txt = node.nodeValue;
    rx.lastIndex = 0;
    if (!rx.test(txt)) return;
    rx.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0;
    let m;
    while ((m = rx.exec(txt)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
      const matched = m[0];
      const key = (ACTIVE_ALIAS_MAP && ACTIVE_ALIAS_MAP.get(matched)) || matched;
      const span = document.createElement('span');
      span.className = 'alg-term';
      span.dataset.term = key;
      span.textContent = matched;
      frag.appendChild(span);
      last = m.index + matched.length;
    }
    if (last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
    if (node.parentNode) node.parentNode.replaceChild(frag, node);
  });
}

let termPopTimer = null;
let activeTermEl = null;
function showTermPopover(el) {
  const pop = document.getElementById('termPopover');
  if (!pop || !el) return;
  const gloss = getActiveGlossary();
  const key = el.dataset ? el.dataset.term : '';
  const entry = gloss[key];
  if (!entry) return;
  if (activeTermEl) activeTermEl.classList.remove('active');
  activeTermEl = el;
  el.classList.add('active');

  const chainKeys = (entry.parts && entry.parts.length) ? entry.parts : [key];
  const layersHtml = chainKeys.map((k, idx) => {
    const item = gloss[k];
    if (!item) return '';
    const isLast = idx === chainKeys.length - 1;
    const tag = chainKeys.length > 1
      ? (isLast ? `核心概念 · ${escapeHtml(item.title)}` : `前置基础 ${idx + 1} · ${escapeHtml(item.title)}`)
      : `零基础释义 · ${escapeHtml(item.title)}`;
    return `<div class="term-pop-layer ${isLast ? 'main-layer' : ''}">
      <div class="term-pop-layer-tag">${tag}</div>
      <div class="term-pop-layer-desc">${escapeHtml(item.def)}</div>
    </div>`;
  }).join('');

  const _jsEsc = s => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const _anchor = entry.anchor || key;
  const _isIcpcPop = ((window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc') === 'icpc';
  const jumpBtn = entry.docId
    ? `<button class="btn" style="height:26px;padding:0 10px;font-size:11.5px;" onclick="hideTermPopover();openDoc('${_jsEsc(entry.docId)}', '${_jsEsc(_anchor)}')">${_isIcpcPop ? '去词典定位该词条 →' : '去本学科词典精读 →'}</button>`
    : '';

  pop.innerHTML = `
    <div class="term-pop-head">
      <span class="term-pop-title">${escapeHtml(entry.title)}</span>
      <button class="btn" style="height:24px;padding:0 8px;font-size:11px;" onclick="hideTermPopover()">关闭</button>
    </div>
    ${layersHtml}
    ${jumpBtn ? `<div class="term-pop-foot">${jumpBtn}</div>` : ''}
  `;
  pop.classList.add('open');
  if (window.renderMathInElement && window.katex) {
    try { renderMathInElement(pop, { delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}], throwOnError: false }); } catch (_) {}
  }
  pop.setAttribute('aria-hidden', 'false');

  // Position near element without clipping viewport
  if (el.getBoundingClientRect) {
    const r = el.getBoundingClientRect();
    const popW = Math.min(400, window.innerWidth - 24);
    let left = Math.max(12, Math.min(r.left, window.innerWidth - popW - 12));
    let top = r.bottom + 8;
    const estH = Math.min(360, pop.offsetHeight || 260);
    if (top + estH > window.innerHeight - 12 && r.top - estH - 8 > 12) {
      top = r.top - estH - 8;
    }
    pop.style.left = left + 'px';
    pop.style.top = Math.max(12, top) + 'px';
  }
}
window.hideTermPopover = function() {
  const pop = document.getElementById('termPopover');
  if (pop) { pop.classList.remove('open'); pop.setAttribute('aria-hidden', 'true'); }
  if (activeTermEl) { activeTermEl.classList.remove('active'); activeTermEl = null; }
};
function bindTermPopoverEvents() {
  const mainEl = document.getElementById('main');
  const pop = document.getElementById('termPopover');
  if (!mainEl || mainEl.__termBound) return;
  mainEl.__termBound = true;
  mainEl.addEventListener('mouseover', e => {
    const t = e.target && e.target.closest ? e.target.closest('.alg-term') : null;
    if (t) {
      if (termPopTimer) { clearTimeout(termPopTimer); termPopTimer = null; }
      showTermPopover(t);
      return;
    }
    const idm = e.target && e.target.closest ? e.target.closest('.cpp-idiom') : null;
    if (idm) {
      if (termPopTimer) { clearTimeout(termPopTimer); termPopTimer = null; }
      showIdiomPopover(idm);
    }
  });
  mainEl.addEventListener('mouseout', e => {
    const t = e.target && e.target.closest ? e.target.closest('.alg-term, .cpp-idiom') : null;
    if (t) {
      termPopTimer = setTimeout(() => hideTermPopover(), 180);
    }
  });
  mainEl.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target.closest('.alg-term') : null;
    if (t) { e.stopPropagation(); showTermPopover(t); }
  });
  if (pop) {
    pop.addEventListener('mouseenter', () => { if (termPopTimer) { clearTimeout(termPopTimer); termPopTimer = null; } });
    pop.addEventListener('mouseleave', () => { termPopTimer = setTimeout(() => hideTermPopover(), 180); });
  }
}


// === Zero-to-Hero 6-Piece Interactive Learning Engine ===
let progressiveMode = false;

const CPP_SYNTAX_GLOSSARY = {
  'sync_with_stdio': {
    title: 'ios::sync_with_stdio(false) 与 cin.tie(nullptr)',
    def: '关闭 C++ 的 cin/cout 与 C 语言 scanf/printf 之间的同步缓冲。数据量达到 10^5 以上时，加上这两句能让 cin/cout 提速数倍，避免读写超时（TLE）。'
  },
  '0x3f': {
    title: '0x3f / 0x3f3f3f3f（竞赛无穷大常数）',
    def: '十六进制数 0x3f3f3f3f ≈ 1.06 × 10^9：既比一般题目答案大得多，又满足「两个无穷大相加也不会超过 int 上限 (2.14 × 10^9)」，而且每个字节都是 0x3f，可以直接用 memset(dp, 0x3f, sizeof dp) 一键初始化。'
  },
  'memset': {
    title: 'memset(arr, val, sizeof arr)（按字节填充数组）',
    def: '按「单个字节」给整块数组内存赋值。因此只适合填 0、-1 或 0x3f（不能直接填 1 或 1e9，否则每个字节都变成 1 会得到错误大数）。'
  },
  '1LL': {
    title: '1LL << k（防溢出的长整型左移）',
    def: '表示把 64 位整数 1 向左移动 k 位（即 2^k）。如果直接写 1 << k，在 k ≥ 31 时会发生 32 位 int 溢出变成负数或未定义行为，加上 LL 强制用 64 位 long long 计算。'
  },
  'lowbit': {
    title: 'lowbit(x) = x & -x（树状数组核心位运算）',
    def: '利用计算机补码特性，快速取出整数 x 二进制表示中「最低位那个 1 以及它后面的所有 0」（例如 12 = 1100₂，lowbit(12) = 4 = 100₂）。'
  },
  '__builtin_popcount': {
    title: '__builtin_popcount(mask)（统计二进制 1 的个数）',
    def: 'GCC 内置函数，O(1) 硬件指令级返回整数 mask 的二进制中有多少个 1（64 位整数用 __builtin_popcountll）。'
  },
  'lower_bound': {
    title: 'lower_bound(begin, end, x)（二分查找第一个 ≥ x）',
    def: '在有序区间里用二分查找返回第一个「大于或等于 x」的元素迭代器；减去数组首地址（- a.begin()）就得到下标。upper_bound 则是找第一个「严格大于 x」。'
  },
  'priority_queue': {
    title: 'priority_queue（优先队列 / 堆）',
    def: '默认是大根堆（队头永远是最大值）；若想改成小根堆（每次取最小值，如 Dijkstra），需写为 priority_queue<T, vector<T>, greater<T>>。'
  },
  'emplace_back': {
    title: 'emplace_back / push_back（向 vector 末尾追加元素）',
    def: '向动态数组 vector 的末尾添加一个新元素；emplace_back 可以直接在容器尾部就地构造元素（如 pair），比 push_back 更省一次拷贝。'
  },
  'unordered_map': {
    title: 'unordered_map（哈希表）',
    def: '平均 O(1) 增删查改的键值对容器；注意在 Codeforces 等评测环境下，极端数据可能卡默认哈希，必要时需自定义防 Hack 哈希或改用排序 + 二分。'
  },
  'long long': {
    title: 'long long（64 位长整型）',
    def: '数值范围约 ±9.22 × 10^18。只要题目中求和、乘积或坐标平方可能超过 2 × 10^9（普通 int 上限），就必须开 long long 防止溢出成负数。'
  }
};

function explainCppLine(rawLine) {
  const s = rawLine.trim();
  if (!s || s === '{' || s === '}') return '';
  const cmt = s.match(/\/\/\s*(.+)$/);
  if (cmt) return cmt[1];
  if (s.includes('sync_with_stdio') || s.includes('cin.tie')) return '关闭同步流以加速 cin/cout 输入输出，防止大数据读入超时。';
  if (/memset\([^,]+,\s*0x3f/.test(s)) return '将数组按字节初始化为无穷大（约 1.06e9），用于求最小值 DP 或最短路。';
  if (/memset\([^,]+,\s*0/.test(s)) return '将整块数组快速清零。';
  if (/for\s*\([^;]+;\s*[a-zA-Z_]\w*\s*>=\s*[^;]+;\s*--/.test(s)) return '倒序遍历：通常用于 0-1 背包等转移，确保用到的上一行状态尚未被本轮覆盖。';
  if (/for\s*\([^;]+;\s*[a-zA-Z_]\w*\s*<=\s*[^;]+;\s*\+\+/.test(s)) return '正序遍历：按从小到大的顺序推进状态或读取数据。';
  if (s.includes('1LL <<') || s.includes('1 <<')) return '使用位左移构造 2 的幂（二进制第 k 位为 1），常用于状压枚举或倍增。';
  if (s.includes('& -') || s.includes('lowbit')) return '提取二进制最低位的 1（lowbit），在树状数组中沿管辖区间向上或向下跳。';
  if (s.includes('priority_queue')) return '声明优先队列（堆），用于每次以 O(log n) 取出当前最优（最大或最小）元素。';
  if (s.includes('lower_bound')) return '在有序序列中二分定位第一个大于等于目标值的位置（O(log n)）。';
  if (s.includes('dp[') && (s.includes('max(') || s.includes('min('))) return '核心状态转移方程：在多个候选决策中取最优值更新当前状态。';
  if (/dfs\(|void\s+dfs/.test(s)) return '递归深搜（DFS）函数：深入子树或下一状态，并在回溯时汇总答案。';
  if (s.includes('return 0;')) return '程序正常结束，返回状态码 0。';
  return '';
}

function getDocPrereqChain(doc) {
  const gloss = getActiveGlossary();
  const slug = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc';
  const stripTex = (str) => String(str || '').replace(/\[a-zA-Z]+/g, ' ').replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g, ' ');
  const headTxt = stripTex((doc.title || '') + ' ' + (doc.sub || '')).toLowerCase();
  const bodyTxt = stripTex((doc.content || '').slice(0, 2400)).toLowerCase();
  const matchAlias = (hay, a) => {
    const low = a.toLowerCase();
    if (/^[a-z0-9_+-]+$/.test(low)) {
      if (low.length < 3) return false;
      return new RegExp('(^|[^a-z0-9])' + low.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])', 'i').test(hay);
    }
    return hay.includes(low);
  };
  const headHits = [], bodyHits = [];
  Object.keys(gloss).forEach(k => {
    const item = gloss[k];
    const aliases = (item.aliases || [k]).filter(a => a && a.length >= 2);
    if (aliases.some(a => matchAlias(headTxt, a))) headHits.push(k);
    else if (aliases.some(a => matchAlias(bodyTxt, a))) bodyHits.push(k);
  });
  const candidates = [...headHits, ...bodyHits];
  // Smart topic-relevance fallback so chapters whose wording is shorter than full theorem titles still get accurate same-subject prerequisites
  if (candidates.length < 3) {
    const srcText = (headTxt + ' ' + bodyTxt.slice(0, 1400));
    const stopRe = /[的与和及或在中对从把被用求证明计算已知设若则由得因此所以阶段习题第章分册精讲题型方法概念定义定理性质公式]+/g;
    const scored = [];
    Object.keys(gloss).forEach(k => {
      if (candidates.includes(k)) return;
      const item = gloss[k];
      const label = (k + ' ' + (item.title || '')).replace(stopRe, ' ');
      const chunks = [];
      (label.match(/[\u4e00-\u9fff]{2,}/g) || []).forEach(seg => {
        for (let i = 0; i <= seg.length - 2; i++) chunks.push(seg.slice(i, i + 2));
      });
      let score = 0;
      const seenC = new Set();
      chunks.forEach(c => {
        if (seenC.has(c)) return;
        seenC.add(c);
        if (headTxt.includes(c)) score += 3;
        else if (srcText.includes(c)) score += 1;
      });
      if (score >= 2) scored.push([score, k]);
    });
    scored.sort((a, b) => b[0] - a[0]);
    scored.slice(0, 4 - candidates.length).forEach(([, k]) => candidates.push(k));
  }
  const chain = [];
  const seen = new Set();
  const addKey = k => {
    if (!gloss[k] || seen.has(k)) return;
    const parts = gloss[k].parts || [k];
    parts.forEach(pk => {
      if (gloss[pk] && !seen.has(pk)) {
        seen.add(pk);
        chain.push(pk);
      }
    });
  };
  candidates.slice(0, 5).forEach(addKey);
  if (chain.length === 0 && slug === 'icpc') {
    ['DFS', 'DP', '前缀和'].forEach(addKey);
  }
  return chain.slice(0, 6);
}

window.togglePrereqDetail = function(key) {
  const box = document.getElementById('prereqDetailBox');
  if (!box) return;
  const gloss = getActiveGlossary();
  const item = gloss[key];
  if (!item) return;
  const _jsEsc = s => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const _anchor = item.anchor || key;
  document.querySelectorAll('.prereq-pill').forEach(p => p.classList.toggle('active', p.dataset.pk === key));
  box.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px;">
    <strong>${escapeHtml(item.title)}</strong>
    ${(item.docId && typeof DOCS !== 'undefined' && DOCS.some(d => d.id === item.docId)) ? `<button class="btn" style="height:24px;padding:0 10px;font-size:11.5px;" onclick="openDoc('${_jsEsc(item.docId)}', '${_jsEsc(_anchor)}')">去词典精确位置 →</button>` : ''}
  </div><div>${escapeHtml(item.def)}</div>`;
  box.classList.add('open');
  if (window.renderMathInElement && window.katex) {
    try { renderMathInElement(box, { delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}], throwOnError: false }); } catch (_) {}
  }
};

function renderPrereqCardHtml(doc) {
  if (!doc || (doc.group && doc.group.includes('词典')) || doc.group === '学习计划与讲义' || (doc.id && doc.id.startsWith('dict_'))) return '';
  const gloss = getActiveGlossary();
  const chain = getDocPrereqChain(doc);
  if (!chain.length) return '';
  const _jsEsc = s => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const pillsHtml = chain.map((k, idx) => {
    const item = gloss[k];
    if (!item) return '';
    const isDone = item.docId && !!mastery[item.docId];
    return `${idx > 0 ? '<span class="prereq-arrow">→</span>' : ''}<button class="prereq-pill ${isDone ? 'done' : ''}" data-pk="${escapeHtml(k)}" onclick="togglePrereqDetail('${_jsEsc(k)}')">${isDone ? '✓ ' : ''}${escapeHtml(k)}</button>`;
  }).join('');
  return `<details class="wb-cat-collapse" id="prereqCollapse">
    <summary class="wb-cat-summary">
      <span class="wb-cat-cur">🔗 <strong>前置知识自检链</strong>：${escapeHtml(chain.slice(0, 4).join(' → '))}</span>
      <span class="wb-cat-toggle">展开速通 ▾</span>
    </summary>
    <div class="z2h-card" id="prereqCard">
    <div class="z2h-head">
      <div style="font-size:12px;color:var(--muted);">点击任意前置词查看 1 分钟零基础速通：</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="btn" style="height:28px;padding:0 10px;font-size:12px;" onclick="toggleLocalKnowledgeGraph('${_jsEsc(doc.id)}')">🕸️ 局部知识图谱</button>
        <button class="btn ${progressiveMode ? 'btn-primary' : ''}" style="height:28px;padding:0 12px;font-size:12px;" onclick="toggleProgressiveMode()">${progressiveMode ? '退出四阶渐进模式' : '开启四阶渐进阅读'}</button>
      </div>
    </div>
    <div class="z2h-pill-row">${pillsHtml}</div>
    <div class="prereq-detail-box" id="prereqDetailBox"></div>
    <div id="localGraphBox" style="display:none;margin-top:10px;"></div>
  </div>
  </details>`;
}

window.toggleProgressiveMode = function() {
  progressiveMode = !progressiveMode;
  if (activeId) openDoc(activeId);
};

function applyFourStageStepper(articleEl) {
  if (!progressiveMode || !articleEl) return;
  const children = Array.from(articleEl.children);
  const buckets = [
    { title: '第 1 阶 · 题意白话翻译与核心直觉', intro: '导读：先剥离题目包装，搞清楚题目给你什么输入、要求什么输出。', nodes: [] },
    { title: '第 2 阶 · 朴素暴力与复杂度瓶颈', intro: '导读：先看最容易想到的暴力写法，算清楚它为什么会超时以及瓶颈卡在哪里。', nodes: [] },
    { title: '第 3 阶 · 关键优化与算法推导', intro: '导读：顺着前置知识与手算推演，一步步把瓶颈优化成正解模型。', nodes: [] },
    { title: '第 4 阶 · 完整 AC 代码与踩坑复盘', intro: '导读：对照逐行白话注释看完整代码，并排查高频边界坑点。', nodes: [] }
  ];
  let curStage = 0;
  children.forEach(el => {
    if (el.tagName === 'H2') {
      const t = el.textContent || '';
      if (/代码|实现|双版|踩坑|易错|变式|同型|对照|复现/.test(t)) curStage = 3;
      else if (/暴力|朴素|难在哪|瓶颈|复杂度/.test(t)) curStage = 1;
      else if (/前置|推导|模型|转移|手算|演练|一步步/.test(t)) curStage = 2;
      else if (/原意|直觉|题意|一、/.test(t)) curStage = 0;
      else if (/七|八|九|十/.test(t)) curStage = 3;
      else if (/三|四|五/.test(t)) curStage = 2;
      else if (/二/.test(t)) curStage = 1;
    }
    buckets[curStage].nodes.push(el);
  });
  const nonEmpty = buckets.filter(b => b.nodes.length > 0);
  if (nonEmpty.length < 2) return;
  articleEl.innerHTML = '';
  nonEmpty.forEach((b, idx) => {
    const det = document.createElement('details');
    det.className = 'stage-step-card';
    if (idx === 0) det.open = true;
    const sum = document.createElement('summary');
    sum.innerHTML = `<span>${escapeHtml(b.title)}</span><span class="stage-step-badge">${idx === 0 ? '当前展开' : '点击展开'}</span>`;
    det.appendChild(sum);
    const body = document.createElement('div');
    body.className = 'stage-step-body';
    const introDiv = document.createElement('div');
    introDiv.className = 'stage-intro-note';
    introDiv.textContent = b.intro;
    body.appendChild(introDiv);
    b.nodes.forEach(n => body.appendChild(n));
    if (idx < nonEmpty.length - 1) {
      const nextWrap = document.createElement('div');
      nextWrap.className = 'stage-next-wrap';
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.textContent = '这一阶看懂了，展开下一阶 ↓';
      btn.onclick = () => {
        const nextDet = det.nextElementSibling;
        if (nextDet && nextDet.tagName === 'DETAILS') {
          nextDet.open = true;
          nextDet.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
      nextWrap.appendChild(btn);
      body.appendChild(nextWrap);
    }
    det.appendChild(body);
    articleEl.appendChild(det);
  });
}

// 3. Sample Trace Simulator
let traceState = { headers: [], rows: [], step: 0 };
function buildSampleTraceCard(doc) {
  if (doc.group === '算法术语词典' || doc.group === '学习计划与讲义') return '';
  // Look for markdown tables in section 五 or any trace table with >= 3 rows
  const lines = doc.content.split('\n');
  let headers = [], rows = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\|.+\|$/.test(lines[i].trim())) {
      const tbl = [];
      while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
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
        })(lines[i].trim().slice(1, -1));
        if (!cells.every(c => /^[-:]+$/.test(c))) tbl.push(cells);
        i++;
      }
      if (tbl.length >= 3 && tbl[0].length >= 2) {
        headers = tbl[0];
        rows = tbl.slice(1, 10);
        if (/指针|步|i|j|状态|dp|操作|样例/.test(headers.join(' '))) break;
      }
    }
  }
  if (!rows.length) return '';
  traceState = { headers, rows, step: 0 };
  return `<div class="z2h-card" id="sampleTraceCard">
    <div class="z2h-head">
      <div class="z2h-title">本题样例单步追踪表 <span style="font-size:12px;font-weight:400;color:var(--muted);" id="traceStepLabel">第 1 / ${rows.length} 步</span></div>
      <div style="display:flex;gap:6px;">
        <button class="btn" style="height:28px;padding:0 10px;font-size:12px;" onclick="stepSampleTrace(-1)">← 上一步</button>
        <button class="btn btn-primary" style="height:28px;padding:0 12px;font-size:12px;" onclick="stepSampleTrace(1)">下一步 →</button>
        <button class="btn" style="height:28px;padding:0 10px;font-size:12px;" onclick="stepSampleTrace(0)">重置</button>
      </div>
    </div>
    <div class="trace-table-wrap" id="traceTableWrap"></div>
  </div>`;
}
window.stepSampleTrace = function(delta) {
  if (!traceState.rows.length) return;
  if (delta === 0) traceState.step = 0;
  else traceState.step = Math.max(0, Math.min(traceState.rows.length - 1, traceState.step + delta));
  renderSampleTraceTable();
};
function renderSampleTraceTable() {
  const wrap = document.getElementById('traceTableWrap');
  const lbl = document.getElementById('traceStepLabel');
  if (!wrap || !traceState.rows.length) return;
  if (lbl) lbl.textContent = `第 ${traceState.step + 1} / ${traceState.rows.length} 步`;
  const ths = traceState.headers.map(h => `<th>${inlineFmt(h)}</th>`).join('');
  const trs = traceState.rows.map((r, idx) => {
    const cls = idx === traceState.step ? 'trace-active' : (idx < traceState.step ? 'trace-past' : 'trace-future');
    return `<tr class="${cls}">${r.map(c => `<td>${inlineFmt(c)}</td>`).join('')}</tr>`;
  }).join('');
  wrap.innerHTML = `<table class="trace-tbl"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

// 4 & 5. Code Line Interaction + Plain Comments + C++ Idiom Hover
function enhanceCodeBlocks(articleEl) {
  if (!articleEl) return;
  articleEl.querySelectorAll('.code-wrap').forEach((wrap, wIdx) => {
    const head = wrap.querySelector('.code-head');
    const pre = wrap.querySelector('pre');
    const codeEl = pre ? pre.querySelector('code') : null;
    if (!head || !codeEl) return;
    // Add "白话逐行注释" toggle button
    const btnGroup = head.querySelector('div');
    if (btnGroup && !btnGroup.querySelector('.plain-toggle-btn')) {
      const tbtn = document.createElement('button');
      tbtn.className = 'copy-btn plain-toggle-btn';
      tbtn.style.marginRight = '6px';
      tbtn.textContent = '白话逐行注释';
      tbtn.onclick = () => {
        wrap.classList.toggle('show-plain');
        tbtn.textContent = wrap.classList.contains('show-plain') ? '隐藏逐行注释' : '白话逐行注释';
      };
      btnGroup.insertBefore(tbtn, btnGroup.firstChild);
    }
    const syncBar = document.createElement('div');
    syncBar.className = 'code-sync-bar';
    syncBar.id = `codeSyncBar_${wIdx}`;
    wrap.appendChild(syncBar);

    const rawLines = codeEl.innerHTML.split('\n');
    const plainLines = (codeEl.textContent || '').split('\n');
    codeEl.innerHTML = rawLines.map((hl, i) => {
      const exp = explainCppLine(plainLines[i] || '');
      const noteHtml = exp ? `<span class="code-plain-note">↳ ${escapeHtml(exp)}</span>` : '';
      return `<span class="code-line-row" data-line="${i + 1}" data-exp="${escapeHtml(exp)}">${hl || ' '}</span>${noteHtml}`;
    }).join('\n');

    wrap.addEventListener('click', e => {
      const row = e.target && e.target.closest ? e.target.closest('.code-line-row') : null;
      if (!row) return;
      wrap.querySelectorAll('.code-line-row.active').forEach(r => r.classList.remove('active'));
      row.classList.add('active');
      const exp = row.dataset.exp;
      syncBar.innerHTML = exp
        ? `<strong>第 ${row.dataset.line} 行白话解析：</strong>${escapeHtml(exp)}`
        : `<strong>第 ${row.dataset.line} 行：</strong>${escapeHtml(row.textContent.trim().slice(0, 70))}`;
      syncBar.classList.add('open');
    });
  });

  // Mark C++ idioms inside inline <code> for hover popover
  const idiomKeys = Object.keys(CPP_SYNTAX_GLOSSARY).sort((a, b) => b.length - a.length);
  articleEl.querySelectorAll('code').forEach(c => {
    if (c.closest('pre')) return;
    const txt = c.textContent || '';
    for (const ik of idiomKeys) {
      if (txt.includes(ik)) {
        c.classList.add('cpp-idiom');
        c.dataset.idiom = ik;
        break;
      }
    }
  });
}

function showIdiomPopover(el) {
  const pop = document.getElementById('termPopover');
  if (!pop || !el) return;
  const key = el.dataset ? el.dataset.idiom : '';
  const item = CPP_SYNTAX_GLOSSARY[key];
  if (!item) return;
  pop.innerHTML = `
    <div class="term-pop-head">
      <span class="term-pop-title">${escapeHtml(item.title)}</span>
      <button class="btn" style="height:24px;padding:0 8px;font-size:11px;" onclick="hideTermPopover()">关闭</button>
    </div>
    <div class="term-pop-layer main-layer">
      <div class="term-pop-layer-tag">C++ 竞赛语法白话解释</div>
      <div class="term-pop-layer-desc">${escapeHtml(item.def)}</div>
    </div>`;
  pop.classList.add('open');
  pop.setAttribute('aria-hidden', 'false');
  if (el.getBoundingClientRect) {
    const r = el.getBoundingClientRect();
    const popW = Math.min(400, window.innerWidth - 24);
    pop.style.left = Math.max(12, Math.min(r.left, window.innerWidth - popW - 12)) + 'px';
    pop.style.top = Math.max(12, r.bottom + 8) + 'px';
  }
}

// 6. Checkpoint Quiz ("防假懂"交互小问 - 按学科隔离，杜绝 ICPC 串台)
function buildCheckpointQuizHtml(doc) {
  if (!doc || doc.group === '算法术语词典' || doc.group === '学习计划与讲义') return '';
  const slug = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc';
  const t = (doc.title || '') + ' ' + (doc.content || '').slice(0, 1500);

  let q = '';
  let opts = [];
  let ansIdx = 0;
  let why = '';

  if (slug === 'icpc') {
    q = '写这道题的代码前，下面哪一步检查最能避免无谓的 WA / TLE？';
    opts = [
      '先按最大数据范围估算时间复杂度与 long long 溢出风险',
      '直接凭感觉写完再交一发碰运气',
      '数组大小照着样例开到 10 就够了'
    ];
    why = '先按最大数据规模估算操作次数（通常 1 秒不超过 10^8 次基本操作）并检查是否需要 long long，是 AC 的第一道防线。';
    if (/背包/.test(t)) {
      q = '防假懂自测：0-1 背包一维压缩时，为什么内层容量循环必须倒序（j = W 到 w）？';
      opts = ['防止同一件物品在同一轮被重复选用多次（那样会变成完全背包）', '因为 C++ 倒序循环比正序循环运行更快', '为了让数组下标从 1 开始对齐'];
      why = '正序更新会用到本轮刚算出的新 dp[j-w]，相当于同一件物品又被拿了一次；倒序才能保证取到的 dp[j-w] 还是上一轮的旧值。';
    } else if (/状压/.test(t)) {
      q = '防假懂自测：状压 DP 里判断第 i 个物品是否在集合 mask 中，正确写法是？';
      opts = ['(mask >> i) & 1', 'mask & i', 'mask ^ (1 << i)'];
      why = '(mask >> i) & 1 把第 i 位右移到最低位再与 1 相与，恰好取出该位是 0 还是 1；mask ^ (1 << i) 则是翻转该位。';
    } else if (/树状数组|BIT/.test(t)) {
      q = '防假懂自测：树状数组中 lowbit(x) = x & -x 的作用是什么？';
      opts = ['取出 x 二进制最低位的 1，决定当前节点管辖的区间长度', '把 x 直接除以 2 向下取整', '计算 x 的全部二进制位之和'];
      why = '节点 x 管辖长度为 lowbit(x) 的一段区间，向上修改跳 x += lowbit(x)，向下求前缀和跳 x -= lowbit(x)。';
    } else if (/二分/.test(t)) {
      q = '防假懂自测：使用「二分答案」求解最值问题时，必须满足的核心前提是什么？';
      opts = ['判定函数具有单调性（若 x 可行，则一侧全可行、另一侧全不可行）', '输入数组一开始必须已经排好序', '答案必须是一个不超过 100 的整数'];
      why = '即使原数组无序，只要「猜一个答案 mid 后判断是否合法」具有单调性，就能在值域上二分。';
    } else if (/树|DFS/.test(t)) {
      q = '防假懂自测：在无向树上进行 DFS 遍历（如树状 DP）时，为什么参数里要传父节点 fa？';
      opts = ['防止沿着无向边走回父节点造成死循环', '为了把树变成有向完全图', 'C++ 递归函数规定必须至少传两个参数'];
      why = '树没有环，但无向图存了双向边；遍历邻居 v 时只需判断 if (v == fa) continue; 就能保证永远只往下走不回头。';
    }
  } else {
    const SUBJECT_QUIZZES = {
      dbse: [
        [/MVCC|快照隔离|ReadView/i, '在 InnoDB 可重复读（RR）下，快照读如何判定某条 Undo 版本是否可见？', ['检查版本 trx_id 与当前事务首次 SELECT 生成的 ReadView（min_trx_id / max_trx_id / m_ids）', '每次 SELECT 都重新加表级排他锁读取最新提交版本', '只看物理页号大小，不区分事务 ID'], 'RR 在事务首次快照读时生成并复用同一个 ReadView，沿 DB_ROLL_PTR 回溯 Undo 链找到首个可见版本；但 RR 下的标准快照隔离仍可能发生写偏斜（Write Skew）。'],
        [/2PL|两阶段锁|死锁/i, '为什么严格两阶段封锁（Strict 2PL）要求排他锁必须持有到事务提交或回滚？', ['既保证冲突可串行化，又彻底避免因提前放锁引发的级联回滚', '为了省去死锁检测图（Wait-For Graph）', '因为数据库无法在事务运行期间释放任何共享锁'], '基础 2PL 只保证冲突可串行化，若提前释放 X 锁且该事务随后回滚，读到脏数据的其他事务也会被迫级联回滚；Strict 2PL 仍需死锁检测或超时机制。'],
        [/LSM|写放大/i, 'LSM-Tree 相比原地更新的 B+ 树，核心写入优势与代价分别是什么？', ['将随机写转为顺序追加（WAL+MemTable），代价是后台 Compaction 带来写放大与读放大', '完全消除磁盘 I/O 与布隆过滤器需求', '所有范围查询都只需访问单一内存页'], 'LSM-Tree 通过顺序写提升写吞吐，但 SSTable 多层归并会产生写放大，点查需借助 Bloom Filter 与多层查找（读放大）。'],
        [/CAP|Raft|共识/i, '在网络分区（P）不可避免时，Raft 共识算法属于 CP 还是 AP？如何防止脑裂？', ['CP；通过任期 Term 与严格多数派（>N/2）投票确保同一任期最多一个 Leader', 'AP；允许两个分区同时写入并在恢复后随机丢弃一份', 'CA；通过关闭网络重传避免分区发生'], 'Raft 要求写操作必须获得过半节点确认，少数派分区无法选出新主或提交日志，从而以牺牲少数派可用性换取线性一致性（CP）。']
      ],
      la: [
        [/秩|零空间|RREF/i, '对于 m×n 矩阵 A，秩-零度定理（Rank-Nullity）给出的精确关系是？', ['rank(A) + dim N(A) = n（列数），主元列数与自由变量数之和等于输入维数', 'rank(A) + dim N(A) = m（行数）', 'rank(A) 永远等于矩阵非零元素的个数'], 'A 将 n 维输入空间映射到列空间，被压扁成零向量的维数正是零空间维数 dim N(A)，两者相加恒等于输入维数 n。'],
        [/SVD|奇异值/i, '矩阵 A 的奇异值分解 A = UΣV^T 中，奇异值 σ_i 与 A^T A 特征值的关系是？', ['σ_i = √λ_i(A^T A)，且截断前 k 个最大奇异值给出 Frobenius 范数下的最优秩-k 近似', 'σ_i 直接等于 A 的对角线元素绝对值', '只有方阵才能做奇异值分解'], '任意 m×n 矩阵均存在 SVD；A^T A 对称半正定，特征值 λ_i ≥ 0，其平方根即为奇异值（Eckart-Young 定理）。']
      ],
      prob: [
        [/贝叶斯|全概率/i, '利用贝叶斯定理做罕见病筛查（基础率极低）后验评估时，最常见的误区是？', ['把假阳性率 P(阳|健康) 误当成后验错误率 P(健康|阳)，忽略低先验基础率', '把全概率分母写成 1', '认为样本独立性不影响联合似然'], '基础率谬误会严重高估阳性结果的患病概率，必须用先验 P(病) 与全概率分母 P(阳) 加权修正。'],
        [/最大似然|MLE|似然/i, '对于支撑集依赖于参数 θ 的分布（如 Uniform(0, θ)），直接令对数似然导数为 0 会怎样？', ['导数在定义域内恒不为 0，极大似然解落在边界 θ̂ = max(X_i) 处', '一定会得到无偏且唯一的驻点', '说明该分布不存在极大似然估计'], '导数为零仅适用于内点极值；Uniform(0, θ) 的似然函数随 θ 单调递减，最小值取在边界 max(X_i)。']
      ],
      dm: [
        [/归结|CNF|逻辑/i, '命题逻辑归结（Resolution）每次消去互补文字时，以下哪种做法是错误的？', ['在同一步内同时消去两对互补文字（如 P∨Q 与 ¬P∨¬Q 直接归结为空子句）', '先将所有前提化为合取范式（CNF）再提取子句集', '通过加入待证结论的否定进行反演推出空子句 □'], 'P∨Q 与 ¬P∨¬Q 在 P=T, Q=F 时同时为真，并非不可满足；每次归结只能消去一对互补文字。'],
        [/欧拉|哈密顿/i, '关于欧拉图与哈密顿图的关系，以下判断正确的是？', ['两者互不蕴含：欧拉图看度数全为偶，哈密顿图无已知多项式时间充要条件', '所有欧拉图必定是哈密顿图', '只要每个顶点度数大于 2 就一定是哈密顿图'], '例如两个三角形共用一个割点的蝴蝶结图是欧拉图但非哈密顿图；K4 是哈密顿图但非欧拉图。']
      ],
      phys: [
        [/振动|共振/i, '有阻尼受迫振动达到稳态时，驱动力频率 ω 等于以下哪个频率时振幅达到极大？', ['共振频率 ω_r = √(ω_0^2 - 2β^2)，略小于固有圆频率 ω_0', '一定严格等于固有频率 ω_0，与阻尼系数 β 无关', '等于驱动力初相位除以时间'], '阻尼项 4β^2ω^2 使振幅分母极小值点向低频偏移，仅在无阻尼极限 β→0 时 ω_r → ω_0。'],
        [/高斯定理|电通量/i, '应用静电场高斯定理 ∮ E·dS = q_内 / ε_0 求场强时，核心前提是？', ['必须利用对称性构造高斯面，使 E 在各面元上大小恒定且与法向平行或垂直', '高斯面内部必须只包含一个点电荷', '高斯面外不能有任何其他电荷'], '高斯定理本身对任意闭合曲面恒成立，但只有高度对称（球/柱/无限大平面）时才能把 |E| 从积分号内提出。']
      ],
      ai: [
        [/梯度下降|收敛/i, '在 L-光滑凸函数上执行梯度下降 θ_{t+1} = θ_t - η∇f(θ_t)，步长 η 超过什么阈值会发散？', ['η > 2/L 时二次逼近上界不再单调下降，步长过大导致震荡发散', '只要 η > 0 就保证单调下降', 'η 必须大于 L 才能逃离鞍点'], '由 Descent Lemma：f(x - η∇f) ≤ f(x) - η(1 - Lη/2)||∇f||^2，需满足 1 - Lη/2 > 0 即 η < 2/L。'],
        [/Attention|注意力|Transformer/i, 'Scaled Dot-Product Attention 为什么要把 QK^T 除以 √d_k？', ['防止 d_k 较大时点积方差线性膨胀，导致 softmax 进入梯度极小的饱和区', '为了把矩阵维度从 d_k 压缩到 1', '为了消除位置编码带来的非线性'], '若 q, k 各分量独立均值 0 方差 1，则 q·k 方差为 d_k；除以 √d_k 可将方差拉回 1，保持 softmax 梯度稳定。']
      ],
      quant: [
        [/凯利|仓位|Kelly/i, '实盘中相比全凯利（f*），为何机构普遍采用半凯利（0.5 f*）？', ['半凯利在损失 25% 几何增速的同时将波动方差减半，且能防止参数高估导致 >2f* 爆仓', '因为全凯利会导致预期收益率为负', '因为半凯利不需要估计胜率与赔率'], '离散/连续凯利对数增长曲线在 f* 附近呈抛物线平坦状，而超过 2f* 后几何复合增长率直接转负。'],
        [/回测|过拟合|Purged/i, '金融时间序列做交叉验证时，为什么标准 K-Fold 会严重泄漏未来信息？', ['相邻样本的持有期标签在时间上重叠，必须用 Purged & Embargoed CV 隔离重叠区间', '因为时间序列不能计算均值和方差', '因为 K-Fold 只支持分类不支持回归'], '多日收益率标签存在自相关与时间重叠，测试集邻近的训练集样本会直接窥探测试期价格走势。']
      ],
      cpp: [
        [/Cache|伪共享|alignas/i, '多核并发下两个线程各自高频写相邻原子变量却严重掉速，根因与解法是？', ['同一 64B Cache Line 触发 MESI 伪共享，需用 alignas(64) 隔离热点原子变量', '因为 std::atomic 不支持 x86 硬件指令', '必须把所有原子变量改成互斥锁 std::mutex'], '即使逻辑上写不同变量，只要它们落在同一 64 字节缓存行，核间缓存一致性协议就会不断使整行失效。'],
        [/memory_order|原子|无锁/i, '在 SPSC 无锁队列中，生产者更新 tail 与消费者读取 tail 应配对哪种最小内存序？', ['生产者 store(memory_order_release) 配对消费者 load(memory_order_acquire)', '全部使用 memory_order_relaxed 就足够保证数据可见', '必须全部加 memory_order_seq_cst 否则 x86 会出错'], 'Release-Acquire 建立跨线程 Synchronizes-With 关系，保证数据槽位写入先于 tail 发布对消费者可见，且在 x86 上几乎零额外开销。']
      ],
      arch: [
        [/流水线|冒险|转发/i, '五级流水线中，紧跟在 lw（Load）指令后面一条指令立刻使用其目标寄存器时，纯靠转发能完全消除停顿吗？', ['不能；Load 结果在 MEM 阶段末才就绪，必须插入 1 个气泡（Stall）后再从 MEM/WB 转发', '可以；只要有 EX/MEM 转发就能 0 停顿', '必须清空整个流水线（Flush 5 个周期）'], 'ALU 指令在 EX 末出结果可 0 停顿转发，但 Load-Use 冒险在 MEM 末才拿到数据，因此至少需 1 拍气泡。'],
        [/Cache|组相联/i, '主存地址拆分为 Tag / Index / Offset 时，若将 Cache 容量翻倍但块大小和相联度不变，哪部分位宽增加？', ['组数翻倍导致 Index 增加 1 bit，Tag 减少 1 bit，Offset 不变', 'Offset 增加 1 bit，Tag 不变', 'Tag 增加 1 bit，Index 不变'], '块大小决定 Offset 位宽，组数 = 容量 / (块大小 × 相联度) 决定 Index 位宽，剩余高位为 Tag。']
      ],
      dsos: [
        [/红黑树|旋转/i, '红黑树之所以能保证查找最坏复杂度为 O(log n)，依靠的核心高度不变量是？', ['任意节点到其所有空叶节点的路径包含相同数量的黑节点，且无连续两个红节点', '所有左子树与右子树的节点总数之差不超过 1', '树中红色节点数量必须严格等于黑色节点数量'], '这两条不变量共同保证最长路径（红黑交替）不超过最短路径（全黑）的 2 倍，从而树高严格 ≤ 2 log2(n+1)。'],
        [/LRU|时钟|置换/i, '操作系统页面置换中，Clock（二次机会）算法为何比纯 LRU 更受内核青睐？', ['只需硬件页表项提供 1 个 Accessed 访问位与环形指针，避免每次访存维护链表锁开销', '因为 Clock 算法的缺页率永远严格低于 Belady 最优算法', '因为 Clock 算法不需要页表项'], '硬件 MMU 每次访存只需置位 PTE 的 Accessed 位，操作系统仅在缺页时按指针扫描清零，无需在每次访存更新链表。']
      ],
      net: [
        [/拥塞|TCP|cwnd/i, 'TCP Reno 收到 3 个重复 ACK 触发快重传与快恢复时，cwnd 与 ssthresh 如何变化？', ['ssthresh 降为当前 cwnd/2，cwnd 设为 ssthresh + 3MSS，避免直接退回 1 MSS', 'cwnd 立刻重置为 1 MSS 并重新慢启动', 'cwnd 保持不变继续线性增长'], '3 个重复 ACK 说明仍有后续报文到达对端（网络未彻底拥塞），只需减半窗口进入拥塞避免，而非像超时那样退回 1 MSS。'],
        [/TLS|握手/i, 'TLS 1.3 将完整握手从 TLS 1.2 的 2-RTT 缩短到 1-RTT 的关键改动是？', ['ClientHello 直接附带 key_share 公钥参数，ServerHello 后随即加密传输证书与 Finished', '取消了非对称密钥交换，全部改用明文对称密钥', '把 TCP 三次握手合并进应用层'], 'TLS 1.3 砍掉了不安全的静态 RSA 与协商往返，客户端首次发送即携带预估 ECDHE 密钥份额。']
      ],
      comp: [
        [/NFA|子集构造/i, '使用子集构造法将 ε-NFA 确定化为 DFA 时，状态转移 δ_D(T, a) 的正确计算顺序是？', ['先求 move(T, a) 得到直接后继，再求其 ε-closure(move(T, a))', '先丢弃所有 ε 边再直接按原状态数建表', '只需对起始状态求一次 ε-closure 即可'], '每步读入字符 a 后，必须把所有能通过任意条 ε 边无消耗到达的状态合并进来，才能完整覆盖 NFA 的非确定性分支。'],
        [/SSA|静态单赋值|支配/i, '将控制流图转为 SSA 形式时，变量 x 在某个基本块 B 入口需要插入 φ 函数的精确位置判据是？', ['B 属于所有对 x 进行定值的基本块的迭代支配边界 DF^+', '只要 B 有两个以上前驱就无条件为所有变量插 φ', '只在函数的入口基本块插入 φ'], 'Cytron 算法利用支配边界（Dominance Frontier）精准定位定值汇聚点，避免产生多余的 φ 节点。']
      ]
    };
    const rules = SUBJECT_QUIZZES[slug] || [];
    for (const [re, rq, ropts, rwhy] of rules) {
      if (re.test(t)) { q = rq; opts = ropts; why = rwhy; break; }
    }
    if (!q) {
      const subj = window.__WB_SUBJECT_NAME__ || '当前学科';
      q = `防假懂自测：学习${subj}「${(doc.title || '本专题').replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '').slice(0, 26)}」时，以下哪种检验最有效？`;
      opts = [
        '明确核心定义/公式的适用前提、量纲或边界条件，并手算一个最小反例验证',
        '只背诵结论关键词，不推导过程也不检验边界条件',
        '跳过基础例题与反例辨析，直接套用无关通用模板'
      ];
      why = '真正掌握一个专业专题，关键在于把前提假设、公式/状态演化过程与边界反例一一对应验证。';
    }
  }

  const optsHtml = opts.map((o, idx) => `<button class="quiz-opt-btn" onclick="answerCheckpointQuiz(this, ${idx === ansIdx}, '${escapeHtml(why).replace(/'/g, "\\'")}')">${String.fromCharCode(65 + idx)}. ${escapeHtml(o)}</button>`).join('');
  return `<div class="z2h-card" id="checkpointQuizCard">
    <div class="z2h-head"><div class="z2h-title">关键节点「防假懂」自测</div></div>
    <div style="font-size:13.5px;font-weight:600;color:var(--text);margin-bottom:6px;">${escapeHtml(q)}</div>
    ${optsHtml}
    <div class="quiz-feedback" id="quizFeedback"></div>
  </div>`;
}

window.answerCheckpointQuiz = function(btn, isCorrect, why) {
  if (!btn) return;
  const card = btn.closest ? btn.closest('#checkpointQuizCard') : document.getElementById('checkpointQuizCard');
  if (card) {
    card.querySelectorAll('.quiz-opt-btn').forEach(b => {
      b.style.borderColor = '';
      b.style.background = '';
      b.style.color = '';
    });
  }
  btn.style.borderColor = isCorrect ? 'var(--green, #16a34a)' : '#ef4444';
  btn.style.background = isCorrect ? 'rgba(22,163,74,0.12)' : 'rgba(239,68,68,0.12)';
  btn.style.color = isCorrect ? 'var(--green, #16a34a)' : '#ef4444';
  const fb = (card && card.querySelector('#quizFeedback')) || document.getElementById('quizFeedback');
  if (fb) {
    fb.style.display = 'block';
    fb.style.marginTop = '8px';
    fb.style.padding = '8px 10px';
    fb.style.borderRadius = '8px';
    fb.style.fontSize = '12.5px';
    fb.style.background = isCorrect ? 'rgba(22,163,74,0.10)' : 'rgba(239,68,68,0.10)';
    fb.style.color = isCorrect ? 'var(--green, #16a34a)' : '#ef4444';
    fb.innerHTML = (isCorrect ? '✅ 回答正确！' : '❌ 再想想：') + escapeHtml(why || '');
  }
};

/* === Module: Quartz-Inspired Interactive Local Knowledge Graph (2-Hop Neighborhood) === */
window.toggleLocalKnowledgeGraph = function(docId) {
  const box = document.getElementById('localGraphBox');
  if (!box) return;
  if (box.style.display !== 'none' && box.dataset.docId === docId) {
    box.style.display = 'none';
    return;
  }
  box.dataset.docId = docId;
  box.style.display = 'block';
  window.renderLocalKnowledgeGraph(box, docId);
};

window.renderLocalKnowledgeGraph = function(box, docId) {
  const docs = (typeof DOCS !== 'undefined' && Array.isArray(DOCS)) ? DOCS : [];
  const doc = docs.find(d => d.id === docId);
  if (!doc) return;

  const chain = getDocPrereqChain(doc).slice(0, 4);
  const idx = docs.findIndex(d => d.id === docId);
  const prevDoc = idx > 0 ? docs[idx - 1] : null;
  const nextDocs = [];
  if (idx >= 0 && idx + 1 < docs.length) nextDocs.push(docs[idx + 1]);
  // Find up to 2 related docs sharing prereq keywords
  const chainSet = new Set(chain);
  for (let i = 0; i < docs.length && nextDocs.length < 3; i++) {
    const cand = docs[i];
    if (cand.id === docId || (prevDoc && cand.id === prevDoc.id) || nextDocs.some(x => x.id === cand.id)) continue;
    if (cand.group && cand.group.includes('词典')) continue;
    const cc = getDocPrereqChain(cand);
    if (cc.some(k => chainSet.has(k))) nextDocs.push(cand);
  }

  const leftNodes = chain.map(k => ({ type: 'term', id: k, label: k.slice(0, 12) }));
  if (prevDoc && leftNodes.length < 4) {
    leftNodes.unshift({ type: 'doc', id: prevDoc.id, label: '← ' + (prevDoc.title || '').replace(/^阶段\s*\d+\s*[·.：:]\s*/, '').slice(0, 11) });
  }
  const rightNodes = nextDocs.map(nd => ({
    type: 'doc',
    id: nd.id,
    label: (nd.title || '').replace(/^阶段\s*\d+\s*[·.：:]\s*/, '').slice(0, 12) + ' →'
  }));

  const W = 560, H = Math.max(190, Math.max(leftNodes.length, rightNodes.length, 1) * 48 + 32);
  const cx = W / 2, cy = H / 2;
  const placeCol = (arr, x) => arr.map((n, i) => ({
    ...n,
    x,
    y: arr.length === 1 ? cy : 36 + (i * (H - 72)) / (arr.length - 1)
  }));
  const L = placeCol(leftNodes, 96);
  const R = placeCol(rightNodes, W - 96);
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const jsEsc = s => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  let edges = '';
  L.forEach(n => {
    edges += `<path d="M ${n.x + 68} ${n.y} C ${n.x + 120} ${n.y}, ${cx - 110} ${cy}, ${cx - 72} ${cy}" fill="none" stroke="var(--accent, #2563eb)" stroke-opacity="0.38" stroke-width="1.8"/>`;
  });
  R.forEach(n => {
    edges += `<path d="M ${cx + 72} ${cy} C ${cx + 110} ${cy}, ${n.x - 120} ${n.y}, ${n.x - 68} ${n.y}" fill="none" stroke="var(--accent, #2563eb)" stroke-opacity="0.38" stroke-width="1.8" stroke-dasharray="4 3"/>`;
  });

  const renderPill = (n, isCenter) => {
    const rw = isCenter ? 144 : 136, rh = 30;
    const fill = isCenter ? 'var(--accent, #2563eb)' : 'var(--card, #ffffff)';
    const stroke = isCenter ? 'var(--accent, #2563eb)' : 'var(--border-strong, rgba(100,116,139,0.35))';
    const tc = isCenter ? '#ffffff' : 'var(--text, #1e293b)';
    const onclick = isCenter ? '' : (n.type === 'term'
      ? `onclick="togglePrereqDetail('${jsEsc(n.id)}')"`
      : `onclick="openDoc('${jsEsc(n.id)}')"`
    );
    return `<g ${onclick} style="cursor:${isCenter ? 'default' : 'pointer'};">
      <rect x="${n.x - rw / 2}" y="${n.y - rh / 2}" width="${rw}" height="${rh}" rx="15" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
      <text x="${n.x}" y="${n.y + 4}" text-anchor="middle" font-size="11.5" font-weight="${isCenter ? '700' : '600'}" fill="${tc}">${esc(n.label)}</text>
    </g>`;
  };

  const centerTitle = (doc.title || '当前章节').replace(/^阶段\s*\d+\s*[·.：:]\s*/, '').slice(0, 11);
  box.innerHTML = `<div style="border:1px solid var(--border,rgba(148,163,184,0.28));border-radius:14px;padding:10px 12px;background:var(--bg,rgba(148,163,184,0.05));">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:11.5px;color:var(--muted);">
      <span>🕸️ <strong>局部知识图谱</strong>（左：前置速通 · 中：当前章 · 右：后续关联，点击直达）</span>
    </div>
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;max-height:240px;display:block;">
      ${edges}
      ${L.map(n => renderPill(n, false)).join('')}
      ${renderPill({ x: cx, y: cy, label: centerTitle }, true)}
      ${R.map(n => renderPill(n, false)).join('')}
    </svg>
  </div>`;
};
