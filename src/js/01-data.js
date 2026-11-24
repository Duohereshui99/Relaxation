/* ================= 数据 ================= */
const TAGS = {
  tea: { name: '茶', color: '#5f9a48' },
  wine: { name: '酒', color: '#b5562b' },
  staple: { name: '主食', color: '#b8913a' },
  veg: { name: '素', color: '#3f9160' },
  meat: { name: '荤', color: '#b8433a' },
  fish: { name: '鱼鲜', color: '#3a78a6' },
  sweet: { name: '甜点', color: '#c76794' },
  fancy: { name: '精致', color: '#8a5cc4' },
};

const DISHES = [
  { id: 'tea', name: '大碗粗茶', price: 3, cost: 1, time: 2, tags: ['tea'], star: 1, rc: 0, icon: 'teacup', desc: '一大碗粗茶，解渴又实惠。' },
  { id: 'noodle', name: '阳春面', price: 8, cost: 3, time: 5, tags: ['staple'], star: 1, rc: 0, icon: 'noodle', desc: '清汤细面，撒一把葱花。' },
  { id: 'bun', name: '肉包子', price: 6, cost: 2, time: 4, tags: ['staple', 'meat'], star: 1, rc: 0, icon: 'bun', desc: '皮薄馅大，一口一兜油。' },
  { id: 'peanut', name: '油炸花生米', price: 5, cost: 1, time: 3, tags: ['veg'], star: 1, rc: 0, icon: 'peanut', desc: '下酒头一号好菜。' },
  { id: 'shaojiu', name: '烧刀子', price: 12, cost: 4, time: 2, tags: ['wine'], star: 1, rc: 60, icon: 'wine', desc: '烈酒一壶，喝了浑身是劲。' },
  { id: 'tofu', name: '小葱拌豆腐', price: 10, cost: 3, time: 4, tags: ['veg'], star: 1, rc: 80, icon: 'tofu', desc: '一清二白，素净爽口。' },
  { id: 'pork', name: '红烧肉', price: 26, cost: 9, time: 9, tags: ['meat'], star: 1, rc: 180, icon: 'pork', desc: '肥而不腻，入口即化。' },
  { id: 'beef', name: '酱牛肉', price: 30, cost: 11, time: 7, tags: ['meat'], star: 2, rc: 300, icon: 'beef', desc: '切上二斤，江湖人的最爱。' },
  { id: 'cake', name: '桂花糕', price: 16, cost: 5, time: 6, tags: ['sweet'], star: 2, rc: 220, icon: 'cake', desc: '香甜软糯，满口桂花香。' },
  { id: 'longjing', name: '明前龙井', price: 22, cost: 7, time: 3, tags: ['tea', 'fancy'], star: 2, rc: 260, icon: 'teapot', desc: '一壶好茶，雅士必点。' },
  { id: 'fish', name: '糖醋鲤鱼', price: 36, cost: 12, time: 10, tags: ['fish'], star: 2, rc: 380, icon: 'fish', desc: '外酥里嫩，酸甜可口。' },
  { id: 'secret', name: '云来卤肉', price: 46, cost: 13, time: 8, tags: ['meat', 'fancy'], star: 2, rc: -1, icon: 'braise', desc: '三叔公的独门秘方，人人都爱。', secret: true },
  { id: 'nverhong', name: '女儿红', price: 42, cost: 14, time: 2, tags: ['wine', 'fancy'], star: 3, rc: 520, icon: 'jar', desc: '埋了十八年的陈酿。' },
  { id: 'suzhai', name: '罗汉素斋', price: 28, cost: 9, time: 8, tags: ['veg', 'fancy'], star: 3, rc: 460, icon: 'veggies', desc: '香菇、木耳、豆腐、笋，十八样素材。' },
  { id: 'chicken', name: '叫花鸡', price: 46, cost: 16, time: 12, tags: ['meat'], star: 3, rc: 600, icon: 'chicken', desc: '荷叶裹着烤，一开满屋香。' },
  { id: 'zhouzi', name: '东坡肘子', price: 62, cost: 22, time: 13, tags: ['meat', 'fancy'], star: 4, rc: 950, icon: 'knuckle', desc: '色泽红亮，软糯醇香。' },
  { id: 'shrimp', name: '龙井虾仁', price: 72, cost: 25, time: 11, tags: ['fish', 'fancy'], star: 4, rc: 1100, icon: 'shrimp', desc: '虾仁玉白，茶香清雅。' },
  { id: 'duck', name: '八宝鸭', price: 88, cost: 30, time: 14, tags: ['meat', 'fancy'], star: 4, rc: 1300, icon: 'duck', desc: '鸭肚里塞满八样珍宝。' },
  { id: 'fotiao', name: '佛跳墙', price: 158, cost: 55, time: 18, tags: ['fancy', 'fish', 'meat'], star: 5, rc: 2600, icon: 'pot', desc: '坛启荤香飘四邻，佛闻弃禅跳墙来。' },
];
const DISH = Object.fromEntries(DISHES.map(d => [d.id, d]));
const MASTERY_NAMES = ['生疏', '入门', '熟练', '精通', '化境'];
const masteryLv = m => (m >= 100 ? 4 : m >= 60 ? 3 : m >= 30 ? 2 : m >= 10 ? 1 : 0);

