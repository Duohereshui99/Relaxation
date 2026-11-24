/* ================= 流程、剧情与事件 ================= */
const Flow = {
  /* ---------- 存档 ---------- */
  save(manual) {
    if (!G || G.demo) return;
    const ok = Store.set(SAVE_KEY, G);
    try { lastSaved = JSON.parse(JSON.stringify(G)); } catch (e) { /* ignore */ }
    if (manual) toast(ok ? '进度已保存' : '保存失败：浏览器不让写入本机存储', ok ? 'good' : 'bad');
  },
  load() {
    const g = Store.get(SAVE_KEY, null);
    if (!g || !g.v || !g.staff) return false;
    G = g;
    BUILDS.forEach(b => { if (G.build[b.id] == null) G.build[b.id] = 0; });
    G.seenTips = G.seenTips || {}; G.flags = G.flags || {}; G.log = G.log || []; G.hist = G.hist || [];
    return true;
  },
  hasSave() { const g = Store.get(SAVE_KEY, null); return !!(g && g.v && g.staff); },

  /* ---------- 标题 ---------- */
  toTitle() {
    UI.showGame(false);
    $('#dlg').hidden = true; Dlg.open = false;
    makeDemo();
    const box = $('#title-btns'); box.innerHTML = '';
    const has = this.hasSave();
    if (has) {
      const g = Store.get(SAVE_KEY, null);
      box.appendChild(h('button', { class: 'btn red big', onclick: () => { audioKick(); this.continueGame(); } }, `继续经营（第${cnNum(g.day)}天）`));
    }
    box.appendChild(h('button', { class: 'btn big' + (has ? '' : ' red'), onclick: () => { audioKick(); this.newGameForm(); } }, has ? '重新开张' : '接手客栈'));
    box.appendChild(h('button', { class: 'btn', onclick: () => { audioKick(); UI.modal('游戏说明', null, b => Panels.help.render(b)); } }, '游戏说明'));
  },
  newGameForm() {
    let gender = 'm';
    UI.modal('接手云来客栈', null, body => {
      const inp = h('input', { type: 'text', id: 'f-name', maxlength: 6, value: '云小来', autocomplete: 'off' });
      const opt = (g, label) => {
        const c = h('canvas', { width: 192, height: 192 }); drawPortrait(c, (g === 'f' ? NPC.boss_f : NPC.boss_m).look, 'happy');
        const el = h('button', { class: 'lookopt' + (gender === g ? ' on' : ''), type: 'button', onclick: () => { gender = g; $$('.lookopt', body).forEach(x => x.classList.toggle('on', x === el)); Sound.play('click'); } }, c, label);
        return el;
      };
      body.appendChild(h('p', { class: 'hint' }, '三叔公云游去了，落霞镇东头的云来客栈从今天起归你管。'));
      const old = this.hasSave() ? Store.get(SAVE_KEY, null) : null;
      if (old) body.appendChild(h('p', { class: 'hint', style: 'color:#8a2118' }, `注意：本机已有「${old.name}」掌柜第${cnNum(old.day)}天的存档，重新开张后会被覆盖。`));
      body.appendChild(h('div', { class: 'field' }, h('label', { for: 'f-name' }, '掌柜的名号（最多六个字）'), inp));
      body.appendChild(h('div', { class: 'field' }, h('label', null, '掌柜的模样'), h('div', { class: 'looks' }, opt('m', '少东家'), opt('f', '女掌柜'))));
      const err = h('p', { class: 'hint', style: 'color:#c0392b', hidden: true }, '名号不能为空');
      body.appendChild(err);
      const go = () => { const nm = inp.value.trim().slice(0, 6); if (!nm) { err.hidden = false; return; } UI.close(); this.startNew(nm, gender); };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      body.appendChild(h('div', { class: 'row-end' }, h('button', { class: 'btn red big', onclick: go }, '接手客栈')));
      setTimeout(() => { try { inp.focus(); inp.select(); } catch (e) { /* ignore */ } }, 50);
    });
  },
  async startNew(name, gender) {
    newGame(name, gender);
    newWorld();
    UI.showGame(true);
    G.daily = null;
    UI.onPhase();
    await Dlg.run(STORY.intro());
    this.prepMorning(true);
    this.save();
  },
  continueGame() {
    if (!this.load()) { this.newGameForm(); return; }
    newWorld();
    UI.showGame(true);
    if (!G.daily) G.daily = genDaily();
    this.applyMorningState();
    UI.onPhase();
    toast(`欢迎回来，${G.name}掌柜！`, 'good');
  },

  /* ---------- 一天的流程 ---------- */
  async prepMorning(first) {
    W.phase = 'morning';
    G.daily = genDaily();
    this.applyMorningState();
    UI.onPhase();
    if (!first) await this.morningStory();
    UI.hud();
  },
  applyMorningState() {
    W.ev = W.ev || {};
    if (G.todayEv && G.todayEv.day === G.day) Object.assign(W.ev, G.todayEv.ev);
    if (G.flags.contestDay === G.day) setupContest();
  },
  async morningStory() {
    const lines = [];
    const beat = STORY.morningBeat();
    if (beat) lines.push(...beat);
    else if (G.day >= 3 && chance(0.6) && !G.flags.contestDay || (G.flags.contestDay && G.flags.contestDay !== G.day && chance(0.5))) {
      const ev = pickEvent();
      if (ev) { lines.push(...ev.run()); G.evSeen = G.evSeen || {}; G.evSeen[ev.id] = G.day; }
    }
    if (G.flags.contestDay === G.day) lines.push(...STORY.contestMorning());
    G.todayEv = { day: G.day, ev: { flow: W.ev.flow, lodge: W.ev.lodge, w: W.ev.w, rain: W.ev.rain, costMul: W.ev.costMul, name: W.ev.name } };
    if (lines.length) await Dlg.run(lines);
    UI.hud();
  },
  openShop() {
    if (!W || W.phase !== 'morning' || Dlg.open) return;
    W.phase = 'business'; W.t = 0;
    Sound.play('gong');
    floatText(480, 330, '开 张 咯', '#fff3c4', 30);
    if (G.day === 1) { W.specials.push({ hour: 7.15, type: 'villager', opts: { size: 1 } }); }
    UI.onPhase();
    tipOnce('open', '开张啦！客人陆续上门。中午和傍晚是饭点。');
  },
  goalText(g) {
    switch (g.k) {
      case 'served': return `接待 ${g.n} 位客人`;
      case 'income': return `菜钱和赏钱收满 ${g.n} 文`;
      case 'great': return `${g.n} 桌客人赞不绝口`;
      case 'nobad': return '一个差评、一位甩手走人的客人都没有';
      case 'sell': return `卖出 ${g.n} 份${DISH[g.dish] ? DISH[g.dish].name : '菜'}`;
    }
    return '';
  },
  goalProgress(g) {
    const T = W.today; let cur = 0;
    switch (g.k) {
      case 'served': cur = T.served; break;
      case 'income': cur = T.food + T.tips; break;
      case 'great': cur = T.great; break;
      case 'nobad': return [0, W.phase === 'night' && T.bad === 0 && T.angry === 0];
      case 'sell': cur = T.sold[g.dish] || 0; break;
    }
    return [cur, cur >= g.n];
  },
  starReqs(star) {
    const r = STARS[star]; if (!r) return [];
    const list = [];
    if (r.fame) list.push({ name: '名气', cur: G.fame, need: r.fame });
    if (r.tables) list.push({ name: '大堂桌子', cur: tableCount(), need: r.tables });
    if (r.served) list.push({ name: '累计接待客人', cur: G.stats.served, need: r.served });
    if (r.rooms) list.push({ name: '能住人的客房', cur: roomCount(), need: r.rooms });
    if (r.dishes) list.push({ name: '会做的菜', cur: G.unlocked.length, need: r.dishes });
    if (r.amb) list.push({ name: '大堂环境', cur: ambience(), need: r.amb });
    if (r.staff) list.push({ name: '伙计人数', cur: G.staff.length, need: r.staff });
    if (r.sign) list.push({ name: '招牌', cur: G.build.sign, need: r.sign, fmt: v => ['旧木匾', '新漆牌匾', '金字招牌'][v] });
    return list;
  },
  canStarUp() { return G.star < 5 && this.starReqs(G.star + 1).every(q => q.cur >= q.need); },

  /* ---------- 打烊结账 ---------- */
  settle() {
    const T = W.today;
    const rep = { day: G.day, served: T.served, parties: T.parties, great: T.great, bad: T.bad, angry: T.angry, food: T.food, tips: T.tips, rooms: T.rooms, cost: T.cost, lost: T.lost, dash: T.dashLoss || 0, missed: T.missed, fame: T.fame, thugs: T.thugs, thieves: T.thieves };
    G.money += T.rooms;
    G.money -= T.cost;
    const wages = G.staff.reduce((s, st) => s + STAFF[st.id].wage, 0);
    let paid = wages, unpaid = false;
    if (G.money < wages) { paid = Math.max(0, G.money); unpaid = true; }
    G.money = Math.max(0, G.money - paid);
    rep.wages = paid; rep.unpaid = unpaid;
    rep.net = T.food + T.tips + T.rooms - T.cost - paid - T.lost;
    // 每日目标
    const g = G.daily;
    if (g) { W.phase = 'night'; const [, done] = this.goalProgress(g); if (done) { G.money += g.reward; rep.goal = g; rep.net += g.reward; } }
    // 伙计
    rep.levelUps = []; rep.quit = []; rep.warn = [];
    G.staff.forEach(s => {
      const a = W.agents.find(x => x.s === s);
      s.exp += Math.round((a ? a.workT : 0) / 6);
      while (s.lv < 10 && s.exp >= expNeed(s.lv)) { s.exp -= expNeed(s.lv); s.lv++; rep.levelUps.push(s); }
      if (s.lv >= 10) s.exp = 0;
      let dmood = 2 + (G.build.dorm ? 5 : 0);
      if (s.energy < 20) dmood -= 8;
      if (unpaid) dmood -= 18;
      if (T.great >= 5) dmood += 2;
      s.mood = clamp(s.mood + dmood, 0, 100);
      s.energy = 100;
      if (s.mood < 20) { s.low = (s.low || 0) + 1; if (!STAFF[s.id].start) rep.warn.push(s); } else s.low = 0;
    });
    G.staff.filter(s => s.low >= 2 && !STAFF[s.id].start).forEach(s => { rep.quit.push(s); });
    G.staff = G.staff.filter(s => !rep.quit.includes(s));
    rep.quit.forEach(s => logEvent(`${STAFF[s.id].name}心灰意冷，卷铺盖走了`));
    G.stats.days++;
    G.stats.bestDay = Math.max(G.stats.bestDay, rep.net);
    G.hist.push({ d: G.day, net: rep.net, fame: G.fame, served: T.served, food: T.food + T.tips, great: T.great });
    if (G.hist.length > 60) G.hist.shift();
    rep.starUp = this.canStarUp();
    if (rep.starUp) G.star++;
    checkQuests();
    return rep;
  },
  showSummary(rep) {
    UI.modal(`第${cnNum(rep.day)}天 · 打烊结账`, null, body => {
      const s = h('div', { class: 'summary' });
      const sign = rep.net >= 0 ? (rep.net > 300 ? '大吉' : '小赚') : '亏本';
      s.appendChild(h('div', { class: 'sum-stamp', style: rep.net < 0 ? 'color:#5a5a6a;border-color:#5a5a6a' : '' }, sign));
      const row = (a, b, cls) => h('tr', { class: cls || '' }, h('td', null, a), h('td', { class: typeof b === 'number' ? (b >= 0 ? 'pos' : 'neg') : '' }, typeof b === 'number' ? (b >= 0 ? '+' : '') + fmt(b) + ' 文' : b));
      const tb = h('table', { class: 'ledger' },
        row('接待客人', `${rep.served} 位（${rep.parties} 桌）`),
        row('赞不绝口 / 差评 / 甩手走人', `${rep.great} / ${rep.bad} / ${rep.angry}`),
        row('菜钱', rep.food), rep.tips ? row('赏钱', rep.tips) : null, rep.rooms ? row('房钱', rep.rooms) : null,
        rep.goal ? row('今日目标奖励', rep.goal.reward) : null,
        row('食材成本', -rep.cost), row('伙计工钱', -rep.wages),
        rep.lost ? row('被偷被砸', -rep.lost) : null,
        rep.dash ? row('霸王餐（没收到的钱）', `${fmt(rep.dash)} 文`) : null,
        row('今日净赚', rep.net, 'tot'),
        row('名气变化', `${rep.fame >= 0 ? '+' : ''}${rep.fame}（共 ${fmt(G.fame)}）`));
      s.appendChild(tb);
      const notes = [];
      if (rep.missed) notes.push(`有 ${rep.missed} 拨客人见门口排长队，没进来就走了。`);
      if (rep.unpaid) notes.push('钱不够发工钱，伙计们很不高兴！');
      rep.levelUps.forEach(st => notes.push(`${STAFF[st.id].name}升到了 ${st.lv} 级！`));
      rep.warn.forEach(st => { if (!rep.quit.includes(st)) notes.push(`${STAFF[st.id].name}心情很差，再这样下去就要走人了。`); });
      rep.quit.forEach(st => notes.push(`${STAFF[st.id].name}卷铺盖走人了……`));
      if (rep.starUp) notes.push(`客栈升为${cnNum(G.star)}星！`);
      if (notes.length) s.appendChild(h('div', { class: 'sum-note' }, notes.map(n => h('div', null, n))));
      s.appendChild(h('div', { class: 'row-center' }, h('button', { class: 'btn red big', onclick: () => { UI.close(); } }, '歇息，明天再战')));
      body.appendChild(s);
    }, { closable: false, onClose: () => this.afterNight(rep) });
  },
  async afterNight(rep) {
    const lines = [];
    if (rep.starUp) { Sound.play('firecracker'); confetti(90); setTimeout(() => Sound.play('fanfare'), 600); lines.push(...STORY.starUp(G.star)); }
    if (G.day === 1) lines.push(...STORY.rivalVisit());
    else if (G.flags.contestDay === G.day) lines.push(...STORY.contestResult());
    else if (!rep.starUp && chance(0.42)) { const sk = pickSkit(); if (sk) lines.push(...sk); }
    if (lines.length) await Dlg.run(lines);
    if (G.flags.won && !G.flags.endingShown) { G.flags.endingShown = true; await Dlg.run(STORY.ending()); showEnding(); return; }
    this.nextDay();
  },
  async nextDay() {
    G.day++;
    newWorld();
    this.save();
    await this.prepMorning(false);
    this.save();
  },

  /* ---------- 玩家操作 ---------- */
  research(id) {
    const d = DISH[id]; const cost = researchCost(d);
    if (G.money < cost || G.unlocked.includes(id)) return;
    G.money -= cost; G.unlocked.push(id); G.stats.researched++;
    if (G.discount === id) G.discount = null;
    if (G.menu.length < menuSlots()) G.menu.push(id);
    Sound.play('buy'); toast(`研发成功：${d.name}！${G.menu.includes(id) ? '已上架。' : '菜单满了，记得去调整。'}`, 'good');
    logEvent(`研发出新菜「${d.name}」`);
    checkQuests(); UI.refresh();
  },
  hire(id) {
    const d = STAFF[id];
    if (canHire(id) !== true || G.money < d.hire) return;
    G.money -= d.hire;
    const s = mkStaff(id); G.staff.push(s);
    if (W) { const a = mkAgent(s); a.x = GEO.DOOR_IN.x; a.y = GEO.DOOR_IN.y; a.path = hallPath(a, a.home); a.pose = 'walk'; W.agents.push(a); rehomeAgents(); a.path = hallPath(a, a.home); say(a, d.lines.happy[0], 2.4); }
    Sound.play('buy'); toast(`${d.name}加入了云来客栈！`, 'good');
    logEvent(`招来${ROLES[d.role].name}${d.name}`);
    checkQuests(); UI.refresh();
  },
  fire(s) {
    G.staff = G.staff.filter(x => x !== s);
    if (W) { const a = W.agents.find(x => x.s === s); if (a) { releaseTask(a); if (a.cook) { a.cook.tk.order.status = 'pending'; W.tickets.unshift(a.cook.tk); a.cook = null; } if (a.target) { a.target.guarded = null; a.target = null; } W.agents = W.agents.filter(x => x !== a); rehomeAgents(); } }
    toast(`${STAFF[s.id].name}离开了客栈。`); logEvent(`辞退了${STAFF[s.id].name}`);
    UI.refresh();
  },
  buy(id) {
    const b = BUILD[id]; const lv = G.build[id];
    if (lv >= b.max || b.star[lv] > G.star || G.money < b.cost[lv] || !buildAllowed(b)) return;
    G.money -= b.cost[lv]; G.build[id]++;
    if (id === 'table' && W) addTable(W.tables.length);
    Sound.play('buy');
    toast(`${b.names ? b.names[lv] : b.name}${b.id === 'room' ? '：又修好一间客房' : ''}，置办妥当！`, 'good');
    if (W) burst(480, 400, 14, '#f3c34f', 'spark');
    logEvent(`添置：${b.names ? b.names[lv] : b.name}`);
    checkQuests(); UI.refresh();
  },
  train(s, cost) {
    if (G.money < cost || s.trained === G.day) return;
    G.money -= cost; s.trained = G.day; s.exp += 30; s.energy = Math.max(0, s.energy - 15);
    const before = s.lv;
    while (s.lv < 10 && s.exp >= expNeed(s.lv)) { s.exp -= expNeed(s.lv); s.lv++; }
    Sound.play('buy');
    toast(s.lv > before ? `${STAFF[s.id].name}升到了 ${s.lv} 级！` : `${STAFF[s.id].name}学了不少本事（经验 +30）`, 'good');
    UI.refresh();
  },
  bonus(s) {
    if (G.money < 20 || s.bonused === G.day) return;
    G.money -= 20; s.bonused = G.day; s.mood = Math.min(100, s.mood + 15);
    Sound.play('coin'); toast(`${STAFF[s.id].name}：${pick(STAFF[s.id].lines.happy)}`);
    UI.refresh();
  },
  async gift(s, gid, price) {
    if (G.money < price || s.gifted === G.day) return;
    G.money -= price; s.gifted = G.day;
    const d = STAFF[s.id];
    const kind = d.love === gid ? 'love' : d.like === gid ? 'like' : 'meh';
    s.known = s.known || {}; s.known[gid] = kind;
    const before = s.aff;
    const add = kind === 'love' ? 15 : kind === 'like' ? 8 : 3;
    s.aff = Math.min(100, s.aff + add); s.mood = Math.min(100, s.mood + add);
    Sound.play(kind === 'love' ? 'happy' : 'pop');
    const say2 = kind === 'love' ? '这、这正是我想要的！掌柜的你怎么知道？' : kind === 'like' ? '谢谢掌柜的，我很喜欢！' : '……谢谢掌柜的。';
    toast(`${d.name}：${say2}（好感 +${add}）`, kind === 'love' ? 'good' : '');
    UI.refresh();
    await this.affinityCheck(s, before);
  },
  async chat(s) {
    if (s.chatted === G.day) return;
    s.chatted = G.day;
    const before = s.aff; s.aff = Math.min(100, s.aff + 2);
    const d = STAFF[s.id];
    const pool = [...d.lines.idle, ...d.lines.happy, ...(CHATS[s.id] || [])];
    UI.close();
    await Dlg.run([{ who: s.id, text: pick(pool) }]);
    await this.affinityCheck(s, before);
  },
  async affinityCheck(s, before) {
    const ev = AFF_EVENTS[s.id]; if (!ev) return;
    for (const th of [40, 80]) {
      if (before < th && s.aff >= th && ev[th]) {
        if (UI.modalOpen) UI.close();
        await Dlg.run([...ev[th].map(t => ({ who: s.id, text: t, expr: 'happy' })), { who: 'sys', text: `${STAFF[s.id].name}的好感达到${th === 40 ? '两' : '四'}颗心，${ROLES[STAFF[s.id].role].statName}提升了！` }]);
        logEvent(`和${STAFF[s.id].name}的交情更深了`);
      }
    }
  },
};

