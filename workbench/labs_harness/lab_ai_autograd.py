import math
import random


class Value:
    def __init__(self, data, _children=(), _op=""):
        self.data = float(data)
        self.grad = 0.0
        self._backward = lambda: None
        self._prev = set(_children)
        self._op = _op

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), "+")
        def _bw():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _bw
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), "*")
        def _bw():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = _bw
        return out

    def __sub__(self, other):
        return self + (other * -1.0 if isinstance(other, Value) else Value(-other))

    def tanh(self):
        t = math.tanh(self.data)
        out = Value(t, (self,), "tanh")
        def _bw():
            self.grad += (1.0 - t * t) * out.grad
        out._backward = _bw
        return out

    def backward(self):
        topo, vis = [], set()
        def build(v):
            if v not in vis:
                vis.add(v)
                for ch in v._prev:
                    build(ch)
                topo.append(v)
        build(self)
        self.grad = 1.0
        for v in reversed(topo):
            v._backward()


def run_tests():
    # 1. Numerical gradient check
    a, b = Value(2.0), Value(-3.0)
    f = (a * b + a.tanh()) * (b + 1.5)
    f.backward()
    eps = 1e-6
    fa = ((2.0 + eps) * (-3.0) + math.tanh(2.0 + eps)) * (-3.0 + 1.5)
    fb = (2.0 * (-3.0 + eps) + math.tanh(2.0)) * (-3.0 + eps + 1.5)
    assert abs(a.grad - (fa - f.data) / eps) < 1e-4
    assert abs(b.grad - (fb - f.data) / eps) < 1e-4

    # 2. Train 2-layer MLP on XOR from scratch
    random.seed(7)
    w1 = [[Value(random.uniform(-1, 1)) for _ in range(2)] for _ in range(3)]
    b1 = [Value(0.0) for _ in range(3)]
    w2 = [Value(random.uniform(-1, 1)) for _ in range(3)]
    b2 = Value(0.0)
    params = [p for row in w1 for p in row] + b1 + w2 + [b2]
    xs = [([0, 0], 0.0), ([0, 1], 1.0), ([1, 0], 1.0), ([1, 1], 0.0)]

    for _ in range(250):
        loss = Value(0.0)
        for x, y in xs:
            h = [(w1[i][0] * x[0] + w1[i][1] * x[1] + b1[i]).tanh() for i in range(3)]
            pred = w2[0] * h[0] + w2[1] * h[1] + w2[2] * h[2] + b2
            diff = pred - y
            loss = loss + diff * diff
        for p in params:
            p.grad = 0.0
        loss.backward()
        for p in params:
            p.data -= 0.08 * p.grad
    assert loss.data < 0.02, f"XOR failed to converge: loss={loss.data}"
    print(f"[PASS] lab_ai_autograd: finite-diff grad check OK, XOR MLP final loss={loss.data:.5f}")


if __name__ == "__main__":
    run_tests()
