/* === Unified AI Request Client & Config Store (Gemini / OpenAI-compatible / Local Proxy) === */
(function () {
  if (window.WB_AI) return;

  const UNIFIED_KEY = 'wb_ai_cfg_v2';
  const LEGACY_KEYS = ['icpc_ai_cfg_v1', 'stem_ai_cfg_v1', 'wb_ai_feed_cfg_v1'];
  const DEFAULT_CFG = {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    useProxy: false,
    proxyUrl: '',
  };

  function safeParse(raw) {
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw);
      return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : null;
    } catch (_) {
      return null;
    }
  }

  function loadConfig() {
    let merged = { ...DEFAULT_CFG };
    try {
      // Load legacy first as fallback, then override with unified key
      for (let i = LEGACY_KEYS.length - 1; i >= 0; i--) {
        const leg = safeParse(localStorage.getItem(LEGACY_KEYS[i]));
        if (leg) {
          if (leg.provider) merged.provider = leg.provider;
          if (leg.model) merged.model = leg.model;
          if (leg.baseUrl) merged.baseUrl = leg.baseUrl;
          if (leg.apiKey && !merged.apiKey) merged.apiKey = leg.apiKey;
          if (typeof leg.useProxy === 'boolean') merged.useProxy = leg.useProxy;
          if (leg.proxyUrl) merged.proxyUrl = leg.proxyUrl;
        }
      }
      const uni = safeParse(localStorage.getItem(UNIFIED_KEY));
      if (uni) {
        merged = { ...merged, ...uni };
      }
    } catch (_) {}
    return merged;
  }

  function saveConfig(partial) {
    const next = { ...loadConfig(), ...(partial || {}) };
    next.apiKey = (next.apiKey || '').trim();
    next.baseUrl = (next.baseUrl || 'https://api.openai.com/v1').trim();
    next.model = (next.model || (next.provider === 'openai' ? 'deepseek-chat' : 'gemini-2.5-flash')).trim();
    next.useProxy = !!next.useProxy;
    const raw = JSON.stringify(next);
    try {
      localStorage.setItem(UNIFIED_KEY, raw);
      // Mirror to legacy keys so all pages stay seamlessly synchronized
      LEGACY_KEYS.forEach((k) => {
        try { localStorage.setItem(k, raw); } catch (_) {}
      });
    } catch (_) {}
    return next;
  }

  function getRunnerApiBase() {
    const cfg = loadConfig();
    if (cfg.proxyUrl) return cfg.proxyUrl.replace(/\/+$/, '');
    if (location.hostname === 'appassets.androidplatform.net') return 'http://127.0.0.1:8765';
    if (location.protocol === 'http:' || location.protocol === 'https:') return '';
    return 'http://127.0.0.1:8765';
  }

  async function requestChat(opts) {
    const cfg = opts.cfg || loadConfig();
    const provider = cfg.provider || 'gemini';
    const apiKey = (cfg.apiKey || '').trim();
    const model = (cfg.model || (provider === 'gemini' ? 'gemini-2.5-flash' : 'deepseek-chat')).trim();
    const baseUrl = (cfg.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const useProxy = !!cfg.useProxy;
    const systemPrompt = opts.systemPrompt || '';
    const messages = opts.messages || [];
    const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.4;
    const isLocalEndpoint = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

    if (!apiKey && !(provider !== 'gemini' && isLocalEndpoint)) {
      throw new Error('请先填写 API Key（或配置本地 Ollama 地址）');
    }

    let url = '';
    let headers = { 'Content-Type': 'application/json' };
    let body = {};

    if (provider === 'gemini') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      if (apiKey) headers['x-goog-api-key'] = apiKey;
      const contents = messages.map((m) => {
        const parts = Array.isArray(m.parts) ? m.parts : [{ text: String(m.content || m.text || '') }];
        return { role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user', parts };
      });
      body = {
        contents,
        generationConfig: { temperature },
      };
      if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] };
      }
    } else {
      url = `${baseUrl}/chat/completions`;
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      const apiMsgs = [];
      if (systemPrompt) apiMsgs.push({ role: 'system', content: systemPrompt });
      messages.forEach((m) => {
        apiMsgs.push({
          role: m.role === 'model' ? 'assistant' : m.role,
          content: m.content != null ? m.content : String(m.text || ''),
        });
      });
      body = { model, messages: apiMsgs, temperature };
    }

    let data;
    if (useProxy) {
      const resp = await fetch(`${getRunnerApiBase()}/ai_chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, headers, body }),
      });
      const wrapped = await resp.json();
      if (!wrapped.ok) throw new Error(wrapped.error || '代理请求失败');
      data = wrapped.data;
    } else {
      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      data = await resp.json();
      if (!resp.ok) {
        throw new Error((data && data.error && data.error.message) || `HTTP ${resp.status}`);
      }
    }

    if (provider === 'gemini') {
      const text =
        (data && data.candidates && data.candidates[0] && data.candidates[0].content &&
          data.candidates[0].content.parts && data.candidates[0].content.parts.map((p) => p.text || '').join('')) || '';
      if (!text) throw new Error((data && data.error && data.error.message) || '模型未返回内容');
      return text;
    }
    const text = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    if (!text) throw new Error((data && data.error && data.error.message) || '模型未返回内容');
    return text;
  }

  window.WB_AI = {
    UNIFIED_KEY,
    loadConfig,
    saveConfig,
    getRunnerApiBase,
    requestChat,
  };
})();