/* ---------- 每日目标 ---------- */
function genDaily() {
  const last = G.hist[G.hist.length - 1];
  const opts = [];
  const sv = last ? last.served : 14;
  opts.push({ k: 'served', n: Math.max(10, Math.round(sv * 1.1 / 2) * 2) });
  const inc = last ? last.food : 110;
  opts.push({ k: 'income', n: Math.max(100, Math.round(inc * 1.12 / 10) * 10) });
  if (G.day > 2) opts.push({ k: 'great', n: Math.max(3, Math.round((last ? last.great : 3) * 1.15) + 1) });
  if (G.day > 3) opts.push({ k: 'nobad', n: 0 });
  const sellable = G.menu.filter(id => DISH[id].price >= 8);
  if (sellable.length && G.day > 1) { const dish = pick(sellable); opts.push({ k: 'sell', dish, n: 4 + G.star * 2 }); }
  const g = pick(opts);
  g.reward = 30 + G.star * 25 + (g.k === 'nobad' ? 30 : 0);
  return g;
}

/* ---------- 任务 ---------- */
function checkQuests() {
  if (!G || G.demo) return;
  let guard = 0;
  while (G.quest < QUESTS.length && QUESTS[G.quest].check(G) && guard++ < 20) {
    const q = QUESTS[G.quest];
    G.money += q.money; G.quest++;
    toast(`任务完成「${q.name}」！奖励 ${q.money} 文`, 'good');
    Sound.play('fanfare');
    logEvent(`完成「${q.name}」`);
  }
}