/* ---------- 客人 ---------- */
const CTYPES = {
  villager: { name: '镇民', w: [0, 10, 8, 6, 5, 4], party: [1, 2], patience: 44, fav: ['staple', 'tea', 'veg'], avoid: [], budget: 13, lodge: 0.03, tip: 0.05, fame: 1 },
  scholar: { name: '书生', w: [0, 4, 4, 4, 3, 3], party: [1, 1], patience: 56, fav: ['tea', 'sweet', 'veg'], avoid: [], budget: 22, lodge: 0.14, tip: 0.06, fame: 1, art: true },
  escort: { name: '镖师', w: [0, 2.5, 4, 4, 4, 4], party: [2, 2], patience: 36, fav: ['meat', 'wine'], avoid: [], budget: 34, lodge: 0.45, tip: 0.1, fame: 1, big: true },
  monk: { name: '云游僧', w: [0, 1.5, 2, 2, 2, 2], party: [1, 1], patience: 70, fav: ['veg', 'tea'], avoid: ['meat', 'fish', 'wine'], budget: 30, lodge: 0.15, tip: 0, fame: 1.5 },
  merchant: { name: '行商', w: [0, 0, 3.5, 5, 5, 5], party: [1, 2], patience: 40, fav: ['fish', 'fancy', 'wine'], avoid: [], budget: 75, lodge: 0.6, tip: 0.15, fame: 1.2, picky: true },
  swordsman: { name: '侠客', w: [0, 0, 3, 4, 4, 4], party: [1, 1], patience: 40, fav: ['wine', 'meat'], avoid: [], budget: 50, lodge: 0.3, tip: 0.2, fame: 1.3 },
  lady: { name: '千金小姐', w: [0, 0, 0, 3, 4, 4], party: [2, 2], patience: 46, fav: ['sweet', 'tea', 'fancy'], avoid: [], budget: 80, lodge: 0.35, tip: 0.18, fame: 1.5, picky: true, art: true },
  official: { name: '官老爷', w: [0, 0, 0, 0, 2, 3], party: [1, 2], patience: 38, fav: ['fancy', 'fish', 'meat'], avoid: [], budget: 999, lodge: 0.4, tip: 0.25, fame: 2.5, picky: true, big: true },
  critic: { name: '美食家', special: true, party: [1, 1], patience: 64, fav: ['fancy', 'fish', 'meat'], avoid: [], budget: 999, lodge: 0, tip: 0.3, fame: 8 },
  judge: { name: '评审', special: true, party: [1, 1], patience: 80, fav: ['fancy'], avoid: [], budget: 999, lodge: 0, tip: 0, fame: 4 },
  oldman: { name: '神秘老者', special: true, party: [1, 1], patience: 90, fav: ['wine', 'tea'], avoid: [], budget: 999, lodge: 0, tip: 0, fame: 1 },
  thug: { name: '地痞', special: true, party: [1, 2], patience: 999, fav: [], avoid: [] },
  thief: { name: '小毛贼', special: true, party: [1, 1], patience: 999, fav: [], avoid: [] },
};

