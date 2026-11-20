/* === Module: 14-Category Algorithm Visualization Engine & Quiz === */
const VIZ_CATALOG = [
  { id: 'sort_search', name: '排序、逆序对与二分', modes: [{ id: 'merge', label: '归并排序(逆序对)' }, { id: 'quick', label: '快速排序(第k小)' }, { id: 'bsearch', label: '二分查找/二分答案' }] },
  { id: 'stack_queue_heap', name: '栈、单调结构与堆', modes: [{ id: 'stack', label: '单调栈' }, { id: 'heap', label: '小根堆(合并果子)' }] },
  { id: 'dfs_bfs', name: 'DFS 回溯与 BFS 最短路', modes: [{ id: 'dfs', label: 'DFS 递归树' }, { id: 'bfs', label: 'BFS 网格波纹' }] },
  { id: 'dsu', name: '并查集 (路径压缩)', modes: [{ id: 'dsu', label: '树形合并与压缩' }] },
  { id: 'bit_st', name: '树状数组 & ST表', modes: [{ id: 'bit', label: '树状数组 lowbit' }, { id: 'st', label: 'ST表 RMQ 倍增' }] },
  { id: 'segtree', name: '线段树与 Lazy 懒标记', modes: [{ id: 'lazy', label: '区间加与区间查询' }] },
  { id: 'dp_table', name: '动态规划二维填表', modes: [{ id: 'knapsack', label: '0-1 背包' }, { id: 'interval', label: '区间 DP (石子合并)' }, { id: 'edit', label: '编辑距离' }] },
  { id: 'bitmask_dp', name: '状压 DP (位掩码)', modes: [{ id: 'tsp', label: 'TSP 集合状态转移' }] },
  { id: 'graph_sp_mst', name: '最短路与最小生成树', modes: [{ id: 'dijkstra', label: 'Dijkstra 堆优化' }, { id: 'spfa', label: 'SPFA / 负环检测' }, { id: 'kruskal', label: 'Kruskal 生成树' }] },
  { id: 'graph_tarjan_topo', name: '拓扑排序与 Tarjan SCC', modes: [{ id: 'tarjan', label: 'Tarjan 强连通缩点' }, { id: 'topo', label: 'Kahn 拓扑排序' }] },
  { id: 'tree_algo', name: '树上算法 (LCA/树剖/点分)', modes: [{ id: 'lca', label: '倍增 LCA 跳跃' }, { id: 'hld', label: '树链剖分重链' }, { id: 'centroid', label: '点分治找重心' }] },
  { id: 'maxflow', name: '网络最大流 (Dinic)', modes: [{ id: 'dinic', label: 'Dinic 分层增广' }] },
  { id: 'string_algo', name: '字符串 (KMP / AC自动机)', modes: [{ id: 'kmp', label: 'KMP 失配回跳' }, { id: 'ac', label: 'AC自动机 Fail指针' }] },
  { id: 'math_geo_mo', name: '数论/线性基/凸包/莫队/Nim', modes: [{ id: 'hull', label: '二维凸包 Andrew' }, { id: 'mo', label: '莫队区间分块' }, { id: 'basis', label: '线性基异或消元' }, { id: 'sieve', label: '欧拉线性筛' }, { id: 'pow', label: '快速幂二进制' }, { id: 'nim', label: 'Nim 异或博弈' }] }
];

let vizState = {
  open: false,
  wide: false,
  fullscreen: false,
  infoTab: 'none',
  algo: 'segtree',
  mode: 'lazy',
  frames: [],
  idx: 0,
  timer: null,
  speed: 650,
  customInput: '',
  problemBundle: null,
  bundleIdx: 0
};

const COMPLEMENTARY_VIZ = {
  'string_algo:ac': [
    { algo: 'string_algo', mode: 'kmp', role: '① 前置直觉', why: '先用单串 KMP 理解「失配指针 next[] 跳回最长真前后缀」的本质，AC 自动机的 fail 指针就是 KMP 在多串 Trie 树上的二维推广。', input: 'ABABCABAB | ABAB' },
    { algo: 'string_algo', mode: 'ac', role: '② 核心引擎', why: '在 Trie 树上按 BFS 序构建 fail 指针，并用文本串沿 Trie + fail 转移完成多模式串一次性扫描。', input: 'he, she, hers, his | ushers' },
    { algo: 'dfs_bfs', mode: 'bfs', role: '③ 底层机制', why: 'AC 自动机构建 fail 指针必须按深度从浅到深（BFS 队列序）递推，确保父节点的 fail 已经算好。', input: '' }
  ],
  'string_algo:kmp': [
    { algo: 'string_algo', mode: 'kmp', role: '① 核心引擎', why: '动态展示主串指针不回退、模式串依靠 next[] 失配数组高效跳转的全过程。', input: 'ABABCABAB | ABAB' },
    { algo: 'string_algo', mode: 'ac', role: '② 进阶推广', why: '把单模式串的 KMP 状态机推广到多模式串 Trie 树，即得到 AC 自动机。', input: 'he, she, hers, his | ushers' }
  ],
  'tree_algo:hld': [
    { algo: 'tree_algo', mode: 'hld', role: '① 树链剖分', why: '先通过两次 DFS 找出重儿子、连成重链并分配连续 DFS 序，把任意树上路径拆成 O(log n) 段连续区间。', input: '' },
    { algo: 'segtree', mode: 'lazy', role: '② 区间维护', why: '重链剖分赋予连续 DFS 序后，树上路径加/路径求和就转化为线段树区间加与区间查询（带 Lazy 懒标记）。', input: '1, 3, 5, 7, 2, 4 | add(1,4,+3), sum(2,5)' },
    { algo: 'tree_algo', mode: 'lca', role: '③ 路径对齐', why: '重链不断向上跳链顶直到两点处于同一条重链的过程，本身也同步完成了最近公共祖先（LCA）的求解。', input: '' }
  ],
  'tree_algo:lca': [
    { algo: 'tree_algo', mode: 'lca', role: '① 核心引擎', why: '展示二进制倍增表 fa[u][k] 先将两点拉平到同一深度，再同步向上试探跳跃直至交汇的过程。', input: '' },
    { algo: 'tree_algo', mode: 'hld', role: '② 替代方案对比', why: '对比树链剖分求 LCA：跳重链同样是 O(log n) 但常数极小且不占 O(n log n) 倍增数组空间。', input: '' }
  ],
  'tree_algo:centroid': [
    { algo: 'tree_algo', mode: 'centroid', role: '① 核心引擎', why: '点分治每层递归前必须找当前连通块重心（最大子树最小），保证递归深度严格不超过 O(log n)。', input: '' },
    { algo: 'dfs_bfs', mode: 'dfs', role: '② 递归分治树', why: '直观感受分治过程如何将整棵树拆成一棵高度为 O(log n) 的点分树并逐层统计跨过重心的路径。', input: '' }
  ],
  'segtree:lazy': [
    { algo: 'segtree', mode: 'lazy', role: '① 核心引擎', why: '观察区间修改时 Lazy 懒标记如何在节点暂存、并在后续向下递归查询/修改时下传（pushdown）。', input: '1, 3, 5, 7, 2, 4 | add(1,4,+3), sum(2,5)' },
    { algo: 'bit_st', mode: 'bit', role: '② 轻量化对比', why: '若题目仅需单点修改+区间和（或差分后区间改单点查），树状数组 lowbit 跳跃比线段树更快更省空间。', input: '3, 1, 4, 1, 5, 9, 2, 6' }
  ],
  'bit_st:bit': [
    { algo: 'bit_st', mode: 'bit', role: '① 核心引擎', why: '用 lowbit(x) = x & -x 理解前缀和查询向左下跳、单点更新向右上跳的二进制树状结构。', input: '3, 1, 4, 1, 5, 9, 2, 6' },
    { algo: 'sort_search', mode: 'merge', role: '② 等价思路对比', why: '在求逆序对等离线统计问题中，树状数组动态维护值域前缀和与归并排序分治统计是经典的双向解法。', input: '5, 2, 4, 7, 1, 3, 6' }
  ],
  'bit_st:st': [
    { algo: 'bit_st', mode: 'st', role: '① 核心引擎', why: '利用倍增预处理区间最值 st[i][k]，查询时将区间 [L, R] 拆成两个可重叠的 2^k 子区间 O(1) 合并。', input: '4, 7, 2, 9, 5, 1, 8, 3 | query(2,6)' },
    { algo: 'segtree', mode: 'lazy', role: '② 动态维护对比', why: 'ST 表仅支持静态可重复贡献运算（max/min/gcd），一旦题目带单点或区间修改就需要换用线段树。', input: '4, 7, 2, 9, 5, 1, 8, 3 | add(1,4,+3), sum(2,5)' }
  ],
  'maxflow:dinic': [
    { algo: 'maxflow', mode: 'dinic', role: '① 核心引擎', why: '展示 Dinic 每次建分层图后沿允许弧进行多路增广、并利用反向边反悔退流的完整过程。', input: '' },
    { algo: 'dfs_bfs', mode: 'bfs', role: '② 分层图构建', why: 'Dinic 每轮增广前都需要一次 BFS 从源点出发给所有残量网络可达点标注层数 level[]，直到汇点不可达。', input: '' }
  ],
  'graph_tarjan_topo:tarjan': [
    { algo: 'graph_tarjan_topo', mode: 'tarjan', role: '① 强连通缩点', why: '用 dfn[] 与 low[] 识别有向图中的环，把每个强连通分量（SCC）缩成一个超级节点，消除有向环。', input: '' },
    { algo: 'graph_tarjan_topo', mode: 'topo', role: '② 缩点后 DAG 拓扑', why: '缩点完成后原图变为有向无环图（DAG），随后即可在 DAG 上按拓扑序进行递推、DP 或出度统计。', input: '' }
  ],
  'graph_tarjan_topo:topo': [
    { algo: 'graph_tarjan_topo', mode: 'topo', role: '① 核心引擎', why: '用 Kahn 算法维护入度为 0 的队列，按拓扑序依次松弛后继节点的状态（DAG 上 DP 的标准前置）。', input: '' },
    { algo: 'graph_tarjan_topo', mode: 'tarjan', role: '② 含环扩展', why: '若原图可能存在环（非纯粹 DAG），必须先用 Tarjan 缩点把环消掉，再跑拓扑排序。', input: '' }
  ],
  'graph_sp_mst:dijkstra': [
    { algo: 'graph_sp_mst', mode: 'dijkstra', role: '① 核心引擎', why: '基于贪心与小根堆，每次取出当前距离源点最近的未确定节点进行松弛，适用于非负权图。', input: '' },
    { algo: 'stack_queue_heap', mode: 'heap', role: '② 底层数据结构', why: '堆优化 Dijkstra 的 O((V+E) log V) 复杂度依赖小根堆每次 O(log V) 弹出最小 dist 节点。', input: '4, 2, 9, 1, 5' }
  ],
  'graph_sp_mst:spfa': [
    { algo: 'graph_sp_mst', mode: 'spfa', role: '① 核心引擎', why: '展示带负权边的松弛过程与 cnt[v] >= n 判定负环（或差分约束无解）的触发条件。', input: '' },
    { algo: 'graph_sp_mst', mode: 'dijkstra', role: '② 算法对比', why: '若所有边权非负，应优先使用不会被网格图/菊花图卡成 O(VE) 的堆优化 Dijkstra。', input: '' }
  ],
  'graph_sp_mst:kruskal': [
    { algo: 'graph_sp_mst', mode: 'kruskal', role: '① 核心引擎', why: '将所有边按边权升序排列，贪心尝试加入当前最小且不构成环的边，直到选满 n-1 条边。', input: '' },
    { algo: 'dsu', mode: 'dsu', role: '② 判环引擎', why: 'Kruskal 每次 O(alpha(n)) 判断「两点是否已连通」以及合并连通块，底层完全依赖并查集。', input: '' }
  ],
  'dsu:dsu': [
    { algo: 'dsu', mode: 'dsu', role: '① 核心引擎', why: '直观展示 find() 路径压缩如何把长链压扁，以及 union() 如何合并集合/维护扩展域关系。', input: '' },
    { algo: 'graph_sp_mst', mode: 'kruskal', role: '② 经典应用', why: '并查集最经典的实战场景之一就是配合 Kruskal 算法在生成树构建中高效判环。', input: '' }
  ],
  'sort_search:merge': [
    { algo: 'sort_search', mode: 'merge', role: '① 分治归并', why: '在左右半区分别有序后，合并时每当右半区元素抢先出队，就一次性累加左半区剩余元素个数作为逆序对。', input: '5, 2, 4, 7, 1, 3, 6' },
    { algo: 'bit_st', mode: 'bit', role: '② 树状数组解法', why: '也可以按值域离散化后用树状数组动态维护已插入元素的前缀和，同样 O(n log n) 求逆序对。', input: '5, 2, 4, 7, 1, 3, 6' }
  ],
  'sort_search:quick': [
    { algo: 'sort_search', mode: 'quick', role: '① 核心引擎', why: '快速选择（Quickselect）每次按 pivot 划分后只递归包含第 k 小的那一侧，期望复杂度 O(n)。', input: '6, 2, 8, 1, 5, 3, 7 | k=3' },
    { algo: 'sort_search', mode: 'bsearch', role: '② 思想对比', why: '快速选择是在无序数组上按值域划分缩减搜索空间，而二分查找是在有序序列上按位置折半。', input: '1, 2, 3, 5, 6, 7, 8 | target=5' }
  ],
  'sort_search:bsearch': [
    { algo: 'sort_search', mode: 'bsearch', role: '① 二分框架', why: '观察单调区间上左右边界 l, r 与 mid 的收敛过程，避免死循环与边界 off-by-one 错误。', input: '2, 5, 8, 12, 16, 23, 38, 56 | target=23' },
    { algo: 'dp_table', mode: 'knapsack', role: '② 二分+贪心/DP 判定', why: '二分答案题通常外层二分答案 mid，内层用贪心或线性扫描 check(mid) 是否可行。', input: '' }
  ],
  'stack_queue_heap:stack': [
    { algo: 'stack_queue_heap', mode: 'stack', role: '① 单调栈', why: '新元素入栈前弹出所有破坏单调性的栈顶元素，从而 O(n) 找到每个位置左右第一个更大/更小值。', input: '4, 2, 6, 3, 5, 1' },
    { algo: 'stack_queue_heap', mode: 'heap', role: '② 结构对比', why: '单调栈维护「一侧可见的最值边界」，而堆（优先队列）用于动态维护全局最值。', input: '4, 2, 6, 3, 5, 1' }
  ],
  'stack_queue_heap:heap': [
    { algo: 'stack_queue_heap', mode: 'heap', role: '① 小根堆贪心', why: '每次弹出两个最小元素合并后再压回堆中，动态演示 Huffman 合并代价最小化的全过程。', input: '1, 2, 9, 4, 5' },
    { algo: 'sort_search', mode: 'merge', role: '② 排序对比', why: '静态排序只需排一次，而合并过程会不断产生新元素，因此必须用支持动态插入与取最小的小根堆。', input: '1, 2, 9, 4, 5' }
  ],
  'dfs_bfs:dfs': [
    { algo: 'dfs_bfs', mode: 'dfs', role: '① 搜索与回溯', why: '展示递归状态树如何向深处试探、触发剪枝条件后回溯恢复现场。', input: '' },
    { algo: 'dfs_bfs', mode: 'bfs', role: '② 搜索策略对比', why: '对比 DFS（省空间、适合找全部解/可行性）与 BFS（按层扩展、首次到达即最短路）。', input: '' }
  ],
  'dfs_bfs:bfs': [
    { algo: 'dfs_bfs', mode: 'bfs', role: '① 按层波纹扩展', why: '队列保证按步数（距离）由近及远扩展，首次到达目标状态时步数必然最短。', input: '' },
    { algo: 'dfs_bfs', mode: 'dfs', role: '② 搜索策略对比', why: '当状态空间巨大、BFS 内存吃紧时，常改用迭代加深 DFS（IDDFS / IDA*）用时间换空间。', input: '' }
  ],
  'dp_table:knapsack': [
    { algo: 'dp_table', mode: 'knapsack', role: '① 二维填表直觉', why: '先看清 dp[i][w] 二维状态表如何由上一行继承或选当前物品转移，再理解一维滚动数组为何要逆序。', input: 'W=7 | (w:2,v:3),(w:3,v:4),(w:4,v:5),(w:5,v:7)' },
    { algo: 'bitmask_dp', mode: 'tsp', role: '② 集合状态对比', why: '当物品数量很少但存在顺序/依赖约束时，容量维度可以换成二进制位掩码（状压 DP）。', input: '' }
  ],
  'dp_table:interval': [
    { algo: 'dp_table', mode: 'interval', role: '① 区间 DP 填表', why: '观察为何必须按区间长度 len 从小到大枚举，再枚举断点 k 合并左右子区间 [l,k] 与 [k+1,r]。', input: '4, 5, 9, 4' },
    { algo: 'dp_table', mode: 'edit', role: '② 二维 DP 对比', why: '对比区间 DP（按长度斜向填表）与双序列 DP（按下标逐行逐列填表）的拓扑依赖顺序差异。', input: 'horse -> ros' }
  ],
  'dp_table:edit': [
    { algo: 'dp_table', mode: 'edit', role: '① 双序列 DP 表', why: '展示字符相等直接继承左上角、不等时在插入/删除/替换三者中取最小值的二维填表过程。', input: 'horse -> ros' },
    { algo: 'dp_table', mode: 'interval', role: '② 二维 DP 对比', why: '对比线性双序列 DP 与区间合并 DP 的状态定义与转移方向。', input: '4, 5, 9, 4' }
  ],
  'bitmask_dp:tsp': [
    { algo: 'bitmask_dp', mode: 'tsp', role: '① 位掩码状态转移', why: '用整数的二进制位表示已访问集合 mask，按 popcount 从小到大枚举子集完成无后效性转移。', input: '' },
    { algo: 'dp_table', mode: 'knapsack', role: '② 经典 DP 对比', why: '对比普通容量背包与位掩码状压 DP：两者本质都是把「已做过的决策约束」压缩进状态维度。', input: '' }
  ],
  'math_geo_mo:hull': [
    { algo: 'math_geo_mo', mode: 'hull', role: '① 二维凸包 Andrew', why: '先按坐标排序，再分别用单调栈维护下凸壳与上凸壳，利用叉积判断左拐/右拐剔除凹点。', input: '(0,0),(2,1),(1,3),(4,2),(3,0),(2,2),(0,3)' },
    { algo: 'stack_queue_heap', mode: 'stack', role: '② 单调栈底层逻辑', why: 'Andrew 算法维护凸壳不断弹出非凸顶点的操作，本质上与单调栈维护单调边界完全一致。', input: '4, 2, 6, 3, 5, 1' }
  ],
  'math_geo_mo:mo': [
    { algo: 'math_geo_mo', mode: 'mo', role: '① 莫队分块排序', why: '把所有离线查询按左端点所在块号、块内按右端点排序，使指针左右移动总步数降至 O(n sqrt(n))。', input: '[1,4],[2,6],[0,2],[3,7],[1,5]' },
    { algo: 'bit_st', mode: 'bit', role: '② 在线统计对比', why: '部分区间去重/数颜色问题（如 HH 的项链）既可用离线莫队，也可按右端点排序用树状数组在线维护。', input: '3, 1, 4, 1, 5, 9, 2, 6' }
  ],
  'math_geo_mo:basis': [
    { algo: 'math_geo_mo', mode: 'basis', role: '① 线性基高斯消元', why: '从最高位到最低位尝试插入每个数，若该位已有基向量则异或消元，最终得到极简正交基组。', input: '5, 12, 9, 6' },
    { algo: 'math_geo_mo', mode: 'nim', role: '② 异或性质联动', why: '线性基与 Nim 博弈共享异或的线性空间性质：某数能被基表示等价于它加入后不会改变异或和空间。', input: '5, 12, 9' }
  ],
  'math_geo_mo:sieve': [
    { algo: 'math_geo_mo', mode: 'sieve', role: '① 欧拉线性筛', why: '每个合数只被它的最小质因子筛掉一次（i % p == 0 时立即 break），实现严格 O(n) 筛素数与积性函数。', input: 'n=30' },
    { algo: 'math_geo_mo', mode: 'pow', role: '② 数论工具联动', why: '筛出素数/欧拉函数/莫比乌斯函数后，配合快速幂求逆元即可解决大量模意义下的组合与数论题。', input: '3^13 mod 1000' }
  ],
  'math_geo_mo:pow': [
    { algo: 'math_geo_mo', mode: 'pow', role: '① 二进制拆分快速幂', why: '把指数拆成二进制位，底数不断平方倍增，在 O(log b) 步内算出幂次（或矩阵快速幂）。', input: '3^13 mod 1000' },
    { algo: 'math_geo_mo', mode: 'sieve', role: '② 模逆元与数论联动', why: '在模质数 p 条件下，快速幂 a^(p-2) mod p 是求解乘法逆元最常用的工具。', input: 'n=30' }
  ],
  'math_geo_mo:nim': [
    { algo: 'math_geo_mo', mode: 'nim', role: '① Nim 异或和判定', why: '观察各堆石子的二进制异或和 XOR：非零为先手必胜态（必存在一步使 XOR 归零），零为必败态。', input: '3, 4, 5' },
    { algo: 'math_geo_mo', mode: 'basis', role: '② 异或空间拓展', why: '若题目进一步询问「移除最少石子使得异或和不为 0」等，则需要借助线性基分析异或线性相关性。', input: '3, 4, 5' }
  ]
};


