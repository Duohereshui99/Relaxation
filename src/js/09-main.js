/* ================= 启动与主循环 ================= */
let lastSaved = null;
function audioKick() {
  if (Sound.init()) { Sound.resume(); if (Sound.musicOn) Sound.startMusic(); }
}
function endDay() {
  if (!W || W.phase === 'night' || G.demo) return;
  W.phase = 'night';
  W.agents.forEach(a => { releaseTask(a); a.cook = null; a.target = null; a.fight = 0; a.performing = false; a.path = []; a.x = a.home.x; a.y = a.home.y; a.act = null; a.pose = 'stand'; });
  W.coins.forEach(c => collectCoin(c, true)); W.coins = [];
  W.parties = []; W.tickets = []; W.pass = []; W.queue = []; W.fx = W.fx.filter(f => f.k === 'paper');
  W.tables.forEach(t => { t.party = null; t.claim = null; });
  UI.onPhase();
  const rep = Flow.settle();
  UI.hud();
  setTimeout(() => Flow.showSummary(rep), 700);
}

/* 标题画面：一间正在营业的客栈 */
function makeDemo() {
  newGame('云小来', 'm'); G.demo = true;
  G.star = 3; G.fame = 520;
  Object.assign(G.build, { table: 4, lantern: 1, plant: 1, scroll: 1, bird: 1, stage: 1, sign: 1, flag: 1, room: 3, furn: 1, stove: 1, lotus: 1 });
  G.menu = ['tea', 'noodle', 'bun', 'pork', 'shaojiu', 'fish', 'cake', 'secret']; G.unlocked = G.menu.slice();
  G.staff = ['dashao', 'doudou', 'afu', 'jiujiu', 'hujiao', 'sanxian', 'shidun'].map(mkStaff);
  newWorld();
  W.phase = 'business'; W.t = HOUR_SEC * 10.4; W.demo = true;
  for (let i = 0; i < 4; i++) spawnParty();
  for (let i = 0; i < 500; i++) updateWorld(0.05);
  W.overlay = drawTitleOverlay;
}
function drawTitleOverlay(ctx) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, 'rgba(20,10,4,.1)'); g.addColorStop(0.55, 'rgba(20,10,4,0)'); g.addColorStop(1, 'rgba(20,10,4,.55)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  const y = 132 + Math.sin(R.t * 1.1) * 3;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(ctx, 262, y + 10, 448, 150, 6); ctx.fill();
  const pg = ctx.createLinearGradient(0, y, 0, y + 150); pg.addColorStop(0, '#fbf1d8'); pg.addColorStop(1, '#ecd6a6');
  ctx.fillStyle = pg; rr(ctx, 256, y, 448, 150, 4); ctx.fill(); ctx.strokeStyle = '#b8945a'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(192,57,43,.55)'; ctx.lineWidth = 1.5; rr(ctx, 268, y + 10, 424, 130, 3); ctx.stroke();
  [[240, y - 8], [704, y - 8]].forEach(([x, yy]) => { const rg = ctx.createLinearGradient(x, 0, x + 16, 0); rg.addColorStop(0, '#4a2611'); rg.addColorStop(0.5, '#8a4f26'); rg.addColorStop(1, '#3a1a0a'); ctx.fillStyle = rg; rr(ctx, x, yy, 16, 166, 6); ctx.fill(); ctx.fillStyle = '#f3c34f'; circ(ctx, x + 8, yy - 2, 6); ctx.fill(); circ(ctx, x + 8, yy + 168, 6); ctx.fill(); });
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `86px ${FONT_D}`;
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,248,230,.9)'; ctx.strokeText('云来客栈', 470, y + 66);
  ctx.fillStyle = '#2a1408'; ctx.fillText('云来客栈', 470, y + 66);
  ctx.save(); ctx.translate(648, y + 44); ctx.rotate(0.08);
  rr(ctx, -20, -30, 40, 60, 4); ctx.fillStyle = '#c0392b'; ctx.fill();
  ctx.fillStyle = '#fbe8c0'; ctx.font = `18px ${FONT_D}`; ctx.fillText('掌', 0, -14); ctx.fillText('柜', 0, 6); ctx.font = `11px ${FONT_D}`; ctx.fillText('之印', 0, 22);
  ctx.restore();
  ctx.font = `22px ${FONT_D}`; ctx.fillStyle = '#8a2118'; ctx.fillText('— 江 湖 客 栈 经 营 记 —', 480, y + 124);
  ctx.restore();
}

function toLogical(e) { const r = R.cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * VW, y: (e.clientY - r.top) / r.height * VH }; }
function hitAt(p, pad) {
  for (let i = R.hits.length - 1; i >= 0; i--) { const q = R.hits[i]; if (p.x >= q.x - pad && p.x <= q.x + q.w + pad && p.y >= q.y - pad && p.y <= q.y + q.h + pad) return q; }
  return null;
}
function bindInput() {
  R.cv.addEventListener('pointerdown', e => {
    audioKick();
    if (Dlg.open) { Dlg.click(); return; }
    if (!G || G.demo || UI.modalOpen) return;
    const p = toLogical(e);
    const q = hitAt(p, 0) || hitAt(p, e.pointerType === 'touch' ? 14 : 4);
    if (q) { q.fn(); UI.hud(); }
  });
  R.cv.addEventListener('pointermove', e => {
    if (!G || G.demo || e.pointerType === 'touch') { R.hover = null; return; }
    const q = hitAt(toLogical(e), 2);
    R.hover = q; R.cv.style.cursor = q ? 'pointer' : 'default';
  });
  R.cv.addEventListener('pointerleave', () => { R.hover = null; });
}

