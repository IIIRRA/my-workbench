// Master Lab 12 (Quant/C++20): Zero-allocation Flat Limit Order Book (LOB) Matching Engine
#include <algorithm>
#include <cassert>
#include <chrono>
#include <cstdint>
#include <iostream>
#include <vector>

struct OrderSlot {
    int32_t price;
    int32_t qty;
    int32_t prev;
    int32_t next;
    bool is_buy;
    bool active;
};

class FlatLOB {
    static constexpr int MAX_PRICE = 2000;
    std::vector<OrderSlot> pool;
    int head_buy[MAX_PRICE], tail_buy[MAX_PRICE];
    int head_sell[MAX_PRICE], tail_sell[MAX_PRICE];
    int best_bid = -1;
    int best_ask = MAX_PRICE;
    int next_id = 1;

public:
    long long matched_vol = 0;

    explicit FlatLOB(int cap) : pool(cap + 2) {
        std::fill(head_buy, head_buy + MAX_PRICE, 0);
        std::fill(tail_buy, tail_buy + MAX_PRICE, 0);
        std::fill(head_sell, head_sell + MAX_PRICE, 0);
        std::fill(tail_sell, tail_sell + MAX_PRICE, 0);
    }

    int add_order(bool is_buy, int price, int qty) {
        if (is_buy) {
            while (qty > 0 && best_ask <= price) {
                int id = head_sell[best_ask];
                if (!id) { best_ask++; continue; }
                int fill = std::min(qty, pool[id].qty);
                qty -= fill;
                pool[id].qty -= fill;
                matched_vol += fill;
                if (pool[id].qty == 0) cancel(id);
            }
        } else {
            while (qty > 0 && best_bid >= price) {
                int id = head_buy[best_bid];
                if (!id) { best_bid--; continue; }
                int fill = std::min(qty, pool[id].qty);
                qty -= fill;
                pool[id].qty -= fill;
                matched_vol += fill;
                if (pool[id].qty == 0) cancel(id);
            }
        }
        if (qty <= 0) return 0;
        int id = next_id++;
        auto& s = pool[id];
        s = {price, qty, 0, 0, is_buy, true};
        int* H = is_buy ? head_buy : head_sell;
        int* T = is_buy ? tail_buy : tail_sell;
        if (!H[price]) { H[price] = T[price] = id; }
        else { pool[T[price]].next = id; s.prev = T[price]; T[price] = id; }
        if (is_buy && price > best_bid) best_bid = price;
        if (!is_buy && price < best_ask) best_ask = price;
        return id;
    }

    void cancel(int id) {
        auto& s = pool[id];
        if (!s.active) return;
        s.active = false;
        int* H = s.is_buy ? head_buy : head_sell;
        int* T = s.is_buy ? tail_buy : tail_sell;
        if (s.prev) pool[s.prev].next = s.next; else H[s.price] = s.next;
        if (s.next) pool[s.next].prev = s.prev; else T[s.price] = s.prev;
    }
};

int main() {
    constexpr int N = 400000;
    FlatLOB lob(N + 10);
    auto t0 = std::chrono::steady_clock::now();
    uint32_t rng = 123456789;
    std::vector<int> live;
    live.reserve(N);
    for (int i = 0; i < N; ++i) {
        rng = rng * 1664525u + 1013904223u;
        bool buy = (rng & 1);
        int price = 980 + int((rng >> 8) % 41);
        int qty = 1 + int((rng >> 16) % 10);
        int id = lob.add_order(buy, price, qty);
        if (id) live.push_back(id);
        if ((i & 3) == 0 && !live.empty()) {
            lob.cancel(live.back());
            live.pop_back();
        }
    }
    auto t1 = std::chrono::steady_clock::now();
    double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
    assert(lob.matched_vol > 0);
    std::cout << "[PASS] lab_quant_lob_matching: " << N << " ops, matched_vol=" << lob.matched_vol
              << " in " << ms << " ms (" << (N / (ms * 1e3)) << " Mops/s)\n";
    return 0;
}
