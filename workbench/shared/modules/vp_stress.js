/* === Module: Virtual Contest (VP) Timer & Stress-Test Generator === */
const VP_STATE_KEY = 'icpc_vp_state_v1';
let vpState = (() => {
  const def = {
    team: ['队员 A', '队员 B', '队员 C'],
    remSec: 5 * 3600,
    running: false,
    mode: 'Regional 5题',
    problems: []
  };
  try {
    const raw = localStorage.getItem(VP_STATE_KEY);
    if (raw) return Object.assign(def, JSON.parse(raw));
  } catch (e) {}
  return def;
})();
let vpTimerHandle = null;

function saveVpState() {
  try { localStorage.setItem(VP_STATE_KEY, JSON.stringify(vpState)); } catch (e) {}
}

function formatVpTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function getVpElapsedMin() {
  return Math.max(1, Math.floor((5 * 3600 - vpState.remSec) / 60));
}

function startVpIntervalIfNeeded() {
  if (vpTimerHandle) { clearInterval(vpTimerHandle); vpTimerHandle = null; }
  if (vpState.running) {
    vpTimerHandle = setInterval(() => {
      if (!vpState.running) return;
      if (vpState.remSec > 0) {
        vpState.remSec--;
        saveVpState();
        const el = document.getElementById('vpClockDisplay');
        if (el) el.textContent = formatVpTime(vpState.remSec);
        const elMin = document.getElementById('vpElapsedDisplay');
        if (elMin) elMin.textContent = `已进行 ${Math.floor((5 * 3600 - vpState.remSec) / 60)} min`;
      } else {
        vpState.running = false;
        saveVpState();
        clearInterval(vpTimerHandle);
        vpTimerHandle = null;
        renderVpModalBody();
      }
    }, 1000);
  }
}


