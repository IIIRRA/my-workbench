#!/usr/bin/env python3
"""Master Lab 10 (Network): TCP CUBIC vs BBRv1 浅缓冲/深缓冲吞吐占比反转仿真（基于 Inflight 队列动力学）"""

def simulate_bottleneck(buffer_pkts: int, steps: int = 500):
    bdp = 40.0  # 1 BDP = 40 packets
    cubic_cwnd = 20.0
    bbr_inflight_cap = 2.0 * bdp  # BBRv1 caps inflight at 2 * BDP
    cubic_delivered = 0.0
    bbr_delivered = 0.0

    for t in range(steps):
        # BBRv1 ProbeRTT briefly drops inflight cap
        bbr_inf = 0.5 * bdp if (t % 100 == 95) else bbr_inflight_cap
        total_inf = cubic_cwnd + bbr_inf
        cap_total = bdp + buffer_pkts

        # Bottleneck bandwidth share is proportional to each flow's share of inflight packets
        cubic_share = cubic_cwnd / total_inf
        bbr_share = bbr_inf / total_inf
        cubic_delivered += bdp * cubic_share
        bbr_delivered += bdp * bbr_share

        if total_inf > cap_total:
            # Queue overflow triggers packet loss -> ONLY CUBIC performs multiplicative decrease (0.7x)
            cubic_cwnd = max(4.0, cubic_cwnd * 0.7)
        else:
            # No loss -> CUBIC probes aggressively to fill remaining buffer
            cubic_cwnd = min(cap_total, cubic_cwnd + 4.0)

    tot = cubic_delivered + bbr_delivered
    return cubic_delivered / tot, bbr_delivered / tot


if __name__ == "__main__":
    c_shallow, b_shallow = simulate_bottleneck(buffer_pkts=20)   # 0.5 BDP shallow buffer
    c_deep, b_deep = simulate_bottleneck(buffer_pkts=320)        # 8.0 BDP deep buffer
    assert b_shallow > 0.75, f"Expected BBRv1 to dominate shallow buffer, got {b_shallow:.2f}"
    assert c_deep > 0.70, f"Expected CUBIC to dominate deep buffer, got {c_deep:.2f}"
    print(f"[PASS] lab_net_congestion_bbr: shallow(BBR={b_shallow:.1%}, CUBIC={c_shallow:.1%}) vs deep(BBR={b_deep:.1%}, CUBIC={c_deep:.1%})")
