/* ================= 经营模拟 ================= */
const VW = 960, VH = 600;
const HOUR_SEC = 12, OPEN_H = 7, CLOSE_H = 21, DAY_SEC = (CLOSE_H - OPEN_H) * HOUR_SEC;
const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
function hourName(hr) {
  const k = (hr + 1) % 24; const idx = Math.floor(k / 2); const ke = Math.floor((k - idx * 2) * 4);
  return SHICHEN[idx] + '时' + (ke === 0 ? '' : CN[ke] + '刻');
}

const GEO = {
  DOOR_IN: { x: 146, y: 558 },
  STREET_Y: 562,
  QUEUE: [{ x: 88, y: 560 }, { x: 58, y: 563 }, { x: 28, y: 566 }],
  COUNTER: { x1: 156, x2: 294, top: 420, front: 478 },
  BOSS: { x: 190, y: 448 }, CLERK: { x: 252, y: 448 },
  GUARD: { x: 318, y: 516 },
  WAITER_IDLE: [{ x: 742, y: 520 }, { x: 600, y: 512 }, { x: 452, y: 512 }],
  TABLES: [{ x: 360, y: 550, row: 1 }, { x: 510, y: 550, row: 1 }, { x: 360, y: 474, row: 0 }, { x: 510, y: 474, row: 0 }, { x: 660, y: 550, row: 1 }, { x: 660, y: 474, row: 0 }],
  SEAT_DX: 34, AISLE: 512, FRONT_LANE: 568,
  KCOUNTER: { x1: 784, x2: 960, top: 430, front: 488 },
  STOVES: [818, 870, 922], COOK_Y: 460,
  PICKUP: { x: 768, y: 508 },
  STAGE: { x: 436, y: 420 },
  STAIR_BASE: { x: 760, y: 418 }, STAIR_TOP: { x: 696, y: 258 },
  CORRIDOR_Y: 258,
  ROOM_X: [180, 282, 384, 486, 588, 852],
};

let G = null; // 存档数据
let W = null; // 当日运行数据

/* ---------- 存档与派生数值 ---------- */
function newGame(name, gender) {
  G = {
    v: 1, name: name || '掌柜', gender: gender || 'm', day: 1, money: 300, fame: 0, star: 1,
    menu: ['tea', 'noodle', 'bun', 'peanut'], unlocked: ['tea', 'noodle', 'bun', 'peanut'], dishes: {},
    staff: [], build: {}, quest: 0,
    stats: { served: 0, angry: 0, income: 0, bestDay: 0, researched: 0, thugs: 0, thieves: 0, great: 0, days: 0, lodgers: 0, parties: 0 },
    flags: {}, log: [], hist: [], daily: null, discount: null, seenTips: {},
  };
  BUILDS.forEach(b => { G.build[b.id] = 0; });
  G.staff.push(mkStaff('dashao'), mkStaff('doudou'));
}
function mkStaff(id) { return { id, lv: 1, exp: 0, mood: 76, energy: 100, aff: 0, trained: 0, gifted: 0, chatted: 0, low: 0, sickDay: 0, known: {} }; }
const tableCount = () => 2 + (G ? G.build.table : 0);
const roomCount = () => 1 + (G ? G.build.room : 0);
const stoveCount = () => 1 + (G ? G.build.stove : 0);
function ambience() { let a = 0; BUILDS.forEach(b => { if (b.amb && G.build[b.id]) a += b.amb; }); return a; }
const flowMult = () => 1 + [0, 0.15, 0.35][G.build.sign] + (G.build.flag ? 0.1 : 0);
const comfort = () => [0, 5, 12][G.build.furn];
const cookSpeedMult = () => 1 + [0, 0.12, 0.25][G.build.tools];
const costMult = () => (G.build.cellar ? 0.8 : 1);
const roomPrice = () => ROOM_PRICE[G.build.grade];
const menuSlots = () => MENU_SLOTS[G.star];
const energyMax = () => 4 + G.star;
const dm = id => (G.dishes[id] || (G.dishes[id] = { m: 0, sold: 0 }));
const dishPrice = id => Math.round(DISH[id].price * (1 + dm(id).m / 200));
const staffById = id => G.staff.find(s => s.id === id);
function sstat(s, key) {
  const d = STAFF[s.id]; let v = d.base[key] || 0;
  if (key === ROLES[d.role].stat) v += (s.lv - 1) * 4 + (s.aff >= 80 ? 10 : s.aff >= 40 ? 5 : 0);
  if (key === 'speed') v += (s.lv - 1) * 1.5;
  return Math.round(Math.min(130, v));
}
const sperf = s => (s.mood >= 60 ? 1.06 : s.mood >= 30 ? 1 : 0.82) * (s.energy >= 20 ? 1 : 0.72);
const expNeed = lv => 40 + lv * 35;
function roleCap(role) { return { cook: stoveCount(), waiter: 3, clerk: 1, guard: 1, artist: G.build.stage ? 1 : 0 }[role]; }
const roleCount = role => G.staff.filter(s => STAFF[s.id].role === role).length;

/* ---------- 一天的世界 ---------- */
function newWorld() {
  W = {
    t: 0, phase: 'morning', closeT: 0,
    parties: [], agents: [], tables: [], rooms: [], tickets: [], pass: [], coins: [], fx: [], queue: [],
    en: energyMax(), enT: 0, hint: null,
    today: { served: 0, great: 0, bad: 0, angry: 0, food: 0, tips: 0, rooms: 0, cost: 0, fame: 0, sold: {}, thugs: 0, thieves: 0, lost: 0, parties: 0, missed: 0, lodgers: 0 },
    ev: { flow: 1, lodge: 1, w: {}, rain: false, critic: false, thugs: 0, oldman: false, contest: false, costMul: 1, name: null },
    specials: [], judges: [], sayCD: 0, bossCook: null, idc: 1, anim: 0, staticDirty: true,
  };
  for (let i = 0; i < tableCount(); i++) addTable(i);
  for (let i = 0; i < 6; i++) W.rooms.push({ i, occ: 0 });
  G.staff.forEach(s => { if (s.sickDay !== G.day) W.agents.push(mkAgent(s)); });
  W.boss = { kind: 'boss', look: (G.gender === 'f' ? NPC.boss_f : NPC.boss_m).look, x: GEO.BOSS.x, y: GEO.BOSS.y, facing: 1, pose: 'stand', act: null, expr: 'normal', t: 0, path: [] };
}
function addTable(i) { const g = GEO.TABLES[i]; W.tables.push({ i, x: g.x, y: g.y, row: g.row, party: null, dirty: false, claim: null, mess: 0, flash: 0 }); }
function homeOf(role, idx) {
  switch (role) {
    case 'cook': return { x: GEO.STOVES[idx % 3] - 22, y: GEO.COOK_Y };
    case 'waiter': return GEO.WAITER_IDLE[idx % 3];
    case 'clerk': return GEO.CLERK;
    case 'guard': return GEO.GUARD;
    case 'artist': return GEO.STAGE;
  }
  return { x: 400, y: 520 };
}
function mkAgent(s) {
  const d = STAFF[s.id];
  const idx = W.agents.filter(a => a.role === d.role).length;
  const home = homeOf(d.role, idx);
  return { kind: 'staff', s, d, role: d.role, idx, look: d.look, x: home.x, y: home.y, facing: d.role === 'cook' ? 1 : -1, pose: 'stand', act: null, expr: 'normal', t: rand(0, 10), path: [], task: null, timer: 0, home, holding: null, say: null, sayT: 0, workT: 0, perfT: 0, cook: null };
}
function rehomeAgents() { const cnt = {}; W.agents.forEach(a => { const i = cnt[a.role] = (cnt[a.role] || 0); cnt[a.role]++; a.idx = i; a.home = homeOf(a.role, i); }); }