const WF_VP_PRESETS = [
  { id: 'wf2023', name: 'ICPC WF 2023 Luxor (11题 · 5h)', probs: [
    { pid: 'WF2023-A', title: 'A. Riddle of the Sphinx (交互/纠错)', tier: 'L3' },
    { pid: 'WF2023-B', title: 'B. Schedule (贪心/构造)', tier: 'L3' },
    { pid: 'WF2023-C', title: 'C. Three Dice (概率/凸包)', tier: 'L4' },
    { pid: 'WF2023-D', title: "D. Carl's Vacation (3D几何三分)", tier: 'L4' },
    { pid: 'WF2023-F', title: 'F. Tilting Tiles (置换群CRT)', tier: 'L5' },
    { pid: 'WF2023-G', title: 'G. Turning Red (图论线性方程)', tier: 'L4' },
    { pid: 'WF2023-H', title: 'H. Jet Lag (区间贪心)', tier: 'L4' },
    { pid: 'WF2023-I', title: 'I. Waterworld (几何/平均)', tier: 'L3' },
    { pid: 'WF2023-J', title: 'J. Bridging the Gap (状态DP)', tier: 'L5' },
    { pid: 'WF2023-K', title: 'K. Alea Iacta Est (期望DP)', tier: 'L5' },
    { pid: 'WF2023-Y', title: 'Y. Compression (字符串签到)', tier: 'L2' }
  ]},
  { id: 'wf2021', name: 'ICPC WF 2021 Dhaka (12题 · 5h)', probs: [
    { pid: 'WF2021-A', title: 'A. Cross-Country Skiing (BFS)', tier: 'L3' },
    { pid: 'WF2021-B', title: 'B. Dungeon Crawler (树上直径DP)', tier: 'L4' },
    { pid: 'WF2021-C', title: 'C. Fair Division (数论枚举)', tier: 'L3' },
    { pid: 'WF2021-D', title: 'D. Guardians of the Gallery (计算几何)', tier: 'L5' },
    { pid: 'WF2021-E', title: 'E. Hand of the Free Marked (期望)', tier: 'L4' },
    { pid: 'WF2021-F', title: 'F. Islands from the Sky (3D几何)', tier: 'L4' },
    { pid: 'WF2021-G', title: 'G. Mosaic Browsing (FFT通配匹配)', tier: 'L4' },
    { pid: 'WF2021-H', title: 'H. Prehistoric Programs (括号贪心)', tier: 'L3' },
    { pid: 'WF2021-I', title: 'I. Spider Walk (线段树DP)', tier: 'L5' },
    { pid: 'WF2021-J', title: 'J. Splitstream (DAG反向追踪)', tier: 'L3' },
    { pid: 'WF2021-K', title: 'K. Take On Meme (闵可夫斯基和)', tier: 'L5' },
    { pid: 'WF2021-L', title: 'L. Where Am I? (螺旋Trie)', tier: 'L4' }
  ]},
  { id: 'wf2020', name: 'ICPC WF 2020 Moscow (12题 · 5h)', probs: [
    { pid: 'WF2020-A', title: 'A. Cardiology (模拟枚举)', tier: 'L3' },
    { pid: 'WF2020-B', title: 'B. The Cost of Speed (树形DP)', tier: 'L4' },
    { pid: 'WF2020-C', title: 'C. Domes (半平面交)', tier: 'L4' },
    { pid: 'WF2020-D', title: 'D. Gene Folding (Manacher贪心)', tier: 'L3' },
    { pid: 'WF2020-E', title: 'E. Landscape Generator (二阶差分)', tier: 'L3' },
    { pid: 'WF2020-F', title: 'F. Ley Lines (极角扫描)', tier: 'L4' },
    { pid: 'WF2020-G', title: 'G. Opportunity Cost (2^3状压最值)', tier: 'L4' },
    { pid: 'WF2020-H', title: 'H. Quest Parsing (区间DP)', tier: 'L5' },
    { pid: 'WF2020-I', title: 'I. Quests (背包排序)', tier: 'L4' },
    { pid: 'WF2020-J', title: 'J. Snooker (计算几何)', tier: 'L5' },
    { pid: 'WF2020-K', title: 'K. Space Walls (三维几何)', tier: 'L5' },
    { pid: 'WF2020-M', title: 'M. Trailing Digits (数论签到)', tier: 'L2' }
  ]},
  { id: 'wf2019', name: 'ICPC WF 2019 Porto (11题 · 5h)', probs: [
    { pid: 'WF2019-A', title: 'A. Azulejos (贪心双set)', tier: 'L3' },
    { pid: 'WF2019-B', title: 'B. Beautiful Bridges (几何DP)', tier: 'L4' },
    { pid: 'WF2019-C', title: 'C. Checks Post Facto (搜索)', tier: 'L4' },
    { pid: 'WF2019-D', title: 'D. Circular DNA (前缀最小值)', tier: 'L3' },
    { pid: 'WF2019-E', title: 'E. Dead-End Detector (拓扑剥叶)', tier: 'L4' },
    { pid: 'WF2019-F', title: 'F. Directing Rainfall (Slope Trick)', tier: 'L5' },
    { pid: 'WF2019-G', title: 'G. First of Her Name (后缀数组)', tier: 'L4' },
    { pid: 'WF2019-H', title: "H. Hobson's Trains (基环树差分)", tier: 'L4' },
    { pid: 'WF2019-I', title: 'I. Karel the Robot (图论记忆化)', tier: 'L5' },
    { pid: 'WF2019-J', title: 'J. Miniature Golf (事件扫描)', tier: 'L4' },
    { pid: 'WF2019-K', title: 'K. Traffic Blights (数论CRT)', tier: 'L5' }
  ]}
];

window.vpLoadPreset = function(presetId) {
  const pre = WF_VP_PRESETS.find(x => x.id === presetId);
  if (!pre) return;
  vpState.problems = pre.probs.map((p, i) => ({
    letter: String.fromCharCode(65 + i),
    pid: p.pid,
    title: p.title,
    tier: p.tier,
    assigned: -1,
    wa: 0,
    acMin: null
  }));
  vpState.elapsedSec = 0; vpState.remSec = 5 * 3600;
  vpState.running = false;
  vpState.startedAt = null;
  saveVpState();
  renderVpModalBody();
  if (typeof showToast === 'function') showToast('已载入经典 5 小时套题：' + pre.name);
};

