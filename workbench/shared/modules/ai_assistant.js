/* === Module: AI Subject Assistant Drawer === */
function getRunnerApiBase() {
  if (window.WB_AI && typeof window.WB_AI.getRunnerApiBase === 'function') {
    return window.WB_AI.getRunnerApiBase();
  }
  if (typeof window !== 'undefined' && window.location && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
    return '';
  }
  return 'http://127.0.0.1:8765';
}

// === Always-On Context-Aware AI Assistant ===
const AI_CFG_KEY = 'wb_ai_cfg_v2';
let aiCfg = (window.WB_AI && window.WB_AI.loadConfig)
  ? window.WB_AI.loadConfig()
  : safeGet('icpc_ai_cfg_v1', '{"provider":"gemini","model":"gemini-2.5-flash","baseUrl":"https://api.openai.com/v1","apiKey":"","useProxy":false}');
let aiHistory = [];

function _getSubjectMeta() {
  const slug = (window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc';
  const name = window.__WB_SUBJECT_NAME__ || (window.__WB_CONFIG__ && window.__WB_CONFIG__.brandTitle) || (slug === 'icpc' ? 'ICPC 算法竞赛' : '本学科');
  const isCoding = ['icpc', 'cpp', 'dsos', 'comp'].includes(slug);
  return { slug, name, isCoding };
}

function syncAiCfgUi() {
  if (window.WB_AI && window.WB_AI.loadConfig) {
    aiCfg = window.WB_AI.loadConfig();
  }
  const p = document.getElementById('aiProvider');
  const m = document.getElementById('aiModel');
  const b = document.getElementById('aiBaseUrl');
  const k = document.getElementById('aiApiKey');
  const x = document.getElementById('aiUseProxy');
  if (p) p.value = aiCfg.provider || 'gemini';
  if (m) m.value = aiCfg.model || (aiCfg.provider === 'openai' ? 'deepseek-chat' : 'gemini-2.5-flash');
  if (b) b.value = aiCfg.baseUrl || 'https://api.openai.com/v1';
  if (k) k.value = aiCfg.apiKey || '';
  if (x) x.checked = !!aiCfg.useProxy;
}

window.saveAiConfig = function() {
  const next = {
    provider: document.getElementById('aiProvider')?.value || 'gemini',
    model: (document.getElementById('aiModel')?.value || '').trim(),
    baseUrl: (document.getElementById('aiBaseUrl')?.value || '').trim() || 'https://api.openai.com/v1',
    apiKey: (document.getElementById('aiApiKey')?.value || '').trim(),
    useProxy: !!document.getElementById('aiUseProxy')?.checked,
  };
  if (window.WB_AI && window.WB_AI.saveConfig) {
    aiCfg = window.WB_AI.saveConfig(next);
  } else {
    aiCfg = { ...aiCfg, ...next };
    try { localStorage.setItem(AI_CFG_KEY, JSON.stringify(aiCfg)); } catch (e) {}
  }
};

window.toggleAiDrawer = function(force) {
  const el = document.getElementById('aiDrawer');
  if (!el) return;
  const next = typeof force === 'boolean' ? force : !el.classList.contains('open');
  el.classList.toggle('open', next);
  if (next) {
    if (window.innerWidth <= 900 && typeof window.setSidebarOpen === 'function') window.setSidebarOpen(false);
    syncAiCfgUi();
    updateAiCtxLabel();
    renderAiMessages();
    if (!aiCfg.apiKey && !aiCfg.baseUrl.includes('localhost') && !aiCfg.baseUrl.includes('127.0.0.1')) {
      document.getElementById('aiCfgPanel')?.classList.add('open');
    }
    setTimeout(() => document.getElementById('aiInput')?.focus(), 60);
  }
};

function updateAiCtxLabel() {
  const lbl = document.getElementById('aiCtxLabel');
  if (!lbl) return;
  const doc = (typeof DOCS !== 'undefined' && Array.isArray(DOCS)) ? DOCS.find(x => x.id === activeId) : null;
  const meta = _getSubjectMeta();
  lbl.textContent = doc ? `当前上下文：${doc.title.slice(0, 26)}` : `当前上下文：${meta.name}总览`;
}

window.clearAiChat = function() {
  aiHistory = [];
  renderAiMessages();
};

window.askAiQuick = function(q) {
  const inp = document.getElementById('aiInput');
  if (inp) inp.value = q;
  sendAiMessage();
};

function renderAiMessages() {
  const box = document.getElementById('aiMsgs');
  if (!box) return;
  if (!aiHistory.length) {
    const meta = _getSubjectMeta();
    const hint = meta.isCoding
      ? '看讲义或题解时遇到哪一步公式没看懂、或者编译器里代码报错，都可以直接问我。'
      : '阅读讲义、推导定理或刷题时遇到卡壳的步骤，都可以直接向我提问。';
    box.innerHTML = `<div class="ai-msg bot">你好！我是你的「${escapeHtml(meta.name)}」随身助教。${hint}首次使用请点右上角「设置 API」填入你的 Gemini / DeepSeek / OpenAI Key（全站 15 页自动同步，也支持本地 Ollama）。</div>`;
    return;
  }
  box.innerHTML = aiHistory.map(m => {
    if (m.role === 'user') return `<div class="ai-msg user">${escapeHtml(m.text)}</div>`;
    return `<div class="ai-msg bot">${renderMarkdown(m.text)}</div>`;
  }).join('');
  box.scrollTop = box.scrollHeight;
  if (window.renderMathInElement) {
    renderMathInElement(box, { delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false });
  }
}

window.sendAiMessage = async function() {
  const inp = document.getElementById('aiInput');
  const btn = document.getElementById('aiSendBtn');
  const q = (inp?.value || '').trim();
  if (!q) return;
  saveAiConfig();
  if (!aiCfg.apiKey && !aiCfg.baseUrl.includes('localhost') && !aiCfg.baseUrl.includes('127.0.0.1')) {
    const panel = document.getElementById('aiCfgPanel');
    if (panel) {
      panel.classList.add('open');
      let warn = panel.querySelector('.ai-key-inline-warn');
      if (!warn) {
        warn = document.createElement('div');
        warn.className = 'ai-key-inline-warn';
        warn.style.cssText = 'margin-bottom:8px;padding:7px 10px;border-radius:8px;background:rgba(239,68,68,0.12);color:#ef4444;font-size:12px;font-weight:600;';
        panel.prepend(warn);
      }
      warn.textContent = '请先在下方填入 API Key（仅保存在本地浏览器，全站自动同步），或将 Base URL 设为本地 Ollama。';
      document.getElementById('aiApiKey')?.focus();
    }
    return;
  }
  inp.value = '';
  aiHistory.push({ role: 'user', text: q });
  renderAiMessages();
  if (btn) { btn.disabled = true; btn.textContent = '思考中...'; }

  const meta = _getSubjectMeta();
  const doc = (typeof DOCS !== 'undefined' && Array.isArray(DOCS)) ? DOCS.find(x => x.id === activeId) : null;
  const ctxParts = [];
  if (doc) {
    ctxParts.push(`当前正在阅读《${doc.title}》，节选内容：\n${(doc.content || '').slice(0, 2200)}`);
  }
  const _ideCode = (window.ideState && window.ideState.code) || (document.getElementById('wbIdeCode')?.value) || '';
  const _wantsCodeCtx = meta.isCoding
    ? /debug|代码|报错|编译|wa|tle|re|运行|边界|超时/i.test(q)
    : /编译器|c\+\+|cpp|python|代码报错/i.test(q);
  if (_ideCode && _wantsCodeCtx) {
    ctxParts.push(`用户当前编译器中的代码：\n\`\`\`cpp\n${_ideCode.slice(0, 1800)}\n\`\`\``);
  }
  const _subjRole = (meta.slug !== 'icpc')
    ? `你是一位经验丰富的「${meta.name}」专属助教，用清晰、通俗、严谨的中文解答用户的疑问，适当使用 LaTeX 公式。`
    : '你是一位经验丰富的 ICPC/NOI 竞赛算法助教，用清晰、通俗、严谨的中文解答用户的疑问，适当使用 LaTeX 公式。';
  const sysPrompt = _subjRole + (ctxParts.length ? '\n\n' + ctxParts.join('\n\n') : '');

  try {
    const reply = await window.WB_AI.requestChat({
      cfg: aiCfg,
      systemPrompt: sysPrompt,
      messages: aiHistory.map(m => ({ role: m.role, content: m.text })),
      temperature: 0.4,
    });
    aiHistory.push({ role: 'assistant', text: reply || '(未返回文本)' });
  } catch (err) {
    aiHistory.push({ role: 'assistant', text: `请求失败：${err.message}\n\n提示：若为跨域报错，请在右上角「设置 API」里勾选「通过 /ai_chat 代理转发」并确保已运行 \`local_cpp_runner.py\`。` });
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '发送'; }
    renderAiMessages();
  }
};
