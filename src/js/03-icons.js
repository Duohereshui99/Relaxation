/* ================= 图标（菜品与界面） ================= */
const OUT = '#3a2214';
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); }
function fs(ctx, fill, stroke, lw) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke !== false) { ctx.strokeStyle = stroke || OUT; ctx.lineWidth = lw || 1.6; ctx.stroke(); } }
function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); }

function plate(ctx, y, w, color) { ell(ctx, 0, y, w, w * 0.32); fs(ctx, color || '#f4f1ea'); ell(ctx, 0, y - 1, w * 0.7, w * 0.2); fs(ctx, null, 'rgba(90,120,170,.45)', 1); }
function bowl(ctx, y, w, color, rim) {
  ctx.beginPath(); ctx.moveTo(-w, y); ctx.quadraticCurveTo(-w * 0.9, y + w * 0.85, 0, y + w * 0.85); ctx.quadraticCurveTo(w * 0.9, y + w * 0.85, w, y); ctx.closePath();
  fs(ctx, color || '#f4f1ea');
  ctx.beginPath(); ctx.moveTo(-w * 0.8, y + w * 0.35); ctx.quadraticCurveTo(0, y + w * 0.5, w * 0.8, y + w * 0.35); ctx.strokeStyle = rim || '#4f7fb8'; ctx.lineWidth = 1.4; ctx.stroke();
}
function steam(ctx, x, y, n) {
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.4;
  for (let i = 0; i < n; i++) { const sx = x + (i - (n - 1) / 2) * 5; ctx.beginPath(); ctx.moveTo(sx, y); ctx.bezierCurveTo(sx - 3, y - 3, sx + 3, y - 5, sx, y - 8); ctx.stroke(); }
}