/* ---------- 随机事件 ---------- */
const EVENTS = [
  { id: 'fair', w: 3, star: 1, run() { W.ev.flow *= 1.5; W.ev.name = '庙会'; return [{ who: 'doudou', text: '掌柜的！今儿镇上赶庙会，街上人山人海，糖人、风车、耍猴的全来了！' }, { who: 'sys', text: '【庙会】今天客人会多不少，桌子够不够？' }]; } },
  { id: 'rain', w: 3, star: 1, run() { W.ev.rain = true; W.ev.flow *= 0.75; W.ev.lodge *= 1.9; W.ev.name = '阴雨'; return [{ who: 'narr', text: '天降大雨，青石板街上积了一洼一洼的水。' }, { who: 'dashao', text: '下雨天，留客天。赶路的客人怕是要住店了！' }, { who: 'sys', text: '【阴雨】客人少一些，但住店的人多。' }]; } },
  { id: 'critic', w: 2.2, star: 1, cond: () => G.day >= 4, run() { W.ev.name = '美食家'; W.specials.push({ hour: rand(10.5, 16.5), type: 'critic', opts: { label: '美食家', look: NPC.critic.look } }); return [{ who: STAFF_ON('jiujiu') || 'doudou', text: '听说那位人称"金舌头"的美食家白老饕，今天要来咱落霞镇！' }, { who: 'sys', text: '【美食家】他点精致的荤菜和鱼鲜。招待满意名气大涨，砸了招牌可就……' }]; } },
  { id: 'gather', w: 2, star: 2, run() { W.ev.w = { swordsman: 4, escort: 2 }; W.ev.flow *= 1.2; W.ev.name = '英雄会'; return [{ who: 'sanxian', ifNot: 'doudou', text: '列位！城外山庄今日办英雄会，四方侠客都要打咱门前过！' }, { who: 'sys', text: '【英雄会】侠客、镖师多，记得把酒和荤菜摆上菜单。' }]; } },
  {
    id: 'protect', w: 2, star: 1, cond: () => G.day >= 4, run() {
      W.ev.name = '收保护费';
      return [{ who: 'thug', text: '这条街归我们哥几个罩着！每月孝敬六十文，保你平安无事。' },
        { who: 'boss', text: '……', choices: [
          { text: '给他六十文', fn: () => { G.money = Math.max(0, G.money - 60); logEvent('交了六十文保护费'); return [{ who: 'thug', text: '算你识相！' }]; } },
          { text: '不给！', red: true, fn: () => { const n = 2; for (let i = 0; i < n; i++) W.specials.push({ hour: rand(10, 18), type: 'thug', opts: { label: '地痞' } }); W.ev.name = '地痞寻衅'; return [{ who: 'thug', text: '好！你给我等着！' }, { who: 'sys', text: '今天会有地痞上门闹事。点他们六下就能赶走，有护院更省心。' }]; } },
        ] }];
    },
  },
  { id: 'peddler', w: 2, star: 1, cond: () => G.day >= 3, run() { G.giftSale = G.day; W.ev.name = '货郎'; return [{ who: 'narr', text: '一个挑着担子的货郎在门口摇起了拨浪鼓：糖葫芦、绢花、胭脂、话本……' }, { who: 'sys', text: '【货郎】今天送给伙计的礼物一律半价。' }]; } },
  {
    id: 'sick', w: 1.6, star: 1, cond: () => G.staff.length >= 3, run() {
      const cand = G.staff.filter(s => { const r = STAFF[s.id].role; return !((r === 'cook' || r === 'waiter') && roleCount(r) === 1); });
      if (!cand.length) return [];
      const s = pick(cand); const d = STAFF[s.id];
      return [{ who: s.id, text: '阿嚏！掌柜的……我好像着凉了……', expr: 'sad' },
        { who: 'boss', text: '……', choices: [
          { text: '请郎中（30文）', disabled: G.money < 30, fn: () => { G.money -= 30; s.mood = Math.min(100, s.mood + 10); s.aff = Math.min(100, s.aff + 4); return [{ who: s.id, text: '喝了药好多了，掌柜的真好！', expr: 'happy' }]; } },
          { text: '放一天假', fn: () => { s.sickDay = G.day; const a = W.agents.find(x => x.s === s); if (a) { W.agents = W.agents.filter(x => x !== a); rehomeAgents(); } s.mood = Math.min(100, s.mood + 6); return [{ who: 'sys', text: `${d.name}今天在后院歇着，不来干活。` }]; } },
        ] }];
    },
  },
  {
    id: 'poach', w: 1.6, star: 2, cond: () => G.staff.some(s => !STAFF[s.id].start), run() {
      const s = G.staff.filter(x => !STAFF[x.id].start).sort((a, b) => b.lv - a.lv)[0]; const d = STAFF[s.id];
      return [{ who: 'rival', text: `${d.name}，来我聚宝楼干吧，工钱给你翻一倍！` }, { who: s.id, text: '这……' },
        { who: 'boss', text: '……', choices: [
          { text: '当场加赏 80 文', disabled: G.money < 80, fn: () => { G.money -= 80; s.mood = Math.min(100, s.mood + 25); s.aff = Math.min(100, s.aff + 6); return [{ who: s.id, text: '钱东家，您请回吧，我在云来干得挺好。', expr: 'happy' }, { who: 'rival', text: '哼！' }]; } },
          { text: '相信伙计', fn: () => { if (s.mood >= 50 || s.aff >= 40) { s.aff = Math.min(100, s.aff + 10); return [{ who: s.id, text: '掌柜的信我，我就不走！钱东家，慢走不送。', expr: 'happy' }]; } G.staff = G.staff.filter(x => x !== s); const a = W.agents.find(x => x.s === s); if (a) { W.agents = W.agents.filter(x => x !== a); rehomeAgents(); } logEvent(`${d.name}被聚宝楼挖走了`); return [{ who: s.id, text: '对不住了掌柜的……', expr: 'sad' }, { who: 'sys', text: `${d.name}跟着钱满贯走了。平时多关心伙计的心情吧。` }]; } },
        ] }];
    },
  },
  { id: 'story', w: 1.5, star: 2, cond: () => G.staff.some(s => STAFF[s.id].role === 'artist'), run() { const f = 15 + G.star * 8; addFame(f); return [{ who: 'narr', text: '镇上茶馆里，说书人正绘声绘色地讲着云来客栈的故事……' }, { who: 'sys', text: `名气 +${f}` }]; } },
  { id: 'regular', w: 2, star: 1, run() { W.ev.flow *= 1.25; W.ev.w = { villager: 2 }; W.ev.name = '老主顾'; return [{ who: 'narr', text: '隔壁铁匠铺的王大锤拍着胸脯说，今儿要带全家来吃！' }, { who: 'sys', text: '【老主顾】今天镇民多。' }]; } },
  { id: 'up', w: 1.5, star: 1, run() { W.ev.costMul = 1.3; W.ev.name = '菜价涨'; return [{ who: STAFF_ON('dashao') ? 'dashao' : 'boss', text: '菜市口的肉价、菜价全涨了，今儿的食材成本要高三成。' }]; } },
  { id: 'down', w: 1.5, star: 1, run() { W.ev.costMul = 0.7; W.ev.name = '菜价跌'; return [{ who: STAFF_ON('dashao') ? 'dashao' : 'boss', text: '好消息！乡下大丰收，今儿的菜又便宜又新鲜，成本省三成！' }]; } },
  { id: 'oldman', w: 1.3, star: 1, cond: () => G.day >= 5, run() { const want = pick(['wine', 'tea']); W.specials.push({ hour: rand(10, 17), type: 'oldman', opts: { label: '神秘老者', look: NPC.oldman.look }, onSpawn: p => { p.want = want; p.special = 'oldman'; } }); return [{ who: 'narr', text: `一大早，门口的老槐树下多了一个酒葫芦。据说今天会有位怪老头来讨${want === 'wine' ? '一壶好酒' : '一壶好茶'}……` }]; } },
  { id: 'lucky', w: 0.8, star: 1, run() { const v = randi(30, 80) * G.star; G.money += v; return [{ who: STAFF_ON('doudou') ? 'doudou' : 'boss', text: `掌柜的！我扫地扫出了一个钱袋，里面有 ${v} 文！失主找了一圈也没找着，那就……充公？` }]; } },
];
function STAFF_ON(id) { return G.staff.some(s => s.id === id) ? id : null; }
function pickEvent() {
  const ok = EVENTS.filter(e => e.star <= G.star && (!e.cond || e.cond()) && !(G.evSeen && G.evSeen[e.id] && G.day - G.evSeen[e.id] < 3));
  const ev = weightedPick(ok, e => e.w);
  if (!ev) return null;
  return { id: ev.id, run: () => ev.run().map(l => { if (l.ifNot && !STAFF_ON(l.who)) l.who = l.ifNot; if (STAFF[l.who] && !STAFF_ON(l.who)) l.who = 'boss'; return l; }) };
}

