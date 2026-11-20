/* === ICPC_V2_TEXTBOOK_ZERO_START === */
(function(){
  if (window.__icpcV2Init) return;
  window.__icpcV2Init = true;

  window.__legacyRenderIcpcTextbooks = function() {
    const main = document.getElementById('main') || document.querySelector('main');
    if (!main || typeof DOCS === 'undefined') return;
    const tbDocs = DOCS.filter(d => /教材|进阶指南|算法导论|紫书|蓝书|入门|零基础|基础/.test((d.title||'') + (d.sub||'') + (d.group||'')));
    const list = tbDocs.length ? tbDocs : DOCS.slice(0, 30);
    main.innerHTML = `<div style="padding:20px;max-width:1100px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
        <div>
          <h2 style="margin:0;">📚 教材复现与 🌱 零基础起步中心</h2>
          <p style="margin:4px 0 0;color:var(--muted);font-size:13px;">汇总《算法竞赛进阶指南》/ 经典教材与零基础入门篇（共 ${list.length} 篇），点击直接打开精解</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="openGenericBookBundle('icpc-raw-book-host','ICPC________b01','books_data/ICPC________b01.js','ICPC 经典教材精讲')">📖 加载教材分册库</button>
          <button class="btn" onclick="renderAlgoTree()">🌳 算法树状图</button>
          <button class="btn" onclick="renderHome()">← 返回总览</button>
        </div>
      </div>
      <div id="icpc-raw-book-host"></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px;">
        ${list.map((d, i) => `<div style="border:1px solid var(--border-strong, #cbd5e1);border-radius:14px;padding:14px 16px;background:var(--card);cursor:pointer;" onclick="if(typeof openDoc==='function'){openDoc('${d.id}')}else if(typeof selectDoc==='function'){selectDoc('${d.id}')}">
          <div style="font-size:11px;color:#10b981;font-weight:700;margin-bottom:4px;">#${i+1} · ${d.group || '核心专题'}</div>
          <div style="font-weight:700;font-size:14px;line-height:1.4;">${d.title}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px;">${(d.sub||'').slice(0,48)}</div>
        </div>`).join('')}
      </div>
    </div>`;
  };
})();
/* === ICPC_V2_TEXTBOOK_ZERO_END === */
;
(function(){
  const PAGE_KEY = (function(){ var raw = location.pathname.split('/').pop() || document.title || 'workbench'; try { raw = decodeURIComponent(raw); } catch(_) {} return raw.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_'); })();
  const STORE_KEY = 'wb_custom_ai_docs_v1:' + PAGE_KEY;
  const isICPC = document.title.includes('ICPC') || !!document.getElementById('docs-data');
  const isWbData = !!document.getElementById('wb-data');

  function escHtml(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function mdToSafeHtml(md){
    const stash = [];
    let s = String(md||'');
    s = s.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+?\$/g, m => { stash.push(m); return '\u0000M'+(stash.length-1)+'\u0000'; });
    s = s.replace(/```([\w+-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      stash.push('<pre><code>' + escHtml(code) + '</code></pre>');
      return '\u0000M'+(stash.length-1)+'\u0000';
    });
    s = s.replace(/`([^`\n]+?)`/g, (_, c) => {
      stash.push('<code>' + escHtml(c) + '</code>');
      return '\u0000M'+(stash.length-1)+'\u0000';
    });
    const lines = s.split(/\r?\n/);
    const out = [];
    let inUl = false;
    for(const raw of lines){
      const t = raw.trim();
      if(!t){ if(inUl){ out.push('</ul>'); inUl=false; } continue; }
      if(t.startsWith('### ')){ if(inUl){out.push('</ul>');inUl=false;} out.push('<h4>'+escHtml(t.slice(4))+'</h4>'); }
      else if(t.startsWith('## ')){ if(inUl){out.push('</ul>');inUl=false;} out.push('<h3>'+escHtml(t.slice(3))+'</h3>'); }
      else if(t.startsWith('# ')){ if(inUl){out.push('</ul>');inUl=false;} out.push('<h3>'+escHtml(t.slice(2))+'</h3>'); }
      else if(/^[-*]\s+/.test(t)){ if(!inUl){out.push('<ul>');inUl=true;} out.push('<li>'+escHtml(t.replace(/^[-*]\s+/,''))+'</li>'); }
      else if(/^\d+\.\s+/.test(t)){ if(!inUl){out.push('<ul>');inUl=true;} out.push('<li>'+escHtml(t)+'</li>'); }
      else { if(inUl){out.push('</ul>');inUl=false;} out.push('<p>'+escHtml(t)+'</p>'); }
    }
    if(inUl) out.push('</ul>');
    let res = out.join('\n').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    res = res.replace(/\u0000M(\d+)\u0000/g, (_, idx) => stash[Number(idx)] || '');
    return res;
  }

  function loadSavedDocs(){
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch(e){ return []; }
  }
  function saveDocsList(list){
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  }
  function loadAiConfig(){
    let c1 = {}, c2 = {};
    try { c1 = JSON.parse(localStorage.getItem('stem_ai_cfg_v1') || '{}'); } catch(e){}
    try { c2 = JSON.parse(localStorage.getItem('icpc_ai_cfg_v1') || '{}'); } catch(e){}
    const base = isICPC ? Object.assign({}, c1, c2) : Object.assign({}, c2, c1);
    return {
      provider: base.provider || (base.baseUrl && !base.baseUrl.includes('generativelanguage') ? 'openai' : 'gemini'),
      baseUrl: base.baseUrl || 'https://api.openai.com/v1',
      model: base.model || (base.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash'),
      apiKey: base.apiKey || ''
    };
  }
  function saveAiConfig(cfg){
    try {
      const k = isICPC ? 'icpc_ai_cfg_v1' : 'stem_ai_cfg_v1';
      const old = JSON.parse(localStorage.getItem(k) || '{}');
      localStorage.setItem(k, JSON.stringify(Object.assign({}, old, cfg)));
    } catch(e){}
  }

  function getGroupChoices(){
    if(typeof DOCS !== 'undefined' && Array.isArray(DOCS)){
      const gs = [...new Set(DOCS.map(d => d.group).filter(Boolean))];
      if(!gs.includes('🤖 AI 喂题题解库')) gs.unshift('🤖 AI 喂题题解库');
      return gs;
    }
    return ['🤖 AI 喂题题解库'];
  }

  function injectDocIntoWorkbench(docObj){
    if(typeof DOCS !== 'undefined' && Array.isArray(DOCS)){
      const idx = DOCS.findIndex(d => d.id === docObj.id);
      if(idx >= 0) DOCS[idx] = docObj;
      else DOCS.unshift(docObj);
      if(typeof renderSidebar === 'function') renderSidebar();
      if(typeof openDoc === 'function') openDoc(docObj.id);
      return true;
    }
    return false;
  }

  function restorePersistedDocs(){
    const saved = loadSavedDocs();
    if(!saved.length) return;
    if(typeof DOCS !== 'undefined' && Array.isArray(DOCS)){
      for(let i = saved.length - 1; i >= 0; i--){
        const d = saved[i];
        if(!DOCS.some(x => x.id === d.id)) DOCS.unshift(d);
      }
      if(typeof renderSidebar === 'function') renderSidebar();
    }
  }

  function renderSavedList(){
    const saved = loadSavedDocs();
    const countEl = document.getElementById('aifSavedCount');
    const wrap = document.getElementById('aifSavedItems');
    if(!countEl || !wrap) return;
    countEl.textContent = String(saved.length);
    if(!saved.length){
      wrap.innerHTML = '<div style="font-size:12.5px;opacity:0.65;">暂无已导入的 AI 题解，在上方输入题目即可一键生成并导入。</div>';
      return;
    }
    wrap.innerHTML = saved.map(d => `
      <div class="aif-saved-item">
        <div style="min-width:0;flex:1;">
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(d.title)}</div>
          <div style="font-size:11.5px;opacity:0.65;">${escHtml(d.group || '🤖 AI 喂题题解库')} · ${escHtml(d.sub || '')}</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="aif-btn aif-btn-ghost" type="button" data-aif-open="${escHtml(d.id)}" style="padding:5px 10px;font-size:12px;">打开</button>
          <button class="aif-btn aif-btn-danger" type="button" data-aif-del="${escHtml(d.id)}" style="padding:5px 10px;font-size:12px;">删除</button>
        </div>
      </div>
    `).join('');
    wrap.querySelectorAll('[data-aif-open]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-aif-open');
        const item = loadSavedDocs().find(x => x.id === id);
        if(!item) return;
        if(injectDocIntoWorkbench(item)){
          document.getElementById('aiFeedOverlay').classList.remove('open');
        } else {
          const box = document.getElementById('aifPreviewBox');
          box.style.display = 'block';
          box.innerHTML = '<h3>' + escHtml(item.title) + '</h3>' + (isICPC ? mdToSafeHtml(item.content) : item.content);
          if(window.renderMathInElement) renderMathInElement(box);
        }
      };
    });
    wrap.querySelectorAll('[data-aif-del]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-aif-del');
        const next = loadSavedDocs().filter(x => x.id !== id);
        saveDocsList(next);
        if(typeof DOCS !== 'undefined' && Array.isArray(DOCS)){
          const idx = DOCS.findIndex(x => x.id === id);
          if(idx >= 0) DOCS.splice(idx, 1);
          if(typeof renderSidebar === 'function') renderSidebar();
        }
        renderSavedList();
      };
    });
  }

  function setStatus(msg, cls){
    const el = document.getElementById('aifStatus');
    el.className = 'aif-status show ' + (cls || 'info');
    el.textContent = msg;
  }

  let imgBase64 = null, imgMime = null;
  document.getElementById('aifImageInput').addEventListener('change', function(ev){
    const f = ev.target.files && ev.target.files[0];
    if(!f){ imgBase64 = null; imgMime = null; return; }
    imgMime = f.type || 'image/png';
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || '');
      imgBase64 = res.includes(',') ? res.split(',')[1] : res;
    };
    reader.readAsDataURL(f);
  });

  function openModal(){
    const cfg = loadAiConfig();
    document.getElementById('aifProvider').value = cfg.provider;
    document.getElementById('aifBaseUrl').value = cfg.baseUrl;
    document.getElementById('aifModel').value = cfg.model;
    document.getElementById('aifApiKey').value = cfg.apiKey;
    const sel = document.getElementById('aifTargetGroup');
    sel.innerHTML = getGroupChoices().map(g => `<option value="${escHtml(g)}">${escHtml(g)}</option>`).join('');
    renderSavedList();
    document.getElementById('aiFeedOverlay').classList.add('open');
  }

  document.getElementById('aiFeedFab').onclick = openModal;
  document.getElementById('aiFeedClose').onclick = () => document.getElementById('aiFeedOverlay').classList.remove('open');
  document.getElementById('aiFeedOverlay').onclick = (e) => { if(e.target.id === 'aiFeedOverlay') e.target.classList.remove('open'); };
  document.addEventListener('keydown', (e) => { if(e.altKey && (e.key === 'i' || e.key === 'I')){ e.preventDefault(); openModal(); } });

  document.getElementById('aifExportBtn').onclick = () => {
    const saved = loadSavedDocs();
    const blob = new Blob([JSON.stringify(saved, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = PAGE_KEY + '_AI题解库.json';
    a.click();
  };

  async function callAiModel(cfg, sysPrompt, userText){
    if(cfg.provider === 'gemini'){
      const m = cfg.model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`;
      const parts = [{text: sysPrompt + '\n\n【用户题目】\n' + userText}];
      if(imgBase64 && imgMime) parts.push({inlineData: {mimeType: imgMime, data: imgBase64}});
      const r = await fetch(url, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({contents: [{role: 'user', parts}]})
      });
      const j = await r.json();
      if(!r.ok) throw new Error(j.error?.message || ('HTTP ' + r.status));
      return j.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    } else {
      const base = (cfg.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const content = imgBase64 && imgMime
        ? [{type:'text', text: userText}, {type:'image_url', image_url: {url: `data:${imgMime};base64,${imgBase64}`}}]
        : userText;
      const r = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey},
        body: JSON.stringify({
          model: cfg.model || 'gpt-4o-mini',
          messages: [{role: 'system', content: sysPrompt}, {role: 'user', content}]
        })
      });
      const j = await r.json();
      if(!r.ok) throw new Error(j.error?.message || ('HTTP ' + r.status));
      return j.choices?.[0]?.message?.content || '';
    }
  }

  document.getElementById('aifRunBtn').onclick = async () => {
    const cfg = {
      provider: document.getElementById('aifProvider').value,
      baseUrl: document.getElementById('aifBaseUrl').value.trim(),
      model: document.getElementById('aifModel').value.trim(),
      apiKey: document.getElementById('aifApiKey').value.trim()
    };
    const userPrompt = document.getElementById('aifPrompt').value.trim();
    const targetGroup = document.getElementById('aifTargetGroup').value || '🤖 AI 喂题题解库';
    if(!cfg.apiKey){ setStatus('请先填写有效的 API Key（会自动保存在本地浏览器）', 'err'); return; }
    if(!userPrompt && !imgBase64){ setStatus('请先输入不会的题目或上传题目截图', 'err'); return; }
    saveAiConfig(cfg);

    const sysPrompt = isICPC
      ? `你是当前「${document.title}」的 ICPC 金牌教练。请严格按以下工作台 8 段式标准规范输出完整题解（全部使用规范 LaTeX 公式 $...$ / $$...$$ 与可编译 C++17 代码，不要输出寒暄）：
首行必须严格以 "# 标题：<简明题名>" 开头，第二行以 "摘要：<一句话核心方法与复杂度>" 开头，随后严格包含以下 8 节：
## 一、题目原意与核心直觉
## 二、数学建模与关键转化
## 三、算法流程与正确性证明
## 四、复杂度分析与边界条件
## 五、标准参考代码（C++17）
## 六、逐行代码精讲
## 七、常见易错点与卡常陷阱
## 八、举一反三、变式与参考对照`
      : `你是当前「${document.title}」的资深本科课程助教。请严格按以下工作台标准规范输出零基础也能看懂的完整精解（所有数学公式严格使用 LaTeX $...$ 或 $$...$$，不要输出寒暄）：
首行必须严格以 "# 标题：<简明题名>" 开头，第二行以 "摘要：<一句话核心考点与方法>" 开头，随后严格包含以下 7 节：
## 一、题目原意与考点定位
## 二、核心定义与定理公式
## 三、关键思路与破题突破口
## 四、详细分步精解
## 五、最终答案与检验
## 六、常见易错点与陷阱
## 七、举一反三与教材对照`;

    const btn = document.getElementById('aifRunBtn');
    btn.disabled = true;
    setStatus('正在调用 AI 生成工作台标准规范题解，完成后将自动导入…', 'info');
    try {
      const raw = await callAiModel(cfg, sysPrompt, userPrompt || '请识别图片中的题目并按标准规范给出完整精解');
      const lines = raw.split(/\r?\n/);
      let title = 'AI 精解：' + (userPrompt.slice(0, 26) || '图片题目');
      let sub = 'AI 自动生成 · 标准工作台精解';
      const bodyLines = [];
      for(const l of lines){
        const m1 = l.match(/^#*\s*标题[：:]\s*(.+)$/);
        const m2 = l.match(/^摘要[：:]\s*(.+)$/);
        if(m1) title = '🤖 ' + m1[1].trim();
        else if(m2) sub = m2[1].trim();
        else bodyLines.push(l);
      }
      const cleanMd = bodyLines.join('\n').trim() || raw;
      const docId = 'ai_custom_' + Date.now();
      const docObj = isICPC ? {
        id: docId, group: targetGroup, sub, filename: docId + '.md',
        title, chars: cleanMd.length, pills: ['AI喂题精解', '标准8段式', '已自动导入'], content: cleanMd
      } : {
        id: docId, group: targetGroup, tier: 'AI喂题精解', zeroFriendly: true, treeNode: 'AI喂题导入',
        title, sub, prereqs: [], content: mdToSafeHtml(cleanMd), quiz: []
      };

      const saved = loadSavedDocs();
      saved.unshift(docObj);
      saveDocsList(saved);
      renderSavedList();

      if(injectDocIntoWorkbench(docObj)){
        setStatus('✅ 已生成并自动导入工作台，正在为你打开该题解！', 'ok');
        setTimeout(() => document.getElementById('aiFeedOverlay').classList.remove('open'), 700);
      } else {
        setStatus('✅ 已生成并保存到本工作台 AI 题解库！', 'ok');
        const box = document.getElementById('aifPreviewBox');
        box.style.display = 'block';
        box.innerHTML = '<h3>' + escHtml(docObj.title) + '</h3>' + (isICPC ? mdToSafeHtml(docObj.content) : docObj.content);
        if(window.renderMathInElement) renderMathInElement(box);
      }
    } catch(err){
      setStatus('❌ 生成失败：' + (err.message || err), 'err');
    } finally {
      btn.disabled = false;
    }
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restorePersistedDocs);
  else restorePersistedDocs();
})();
;

(function() {
  window.addEventListener('DOMContentLoaded', function() {
    // 1. Make r14Toolbar collapsible (collapsed by default to keep workspace clean)
    const bar = document.getElementById('r14Toolbar');
    if (bar && !document.getElementById('r17BarToggle')) {
      Array.from(bar.children).forEach(el => el.classList.add('r17-hideable'));
      const tg = document.createElement('button');
      tg.id = 'r17BarToggle';
      tg.className = 'r14-chip';
      tg.textContent = '🛠️ 扩展工具栏 ▾';
      bar.classList.add('r17-collapsed');
      tg.addEventListener('click', function() {
        bar.classList.toggle('r17-collapsed');
        tg.textContent = bar.classList.contains('r17-collapsed') ? '🛠️ 扩展工具栏 ▾' : '🛠️ 收起工具栏 ▴';
      });
      bar.insertBefore(tg, bar.firstChild);
    }

    // 2. Fallback subtle particles ONLY when workbench_engine has not claimed #particle-canvas
    const pc = document.getElementById('particle-canvas');
    if (pc && !pc.dataset.r17Particles && typeof window.toggleParticles !== 'function') {
      pc.dataset.r17Particles = '1';
      const ctx = pc.getContext('2d');
      const dots = Array.from({length: 28}, () => ({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: 1.2 + Math.random() * 1.6
      }));
      let accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2563eb';
      let rafId = null;
      function tick() {
        if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) { rafId = null; return; }
        if (pc.width !== innerWidth || pc.height !== innerHeight) { pc.width = innerWidth; pc.height = innerHeight; }
        ctx.clearRect(0, 0, pc.width, pc.height);
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.22;
        dots.forEach(d => {
          d.x = (d.x + d.vx + pc.width) % pc.width;
          d.y = (d.y + d.vy + pc.height) % pc.height;
          ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
        });
        rafId = requestAnimationFrame(tick);
      }
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !rafId) {
          accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2563eb';
          rafId = requestAnimationFrame(tick);
        }
      });
      tick();
    }
  });
})();
;
(function() {
  if (window.__iter10Inited) return;
  window.__iter10Inited = true;

  // Full interactive local C++20 / Python IDE modal wired to local_cpp_runner.py /run
  window.ideState = window.ideState || {
    lang: 'cpp',
    code: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    cout << "Hello Workbench!" << "\\n";\n    return 0;\n}',
    stdin: '',
    expected: ''
  };
  if (typeof window.openIdeModal !== 'function') {
    window.openIdeModal = function(initialCode, opts) {
      const bd = document.getElementById('extModalBackdrop');
      const modalBox = bd && bd.querySelector('.ext-modal');
      const title = document.getElementById('extModalTitle');
      const body = document.getElementById('extModalBody');
      if (!bd || !body) return;
      if (modalBox) modalBox.style.width = 'min(960px, 96vw)';
      const defaultTpl = '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    return 0;\n}';
      if (typeof initialCode === 'string' && initialCode.trim()) window.ideState.code = initialCode;
      if (opts && typeof opts.stdin === 'string') window.ideState.stdin = opts.stdin;
      if (opts && typeof opts.expected === 'string') window.ideState.expected = opts.expected;
      if (opts && opts.lang) window.ideState.lang = opts.lang;
      title.textContent = (opts && opts.title) ? ('⚡ 内置编译器 · ' + opts.title) : '⚡ 内置 C++20 / Python 编译器（实时时空判题）';
      body.innerHTML =
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px;">' +
        '<select id="wbIdeLang" class="calc-input" style="width:auto;padding:5px 10px;">' +
        '<option value="cpp">C++20 (-O2)</option><option value="c++17">C++17 (-O2)</option><option value="python">Python 3</option></select>' +
        '<button id="wbIdeRunBtn" class="btn btn-primary" onclick="window.runWbIdeCode()">▶ 编译并运行</button>' +
        '<button class="btn" onclick="window.resetWbIdeCode()">↺ 重置模板</button>' +
        '<button class="btn" onclick="navigator.clipboard.writeText(document.getElementById(\'wbIdeCode\').value);this.textContent=\'✓ 已复制\'">📋 复制代码</button>' +
        '<button class="btn" onclick="closeExtModal()">关闭</button></div>' +
        '<textarea id="wbIdeCode" class="stem-textarea" spellcheck="false" style="width:100%;min-height:230px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.5;"></textarea>' +
        '<div class="wb-ide-io-grid">' +
        '<div><div style="font-size:12px;font-weight:600;margin-bottom:4px;">标准输入 (stdin)</div><textarea id="wbIdeStdin" class="stem-textarea" style="width:100%;min-height:80px;font-family:monospace;font-size:12.5px;"></textarea></div>' +
        '<div><div style="font-size:12px;font-weight:600;margin-bottom:4px;">期望输出 (可选，用于自动判题 AC/WA)</div><textarea id="wbIdeExpected" class="stem-textarea" style="width:100%;min-height:80px;font-family:monospace;font-size:12.5px;"></textarea></div></div>' +
        '<div id="wbIdeOutput" style="margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--bg2,rgba(148,163,184,0.1));font-family:monospace;font-size:12.5px;white-space:pre-wrap;min-height:56px;">就绪：点击「▶ 编译并运行」即可通过本地 local_cpp_runner.py 实时评测时空开销。</div>';
      const codeEl = document.getElementById('wbIdeCode');
      const inEl = document.getElementById('wbIdeStdin');
      const expEl = document.getElementById('wbIdeExpected');
      const langEl = document.getElementById('wbIdeLang');
      codeEl.value = window.ideState.code || defaultTpl;
      inEl.value = window.ideState.stdin || '';
      expEl.value = window.ideState.expected || '';
      langEl.value = window.ideState.lang || 'cpp';
      codeEl.addEventListener('input', () => { window.ideState.code = codeEl.value; });
      inEl.addEventListener('input', () => { window.ideState.stdin = inEl.value; });
      expEl.addEventListener('input', () => { window.ideState.expected = expEl.value; });
      langEl.addEventListener('change', () => { window.ideState.lang = langEl.value; });
      bd.classList.add('open');
    };
    window.resetWbIdeCode = function() {
      const lang = (document.getElementById('wbIdeLang')?.value) || 'cpp';
      const tpl = lang === 'python'
        ? 'import sys\n\ndef solve():\n    data = sys.stdin.read().split()\n    print("OK", len(data))\n\nif __name__ == "__main__":\n    solve()\n'
        : '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    return 0;\n}\n';
      window.ideState.code = tpl;
      const el = document.getElementById('wbIdeCode');
      if (el) el.value = tpl;
    };
    window.runWbIdeCode = async function() {
      const btn = document.getElementById('wbIdeRunBtn');
      const out = document.getElementById('wbIdeOutput');
      const code = document.getElementById('wbIdeCode')?.value || '';
      const stdin = document.getElementById('wbIdeStdin')?.value || '';
      const expected = document.getElementById('wbIdeExpected')?.value || '';
      const lang = document.getElementById('wbIdeLang')?.value || 'cpp';
      window.ideState.code = code; window.ideState.stdin = stdin; window.ideState.expected = expected; window.ideState.lang = lang;
      if (btn) { btn.disabled = true; btn.textContent = '运行中...'; }
      if (out) out.textContent = '正在编译并运行...';
      try {
        const base = (typeof getRunnerApiBase === 'function') ? getRunnerApiBase() : location.origin;
        const resp = await fetch(base + '/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, stdin, lang, time_limit_ms: 2000, mem_limit_mb: 256 })
        });
        const res = await resp.json();
        const norm = s => String(s || '').replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').trim();
        let verdict = res.verdict || (res.ok ? 'OK' : 'ERR');
        if (res.ok && expected.trim()) {
          verdict = (norm(res.stdout) === norm(expected)) ? 'AC' : 'WA';
        }
        const meta = `[${verdict}] 耗时: ${res.elapsed_ms ?? '-'} ms | 峰值内存: ${res.peak_mb ?? '-'} MB`;
        const parts = [meta];
        if (res.stdout) parts.push('--- stdout ---\n' + res.stdout);
        if (res.stderr) parts.push('--- stderr ---\n' + res.stderr);
        if (res.error && !res.stderr) parts.push('--- error ---\n' + res.error);
        if (out) out.textContent = parts.join('\n');
      } catch (e) {
        if (out) out.textContent = '无法连接本地运行器（请确认已启动 python3 local_cpp_runner.py）：' + (e.message || e);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '▶ 编译并运行'; }
      }
    };
  }
  if (typeof window.runCodeBlockInIde !== 'function') {
    window.runCodeBlockInIde = function(btn) {
      const wrap = btn && btn.closest ? btn.closest('.code-wrap, pre') : null;
      const code = wrap ? (wrap.querySelector('pre') ? wrap.querySelector('pre').innerText : wrap.innerText) : '';
      window.openIdeModal(code);
    };
  }

  // Iter 5: ESC key closes any open modal, AI drawer, or popover
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (typeof window.closeExtModal === 'function') window.closeExtModal();
      const bd = document.getElementById('extModalBackdrop');
      if (bd) bd.classList.remove('open');
      const ai = document.getElementById('aiDrawer');
      if (ai) ai.classList.remove('open');
      const tp = document.getElementById('termPopover');
      if (tp) tp.classList.remove('open', 'show');
      document.querySelectorAll('.stem-overlay.open, #aiFeedOverlay.open, #noteDrawer.open, #wb-mastery-drawer.open').forEach(m => m.classList.remove('open'));
    }
  });

  // Iter 6: Debounced KaTeX MutationObserver on #main
  window.addEventListener('DOMContentLoaded', function() {
    const mainEl = document.getElementById('main') || document.querySelector('.main');
    if (mainEl && typeof MutationObserver !== 'undefined') {
      let timer = null;
      const obs = new MutationObserver(function() {
        if (typeof window.renderMathInElement !== 'function') return;
        clearTimeout(timer);
        timer = setTimeout(function() {
          try {
            window.renderMathInElement(mainEl, {
              delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],
              throwOnError: false
            });
          } catch(_) {}
        }, 180);
      });
      obs.observe(mainEl, { childList: true, subtree: true });
    }
  });
})();
;
(function() {
  if (window.__c4StdInited) return;
  window.__c4StdInited = true;

  function attachCopyButtons() {
    document.querySelectorAll('.ex-card, .tb-fulltext-panel, #docCard').forEach(function(card) {
      if (card.querySelector('.c4-md-copy-btn')) return;
      const head = card.querySelector('.card-head-row, .reader-toolbar, h2, h3');
      if (!head) return;
      const btn = document.createElement('button');
      btn.className = 'c4-md-copy-btn';
      btn.textContent = '📋 复制 Markdown';
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const title = (card.querySelector('h2, h3, .card-title') || {}).innerText || '工作台笔记';
        const body = (card.querySelector('.md-body') || card).innerText || '';
        const md = '---\ntitle: ' + JSON.stringify(title.trim()) + '\n---\n\n## ' + title.trim() + '\n\n' + body.trim() + '\n';
        navigator.clipboard.writeText(md).then(() => {
          btn.textContent = '✓ 已复制 .md';
          setTimeout(() => { btn.textContent = '📋 复制 Markdown'; }, 1600);
        });
      });
      head.appendChild(btn);
    });
  }

  window.addEventListener('DOMContentLoaded', function() {
    const mainEl = document.getElementById('main') || document.querySelector('.main');
    if (mainEl && typeof MutationObserver !== 'undefined') {
      let t = null;
      new MutationObserver(function() {
        clearTimeout(t);
        t = setTimeout(attachCopyButtons, 220);
      }).observe(mainEl, { childList: true, subtree: true });
      setTimeout(attachCopyButtons, 300);
    }
  });
})();
/* PATCHED_OPEN_GENERIC_BOOK */