let hudT = 0, tipT = 0, questT = 0, lastFrame = performance.now();
let lastTipAt = 0;
function scanTips() {
  if (!G || G.demo || W.phase !== 'business') return;
  if (performance.now() - lastTipAt < 5500) return;
  const n0 = Object.keys(G.seenTips).length;
  const tipOnce = (k, t) => { if (Object.keys(G.seenTips).length !== n0 || G.seenTips[k]) return; G.seenTips[k] = 1; toast(t); lastTipAt = performance.now(); };
  if (W.parties.some(p => p.state === 'order')) tipOnce('order', '客人要点菜了！跑堂会去招呼；也可以点一下「点菜」气泡亲自招呼。');
  if (W.pass.length) tipOnce('pass', '菜做好了，摆在后厨出菜台上。点一下菜碟可以亲自端过去。');
  if (W.coins.length) tipOnce('coin', '客人吃完留下铜钱，点一下就收进柜台（不点也会自动收）。');
  if (W.tables.some(t => t.dirty && !t.party)) tipOnce('dirty', '桌子脏了，擦干净才能接下一桌。忙不过来就点一下亲自擦。');
  if (W.parties.some(p => p.state === 'sneak' && p.members[0].x > 130)) tipOnce('thief', '有个蒙面人鬼鬼祟祟摸向柜台——快点他！');
  if (W.parties.some(p => p.state === 'trouble')) tipOnce('thug', '地痞闹事！连点他六下就能赶出去，请个护院更省心。');
  if (W.parties.some(p => p.state === 'dash' && !p.dashDone)) tipOnce('dash', '有人吃霸王餐想溜！赶紧点他！');
  if (W.queue.length >= 2) tipOnce('queue', '门外排起队了！点客人头上的茶碗先上碗茶，他们能多等一会儿。');
}
function frame(now) {
  const rdt = Math.min(0.05, (now - lastFrame) / 1000); lastFrame = now;
  try {
    if (W && G) {
      const paused = UI.modalOpen || Dlg.open;
      const sp = G.demo ? 1 : UI.speed;
      if (!paused && sp > 0) { for (let i = 0; i < sp; i++) updateWorld(rdt); if (G.demo && W.t > HOUR_SEC * 13.3) W.t = HOUR_SEC * 10.4; }
      Dlg.tick(rdt);
      render(rdt);
      hudT += rdt; tipT += rdt; questT += rdt;
      if (hudT > 0.25) { hudT = 0; UI.hud(); }
      if (tipT > 0.5) { tipT = 0; scanTips(); }
      if (questT > 1) { questT = 0; checkQuests(); }
    }
  } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}

function boot(data) {
  R.cv = $('#cv'); R.ctx = R.cv.getContext('2d');
  UI.init();
  bindInput();
  window.addEventListener('resize', () => { R.key = ''; });
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => { R.key = ''; _iconCache.clear(); UI.init(); });
  const start = () => {
    if (data && data.save && data.save.v) { G = data.save; newWorld(); UI.showGame(true); if (!G.daily) G.daily = genDaily(); Flow.applyMorningState(); UI.onPhase(); }
    else Flow.toTitle();
    requestAnimationFrame(frame);
  };
  let started = false; const go = () => { if (!started) { started = true; start(); } };
  try {
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load(`40px "Ma Shan Zheng"`, FONT_SAMPLE_D), document.fonts.load(`14px "ZCOOL KuaiLe"`, FONT_SAMPLE_U)]).then(go, go);
      setTimeout(go, 2200);
    } else go();
  } catch (e) { go(); }
}
const FONT_SAMPLE_D = '江湖客栈经营记掌柜之印云来客栈后厨说书台福酒柜待修天地玄黄宇宙天下第一' + DISHES.map(d => d.name).join('');
const FONT_SAMPLE_U = '开张咯打烊赞不绝口好再来妙极了名不虚传满意不错好吃还行凑合一般般差评什么破店再也不来了名气文闹事掌柜亲自招呼加把火住店溜了吃霸王餐抓到小毛贼打跑地痞0123456789+-';

(function () {
  const hot = window.claude && window.claude.hot;
  if (hot && typeof hot.snapshot === 'function') { try { hot.snapshot(() => ({ save: lastSaved })); } catch (e) { /* ignore */ } }
  const run = d => boot(d || {});
  if (hot && typeof hot.ready === 'function') { try { hot.ready(run); } catch (e) { run((hot && hot.data) || {}); } }
  else run((hot && hot.data) || {});
})();