/* ---------- 剧情 ---------- */
const STORY = {
  intro: () => [
    { who: 'narr', text: '江南有个落霞镇，镇东头有间老客栈，叫「云来客栈」。' },
    { who: 'narr', text: '这年开春，客栈的老掌柜——你的三叔公——留下一封信，背上酒葫芦，云游四海去了。' },
    { who: 'uncle', text: '乖{nephew}：客栈交给你了。这几年生意不济，桌椅破了，客房漏了，就剩两个老伙计。' },
    { who: 'uncle', text: '你若能把它做成「天下第一客栈」，后院老槐树下，有我留给你的宝贝。——三叔公' },
    { who: 'boss', text: '……天下第一？就这间破店？', expr: 'surprised' },
    { who: 'dashao', text: '你就是新掌柜？我是后厨的冯大勺！当年在军营，我一口锅喂饱过三千人！', expr: 'happy' },
    { who: 'doudou', text: '我叫小豆子！跑堂、传菜、擦桌子，我全包了！掌柜的，工钱……能先预支点不？', expr: 'happy' },
    { who: 'boss', text: '好！从今天起，云来客栈——重新开张！', expr: 'happy' },
    { who: 'sys', text: '客人进门会自己找空桌。头上冒出「点菜」气泡时，小豆子会去招呼；忙不过来，你点一下气泡就能亲自招呼。' },
    { who: 'sys', text: '出菜台上的菜、吃完的脏桌子也都能点。亲自动手要花精力（顶上的小圆点），精力会慢慢恢复。准备好了就点「开张营业」！' },
  ],
  rivalVisit: () => [
    { who: 'narr', text: '打烊时分，一个穿金戴银的胖子摇着扇子踱进门来。' },
    { who: 'rival', text: '哟，云来客栈又开张啦？在下钱满贯，对面聚宝楼的东家。', expr: 'sly' },
    { who: 'rival', text: '小掌柜，听我一句劝：这破店撑不过三个月。不如早点盘给我，我出……五十两！', expr: 'sly' },
    { who: 'boss', text: '不卖。' },
    { who: 'rival', text: '嘿嘿，有骨气。那咱们走着瞧！' },
    { who: 'dashao', text: '呸！什么聚宝楼，菜做得比刷锅水还淡！', expr: 'angry' },
    { who: 'narr', text: '看来，「天下第一客栈」这条路，没那么好走。' },
  ],
  morningBeat() {
    const F = G.flags;
    if (G.day === 2 && !F.tip2) { F.tip2 = 1; return [{ who: 'dashao', text: '掌柜的，光卖面和包子可赚不了几个钱。' }, { who: 'dashao', text: '去「菜谱」里研发几道新菜吧——烧刀子、红烧肉，镖师们最好这一口！' }, { who: 'sys', text: '不同客人口味不同：镇民爱主食和茶，书生爱茶点，镖师爱荤菜和酒，云游僧只吃素。' }]; }
    if (G.day === 3 && !F.tip3) { F.tip3 = 1; if (tableCount() < 3) return [{ who: 'doudou', text: '掌柜的，饭点的时候客人都排到街上了，好几拨等不及就走了。' }, { who: 'doudou', text: '咱再添几张桌子吧？「装修」里就能买！' }, { who: 'sys', text: '排队客人头上有茶碗，点一下先上碗茶，他们就能多等一会儿。' }]; return [{ who: 'sys', text: '排队客人头上有茶碗，点一下先上碗茶，他们就能多等一会儿。二楼修好客房后，傍晚的行路人会住店，房钱晚上一并结算。' }]; }
    if (G.day === 4 && !F.tip4) { F.tip4 = 1; return [{ who: 'sys', text: '「伙计」里可以招新伙计，还能培训、打赏、送礼、聊天。好感越高，伙计本事越大。每个人喜欢的礼物不一样哦。' }]; }
    if (G.star >= 2 && !F.recipe) { F.recipe = 1; if (!G.unlocked.includes('secret')) { G.unlocked.push('secret'); if (G.menu.length < menuSlots()) G.menu.push('secret'); } logEvent('在阁楼找到三叔公的卤味秘方'); return [{ who: STAFF_ON('doudou') ? 'doudou' : 'boss', text: '掌柜的！掌柜的！我在阁楼扫灰，翻出一本发黄的册子！', expr: 'surprised' }, { who: STAFF_ON('dashao') ? 'dashao' : 'boss', text: '让我瞧瞧……这、这是三叔公的《云来卤味秘方》！当年就靠这一锅卤肉，咱客栈门口天天排长队！', expr: 'happy' }, { who: 'sys', text: '获得独门秘方「云来卤肉」！人人爱吃，价钱也高。已加入菜谱。' }]; }
    if (G.star >= 3 && !F.laomao) { F.laomao = 1; logEvent('结识了懒汉老猫'); return [{ who: 'narr', text: '这天一早，门口横七竖八坐着几个泼皮，说是聚宝楼的钱东家请来"照顾生意"的。' }, { who: 'narr', text: '正要发作，墙角一个睡得正香的懒汉翻了个身。' }, { who: 'laomao', text: '喵……吵死了。', expr: 'sleep' }, { who: 'narr', text: '只见他袖子一抖，几个泼皮"哎哟哎哟"地滚出了街口。' }, { who: 'laomao', text: '小掌柜，你这儿管饭不？管饭，我就帮你看门。' }, { who: 'sys', text: '结识了「老猫」，可以在「伙计 → 招募」里请他当护院。' }]; }
    if (G.star >= 4 && !F.jin) { F.jin = 1; logEvent('御厨金不换上门'); return [{ who: 'narr', text: '一位白发老者在大堂里坐了半个时辰，只尝了一块卤肉，眼睛就亮了。' }, { who: 'jinbuhuan', text: '这卤肉……竟有当年御膳房的味道！你们后厨谁掌的勺？', expr: 'surprised' }, { who: STAFF_ON('dashao') ? 'dashao' : 'boss', text: '是我！怎么着？' }, { who: 'jinbuhuan', text: '刀工差了点，火候还行。小掌柜，老夫金不换，你这儿缺不缺厨子？' }, { who: 'sys', text: '结识了「金不换」，可以在「伙计 → 招募」里请他掌勺（要有空灶台）。' }]; }
    if (G.star >= 5 && !F.contestDay) { F.contestDay = G.day + 3; logEvent('天下客栈评选定在三天后'); return [{ who: 'mayor', text: `${G.name}掌柜！大喜事！`, expr: 'happy' }, { who: 'mayor', text: '三天之后，「天下客栈评选」的三位评审要来咱落霞镇！聚宝楼的钱东家也报了名。' }, { who: 'rival', text: '哼，五星又怎样？评审的嘴可刁得很。', expr: 'sly' }, { who: 'sys', text: `【天下客栈评选】第${cnNum(F.contestDay)}天，三位评审会先后来店里吃饭。把精致好菜摆上菜单，让他们满意而归！` }]; }
    return null;
  },
  contestMorning: () => [
    { who: 'mayor', text: '今天就是评选的日子！三位评审：美食家白老饕、江湖名宿秦三爷、京城来的赵大人。' },
    { who: 'mayor', text: '他们会在巳时、未时、酉时前后先后上门。招呼好了，咱落霞镇的脸面全靠你们了！' },
    { who: 'sys', text: '评审爱吃精致菜。他们满不满意、大堂环境、菜谱多寡，都会算进总分。' },
  ],
  contestResult() {
    const js = W.judges.slice(); while (js.length < 3) js.push(0);
    const avg = js.reduce((a, b) => a + b, 0) / 3;
    const score = Math.round(avg * 0.6 + Math.min(25, ambience() / 2) + Math.min(15, G.unlocked.length));
    const rivalScore = 78 + randi(0, 4);
    G.flags.lastScore = score;
    const lines = [{ who: 'mayor', text: `评审们商量了一整晚。云来客栈得分：${score}；聚宝楼得分：${rivalScore}。` }];
    if (score > rivalScore) {
      G.flags.won = true; checkQuests();
      lines.push({ who: 'mayor', text: '今年「天下客栈评选」的头名是——落霞镇，云来客栈！', expr: 'happy' },
        { who: 'rival', text: '什、什么？！我的聚宝楼……', expr: 'surprised' },
        { who: 'rival', text: '……罢了罢了，你家的卤肉，我也偷偷吃过好几回。服气！' },
        { who: 'narr', text: '鞭炮齐鸣，一块金灿灿的「天下第一客栈」大匾挂上了门楣。' });
      logEvent('夺得天下客栈评选头名！');
      setTimeout(() => { Sound.play('firecracker'); confetti(140); }, 300);
    } else {
      G.flags.contestDay = G.day + 5;
      lines.push({ who: 'mayor', text: '今年的头名……是聚宝楼。' }, { who: 'rival', text: '哈哈哈！承让承让！', expr: 'happy' },
        { who: STAFF_ON('dashao') ? 'dashao' : 'boss', text: '掌柜的，别灰心！评审说五天后还要复评一次，咱再拼一把！' },
        { who: 'sys', text: `复评定在第${cnNum(G.flags.contestDay)}天。多研发精致好菜、练熟手艺、布置大堂，评审一来就上好菜！` });
      logEvent(`评选失利（${score} : ${rivalScore}），五天后复评`);
    }
    return lines;
  },
  starUp(star) {
    const names = ['', '', '二', '三', '四', '五'];
    const extra = { 2: '行商和侠客开始光顾，新菜和新伙计也解锁了。', 3: '千金小姐也愿意来坐坐了，菜单能多摆一道菜。', 4: '官老爷都慕名而来，红木家具、金字招牌可以置办了。', 5: '云来客栈名动江湖！' }[star] || '';
    return [{ who: 'narr', text: `噼里啪啦——鞭炮声中，云来客栈升为${names[star]}星客栈！` }, { who: 'sys', text: extra + ` 掌柜精力上限 +1。` }];
  },
  ending: () => [
    { who: 'narr', text: '夜深了。你提着灯笼，来到后院的老槐树下。' },
    { who: 'narr', text: '一锹，两锹……挖出了一只沉甸甸的酒坛，坛口压着一封信。' },
    { who: 'uncle', text: '乖{nephew}：你挖到这坛酒的时候，客栈应该已经名满天下了吧。' },
    { who: 'uncle', text: '其实哪有什么宝贝。这间客栈，这帮伙计，还有你这些日子吃的苦——这就是我想留给你的。' },
    { who: 'uncle', text: '坛里是十八年的女儿红，跟大伙儿一块儿喝了吧。' },
    { who: 'narr', text: '话音刚落，院墙外传来一阵熟悉的笑声。' },
    { who: 'uncle', text: '哈哈哈！{kid}，三叔公回来蹭酒啦！', expr: 'happy' },
    { who: STAFF_ON('dashao') ? 'dashao' : 'boss', text: '三叔公？！你不是云游四海去了吗？', expr: 'surprised' },
    { who: 'uncle', text: '游累了，回来看看。嗯……这卤肉的味道，没给我丢人！', expr: 'happy' },
    { who: 'narr', text: '那一夜，云来客栈灯火通明，笑声一直传到了镇西头。' },
  ],
};

