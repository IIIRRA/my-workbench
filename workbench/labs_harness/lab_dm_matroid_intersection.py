#!/usr/bin/env python3
"""Master Lab 14 (DM/ICPC): 拟阵交 (图拟阵 ∩ 颜色划分拟阵) 交换图 BFS 增广 vs 暴力最大彩虹森林"""
from collections import deque
import itertools, random

def is_acyclic(n, edges, subset):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for idx in subset:
        u, v, _ = edges[idx]
        ru, rv = find(u), find(v)
        if ru == rv:
            return False
        parent[ru] = rv
    return True

def is_rainbow(edges, subset):
    seen = set()
    for idx in subset:
        c = edges[idx][2]
        if c in seen:
            return False
        seen.add(c)
    return True

def matroid_intersection(n, edges):
    m = len(edges)
    I = set()
    while True:
        # X1: y not in I s.t. I+y acyclic; X2: y not in I s.t. I+y rainbow
        X1 = [y for y in range(m) if y not in I and is_acyclic(n, edges, I | {y})]
        X2 = set(y for y in range(m) if y not in I and is_rainbow(edges, I | {y}))
        # Build exchange graph D(I)
        adj = {i: [] for i in range(m)}
        for x in I:
            I_minus_x = I - {x}
            for y in range(m):
                if y in I:
                    continue
                if is_acyclic(n, edges, I_minus_x | {y}):
                    adj[x].append(y)  # M1 edge: x -> y
                if is_rainbow(edges, I_minus_x | {y}):
                    adj[y].append(x)  # M2 edge: y -> x
        # Multi-source BFS from X1 to X2
        prev = {y: -1 for y in X1}
        q = deque(X1)
        target = -1
        while q:
            u = q.popleft()
            if u in X2:
                target = u
                break
            for v in adj[u]:
                if v not in prev:
                    prev[v] = u
                    q.append(v)
        if target == -1:
            break
        cur = target
        while cur != -1:
            if cur in I: I.remove(cur)
            else: I.add(cur)
            cur = prev[cur]
    return I

if __name__ == "__main__":
    rng = random.Random(2026)
    n = 7
    edges = []
    for _ in range(15):
        u, v = rng.sample(range(n), 2)
        c = rng.randint(0, 5)
        edges.append((u, v, c))
    sol = matroid_intersection(n, edges)
    assert is_acyclic(n, edges, sol) and is_rainbow(edges, sol)
    # Brute-force verify exact optimality
    best_bf = 0
    for r in range(len(edges), -1, -1):
        found = False
        for comb in itertools.combinations(range(len(edges)), r):
            if is_acyclic(n, edges, comb) and is_rainbow(edges, comb):
                best_bf = r
                found = True
                break
        if found:
            break
    assert len(sol) == best_bf, f"Matroid intersection {len(sol)} != brute force {best_bf}"
    print(f"[PASS] lab_dm_matroid_intersection: Graphic ∩ Partition matroid max rainbow forest size={len(sol)} (matches brute-force)")
