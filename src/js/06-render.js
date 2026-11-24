/* ================= 画面 ================= */
const PAL = {
  plaster: '#f2e0bb', plasterD: '#e0c697', beam: '#7a4524', beamD: '#55301a', beamL: '#a0643a',
  pillar: '#b8402c', pillarD: '#83261a', floor: '#c98f55', floorD: '#a96f3c', floorL: '#dca76c',
  roof: '#4e5866', roofD: '#39414c', roofL: '#6f7a88', ridge: '#2c3239', brick: '#b8705a', brickD: '#8a4a38',
};
const R = { cv: null, ctx: null, k: 1, bg: null, rail: null, key: '', hits: [], hover: null, mx: -1, my: -1, t: 0 };
const FONT_D = '"Ma Shan Zheng","STKaiti","KaiTi",serif';
const FONT_U = '"ZCOOL KuaiLe","PingFang SC","Microsoft YaHei",sans-serif';

function resizeCanvas() {
  const rect = R.cv.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(2, Math.round(rect.width * dpr)), hgt = Math.max(2, Math.round(rect.height * dpr));
  if (R.cv.width !== w || R.cv.height !== hgt) { R.cv.width = w; R.cv.height = hgt; R.k = w / VW; R.key = ''; }
}
function staticKey() { return JSON.stringify(G.build) + G.menu.join() + G.star + '|' + R.cv.width + '|' + (G.flags.won ? 1 : 0); }
function ensureStatic() {
  const key = staticKey();
  if (key === R.key && R.bg) return;
  R.key = key;
  const mk = () => { const c = document.createElement('canvas'); c.width = R.cv.width; c.height = R.cv.height; const x = c.getContext('2d'); x.setTransform(R.k, 0, 0, R.k, 0, 0); return [c, x]; };
  const [bg, bx] = mk(); drawStatic(bx); R.bg = bg;
  const [rl, rx] = mk(); drawRailing(rx); R.rail = rl;
}

/* ---------- 天空 ---------- */
const SKY = [[5, '#3a4a78', '#8a8aa8'], [7, '#a8d8f0', '#fdf0d0'], [10, '#86caf0', '#e6f5fb'], [15.5, '#8ccdf0', '#eaf6fb'], [17.5, '#f2b070', '#fde2b8'], [19.3, '#b8605a', '#6a4a7a'], [20.6, '#2a3360', '#3e3a62'], [24, '#151c3a', '#26264a']];
function mixHex(a, b, t) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const r = Math.round(lerp(pa >> 16, pb >> 16, t)), g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t)), bl = Math.round(lerp(pa & 255, pb & 255, t)); return `rgb(${r},${g},${bl})`; }
function skyAt(hr) { for (let i = 0; i < SKY.length - 1; i++) { const a = SKY[i], b = SKY[i + 1]; if (hr <= b[0]) { const t = clamp((hr - a[0]) / (b[0] - a[0]), 0, 1); return [mixHex(a[1], b[1], t), mixHex(a[2], b[2], t)]; } } return [SKY[SKY.length - 1][1], SKY[SKY.length - 1][2]]; }
function drawSky(ctx, hr) {
  const [top, bot] = skyAt(hr);
  const g = ctx.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  const night = hr >= 19.5 || hr < 6;
  // 日月
  const sx = 58, sy = night ? 70 : clamp(160 - (hr - 7) * 18, 50, 160) + (hr > 15 ? (hr - 15) * 30 : 0);
  if (!night && sy < 330) { const sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, 46); sg.addColorStop(0, hr > 16.5 ? 'rgba(255,190,110,.95)' : 'rgba(255,250,210,.95)'); sg.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = sg; ctx.fillRect(sx - 50, sy - 50, 100, 100); circ(ctx, sx, sy, 15); ctx.fillStyle = hr > 16.5 ? '#ffb46a' : '#fff4c8'; ctx.fill(); }
  // 云
  const cloudC = night ? 'rgba(120,130,170,.45)' : hr > 17 ? 'rgba(255,214,190,.9)' : 'rgba(255,255,255,.92)';
  for (let i = 0; i < 4; i++) {
    const x = ((R.t * (6 + i * 2) + i * 290) % 1240) - 140, y = 8 + (i % 2) * 14;
    ctx.fillStyle = cloudC;
    ell(ctx, x, y + 10, 36, 9); ctx.fill(); circ(ctx, x - 14, y + 4, 11); ctx.fill(); circ(ctx, x + 8, y, 14); ctx.fill(); circ(ctx, x + 26, y + 6, 9); ctx.fill();
  }
}