function inferVizKeyFromText(text, fallbackKey) {
  const t = text.toLowerCase();
  if (t.includes('ac自动机') || t.includes('ac 自动机') || t.includes('fail指针') || t.includes('fail 指针')) return 'string_algo:ac';
  if (t.includes('kmp') || t.includes('失配') || t.includes('前缀函数') || t.includes('z函数')) return 'string_algo:kmp';
  if (t.includes('树链剖分') || t.includes('重链')) return 'tree_algo:hld';
  if (t.includes('点分治') || t.includes('重心')) return 'tree_algo:centroid';
  if (t.includes('lca') || t.includes('最近公共祖先') || t.includes('倍增')) return 'tree_algo:lca';
  if (t.includes('线段树') || t.includes('懒标记') || t.includes('lazy')) return 'segtree:lazy';
  if (t.includes('树状数组') || t.includes('lowbit')) return 'bit_st:bit';
  if (t.includes('st表') || t.includes('rmq')) return 'bit_st:st';
  if (t.includes('最大流') || t.includes('dinic') || t.includes('网络流') || t.includes('最小割') || t.includes('费用流')) return 'maxflow:dinic';
  if (t.includes('tarjan') || t.includes('2-sat') || t.includes('强连通') || t.includes('缩点') || t.includes('割点') || t.includes('桥')) return 'graph_tarjan_topo:tarjan';
  if (t.includes('拓扑')) return 'graph_tarjan_topo:topo';
  if (t.includes('spfa') || t.includes('差分约束') || t.includes('负环')) return 'graph_sp_mst:spfa';
  if (t.includes('dijkstra') || t.includes('最短路')) return 'graph_sp_mst:dijkstra';
  if (t.includes('kruskal') || t.includes('最小生成树')) return 'graph_sp_mst:kruskal';
  if (t.includes('并查集')) return 'dsu:dsu';
  if (t.includes('莫队')) return 'math_geo_mo:mo';
  if (t.includes('凸包') || t.includes('半平面交') || t.includes('计算几何') || t.includes('旋转卡壳')) return 'math_geo_mo:hull';
  if (t.includes('线性基') || t.includes('异或空间')) return 'math_geo_mo:basis';
  if (t.includes('莫比乌斯') || t.includes('欧拉筛') || t.includes('杜教筛') || t.includes('线性筛')) return 'math_geo_mo:sieve';
  if (t.includes('矩阵') || t.includes('快速幂') || t.includes('fft') || t.includes('ntt') || t.includes('多项式')) return 'math_geo_mo:pow';
  if (t.includes('nim') || t.includes('博弈') || t.includes('sg函数')) return 'math_geo_mo:nim';
  if (t.includes('状压')) return 'bitmask_dp:tsp';
  if (t.includes('区间dp') || t.includes('区间 dp')) return 'dp_table:interval';
  if (t.includes('编辑距离')) return 'dp_table:edit';
  if (t.includes('背包') || t.includes('dp') || t.includes('动态规划')) return 'dp_table:knapsack';
  if (t.includes('单调栈')) return 'stack_queue_heap:stack';
  if (t.includes('优先队列') || t.includes('小根堆') || t.includes('哈夫曼')) return 'stack_queue_heap:heap';
  if (t.includes('二分')) return 'sort_search:bsearch';
  if (t.includes('归并') || t.includes('逆序对') || t.includes('cdq')) return 'sort_search:merge';
  if (t.includes('bfs') || t.includes('广搜')) return 'dfs_bfs:bfs';
  if (t.includes('dfs') || t.includes('回溯') || t.includes('搜索')) return 'dfs_bfs:dfs';
  return fallbackKey;
}

window.onPillClick = function(subId, label) {
  const doc = DOCS.find(x => x.id === activeId);
  if (!doc) return;
  const content = doc.content || '';
  const idx = content.indexOf(subId);
  let snippet = label;
  if (idx !== -1) {
    const nextMatch = content.slice(idx + subId.length).search(/\n#{1,3}\s+S\d+-\d+/);
    snippet = nextMatch !== -1 ? content.slice(idx, idx + subId.length + nextMatch) : content.slice(idx, idx + 2200);
  }
  vizState.activeSub = { subId, label, snippet };
  if (vizState.open) {
    applyCurrentProblemToViz();
  }
};

document.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && document.activeElement !== document.getElementById('searchInput')) {
    e.preventDefault();
    openCommandPalette();
    return;
  }
  if (e.key === '/' && !inInput) {
    e.preventDefault();
    const inp = document.getElementById('searchInput');
    if (inp) { inp.focus(); inp.select(); }
    return;
  }
  if (e.key === 'Escape' && inInput) {
    e.target.blur();
    return;
  }
  if (e.key === 'Escape') { document.getElementById('noteDrawer')?.classList.remove('open'); if (typeof closeExtModal === 'function') closeExtModal(); }
  if (inInput || !vizState.open) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); vizStep(-1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); vizStep(1); }
  else if (e.key === ' ') { e.preventDefault(); vizTogglePlay(); }
  else if (e.key === '[' && vizState.problemBundle) { e.preventDefault(); selectBundleTool(vizState.bundleIdx - 1); }
  else if (e.key === ']' && vizState.problemBundle) { e.preventDefault(); selectBundleTool(vizState.bundleIdx + 1); }
  else if (e.key === 'Escape') {
    document.getElementById('noteDrawer')?.classList.remove('open');
    if (typeof closeExtModal === 'function') closeExtModal(); e.preventDefault(); toggleVizSidebar(false); }
});