window.vpGenerateSet = function(count, style) {
  const bank = (typeof PROBLEM_BANK !== 'undefined' && Array.isArray(PROBLEM_BANK)) ? PROBLEM_BANK : [];
  if (!bank.length) { alert('PROBLEM_BANK 尚未加载'); return; }
  let pool = bank;
  if (style === 'wf') {
    const hard = bank.filter(p => ['L2', 'L3', 'L4', 'L5'].includes(p.tier));
    if (hard.length >= count) pool = hard;
  }
  const picked = [];
  const used = new Set();
  const limit = Math.min(13, Math.max(1, count));
  let guard = 0;
  while (picked.length < limit && guard < 5000) {
    guard++;
    const p = pool[Math.floor(Math.random() * pool.length)];
    if (p && !used.has(p.key)) {
      used.add(p.key);
      picked.push(p);
    }
  }
  picked.sort((a, b) => (a.cfRating || 1200) - (b.cfRating || 1200));
  const letters = 'ABCDEFGHIJKLM';
  vpState.problems = picked.map((p, idx) => ({
    letter: letters[idx],
    order: p.order,
    pid: p.pid || p.key,
    title: p.title || p.pid,
    tier: p.tier || 'L2',
    cfRating: p.cfRating || 1500,
    assignee: 0,
    wa: 0,
    acMin: null
  }));
  vpState.mode = `${style === 'wf' ? 'WF' : 'Regional'} ${limit}题`;
  vpState.remSec = 5 * 3600;
  vpState.running = false;
  saveVpState();
  startVpIntervalIfNeeded();
  renderVpModalBody();
};

window.vpAddExtraProblem = function() {
  if (vpState.problems.length >= 13) return;
  const bank = (typeof PROBLEM_BANK !== 'undefined' && Array.isArray(PROBLEM_BANK)) ? PROBLEM_BANK : [];
  if (!bank.length) return;
  const used = new Set(vpState.problems.map(x => x.order));
  const cand = bank.filter(p => !used.has(p.order));
  const p = cand.length ? cand[Math.floor(Math.random() * cand.length)] : bank[0];
  const letters = 'ABCDEFGHIJKLM';
  vpState.problems.push({
    letter: letters[vpState.problems.length],
    order: p.order,
    pid: p.pid || p.key,
    title: p.title || p.pid,
    tier: p.tier || 'L2',
    cfRating: p.cfRating || 1500,
    assignee: 0,
    wa: 0,
    acMin: null
  });
  saveVpState();
  renderVpModalBody();
};

window.vpToggleTimer = function() {
  vpState.running = !vpState.running;
  saveVpState();
  startVpIntervalIfNeeded();
  renderVpModalBody();
};

window.vpResetTimer = function() {
  vpState.running = false;
  vpState.remSec = 5 * 3600;
  saveVpState();
  startVpIntervalIfNeeded();
  renderVpModalBody();
};

window.vpAssign = function(idx, memberIdx) {
  if (!vpState.problems[idx]) return;
  vpState.problems[idx].assignee = Number(memberIdx);
  saveVpState();
  renderVpModalBody();
};

window.vpMarkWa = function(idx) {
  if (!vpState.problems[idx]) return;
  vpState.problems[idx].wa = (vpState.problems[idx].wa || 0) + 1;
  saveVpState();
  renderVpModalBody();
};

window.vpMarkAc = function(idx) {
  if (!vpState.problems[idx]) return;
  vpState.problems[idx].acMin = getVpElapsedMin();
  saveVpState();
  renderVpModalBody();
};

window.vpResetProb = function(idx) {
  if (!vpState.problems[idx]) return;
  vpState.problems[idx].wa = 0;
  vpState.problems[idx].acMin = null;
  saveVpState();
  renderVpModalBody();
};

window.vpUpdateMemberName = function(i, val) {
  vpState.team[i] = val || `队员 ${'ABC'[i]}`;
  saveVpState();
};