/* ---------- 外形 ---------- */
const SKINS = ['#ffdcb8', '#f7cfa6', '#f2c194', '#ecb88a'];
const HAIRS = ['#2a1b12', '#1f1a17', '#3b2618'];
function baseLook() { return { skin: pick(SKINS), hair: pick(HAIRS), shoes: '#2a1b12', pants: '#4b3a2c', belt: '#5a3a22', trim: '#efe2c4', size: 1, bw: 1 }; }
function lookFor(type, idx) {
  const L = baseLook();
  const fem = chance(0.4);
  switch (type) {
    case 'villager':
      if (fem) Object.assign(L, { fem: true, style: pick(['bun', 'bun2']), hat: pick(['#d86a5a', '#7aa0c8', '#e0b040']), flower: chance(0.5) ? pick(['#ff7a8a', '#ffd04a', '#ffffff']) : null, robe: pick(['#a8c48a', '#e6a88a', '#9ab8d8', '#d8b8e0', '#e8c890']), trim: '#fff6e6' });
      else Object.assign(L, { style: pick(['topknot', 'scarf', 'straw', 'scarf']), hat: pick(['#5f7f9f', '#8a6f4a', '#6f8a5a', '#9a5a4a']), robe: pick(['#9aa86b', '#b08a5a', '#7e94a8', '#a8806a', '#8fa38a']), beard: chance(0.25) ? 'short' : null, acc: chance(0.25) ? 'basket' : null });
      break;
    case 'scholar':
      Object.assign(L, { style: 'scholar', hat: pick(['#2f3f5a', '#3a4a3a', '#4a3a5a']), robe: pick(['#d8e6ee', '#eee6cc', '#d6e8d6', '#e8dcea']), trim: '#5a7a9a', belt: '#5a7a9a', acc: 'fan', bw: 0.92 });
      break;
    case 'escort':
      Object.assign(L, { style: 'band', hat: pick(['#c0392b', '#2f3f5a', '#d88a2a']), robe: pick(['#4a5a6a', '#5a4a3a', '#3f5a4a']), trim: '#d8b878', belt: '#c0392b', acc: 'saber', bw: 1.25, beard: chance(0.6) ? pick(['full', 'short']) : null, beardColor: L.hair });
      break;
    case 'monk':
      Object.assign(L, { style: 'bald', robe: pick(['#c8902a', '#9a8a70', '#b87a3a']), trim: '#7a3a1a', belt: '#7a3a1a', acc: 'beads', skin: pick(['#f2c194', '#ecb88a']) });
      break;
    case 'merchant':
      Object.assign(L, { style: 'cap', hat: pick(['#2a2a2a', '#5a1a1a', '#1a2a4a']), robe: pick(['#8a3a5a', '#3a5a8a', '#7a5a2a', '#2a6a5a']), trim: '#f3c34f', belt: '#f3c34f', acc: 'bag', bw: 1.3, beard: pick(['mustache', 'goatee', null]), beardColor: L.hair });
      break;
    case 'swordsman':
      Object.assign(L, { style: pick(['topknot', 'long']), hat: '#d8d8d8', robe: pick(['#f4f4f0', '#3a3a4a', '#2a4a5a', '#5a2a2a']), trim: pick(['#2a2a3a', '#c0392b', '#d8b878']), belt: '#2a2a3a', acc: 'sword', fem: L.fem, beard: chance(0.3) ? 'short' : null });
      if (fem) { L.fem = true; L.style = 'long'; L.flower = null; L.beard = null; }
      break;
    case 'lady':
      if (idx === 1) Object.assign(L, { fem: true, style: 'bun2', hat: '#7ab07a', robe: '#b8dcb0', trim: '#fff', belt: '#6a9a6a', size: 0.88, flower: null });
      else Object.assign(L, { fem: true, style: pick(['long', 'bun']), hat: pick(['#f0a0c0', '#a0c0f0']), robe: pick(['#f6b8c8', '#b8d4f2', '#f2d8a8', '#e0c8f0']), trim: '#ffffff', belt: '#d0708a', flower: pick(['#ff6a8a', '#ffd04a', '#ffffff']), acc: 'fan', skin: '#ffe6d2' });
      break;
    case 'official':
      Object.assign(L, { style: 'official', robe: pick(['#7a2a2a', '#2a3a6a', '#2a5a3a']), trim: '#f3c34f', belt: '#f3c34f', bw: 1.35, beard: pick(['long', 'mustache']), beardColor: L.hair, size: 1.05 });
      if (idx === 1) Object.assign(L, { style: 'scholar', hat: '#2a2a2a', robe: '#5a5a6a', trim: '#d8d8d8', bw: 1, beard: null, size: 0.95, official: false });
      break;
    case 'critic':
      Object.assign(L, { style: 'cap', hat: '#5a2a6a', robe: '#8a5a9a', trim: '#f3c34f', belt: '#f3c34f', bw: 1.4, beard: 'mustache', beardColor: '#2a1b12', acc: 'fan', size: 1.05 });
      break;
    case 'judge':
      Object.assign(L, [
        { style: 'cap', hat: '#5a2a6a', robe: '#8a5a9a', trim: '#f3c34f', belt: '#f3c34f', bw: 1.4, beard: 'mustache', beardColor: '#2a1b12', acc: 'fan', size: 1.05 },
        { style: 'topknot', hair: '#e8e8e8', hat: '#8a6a4a', robe: '#e8e0d0', trim: '#5a4a3a', acc: 'sword', beard: 'long', beardColor: '#f0f0f0' },
        { style: 'official', robe: '#2a3a6a', trim: '#f3c34f', belt: '#f3c34f', bw: 1.3, beard: 'long', beardColor: '#1f1a17', size: 1.05 },
      ][idx % 3]);
      break;
    case 'oldman':
      Object.assign(L, { style: 'topknot', hair: '#eeeeee', hat: '#8a6a4a', robe: '#c8c0a8', trim: '#6a5a4a', acc: 'gourd', beard: 'long', beardColor: '#f6f6f6' });
      break;
    case 'thug':
      Object.assign(L, { style: pick(['messy', 'bald']), robe: pick(['#6a4a2a', '#4a4a3a', '#7a3a2a']), trim: '#2a1a10', belt: '#2a1a10', bw: 1.3, beard: 'full', beardColor: '#1f1a17', scar: true, skin: '#e0a878' });
      break;
    case 'thief':
      Object.assign(L, { style: 'mask', hat: '#2a2a32', robe: '#3a3a44', trim: '#1a1a22', belt: '#7a2a2a', bw: 0.9, size: 0.92 });
      break;
  }
  return L;
}