/* 菜品/物件图标，(x,y) 为中心，s 为边长约 32 的缩放 */
function drawIcon(ctx, id, x, y, s) {
  const k = (s || 32) / 32;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  switch (id) {
    case 'teacup':
      ell(ctx, 0, 9, 13, 4); fs(ctx, '#e8e2d2');
      ctx.beginPath(); ctx.moveTo(-9, -3); ctx.lineTo(9, -3); ctx.lineTo(6, 8); ctx.lineTo(-6, 8); ctx.closePath(); fs(ctx, '#f6f3ea');
      ell(ctx, 0, -3, 9, 2.6); fs(ctx, '#b8a050');
      ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(6, 2); ctx.strokeStyle = '#4f7fb8'; ctx.lineWidth = 1.3; ctx.stroke();
      steam(ctx, 0, -7, 2); break;
    case 'teapot':
      ctx.beginPath(); ctx.moveTo(9, 0); ctx.quadraticCurveTo(16, -2, 15, -8); fs(ctx, null, OUT, 3.5); ctx.beginPath(); ctx.moveTo(9, 0); ctx.quadraticCurveTo(16, -2, 15, -8); fs(ctx, null, '#7a9a6a', 2);
      ell(ctx, 0, 3, 11, 9); fs(ctx, '#8fb07a');
      ctx.beginPath(); ctx.arc(-11, 2, 5, Math.PI * 0.5, Math.PI * 1.5); fs(ctx, null, OUT, 2.2);
      ell(ctx, 0, -6, 6, 2.5); fs(ctx, '#7a9a6a'); circ(ctx, 0, -9, 2); fs(ctx, '#5a7a4a');
      ctx.beginPath(); ctx.moveTo(-6, 4); ctx.quadraticCurveTo(0, 8, 6, 4); ctx.strokeStyle = '#e8f0d8'; ctx.lineWidth = 1.2; ctx.stroke();
      steam(ctx, 15, -11, 1); break;
    case 'noodle':
      bowl(ctx, -1, 14, '#f6f3ea');
      ell(ctx, 0, -1, 13, 3.8); fs(ctx, '#f1d58a', OUT, 1.2);
      ctx.strokeStyle = '#d9b450'; ctx.lineWidth = 1; for (let i = -9; i <= 9; i += 4) { ctx.beginPath(); ctx.moveTo(i, -3); ctx.quadraticCurveTo(i + 2, 0, i, 2); ctx.stroke(); }
      ctx.fillStyle = '#4fa04a'; [[-5, -2], [3, -1], [7, -3], [-1, 0]].forEach(p => { circ(ctx, p[0], p[1], 1.3); ctx.fill(); });
      ctx.beginPath(); ctx.moveTo(6, -4); ctx.lineTo(14, -14); ctx.moveTo(9, -3); ctx.lineTo(17, -12); ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1.6; ctx.stroke();
      steam(ctx, -4, -7, 2); break;
    case 'bun':
      plate(ctx, 8, 14);
      [[-6, 2], [6, 2], [0, -3]].forEach(p => {
        ctx.beginPath(); ctx.moveTo(p[0] - 7, p[1] + 4); ctx.quadraticCurveTo(p[0] - 7, p[1] - 6, p[0], p[1] - 6); ctx.quadraticCurveTo(p[0] + 7, p[1] - 6, p[0] + 7, p[1] + 4); ctx.closePath(); fs(ctx, '#fbf6ea');
        ctx.beginPath(); ctx.moveTo(p[0] - 2, p[1] - 4); ctx.lineTo(p[0], p[1] - 1); ctx.lineTo(p[0] + 2, p[1] - 4); ctx.strokeStyle = '#c8b898'; ctx.lineWidth = 1; ctx.stroke();
      });
      steam(ctx, 0, -11, 2); break;
    case 'peanut':
      plate(ctx, 6, 14);
      ctx.fillStyle = '#c0703a'; ctx.strokeStyle = '#7a3a1a'; ctx.lineWidth = 0.8;
      for (let i = 0; i < 11; i++) { const a = i * 2.4, r = (i % 4) * 2.4; ell(ctx, Math.cos(a) * r, 3 + Math.sin(a) * r * 0.45 - (i % 3), 2.2, 1.6); ctx.fill(); ctx.stroke(); }
      break;
    case 'wine':
      ctx.beginPath(); ctx.moveTo(-3, -12); ctx.lineTo(3, -12); ctx.lineTo(3, -7); ctx.quadraticCurveTo(10, -3, 9, 6); ctx.quadraticCurveTo(8, 12, 0, 12); ctx.quadraticCurveTo(-8, 12, -9, 6); ctx.quadraticCurveTo(-10, -3, -3, -7); ctx.closePath(); fs(ctx, '#f0ead8');
      ctx.beginPath(); ctx.moveTo(-8, 2); ctx.quadraticCurveTo(0, 5, 8, 2); ctx.strokeStyle = '#4f7fb8'; ctx.lineWidth = 1.4; ctx.stroke();
      rr(ctx, -4, -15, 8, 4, 1.5); fs(ctx, '#c0392b');
      ctx.beginPath(); ctx.moveTo(10, 8); ctx.lineTo(16, 8); ctx.lineTo(15, 13); ctx.lineTo(11, 13); ctx.closePath(); fs(ctx, '#f0ead8'); break;
    case 'jar':
      ctx.beginPath(); ctx.moveTo(-6, -11); ctx.lineTo(6, -11); ctx.quadraticCurveTo(14, -6, 13, 3); ctx.quadraticCurveTo(12, 12, 0, 12); ctx.quadraticCurveTo(-12, 12, -13, 3); ctx.quadraticCurveTo(-14, -6, -6, -11); ctx.closePath(); fs(ctx, '#8a5a3a');
      ell(ctx, 0, -11, 7, 2.5); fs(ctx, '#6a4028'); ctx.beginPath(); ctx.moveTo(-7, -13); ctx.quadraticCurveTo(0, -19, 7, -13); ctx.closePath(); fs(ctx, '#c0392b');
      ctx.save(); ctx.rotate(Math.PI / 4); rr(ctx, -5, -5, 10, 10, 1); fs(ctx, '#e8483a', OUT, 1.2); ctx.restore();
      ctx.fillStyle = '#2a1408'; ctx.font = 'bold 8px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('酒', 0, 0.5); break;
    case 'tofu':
      plate(ctx, 6, 14, '#f4f1ea');
      [[-6, 1], [1, 3], [6, -1], [-1, -3]].forEach(p => { rr(ctx, p[0] - 3.5, p[1] - 3.5, 7, 7, 1.5); fs(ctx, '#fffdf2', '#b8b090', 1); });
      ctx.fillStyle = '#3f9a40'; [[-3, 0], [4, 2], [0, -2], [7, 3], [-7, 4]].forEach(p => { circ(ctx, p[0], p[1], 1.3); ctx.fill(); }); break;
    case 'pork':
      plate(ctx, 7, 15);
      [[-6, 2], [2, 4], [7, -1], [-1, -3], [-8, -3]].forEach(p => { rr(ctx, p[0] - 4, p[1] - 4, 8, 7, 2.2); fs(ctx, '#a8402a', '#5a1a0a', 1); ctx.fillStyle = 'rgba(255,220,180,.6)'; ctx.fillRect(p[0] - 3, p[1] - 3, 5, 1.6); });
      ctx.fillStyle = 'rgba(255,255,255,.7)'; circ(ctx, 4, -2, 1); ctx.fill(); break;
    case 'beef':
      plate(ctx, 7, 15);
      for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(-8 + i * 4, 1 - i * 0.8); ctx.rotate(-0.3 + i * 0.12); ell(ctx, 0, 0, 5, 3.4); fs(ctx, '#8a4a30', '#4a2010', 1); ctx.strokeStyle = 'rgba(240,200,170,.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, -1); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = '#4fa04a'; circ(ctx, 9, 4, 1.5); ctx.fill(); break;
    case 'fish':
      ell(ctx, 0, 6, 16, 5.2); fs(ctx, '#f4f1ea'); ell(ctx, 0, 5, 12, 3); fs(ctx, null, 'rgba(90,120,170,.4)', 1);
      ctx.beginPath(); ctx.moveTo(-12, 3); ctx.quadraticCurveTo(-2, -7, 9, 1); ctx.quadraticCurveTo(-2, 8, -12, 3); ctx.closePath(); fs(ctx, '#e0782a');
      ctx.beginPath(); ctx.moveTo(9, 1); ctx.lineTo(15, -4); ctx.lineTo(14, 6); ctx.closePath(); fs(ctx, '#d0682a');
      ctx.fillStyle = OUT; circ(ctx, -8, 1, 1); ctx.fill();
      ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 1; for (let i = -4; i < 6; i += 3) { ctx.beginPath(); ctx.moveTo(i, -2); ctx.lineTo(i - 1, 4); ctx.stroke(); } break;
    case 'cake':
      plate(ctx, 7, 14);
      [[-5, 1], [5, 1], [0, -4]].forEach(p => { rr(ctx, p[0] - 5, p[1] - 4, 10, 7, 1.5); fs(ctx, '#f6d878', '#a8802a', 1); ctx.fillStyle = '#f0a020'; for (let i = 0; i < 3; i++) { circ(ctx, p[0] - 3 + i * 3, p[1] - 3, 0.9); ctx.fill(); } });
      break;
    case 'braise':
      ctx.beginPath(); ctx.moveTo(-13, -2); ctx.lineTo(13, -2); ctx.quadraticCurveTo(13, 11, 0, 11); ctx.quadraticCurveTo(-13, 11, -13, -2); ctx.closePath(); fs(ctx, '#6a4a3a');
      ell(ctx, 0, -2, 13, 3.6); fs(ctx, '#3a2014');
      [[-6, -3], [0, -4], [6, -3], [-2, -1], [4, -1]].forEach(p => { rr(ctx, p[0] - 3, p[1] - 2.5, 6, 4.5, 1.5); fs(ctx, '#9a3a20', '#4a1a0a', 0.8); });
      ctx.beginPath(); ctx.moveTo(-15, 1); ctx.lineTo(-13, 1); ctx.moveTo(13, 1); ctx.lineTo(15, 1); ctx.strokeStyle = OUT; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.fillStyle = '#f3c34f'; circ(ctx, 9, 5, 1.6); ctx.fill(); steam(ctx, 0, -8, 3); break;
    case 'chicken':
      plate(ctx, 8, 15);
      ctx.beginPath(); ctx.moveTo(-11, 5); ctx.quadraticCurveTo(-12, -8, 0, -8); ctx.quadraticCurveTo(12, -8, 11, 5); ctx.closePath(); fs(ctx, '#6a8a3a');
      ctx.strokeStyle = '#4a6a2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 5); ctx.moveTo(-6, -6); ctx.lineTo(-3, 4); ctx.moveTo(6, -6); ctx.lineTo(3, 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, -3); ctx.quadraticCurveTo(0, -9, 5, -3); ctx.quadraticCurveTo(0, 2, -4, -3); fs(ctx, '#d8902a', '#7a4a10', 1); break;
    case 'veggies':
      plate(ctx, 7, 15);
      ctx.fillStyle = '#4fa04a'; [[-7, 1], [-2, -2], [4, 1], [8, -2]].forEach(p => { ell(ctx, p[0], p[1], 4, 2.6); fs(ctx, '#58a84a', '#2a6a2a', 1); });
      [[-3, 3], [5, 4]].forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 3, Math.PI, 0); fs(ctx, '#8a5a3a', '#4a2a1a', 1); });
      rr(ctx, 0, -6, 5, 5, 1); fs(ctx, '#fff8e0', '#b8a880', 0.8); break;
    case 'knuckle':
      plate(ctx, 8, 15);
      ell(ctx, -1, 1, 10, 7.5); fs(ctx, '#9a2a1a');
      ell(ctx, -3, -2, 4, 2); ctx.fillStyle = 'rgba(255,190,160,.45)'; ctx.fill();
      rr(ctx, 7, -4, 9, 4, 2); fs(ctx, '#fbf2dc'); circ(ctx, 16, -4, 2.4); fs(ctx, '#fbf2dc'); circ(ctx, 16, -1, 2.4); fs(ctx, '#fbf2dc');
      ctx.fillStyle = '#4fa04a'; circ(ctx, -8, 6, 1.6); ctx.fill(); break;
    case 'shrimp':
      plate(ctx, 7, 15);
      [[-6, 1], [1, -2], [6, 2], [-1, 4]].forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 3.4, -0.4, Math.PI * 1.3); ctx.strokeStyle = '#f08a6a'; ctx.lineWidth = 3.2; ctx.stroke(); });
      ctx.fillStyle = '#5a9a3a'; [[-3, -3], [4, -4], [8, -1]].forEach(p => { ell(ctx, p[0], p[1], 2.2, 1); ctx.fill(); }); break;
    case 'duck':
      plate(ctx, 8, 15);
      ctx.beginPath(); ctx.moveTo(-12, 4); ctx.quadraticCurveTo(-13, -7, -1, -7); ctx.quadraticCurveTo(10, -7, 12, 0); ctx.quadraticCurveTo(10, 6, -12, 4); ctx.closePath(); fs(ctx, '#d8862a');
      ell(ctx, -4, -3, 5, 2); ctx.fillStyle = 'rgba(255,230,160,.6)'; ctx.fill();
      ctx.fillStyle = '#c0392b'; circ(ctx, 4, 2, 1.4); ctx.fill(); ctx.fillStyle = '#4fa04a'; circ(ctx, -2, 2, 1.3); ctx.fill(); ctx.fillStyle = '#f3c34f'; circ(ctx, 0, 0, 1.2); ctx.fill(); break;
    case 'pot':
      ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(9, -8); ctx.quadraticCurveTo(16, -2, 14, 6); ctx.quadraticCurveTo(12, 12, 0, 12); ctx.quadraticCurveTo(-12, 12, -14, 6); ctx.quadraticCurveTo(-16, -2, -9, -8); ctx.closePath(); fs(ctx, '#7a5a4a');
      ctx.beginPath(); ctx.moveTo(-12, 1); ctx.quadraticCurveTo(0, 5, 12, 1); ctx.strokeStyle = '#f3c34f'; ctx.lineWidth = 1.5; ctx.stroke();
      ell(ctx, 0, -8, 10, 3); fs(ctx, '#5a3a2a'); ctx.beginPath(); ctx.moveTo(-9, -9); ctx.quadraticCurveTo(0, -17, 9, -9); ctx.closePath(); fs(ctx, '#8a6a5a'); circ(ctx, 0, -14, 2); fs(ctx, '#f3c34f');
      steam(ctx, -10, -11, 1); steam(ctx, 11, -11, 1); break;
    /* ---- 界面图标 ---- */
    case 'coin':
      circ(ctx, 0, 0, 13); fs(ctx, '#f3c34f', '#8a5a10', 2.2); circ(ctx, 0, 0, 9.5); fs(ctx, null, '#c08a20', 1.2);
      rr(ctx, -4, -4, 8, 8, 1); fs(ctx, '#8a5a10', '#8a5a10', 1);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(ctx, -6, -6, 3, 1.6); ctx.fill(); break;
    case 'coins':
      for (let i = 0; i < 3; i++) { ell(ctx, (i - 1) * 3, 6 - i * 5, 11, 4.5); fs(ctx, '#f3c34f', '#8a5a10', 1.6); ell(ctx, (i - 1) * 3, 6 - i * 5, 3, 1.4); fs(ctx, '#8a5a10', false); }
      break;
    case 'flower':
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ell(ctx, Math.cos(a) * 7, Math.sin(a) * 7, 6, 6); fs(ctx, '#e8483a', '#8a1a10', 1.4); }
      circ(ctx, 0, 0, 5); fs(ctx, '#f3c34f', '#8a5a10', 1.4); break;
    case 'star':
      ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 14; const a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); fs(ctx, '#f3c34f', '#8a5a10', 1.8); break;
    case 'heart':
      ctx.beginPath(); ctx.moveTo(0, 11); ctx.bezierCurveTo(-16, 0, -10, -14, 0, -5); ctx.bezierCurveTo(10, -14, 16, 0, 0, 11); fs(ctx, '#e04a5a', '#8a1a2a', 1.8); break;
    case 'order':
      rr(ctx, -10, -12, 20, 24, 2); fs(ctx, '#fff8e8');
      ctx.strokeStyle = '#9a7a5a'; ctx.lineWidth = 1.4; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-6, -6 + i * 5); ctx.lineTo(6, -6 + i * 5); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(8, 10); ctx.lineTo(16, -6); ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.moveTo(8, 10); ctx.lineTo(16, -6); ctx.strokeStyle = '#f3c34f'; ctx.lineWidth = 1.6; ctx.stroke(); break;
    case 'broom':
      ctx.beginPath(); ctx.moveTo(8, -14); ctx.lineTo(-2, 4); ctx.strokeStyle = OUT; ctx.lineWidth = 3.5; ctx.stroke(); ctx.strokeStyle = '#b8803a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6, 1); ctx.lineTo(2, 6); ctx.lineTo(-4, 14); ctx.lineTo(-14, 9); ctx.closePath(); fs(ctx, '#e8c060');
      ctx.fillStyle = '#fff'; [[10, 6], [13, 1], [-12, -4]].forEach(p => { ctx.beginPath(); ctx.moveTo(p[0], p[1] - 3); ctx.lineTo(p[0] + 1, p[1]); ctx.lineTo(p[0], p[1] + 3); ctx.lineTo(p[0] - 1, p[1]); ctx.closePath(); ctx.fill(); }); break;
    case 'tea':
      drawIcon(ctx, 'teacup', 0, 0, 32); break;
    case 'menu':
      rr(ctx, -12, -13, 24, 26, 2); fs(ctx, '#c0392b', '#5e150b', 1.8); rr(ctx, -9, -10, 18, 20, 1); fs(ctx, '#fff3d8', '#8a5a2a', 1);
      ctx.fillStyle = '#2a1408'; ctx.font = '12px "Ma Shan Zheng",serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('菜', 0, -3); ctx.font = '7px serif'; ctx.fillText('· 谱 ·', 0, 6); break;
    case 'staff':
      ctx.save(); ctx.translate(0, 13); drawChar(ctx, { x: 0, y: 0, look: STAFF.doudou.look, scale: 0.42, expr: 'happy', noShadow: true }); ctx.restore(); break;
    case 'build':
      ctx.beginPath(); ctx.moveTo(-6, 14); ctx.lineTo(6, -2); ctx.strokeStyle = OUT; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#b8803a'; ctx.lineWidth = 2.6; ctx.stroke();
      rr(ctx, -2, -12, 18, 8, 2); ctx.save(); ctx.translate(7, -8); ctx.rotate(0.8); ctx.translate(-7, 8); rr(ctx, -2, -12, 18, 8, 2); fs(ctx, '#8a8f98'); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(-4, -4); ctx.strokeStyle = OUT; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#d8b878'; ctx.lineWidth = 2.6; ctx.stroke(); break;
    case 'quest':
      rr(ctx, -9, -13, 18, 26, 3); fs(ctx, '#f6e6c0'); ell(ctx, 0, -13, 11, 3); fs(ctx, '#8a5229'); ell(ctx, 0, 13, 11, 3); fs(ctx, '#8a5229');
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(-1, 3); ctx.lineTo(6, -6); ctx.stroke(); break;
    case 'ledger':
      rr(ctx, -12, -12, 24, 24, 2); fs(ctx, '#3a5a8a', '#1a2a4a', 1.8); rr(ctx, -8, -12, 16, 24, 0); ctx.fillStyle = '#f6efe0'; ctx.fillRect(-6, -9, 12, 7); ctx.strokeStyle = '#1a2a4a'; ctx.lineWidth = 1; ctx.strokeRect(-6, -9, 12, 7);
      ctx.fillStyle = '#2a1408'; ctx.font = '7px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('账', 0, -5.5);
      ctx.strokeStyle = '#f3c34f'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-12, 4); ctx.lineTo(12, 4); ctx.stroke(); break;
    case 'gift':
      rr(ctx, -11, -4, 22, 16, 2); fs(ctx, '#c0392b', '#5e150b', 1.8); rr(ctx, -13, -9, 26, 6, 2); fs(ctx, '#e04a3a', '#5e150b', 1.8);
      ctx.fillStyle = '#f3c34f'; ctx.fillRect(-2, -9, 4, 21);
      ctx.beginPath(); ctx.ellipse(-5, -12, 5, 3, -0.4, 0, TAU); fs(ctx, '#f3c34f', '#8a5a10', 1.2); ctx.beginPath(); ctx.ellipse(5, -12, 5, 3, 0.4, 0, TAU); fs(ctx, '#f3c34f', '#8a5a10', 1.2); break;
    case 'zzz':
      ctx.fillStyle = '#5a7ab8'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('z', -6, 6); ctx.font = 'bold 11px sans-serif'; ctx.fillText('z', 2, -1); ctx.font = 'bold 8px sans-serif'; ctx.fillText('z', 8, -7); break;
    default:
      if (BUILD_ICON[id]) BUILD_ICON[id](ctx); else { circ(ctx, 0, 0, 10); fs(ctx, '#ccc'); }
  }
  ctx.restore();
}

