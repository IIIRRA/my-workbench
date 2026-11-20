#include <atomic>
#include <cassert>
#include <chrono>
#include <cstdint>
#include <iostream>
#include <optional>
#include <thread>
#include <vector>

// Bounded Chase-Lev Lock-Free Work-Stealing Deque (C++20)
template <typename T, size_t Capacity = 65536>
class WorkStealingDeque {
  static_assert((Capacity & (Capacity - 1)) == 0);
  alignas(64) std::atomic<int64_t> top_{0};
  alignas(64) std::atomic<int64_t> bottom_{0};
  alignas(64) T buf_[Capacity]{};

 public:
  bool try_push(T item) {
    int64_t b = bottom_.load(std::memory_order_relaxed);
    int64_t t = top_.load(std::memory_order_acquire);
    if (b - t >= static_cast<int64_t>(Capacity) - 1) return false;
    buf_[b & (Capacity - 1)] = item;
    std::atomic_thread_fence(std::memory_order_release);
    bottom_.store(b + 1, std::memory_order_relaxed);
    return true;
  }

  std::optional<T> pop() {
    int64_t b = bottom_.load(std::memory_order_relaxed) - 1;
    bottom_.store(b, std::memory_order_relaxed);
    std::atomic_thread_fence(std::memory_order_seq_cst);
    int64_t t = top_.load(std::memory_order_relaxed);
    if (t <= b) {
      T item = buf_[b & (Capacity - 1)];
      if (t == b) {
        if (!top_.compare_exchange_strong(t, t + 1, std::memory_order_seq_cst,
                                          std::memory_order_relaxed)) {
          bottom_.store(b + 1, std::memory_order_relaxed);
          return std::nullopt;
        }
        bottom_.store(b + 1, std::memory_order_relaxed);
      }
      return item;
    }
    bottom_.store(b + 1, std::memory_order_relaxed);
    return std::nullopt;
  }

  std::optional<T> steal() {
    int64_t t = top_.load(std::memory_order_acquire);
    std::atomic_thread_fence(std::memory_order_seq_cst);
    int64_t b = bottom_.load(std::memory_order_acquire);
    if (t < b) {
      T item = buf_[t & (Capacity - 1)];
      if (!top_.compare_exchange_strong(t, t + 1, std::memory_order_seq_cst,
                                        std::memory_order_relaxed)) {
        return std::nullopt;
      }
      return item;
    }
    return std::nullopt;
  }
};

int main() {
  constexpr int64_t TOTAL = 400'000;
  WorkStealingDeque<int64_t, 65536> dq;
  std::atomic<int64_t> owner_sum{0};
  std::atomic<int64_t> thief_sum{0};
  std::atomic<int64_t> done_cnt{0};

  auto t0 = std::chrono::steady_clock::now();
  std::thread owner([&]() {
    int64_t local_sum = 0, local_cnt = 0;
    for (int64_t i = 1; i <= TOTAL; ++i) {
      while (!dq.try_push(i)) {
        if (auto v = dq.pop()) {
          local_sum += *v;
          ++local_cnt;
        } else {
          std::this_thread::yield();
        }
      }
      if ((i & 3) == 0) {
        if (auto v = dq.pop()) {
          local_sum += *v;
          ++local_cnt;
        }
      }
    }
    while (auto v = dq.pop()) {
      local_sum += *v;
      ++local_cnt;
    }
    owner_sum.fetch_add(local_sum, std::memory_order_relaxed);
    done_cnt.fetch_add(local_cnt, std::memory_order_release);
  });

  std::vector<std::thread> thieves;
  for (int w = 0; w < 3; ++w) {
    thieves.emplace_back([&]() {
      int64_t s = 0, c = 0;
      while (done_cnt.load(std::memory_order_acquire) < TOTAL) {
        if (auto v = dq.steal()) {
          s += *v;
          ++c;
          done_cnt.fetch_add(1, std::memory_order_release);
        } else {
          std::this_thread::yield();
        }
      }
      thief_sum.fetch_add(s, std::memory_order_relaxed);
    });
  }

  owner.join();
  for (auto& th : thieves) th.join();
  auto t1 = std::chrono::steady_clock::now();
  double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();

  int64_t total_sum = owner_sum.load() + thief_sum.load();
  int64_t expected = TOTAL * (TOTAL + 1) / 2;
  assert(done_cnt.load() == TOTAL);
  assert(total_sum == expected);
  std::cout << "[PASS] lab_cpp_workstealing: 400k tasks (1 owner + 3 thieves), stolen_sum="
            << thief_sum.load() << ", " << ms << " ms\n";
  return 0;
}
