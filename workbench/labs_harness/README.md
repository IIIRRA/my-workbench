# 14 科专家闭环 · 本地可运行 Lab 自动化判题与压测套件 (`labs_harness`)

本套件将工作台中的《硬核 Lab 路线图》与《跨科 Capstone》转化为可直接在本地编译、运行、压测与自动判题的工程验证环境。

## 一键运行全部 9 项判题器

```bash
python3 labs_harness/run_all_labs.py
```

## 全部 9 项实验与覆盖学科

1. `lab01_lockfree_ring.cpp`（**C++20 / ARCH / DSOS**）：缓存行对齐（`alignas(64)` 防 False Sharing）与 `acquire/release` 无锁 SPSC 环形队列 200 万次并发压测。
   - 单跑：`g++ -std=c++20 -O2 -pthread labs_harness/lab01_lockfree_ring.cpp -o /tmp/lab01 && /tmp/lab01`
2. `lab_cpp_workstealing.cpp`（**C++20 / ARCH / DSOS / COMP**）：Chase-Lev 无锁工作窃取双端队列（1 owner + 3 thieves 并发 40 万任务）。
   - 单跑：`g++ -std=c++20 -O2 -pthread labs_harness/lab_cpp_workstealing.cpp -o /tmp/lab_ws && /tmp/lab_ws`
3. `lab02_raft_mvcc_kv.py`（**DBSE / NET / DSOS**）：MVCC 快照隔离（SI）Write-Skew 写偏斜复现与 Raft Log Matching 不变量校验。
4. `lab03_quant_walkforward.py`（**C4 / QUANT / PROB**）：IEEE 754 灾难性相消有理化修复与 Point-in-Time 时间因果防泄漏单测。
5. `lab04_symplectic_verlet.py`（**PHYS / ICPC / DM**）：显式 Euler 发散 vs Velocity-Verlet 辛积分能量守恒对比（10,000 步）与 Tarjan SCC 强连通分量缩点验证。
6. `lab_arch_pipeline_cache.py`（**ARCH**）：5 级 RISC-V 流水线 Load-Use 冒险/旁路转发周期模拟与 64KB 4-way VIPT 缓存别名冲突检测。
7. `lab_ai_autograd.py`（**AI**）：从零实现反向传播自动求导引擎（有限差分梯度校验）与 2 层 MLP 训练 XOR 收敛验证。
8. `lab_comp_pratt_ssa.py`（**COMP**）：Pratt 算符优先递归下降分析器（右结合 `^`）与常量折叠优化器。
9. `lab_la_prob_math.py`（**LA / PROB**）：病态协方差矩阵收缩 + Cholesky SPD 分解求解与 Benjamini-Hochberg FDR 多重假设检验。