function getProblemVizBundle(doc) {
  if (!doc) return null;
  const sub = (vizState.activeSub && doc.pills && doc.pills.some(p => p.id === vizState.activeSub.subId)) ? vizState.activeSub : null;
  const title = sub ? `${sub.label}` : (doc.title || doc.filename || doc.id);
  const text = sub ? (sub.subId + ' ' + sub.label + ' ' + sub.snippet).toLowerCase() : (doc.id + ' ' + title + ' ' + (doc.content || '').slice(0, 1200)).toLowerCase();
  if (sub) {
    const primary = (ROADMAP.docViz && ROADMAP.docViz[doc.id]) || 'segtree:lazy';
    const subKey = inferVizKeyFromText(text, primary);
    if (COMPLEMENTARY_VIZ[subKey]) {
      return { docId: doc.id, title, tools: COMPLEMENTARY_VIZ[subKey] };
    }
  }

  // Specific multi-tool overrides for compound problems
  if (doc.id.includes('P1462') || text.includes('奥格瑞玛')) {
    return {
      docId: doc.id, title,
      tools: [
        { algo: 'sort_search', mode: 'bsearch', role: '① 外层二分答案', why: '答案（经过城市的最大收费上限）具有单调性：上限越高，可走的城市越多。外层先二分收费上限 mid。', input: '2, 5, 8, 12, 16, 23, 38, 56 | target=23' },
        { algo: 'graph_sp_mst', mode: 'dijkstra', role: '② 内层最短路判定', why: '每次二分出 mid 后，屏蔽所有收费 > mid 的城市，跑堆优化 Dijkstra 判断从 1 到 n 扣血是否不超过 b。', input: '' }
      ]
    };
  }
  if (doc.id.includes('P4568') || text.includes('飞行路线')) {
    return {
      docId: doc.id, title,
      tools: [
        { algo: 'graph_sp_mst', mode: 'dijkstra', role: '① 分层图最短路', why: '将原图复制成 k+1 层：同层边权为原价，跨层免费边权为 0，在扩展状态上直接跑堆优化 Dijkstra。', input: '' },
        { algo: 'stack_queue_heap', mode: 'heap', role: '② 优先队列驱动', why: '分层图点数扩大 k+1 倍，必须依赖小根堆优先队列高效弹出最小花费状态 (u, used)。', input: '1, 2, 9, 4, 5' }
      ]
    };
  }
  if (doc.id.includes('P3254') || text.includes('圆桌问题')) {
    return {
      docId: doc.id, title,
      tools: [
        { algo: 'maxflow', mode: 'dinic', role: '① 建模与最大流匹配', why: '把代表团连向源点（容量为人数）、餐桌连向汇点（容量为座位数）、中间两两连容量为 1 的边，满流即有解。', input: '' },
        { algo: 'dfs_bfs', mode: 'bfs', role: '② Dinic 分层搜索', why: 'Dinic 每轮先用 BFS 构建残量网络分层图，再多路增广找完所有可行分配方案。', input: '' }
      ]
    };
  }
  if (doc.id.includes('P2324') || text.includes('骑士精神') || doc.id.includes('P1379') || text.includes('八数码')) {
    return {
      docId: doc.id, title,
      tools: [
        { algo: 'dfs_bfs', mode: 'dfs', role: '① 迭代加深 IDA*', why: '限制最大搜索深度 limit，配合乐观估价函数 h(state) 剪枝，用极小栈空间保证首次搜到即最优。', input: '' },
        { algo: 'dfs_bfs', mode: 'bfs', role: '② 对比 BFS 空间', why: '对比普通 BFS 按层扩展波纹：虽然能保证最短步数，但棋盘状态数达千万级会直接爆内存。', input: '' }
      ]
    };
  }
  if (doc.id.includes('P1972') || text.includes('hh的项链')) {
    return {
      docId: doc.id, title,
      tools: [
        { algo: 'bit_st', mode: 'bit', role: '① 离线扫描+树状数组', why: '按查询右端点排序，用树状数组只保留每种颜色最后一次出现的位置 (+1/-1)，单次查询 O(log n)。', input: '3, 1, 4, 1, 5, 9, 2, 6' },
        { algo: 'math_geo_mo', mode: 'mo', role: '② 莫队通用解法', why: '也可以直接套用普通莫队分块排序，通过左右指针增减颜色频次桶 O(n sqrt(n)) 统计区间种类数。', input: '[1,4],[2,6],[0,2],[3,7],[1,5]' }
      ]
    };
  }
  if (doc.id.includes('P2024') || text.includes('食物链') || doc.id.includes('P1196') || text.includes('银河英雄传说')) {
    return {
      docId: doc.id, title,
      tools: [
        { algo: 'dsu', mode: 'dsu', role: '① 扩展域/带权并查集', why: '在并查集路径压缩的同时维护节点间相对关系（同类/天敌偏移量或到队头距离），O(alpha(n)) 判定矛盾。', input: '' },
        { algo: 'graph_tarjan_topo', mode: 'tarjan', role: '② 关系图视角对比', why: '把给定约束看作无向/有向关系图中的连通块维护，并查集正是专门处理动态连通性与等价类合并的利器。', input: '' }
      ]
    };
  }
  if (doc.id.includes('P1939') || text.includes('矩阵加速')) {
    return {
      docId: doc.id, title,
      tools: [
        { algo: 'math_geo_mo', mode: 'pow', role: '① 矩阵快速幂', why: '线性递推式写成状态向量乘以转移矩阵 T^n，利用快速幂的二进制拆分思想将 O(n) 递推降至 O(k^3 log n)。', input: '3^13 mod 1000' },
        { algo: 'dp_table', mode: 'knapsack', role: '② 线性递推对比', why: '当 n <= 10^6 时可直接线性 DP 填表；当 n 达到 10^9~10^18 时必须把转移写成矩阵并套用快速幂。', input: '' }
      ]
    };
  }

  // General fallback using primary ROADMAP.docViz + COMPLEMENTARY_VIZ
  const primary = (ROADMAP.docViz && ROADMAP.docViz[doc.id]) || 'segtree:lazy';
  if (COMPLEMENTARY_VIZ[primary]) {
    return {
      docId: doc.id,
      title,
      tools: COMPLEMENTARY_VIZ[primary]
    };
  }
  const [pa, pm] = primary.split(':');
  return {
    docId: doc.id,
    title,
    tools: [
      { algo: pa, mode: pm, role: '① 核心算法引擎', why: `用「${pa}:${pm}」演示本题的核心数据结构与状态转移过程。`, input: '' },
      { algo: 'dfs_bfs', mode: 'dfs', role: '② 状态空间直觉', why: '对照递归搜索树理解状态枚举与剪枝/记忆化的本质联系。', input: '' }
    ]
  };
}

window.applyCurrentProblemToViz = function() {
  const doc = DOCS.find(x => x.id === activeId);
  if (!doc) {
    toggleVizSidebar(true);
    return;
  }
  const bundle = getProblemVizBundle(doc);
  vizState.problemBundle = bundle;
  vizState.bundleIdx = 0;
  const first = bundle.tools[0];
  vizState.algo = first.algo;
  vizState.mode = first.mode;
  vizState.customInput = first.input || '';
  vizState.open = true;
  const el = document.getElementById('vizSidebar');
  if (el) el.classList.add('open');
  const layoutEl = document.querySelector('.layout');
  if (layoutEl) layoutEl.classList.add('viz-open-layout');
  const sb = document.getElementById('sidebar');
  if (sb && !sb.classList.contains('collapsed')) sb.classList.add('collapsed');
  stopVizPlay();
  buildVizFrames();
  renderVizSidebar();
};

window.selectBundleTool = function(idx) {
  if (!vizState.problemBundle) return;
  const tools = vizState.problemBundle.tools;
  if (idx < 0 || idx >= tools.length) return;
  stopVizPlay();
  vizState.bundleIdx = idx;
  const t = tools[idx];
  vizState.algo = t.algo;
  vizState.mode = t.mode;
  vizState.customInput = t.input || '';
  buildVizFrames();
  renderVizSidebar();
};

window.clearProblemBundle = function() {
  vizState.problemBundle = null;
  vizState.bundleIdx = 0;
  renderVizSidebar();
};

window.toggleVizSidebar = function(forceState, hint) {
  const _slug = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc';
  if (_slug !== 'icpc' && forceState !== false) {
    const mDrawer = document.getElementById('wb-mastery-drawer');
    if (mDrawer) {
      if (forceState === true) mDrawer.classList.add('open');
      else mDrawer.classList.toggle('open');
      if (mDrawer.classList.contains('open') && window.innerWidth <= 900 && typeof window.setSidebarOpen === 'function') {
        window.setSidebarOpen(false);
      }
      const vizTab = mDrawer.querySelector('[data-ms-tab="viz"], button[data-tab="viz"]');
      if (vizTab) vizTab.click();
      return;
    }
  }
  if (typeof forceState === 'boolean') vizState.open = forceState;
  else vizState.open = !vizState.open;
  if (hint && hint.includes(':')) {
    const [a, m] = hint.split(':');
    vizState.algo = a;
    vizState.mode = m;
    vizState.customInput = '';
  }
  const el = document.getElementById('vizSidebar');
  if (el) el.classList.toggle('open', vizState.open);
  const layoutEl = document.querySelector('.layout');
  if (layoutEl) layoutEl.classList.toggle('viz-open-layout', vizState.open);
  if (vizState.open) {
    if (typeof window.setSidebarOpen === 'function') window.setSidebarOpen(false);
    else {
      const sb = document.getElementById('sidebar');
      if (sb && !sb.classList.contains('collapsed')) sb.classList.add('collapsed');
    }
    buildVizFrames();
    renderVizSidebar();
  } else {
    stopVizPlay();
  }
};

window.toggleVizWide = function() {
  vizState.wide = !vizState.wide;
  if (vizState.wide) vizState.fullscreen = false;
  const el = document.getElementById('vizSidebar');
  if (el) { el.classList.toggle('wide', vizState.wide); el.classList.remove('fullscreen'); }
  renderVizSidebar();
};
window.toggleVizFullscreen = function() {
  vizState.fullscreen = !vizState.fullscreen;
  const el = document.getElementById('vizSidebar');
  if (el) el.classList.toggle('fullscreen', vizState.fullscreen);
  renderVizSidebar();
};

window.selectVizAlgo = function(algoId) {
  stopVizPlay();
  const cat = VIZ_CATALOG.find(c => c.id === algoId) || VIZ_CATALOG[0];
  vizState.algo = cat.id;
  vizState.mode = cat.modes[0].id;
  vizState.customInput = '';
  buildVizFrames();
  renderVizSidebar();
};

window.selectVizMode = function(modeId) {
  stopVizPlay();
  vizState.mode = modeId;
  vizState.customInput = '';
  buildVizFrames();
  renderVizSidebar();
};

window.applyVizInput = function() {
  stopVizPlay();
  const inp = document.getElementById('vizCustomInput');
  vizState.customInput = inp ? inp.value.trim() : '';
  buildVizFrames();
  renderVizSidebar();
};

function stopVizPlay() {
  if (vizState.timer) { clearInterval(vizState.timer); vizState.timer = null; }
}

window.vizStep = function(delta) {
  stopVizPlay();
  if (!vizState.frames.length) return;
  vizState.idx = Math.max(0, Math.min(vizState.frames.length - 1, vizState.idx + delta));
  renderVizFrameOnly();
  initVizResizer();
};

window.vizReset = function() {
  stopVizPlay();
  vizState.idx = 0;
  renderVizFrameOnly();
};

window.vizTogglePlay = function() {
  if (vizState.timer) {
    stopVizPlay();
    renderVizFrameOnly();
    return;
  }
  if (vizState.idx >= vizState.frames.length - 1) vizState.idx = 0;
  vizState.timer = setInterval(() => {
    if (vizState.idx < vizState.frames.length - 1) {
      vizState.idx++;
      renderVizFrameOnly();
    } else {
      stopVizPlay();
      renderVizFrameOnly();
    }
  }, vizState.speed);
  renderVizFrameOnly();
};

window.vizSeek = function(val) {
  stopVizPlay();
  vizState.idx = parseInt(val, 10) || 0;
  renderVizFrameOnly();
};

function getDefaultInputHint(algo, mode) {
  const hints = {
    'sort_search:merge': '5, 2, 4, 7, 1, 3, 6',
    'sort_search:quick': '6, 2, 8, 1, 5, 3, 7 | k=3',
    'sort_search:bsearch': '2, 5, 8, 12, 16, 23, 38, 56 | target=23',
    'stack_queue_heap:stack': '4, 2, 6, 3, 5, 1',
    'stack_queue_heap:heap': '1, 2, 9, 4, 5',
    'dfs_bfs:dfs': 'n=3 (1..3 全排列)',
    'dfs_bfs:bfs': '5x5 网格起点(0,0)->终点(4,4)',
    'dsu:dsu': 'U(1,2), U(3,4), U(2,4), F(1), U(5,6), U(1,6), F(3)',
    'bit_st:bit': '3, 1, 4, 1, 5, 9, 2, 6',
    'bit_st:st': '4, 7, 2, 9, 5, 1, 8, 3 | query(2,6)',
    'segtree:lazy': '1, 3, 5, 7, 2, 4 | add(1,4,+3), sum(2,5)',
    'dp_table:knapsack': 'W=7 | (w:2,v:3),(w:3,v:4),(w:4,v:5),(w:5,v:7)',
    'dp_table:interval': '4, 5, 9, 4',
    'dp_table:edit': 'horse -> ros',
    'bitmask_dp:tsp': '4城市 TSP 经典矩阵',
    'graph_sp_mst:dijkstra': '5点6边经典有向图',
    'graph_sp_mst:spfa': '4点含负权边/负环示例',
    'graph_sp_mst:kruskal': '6点9边无向带权图',
    'graph_tarjan_topo:tarjan': '6点有向图缩点',
    'graph_tarjan_topo:topo': '6门课程先修依赖 DAG',
    'tree_algo:lca': '7节点树 query LCA(5, 6)',
    'tree_algo:hld': '8节点树重链剖分',
    'tree_algo:centroid': '7节点树求重心',
    'maxflow:dinic': 'S(0)->1,2->3,4->T(5) 经典流网络',
    'string_algo:kmp': 'ABABCABAB | ABAB',
    'string_algo:ac': 'he, she, hers, his | ushers',
    'math_geo_mo:hull': '(0,0),(2,1),(1,3),(4,2),(3,0),(2,2),(0,3)',
    'math_geo_mo:mo': '[1,4],[2,6],[0,2],[3,7],[1,5]',
    'math_geo_mo:basis': '5, 12, 9, 6',
    'math_geo_mo:sieve': 'n=30',
    'math_geo_mo:pow': '3^13 mod 1000',
    'math_geo_mo:nim': '3, 4, 5'
  };
  return hints[`${algo}:${mode}`] || '';
}

function parseNums(str, fallback) {
  if (!str) return fallback;
  const nums = str.match(/-?\d+/g);
  return nums && nums.length ? nums.map(Number).slice(0, 14) : fallback;
}

