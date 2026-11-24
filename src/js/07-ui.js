/* ================= 界面 ================= */
function toast(text, kind) {
  if (!G || G.demo) return;
  const box = UI.modalOpen ? $('#toasts-top') : $('#toasts');
  const t = h('div', { class: 'toast' + (kind ? ' ' + kind : '') }, text);
  box.appendChild(t);
  while (box.children.length > 4) box.removeChild(box.firstChild);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 2600);
}
function tipOnce(key, text) { if (!G || G.demo || G.seenTips[key]) return; G.seenTips[key] = 1; toast(text); }

/* ---------- 对话 ---------- */
const Dlg = {
  open: false, queue: [], cur: null, shown: 0, full: '', resolve: null, typing: false, acc: 0,
  who(id) {
    if (id === 'boss') return { name: G.name, look: (G.gender === 'f' ? NPC.boss_f : NPC.boss_m).look };
    if (id === 'narr') return { name: '', look: null };
    if (id === 'sys') return { name: '小贴士', look: null };
    if (STAFF[id]) return { name: STAFF[id].name, look: STAFF[id].look };
    if (NPC[id]) return { name: NPC[id].name, look: NPC[id].look };
    return { name: id, look: null };
  },
  fill(text) { return text.replace(/\{name\}/g, G.name).replace(/\{nephew\}/g, G.gender === 'f' ? '侄女' : '侄儿').replace(/\{kid\}/g, G.gender === 'f' ? '臭丫头' : '臭小子'); },
  run(lines) {
    return new Promise(res => {
      if (!lines || !lines.length) { res(); return; }
      this.queue = lines.slice(); this.resolve = res; this.open = true;
      $('#dlg').hidden = false;
      this.next();
    });
  },
  next() {
    const el = $('#dlg');
    if (!this.queue.length) {
      this.open = false; el.hidden = true; this.cur = null;
      const r = this.resolve; this.resolve = null; if (r) r();
      return;
    }
    const ln = this.queue.shift();
    if (typeof ln === 'function') { const more = ln(); if (Array.isArray(more)) this.queue.unshift(...more); this.next(); return; }
    this.cur = ln;
    const w = this.who(ln.who);
    $('.name', el).textContent = ln.name || w.name;
    const pt = $('.portrait', el);
    pt.classList.toggle('none', !w.look);
    this.look = w.look; this.expr = ln.expr || 'normal';
    if (w.look) drawPortrait($('canvas', pt), w.look, this.expr, 'talk');
    this.full = this.fill(ln.text); this.shown = 0; this.typing = true; this.acc = 0;
    $('.text', el).textContent = '';
    $('.text', el).style.fontStyle = ln.who === 'narr' ? 'italic' : 'normal';
    $('.text', el).style.color = ln.who === 'narr' ? '#5a4a3a' : ln.who === 'sys' ? '#2a5a3a' : '';
    const ch = $('.choices', el); ch.innerHTML = '';
    $('.more', el).style.visibility = 'hidden';
  },
  tick(dt) {
    if (!this.open || !this.cur) return;
    const el = $('#dlg');
    if (this.typing) {
      this.acc += dt * 42;
      const n = Math.min(this.full.length, Math.floor(this.acc));
      if (n !== this.shown) { this.shown = n; $('.text', el).textContent = this.full.slice(0, n); if (n % 3 === 0) Sound.play('type'); }
      if (this.look && Math.floor(this.acc) % 4 === 0) drawPortrait($('canvas', $('.portrait', el)), this.look, this.expr, this.shown < this.full.length ? 'talk' : null);
      if (this.shown >= this.full.length) this.finishTyping();
    }
  },
  finishTyping() {
    const el = $('#dlg');
    this.typing = false; this.shown = this.full.length; $('.text', el).textContent = this.full;
    if (this.look) drawPortrait($('canvas', $('.portrait', el)), this.look, this.expr, null);
    const ln = this.cur;
    if (ln.choices) {
      const ch = $('.choices', el); ch.innerHTML = '';
      ln.choices.forEach(c => {
        const b = h('button', { class: 'btn small' + (c.red ? ' red' : c.green ? ' green' : ''), onclick: e => { e.stopPropagation(); Sound.play('click'); const more = c.fn ? c.fn() : null; if (Array.isArray(more)) this.queue.unshift(...more); this.next(); } }, c.text);
        if (c.disabled) b.disabled = true;
        ch.appendChild(b);
      });
      $('.more', el).style.visibility = 'hidden';
    } else $('.more', el).style.visibility = 'visible';
  },
  click() {
    if (!this.open || !this.cur) return;
    if (this.typing) { this.finishTyping(); return; }
    if (this.cur.choices) return;
    Sound.play('click');
    this.next();
  },
};