function renderVpModalBody() {
  const bodyEl = document.getElementById('extModalBody');
  if (!bodyEl) return;
  const solvedList = vpState.problems.filter(p => p.acMin !== null);
  const totalSolved = solvedList.length;
  const totalPenalty = solvedList.reduce((acc, p) => acc + p.acMin + 20 * (p.wa || 0), 0);
  const memberSolved = [1, 2, 3].map(m => vpState.problems.filter(p => p.assignee === m && p.acMin !== null).length);

  bodyEl.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div class="calc-box" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-size:12px;color:var(--muted);">5 小时 ICPC 组队赛倒计时 · ${escapeHtml(vpState.mode || '未开赛')}</div>
          <div style="display:flex;align-items:baseline;gap:12px;margin-top:2px;">
            <span id="vpClockDisplay" style="font-size:28px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--accent);">${formatVpTime(vpState.remSec)}</span>
            <span id="vpElapsedDisplay" style="font-size:12.5px;color:var(--muted);">已进行 ${Math.floor((5 * 3600 - vpState.remSec) / 60)} min</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="vpToggleTimer()">${vpState.running ? '⏸ 暂停' : '▶ 开始计时'}</button>
          <button class="btn" onclick="vpResetTimer()">↺ 重置 5h</button>
          <button class="btn" onclick="vpGenerateSet(5, 'regional')">🎲 5 题 Regional</button>
          <button class="btn" onclick="vpGenerateSet(10, 'wf')">🎲 10 题 Regional/WF</button>
          ${vpState.problems.length > 0 && vpState.problems.length < 13 ? `<button class="btn" onclick="vpAddExtraProblem()">+ 加一题 (至M)</button>` : ''}
        </div>
      </div>

      <div class="calc-box" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:12.5px;font-weight:700;">3 人分工：</span>
          ${[0, 1, 2].map(i => `
            <div style="display:flex;align-items:center;gap:4px;">
              <input class="ext-search" style="width:92px;padding:4px 8px;font-size:12.5px;" value="${escapeHtml(vpState.team[i])}" oninput="vpUpdateMemberName(${i}, this.value)" />
              <span class="badge" style="font-size:11px;">${memberSolved[i]} AC</span>
            </div>
          `).join('')}
        </div>
        <div style="font-size:14px;font-weight:700;">
          总过题：<span style="color:var(--green);">${totalSolved} / ${vpState.problems.length}</span>
          &nbsp;·&nbsp;
          总罚时：<span style="color:var(--accent);">${totalPenalty} min</span>
          <span style="font-size:11.5px;color:var(--muted);font-weight:400;">(time + 20×WA)</span>
        </div>
      </div>

      ${vpState.problems.length === 0 ? `
        <div style="padding:28px;text-align:center;color:var(--muted);border:1px dashed var(--border-strong);border-radius:12px;">
          点击上方「🎲 5 题 Regional」或「🎲 10 题 Regional/WF」从 1000 题库中随机抽取套题（支持 A–M 最多 13 题分工与罚时统计）。
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:8px;max-height:420px;overflow-y:auto;padding-right:4px;">
          ${vpState.problems.map((p, idx) => {
            const pen = p.acMin !== null ? (p.acMin + 20 * (p.wa || 0)) : 0;
            return `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid ${p.acMin !== null ? 'var(--green)' : 'var(--border-strong)'};">
              <div style="display:flex;align-items:center;gap:10px;min-width:220px;flex:1;">
                <span class="badge" style="font-weight:800;min-width:28px;text-align:center;background:${p.acMin!==null?'var(--green)':'var(--accent)'};color:#fff;">${p.letter}</span>
                <div>
                  <button class="btn" style="border:none;background:transparent;padding:0;font-weight:700;text-align:left;" onclick="${p.order ? `closeExtModal();openBankProblem(${p.order})` : `if(typeof openOjModal==='function')openOjModal('${escapeHtml(p.pid||'')}')`}">${escapeHtml(p.pid)} · ${escapeHtml(p.title)}</button>
                  <div style="font-size:11.5px;color:var(--muted);">${escapeHtml(p.tier)} · CF ${p.cfRating}</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <select class="ext-search" style="width:105px;padding:4px 6px;font-size:12px;" onchange="vpAssign(${idx}, this.value)">
                  <option value="0" ${p.assignee===0?'selected':''}>未认领</option>
                  <option value="1" ${p.assignee===1?'selected':''}>${escapeHtml(vpState.team[0])}</option>
                  <option value="2" ${p.assignee===2?'selected':''}>${escapeHtml(vpState.team[1])}</option>
                  <option value="3" ${p.assignee===3?'selected':''}>${escapeHtml(vpState.team[2])}</option>
                </select>
                <span style="min-width:115px;font-size:12.5px;font-weight:700;color:${p.acMin!==null?'var(--green)':'var(--muted)'};">
                  ${p.acMin !== null ? `AC @${p.acMin}m (${pen}m)` : '未通过'} ${p.wa ? `<span style="color:#ef4444;">(-${p.wa})</span>` : ''}
                </span>
                <button class="btn" style="height:28px;padding:0 10px;font-size:12px;" onclick="vpMarkWa(${idx})">+WA</button>
                <button class="btn btn-primary" style="height:28px;padding:0 10px;font-size:12px;" onclick="vpMarkAc(${idx})">AC</button>
                <button class="btn" style="height:28px;padding:0 8px;font-size:12px;" onclick="vpResetProb(${idx})">重置</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      `}
    </div>`;
}

window.openVpModal = function() {
  const bd = document.getElementById('extModalBackdrop');
  const titleEl = document.getElementById('extModalTitle');
  const modalBox = bd?.querySelector('.ext-modal');
  if (modalBox) modalBox.style.width = 'min(940px, 95vw)';
  if (!bd || !titleEl) return;
  titleEl.textContent = '5 小时 ICPC 组队 VP 模拟赛 (Team Contest Simulator)';
  bd.classList.add('open');
  startVpIntervalIfNeeded();
  renderVpModalBody();
};

// === Stress-Test (对拍) Script Generator Modal ===
const STRESS_GEN_PRESETS = {
  array: {
    name: '随机数组 / 序列',
    gen: `#include <bits/stdc++.h>
using namespace std;
int main() {
    mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
    auto rnd = [&](long long l, long long r) {
        return uniform_int_distribution<long long>(l, r)(rng);
    };
    int n = rnd(1, 20);
    cout << n << "\\n";
    for (int i = 1; i <= n; i++) {
        cout << rnd(1, 100) << (i == n ? '\\n' : ' ');
    }
    return 0;
}`,
    brute: `#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n; cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    long long ans = 0;
    for (int i = 0; i < n; i++) ans += a[i];
    cout << ans << "\\n";
    return 0;
}`,
    sol: `#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n; cin >> n;
    long long sum = 0, x;
    for (int i = 0; i < n; i++) { cin >> x; sum += x; }
    cout << sum << "\\n";
    return 0;
}`
  },
  tree: {
    name: '随机树 / 连通图',
    gen: `#include <bits/stdc++.h>
using namespace std;
int main() {
    mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
    auto rnd = [&](int l, int r) {
        return uniform_int_distribution<int>(l, r)(rng);
    };
    int n = rnd(2, 15);
    vector<int> p(n + 1);
    iota(p.begin(), p.end(), 0);
    shuffle(p.begin() + 1, p.end(), rng);
    cout << n << "\\n";
    for (int i = 2; i <= n; i++) {
        int fa = p[rnd(1, i - 1)], u = p[i];
        int w = rnd(1, 100);
        cout << fa << " " << u << " " << w << "\\n";
    }
    return 0;
}`,
    brute: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    long long s = 0;
    for (int i = 0, u, v, w; i < n - 1; i++) {
        cin >> u >> v >> w; s += w;
    }
    cout << s << "\\n";
    return 0;
}`,
    sol: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    long long s = 0;
    for (int i = 0, u, v, w; i < n - 1; i++) {
        cin >> u >> v >> w; s += w;
    }
    cout << s << "\\n";
    return 0;
}`
  }
};

