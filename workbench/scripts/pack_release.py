#!/usr/bin/env python3
"""
十四合一学习工作台发布打包脚本（内置门禁校验 + 源码/运行包分离 + 6.5MB 分片 + SHA256）：
  --mode runtime : 仅打包运行所需文件（排除 markdown_src/，体积直降 ~48%）
  --mode full    : 完整归档（含 markdown_src/ 原始源码）
  --out-dir DIR  : 输出目录（默认 ../release_chunks）
  --skip-verify  : 跳过发布前门禁校验（不推荐）
"""
import argparse
import hashlib
import os
import subprocess
import sys
import time
import zipfile

WB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARENT = os.path.dirname(WB)
CHUNK_SIZE = 6815744  # 6.5 MB


def pack(mode, out_dir, skip_verify):
    if not skip_verify:
        print("=== Running pre-release quality gate ===")
        subprocess.check_call([sys.executable, os.path.join(WB, "scripts", "verify_workbench.py")])

    os.makedirs(out_dir, exist_ok=True)
    stamp = time.strftime("%Y%m%d")
    base_name = f"workbench_{stamp}_{mode}.zip"
    zip_path = os.path.join(out_dir, base_name)

    exclude_dirs = {"__pycache__", ".runner_tmp", ".lab_tmp", ".git"}
    if mode == "runtime":
        exclude_dirs.add("markdown_src")

    file_count = 0
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for dirpath, dirnames, filenames in os.walk(WB):
            dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
            for fn in filenames:
                full = os.path.join(dirpath, fn)
                rel = os.path.relpath(full, PARENT)
                zf.write(full, rel)
                file_count += 1

    data = open(zip_path, "rb").read()
    sha = hashlib.sha256(data).hexdigest()
    parts = []
    for i in range(0, len(data), CHUNK_SIZE):
        idx = i // CHUNK_SIZE + 1
        p_name = f"{base_name}.part{idx:02d}"
        with open(os.path.join(out_dir, p_name), "wb") as fp:
            fp.write(data[i : i + CHUNK_SIZE])
        parts.append(p_name)

    readme = (
        f"合并还原命令（mode={mode}，共 {len(parts)} 个分片，{len(data)/(1024*1024):.2f} MB，{file_count} 个文件）：\n"
        f"macOS / Linux: cat {base_name}.part* > {base_name}\n"
        f"Windows CMD:   copy /b {base_name}.part* {base_name}\n"
        f"SHA256: {sha}\n"
    )
    with open(os.path.join(out_dir, "RESTORE_README.txt"), "w", encoding="utf-8") as fp:
        fp.write(readme)

    print(f"\n[PACK OK] mode={mode}, files={file_count}, zip={len(data)/(1024*1024):.2f} MB, parts={len(parts)}")
    print(f"SHA256: {sha}")
    print(f"Output: {out_dir}")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="十四合一工作台门禁打包工具")
    p.add_argument("--mode", choices=["runtime", "full"], default="runtime")
    p.add_argument("--out-dir", default=os.path.join(PARENT, "release_chunks"))
    p.add_argument("--skip-verify", action="store_true")
    a = p.parse_args()
    pack(a.mode, a.out_dir, a.skip_verify)