/* ---------- 伙计 ---------- */
const ROLES = {
  cook: { name: '厨子', stat: 'cook', statName: '厨艺', color: '#b8433a', desc: '掌勺做菜。厨艺越高，出菜越快、越好吃。' },
  waiter: { name: '跑堂', stat: 'serve', statName: '招呼', color: '#3a78a6', desc: '点菜、上菜、擦桌子。招呼得好，客人更有耐心、更满意。' },
  clerk: { name: '账房', stat: 'calc', statName: '算术', color: '#b8913a', desc: '坐镇柜台收钱，每笔多收几分利，还能拦下吃霸王餐的。' },
  guard: { name: '护院', stat: 'martial', statName: '武艺', color: '#5a5a6a', desc: '赶走闹事的地痞，抓住偷钱的毛贼。' },
  artist: { name: '艺人', stat: 'art', statName: '才艺', color: '#8a5cc4', desc: '登台说书弹唱，大堂更热闹，客人更满意。需要说书台。' },
};
const GIFTS = [
  { id: 'candy', name: '糖葫芦', price: 6 },
  { id: 'flower', name: '绢花', price: 18 },
  { id: 'book', name: '话本', price: 20 },
  { id: 'chili', name: '二荆条', price: 8 },
  { id: 'fish', name: '小鱼干', price: 10 },
  { id: 'meat', name: '烧鸡', price: 25 },
  { id: 'wine', name: '好酒', price: 30 },
  { id: 'tea', name: '好茶叶', price: 35 },
  { id: 'rouge', name: '胭脂', price: 40 },
];
const GIFT = Object.fromEntries(GIFTS.map(g => [g.id, g]));

