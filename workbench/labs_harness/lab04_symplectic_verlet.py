def test_symplectic_vs_euler():
    dt = 0.05
    steps = 10000
    # Harmonic oscillator: a = -x, E = 0.5*(x^2 + v^2) = 0.5
    xe, ve = 1.0, 0.0
    for _ in range(steps):
        xe, ve = xe + ve * dt, ve - xe * dt
    e_euler = 0.5 * (xe * xe + ve * ve)

    xv, vv = 1.0, 0.0
    max_drift = 0.0
    for _ in range(steps):
        vh = vv - 0.5 * xv * dt
        xv = xv + vh * dt
        vv = vh - 0.5 * xv * dt
        max_drift = max(max_drift, abs(0.5 * (xv * xv + vv * vv) - 0.5))

    assert e_euler > 10.0, f"Euler should diverge, got {e_euler}"
    assert max_drift < 1e-3, f"Verlet drift too large: {max_drift}"
    return e_euler, max_drift


def test_tarjan_scc():
    n = 4
    g = [[1], [2], [0, 3], []]
    dfn = [0] * n
    low = [0] * n
    on_stk = [False] * n
    stk = []
    timer = [0]
    sccs = []

    def dfs(u):
        timer[0] += 1
        dfn[u] = low[u] = timer[0]
        stk.append(u)
        on_stk[u] = True
        for v in g[u]:
            if not dfn[v]:
                dfs(v)
                low[u] = min(low[u], low[v])
            elif on_stk[v]:
                low[u] = min(low[u], dfn[v])
        if low[u] == dfn[u]:
            comp = []
            while True:
                w = stk.pop()
                on_stk[w] = False
                comp.append(w)
                if w == u:
                    break
            sccs.append(sorted(comp))

    for i in range(n):
        if not dfn[i]:
            dfs(i)
    assert sorted(sccs) == [[0, 1, 2], [3]]


if __name__ == "__main__":
    e_eu, drift = test_symplectic_vs_euler()
    test_tarjan_scc()
    print(f"[PASS] lab04_symplectic_verlet: Euler E={e_eu:.2e} vs Verlet max_drift={drift:.2e}; Tarjan SCC OK")