;(function() {
  window.openGenericBookBundle = async function(hostId, bookId, fileRel, bookTitle) {
    const host = document.getElementById(hostId);
    if (!host) return;
    host.innerHTML = "<div style=\"padding:12px;font-weight:700;\">⏳ 正在按需加载《" + (bookTitle || bookId) + "》…</div>";
    if (!((window.__WB_BOOK_DATA__ || {})[bookId]) && !document.querySelector('script[data-wb-src="' + fileRel + '"]')) {
      await new Promise((res, rej) => { const s = document.createElement("script"); s.src = fileRel; s.dataset.wbSrc = fileRel; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    }
    const book = (window.__WB_BOOK_DATA__ || {})[bookId];
    if (!book || !book.chapters || !book.chapters.length) { host.innerHTML = "未找到分册内容"; return; }
    let idx = 0;
    function fmtSec(txt) {
      if (!txt || !txt.trim()) return "";
      if (/^\s*<(h[1-6]|p|ul|ol|div|table)\b/i.test(txt)) return txt;
      if (typeof window.renderMarkdown === "function") return window.renderMarkdown(txt);
      return "<div style=\"white-space:pre-wrap;line-height:1.75;\">" + txt.replace(/</g, "&lt;") + "</div>";
    }
    function draw() {
      const ch = book.chapters[idx];
      const hasRaw = !!(ch.raw_text && ch.raw_text.trim());
      const notice = hasRaw ? "" : "<div style=\"margin-bottom:10px;padding:8px 12px;border-radius:8px;background:rgba(245,158,11,.12);color:#d97706;font-size:12px;\">📝ℹ️ 本节暂无原书扫描逐页正文，当前展示精编讲义与配套例题。</div>";
      const rawHtml = hasRaw ? ("<h4>📖 原书逐页识图正文</h4><div style=\"white-space:pre-wrap;line-height:1.8;font-size:13.5px;margin-bottom:14px;\">" + ch.raw_text.replace(/</g, "&lt;") + "</div>") : "";
      const lecHtml = ch.lecture ? ("<h4>📘 核心精讲</h4>" + fmtSec(ch.lecture)) : "";
      const exHtml = ch.exercises ? ("<h4 style=\"margin-top:14px;\">✏️ 配套例题与解析</h4>" + fmtSec(ch.exercises)) : "";
      const tabs = book.chapters.map((c, i) => "<button class=\"btn btn-sm " + (i === idx ? "btn-primary" : "") + "\" data-bch=\"" + i + "\">" + (c.pages || c.title || ("第" + (i + 1) + "节")) + "</button>").join("");
      host.innerHTML = "<div style=\"border:1.5px solid var(--accent,#3b82f6);border-radius:14px;padding:16px;background:var(--card,#fff);margin-top:12px;\">" +
        "<div style=\"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;\"><strong>📖 " + (book.title || bookTitle) + " (" + book.chapters.length + " 节)</strong><button class=\"btn btn-sm\" data-bclose=\"1\">✕ 关闭</button></div>" +
        "<div style=\"display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;\">" + tabs + "</div>" +
        notice + rawHtml + lecHtml + exHtml + "</div>";
      const cb = host.querySelector("[data-bclose]");
      if (cb) cb.addEventListener("click", () => { host.innerHTML = ""; });
      host.querySelectorAll("[data-bch]").forEach(b => b.addEventListener("click", () => { idx = Number(b.dataset.bch); draw(); }));
      if (typeof window.renderMathInElement === "function") {
        try { window.renderMathInElement(host, { delimiters: [{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false}], throwOnError: false }); } catch (_) {}
      }
    }
    draw();
  };
})();