/* ---------- 夜里的小插曲 ---------- */
const SKITS = [
  { need: ['dashao', 'doudou'], lines: [['doudou', '大勺叔，后厨那半只烧鸡呢？'], ['dashao', '什么烧鸡？没看见。'], ['doudou', '那你嘴边那是啥？'], ['dashao', '……这叫试菜！试菜懂不懂！', 'angry']] },
  { need: ['doudou'], lines: [['doudou', '掌柜的，你猜我今天跑了多少趟？'], ['boss', '五十趟？'], ['doudou', '一百零三趟！我数着呢！……所以工钱能不能……'], ['boss', '不能。']] },
  { need: ['jiujiu'], lines: [['jiujiu', '掌柜的，今天的茶水钱对不上，少了两文。'], ['boss', '两文而已，算了吧。'], ['jiujiu', '一天两文，一年就是七百三十文！够买二十多只烧鸡！', 'angry'], ['boss', '……你接着查。']] },
  { need: ['shidun'], lines: [['narr', '一只小老鼠从墙角窜了出来。'], ['shidun', '……'], ['shidun', '啊啊啊啊啊——！！', 'surprised'], ['narr', '那一夜，石墩在房梁上蹲到了天亮。']] },
  { need: ['dashao'], lines: [['dashao', '想当年在军营，我一顿饭能做三千人的份。'], ['boss', '那你今天做了二十桌就喊累？'], ['dashao', '那时候……那时候我年轻嘛！']] },
  { need: ['afu'], lines: [['afu', '掌柜的，俺娘来信了。'], ['boss', '说什么了？'], ['afu', '让俺在镇上好好干，别乱花钱，还有……多吃点。'], ['boss', '明天给你加个鸡腿。'], ['afu', '……俺娘说得对，镇上的人好。', 'happy']] },
  { need: ['hujiao', 'dashao'], lines: [['hujiao', '冯大勺，你这红烧肉太淡了，我给你加了一把辣子。'], ['dashao', '什么？！红烧肉放什么辣子！', 'angry'], ['hujiao', '不辣不要钱嘛。'], ['dashao', '那这盘就别要钱了！']] },
  { need: ['liuying'], lines: [['liuying', '客官～您的阳春面～来～咯～'], ['boss', '柳莺，打烊了，不用唱了。'], ['liuying', '掌柜的有所不知，这叫……吊嗓子～']] },
  { need: ['sanxian'], lines: [['sanxian', '上回书说到，那云来客栈的掌柜，一人一刀，单挑十八路山贼——'], ['boss', '我什么时候单挑山贼了？', 'surprised'], ['sanxian', '说书嘛，七分真三分假，客人爱听就行！']] },
  { need: ['qianbuduo', 'jiujiu'], lines: [['qianbuduo', '小丫头，你账算得快，可还差点火候。'], ['jiujiu', '老先生，我这个月一文都没算错！'], ['qianbuduo', '是没错。可你把掌柜的买糖葫芦的钱也记成了公账。'], ['jiujiu', '那……那是给伙计们买的，算犒劳！']] },
  { need: ['laomao'], lines: [['narr', '老猫在柜台上睡得正香。'], ['boss', '老猫，醒醒，打烊了。'], ['laomao', '喵……打烊好啊，打烊了才能好好睡。', 'sleep'], ['boss', '你白天不也在睡？'], ['laomao', '白天那叫闭目养神。']] },
  { need: ['yunshang'], lines: [['yunshang', '掌柜的，今晚月色真好，我给大家弹一曲吧。'], ['narr', '琵琶声起，连后厨的锅铲都停了。'], ['boss', '……真好听。明天的工钱照发。'], ['yunshang', '掌柜的说笑了，工钱本来就要照发呀。', 'happy']] },
  { need: ['jinbuhuan', 'dashao'], lines: [['jinbuhuan', '冯大勺，你这刀工，在御膳房只配削土豆。'], ['dashao', '那你说说，御膳房的土豆怎么削？'], ['jinbuhuan', '……削得圆一点。']] },
  { need: [], lines: [['boss', '（一个人坐在柜台后面，拨着算盘）'], ['boss', '三叔公啊三叔公，你到底在后院埋了什么……']] },
  { need: ['doudou', 'jiujiu'], lines: [['doudou', '九九，借我五文钱买糖葫芦呗。'], ['jiujiu', '借可以，一天一文利息。'], ['doudou', '你这是放高利贷！', 'angry'], ['jiujiu', '这叫账房的规矩。']] },
  { need: ['shidun', 'doudou'], lines: [['doudou', '石墩哥，你这么大个子，到底怕不怕打架？'], ['shidun', '……不怕。'], ['doudou', '那你怕什么？'], ['shidun', '……老鼠。还有……打雷。']] },
  { need: ['afu', 'dashao'], lines: [['afu', '大勺叔，俺能跟你学做菜不？'], ['dashao', '能！先从切葱开始，切满一千根再说。'], ['afu', '那俺现在就去切！', 'happy'], ['narr', '第二天，后厨的葱够用一个月了。']] },
  { need: ['hujiao'], lines: [['hujiao', '掌柜的，菜单上加道麻婆豆腐要不要得？'], ['boss', '镇上的人吃不了那么辣吧。'], ['hujiao', '吃着吃着就吃得了！我们蜀中人都是这么过来的！']] },
];
function pickSkit() {
  const ok = SKITS.filter(s => s.need.every(id => G.staff.some(x => x.id === id)) && !(G.skitSeen && G.skitSeen[SKITS.indexOf(s)]));
  if (!ok.length) return null;
  const s = pick(ok); G.skitSeen = G.skitSeen || {}; G.skitSeen[SKITS.indexOf(s)] = 1;
  return [{ who: 'narr', text: '打烊后，大堂里只剩一盏油灯……' }, ...s.lines.map(([who, text, expr]) => ({ who, text, expr }))];
}
const CHATS = {
  dashao: ['做菜就跟打仗一样，火候就是军令！', '掌柜的，尝尝我新调的酱汁？'],
  doudou: ['掌柜的，你说天上的云是不是糖做的？', '我今天又被客人夸手脚麻利啦！'],
  afu: ['俺家有三亩地，俺娘一个人种着。', '掌柜的，镇上的面真白！'],
  jiujiu: ['掌柜的，这个月的账我又核了三遍！', '算盘珠子响，心里就踏实。'],
  shidun: ['……今天，没人闹事。', '……饭，好吃。'],
  hujiao: ['辣椒是好东西，提神醒脑！', '我们那儿的火锅，你一定要尝尝！'],
  liuying: ['掌柜的想听哪一出？', '今天有位客人说我唱得比京城的名角还好～'],
  sanxian: ['江湖传言，北边出了个一剑破十城的少年……', '掌柜的，故事要不要听？不要钱的那种。'],
  qianbuduo: ['老朽当年给七家钱庄算过账。', '账面干净，睡觉都香。'],
  laomao: ['……有鱼吗？', '呼……（睡着了）'],
  yunshang: ['京城的雪，比这儿的大。', '琵琶弦断了一根，明天去买。'],
  jinbuhuan: ['御膳房的规矩，一道菜要尝七遍。', '哼，你这儿的茶，还凑合。'],
};
const AFF_EVENTS = {
  dashao: { 40: ['掌柜的，跟你说句心里话。', '当年在军营，我最大的心愿就是开个小饭馆。如今在这儿掌勺，也算圆了一半的梦！'], 80: ['这口锅我用了二十年，从今天起，它就是云来客栈的锅了！', '往后后厨的事，你尽管放心！'] },
  doudou: { 40: ['掌柜的，我娘走得早，镇上的人都叫我野孩子。', '只有在这儿，大家才叫我"豆子"……嘿嘿，我会好好干的！'], 80: ['掌柜的，等我长大了，也要开一间跟云来一样好的客栈！', '……不过还是先在这儿干着吧，嘿嘿。'] },
  afu: { 40: ['掌柜的，俺娘来信说麦子收了，让俺别惦记。', '俺不惦记，俺在这儿挺好。'], 80: ['俺把攒的工钱寄回家了，俺娘说要请你吃俺家的枣糕！'] },
  jiujiu: { 40: ['掌柜的，给你看个东西——这是我自己琢磨的记账法，一眼就能看出哪道菜最赚钱！'], 80: ['我爹以前是钱庄的账房，被人冤枉做假账赶了出来。', '所以我发过誓，一辈子只记清白账。掌柜的，谢谢你信我。'] },
  shidun: { 40: ['……掌柜的。', '……糖葫芦，好吃。……谢谢。'], 80: ['……以后，谁欺负你，我打谁。', '……除了老鼠。'] },
  hujiao: { 40: ['掌柜的，你晓得我为啥离开蜀中不？', '我想让全天下的人都尝尝我们那儿的味道！'], 80: ['我给你配了一罐独门红油，别个我都不给哦！'] },
  liuying: { 40: ['我以前在戏班唱花旦，后来班子散了……', '现在每天给客人报菜名，也算还在唱戏呢～'], 80: ['今儿个我只给掌柜的一个人唱一段～', '（大堂里静悄悄的，只有她的歌声）'] },
  sanxian: { 40: ['掌柜的，我说过的故事里，有一个是真的。', '……哪一个？那可不能告诉你。'], 80: ['老夫走了半辈子江湖，没见过比云来更像家的地方。', '往后，老夫就把这儿的故事讲遍天下！'] },
  qianbuduo: { 40: ['掌柜的，你这本账，比老朽四十年见过的都干净。'], 80: ['老朽这把算盘，传给你了……哦，借你用用。'] },
  laomao: { 40: ['……小鱼干不错。', '再来一包，我告诉你个秘密：我以前不叫老猫。'], 80: ['我以前叫什么，不重要了。', '这儿挺好。有地方睡，有鱼吃，还有人不嫌我懒。'] },
  yunshang: { 40: ['掌柜的，你不问我为什么离开京城吗？', '……谢谢你不问。'], 80: ['这首曲子是我自己写的，叫《云来》。', '送给你，也送给这间客栈。'] },
  jinbuhuan: { 40: ['小掌柜，你这茶叶不错。老夫在御膳房时，可没少喝好茶。'], 80: ['老夫一生只收过一个徒弟……罢了，你也算半个。', '今天教你一句：做菜如做人，火候到了，自然就香。'] },
};