/* ---------- 移动 ---------- */
function moveAlong(e, dt, speed) {
  if (!e.path.length) return true;
  let rem = speed * dt;
  while (rem > 0 && e.path.length) {
    const p = e.path[0]; const dx = p.x - e.x, dy = p.y - e.y; const d = Math.hypot(dx, dy);
    if (Math.abs(dx) > 0.6) e.facing = dx > 0 ? 1 : -1;
    if (d <= rem) { e.x = p.x; e.y = p.y; rem -= d; e.path.shift(); } else { e.x += dx / d * rem; e.y += dy / d * rem; rem = 0; }
  }
  return !e.path.length;
}
function hallPath(from, to) {
  const pts = [];
  const lane = to.y > 530 || from.y > 530 && to.y > 500 ? GEO.FRONT_LANE : GEO.AISLE;
  if (Math.abs(from.y - to.y) > 14 || Math.abs(from.x - to.x) > 60) { pts.push({ x: from.x, y: lane }); pts.push({ x: to.x, y: lane }); }
  pts.push({ x: to.x, y: to.y });
  return pts;
}
const seatPos = (tb, j) => ({ x: tb.x + (j === 0 ? -1 : 1) * GEO.SEAT_DX * pscale(tb.y), y: tb.y, facing: j === 0 ? 1 : -1 });
const serviceSpot = tb => (tb.row === 0 ? { x: tb.x + 2, y: tb.y + 26 } : { x: tb.x + 2, y: tb.y - 22 });
const pscale = y => (y < 300 ? 0.8 : 0.84 + clamp((y - 412) / 160, 0, 1) * 0.16);
const curHour = () => OPEN_H + W.t / HOUR_SEC;

/* ---------- 客人 ---------- */
function spawnRate(hr) {
  const c = hr < 9 ? 0.65 : hr < 11 ? 0.55 : hr < 13 ? 1.45 : hr < 15 ? 0.65 : hr < 17 ? 0.6 : hr < 19 ? 1.45 : 0.8;
  const fameF = 1 + G.fame / (G.fame + 500);
  return BASE_FLOW[G.star] * c * fameF * flowMult() * W.ev.flow;
}
function pickType() {
  const keys = Object.keys(CTYPES).filter(k => !CTYPES[k].special);
  return weightedPick(keys, k => (CTYPES[k].w[G.star] || 0) * (W.ev.w[k] || 1));
}
function spawnParty(type, opts) {
  opts = opts || {};
  type = type || pickType();
  if (!type) return null;
  const ct = CTYPES[type];
  if (!opts.force && !ct.special && W.queue.length >= 3) { W.today.missed++; return null; }
  const n = opts.size || randi(ct.party[0], ct.party[1]);
  const p = {
    id: W.idc++, type, ct, members: [], state: 'arrive', table: null, patMax: ct.patience, patience: ct.patience, waitTotal: 0,
    tea: false, orders: [], favHits: 0, noFav: false, over: false, disturbed: false, timer: 0, t: 0,
    dash: !ct.special && G.day >= 3 && ['villager', 'swordsman', 'escort'].includes(type) && chance(0.03), special: opts.special || null, label: opts.label || null, hits: 0,
    orderClaim: null, judge: opts.judge != null ? opts.judge : null,
  };
  const svc = bestServe();
  p.patMax = p.patience = ct.patience * (1 + svc / 220);
  for (let j = 0; j < n; j++) {
    const look = opts.look && j === 0 ? opts.look : lookFor(type, j + (opts.judge || 0));
    p.members.push({ look, x: -30 - j * 16, y: GEO.STREET_Y + j * 3, facing: 1, pose: 'walk', act: null, expr: 'normal', t: rand(0, 5), path: [], alpha: 1, seat: j });
  }
  W.parties.push(p);
  if (type === 'thief') { p.state = 'sneak'; p.members.forEach(m => { m.pose = 'sneak'; m.path = [{ x: GEO.DOOR_IN.x, y: 552 }, { x: 236, y: 494 }]; }); return p; }
  if (type === 'thug') {
    p.state = 'barge';
    const tb = freeTable();
    if (tb) { tb.party = p; p.table = tb; }
    const spot = { x: rand(430, 600), y: 522 };
    p.members.forEach((m, j) => {
      const sp = tb ? seatPos(tb, j) : { x: spot.x + j * 30, y: spot.y };
      const lane = tb ? (tb.row ? GEO.FRONT_LANE : GEO.AISLE) : spot.y;
      m.path = [{ x: GEO.DOOR_IN.x, y: GEO.DOOR_IN.y }, { x: sp.x, y: lane }, { x: sp.x, y: sp.y }];
    });
    return p;
  }
  routeArrival(p);
  return p;
}
function routeArrival(p) {
  const tb = freeTable();
  if (tb && !W.queue.length) seatParty(p, tb);
  else { W.queue.push(p); p.state = 'arrive'; layoutQueue(); }
}
function layoutQueue() {
  W.queue.forEach((p, k) => {
    const spot = GEO.QUEUE[Math.min(k, GEO.QUEUE.length - 1)];
    p.members.forEach((m, j) => { m.path = [{ x: spot.x - j * 15 - (k >= GEO.QUEUE.length ? (k - 2) * 20 : 0), y: spot.y + j * 3 }]; m.pose = 'walk'; });
  });
}
function freeTable() { return W.tables.find(tb => !tb.party && !tb.dirty); }
function seatParty(p, tb) {
  tb.party = p; p.table = tb; p.state = 'toTable';
  p.dirtySeat = false;
  p.members.forEach((m, j) => {
    const sp = seatPos(tb, j);
    const lane = tb.row === 1 ? GEO.FRONT_LANE : GEO.AISLE;
    const pts = [];
    if (m.x < GEO.DOOR_IN.x - 4) pts.push({ x: GEO.DOOR_IN.x + j * 6, y: GEO.DOOR_IN.y + j * 2 });
    pts.push({ x: sp.x, y: lane }, { x: sp.x, y: sp.y });
    m.path = pts; m.pose = 'walk';
  });
  Sound.play('door');
}
function leaveQueue(p) { const i = W.queue.indexOf(p); if (i >= 0) { W.queue.splice(i, 1); layoutQueue(); } }
function exitParty(p, mood) {
  p.state = mood === 'run' ? 'dash' : 'leave';
  leaveQueue(p);
  if (p.table) { const tb = p.table; if (tb.party === p) { tb.party = null; if (p.ate) tb.dirty = true; tb.claim = null; } p.table = null; }
  p.members.forEach(m => {
    const pts = [];
    if (m.x > GEO.DOOR_IN.x + 10) { pts.push({ x: m.x, y: m.y > 530 ? GEO.FRONT_LANE : GEO.AISLE }); pts.push({ x: GEO.DOOR_IN.x, y: GEO.DOOR_IN.y }); }
    pts.push({ x: -50, y: GEO.STREET_Y + rand(-2, 4) });
    m.path = pts; m.pose = mood === 'run' ? 'run' : 'walk'; m.act = null;
    if (mood === 'angry') m.expr = 'angry'; else if (mood === 'happy') m.expr = 'happy'; else if (mood === 'sad') m.expr = 'sad';
  });
  W.tickets = W.tickets.filter(tk => tk.party !== p);
}
function fleeParty(p) {
  leaveQueue(p);
  if (p.table) { const tb = p.table; if (tb.party === p) { tb.party = null; tb.claim = null; if (p.ate) tb.dirty = true; } p.table = null; }
  p.state = 'flee';
  p.members.forEach(m => { m.pose = 'run'; m.act = null; m.path = [{ x: m.x, y: m.y > 530 ? GEO.FRONT_LANE : Math.max(m.y, GEO.AISLE) }, { x: GEO.DOOR_IN.x, y: GEO.DOOR_IN.y }, { x: -60, y: GEO.STREET_Y }]; });
}
function angryLeave(p, msg, fameLoss) {
  const lead = p.members[0];
  floatText(lead.x, lead.y - 80, msg, '#e8483a');
  addFame(-fameLoss, lead.x, lead.y - 64);
  W.today.angry++; G.stats.angry++;
  Sound.play('angry');
  exitParty(p, 'angry');
}