function renderBarsSvg(arr, highlights = {}, labels = {}) {
  const maxV = Math.max(1, ...arr.map(Math.abs));
  const w = 380, h = 150, pad = 16;
  const bw = Math.min(36, (w - pad * 2) / Math.max(1, arr.length) - 4);
  const gap = (w - pad * 2 - bw * arr.length) / Math.max(1, arr.length);
  let svg = `<svg viewBox="0 0 ${w} ${h + 30}" class="viz-svg">`;
  arr.forEach((v, i) => {
    const x = pad + i * (bw + gap) + gap / 2;
    const bh = Math.max(14, (Math.abs(v) / maxV) * (h - 30));
    const y = h - bh;
    const fill = highlights[i] === 'green' ? 'var(--green)'
      : highlights[i] === 'amber' ? 'var(--amber)'
      : highlights[i] === 'accent' ? 'var(--accent)'
      : 'rgba(148,163,184,0.35)';
    svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="6" fill="${fill}" stroke="var(--border-strong)"/>`;
    svg += `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" font-size="11" fill="var(--text)" font-weight="600">${v}</text>`;
    svg += `<text x="${(x + bw / 2).toFixed(1)}" y="${h + 14}" text-anchor="middle" font-size="10" fill="var(--muted)">${labels[i] || i}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

function renderGraphSvg(nodes, edges, nodeColors = {}, edgeColors = {}, nodeBadges = {}) {
  let svg = `<svg viewBox="0 0 380 220" class="viz-svg">
    <defs><marker id="v-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="var(--muted)"/></marker></defs>`;
  edges.forEach((e, idx) => {
    const u = nodes[e.u], v = nodes[e.v];
    if (!u || !v) return;
    const col = edgeColors[idx] === 'green' ? 'var(--green)'
      : edgeColors[idx] === 'amber' ? 'var(--amber)'
      : edgeColors[idx] === 'accent' ? 'var(--accent)'
      : 'var(--border-strong)';
    const sw = edgeColors[idx] ? 2.8 : 1.6;
    const dx = v.x - u.x, dy = v.y - u.y, len = Math.hypot(dx, dy) || 1;
    const r = 17;
    const x1 = u.x + (dx / len) * r, y1 = u.y + (dy / len) * r;
    const x2 = v.x - (dx / len) * (e.dir ? r + 3 : r), y2 = v.y - (dy / len) * (e.dir ? r + 3 : r);
    svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${sw}" ${e.dir ? 'marker-end="url(#v-arrow)"' : ''}/>`;
    if (e.label !== undefined) {
      const mx = (u.x + v.x) / 2 - (dy / len) * 9;
      const my = (u.y + v.y) / 2 + (dx / len) * 9;
      svg += `<rect x="${mx - 14}" y="${my - 8}" width="28" height="15" rx="4" fill="var(--bg)" stroke="${col}" stroke-width="0.8"/>`;
      svg += `<text x="${mx}" y="${my + 3}" text-anchor="middle" font-size="10" fill="var(--text)" font-weight="600">${e.label}</text>`;
    }
  });
  nodes.forEach((n, i) => {
    const fill = nodeColors[i] === 'green' ? 'var(--green)'
      : nodeColors[i] === 'amber' ? 'var(--amber)'
      : nodeColors[i] === 'accent' ? 'var(--accent)'
      : 'var(--card)';
    const txtCol = nodeColors[i] ? '#fff' : 'var(--text)';
    svg += `<circle cx="${n.x}" cy="${n.y}" r="16" fill="${fill}" stroke="var(--border-strong)" stroke-width="1.6"/>`;
    svg += `<text x="${n.x}" y="${n.y + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="${txtCol}">${n.label !== undefined ? n.label : i}</text>`;
    if (nodeBadges[i] !== undefined) {
      svg += `<text x="${n.x}" y="${n.y - 20}" text-anchor="middle" font-size="10" font-weight="600" fill="var(--accent)">${nodeBadges[i]}</text>`;
    }
  });
  svg += `</svg>`;
  return svg;
}

function buildVizFrames() {
  const { algo, mode, customInput } = vizState;
  const frames = [];

  if (algo === 'sort_search') {
    if (mode === 'merge') {
      const a = parseNums(customInput, [5, 2, 4, 7, 1, 3, 6]);
      let inv = 0;
      frames.push({ html: renderBarsSvg([...a]), msg: `初始数组 [${a.join(', ')}]，准备自底向上归并排序并统计逆序对。` });
      let arr = [...a];
      for (let sz = 1; sz < arr.length; sz *= 2) {
        for (let l = 0; l < arr.length; l += 2 * sz) {
          const mid = Math.min(l + sz, arr.length), r = Math.min(l + 2 * sz, arr.length);
          if (mid >= r) continue;
          const hl = {};
          for (let k = l; k < mid; k++) hl[k] = 'accent';
          for (let k = mid; k < r; k++) hl[k] = 'amber';
          frames.push({ html: renderBarsSvg([...arr], hl), msg: `合并区间 [${l}..${mid - 1}] 与 [${mid}..${r - 1}]（当前逆序对 = ${inv}）` });
          let i = l, j = mid, tmp = [];
          while (i < mid && j < r) {
            if (arr[i] <= arr[j]) tmp.push(arr[i++]);
            else { inv += (mid - i); tmp.push(arr[j++]); }
          }
          while (i < mid) tmp.push(arr[i++]);
          while (j < r) tmp.push(arr[j++]);
          for (let k = 0; k < tmp.length; k++) arr[l + k] = tmp[k];
          const hl2 = {};
          for (let k = l; k < r; k++) hl2[k] = 'green';
          frames.push({ html: renderBarsSvg([...arr], hl2), msg: `区间 [${l}..${r - 1}] 合并完成，累计逆序对 = ${inv}` });
        }
      }
    } else if (mode === 'quick') {
      const parts = customInput.split('|');
      const arr = parseNums(parts[0], [6, 2, 8, 1, 5, 3, 7]);
      const k = parts[1] ? (parseInt(parts[1].replace(/\D/g, ''), 10) || 3) : 3;
      const targetIdx = Math.max(0, Math.min(arr.length - 1, k - 1));
      frames.push({ html: renderBarsSvg([...arr]), msg: `QuickSelect 寻找第 ${k} 小元素（目标下标 ${targetIdx}）` });
      let l = 0, r = arr.length - 1;
      while (l <= r) {
        const pivot = arr[r];
        let i = l;
        for (let j = l; j < r; j++) {
          if (arr[j] <= pivot) { [arr[i], arr[j]] = [arr[j], arr[i]]; i++; }
        }
        [arr[i], arr[r]] = [arr[r], arr[i]];
        const hl = {};
        for (let x = l; x <= r; x++) hl[x] = x === i ? 'amber' : (x < i ? 'accent' : '');
        frames.push({ html: renderBarsSvg([...arr], hl), msg: `以 pivot=${pivot} 划分 [${l}..${r}]，落点下标 ${i}` });
        if (i === targetIdx) {
          frames.push({ html: renderBarsSvg([...arr], { [i]: 'green' }), msg: `命中！第 ${k} 小元素为 ${arr[i]}（下标 ${i}）` });
          break;
        } else if (i < targetIdx) l = i + 1;
        else r = i - 1;
      }
    } else {
      const parts = customInput.split('|');
      const arr = parseNums(parts[0], [2, 5, 8, 12, 16, 23, 38, 56]).sort((x, y) => x - y);
      const target = parts[1] ? (parseInt(parts[1].replace(/[^-\d]/g, ''), 10) || 23) : 23;
      let l = 0, r = arr.length - 1;
      frames.push({ html: renderBarsSvg(arr), msg: `有序数组二分查找 target = ${target}` });
      while (l <= r) {
        const mid = (l + r) >> 1;
        const hl = {};
        for (let x = l; x <= r; x++) hl[x] = 'accent';
        hl[mid] = 'amber';
        frames.push({ html: renderBarsSvg(arr, hl, { [l]: 'L', [mid]: 'M', [r]: 'R' }), msg: `L=${l}, R=${r}, mid=${mid} (值=${arr[mid]})` });
        if (arr[mid] === target) {
          frames.push({ html: renderBarsSvg(arr, { [mid]: 'green' }), msg: `找到目标 ${target}，位于下标 ${mid}！` });
          break;
        } else if (arr[mid] < target) l = mid + 1;
        else r = mid - 1;
      }
      if (l > r) frames.push({ html: renderBarsSvg(arr, {}), msg: `L > R，数组中不存在 ${target}（插入位置为 ${l}）。` });
    }
  } else if (algo === 'stack_queue_heap') {
    if (mode === 'stack') {
      const arr = parseNums(customInput, [4, 2, 6, 3, 5, 1]);
      const st = [];
      frames.push({ html: `<div class="viz-box-row">${arr.map(v => `<span class="viz-chip">${v}</span>`).join('')}</div>`, msg: '单调递增栈：依次入栈，遇到更小元素时弹出栈顶。' });
      arr.forEach((v, idx) => {
        while (st.length && st[st.length - 1] > v) {
          const popped = st.pop();
          frames.push({
            html: `<div class="viz-lbl">当前扫描：<b>${v}</b>（弹出 ${popped}）</div><div class="viz-stack">${st.map(x => `<div class="viz-stack-item">${x}</div>`).join('') || '<span class="muted">空栈</span>'}</div>`,
            msg: `arr[${idx}]=${v} < 栈顶 ${popped}，弹出 ${popped} 以维持单调性。`
          });
        }
        st.push(v);
        frames.push({
          html: `<div class="viz-lbl">当前扫描：<b>${v}</b>（入栈）</div><div class="viz-stack">${st.map((x, si) => `<div class="viz-stack-item ${si === st.length - 1 ? 'top' : ''}">${x}</div>`).join('')}</div>`,
          msg: `将 ${v} 压入单调栈，当前栈为 [${st.join(', ')}]。`
        });
      });
    } else {
      let heap = parseNums(customInput, [1, 2, 9, 4, 5]).sort((a, b) => a - b);
      let cost = 0;
      frames.push({ html: `<div class="viz-box-row">${heap.map(x => `<span class="viz-chip">${x}</span>`).join('')}</div>`, msg: `小根堆初始果子堆（已排序）：[${heap.join(', ')}]` });
      while (heap.length > 1) {
        const a = heap.shift(), b = heap.shift();
        const s = a + b;
        cost += s;
        heap.push(s);
        heap.sort((x, y) => x - y);
        frames.push({
          html: `<div class="viz-lbl">合并最小两堆：<b>${a} + ${b} = ${s}</b> | 累计体力：<b>${cost}</b></div><div class="viz-box-row">${heap.map(x => `<span class="viz-chip ${x === s ? 'hi' : ''}">${x}</span>`).join('')}</div>`,
          msg: `取出最小两堆 ${a} 和 ${b} 合并为 ${s}，总代价更新为 ${cost}。`
        });
      }
    }
  } else if (algo === 'dfs_bfs') {
    if (mode === 'dfs') {
      const n = Math.min(4, Math.max(2, parseNums(customInput, [3])[0] || 3));
      const used = Array(n + 1).fill(false), path = [];
      function dfs(step) {
        frames.push({
          html: `<div class="viz-lbl">递归深度：${step} / ${n}</div><div class="viz-box-row">${path.map(x => `<span class="viz-chip hi">${x}</span>`).join('') || '<span class="muted">空路径</span>'}</div><div class="viz-lbl" style="margin-top:10px;">used 状态：${[1,2,3,4].slice(0,n).map(i => `${i}:${used[i]?'✓':'·'}`).join(' ')}</div>`,
          msg: path.length === n ? `✅ 找到一组全排列：[${path.join(', ')}]，准备回溯` : `当前路径 [${path.join(', ')}]，继续枚举下一位`
        });
        if (frames.length > 35 || step === n) return;
        for (let i = 1; i <= n; i++) {
          if (!used[i]) {
            used[i] = true; path.push(i);
            dfs(step + 1);
            path.pop(); used[i] = false;
          }
        }
      }
      dfs(0);
    } else {
      const grid = [[0,0,1,0,0],[0,1,0,0,0],[0,0,0,1,0],[1,1,0,0,0],[0,0,0,1,0]];
      const dist = Array.from({ length: 5 }, () => Array(5).fill(-1));
      dist[0][0] = 0;
      const q = [[0, 0]], dirs = [[1,0],[0,1],[-1,0],[0,-1]];
      const renderG = (cur) => {
        let h = '<div class="viz-grid-5">';
        for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
          const isCur = cur && cur[0] === r && cur[1] === c;
          const cls = grid[r][c] ? 'wall' : (isCur ? 'cur' : (dist[r][c] >= 0 ? 'vis' : ''));
          h += `<div class="viz-cell ${cls}">${grid[r][c] ? '■' : (dist[r][c] >= 0 ? dist[r][c] : '')}</div>`;
        }
        return h + '</div>';
      };
      frames.push({ html: renderG([0, 0]), msg: 'BFS 从起点 (0,0) 出发，目标 (4,4)，黑色为障碍物。' });
      while (q.length) {
        const [r, c] = q.shift();
        if (r === 4 && c === 4) { frames.push({ html: renderG([4, 4]), msg: `✅ 到达终点 (4,4)，最短步数 = ${dist[4][4]}！` }); break; }
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && !grid[nr][nc] && dist[nr][nc] === -1) {
            dist[nr][nc] = dist[r][c] + 1;
            q.push([nr, nc]);
          }
        }
        frames.push({ html: renderG([r, c]), msg: `扩展节点 (${r},${c})（步数 ${dist[r][c]}），队列剩余 ${q.length} 个节点。` });
      }
    }
  } else if (algo === 'dsu') {
    const fa = [0, 1, 2, 3, 4, 5, 6];
    const ops = [['U',1,2],['U',3,4],['U',2,4],['F',1],['U',5,6],['U',1,6],['F',3]];
    const drawDsu = (hl = {}) => {
      const roots = [];
      for (let i = 1; i <= 6; i++) if (fa[i] === i) roots.push(i);
      const nodes = [{ x: -50, y: -50, label: '' }];
      const edges = [];
      // Simple level layout
      const depth = i => fa[i] === i ? 0 : 1 + depth(fa[i]);
      const xs = [0, 45, 105, 165, 225, 285, 340];
      for (let i = 1; i <= 6; i++) {
        nodes.push({ x: xs[i], y: 45 + depth(i) * 65, label: i });
      }
      for (let i = 1; i <= 6; i++) {
        if (fa[i] !== i) edges.push({ u: i, v: fa[i], dir: true });
      }
      const nc = {};
      Object.keys(hl).forEach(k => nc[k] = hl[k]);
      return renderGraphSvg(nodes.slice(1), edges.map(e => ({ u: e.u - 1, v: e.v - 1, dir: true })), nc);
    };
    frames.push({ html: drawDsu(), msg: '初始 6 个独立集合：{1} {2} {3} {4} {5} {6}' });
    ops.forEach(op => {
      if (op[0] === 'U') {
        let u = op[1], v = op[2];
        const find = x => fa[x] === x ? x : find(fa[x]);
        const ru = find(u), rv = find(v);
        if (ru !== rv) fa[ru] = rv;
        frames.push({ html: drawDsu({ [u - 1]: 'amber', [v - 1]: 'green' }), msg: `Union(${u}, ${v})：根 ${ru} 挂到根 ${rv} 下方。` });
      } else {
        const x = op[1];
        let cur = x, path = [];
        while (fa[cur] !== cur) { path.push(cur); cur = fa[cur]; }
        path.forEach(p => { fa[p] = cur; });
        frames.push({ html: drawDsu({ [x - 1]: 'accent', [cur - 1]: 'green' }), msg: `Find(${x}) 路径压缩：沿途节点 [${path.join(',')}] 直接指向根 ${cur}！` });
      }
    });
  } else if (algo === 'bit_st') {
    const arr = parseNums(customInput, [3, 1, 4, 1, 5, 9, 2, 6]).slice(0, 8);
    while (arr.length < 8) arr.push(1);
    if (mode === 'bit') {
      const bit = Array(9).fill(0);
      const add = (i, v) => { for (; i <= 8; i += i & -i) bit[i] += v; };
      arr.forEach((v, idx) => add(idx + 1, v));
      const renderBit = (vis = [], msgPrefix = '') => {
        let h = '<div class="viz-bit-table">';
        for (let i = 1; i <= 8; i++) {
          const lb = i & -i;
          const active = vis.includes(i);
          h += `<div class="viz-bit-col ${active ? 'active' : ''}">
            <div class="viz-bit-val">${bit[i]}</div>
            <div class="viz-bit-idx">c[${i}]</div>
            <div class="viz-bit-rng">[${i - lb + 1}..${i}]</div>
          </div>`;
        }
        return h + '</div>';
      };
      frames.push({ html: renderBit(), msg: `树状数组建树完成，c[i] 管辖区间长度为 lowbit(i)。` });
      const visAdd = [];
      for (let i = 3; i <= 8; i += i & -i) { bit[i] += 5; visAdd.push(i); }
      frames.push({ html: renderBit(visAdd), msg: `单点加 add(3, +5)：沿 i += lowbit(i) 跳步更新 c[${visAdd.join(', c[')}]。` });
      const visQ = []; let sum = 0;
      for (let i = 7; i > 0; i -= i & -i) { sum += bit[i]; visQ.push(i); }
      frames.push({ html: renderBit(visQ), msg: `前缀和 query(7)：沿 i -= lowbit(i) 累加 c[${visQ.join(', c[')}]，结果 = ${sum}。` });
    } else {
      const st = arr.map(v => [v]);
      for (let j = 1; j <= 3; j++) {
        for (let i = 0; i + (1 << j) <= 8; i++) {
          st[i][j] = Math.max(st[i][j - 1], st[i + (1 << (j - 1))][j - 1]);
        }
      }
      const renderSt = (hl = {}) => {
        let h = '<table class="viz-tbl"><tr><th>i\\j</th><th>2^0</th><th>2^1</th><th>2^2</th><th>2^3</th></tr>';
        for (let i = 0; i < 8; i++) {
          h += `<tr><th>${i}</th>` + [0,1,2,3].map(j => `<td class="${hl[`${i},${j}`] || ''}">${st[i][j] !== undefined ? st[i][j] : '-'}</td>`).join('') + '</tr>';
        }
        return h + '</table>';
      };
      frames.push({ html: renderSt(), msg: 'ST 表预处理完成：st[i][j] 表示从 i 开始长 2^j 的最大值。' });
      frames.push({ html: renderSt({ '2,2': 'hi', '3,2': 'hi' }), msg: `查询区间 [2, 6] 最大值：len=5, k=floor(log2(5))=2，合并 st[2][2]=${st[2][2]} 与 st[3][2]=${st[3][2]} → ${Math.max(st[2][2], st[3][2])}（O(1) 幂等重叠）！` });
    }
  } else if (algo === 'segtree') {
    const a = parseNums(customInput.split('|')[0], [1, 3, 5, 7, 2, 4]).slice(0, 6);
    while (a.length < 4) a.push(1);
    const n = a.length;
    const tree = Array(4 * n).fill(0), lazy = Array(4 * n).fill(0);
    const build = (p, l, r) => {
      if (l === r) { tree[p] = a[l]; return; }
      const m = (l + r) >> 1;
      build(p * 2, l, m); build(p * 2 + 1, m + 1, r);
      tree[p] = tree[p * 2] + tree[p * 2 + 1];
    };
    build(1, 0, n - 1);
    const drawSeg = (hl = {}) => {
      const nodes = [], edges = [];
      let mapIdx = {};
      const layout = (p, l, r, x, y, dx) => {
        const idx = nodes.length;
        mapIdx[p] = idx;
        nodes.push({ x, y, label: `${tree[p]}${lazy[p] ? '+' + lazy[p] : ''}`, sub: `[${l},${r}]`, p });
        if (l < r) {
          const m = (l + r) >> 1;
          const lc = layout(p * 2, l, m, x - dx, y + 52, dx * 0.52);
          const rc = layout(p * 2 + 1, m + 1, r, x + dx, y + 52, dx * 0.52);
          edges.push({ u: idx, v: lc }, { u: idx, v: rc });
        }
        return idx;
      };
      layout(1, 0, n - 1, 190, 28, 92);
      let svg = `<svg viewBox="0 0 380 215" class="viz-svg">`;
      edges.forEach(e => {
        svg += `<line x1="${nodes[e.u].x}" y1="${nodes[e.u].y}" x2="${nodes[e.v].x}" y2="${nodes[e.v].y}" stroke="var(--border-strong)" stroke-width="1.5"/>`;
      });
      nodes.forEach(nd => {
        const st = hl[nd.p];
        const fill = st === 'green' ? 'var(--green)' : (st === 'amber' ? 'var(--amber)' : (st === 'accent' ? 'var(--accent)' : 'var(--card)'));
        svg += `<rect x="${nd.x - 24}" y="${nd.y - 14}" width="48" height="28" rx="8" fill="${fill}" stroke="var(--border-strong)"/>`;
        svg += `<text x="${nd.x}" y="${nd.y + 3}" text-anchor="middle" font-size="11" font-weight="700" fill="${st ? '#fff' : 'var(--text)'}">${nd.label}</text>`;
        svg += `<text x="${nd.x}" y="${nd.y + 24}" text-anchor="middle" font-size="9" fill="var(--muted)">${nd.sub}</text>`;
      });
      return svg + `</svg>`;
    };
    frames.push({ html: drawSeg(), msg: `线段树建树完成（节点显示 sum 或 sum+lazy）。` });
    const pushDown = (p, l, r) => {
      if (lazy[p]) {
        const m = (l + r) >> 1;
        tree[p * 2] += lazy[p] * (m - l + 1); lazy[p * 2] += lazy[p];
        tree[p * 2 + 1] += lazy[p] * (r - m); lazy[p * 2 + 1] += lazy[p];
        lazy[p] = 0;
      }
    };
    const update = (p, l, r, ql, qr, v) => {
      if (ql <= l && r <= qr) {
        tree[p] += v * (r - l + 1); lazy[p] += v;
        frames.push({ html: drawSeg({ [p]: 'amber' }), msg: `区间 [${l},${r}] 完全被包含，打上 Lazy 标记 +${v}！` });
        return;
      }
      pushDown(p, l, r);
      const m = (l + r) >> 1;
      if (ql <= m) update(p * 2, l, m, ql, qr, v);
      if (qr > m) update(p * 2 + 1, m + 1, r, ql, qr, v);
      tree[p] = tree[p * 2] + tree[p * 2 + 1];
      frames.push({ html: drawSeg({ [p]: 'accent' }), msg: `PushUp 回溯更新节点 [${l},${r}] 区间和 = ${tree[p]}` });
    };
    update(1, 0, n - 1, 1, Math.min(n - 1, 3), 3);
    const query = (p, l, r, ql, qr) => {
      if (ql <= l && r <= qr) {
        frames.push({ html: drawSeg({ [p]: 'green' }), msg: `查询命中节点 [${l},${r}]，直接返回 ${tree[p]}` });
        return tree[p];
      }
      pushDown(p, l, r);
      frames.push({ html: drawSeg({ [p]: 'accent' }), msg: `查询经过 [${l},${r}]，先 PushDown 下传懒标记` });
      const m = (l + r) >> 1; let s = 0;
      if (ql <= m) s += query(p * 2, l, m, ql, qr);
      if (qr > m) s += query(p * 2 + 1, m + 1, r, ql, qr);
      return s;
    };
    const ans = query(1, 0, n - 1, 2, n - 1);
    frames.push({ html: drawSeg({ 1: 'green' }), msg: `✅ 区间 [2, ${n - 1}] 查询总和 = ${ans}` });
  } else if (algo === 'dp_table') {
    if (mode === 'knapsack') {
      const items = [[2,3],[3,4],[4,5],[5,7]], W = 7;
      const dp = Array.from({ length: 5 }, () => Array(W + 1).fill(0));
      const renderDp = (ri, rj, src1, src2) => {
        const legend = `<div class="viz-legend-row">
          <span class="viz-legend-item"><i class="viz-legend-dot hi"></i>当前格 dp[i][j]</span>
          <span class="viz-legend-item"><i class="viz-legend-dot src"></i>转移来源 dp[i-1][j] / dp[i-1][j-w]</span>
          <span class="viz-legend-item"><i class="viz-legend-dot filled"></i>已得出最优值</span>
        </div>`;
        let h = legend + '<table class="viz-tbl"><tr><th>物品 \\ 容量</th>' + Array.from({ length: W + 1 }, (_, j) => `<th>j=${j}</th>`).join('') + '</tr>';
        for (let i = 0; i <= 4; i++) {
          h += `<tr><th>${i === 0 ? '0 空集' : `#${i} (w=${items[i-1][0]}, v=${items[i-1][1]})`}</th>`;
          for (let j = 0; j <= W; j++) {
            let cls = '';
            if (i === ri && j === rj) cls = 'hi';
            else if ((src1 && src1[0] === i && src1[1] === j) || (src2 && src2[0] === i && src2[1] === j)) cls = 'src';
            else if (dp[i][j] > 0) cls = 'filled';
            h += `<td class="${cls}">${dp[i][j]}</td>`;
          }
          h += '</tr>';
        }
        return h + '</table>';
      };
      frames.push({ html: renderDp(-1, -1, null, null), msg: '初始空表（容量 W=7）：dp[i][j] = max(不选: dp[i-1][j], 选: dp[i-1][j-w] + v)' });
      for (let i = 1; i <= 4; i++) {
        const [w, v] = items[i - 1];
        for (let j = 0; j <= W; j++) {
          const skip = dp[i - 1][j];
          const take = j >= w ? dp[i - 1][j - w] + v : -1;
          dp[i][j] = Math.max(skip, take);
          if (j >= w && (take > skip || j === W)) {
            const pickText = take > skip
              ? `选物品#${i}更优：max(不选=${skip}, 选=${dp[i-1][j-w]}+${v}=${take}) → ${dp[i][j]}`
              : `维持不选：max(不选=${skip}, 选=${dp[i-1][j-w]}+${v}=${take}) → ${dp[i][j]}`;
            frames.push({
              html: renderDp(i, j, [i - 1, j], [i - 1, j - w]),
              msg: `第 ${i} 件(w=${w}, v=${v})，容量 j=${j}：${pickText}`
            });
          }
        }
      }
    } else if (mode === 'interval') {
      const a = parseNums(customInput, [4, 5, 9, 4]).slice(0, 5);
      const n = a.length, pre = [0];
      a.forEach(x => pre.push(pre[pre.length - 1] + x));
      const dp = Array.from({ length: n }, () => Array(n).fill(0));
      const renderI = (li, lj) => {
        let h = '<table class="viz-tbl"><tr><th>L\\R</th>' + a.map((_, j) => `<th>${j}</th>`).join('') + '</tr>';
        for (let i = 0; i < n; i++) {
          h += `<tr><th>${i}</th>` + a.map((_, j) => `<td class="${i===li&&j===lj?'hi':''}">${j<i?'·':dp[i][j]}</td>`).join('') + '</tr>';
        }
        return h + '</table>';
      };
      frames.push({ html: renderI(-1, -1), msg: `区间 DP 石子合并 [${a.join(', ')}]：按区间长度 len 从小到大转移。` });
      for (let len = 2; len <= n; len++) {
        for (let l = 0; l + len - 1 < n; l++) {
          const r = l + len - 1;
          dp[l][r] = 1e9;
          for (let k = l; k < r; k++) {
            dp[l][r] = Math.min(dp[l][r], dp[l][k] + dp[k + 1][r] + pre[r + 1] - pre[l]);
          }
          frames.push({ html: renderI(l, r), msg: `区间 [${l},${r}] 最小合并代价 dp[${l}][${r}] = ${dp[l][r]}` });
        }
      }
    } else {
      const s1 = 'horse', s2 = 'ros';
      const dp = Array.from({ length: s1.length + 1 }, () => Array(s2.length + 1).fill(0));
      for (let i = 0; i <= s1.length; i++) dp[i][0] = i;
      for (let j = 0; j <= s2.length; j++) dp[0][j] = j;
      const renderE = (ri, rj) => {
        let h = '<table class="viz-tbl"><tr><th></th><th>""</th>' + [...s2].map(c => `<th>${c}</th>`).join('') + '</tr>';
        for (let i = 0; i <= s1.length; i++) {
          h += `<tr><th>${i===0?'""':s1[i-1]}</th>` + dp[i].map((v, j) => `<td class="${i===ri&&j===rj?'hi':''}">${v}</td>`).join('') + '</tr>';
        }
        return h + '</table>';
      };
      frames.push({ html: renderE(0, 0), msg: `编辑距离：将 "${s1}" 变为 "${s2}" 的最小插入/删除/替换次数。` });
      for (let i = 1; i <= s1.length; i++) {
        for (let j = 1; j <= s2.length; j++) {
          dp[i][j] = s1[i - 1] === s2[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
        frames.push({ html: renderE(i, s2.length), msg: `匹配前 ${i} 个字符 "${s1.slice(0, i)}" 完成，dp[${i}][${s2.length}] = ${dp[i][s2.length]}` });
      }
    }
  } else if (algo === 'bitmask_dp') {
    const n = 4;
    const dist = [[0,10,15,20],[10,0,35,25],[15,35,0,30],[20,25,30,0]];
    const dp = Array.from({ length: 1 << n }, () => Array(n).fill(999));
    dp[1][0] = 0;
    const fmtMask = m => m.toString(2).padStart(4, '0');
    frames.push({ html: `<div class="viz-lbl">4 城市 TSP 状压 DP：mask = ${fmtMask(1)} (仅访问 0 号点)</div>`, msg: '初始状态 dp[0001][0] = 0，其余为 ∞。' });
    for (let mask = 1; mask < (1 << n); mask++) {
      for (let u = 0; u < n; u++) {
        if (!(mask & (1 << u)) || dp[mask][u] >= 999) continue;
        for (let v = 0; v < n; v++) {
          if (mask & (1 << v)) continue;
          const nmask = mask | (1 << v);
          if (dp[mask][u] + dist[u][v] < dp[nmask][v]) {
            dp[nmask][v] = dp[mask][u] + dist[u][v];
            frames.push({
              html: `<div class="viz-lbl">状态转移：<b>${fmtMask(mask)}</b> (在城市${u}) → <b>${fmtMask(nmask)}</b> (到达城市${v})</div><div class="viz-box-row"><span class="viz-chip hi">dp[${fmtMask(nmask)}][${v}] = ${dp[nmask][v]}</span></div>`,
              msg: `新集合 ${fmtMask(nmask)}，由城市 ${u} 走边 (${u}→${v}, 权${dist[u][v]}) 更新为 ${dp[nmask][v]}`
            });
          }
        }
      }
    }
  } else if (algo === 'graph_sp_mst') {
    const nodes = [{ x: 55, y: 110, label: '0' }, { x: 150, y: 45, label: '1' }, { x: 150, y: 175, label: '2' }, { x: 265, y: 45, label: '3' }, { x: 325, y: 120, label: '4' }];
    if (mode === 'dijkstra') {
      const edges = [{ u:0,v:1,label:4,dir:1 },{ u:0,v:2,label:1,dir:1 },{ u:2,v:1,label:2,dir:1 },{ u:1,v:3,label:1,dir:1 },{ u:2,v:3,label:5,dir:1 },{ u:3,v:4,label:3,dir:1 }];
      const dist = [0, 999, 999, 999, 999], vis = {};
      frames.push({ html: renderGraphSvg(nodes, edges, { 0: 'accent' }, {}, { 0: 'd=0', 1: '∞', 2: '∞', 3: '∞', 4: '∞' }), msg: 'Dijkstra 从源点 0 出发，dist[0] = 0。' });
      for (let step = 0; step < 5; step++) {
        let u = -1;
        for (let i = 0; i < 5; i++) if (!vis[i] && (u === -1 || dist[i] < dist[u])) u = i;
        if (u === -1 || dist[u] >= 999) break;
        vis[u] = 'green';
        const ec = {};
        edges.forEach((e, ei) => {
          if (e.u === u && dist[u] + e.label < dist[e.v]) {
            dist[e.v] = dist[u] + e.label;
            ec[ei] = 'amber';
          }
        });
        const badges = {};
        dist.forEach((d, i) => badges[i] = d >= 999 ? '∞' : `d=${d}`);
        frames.push({ html: renderGraphSvg(nodes, edges, { ...vis, [u]: 'accent' }, ec, badges), msg: `弹出堆顶最小节点 ${u} (dist=${dist[u]})，松弛所有出边。` });
      }
    } else if (mode === 'spfa') {
      const edges = [{ u:0,v:1,label:3,dir:1 },{ u:1,v:2,label:-4,dir:1 },{ u:2,v:3,label:2,dir:1 },{ u:3,v:1,label:1,dir:1 }];
      const n4 = nodes.slice(0, 4);
      const dist = [0, 999, 999, 999], cnt = [0, 0, 0, 0];
      const q = [0];
      let iter = 0;
      frames.push({ html: renderGraphSvg(n4, edges, { 0: 'accent' }, {}, { 0: 'd=0' }), msg: 'SPFA 负环检测：1→2(-4)→3(2)→1(1) 构成权和 -1 的负环！' });
      while (q.length && iter < 12) {
        iter++;
        const u = q.shift();
        const ec = {};
        edges.forEach((e, ei) => {
          if (e.u === u && dist[u] + e.label < dist[e.v]) {
            dist[e.v] = dist[u] + e.label;
            cnt[e.v] = cnt[u] + 1;
            ec[ei] = 'amber';
            q.push(e.v);
          }
        });
        const badges = {}; dist.forEach((d, i) => badges[i] = d >= 999 ? '∞' : `d=${d}(${cnt[i]})`);
        const neg = cnt.some(c => c >= 4);
        frames.push({ html: renderGraphSvg(n4, edges, { [u]: neg ? 'amber' : 'accent' }, ec, badges), msg: neg ? `⚠️ 检测到入队/松弛次数 ≥ N，存在负环！` : `队头 ${u} 出队松弛出边，dist = [${dist.join(', ')}]` });
        if (neg) break;
      }
    } else {
      const edges = [{ u:0,v:2,label:1 },{ u:1,v:2,label:2 },{ u:1,v:3,label:1 },{ u:3,v:4,label:3 },{ u:0,v:1,label:4 },{ u:2,v:3,label:5 }];
      const fa = [0,1,2,3,4], find = x => fa[x]===x?x:(fa[x]=find(fa[x]));
      const ec = {};
      frames.push({ html: renderGraphSvg(nodes, edges), msg: 'Kruskal 最小生成树：将所有边按边权从小到大排序。' });
      edges.forEach((e, ei) => {
        const ru = find(e.u), rv = find(e.v);
        if (ru !== rv) { fa[ru] = rv; ec[ei] = 'green'; }
        else ec[ei] = 'amber';
        frames.push({ html: renderGraphSvg(nodes, edges, {}, { ...ec }), msg: `考察边 (${e.u}-${e.v}, 权${e.label})：${ru !== rv ? '✅ 合并连通块' : '❌ 同集合跳过(防成环)'}` });
      });
    }
  } else if (algo === 'graph_tarjan_topo') {
    const nodes = [{ x: 60, y: 65, label: '0' }, { x: 165, y: 40, label: '1' }, { x: 165, y: 155, label: '2' }, { x: 270, y: 65, label: '3' }, { x: 325, y: 155, label: '4' }];
    if (mode === 'topo') {
      const edges = [{ u:0,v:1,dir:1 },{ u:0,v:2,dir:1 },{ u:1,v:3,dir:1 },{ u:2,v:3,dir:1 },{ u:3,v:4,dir:1 }];
      const ind = [0, 1, 1, 2, 1], q = [0], nc = {};
      frames.push({ html: renderGraphSvg(nodes, edges, {}, {}, { 0:'in=0',1:'in=1',2:'in=1',3:'in=2',4:'in=1' }), msg: 'Kahn 拓扑排序：入度为 0 的节点 [0] 入队。' });
      const res = [];
      while (q.length) {
        const u = q.shift(); res.push(u); nc[u] = 'green';
        edges.forEach(e => { if (e.u === u) { ind[e.v]--; if (ind[e.v] === 0) q.push(e.v); } });
        const b = {}; ind.forEach((v, i) => b[i] = nc[i] ? '✓' : `in=${v}`);
        frames.push({ html: renderGraphSvg(nodes, edges, { ...nc }, {}, b), msg: `出队 ${u}，当前拓扑序：[${res.join(' → ')}]` });
      }
    } else {
      const edges = [{ u:0,v:1,dir:1 },{ u:1,v:2,dir:1 },{ u:2,v:0,dir:1 },{ u:1,v:3,dir:1 },{ u:3,v:4,dir:1 },{ u:4,v:3,dir:1 }];
      frames.push({ html: renderGraphSvg(nodes, edges), msg: 'Tarjan 缩点：寻找强连通分量 (SCC)，同色节点将被缩为一个新点。' });
      frames.push({ html: renderGraphSvg(nodes, edges, { 0:'accent',1:'accent',2:'accent' }, {}, { 0:'1/1',1:'2/1',2:'3/1' }), msg: 'DFS 发现环 0→1→2→0，dfn=low=1，弹出栈形成 SCC #1 {0,1,2}。' });
      frames.push({ html: renderGraphSvg(nodes, edges, { 0:'accent',1:'accent',2:'accent',3:'green',4:'green' }, {}, { 0:'SCC1',1:'SCC1',2:'SCC1',3:'SCC2',4:'SCC2' }), msg: '发现强连通分量 SCC #2 {3,4}，缩点后形成 2 个节点的 DAG！' });
    }
  } else if (algo === 'tree_algo') {
    const nodes = [{ x: 190, y: 28, label: '1' }, { x: 110, y: 85, label: '2' }, { x: 270, y: 85, label: '3' }, { x: 65, y: 155, label: '4' }, { x: 150, y: 155, label: '5' }, { x: 235, y: 155, label: '6' }, { x: 315, y: 155, label: '7' }];
    const edges = [{ u:0,v:1 },{ u:0,v:2 },{ u:1,v:3 },{ u:1,v:4 },{ u:2,v:5 },{ u:2,v:6 }];
    if (mode === 'lca') {
      frames.push({ html: renderGraphSvg(nodes, edges, { 3:'accent', 4:'amber' }, {}, { 3:'depth=2', 4:'depth=2' }), msg: '倍增求 LCA(4, 5)：两节点深度相同（depth=2），同时向上倍增试探。' });
      frames.push({ html: renderGraphSvg(nodes, edges, { 1:'green', 3:'accent', 4:'amber' }, { 2:'green', 3:'green' }), msg: 'fa[4][0] === fa[5][0] === 2，直接找到最近公共祖先 LCA = 2！' });
    } else if (mode === 'hld') {
      frames.push({ html: renderGraphSvg(nodes, edges, { 0:'accent',1:'accent',3:'accent' }, { 0:'accent',2:'accent' }, { 0:'sz=7',1:'sz=3',2:'sz=3' }), msg: '树链剖分：每个节点选子树最大的儿子为重儿子（蓝色粗边构成重链 1-2-4）。' });
      frames.push({ html: renderGraphSvg(nodes, edges, { 0:'accent',1:'accent',3:'accent',2:'green',5:'green' }, { 0:'accent',2:'accent',4:'green' }), msg: '重链 1-2-4 与 3-6 配合线段树，任意树上路径只需跳 O(log n) 条重链！' });
    } else {
      frames.push({ html: renderGraphSvg(nodes, edges, { 0:'green' }, {}, { 0:'maxSub=3' }), msg: '点分治找重心：节点 1 的最大子树大小为 3 (≤ 7/2)，故 1 为树重心！' });
      frames.push({ html: renderGraphSvg(nodes, edges, { 0:'amber',1:'accent',2:'accent' }), msg: '统计经过重心 1 的路径后，删除重心 1，递归分治左子树 {2,4,5} 与右子树 {3,6,7}。' });
    }
  } else if (algo === 'maxflow') {
    const nodes = [{ x: 45, y: 110, label: 'S' }, { x: 145, y: 50, label: '1' }, { x: 145, y: 170, label: '2' }, { x: 255, y: 50, label: '3' }, { x: 255, y: 170, label: '4' }, { x: 340, y: 110, label: 'T' }];
    const e0 = [{u:0,v:1,label:'0/10',dir:1},{u:0,v:2,label:'0/8',dir:1},{u:1,v:3,label:'0/5',dir:1},{u:1,v:2,label:'0/2',dir:1},{u:2,v:4,label:'0/10',dir:1},{u:3,v:5,label:'0/7',dir:1},{u:4,v:5,label:'0/10',dir:1}];
    frames.push({ html: renderGraphSvg(nodes, e0, {0:'accent',5:'green'}), msg: 'Dinic 最大流：BFS 构建分层图，从 S 寻找增广路到达 T。' });
    const e1 = [{u:0,v:1,label:'5/10',dir:1},{u:0,v:2,label:'0/8',dir:1},{u:1,v:3,label:'5/5',dir:1},{u:1,v:2,label:'0/2',dir:1},{u:2,v:4,label:'0/10',dir:1},{u:3,v:5,label:'5/7',dir:1},{u:4,v:5,label:'0/10',dir:1}];
    frames.push({ html: renderGraphSvg(nodes, e1, {0:'accent',1:'amber',3:'amber',5:'green'}, {0:'amber',2:'amber',5:'amber'}), msg: '第一轮 DFS 增广路径 S→1→3→T，瓶颈容量 = 5，累计最大流 = 5。' });
    const e2 = [{u:0,v:1,label:'7/10',dir:1},{u:0,v:2,label:'8/8',dir:1},{u:1,v:3,label:'5/5',dir:1},{u:1,v:2,label:'2/2',dir:1},{u:2,v:4,label:'10/10',dir:1},{u:3,v:5,label:'5/7',dir:1},{u:4,v:5,label:'10/10',dir:1}];
    frames.push({ html: renderGraphSvg(nodes, e2, {0:'accent',2:'green',4:'green',5:'green'}, {1:'green',3:'green',4:'green',6:'green'}), msg: '✅ 第二轮沿着 S→2→4→T (增广8) 及 S→1→2→4→T (增广2)，总最大流 = 15！' });
  } else if (algo === 'string_algo') {
    if (mode === 'kmp') {
      const parts = customInput.split('|');
      const txt = (parts[0] || 'ABABCABAB').trim(), pat = (parts[1] || 'ABAB').trim();
      const next = Array(pat.length).fill(0);
      for (let i = 1, j = 0; i < pat.length; i++) {
        while (j > 0 && pat[i] !== pat[j]) j = next[j - 1];
        if (pat[i] === pat[j]) j++;
        next[i] = j;
      }
      const renderKmp = (ti, pj, match) => `
        <div class="viz-lbl">next 数组：[${next.join(', ')}]</div>
        <div class="viz-kmp-row">${[...txt].map((c, i) => `<span class="viz-char ${i === ti ? 'cur' : ''}">${c}</span>`).join('')}</div>
        <div class="viz-kmp-row" style="padding-left:${Math.max(0, (ti - pj) * 26)}px;">${[...pat].map((c, j) => `<span class="viz-char ${match ? 'ok' : (j === pj ? 'cur' : '')}">${c}</span>`).join('')}</div>`;
      frames.push({ html: renderKmp(0, 0, false), msg: `KMP 匹配：主串 "${txt}"，模式串 "${pat}"，已预处理 next=[${next.join(',')}]。` });
      let j = 0;
      for (let i = 0; i < txt.length && frames.length < 25; i++) {
        while (j > 0 && txt[i] !== pat[j]) {
          j = next[j - 1];
          frames.push({ html: renderKmp(i, j, false), msg: `失配！模式串指针 j 回跳到 next[j-1] = ${j}（主串 i=${i} 不回退）` });
        }
        if (txt[i] === pat[j]) j++;
        if (j === pat.length) {
          frames.push({ html: renderKmp(i, j - 1, true), msg: `✅ 完全匹配！起始位置 = ${i - pat.length + 1}` });
          j = next[j - 1];
        }
      }
    } else {
      const nodes = [{ x: 190, y: 25, label: 'root' }, { x: 100, y: 95, label: 'h' }, { x: 280, y: 95, label: 's' }, { x: 70, y: 165, label: 'e' }, { x: 150, y: 165, label: 'i' }, { x: 280, y: 165, label: 'h' }];
      const edges = [{u:0,v:1,label:'h',dir:1},{u:0,v:2,label:'s',dir:1},{u:1,v:3,label:'e',dir:1},{u:1,v:4,label:'i',dir:1},{u:2,v:5,label:'h',dir:1},{u:5,v:1,label:'fail',dir:1}];
      frames.push({ html: renderGraphSvg(nodes, edges, {0:'accent'}, {5:'amber'}), msg: 'AC 自动机：Trie 树 + 橙色 Fail 失配指针，实现多模式串 O(N) 一次扫描匹配！' });
      frames.push({ html: renderGraphSvg(nodes, edges, {2:'green',5:'green',1:'amber'}, {1:'green',4:'green',5:'amber'}), msg: '匹配 "sh..." 时在节点 s→h 处通过 fail 指针直接跳到同后缀节点 h，继续识别 "he"！' });
    }
  } else if (algo === 'math_geo_mo') {
    if (mode === 'hull') {
      const pts = [[0,0],[2,1],[1,3],[4,2],[3,0],[2,2],[0,3]];
      const drawPts = (hull = []) => {
        let svg = `<svg viewBox="0 0 380 200" class="viz-svg">`;
        if (hull.length > 1) {
          const d = hull.map((p, i) => `${i === 0 ? 'M' : 'L'} ${40 + p[0] * 70} ${170 - p[1] * 45}`).join(' ') + (hull.length > 2 ? ' Z' : '');
          svg += `<path d="${d}" fill="rgba(59,130,246,0.16)" stroke="var(--accent)" stroke-width="2.2"/>`;
        }
        pts.forEach(p => {
          const inH = hull.some(h => h[0] === p[0] && h[1] === p[1]);
          svg += `<circle cx="${40 + p[0] * 70}" cy="${170 - p[1] * 45}" r="5.5" fill="${inH ? 'var(--green)' : 'var(--muted)'}"/>`;
          svg += `<text x="${46 + p[0] * 70}" y="${165 - p[1] * 45}" font-size="10" fill="var(--text)">(${p[0]},${p[1]})</text>`;
        });
        return svg + `</svg>`;
      };
      frames.push({ html: drawPts([]), msg: 'Andrew 二维凸包：先按 (x, y) 排序，再用叉积维护下凸壳与上凸壳。' });
      frames.push({ html: drawPts([[0,0],[3,0],[4,2]]), msg: '下凸壳扫描：剔除右拐点 (2,1)，保留极点 (0,0)→(3,0)→(4,2)。' });
      frames.push({ html: drawPts([[0,0],[3,0],[4,2],[1,3],[0,3]]), msg: '✅ 上凸壳合并完成：凸包顶点逆时针依次为 (0,0),(3,0),(4,2),(1,3),(0,3)。' });
    } else if (mode === 'mo') {
      const arr = [1, 2, 1, 3, 2, 1, 4, 3];
      const queries = [[1,4],[2,6],[0,2],[3,7]];
      frames.push({ html: renderBarsSvg(arr, {1:'accent',2:'accent',3:'accent',4:'accent'}), msg: '莫队算法：按左端点所在块编号、右端点奇偶排序，指针 [L, R] 均摊 O(N√Q) 移动。' });
      queries.sort((a, b) => Math.floor(a[0] / 3) - Math.floor(b[0] / 3) || a[1] - b[1]).forEach(([l, r]) => {
        const hl = {}; for (let i = l; i <= r; i++) hl[i] = 'green';
        frames.push({ html: renderBarsSvg(arr, hl, { [l]: 'L', [r]: 'R' }), msg: `移动指针至区间 [${l}, ${r}]，窗口内元素频率实时增减。` });
      });
    } else if (mode === 'basis') {
      const nums = parseNums(customInput, [5, 12, 9, 6]).slice(0, 6);
      const b = Array(5).fill(0);
      const renderB = (cur) => `<div class="viz-lbl">当前插入数字：<b>${cur}</b> (${cur.toString(2).padStart(5,'0')})</div>` +
        b.map((v, i) => `<div class="viz-basis-row"><span>bit ${i}:</span><code>${v ? v.toString(2).padStart(5,'0') + ' (' + v + ')' : '00000 (空)'}</code></div>`).reverse().join('');
      frames.push({ html: renderB(0), msg: `线性基插入 [${nums.join(', ')}]：从高位到低位尝试异或消元。` });
      nums.forEach(x => {
        let cur = x;
        for (let i = 4; i >= 0; i--) {
          if ((cur >> i) & 1) {
            if (!b[i]) { b[i] = cur; break; }
            cur ^= b[i];
          }
        }
        frames.push({ html: renderB(x), msg: `数字 ${x} 处理完毕，当前线性基张成的最大异或和可由高位贪心求得。` });
      });
    } else if (mode === 'sieve') {
      const n = 24, isC = Array(n + 1).fill(false), primes = [];
      const renderS = (hl) => '<div class="viz-sieve">' + Array.from({ length: n - 1 }, (_, k) => {
        const x = k + 2;
        return `<span class="viz-num ${x === hl ? 'cur' : (isC[x] ? 'comp' : 'pri')}">${x}</span>`;
      }).join('') + '</div>';
      frames.push({ html: renderS(0), msg: '欧拉线性筛：每个合数只被它的最小质因子筛掉一次，复杂度严格 O(N)。' });
      for (let i = 2; i <= n; i++) {
        if (!isC[i]) primes.push(i);
        for (const p of primes) {
          if (i * p > n) break;
          isC[i * p] = true;
          frames.push({ html: renderS(i * p), msg: `i=${i}, p=${p} → 筛去合数 ${i * p}${i % p === 0 ? '（i % p == 0，立即 break 保证线性）' : ''}` });
          if (i % p === 0) break;
        }
      }
    } else if (mode === 'pow') {
      let a = 3, b = 13, mod = 1000, res = 1;
      frames.push({ html: `<div class="viz-lbl">计算 ${a}^${b} mod ${mod}，指数 ${b} 二进制 = <b>${b.toString(2)}</b></div>`, msg: '快速幂：按指数二进制位拆分，遇到 1 就将当前底数乘入答案。' });
      while (b > 0) {
        const bit = b & 1;
        if (bit) res = (res * a) % mod;
        frames.push({
          html: `<div class="viz-box-row"><span class="viz-chip">当前位: ${bit}</span><span class="viz-chip hi">res = ${res}</span><span class="viz-chip">base = ${a}</span></div>`,
          msg: `最低位=${bit}，${bit ? '乘入 res' : '跳过'}，base 平方取模。`
        });
        a = (a * a) % mod;
        b >>= 1;
      }
    } else {
      const piles = parseNums(customInput, [3, 4, 5]).slice(0, 5);
      const xorSum = piles.reduce((acc, x) => acc ^ x, 0);
      frames.push({
        html: piles.map((p, i) => `<div class="viz-basis-row"><span>第 ${i+1} 堆 (${p}):</span><code>${p.toString(2).padStart(5,'0')}</code></div>`).join('') +
          `<div class="viz-basis-row" style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px;"><span><b>异或和 SG:</b></span><code><b>${xorSum.toString(2).padStart(5,'0')} (${xorSum})</b></code></div>`,
        msg: xorSum !== 0 ? `异或和 = ${xorSum} ≠ 0：先手必胜！可将某堆减少使其异或和归 0。` : `异或和 = 0：先手必败！无论怎么取，异或和都会变成非 0。`
      });
    }
  }

  vizState.frames = frames;
  vizState.idx = 0;
}

function morphVizDom(oldNode, newNode) {
  if (!oldNode || !newNode) return false;
  if (oldNode.nodeType !== newNode.nodeType) return false;
  if (oldNode.nodeType === 3) {
    if (oldNode.textContent !== newNode.textContent) oldNode.textContent = newNode.textContent;
    return true;
  }
  if (oldNode.nodeType !== 1) return true;
  if (oldNode.tagName !== newNode.tagName) return false;

  const newAttrs = newNode.attributes;
  const oldAttrs = oldNode.attributes;
  for (let i = oldAttrs.length - 1; i >= 0; i--) {
    const name = oldAttrs[i].name;
    if (!newNode.hasAttribute(name)) oldNode.removeAttribute(name);
  }
  let changed = false;
  for (let i = 0; i < newAttrs.length; i++) {
    const { name, value } = newAttrs[i];
    if (oldNode.getAttribute(name) !== value) {
      oldNode.setAttribute(name, value);
      changed = true;
    }
  }

  if (oldNode.tagName.toLowerCase() === 'svg' || oldNode.classList.contains('viz-box-row') || oldNode.classList.contains('viz-stack')) {
    const oldKids = Array.from(oldNode.children);
    const newKids = Array.from(newNode.children);
    const minLen = Math.min(oldKids.length, newKids.length);
    for (let i = 0; i < minLen; i++) {
      if (!morphVizDom(oldKids[i], newKids[i])) {
        const clone = newKids[i].cloneNode(true);
        clone.classList?.add('viz-soft-enter');
        oldNode.replaceChild(clone, oldKids[i]);
      }
    }
    for (let i = minLen; i < newKids.length; i++) {
      const clone = newKids[i].cloneNode(true);
      clone.classList?.add('viz-soft-enter');
      oldNode.appendChild(clone);
    }
    for (let i = oldKids.length - 1; i >= minLen; i--) {
      oldNode.removeChild(oldKids[i]);
    }
    return true;
  }

  if (oldNode.children.length !== newNode.children.length) return false;
  if (oldNode.children.length === 0) {
    if (oldNode.textContent !== newNode.textContent) {
      oldNode.textContent = newNode.textContent;
      changed = true;
    }
    if (changed && oldNode.classList && (oldNode.classList.contains('viz-cell') || oldNode.classList.contains('viz-chip'))) {
      oldNode.classList.remove('viz-pop');
      requestAnimationFrame(() => oldNode.classList.add('viz-pop'));
    }
    return true;
  }
  for (let i = 0; i < oldNode.children.length; i++) {
    if (!morphVizDom(oldNode.children[i], newNode.children[i])) return false;
  }
  return true;
}

window.setVizSpeed = function(ms) {
  vizState.speed = ms;
  if (vizState.timer) {
    clearInterval(vizState.timer);
    vizState.timer = setInterval(() => {
      if (vizState.idx < vizState.frames.length - 1) { vizState.idx++; renderVizFrameOnly(); }
      else { stopVizPlay(); renderVizFrameOnly(); }
    }, vizState.speed);
  }
  document.querySelectorAll('.viz-speed-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.ms) === ms);
  });
};

function renderVizFrameOnly() {
  const f = vizState.frames[vizState.idx] || { html: '', msg: '' };
  const stage = document.getElementById('vizStage');
  const msgEl = document.getElementById('vizMsg');
  const stepEl = document.getElementById('vizStepLabel');
  const slider = document.getElementById('vizSlider');
  const playBtn = document.getElementById('vizPlayBtn');
  if (stage) {
    const prevBoxes = [];
    const trackEls = stage.querySelectorAll('svg rect, svg circle, .viz-chip, .viz-stack-item');
    trackEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) prevBoxes.push(r);
      else prevBoxes.push(null);
    });

    const tmp = document.createElement('div');
    tmp.innerHTML = f.html;
    let morphed = false;
    if (stage.children.length === tmp.children.length && stage.children.length > 0) {
      morphed = true;
      for (let i = 0; i < stage.children.length; i++) {
        if (!morphVizDom(stage.children[i], tmp.children[i])) {
          morphed = false;
          break;
        }
      }
    }
    if (!morphed) {
      stage.innerHTML = f.html;
      stage.classList.remove('viz-stage-enter');
      requestAnimationFrame(() => stage.classList.add('viz-stage-enter'));
    } else {
      const nextEls = stage.querySelectorAll('svg rect, svg circle, .viz-chip, .viz-stack-item');
      const count = Math.min(prevBoxes.length, nextEls.length);
      for (let i = 0; i < count; i++) {
        const pb = prevBoxes[i];
        if (!pb) continue;
        const el = nextEls[i];
        const nb = el.getBoundingClientRect();
        const dx = pb.left - nb.left;
        const dy = pb.top - nb.top;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          el.style.transition = 'none';
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          requestAnimationFrame(() => {
            el.style.transition = 'transform 0.36s cubic-bezier(0.22, 1, 0.36, 1), fill 0.28s ease, stroke 0.28s ease';
            el.style.transform = '';
          });
        }
      }
    }
  }
  if (msgEl && msgEl.textContent !== f.msg) {
    msgEl.textContent = f.msg;
    msgEl.classList.remove('viz-msg-anim');
    requestAnimationFrame(() => msgEl.classList.add('viz-msg-anim'));
  }
  if (stepEl) stepEl.textContent = `${vizState.idx + 1} / ${vizState.frames.length}`;
  renderVizCodeTrace(f.msg || '');
  if (slider) { slider.max = Math.max(0, vizState.frames.length - 1); slider.value = vizState.idx; }
  if (playBtn) playBtn.textContent = vizState.timer ? '⏸ 暂停' : '▶ 自动播放';
}