/* ---------- 评选日 ---------- */
function setupContest() {
  if (W.contestSet) return; W.contestSet = true;
  W.ev.contest = true; W.ev.name = '评选日';
  [[10, '评审·白老饕', 0], [13.5, '评审·秦三爷', 1], [17.2, '评审·赵大人', 2]].forEach(([hour, label, j]) => W.specials.push({ hour, type: 'judge', opts: { label, judge: j } }));
}

/* ---------- 结局 ---------- */
function showEnding() {
  const S = G.stats;
  UI.modal('天下第一客栈', null, body => {
    body.appendChild(h('div', { class: 'summary' },
      h('div', { class: 'sum-stamp' }, '完'),
      h('p', { class: 'sum-note' }, `${G.name}掌柜用了 ${S.days} 天，把一间破落客栈做成了天下第一。`),
      h('div', { class: 'statgrid' }, ...[['接待客人', fmt(S.served) + ' 位'], ['累计进账', fmt(S.income) + ' 文'], ['赞不绝口', fmt(S.great) + ' 回'], ['住店客人', fmt(S.lodgers) + ' 位'], ['研发新菜', S.researched + ' 道'], ['伙计', G.staff.length + ' 位']].map(([a, b]) => h('div', null, a, h('b', null, b)))),
      h('p', { class: 'sum-note' }, '客栈还会继续开下去。想接着经营，就点下面的按钮。'),
      h('div', { class: 'row-center' }, h('button', { class: 'btn red big', onclick: () => UI.close() }, '继续经营'))));
  }, { closable: false, onClose: () => Flow.nextDay() });
}
