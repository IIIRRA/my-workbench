/* === Precision 3D Knowledge Constellation & Topological Graph Engine (All 14 Workbenches) === */
(function () {
  if (window.__wbTree3dLoaded) return;
  window.__wbTree3dLoaded = true;

  const PALETTE = [
    '#3b82f6', '#10b981', '#8b5cf6', '#06b6d4',
    '#f59e0b', '#ec4899', '#6366f1', '#14b8a6',
    '#0ea5e9', '#a855f7', '#22c55e', '#f97316'
  ];

  function hexToRgba(hex, alpha) {
    const h = String(hex || '#60a5fa').replace('#', '');
    const r = parseInt(h.slice(0, 2), 16) || 96;
    const g = parseInt(h.slice(2, 4), 16) || 165;
    const b = parseInt(h.slice(4, 6), 16) || 250;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function buildLayouts(branches) {
    const B = Math.max(1, (branches || []).length);
    const hubs = [];
    const nodes = [];
    const edges = [];
    const stars = [];

    // Subtle deep-space background coordinate dust (low-contrast, depth-layered)
    for (let i = 0; i < 64; i++) {
      const phi = Math.acos(1 - 2 * ((i + 0.5) / 64));
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const rad = 240 + (i % 5) * 32;
      stars.push({
        x: Math.sin(phi) * Math.cos(theta) * rad,
        y: Math.cos(phi) * rad * 0.72,
        z: Math.sin(phi) * Math.sin(theta) * rad,
        r: 0.7 + (i % 3) * 0.45,
        phase: i * 0.61
      });
    }

    const totalNodes = (branches || []).reduce((acc, br) => acc + ((br.nodes && br.nodes.length) || 0), 0) || 1;
    let globalIdx = 0;

    (branches || []).forEach((br, bi) => {
      const col = PALETTE[bi % PALETTE.length];
      const brName = String(br.name || br.id || ('专题 ' + (bi + 1)));

      // 1) Sphere layout: Golden-spiral Fibonacci shell for cluster hubs
      const phi = Math.acos(1 - 2 * ((bi + 0.5) / B));
      const theta = Math.PI * (1 + Math.sqrt(5)) * bi;
      const hubR = 158;
      const sHub = {
        x: Math.sin(phi) * Math.cos(theta) * hubR,
        y: Math.cos(phi) * hubR * 0.82,
        z: Math.sin(phi) * Math.sin(theta) * hubR
      };

      // 2) Helix layout: Ascending progression spiral (foundational -> advanced)
      const hFrac = B > 1 ? bi / (B - 1) : 0.5;
      const hAng = bi * 0.92;
      const hHub = {
        x: Math.cos(hAng) * 105,
        y: 128 - hFrac * 256,
        z: Math.sin(hAng) * 105
      };

      // 3) Orbital layout: Concentric inclined planetary rings
      const ringIdx = bi % 3;
      const oRad = 104 + ringIdx * 58;
      const oAng = (bi / B) * Math.PI * 2;
      const oTilt = (ringIdx - 1) * 0.24;
      const oHub = {
        x: Math.cos(oAng) * oRad,
        y: Math.sin(oAng) * oRad * Math.sin(oTilt) + (ringIdx - 1) * 28,
        z: Math.sin(oAng) * oRad * Math.cos(oTilt)
      };

      const hub = {
        id: 'hub_' + bi,
        bi,
        name: brName,
        color: col,
        tierRange: br.tierRange || '',
        layouts: {
          mindmap: { x: Math.cos((bi / B) * Math.PI * 2 - Math.PI / 2) * 155, y: Math.sin((bi / B) * Math.PI * 2 - Math.PI / 2) * 145, z: 0 },
          sphere: sHub, helix: hHub, orbital: oHub
        },
        x: sHub.x, y: sHub.y, z: sHub.z
      };
      hubs.push(hub);

      // Connect consecutive hubs along progression spine
      if (bi > 0) {
        edges.push({ from: hubs[bi - 1], to: hub, kind: 'spine', color: col, bi });
      }

      const subNodes = br.nodes || [];
      const N = Math.max(1, subNodes.length);
      // Local tangent basis around sphere hub for crisp satellite halo
      const len = Math.hypot(sHub.x, sHub.y, sHub.z) || 1;
      const nx = sHub.x / len, ny = sHub.y / len, nz = sHub.z / len;
      const upX = Math.abs(ny) > 0.85 ? 1 : 0, upY = Math.abs(ny) > 0.85 ? 0 : 1, upZ = 0;
      let tx = upY * nz - upZ * ny, ty = upZ * nx - upX * nz, tz = upX * ny - upY * nx;
      const tLen = Math.hypot(tx, ty, tz) || 1;
      tx /= tLen; ty /= tLen; tz /= tLen;
      const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;

      subNodes.forEach((nd, ni) => {
        const satAng = (ni / N) * Math.PI * 2 + bi * 0.4;
        const satRad = N === 1 ? 34 : (46 + (ni % 2) * 18);
        const sPos = {
          x: sHub.x + (tx * Math.cos(satAng) + bx * Math.sin(satAng)) * satRad + nx * 24,
          y: sHub.y + (ty * Math.cos(satAng) + by * Math.sin(satAng)) * satRad + ny * 24,
          z: sHub.z + (tz * Math.cos(satAng) + bz * Math.sin(satAng)) * satRad + nz * 24
        };

        const gFrac = totalNodes > 1 ? globalIdx / (totalNodes - 1) : 0.5;
        const gAng = globalIdx * 0.58;
        const hPos = {
          x: Math.cos(gAng) * (132 + (ni % 2) * 20),
          y: 138 - gFrac * 276,
          z: Math.sin(gAng) * (132 + (ni % 2) * 20)
        };

        const oSubRad = oRad + 30 + (ni % 2) * 18;
        const oSubAng = oAng + (N > 1 ? ((ni / (N - 1)) - 0.5) * 0.42 : 0);
        const oPos = {
          x: Math.cos(oSubAng) * oSubRad,
          y: oHub.y + ((ni % 3) - 1) * 18,
          z: Math.sin(oSubAng) * oSubRad * Math.cos(oTilt)
        };

        const nodeObj = {
          id: nd.id || (hub.id + '_' + ni),
          stageId: nd.stageId || br.id || '',
          bi,
          name: String(nd.name || nd.id || ('节点 ' + (ni + 1))),
          branchName: brName,
          range: nd.range || br.tierRange || '',
          count: Number(nd.count || 0),
          done: Number(nd.done || 0),
          zeroCount: Number(nd.zeroCount || 0),
          color: col,
          filterType: nd.filterType || 'treeNode',
          onSelect: nd.onSelect || null,
          layouts: {
          mindmap: (() => {
            const baseA = (bi / B) * Math.PI * 2 - Math.PI / 2;
            const spread = Math.min(Math.PI * 0.85, Math.max(0.55, N * 0.16));
            const a = baseA + (N === 1 ? 0 : ((ni / (N - 1)) - 0.5) * spread);
            const ring = 68 + (ni % 2) * 34 + Math.floor(ni / 8) * 26;
            const hx = Math.cos(baseA) * 155, hy = Math.sin(baseA) * 145;
            return { x: hx + Math.cos(a) * ring, y: hy + Math.sin(a) * ring, z: 0 };
          })(),
          sphere: sPos, helix: hPos, orbital: oPos
        },
          x: sPos.x, y: sPos.y, z: sPos.z
        };
        nodes.push(nodeObj);
        edges.push({ from: hub, to: nodeObj, kind: 'branch', color: col, bi });
        globalIdx++;
      });
    });

    return { hubs, nodes, edges, stars };
  }

  window.mountFineTree3D = function (containerEl, branches, options) {
    if (!containerEl) return;
    const opts = options || {};
    const subjTitle = (window.__WB_SUBJECT_NAME__ || (window.__WB_CONFIG__ && window.__WB_CONFIG__.brandTitle) || '知识图谱');

    containerEl.innerHTML = `
      <div class="tree3d-shell" style="position:relative;border:1px solid var(--ui-border,rgba(148,163,184,0.22));border-radius:18px;overflow:hidden;margin-bottom:18px;box-shadow:0 20px 52px rgba(0,0,0,0.20);">
        <div class="tree3d-head" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;border-bottom:1px solid var(--ui-border,rgba(148,163,184,0.16));backdrop-filter:blur(14px);">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span style="font-weight:700;font-size:13.5px;white-space:nowrap;letter-spacing:-0.01em;">🌌 知识图谱与星图</span>
            <span style="font-size:11.5px;opacity:0.68;">拖拽平移/旋转 · 双指或按钮最高放大 800% · 点击节点直达</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <input data-t3d="search" type="search" placeholder="高亮节点..." style="height:28px;width:128px;padding:0 9px;font-size:12px;border-radius:8px;border:1px solid var(--ui-border,rgba(148,163,184,0.28));background:transparent;color:inherit;outline:none;" />
            <div style="display:inline-flex;border:1px solid var(--ui-border,rgba(148,163,184,0.24));border-radius:8px;overflow:hidden;">
              <button type="button" class="btn btn-sm" data-t3d-layout="mindmap" style="height:26px;padding:0 9px;font-size:11.5px;border:none;border-radius:0;font-weight:600;">思维导图</button>
              <button type="button" class="btn btn-sm" data-t3d-layout="sphere" style="height:26px;padding:0 9px;font-size:11.5px;border:none;border-radius:0;">3D星图</button>
              <button type="button" class="btn btn-sm" data-t3d-layout="helix" style="height:26px;padding:0 9px;font-size:11.5px;border:none;border-radius:0;">进阶螺旋</button>
              <button type="button" class="btn btn-sm" data-t3d-layout="orbital" style="height:26px;padding:0 9px;font-size:11.5px;border:none;border-radius:0;">分层轨道</button>
            </div>
            <button type="button" class="btn btn-sm" data-t3d="spin" style="height:28px;padding:0 10px;font-size:11.5px;border-radius:8px;">⏸ 暂停</button>
            <button type="button" class="btn btn-sm" data-t3d="zero" style="height:28px;padding:0 10px;font-size:11.5px;border-radius:8px;">🌱 零基础</button>
            <button type="button" class="btn btn-sm" data-t3d="reset" style="height:28px;padding:0 10px;font-size:11.5px;border-radius:8px;">↺ 重置</button>
          </div>
        </div>
        <div style="position:relative;width:100%;height:min(520px, 60dvh);min-height:280px;">
          <canvas style="width:100%;height:100%;display:block;cursor:grab;touch-action:none;"></canvas>
          <div data-t3d="zoomHud" style="position:absolute;right:12px;bottom:12px;display:flex;align-items:center;gap:4px;padding:4px 6px;border-radius:12px;background:var(--sg-glass,rgba(15,23,42,0.82));backdrop-filter:blur(14px);border:1px solid var(--sg-border-strong,rgba(148,163,184,0.28));z-index:6;box-shadow:0 8px 24px rgba(0,0,0,0.22);">
            <button type="button" class="btn btn-sm" data-t3d="zout" style="height:28px;width:28px;padding:0;justify-content:center;font-size:16px;" title="缩小">−</button>
            <span data-t3d="zpct" style="min-width:44px;text-align:center;font-size:11.5px;font-weight:700;font-variant-numeric:tabular-nums;">100%</span>
            <button type="button" class="btn btn-sm" data-t3d="zin" style="height:28px;width:28px;padding:0;justify-content:center;font-size:16px;" title="放大">＋</button>
            <button type="button" class="btn btn-sm" data-t3d="zfit" style="height:28px;padding:0 8px;font-size:11.5px;" title="适配全图">适配</button>
          </div>
          <div data-t3d="tip" style="position:absolute;pointer-events:none;display:none;padding:10px 14px;border-radius:12px;background:rgba(10,15,30,0.92);backdrop-filter:blur(12px);border:1px solid rgba(96,165,250,0.45);color:#f8fafc;font-size:12px;line-height:1.58;box-shadow:0 14px 36px rgba(0,0,0,0.48);z-index:5;max-width:260px;"></div>
        </div>
      </div>
    `;

    const canvas = containerEl.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const tip = containerEl.querySelector('[data-t3d="tip"]');
    const spinBtn = containerEl.querySelector('[data-t3d="spin"]');
    const zeroBtn = containerEl.querySelector('[data-t3d="zero"]');
    const resetBtn = containerEl.querySelector('[data-t3d="reset"]');
    const searchInp = containerEl.querySelector('[data-t3d="search"]');
    const layoutBtns = Array.from(containerEl.querySelectorAll('[data-t3d-layout]'));

    const { hubs, nodes, edges, stars } = buildLayouts(branches);
    const zInBtn = containerEl.querySelector('[data-t3d="zin"]');
    const zOutBtn = containerEl.querySelector('[data-t3d="zout"]');
    const zFitBtn = containerEl.querySelector('[data-t3d="zfit"]');
    const zPctEl = containerEl.querySelector('[data-t3d="zpct"]');

    let curLayout = 'mindmap';
    let yaw = 0, targetYaw = 0;
    let pitch = 0, targetPitch = 0;
    let zoom = 0.95, targetZoom = 0.95;
    let panX = 0, panY = 0, targetPanX = 0, targetPanY = 0;
    let velYaw = 0, velPitch = 0;
    let autoSpin = false;
    spinBtn.textContent = '▶ 旋转';
    let zeroOnly = false;
    let searchKw = '';
    let dragging = false;
    let moved = false, downX = 0, downY = 0;
    let lastX = 0, lastY = 0;
    let hoveredNode = null;
    let tick = 0;
    let rafId = null;

    function updateLayoutBtnStyle() {
      layoutBtns.forEach(b => {
        const active = b.getAttribute('data-t3d-layout') === curLayout;
        b.style.background = active ? 'var(--accent,#3b82f6)' : 'transparent';
        b.style.color = active ? '#fff' : 'inherit';
      });
    }
    updateLayoutBtnStyle();

    function resizeCanvas() {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.max(320, Math.floor(rect.width * dpr));
      canvas.height = Math.max(360, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();

    function project(x, y, z, w, h) {
      if (curLayout === 'mindmap') {
        const scale = zoom;
        return { sx: w * 0.5 + panX + x * scale, sy: h * 0.5 + panY + y * scale, scale, z: 0 };
      }
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const y2 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      const persp = 580 / Math.max(90, 580 + z2 + 270);
      const scale = persp * zoom;
      return { sx: w * 0.5 + panX + x1 * scale, sy: h * 0.51 + panY + y2 * scale, scale, z: z2 };
    }

    let projectedNodes = [];

    function drawBackground(w, h, isLight) {
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.48, 24, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      if (isLight) {
        bg.addColorStop(0, '#ffffff');
        bg.addColorStop(0.55, '#f8fafc');
        bg.addColorStop(1, '#eef2f9');
      } else {
        bg.addColorStop(0, '#0f172a');
        bg.addColorStop(0.55, '#090e1c');
        bg.addColorStop(1, '#040711');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Subtle architectural coordinate rings (equator + tilted orbital guide)
      const ringRadii = curLayout === 'orbital' ? [78, 126, 174] : [112, 168];
      ringRadii.forEach((rad, ri) => {
        ctx.beginPath();
        for (let i = 0; i <= 72; i++) {
          const a = (i / 72) * Math.PI * 2;
          const ry = curLayout === 'helix' ? (ri === 0 ? 128 : -128) : 0;
          const p = project(Math.cos(a) * rad, ry, Math.sin(a) * rad, w, h);
          if (i === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        }
        ctx.strokeStyle = isLight
          ? (ri === 0 ? 'rgba(59,130,246,0.14)' : 'rgba(100,116,139,0.09)')
          : (ri === 0 ? 'rgba(96,165,250,0.16)' : 'rgba(148,163,184,0.08)');
        ctx.lineWidth = 1;
        ctx.setLineDash(ri === 0 ? [] : [4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    function draw() {
      if (!document.body.contains(canvas)) {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resizeCanvas);
        return;
      }
      tick += 0.022;
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width || 640;
      const h = rect.height || 500;

      // Smooth inertia & layout morph interpolation
      if (!dragging) {
        if (autoSpin) targetYaw += 0.0022;
        targetYaw += velYaw;
        targetPitch = Math.max(-1.05, Math.min(1.05, targetPitch + velPitch));
        velYaw *= 0.92;
        velPitch *= 0.92;
      }
      yaw += (targetYaw - yaw) * 0.14;
      pitch += (targetPitch - pitch) * 0.14;
      zoom += (targetZoom - zoom) * 0.16;
      panX += (targetPanX - panX) * 0.18;
      panY += (targetPanY - panY) * 0.18;
      if (zPctEl) zPctEl.textContent = Math.round(zoom * 100) + '%';

      const lerpSpeed = 0.11;
      hubs.forEach(hb => {
        const tgt = hb.layouts[curLayout] || hb.layouts.sphere;
        hb.x += (tgt.x - hb.x) * lerpSpeed;
        hb.y += (tgt.y - hb.y) * lerpSpeed;
        hb.z += (tgt.z - hb.z) * lerpSpeed;
      });
      nodes.forEach(nd => {
        const tgt = nd.layouts[curLayout] || nd.layouts.sphere;
        nd.x += (tgt.x - nd.x) * lerpSpeed;
        nd.y += (tgt.y - nd.y) * lerpSpeed;
        nd.z += (tgt.z - nd.z) * lerpSpeed;
      });

      drawBackground(w, h, isLight);

      // Ambient coordinate stars
      stars.forEach(st => {
        const p = project(st.x, st.y, st.z, w, h);
        const tw = 0.35 + 0.35 * Math.sin(tick * 1.4 + st.phase);
        ctx.fillStyle = isLight ? `rgba(100,116,139,${tw * 0.22})` : `rgba(148,163,184,${tw * 0.32})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, Math.max(0.5, st.r * p.scale), 0, Math.PI * 2);
        ctx.fill();
      });

      // Center core nucleus (subtle glass emblem)
      const originP = project(0, 0, 0, w, h);
      const coreR = Math.max(10, 16 * originP.scale);
      const coreGrad = ctx.createRadialGradient(originP.sx, originP.sy, 1, originP.sx, originP.sy, coreR * 2.4);
      coreGrad.addColorStop(0, isLight ? 'rgba(59,130,246,0.28)' : 'rgba(96,165,250,0.38)');
      coreGrad.addColorStop(1, 'rgba(59,130,246,0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(originP.sx, originP.sy, coreR * 2.4, 0, Math.PI * 2);
      ctx.fill();

      const activeBi = hoveredNode ? hoveredNode.bi : -1;
      const kw = searchKw.trim().toLowerCase();

      // Draw topological curved Bezier edges (back-to-front feel via alpha)
      edges.forEach(ed => {
        const pa = project(ed.from.x, ed.from.y, ed.from.z, w, h);
        const pb = project(ed.to.x, ed.to.y, ed.to.z, w, h);
        const mx = (pa.sx + pb.sx) * 0.5 + (originP.sx - (pa.sx + pb.sx) * 0.5) * 0.14;
        const my = (pa.sy + pb.sy) * 0.5 + (originP.sy - (pa.sy + pb.sy) * 0.5) * 0.14;
        const isFocus = activeBi === -1 || ed.bi === activeBi;
        const baseAlpha = ed.kind === 'spine'
          ? (isLight ? 0.22 : 0.24)
          : (isLight ? 0.34 : 0.38);
        const alpha = isFocus ? baseAlpha : baseAlpha * 0.22;

        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.quadraticCurveTo(mx, my, pb.sx, pb.sy);
        ctx.strokeStyle = hexToRgba(ed.color, alpha);
        ctx.lineWidth = ed.kind === 'spine' ? 1.15 : (isFocus ? 1.35 : 0.8);
        ctx.stroke();

        // Subtle traveling signal pulse along active branch edges
        if (ed.kind === 'branch' && (activeBi === ed.bi || (activeBi === -1 && ed.bi % 2 === 0))) {
          const t = (tick * 0.35 + ed.bi * 0.23) % 1;
          const u = 1 - t;
          const px = u * u * pa.sx + 2 * u * t * mx + t * t * pb.sx;
          const py = u * u * pa.sy + 2 * u * t * my + t * t * pb.sy;
          ctx.fillStyle = hexToRgba(ed.color, isFocus ? 0.85 : 0.2);
          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Project & z-sort hubs + leaf nodes
      const renderItems = [];
      hubs.forEach(hb => {
        const p = project(hb.x, hb.y, hb.z, w, h);
        renderItems.push({ kind: 'hub', z: p.z, p, obj: hb });
      });
      projectedNodes = [];
      nodes.forEach(nd => {
        const p = project(nd.x, nd.y, nd.z, w, h);
        const r = Math.max(5.0, Math.min(28, (5.6 + Math.sqrt(nd.count || 6) * 0.52) * p.scale));
        const rec = { kind: 'node', z: p.z, p, r, nd };
        projectedNodes.push(rec);
        renderItems.push(rec);
      });
      renderItems.sort((a, b) => b.z - a.z);

      renderItems.forEach(it => {
        if (it.kind === 'hub') {
          const hb = it.obj;
          const isDim = activeBi !== -1 && hb.bi !== activeBi;
          const hr = Math.max(4.5, Math.min(20, 6.2 * it.p.scale));
          ctx.save();
          ctx.globalAlpha = isDim ? 0.22 : 0.85;
          ctx.fillStyle = hexToRgba(hb.color, 0.24);
          ctx.beginPath();
          ctx.arc(it.p.sx, it.p.sy, hr * 2.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = hb.color;
          ctx.beginPath();
          ctx.arc(it.p.sx, it.p.sy, hr, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }

        const { p, r, nd } = it;
        const isHov = hoveredNode && hoveredNode.id === nd.id;
        const matchKw = !kw || nd.name.toLowerCase().includes(kw) || nd.branchName.toLowerCase().includes(kw);
        const matchZero = !zeroOnly || nd.zeroCount > 0;
        const dimmed = (!matchKw) || (!matchZero) || (activeBi !== -1 && nd.bi !== activeBi && !isHov);

        const depthAlpha = Math.max(0.32, Math.min(1, 0.96 - (p.z + 180) / 720));
        ctx.save();
        ctx.globalAlpha = isHov ? 1 : (dimmed ? 0.16 : depthAlpha);

        // Outer luminous halo
        const haloR = r * (isHov ? 2.8 : 1.9);
        const halo = ctx.createRadialGradient(p.sx, p.sy, r * 0.3, p.sx, p.sy, haloR);
        halo.addColorStop(0, hexToRgba(nd.color, isHov ? 0.55 : 0.28));
        halo.addColorStop(1, hexToRgba(nd.color, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, haloR, 0, Math.PI * 2);
        ctx.fill();

        // Glass orb body with specular highlight
        const orb = ctx.createRadialGradient(p.sx - r * 0.32, p.sy - r * 0.32, r * 0.1, p.sx, p.sy, r);
        orb.addColorStop(0, '#ffffff');
        orb.addColorStop(0.35, nd.color);
        orb.addColorStop(1, hexToRgba(nd.color, 0.85));
        ctx.fillStyle = orb;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, isHov ? r * 1.18 : r, 0, Math.PI * 2);
        ctx.fill();

        // Mastery progress ring around orb
        const pct = nd.count > 0 ? Math.min(1, nd.done / nd.count) : 0;
        ctx.strokeStyle = isLight ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, (isHov ? r * 1.18 : r) + 3.2, 0, Math.PI * 2);
        ctx.stroke();

        if (pct > 0) {
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, (isHov ? r * 1.18 : r) + 3.2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
          ctx.stroke();
        }
        ctx.restore();
      });

      // Crisp, collision-free frosted glass pill labels for foreground / searched / hovered nodes
      ctx.globalAlpha = 1;
      const labelBoxes = [];
      const frontNodes = [...projectedNodes].sort((a, b) => a.p.z - b.p.z);
      frontNodes.forEach(({ p, nd, r }, idx) => {
        const isHov = hoveredNode && hoveredNode.id === nd.id;
        const matchKw = kw && (nd.name.toLowerCase().includes(kw) || nd.branchName.toLowerCase().includes(kw));
        if (!isHov && !matchKw && idx > 9) return;
        if (zeroOnly && nd.zeroCount === 0 && !isHov) return;
        if (activeBi !== -1 && nd.bi !== activeBi && !isHov) return;

        const rawName = String(nd.name || nd.id || '');
        const label = rawName.length > 13 ? rawName.slice(0, 12) + '…' : rawName;
        ctx.font = isHov ? '600 11.5px system-ui, -apple-system, sans-serif' : '500 11px system-ui, -apple-system, sans-serif';
        const tw = ctx.measureText(label).width + 20;
        const th = 22;
        const lx = Math.max(10, Math.min(w - tw - 10, p.sx - tw / 2));
        const ly = Math.max(8, p.sy - r - th - 7);
        const collides = labelBoxes.some(b => !(lx + tw + 6 < b.x || lx - 6 > b.x + b.w || ly + th + 6 < b.y || ly - 6 > b.y + b.h));
        if (collides && !isHov && !matchKw) return;
        labelBoxes.push({ x: lx, y: ly, w: tw, h: th });

        ctx.fillStyle = isHov
          ? (isLight ? 'rgba(15,23,42,0.92)' : 'rgba(30,41,59,0.95)')
          : (isLight ? 'rgba(255,255,255,0.88)' : 'rgba(15,23,42,0.78)');
        ctx.strokeStyle = isHov ? nd.color : (isLight ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.24)');
        ctx.lineWidth = isHov ? 1.4 : 0.9;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(lx, ly, tw, th, 999);
        else ctx.rect(lx, ly, tw, th);
        ctx.fill();
        ctx.stroke();

        // Tiny color dot + crisp label text
        ctx.fillStyle = nd.color;
        ctx.beginPath();
        ctx.arc(lx + 9, ly + th / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isHov ? '#ffffff' : (isLight ? '#0f172a' : '#e2e8f0');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, lx + 16, ly + th / 2 + 0.5);
      });

      // Subtle bottom-left subject watermark
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = isLight ? 'rgba(15,23,42,0.36)' : 'rgba(226,232,240,0.34)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${subjTitle} · ${hubs.length} 大专题簇 · ${nodes.length} 知识节点`, 14, h - 12);

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    function hitTest(mx, my) {
      let best = null, bestD = 1e9;
      for (const item of projectedNodes) {
        if (zeroOnly && item.nd.zeroCount === 0) continue;
        const d = Math.hypot(mx - item.p.sx, my - item.p.sy);
        if (d <= item.r + 12 && d < bestD) { best = item; bestD = d; }
      }
      return best;
    }

    function updateTooltip(hit, mx, my) {
      if (!hit) {
        tip.style.display = 'none';
        canvas.style.cursor = dragging ? 'grabbing' : 'grab';
        return;
      }
      const nd = hit.nd;
      const pct = nd.count > 0 ? Math.round((nd.done / nd.count) * 100) : 0;
      tip.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${nd.color};display:inline-block;"></span>
          <strong style="font-size:13px;">${nd.name}</strong>
        </div>
        <div style="opacity:.78;font-size:11.5px;margin-bottom:4px;">${nd.branchName}${nd.range ? ' · ' + nd.range : ''}</div>
        <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:4px;">
          <span>进度：<b>${nd.done}</b> / ${nd.count} (${pct}%)</span>
          ${nd.zeroCount ? `<span style="color:#34d399;">🌱 ${nd.zeroCount} 零基础</span>` : ''}
        </div>
        <div style="height:4px;border-radius:99px;background:rgba(255,255,255,0.14);overflow:hidden;margin-bottom:6px;">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,${nd.color},#34d399);"></div>
        </div>
        <div style="font-size:11px;color:#93c5fd;">点击节点直达该专题题组 →</div>
      `;
      const rect = canvas.parentElement.getBoundingClientRect();
      const tx = Math.min(rect.width - 270, Math.max(12, mx + 16));
      const ty = Math.min(rect.height - 130, Math.max(12, my - 24));
      tip.style.left = tx + 'px';
      tip.style.top = ty + 'px';
      tip.style.display = 'block';
      canvas.style.cursor = 'pointer';
    }

    canvas.addEventListener('pointerdown', (e) => {
      dragging = true; moved = false;
      downX = lastX = e.clientX; downY = lastY = e.clientY;
      velYaw = 0; velPitch = 0;
      canvas.style.cursor = 'grabbing';
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      if (dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) moved = true;
        if (curLayout === 'mindmap') {
          targetPanX += dx;
          targetPanY += dy;
        } else {
          targetYaw += dx * 0.0085;
          targetPitch = Math.max(-1.05, Math.min(1.05, targetPitch + dy * 0.007));
          velYaw = dx * 0.003;
          velPitch = dy * 0.002;
        }
        lastX = e.clientX; lastY = e.clientY;
        tip.style.display = 'none';
        return;
      }
      const hit = hitTest(mx, my);
      hoveredNode = hit ? hit.nd : null;
      updateTooltip(hit, mx, my);
    });
    canvas.addEventListener('pointerup', (e) => {
      dragging = false;
      canvas.style.cursor = 'grab';
      if (!moved) {
        const rect = canvas.getBoundingClientRect();
        const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        if (hit) {
          if (typeof hit.nd.onSelect === 'function') hit.nd.onSelect(hit.nd);
          else if (typeof opts.onNodeClick === 'function') opts.onNodeClick(hit.nd);
        }
      }
    });
    canvas.addEventListener('pointerleave', () => { dragging = false; hoveredNode = null; tip.style.display = 'none'; });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      targetZoom = Math.max(0.35, Math.min(8.0, targetZoom * (e.deltaY > 0 ? 0.88 : 1.14)));
    }, { passive: false });

    layoutBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        curLayout = btn.getAttribute('data-t3d-layout') || 'mindmap';
        autoSpin = curLayout !== 'mindmap';
        spinBtn.textContent = autoSpin ? '⏸ 暂停' : '▶ 旋转';
        fitView();
        updateLayoutBtnStyle();
      });
    });
    if (searchInp) {
      searchInp.addEventListener('input', (e) => { searchKw = e.target.value || ''; });
    }
    spinBtn.addEventListener('click', () => {
      autoSpin = !autoSpin;
      spinBtn.textContent = autoSpin ? '⏸ 暂停' : '▶ 旋转';
    });
    zeroBtn.addEventListener('click', () => {
      zeroOnly = !zeroOnly;
      zeroBtn.textContent = zeroOnly ? '🌌 全部' : '🌱 零基础';
    });
    // Two-finger pinch-to-zoom on mobile touch screens
    let pinchDist = 0;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 2) {
        pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        dragging = false;
      }
    }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length === 2 && pinchDist > 10) {
        e.preventDefault();
        const nd = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        targetZoom = Math.max(0.35, Math.min(8.0, targetZoom * (nd / pinchDist)));
        pinchDist = nd;
      }
    }, { passive: false });
    canvas.addEventListener('touchend', () => { pinchDist = 0; });

    const fitView = () => {
      targetPanX = 0; targetPanY = 0;
      if (curLayout === 'mindmap') { targetYaw = 0; targetPitch = 0; targetZoom = 0.95; }
      else { targetYaw = 0.45; targetPitch = 0.18; targetZoom = 1.26; }
      velYaw = 0; velPitch = 0;
    };
    if (zInBtn) zInBtn.addEventListener('click', () => { targetZoom = Math.min(8.0, targetZoom * 1.38); });
    if (zOutBtn) zOutBtn.addEventListener('click', () => { targetZoom = Math.max(0.35, targetZoom / 1.38); });
    if (zFitBtn) zFitBtn.addEventListener('click', fitView);

    resetBtn.addEventListener('click', () => {
      fitView();
      if (searchInp) { searchInp.value = ''; searchKw = ''; }
    });

    if (window.__wbTree3DResizeCleanup) { try { window.__wbTree3DResizeCleanup(); } catch (_) {} }
    window.addEventListener('resize', resizeCanvas);
    window.__wbTree3DResizeCleanup = () => window.removeEventListener('resize', resizeCanvas);
  };
})();
