#!/usr/bin/env python3
"""
统一构建脚本：
1. 从 markdown_src/<学科>/ 重新生成 data/<学科>/core.js、docs_c*.js、bank_c*.js（以及 c4 的 data/c4/math_data.js）。
2. 从 templates/subject.html.tpl + subjects_manifest.json 统一渲染 13 科标准 HTML，并自动同步分片清单与题数。

用法：
  python3 build_data.py                 # 全量构建数据并渲染全部 13 科 HTML
  python3 build_data.py icpc la         # 仅构建指定学科并同步其 HTML
  python3 build_data.py --render-html   # 仅根据模板与当前磁盘分片重渲染全部 13 科 HTML
"""
import os, sys, re, json

WB = os.path.dirname(os.path.abspath(__file__))
MD_ROOT = os.path.join(WB, 'markdown_src')
DATA_ROOT = os.path.join(WB, 'data')
TPL_PATH = os.path.join(WB, 'templates', 'subject.html.tpl')
MANIFEST_PATH = os.path.join(WB, 'subjects_manifest.json')
SLUGS_13 = ['icpc', 'cpp', 'ai', 'phys', 'dbse', 'dsos', 'prob', 'dm', 'la', 'comp', 'arch', 'net', 'quant']
ALL_SLUGS = ['c4'] + SLUGS_13


def _list_chunks(slug):
    s_data = os.path.join(DATA_ROOT, slug)
    doc_chunks = sorted(
        [f'data/{slug}/{f}' for f in os.listdir(s_data) if f.startswith('docs_c') and f.endswith('.js')],
        key=lambda x: int(re.search(r'docs_c(\d+)', x).group(1)),
    )
    bank_chunks = sorted(
        [f'data/{slug}/{f}' for f in os.listdir(s_data) if f.startswith('bank_c') and f.endswith('.js')],
        key=lambda x: int(re.search(r'bank_c(\d+)', x).group(1)),
    )
    return doc_chunks, bank_chunks


def render_subject_htmls(only_slugs=None, bank_counts=None):
    """基于 templates/subject.html.tpl + subjects_manifest.json 渲染指定或全部 13 科 HTML"""
    if not os.path.exists(TPL_PATH) or not os.path.exists(MANIFEST_PATH):
        return 0
    tpl = open(TPL_PATH, encoding='utf-8').read()
    manifest = json.load(open(MANIFEST_PATH, encoding='utf-8'))
    bank_counts = bank_counts or {}
    rendered = 0
    changed_manifest = False
    for entry in manifest:
        slug = entry['slug']
        if only_slugs and slug not in only_slugs:
            continue
        doc_chunks, bank_chunks = _list_chunks(slug)
        cfg = entry['config']
        if cfg.get('docChunks') != doc_chunks or cfg.get('bankChunks') != bank_chunks:
            cfg['docChunks'] = doc_chunks
            cfg['bankChunks'] = bank_chunks
            changed_manifest = True
        if slug in bank_counts:
            bc = bank_counts[slug]
            new_val = f'{bc:,}' if bc >= 1000 else str(bc)
            if cfg.get('stat3Val') != new_val:
                cfg['stat3Val'] = new_val
                changed_manifest = True
        html = (
            tpl.replace('{{TITLE}}', entry['title'])
            .replace('{{BRAND}}', entry['brand'])
            .replace('{{TREE_BTN}}', entry['treeBtn'])
            .replace('{{SLUG}}', slug)
            .replace('{{SUBJECT_NAME_JSON}}', json.dumps(entry['subjectName'], ensure_ascii=False))
            .replace('{{CONFIG_JSON}}', json.dumps(cfg, ensure_ascii=False))
        )
        with open(os.path.join(WB, entry['file']), 'w', encoding='utf-8') as fp:
            fp.write(html)
        rendered += 1
    if changed_manifest:
        with open(MANIFEST_PATH, 'w', encoding='utf-8') as fp:
            json.dump(manifest, fp, ensure_ascii=False, indent=2)
    return rendered