const STAFF = {
  dashao: {
    name: '冯大勺', role: 'cook', star: 1, hire: 0, wage: 14, base: { cook: 30, speed: 24 }, love: 'wine', like: 'meat', start: true,
    bio: '当过十年伙头兵，一口大锅喂饱过三千将士。嗓门大，心眼实。',
    look: { skin: '#f3c6a0', hair: '#2a1b12', style: 'chef', hat: '#f7f3ea', robe: '#e6dccb', trim: '#b9a88a', belt: '#7a5a3a', pants: '#5a4636', shoes: '#2a1b12', apron: '#ffffff', acc: 'ladle', beard: 'full', beardColor: '#2a1b12', size: 1.06, bw: 1.32 },
    lines: { work: ['火候到了！', '起锅——！', '这锅气，没得说！', '香不香？香就对了！'], idle: ['后厨我说了算。', '今儿的葱挺水灵。'], happy: ['掌柜的仗义！', '跟着你干，有奔头！'], tired: ['哎哟，我的老腰……'] },
  },
  doudou: {
    name: '小豆子', role: 'waiter', star: 1, hire: 0, wage: 8, base: { serve: 22, speed: 46 }, love: 'candy', like: 'book', start: true,
    bio: '镇上长大的机灵鬼，腿比兔子快，嘴比麻雀碎，最爱糖葫芦。',
    look: { skin: '#ffdcb8', hair: '#2a1b12', style: 'cap', hat: '#4a3020', robe: '#dcb27a', trim: '#f4e3c0', belt: '#8a5a2a', pants: '#5a4636', shoes: '#2a1b12', acc: 'towel', size: 0.86, bw: 0.95 },
    lines: { work: ['来咯——！', '客官里边请～', '菜来咯，小心烫！', '好嘞您呐！'], idle: ['掌柜的，能预支工钱不？', '今天客人真多！'], happy: ['嘿嘿，掌柜的最好啦！'], tired: ['跑……跑不动了……'] },
  },
  afu: {
    name: '阿福', role: 'waiter', star: 1, hire: 90, wage: 12, base: { serve: 30, speed: 36 }, love: 'meat', like: 'candy',
    bio: '从乡下来的憨厚后生，一次能端八碗面，汤都不洒一滴。',
    look: { skin: '#ecbd8e', hair: '#1f1a17', style: 'scarf', hat: '#4f6f9a', robe: '#5f7c98', trim: '#e9dcc0', belt: '#3a2a1a', pants: '#3a3a3a', shoes: '#2a1b12', acc: 'towel', size: 1.02, bw: 1.18 },
    lines: { work: ['来、来了！', '客官您慢用。', '嘿咻！'], idle: ['俺娘说，干活要实在。'], happy: ['俺一定好好干！'], tired: ['俺有点饿……'] },
  },
  jiujiu: {
    name: '苏九九', role: 'clerk', star: 1, hire: 160, wage: 15, base: { calc: 56, speed: 30 }, love: 'flower', like: 'candy',
    bio: '算盘打得比说话还快的小姑娘。一文钱都休想从她眼皮底下溜走。',
    look: { skin: '#ffe0c4', hair: '#2a1b12', style: 'bun2', hat: '#e8506a', robe: '#ee8f8f', trim: '#fff0e0', belt: '#c0504a', pants: '#7a4a4a', shoes: '#2a1b12', acc: 'abacus', size: 0.86, bw: 0.92, fem: true, flower: '#ffd04a' },
    lines: { work: ['一文也不能少！', '承惠，多谢！', '噼里啪啦——算好了！'], idle: ['今天的账，分毫不差。'], happy: ['掌柜的，这个月盈余不少哦！'], tired: ['眼睛都花了……'] },
  },
  shidun: {
    name: '石墩', role: 'guard', star: 1, hire: 140, wage: 13, base: { martial: 48, speed: 28 }, love: 'candy', like: 'meat',
    bio: '铁塔一样的大个子，一句话能省就省。天不怕地不怕，就怕老鼠。',
    look: { skin: '#e0a878', hair: '#1f1a17', style: 'bald', robe: '#5d5852', trim: '#8a8580', belt: '#2a2018', pants: '#3a3430', shoes: '#2a1b12', size: 1.2, bw: 1.45, beard: 'short' },
    lines: { work: ['……出去。', '……嗯。'], idle: ['……'], happy: ['……嘿。'], tired: ['……困。'] },
  },
  hujiao: {
    name: '胡椒', role: 'cook', star: 2, hire: 320, wage: 24, base: { cook: 50, speed: 32 }, love: 'chili', like: 'rouge',
    bio: '从蜀中来的女厨子，人如其名，信奉"不辣不要钱"。',
    look: { skin: '#ffd8b4', hair: '#1f1410', style: 'bun', hat: '#d8302a', robe: '#c84a32', trim: '#ffd9a0', belt: '#7a1a10', pants: '#5a2a1a', shoes: '#2a1b12', apron: '#fff4e0', fem: true, flower: '#d8302a', acc: 'ladle' },
    lines: { work: ['加辣！', '巴适得板！', '起锅咯！'], idle: ['这镇上的辣子不够劲。'], happy: ['掌柜的耿直！'], tired: ['歇口气……'] },
  },
  liuying: {
    name: '柳莺', role: 'waiter', star: 2, hire: 280, wage: 20, base: { serve: 50, speed: 38 }, love: 'rouge', like: 'flower',
    bio: '戏班子出身，报菜名像唱戏。客人听了，总想再多点一道。',
    look: { skin: '#ffe2cc', hair: '#1f1410', style: 'long', hat: '#f0a0c0', robe: '#f2b2c8', trim: '#ffffff', belt: '#c86a8a', pants: '#a85a7a', shoes: '#5a2a3a', fem: true, flower: '#ff6a8a', acc: 'fan' },
    lines: { work: ['客官～您的菜～来～咯～', '里边～请～', '慢～用～'], idle: ['咿——呀——'], happy: ['掌柜的真是好人～'], tired: ['嗓子都哑了……'] },
  },
  sanxian: {
    name: '柳三弦', role: 'artist', star: 2, hire: 300, wage: 20, base: { art: 50, speed: 26 }, love: 'wine', like: 'tea',
    bio: '走南闯北的说书先生。一把三弦，一肚子江湖故事，真假各半。',
    look: { skin: '#f0c8a0', hair: '#8a8a8a', style: 'scholar', hat: '#3a4a5a', robe: '#5d6f80', trim: '#d8d0c0', belt: '#3a4a5a', pants: '#3a3a44', shoes: '#2a1b12', acc: 'sanxian', beard: 'long', beardColor: '#c8c8c8' },
    lines: { work: ['上回书说到——', '列位看官！', '欲知后事如何……'], idle: ['且听下回分解。'], happy: ['掌柜的，这段书送你！'], tired: ['口干舌燥……'] },
  },
  qianbuduo: {
    name: '钱不多', role: 'clerk', star: 2, hire: 220, wage: 12, base: { calc: 44, speed: 20 }, love: 'tea', like: 'book',
    bio: '给人算了四十年账的老先生。名字叫钱不多，经手的钱可不少。',
    look: { skin: '#f0c8a0', hair: '#d8d8d8', style: 'cap', hat: '#2a2a2a', robe: '#7a6248', trim: '#e0d0b0', belt: '#4a3a2a', pants: '#3a3430', shoes: '#2a1b12', acc: 'abacus', beard: 'goatee', beardColor: '#eeeeee', size: 0.95 },
    lines: { work: ['老朽记下了。', '收讫。'], idle: ['算账如做人，要清清白白。'], happy: ['掌柜的厚道。'], tired: ['老了，老了……'] },
  },
  laomao: {
    name: '老猫', role: 'guard', star: 3, hire: 700, wage: 32, base: { martial: 88, speed: 60 }, love: 'fish', like: 'wine', story: 'laomao',
    bio: '来历不明的懒汉，一天睡十个时辰。可只要有人闹事，他比谁醒得都快。',
    look: { skin: '#e8b88a', hair: '#2a2420', style: 'messy', robe: '#3d3a3a', trim: '#7a2a2a', belt: '#7a2a2a', pants: '#2a2828', shoes: '#1a1a1a', acc: 'sword', beard: 'short', eyes: 'sleepy' },
    lines: { work: ['吵什么吵。', '滚。', '喵。'], idle: ['呼……呼……'], happy: ['小鱼干？好东西。'], tired: ['困死了……'] },
  },
  yunshang: {
    name: '云裳', role: 'artist', star: 3, hire: 900, wage: 36, base: { art: 76, speed: 30 }, love: 'flower', like: 'rouge',
    bio: '琵琶弹得极好的姑娘，据说曾在京城最大的酒楼献艺，不知为何流落到落霞镇。',
    look: { skin: '#ffe6d2', hair: '#1a1210', style: 'long', hat: '#a9c9ea', robe: '#a9c9ea', trim: '#ffffff', belt: '#6a8ab0', pants: '#7a9ac0', shoes: '#3a4a6a', fem: true, flower: '#ffffff', acc: 'pipa' },
    lines: { work: ['献丑了。', '一曲《春江》，诸位静听。'], idle: ['……'], happy: ['多谢掌柜的。'], tired: ['指尖有些疼了。'] },
  },
  jinbuhuan: {
    name: '金不换', role: 'cook', star: 4, hire: 1600, wage: 58, base: { cook: 82, speed: 30 }, love: 'tea', like: 'wine', story: 'jin',
    bio: '自称御膳房出身的老厨神。脾气比手艺还大，可他的手艺确实大。',
    look: { skin: '#f0c8a0', hair: '#e0e0e0', style: 'chefTall', hat: '#ffffff', robe: '#f4efe4', trim: '#e0b040', belt: '#c09030', pants: '#5a4636', shoes: '#2a1b12', acc: 'ladle', beard: 'mustache', beardColor: '#f0f0f0' },
    lines: { work: ['看好了，这叫刀工。', '御膳房的规矩！', '火要文，心要静。'], idle: ['哼。'], happy: ['你这小掌柜，还算识货。'], tired: ['老夫歇歇。'] },
  },
};
const STAFF_ORDER = ['dashao', 'doudou', 'afu', 'jiujiu', 'shidun', 'qianbuduo', 'hujiao', 'liuying', 'sanxian', 'laomao', 'yunshang', 'jinbuhuan'];