function chooseDish(p, prefTag) {
  const ct = p.ct;
  const ok = G.menu.map(id => DISH[id]).filter(d => !d.tags.some(tg => ct.avoid.includes(tg)));
  if (!ok.length) return null;
  return weightedPick(ok, d => {
    let x = 1;
    if (prefTag && d.tags.includes(prefTag)) x *= 6;
    if (d.tags.some(tg => ct.fav.includes(tg))) x *= 4;
    const pr = dishPrice(d.id);
    if (pr > ct.budget) x *= 0.12;
    x *= 1 + Math.min(pr, ct.budget) / 50;
    if (d.secret) x *= 2;
    return x;
  });
}
function takeOrder(p, byBoss) {
  if (p.state !== 'order') return;
  p.state = 'wait';
  const ct = p.ct;
  const dishes = [];
  let fav = 0, over = false, none = false;
  p.members.forEach((m, j) => {
    const d = chooseDish(p, p.special === 'oldman' ? p.want : null);
    if (!d) { none = true; return; }
    dishes.push({ d, j });
    if (d.tags.some(tg => ct.fav.includes(tg))) fav++;
    if (dishPrice(d.id) > ct.budget) over = true;
  });
  if (none || !dishes.length) {
    p.state = 'order';
    const msg = p.type === 'monk' ? '阿弥陀佛，没有素菜……' : '没什么想吃的……';
    angryLeave(p, msg, 1);
    return;
  }
  if (ct.big && chance(0.5)) { const d = chooseDish(p); if (d) dishes.push({ d, j: 0 }); }
  if (p.type === 'judge' || p.type === 'critic') { const d = chooseDish(p); if (d && dishes.length < 2) dishes.push({ d, j: 0 }); }
  p.favHits = fav; p.noFav = fav === 0; p.over = over;
  dishes.forEach(({ d, j }) => {
    const o = { id: W.idc++, dish: d.id, member: j, status: 'pending', q: 0 };
    p.orders.push(o);
    W.tickets.push({ party: p, order: o, t: W.t });
  });
  p.orderClaim = null;
  Sound.play('order');
  if (byBoss) floatText(p.table.x, p.table.y - 84, '掌柜亲自招呼', '#fff3c4', 13);
}

function computeSat(p) {
  const ct = p.ct;
  let s = 55;
  const qs = p.orders.map(o => o.q); const avgQ = qs.length ? qs.reduce((a, b) => a + b, 0) / qs.length : 0.4;
  s += avgQ * 24;
  s += (p.favHits / p.members.length) * 10;
  if (p.noFav) s -= 8;
  if (p.over) s -= 6;
  const amb = ambience() + artistAmb();
  s += Math.min(18, amb / 2.2) - (ct.picky ? 7 : 0);
  s += comfort();
  s += Math.min(10, Math.max(0, (bestServe() - 18) / 5));
  if (ct.art && artistOn()) s += 8;
  s -= Math.max(0, p.waitTotal - 14) * 1.05 * (42 / ct.patience);
  if (p.tea) s += 4;
  if (p.disturbed) s -= 10;
  if (p.dirtySeat) s -= 5;
  if (p.special === 'oldman' && p.orders.some(o => DISH[o.dish].tags.includes(p.want))) s += 15;
  return clamp(Math.round(s), 0, 100);
}
function bestServe() { let b = 12; if (!W) return b; W.agents.forEach(a => { if (a.role === 'waiter') b = Math.max(b, sstat(a.s, 'serve') * sperf(a.s)); }); return b; }
function clerkAgent() { return W.agents.find(a => a.role === 'clerk'); }
function guardAgent() { return W.agents.find(a => a.role === 'guard'); }
function artistAgent() { return W.agents.find(a => a.role === 'artist'); }
function artistOn() { const a = artistAgent(); return !!(a && a.performing); }
function artistAmb() { const a = artistAgent(); return a && a.performing ? sstat(a.s, 'art') / 4 : 0; }

