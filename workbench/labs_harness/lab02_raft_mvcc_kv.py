class MVCCStore:
    def __init__(self):
        self.ts = 0
        self.versions = {"alice": [(0, 1)], "bob": [(0, 1)]}  # on-call count

    def begin(self):
        self.ts += 1
        return {"snap": self.ts, "writes": {}, "reads": set()}

    def read(self, tx, key):
        tx["reads"].add(key)
        for ver_ts, val in reversed(self.versions[key]):
            if ver_ts <= tx["snap"]:
                return val
        return None

    def write(self, tx, key, val):
        tx["writes"][key] = val

    def commit_si(self, tx):
        # First-committer-wins on write-write conflict only (allows Write Skew!)
        commit_ts = self.ts + 1
        for k in tx["writes"]:
            latest_ts = self.versions[k][-1][0]
            if latest_ts > tx["snap"]:
                return False
        self.ts = commit_ts
        for k, v in tx["writes"].items():
            self.versions[k].append((commit_ts, v))
        return True


def test_write_skew_and_raft_invariants():
    store = MVCCStore()
    t1 = store.begin()
    t2 = store.begin()
    # Both see 2 doctors on call
    assert store.read(t1, "alice") + store.read(t1, "bob") == 2
    assert store.read(t2, "alice") + store.read(t2, "bob") == 2
    # Each updates a disjoint row
    store.write(t1, "alice", 0)
    store.write(t2, "bob", 0)
    assert store.commit_si(t1) is True
    assert store.commit_si(t2) is True  # SI permits Write Skew!
    # Verify invariant broken under SI (0 doctors left)
    final_on_call = store.versions["alice"][-1][1] + store.versions["bob"][-1][1]
    assert final_on_call == 0

    # Raft Log Matching Property check
    leader_log = [(1, "x=1"), (1, "y=2"), (2, "z=3")]
    follower_log = [(1, "x=1"), (1, "y=2")]
    prev_idx, prev_term = 1, 1
    ok = (
        prev_idx < len(follower_log)
        and follower_log[prev_idx][0] == prev_term
        and follower_log[: prev_idx + 1] == leader_log[: prev_idx + 1]
    )
    assert ok
    print("[PASS] lab02_raft_mvcc_kv: SI Write-Skew reproduced & Raft Log Matching verified")


if __name__ == "__main__":
    test_write_skew_and_raft_invariants()
