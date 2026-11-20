#include <atomic>
#include <cassert>
#include <chrono>
#include <cstdint>
#include <iostream>
#include <thread>
#include <vector>

template <typename T, size_t Capacity>
class SPSCRingBuffer {
  static_assert((Capacity & (Capacity - 1)) == 0, "Capacity must be power of 2");
  alignas(64) std::atomic<size_t> head_{0};
  alignas(64) std::atomic<size_t> tail_{0};
  alignas(64) T buf_[Capacity]{};

 public:
  bool try_push(const T& v) {
    const size_t t = tail_.load(std::memory_order_relaxed);
    const size_t next = (t + 1) & (Capacity - 1);
    if (next == head_.load(std::memory_order_acquire)) return false;
    buf_[t] = v;
    tail_.store(next, std::memory_order_release);
    return true;
  }

  bool try_pop(T& out) {
    const size_t h = head_.load(std::memory_order_relaxed);
    if (h == tail_.load(std::memory_order_acquire)) return false;
    out = buf_[h];
    head_.store((h + 1) & (Capacity - 1), std::memory_order_release);
    return true;
  }
};

int main() {
  constexpr uint64_t N = 2'000'000;
  SPSCRingBuffer<uint64_t, 4096> q;
  uint64_t checksum_prod = 0, checksum_cons = 0;

  auto t0 = std::chrono::steady_clock::now();
  std::thread producer([&]() {
    for (uint64_t i = 1; i <= N; ++i) {
      while (!q.try_push(i)) {
        std::this_thread::yield();
      }
      checksum_prod += i;
    }
  });
  std::thread consumer([&]() {
    uint64_t cnt = 0, val = 0;
    while (cnt < N) {
      if (q.try_pop(val)) {
        assert(val == cnt + 1);
        checksum_cons += val;
        ++cnt;
      } else {
        std::this_thread::yield();
      }
    }
  });
  producer.join();
  consumer.join();
  auto t1 = std::chrono::steady_clock::now();
  double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();

  assert(checksum_prod == checksum_cons);
  assert(checksum_prod == N * (N + 1) / 2);
  std::cout << "[PASS] lab01_lockfree_ring: " << N << " ops in " << ms << " ms ("
            << (N / (ms / 1000.0) / 1e6) << " Mops/s)\n";
  return 0;
}
