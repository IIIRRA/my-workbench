#!/usr/bin/env python3
"""Run all 15 Master-Level C++20 and Python labs and assert PASS."""
import os, subprocess, sys, tempfile

DIR = os.path.dirname(os.path.abspath(__file__))
CPP_LABS = [
    ("lab01_lockfree_ring.cpp", ["-O2", "-std=c++20", "-pthread"]),
    ("lab_cpp_workstealing.cpp", ["-O2", "-std=c++20", "-pthread"]),
    ("lab_quant_lob_matching.cpp", ["-O2", "-std=c++20"]),
]
PY_LABS = [
    "lab02_raft_mvcc_kv.py",
    "lab03_quant_walkforward.py",
    "lab04_symplectic_verlet.py",
    "lab_arch_pipeline_cache.py",
    "lab_ai_autograd.py",
    "lab_comp_pratt_ssa.py",
    "lab_la_prob_math.py",
    "lab_net_congestion_bbr.py",
    "lab_db_bptree_wal.py",
    "lab_ai_flash_attention.py",
    "lab_dm_matroid_intersection.py",
    "lab_os_page_cache_clock.py",
]

def main():
    tmp_base = os.path.join(DIR, ".lab_tmp")
    os.makedirs(tmp_base, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=tmp_base) as tmp:
        for src, flags in CPP_LABS:
            exe = os.path.join(tmp, src.replace(".cpp", ""))
            subprocess.check_call(["g++", *flags, os.path.join(DIR, src), "-o", exe])
            out = subprocess.check_output([exe], text=True).strip()
            print(out)
            assert "[PASS]" in out
        for py in PY_LABS:
            out = subprocess.check_output([sys.executable, os.path.join(DIR, py)], text=True).strip()
            print(out)
            assert "[PASS]" in out
    try:
        os.rmdir(tmp_base)
    except OSError:
        pass
    print("\nALL 15 MASTER LABS PASSED!")

if __name__ == "__main__":
    main()