window.setVizInfoTab = function(tab) {
  vizState.infoTab = (vizState.infoTab === tab) ? 'none' : tab;
  renderVizSidebar();
};

function renderVizSidebar() {
  const el = document.getElementById('vizSidebar');
  if (!el) return;
  const cat = VIZ_CATALOG.find(c => c.id === vizState.algo) || VIZ_CATALOG[0];
  const hint = getDefaultInputHint(vizState.algo, vizState.mode);
  const b = vizState.problemBundle;
  const curTool = (b && b.tools && b.tools.length) ? (b.tools[vizState.bundleIdx] || b.tools[0]) : null;

  const bundlePillsHtml = b && b.tools ? `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
      <div class="viz-bundle-tabs" style="margin:0;">
        ${b.tools.map((t, i) => {
          const cObj = VIZ_CATALOG.find(c => c.id === t.algo);
          const mObj = cObj ? cObj.modes.find(m => m.id === t.mode) : null;
          const mName = mObj ? mObj.label : t.mode;
          return `<button class="viz-bundle-tab ${i === vizState.bundleIdx ? 'active' : ''}" onclick="selectBundleTool(${i})">${escapeHtml(t.role)} · ${escapeHtml(mName)}</button>`;
        }).join('')}
      </div>
      <button class="btn" style="padding:2px 8px;font-size:11px;" onclick="clearProblemBundle()">退出联动</button>
    </div>` : (activeId ? `<div><button class="btn btn-primary" style="width:100%;font-size:12.5px;padding:7px 12px;" onclick="applyCurrentProblemToViz()">一键将当前题目应用到多工具联合可视化</button></div>` : '');

  const controlsHtml = `
    <div class="viz-controls-top">
      <select class="viz-select" aria-label="选择可视化算法" onchange="selectVizAlgo(this.value)">
        <option value="" disabled>请选择可视化算法模块...</option>
        ${VIZ_CATALOG.map(c => `<option value="${c.id}" ${c.id === vizState.algo ? 'selected' : ''}>算法模块：${c.name}</option>`).join('')}
      </select>
      <div class="viz-mode-pills">
        ${cat.modes.map(m => `<button class="btn ${m.id === vizState.mode ? 'btn-primary' : ''}" style="padding:4px 10px;font-size:12px;" onclick="selectVizMode('${m.id}')">${m.label}</button>`).join('')}
      </div>
      <div class="viz-input-row">
        <input id="vizCustomInput" class="viz-input" type="text" value="${escapeHtml(vizState.customInput)}" placeholder="自定义输入，如：${escapeHtml(hint)}" />
        <button class="btn" style="padding:5px 11px;font-size:12px;" onclick="applyVizInput()">应用</button>
      </div>
    </div>`;

  const whyHtml = curTool ? `
    <div class="viz-bundle-why">
      <strong style="color:var(--accent);">${escapeHtml(b.title)} · ${escapeHtml(curTool.role)}：</strong>${escapeHtml(curTool.why)}
    </div>` : '<div style="color:var(--muted);font-size:12px;">当前为自由探索模式，可点击上方「一键应用」关联具体题目。</div>';

  const rightOrDrawerHtml = vizState.fullscreen ? `
    <div class="viz-studio-right">
      <div style="font-weight:700;font-size:13px;color:var(--text);">讲解与状态追踪</div>
      ${whyHtml}
      <div style="font-weight:700;font-size:13px;color:var(--text);margin-top:4px;">同步代码追踪</div>
      <div class="viz-code-trace" id="vizCodeTrace"></div>
      <div style="font-weight:700;font-size:13px;color:var(--text);margin-top:4px;">算法与输入参数</div>
      ${controlsHtml}
    </div>` : `
    <div class="viz-studio-right">
      <div class="viz-info-tabs">
        ${curTool ? `<button class="viz-info-tab ${vizState.infoTab==='why'?'active':''}" onclick="setVizInfoTab('why')">题目讲解</button>` : ''}
        <button class="viz-info-tab ${vizState.infoTab==='code'?'active':''}" onclick="setVizInfoTab('code')">同步代码</button>
        <button class="viz-info-tab ${vizState.infoTab==='params'?'active':''}" onclick="setVizInfoTab('params')">切换/参数</button>
      </div>
      ${vizState.infoTab === 'why' ? `<div class="viz-info-panel">${whyHtml}</div>` : ''}
      <div class="viz-code-trace" id="vizCodeTrace" style="display:${vizState.infoTab==='code'?'block':'none'};"></div>
      ${vizState.infoTab === 'params' ? `<div class="viz-info-panel">${controlsHtml}</div>` : ''}
    </div>`;

  el.innerHTML = `
    <div class="viz-resizer" id="vizResizer" title="拖拽调整侧栏宽度"></div>
    <div class="viz-head">
      <div>
        <div style="font-weight:700;font-size:15px;">${(!window.__WB_CONFIG__ || window.__WB_CONFIG__.slug === "icpc") ? "算法可视化实验室" : (window.__WB_CONFIG__.slug === "c4" ? "微积分可视化实验室" : "交互可视化实验室")}</div>
        <div style="font-size:11.5px;color:var(--muted);">Canvas-First 画布优先 · 14 大核心引擎</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn" style="padding:4px 10px;font-size:12px;" onclick="toggleVizQuiz()" title="VisuAlgo 风格随机随堂自测">随堂测</button>
        <button class="btn" style="padding:4px 10px;font-size:12px;" onclick="toggleVizWide()">${vizState.wide ? '标准' : '加宽'}</button>
        <button class="btn" style="padding:4px 10px;font-size:12px;" onclick="toggleVizFullscreen()" title="左右双栏大画布">${vizState.fullscreen ? '🗗 退出' : '⛶ 大画布'}</button>
        <button class="btn" style="padding:4px 10px;font-size:12px;" onclick="toggleVizSidebar(false)">×</button>
      </div>
    </div>

    ${bundlePillsHtml}
    ${renderVizQuizCard()}

    <div class="viz-studio-grid">
      <div class="viz-studio-left">
        <div class="viz-stage" id="vizStage"></div>
        <div class="viz-msg" id="vizMsg"></div>
        <div class="viz-player">
          <div class="viz-player-btns">
            <button class="btn" style="padding:5px 10px;font-size:12px;" onclick="vizReset()">⏮</button>
            <button class="btn" style="padding:5px 10px;font-size:12px;" onclick="vizStep(-1)">◀</button>
            <button id="vizPlayBtn" class="btn btn-primary" style="padding:5px 14px;font-size:12px;" onclick="vizTogglePlay()">▶ 自动播放</button>
            <button class="btn" style="padding:5px 10px;font-size:12px;" onclick="vizStep(1)">▶</button>
            <div class="viz-speed-group" title="动画播放速度">
              <button class="viz-speed-btn ${vizState.speed===1100?'active':''}" data-ms="1100" onclick="setVizSpeed(1100)">0.5x</button>
              <button class="viz-speed-btn ${vizState.speed===650?'active':''}" data-ms="650" onclick="setVizSpeed(650)">1x</button>
              <button class="viz-speed-btn ${vizState.speed===380?'active':''}" data-ms="380" onclick="setVizSpeed(380)">1.5x</button>
              <button class="viz-speed-btn ${vizState.speed===220?'active':''}" data-ms="220" onclick="setVizSpeed(220)">2x</button>
            </div>
          </div>
          <div class="viz-slider-row">
            <input id="vizSlider" type="range" min="0" max="${Math.max(0, vizState.frames.length - 1)}" value="${vizState.idx}" oninput="vizSeek(this.value)" />
            <span id="vizStepLabel" style="font-size:12px;color:var(--muted);min-width:48px;text-align:right;"></span>
          </div>
        </div>
      </div>
      ${rightOrDrawerHtml}
    </div>
  `;
  renderVizFrameOnly();
  initVizResizer();
}