/* 剧情人物外形 */
const NPC = {
  boss_m: { name: '掌柜', look: { skin: '#ffdcb8', hair: '#1f1410', style: 'topknot', hat: '#c0392b', robe: '#2f5f8a', trim: '#f3c34f', belt: '#1f3a5a', pants: '#3a3a4a', shoes: '#1f1410', size: 1, bw: 1 } },
  boss_f: { name: '掌柜', look: { skin: '#ffe2cc', hair: '#1f1410', style: 'bun', hat: '#f3c34f', robe: '#b8455a', trim: '#f3c34f', belt: '#7a2a3a', pants: '#5a2a3a', shoes: '#1f1410', fem: true, flower: '#f3c34f', size: 1, bw: 1 } },
  rival: { name: '钱满贯', look: { skin: '#f3c6a0', hair: '#1f1410', style: 'cap', hat: '#7a2a2a', robe: '#d9a63a', trim: '#8a2a1a', belt: '#8a2a1a', pants: '#5a3a1a', shoes: '#1f1410', acc: 'bag', beard: 'mustache', beardColor: '#1f1410', size: 1.04, bw: 1.42 } },
  uncle: { name: '三叔公', look: { skin: '#f0c8a0', hair: '#eeeeee', style: 'topknot', hat: '#8a6a4a', robe: '#8a7a5a', trim: '#d8c8a0', belt: '#5a4a3a', pants: '#4a3a2a', shoes: '#2a1b12', acc: 'gourd', beard: 'long', beardColor: '#f4f4f4', size: 0.98, bw: 1 } },
  mayor: { name: '马镇长', look: { skin: '#f2c194', hair: '#3b2618', style: 'scholar', hat: '#1f3a2a', robe: '#2f6a4a', trim: '#f3c34f', belt: '#1f3a2a', pants: '#2a3a2a', shoes: '#1f1410', beard: 'goatee', beardColor: '#3b2618', size: 1, bw: 1.15 } },
  critic: { name: '白老饕', look: { skin: '#f7cfa6', hair: '#1f1a17', style: 'cap', hat: '#5a2a6a', robe: '#8a5a9a', trim: '#f3c34f', belt: '#f3c34f', pants: '#4a2a5a', shoes: '#1f1410', bw: 1.4, beard: 'mustache', beardColor: '#2a1b12', acc: 'fan', size: 1.05 } },
  oldman: { name: '神秘老者', look: { skin: '#f0c8a0', hair: '#eeeeee', style: 'topknot', hat: '#8a6a4a', robe: '#c8c0a8', trim: '#6a5a4a', belt: '#6a5a4a', pants: '#5a4a3a', shoes: '#2a1b12', acc: 'gourd', beard: 'long', beardColor: '#f6f6f6' } },
  thug: { name: '地痞', look: { skin: '#e0a878', hair: '#1f1a17', style: 'messy', robe: '#6a4a2a', trim: '#2a1a10', belt: '#2a1a10', pants: '#3a2a1a', shoes: '#1f1410', bw: 1.3, beard: 'full', beardColor: '#1f1a17', scar: true } },
};