function finishMeal(p) {
  const ct = p.ct; const tb = p.table;
  const sat = computeSat(p);
  p.sat = sat; p.ate = true;
  let amount = 0;
  p.orders.forEach(o => { amount += o.price || dishPrice(o.dish); });
  const clerk = clerkAgent();
  if (clerk) amount = Math.round(amount * (1 + sstat(clerk.s, 'calc') / 650));
  let tip = 0;
  if (sat >= 82) tip = Math.round(amount * (ct.tip + 0.08));
  else if (sat >= 62) tip = Math.round(amount * ct.tip * 0.5);
  const sizeF = 1 + 0.5 * (p.members.length - 1);
  let fame = 0, word = '', col = '#fff3c4', expr = 'happy';
  if (sat >= 82) { fame = 4; word = pick(['赞不绝口！', '好！再来！', '妙极了！', '名不虚传！']); col = '#ffd84a'; W.today.great++; G.stats.great++; }
  else if (sat >= 62) { fame = 2; word = pick(['满意！', '不错不错', '好吃！']); }
  else if (sat >= 45) { fame = 1; word = pick(['还行', '凑合']); expr = 'normal'; }
  else if (sat >= 28) { fame = 0; word = '一般般……'; expr = 'normal'; col = '#e8d8b0'; }
  else { fame = -2; word = pick(['差评！', '什么破店！', '再也不来了！']); col = '#ff7a6a'; expr = 'angry'; W.today.bad++; }
  fame = fame >= 0 ? Math.round(fame * sizeF * ct.fame) : Math.round(fame * Math.max(1, ct.fame / 2));
  if (p.type === 'judge') W.judges.push(sat);
  p.members.forEach(m => { m.expr = expr; m.act = null; });
  W.today.served += p.members.length; G.stats.served += p.members.length;
  W.today.parties++; G.stats.parties++;
  if (p.type === 'critic') {
    const r = sat >= 82 ? '「此店当为落霞镇第一！」' : sat >= 62 ? '「有几分功夫。」' : sat >= 45 ? '「平平无奇。」' : '「难以下咽！」';
    say(p.members[0], r, 3);
    logEvent(`美食家白老饕点评：${r}`);
  }
  if (p.dash) {
    const catcher = (clerk && chance(sstat(clerk.s, 'calc') / 140)) ? clerk : (guardAgent() && chance(sstat(guardAgent().s, 'martial') / 160)) ? guardAgent() : null;
    if (catcher) { say(catcher, catcher.role === 'clerk' ? '站住！还没给钱呢！' : '……站住。', 2); floatText(tb.x, tb.y - 90, '想吃霸王餐？没门！', '#ffd84a'); }
    else {
      p.dashAmount = amount; p.dashFame = fame; p.dashWord = word;
      floatText(tb.x, tb.y - 90, '溜了溜了～', '#ff9a6a');
      exitParty(p, 'run');
      return;
    }
  }
  floatText(tb.x, tb.y - 92, word, col, 15);
  if (fame) addFame(fame, tb.x + 30, tb.y - 70);
  if (sat >= 82) Sound.play('happy'); else if (sat < 28) Sound.play('angry');
  W.coins.push({ x: tb.x, y: tb.y - 58, v: amount, tip, life: 0, auto: clerk ? 0.6 : 3.2, bob: rand(0, 6) });
  p.orders.forEach(o => { const sd = W.today.sold; sd[o.dish] = (sd[o.dish] || 0) + 1; dm(o.dish).sold++; });
  if (p.special === 'oldman') oldmanReward(p, sat);
  // 住店？
  const lodgeP = ct.lodge * W.ev.lodge * (curHour() >= 15 ? 1.3 : 0.55);
  const room = W.rooms.find(r => r.i < roomCount() && !r.occ);
  if (room && W.phase === 'business' && chance(lodgeP)) {
    room.occ = p.members.length; room.party = p; p.room = room; p.state = 'toRoom';
    tb.party = null; tb.dirty = true; tb.claim = null; p.table = null;
    W.today.rooms += roomPrice(); W.today.lodgers += p.members.length;
    floatText(tb.x, tb.y - 108, '住店！', '#9fe0ff', 13);
    p.members.forEach((m, j) => {
      const rx = GEO.ROOM_X[room.i] + (j ? 10 : 0);
      m.path = [{ x: m.x, y: GEO.AISLE }, { x: 748, y: GEO.AISLE }, { x: GEO.STAIR_BASE.x, y: GEO.STAIR_BASE.y }, { x: GEO.STAIR_TOP.x, y: GEO.STAIR_TOP.y }, { x: rx, y: GEO.CORRIDOR_Y }];
      m.pose = 'walk'; m.act = null;
    });
  } else exitParty(p, sat >= 62 ? 'happy' : sat < 28 ? 'angry' : 'calm');
}

function addFame(n, x, y) {
  if (!n) return;
  G.fame = Math.max(0, G.fame + n); W.today.fame += n;
  if (x != null) floatText(x, y, (n > 0 ? '+' : '') + n + ' 名气', n > 0 ? '#ff9a7a' : '#a8a8b8', 13, 'flower');
}
function gainMoney(n, x, y, label) {
  G.money += n;
  if (x != null) floatText(x, y, (label || '') + '+' + n + '文', '#ffd84a', 15, 'coin');
  UI.hudPulse('money');
}