/* ---------- 主界面 ---------- */
const UI = {
  modalOpen: false, panel: null, tab: null, onClose: null,
  init() {
    $('#i-coin').src = iconURL('coin', 22); $('#i-fame').src = iconURL('flower', 22);
    const icons = { 'b-menu': 'menu', 'b-staff': 'staff', 'b-build': 'build', 'b-quest': 'quest', 'b-ledger': 'ledger' };
    Object.entries(icons).forEach(([id, ic]) => { const img = $('#' + id + ' img'); if (img) img.src = iconURL(ic, 24); });
    $('#b-menu').onclick = () => this.openPanel('menu');
    $('#b-staff').onclick = () => this.openPanel('staff');
    $('#b-build').onclick = () => this.openPanel('build');
    $('#b-quest').onclick = () => this.openPanel('quest');
    $('#b-ledger').onclick = () => this.openPanel('ledger');
    $('#b-sys').onclick = () => this.openPanel('sys');
    $('#b-open').onclick = () => { Sound.play('click'); Flow.openShop(); };
    $('#m-close').onclick = () => this.close();
    $('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && this.closable) this.close(); });
    $$('#speedseg .hbtn').forEach(b => b.onclick = () => { Sound.play('click'); this.setSpeed(+b.dataset.speed); });
    $('#b-music').onclick = () => this.toggleMusic();
    $('#dlg').addEventListener('click', () => Dlg.click());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.modalOpen && this.closable) this.close();
      if ((e.key === ' ' || e.key === 'Enter') && Dlg.open && !this.modalOpen && document.activeElement && document.activeElement.tagName !== 'BUTTON') { e.preventDefault(); Dlg.click(); }
    });
    const pr = Store.get(PREF_KEY, {});
    if (pr.sfx === false) Sound.sfxOn = false;
    if (pr.music === false) Sound.musicOn = false;
    this.speed = pr.speed >= 2 ? 2 : 1;
    this.syncToggles();
  },
  savePrefs() { Store.set(PREF_KEY, { sfx: Sound.sfxOn, music: Sound.musicOn, speed: this.speed }); },
  toggleMusic() {
    Sound.musicOn = !Sound.musicOn;
    if (Sound.musicOn) { Sound.init(); Sound.resume(); Sound.startMusic(); } else Sound.stopMusic();
    this.savePrefs(); this.syncToggles(); Sound.play('click');
  },
  toggleSfx() { Sound.sfxOn = !Sound.sfxOn; this.savePrefs(); this.syncToggles(); Sound.play('click'); },
  syncToggles() {
    const mb = $('#b-music');
    mb.classList.toggle('on', Sound.musicOn); mb.classList.toggle('off', !Sound.musicOn);
    mb.setAttribute('aria-pressed', Sound.musicOn ? 'true' : 'false');
    mb.title = Sound.musicOn ? '背景音乐：开（点一下关掉）' : '背景音乐：关（点一下打开）';
    $$('#speedseg .hbtn').forEach(b => b.classList.toggle('on', +b.dataset.speed === this.speed));
  },
  setSpeed(s) { this.speed = s; this.savePrefs(); this.syncToggles(); },
  showGame(on) { $('#hud').hidden = !on; $('#rail').hidden = !on; $('#goalbar').hidden = !on; $('#title-ui').hidden = on; },
  hud() {
    if (!G || G.demo || $('#hud').hidden) return;
    $('#h-dayn').textContent = '第' + cnNum(G.day) + '天';
    let tm = '';
    if (W.phase === 'morning') tm = '辰时 · 未开张';
    else if (W.phase === 'night') tm = '亥时 · 已打烊';
    else if (W.phase === 'closing') tm = '戌时 · 打烊中';
    else tm = hourName(curHour()) + (W.ev.name ? ' · ' + W.ev.name : '');
    $('#h-time').textContent = tm;
    $('#h-money').textContent = fmt(G.money);
    $('#h-fame').textContent = fmt(G.fame);
    $('#h-stars').textContent = '★'.repeat(G.star) + '☆'.repeat(5 - G.star);
    const nxt = STARS[G.star + 1]; const prev = G.star > 1 ? STARS[G.star].fame : 0;
    $('#h-fbar').style.width = (nxt ? clamp((G.fame - prev) / (nxt.fame - prev), 0, 1) * 100 : 100) + '%';
    $('#h-fbar').parentNode.title = nxt ? `升${cnNum(G.star + 1)}星需要名气 ${nxt.fame}` : '已是五星客栈';
    const en = $('#h-en'); const max = energyMax();
    if (en.children.length !== max) { en.innerHTML = ''; for (let i = 0; i < max; i++) en.appendChild(h('i')); }
    Array.from(en.children).forEach((c, i) => c.classList.toggle('on', i < W.en));
    this.goal();
    this.dots();
  },
  hudPulse() { this.hud(); },
  goal() {
    const g = G.daily; const gb = $('#goalbar');
    if (!g) { gb.innerHTML = ''; return; }
    const [cur, done] = Flow.goalProgress(g);
    gb.innerHTML = '';
    gb.appendChild(h('span', { class: 'g-tag' }, '今日目标'));
    gb.appendChild(h('span', { class: done ? 'g-done' : '' }, Flow.goalText(g) + (g.k === 'nobad' ? '' : `（${Math.min(cur, g.n)}/${g.n}）`) + (done ? ' ✓' : '')));
    gb.appendChild(h('span', null, `奖励 ${g.reward} 文`));
    if (W.ev.name && W.phase !== 'business') gb.appendChild(h('span', { class: 'g-tag' }, '今日：' + W.ev.name));
  },
  dots() {
    if (W.phase !== 'morning') { $$('#rail .dot').forEach(d => d.classList.remove('on')); return; }
    const canResearch = DISHES.some(d => !G.unlocked.includes(d.id) && d.rc > 0 && d.star <= G.star && G.money >= researchCost(d));
    const canBuild = BUILDS.some(b => G.build[b.id] < b.max && b.star[G.build[b.id]] <= G.star && G.money >= b.cost[G.build[b.id]] && buildAllowed(b));
    const staffNeed = G.staff.some(s => s.mood < 30) || STAFF_ORDER.some(id => canHire(id) === true && G.money >= STAFF[id].hire);
    $('#b-menu .dot').classList.toggle('on', canResearch);
    $('#b-build .dot').classList.toggle('on', canBuild);
    $('#b-staff .dot').classList.toggle('on', staffNeed);
    $('#b-quest .dot').classList.toggle('on', false);
  },
  onPhase() {
    const b = $('#b-open');
    if (W.phase === 'morning') { b.disabled = false; b.textContent = '开张营业'; }
    else if (W.phase === 'business') { b.disabled = true; b.textContent = '营业中……'; }
    else if (W.phase === 'closing') { b.disabled = true; b.textContent = '打烊收拾中'; }
    else { b.disabled = true; b.textContent = '已打烊'; }
    this.hud();
  },

  /* ---------- 弹窗 ---------- */
  modal(title, tabs, render, opts) {
    opts = opts || {};
    this.modalOpen = true; this.closable = opts.closable !== false; this.onClose = opts.onClose || null;
    $('#modal').hidden = false;
    $('#m-title').textContent = title;
    $('#m-close').hidden = !this.closable;
    const tb = $('#m-tabs'); tb.innerHTML = ''; tb.hidden = !tabs;
    this.renderBody = render;
    if (tabs) {
      if (!this.tab || !tabs.some(t => t[0] === this.tab)) this.tab = tabs[0][0];
      tabs.forEach(([k, label]) => tb.appendChild(h('button', { class: 'tab' + (k === this.tab ? ' on' : ''), onclick: () => { Sound.play('click'); this.tab = k; $$('.tab', tb).forEach(x => x.classList.toggle('on', x.textContent === label)); this.refresh(); } }, label)));
    }
    this.refresh();
    $('#m-body').scrollTop = 0;
  },
  refresh() { if (!this.modalOpen || !this.renderBody) { this.hud(); return; } const body = $('#m-body'); const st = body.scrollTop; body.innerHTML = ''; this.renderBody(body, this.tab); body.scrollTop = st; this.hud(); },
  close() {
    if (!this.modalOpen) return;
    this.modalOpen = false; $('#modal').hidden = true; this.panel = null;
    const cb = this.onClose; this.onClose = null; if (cb) cb();
    this.hud();
  },
  openPanel(name) {
    Sound.play('click');
    this.panel = name;
    const P = Panels[name];
    this.tab = P.tab || null;
    this.modal(P.title, P.tabs || null, (b, t) => P.render(b, t));
  },
};

