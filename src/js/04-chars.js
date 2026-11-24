/* ================= Q 版人物 ================= */
function line(ctx, x1, y1, x2, y2, color, w) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); }
function limb(ctx, x1, y1, x2, y2, color, w) { line(ctx, x1, y1, x2, y2, OUT, w + 3.2); line(ctx, x1, y1, x2, y2, color, w); }
function flower(ctx, x, y, color, r) {
  r = r || 2.2;
  ctx.fillStyle = color; ctx.strokeStyle = OUT; ctx.lineWidth = 0.9;
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; circ(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#f3c34f'; circ(ctx, x, y, r * 0.55); ctx.fill();
}

function drawChar(ctx, o) {
  const L = o.look; if (!L) return;
  const f = o.facing || 1;
  const s = (o.scale || 1) * (L.size || 1);
  const bw = L.bw || 1;
  const t = o.t || 0;
  const pose = o.pose || 'stand';
  const act = o.act || null;
  const expr = o.expr || 'normal';
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.alpha != null && o.alpha < 1) ctx.globalAlpha *= Math.max(0, o.alpha);
  ctx.scale(s, s);
  if (!o.noShadow && pose !== 'sit') { ctx.fillStyle = 'rgba(40,20,5,.2)'; ell(ctx, 0, 0, 12 * bw, 3.2); ctx.fill(); }
  ctx.scale(f, 1);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const moving = pose === 'walk' || pose === 'run' || pose === 'sneak';
  const ph = t * (pose === 'run' ? 17 : pose === 'sneak' ? 8 : 11);
  let bob = moving ? -Math.abs(Math.sin(ph)) * (pose === 'run' ? 3 : 1.8) : Math.sin(t * 2.4) * 0.5;
  if (act === 'fight') bob += Math.sin(t * 30) * 1.2;
  if (act === 'cheer') bob -= Math.abs(Math.sin(t * 8)) * 4;
  const crouch = pose === 'sneak' ? 4 : 0;
  const pants = L.pants || '#4b3a2c', shoes = L.shoes || '#2a1b12';

  /* 腿 */
  if (pose === 'sit') {
    rr(ctx, -1, -13, 12, 6, 3); fs(ctx, pants);
    rr(ctx, 7, -9, 5.5, 8.5, 2.2); fs(ctx, pants);
    rr(ctx, 6.5, -2.6, 8.5, 3.6, 1.6); fs(ctx, shoes);
  } else {
    const sw = moving ? Math.sin(ph) * 4.5 : 0;
    [[-3 - sw, Math.max(0, -Math.sin(ph))], [3 + sw, Math.max(0, Math.sin(ph))]].forEach(([lx, lift]) => {
      const ly = moving ? -lift * 1.6 : 0;
      rr(ctx, lx - 2.6, -12 + crouch * 0.5, 5.4, 10.5 - crouch * 0.5 + ly, 2); fs(ctx, pants);
      rr(ctx, lx - 2.8, -3.2 + ly, 7.4, 3.6, 1.6); fs(ctx, shoes);
    });
  }
  ctx.translate(0, bob + crouch);

  /* 背后的东西 */
  if (L.style === 'long') {
    ctx.beginPath(); ctx.moveTo(-13, -56); ctx.quadraticCurveTo(-19, -38, -14, -22); ctx.quadraticCurveTo(-8, -20, -3, -26); ctx.quadraticCurveTo(-2, -40, 4, -50); ctx.closePath(); fs(ctx, L.hair);
  }
  if (L.acc === 'sword' && act !== 'fight') {
    ctx.save(); ctx.rotate(0.62);
    rr(ctx, -2.2, -48, 4.4, 30, 1.6); fs(ctx, '#3a2a2a'); rr(ctx, -4.6, -50, 9.2, 2.6, 1); fs(ctx, '#c8a050'); rr(ctx, -1.6, -58, 3.2, 8, 1); fs(ctx, '#7a2a2a');
    ctx.restore();
  }
  if (L.acc === 'saber') { ctx.beginPath(); ctx.moveTo(-8, -20); ctx.quadraticCurveTo(-16, -12, -14, -2); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 3.4; ctx.strokeStyle = '#5a3a2a'; ctx.stroke(); }
  if (L.acc === 'gourd') { circ(ctx, -12, -13, 4.2); fs(ctx, '#d89a3a'); circ(ctx, -12, -19, 3); fs(ctx, '#d89a3a'); line(ctx, -12, -16, -12, -16, '#c0392b', 2); }

  /* 后手臂 */
  const armSw = moving ? -Math.sin(ph) * 3 : 0;
  if (act === 'cheer') limb(ctx, -5 * bw, -31, -10 * bw, -46, L.robe, 4.5);
  else limb(ctx, -5 * bw, -31, -8 * bw - armSw, -19, L.robe, 4.5);

  /* 衣服 */
  const tw = 9.5 * bw, bwid = 13 * bw;
  const robePath = () => { ctx.beginPath(); ctx.moveTo(-tw, -34); ctx.lineTo(tw, -34); ctx.quadraticCurveTo(bwid, -20, bwid + 1.2, -8); ctx.lineTo(-bwid - 1.2, -8); ctx.quadraticCurveTo(-bwid, -20, -tw, -34); ctx.closePath(); };
  robePath(); ctx.fillStyle = L.robe; ctx.fill();
  ctx.save(); robePath(); ctx.clip();
  ctx.fillStyle = L.trim; ctx.fillRect(-20, -11.5, 40, 3.5);
  line(ctx, -tw + 3, -34.5, 4, -23, L.trim, 3); line(ctx, tw - 1, -34.5, 1.5, -28, L.trim, 2.4);
  ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(-20, -34, 7, 30);
  ctx.fillStyle = L.belt || '#5a3a22'; ctx.fillRect(-20, -24, 40, 3.8);
  ctx.restore();
  robePath(); fs(ctx, null, OUT, 1.7);
  if (L.apron) {
    ctx.beginPath(); ctx.moveTo(-6.5 * bw, -26); ctx.lineTo(7 * bw, -26); ctx.lineTo(9.5 * bw, -9); ctx.lineTo(-8.5 * bw, -9); ctx.closePath(); fs(ctx, L.apron, OUT, 1.3);
    line(ctx, -4 * bw, -26, -2, -33, L.apron, 1.6);
  }
  if (L.acc === 'beads') { ctx.fillStyle = '#7a3a1a'; for (let i = 0; i <= 6; i++) { const a = Math.PI * (0.15 + i * 0.117); circ(ctx, Math.cos(a) * 7, -33 + Math.sin(a) * 7, 1.4); ctx.fill(); } }
  if (L.acc === 'bag' && act !== 'hold') { ctx.save(); ctx.translate(8 * bw, -15); ell(ctx, 0, 0, 4.5, 4); fs(ctx, '#f3c34f', OUT, 1.2); line(ctx, -2, -3.5, 2, -3.5, '#c0392b', 1.6); ctx.restore(); }
  if (L.acc === 'towel') { rr(ctx, -9.5 * bw, -36, 5.5, 14, 1.5); fs(ctx, '#fbfaf2', OUT, 1.2); line(ctx, -9 * bw, -30, -4.5 * bw, -30, '#5a8ac8', 1.2); }

  /* 前手臂与动作 */
  const sx = 5 * bw, sy = -31;
  let hx = 8 * bw + armSw, hy = -19;
  switch (act) {
    case 'hold': hx = 13 * bw; hy = -26; break;
    case 'eat': { const p = (Math.sin(t * 6) + 1) / 2; hx = lerp(11, 7, p); hy = lerp(-22, -36, p); break; }
    case 'cook': hx = 13 * bw; hy = -25 + Math.sin(t * 12) * 1.5; break;
    case 'write': hx = 11 * bw; hy = -25; break;
    case 'wipe': hx = 14 * bw + Math.sin(t * 14) * 4; hy = -21; break;
    case 'play': hx = 7 * bw + Math.sin(t * 10) * 1.5; hy = -21; break;
    case 'calc': hx = 10 * bw + Math.sin(t * 16) * 1.2; hy = -24; break;
    case 'fight': { const a = t * 22; hx = Math.cos(a) * 13; hy = -27 + Math.sin(a) * 7; break; }
    case 'cheer': hx = 9 * bw; hy = -48; break;
    case 'talk': hx = 12 * bw; hy = -30 + Math.sin(t * 6) * 3; break;
    case 'point': hx = 16 * bw; hy = -34; break;
  }
  // 乐器 / 手持物（手臂之前）
  if (L.acc === 'pipa' && (act === 'play' || act == null)) {
    ctx.save(); ctx.translate(4, -21); ctx.rotate(-0.25);
    line(ctx, 0, 0, 0, -24, OUT, 4.4); line(ctx, 0, 0, 0, -24, '#8a5229', 2.4);
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(9, -8, 7, 2); ctx.quadraticCurveTo(0, 9, -7, 2); ctx.quadraticCurveTo(-9, -8, 0, -12); fs(ctx, '#c8803a');
    ell(ctx, 0, -1, 2.5, 1.5); fs(ctx, '#5a2a10', false); ctx.restore();
  }
  if (L.acc === 'sanxian' && (act === 'play' || act == null)) {
    line(ctx, 9, -18, -8, -54, OUT, 3.6); line(ctx, 9, -18, -8, -54, '#6a4028', 1.8);
    ell(ctx, 9, -18, 5.5, 4.5); fs(ctx, '#3a2a20'); ell(ctx, 9, -18, 3.5, 2.8); fs(ctx, '#e8dcc0', OUT, 1);
  }
  if (L.acc === 'abacus' && (act === 'calc' || act == null)) {
    rr(ctx, 2, -27, 15, 8, 1.2); fs(ctx, '#6a4028'); ctx.fillStyle = '#e8d0a0';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { circ(ctx, 5 + i * 3.2, -24.6 + j * 3.4, 1.1); ctx.fill(); }
  }
  if (act === 'cook') {
    const toss = Math.max(0, Math.sin(t * 7)) * -5;
    line(ctx, hx, hy, hx + 7, hy - 2 + toss * 0.3, OUT, 2.4);
    ctx.save(); ctx.translate(hx + 13, hy - 2 + toss * 0.3);
    ctx.beginPath(); ctx.moveTo(-8, -2); ctx.quadraticCurveTo(0, 7, 8, -2); ctx.closePath(); fs(ctx, '#2e2e34');
    if (toss < -2) { ctx.fillStyle = '#e8a040'; circ(ctx, -2, toss - 3, 1.6); ctx.fill(); ctx.fillStyle = '#4fa04a'; circ(ctx, 2, toss - 5, 1.3); ctx.fill(); ctx.fillStyle = '#c0502a'; circ(ctx, 4, toss - 2, 1.5); ctx.fill(); }
    ctx.restore();
  }
  limb(ctx, sx, sy, hx, hy, L.robe, 4.6);
  circ(ctx, hx, hy, 2.7); fs(ctx, L.skin, OUT, 1.3);
  if (act === 'eat') { line(ctx, hx - 1, hy, hx + 7, hy - 6, '#7a4a20', 1.2); line(ctx, hx, hy + 1, hx + 8, hy - 4, '#7a4a20', 1.2); }
  if (act === 'write') { rr(ctx, hx - 1, hy - 8, 9, 11, 1); fs(ctx, '#fff8e6', OUT, 1); line(ctx, hx + 6, hy - 3, hx + 11, hy - 11, '#2a1408', 1.4); }
  if (act === 'wipe') { rr(ctx, hx - 4, hy - 1, 8, 4, 1); fs(ctx, '#f4f4ee', OUT, 1); }
  if (act === 'fight') { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -27, 15, t * 22 - 1, t * 22 - 0.2); ctx.stroke(); }
  if (L.acc === 'ladle' && act !== 'cook' && act !== 'hold') { line(ctx, hx, hy, hx + 5, hy - 19, OUT, 3.2); line(ctx, hx, hy, hx + 5, hy - 19, '#b8803a', 1.6); ell(ctx, hx + 6, hy - 21, 4, 2.6); fs(ctx, '#a8a8b0', OUT, 1.2); }
  if (L.acc === 'fan' && act !== 'hold' && act !== 'eat') {
    if (act === 'talk' || act === 'play') { ctx.save(); ctx.translate(hx + 1, hy - 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 9, -2.4, -0.7); ctx.closePath(); fs(ctx, '#f6efe0', OUT, 1.2); ctx.restore(); }
    else { line(ctx, hx, hy, hx + 3, hy - 9, OUT, 3.6); line(ctx, hx, hy, hx + 3, hy - 9, '#e8dcc0', 1.8); }
  }
  if (L.acc === 'basket' && act == null) { ctx.save(); ctx.translate(hx + 2, hy + 6); ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(5, -2); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.closePath(); fs(ctx, '#c8a060', OUT, 1.1); ctx.beginPath(); ctx.arc(0, -2, 4.5, Math.PI, 0); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore(); }
  if (act === 'cheer') { limb(ctx, sx, sy, hx, hy, L.robe, 4.6); circ(ctx, hx, hy, 2.7); fs(ctx, L.skin, OUT, 1.3); }

  /* 头 */
  ctx.save();
  if (act === 'sleep') { ctx.translate(0, -34); ctx.rotate(0.18 + Math.sin(t * 1.5) * 0.03); ctx.translate(0, 34); }
  const hcY = -49;
  // 头后面的发髻
  if (L.style === 'bun') { circ(ctx, -13.5, -53, 7); fs(ctx, L.hair); line(ctx, -19, -58, -8, -50, L.hat || '#f3c34f', 1.8); }
  if (L.style === 'bun2') { circ(ctx, -10, -63, 6.5); fs(ctx, L.hair); circ(ctx, 9, -64, 6.5); fs(ctx, L.hair); }
  if (L.style === 'topknot') { circ(ctx, -1, -66, 6); fs(ctx, L.hair); rr(ctx, -4.5, -62.5, 7, 3, 1.2); fs(ctx, L.hat || '#c0392b', OUT, 1); }
  // 耳朵
  ell(ctx, -10.5, -46, 2.6, 3.4); fs(ctx, L.skin, OUT, 1.3);
  // 脸
  circ(ctx, 0, hcY, 15); fs(ctx, L.skin, OUT, 1.8);
  if (expr === 'angry' || act === 'fight') { ctx.fillStyle = 'rgba(230,60,30,.2)'; circ(ctx, 0, hcY, 14.2); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,120,120,.38)'; ell(ctx, -4.5, -42.5, 3, 1.8); ctx.fill(); ell(ctx, 11.5, -42.5, 2.6, 1.8); ctx.fill();
  drawFace(ctx, L, expr, act, t);
  if (L.scar) line(ctx, 8, -54, 12, -47, '#a03a2a', 1.3);
  drawBeard(ctx, L);
  drawHair(ctx, L);
  ctx.restore();

  if (act === 'sleep' || expr === 'sleep') {
    ctx.save(); ctx.scale(f, 1); const zz = (t * 0.8) % 1;
    ctx.globalAlpha *= 1 - zz; drawIcon(ctx, 'zzz', 14 * f, -66 - zz * 10, 16); ctx.restore();
  }
  ctx.restore();

  if (act === 'hold' && o.hold) {
    ctx.save(); ctx.translate(o.x + f * (15 * bw + 4) * s, o.y + (-31 + bob + crouch) * s); drawIcon(ctx, o.hold, 0, 0, 17 * s); ctx.restore();
  }
}

