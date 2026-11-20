#!/usr/bin/env python3
"""Master Lab 15 (OS/DB): 纯 LRU vs 2Q 扫描抵抗缓存置换算法（复现全表扫描击穿与热集保护）"""
from collections import OrderedDict, deque

def run_lru(trace, cap):
    cache = OrderedDict()
    hits = 0
    for p in trace:
        if p in cache:
            hits += 1
            cache.move_to_end(p)
        else:
            if len(cache) >= cap:
                cache.popitem(last=False)
            cache[p] = True
    return hits / len(trace)

def run_2q(trace, cap):
    a1_cap = max(2, cap // 4)
    am_cap = cap - a1_cap
    a1 = OrderedDict()     # FIFO probation queue (first-time pages)
    am = OrderedDict()     # LRU protected queue (re-referenced hot pages)
    ghost = OrderedDict()  # Ghost history of recently evicted a1 pages
    hits = 0
    for p in trace:
        if p in am:
            hits += 1
            am.move_to_end(p)
        elif p in a1:
            hits += 1
            del a1[p]
            if len(am) >= am_cap:
                am.popitem(last=False)
            am[p] = True
        else:
            if p in ghost:
                del ghost[p]
                if len(am) >= am_cap:
                    am.popitem(last=False)
                am[p] = True
            else:
                if len(a1) >= a1_cap:
                    ev, _ = a1.popitem(last=False)
                    ghost[ev] = True
                    if len(ghost) > cap * 2:
                        ghost.popitem(last=False)
                a1[p] = True
    return hits / len(trace)

if __name__ == "__main__":
    # Hot working set (12 pages) + periodic 80-page sequential full-table scans
    trace = []
    for round_idx in range(12):
        # Hot working set accesses
        for _ in range(6):
            for p in range(1, 13):
                trace.append(p)
        # Cold sequential scan (pollutes pure LRU!)
        base = 1000 + round_idx * 100
        for p in range(base, base + 80):
            trace.append(p)
    cap = 20
    hit_lru = run_lru(trace, cap)
    hit_2q = run_2q(trace, cap)
    assert hit_2q - hit_lru > 0.06, f"Expected 2Q to significantly beat LRU under scan pollution: 2Q={hit_2q:.3f}, LRU={hit_lru:.3f}"
    print(f"[PASS] lab_os_page_cache_clock: scan-polluted workload hit rate LRU={hit_lru:.1%} vs 2Q={hit_2q:.1%} (+{(hit_2q-hit_lru)*100:.1f}pp)")