const CODE_TRACE_MAP = {
  'sort_search:merge': ['mergesort(l, mid); mergesort(mid+1, r);', 'if (a[i] <= a[j]) tmp[k++] = a[i++];', 'else { inv += mid - i + 1; tmp[k++] = a[j++]; }', 'copy(tmp, a + l);'],
  'sort_search:bsearch': ['int mid = (l + r) >> 1;', 'if (check(mid)) ans = mid, r = mid - 1;', 'else l = mid + 1;'],
  'segtree:lazy': ['if (L <= l && r <= R) { add_tag(p, v); return; }', 'pushdown(p);', 'query/modify(ls); query/modify(rs); pushup(p);'],
  'bit_st:bit': ['for (; x <= n; x += x & -x) tr[x] += v;', 'for (; x > 0; x -= x & -x) sum += tr[x];'],
  'string_algo:kmp': ['while (j && s[i] != p[j+1]) j = nxt[j];', 'if (s[i] == p[j+1]) j++;', 'if (j == m) record_match(), j = nxt[j];'],
  'string_algo:ac': ['q.push(ch[0][c]);', 'fail[v] = ch[fail[u]][c]; q.push(v);', 'for (char c : t) u = ch[u][c], count_fail_chain(u);'],
  'graph_sp_mst:dijkstra': ['auto [d, u] = pq.top(); pq.pop();', 'if (d > dist[u]) continue;', 'if (dist[v] > d + w) dist[v] = d + w, pq.push({dist[v], v});'],
  'graph_tarjan_topo:tarjan': ['dfn[u] = low[u] = ++ts; st.push(u);', 'if (!dfn[v]) tarjan(v), low[u] = min(low[u], low[v]);', 'if (low[u] == dfn[u]) pop_scc_until(u);'],
  'maxflow:dinic': ['while (bfs_level_graph())', '  ans += dfs_augment(S, INF);'],
  'tree_algo:hld': ['dfs1(u): 算重儿子 son[u]', 'dfs2(u, top): 分配连续 dfn[u]', 'while (top[u] != top[v]) seg_query_jump();'],
  'dsu:dsu': ['int find(int x) { return fa[x]==x ? x : fa[x]=find(fa[x]); }', 'fa[find(u)] = find(v);'],
  'dp_table:knapsack': ['for (int w = W; w >= weight[i]; --w)', '  dp[w] = max(dp[w], dp[w - weight[i]] + val[i]);']
};