/* ---------- 静态建筑 ---------- */
function drawStatic(ctx) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // 远山
  ctx.fillStyle = '#93b3a6'; ctx.beginPath(); ctx.moveTo(0, 460); ctx.quadraticCurveTo(30, 400, 70, 430); ctx.quadraticCurveTo(100, 410, 130, 440); ctx.lineTo(130, 560); ctx.lineTo(0, 560); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7fa392'; ctx.beginPath(); ctx.moveTo(0, 500); ctx.quadraticCurveTo(50, 462, 90, 490); ctx.quadraticCurveTo(110, 480, 130, 492); ctx.lineTo(130, 560); ctx.lineTo(0, 560); ctx.closePath(); ctx.fill();
  // 柳树
  ctx.beginPath(); ctx.moveTo(4, 566); ctx.quadraticCurveTo(20, 470, 10, 380); ctx.quadraticCurveTo(14, 330, 30, 300); ctx.lineTo(40, 304); ctx.quadraticCurveTo(26, 340, 28, 390); ctx.quadraticCurveTo(36, 480, 26, 566); ctx.closePath(); fs(ctx, '#7a5a3a');
  ctx.fillStyle = '#7fb85a'; ell(ctx, 30, 300, 46, 26); ctx.fill(); ctx.fillStyle = '#6aa84a'; ell(ctx, 50, 290, 30, 18); ctx.fill();
  ctx.strokeStyle = '#5c9a40'; ctx.lineWidth = 2;
  for (let i = 0; i < 16; i++) { const x0 = -6 + i * 6.5, len = 90 + (i * 37) % 70; ctx.beginPath(); ctx.moveTo(x0, 296); ctx.quadraticCurveTo(x0 + 6, 296 + len * 0.5, x0 + 2, 296 + len); ctx.stroke(); }
  ctx.fillStyle = '#8acb64'; for (let i = 0; i < 40; i++) { ell(ctx, (i * 13) % 104 - 4, 300 + (i * 29) % 140, 2.2, 3.6); ctx.fill(); }
  // 街道
  ctx.fillStyle = '#c9aa7a'; ctx.fillRect(0, 552, 132, 48);
  ctx.fillStyle = 'rgba(120,90,50,.35)'; for (let i = 0; i < 18; i++) { ell(ctx, (i * 41) % 128, 560 + (i * 17) % 36, 2.4, 1.2); ctx.fill(); }

  /* 二楼墙面 */
  ctx.fillStyle = PAL.plaster; ctx.fillRect(126, 112, 834, 150);
  const g2 = ctx.createLinearGradient(0, 112, 0, 262); g2.addColorStop(0, 'rgba(120,80,40,.18)'); g2.addColorStop(0.3, 'rgba(120,80,40,0)'); ctx.fillStyle = g2; ctx.fillRect(126, 112, 834, 150);
  // 房间
  const posts2 = [128, 231, 333, 435, 537, 639, 744, 800, 904, 958];
  for (let i = 0; i < 6; i++) drawRoomDoor(ctx, i, GEO.ROOM_X[i], i < roomCount());
  // 楼梯口旁的小窗
  drawLattice(ctx, 752, 150, 40, 56, '#d9eef7');
  drawLattice(ctx, 912, 150, 36, 56, '#d9eef7');
  posts2.forEach(x => { ctx.fillStyle = PAL.beam; ctx.fillRect(x - 4, 116, 8, 140); ctx.strokeStyle = PAL.beamD; ctx.lineWidth = 1.2; ctx.strokeRect(x - 4, 116, 8, 140); });
  // 檐下彩绘梁
  ctx.fillStyle = PAL.beamD; ctx.fillRect(112, 110, 848, 12);
  for (let x = 130; x < 960; x += 44) { ctx.fillStyle = '#3f7a8a'; ctx.fillRect(x, 112, 18, 8); ctx.fillStyle = '#2f5a4a'; ctx.fillRect(x + 20, 112, 18, 8); ctx.fillStyle = '#f3c34f'; ctx.fillRect(x + 18, 112, 2, 8); }
  // 走廊地板
  ctx.fillStyle = PAL.floorD; ctx.fillRect(126, 252, 834, 12);
  ctx.strokeStyle = 'rgba(80,40,20,.35)'; ctx.lineWidth = 1; for (let x = 140; x < 960; x += 36) { ctx.beginPath(); ctx.moveTo(x, 253); ctx.lineTo(x, 263); ctx.stroke(); }

  /* 一楼后墙 */
  ctx.fillStyle = PAL.plaster; ctx.fillRect(126, 284, 652, 130);
  const g1 = ctx.createLinearGradient(0, 284, 0, 414); g1.addColorStop(0, 'rgba(110,70,30,.22)'); g1.addColorStop(0.25, 'rgba(110,70,30,0)'); g1.addColorStop(1, 'rgba(110,70,30,.12)'); ctx.fillStyle = g1; ctx.fillRect(126, 284, 652, 130);
  [126, 296, 476, 664].forEach(x => { ctx.fillStyle = PAL.beam; ctx.fillRect(x, 284, 8, 128); });
  ctx.fillStyle = PAL.beam; ctx.fillRect(126, 290, 652, 5);
  // 窗
  drawLattice(ctx, 488, 302, 64, 58, '#d9eef7');
  drawLattice(ctx, 572, 302, 64, 58, '#d9eef7');
  // 柜台后的酒架与菜牌
  drawShelves(ctx);
  drawMenuBoard(ctx);
  // 装饰
  if (G.build.scroll) drawScroll(ctx, 352, 298);
  if (G.build.screen) drawScreen(ctx, 300, 356);
  if (G.build.stage) drawStageBack(ctx);
  else drawFu(ctx, 438, 340);
  // 踢脚
  ctx.fillStyle = PAL.beamD; ctx.fillRect(126, 404, 652, 10);

  /* 厨房 */
  ctx.fillStyle = PAL.brick; ctx.fillRect(778, 284, 182, 160);
  ctx.strokeStyle = PAL.brickD; ctx.lineWidth = 1;
  for (let r = 0; r < 12; r++) { const y = 284 + r * 13; ctx.beginPath(); ctx.moveTo(778, y); ctx.lineTo(960, y); ctx.stroke(); for (let x = 778 + (r % 2) * 14; x < 960; x += 28) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 13); ctx.stroke(); } }
  ctx.fillStyle = 'rgba(40,20,10,.25)'; ctx.fillRect(778, 284, 182, 160);
  // 挂件：辣椒串、蒜辫、勺架
  for (let i = 0; i < 7; i++) { ctx.save(); ctx.translate(796, 330 + i * 7); ctx.rotate(0.3 * (i % 2 ? 1 : -1)); ell(ctx, 0, 0, 2.4, 5); fs(ctx, '#d8302a', '#6a1010', 1); ctx.restore(); }
  line(ctx, 796, 318, 796, 330, '#6a4a2a', 1.4);
  for (let i = 0; i < 5; i++) { circ(ctx, 950, 330 + i * 8, 4.2); fs(ctx, '#f4ecd8', '#8a7a5a', 1); }
  rr(ctx, 880, 324, 46, 4, 1.5); fs(ctx, PAL.beamD);
  [886, 900, 914].forEach(x => { line(ctx, x, 328, x, 352, '#8a8a90', 1.6); ell(ctx, x, 354, 3.5, 2.4); fs(ctx, '#a8a8b0', OUT, 1); });
  for (let i = 0; i < stoveCount(); i++) drawStove(ctx, GEO.STOVES[i]);
  // 后厨布帘
  ctx.fillStyle = '#2f4f7a'; ctx.beginPath(); ctx.moveTo(784, 284); ctx.lineTo(958, 284); ctx.lineTo(958, 304);
  for (let x = 958; x > 784; x -= 29) { ctx.quadraticCurveTo(x - 14.5, 314, x - 29, 304); }
  ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#1a2f4a'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = '#f6efe0'; ctx.font = `17px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('后 厨', 871, 296);
  // 地面
  const gf = ctx.createLinearGradient(0, 412, 0, 578); gf.addColorStop(0, '#b67c46'); gf.addColorStop(1, PAL.floorL);
  ctx.fillStyle = gf; ctx.fillRect(126, 412, 652, 166);
  ctx.strokeStyle = 'rgba(110,60,25,.45)'; ctx.lineWidth = 1;
  const rows = [412, 424, 438, 454, 472, 492, 514, 538, 564, 578];
  rows.forEach((y, ri) => { ctx.beginPath(); ctx.moveTo(126, y); ctx.lineTo(778, y); ctx.stroke(); if (ri < rows.length - 1) { const h2 = rows[ri + 1] - y; for (let x = 126 + (ri % 3) * 40; x < 778; x += 120) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - h2 * 0.2, y + h2); ctx.stroke(); } } });
  ctx.fillStyle = '#a29a8c'; ctx.fillRect(778, 444, 182, 134);
  ctx.strokeStyle = 'rgba(60,50,40,.35)'; for (let y = 444; y < 578; y += 22) { ctx.beginPath(); ctx.moveTo(778, y); ctx.lineTo(960, y); ctx.stroke(); } for (let x = 790; x < 960; x += 30) { ctx.beginPath(); ctx.moveTo(x, 444); ctx.lineTo(x - 8, 578); ctx.stroke(); }
  // 楼梯
  drawStairs(ctx);
  // 楼间横梁（留出楼梯口）
  ctx.fillStyle = PAL.beamD; ctx.fillRect(112, 262, 572, 22); ctx.fillRect(744, 262, 216, 22);
  ctx.fillStyle = PAL.beamL; ctx.fillRect(112, 263, 572, 3); ctx.fillRect(744, 263, 216, 3);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(112, 280, 572, 4); ctx.fillRect(744, 280, 216, 4);
  for (let x = 150; x < 960; x += 102) if (x < 684 || x > 744) { ctx.fillStyle = PAL.beam; ctx.fillRect(x - 6, 266, 12, 16); }
  // 厨房隔柱
  ctx.fillStyle = PAL.pillar; ctx.fillRect(774, 284, 10, 160); ctx.fillStyle = PAL.pillarD; ctx.fillRect(781, 284, 3, 160);
  // 左墙与大门
  ctx.fillStyle = PAL.beamD; ctx.fillRect(112, 112, 16, 150);
  ctx.fillStyle = '#e8d2a6'; ctx.fillRect(114, 284, 12, 146);
  ctx.fillStyle = PAL.beamD; ctx.fillRect(108, 424, 24, 10);
  ctx.save(); ctx.beginPath(); ctx.moveTo(110, 436); ctx.lineTo(82, 446); ctx.lineTo(82, 566); ctx.lineTo(110, 574); ctx.closePath(); fs(ctx, '#9a5a2e', OUT, 1.6);
  ctx.strokeStyle = '#6a3a1a'; ctx.lineWidth = 1.2; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(110 - i * 7, 436 + i * 2.5); ctx.lineTo(110 - i * 7, 494 + i * 0.5); ctx.stroke(); } for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(110, 446 + j * 13); ctx.lineTo(82, 455 + j * 13); ctx.stroke(); }
  ctx.restore();
  if (G.build.lantern) { drawLanternShape(ctx, 140, 438, 0.8); }
  // 柱子
  [[118, 112, 466], [948, 112, 466]].forEach(([x, y, hh]) => { const pg = ctx.createLinearGradient(x, 0, x + 13, 0); pg.addColorStop(0, PAL.pillarD); pg.addColorStop(0.4, PAL.pillar); pg.addColorStop(1, PAL.pillarD); ctx.fillStyle = pg; ctx.fillRect(x, y, 13, hh); });
  // 地基
  ctx.fillStyle = '#8f8a80'; ctx.fillRect(96, 576, 864, 24);
  ctx.strokeStyle = '#6a655c'; ctx.lineWidth = 1.2; ctx.strokeRect(96, 576, 864, 24);
  for (let x = 96; x < 960; x += 58) { ctx.beginPath(); ctx.moveTo(x, 576); ctx.lineTo(x, 600); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(96, 576, 864, 3);
  // 屋顶与招牌
  drawRoof(ctx);
  drawSign(ctx);
  if (G.build.flag) drawFlag(ctx);
}
function drawFu(ctx, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
  rr(ctx, -17, -17, 34, 34, 2); fs(ctx, '#c8392b', '#8a1a10', 1.6); ctx.restore();
  ctx.fillStyle = '#1f1008'; ctx.font = `24px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('福', x, y + 1);
}
function drawLattice(ctx, x, y, w, hh, glass) {
  ctx.fillStyle = glass; ctx.fillRect(x, y, w, hh);
  ctx.strokeStyle = PAL.beam; ctx.lineWidth = 2.2;
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + w * i / 4, y); ctx.lineTo(x + w * i / 4, y + hh); ctx.stroke(); }
  for (let j = 1; j < 4; j++) { ctx.beginPath(); ctx.moveTo(x, y + hh * j / 4); ctx.lineTo(x + w, y + hh * j / 4); ctx.stroke(); }
  ctx.lineWidth = 4; ctx.strokeStyle = PAL.beamD; ctx.strokeRect(x, y, w, hh);
}
function drawRoomDoor(ctx, i, cx, usable) {
  const top = 168, w = 50, hh = 86;
  ctx.fillStyle = PAL.beamD; ctx.fillRect(cx - w / 2 - 5, top - 5, w + 10, hh + 5);
  for (let s = 0; s < 2; s++) {
    const x = cx - w / 2 + s * w / 2;
    ctx.fillStyle = usable ? '#a8643a' : '#7a6a5a'; ctx.fillRect(x, top, w / 2, hh);
    ctx.fillStyle = usable ? '#f6e6c4' : '#cfc4b4'; ctx.fillRect(x + 4, top + 5, w / 2 - 8, 38);
    ctx.strokeStyle = usable ? '#6a3a1a' : '#5a4e42'; ctx.lineWidth = 1.4;
    for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + 4 + (w / 2 - 8) * k / 3, top + 5); ctx.lineTo(x + 4 + (w / 2 - 8) * k / 3, top + 43); ctx.stroke(); }
    for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + 4, top + 5 + 38 * k / 4); ctx.lineTo(x + w / 2 - 4, top + 5 + 38 * k / 4); ctx.stroke(); }
    ctx.strokeRect(x + 4, top + 50, w / 2 - 8, 28);
    ctx.strokeStyle = OUT; ctx.strokeRect(x, top, w / 2, hh);
  }
  // 门牌
  rr(ctx, cx - 11, 146, 22, 16, 2); fs(ctx, usable ? '#c0392b' : '#8a7a6a', OUT, 1.2);
  ctx.fillStyle = usable ? '#f3c34f' : '#d8ccb8'; ctx.font = `12px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ROOM_NAMES[i], cx, 154.5);
  if (!usable) {
    ctx.save(); ctx.translate(cx, top + hh / 2);
    [[-0.5, 0], [0.45, 4]].forEach(([a, dy]) => { ctx.save(); ctx.rotate(a); rr(ctx, -34, -5 + dy, 68, 10, 2); fs(ctx, '#b0886a', OUT, 1.4); ctx.fillStyle = '#5a4a3a'; circ(ctx, -28, dy, 1.4); ctx.fill(); circ(ctx, 28, dy, 1.4); ctx.fill(); ctx.restore(); });
    ctx.restore();
    rr(ctx, cx + 8, top + 50, 18, 24, 1); fs(ctx, '#f6efe0', '#8a7a6a', 1);
    ctx.fillStyle = '#c0392b'; ctx.font = `10px ${FONT_D}`; ctx.fillText('待', cx + 17, top + 57); ctx.fillText('修', cx + 17, top + 68);
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(cx - w / 2, top); ctx.lineTo(cx - w / 2 + 14, top + 14); ctx.moveTo(cx - w / 2, top + 8); ctx.quadraticCurveTo(cx - w / 2 + 6, top + 6, cx - w / 2 + 8, top); ctx.moveTo(cx - w / 2, top + 14); ctx.quadraticCurveTo(cx - w / 2 + 11, top + 11, cx - w / 2 + 14, top); ctx.stroke();
  }
}
function drawShelves(ctx) {
  ctx.fillStyle = '#8a5229'; ctx.fillRect(140, 346, 150, 6); ctx.fillRect(140, 380, 150, 6);
  ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.strokeRect(140, 346, 150, 6); ctx.strokeRect(140, 380, 150, 6);
  const jar = (x, y, s, c) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(-5, -14); ctx.lineTo(5, -14); ctx.quadraticCurveTo(12, -9, 11, -2); ctx.quadraticCurveTo(10, 2, 0, 2); ctx.quadraticCurveTo(-10, 2, -11, -2); ctx.quadraticCurveTo(-12, -9, -5, -14); ctx.closePath(); fs(ctx, c, OUT, 1.3); ctx.beginPath(); ctx.moveTo(-6, -15); ctx.quadraticCurveTo(0, -20, 6, -15); ctx.closePath(); fs(ctx, '#c0392b', OUT, 1); ctx.fillStyle = '#e8483a'; ctx.save(); ctx.rotate(Math.PI / 4); ctx.fillRect(-3, -9.5, 6, 6); ctx.restore(); ctx.restore(); };
  [[154, 346, 1, '#8a5a3a'], [178, 346, 1, '#7a4a2a'], [204, 346, 0.85, '#9a6a3a'], [228, 346, 1, '#8a5a3a'], [254, 346, 0.9, '#7a4a2a'], [278, 346, 0.85, '#9a6a3a'], [160, 380, 0.95, '#6a4a3a'], [186, 380, 1.05, '#8a5a3a'], [214, 380, 0.9, '#7a4a2a'], [240, 380, 1, '#9a6a3a'], [266, 380, 1, '#8a5a3a']].forEach(a => jar(...a));
}
function drawMenuBoard(ctx) {
  const items = G.menu.slice(0, 9);
  const n = Math.max(items.length, 1);
  const w = 15, gap = 2, total = n * (w + gap) - gap;
  const x0 = 214 - total / 2;
  rr(ctx, x0 - 6, 296, total + 12, 4, 1.5); fs(ctx, PAL.beamD, OUT, 1);
  items.forEach((id, i) => {
    const x = x0 + i * (w + gap);
    rr(ctx, x, 302, w, 40, 2); fs(ctx, '#f4e2b8', '#6a3a1a', 1.2);
    ctx.fillStyle = '#2a1408'; ctx.font = `9.5px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const nm = DISH[id].name.slice(0, 4);
    for (let c = 0; c < nm.length; c++) ctx.fillText(nm[c], x + w / 2, 308 + c * 9.5);
  });
}
function drawScroll(ctx, x, y) {
  rr(ctx, x, y + 6, 46, 80, 1); fs(ctx, '#f6efe0', OUT, 1.4);
  ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x + 4, y + 10, 38, 66);
  ctx.fillStyle = '#7a9a8a'; ctx.beginPath(); ctx.moveTo(x + 5, y + 68); ctx.lineTo(x + 14, y + 40); ctx.lineTo(x + 22, y + 56); ctx.lineTo(x + 30, y + 34); ctx.lineTo(x + 41, y + 68); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a7a6a'; ctx.beginPath(); ctx.moveTo(x + 18, y + 68); ctx.lineTo(x + 28, y + 50); ctx.lineTo(x + 38, y + 68); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c0392b'; ctx.fillRect(x + 34, y + 14, 5, 6);
  rr(ctx, x - 3, y + 2, 52, 5, 2); fs(ctx, PAL.beamD, OUT, 1); rr(ctx, x - 3, y + 84, 52, 5, 2); fs(ctx, PAL.beamD, OUT, 1);
  line(ctx, x + 23, y - 6, x + 6, y + 3, OUT, 1); line(ctx, x + 23, y - 6, x + 40, y + 3, OUT, 1);
}
function drawScreen(ctx, x, y) {
  for (let i = 0; i < 3; i++) {
    const px = x + i * 15, py = y + (i === 1 ? -2 : 0);
    rr(ctx, px, py, 15, 60, 1); fs(ctx, '#f6efe0', '#6a2a1a', 2);
    ctx.fillStyle = ['#e06a7a', '#f3c34f', '#e06a7a'][i]; circ(ctx, px + 7, py + 20 + i * 6, 3); ctx.fill();
    line(ctx, px + 4, py + 40, px + 11, py + 28, '#4f9a40', 1.4);
  }
  rr(ctx, x - 2, y + 58, 49, 5, 1); fs(ctx, '#6a2a1a');
}
function drawStageBack(ctx) {
  ctx.fillStyle = '#9a2a1e'; ctx.fillRect(402, 298, 72, 108);
  ctx.strokeStyle = '#6a160e'; ctx.lineWidth = 1.2; for (let x = 408; x < 474; x += 8) { ctx.beginPath(); ctx.moveTo(x, 300); ctx.quadraticCurveTo(x + 2, 350, x, 404); ctx.stroke(); }
  ctx.fillStyle = '#f3c34f'; ctx.fillRect(400, 296, 76, 6);
  rr(ctx, 418, 302, 40, 16, 2); fs(ctx, '#2a1408', '#f3c34f', 1.4);
  ctx.fillStyle = '#f3c34f'; ctx.font = `11px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('说书台', 438, 310.5);
  rr(ctx, 398, 406, 80, 12, 2); fs(ctx, '#8a5229', OUT, 1.4);
  ctx.fillStyle = PAL.beamL; ctx.fillRect(400, 407, 76, 3);
}
function drawStove(ctx, sx) {
  ctx.fillStyle = '#5a4a40'; ctx.fillRect(sx + 4, 314, 10, 86);
  ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.strokeRect(sx + 4, 314, 10, 86);
  rr(ctx, sx - 22, 406, 44, 48, 3); fs(ctx, '#c4a080', OUT, 1.6);
  ctx.strokeStyle = 'rgba(90,60,40,.4)'; ctx.lineWidth = 1; for (let y = 416; y < 452; y += 10) { ctx.beginPath(); ctx.moveTo(sx - 21, y); ctx.lineTo(sx + 21, y); ctx.stroke(); }
  ell(ctx, sx, 406, 22, 5.5); fs(ctx, '#d8b898', OUT, 1.4);
  ell(ctx, sx, 406, 13, 3.4); fs(ctx, '#2a2420', OUT, 1);
}
function drawStairs(ctx) {
  const b = { x: 772, y: 418 }, t = { x: 700, y: 262 };
  const n = 12;
  ctx.fillStyle = 'rgba(60,30,10,.18)'; ctx.beginPath(); ctx.moveTo(t.x - 20, t.y); ctx.lineTo(b.x - 6, b.y); ctx.lineTo(b.x + 14, b.y); ctx.lineTo(t.x + 8, t.y); ctx.closePath(); ctx.fill();
  for (let i = 0; i < n; i++) {
    const p = i / n; const x = lerp(b.x, t.x, p), y = lerp(b.y, t.y, p);
    rr(ctx, x - 16, y - 5, 30, 5, 1); fs(ctx, '#b0703a', OUT, 1.1);
  }
  ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.beginPath(); ctx.moveTo(b.x + 16, b.y + 2); ctx.lineTo(t.x + 16, t.y + 2); ctx.stroke();
  ctx.lineWidth = 3.6; ctx.strokeStyle = '#8a4a24'; ctx.stroke();
  for (let i = 0; i <= 4; i++) { const p = i / 4; const x = lerp(b.x, t.x, p) + 16, y = lerp(b.y, t.y, p); line(ctx, x, y, x, y - 26, OUT, 3.4); line(ctx, x, y, x, y - 26, '#9a3a2a', 1.8); }
  ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.beginPath(); ctx.moveTo(b.x + 16, b.y - 26); ctx.lineTo(t.x + 16, t.y - 26); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = '#b8402c'; ctx.stroke();
}
function drawRoof(ctx) {
  ctx.save();
  ctx.beginPath(); ctx.moveTo(62, 104); ctx.quadraticCurveTo(70, 108, 90, 112); ctx.lineTo(960, 112); ctx.lineTo(960, 30); ctx.lineTo(176, 30); ctx.quadraticCurveTo(120, 72, 62, 104); ctx.closePath();
  const rg = ctx.createLinearGradient(0, 30, 0, 112); rg.addColorStop(0, PAL.roofD); rg.addColorStop(1, PAL.roof);
  ctx.fillStyle = rg; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
  ctx.clip();
  for (let x = 70; x < 970; x += 13) { ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 4, 32); ctx.lineTo(x, 112); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 9.5, 32); ctx.lineTo(x + 6, 112); ctx.stroke(); }
  for (let y = 46; y < 112; y += 15) { ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(960, y); ctx.stroke(); }
  ctx.restore();
  // 瓦当
  for (let x = 96; x < 960; x += 13) { circ(ctx, x + 4, 112, 4.2); fs(ctx, PAL.roofL, OUT, 1.1); }
  // 屋脊
  rr(ctx, 168, 20, 800, 13, 4); fs(ctx, PAL.ridge, OUT, 1.6);
  ctx.fillStyle = '#4a525c'; ctx.fillRect(170, 22, 790, 3);
  // 鸱吻
  ctx.beginPath(); ctx.moveTo(170, 33); ctx.quadraticCurveTo(150, 30, 150, 12); ctx.quadraticCurveTo(152, 2, 162, 6); ctx.quadraticCurveTo(156, 12, 162, 18); ctx.quadraticCurveTo(170, 20, 176, 22); ctx.closePath(); fs(ctx, PAL.ridge, OUT, 1.6);
  // 飞檐
  ctx.beginPath(); ctx.moveTo(62, 104); ctx.quadraticCurveTo(50, 98, 46, 86); ctx.quadraticCurveTo(54, 94, 70, 98); ctx.closePath(); fs(ctx, PAL.ridge, OUT, 1.5);
}
function drawSign(ctx) {
  const lv = G.build.sign;
  const x = 446, y = 66, w = 188, hh = 54;
  line(ctx, x + 30, 34, x + 30, y, OUT, 2); line(ctx, x + w - 30, 34, x + w - 30, y, OUT, 2);
  rr(ctx, x - 6, y - 6, w + 12, hh + 12, 6); fs(ctx, lv === 2 ? '#3a1a0a' : '#4a2a14', OUT, 2);
  const face = lv === 0 ? '#7a5a3a' : lv === 1 ? '#a8301e' : '#1f140c';
  rr(ctx, x, y, w, hh, 4); fs(ctx, face, lv === 2 ? '#f3c34f' : '#2a140a', 2);
  if (lv === 2) { ctx.strokeStyle = '#f3c34f'; ctx.lineWidth = 1; rr(ctx, x + 5, y + 5, w - 10, hh - 10, 3); ctx.stroke(); }
  ctx.font = `38px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = lv === 0 ? '#e0cfa8' : lv === 1 ? '#f8e6b0' : '#f8d050';
  if (lv === 2) { ctx.shadowColor = 'rgba(255,200,60,.7)'; ctx.shadowBlur = 8; }
  ctx.fillText('云来客栈', x + w / 2, y + hh / 2 + 2);
  ctx.shadowBlur = 0;
  if (lv === 0) { ctx.strokeStyle = 'rgba(40,20,10,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 20, y + 8); ctx.lineTo(x + 46, y + 22); ctx.moveTo(x + w - 40, y + hh - 6); ctx.lineTo(x + w - 18, y + hh - 18); ctx.stroke(); }
  if (G.flags.won) { rr(ctx, x + w / 2 - 50, y + hh + 8, 100, 22, 3); fs(ctx, '#c0392b', '#f3c34f', 1.6); ctx.fillStyle = '#f3c34f'; ctx.font = `14px ${FONT_D}`; ctx.fillText('天下第一客栈', x + w / 2, y + hh + 19.5); }
}
function drawFlag(ctx) {
  line(ctx, 100, 562, 100, 318, OUT, 5); line(ctx, 100, 562, 100, 318, '#8a5229', 3);
  line(ctx, 100, 326, 56, 326, OUT, 4); line(ctx, 100, 326, 56, 326, '#8a5229', 2.4);
  const wv = Math.sin(R.t * 2) * 2;
  ctx.beginPath(); ctx.moveTo(58, 328); ctx.lineTo(98, 328); ctx.lineTo(98 + wv, 410); ctx.lineTo(88 + wv, 400); ctx.lineTo(78 + wv, 412); ctx.lineTo(68 + wv, 400); ctx.lineTo(58 + wv, 410); ctx.closePath(); fs(ctx, '#f6efe0', OUT, 1.6);
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(60, 331); ctx.lineTo(96, 331); ctx.stroke();
  ctx.fillStyle = '#c0392b'; ctx.font = `30px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('酒', 78, 362);
}
function drawRailing(ctx) {
  const seg = (x1, x2) => {
    ctx.fillStyle = '#8a3020'; ctx.fillRect(x1, 226, x2 - x1, 6); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.strokeRect(x1, 226, x2 - x1, 6);
    ctx.fillStyle = '#a8402c'; ctx.fillRect(x1, 227, x2 - x1, 2);
    ctx.fillStyle = '#7a2a1a'; ctx.fillRect(x1, 248, x2 - x1, 6); ctx.strokeRect(x1, 248, x2 - x1, 6);
    for (let x = x1 + 7; x < x2 - 3; x += 12) { ctx.fillStyle = '#9a3a26'; ctx.fillRect(x - 1.6, 232, 3.2, 16); ctx.strokeStyle = 'rgba(40,10,5,.6)'; ctx.lineWidth = 0.8; ctx.strokeRect(x - 1.6, 232, 3.2, 16); }
    for (let x = x1; x <= x2; x += Math.max(60, (x2 - x1) / Math.round((x2 - x1) / 100))) { rr(ctx, x - 4, 220, 8, 36, 2); fs(ctx, '#b8402c', OUT, 1.2); circ(ctx, x, 219, 4); fs(ctx, '#f3c34f', OUT, 1); }
  };
  seg(128, 684); seg(744, 956);
}

