
/* === Module: FSRS-5 Spaced Repetition Scheduler (Inspired by open-spaced-repetition/ts-fsrs) === */
(function initWBFsrs() {
  const S0 = [0.40255, 1.18385, 3.173, 15.69105]; // Again, Hard, Good, Easy
  const DECAY = -0.5;
  const FACTOR = 19 / 81;
  const TARGET_R = 0.9;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const getKey = () => 'wb_fsrs_v1_' + ((window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc');

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(getKey()) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function saveStore(s) {
    try { localStorage.setItem(getKey(), JSON.stringify(s)); } catch (e) {}
  }
  function retrievability(elapsedDays, stability) {
    const s = Math.max(0.1, Number(stability) || 0.4);
    const t = Math.max(0, Number(elapsedDays) || 0);
    return Math.pow(1 + FACTOR * t / s, DECAY);
  }
  function nextInterval(stability) {
    const raw = (stability / FACTOR) * (Math.pow(TARGET_R, 1 / DECAY) - 1);
    return Math.max(1, Math.min(180, Math.round(raw)));
  }
  function previewNext(card, rating, nowDay) {
    const g = clamp(Number(rating) || 3, 1, 4);
    const day = Math.max(1, Number(nowDay) || 1);
    if (!card || !card.reps) {
      const s = S0[g - 1];
      const d = clamp(7.1949 - Math.exp(0.5345 * (g - 1)) + 1, 1, 10);
      const ivl = g === 1 ? 1 : nextInterval(s);
      return { s: +s.toFixed(2), d: +d.toFixed(2), reps: 1, lapses: g === 1 ? 1 : 0, lastDay: day, dueDay: day + ivl, interval: ivl };
    }
    const elapsed = Math.max(0, day - (card.lastDay || day));
    const r = retrievability(elapsed, card.s);
    let s = card.s, d = card.d, lapses = card.lapses || 0;
    if (g === 1) {
      lapses += 1;
      s = Math.max(0.4, s * 0.35);
      d = clamp(d + 1.2, 1, 10);
    } else if (g === 2) {
      s = s * (1 + 0.65 * (11 - d) * 0.12);
      d = clamp(d + 0.45, 1, 10);
    } else if (g === 3) {
      s = s * (1 + 1.45 * (11 - d) * 0.16 * (1 + (1 - r) * 1.5));
      d = clamp(d - 0.15, 1, 10);
    } else {
      s = s * (1 + 2.35 * (11 - d) * 0.18 * (1 + (1 - r) * 1.8));
      d = clamp(d - 0.85, 1, 10);
    }
    const ivl = g === 1 ? 1 : nextInterval(s);
    return { s: +s.toFixed(2), d: +d.toFixed(2), reps: (card.reps || 0) + 1, lapses, lastDay: day, dueDay: day + ivl, interval: ivl };
  }

  window.WBFsrs = {
    getCard(id) { return loadStore()[id] || null; },
    getAll() { return loadStore(); },
    retrievability,
    preview(id, rating, nowDay) { return previewNext(loadStore()[id], rating, nowDay); },
    review(id, rating, nowDay) {
      const store = loadStore();
      const next = previewNext(store[id], rating, nowDay);
      store[id] = next;
      saveStore(store);
      return next;
    },
    ensureCard(id, completedDay) {
      const store = loadStore();
      if (!store[id]) {
        store[id] = previewNext(null, 3, completedDay || 1);
        saveStore(store);
      }
      return store[id];
    },
    reset() {
      try { localStorage.removeItem(getKey()); } catch (e) {}
    }
  };
})();


function ensureSubjectRoadmapData() {
  if (!ROADMAP || typeof ROADMAP !== 'object') return;
  if (Array.isArray(ROADMAP.problems) && ROADMAP.problems.length > 0) return;
  const bank = (typeof PROBLEM_BANK !== 'undefined' && Array.isArray(PROBLEM_BANK)) ? PROBLEM_BANK : [];
  const docs = (typeof DOCS !== 'undefined' && Array.isArray(DOCS)) ? DOCS : [];
  if (!bank.length && !docs.length) return;
  // Distribute up to 320 representative tiered problems (L1 -> L5) evenly across 80 days
  const tierOrder = { L1: 1, L2: 2, L3: 3, L4: 4, L5: 5 };
  const sorted = [...bank].sort((a, b) => (tierOrder[a.tier] || 3) - (tierOrder[b.tier] || 3) || (a.order || 0) - (b.order || 0));
  const targetN = Math.min(sorted.length, 320);
  const step = targetN > 0 ? Math.max(1, Math.floor(sorted.length / targetN)) : 1;
  const picked = [];
  for (let i = 0; i < sorted.length && picked.length < targetN; i += step) {
    const bp = sorted[i];
    const day = Math.min(80, Math.floor((picked.length * 80) / targetN) + 1);
    picked.push({
      key: bp.key || ('bank_' + bp.order),
      title: bp.title || bp.pid || ('题 #' + bp.order),
      tier: bp.tier || 'L2',
      topic: bp.topic || '核心专题',
      stage: day <= 16 ? 1 : (day <= 38 ? 2 : (day <= 53 ? 3 : 4)),
      day: day,
      order: bp.order,
      pid: bp.pid,
      isBank: true
    });
  }
  ROADMAP.problems = picked;
  if (!Array.isArray(ROADMAP.learnPlan) || ROADMAP.learnPlan.length === 0) {
    ROADMAP.learnPlan = Array.from({ length: 80 }, (_, idx) => {
      const d = docs.length ? docs[Math.floor((idx * docs.length) / 80)] : null;
      return { topic: d ? d.title : '核心讲义精读与巩固', docs: d ? [d.id] : [] };
    });
  }
}

/* === Module: 80-Day Dynamic Roadmap & Rebalance Engine === */
const ROADMAP_KEY = 'icpc_roadmap_state_v1';
let roadmapState = {
  currentDay: 1,
  selectedDay: 1,
  dayCap: {},
  schedule: null,
  subDone: {},
  reviewed: {}
};

function loadRoadmapState() {
  try {
    const raw = localStorage.getItem(ROADMAP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      roadmapState = Object.assign(roadmapState, parsed);
    }
  } catch (e) {}
  // Sync from mastery -> subDone for single-problem Luogu docs
  (ROADMAP.problems || []).forEach(p => {
    if (!p.anchor && mastery[p.docId] && !roadmapState.subDone[p.key]) {
      roadmapState.subDone[p.key] = roadmapState.currentDay || 1;
    }
  });
  if (!roadmapState.schedule) {
    roadmapState.schedule = buildInitialSchedule();
    saveRoadmapState();
  }
}

function saveRoadmapState() {
  try {
    localStorage.setItem(ROADMAP_KEY, JSON.stringify(roadmapState));
  } catch (e) {}
}

function buildInitialSchedule() {
  // Stage 1: Days 1-16 (33 probs), Stage 2: Days 17-38 (41 probs),
  // Stage 3: Days 39-53 (30 probs), Stage 4: Days 54-80 (200 probs)
  const sched = {};
  for (let d = 1; d <= 80; d++) sched[d] = [];
  const stageRanges = [
    { stage: 1, start: 1, end: 16 },
    { stage: 2, start: 17, end: 38 },
    { stage: 3, start: 39, end: 53 },
    { stage: 4, start: 54, end: 80 }
  ];
  stageRanges.forEach(r => {
    const list = (ROADMAP.problems || []).filter(p => p.stage === r.stage);
    const days = r.end - r.start + 1;
    list.forEach((p, idx) => {
      const targetDay = r.start + Math.floor((idx * days) / list.length);
      sched[targetDay].push(p.key);
    });
  });
  return sched;
}

function showToast(msg) {
  let el = document.getElementById('wb-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'wb-toast';
    el.className = 'wb-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function isProbDone(key) {
  return !!roadmapState.subDone[key];
}

function toggleRoadmapProb(key, day) {
  const p = (ROADMAP.problems || []).find(x => x.key === key);
  if (!p) return;
  if (roadmapState.subDone[key]) {
    delete roadmapState.subDone[key];
    if (!p.anchor) {
      delete mastery[p.docId];
    } else {
      delete mastery[p.docId];
    }
  } else {
    roadmapState.subDone[key] = day || roadmapState.currentDay;
    if (!p.anchor) {
      mastery[p.docId] = true;
    } else {
      const siblings = (ROADMAP.problems || []).filter(x => x.docId === p.docId);
      if (siblings.every(x => roadmapState.subDone[x.key])) {
        mastery[p.docId] = true;
      }
    }
  }
  saveState();
  saveRoadmapState();
  if (activeView === 'roadmap') renderRoadmap();
  else if (activeId) openDoc(activeId);
}

function rebalanceSchedule(startFromDay, toastMsg) {
  const fromDay = Math.max(1, Math.min(80, startFromDay));
  // Keep all completed problems on the days they currently sit (or <= fromDay),
  // and gather all unfinished problems from day 1..80 in pedagogical order.
  const probMap = {};
  (ROADMAP.problems || []).forEach((p, idx) => { probMap[p.key] = idx; });

  const doneSet = new Set();
  const newSched = {};
  for (let d = 1; d <= 80; d++) {
    newSched[d] = [];
    const arr = roadmapState.schedule[d] || [];
    arr.forEach(k => {
      if (isProbDone(k)) {
        newSched[d].push(k);
        doneSet.add(k);
      } else if (d < fromDay) {
        // Unfinished problems from earlier days will be redistributed!
      }
    });
  }

  const remaining = (ROADMAP.problems || [])
    .filter(p => !doneSet.has(p.key))
    .map(p => p.key);

  // Compute capacity weights for days [fromDay .. 80]
  let totalWeight = 0;
  const weights = [];
  for (let d = fromDay; d <= 80; d++) {
    const cap = roadmapState.dayCap[d] !== undefined ? roadmapState.dayCap[d] : 1;
    weights.push({ day: d, w: Math.max(0, cap) });
    totalWeight += Math.max(0, cap);
  }

  if (remaining.length > 0 && totalWeight <= 0) {
    // Fallback: enable Day 80 if all remaining days were marked 0
    weights[weights.length - 1].w = 1;
    roadmapState.dayCap[80] = 1;
    totalWeight = 1;
  }

  if (remaining.length > 0) {
    let cumW = 0;
    let idx = 0;
    weights.forEach((item, wi) => {
      if (item.w <= 0) return;
      cumW += item.w;
      const targetEnd = wi === weights.length - 1
        ? remaining.length
        : Math.round((cumW / totalWeight) * remaining.length);
      while (idx < targetEnd && idx < remaining.length) {
        newSched[item.day].push(remaining[idx++]);
      }
    });
    while (idx < remaining.length) {
      const lastActive = [...weights].reverse().find(x => x.w > 0) || weights[weights.length - 1];
      newSched[lastActive.day].push(remaining[idx++]);
    }
  }

  roadmapState.schedule = newSched;
  saveRoadmapState();
  renderRoadmap();
  if (toastMsg) showToast(toastMsg);
}

window.skipDayAndRebalance = function(day) {
  roadmapState.dayCap[day] = 0;
  const nextDay = Math.min(80, day + 1);
  if (roadmapState.currentDay === day && day < 80) {
    roadmapState.currentDay = nextDay;
    roadmapState.selectedDay = nextDay;
  }
  rebalanceSchedule(day, `已将 Day ${day} 设为休息/顺延，未完成题目已动态均摊至后续天数（总天数保持 80 天）`);
};

window.finishEarlyAndRebalance = function(day) {
  // Mark unfinished problems on `day`? No, user finished early -> keep done on `day`, rebalance remaining from `day + 1`
  const nextDay = Math.min(80, day + 1);
  rebalanceSchedule(nextDay, `已根据当前完成进度，将剩余未做题目重新均摊至 Day ${nextDay}~80`);
};

window.pullNextProblem = function(day) {
  for (let d = day + 1; d <= 80; d++) {
    const arr = roadmapState.schedule[d] || [];
    const idx = arr.findIndex(k => !isProbDone(k));
    if (idx !== -1) {
      const [key] = arr.splice(idx, 1);
      roadmapState.schedule[day].push(key);
      if ((roadmapState.dayCap[day] || 1) === 0) roadmapState.dayCap[day] = 1;
      saveRoadmapState();
      renderRoadmap();
      showToast(`已从 Day ${d} 提前拉取 1 题到 Day ${day}`);
      return;
    }
  }
  showToast('后续已没有未完成的题目了！');
};

window.deferProblem = function(key, day) {
  if (day >= 80) { showToast('已经是最后一天（Day 80），无法再推迟'); return; }
  const arr = roadmapState.schedule[day] || [];
  const idx = arr.indexOf(key);
  if (idx !== -1) arr.splice(idx, 1);
  let target = day + 1;
  while (target < 80 && roadmapState.dayCap[target] === 0) target++;
  roadmapState.schedule[target].unshift(key);
  saveRoadmapState();
  renderRoadmap();
  showToast(`已将该题推迟至 Day ${target}`);
};

window.setDayCap = function(day, cap) {
  roadmapState.dayCap[day] = cap;
  rebalanceSchedule(day, `Day ${day} 负荷已调整，后续 80 天路线已动态重排`);
};

window.setCurrentDay = function(day) {
  roadmapState.currentDay = day;
  roadmapState.selectedDay = day;
  saveRoadmapState();
  renderRoadmap();
};

window.selectRoadmapDay = function(day) {
  roadmapState.selectedDay = day;
  saveRoadmapState();
  renderRoadmap();
};

window.resetRoadmap = function() {
  roadmapState.dayCap = {};
  roadmapState.schedule = buildInitialSchedule();
  roadmapState.reviewed = {};
  if (window.WBFsrs) window.WBFsrs.reset();
  saveRoadmapState();
  renderRoadmap();
  showToast('已重置为初始 80 天标准路线');
};

window.toggleReviewItem = function(day, key) {
  const rk = `${day}_${key}`;
  if (roadmapState.reviewed[rk]) delete roadmapState.reviewed[rk];
  else roadmapState.reviewed[rk] = true;
  saveRoadmapState();
  renderRoadmap();
};

window.rateFsrsReview = function(day, key, rating) {
  if (!window.WBFsrs) return;
  const next = window.WBFsrs.review(key, rating, day);
  roadmapState.reviewed[`${day}_${key}`] = true;
  saveRoadmapState();
  renderRoadmap();
  const labels = { 1: '重来', 2: '困难', 3: '良好', 4: '简单' };
  if (typeof showToast === 'function') {
    showToast(`FSRS 已按「${labels[rating] || '良好'}」排期：下次复习 Day ${next.dueDay}（${next.interval}天后）`);
  }
};

function getReviewItemsForDay(day) {
  const items = [];
  const seen = new Set();
  const probs = ROADMAP.problems || [];
  const fsrsAll = window.WBFsrs ? window.WBFsrs.getAll() : {};

  // 1. Auto-migrate any completed problems in subDone into FSRS cards
  Object.keys(roadmapState.subDone || {}).forEach(k => {
    const doneDay = roadmapState.subDone[k];
    if (doneDay && doneDay < day && !fsrsAll[k] && window.WBFsrs) {
      fsrsAll[k] = window.WBFsrs.ensureCard(k, doneDay);
    }
  });

  // 2. Pull due FSRS cards sorted by lowest memory retrievability first
  const dueEntries = Object.entries(fsrsAll)
    .map(([k, card]) => {
      const elapsed = Math.max(0, day - (card.lastDay || 1));
      const rPct = Math.round(window.WBFsrs.retrievability(elapsed, card.s) * 100);
      return { k, card, rPct };
    })
    .filter(x => x.card.dueDay <= day || x.rPct < 90)
    .sort((a, b) => a.rPct - b.rPct);

  dueEntries.forEach(({ k, card, rPct }) => {
    if (seen.has(k)) return;
    const p = probs.find(x => x.key === k);
    if (p) {
      seen.add(k);
      items.push({
        ...p,
        fsrs: card,
        rPct,
        reason: `FSRS 留存率 ${rPct}% · 稳定度 ${card.s}天 · 已复习 ${card.reps}次`
      });
    }
  });

  // 3. Fallback: suggest scheduled problems from 1 or 3 days ago if user hasn't reviewed yet
  if (items.length < 2 && day > 1) {
    [1, 3].forEach(gap => {
      const pd = day - gap;
      if (pd < 1) return;
      (roadmapState.schedule[pd] || []).slice(0, 2).forEach(k => {
        if (!seen.has(k)) {
          seen.add(k);
          const p = probs.find(x => x.key === k);
          if (p) items.push({ ...p, rPct: 88, reason: `Day ${pd} 题单回顾 · 点击下方 FSRS 评分纳入记忆曲线` });
        }
      });
    });
  }
  return items.slice(0, 6);
}

window.openProblemFromRoadmap = function(docId, anchor, vizHint, probKey) {
  const hasDoc = docId && docId !== 'undefined' && Array.isArray(DOCS) && DOCS.some(x => x.id === docId);
  if (hasDoc) {
    activeView = 'reader';
    openDoc(docId, anchor, vizHint, true);
    return;
  }
  const cand = [probKey, docId, anchor].find(v => v && v !== 'undefined' && Array.isArray(PROBLEM_BANK) && PROBLEM_BANK.some(b => b.pid === v || b.key === v));
  if (cand && typeof window.openBankProblem === 'function') {
    window.openBankProblem(cand);
    return;
  }
  if (typeof window.openBankProblem === 'function' && Array.isArray(PROBLEM_BANK) && PROBLEM_BANK.length) {
    window.openBankProblem(PROBLEM_BANK[0].pid);
  }
};

window.renderRoadmap = function() {
  ensureSubjectRoadmapData();
  triggerMainAnim();
  activeView = 'roadmap';
  activeId = null;
  renderSidebar();
  const d = roadmapState.selectedDay || 1;
  const cur = roadmapState.currentDay || 1;
  const totalDone = (ROADMAP.problems || []).filter(p => isProbDone(p.key)).length;
  const pct = Math.round((totalDone / (ROADMAP.problems || []).length) * 100);
  const remainingCount = (ROADMAP.problems || []).length - totalDone;
  const remDays = Math.max(1, 80 - cur + 1);
  const avgPerDay = (remainingCount / remDays).toFixed(1);

  // Expected done before currentDay in baseline
  const expectedDone = Math.round(((cur - 1) / 80) * (ROADMAP.problems || []).length);
  const diff = totalDone - expectedDone;
  const paceText = diff > 2 ? `超前 ${diff} 题` : (diff < -2 ? `落后 ${-diff} 题（已自动均摊）` : '按计划稳步推进');

  if (Object.values(roadmapState.schedule || {}).every(arr => !arr || arr.length === 0) && (ROADMAP.problems || []).length > 0) {
    roadmapState.schedule = buildInitialSchedule();
    saveRoadmapState();
  }
  const dayKeys = roadmapState.schedule[d] || [];
  const dayProbs = dayKeys.map(k => (ROADMAP.problems || []).find(p => p.key === k)).filter(Boolean);
  const dayDone = dayProbs.filter(p => isProbDone(p.key)).length;
  const learn = (ROADMAP.learnPlan || [])[d - 1] || { topic: '综合巩固', docs: [] };
  const learnDocs = learn.docs.map(id => DOCS.find(x => x.id === id)).filter(Boolean);
  const reviews = getReviewItemsForDay(d);
  const cap = roadmapState.dayCap[d] !== undefined ? roadmapState.dayCap[d] : 1;

  const _isIcpcRm = ((window.__WB_CONFIG__ && window.__WB_CONFIG__.slug) || 'icpc') === 'icpc';
  const _subjRmName = (window.__WB_SUBJECT_NAME__ || (window.__WB_CONFIG__ && window.__WB_CONFIG__.brandTitle) || '本学科');
  const rmPhases = _isIcpcRm ? [
    { badge: '阶段 1 · Day 1–16', desc: '基础搜索、DP 与树形入门（洛谷 001–033）', start: 1, end: 16 },
    { badge: '阶段 2 · Day 17–38', desc: '省选核心算法与进阶技巧（洛谷 034–074）', start: 17, end: 38 },
    { badge: '阶段 3 · Day 39–53', desc: '高频模板与数据结构强化（洛谷 075–104）', start: 39, end: 53 },
    { badge: '阶段 4 · Day 54–80', desc: 'WF / ICPC 200题专题冲刺（S01–S19）', start: 54, end: 80 }
  ] : [
    { badge: '阶段 1 · Day 1–16', desc: `${_subjRmName} · L1/L2 核心基础概念与入门题组`, start: 1, end: 16 },
    { badge: '阶段 2 · Day 17–38', desc: `${_subjRmName} · L2/L3 重点定理、典型模型与中档实战`, start: 17, end: 38 },
    { badge: '阶段 3 · Day 39–53', desc: `${_subjRmName} · L3/L4 高频难点、综合推导与专题强化`, start: 39, end: 53 },
    { badge: '阶段 4 · Day 54–80', desc: `${_subjRmName} · L4/L5 大师题攻坚与全库复习冲刺`, start: 54, end: 80 }
  ];
  let gridHtml = rmPhases.map(ph => {
    let cells = '';
    for (let i = ph.start; i <= ph.end; i++) {
      const list = roadmapState.schedule[i] || [];
      const doneN = list.filter(k => isProbDone(k)).length;
      const c = roadmapState.dayCap[i] !== undefined ? roadmapState.dayCap[i] : 1;
      let cls = 'rm-cell';
      if (i === d) cls += ' selected';
      if (i === cur) cls += ' today';
      if (c === 0) cls += ' rest';
      else if (list.length > 0 && doneN === list.length) cls += ' done';
      else if (list.length >= 6) cls += ' heavy';
      const subTxt = c === 0 ? '休' : (list.length === 0 ? '复' : `${doneN}/${list.length}`);
      cells += `<button class="${cls}" onclick="selectRoadmapDay(${i})" title="Day ${i}: ${doneN}/${list.length}题">
        <span class="rm-d">D${i}</span>
        <span class="rm-c">${subTxt}</span>
      </button>`;
    }
    return `<div class="rm-phase-group">
      <div class="rm-phase-head">
        <span class="rm-phase-badge">${ph.badge}</span>
        <span class="rm-phase-desc">${ph.desc}</span>
      </div>
      <div class="rm-grid">${cells}</div>
    </div>`;
  }).join('');

  document.getElementById('main').innerHTML = `
    <div class="rm-shell">
      <div class="rm-header">
        <div>
          <div class="hero-eyebrow">80天动态自适应学习路线 · 覆盖精选 ${(ROADMAP.problems || []).length} 题 + 艾宾浩斯复习</div>
          <h1 style="margin:6px 0 8px;font-size:30px;">80天做题路线规划</h1>
          <p style="margin:0;color:var(--muted);font-size:14.5px;">每天明确「学什么新知识」「刷哪几道题」「复习哪些旧题」；提前做完或没时间做时，一键动态重排剩余 80 天计划。</p>
        </div>
        <div class="rm-top-actions">
          <button class="btn btn-primary" onclick="rebalanceSchedule(roadmapState.currentDay, '已按当前进度与每日负荷动态重排剩余 80 天计划')">动态重排剩余计划</button>
          <button class="btn" onclick="resetRoadmap()">↺ 重置默认路线</button>
        </div>
      </div>

      <div class="stats-row" style="margin-bottom:22px;">
        <div class="stat-pill"><div class="stat-val">Day ${cur} / 80</div><div class="stat-lbl">当前所在天数</div></div>
        <div class="stat-pill"><div class="stat-val">${totalDone} / ${(ROADMAP.problems || []).length}</div><div class="stat-lbl">总完成题数 (${pct}%)</div></div>
        <div class="stat-pill"><div class="stat-val">${avgPerDay} 题/天</div><div class="stat-lbl">剩余日均负荷</div></div>
        <div class="stat-pill"><div class="stat-val" style="font-size:17px;">${paceText}</div><div class="stat-lbl">当前节奏状态</div></div>
      </div>

      <div class="rm-day-panel">
        <div class="rm-day-top">
          <div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <h2 style="margin:0;font-size:24px;">Day ${d} 计划</h2>
              ${d === cur ? '<span class="badge done">当前所在天</span>' : `<button class="btn" style="padding:4px 12px;font-size:12px;" onclick="setCurrentDay(${d})">设今天为 Day ${d}</button>`}
              <span class="badge">${dayDone} / ${dayProbs.length} 题已完成</span>
            </div>
            <div style="color:var(--muted);font-size:13.5px;margin-top:4px;">今日主题：${escapeHtml(learn.topic)}</div>
          </div>
          <div class="rm-day-controls">
            <button class="btn" onclick="selectRoadmapDay(${Math.max(1, d - 1)})" ${d <= 1 ? 'disabled' : ''}>← 前一天</button>
            <button class="btn" onclick="selectRoadmapDay(${Math.min(80, d + 1)})" ${d >= 80 ? 'disabled' : ''}>后一天 →</button>
          </div>
        </div>

        <details class="wb-cat-collapse" style="margin:8px 0 12px 0;">
          <summary class="wb-cat-summary" style="padding:9px 12px !important;">
            <span class="wb-cat-cur">⚙️ <strong>调整今日负荷与重排</strong>（当前 ${cap}x）</span>
            <span class="wb-cat-toggle">展开 ▾</span>
          </summary>
          <div style="padding:10px 12px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              <button class="btn" style="border-color:var(--amber);color:var(--amber);" onclick="skipDayAndRebalance(${d})">⏸️ 今日没时间（顺延）</button>
              <button class="btn" style="border-color:var(--green);color:var(--green);" onclick="finishEarlyAndRebalance(${d})">提前做完（减负）</button>
              <button class="btn" onclick="pullNextProblem(${d})">提前拉取1题</button>
            </div>
            <div class="rm-cap-bar" style="margin:0;">
              ${[[0,'没时间 (0x)'],[0.5,'轻度忙碌 (0.5x)'],[1,'正常 (1.0x)'],[1.5,'充裕冲刺 (1.5x)']].map(([val, lbl]) =>
                `<button class="btn ${cap === val ? 'btn-primary' : ''}" style="padding:5px 10px;font-size:12px;" onclick="setDayCap(${d}, ${val})">${lbl}</button>`
              ).join('')}
            </div>
          </div>
        </details>

        <div class="rm-columns">
          <div class="rm-col">
            <h3>今日新学（新知识点与讲义）</h3>
            <div class="rm-box">
              <div style="font-weight:600;margin-bottom:10px;font-size:14.5px;">${escapeHtml(learn.topic)}</div>
              <div style="display:flex;flex-direction:column;gap:8px;">
                ${learnDocs.map(ld => `
                  <div class="rm-item" onclick="openProblemFromRoadmap('${ld.id}', '', '${ROADMAP.docViz[ld.id] || ''}')">
                    <div>
                      <div style="font-weight:600;font-size:13.5px;">${escapeHtml(ld.title)}</div>
                      <div style="font-size:12px;color:var(--muted);">${escapeHtml(ld.group)} · 点击阅读并可打开右侧${(!window.__WB_CONFIG__ || window.__WB_CONFIG__.slug === "icpc") ? "算法可视化" : (window.__WB_CONFIG__.slug === "c4" ? "微积分可视化" : "交互可视化")}</div>
                    </div>
                    <span class="badge">阅读 →</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <h3 style="margin-top:22px;">今日复习（FSRS 智能记忆曲线）</h3>
            <div class="rm-box">
              ${reviews.length ? reviews.map(rv => {
                const isRev = !!roadmapState.reviewed[`${d}_${rv.key}`];
                const p1 = window.WBFsrs ? window.WBFsrs.preview(rv.key, 1, d).interval : 1;
                const p2 = window.WBFsrs ? window.WBFsrs.preview(rv.key, 2, d).interval : 2;
                const p3 = window.WBFsrs ? window.WBFsrs.preview(rv.key, 3, d).interval : 4;
                const p4 = window.WBFsrs ? window.WBFsrs.preview(rv.key, 4, d).interval : 10;
                return `<div class="rm-item" style="flex-direction:column;align-items:stretch;gap:8px;">
                  <div style="cursor:pointer;" onclick="openProblemFromRoadmap('${rv.docId}', '${rv.anchor}', '${rv.viz}', '${rv.key}')">
                    <div style="font-weight:600;font-size:13.5px;${isRev ? 'text-decoration:line-through;opacity:0.65;' : ''}">${escapeHtml(rv.title)}</div>
                    <div style="font-size:12px;color:var(--muted);margin-top:2px;">${escapeHtml(rv.reason)}</div>
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;">
                    <button class="btn" style="height:28px;padding:0 9px;font-size:11.5px;" onclick="rateFsrsReview(${d}, '${rv.key}', 1)">重来 ${p1}d</button>
                    <button class="btn" style="height:28px;padding:0 9px;font-size:11.5px;" onclick="rateFsrsReview(${d}, '${rv.key}', 2)">困难 ${p2}d</button>
                    <button class="btn ${isRev ? 'btn-primary' : ''}" style="height:28px;padding:0 9px;font-size:11.5px;" onclick="rateFsrsReview(${d}, '${rv.key}', 3)">良好 ${p3}d</button>
                    <button class="btn" style="height:28px;padding:0 9px;font-size:11.5px;" onclick="rateFsrsReview(${d}, '${rv.key}', 4)">简单 ${p4}d</button>
                  </div>
                </div>`;
              }).join('') : '<div style="color:var(--muted);font-size:13px;">完成今日或前几日题目后，FSRS 记忆引擎将按每题掌握度动态计算留存率并自动安排最佳复习日。</div>'}
            </div>
          </div>

          <div class="rm-col">
            <h3>今日刷题（${dayProbs.length} 题）</h3>
            <div class="rm-box">
              ${dayProbs.length ? dayProbs.map(p => {
                const done = isProbDone(p.key);
                return `<div class="rm-prob-card ${done ? 'done' : ''}">
                  <div class="rm-prob-main">
                    <button class="rm-check ${done ? 'checked' : ''}" onclick="toggleRoadmapProb('${p.key}', ${d})" title="标记完成">${done ? '✓' : ''}</button>
                    <div style="flex:1;min-width:0;">
                      <div class="rm-prob-title" onclick="openProblemFromRoadmap('${p.docId || ''}', '${p.anchor || ''}', '${p.viz || ''}', '${p.key || p.pid || ''}')">${escapeHtml(p.title)}</div>
                      <div style="font-size:12px;color:var(--muted);margin-top:2px;">${escapeHtml(p.stageName || p.topic || p.tier || '精选母题')}</div>
                    </div>
                  </div>
                  <div class="rm-prob-actions">
                    <button class="btn" style="padding:5px 11px;font-size:12px;" onclick="openProblemFromRoadmap('${p.docId || ''}', '${p.anchor || ''}', '${p.viz || ''}', '${p.key || p.pid || ''}')">做题 + 可视化 →</button>
                    ${!done && d < 80 ? `<button class="btn" style="padding:5px 10px;font-size:12px;" onclick="deferProblem('${p.key}', ${d})">推迟</button>` : ''}
                  </div>
                </div>`;
              }).join('') : `<div style="color:var(--muted);font-size:13.5px;padding:12px 0;">${cap === 0 ? '今天已设为休息日，所有题目已顺延至后续天数。' : '今天暂无新题安排，可以点击左侧复习清单巩固旧题，或点击上方「提前拉取1题」。'}</div>`}
            </div>
          </div>
        </div>
      </div>
    
      <details class="wb-cat-collapse" style="margin-top:16px;">
        <summary class="wb-cat-summary">
          <span class="wb-cat-cur">📅 <strong>80 天进度矩阵总览</strong>（当前 Day ${d} / 80）</span>
          <span class="wb-cat-toggle">展开切换天数 ▾</span>
        </summary>
        <div class="rm-grid-card">
          <div class="rm-grid-head">
            <span><strong>80 天进度矩阵</strong>（点击任意一天查看或调整）</span>
            <span class="rm-legend">
              <span><i class="dot done"></i>已完成</span>
              <span><i class="dot today"></i>今天</span>
              <span><i class="dot rest"></i>请假/顺延</span>
              <span><i class="dot heavy"></i>高强度</span>
            </span>
          </div>
          <div class="rm-phases-wrap">${gridHtml}</div>
        </div>
      </details>
</div>
  `;
  window.scrollTo({ top: 0, behavior: 'instant' });
};

// ===== Right-Sidebar 14-in-1 Interactive Algorithm Visualizer Engine =====