function renderVizCodeTrace(msg) {
  const el = document.getElementById('vizCodeTrace');
  if (!el) return;
  const key = `${vizState.algo}:${vizState.mode}`;
  const lines = CODE_TRACE_MAP[key];
  if (!lines || !lines.length) { el.style.display = 'none'; return; }
  if (vizState.fullscreen || vizState.infoTab === 'code') el.style.display = 'block';
  let activeLine = 0;
  const m = (msg || '').toLowerCase();
  if (m.includes('完成') || m.includes('结束') || m.includes('结果') || m.includes('缩点')) activeLine = lines.length - 1;
  else if (m.includes('下传') || m.includes('松弛') || m.includes('fail') || m.includes('增广') || m.includes('合并')) activeLine = Math.min(lines.length - 1, 1);
  else if (vizState.frames.length > 1) activeLine = Math.min(lines.length - 1, Math.floor((vizState.idx / vizState.frames.length) * lines.length));
  el.innerHTML = lines.map((ln, i) => `<div class="viz-trace-line ${i === activeLine ? 'active' : ''}">${escapeHtml(ln)}</div>`).join('');
}



function initVizResizer() {
  const resizer = document.getElementById('vizResizer');
  const sb = document.getElementById('vizSidebar');
  if (!resizer || !sb) return;
  resizer.onmousedown = (e) => {
    e.preventDefault();
    resizer.classList.add('dragging');
    const startX = e.clientX;
    const startW = sb.getBoundingClientRect().width;
    const onMove = (me) => { sb.style.width = Math.max(380, Math.min(780, startW + (startX - me.clientX))) + 'px'; };
    const onUp = () => { resizer.classList.remove('dragging'); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
}

let vizQuiz = { open: false, q: '', opts: [], ans: 0, explain: '', picked: -1 };
function generateVizQuiz() {
  const key = `${vizState.algo}:${vizState.mode}`;
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  if (key === 'sort_search:merge') {
    const arr = [r(3, 6), r(1, 3), r(4, 8), r(1, 4)];
    let inv = 0;
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) if (arr[i] > arr[j]) inv++;
    const opts = Array.from(new Set([inv, Math.max(0, inv - 1), inv + 1, inv + 2])).slice(0, 4).sort((a,b)=>a-b);
    return { q: `数组 [${arr.join(', ')}] 有多少个逆序对？`, opts: opts.map(String), ans: opts.indexOf(inv), explain: `共有 ${inv} 个逆序对。` };
  }
  if (key === 'math_geo_mo:nim') {
    const a = r(2, 7), b = r(2, 7), c = r(1, 6);
    const xr = a ^ b ^ c;
    return { q: `Nim 三堆石子 (${a}, ${b}, ${c}) 当前局势？`, opts: ['先手必胜', '先手必败'], ans: xr !== 0 ? 0 : 1, explain: `异或和为 ${xr}。` };
  }
  return { q: 'AC 自动机构建 fail 指针应采用哪种遍历序？', opts: ['BFS 按层序', 'DFS 先序', 'DFS 后序'], ans: 0, explain: '求子节点 fail 依赖父节点 fail，必须 BFS 按层计算。' };
}
window.toggleVizQuiz = function() { vizQuiz.open = !vizQuiz.open; if (vizQuiz.open) Object.assign(vizQuiz, generateVizQuiz(), { picked: -1 }); renderVizSidebar(); };
window.answerVizQuiz = function(i) { vizQuiz.picked = i; renderVizSidebar(); };
function renderVizQuizCard() {
  if (!vizQuiz.open) return '';
  const done = vizQuiz.picked !== -1;
  const ok = done && vizQuiz.picked === vizQuiz.ans;
  return `<div class="viz-quiz-card">
    <div style="display:flex;justify-content:space-between;align-items:center;"><strong>随堂小测</strong><div style="display:flex;gap:4px;"><button class="btn" style="height:24px;padding:0 8px;font-size:11px;" onclick="Object.assign(vizQuiz,generateVizQuiz(),{picked:-1});renderVizSidebar()">换一题</button><button class="btn" style="height:24px;padding:0 8px;font-size:11px;" onclick="toggleVizQuiz()">关闭</button></div></div>
    <div>${escapeHtml(vizQuiz.q)}</div>
    <div class="viz-quiz-opts">${vizQuiz.opts.map((o, i) => `<button class="btn" style="height:28px;padding:0 10px;font-size:12px;${done&&i===vizQuiz.ans?'color:var(--green);':(done&&i===vizQuiz.picked?'color:#ef4444;':'')}" onclick="answerVizQuiz(${i})">${escapeHtml(o)}</button>`).join('')}</div>
    ${done ? `<div style="font-size:12px;color:${ok?'var(--green)':'#ef4444'};">${ok?'回答正确：':'解析：'}${escapeHtml(vizQuiz.explain)}</div>` : ''}
  </div>`;
}


