import math


def cholesky(A):
    n = len(A)
    L = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1):
            s = sum(L[i][k] * L[j][k] for k in range(j))
            if i == j:
                val = A[i][i] - s
                if val <= 0:
                    raise ValueError("Matrix not SPD")
                L[i][j] = math.sqrt(val)
            else:
                L[i][j] = (A[i][j] - s) / L[j][j]
    return L


def solve_cholesky(A, b):
    L = cholesky(A)
    n = len(A)
    y = [0.0] * n
    for i in range(n):
        y[i] = (b[i] - sum(L[i][k] * y[k] for k in range(i))) / L[i][i]
    x = [0.0] * n
    for i in range(n - 1, -1, -1):
        x[i] = (y[i] - sum(L[k][i] * x[k] for k in range(i + 1, n))) / L[i][i]
    return x


def benjamini_hochberg_fdr(p_vals, alpha=0.05):
    m = len(p_vals)
    indexed = sorted(enumerate(p_vals), key=lambda x: x[1])
    max_k = -1
    for rank, (_, p) in enumerate(indexed, 1):
        if p <= (rank / m) * alpha:
            max_k = rank
    rejected = [False] * m
    if max_k > 0:
        for idx, _ in indexed[:max_k]:
            rejected[idx] = True
    return rejected


def run_tests():
    # 1. Ill-conditioned covariance matrix + shrinkage stabilization -> Cholesky
    cov_ill = [[1.0, 0.999999], [0.999999, 1.0]]
    lam = 0.05
    cov_shrunk = [[(1 - lam) * cov_ill[i][j] + (lam if i == j else 0.0) for j in range(2)] for i in range(2)]
    x = solve_cholesky(cov_shrunk, [1.0, 1.0])
    # Verify A*x == b
    r0 = cov_shrunk[0][0] * x[0] + cov_shrunk[0][1] * x[1]
    assert abs(r0 - 1.0) < 1e-10

    # 2. BH-FDR multiple hypothesis testing
    pvals = [0.001, 0.008, 0.039, 0.041, 0.25, 0.60]
    rej = benjamini_hochberg_fdr(pvals, alpha=0.05)
    assert rej == [True, True, False, False, False, False]
    print("[PASS] lab_la_prob_math: Cholesky SPD solver + covariance shrinkage + BH-FDR verified")


if __name__ == "__main__":
    run_tests()
