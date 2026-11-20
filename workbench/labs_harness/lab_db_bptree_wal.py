#!/usr/bin/env python3
"""Master Lab 11 (DBSE): 真实 B+ 树（节点分裂 + 叶子链表范围扫描）+ WAL Redo/Undo 崩溃恢复"""
import json, os, tempfile


class BPlusNode:
    def __init__(self, is_leaf=False):
        self.is_leaf = is_leaf
        self.keys = []
        self.values = []     # used only when is_leaf=True
        self.children = []   # used only when is_leaf=False
        self.next = None     # sibling leaf pointer for range scan


class BPlusTree:
    def __init__(self, max_keys=4):
        self.max_keys = max_keys
        self.root = BPlusNode(is_leaf=True)
        self.splits = 0

    def get(self, key):
        cur = self.root
        while not cur.is_leaf:
            idx = 0
            while idx < len(cur.keys) and key >= cur.keys[idx]:
                idx += 1
            cur = cur.children[idx]
        for k, v in zip(cur.keys, cur.values):
            if k == key:
                return v
        return None

    def range_scan(self, lo, hi):
        cur = self.root
        while not cur.is_leaf:
            idx = 0
            while idx < len(cur.keys) and lo >= cur.keys[idx]:
                idx += 1
            cur = cur.children[idx]
        res = []
        while cur is not None:
            for k, v in zip(cur.keys, cur.values):
                if k > hi:
                    return res
                if k >= lo:
                    res.append((k, v))
            cur = cur.next
        return res

    def put(self, key, val):
        promoted = self._insert(self.root, key, val)
        if promoted is not None:
            sep_key, right_node = promoted
            new_root = BPlusNode(is_leaf=False)
            new_root.keys = [sep_key]
            new_root.children = [self.root, right_node]
            self.root = new_root

    def _insert(self, node, key, val):
        if node.is_leaf:
            for i, k in enumerate(node.keys):
                if k == key:
                    node.values[i] = val
                    return None
                if k > key:
                    node.keys.insert(i, key)
                    node.values.insert(i, val)
                    break
            else:
                node.keys.append(key)
                node.values.append(val)
            if len(node.keys) > self.max_keys:
                self.splits += 1
                mid = len(node.keys) // 2
                right = BPlusNode(is_leaf=True)
                right.keys = node.keys[mid:]
                right.values = node.values[mid:]
                right.next = node.next
                node.keys = node.keys[:mid]
                node.values = node.values[:mid]
                node.next = right
                return (right.keys[0], right)
            return None

        idx = 0
        while idx < len(node.keys) and key >= node.keys[idx]:
            idx += 1
        promoted = self._insert(node.children[idx], key, val)
        if promoted is not None:
            sep_key, right_child = promoted
            node.keys.insert(idx, sep_key)
            node.children.insert(idx + 1, right_child)
            if len(node.keys) > self.max_keys:
                self.splits += 1
                mid = len(node.keys) // 2
                up_key = node.keys[mid]
                right = BPlusNode(is_leaf=False)
                right.keys = node.keys[mid + 1:]
                right.children = node.children[mid + 1:]
                node.keys = node.keys[:mid]
                node.children = node.children[:mid + 1]
                return (up_key, right)
        return None


class WALBPlusEngine:
    def __init__(self, wal_path):
        self.wal_path = wal_path
        self.tree = BPlusTree(max_keys=4)

    def _append(self, rec):
        with open(self.wal_path, "a", encoding="utf-8") as fp:
            fp.write(json.dumps(rec) + "\n")

    def begin(self, txid):
        self._append({"op": "BEGIN", "tx": txid})

    def put(self, txid, key, val):
        old = self.tree.get(key)
        self._append({"op": "PUT", "tx": txid, "k": key, "old": old, "new": val})
        self.tree.put(key, val)

    def commit(self, txid):
        self._append({"op": "COMMIT", "tx": txid})

    def recover_from_crash(self):
        """Simulate power loss: drop entire in-memory B+ Tree, replay WAL Redo + Undo uncommitted"""
        self.tree = BPlusTree(max_keys=4)
        records = []
        if os.path.exists(self.wal_path):
            with open(self.wal_path, "r", encoding="utf-8") as fp:
                for line in fp:
                    if line.strip():
                        records.append(json.loads(line))
        committed = {r["tx"] for r in records if r["op"] == "COMMIT"}
        # Redo all PUTs in LSN order (Repeating History)
        for r in records:
            if r["op"] == "PUT":
                self.tree.put(r["k"], r["new"])
        # Undo uncommitted transactions in reverse LSN order
        for r in reversed(records):
            if r["op"] == "PUT" and r["tx"] not in committed:
                if r["old"] is not None:
                    self.tree.put(r["k"], r["old"])
                else:
                    self.tree.put(r["k"], None)


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as tmp:
        wal = os.path.join(tmp, "bptree.wal")
        db = WALBPlusEngine(wal)
        db.begin(1)
        for k in range(1, 31):
            db.put(1, k, k * 10)
        db.commit(1)
        # Uncommitted crash transaction overwriting keys 5..10
        db.begin(2)
        for k in range(5, 11):
            db.put(2, k, -999)
        # Committed transaction updating key 20 & adding key 35
        db.begin(3)
        db.put(3, 20, 2026)
        db.put(3, 35, 350)
        db.commit(3)

        db.recover_from_crash()
        assert db.tree.splits >= 5, f"Expected real B+ tree splits, got {db.tree.splits}"
        assert db.tree.get(7) == 70, f"Uncommitted tx2 was not undone: {db.tree.get(7)}"
        assert db.tree.get(20) == 2026 and db.tree.get(35) == 350
        rng = db.tree.range_scan(18, 22)
        assert rng == [(18, 180), (19, 190), (20, 2026), (21, 210), (22, 220)], f"Bad range scan: {rng}"
    print(f"[PASS] lab_db_bptree_wal: B+Tree(splits={db.tree.splits}) + range_scan + WAL Redo/Undo verified")