/* ---------- 每帧更新 ---------- */
function updateWorld(dt) {
  W.anim += dt;
  const biz = W.phase === 'business' || W.phase === 'closing';
  if (biz) {
    W.t += dt;
    if (W.phase === 'business') {
      if (W.t >= DAY_SEC) beginClosing();
      else spawnTick(dt);
    } else {
      W.closeT += dt;
      const busy = W.parties.some(p => p.table || p.state === 'toTable');
      if (!busy && W.closeT > 2.5) endDay();
      else if (W.closeT > 28) { forceFinish(); }
    }
    updateParties(dt);
    updateAgents(dt);
    updateKitchen(dt);
    updateCoins(dt);
    W.enT += dt;
    if (W.enT >= 6) { W.enT = 0; if (W.en < energyMax()) { W.en++; UI.hud(); } }
  } else {
    updateAgentsIdle(dt);
  }
  updateFx(dt);
}
function spawnTick(dt) {
  const hr = curHour();
  if (chance(spawnRate(hr) * dt / HOUR_SEC)) spawnParty();
  for (const sp of W.specials) {
    if (!sp.done && hr >= sp.hour) { sp.done = true; const p = spawnParty(sp.type, Object.assign({ force: true }, sp.opts || {})); if (p && sp.onSpawn) sp.onSpawn(p); }
  }
  if (G.star >= 2 && W.today.thieves < 1 && chance(dt / HOUR_SEC * 0.03 * G.star)) { W.today.thieves++; spawnParty('thief', { force: true }); }
  if (G.star >= 2 && W.today.thugs < 1 && chance(dt / HOUR_SEC * 0.012 * G.star)) { W.today.thugs++; spawnParty('thug', { force: true }); }
}
function beginClosing() {
  W.phase = 'closing'; W.closeT = 0;
  Sound.play('gong');
  floatText(480, 330, '打 烊 咯', '#fff3c4', 30);
  [...W.queue].forEach(p => { say(p.members[0], '明儿再来！', 1.6); exitParty(p, 'calm'); });
  W.parties.forEach(p => { if (p.state === 'arrive') exitParty(p, 'calm'); if ((p.type === 'thug' || p.type === 'thief') && p.state !== 'flee') fleeParty(p); });
  UI.onPhase();
}
function forceFinish() {
  [...W.parties].forEach(p => {
    if (!p.table || p.state === 'leave' || p.state === 'dash') return;
    if (p.type === 'thug') { exitParty(p, 'calm'); return; }
    if (p.state === 'eat') { finishMeal(p); return; }
    if (p.state === 'wait' && p.orders.length) {
      p.orders.forEach(o => { if (o.status !== 'served') { o.status = 'served'; o.q = o.q || 0.45; o.price = o.price || dishPrice(o.dish); } });
      finishMeal(p); return;
    }
    exitParty(p, 'calm');
  });
  W.tickets = []; W.pass = [];
  W.agents.forEach(a => { if (a.task) releaseTask(a); a.cook = null; });
  W.coins.forEach(c => collectCoin(c, true)); W.coins = [];
  W.closeT = 0; W.forced = true;
  setTimeout(() => { if (W && W.phase === 'closing') endDay(); }, 400);
}
function updateParties(dt) {
  for (const p of W.parties) {
    p.t += dt;
    p.members.forEach(m => { m.t += dt; });
    const closing = W.phase === 'closing';
    switch (p.state) {
      case 'arrive': {
        let all = true; p.members.forEach(m => { if (!moveAlong(m, dt, 78)) all = false; else m.pose = 'stand'; });
        if (all) p.state = 'queue';
        p.waitTotal += dt * 0.3;
        break;
      }
      case 'queue': {
        p.members.forEach(m => { if (moveAlong(m, dt, 70)) { m.pose = 'stand'; m.facing = 1; } });
        if (W.queue[0] === p) { const tb = freeTable(); if (tb) { leaveQueue(p); seatParty(p, tb); break; } }
        if (!closing) { p.patience -= dt; p.waitTotal += dt; }
        if (p.patience < p.patMax * 0.35) p.members.forEach(m => { m.expr = 'sad'; });
        if (p.patience <= 0) { leaveQueue(p); angryLeave(p, '等这么久，走了！', 1); }
        break;
      }
      case 'toTable': {
        let all = true;
        p.members.forEach((m, j) => {
          if (moveAlong(m, dt, 80)) { const sp = seatPos(p.table, j); m.pose = 'sit'; m.facing = sp.facing; m.expr = 'normal'; } else { all = false; m.pose = 'walk'; }
        });
        if (all) { p.state = 'order'; p.timer = 0; }
        break;
      }
      case 'barge': {
        let all = true;
        p.members.forEach((m, j) => {
          if (moveAlong(m, dt, 86)) { if (p.table) { const sp = seatPos(p.table, j); m.pose = 'sit'; m.facing = sp.facing; } else { m.pose = 'stand'; m.facing = j ? -1 : 1; } } else { all = false; m.pose = 'walk'; }
        });
        if (all) { p.state = 'trouble'; p.timer = 0; say(p.members[0], pick(['小二！拿酒来！不给钱！', '这店谁罩着的？', '都给我让开！']), 2.4); markDisturb(); Sound.play('angry'); }
        break;
      }
      case 'order':
        if (!closing) { p.patience -= dt * 0.7; p.waitTotal += dt; }
        if (p.patience < p.patMax * 0.35) p.members.forEach(m => { m.expr = 'sad'; });
        if (p.patience <= 0) angryLeave(p, '没人招呼，走了！', 3);
        break;
      case 'wait':
        if (!closing) { p.patience -= dt * 0.55; p.waitTotal += dt; }
        if (p.patience < p.patMax * 0.3) p.members.forEach(m => { m.expr = 'sad'; });
        if (p.patience <= 0) { angryLeave(p, '菜也太慢了！', 3); break; }
        if (p.orders.length && p.orders.every(o => o.status === 'served')) {
          p.state = 'eat'; p.timer = (3.5 + p.orders.length * 1.4) * (closing ? 0.5 : 1);
          p.members.forEach(m => { m.act = 'eat'; m.expr = 'eat'; });
        }
        break;
      case 'eat':
        p.timer -= dt * (closing ? 2 : 1);
        if (p.timer <= 0) finishMeal(p);
        break;
      case 'leave': case 'dash': {
        let gone = true;
        p.members.forEach(m => { if (!moveAlong(m, dt, p.state === 'dash' ? 175 : 82)) gone = false; });
        if (gone) p.gone = true;
        if (p.state === 'dash' && p.members[0].x < 0 && !p.dashDone) {
          p.dashDone = true; W.today.dashLoss = (W.today.dashLoss || 0) + (p.dashAmount || 0);
          toast(`有客人吃了霸王餐，跑了！（损失 ${p.dashAmount} 文）`, 'bad');
        }
        break;
      }
      case 'toRoom': {
        let all = true;
        p.members.forEach(m => { if (!moveAlong(m, dt, 80)) all = false; else { m.alpha -= dt * 2; m.pose = 'stand'; m.facing = -1; } });
        if (all && p.members.every(m => m.alpha <= 0)) { p.gone = true; G.stats.lodgers += p.members.length; Sound.play('door'); }
        break;
      }
      case 'trouble': {
        p.timer += dt;
        p.members.forEach(m => { m.expr = 'angry'; m.act = Math.sin(p.t * 3) > 0.3 ? 'talk' : null; });
        if (Math.floor(p.timer / 3.2) !== Math.floor((p.timer - dt) / 3.2)) {
          markDisturb();
          const m = p.members[0]; burst(m.x + rand(-20, 20), m.y - 30, 6, '#f6efe0');
          Sound.play('hit');
          say(m, pick(['砸了这破店！', '哼！', '谁敢管老子？', '拿钱来！']), 1.6);
        }
        if (p.timer > 24) {
          const loss = Math.min(G.money, 30 + G.star * 10);
          G.money -= loss; W.today.lost += loss;
          addFame(-4, p.members[0].x, p.members[0].y - 70);
          toast(`地痞砸了店，抢走 ${loss} 文！请个护院吧`, 'bad');
          if (p.table) p.table.mess = 1;
          p.ate = true; exitParty(p, 'calm'); p.members.forEach(m => { m.expr = 'sly'; });
        }
        break;
      }
      case 'sneak': {
        const m = p.members[0];
        if (moveAlong(m, dt, 46)) { p.state = 'steal'; p.timer = 0; m.act = 'calc'; m.facing = -1; }
        break;
      }
      case 'steal': {
        p.timer += dt;
        if (p.timer > 3.2) {
          const loss = Math.min(G.money, Math.round(20 + G.money * 0.06));
          G.money -= loss; W.today.lost += loss; UI.hud();
          floatText(p.members[0].x, p.members[0].y - 80, `-${loss}文`, '#ff7a6a', 15);
          toast(`柜台被小毛贼摸走了 ${loss} 文！`, 'bad');
          fleeParty(p); p.members.forEach(m => { m.expr = 'sly'; });
        }
        break;
      }
      case 'flee': {
        let gone = true; p.members.forEach(m => { if (!moveAlong(m, dt, 190)) gone = false; });
        if (gone) p.gone = true;
        break;
      }
    }
    if (p.special === 'oldman' && p.vanish) { p.members.forEach(m => { m.alpha -= dt * 1.5; }); if (p.members[0].alpha <= 0) p.gone = true; }
  }
  W.parties = W.parties.filter(p => !p.gone);
}
function markDisturb() { W.parties.forEach(q => { if (q.table && q.type !== 'thug') { q.disturbed = true; q.patience -= 4; } }); }