function drawFace(ctx, L, expr, act, t) {
  const e1 = -1.5, e2 = 8.5, ey = -47;
  let eyes = expr;
  if (L.eyes === 'sleepy' && (expr === 'normal' || expr === 'happy')) eyes = 'sleepy';
  if (act === 'sleep') eyes = 'sleep';
  if (act === 'fight' && eyes !== 'angry') eyes = 'angry';
  ctx.strokeStyle = '#2a1408'; ctx.fillStyle = '#2a1408'; ctx.lineWidth = 1.7;
  const dot = (x) => { ell(ctx, x, ey, 1.9, 2.6); ctx.fillStyle = '#2a1408'; ctx.fill(); ctx.fillStyle = '#fff'; circ(ctx, x + 0.6, ey - 1, 0.7); ctx.fill(); };
  switch (eyes) {
    case 'happy': case 'eat':
      [e1, e2].forEach(x => { ctx.beginPath(); ctx.arc(x, ey + 1.2, 2.4, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }); break;
    case 'sleep': case 'sleepy':
      [e1, e2].forEach(x => { ctx.beginPath(); ctx.moveTo(x - 2.3, ey); ctx.lineTo(x + 2.3, ey); ctx.stroke(); }); break;
    case 'surprised':
      [e1, e2].forEach(x => { circ(ctx, x, ey, 2.6); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2a1408'; circ(ctx, x + 0.3, ey, 1.2); ctx.fill(); }); break;
    case 'sly':
      [e1, e2].forEach(x => { ctx.beginPath(); ctx.arc(x, ey - 1, 2.4, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }); break;
    default: dot(e1); dot(e2);
  }
  if (eyes === 'angry') { line(ctx, e1 - 3, ey - 5.5, e1 + 2.4, ey - 3.4, '#2a1408', 1.8); line(ctx, e2 - 2.4, ey - 3.4, e2 + 3, ey - 5.5, '#2a1408', 1.8); }
  if (eyes === 'sad') { line(ctx, e1 - 3, ey - 3.6, e1 + 2.4, ey - 5.6, '#2a1408', 1.5); line(ctx, e2 - 2.4, ey - 5.6, e2 + 3, ey - 3.6, '#2a1408', 1.5); }
  // 嘴
  ctx.strokeStyle = '#5a2010'; ctx.lineWidth = 1.5;
  const mx = 4, my = -40.5;
  let m = expr;
  if (act === 'eat') m = Math.sin(t * 12) > 0 ? 'chew' : 'normal';
  if (act === 'talk' || act === 'play' && L.acc === 'sanxian') m = Math.sin(t * 9) > 0 ? 'open' : 'normal';
  if (act === 'cheer') m = 'happy';
  if (act === 'fight') m = 'angry';
  switch (m) {
    case 'happy': case 'open': ctx.beginPath(); ctx.moveTo(mx - 3, my - 1.2); ctx.quadraticCurveTo(mx, my + (m === 'open' ? 3.5 : 5), mx + 3, my - 1.2); ctx.closePath(); ctx.fillStyle = '#c8402e'; ctx.fill(); ctx.stroke(); break;
    case 'angry': case 'sad': ctx.beginPath(); ctx.arc(mx, my + 2.5, 2.6, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); break;
    case 'surprised': case 'chew': circ(ctx, mx, my, m === 'chew' ? 1.3 : 1.9); ctx.fillStyle = '#5a2010'; ctx.fill(); break;
    case 'sly': ctx.beginPath(); ctx.moveTo(mx - 2.5, my); ctx.quadraticCurveTo(mx + 1, my + 2, mx + 3.5, my - 1.5); ctx.stroke(); break;
    case 'sleep': circ(ctx, mx, my, 1.1); ctx.fillStyle = '#5a2010'; ctx.fill(); break;
    default: ctx.beginPath(); ctx.arc(mx, my - 1.4, 2.6, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
  }
  if (expr === 'sad') { ctx.beginPath(); ctx.moveTo(14, -58); ctx.quadraticCurveTo(17, -53, 14, -52); ctx.quadraticCurveTo(11, -53, 14, -58); ctx.fillStyle = '#8ac8f0'; ctx.fill(); ctx.strokeStyle = '#3a6a9a'; ctx.lineWidth = 0.9; ctx.stroke(); }
}

function drawBeard(ctx, L) {
  const c = L.beardColor || L.hair || '#2a1b12';
  switch (L.beard) {
    case 'short': ctx.fillStyle = 'rgba(60,40,30,.28)'; ell(ctx, 4, -37.5, 7.5, 3.2); ctx.fill(); break;
    case 'goatee': ctx.beginPath(); ctx.moveTo(1.5, -38.5); ctx.lineTo(6.5, -38.5); ctx.lineTo(4.5, -30); ctx.closePath(); fs(ctx, c, OUT, 1.1); break;
    case 'long':
      ctx.beginPath(); ctx.moveTo(-3, -39); ctx.quadraticCurveTo(4, -35.5, 11, -39); ctx.lineTo(7, -24); ctx.quadraticCurveTo(4.5, -19, 2, -24); ctx.closePath(); fs(ctx, c, OUT, 1.1);
      ell(ctx, 1.5, -42.6, 3.4, 1.3); fs(ctx, c, OUT, 0.9); ell(ctx, 6.8, -42.6, 3.4, 1.3); fs(ctx, c, OUT, 0.9); break;
    case 'mustache':
      ctx.beginPath(); ctx.moveTo(4, -42.6); ctx.quadraticCurveTo(0, -44, -2.5, -40.5); ctx.quadraticCurveTo(1, -41.5, 4, -41.5); ctx.quadraticCurveTo(7, -41.5, 10.5, -40.5); ctx.quadraticCurveTo(8, -44, 4, -42.6); fs(ctx, c, OUT, 1); break;
    case 'full':
      ctx.beginPath(); ctx.moveTo(-9, -43); ctx.quadraticCurveTo(-8, -30, 4, -29); ctx.quadraticCurveTo(15, -30, 14, -43); ctx.quadraticCurveTo(9, -37, 4, -37.5); ctx.quadraticCurveTo(-2, -37, -9, -43); ctx.closePath(); fs(ctx, c, OUT, 1.2); break;
  }
}

function hairCap(ctx, color, r) {
  r = r || 15.6;
  ctx.beginPath();
  ctx.moveTo(-14.2, -42);
  ctx.arc(0, -49, r, Math.PI * 0.86, Math.PI * 1.97);
  ctx.quadraticCurveTo(13, -52.5, 9.5, -54.5);
  ctx.quadraticCurveTo(6, -50.5, 2.5, -55.5);
  ctx.quadraticCurveTo(-2.5, -50.5, -6, -53.5);
  ctx.quadraticCurveTo(-8.5, -48, -9.6, -43);
  ctx.closePath(); fs(ctx, color, OUT, 1.7);
}
function drawHair(ctx, L) {
  const st = L.style, hat = L.hat || '#5a3a22';
  switch (st) {
    case 'bald':
      if (L.acc === 'beads') { ctx.fillStyle = 'rgba(80,50,30,.5)'; [[-4, -59], [1, -60.5], [6, -59.5]].forEach(p => { circ(ctx, p[0], p[1], 1); ctx.fill(); }); }
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(ctx, -3, -58, 4, 2); ctx.fill(); break;
    case 'mask':
      circ(ctx, 0, -49, 15.8); fs(ctx, hat, OUT, 1.7);
      rr(ctx, -6.5, -52, 19, 7.5, 3.5); fs(ctx, L.skin, OUT, 1);
      { const e1 = -1.5, e2 = 8.5, ey = -48.2; ctx.fillStyle = '#2a1408'; ell(ctx, e1, ey, 1.6, 2); ctx.fill(); ell(ctx, e2, ey, 1.6, 2); ctx.fill(); }
      circ(ctx, -16, -51, 3.2); fs(ctx, hat, OUT, 1.2); line(ctx, -17, -49, -22, -42, OUT, 3.4); line(ctx, -17, -49, -22, -42, hat, 1.8); break;
    case 'scarf':
      hairCap(ctx, hat, 16.3);
      circ(ctx, -16, -51, 3.4); fs(ctx, hat, OUT, 1.2); line(ctx, -17, -49, -21, -41, OUT, 3.6); line(ctx, -17, -49, -21, -41, hat, 2); break;
    case 'messy': {
      ctx.beginPath(); ctx.moveTo(-14.2, -41);
      for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.86 + i * 0.093); const r = i % 2 ? 20 : 15.5; ctx.lineTo(Math.cos(a) * r, -49 + Math.sin(a) * r); }
      ctx.quadraticCurveTo(9, -53, 5, -54); ctx.lineTo(1, -51); ctx.lineTo(-3, -55); ctx.lineTo(-9, -43); ctx.closePath(); fs(ctx, L.hair, OUT, 1.6); break;
    }
    default: hairCap(ctx, L.hair);
  }
  switch (st) {
    case 'chef': ell(ctx, 0, -64, 15, 8); fs(ctx, hat); rr(ctx, -14, -61, 28, 5.5, 2); fs(ctx, hat); break;
    case 'chefTall': rr(ctx, -11, -84, 22, 26, 4); fs(ctx, hat); ell(ctx, 0, -84, 14, 7); fs(ctx, hat); rr(ctx, -13, -62, 26, 5.5, 2); fs(ctx, hat); line(ctx, -4, -80, -4, -64, 'rgba(0,0,0,.12)', 1.2); line(ctx, 4, -80, 4, -64, 'rgba(0,0,0,.12)', 1.2); break;
    case 'cap': ctx.beginPath(); ctx.arc(0, -49, 16, Math.PI * 1.04, Math.PI * 1.96); ctx.closePath(); fs(ctx, hat); line(ctx, -15, -53.5, 15, -53.5, 'rgba(255,255,255,.2)', 1.2); circ(ctx, 0, -65.5, 2.5); fs(ctx, '#c0392b', OUT, 1.1); break;
    case 'scholar': ctx.beginPath(); ctx.moveTo(-13.5, -55); ctx.lineTo(-11, -70); ctx.lineTo(10, -71.5); ctx.lineTo(13.5, -56); ctx.quadraticCurveTo(0, -59, -13.5, -55); ctx.closePath(); fs(ctx, hat); line(ctx, -12, -58, -21, -49, OUT, 3.8); line(ctx, -12, -58, -21, -49, hat, 2.2); line(ctx, -12, -58, -18, -43, OUT, 3.8); line(ctx, -12, -58, -18, -43, hat, 2.2); break;
    case 'official': ell(ctx, -24, -61, 11, 2.3); fs(ctx, '#1f1a1f'); ell(ctx, 24, -61, 11, 2.3); fs(ctx, '#1f1a1f'); rr(ctx, -12.5, -70, 25, 16, 5); fs(ctx, '#1f1a1f'); ell(ctx, -3, -71, 8, 5); fs(ctx, '#1f1a1f'); line(ctx, -12, -57, 12, -57, '#f3c34f', 1.4); break;
    case 'straw': ctx.beginPath(); ctx.moveTo(-25, -55); ctx.quadraticCurveTo(0, -82, 25, -55); ctx.quadraticCurveTo(0, -50, -25, -55); ctx.closePath(); fs(ctx, '#d8b46a'); ctx.strokeStyle = 'rgba(120,80,30,.6)'; ctx.lineWidth = 1; for (let i = -16; i <= 16; i += 8) { ctx.beginPath(); ctx.moveTo(0, -70); ctx.lineTo(i, -55); ctx.stroke(); } break;
    case 'band': ctx.beginPath(); ctx.arc(0, -49, 13.6, Math.PI * 1.1, Math.PI * 1.92); ctx.strokeStyle = OUT; ctx.lineWidth = 5.6; ctx.stroke(); ctx.strokeStyle = hat; ctx.lineWidth = 3.4; ctx.stroke(); line(ctx, -13, -55, -21, -49, OUT, 3.6); line(ctx, -13, -55, -21, -49, hat, 2); line(ctx, -13, -55, -19, -45, OUT, 3.6); line(ctx, -13, -55, -19, -45, hat, 2); break;
    case 'bun2': circ(ctx, -10, -63, 2.4); fs(ctx, hat, OUT, 1); circ(ctx, 9, -64, 2.4); fs(ctx, hat, OUT, 1); break;
  }
  if (L.flower && (st === 'bun' || st === 'bun2' || st === 'long' || st === 'topknot')) flower(ctx, st === 'bun2' ? 13 : -7, st === 'bun2' ? -60 : -62, L.flower, 2);
  if (st === 'long' && L.fem) line(ctx, -4, -64, -12, -57, L.hat || '#f3c34f', 1.6);
}

/* 立绘：画到对话框/卡片的小画布上 */
function drawPortrait(cv, look, expr, act) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (!look) return;
  const s = W / 240 * 4.3;
  const tall = look.style === 'chefTall' ? 14 : look.style === 'official' || look.style === 'straw' ? 6 : 0;
  drawChar(ctx, { x: W * 0.47, y: H * 1.36 + tall * s, look, scale: s / (look.size || 1), facing: 1, expr: expr || 'normal', act: act || null, noShadow: true, t: performance.now() / 1000 });
}