def rebuild_c4():
    c4_md = os.path.join(MD_ROOT, 'c4')
    docs_dir = os.path.join(c4_md, 'docs')
    bank_dir = os.path.join(c4_md, 'bank')
    tail_path = os.path.join(c4_md, 'runtime_tail.js')

    stages = []
    knowledge_bases = []
    for fn in sorted(os.listdir(docs_dir)):
        if not fn.endswith('.md'):
            continue
        txt = open(os.path.join(docs_dir, fn), encoding='utf-8').read()
        for m in re.finditer(r'<!--\s*wb:c4_stage\s+(\{.*?\})\s*-->', txt):
            stages.append(json.loads(m.group(1)))
        if 'wb:c4_kb' in txt:
            parts = re.split(r'<!--\s*wb:c4_kb\s+(\{.*?\})\s*-->\n?', txt)
            for i in range(1, len(parts), 2):
                kb = json.loads(parts[i])
                kb['content'] = parts[i + 1].strip()
                knowledge_bases.append(kb)

    problems = []
    fault_bank = []
    for fn in sorted(os.listdir(bank_dir)):
        if not fn.endswith('.md'):
            continue
        txt = open(os.path.join(bank_dir, fn), encoding='utf-8').read()
        for m in re.finditer(r'<!--\s*wb:c4_prob\s+(\{.*?\})\s*-->', txt):
            problems.append(json.loads(m.group(1)))
        for m in re.finditer(r'<!--\s*wb:c4_fault\s+(\{.*?\})\s*-->', txt):
            fault_bank.append(json.loads(m.group(1)))

    tail_js = open(tail_path, encoding='utf-8').read()
    math_data = {
        'stages': stages,
        'problems': problems,
        'knowledge_bases': knowledge_bases,
    }
    out_js = (
        f'const MATH_DATA = {json.dumps(math_data, ensure_ascii=False)};\n'
        f'const FAULT_BANK = {json.dumps(fault_bank, ensure_ascii=False)};'
        f'{tail_js}'
    )
    with open(os.path.join(DATA_ROOT, 'c4', 'math_data.js'), 'w', encoding='utf-8') as f:
        f.write(out_js)
    return len(stages), len(knowledge_bases), len(problems), len(fault_bank)


