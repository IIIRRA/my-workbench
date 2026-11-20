#!/usr/bin/env python3
"""Master Lab 13 (AI): FlashAttention-2 分块 Online Softmax 与标准 O(N^2) 注意力逐元素数值验证"""
import math, random

def naive_attention(Q, K, V):
    N, d = len(Q), len(Q[0])
    scale = 1.0 / math.sqrt(d)
    out = [[0.0] * d for _ in range(N)]
    for i in range(N):
        scores = [sum(Q[i][k] * K[j][k] for k in range(d)) * scale for j in range(N)]
        m = max(scores)
        exps = [math.exp(s - m) for s in scores]
        l = sum(exps)
        for j in range(N):
            w = exps[j] / l
            for k in range(d):
                out[i][k] += w * V[j][k]
    return out

def flash_attention_tiled(Q, K, V, Br=8, Bc=8):
    N, d = len(Q), len(Q[0])
    scale = 1.0 / math.sqrt(d)
    O = [[0.0] * d for _ in range(N)]
    for i0 in range(0, N, Br):
        i1 = min(N, i0 + Br)
        rows = i1 - i0
        m_i = [-1e30] * rows
        l_i = [0.0] * rows
        acc = [[0.0] * d for _ in range(rows)]
        for j0 in range(0, N, Bc):
            j1 = min(N, j0 + Bc)
            for r in range(rows):
                qi = Q[i0 + r]
                s_blk = [sum(qi[k] * K[j][k] for k in range(d)) * scale for j in range(j0, j1)]
                m_blk = max(s_blk)
                m_new = max(m_i[r], m_blk)
                alpha = math.exp(m_i[r] - m_new)
                p_blk = [math.exp(s - m_new) for s in s_blk]
                l_new = alpha * l_i[r] + sum(p_blk)
                for k in range(d):
                    pv = sum(p_blk[c] * V[j0 + c][k] for c in range(j1 - j0))
                    acc[r][k] = alpha * acc[r][k] + pv
                m_i[r], l_i[r] = m_new, l_new
        for r in range(rows):
            for k in range(d):
                O[i0 + r][k] = acc[r][k] / l_i[r]
    return O

if __name__ == "__main__":
    rng = random.Random(42)
    N, d = 32, 16
    Q = [[rng.uniform(-1.5, 1.5) for _ in range(d)] for _ in range(N)]
    K = [[rng.uniform(-1.5, 1.5) for _ in range(d)] for _ in range(N)]
    V = [[rng.uniform(-1.5, 1.5) for _ in range(d)] for _ in range(N)]
    ref = naive_attention(Q, K, V)
    flash = flash_attention_tiled(Q, K, V, Br=7, Bc=5)
    max_err = max(abs(ref[i][k] - flash[i][k]) for i in range(N) for k in range(d))
    assert max_err < 1e-12, f"FlashAttention mismatch: max_err={max_err}"
    print(f"[PASS] lab_ai_flash_attention: tiled Online Softmax (N={N}, d={d}, Br=7, Bc=5) max_abs_err={max_err:.2e}")