/* ---------- 各面板 ---------- */
function tagChips(tags) { return h('span', { style: 'display:flex;gap:4px;flex-wrap:wrap' }, tags.map(t => h('span', { class: 'chip', style: `background:${TAGS[t].color}` }, TAGS[t].name))); }
function stars(n, max) { return h('span', { class: 'stars-s', title: MASTERY_NAMES[n] }, '★'.repeat(n) + '☆'.repeat(max - n)); }
function researchCost(d) { return G.discount === d.id ? Math.round(d.rc / 2) : d.rc; }
function statBar(label, v, max) { return h('div', { class: 'statbar' }, h('span', null, label), h('div', { class: 'sb' }, h('i', { style: `width:${clamp(v / (max || 100), 0, 1) * 100}%` })), h('em', null, String(Math.round(v)))); }
function portraitCanvas(look, size, expr) { const c = h('canvas', { width: size * 2, height: size * 2 }); drawPortrait(c, look, expr || 'normal'); return h('div', { class: 'portrait-s' }, c); }
function buildAllowed(b) { if (b.id === 'table' && tableCount() >= 6) return false; return true; }
function canHire(id) {
  const d = STAFF[id];
  if (G.staff.some(s => s.id === id)) return 'hired';
  if (d.story && !G.flags[d.story]) return 'story';
  if (d.star > G.star) return 'star';
  if (d.role === 'artist' && !G.build.stage) return 'stage';
  if (roleCount(d.role) >= roleCap(d.role)) return 'cap';
  return true;
}