/* ---------- 装修 ---------- */
const BUILDS = [
  { id: 'table', cat: 'hall', name: '添置桌椅', desc: '大堂多摆一张桌子，就能多招呼一桌客人。', max: 4, cost: [200, 450, 900, 1600], star: [1, 1, 2, 3], icon: 'table' },
  { id: 'furn', cat: 'hall', name: '桌椅换新', desc: '坐得舒服，客人自然高兴。', max: 2, cost: [520, 2200], star: [2, 4], names: ['榆木桌椅', '红木桌椅'], icon: 'chair', effect: '满意度 +5 / +12' },
  { id: 'lantern', cat: 'hall', name: '大红灯笼', desc: '挂上几盏红灯笼，喜气洋洋，入夜还能点亮。', max: 1, cost: [120], star: [1], amb: 4, icon: 'lantern' },
  { id: 'plant', cat: 'hall', name: '盆栽文竹', desc: '门口、墙角摆几盆绿植，看着就舒心。', max: 1, cost: [160], star: [1], amb: 4, icon: 'plant' },
  { id: 'scroll', cat: 'hall', name: '山水字画', desc: '墙上挂一幅山水，书生们最爱。', max: 1, cost: [380], star: [2], amb: 7, icon: 'scroll' },
  { id: 'bird', cat: 'hall', name: '画眉鸟笼', desc: '鸟鸣啾啾，大堂多了几分雅趣。', max: 1, cost: [560], star: [2], amb: 7, icon: 'bird' },
  { id: 'stage', cat: 'hall', name: '说书台', desc: '搭个小台子，请来的艺人才能登台献艺。', max: 1, cost: [650], star: [2], amb: 3, icon: 'stage' },
  { id: 'screen', cat: 'hall', name: '花鸟屏风', desc: '一扇精致的屏风，挡风又好看。', max: 1, cost: [760], star: [3], amb: 9, icon: 'screen' },
  { id: 'vase', cat: 'hall', name: '青花瓷瓶', desc: '柜台上摆一只青花大瓶，贵客看了直点头。', max: 1, cost: [1500], star: [4], amb: 13, icon: 'vase' },
  { id: 'stove', cat: 'kitchen', name: '加砌灶台', desc: '多一口灶，就能多请一位厨子。', max: 2, cost: [600, 1900], star: [2, 3], icon: 'stove' },
  { id: 'tools', cat: 'kitchen', name: '好刀好锅', desc: '工欲善其事，必先利其器。', max: 2, cost: [380, 1500], star: [1, 3], names: ['精钢菜刀', '铁锅换新'], icon: 'knife', effect: '出菜速度 +12% / +25%' },
  { id: 'cellar', cat: 'kitchen', name: '地窖', desc: '挖个地窖囤食材，进货更便宜。', max: 1, cost: [900], star: [2], icon: 'cellar', effect: '食材成本 -20%' },
  { id: 'room', cat: 'room', name: '修缮客房', desc: '二楼还有几间破房，修好了就能留客住店。', max: 5, cost: [260, 480, 800, 1200, 1800], star: [1, 2, 3, 4, 4], icon: 'room' },
  { id: 'grade', cat: 'room', name: '客房升级', desc: '换新被褥、添置家具，每晚房钱更高。', max: 2, cost: [900, 2600], star: [2, 4], names: ['中房', '上房'], icon: 'bed', effect: '房钱 30 → 60 → 110 文/晚' },
  { id: 'dorm', cat: 'room', name: '伙计宿舍', desc: '给伙计们一个像样的住处，每晚心情恢复更多。', max: 1, cost: [600], star: [2], icon: 'dorm' },
  { id: 'sign', cat: 'front', name: '招牌', desc: '招牌越亮，路过的客人越愿意进来。', max: 2, cost: [350, 2800], star: [1, 4], names: ['新漆牌匾', '金字招牌'], icon: 'sign', effect: '客流 +15% / +35%' },
  { id: 'flag', cat: 'front', name: '酒幌子', desc: '门外竖一面酒旗，老远就能看见。', max: 1, cost: [240], star: [1], icon: 'flag', effect: '客流 +10%' },
  { id: 'lotus', cat: 'front', name: '荷花大缸', desc: '门口摆一口荷花缸，养几尾锦鲤。', max: 1, cost: [880], star: [3], amb: 10, icon: 'lotus' },
];
const BUILD = Object.fromEntries(BUILDS.map(b => [b.id, b]));
const BUILD_CATS = [['hall', '大堂'], ['kitchen', '后厨'], ['room', '客房'], ['front', '门面']];
const ROOM_PRICE = [30, 60, 110];
const ROOM_NAMES = ['天', '地', '玄', '黄', '宇', '宙'];

