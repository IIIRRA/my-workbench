/* === Shared Module: STEM AI Explainer, Exam Generator & Book/Sheet Hub (Portal + All 14 Subjects) === */
(function(){
  if (window.__wbStemAiExamInited) return;
  window.__wbStemAiExamInited = true;

  const SUBJECT_NAME = window.__WB_SUBJECT_NAME__ || (window.__WB_CONFIG__ ? "ICPC 算法与程序设计" : "全栈十四合一总控");
  const HAS_EXAMS = typeof window.__WB_HAS_EXAMS__ === 'boolean' ? window.__WB_HAS_EXAMS__ : Boolean(window.__WB_CONFIG__);
  const AI_CFG_KEY = 'stem_ai_cfg_v1';
  const AI_BANK_KEY = 'stem_ai_bank_' + SUBJECT_NAME;
  const EXAM_DONE_KEY = 'stem_exam_done_' + SUBJECT_NAME;

  function loadCfg(){
    if (window.WB_AI && typeof window.WB_AI.loadConfig === 'function') {
      return window.WB_AI.loadConfig();
    }
    try{ return JSON.parse(localStorage.getItem(AI_CFG_KEY) || '{}'); }catch(e){ return {}; }
  }
  function saveCfg(c){
    if (window.WB_AI && typeof window.WB_AI.saveConfig === 'function') {
      window.WB_AI.saveConfig(c);
      return;
    }
    try{ localStorage.setItem(AI_CFG_KEY, JSON.stringify(c)); }catch(e){}
  }
  function loadAiBank(){
    try{
      const _a = JSON.parse(localStorage.getItem(AI_BANK_KEY) || '[]');
      return Array.isArray(_a) ? _a : [];
    }catch(e){ return []; }
  }
  function saveAiBank(arr){
    const raw = JSON.stringify(Array.isArray(arr) ? arr : []);
    if (window.WB_STORE && typeof window.WB_STORE.safeSetItem === 'function') {
      window.WB_STORE.safeSetItem(AI_BANK_KEY, raw);
    } else {
      try{ localStorage.setItem(AI_BANK_KEY, raw); }catch(e){}
    }
  }

  function renderMathSafe(el){
    if(!el) return;
    try{
      if(typeof renderMathInElement === 'function'){
        renderMathInElement(el, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
          ],
          throwOnError: false
        });
      }
    }catch(e){}
  }

  function escHtml(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function fmtRich(s){
    if(!s) return '';
    // Keep embedded <div class="exam-fig">...</div> intact while escaping stray tags
    const parts = String(s).split(/(<div class="exam-fig">[\s\S]*?<\/div>)/g);
    return parts.map((p,i) => i%2===1 ? p : p.replace(/\n/g,'<br>')).join('');
  }

  // Create Floating Buttons
  const fab = document.createElement('div');
  fab.className = 'stem-fab-wrap';
  if(HAS_EXAMS){
    const eb = document.createElement('button');
    eb.className = 'stem-pill-btn stem-exam-btn';
    eb.innerHTML = '📝 历年真题与梯度组卷';
    eb.onclick = function() { if (window.openExamModal) window.openExamModal(); };
    fab.appendChild(eb);
  }
  const ab = document.createElement('button');
  ab.className = 'stem-pill-btn stem-ai-btn';
  ab.innerHTML = '✨ AI 助教 · 讲解/出题 (⌘J)';
  ab.onclick = () => openAiModal();
  fab.appendChild(ab);
  document.body.appendChild(fab);

  // ==================== TEXTBOOK FUSION + CHEATSHEET + MATH DICT ====================
  const BOOKS_DATA = (() => { try { return JSON.parse((document.getElementById('textbook-fusion-data')||{}).textContent || '[]'); } catch(e){ return []; } })();
  const SHEET_DATA = (() => { try { return JSON.parse((document.getElementById('cheatsheet-data')||{}).textContent || 'null'); } catch(e){ return null; } })();
  const DICT_DATA = (() => { try { return JSON.parse((document.getElementById('math-dict-data')||{}).textContent || '[]'); } catch(e){ return []; } })();

  if(BOOKS_DATA.length){
    const bb = document.createElement('button');
    bb.className = 'stem-pill-btn';
    bb.style.background = 'linear-gradient(135deg,#34c759,#00a86b)';
    bb.innerHTML = '📚 经典教材精讲';
    bb.onclick = () => openBookModal();
    fab.appendChild(bb);
  }
  if(SHEET_DATA || DICT_DATA.length){
    const sb = document.createElement('button');
    sb.className = 'stem-pill-btn';
    sb.style.background = 'linear-gradient(135deg,#ff9500,#ff5e3a)';
    sb.innerHTML = DICT_DATA.length ? '📄 速查卡 / 定理词典' : '📄 考前1页纸速查卡';
    sb.onclick = () => openSheetModal();
    fab.appendChild(sb);
  }

  const bookOv = document.createElement('div');
  bookOv.className = 'stem-overlay';
  bookOv.innerHTML = `
    <div class="stem-modal">
      <div class="stem-mhead">
        <div class="stem-tabs" id="book-tabs"></div>
        <button class="stem-close" id="book-close">✕</button>
      </div>
      <div class="stem-mbody" id="book-body"></div>
    </div>`;
  document.body.appendChild(bookOv);
  bookOv.querySelector('#book-close').onclick = () => bookOv.classList.remove('open');
  bookOv.onclick = e => { if(e.target === bookOv) bookOv.classList.remove('open'); };
  let selBook = 0, selChap = 0;

  function openBookModal(){
    if(!BOOKS_DATA.length) return;
    bookOv.classList.add('open');
    const tabsEl = bookOv.querySelector('#book-tabs');
    tabsEl.innerHTML = BOOKS_DATA.map((b, i) => `<button class="stem-tab ${i===selBook?'active':''}" data-bidx="${i}">${escHtml(b.name)}</button>`).join('');
    tabsEl.querySelectorAll('[data-bidx]').forEach(btn => {
      btn.onclick = () => { selBook = +btn.dataset.bidx; selChap = 0; openBookModal(); };
    });
    const b = BOOKS_DATA[selBook] || BOOKS_DATA[0];
    const chs = b.chapters || [];
    const ch = chs[selChap] || chs[0];
    const body = bookOv.querySelector('#book-body');
    if(!ch){ body.innerHTML = '暂无章节数据'; return; }
    window.__askAiBook = () => {
      window.openAiModal(`【教材精讲】${b.name} - ${ch.title}\n\n${ch.summary}\n\n易错点：${ch.pitfalls}`);
    };
    body.innerHTML = `
      <div class="stem-grid-2">
        <div class="stem-list-col">
          <div style="font-size:12px;color:#6e6e73;margin-bottom:8px">${escHtml(b.author||'')} · ${escHtml(b.level||'')} ${b.repo_url ? `· <a href="${escHtml(b.repo_url)}" target="_blank">配套资源</a>` : ''}</div>
          ${chs.map((c, i) => `
            <div class="stem-paper-item ${i===selChap?'active':''}" data-cidx="${i}">
              <div style="font-size:13px;font-weight:600">${escHtml(c.title)}</div>
              <div style="font-size:11.5px;color:#6e6e73;margin-top:2px">${(c.problems||[]).length} 道教材经典例题</div>
            </div>`).join('')}
        </div>
        <div id="book-detail">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <h3 style="margin:0;font-size:16px">${escHtml(ch.title)}</h3>
            <button class="stem-btn ghost" onclick="window.__askAiBook()">✨ AI 深度讲这章</button>
          </div>
          <div class="stem-q-card">
            <div style="font-weight:700;margin-bottom:6px">📖 章节核心精要与推导</div>
            <div style="font-size:14px;line-height:1.74">${fmtRich(ch.summary||'')}</div>
            ${ch.template_cpp ? `<div style="margin-top:10px"><strong>📐 核心公式 / 代码模板：</strong><pre style="background:rgba(128,128,128,.08);padding:10px 12px;border-radius:8px;overflow:auto;font-size:12.5px;line-height:1.5">${escHtml(ch.template_cpp)}</pre></div>` : ''}
            ${ch.pitfalls ? `<div style="margin-top:8px;color:#b26a00;font-size:13px"><strong>⚠️ 高频易错点：</strong>${fmtRich(ch.pitfalls)}</div>` : ''}
          </div>
          <div style="font-weight:700;margin:12px 0 8px">📝 本章经典例题与精解（已同步并入真题题库）</div>
          ${(ch.problems||[]).map((pr, pi) => `
            <div class="stem-q-card">
              <div class="stem-q-meta">
                <strong>${escHtml(pr.oj||'教材题')} ${escHtml(pr.pid||('#'+(pi+1)))}</strong>
                ${pr.diff ? `<span class="stem-badge">${escHtml(pr.diff)}</span>` : ''}
              </div>
              <div style="font-size:14px;font-weight:600;margin-bottom:6px">${fmtRich(pr.title||'')}</div>
              <details>
                <summary style="cursor:pointer;font-size:12.5px;font-weight:600;color:#0071e3">查看破题思路与完整解答</summary>
                <div class="stem-sol-box">${fmtRich(pr.hint||'')}</div>
              </details>
            </div>`).join('')}
        </div>
      </div>`;
    body.querySelectorAll('[data-cidx]').forEach(el => {
      el.onclick = () => { selChap = +el.dataset.cidx; openBookModal(); };
    });
    renderMathSafe(body.querySelector('#book-detail'));
  }

  const sheetOv = document.createElement('div');
  sheetOv.className = 'stem-overlay';
  sheetOv.innerHTML = `
    <div class="stem-modal">
      <div class="stem-mhead">
        <div class="stem-tabs">
          <button class="stem-tab active" data-stab="sheet">📄 考前 1 页纸速查卡</button>
          ${DICT_DATA.length ? `<button class="stem-tab" data-stab="dict">📖 定理与判别法词典 (${DICT_DATA.length}条)</button>` : ''}
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="stem-btn ghost" id="btn-print-sheet" style="padding:5px 12px;font-size:12px">🖨️ 打印速查卡</button>
          <button class="stem-close" id="sheet-close">✕</button>
        </div>
      </div>
      <div class="stem-mbody" id="sheet-body"></div>
    </div>`;
  document.body.appendChild(sheetOv);
  sheetOv.querySelector('#sheet-close').onclick = () => sheetOv.classList.remove('open');
  sheetOv.onclick = e => { if(e.target === sheetOv) sheetOv.classList.remove('open'); };
  sheetOv.querySelector('#btn-print-sheet').onclick = () => window.print();
  let stab = 'sheet';
  function openSheetModal(){
    sheetOv.classList.add('open');
    sheetOv.querySelectorAll('[data-stab]').forEach(b => {
      b.classList.toggle('active', b.dataset.stab === stab);
      b.onclick = () => { stab = b.dataset.stab; openSheetModal(); };
    });
    const body = sheetOv.querySelector('#sheet-body');
    if(stab === 'sheet' && SHEET_DATA){
      body.innerHTML = `
        <h3 style="margin:0 0 12px;font-size:17px">${escHtml(SHEET_DATA.title||'考前速查卡')}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr));gap:12px">
          ${(SHEET_DATA.sections||[]).map(sec => `
            <div class="stem-q-card" style="margin:0">
              <div style="font-weight:700;font-size:14px;color:#0071e3;margin-bottom:8px">${escHtml(sec.heading)}</div>
              ${(sec.items||[]).map(it => `
                <div style="padding:6px 0;border-top:1px dashed rgba(128,128,128,.2);font-size:13px">
                  <div style="font-weight:600">${escHtml(it.name)}</div>
                  ${it.formula ? `<div style="margin:3px 0">${fmtRich(it.formula)}</div>` : ''}
                  ${it.note ? `<div style="font-size:12px;color:#6e6e73">${fmtRich(it.note)}</div>` : ''}
                </div>`).join('')}
            </div>`).join('')}
        </div>`;
    } else if(DICT_DATA.length){
      body.innerHTML = `
        <input class="stem-input" id="mdict-q" placeholder="搜索定理/判别法/反例关键词..." style="margin-bottom:12px"/>
        <div id="mdict-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr));gap:10px"></div>`;
      const drawD = (kw) => {
        const k = (kw||'').trim().toLowerCase();
        const hits = DICT_DATA.filter(x => !k || (x.term+' '+x.cat+' '+x.def+' '+x.pitfall).toLowerCase().includes(k));
        const listEl = body.querySelector('#mdict-list');
        listEl.innerHTML = hits.map(x => `
          <div class="stem-q-card" style="margin:0">
            <div style="display:flex;justify-content:space-between;gap:6px;align-items:center;margin-bottom:4px">
              <strong>${escHtml(x.term)}</strong><span class="stem-badge">${escHtml(x.cat)}</span>
            </div>
            <div style="font-size:13px;line-height:1.6">${fmtRich(x.def)}</div>
            ${x.example ? `<div style="font-size:12.5px;margin-top:4px;color:#0071e3">例：${fmtRich(x.example)}</div>` : ''}
            ${x.pitfall ? `<div style="font-size:12px;margin-top:4px;color:#b26a00">坑：${fmtRich(x.pitfall)}</div>` : ''}
          </div>`).join('');
        renderMathSafe(listEl);
      };
      drawD('');
      body.querySelector('#mdict-q').oninput = e => drawD(e.target.value);
    }
    renderMathSafe(body);
  }


  // ==================== AI COPILOT MODAL ====================
  const aiOverlay = document.createElement('div');
  aiOverlay.className = 'stem-overlay';
  aiOverlay.innerHTML = `
    <div class="stem-modal" style="width:min(960px,95vw);height:min(84dvh,820px)">
      <div class="stem-mhead">
        <h3>✨ 全局 AI 深度讲解与出题助教 · ${escHtml(SUBJECT_NAME)}</h3>
        <div class="stem-mtabs">
          <button class="stem-tab active" data-aitab="explain">深度讲解当前内容</button>
          <button class="stem-tab" data-aitab="gen">AI 按梯度出新题</button>
          <button class="stem-tab" data-aitab="bank">AI 新题本 (<span id="ai-bank-cnt">0</span>)</button>
          <button class="stem-tab" data-aitab="cfg">接口设置</button>
        </div>
        <button class="stem-close" id="ai-close-btn">✕</button>
      </div>
      <div class="stem-mbody" id="ai-mbody"></div>
    </div>`;
  document.body.appendChild(aiOverlay);
  aiOverlay.querySelector('#ai-close-btn').onclick = () => aiOverlay.classList.remove('open');
  aiOverlay.onclick = e => { if(e.target === aiOverlay) aiOverlay.classList.remove('open'); };

  let aiTab = 'explain';
  let lastContext = '';
  let lastAiReply = '';

  function grabPageContext(){
    const sels = ['#doc-content', '#detail-body', '.q-card', '.doc-view', 'main', '.main-content', '.container'];
    for(const s of sels){
      const el = document.querySelector(s);
      if(el && el.innerText && el.innerText.trim().length > 40){
        return el.innerText.trim().slice(0, 2400);
      }
    }
    return ((document.body && (document.body.innerText || document.body.textContent)) || '').trim().slice(0, 1800);
  }

  async function callUserAI(messages){
    const cfg = loadCfg();
    if (window.WB_AI && typeof window.WB_AI.requestChat === 'function') {
      const sysMsg = (messages || []).find(m => m.role === 'system');
      const chatMsgs = (messages || []).filter(m => m.role !== 'system');
      return await window.WB_AI.requestChat({
        cfg,
        systemPrompt: sysMsg ? sysMsg.content : '',
        messages: chatMsgs,
        temperature: 0.35,
      });
    }
    if(!cfg.apiKey && !cfg.useProxy){
      throw new Error('请先在「接口设置」中填入你的 API Key 与 Base URL（十四套工作台共享配置），或勾选本地代理。');
    }
    const base = (cfg.baseUrl || 'https://api.deepseek.com/v1').replace(/\/+$/, '');
    const r = await fetch(base + '/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer ' + cfg.apiKey},
      body: JSON.stringify({ model: cfg.model || 'deepseek-chat', messages, temperature: 0.35 })
    });
    const d = await r.json();
    if(!r.ok) throw new Error(d.error?.message || ('HTTP ' + r.status));
    return d.choices?.[0]?.message?.content || '';
  }

  function renderAiModal(){
    const cntEl = aiOverlay.querySelector('#ai-bank-cnt');
    if(cntEl) cntEl.textContent = loadAiBank().length;
    aiOverlay.querySelectorAll('[data-aitab]').forEach(b => {
      b.classList.toggle('active', b.dataset.aitab === aiTab);
      b.onclick = () => { aiTab = b.dataset.aitab; renderAiModal(); };
    });
    const body = aiOverlay.querySelector('#ai-mbody');
    if(aiTab === 'cfg'){
      const c = loadCfg();
      body.innerHTML = `
        <div style="max-width:560px;display:grid;gap:12px">
          <div><label style="font-size:12px;font-weight:600">API Base URL（兼容 OpenAI / DeepSeek / 中转站）</label>
            <input class="stem-input" id="cfg-base" value="${escHtml(c.baseUrl || 'https://api.deepseek.com/v1')}"/></div>
          <div><label style="font-size:12px;font-weight:600">Model 名称</label>
            <input class="stem-input" id="cfg-model" value="${escHtml(c.model || 'deepseek-chat')}"/></div>
          <div><label style="font-size:12px;font-weight:600">API Key（保存在浏览器本地，14 套工作台通用）</label>
            <input class="stem-input" type="password" id="cfg-key" value="${escHtml(c.apiKey || '')}" placeholder="sk-..."/></div>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px">
            <input type="checkbox" id="cfg-proxy" ${c.useProxy?'checked':''}/> 通过本地 <code>local_cpp_runner.py /ai_chat</code> 转发（解决跨域 CORS）
          </label>
          <div style="display:flex;gap:10px">
            <button class="stem-btn" id="cfg-save">保存配置（全站生效）</button>
            <span id="cfg-msg" style="font-size:12.5px;color:#1d8f3a;align-self:center"></span>
          </div>
        </div>`;
      body.querySelector('#cfg-save').onclick = () => {
        saveCfg({
          baseUrl: body.querySelector('#cfg-base').value.trim(),
          model: body.querySelector('#cfg-model').value.trim(),
          apiKey: body.querySelector('#cfg-key').value.trim(),
          useProxy: body.querySelector('#cfg-proxy').checked
        });
        body.querySelector('#cfg-msg').textContent = '已保存并同步到全部 14 个工作台！';
      };
      return;
    }
    if(aiTab === 'explain'){
      if(!lastContext) lastContext = grabPageContext();
      body.innerHTML = `
        <div style="display:grid;gap:10px">
          <div style="font-size:12px;color:#6e6e73">已自动抓取当前屏幕内容（也可手动粘贴任意题目或公式）：</div>
          <textarea class="stem-textarea" id="ai-ctx" rows="4">${escHtml(lastContext)}</textarea>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="stem-btn" data-prompt="请用零基础能听懂的直觉比喻 + 逐步公式/代码推导 + 常见易错点，深度讲解上面这段内容：">深度讲解当前内容</button>
            <button class="stem-btn ghost" data-prompt="请换一个生活中的直观例子，重新解释上面内容的核心原理：">换个直觉例子</button>
            <button class="stem-btn ghost" data-prompt="请逐行/逐式拆解上面内容的推导或代码执行过程：">逐行拆解推导</button>
            <button class="stem-btn ghost" data-prompt="针对上面这道题/知识点，列出考试和工程中最容易踩的 3 个坑：">指出易错坑点</button>
          </div>
          <input class="stem-input" id="ai-custom-q" placeholder="或直接输入你的追问（回车发送）..."/>
          <div class="stem-ai-out" id="ai-out">${lastAiReply ? escHtml(lastAiReply) : '点击上方按钮即可启用你接入的 AI 进行讲解。'}</div>
        </div>`;
      renderMathSafe(body.querySelector('#ai-out'));
      const runExplain = async (prefix) => {
        const ctx = body.querySelector('#ai-ctx').value.trim();
        lastContext = ctx;
        const out = body.querySelector('#ai-out');
        out.textContent = '正在调用 AI 深度讲解...';
        try{
          const reply = await callUserAI([
            {role:'system', content:'你是北邮计算机/数学/量化方向的金牌导师，讲解清晰、零基础友好，数学公式统一使用 $...$ 与 $$...$$。'},
            {role:'user', content: prefix + '\n\n' + ctx}
          ]);
          lastAiReply = reply;
          out.textContent = reply;
          renderMathSafe(out);
        }catch(err){
          out.textContent = '调用失败：' + err.message;
        }
      };
      body.querySelectorAll('[data-prompt]').forEach(btn => {
        btn.onclick = () => runExplain(btn.dataset.prompt);
      });
      body.querySelector('#ai-custom-q').onkeydown = e => {
        if(e.key === 'Enter' && e.target.value.trim()){
          runExplain(e.target.value.trim());
        }
      };
      return;
    }
    if(aiTab === 'gen'){
      body.innerHTML = `
        <div style="display:grid;gap:12px">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">
            <div><label style="font-size:12px;font-weight:600">知识点 / 范围</label>
              <input class="stem-input" id="gen-topic" placeholder="例如：特征值与二次型 / 洛必达 / 树形DP"/></div>
            <div><label style="font-size:12px;font-weight:600">校内难度梯度</label>
              <select class="stem-select" id="gen-diff">
                <option value="基础 (L1 · 送分概念/基本计算)">基础 (L1)</option>
                <option value="中档 (L2-L3 · 统考常规核心题)" selected>中档 (L2-L3)</option>
                <option value="压轴 (L4-L5 · 期末高分/竞赛综合)">压轴 (L4-L5)</option>
              </select></div>
            <div><label style="font-size:12px;font-weight:600">题型</label>
              <select class="stem-select" id="gen-type">
                <option value="选择题">选择题</option>
                <option value="填空题">填空题</option>
                <option value="计算与证明大题" selected>计算与证明大题</option>
                <option value="编程与算法设计题">编程与算法设计题</option>
              </select></div>
          </div>
          <div style="display:flex;gap:10px;align-items:center">
            <button class="stem-btn" id="gen-go">✨ 生成新题与精解</button>
            <button class="stem-btn ghost" id="gen-save" style="display:none">💾 收藏到 AI 新题本</button>
          </div>
          <div class="stem-ai-out" id="gen-out">设置好知识点与难度梯度后，点击生成按钮即可由你的 AI 现场命制新题（含 3 级提示与完整精解）。</div>
        </div>`;
      let latestGen = '';
      body.querySelector('#gen-go').onclick = async () => {
        const topic = body.querySelector('#gen-topic').value.trim() || SUBJECT_NAME + '核心考点';
        const diff = body.querySelector('#gen-diff').value;
        const qtype = body.querySelector('#gen-type').value;
        const out = body.querySelector('#gen-out');
        out.textContent = '正在按北邮校内难度梯度命制新题...';
        try{
          const prompt = `请针对学科【${SUBJECT_NAME}】的知识点「${topic}」，按「${diff}」难度、题型「${qtype}」命制一道原创高质量新题。\n输出结构：\n1. 【题目】\n2. 【分级提示（Hint 1 / Hint 2 / Hint 3）】\n3. 【参考答案】\n4. 【一步步精解与易错点】\n数学公式请用 $...$ 和 $$...$$。`;
          latestGen = await callUserAI([{role:'user', content: prompt}]);
          out.textContent = latestGen;
          renderMathSafe(out);
          body.querySelector('#gen-save').style.display = 'inline-block';
        }catch(err){
          out.textContent = '生成失败：' + err.message;
        }
      };
      body.querySelector('#gen-save').onclick = () => {
        if(!latestGen) return;
        const bank = loadAiBank();
        bank.unshift({ id: 'ai_' + Date.now(), topic: body.querySelector('#gen-topic').value.trim() || SUBJECT_NAME, diff: body.querySelector('#gen-diff').value, content: latestGen, created: new Date().toLocaleString() });
        saveAiBank(bank);
        renderAiModal();
        alert('已保存到本工作台的 AI 新题本！');
      };
      return;
    }
    if(aiTab === 'bank'){
      const bank = loadAiBank();
      if(!bank.length){
        body.innerHTML = '<div style="padding:32px;text-align:center;color:#6e6e73">还没有收藏 AI 生成的新题，去「AI 按梯度出新题」生成一道吧！</div>';
        return;
      }
      body.innerHTML = bank.map((item, idx) => `
        <div class="stem-q-card">
          <div class="stem-q-meta">
            <span class="stem-badge">${escHtml(item.topic)}</span>
            <span class="stem-badge">${escHtml(item.diff)}</span>
            <span style="color:#6e6e73">${escHtml(item.created)}</span>
            <button class="stem-btn ghost" style="margin-left:auto;padding:3px 10px" onclick="window.__delAiBank(${idx})">删除</button>
          </div>
          <div class="stem-ai-out" style="min-height:auto;border:none;padding:4px 0">${escHtml(item.content)}</div>
        </div>`).join('');
      renderMathSafe(body);
      window.__delAiBank = (idx) => { const b = loadAiBank(); b.splice(idx,1); saveAiBank(b); renderAiModal(); };
    }
  }

  window.openAiModal = function(customCtx){
    lastContext = customCtx || grabPageContext();
    aiOverlay.classList.add('open');
    renderAiModal();
  };
  document.addEventListener('keydown', e => {
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j'){ e.preventDefault(); window.openAiModal(); }
  });

  // ==================== PAST & MOCK EXAMS + GRADIENT BUILDER (Lazy-Loaded On Demand) ====================
  if(!HAS_EXAMS) return;

  let _examLoadPromise = null;
  let _examUiReady = false;
  let _openReadyExam = null;

  function ensureExamDataLoaded() {
    if (window.__WB_EXAM_DATA__) return Promise.resolve(window.__WB_EXAM_DATA__);
    const rawEl = document.getElementById('past-exam-data');
    if (rawEl && rawEl.textContent) {
      try {
        window.__WB_EXAM_DATA__ = JSON.parse(rawEl.textContent);
        return Promise.resolve(window.__WB_EXAM_DATA__);
      } catch (_) {}
    }
    if (_examLoadPromise) return _examLoadPromise;
    const slug = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || '';
    if (!slug) return Promise.reject(new Error('未识别当前学科标识'));
    _examLoadPromise = new Promise((resolve, reject) => {
      const sc = document.createElement('script');
      sc.src = `data/${slug}/exam.js`;
      sc.async = true;
      sc.onload = () => {
        if (window.__WB_EXAM_DATA__) resolve(window.__WB_EXAM_DATA__);
        else { sc.remove(); _examLoadPromise = null; reject(new Error('真题数据包已加载但未导出 __WB_EXAM_DATA__')); }
      };
      sc.onerror = () => {
        sc.remove();
        _examLoadPromise = null;
        reject(new Error(`加载 data/${slug}/exam.js 失败（若处于离线状态，请先在「工具与视图」中点击离线缓存本学科）`));
      };
      document.head.appendChild(sc);
    });
    return _examLoadPromise;
  }

  // Lightweight loading/error shell shown while exam.js loads on demand
  const examLoadOverlay = document.createElement('div');
  examLoadOverlay.className = 'stem-overlay';
  examLoadOverlay.id = 'examLazyLoadOverlay';
  examLoadOverlay.innerHTML =
    '<div class="stem-modal" style="max-width:460px;height:auto;min-height:180px">' +
      '<div class="stem-mhead"><h3>📝 历年真题库</h3><button class="stem-close" id="exam-lazy-close">✕</button></div>' +
      '<div class="stem-mbody" id="exam-lazy-body" style="text-align:center;padding:32px 20px;font-size:14px;color:var(--muted,#64748b);">⏳ 正在按需加载本学科历年真题与梯度组卷数据...</div>' +
    '</div>';
  document.body.appendChild(examLoadOverlay);
  examLoadOverlay.querySelector('#exam-lazy-close').onclick = () => examLoadOverlay.classList.remove('open');
  examLoadOverlay.onclick = (e) => { if (e.target === examLoadOverlay) examLoadOverlay.classList.remove('open'); };

  function mountExamUi(EXAM_DATA) {
    if (_examUiReady) return;
    _examUiReady = true;
    const ALL_PAST = EXAM_DATA.past || [];
    const ALL_MOCK = EXAM_DATA.mock || [];

  const examOverlay = document.createElement('div');
  examOverlay.className = 'stem-overlay';
  examOverlay.innerHTML = `
    <div class="stem-modal">
      <div class="stem-mhead">
        <h3>📝 ${escHtml(EXAM_DATA.subject)} · 历年真题精解与校内梯度组卷 (${ALL_PAST.length} 套真题 + ${ALL_MOCK.length} 套模拟)</h3>
        <div class="stem-mtabs">
          <button class="stem-tab active" data-etab="past">历年真题库 (${ALL_PAST.length})</button>
          <button class="stem-tab" data-etab="mock">校内梯度模拟卷 (${ALL_MOCK.length})</button>
          <button class="stem-tab" data-etab="gen">按校内梯度智能组卷</button>
        </div>
        <button class="stem-close" id="exam-close-btn">✕</button>
      </div>
      <div class="stem-mbody" id="exam-mbody"></div>
    </div>`;
  document.body.appendChild(examOverlay);
  examOverlay.querySelector('#exam-close-btn').onclick = () => examOverlay.classList.remove('open');
  examOverlay.onclick = e => { if(e.target === examOverlay) examOverlay.classList.remove('open'); };

  let examTab = 'past';
  let selPastIdx = 0;
  let selMockIdx = 0;
  let customPaper = null;
  let timerSec = 7200;
  let timerId = null;

  function loadDone(){ try{ return JSON.parse(localStorage.getItem(EXAM_DONE_KEY) || '{}'); }catch(e){ return {}; } }
  function toggleDone(key){ const d = loadDone(); d[key] = !d[key]; localStorage.setItem(EXAM_DONE_KEY, JSON.stringify(d)); }

  const WRONG_KEY = 'stem_wrong_bank_v1';
  let userAns = {};
  let examGraded = false;
  let skipIncomplete = false;

  function loadWrongBank(){
    try{ return JSON.parse(localStorage.getItem(WRONG_KEY) || '[]'); }catch(e){ return []; }
  }
  function saveWrongBank(arr){ (window.WB_STORE ? window.WB_STORE.safeSetItem(WRONG_KEY, JSON.stringify(arr)) : localStorage.setItem(WRONG_KEY, JSON.stringify(arr))); }
  function detectObjType(q){
    const sec = (q.section || '') + ' ' + (q.prompt || '');
    const ans = (q.answer || '').trim();
    if(/判断/.test(sec) || /^(对|错|√|×|T|F|正确|错误)$/i.test(ans)) return 'tf';
    if(/选择/.test(sec) || /^[A-D](\s*[、,，]?\s*[A-D])*$/i.test(ans) || (/[（(]\s*[)）]/.test(q.prompt||'') && /\bA[.、．]/.test(q.prompt||''))) return 'mcq';
    return null;
  }
  function normAns(a, typ){
    const s = String(a||'').trim().toUpperCase();
    if(typ === 'tf'){
      if(/^(对|√|T|TRUE|正确|Y|YES)$/.test(s)) return '对';
      if(/^(错|×|F|FALSE|错误|N|NO)$/.test(s)) return '错';
      return s;
    }
    const m = s.match(/[A-D]/);
    return m ? m[0] : s;
  }

  function renderQuestions(paper, prefix){
    const done = loadDone();
    const wrongs = loadWrongBank();
    const wrongIds = new Set(wrongs.map(w => w.id));
    return (paper.questions || []).map((q, qi) => {
      const promptStr = String(q.prompt || '');
      if(skipIncomplete && (/原卷配图缺失/.test(promptStr) || /题面暂缺|暂缺/.test(promptStr))) return '';
      const k = prefix + '_' + paper.id + '_' + q.qid + '_' + qi;
      const isDone = !!done[k];
      const isWrongSaved = wrongIds.has(k);
      const objType = detectObjType(q);
      const opts = objType === 'tf' ? ['对','错'] : (objType === 'mcq' ? ['A','B','C','D'] : []);
      const picked = userAns[k] || '';
      const corr = objType ? normAns(q.answer, objType) : '';
      return `
        <div class="stem-q-card" data-qidx="${qi}">
          <div class="stem-q-meta">
            <strong>第 ${escHtml(q.qid || (qi+1))} 题</strong>
            ${q.section ? `<span class="stem-badge">${escHtml(q.section)}</span>` : ''}
            ${q.difficulty ? `<span class="stem-badge diff-${escHtml(q.difficulty)}">${escHtml(q.difficulty)}</span>` : ''}
            ${q.points ? `<span class="stem-badge">${q.points} 分</span>` : ''}
            ${(q.tags||[]).slice(0,3).map(t => `<span class="stem-badge" style="background:rgba(128,128,128,.12);color:inherit">${escHtml(t)}</span>`).join('')}
            <div style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">
              <button class="stem-btn ghost" style="padding:3px 9px;font-size:11.5px" onclick="window.__toggleWrong('${escHtml(k)}', ${qi}, this)">${isWrongSaved ? '📕 已入错题本' : '📓 记错题'}</button>
              <button class="stem-btn ghost" style="padding:3px 9px;font-size:11.5px" onclick="window.__askAiExam(${qi})">✨ AI 讲这题</button>
              <button class="stem-btn ghost" style="padding:3px 9px;font-size:11.5px" onclick="window.__toggleExamDone('${escHtml(k)}', this)">${isDone ? '✅ 已刷' : '⬜ 打卡'}</button>
            </div>
          </div>
          <div style="font-size:14px;line-height:1.72">${fmtRich(q.prompt)}</div>
          ${opts.length ? `
            <div class="stem-opt-row">
              <span style="font-size:12px;color:#6e6e73">作答：</span>
              ${opts.map(op => {
                let cls = 'stem-opt-pill';
                if(examGraded){
                  if(op === corr) cls += ' ok';
                  else if(picked === op) cls += ' bad';
                } else if(picked === op) cls += ' sel';
                return `<button class="${cls}" onclick="window.__pickOpt('${escHtml(k)}','${op}',this)">${op}</button>`;
              }).join('')}
              ${examGraded && picked ? `<span style="font-size:12px;font-weight:600;color:${picked===corr?'#1d8f3a':'#c92a2a'}">${picked===corr?'✔ 正确':'✘ 错（正解 '+escHtml(corr)+'）'}</span>` : ''}
            </div>` : ''}
          <details style="margin-top:10px" ${examGraded ? 'open' : ''}>
            <summary style="cursor:pointer;font-size:12.5px;font-weight:600;color:#0071e3">查看参考答案与一步步精解</summary>
            <div class="stem-sol-box">
              ${q.answer ? `<div><strong>【参考答案】</strong>${fmtRich(q.answer)}</div>` : ''}
              <div style="margin-top:6px"><strong>【精解】</strong><br>${fmtRich(q.solution || '暂无精解')}</div>
            </div>
          </details>
        </div>`;
    }).join('');
  }

  function renderExamModal(){
    examOverlay.querySelectorAll('[data-etab]').forEach(b => {
      b.classList.toggle('active', b.dataset.etab === examTab);
      b.onclick = () => { examTab = b.dataset.etab; examGraded = false; renderExamModal(); };
    });
    const body = examOverlay.querySelector('#exam-mbody');

    if(examTab === 'past' || examTab === 'mock'){
      const list = examTab === 'past' ? ALL_PAST : ALL_MOCK;
      const curIdx = examTab === 'past' ? selPastIdx : selMockIdx;
      const paper = list[curIdx] || list[0];
      if(!paper){ body.innerHTML = '暂无试卷数据。'; return; }
      window.__currentExamPaper = paper;
      window.__currentExamQuestions = paper.questions || [];
      window.__askAiExam = (qi) => {
        const q = window.__currentExamQuestions[qi];
        if(q) window.openAiModal((q.prompt || '').replace(/<[^>]+>/g,'') + '\n\n参考答案：' + (q.answer || ''));
      };
      window.__toggleExamDone = (k, btn) => {
        toggleDone(k);
        const d = loadDone();
        btn.textContent = d[k] ? '✅ 已刷' : '⬜ 打卡';
      };
      window.__pickOpt = (k, op, btn) => {
        if(examGraded) return;
        userAns[k] = userAns[k] === op ? '' : op;
        btn.parentElement.querySelectorAll('.stem-opt-pill').forEach(b => b.classList.toggle('sel', b.textContent === userAns[k]));
      };
      window.__toggleWrong = (k, qi, btn) => {
        const q = window.__currentExamQuestions[qi];
        if(!q) return;
        const arr = loadWrongBank();
        const idx = arr.findIndex(w => w.id === k);
        if(idx >= 0){ arr.splice(idx, 1); btn.textContent = '📓 记错题'; }
        else {
          arr.unshift({ id: k, subject: SUBJECT_NAME, paperTitle: paper.title, qid: q.qid, prompt: q.prompt, answer: q.answer, solution: q.solution, ts: new Date().toLocaleString() });
          btn.textContent = '📕 已入错题本';
        }
        saveWrongBank(arr);
      };
      window.__gradeCurrentPaper = () => {
        examGraded = true;
        const arr = loadWrongBank();
        const existing = new Set(arr.map(w => w.id));
        let objTotal = 0, objRight = 0, ptsGot = 0, ptsAll = 0;
        (paper.questions || []).forEach((q, qi) => {
          const k = examTab + '_' + paper.id + '_' + q.qid + '_' + qi;
          const t = detectObjType(q);
          if(t){
            objTotal++;
            const pts = q.points || 2;
            ptsAll += pts;
            const corr = normAns(q.answer, t);
            if(userAns[k] && userAns[k] === corr){ objRight++; ptsGot += pts; }
            else if(userAns[k] && userAns[k] !== corr && !existing.has(k)){
              arr.unshift({ id: k, subject: SUBJECT_NAME, paperTitle: paper.title, qid: q.qid, prompt: q.prompt, answer: q.answer, solution: q.solution, ts: new Date().toLocaleString() });
              existing.add(k);
            }
          }
        });
        saveWrongBank(arr);
        window.__lastGradeMsg = objTotal ? `客观题自动判分：答对 ${objRight}/${objTotal} 题（得分 ${ptsGot}/${ptsAll} 分），错题已自动收录至全站错题本。` : '本卷暂无客观题，已展开全部参考答案与精解供自评。';
        renderExamModal();
      };

      body.innerHTML = `
        <div class="stem-grid-2">
          <div class="stem-list-col">
            <input class="stem-input" id="exam-search" placeholder="搜索年份/期中期末/关键词..." style="margin-bottom:10px"/>
            <div id="exam-paper-list">
              ${list.map((p, i) => `
                <div class="stem-paper-item ${i===curIdx?'active':''}" data-pidx="${i}">
                  <div style="font-size:13px;font-weight:600">${escHtml(p.title)}</div>
                  <div style="font-size:11.5px;color:#6e6e73;margin-top:2px">${escHtml(p.stage||'')} · ${escHtml(p.source||'')} · ${(p.questions||[]).length} 题</div>
                </div>`).join('')}
            </div>
          </div>
          <div id="exam-detail-col">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
              <h3 style="margin:0;font-size:16px">${escHtml(paper.title)}</h3>
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer"><input type="checkbox" id="skip-incomplete-chk" ${skipIncomplete?'checked':''}/> 跳过缺图/残缺题</label>
                <button class="stem-btn" style="padding:5px 12px;font-size:12px" onclick="window.__gradeCurrentPaper()">📊 交卷判分</button>
                <span class="stem-badge">${(paper.questions||[]).length} 题</span>
              </div>
            </div>
            ${examGraded && window.__lastGradeMsg ? `<div class="stem-score-bar"><span>${escHtml(window.__lastGradeMsg)}</span><button class="stem-btn ghost" style="padding:3px 10px;font-size:11.5px" id="btn-reset-grade">重新作答</button></div>` : ''}
            ${renderQuestions(paper, examTab)}
          </div>
        </div>`;
      if(body.querySelector('#skip-incomplete-chk')){
        body.querySelector('#skip-incomplete-chk').onchange = e => { skipIncomplete = e.target.checked; renderExamModal(); };
      }
      if(body.querySelector('#btn-reset-grade')){
        body.querySelector('#btn-reset-grade').onclick = () => { examGraded = false; userAns = {}; renderExamModal(); };
      }
      body.querySelectorAll('[data-pidx]').forEach(el => {
        el.onclick = () => {
          examGraded = false;
          if(examTab === 'past') selPastIdx = +el.dataset.pidx; else selMockIdx = +el.dataset.pidx;
          renderExamModal();
        };
      });
      body.querySelector('#exam-search').oninput = e => {
        const kw = e.target.value.trim().toLowerCase();
        body.querySelectorAll('[data-pidx]').forEach(el => {
          el.style.display = el.innerText.toLowerCase().includes(kw) ? '' : 'none';
        });
      };
      renderMathSafe(body.querySelector('#exam-detail-col'));
      return;
    }

    // Tab 3: Gradient Generator
    const pool = [];
    ALL_MOCK.forEach(p => (p.questions||[]).forEach(q => pool.push({...q, _from: p.title})));
    ALL_PAST.forEach(p => (p.questions||[]).forEach(q => {
      const sec = (q.section || '');
      const diff = q.difficulty || (/选择|判断|填空/.test(sec) ? '基础' : (/证明|综合|压轴/.test(sec) ? '压轴' : '中档'));
      pool.push({...q, difficulty: diff, points: q.points || (diff==='基础'?4:(diff==='压轴'?10:8)), _from: p.title});
    }));
    const allTags = [...new Set(pool.flatMap(q => q.tags || []))].slice(0, 24);

    body.innerHTML = `
      <div style="display:grid;gap:14px">
        <div class="stem-q-card" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
          <div style="flex:1;min-width:180px">
            <label style="font-size:12px;font-weight:600">组卷梯度模式</label>
            <select class="stem-select" id="gen-mode">
              <option value="std">统考标准梯度（35% 基础 / 45% 中档 / 20% 压轴）</option>
              <option value="mid">期中基础巩固（50% 基础 / 40% 中档 / 10% 压轴）</option>
              <option value="hard">期末高分冲刺（20% 基础 / 40% 中档 / 40% 压轴）</option>
            </select>
          </div>
          <div style="flex:1;min-width:180px">
            <label style="font-size:12px;font-weight:600">限定考点（可选）</label>
            <select class="stem-select" id="gen-tag">
              <option value="">全部考点混合抽取</option>
              ${allTags.map(t => `<option value="${escHtml(t)}">${escHtml(t)}</option>`).join('')}
            </select>
          </div>
          <button class="stem-btn" id="btn-assemble">🎲 一键按校内梯度组卷</button>
          <button class="stem-btn ghost" id="btn-timer">⏱ 120 分钟模考计时 (<span id="timer-txt">${Math.floor(timerSec/60)}:${String(timerSec%60).padStart(2,'0')}</span>)</button>
          <button class="stem-btn ghost" id="btn-export-md">📋 导出 Markdown</button>
        </div>
        <div id="custom-paper-view">${customPaper ? renderQuestions(customPaper, 'custom') : '<div style="padding:36px;text-align:center;color:#6e6e73">选择梯度与考点后点击「一键按校内梯度组卷」，立即生成 100 分制模拟卷。</div>'}</div>
      </div>`;

    if(customPaper){
      window.__currentExamQuestions = customPaper.questions;
      renderMathSafe(body.querySelector('#custom-paper-view'));
    }
    body.querySelector('#btn-assemble').onclick = () => {
      const mode = body.querySelector('#gen-mode').value;
      const tag = body.querySelector('#gen-tag').value;
      const ratios = mode === 'mid' ? [6,5,2] : (mode === 'hard' ? [3,5,5] : [5,5,3]);
      let cand = tag ? pool.filter(q => (q.tags||[]).includes(tag)) : pool.slice();
      if(cand.length < 10) cand = pool.slice();
      const pick = (d, n) => cand.filter(q => q.difficulty === d).sort(() => Math.random()-0.5).slice(0, n);
      const qs = [...pick('基础', ratios[0]), ...pick('中档', ratios[1]), ...pick('压轴', ratios[2])];
      customPaper = { id: 'custom_' + Date.now(), title: '校内难度梯度智能组卷', questions: qs.map((q, i) => ({...q, qid: String(i+1)})) };
      renderExamModal();
    };
    body.querySelector('#btn-timer').onclick = () => {
      if(timerId){ clearInterval(timerId); timerId = null; return; }
      timerId = setInterval(() => {
        if(timerSec > 0) timerSec--;
        const el = document.getElementById('timer-txt');
        if(el) el.textContent = Math.floor(timerSec/60) + ':' + String(timerSec%60).padStart(2,'0');
      }, 1000);
    };
    body.querySelector('#btn-export-md').onclick = () => {
      if(!customPaper) return alert('请先组卷后再导出！');
      const md = '# ' + customPaper.title + '\n\n' + customPaper.questions.map((q,i) => `## ${i+1}. [${q.difficulty}] (${q.points}分)\n${q.prompt}\n\n**答案**：${q.answer}\n\n**精解**：${q.solution}\n`).join('\n---\n');
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(md).then(() => alert('已复制完整 Markdown 试卷与精解到剪贴板！')).catch(() => { prompt('当前非 HTTPS 环境无法自动写入剪贴板，请手动全选复制：', md.slice(0, 1200)); }); } else { prompt('请手动复制以下内容：', md.slice(0, 1200)); }
    };
  }

    _openReadyExam = function() {
      examOverlay.classList.add('open');
      renderExamModal();
    };
  }

  window.openExamModal = function() {
    if (_examUiReady && typeof _openReadyExam === 'function') {
      _openReadyExam();
      return;
    }
    const bodyEl = examLoadOverlay.querySelector('#exam-lazy-body');
    if (bodyEl) bodyEl.textContent = '⏳ 正在按需加载本学科历年真题与梯度组卷数据...';
    examLoadOverlay.classList.add('open');
    ensureExamDataLoaded()
      .then((data) => {
        const stillOpen = examLoadOverlay.classList.contains('open');
        examLoadOverlay.classList.remove('open');
        mountExamUi(data);
        if (stillOpen && typeof _openReadyExam === 'function') _openReadyExam();
      })
      .catch((err) => {
        if (!bodyEl) return;
        bodyEl.innerHTML = '';
        const msg = document.createElement('div');
        msg.style.cssText = 'color:#dc2626;margin-bottom:14px;line-height:1.6;';
        msg.textContent = (err && err.message) ? err.message : '加载真题库失败';
        const retryBtn = document.createElement('button');
        retryBtn.className = 'stem-btn';
        retryBtn.textContent = '↺ 重新加载真题库';
        retryBtn.onclick = () => window.openExamModal();
        bodyEl.appendChild(msg);
        bodyEl.appendChild(retryBtn);
      });
  };
})();
;