/* 装修项目的小图标 */
const BUILD_ICON = {
  table(ctx) { rr(ctx, -14, -6, 28, 5, 1.5); fs(ctx, '#b0703a'); [[-11, -1], [9, -1]].forEach(p => { rr(ctx, p[0], p[1], 3, 13, 1); fs(ctx, '#8a5229'); }); rr(ctx, -18, 3, 8, 3, 1); fs(ctx, '#a0602a'); rr(ctx, 10, 3, 8, 3, 1); fs(ctx, '#a0602a'); },
  chair(ctx) { rr(ctx, -8, -14, 16, 4, 1.5); fs(ctx, '#8a3a2a'); rr(ctx, -7, -10, 2.5, 22, 1); fs(ctx, '#6a2a1a'); rr(ctx, 4.5, -10, 2.5, 22, 1); fs(ctx, '#6a2a1a'); rr(ctx, -10, 1, 20, 4, 1.5); fs(ctx, '#a84a3a'); },
  lantern(ctx) { ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(0, -11); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.stroke(); rr(ctx, -5, -12, 10, 3, 1); fs(ctx, '#3a2214'); ell(ctx, 0, 0, 11, 10); fs(ctx, '#e0402e'); ell(ctx, 0, 0, 5, 10); fs(ctx, null, '#a02010', 1.2); rr(ctx, -5, 9, 10, 3, 1); fs(ctx, '#3a2214'); ctx.strokeStyle = '#f3c34f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, 16); ctx.stroke(); },
  plant(ctx) { ctx.fillStyle = '#4f9a40'; [[-6, -6, -0.5], [0, -10, 0], [6, -6, 0.5], [-3, -2, -0.3], [3, -2, 0.3]].forEach(p => { ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(p[2]); ell(ctx, 0, 0, 3, 8); fs(ctx, '#58a84a', '#2a6a2a', 1.2); ctx.restore(); }); ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(8, 4); ctx.lineTo(6, 14); ctx.lineTo(-6, 14); ctx.closePath(); fs(ctx, '#3a6a9a'); },
  scroll(ctx) { rr(ctx, -9, -13, 18, 25, 1); fs(ctx, '#f6efe0'); ctx.fillStyle = '#7a9a8a'; ctx.beginPath(); ctx.moveTo(-7, 6); ctx.lineTo(-2, -4); ctx.lineTo(2, 2); ctx.lineTo(5, -2); ctx.lineTo(7, 6); ctx.closePath(); ctx.fill(); rr(ctx, -11, -15, 22, 3, 1.5); fs(ctx, '#6a4028'); rr(ctx, -11, 11, 22, 3, 1.5); fs(ctx, '#6a4028'); },
  bird(ctx) { ctx.beginPath(); ctx.moveTo(-10, 12); ctx.lineTo(-10, -2); ctx.quadraticCurveTo(0, -16, 10, -2); ctx.lineTo(10, 12); ctx.closePath(); fs(ctx, 'rgba(255,240,200,.3)', '#8a5229', 1.6); ctx.strokeStyle = '#8a5229'; ctx.lineWidth = 1; for (let i = -6; i <= 6; i += 4) { ctx.beginPath(); ctx.moveTo(i, 12); ctx.lineTo(i, -6); ctx.stroke(); } ell(ctx, 0, 4, 4, 3); fs(ctx, '#c8a050', OUT, 1.2); circ(ctx, 3, 1, 2); fs(ctx, '#c8a050', OUT, 1); },
  stage(ctx) { rr(ctx, -15, 2, 30, 8, 1.5); fs(ctx, '#8a5229'); rr(ctx, -13, -14, 26, 16, 1); fs(ctx, '#c0392b'); ctx.fillStyle = '#f3c34f'; ctx.fillRect(-13, -14, 26, 3); },
  screen(ctx) { for (let i = 0; i < 3; i++) { rr(ctx, -14 + i * 9.5, -12, 9, 24, 1); fs(ctx, '#f6efe0', '#6a2a1a', 1.6); } ctx.fillStyle = '#e06a7a'; circ(ctx, -9, -2, 2); ctx.fill(); circ(ctx, 1, 2, 2); ctx.fill(); ctx.fillStyle = '#4f9a40'; circ(ctx, 10, -4, 2); ctx.fill(); },
  vase(ctx) { ctx.beginPath(); ctx.moveTo(-4, -14); ctx.lineTo(4, -14); ctx.lineTo(3, -9); ctx.quadraticCurveTo(12, -4, 9, 7); ctx.quadraticCurveTo(6, 14, 0, 14); ctx.quadraticCurveTo(-6, 14, -9, 7); ctx.quadraticCurveTo(-12, -4, -3, -9); ctx.closePath(); fs(ctx, '#f6f6fa'); ctx.strokeStyle = '#2a4aa0'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 2, 4, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-8, -3); ctx.lineTo(8, -3); ctx.moveTo(-8, 9); ctx.lineTo(8, 9); ctx.stroke(); },
  stove(ctx) { rr(ctx, -14, -4, 28, 16, 2); fs(ctx, '#a8a098'); ctx.fillStyle = '#3a2a20'; rr(ctx, -6, 2, 12, 8, 3); ctx.fill(); ctx.fillStyle = '#ff8a2a'; ell(ctx, 0, 8, 4, 2.5); ctx.fill(); ell(ctx, 0, -5, 11, 4); fs(ctx, '#3a3a40'); },
  knife(ctx) { ctx.beginPath(); ctx.moveTo(-12, -6); ctx.lineTo(8, -6); ctx.lineTo(8, 6); ctx.lineTo(-10, 6); ctx.quadraticCurveTo(-14, 0, -12, -6); ctx.closePath(); fs(ctx, '#c8ccd4'); rr(ctx, 8, -3, 8, 6, 2); fs(ctx, '#6a4028'); },
  cellar(ctx) { rr(ctx, -13, -10, 26, 22, 2); fs(ctx, '#7a5a3a'); ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 1.2; for (let i = -6; i <= 8; i += 7) { ctx.beginPath(); ctx.moveTo(-13, i); ctx.lineTo(13, i); ctx.stroke(); } circ(ctx, 7, 1, 2); fs(ctx, '#f3c34f'); },
  room(ctx) { rr(ctx, -11, -14, 22, 28, 2); fs(ctx, '#b0703a'); rr(ctx, -7, -10, 14, 9, 1); fs(ctx, '#f6e6c0', '#6a4028', 1.2); ctx.strokeStyle = '#6a4028'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, -1); ctx.moveTo(-7, -5.5); ctx.lineTo(7, -5.5); ctx.stroke(); circ(ctx, 6, 4, 1.5); fs(ctx, '#f3c34f'); },
  bed(ctx) { rr(ctx, -15, -2, 30, 10, 2); fs(ctx, '#c0392b'); rr(ctx, -15, -12, 5, 24, 1.5); fs(ctx, '#8a5229'); rr(ctx, -9, -6, 9, 5, 2); fs(ctx, '#fff8e8'); },
  dorm(ctx) { ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(0, -14); ctx.lineTo(14, -2); ctx.closePath(); fs(ctx, '#5a5f68'); rr(ctx, -11, -2, 22, 15, 1); fs(ctx, '#e8d8b8'); rr(ctx, -3, 4, 6, 9, 1); fs(ctx, '#8a5229'); },
  sign(ctx) { rr(ctx, -15, -9, 30, 18, 2); fs(ctx, '#2a1408'); rr(ctx, -12, -6, 24, 12, 1); fs(ctx, '#c0392b', '#f3c34f', 1.4); ctx.fillStyle = '#f3c34f'; ctx.font = '8px "Ma Shan Zheng",serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('云来', 0, 0.5); },
  flag(ctx) { ctx.beginPath(); ctx.moveTo(-10, -15); ctx.lineTo(-10, 15); ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = '#8a5229'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-9, -13); ctx.lineTo(12, -13); ctx.lineTo(12, 6); ctx.lineTo(6, 3); ctx.lineTo(0, 6); ctx.lineTo(-9, 6); ctx.closePath(); fs(ctx, '#f6efe0'); ctx.fillStyle = '#c0392b'; ctx.font = '11px "Ma Shan Zheng",serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('酒', 2, -4); },
  lotus(ctx) { ctx.beginPath(); ctx.moveTo(-13, -3); ctx.lineTo(13, -3); ctx.quadraticCurveTo(14, 12, 0, 13); ctx.quadraticCurveTo(-14, 12, -13, -3); ctx.closePath(); fs(ctx, '#6a7a8a'); ell(ctx, 0, -3, 13, 3); fs(ctx, '#4a8aa8'); ell(ctx, -5, -4, 5, 2); fs(ctx, '#4f9a40', '#2a6a2a', 1); ctx.beginPath(); ctx.moveTo(4, -4); ctx.lineTo(4, -12); ctx.strokeStyle = '#2a6a2a'; ctx.lineWidth = 1.4; ctx.stroke(); ell(ctx, 4, -13, 4, 3); fs(ctx, '#f8a0b8', '#b04a6a', 1); },
};

const _iconCache = new Map();
function iconURL(id, size) {
  const key = id + '@' + size;
  if (_iconCache.has(key)) return _iconCache.get(key);
  const c = document.createElement('canvas'); const sc = 2;
  c.width = c.height = size * sc;
  const x = c.getContext('2d'); x.scale(sc, sc);
  drawIcon(x, id, size / 2, size / 2, size * 0.92);
  const url = c.toDataURL();
  _iconCache.set(key, url);
  return url;
}
function iconImg(id, size, cls) { return h('img', { src: iconURL(id, size), width: size, height: size, alt: '', class: cls || null }); }