/* ---------- 星级 ---------- */
const STARS = [null, {},
  { fame: 100, tables: 3, served: 45 },
  { fame: 330, tables: 4, rooms: 2, dishes: 8 },
  { fame: 760, tables: 5, rooms: 4, amb: 28, staff: 6 },
  { fame: 1500, tables: 6, rooms: 6, amb: 50, sign: 2 },
];
const BASE_FLOW = [0, 1.3, 1.6, 1.9, 2.2, 2.5];
const MENU_SLOTS = [0, 5, 6, 7, 8, 9];

/* ---------- 任务 ---------- */
const QUESTS = [
  { id: 'q1', name: '开张大吉', desc: '迎来第一位客人', check: g => g.stats.served >= 1, money: 50 },
  { id: 'q2', name: '初来乍到', desc: '累计接待 15 位客人', check: g => g.stats.served >= 15, money: 80 },
  { id: 'q3', name: '推陈出新', desc: '研发一道新菜（菜谱 → 研发新菜）', check: g => g.stats.researched >= 1, money: 60 },
  { id: 'q4', name: '添桌加凳', desc: '大堂摆上 3 张桌子（装修 → 大堂）', check: g => tableCount() >= 3, money: 100 },
  { id: 'q5', name: '广纳贤才', desc: '招募一位新伙计（伙计 → 招募）', check: g => g.staff.length >= 3, money: 80 },
  { id: 'q6', name: '宾至如归', desc: '修好第二间客房（装修 → 客房）', check: g => roomCount() >= 2, money: 120 },
  { id: 'q7', name: '二星客栈', desc: '客栈升为二星', check: g => g.star >= 2, money: 200 },
  { id: 'q8', name: '锦上添花', desc: '大堂环境达到 15', check: g => ambience() >= 15, money: 200 },
  { id: 'q9', name: '三星客栈', desc: '客栈升为三星', check: g => g.star >= 3, money: 400 },
  { id: 'q10', name: '日进斗金', desc: '单日净赚 1000 文', check: g => g.stats.bestDay >= 1000, money: 500 },
  { id: 'q11', name: '四星客栈', desc: '客栈升为四星', check: g => g.star >= 4, money: 800 },
  { id: 'q12', name: '五星客栈', desc: '客栈升为五星', check: g => g.star >= 5, money: 1500 },
  { id: 'q13', name: '天下第一', desc: '在天下客栈评选中夺魁', check: g => !!g.flags.won, money: 3000 },
];
