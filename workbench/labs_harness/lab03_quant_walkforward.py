import math
import random


def test_numerical_cancellation():
    x = 1e16
    naive = math.sqrt(x + 1.0) - math.sqrt(x)
    stable = 1.0 / (math.sqrt(x + 1.0) + math.sqrt(x))
    assert naive == 0.0, f"Expected naive cancellation to 0, got {naive}"
    assert abs(stable - 5e-9) < 1e-13


def test_time_causality_leakage():
    random.seed(42)
    prices_a = [100.0]
    for _ in range(99):
        prices_a.append(prices_a[-1] * (1.0 + random.uniform(-0.02, 0.02)))

    # Perturb future prices after t=50
    prices_b = list(prices_a)
    for t in range(51, 100):
        prices_b[t] *= 1.5

    def causal_momentum_signal(prices, t):
        if t < 5:
            return 0.0
        return prices[t] / prices[t - 5] - 1.0

    # Causality invariant: signals for t <= 50 must be bit-identical
    for t in range(51):
        assert causal_momentum_signal(prices_a, t) == causal_momentum_signal(prices_b, t)


if __name__ == "__main__":
    test_numerical_cancellation()
    test_time_causality_leakage()
    print("[PASS] lab03_quant_walkforward: cancellation fix & PIT causality unit tests passed")