/* ---------- 动态场景 ---------- */
function drawLanternShape(ctx, x, y, s, lit) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line(ctx, 0, -14, 0, -8, OUT, 1.4);
  rr(ctx, -6, -9, 12, 3, 1); fs(ctx, '#3a2214', OUT, 1);
  ell(ctx, 0, 3, 12, 11); fs(ctx, lit ? '#ff6a3a' : '#e0402e', OUT, 1.6);
  ell(ctx, 0, 3, 5.5, 11); fs(ctx, null, '#a02010', 1.2);
  ctx.fillStyle = 'rgba(255,230,180,.35)'; ell(ctx, -4, -1, 3, 5); ctx.fill();
  rr(ctx, -6, 13, 12, 3, 1); fs(ctx, '#3a2214', OUT, 1);
  line(ctx, 0, 16, 0, 24, '#f3c34f', 1.6); line(ctx, -2, 18, -2, 24, '#f3c34f', 1); line(ctx, 2, 18, 2, 24, '#f3c34f', 1);
  ctx.restore();
}
const LANTERNS = [[330, 296], [520, 296], [640, 296], [252, 124], [870, 124]];
function lightList(hr) {
  const L = [];
  L.push([214, 412, 46]);
  if (G.build.lantern) LANTERNS.forEach(([x, y]) => L.push([x, y + 4, 70]));
  W.rooms.forEach(r => { if (r.occ) L.push([GEO.ROOM_X[r.i] + 32, 172, 40]); });
  W.agents.forEach(a => { if (a.cook) L.push([a.x + 30, a.y - 30, 44]); });
  L.push([871, 330, 40]);
  return L;
}
function drawDynamicBack(ctx, hr) {
  const night = hr >= 18.5;
  const nA = nightAmt(hr);
  // 窗外是夜色
  if (nA > 0.02) { const glass = mixHex('#d9eef7', '#1c2850', Math.min(1, nA * 1.15)); NIGHT_WINDOWS.forEach(([x, y, w, hh]) => drawLattice(ctx, x, y, w, hh, glass)); }
  // 客房灯：住了人的房间，门纸透出暖光
  W.rooms.forEach(r => {
    if (!r.occ) return;
    const cx = GEO.ROOM_X[r.i];
    if (nA > 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,170,70,${0.42 * nA})`; ctx.fillRect(cx - 21, 173, 17, 38); ctx.fillRect(cx + 4, 173, 17, 38); ctx.restore(); }
    drawLanternShape(ctx, cx + 32, 172, 0.55, night);
  });
  // 灯笼
  if (G.build.lantern) LANTERNS.forEach(([x, y], i) => { ctx.save(); ctx.translate(x, y - 10); ctx.rotate(Math.sin(R.t * 1.6 + i) * 0.05); drawLanternShape(ctx, 0, 14, 0.9, night); ctx.restore(); });
  // 鸟笼
  if (G.build.bird) {
    const x = 604, y = 300;
    line(ctx, x, 284, x, 294, OUT, 1.4);
    ctx.save(); ctx.translate(x, y + 14);
    const hop = Math.abs(Math.sin(R.t * 3)) > 0.95 ? -3 : 0;
    ell(ctx, -2, 6 + hop, 5, 3.6); fs(ctx, '#c8a050', OUT, 1.1); circ(ctx, 3, 3 + hop, 2.6); fs(ctx, '#c8a050', OUT, 1); ctx.fillStyle = '#fff'; circ(ctx, 3.8, 2.4 + hop, 0.8); ctx.fill();
    line(ctx, 5.5, 3.6 + hop, 7.5, 4 + hop, '#e0a020', 1.2);
    ctx.beginPath(); ctx.moveTo(-14, 16); ctx.lineTo(-14, -2); ctx.quadraticCurveTo(0, -18, 14, -2); ctx.lineTo(14, 16); ctx.closePath(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = '#8a5229'; ctx.lineWidth = 1; for (let i = -10; i <= 10; i += 5) { ctx.beginPath(); ctx.moveTo(i, 16); ctx.lineTo(i, -8 + Math.abs(i) * 0.5); ctx.stroke(); }
    rr(ctx, -16, 15, 32, 4, 1.5); fs(ctx, '#8a5229', OUT, 1.1);
    ctx.restore();
    if (W.phase === 'business' && chance(0.004)) Sound.play('bird');
  }
  // 灶火
  W.agents.forEach(a => {
    if (a.role !== 'cook') return;
    const sx = GEO.STOVES[a.idx % 3];
    const on = !!a.cook;
    for (let i = 0; i < (on ? 5 : 2); i++) {
      const fx = sx + Math.sin(R.t * 9 + i * 2) * 6 + (i - 2) * 3, fh = on ? 10 + Math.sin(R.t * 13 + i) * 4 : 3;
      ctx.beginPath(); ctx.moveTo(fx - 4, 406); ctx.quadraticCurveTo(fx - 3, 406 - fh * 0.6, fx, 406 - fh); ctx.quadraticCurveTo(fx + 3, 406 - fh * 0.6, fx + 4, 406); ctx.closePath();
      ctx.fillStyle = i % 2 ? 'rgba(255,200,60,.9)' : 'rgba(255,110,30,.85)'; ctx.fill();
    }
    if (on && chance(0.08)) W.fx.push({ k: 'smoke', x: sx + rand(-6, 6), y: 392, vx: rand(-4, 4), vy: -18, life: 1.6, max: 1.6 });
  });
  if (W.bossCook) { const sx = GEO.STOVES[0]; for (let i = 0; i < 3; i++) { const fx = sx + (i - 1) * 4; ctx.beginPath(); ctx.moveTo(fx - 4, 406); ctx.quadraticCurveTo(fx, 392 - Math.sin(R.t * 12 + i) * 3, fx + 4, 406); ctx.fillStyle = 'rgba(255,140,40,.85)'; ctx.fill(); } }
  // 后厨待做的菜单
  const n = Math.min(W.tickets.length, 10);
  if (n) {
    line(ctx, 790, 318, 790 + n * 14 + 6, 318, '#6a4a2a', 1);
    for (let i = 0; i < n; i++) { ctx.save(); ctx.translate(796 + i * 14, 318); ctx.rotate(Math.sin(R.t * 2 + i) * 0.08); rr(ctx, -5, 0, 10, 13, 1); fs(ctx, '#fff8e6', '#8a6a4a', 1); line(ctx, -2.5, 4, 2.5, 4, '#c0392b', 1); line(ctx, -2.5, 7.5, 2.5, 7.5, '#8a6a4a', 0.8); ctx.restore(); }
    if (W.tickets.length > 10) { ctx.fillStyle = '#fff3c4'; ctx.font = `11px ${FONT_U}`; ctx.textAlign = 'left'; ctx.fillText('+' + (W.tickets.length - 10), 796 + n * 14, 326); }
  }
}

function drawMember(ctx, m) { drawChar(ctx, { x: m.x, y: m.y, look: m.look, facing: m.facing, pose: m.pose, act: m.act, expr: m.expr, t: m.t, scale: pscale(m.y), alpha: m.alpha }); }
function drawAgent(ctx, a) { drawChar(ctx, { x: a.x, y: a.y, look: a.look, facing: a.facing, pose: a.pose, act: a.act, expr: a.expr, t: a.t, scale: pscale(a.y), hold: a.holding }); }
function furnColor() { return [['#c98a4e', '#9a5e2e'], ['#a0602e', '#6e3c18'], ['#7a2a1a', '#4a140a']][G.build.furn]; }
function drawTableGroup(ctx, tb) {
  const sc = pscale(tb.y); const [c1, c2] = furnColor();
  ctx.save(); ctx.translate(tb.x, tb.y); ctx.scale(sc, sc);
  [-GEO.SEAT_DX, GEO.SEAT_DX].forEach(dx => { rr(ctx, dx - 8, -11, 16, 4, 1.5); fs(ctx, c1, OUT, 1.3); rr(ctx, dx - 6, -7, 3, 7, 1); fs(ctx, c2, OUT, 1); rr(ctx, dx + 3, -7, 3, 7, 1); fs(ctx, c2, OUT, 1); });
  ctx.restore();
  if (tb.party) tb.party.members.forEach(m => { if (m.pose === 'sit') drawMember(ctx, m); });
  ctx.save(); ctx.translate(tb.x, tb.y); ctx.scale(sc, sc);
  rr(ctx, -21, -24, 4, 22, 1); fs(ctx, c2, OUT, 1.2); rr(ctx, 17, -24, 4, 22, 1); fs(ctx, c2, OUT, 1.2);
  rr(ctx, -26, -21, 4, 21, 1); fs(ctx, c2, OUT, 1.3); rr(ctx, 22, -21, 4, 21, 1); fs(ctx, c2, OUT, 1.3);
  ctx.beginPath(); ctx.moveTo(-29, -24); ctx.lineTo(29, -24); ctx.lineTo(26, -31); ctx.lineTo(-26, -31); ctx.closePath(); fs(ctx, c1, OUT, 1.5);
  rr(ctx, -29, -24, 58, 5, 1); fs(ctx, c2, OUT, 1.4);
  if (G.build.furn === 2) { ctx.fillStyle = '#f3c34f'; ctx.fillRect(-28, -23, 4, 3); ctx.fillRect(24, -23, 4, 3); }
  if (tb.flash > 0) { tb.flash -= 1 / 60; ctx.fillStyle = `rgba(255,255,220,${tb.flash * 2})`; ell(ctx, 0, -28, 30, 6); ctx.fill(); }
  // 桌上的菜
  const p = tb.party;
  if (p && p.orders.length) {
    const served = p.orders.filter(o => o.status === 'served');
    served.slice(0, 4).forEach((o, i) => { drawIcon(ctx, p.state === 'eat' || p.state === 'wait' ? DISH[o.dish].icon : 'tea', -16 + i * 11 + (served.length < 3 ? 6 : 0), -33, 15); });
  }
  if (tb.dirty) {
    ctx.fillStyle = 'rgba(120,80,30,.35)'; ell(ctx, -8, -27, 7, 2); ctx.fill(); ell(ctx, 10, -26, 5, 1.6); ctx.fill();
    ctx.save(); ctx.translate(-12, 0); bowl(ctx, -32, 5, '#f4f1ea'); ctx.restore(); ctx.save(); ctx.translate(8, 0); bowl(ctx, -31, 4.5, '#f4f1ea'); ctx.restore();
    line(ctx, -2, -31, 10, -34, '#7a4a20', 1); line(ctx, -1, -30, 11, -32, '#7a4a20', 1);
    if (tb.mess) { ctx.fillStyle = '#e8e2d2'; [[-20, -2], [16, -1], [4, 2]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5, y - 2); ctx.lineTo(x + 3, y + 2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 0.8; ctx.stroke(); }); }
    const fx = Math.sin(R.t * 7) * 6, fy = Math.cos(R.t * 9) * 3;
    ctx.fillStyle = '#2a2a2a'; circ(ctx, fx, -44 + fy, 1.2); ctx.fill();
  }
  ctx.restore();
}
function drawCounter(ctx) {
  const c = GEO.COUNTER;
  ctx.beginPath(); ctx.moveTo(c.x1, c.top + 10); ctx.lineTo(c.x2, c.top + 10); ctx.lineTo(c.x2 - 6, c.top); ctx.lineTo(c.x1 + 6, c.top); ctx.closePath(); fs(ctx, '#c98a4e', OUT, 1.6);
  rr(ctx, c.x1, c.top + 10, c.x2 - c.x1, c.front - c.top - 10, 2); fs(ctx, '#9a5a2c', OUT, 1.8);
  for (let i = 0; i < 3; i++) { const px = c.x1 + 8 + i * ((c.x2 - c.x1 - 16) / 3); rr(ctx, px, c.top + 18, (c.x2 - c.x1 - 16) / 3 - 6, c.front - c.top - 30, 2); fs(ctx, '#a8683a', '#6a3a1a', 1.2); }
  ctx.fillStyle = '#c0392b'; ctx.save(); ctx.translate((c.x1 + c.x2) / 2, c.top + 36); ctx.rotate(Math.PI / 4); ctx.fillRect(-9, -9, 18, 18); ctx.restore();
  ctx.fillStyle = '#f3c34f'; ctx.font = `14px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('柜', (c.x1 + c.x2) / 2, c.top + 37);
  // 柜面上的小物
  ctx.save(); ctx.translate(166, c.top + 4); rr(ctx, 0, -6, 18, 6, 1); fs(ctx, '#6a4028', OUT, 1); ctx.restore();
  ctx.save(); ctx.translate(214, c.top + 3); ell(ctx, 0, 0, 6, 2.5); fs(ctx, '#c08a3a', OUT, 1); ctx.beginPath(); ctx.moveTo(-2, -1); ctx.quadraticCurveTo(0, -9 - Math.sin(R.t * 8), 2, -1); ctx.fillStyle = '#ffb040'; ctx.fill(); ctx.restore();
  if (G.build.vase) { ctx.save(); ctx.translate(278, c.top - 10); ctx.scale(0.9, 0.9); BUILD_ICON.vase(ctx); ctx.restore(); }
  // 钱袋堆
  const pile = Math.min(6, Math.floor(Math.log10(Math.max(10, G.money))));
  for (let i = 0; i < pile; i++) { ell(ctx, 246 + (i % 3) * 6, c.top + 2 - Math.floor(i / 3) * 3, 5, 2); fs(ctx, '#f3c34f', '#8a5a10', 1); }
}
function drawKitchenCounter(ctx) {
  const c = GEO.KCOUNTER;
  rr(ctx, c.x1, c.top, c.x2 - c.x1, 9, 2); fs(ctx, '#c98a4e', OUT, 1.6);
  rr(ctx, c.x1 + 2, c.top + 9, c.x2 - c.x1 - 2, c.front - c.top - 9, 1); fs(ctx, '#8e8a82', OUT, 1.6);
  ctx.strokeStyle = 'rgba(40,30,20,.35)'; ctx.lineWidth = 1;
  for (let y = c.top + 20; y < c.front; y += 12) { ctx.beginPath(); ctx.moveTo(c.x1 + 2, y); ctx.lineTo(c.x2, y); ctx.stroke(); }
  for (let r = 0; r < 4; r++) for (let x = c.x1 + 10 + (r % 2) * 14; x < c.x2; x += 28) { ctx.beginPath(); ctx.moveTo(x, c.top + 9 + r * 12); ctx.lineTo(x, c.top + 20 + r * 12); ctx.stroke(); }
  // 出菜口的菜
  W.pass.forEach(ps => {
    ps.t += 1 / 60;
    const glow = 0.4 + Math.sin(R.t * 6 + ps.id) * 0.25;
    ctx.fillStyle = `rgba(255,236,150,${glow})`; ell(ctx, ps.x, ps.y + 4, 12, 5); ctx.fill();
    drawIcon(ctx, DISH[ps.order.dish].icon, ps.x, ps.y - 2, 19);
    addHit(ps.x - 12, ps.y - 14, 24, 24, () => clickDish(ps), 'dish');
  });
  ctx.fillStyle = '#fff3c4'; ctx.font = `11px ${FONT_U}`; ctx.textAlign = 'center';
}
function drawPlant(ctx, x, y) {
  ctx.save(); ctx.translate(x, y);
  [[-8, -38, -0.5], [0, -46, 0], [8, -38, 0.5], [-4, -30, -0.3], [5, -30, 0.3], [-11, -28, -0.9], [11, -28, 0.9]].forEach(p => { ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(p[2] + Math.sin(R.t * 1.3 + p[0]) * 0.03); ell(ctx, 0, 0, 3.6, 10); fs(ctx, '#58a84a', '#2a6a2a', 1.2); ctx.restore(); });
  ctx.beginPath(); ctx.moveTo(-12, -20); ctx.lineTo(12, -20); ctx.lineTo(9, 0); ctx.lineTo(-9, 0); ctx.closePath(); fs(ctx, '#3a6a9a', OUT, 1.5);
  line(ctx, -10, -14, 10, -14, '#f6efe0', 1.4);
  ctx.restore();
}
function drawLotus(ctx, x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-24, -32); ctx.lineTo(24, -32); ctx.quadraticCurveTo(28, -4, 16, 0); ctx.lineTo(-16, 0); ctx.quadraticCurveTo(-28, -4, -24, -32); ctx.closePath(); fs(ctx, '#5f7080', OUT, 1.6);
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, -24); ctx.quadraticCurveTo(0, -18, 18, -24); ctx.stroke();
  ell(ctx, 0, -32, 24, 5); fs(ctx, '#3f7f9a', OUT, 1.4);
  ell(ctx, -9, -33, 8, 3); fs(ctx, '#4f9a40', '#2a6a2a', 1); ell(ctx, 10, -34, 6, 2.4); fs(ctx, '#58a84a', '#2a6a2a', 1);
  line(ctx, 4, -34, 4, -56, '#2a6a2a', 1.6); ell(ctx, 4, -58, 6, 5); fs(ctx, '#f8a0b8', '#b04a6a', 1.2);
  ctx.fillStyle = '#f08a3a'; ell(ctx, -2 + Math.sin(R.t) * 6, -32, 3, 1.4); ctx.fill();
  ctx.restore();
}

