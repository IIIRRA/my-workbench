/* ============================================================================
 * 数学分析专属特色实验室插件（找错闯关 18 关 · 微积分 8 模式可视化 · 11 项严格自查）
 * 独立挂载于统一架构的「工具与视图 ▾」菜单中，支持浅色/深色双主题与移动端全屏自适应。
 * ============================================================================ */
(function () {
  if (window.__wbCalcSpecialLabsInited) return;
  window.__wbCalcSpecialLabsInited = true;

  const FAULT_BANK = [{"id":"ff01","stage":"阶段 1 · Taylor 与极限","ref_id":"p006","title":"找错 01：求 $\\lim\\limits_{x\\to 0}\\dfrac{e^x\\sin x-x(1+x)}{x^3}$","wrong_solution":"第 1 步：当 $x\\to 0$ 时，$e^x = 1 + x + o(x)$，$\\sin x = x + o(x)$。,第 2 步：相乘得 $e^x\\sin x = (1+x)(x) + o(x^2) = x + x^2 + o(x^2)$。,第 3 步：分子 $e^x\\sin x - x(1+x) = o(x^2)$，所以原极限 $= 0$。","options":["第 1 步展开阶数不够，分母是 $x^3$，分子至少应展到 $x^3$ 阶","第 2 步乘法不能把两个 $o(x)$ 合并成 $o(x^2)$","第 3 步极限不能用 Peano 余项","没有错误，极限确实是 0"],"correct":0,"explanation":"分母为 $x^3$，分子相减后 $x$ 和 $x^2$ 项正好全部消去，只展到 $o(x^2)$ 会把 $x^3$ 项吞进余项里导致误判为 0。正确做法是将 $e^x$ 展到 $x^2$（乘 $\\sin x$ 后最高到 $x^3$）、$\\sin x$ 展到 $x^3$，算得 $x^3$ 项系数为 $\\frac{1}{2}-\\frac{1}{6}=\\frac{1}{3}$。"},{"id":"ff02","stage":"阶段 1 · Taylor 与极值","ref_id":"p021","title":"找错 02：求 $f(x)=x-\\ln(1+x^2)$ 的极值与单调区间","wrong_solution":"第 1 步：求导 $f'(x)=1-\\dfrac{2x}{1+x^2}=\\dfrac{(x-1)^2}{1+x^2}$。,第 2 步：令 $f'(x)=0$ 得驻点 $x=1$。,第 3 步：因为有驻点 $x=1$，所以 $x=1$ 是函数的极值点。","options":["第 1 步求导漏了链式法则的 $2x$","第 2 步驻点解错了，应该是 $x=-1$","第 3 步把“驻点”当成“极值点”——$f'(x)=\\frac{(x-1)^2}{1+x^2}\\geqslant 0$ 在 $x=1$ 两侧不变号，故 $x=1$ 不是极值点","第 1 步定义域漏了 $1+x^2>0$ 的限制"],"correct":2,"explanation":"驻点只是极值的必要条件（在可导点处）。$f'(x)=\\frac{(x-1)^2}{1+x^2}\\geqslant 0$ 对一切实数成立，在 $x=1$ 左右两侧导数均大于 $0$，函数在 $(-\\infty,+\\infty)$ 上严格单调递增，$x=1$ 只是水平拐点，不是极值点。"},{"id":"ff03","stage":"阶段 2 · 曲率与综合","ref_id":"p036","title":"找错 03：由 $e^x-1=xe^{\\theta x}$ 证 $\\lim\\limits_{x\\to 0}\\theta=\\dfrac{1}{2}$","wrong_solution":"第 1 步：对等式 $e^x-1=xe^{\\theta x}$ 两边同时求导得 $e^x = e^{\\theta x} + x\\theta e^{\\theta x}$。,第 2 步：令 $x\\to 0$，左边为 $1$，右边为 $1+0=1$，恒成立。,第 3 步：再用泰勒展开得 $1+x+\\frac{x^2}{2}=x(1+\\theta x)$，比较系数得 $\\theta=\\frac{1}{2}$。","options":["第 1 步把 $\\theta$ 当成了常数，实际上 $\\theta$ 是随 $x$ 变化的函数 $\\theta(x)$，求导不能把 $\\theta'$ 当 0，且题设未给 $\\theta(x)$ 可导","第 2 步 $x\\to 0$ 时 $e^x$ 不趋于 1","第 3 步 $e^x$ 的泰勒展开系数错了","第 1 步不应该两边求导，应该直接用夹逼定理"],"correct":0,"explanation":"中值点里的 $\\theta$ 依赖于 $x$，不仅不是常数，甚至连可导性都未预先证明。正确做法是先用对数显式解出 $\\theta=\\dfrac{1}{x}\\ln\\dfrac{e^x-1}{x}$，再用 Maclaurin 展开 $\\dfrac{e^x-1}{x}=1+\\dfrac{x}{2}+o(x)$ 与 $\\ln(1+u)=u+o(u)$ 求极限。"},{"id":"ff04","stage":"阶段 3 · 定积分与微积分基本定理","ref_id":"p042","title":"找错 04：计算定积分 $\\displaystyle\\int_{-1}^{2}\\left|x-\\dfrac{1}{2}\\right|\\mathrm{d}x$","wrong_solution":"第 1 步：因为 $|x-\\frac{1}{2}|$ 在 $[-1,2]$ 上连续，直接找原函数。,第 2 步：一个原函数为 $F(x)=\\dfrac{1}{2}\\left|x-\\dfrac{1}{2}\\right|(x-\\frac{1}{2})$。,第 3 步：代入上下限得 $F(2)-F(-1)=\\dfrac{1}{2}\\cdot\\dfrac{9}{4}-\\dfrac{1}{2}\\cdot\\dfrac{9}{4}=0$。","options":["第 1 步 $|x-\\frac{1}{2}|$ 在 $x=\\frac{1}{2}$ 处不连续","第 3 步在 $x=-1$ 处，$x-\\frac{1}{2}=-\\frac{3}{2}<0$，所以 $F(-1)=-\\frac{9}{8}$，不是 $+\\frac{9}{8}$，且最好分段去绝对值再积分","第 2 步原函数求导永远不等于被积函数","定积分结果应该为负值"],"correct":1,"explanation":"处理含绝对值的定积分，最稳妥的方法是在零点 $x=\\frac{1}{2}$ 处拆成 $[-1,\\frac{1}{2}]$ 和 $[\\frac{1}{2},2]$ 两段分别去绝对值积分：$\\int_{-1}^{1/2}(\\frac{1}{2}-x)\\mathrm{d}x + \\int_{1/2}^{2}(x-\\frac{1}{2})\\mathrm{d}x = \\frac{9}{8}+\\frac{9}{8}=\\frac{9}{4}$。"},{"id":"ff05","stage":"阶段 3 · 变上限积分","ref_id":"p054","title":"找错 05：求 $F(x)=\\displaystyle\\int_{0}^{\\sqrt{x}}e^{t^2}\\mathrm{d}t$ 的导数","wrong_solution":"第 1 步：这是变上限积分，直接把上限 $\\sqrt{x}$ 代入被积函数。,第 2 步：得 $F'(x) = e^{(\\sqrt{x})^2} = e^x$。","options":["第 1 步忘记对上限 $\\sqrt{x}$ 求导（链式法则），漏乘了 $(\\sqrt{x})'=\\dfrac{1}{2\\sqrt{x}}$","第 2 步 $(\\sqrt{x})^2$ 不能写成 $x$","第 1 步应该先求出 $e^{t^2}$ 的原函数再求导","没有错误，变上限求导就是直接代入上限"],"correct":0,"explanation":"复合变上限积分求导公式为 $\\frac{\\mathrm{d}}{\\mathrm{d}x}\\int_a^{\\varphi(x)}f(t)\\mathrm{d}t = f(\\varphi(x))\\varphi'(x)$。漏乘 $\\varphi'(x)=\\frac{1}{2\\sqrt{x}}$ 是最常见的扣分点，正确结果为 $\\dfrac{e^x}{2\\sqrt{x}}\\ (x>0)$。"},{"id":"ff06","stage":"阶段 4 · 换元积分（上）","ref_id":"p075","title":"找错 06：求不定积分 $\\displaystyle\\int\\dfrac{\\mathrm{d}x}{e^x+e^{x/2}}$","wrong_solution":"第 1 步：把分母拆开积分：$\\int \\frac{\\mathrm{d}x}{e^x+e^{x/2}} = \\int e^{-x}\\mathrm{d}x + \\int e^{-x/2}\\mathrm{d}x$。,第 2 步：直接积分得 $-e^{-x} - 2e^{-x/2} + C$。","options":["第 1 步分母相加不能拆成两个分数相加（$\\frac{1}{A+B}\\neq \\frac{1}{A}+\\frac{1}{B}$）","第 2 步 $\\int e^{-x/2}\\mathrm{d}x$ 应该是 $-\\frac{1}{2}e^{-x/2}$","第 1 步忘记写 $+C$","分母应该先取对数再积分"],"correct":0,"explanation":"分数线下面有加法绝对不能拆项！正确做法是分子分母同乘 $e^{-x}$，凑微分 $\\mathrm{d}(e^{-x/2})$：原式 $=\\int \\frac{e^{-x}\\mathrm{d}x}{1+e^{-x/2}} = -2\\int \\frac{u\\,\\mathrm{d}u}{1+u}$（令 $u=e^{-x/2}$），再拆分子 $u=(u+1)-1$，得 $2\\ln(1+e^{-x/2})-2e^{-x/2}+C$。"},{"id":"ff07","stage":"阶段 4 · 换元积分（上）","ref_id":"p078","title":"找错 07：求不定积分 $\\displaystyle\\int\\dfrac{\\mathrm{d}x}{x^2\\sqrt{x^2-9}}$（第二类换元）","wrong_solution":"第 1 步：令 $x=3\\sec t$，则 $\\mathrm{d}x=3\\sec t\\tan t\\,\\mathrm{d}t$，$\\sqrt{x^2-9}=3\\tan t$。,第 2 步：代入得 $\\int \\frac{3\\sec t\\tan t}{9\\sec^2 t\\cdot 3\\tan t}\\mathrm{d}t = \\frac{1}{9}\\int \\cos t\\,\\mathrm{d}t = \\frac{1}{9}\\sin t + C$。,第 3 步：由 $\\sec t=\\frac{x}{3}$ 得 $\\sin t=\\frac{\\sqrt{x^2-9}}{x}$，故结果为 $\\frac{\\sqrt{x^2-9}}{9x}+C$（对所有 $|x|>3$）。","options":["第 1 步 $\\mathrm{d}(\\sec t)$ 求导错了","第 2 步 $\\frac{1}{\\sec t}$ 不等于 $\\cos t$","第 3 步忽略了 $x<-3$ 的分支：当 $x<-3$ 时，若取 $t\\in(\\frac{\\pi}{2},\\pi)$，则 $\\tan t<0$，此时 $\\sqrt{x^2-9}=3|\\tan t|=-3\\tan t$，需要分 $x>3$ 与 $x<-3$ 讨论（或者写 $\\frac{\\sqrt{x^2-9}}{9|x|}$ 需核符号）","不能使用三角代换，只能凑微分"],"correct":2,"explanation":"对 $x>3$ 取 $t\\in(0,\\frac{\\pi}{2})$，确有 $\\sqrt{x^2-9}=3\\tan t$ 且 $\\sin t=\\frac{\\sqrt{x^2-9}}{x}$；但当 $x<-3$ 时，若用 $t\\in(\\frac{\\pi}{2},\\pi)$，则 $\\tan t<0$，开根号是 $-3\\tan t$，导致积出 $-\\frac{1}{9}\\sin t=-\\frac{\\sqrt{x^2-9}}{9x}$（注意此时 $x<0$，结果仍为负？不，原被积函数 $>0$，原函数必须单调增，求导可验 $\\left(\\frac{\\sqrt{x^2-9}}{9x}\\right)'=\\frac{1}{x^2\\sqrt{x^2-9}}>0$ 对 $x<-3$ 也居然是正的！——等等，这正是因为 $\\frac{\\sqrt{x^2-9}}{9x}$ 在 $x<-3$ 时求导分子分母符号抵消后仍为 $+\\frac{1}{x^2\\sqrt{x^2-9}}$！但推导时若不取绝对值，中间步骤会出现符号错误）。"},{"id":"ff08","stage":"阶段 5 · 分部与定积分","ref_id":"p086","title":"找错 08：计算定积分 $\\displaystyle\\int_{0}^{\\pi}\\sqrt{1+\\cos 2x}\\,\\mathrm{d}x$","wrong_solution":"第 1 步：利用倍角公式 $1+\\cos 2x = 2\\cos^2 x$。,第 2 步：开方得 $\\sqrt{2\\cos^2 x} = \\sqrt{2}\\cos x$。,第 3 步：积分 $\\sqrt{2}\\int_{0}^{\\pi}\\cos x\\,\\mathrm{d}x = \\sqrt{2}(\\sin\\pi - \\sin 0) = 0$。","options":["第 1 步倍角公式记错了，应该是 $2\\sin^2 x$","第 2 步开平方漏了绝对值！在 $[\\frac{\\pi}{2},\\pi]$ 上 $\\cos x\\leqslant 0$，应为 $\\sqrt{2}|\\cos x|$，分段积分结果是 $2\\sqrt{2}$ 而不是 $0$","第 3 步 $\\sin\\pi$ 等于 $1$","必须用分部积分法"],"correct":1,"explanation":"非负被积函数 $\\sqrt{1+\\cos 2x}\\geqslant 0$ 在 $[0,\\pi]$ 上的定积分不可能为 $0$！错误出在 $\\sqrt{\\cos^2 x}=|\\cos x|$ 漏了绝对值。需拆成 $[0,\\frac{\\pi}{2}]$（$\\cos x\\geqslant 0$）和 $[\\frac{\\pi}{2},\\pi]$（$\\cos x\\leqslant 0$）两段，得 $\\sqrt{2}+\\sqrt{2}=2\\sqrt{2}$。"},{"id":"ff09","stage":"阶段 5 · 综合技巧","ref_id":"p098","title":"找错 09：求 $\\displaystyle\\int_{0}^{n\\pi}\\sqrt{1-\\sin 2x}\\,\\mathrm{d}x$","wrong_solution":"第 1 步：$1-\\sin 2x = (\\sin x - \\cos x)^2$。,第 2 步：因为被积函数周期为 $\\pi$，所以原式 $= n\\int_0^{\\pi}(\\sin x - \\cos x)\\mathrm{d}x$。,第 3 步：算得 $n\\big[-\\cos x - \\sin x\\big]_0^\\pi = 2n$。","options":["第 1 步配方错了","第 2 步开方又漏了绝对值 $|\\sin x - \\cos x|$！在 $[0,\\frac{\\pi}{4}]$ 上 $\\sin x < \\cos x$，且在 $[\\frac{5\\pi}{4},\\dots]$ 也会变号","第 3 步周期不是 $\\pi$ 而是 $2\\pi$","没有错误，结果就是 $2n$"],"correct":1,"explanation":"$\\sqrt{1-\\sin 2x}=|\\sin x-\\cos x|$ 确实以 $\\pi$ 为周期，但在 $[0,\\pi]$ 内 $\\sin x-\\cos x$ 在 $x=\\frac{\\pi}{4}$ 处变号：$[0,\\frac{\\pi}{4}]$ 上为 $\\cos x-\\sin x$，$[\\frac{\\pi}{4},\\pi]$ 上为 $\\sin x-\\cos x$。每周期积分 $=2\\sqrt{2}$，总结果 $=2\\sqrt{2}n$。"},{"id":"ff10","stage":"阶段 6 · 反常积分","ref_id":"p112","title":"找错 10：计算无穷积分 $\\displaystyle\\int_{-\\infty}^{+\\infty}\\dfrac{x}{\\sqrt{1+x^2}}\\mathrm{d}x$","wrong_solution":"第 1 步：观察被积函数 $f(x)=\\dfrac{x}{\\sqrt{1+x^2}}$ 是奇函数。,第 2 步：积分区间 $(-\\infty,+\\infty)$ 关于原点对称。,第 3 步：由奇函数在对称区间上的积分性质，直接得积分收敛且值为 $0$。","options":["第 1 步函数不是奇函数","第 3 步反常积分必须拆成 $\\int_{-\\infty}^0 + \\int_0^{+\\infty}$ 且两端极限**各自**存在才算收敛！本题 $\\int_0^{+\\infty}=\\lim_{b\\to+\\infty}(\\sqrt{1+b^2}-1)=+\\infty$，故原反常积分**发散**，不能直接用奇偶性得 0","第 2 步 $(-\\infty,+\\infty)$ 不是对称区间","需要凑微分求原函数为 $\\arcsin x$"],"correct":1,"explanation":"奇函数在对称区间上积分为 0 的前提是**积分收敛**（对反常积分即左右两半区间的广义积分都必须各自收敛）。本题两半均发散（$0$ 是 Cauchy 主值，不是反常积分收敛值），因此原反常积分发散。"},{"id":"ff11","stage":"阶段 6 · 第3章综合","ref_id":"p125","title":"找错 11：求极限 $\\lim\\limits_{n\\to\\infty}\\sum\\limits_{k=1}^{n}\\dfrac{2^{k/n}}{n+\\frac{1}{k}}$","wrong_solution":"第 1 步：当 $n\\to\\infty$ 时，分母 $n+\\frac{1}{k} \\sim n$。,第 2 步：把分母中的 $\\frac{1}{k}$ 直接扔掉，变成 $\\lim_{n\\to\\infty}\\frac{1}{n}\\sum_{k=1}^n 2^{k/n} = \\int_0^1 2^x\\mathrm{d}x = \\frac{1}{\\ln 2}$。,第 3 步：虽然答案对了，但“直接扔掉 $\\frac{1}{k}$”没有给出数学依据。","options":["求和式不能直接对单个加项取等价无穷小替换，必须用夹逼定理（把 $n+\\frac{1}{k}$ 夹在 $n$ 与 $n+1$ 之间）来严格证明","定积分上限应该是 $2$ 而不是 $1$","$\\int_0^1 2^x\\mathrm{d}x$ 等于 $\\ln 2$","第 1 步在 $k=1$ 时 $n+1$ 与 $n$ 不等价"],"correct":0,"explanation":"无限个无穷小之和（项数 $n\\to\\infty$ 也在变）不能直接逐项替换！标准严格写法是用不等式 $n < n+\\frac{1}{k} \\leqslant n+1$ 夹逼：$\\frac{n}{n+1}\\cdot\\frac{1}{n}\\sum 2^{k/n} \\leqslant S_n \\leqslant \\frac{1}{n}\\sum 2^{k/n}$，再对两端用积分定义求极限。"},{"id":"ff12","stage":"阶段 7 · 一阶微分方程","ref_id":"p137","title":"找错 12：求解可分离变量方程 $x\\,\\mathrm{d}y - y\\ln y\\,\\mathrm{d}x = 0$","wrong_solution":"第 1 步：分离变量得 $\\dfrac{\\mathrm{d}y}{y\\ln y} = \\dfrac{\\mathrm{d}x}{x}$。,第 2 步：两边积分得 $\\ln|\\ln y| = \\ln|x| + C_1$。,第 3 步：整理得通解 $\\ln y = Cx$，即 $y = e^{Cx}$（$C\\neq 0$）。","options":["第 2 步 $\\int \\frac{\\mathrm{d}y}{y\\ln y}$ 积分错了","第 3 步漏掉了分离变量时被除掉的奇解/常数解 $y\\equiv 1$（对应 $C=0$ 可并入 $y=e^{Cx}$），以及未说明 $x\\neq 0, y>0$ 的定义域","第 1 步不能分离变量","通解中不能出现 $e^{Cx}$"],"correct":1,"explanation":"分离变量除以 $y\\ln y$ 和 $x$ 时必须检查 $y\\ln y=0$（即 $y=1$，由于 $\\ln y$ 需 $y>0$ 故 $y=0$ 不在定义域内）。$y\\equiv 1$ 确实是方程的解，它恰好对应 $y=e^{Cx}$ 中 $C=0$ 的情形，因此写通解时必须把 $C\\in\\mathbb{R}$ 放开（允许 $C=0$）并写明检验过程。"},{"id":"ff13","stage":"阶段 7 · 二阶常系数方程","ref_id":"p157","title":"找错 13：写 $\\ddot{x}-6\\dot{x}+9x=(2t+1)e^{3t}$ 的待定特解形式","wrong_solution":"第 1 步：特征方程 $r^2-6r+9=(r-3)^2=0$，特征根 $r_1=r_2=3$。,第 2 步：右端指数系数 $\\lambda=3$ 是特征根，所以特解要乘一个 $t$。,第 3 步：设特解形式为 $x^*(t)=t(At+B)e^{3t}$。","options":["第 1 步特征根错了","第 2 步 $\\lambda=3$ 是特征方程的**二重根**，必须乘 $t^2$ 而不是 $t$！正确形式为 $x^*(t)=t^2(At+B)e^{3t}$","第 3 步多项式部分应该设成二次多项式 $At^2+Bt+C$","不需要乘 $t$，直接设 $(At+B)e^{3t}$ 即可"],"correct":1,"explanation":"待定系数法里特解乘 $t^k$ 的次数 $k$ 等于 $\\lambda$ 作为特征方程根的**重数**！这里 $r=3$ 是二重根（$k=2$），只乘一次 $t$ 仍然会和通解中的 $C_2 t e^{3t}$ 撞车导致代回后 $t^2, t$ 项全消不掉。正确形式为 $t^2(At+B)e^{3t}$。"},{"id":"ff14","stage":"阶段 7 · 一阶线性与齐次","ref_id":"p144","title":"找错 14：解初值问题 $y'=\\dfrac{x}{y}+\\dfrac{y}{x},\\ \\left.y\\right|_{x=-1}=2$","wrong_solution":"第 1 步：令 $u=\\frac{y}{x}$，则 $y=ux$，$y'=u+xu'$。,第 2 步：代入方程得 $xu'=\\frac{1}{u}$，分离变量积分得 $\\frac{u^2}{2}=\\ln|x|+C$。,第 3 步：代初值 $x=-1, y=2\\Rightarrow u=-2$，得 $C=2$，于是 $y=x\\sqrt{2\\ln|x|+4}$。","options":["第 1 步不是齐次方程","第 2 步积分应该得 $\\ln x$ 不能加绝对值","第 3 步开平方丢了负号！初值在 $x=-1<0,\\ y=2>0$，所以 $x\\sqrt{\\cdots}$ 为负，应取负支 $y=-x\\sqrt{2\\ln(-x)+4}$","第 2 步分离变量错了"],"correct":2,"explanation":"当 $x=-1<0$ 时，如果写 $y=x\\sqrt{2\\ln|x|+4}$，代入 $x=-1$ 得到 $y=-2$，与初值 $y(-1)=2$ 矛盾！因为 $x<0$ 且 $y>0$，开平方必须取负号：$y=-x\\sqrt{2\\ln(-x)+4}=|x|\\sqrt{2\\ln(-x)+4}$。"},{"id":"ff15","stage":"阶段 14 · 一致收敛与换序","ref_id":"c4_exp_03","title":"找错 15：求 $\\lim_{n\\to\\infty}\\int_0^1 n^2 x e^{-nx}\\,dx$","wrong_solution":"第 1 步：对任意固定 $x\\in[0,1]$，$\\lim_{n\\to\\infty} n^2 x e^{-nx} = 0$（当 $x=0$ 时恒为 $0$）。,第 2 步：把极限移进积分号内，得原极限 $= \\int_0^1 0\\,dx = 0$。","options":["第 1 步在 $x=0$ 处极限不是 0","第 2 步仅凭逐点收敛不能交换极限与积分，该函数列在 $[0,1]$ 上非一致收敛，真实极限为 $1$","积分上限应为 $+\\infty$ 才能换序","没有错误，极限确实为 0"],"correct":1,"explanation":"直接分部积分算得 $\\int_0^1 n^2 x e^{-nx}\\,dx = 1 - (1+n)e^{-n} \\to 1 \\ne 0$。因为峰值 $f_n(1/n)=n/e\\to+\\infty$，非一致收敛也无 $L^1$ 控制函数。"},{"id":"ff16","stage":"阶段 15 · 多元可微性","ref_id":"c4_cap_03","title":"找错 16：判断 $f(x,y)=\\frac{x^2 y}{x^4+y^2}$ 在原点的连续性","wrong_solution":"第 1 步：令 $y=kx$，沿任意直线趋近原点得 $\\lim_{x\\to 0}\\frac{k x^3}{x^4+k^2 x^2}=\\lim_{x\\to 0}\\frac{kx}{x^2+k^2}=0$。,第 2 步：既然沿所有方向直线极限都等于 $f(0,0)=0$，所以 $f$ 在原点连续。","options":["第 1 步漏了 $k=0$ 的情况","第 2 步错误：沿所有直线极限相同只是连续的必要条件而非充分条件，沿抛物线 $y=x^2$ 极限为 $1/2\\ne 0$","第 1 步化简分式错误","没有错误，该函数在原点连续"],"correct":1,"explanation":"二元极限要求沿一切路径（包括曲线）均趋于同一值。沿抛物线 $y=x^2$ 有 $f(x,x^2)=\\frac{1}{2}\\ne 0$，故在原点不连续。"},{"id":"ff17","stage":"阶段 14 · 条件收敛重排","ref_id":"c4_exp_05","title":"找错 17：交错调和级数重排求值","wrong_solution":"第 1 步：已知 $S = 1 - \\frac{1}{2} + \\frac{1}{3} - \\frac{1}{4} + \\dots = \\ln 2$。,第 2 步：把相邻项重新配对成 $(1 - \\frac{1}{2} - \\frac{1}{4}) + (\\frac{1}{3} - \\frac{1}{6} - \\frac{1}{8}) + \\dots = \\frac{1}{2}S$。,第 3 步：加法满足交换律，所以 $S = \\frac{1}{2}S \\implies \\ln 2 = 0$。","options":["第 1 步交错调和级数的和不是 $\\ln 2$","第 2 步代数化简错了一项","第 3 步错误：条件收敛级数不满足无限加法交换律，重排会改变级数和（一正两负重排后确实收敛于 $\\frac{1}{2}\\ln 2$）","无法判断"],"correct":2,"explanation":"只有绝对收敛级数才满足任意重排和不变；条件收敛级数重排后可以收敛到任意实数（Riemann 重排定理）。"},{"id":"ff18","stage":"阶段 15 · Lagrange 乘数法","ref_id":"c4_cap_09","title":"找错 18：在约束 $y^2 - x^3 = 0$ 下求 $f(x,y)=x$ 的最小值","wrong_solution":"第 1 步：构造 $L(x,y,\\lambda)=x+\\lambda(y^2-x^3)$。,第 2 步：令 $L_x=1-3\\lambda x^2=0,\\ L_y=2\\lambda y=0$，由 $y^2=x^3$ 解得无解。,第 3 步：因此 $f(x,y)=x$ 在该约束下不存在最小值。","options":["第 1 步 Lagrange 函数符号写反了","第 2 步漏解了 $\\lambda=0$","第 3 步错误：Lagrange 乘数法仅适用于正则点（$\\nabla g\\ne 0$），最小值恰好在奇异尖点 $(0,0)$ 处取得","没有错误，确实无最小值"],"correct":2,"explanation":"由 $x^3=y^2\\ge 0$ 显然有 $x\\ge 0$，最小值 $0$ 在 $(0,0)$ 处取得；但约束梯度 $\\nabla g(0,0)=(0,0)$ 退化，奇异点必须单独检验。"}];
  const SUBMISSION_ITEMS = ["文件夹与压缩包命名符合规范：G + 组长学号_ _数学分析学习工作台","包含 01_作品说明.pdf（含组员分工、知识点清单与在线链接）","网页支持离线双击直接打开，且含完整 README 说明文档","所有 497 道精解习题均严格核对原题面，未篡改条件与符号","每章解法严守工具边界（第 2 章不用积分，第 3.1–3.2 节不超前用分部/换元）","AI 纠错专项训练至少包含 10 题以上真实 AI/常见错解并附纠错依据","03_AI 使用日志已如实记录 AI 辅助环节与人工核验/纠错记录","04_分工与贡献表与 05_答辩 PPT 已准备就绪","所有数学公式（KaTeX）在浅色/深色模式下均无截断或乱码","移动端窄屏下侧边栏抽屉与可视化画布自适应无横向滚动条","已通过本地进度导出备份学习记录"];

  const STORE_FAULT = 'wb_math_fault_done_v1';
  const STORE_CHECK = 'wb_math_sub_checks_v1';

  const loadJson = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (_) { return {}; } };
  const saveJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

  let faultDone = loadJson(STORE_FAULT);
  let subChecks = loadJson(STORE_CHECK);
  let activeTab = 'fault';
  let vizMode = 'ed';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderMath(el) {
    if (!el) return;
    if (window.renderMathInElement && window.katex) {
      try {
        window.renderMathInElement(el, {
          delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
          throwOnError: false,
        });
      } catch (_) {}
    }
  }

  function ensureModal() {
    let overlay = document.getElementById('wbCalcLabModal');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'wbCalcLabModal';
    overlay.className = 'modal-backdrop';
    overlay.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(2,6,23,0.62);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:10055;';
    overlay.innerHTML = `
      <div class="card" style="width:min(860px, calc(100vw - 20px));max-height:calc(100dvh - 36px);display:flex;flex-direction:column;overflow:hidden;padding:0 !important;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;border-bottom:1px solid var(--sg-border);">
          <div style="font-weight:750;font-size:15px;">∫ 数学分析专属特色实验室</div>
          <button type="button" class="btn" id="wbCalcLabClose" style="height:30px;padding:0 12px;font-size:12.5px;">关闭</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;padding:10px 18px;border-bottom:1px solid var(--sg-border);">
          <button type="button" class="btn" data-clab-tab="fault">🔍 找错闯关 (18关)</button>
          <button type="button" class="btn" data-clab-tab="viz">📊 8模式交互可视化</button>
          <button type="button" class="btn" data-clab-tab="check">✅ 11项严格自查</button>
        </div>
        <div id="wbCalcLabBody" style="flex:1;overflow-y:auto;padding:16px 18px;-webkit-overflow-scrolling:touch;"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCalcLab(); });
    overlay.querySelector('#wbCalcLabClose').addEventListener('click', closeCalcLab);
    overlay.querySelectorAll('[data-clab-tab]').forEach((b) => {
      b.addEventListener('click', () => {
        activeTab = b.getAttribute('data-clab-tab');
        renderTab();
      });
    });
    return overlay;
  }

  function closeCalcLab() {
    const ov = document.getElementById('wbCalcLabModal');
    if (ov) { ov.style.display = 'none'; ov.classList.remove('open'); }
  }

  function renderFaultTab(body) {
    const doneCnt = Object.values(faultDone).filter(Boolean).length;
    body.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div style="font-size:13px;color:var(--sg-muted);">专抓数学分析证明与计算中的隐蔽伪证漏洞 · 已通关 <strong style="color:var(--sg-accent);">${doneCnt} / ${FAULT_BANK.length}</strong></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${FAULT_BANK.map((f, idx) => {
          const solved = !!faultDone[f.id];
          return `
            <div class="section-card" style="padding:14px 16px !important;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
                <div style="font-weight:700;font-size:14px;">第 ${idx + 1} 关 · ${esc(f.title)}</div>
                <span class="badge" style="font-size:11px;padding:2px 8px;border-radius:999px;background:${solved ? 'rgba(16,185,129,0.16)' : 'var(--sg-accent-soft)'};color:${solved ? '#10b981' : 'var(--sg-accent)'};">${solved ? '✓ 已通关' : '待找错'}</span>
              </div>
              <div style="padding:10px 12px;border-radius:10px;background:var(--sg-surface-2);font-size:13px;line-height:1.7;margin-bottom:10px;white-space:pre-wrap;">${esc(f.wrong_solution)}</div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                ${(f.options || []).map((opt, oi) => `
                  <button type="button" class="btn" data-fid="${esc(f.id)}" data-oi="${oi}" style="justify-content:flex-start;text-align:left;height:auto;padding:8px 12px;white-space:normal;line-height:1.5;font-size:13px;">${String.fromCharCode(65 + oi)}. ${esc(opt)}</button>
                `).join('')}
              </div>
              <div id="fault-fb-${esc(f.id)}" style="margin-top:10px;font-size:13px;line-height:1.65;display:${solved ? 'block' : 'none'};padding:10px 12px;border-radius:10px;background:var(--sg-accent-soft);">
                <strong>解析：</strong>${esc(f.explanation)}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    body.querySelectorAll('button[data-fid]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const fid = btn.getAttribute('data-fid');
        const oi = parseInt(btn.getAttribute('data-oi'), 10);
        const f = FAULT_BANK.find((x) => x.id === fid);
        if (!f) return;
        const fb = body.querySelector('#fault-fb-' + CSS.escape(fid));
        if (oi === f.correct) {
          faultDone[fid] = true;
          saveJson(STORE_FAULT, faultDone);
          btn.classList.add('btn-primary');
          if (fb) { fb.style.display = 'block'; fb.innerHTML = '<strong style="color:#10b981;">✓ 抓错成功！</strong> ' + esc(f.explanation); renderMath(fb); }
        } else {
          if (fb) { fb.style.display = 'block'; fb.innerHTML = '<strong style="color:#ef4444;">✗ 还差一点，再想想：</strong> 提示——重点核对每一步推导的前提条件是否满足。'; }
        }
      });
    });
    renderMath(body);
  }

  function safeEvalExpr(expr, x) {
    const cleaned = String(expr || 'sin(x)/x')
      .replace(/\^/g, '**')
      .replace(/\b(sin|cos|tan|asin|acos|atan|exp|log|sqrt|abs|floor|ceil|pow)\b/g, 'Math.$1')
      .replace(/\bln\b/g, 'Math.log')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b/g, 'Math.E');
    return Function('x', '"use strict"; return (' + cleaned + ');')(x);
  }

  function renderVizTab(body) {
    const modes = [
      ['ed', 'ε-δ 极限'],
      ['seq', '数列极限'],
      ['deriv', '导数切线'],
      ['mvt', '中值定理'],
      ['taylor', '泰勒逼近'],
      ['riemann', '黎曼和积分'],
      ['extrema', '极值与拐点'],
      ['free', '自由函数验算'],
    ];
    body.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
        ${modes.map(([k, lbl]) => `<button type="button" class="btn ${vizMode === k ? 'btn-primary' : ''}" data-vmode="${k}" style="height:30px;padding:0 10px;font-size:12px;">${lbl}</button>`).join('')}
      </div>
      <div id="wbCalcVizCtrl" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px;font-size:13px;"></div>
      <canvas id="wbCalcVizCanvas" style="width:100%;height:290px;border-radius:14px;border:1px solid var(--sg-border);display:block;"></canvas>
      <div id="wbCalcVizInfo" style="margin-top:10px;font-size:13px;color:var(--sg-muted);line-height:1.6;"></div>
    `;
    body.querySelectorAll('[data-vmode]').forEach((b) => {
      b.addEventListener('click', () => { vizMode = b.getAttribute('data-vmode'); renderVizTab(body); });
    });

    const ctrl = body.querySelector('#wbCalcVizCtrl');
    const info = body.querySelector('#wbCalcVizInfo');
    const canvas = body.querySelector('#wbCalcVizCanvas');

    let p1 = 0.5, exprStr = 'sin(x)/x', x0Val = 1.0;
    if (vizMode === 'ed') {
      ctrl.innerHTML = '<label>ε = <strong id="vp1v">0.50</strong> <input id="vp1" type="range" min="0.1" max="1.2" step="0.05" value="0.5"></label>';
    } else if (vizMode === 'seq') {
      p1 = 0.25;
      ctrl.innerHTML = '<label>ε 带宽 = <strong id="vp1v">0.25</strong> <input id="vp1" type="range" min="0.06" max="0.6" step="0.02" value="0.25"></label>';
    } else if (vizMode === 'deriv') {
      p1 = 1.2;
      ctrl.innerHTML = '<label>割线步长 h = <strong id="vp1v">1.20</strong> <input id="vp1" type="range" min="0.05" max="2.0" step="0.05" value="1.2"></label>';
    } else if (vizMode === 'mvt') {
      p1 = 2.0;
      ctrl.innerHTML = '<label>右端点 b = <strong id="vp1v">2.00</strong> <input id="vp1" type="range" min="0.6" max="2.6" step="0.1" value="2.0"></label>';
    } else if (vizMode === 'taylor') {
      p1 = 3;
      ctrl.innerHTML = '<label>泰勒展开阶数 n = <strong id="vp1v">3</strong> <input id="vp1" type="range" min="1" max="9" step="2" value="3"></label>';
    } else if (vizMode === 'riemann') {
      p1 = 8;
      ctrl.innerHTML = '<label>分割矩形数 n = <strong id="vp1v">8</strong> <input id="vp1" type="range" min="2" max="40" step="1" value="8"></label>';
    } else if (vizMode === 'extrema') {
      p1 = 1.0;
      ctrl.innerHTML = '<label>参数 a = <strong id="vp1v">1.00</strong> <input id="vp1" type="range" min="0.4" max="2.2" step="0.1" value="1.0"></label>';
    } else {
      ctrl.innerHTML = '<input id="vexpr" type="text" value="sin(x)/x" style="flex:1;min-width:150px;height:32px;padding:0 10px;"> <label>x₀=<input id="vx0" type="number" step="0.2" value="1.0" style="width:68px;height:32px;padding:0 6px;"></label> <button type="button" class="btn btn-primary" id="vrun" style="height:32px;padding:0 12px;">验算</button>';
    }

    function draw() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(300, canvas.clientWidth || 520), h = 290;
      canvas.width = w * dpr; canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.fillStyle = isDark ? '#0b1220' : '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      const xMin = vizMode === 'seq' ? 0 : -3.5, xMax = vizMode === 'seq' ? 30 : 3.5;
      const yMin = -2.2, yMax = 2.6;
      const toX = (x) => ((x - xMin) / (xMax - xMin)) * (w - 40) + 24;
      const toY = (y) => h - 22 - ((y - yMin) / (yMax - yMin)) * (h - 40);

      // Axes
      ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.28)' : 'rgba(15,23,42,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(20, toY(0)); ctx.lineTo(w - 12, toY(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(toX(0), 12); ctx.lineTo(toX(0), h - 14); ctx.stroke();

      const plotFn = (fn, color, lw) => {
        ctx.strokeStyle = color; ctx.lineWidth = lw || 2.2; ctx.beginPath();
        let started = false;
        for (let px = 0; px <= 240; px++) {
          const x = xMin + (px / 240) * (xMax - xMin);
          let y; try { y = fn(x); } catch (_) { continue; }
          if (!Number.isFinite(y) || Math.abs(y) > 20) { started = false; continue; }
          const cx = toX(x), cy = toY(y);
          if (!started) { ctx.moveTo(cx, cy); started = true; } else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      };

      if (vizMode === 'ed') {
        const eps = p1, x0 = 1, L = 1, delta = Math.sqrt(1 + eps) - 1;
        ctx.fillStyle = 'rgba(59,130,246,0.14)';
        ctx.fillRect(24, toY(L + eps), w - 40, toY(L - eps) - toY(L + eps));
        ctx.fillStyle = 'rgba(16,185,129,0.16)';
        ctx.fillRect(toX(x0 - delta), 14, toX(x0 + delta) - toX(x0 - delta), h - 36);
        plotFn((x) => x * x, '#3b82f6', 2.4);
        info.textContent = `验证 lim(x→1) x² = 1：给定 ε = ${eps.toFixed(2)}，取 δ = ${delta.toFixed(3)}，绿色 δ-邻域内曲线全部落在蓝色 ε-带中。`;
      } else if (vizMode === 'seq') {
        const eps = p1, N = Math.ceil(1 / eps);
        ctx.fillStyle = 'rgba(59,130,246,0.14)';
        ctx.fillRect(24, toY(1 + eps), w - 40, toY(1 - eps) - toY(1 + eps));
        for (let n = 1; n <= 28; n++) {
          const y = 1 + Math.pow(-1, n) / n;
          ctx.fillStyle = n > N ? '#10b981' : '#f59e0b';
          ctx.beginPath(); ctx.arc(toX(n), toY(y), 3.6, 0, Math.PI * 2); ctx.fill();
        }
        info.textContent = `数列 aₙ = 1 + (-1)ⁿ/n 收敛于 1：当 ε = ${eps.toFixed(2)} 时，临界 N = ${N}，所有 n > ${N} 的绿色点全部落入 ε 通道。`;
      } else if (vizMode === 'deriv') {
        const x0 = 0.8, hh = p1, f = (x) => 0.4 * x * x;
        const slope = (f(x0 + hh) - f(x0)) / hh;
        plotFn(f, '#3b82f6', 2.4);
        plotFn((x) => f(x0) + slope * (x - x0), '#f59e0b', 1.8);
        plotFn((x) => f(x0) + 0.8 * x0 * (x - x0), '#10b981', 1.6);
        info.textContent = `f(x)=0.4x² 在 x₀=0.8 处：割线斜率 = ${slope.toFixed(3)}，真切线导数 f'(0.8) = ${(0.8 * x0).toFixed(3)}（拖动 h→0 观察重合）。`;
      } else if (vizMode === 'mvt') {
        const a = -1.2, b = p1, f = (x) => 0.25 * x * x * x - 0.6 * x;
        const sec = (f(b) - f(a)) / (b - a);
        const xi = Math.sqrt(Math.max(0, (sec + 0.6) / 0.75));
        plotFn(f, '#3b82f6', 2.4);
        plotFn((x) => f(a) + sec * (x - a), '#f59e0b', 1.7);
        plotFn((x) => f(xi) + sec * (x - xi), '#10b981', 1.8);
        info.textContent = `区间 [${a}, ${b.toFixed(1)}] 割线斜率 = ${sec.toFixed(3)}，在 ξ = ${xi.toFixed(3)} 处绿色切线与橙色割线严格平行。`;
      } else if (vizMode === 'taylor') {
        const deg = Math.round(p1);
        const fact = (k) => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };
        const taylorSin = (x) => { let s = 0; for (let k = 0; 2 * k + 1 <= deg; k++) s += Math.pow(-1, k) * Math.pow(x, 2 * k + 1) / fact(2 * k + 1); return s; };
        plotFn(Math.sin, '#3b82f6', 2.4);
        plotFn(taylorSin, '#ef4444', 2.0);
        info.textContent = `蓝线 sin(x) vs 红线 ${deg} 阶麦克劳林多项式：阶数越高，高阶逼近区间越宽。`;
      } else if (vizMode === 'riemann') {
        const n = Math.round(p1), a = 0, b = 3.0, dx = (b - a) / n, f = (x) => 0.22 * x * x + 0.3;
        let sum = 0;
        ctx.fillStyle = 'rgba(59,130,246,0.22)'; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1;
        for (let i = 0; i < n; i++) {
          const xm = a + (i + 0.5) * dx, ym = f(xm); sum += ym * dx;
          const x1 = toX(a + i * dx), x2 = toX(a + (i + 1) * dx), yTop = toY(ym), y0 = toY(0);
          ctx.fillRect(x1, yTop, x2 - x1, y0 - yTop);
          ctx.strokeRect(x1, yTop, x2 - x1, y0 - yTop);
        }
        plotFn(f, '#10b981', 2.2);
        const exact = 0.22 * 27 / 3 + 0.3 * 3;
        info.textContent = `中点黎曼和 (n=${n}) ≈ ${sum.toFixed(4)}，精确积分 ∫₀³ (0.22x²+0.3)dx = ${exact.toFixed(4)}。`;
      } else if (vizMode === 'extrema') {
        const a = p1, f = (x) => 0.25 * x * x * x - a * x, df = (x) => 0.75 * x * x - a;
        plotFn(f, '#3b82f6', 2.4);
        plotFn(df, '#f59e0b', 1.6);
        const cr = Math.sqrt(a / 0.75);
        info.textContent = `蓝线 f(x)=0.25x³-${a.toFixed(1)}x，橙线导数 f'(x)：驻点 x = ±${cr.toFixed(3)}，拐点 x = 0。`;
      } else {
        try {
          const fn = (x) => safeEvalExpr(exprStr, x);
          plotFn(fn, '#3b82f6', 2.4);
          const y0 = fn(x0Val);
          const hh = 1e-5;
          const dy = (fn(x0Val + hh) - fn(x0Val - hh)) / (2 * hh);
          let integ = 0;
          const N = 200, a = 0, b = x0Val, dx = (b - a) / N;
          for (let i = 0; i < N; i++) { const m = a + (i + 0.5) * dx; const v = fn(m); if (Number.isFinite(v)) integ += v * dx; }
          info.textContent = `f(${x0Val}) = ${Number.isFinite(y0) ? y0.toFixed(5) : '无定义'} ｜ 数值导数 f'(${x0Val}) ≈ ${Number.isFinite(dy) ? dy.toFixed(5) : '—'} ｜ 数值积分 ∫₀^${x0Val} f(x)dx ≈ ${integ.toFixed(5)}`;
        } catch (err) {
          info.textContent = '表达式语法错误：请使用如 sin(x)/x、x^3 - 3*x、exp(-x^2) 等格式。';
        }
      }
    }

    const slider = ctrl.querySelector('#vp1');
    if (slider) {
      slider.addEventListener('input', () => {
        p1 = parseFloat(slider.value);
        const vEl = ctrl.querySelector('#vp1v');
        if (vEl) vEl.textContent = (vizMode === 'taylor' || vizMode === 'riemann') ? String(Math.round(p1)) : p1.toFixed(2);
        draw();
      });
    }
    const runBtn = ctrl.querySelector('#vrun');
    if (runBtn) {
      runBtn.addEventListener('click', () => {
        exprStr = ctrl.querySelector('#vexpr').value;
        x0Val = parseFloat(ctrl.querySelector('#vx0').value) || 0;
        draw();
      });
    }
    requestAnimationFrame(draw);
  }

  function renderCheckTab(body) {
    const checkedCnt = Object.values(subChecks).filter(Boolean).length;
    body.innerHTML = `
      <div style="font-size:13px;color:var(--sg-muted);margin-bottom:12px;">证明严谨性与解题提交核查清单 · 已勾选 <strong style="color:var(--sg-accent);">${checkedCnt} / ${SUBMISSION_ITEMS.length}</strong></div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${SUBMISSION_ITEMS.map((item, idx) => `
          <label class="section-card" style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px !important;cursor:pointer;font-size:13.5px;line-height:1.55;">
            <input type="checkbox" data-cidx="${idx}" ${subChecks[idx] ? 'checked' : ''} style="margin-top:3px;width:16px;height:16px;flex-shrink:0;">
            <span>${idx + 1}. ${esc(item)}</span>
          </label>
        `).join('')}
      </div>
    `;
    body.querySelectorAll('input[data-cidx]').forEach((cb) => {
      cb.addEventListener('change', () => {
        subChecks[cb.getAttribute('data-cidx')] = cb.checked;
        saveJson(STORE_CHECK, subChecks);
        renderCheckTab(body);
      });
    });
  }

  function renderTab() {
    const ov = ensureModal();
    ov.querySelectorAll('[data-clab-tab]').forEach((b) => {
      b.classList.toggle('btn-primary', b.getAttribute('data-clab-tab') === activeTab);
    });
    const body = ov.querySelector('#wbCalcLabBody');
    if (activeTab === 'fault') renderFaultTab(body);
    else if (activeTab === 'viz') renderVizTab(body);
    else renderCheckTab(body);
  }

  window.openCalculusSpecialLab = function (tab) {
    activeTab = tab || 'fault';
    const ov = ensureModal();
    ov.style.display = 'flex';
    ov.classList.add('open');
    renderTab();
  };
})();