/* ---------- 后厨 ---------- */
function updateKitchen(dt) {
  const cooks = W.agents.filter(a => a.role === 'cook');
  if (!cooks.length) {
    // 没有厨子：掌柜亲自下厨，很慢
    if (!W.bossCook && W.tickets.length) { const tk = W.tickets.shift(); W.bossCook = { tk, left: DISH[tk.order.dish].time * 2.2 }; if (!G.seenTips.bossCook) { G.seenTips.bossCook = 1; toast('没有厨子，掌柜只好亲自下厨……出菜很慢，快去招个厨子！', 'bad'); } }
    if (W.bossCook) { W.bossCook.left -= dt; if (W.bossCook.left <= 0) { plateDish(W.bossCook.tk, 0.25, 15); W.bossCook = null; } }
  }
}
function plateDish(tk, cookStat, mGain) {
  const o = tk.order, p = tk.party;
  const d = DISH[o.dish];
  W.today.cost += Math.round(d.cost * costMult() * W.ev.costMul);
  const md = dm(o.dish);
  o.q = clamp(0.2 + cookStat / 190 + md.m / 260 + rand(-0.08, 0.08), 0, 1);
  o.price = dishPrice(o.dish);
  md.m = Math.min(100, md.m + mGain);
  if (!p.table || p.state !== 'wait') return; // 客人走了，菜白做
  o.status = 'ready';
  const slot = W.pass.length;
  W.pass.push({ id: W.idc++, party: p, order: o, x: 798 + (slot % 4) * 19, y: 424 - Math.floor(slot / 4) * 9, claim: null, t: 0, fly: null });
  Sound.play('dish');
}
function relayoutPass() { W.pass.forEach((ps, i) => { ps.x = 798 + (i % 4) * 19; ps.y = 424 - Math.floor(i / 4) * 9; }); }

/* ---------- 伙计 ---------- */
function say(e, text, dur) { e.say = text; e.sayT = dur || 1.8; }
function staffSay(a, kind, p) {
  if (W.sayCD > 0 || !chance(p == null ? 0.3 : p)) return;
  const ls = a.d.lines[kind]; if (!ls) return;
  say(a, pick(ls), 1.8); W.sayCD = 2.2;
}
function updateAgentsIdle(dt) {
  [...W.agents, W.boss].forEach(a => {
    a.t += dt; if (a.sayT > 0) a.sayT -= dt;
    if (a.path.length) { a.pose = 'walk'; if (moveAlong(a, dt, 90)) a.pose = 'stand'; }
    if (a.role === 'guard' && a.d && a.s.id === 'laomao') a.act = 'sleep';
    else if (a.kind === 'staff') a.act = null;
  });
}
function updateAgents(dt) {
  W.sayCD -= dt;
  const b = W.boss; b.t += dt; if (b.sayT > 0) b.sayT -= dt;
  b.act = W.coins.length ? 'calc' : null; b.expr = W.today.angry > W.today.great + 2 ? 'sad' : 'normal';
  for (const a of W.agents) {
    a.t += dt; if (a.sayT > 0) a.sayT -= dt;
    const s = a.s; const perf = sperf(s);
    const spd = (68 + sstat(s, 'speed') * 1.3) * perf;
    const working = a.task || a.cook || a.performing || a.fight;
    if (working) { s.energy = Math.max(0, s.energy - dt * 0.32); a.workT += dt; }
    switch (a.role) {
      case 'waiter': updateWaiter(a, dt, spd); break;
      case 'cook': updateCook(a, dt, perf); break;
      case 'clerk': a.act = W.coins.length || a.t % 9 < 3 ? 'calc' : null; break;
      case 'guard': updateGuard(a, dt, spd); break;
      case 'artist': updateArtist(a, dt); break;
    }
  }
}
function releaseTask(a) {
  const tk = a.task; if (!tk) return;
  if (tk.type === 'order' && tk.party) tk.party.orderClaim = null;
  if (tk.type === 'clean' && tk.table) tk.table.claim = null;
  if (tk.type === 'deliver' && tk.ps) tk.ps.claim = null;
  a.task = null; a.holding = null; a.act = null;
}
function findWaiterTask(a) {
  let best = null, bs = -1e9;
  const consider = (score, task, pt) => { const s2 = score - dist(a.x, a.y, pt.x, pt.y) / 9; if (s2 > bs) { bs = s2; best = task; } };
  W.pass.forEach(ps => { if (!ps.claim && !ps.fly && ps.party.table) consider(100 + ps.t * 3, { type: 'deliver', ps, stage: 'pickup' }, GEO.PICKUP); });
  W.parties.forEach(p => { if (p.state === 'order' && !p.orderClaim && p.table) consider(92 + p.t * 0.3 + (p.patMax - p.patience) * 1.2, { type: 'order', party: p }, serviceSpot(p.table)); });
  W.tables.forEach(tb => { if (tb.dirty && !tb.claim && !tb.party) consider(60 + (W.queue.length ? 34 : 0), { type: 'clean', table: tb }, serviceSpot(tb)); });
  return best;
}
function updateWaiter(a, dt, spd) {
  if (!a.task) {
    a.retry = (a.retry || 0) - dt;
    if (a.retry <= 0) {
      a.retry = 0.15;
      const tk = findWaiterTask(a);
      if (tk) {
        a.task = tk;
        if (tk.type === 'deliver') { tk.ps.claim = a; a.path = hallPath(a, GEO.PICKUP); }
        if (tk.type === 'order') { tk.party.orderClaim = a; a.path = hallPath(a, serviceSpot(tk.party.table)); }
        if (tk.type === 'clean') { tk.table.claim = a; a.path = hallPath(a, serviceSpot(tk.table)); }
      }
    }
    if (!a.task) {
      if (!a.path.length && dist(a.x, a.y, a.home.x, a.home.y) > 4) a.path = hallPath(a, a.home);
      if (a.path.length) { a.pose = 'walk'; moveAlong(a, dt, spd * 0.7); } else { a.pose = 'stand'; a.act = null; a.facing = -1; }
      return;
    }
  }
  const tk = a.task;
  // 任务失效检查
  if (tk.type === 'order' && (tk.party.state !== 'order' || !tk.party.table)) { releaseTask(a); return; }
  if (tk.type === 'clean' && (!tk.table.dirty || tk.table.party)) { releaseTask(a); return; }
  if (tk.type === 'deliver' && (!W.pass.includes(tk.ps) && tk.stage === 'pickup' || !tk.ps.party.table)) { if (tk.stage === 'carry') W.pass = W.pass.filter(x => x !== tk.ps); releaseTask(a); return; }
  if (a.path.length) { a.pose = 'walk'; a.act = a.holding ? 'hold' : null; moveAlong(a, dt, spd); return; }
  a.pose = 'stand';
  switch (tk.type) {
    case 'order':
      a.facing = tk.party.table.x >= a.x ? 1 : -1; a.act = 'write'; a.timer += dt;
      if (a.timer >= 0.9) { a.timer = 0; takeOrder(tk.party); staffSay(a, 'work', 0.35); a.task = null; a.act = null; gainExp(a, 2); }
      break;
    case 'clean':
      a.act = 'wipe'; a.facing = tk.table.x >= a.x ? 1 : -1; a.timer += dt;
      if (a.timer >= 1.2) { a.timer = 0; cleanTable(tk.table); a.task = null; a.act = null; gainExp(a, 1); }
      break;
    case 'deliver':
      if (tk.stage === 'pickup') {
        W.pass = W.pass.filter(x => x !== tk.ps); relayoutPass();
        a.holding = DISH[tk.ps.order.dish].icon; tk.stage = 'carry'; a.act = 'hold';
        a.path = hallPath(a, serviceSpot(tk.ps.party.table));
      } else {
        serveOrder(tk.ps); a.holding = null; a.act = null; a.task = null; staffSay(a, 'work', 0.3); gainExp(a, 2);
      }
      break;
  }
}
function serveOrder(ps) {
  const o = ps.order; o.status = 'served';
  const tb = ps.party.table;
  if (tb) { tb.flash = 0.3; }
  Sound.play('pop');
}
function cleanTable(tb) { tb.dirty = false; tb.mess = 0; tb.claim = null; burst(tb.x, tb.y - 30, 8, '#ffffff', 'spark'); Sound.play('wipe'); }
function gainExp(a, n) { a.s.exp += n; }