def rebuild_13_subject(slug):
    s_md = os.path.join(MD_ROOT, slug)
    s_data = os.path.join(DATA_ROOT, slug)
    if not os.path.isdir(s_md) or not os.path.isdir(s_data):
        return 0, 0
    docs = []
    docs_dir = os.path.join(s_md, 'docs')
    for fn in sorted(os.listdir(docs_dir)):
        if not fn.endswith('.md'):
            continue
        txt = open(os.path.join(docs_dir, fn), encoding='utf-8').read()
        parts = re.split(r'<!--\s*wb:doc\s+(\{.*?\})\s*-->\n?', txt)
        for i in range(1, len(parts), 2):
            meta = json.loads(parts[i])
            meta['content'] = parts[i + 1].strip()
            docs.append(meta)

    bank = []
    bank_dir = os.path.join(s_md, 'bank')
    for fn in sorted(os.listdir(bank_dir)):
        if not fn.endswith('.md'):
            continue
        txt = open(os.path.join(bank_dir, fn), encoding='utf-8').read()
        for m in re.finditer(r'<!--\s*wb:prob\s+(\{.*?\})\s*-->', txt):
            bank.append(json.loads(m.group(1)))

    old_core = open(os.path.join(s_data, 'core.js'), encoding='utf-8').read()
    rm = re.search(r'window\.__WB_ROADMAP__\s*=\s*(.*?);\n', old_core, re.S).group(1)
    tb = re.search(r'window\.__WB_TEXTBOOK__\s*=\s*(.*?);\n', old_core, re.S).group(1)
    cs = re.search(r'window\.__WB_CHEATSHEET__\s*=\s*(.*?);\n', old_core, re.S).group(1)

    for fn in os.listdir(s_data):
        if fn.startswith('docs_c') or fn.startswith('bank_c'):
            os.remove(os.path.join(s_data, fn))

    meta_docs, cur_chunk, cur_size, chunk_idx = [], {}, 0, 0
    for idx_d, d in enumerate(docs):
        dc = dict(d)
        content = dc.pop('content', '')
        if idx_d == 0:
            dc['content'] = content
            dc['_loaded'] = True
        else:
            dc['content'] = ''
            dc['_loaded'] = False
            cur_chunk[d['id']] = content
            cur_size += len(content.encode('utf-8'))
            if cur_size >= 300 * 1024:
                with open(os.path.join(s_data, f'docs_c{chunk_idx}.js'), 'w', encoding='utf-8') as cf:
                    cf.write(f'window.__WB_HYDRATE_DOCS__({json.dumps(cur_chunk, ensure_ascii=False)});')
                chunk_idx += 1
                cur_chunk = {}
                cur_size = 0
        meta_docs.append(dc)
    if cur_chunk:
        with open(os.path.join(s_data, f'docs_c{chunk_idx}.js'), 'w', encoding='utf-8') as cf:
            cf.write(f'window.__WB_HYDRATE_DOCS__({json.dumps(cur_chunk, ensure_ascii=False)});')

    heavy_keys = ('keyInsight', 'hints', 'cpp', 'complexity', 'solution', 'sol', 'statement', 'md', 'body', 'content')
    meta_bank, cur_bchunk, cur_bsize, bidx = [], {}, 0, 0
    for idx_b, b in enumerate(bank):
        bc, bh = {}, {}
        for k, v in b.items():
            if k in heavy_keys:
                bh[k] = v
            else:
                bc[k] = v
        if idx_b < 20:
            bc.update(bh)
            bc['_loaded'] = True
        else:
            bc['_loaded'] = False
            cur_bchunk[b['pid']] = bh
            cur_bsize += len(json.dumps(bh, ensure_ascii=False).encode('utf-8'))
            if cur_bsize >= 450 * 1024:
                with open(os.path.join(s_data, f'bank_c{bidx}.js'), 'w', encoding='utf-8') as cf:
                    cf.write(f'window.__WB_HYDRATE_BANK__({json.dumps(cur_bchunk, ensure_ascii=False)});')
                bidx += 1
                cur_bchunk = {}
                cur_bsize = 0
        meta_bank.append(bc)
    if cur_bchunk:
        with open(os.path.join(s_data, f'bank_c{bidx}.js'), 'w', encoding='utf-8') as cf:
            cf.write(f'window.__WB_HYDRATE_BANK__({json.dumps(cur_bchunk, ensure_ascii=False)});')

    core_js = (
        f'window.__WB_DOCS__ = {json.dumps(meta_docs, ensure_ascii=False)};\n'
        f'window.__WB_BANK__ = {json.dumps(meta_bank, ensure_ascii=False)};\n'
        f'window.__WB_ROADMAP__ = {rm};\n'
        f'window.__WB_TEXTBOOK__ = {tb};\n'
        f'window.__WB_CHEATSHEET__ = {cs};\n'
    )
    with open(os.path.join(s_data, 'core.js'), 'w', encoding='utf-8') as f:
        f.write(core_js)
    render_subject_htmls(only_slugs={slug}, bank_counts={slug: len(bank)})
    return len(docs), len(bank)


if __name__ == '__main__':
    args = sys.argv[1:]
    if '--render-html' in args:
        n = render_subject_htmls()
        print(f'[render-html] rendered {n} subject HTML files from template')
        sys.exit(0)
    targets = args if args else ALL_SLUGS
    for s in targets:
        if s == 'c4':
            st_c, kb_c, pr_c, fb_c = rebuild_c4()
            print(f'[c4] synced {st_c} stages, {kb_c} knowledge_bases, {pr_c} problems, {fb_c} fault_bank')
        else:
            d_cnt, b_cnt = rebuild_13_subject(s)
            print(f'[{s}] synced {d_cnt} docs, {b_cnt} problems')