const Panels = {
  menu: {
    title: '菜谱', tabs: [['menu', '今日菜单'], ['research', '研发新菜']],
    render(body, tab) {
      if (tab === 'menu') {
        body.appendChild(h('p', { class: 'hint' }, `菜单上架 ${G.menu.length}/${menuSlots()} 道（星级越高，能上架的越多）。客人只点菜单上的菜：镇民爱主食和茶，书生爱茶点，镖师、侠客爱荤菜和酒，云游僧只吃素，行商和贵客偏爱精致菜。菜做得越多越熟练，价钱也越高。`));
        const grid = h('div', { class: 'grid' });
        G.unlocked.map(id => DISH[id]).forEach(d => {
          const on = G.menu.includes(d.id); const md = dm(d.id); const lv = masteryLv(md.m);
          const btn = h('button', { class: 'btn small' + (on ? '' : ' green'), onclick: () => {
            if (on) { if (G.menu.length <= 1) { toast('菜单上至少留一道菜'); return; } G.menu = G.menu.filter(x => x !== d.id); }
            else { if (G.menu.length >= menuSlots()) { toast('菜单已满，先撤下一道'); Sound.play('deny'); return; } G.menu.push(d.id); }
            Sound.play('click'); UI.refresh();
          } }, on ? '撤下' : '上架');
          grid.appendChild(h('div', { class: 'card' + (on ? ' on' : '') },
            on ? h('span', { class: 'stamp' }, '在售') : null,
            h('div', { class: 'row' }, h('div', { class: 'ico' }, iconImg(DISH[d.id].icon, 40)), h('div', { style: 'min-width:0' }, h('h4', null, d.name), tagChips(d.tags))),
            h('div', { class: 'sub' }, d.desc),
            h('div', { class: 'meta' }, h('span', null, '售价 ', h('b', null, dishPrice(d.id) + '文')), h('span', null, '成本 ', h('b', null, Math.round(d.cost * costMult()) + '文')), h('span', null, '耗时 ', h('b', null, d.time + '刻'))),
            h('div', { class: 'meta' }, h('span', null, '熟练：', MASTERY_NAMES[lv], ' '), stars(lv, 4), h('span', null, '已卖 ', h('b', null, String(md.sold)))),
            h('div', { class: 'acts' }, btn)));
        });
        body.appendChild(grid);
      } else {
        body.appendChild(h('p', { class: 'hint' }, '花钱请冯大勺琢磨新菜。研发成功后会自动加到菜谱里，菜单有空位就直接上架。'));
        const grid = h('div', { class: 'grid' });
        const list = DISHES.filter(d => !G.unlocked.includes(d.id) && !d.secret);
        if (!list.length) body.appendChild(h('p', { class: 'hint' }, '所有菜都学会了！'));
        list.forEach(d => {
          const lockStar = d.star > G.star; const cost = researchCost(d);
          const btn = h('button', { class: 'btn small red', disabled: lockStar || G.money < cost, onclick: () => Flow.research(d.id) }, lockStar ? `${cnNum(d.star)}星解锁` : h('span', null, '研发 ', h('span', { class: 'cost' }, cost + '文')));
          grid.appendChild(h('div', { class: 'card' + (lockStar ? ' lock' : '') },
            G.discount === d.id ? h('span', { class: 'stamp' }, '半价') : null,
            h('div', { class: 'row' }, h('div', { class: 'ico', style: lockStar ? 'filter:grayscale(1);opacity:.6' : '' }, iconImg(d.icon, 40)), h('div', { style: 'min-width:0' }, h('h4', null, d.name), tagChips(d.tags))),
            h('div', { class: 'sub' }, d.desc),
            h('div', { class: 'meta' }, h('span', null, '售价 ', h('b', null, d.price + '文')), h('span', null, '成本 ', h('b', null, d.cost + '文')), h('span', null, '耗时 ', h('b', null, d.time + '刻'))),
            h('div', { class: 'acts' }, btn)));
        });
        body.appendChild(grid);
      }
    },
  },
  staff: {
    title: '伙计', tabs: [['list', '伙计们'], ['hire', '招募']],
    render(body, tab) {
      if (tab === 'list') {
        body.appendChild(h('p', { class: 'hint' }, '伙计干活攒经验会升级。每天可以培训、打赏、送礼、聊天各一次；好感满两颗心、四颗心时本事会变大。心情太差又发不出工钱，新来的伙计可能会走人。'));
        const grid = h('div', { class: 'grid' });
        G.staff.forEach(s => grid.appendChild(staffCard(s)));
        body.appendChild(grid);
      } else {
        body.appendChild(h('p', { class: 'hint' }, `厨子 ${roleCount('cook')}/${roleCap('cook')}（每口灶一位）· 跑堂 ${roleCount('waiter')}/3 · 账房 ${roleCount('clerk')}/1 · 护院 ${roleCount('guard')}/1 · 艺人 ${roleCount('artist')}/${roleCap('artist')}（要先搭说书台）`));
        const grid = h('div', { class: 'grid' });
        STAFF_ORDER.forEach(id => {
          const d = STAFF[id]; const st = canHire(id);
          if (st === 'hired') return;
          const role = ROLES[d.role];
          if (st === 'story') { grid.appendChild(h('div', { class: 'card lock' }, h('div', { class: 'row' }, h('div', { class: 'portrait-s', style: 'display:flex;align-items:center;justify-content:center;font-size:28px;color:#a08868' }, '?'), h('div', null, h('h4', null, '尚未结识'), h('div', { class: 'sub' }, `一位${role.name}，听说客栈${cnNum(d.star)}星之后会出现……`))))); return; }
          const reason = { star: `${cnNum(d.star)}星后才肯来`, stage: '要先搭说书台', cap: d.role === 'cook' ? '灶台不够，先加砌灶台' : `${role.name}已经满员` }[st];
          const btn = h('button', { class: 'btn small red', disabled: st !== true || G.money < d.hire, onclick: () => Flow.hire(id) }, st === true ? h('span', null, '招募 ', h('span', { class: 'cost' }, d.hire ? d.hire + '文' : '免费')) : reason);
          grid.appendChild(h('div', { class: 'card' + (st === true ? '' : ' lock') },
            h('div', { class: 'row' }, portraitCanvas(d.look, 64), h('div', { style: 'min-width:0' }, h('h4', null, d.name), h('span', { class: 'chip', style: `background:${role.color}` }, role.name))),
            h('div', { class: 'sub' }, d.bio),
            statBar(role.statName, d.base[role.stat], 100), statBar('脚力', d.base.speed, 100),
            h('div', { class: 'meta' }, h('span', null, '工钱 ', h('b', null, d.wage + '文/天'))),
            h('div', { class: 'acts' }, btn)));
        });
        body.appendChild(grid);
      }
    },
  },
  build: {
    title: '装修', tabs: BUILD_CATS,
    render(body, tab) {
      const amb = ambience();
      body.appendChild(h('p', { class: 'hint' }, `大堂环境 ${amb}（越高客人越满意，贵客尤其在意）· 桌子 ${tableCount()}/6 · 客房 ${roomCount()}/6 · 灶台 ${stoveCount()}/3`));
      const grid = h('div', { class: 'grid' });
      BUILDS.filter(b => b.cat === tab).forEach(b => {
        const lv = G.build[b.id]; const maxed = lv >= b.max || !buildAllowed(b);
        const cost = b.cost[lv]; const needStar = b.star[lv];
        let status = '';
        if (b.id === 'table') status = `桌子 ${tableCount()} 张`;
        else if (b.id === 'room') status = `可住客房 ${roomCount()} 间`;
        else if (b.id === 'stove') status = `灶台 ${stoveCount()} 口`;
        else if (b.names) status = lv ? '现在：' + b.names[lv - 1] : '尚未添置';
        else status = lv ? '已添置' : '尚未添置';
        const nextName = b.names && !maxed ? b.names[lv] : '';
        const btn = maxed ? h('button', { class: 'btn small', disabled: true }, lv ? '已满级' : '—')
          : h('button', { class: 'btn small red', disabled: needStar > G.star || G.money < cost, onclick: () => Flow.buy(b.id) }, needStar > G.star ? `${cnNum(needStar)}星解锁` : h('span', null, (lv && b.max > 1 ? '升级' : '购买') + (nextName ? '·' + nextName : '') + ' ', h('span', { class: 'cost' }, cost + '文')));
        grid.appendChild(h('div', { class: 'card' + (maxed && lv ? ' on' : '') },
          h('div', { class: 'row' }, h('div', { class: 'ico' }, iconImg(b.icon, 40)), h('div', { style: 'min-width:0' }, h('h4', null, b.name), h('div', { class: 'sub' }, status))),
          h('div', { class: 'sub' }, b.desc),
          h('div', { class: 'meta' }, b.amb ? h('span', null, '环境 ', h('b', null, '+' + b.amb)) : null, b.effect ? h('span', null, b.effect) : null, b.max > 1 ? h('span', null, `等级 ${lv}/${b.max}`) : null),
          h('div', { class: 'acts' }, btn)));
      });
      body.appendChild(grid);
    },
  },
  quest: {
    title: '任务',
    render(body) {
      const nx = G.star < 5 ? STARS[G.star + 1] : null;
      body.appendChild(h('div', { class: 'sect' }, nx ? `升${cnNum(G.star + 1)}星的条件` : '五星客栈', h('small', null, nx ? '全部达成后，当晚打烊时自动升星' : (G.flags.won ? '已是天下第一客栈' : '等待天下客栈评选'))));
      if (nx) {
        const ul = h('ul', { class: 'qlist' });
        Flow.starReqs(G.star + 1).forEach(r => {
          const ok = r.cur >= r.need;
          ul.appendChild(h('li', { class: ok ? 'done' : 'cur' }, h('span', { class: 'qcheck' }, ok ? '✓' : ''), h('span', { class: 'qn' }, r.name), h('span', { class: 'qd' }, r.fmt ? `${r.fmt(r.cur)} / ${r.fmt(r.need)}` : `${fmt(r.cur)} / ${fmt(r.need)}`)));
        });
        body.appendChild(ul);
      }
      if (G.daily) {
        const [cur, done] = Flow.goalProgress(G.daily);
        body.appendChild(h('div', { class: 'sect' }, '今日目标'));
        body.appendChild(h('ul', { class: 'qlist' }, h('li', { class: done ? 'done' : 'cur' }, h('span', { class: 'qcheck' }, done ? '✓' : ''), h('span', { class: 'qn' }, Flow.goalText(G.daily)), h('span', { class: 'qd' }, G.daily.k === 'nobad' ? '打烊时结算' : `${Math.min(cur, G.daily.n)} / ${G.daily.n}`), h('span', { class: 'qr' }, `+${G.daily.reward}文`))));
      }
      body.appendChild(h('div', { class: 'sect' }, '客栈大事'));
      const ul = h('ul', { class: 'qlist' });
      QUESTS.forEach((q, i) => {
        const st = i < G.quest ? 'done' : i === G.quest ? 'cur' : '';
        if (i > G.quest + 2) return;
        ul.appendChild(h('li', { class: st }, h('span', { class: 'qcheck' }, i < G.quest ? '✓' : ''), h('span', { class: 'qn' }, i > G.quest ? '？？？' : q.name), h('span', { class: 'qd' }, i > G.quest ? '完成前一个任务后揭晓' : q.desc), h('span', { class: 'qr' }, `+${q.money}文`)));
      });
      body.appendChild(ul);
    },
  },
  ledger: {
    title: '账本',
    render(body) {
      const S = G.stats;
      body.appendChild(h('div', { class: 'statgrid' },
        ...[['开业天数', S.days + ' 天'], ['累计接待', fmt(S.served) + ' 位'], ['累计进账', fmt(S.income) + ' 文'], ['单日最佳', fmt(S.bestDay) + ' 文'], ['赞不绝口', fmt(S.great) + ' 回'], ['住店客人', fmt(S.lodgers) + ' 位'], ['赶走地痞', S.thugs + ' 回'], ['抓到毛贼', S.thieves + ' 个'], ['研发新菜', S.researched + ' 道'], ['大堂环境', ambience() + ' 点']].map(([a, b]) => h('div', null, a, h('b', null, b)))));
      body.appendChild(h('div', { class: 'sect' }, '最近的流水', h('small', null, '柱子是每天净赚，折线是名气')));
      const box = h('div', { class: 'chartbox' }); const cv = h('canvas', { width: 1400, height: 300 }); box.appendChild(cv); body.appendChild(box);
      requestAnimationFrame(() => drawLedgerChart(cv));
      body.appendChild(h('div', { class: 'sect' }, '江湖见闻'));
      if (!G.log.length) body.appendChild(h('p', { class: 'hint' }, '还没什么值得一记的事。'));
      body.appendChild(h('ul', { class: 'loglist' }, G.log.slice(0, 30).map(l => h('li', null, h('b', null, '第' + cnNum(l.d) + '天'), l.t))));
    },
  },
  sys: {
    title: '系统',
    render(body) {
      const tg = (label, on, fn) => h('button', { class: 'btn' + (on ? ' green' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: () => { fn(); UI.refresh(); } }, `${label}：${on ? '开' : '关'}`);
      body.appendChild(h('div', { class: 'row-center', style: 'margin-bottom:12px' }, tg('背景音乐', Sound.musicOn, () => UI.toggleMusic()), tg('音效', Sound.sfxOn, () => UI.toggleSfx())));
      const row = h('div', { class: 'row-center' });
      row.appendChild(h('button', { class: 'btn', onclick: () => { Flow.save(true); } }, '保存进度'));
      row.appendChild(h('button', { class: 'btn', onclick: () => { UI.panel = 'help'; UI.modal('游戏说明', null, b => Panels.help.render(b)); } }, '游戏说明'));
      row.appendChild(h('button', { class: 'btn red', onclick: () => { b2.hidden = false; } }, '重新开始'));
      body.appendChild(row);
      const b2 = h('div', { class: 'row-center', hidden: true }, h('span', { style: 'font-size:14px;color:#8a2118;align-self:center' }, '确定要重新开始吗？本机的存档会被覆盖。'), h('button', { class: 'btn small red', onclick: () => { Store.del(SAVE_KEY); UI.close(); Flow.toTitle(); } }, '确定'), h('button', { class: 'btn small', onclick: () => { b2.hidden = true; } }, '取消'));
      body.appendChild(b2);
      body.appendChild(h('p', { class: 'hint', style: 'margin-top:14px;text-align:center' }, '每晚打烊后自动保存到本机浏览器。换设备或清理浏览器数据后，存档不会跟过去。'));
    },
  },
  help: {
    render(body) {
      body.appendChild(h('div', { class: 'help' },
        h('h3', null, '怎么玩'),
        h('p', null, '你从三叔公手里接下了落霞镇的「云来客栈」。每天早上准备，点「开张营业」开门迎客，从辰时一直忙到戌时打烊，晚上结账。目标是把客栈做到五星，并在天下客栈评选里夺魁。'),
        h('h3', null, '营业时'),
        h('p', null, '客人进门自己找空桌。头上冒「点菜」气泡时，跑堂会过去招呼；菜做好会摆在后厨出菜台上，等跑堂端走；客人吃完留下铜钱，桌子要擦干净才能接下一桌。'),
        h('p', null, '忙不过来？直接点：点菜气泡（亲自招呼）、出菜台上的菜（亲自上菜）、脏桌子（亲自擦）、排队客人的茶碗（先上碗茶，多等一会儿）、正在炒菜的灶台（加把火）。这些会消耗精力，精力会慢慢恢复。点铜钱、抓小毛贼、赶地痞、拦吃霸王餐的不花精力。'),
        h('h3', null, '经营'),
        h('p', null, '「菜谱」研发新菜、调整菜单；「伙计」招人、培训、送礼；「装修」添桌子、修客房、挂灯笼、换招牌；「任务」看升星条件。客人满意度看菜好不好吃、合不合口味、等了多久、大堂环境、伙计招呼。满意的客人给名气和赏钱，名气越高客人越多。'),
        h('h3', null, '小窍门'),
        h('p', null, '中午和傍晚是饭点，客人最多。下午来的行商、镖师常常要住店，房钱晚上一起结。每个伙计喜欢的礼物不一样，多试几次就知道了。')));
    },
  },
};

function staffCard(s) {
  const d = STAFF[s.id]; const role = ROLES[d.role];
  const today = G.day;
  const moodTxt = s.mood >= 70 ? '开心' : s.mood >= 40 ? '一般' : s.mood >= 20 ? '低落' : '想走人';
  const moodCol = s.mood >= 70 ? '#2a6642' : s.mood >= 40 ? '#6a4a30' : '#c0392b';
  const hearts = Math.floor(s.aff / 20);
  const trainCost = s.lv * 25;
  const giftBox = h('div', { class: 'acts', hidden: true });
  const gp = G.giftSale === G.day ? 0.5 : 1;
  GIFTS.forEach(g => { const pr = Math.ceil(g.price * gp); giftBox.appendChild(h('button', { class: 'btn small', disabled: G.money < pr, title: `${pr}文`, onclick: () => Flow.gift(s, g.id, pr) }, `${g.name} ${pr}文`)); });
  const fireBox = h('div', { class: 'acts', hidden: true }, h('span', { style: 'font-size:12px;color:#8a2118;align-self:center' }, `真要辞退${d.name}吗？`), h('button', { class: 'btn small red', onclick: () => Flow.fire(s) }, '辞退'), h('button', { class: 'btn small', onclick: () => { fireBox.hidden = true; } }, '算了'));
  const acts = h('div', { class: 'acts' },
    h('button', { class: 'btn small', disabled: s.trained === today || s.lv >= 10 || G.money < trainCost, title: '经验 +30，体力 -15', onclick: () => Flow.train(s, trainCost) }, s.lv >= 10 ? '已满级' : s.trained === today ? '今日已培训' : `培训 ${trainCost}文`),
    h('button', { class: 'btn small', disabled: s.bonused === today || G.money < 20, title: '心情 +15', onclick: () => Flow.bonus(s) }, s.bonused === today ? '已打赏' : '打赏 20文'),
    h('button', { class: 'btn small', disabled: s.gifted === today, onclick: () => { giftBox.hidden = !giftBox.hidden; } }, s.gifted === today ? '已送礼' : '送礼'),
    h('button', { class: 'btn small', disabled: s.chatted === today, onclick: () => Flow.chat(s) }, s.chatted === today ? '已聊过' : '聊天'),
    d.start ? null : h('button', { class: 'btn small', onclick: () => { fireBox.hidden = false; } }, '辞退'));
  const known = Object.keys(s.known || {}).map(k => GIFT[k].name + (s.known[k] === 'love' ? '（最爱）' : s.known[k] === 'like' ? '（喜欢）' : '（一般）'));
  return h('div', { class: 'card' },
    h('div', { class: 'row' }, portraitCanvas(d.look, 64, s.mood >= 70 ? 'happy' : s.mood < 30 ? 'sad' : 'normal'), h('div', { style: 'min-width:0;flex:1' },
      h('h4', null, d.name, ' ', h('small', { style: 'color:#8a6a4a' }, 'Lv.' + s.lv)),
      h('span', { class: 'chip', style: `background:${role.color}` }, role.name), ' ',
      h('span', { class: 'hearts', title: `好感 ${s.aff}/100` }, '♥'.repeat(hearts) + '♡'.repeat(5 - hearts)))),
    statBar(role.statName, sstat(s, role.stat), 120), statBar('脚力', sstat(s, 'speed'), 100),
    statBar('经验', s.lv >= 10 ? 1 : s.exp, s.lv >= 10 ? 1 : expNeed(s.lv)),
    h('div', { class: 'meta' }, h('span', null, '心情 ', h('b', { style: `color:${moodCol}` }, moodTxt)), h('span', null, '体力 ', h('b', null, Math.round(s.energy) + '')), h('span', null, '工钱 ', h('b', null, d.wage + '文')), s.sickDay === G.day ? h('span', { style: 'color:#c0392b' }, '今日病休') : null),
    known.length ? h('div', { class: 'sub' }, '送过：' + known.join('、')) : null,
    acts, giftBox, fireBox);
}

function drawLedgerChart(cv) {
  const ctx = cv.getContext('2d'); const W2 = cv.width, H2 = cv.height;
  ctx.clearRect(0, 0, W2, H2);
  const data = G.hist.slice(-14);
  ctx.font = '22px ' + FONT_U; ctx.fillStyle = '#8a6a4a';
  if (!data.length) { ctx.textAlign = 'center'; ctx.fillText('打烊结账后，这里会画出每天的流水', W2 / 2, H2 / 2); return; }
  const padL = 70, padR = 70, padT = 20, padB = 46;
  const maxNet = Math.max(100, ...data.map(d => Math.abs(d.net)));
  const maxFame = Math.max(50, ...data.map(d => d.fame));
  const bw = (W2 - padL - padR) / 14;
  const zeroY = padT + (H2 - padT - padB) * (maxNet / (maxNet * (data.some(d => d.net < 0) ? 2 : 1)));
  const scaleY = (zeroY - padT) / maxNet;
  ctx.strokeStyle = 'rgba(120,80,40,.2)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(padL, zeroY); ctx.lineTo(W2 - padR, zeroY); ctx.stroke();
  data.forEach((d, i) => {
    const x = padL + i * bw + bw * 0.18, w = bw * 0.64;
    const hh = d.net * scaleY;
    ctx.fillStyle = d.net >= 0 ? '#d9a33a' : '#c0392b';
    ctx.fillRect(x, d.net >= 0 ? zeroY - hh : zeroY, w, Math.abs(hh));
    ctx.fillStyle = '#6a4a30'; ctx.textAlign = 'center'; ctx.font = '20px ' + FONT_U;
    ctx.fillText('第' + d.d + '天', x + w / 2, H2 - 14);
    if (i === data.length - 1 || data.length <= 7) { ctx.fillStyle = '#2a1a10'; ctx.fillText(fmt(d.net), x + w / 2, (d.net >= 0 ? zeroY - hh : zeroY + Math.abs(hh)) + (d.net >= 0 ? -8 : 22)); }
  });
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 4; ctx.beginPath();
  data.forEach((d, i) => { const x = padL + i * bw + bw / 2, y = padT + (H2 - padT - padB) * (1 - d.fame / maxFame); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
  ctx.stroke();
  data.forEach((d, i) => { const x = padL + i * bw + bw / 2, y = padT + (H2 - padT - padB) * (1 - d.fame / maxFame); ctx.fillStyle = '#c0392b'; circ(ctx, x, y, i === data.length - 1 ? 8 : 5); ctx.fill(); });
  const last = data[data.length - 1]; ctx.fillStyle = '#c0392b'; ctx.textAlign = 'left'; ctx.font = '20px ' + FONT_U;
  ctx.fillText('名气 ' + fmt(last.fame), W2 - padR + 6, padT + (H2 - padT - padB) * (1 - last.fame / maxFame) + 6);
}