/* ---------- 气泡与点击区 ---------- */
function addHit(x, y, w, hh, fn, kind) { R.hits.push({ x, y, w, h: hh, fn, kind }); }
function bubble(ctx, x, y, w, hh, opt) {
  opt = opt || {};
  ctx.save();
  if (opt.wiggle) { ctx.translate(x, y + hh / 2); ctx.rotate(Math.sin(R.t * 8) * 0.06); ctx.translate(-x, -y - hh / 2); }
  rr(ctx, x - w / 2, y, w, hh, 8);
  ctx.fillStyle = opt.fill || '#fffaf0'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 5, y + hh - 0.5); ctx.lineTo(x, y + hh + 7); ctx.lineTo(x + 5, y + hh - 0.5); ctx.closePath(); ctx.fill();
  rr(ctx, x - w / 2, y, w, hh, 8); ctx.strokeStyle = opt.stroke || OUT; ctx.lineWidth = opt.lw || 1.6; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 5, y + hh); ctx.lineTo(x, y + hh + 7); ctx.lineTo(x + 5, y + hh); ctx.stroke();
  ctx.fillStyle = opt.fill || '#fffaf0'; ctx.fillRect(x - 4.2, y + hh - 2, 8.4, 3);
  ctx.restore();
}
function patienceBar(ctx, x, y, r) {
  rr(ctx, x - 16, y, 32, 5, 2.5); ctx.fillStyle = 'rgba(40,20,10,.55)'; ctx.fill();
  rr(ctx, x - 15, y + 1, 30 * clamp(r, 0, 1), 3, 1.5); ctx.fillStyle = r > 0.6 ? '#6cc24a' : r > 0.3 ? '#f0b030' : '#e8483a'; ctx.fill();
}
function speech(ctx, x, y, text) {
  ctx.font = `12px ${FONT_U}`; const w = Math.min(190, ctx.measureText(text).width + 14);
  bubble(ctx, x, y - 22, w, 20, { fill: '#ffffff', lw: 1.3 });
  ctx.fillStyle = '#2a1a10'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y - 11.5, 180);
}
function nameTag(ctx, x, y, text, color) {
  ctx.font = `11px ${FONT_U}`; const w = ctx.measureText(text).width + 10;
  rr(ctx, x - w / 2, y, w, 15, 4); ctx.fillStyle = color || '#c0392b'; ctx.fill(); ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#fff6d8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 8);
}
function drawPartyBubbles(ctx, p) {
  const m = p.members[0];
  const tb = p.table;
  const bx = tb ? tb.x : (p.members.reduce((s, q) => s + q.x, 0) / p.members.length);
  const topY = tb ? tb.y - 96 * pscale(tb.y) : m.y - 82 * pscale(m.y);
  if (p.label) nameTag(ctx, m.x, m.y - 84 * pscale(m.y) - (p.state === 'order' || p.state === 'wait' ? 0 : 0), p.label, p.type === 'thug' ? '#5a3a2a' : p.type === 'oldman' ? '#5a6a7a' : '#8a5cc4');
  const pr = p.patience / p.patMax;
  switch (p.state) {
    case 'queue': case 'arrive': {
      if (p.state === 'arrive' && p.t < 1.2) break;
      if (!p.tea) {
        bubble(ctx, bx, topY - 2, 32, 26, { wiggle: pr < 0.45 });
        drawIcon(ctx, 'teacup', bx, topY + 11, 20);
        addHit(bx - 18, topY - 4, 36, 34, () => clickParty(p), 'tea');
      }
      patienceBar(ctx, bx, topY + 32, pr);
      break;
    }
    case 'order':
      bubble(ctx, bx, topY - 6, 34, 30, { wiggle: true, stroke: pr < 0.4 ? '#c0392b' : OUT, lw: 2 });
      drawIcon(ctx, 'order', bx, topY + 9, 22);
      patienceBar(ctx, bx, topY + 32, pr);
      addHit(bx - 20, topY - 8, 40, 46, () => clickParty(p), 'order');
      break;
    case 'wait': {
      const pend = p.orders.filter(o => o.status !== 'served');
      if (pend.length) {
        const w = 10 + pend.length * 20;
        bubble(ctx, bx, topY - 2, w, 26, { fill: '#fff6e0' });
        pend.forEach((o, i) => { ctx.globalAlpha = o.status === 'ready' ? 1 : 0.55; drawIcon(ctx, DISH[o.dish].icon, bx - w / 2 + 15 + i * 20, topY + 11, 19); ctx.globalAlpha = 1; });
      }
      if (pr < 0.7) patienceBar(ctx, bx, topY + 32, pr);
      break;
    }
    case 'trouble': {
      bubble(ctx, m.x, m.y - 100 * pscale(m.y), 56, 24, { fill: '#ffe6e0', stroke: '#c0392b', lw: 2, wiggle: true });
      ctx.fillStyle = '#c0392b'; ctx.font = `14px ${FONT_U}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('闹事！', m.x, m.y - 100 * pscale(m.y) + 12);
      for (let i = 0; i < 6; i++) { circ(ctx, m.x - 15 + i * 6, m.y - 70 * pscale(m.y) - 4, 2.2); ctx.fillStyle = i < p.hits ? '#f3c34f' : 'rgba(40,20,10,.5)'; ctx.fill(); }
      p.members.forEach(mm => addHit(mm.x - 18, mm.y - 70, 36, 72, () => clickParty(p), 'thug'));
      addHit(m.x - 30, m.y - 104 * pscale(m.y), 60, 30, () => clickParty(p), 'thug');
      break;
    }
    case 'sneak': case 'steal':
      if (m.x > 120) { ctx.globalAlpha = 0.6 + Math.sin(R.t * 6) * 0.3; ctx.fillStyle = '#fff3c4'; ctx.font = `16px ${FONT_U}`; ctx.textAlign = 'center'; ctx.fillText(p.state === 'steal' ? '嘿嘿…' : '?', m.x, m.y - 70); ctx.globalAlpha = 1; }
      addHit(m.x - 18, m.y - 66, 36, 70, () => clickParty(p), 'thief');
      break;
    case 'dash':
      if (!p.dashDone) { nameTag(ctx, m.x, m.y - 84, '吃霸王餐！', '#c0392b'); p.members.forEach(mm => addHit(mm.x - 20, mm.y - 70, 40, 74, () => clickParty(p), 'dash')); }
      break;
  }
}
function drawBubbles(ctx) {
  W.parties.forEach(p => drawPartyBubbles(ctx, p));
  // 脏桌子
  W.tables.forEach(tb => {
    if (tb.dirty && !tb.party) {
      const sc = pscale(tb.y), y = tb.y - 60 * sc;
      bubble(ctx, tb.x, y - 4, 30, 26, { fill: '#f2fbff' });
      drawIcon(ctx, 'broom', tb.x, y + 9, 20);
      addHit(tb.x - 32, y - 6, 64, 70, () => clickTable(tb), 'clean');
    }
  });
  // 铜钱
  W.coins.forEach(c => {
    const yy = c.y + Math.sin(R.t * 5 + c.bob) * 2;
    ctx.fillStyle = 'rgba(255,220,100,.35)'; circ(ctx, c.x, yy, 15); ctx.fill();
    drawIcon(ctx, 'coins', c.x, yy, 24);
    addHit(c.x - 18, yy - 18, 36, 36, () => { collectCoin(c); W.coins = W.coins.filter(x => x !== c); }, 'coin');
  });
  // 灶台加火
  W.agents.forEach(a => {
    if (a.role === 'cook' && a.cook) {
      const p = 1 - a.cook.left / a.cook.total;
      const x = a.x + 22, y = a.y - 86 * pscale(a.y);
      rr(ctx, x - 16, y, 32, 5, 2.5); ctx.fillStyle = 'rgba(40,20,10,.6)'; ctx.fill();
      rr(ctx, x - 15, y + 1, 30 * clamp(p, 0, 1), 3, 1.5); ctx.fillStyle = '#ffb040'; ctx.fill();
      drawIcon(ctx, DISH[a.cook.tk.order.dish].icon, x, y - 10, 16);
      addHit(a.x - 4, a.y - 70, 52, 66, () => clickStove(a), 'stove');
    }
  });
  // 说话
  [...W.agents, W.boss].forEach(a => { if (a.sayT > 0 && a.say) speech(ctx, a.x, a.y - 74 * pscale(a.y), a.say); });
  W.parties.forEach(p => p.members.forEach(m => { if (m.sayT > 0 && m.say) { m.sayT -= 1 / 60; speech(ctx, m.x, m.y - (p.label ? 96 : 78) * pscale(m.y), m.say); } }));
  // 悬停高亮
  if (R.hover) { const hh = R.hover; ctx.save(); ctx.strokeStyle = 'rgba(255,240,160,.9)'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); rr(ctx, hh.x, hh.y, hh.w, hh.h, 8); ctx.stroke(); ctx.restore(); }
}
function drawFx(ctx) {
  for (const f of W.fx) {
    const a = clamp(f.life / f.max, 0, 1);
    switch (f.k) {
      case 'text': {
        ctx.globalAlpha = Math.min(1, a * 2);
        ctx.font = `${f.size}px ${FONT_U}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3.4; ctx.strokeStyle = 'rgba(40,20,8,.85)'; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.c; ctx.fillText(f.text, f.x, f.y);
        ctx.globalAlpha = 1; break;
      }
      case 'dot': ctx.globalAlpha = a; ctx.fillStyle = f.c; circ(ctx, f.x, f.y, 2.2); ctx.fill(); ctx.globalAlpha = 1; break;
      case 'spark': case 'star': {
        ctx.globalAlpha = a; ctx.fillStyle = f.c; ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.life * 8);
        ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 1.4 : 4.5; const an = i * Math.PI / 4; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1; break;
      }
      case 'note': ctx.globalAlpha = a; ctx.fillStyle = f.c; ctx.font = `16px ${FONT_U}`; ctx.textAlign = 'center'; ctx.fillText('♪', f.x, f.y); ctx.globalAlpha = 1; break;
      case 'paper': ctx.save(); ctx.globalAlpha = Math.min(1, a * 1.5); ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.fillStyle = f.c; ctx.fillRect(-4, -2.5, 8, 5); ctx.restore(); ctx.globalAlpha = 1; break;
      case 'coinfly': drawIcon(ctx, 'coin', f.x, f.y, 12); break;
      case 'fly': drawIcon(ctx, f.icon, f.x, f.y, 18); break;
      case 'smoke': ctx.globalAlpha = a * 0.5; ctx.fillStyle = '#d8d0c8'; circ(ctx, f.x, f.y, 5 + (1 - a) * 8); ctx.fill(); ctx.globalAlpha = 1; break;
    }
  }
}
/* 夜色：屋外变暗，屋里点着灯 */
const INSIDE = { x: 118, y: 122, w: 842, h: 454 };
const SIGN_BOX = { x: 440, y: 60, w: 200, h: 66 };
const NIGHT_WINDOWS = [[488, 302, 64, 58], [572, 302, 64, 58], [752, 150, 40, 56], [912, 150, 36, 56]];
const STARS_XY = (() => {
  const a = [];
  for (let i = 0; i < 48; i++) {
    const x = (i * 137 + 23) % 960, y = (i * 53) % 100 + 4;
    const roofY = x > 176 ? 17 : x > 62 ? 26 + (176 - x) * 0.65 : 100;
    if (y < roofY && !(x > 36 && x < 84 && y > 40 && y < 88)) a.push([x, y, (i % 3) * 0.5 + 0.6]);
  }
  return a;
})();
function nightAmt(hr) {
  if (hr < 6.5) return 0.9;
  if (hr < 7.6) return 0.9 * (7.6 - hr) / 1.1;
  if (hr < 17) return 0;
  return clamp((hr - 17) / 3.3, 0, 1);
}
function drawMoon(ctx, alpha) {
  const sx = 58, sy = 64;
  ctx.save(); ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(sx, sy, 8, sx, sy, 42); g.addColorStop(0, 'rgba(255,246,208,.32)'); g.addColorStop(1, 'rgba(255,246,208,0)');
  ctx.fillStyle = g; ctx.fillRect(sx - 42, sy - 42, 84, 84);
  ctx.beginPath(); ctx.rect(sx - 30, sy - 30, 60, 60); ctx.arc(sx + 7, sy - 5, 14, 0, TAU); ctx.clip('evenodd');
  circ(ctx, sx, sy, 16); ctx.fillStyle = '#fff6d0'; ctx.fill();
  ctx.restore();
}
function drawLighting(ctx, hr) {
  const n = nightAmt(hr), rain = W.ev.rain ? 1 : 0;
  if (hr > 15.5 && hr < 19.7) { const t = clamp(1 - Math.abs(hr - 17.6) / 2.1, 0, 1); ctx.fillStyle = `rgba(255,140,50,${0.09 * t})`; ctx.fillRect(0, 0, VW, VH); }
  // 屋外：天色、街道、屋顶一起变暗
  const outA = Math.max(n * 0.6, rain * 0.2);
  if (outA > 0.004) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.rect(INSIDE.x, INSIDE.y, INSIDE.w, INSIDE.h); ctx.clip('evenodd');
    ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.rect(SIGN_BOX.x, SIGN_BOX.y, SIGN_BOX.w, SIGN_BOX.h);
    ctx.fillStyle = `rgba(8,12,38,${outA})`; ctx.fill('evenodd');
    ctx.restore();
    // 招牌在灯笼下，只暗一半
    ctx.fillStyle = `rgba(8,12,38,${outA * 0.4})`; ctx.fillRect(SIGN_BOX.x, SIGN_BOX.y, SIGN_BOX.w, SIGN_BOX.h);
  }
  if (n <= 0.004) return;
  // 屋里：只压一点点暗，再罩一层暖黄，像点了灯
  ctx.fillStyle = `rgba(40,24,36,${n * 0.1})`; ctx.fillRect(INSIDE.x, INSIDE.y, INSIDE.w, INSIDE.h);
  ctx.fillStyle = `rgba(255,170,80,${n * 0.07})`; ctx.fillRect(INSIDE.x, INSIDE.y, INSIDE.w, INSIDE.h);
  // 星星月亮不被压暗
  if (n > 0.5) {
    const sa = (n - 0.5) * 2;
    ctx.fillStyle = `rgba(255,255,230,${0.85 * sa})`;
    STARS_XY.forEach(([x, y, r]) => { circ(ctx, x, y, r * (0.8 + 0.25 * Math.sin(R.t * 2 + x))); ctx.fill(); });
    drawMoon(ctx, sa);
  }
  ctx.globalCompositeOperation = 'lighter';
  // 门里透出的灯光洒在街上
  const dg = ctx.createRadialGradient(122, 524, 6, 122, 524, 132); dg.addColorStop(0, `rgba(255,170,80,${0.42 * n})`); dg.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = dg; ctx.fillRect(0, 392, 120, 208);
  // 各处灯火
  lightList(hr).forEach(([x, y, r]) => { const g = ctx.createRadialGradient(x, y, 2, x, y, r * 1.5); g.addColorStop(0, `rgba(255,175,90,${n * 0.32})`); g.addColorStop(1, 'rgba(255,175,90,0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3); });
  ctx.globalCompositeOperation = 'source-over';
}
function drawRain(ctx) {
  ctx.strokeStyle = 'rgba(200,220,255,.55)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 70; i++) {
    const x = (i * 97 + R.t * 260) % 960, y = (i * 61 + R.t * 520) % 620 - 20;
    if (x > INSIDE.x && x < INSIDE.x + INSIDE.w && y > INSIDE.y && y < INSIDE.y + INSIDE.h) continue;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 12); ctx.stroke();
  }
}