function updateCook(a, dt, perf) {
  a.facing = 1;
  if (!a.cook) {
    a.act = null;
    if (W.tickets.length) {
      const tk = W.tickets.shift();
      const cs = sstat(a.s, 'cook');
      const time = DISH[tk.order.dish].time * Math.max(0.42, 1.38 - cs / 115) / cookSpeedMult() / perf;
      a.cook = { tk, left: time, total: time };
      tk.order.status = 'cooking';
      if (chance(0.25)) Sound.play('sizzle');
    }
    return;
  }
  a.act = 'cook';
  a.cook.left -= dt;
  if (a.cook.left <= 0) {
    const cs = sstat(a.s, 'cook');
    plateDish(a.cook.tk, cs * sperf(a.s), 1 + cs / 45);
    gainExp(a, 2); staffSay(a, 'work', 0.25);
    a.cook = null;
  }
}
function updateGuard(a, dt, spd) {
  const sleepy = a.s.id === 'laomao';
  if (!a.target) {
    const thug = W.parties.find(p => p.state === 'trouble' && !p.guarded);
    const thief = W.parties.find(p => (p.state === 'sneak' || p.state === 'steal') && !p.guarded && p.members[0].x > 160);
    const tgt = thug || (thief && chance(dt * sstat(a.s, 'martial') / 70) ? thief : null);
    if (tgt) {
      a.target = tgt; tgt.guarded = a;
      const m = tgt.members[0];
      a.path = hallPath(a, { x: m.x - 24, y: Math.max(m.y, 480) + 4 });
      a.act = null; if (sleepy) say(a, '……吵死了。', 1.4);
    } else {
      if (!a.path.length && dist(a.x, a.y, a.home.x, a.home.y) > 4) a.path = hallPath(a, a.home);
      if (a.path.length) { a.pose = 'walk'; moveAlong(a, dt, spd * 0.7); a.act = null; } else { a.pose = 'stand'; a.act = sleepy ? 'sleep' : null; a.facing = 1; }
      return;
    }
  }
  const p = a.target;
  if (!W.parties.includes(p) || !['trouble', 'sneak', 'steal', 'barge'].includes(p.state)) { a.target = null; a.fight = 0; a.act = null; return; }
  if (a.path.length) { a.pose = 'walk'; a.act = null; moveAlong(a, dt, spd * (sleepy ? 1.6 : 1.1)); return; }
  a.pose = 'stand'; a.act = 'fight'; a.facing = p.members[0].x >= a.x ? 1 : -1;
  a.fight = (a.fight || 0) + dt;
  if (Math.floor(a.fight * 3) !== Math.floor((a.fight - dt) * 3)) { burst(p.members[0].x, p.members[0].y - 40, 4, '#ffe08a', 'star'); Sound.play('hit'); }
  const need = p.type === 'thief' ? 1.2 : 7 * 50 / sstat(a.s, 'martial');
  if (a.fight >= need) { a.fight = 0; a.target = null; a.act = null; subdue(p, a); gainExp(a, 6); }
}
function subdue(p, by) {
  const m = p.members[0];
  if (p.type === 'thief') {
    W.today.thieves++; G.stats.thieves++;
    gainMoney(20, m.x, m.y - 80, '罚银');
    addFame(2, m.x, m.y - 62);
    floatText(m.x, m.y - 100, '抓到小毛贼！', '#ffd84a', 16);
  } else {
    W.today.thugs++; G.stats.thugs++;
    addFame(3, m.x, m.y - 62);
    floatText(m.x, m.y - 100, '打跑地痞！', '#ffd84a', 16);
    W.parties.forEach(q => { if (q.table && q.type !== 'thug') { q.patience = Math.min(q.patMax, q.patience + 8); } });
  }
  say(m, pick(['你给我等着！', '好汉饶命！', '哎哟哟——']), 1.6);
  Sound.play('catch');
  p.ate = true;
  fleeParty(p);
  p.members.forEach(mm => { mm.expr = 'sad'; });
  if (by && by.kind === 'staff') say(by, by.s.id === 'laomao' ? '喵。' : by.d.lines.work[0], 1.4);
}
function updateArtist(a, dt) {
  if (!G.build.stage) { a.performing = false; a.act = null; return; }
  a.perfT += dt;
  const cyc = a.perfT % 26;
  a.performing = cyc < 20;
  a.act = a.performing ? 'play' : null;
  a.facing = 1;
  if (a.performing && Math.floor(a.perfT * 1.5) !== Math.floor((a.perfT - dt) * 1.5)) W.fx.push({ k: 'note', x: a.x + rand(-6, 16), y: a.y - 60, vx: rand(-8, 8), vy: -26, life: 1.6, max: 1.6, c: pick(['#c0392b', '#3a78a6', '#8a5cc4']) });
  if (a.performing && cyc < dt * 1.5) staffSay(a, 'work', 1);
}

/* ---------- 铜钱 ---------- */
function updateCoins(dt) {
  for (const c of W.coins) { c.life += dt; if (c.life >= c.auto) collectCoin(c); }
  W.coins = W.coins.filter(c => !c.done);
}
function collectCoin(c, silent) {
  if (c.done) return; c.done = true;
  W.today.food += c.v; W.today.tips += c.tip; G.stats.income += c.v + c.tip;
  G.money += c.v + c.tip;
  if (!silent) {
    for (let i = 0; i < 4; i++) W.fx.push({ k: 'coinfly', x: c.x + rand(-6, 6), y: c.y, sx: c.x, sy: c.y, tx: GEO.BOSS.x + 20, ty: GEO.COUNTER.top - 6, life: 0.55 + i * 0.07, max: 0.55 + i * 0.07 });
    floatText(c.x, c.y - 14, '+' + c.v + '文' + (c.tip ? `（赏${c.tip}）` : ''), '#ffd84a', 14);
    Sound.play('coin');
  }
  UI.hud();
}