const STRESS_CHECK_SH = `#!/usr/bin/env bash
set -e
g++ -O2 -std=c++17 gen.cpp -o gen
g++ -O2 -std=c++17 brute.cpp -o brute
g++ -O2 -std=c++17 sol.cpp -o sol

cnt=0
while true; do
  cnt=$((cnt + 1))
  ./gen > in.txt
  ./brute < in.txt > out_brute.txt
  ./sol < in.txt > out_sol.txt
  if ! diff -Zq out_brute.txt out_sol.txt >/dev/null; then
    echo "WA on test #$cnt!"
    diff -u out_brute.txt out_sol.txt || true
    break
  fi
  echo "AC #$cnt"
done`;

const STRESS_CHECK_BAT = `@echo off
g++ -O2 -std=c++17 gen.cpp -o gen.exe || exit /b 1
g++ -O2 -std=c++17 brute.cpp -o brute.exe || exit /b 1
g++ -O2 -std=c++17 sol.cpp -o sol.exe || exit /b 1

set cnt=0
:loop
set /a cnt+=1
gen.exe > in.txt
brute.exe < in.txt > out_brute.txt
sol.exe < in.txt > out_sol.txt
fc out_brute.txt out_sol.txt > nul
if errorlevel 1 (
  echo WA on test #%cnt%!
  fc out_brute.txt out_sol.txt
  pause
  exit /b 1
)
echo AC #%cnt%
goto loop`;