/* ---------- 主绘制 ---------- */
function render(dt) {
  if (!W || !G) return;
  R.t += dt;
  resizeCanvas();
  const ctx = R.ctx;
  ctx.setTransform(R.k, 0, 0, R.k, 0, 0);
  R.hits = [];
  const hr = W.phase === 'morning' ? 7.4 : W.phase === 'night' ? 21.4 : curHour();
  drawSky(ctx, hr);
  ensureStatic();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(R.bg, 0, 0); ctx.setTransform(R.k, 0, 0, R.k, 0, 0);
  drawDynamicBack(ctx, hr);
  const items = [];
  W.tables.forEach(tb => items.push({ y: tb.y, d: () => drawTableGroup(ctx, tb) }));
  W.parties.forEach(p => p.members.forEach(m => { if (m.pose !== 'sit' && m.alpha > 0) items.push({ y: m.y, d: () => drawMember(ctx, m) }); }));
  W.agents.forEach(a => items.push({ y: a.y, d: () => drawAgent(ctx, a) }));
  items.push({ y: W.boss.y, d: () => drawAgent(ctx, W.boss) });
  items.push({ y: GEO.COUNTER.front, d: () => drawCounter(ctx) });
  items.push({ y: GEO.KCOUNTER.front, d: () => drawKitchenCounter(ctx) });
  items.push({ y: 268, d: () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(R.rail, 0, 0); ctx.setTransform(R.k, 0, 0, R.k, 0, 0); } });
  if (G.build.plant) { items.push({ y: 574, d: () => drawPlant(ctx, 306, 574) }); items.push({ y: 574, d: () => drawPlant(ctx, 752, 574) }); }
  if (G.build.lotus) items.push({ y: 590, d: () => drawLotus(ctx, 54, 590) });
  items.sort((a, b) => a.y - b.y);
  items.forEach(it => it.d());
  drawLighting(ctx, hr);
  if (W.ev.rain) drawRain(ctx);
  drawFx(ctx);
  if (W.phase === 'business' || W.phase === 'closing') drawBubbles(ctx);
  if (W.overlay) W.overlay(ctx);
  if (!G.demo && UI.speed === 0 && (W.phase === 'business' || W.phase === 'closing') && !UI.modalOpen && !Dlg.open) {
    ctx.fillStyle = 'rgba(20,10,4,.35)'; ctx.fillRect(0, 0, VW, VH);
    ctx.font = `44px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(40,20,8,.9)'; ctx.strokeText('暂 停 中', 480, 300); ctx.fillStyle = '#fff3c4'; ctx.fillText('暂 停 中', 480, 300);
    ctx.font = `16px ${FONT_U}`; ctx.lineWidth = 4; ctx.strokeText('点上方「正常」继续营业', 480, 340); ctx.fillText('点上方「正常」继续营业', 480, 340);
  }
}
