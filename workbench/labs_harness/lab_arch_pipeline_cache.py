class SetAssociativeCache:
    def __init__(self, size_kb=64, ways=4, line_bytes=64, page_bytes=4096):
        self.ways = ways
        self.line_bytes = line_bytes
        self.page_bytes = page_bytes
        self.sets = (size_kb * 1024) // (ways * line_bytes)
        self.tags = [{} for _ in range(self.sets)]  # set -> {tag: (lru_tick, pfn, color)}
        self.tick = 0
        self.hits = 0
        self.misses = 0
        self.alias_conflicts = 0

    def access(self, va, pa):
        self.tick += 1
        idx = (va // self.line_bytes) % self.sets
        tag = pa // (self.sets * self.line_bytes)
        # Check VIPT alias bits: bits of idx that exceed page_bytes
        color = (va // self.page_bytes) & ((self.sets * self.line_bytes // self.page_bytes) - 1)
        pfn = pa // self.page_bytes
        # Detect if same PFN exists in another set with different color
        for s_id, s_map in enumerate(self.tags):
            if s_id != idx:
                for _, (_, old_pfn, old_col) in s_map.items():
                    if old_pfn == pfn and old_col != color:
                        self.alias_conflicts += 1
        s = self.tags[idx]
        if tag in s:
            self.hits += 1
            s[tag] = (self.tick, pfn, color)
            return True
        self.misses += 1
        if len(s) >= self.ways:
            victim = min(s.items(), key=lambda kv: kv[1][0])[0]
            del s[victim]
        s[tag] = (self.tick, pfn, color)
        return False


def simulate_pipeline_cycles(insts, forwarding=True):
    # inst: (op, rd, rs1, rs2), e.g. ('lw', 's1', 'a1', None)
    # Returns total cycles to complete all instructions
    if not insts:
        return 0
    cycle = 0
    prev_op, prev_rd = None, None
    for op, rd, rs1, rs2 in insts:
        cycle += 1
        if prev_rd and prev_rd != "x0":
            uses_prev = (rs1 == prev_rd) or (rs2 == prev_rd)
            if uses_prev:
                if forwarding:
                    if prev_op == "lw":
                        cycle += 1  # 1 load-use bubble even with EX/MEM forwarding
                else:
                    cycle += 2  # stall without forwarding
        prev_op, prev_rd = op, rd
    return cycle + 4  # drain 5-stage pipeline


def run_tests():
    # 1. VIPT Cache Aliasing test (64KB 4-way > 4KB page -> 4 colors)
    cache = SetAssociativeCache(size_kb=64, ways=4, line_bytes=64, page_bytes=4096)
    pa = 0x8000_0000
    cache.access(0x1000_0000, pa)  # color 0
    cache.access(0x2000_1000, pa)  # color 1 -> synonym!
    assert cache.alias_conflicts >= 1

    # 2. Pipeline Load-Use hazard & scheduling test
    haz_prog = [("lw", "s1", "a1", None), ("add", "s2", "s1", "s3"), ("sub", "s4", "s2", "s3")]
    sched_prog = [("lw", "s1", "a1", None), ("add", "t0", "t1", "t2"), ("add", "s2", "s1", "s3"), ("sub", "s4", "s2", "s3")]
    c_haz = simulate_pipeline_cycles(haz_prog, forwarding=True)
    c_nofwd = simulate_pipeline_cycles(haz_prog, forwarding=False)
    c_sched = simulate_pipeline_cycles(sched_prog, forwarding=True)
    assert c_haz == 8 and c_nofwd == 11 and c_sched == 8  # 4 insts in 8 cycles = 0 bubbles!
    print(f"[PASS] lab_arch_pipeline_cache: VIPT aliases={cache.alias_conflicts}, pipeline cycles haz={c_haz} nofwd={c_nofwd} sched={c_sched}")


if __name__ == "__main__":
    run_tests()