/* ---------- 特效 ---------- */
function floatText(x, y, text, color, size, icon) { W.fx.push({ k: 'text', x, y, text, c: color || '#fff', size: size || 14, icon, life: 1.5, max: 1.5 }); }
function burst(x, y, n, color, kind) { for (let i = 0; i < n; i++) { const a = rand(0, TAU), v = rand(30, 90); W.fx.push({ k: kind || 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: rand(0.4, 0.8), max: 0.8, c: color }); } }
function confetti(n) { for (let i = 0; i < n; i++) W.fx.push({ k: 'paper', x: rand(100, 900), y: rand(-40, 0), vx: rand(-20, 20), vy: rand(60, 140), rot: rand(0, 6), vr: rand(-6, 6), life: rand(2.5, 4), max: 4, c: pick(['#e8483a', '#f3c34f', '#c0392b', '#ff8a6a']) }); }
function updateFx(dt) {
  for (const f of W.fx) {
    f.life -= dt;
    switch (f.k) {
      case 'text': f.y -= dt * 22; break;
      case 'dot': case 'spark': case 'star': f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 160 * dt; break;
      case 'note': f.x += f.vx * dt + Math.sin(f.life * 6) * 0.4; f.y += f.vy * dt; break;
      case 'paper': f.x += f.vx * dt + Math.sin(f.life * 3) * 0.6; f.y += f.vy * dt; f.rot += f.vr * dt; break;
      case 'coinfly': { const p = 1 - f.life / f.max; f.x = lerp(f.sx, f.tx, easeOut(p)); f.y = lerp(f.sy, f.ty, p) - Math.sin(p * Math.PI) * 50; break; }
      case 'fly': { const p = clamp(1 - f.life / f.max, 0, 1); f.x = lerp(f.sx, f.tx, p); f.y = lerp(f.sy, f.ty, p) - Math.sin(p * Math.PI) * 60; if (f.life <= 0 && f.done) f.done(); break; }
      case 'smoke': f.x += f.vx * dt; f.y += f.vy * dt; break;
    }
  }
  W.fx = W.fx.filter(f => f.life > 0);
}

/* ---------- 掌柜亲自动手（点击） ---------- */
function spendEnergy() {
  if (W.en >= 1) { W.en--; W.enT = Math.min(W.enT, 0); UI.hud(); return true; }
  Sound.play('deny'); toast('掌柜累了，歇口气……（精力会慢慢恢复）'); return false;
}
function clickParty(p) {
  if (W.phase !== 'business' && W.phase !== 'closing') return;
  const m = p.members[0];
  switch (p.state) {
    case 'queue': case 'arrive':
      if (p.tea) { toast('已经上过茶了，再等等空桌'); return; }
      if (!spendEnergy()) return;
      p.tea = true; p.patience = Math.min(p.patMax, p.patience + p.patMax * 0.4);
      p.members.forEach(mm => { mm.expr = 'happy'; });
      floatText(m.x, m.y - 80, '先喝碗茶～', '#c8f0c0', 13); Sound.play('pop');
      break;
    case 'order':
      if (!spendEnergy()) return;
      if (p.orderClaim) { const a = p.orderClaim; releaseTask(a); }
      takeOrder(p, true);
      break;
    case 'trouble':
      p.hits++; Sound.play('hit'); burst(m.x + rand(-10, 10), m.y - 40, 5, '#ffe08a', 'star');
      floatText(m.x + rand(-20, 20), m.y - 86, pick(['出去！', '嘿！', '滚！']), '#fff3c4', 14);
      if (p.hits >= 6) subdue(p, null);
      break;
    case 'sneak': case 'steal':
      subdue(p, null);
      break;
    case 'dash':
      W.today.food += p.dashAmount; G.money += p.dashAmount; G.stats.income += p.dashAmount;
      floatText(m.x, m.y - 80, '站住！给钱！', '#ffd84a', 15);
      addFame(Math.max(1, p.dashFame || 1), m.x, m.y - 62);
      floatText(m.x, m.y - 100, `+${p.dashAmount}文`, '#ffd84a', 14);
      p.state = 'leave'; p.dashDone = true; p.members.forEach(mm => { mm.pose = 'walk'; mm.expr = 'sad'; });
      Sound.play('catch'); UI.hud();
      break;
  }
}
function clickDish(ps) {
  if (ps.fly || !ps.party.table) return;
  if (!spendEnergy()) return;
  if (ps.claim) { releaseTask(ps.claim); }
  ps.claim = 'boss';
  const tb = ps.party.table;
  W.pass = W.pass.filter(x => x !== ps); relayoutPass();
  ps.fly = true;
  W.fx.push({ k: 'fly', icon: DISH[ps.order.dish].icon, sx: ps.x, sy: ps.y, tx: tb.x, ty: tb.y - 34, x: ps.x, y: ps.y, life: 0.45, max: 0.45, done: () => { if (ps.party.table) serveOrder(ps); } });
  Sound.play('click');
}
function clickTable(tb) {
  if (!tb.dirty || tb.party) return;
  if (!spendEnergy()) return;
  if (tb.claim) releaseTask(tb.claim);
  cleanTable(tb);
}
function clickStove(a) {
  if (!a.cook) return;
  if (!spendEnergy()) return;
  a.cook.left = Math.max(0, a.cook.left - 2.5);
  burst(a.x + 30, a.y - 30, 6, '#ffb040', 'spark'); Sound.play('sizzle');
  floatText(a.x + 24, a.y - 80, '加把火！', '#ffb040', 13);
}

/* ---------- 神秘老者 ---------- */
function oldmanReward(p, sat) {
  p.vanish = true;
  const m = p.members[0];
  if (sat < 60) { say(m, '……可惜，可惜。', 2.4); return; }
  const locked = DISHES.filter(d => !G.unlocked.includes(d.id) && d.rc > 0 && d.star <= G.star + 1);
  const r = Math.random();
  if (locked.length && r < 0.45) {
    const d = pick(locked); G.discount = d.id;
    say(m, '小掌柜，这张菜谱残页送你。', 2.6);
    toast(`神秘老者留下一张残页：研发「${d.name}」只需半价！`, 'good');
    logEvent(`神秘老者留下「${d.name}」的菜谱残页`);
  } else if (r < 0.75) {
    const v = randi(120, 260) * G.star; gainMoney(v, m.x, m.y - 90, '老者赏');
    say(m, '好酒，好店。', 2.2);
    logEvent(`神秘老者留下 ${v} 文`);
  } else {
    addFame(20 + G.star * 10, m.x, m.y - 70);
    say(m, '老夫会替你在江湖上美言几句。', 2.6);
    logEvent('神秘老者答应在江湖上替客栈扬名');
  }
}
function logEvent(text) { G.log.unshift({ d: G.day, t: text }); if (G.log.length > 60) G.log.length = 60; }