let stressGenPreset = 'array';

window.copyStressGenText = function(elId, btn) {
  const el = document.getElementById(elId);
  if (!el) return;
  navigator.clipboard?.writeText(el.value).then(() => {
    if (btn) {
      const old = btn.textContent;
      btn.textContent = '✓ 已复制';
      setTimeout(() => { btn.textContent = old; }, 1200);
    }
  });
};

window.downloadStressGenFile = function(filename, elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const blob = new Blob([el.value], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

window.switchStressGenPreset = function(key) {
  stressGenPreset = key;
  openStressGenModal();
};

window.openStressGenModal = function() {
  const bd = document.getElementById('extModalBackdrop');
  const titleEl = document.getElementById('extModalTitle');
  const bodyEl = document.getElementById('extModalBody');
  const modalBox = bd?.querySelector('.ext-modal');
  if (modalBox) modalBox.style.width = 'min(960px, 95vw)';
  if (!bd || !bodyEl) return;
  const preset = STRESS_GEN_PRESETS[stressGenPreset] || STRESS_GEN_PRESETS.array;
  titleEl.textContent = '本地命令行对拍脚本生成器 (gen.cpp + brute.cpp + sol.cpp + check.sh/.bat)';
  bodyEl.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${Object.keys(STRESS_GEN_PRESETS).map(k => `<button class="btn ${k===stressGenPreset?'btn-primary':''}" onclick="switchStressGenPreset('${k}')">${STRESS_GEN_PRESETS[k].name}</button>`).join('')}
        </div>
        <span style="font-size:12px;color:var(--muted);">Linux/macOS 运行 <code>bash check.sh</code> · Windows 运行 <code>check.bat</code></span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:10px;">
        ${[
          { id: 'sgGen', name: 'gen.cpp', val: preset.gen },
          { id: 'sgBrute', name: 'brute.cpp', val: preset.brute },
          { id: 'sgSol', name: 'sol.cpp', val: preset.sol }
        ].map(f => `
          <div class="calc-box" style="display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:13px;">${f.name}</strong>
              <div style="display:flex;gap:6px;">
                <button class="btn" style="height:26px;padding:0 8px;font-size:11.5px;" onclick="copyStressGenText('${f.id}', this)">复制</button>
                <button class="btn" style="height:26px;padding:0 8px;font-size:11.5px;" onclick="downloadStressGenFile('${f.name}', '${f.id}')">下载</button>
              </div>
            </div>
            <textarea id="${f.id}" class="ide-editor" style="min-height:170px;font-size:12px;">${escapeHtml(f.val)}</textarea>
          </div>
        `).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px;">
        ${[
          { id: 'sgSh', name: 'check.sh (Linux / macOS)', file: 'check.sh', val: STRESS_CHECK_SH },
          { id: 'sgBat', name: 'check.bat (Windows)', file: 'check.bat', val: STRESS_CHECK_BAT }
        ].map(f => `
          <div class="calc-box" style="display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:13px;">${f.name}</strong>
              <div style="display:flex;gap:6px;">
                <button class="btn" style="height:26px;padding:0 8px;font-size:11.5px;" onclick="copyStressGenText('${f.id}', this)">复制</button>
                <button class="btn" style="height:26px;padding:0 8px;font-size:11.5px;" onclick="downloadStressGenFile('${f.file}', '${f.id}')">下载</button>
              </div>
            </div>
            <textarea id="${f.id}" class="ide-editor" style="min-height:150px;font-size:12px;">${escapeHtml(f.val)}</textarea>
          </div>
        `).join('')}
      </div>
    </div>`;
  bd.classList.add('open');
};

loadRoadmapState();
if (particlesEnabled) tick();
renderHome(activeView === "home");




