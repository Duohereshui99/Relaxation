/* ================= 声音（全部即时合成） ================= */
const Sound = {
  ctx: null, master: null, sfx: null, mus: null, noiseBuf: null,
  sfxOn: true, musicOn: true, musicTimer: null, nextNote: 0, step: 0, lastPlay: {},
  init() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.7; this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.55; this.sfx.connect(this.master);
      this.mus = this.ctx.createGain(); this.mus.gain.value = 0.16; this.mus.connect(this.master);
      const len = this.ctx.sampleRate * 1;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) { this.ctx = null; return false; }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); },
  tone(f, dur, o = {}) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + (o.when || 0);
    const osc = c.createOscillator(); const g = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, o.slide), t + dur);
    const v = o.vol == null ? 0.25 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.dest || this.sfx);
    osc.start(t); osc.stop(t + dur + 0.05);
  },
  noise(dur, o = {}) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + (o.when || 0);
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = o.ftype || 'bandpass'; f.frequency.value = o.freq || 1200; f.Q.value = o.q || 1;
    const g = c.createGain(); const v = o.vol == null ? 0.2 : o.vol;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || this.sfx);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  },
  play(name) {
    if (!this.sfxOn || !this.ctx) return;
    const now = performance.now();
    if (this.lastPlay[name] && now - this.lastPlay[name] < 60) return;
    this.lastPlay[name] = now;
    switch (name) {
      case 'coin': this.tone(1568, 0.12, { type: 'triangle', vol: 0.18 }); this.tone(2093, 0.22, { type: 'triangle', vol: 0.16, when: 0.06 }); break;
      case 'click': this.tone(880, 0.05, { type: 'square', vol: 0.05 }); break;
      case 'pop': this.tone(520, 0.09, { type: 'sine', vol: 0.2, slide: 900 }); break;
      case 'door': this.tone(1318, 0.5, { type: 'sine', vol: 0.09 }); this.tone(1760, 0.6, { type: 'sine', vol: 0.06, when: 0.08 }); break;
      case 'order': this.tone(660, 0.07, { type: 'triangle', vol: 0.14 }); this.tone(990, 0.1, { type: 'triangle', vol: 0.12, when: 0.06 }); break;
      case 'dish': this.tone(784, 0.08, { type: 'triangle', vol: 0.12 }); this.noise(0.05, { freq: 3000, vol: 0.05 }); break;
      case 'sizzle': this.noise(0.5, { freq: 4500, q: 0.6, vol: 0.045, ftype: 'highpass' }); break;
      case 'wipe': this.noise(0.12, { freq: 2500, vol: 0.08 }); this.noise(0.12, { freq: 2200, vol: 0.06, when: 0.13 }); break;
      case 'angry': this.tone(180, 0.28, { type: 'sawtooth', vol: 0.07, slide: 120 }); break;
      case 'happy': [784, 988, 1175].forEach((f, i) => this.tone(f, 0.16, { type: 'triangle', vol: 0.1, when: i * 0.06 })); break;
      case 'hit': this.noise(0.12, { freq: 500, q: 0.8, vol: 0.3 }); this.tone(140, 0.12, { type: 'square', vol: 0.08, slide: 60 }); break;
      case 'catch': this.tone(600, 0.08, { type: 'square', vol: 0.08 }); this.tone(900, 0.12, { type: 'square', vol: 0.08, when: 0.08 }); break;
      case 'buy': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, { type: 'triangle', vol: 0.12, when: i * 0.05 })); break;
      case 'deny': this.tone(220, 0.15, { type: 'square', vol: 0.06 }); this.tone(196, 0.2, { type: 'square', vol: 0.06, when: 0.12 }); break;
      case 'gong': this.tone(110, 2.2, { type: 'sine', vol: 0.3 }); this.tone(220, 1.6, { type: 'sine', vol: 0.12 }); this.tone(331, 1.2, { type: 'triangle', vol: 0.05 }); break;
      case 'fanfare': [523, 587, 659, 784, 880, 1046].forEach((f, i) => this.tone(f, 0.3, { type: 'triangle', vol: 0.12, when: i * 0.09 })); break;
      case 'firecracker': for (let i = 0; i < 18; i++) this.noise(0.06, { freq: rand(800, 2400), q: 0.7, vol: rand(0.12, 0.28), when: i * rand(0.05, 0.11) }); break;
      case 'type': this.tone(1200 + Math.random() * 300, 0.03, { type: 'square', vol: 0.015 }); break;
      case 'bird': this.tone(2400, 0.08, { type: 'sine', vol: 0.04, slide: 3200 }); this.tone(2800, 0.1, { type: 'sine', vol: 0.035, slide: 2200, when: 0.1 }); break;
    }
  },
  /* 原创小曲：C 宫五声，拨弦音色 */
  MEL: [
    76, 79, 81, 79, 76, 74, 72, 74, 76, 76, 79, 76, 74, 72, 69, 0,
    67, 69, 72, 74, 76, 74, 72, 69, 67, 69, 72, 69, 67, 0, 0, 0,
    72, 74, 76, 79, 81, 79, 76, 79, 81, 84, 81, 79, 76, 74, 76, 0,
    74, 76, 79, 76, 74, 72, 69, 72, 74, 72, 69, 67, 72, 0, 0, 0,
  ],
  BASS: [48, 0, 55, 0, 45, 0, 52, 0, 43, 0, 50, 0, 48, 0, 55, 0],
  pluck(midi, t, vol, dest) {
    const c = this.ctx; const f = 440 * Math.pow(2, (midi - 69) / 12);
    const o1 = c.createOscillator(); const o2 = c.createOscillator(); const g = c.createGain();
    o1.type = 'triangle'; o2.type = 'sine'; o1.frequency.value = f; o2.frequency.value = f * 2.003;
    const g2 = c.createGain(); g2.gain.value = 0.35;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest);
    o1.start(t); o2.start(t); o1.stop(t + 0.6); o2.stop(t + 0.6);
  },
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const spb = 60 / 100 / 2; // 八分音符
    this.nextNote = this.ctx.currentTime + 0.1; this.step = 0;
    this.musicTimer = setInterval(() => {
      if (!this.ctx || !this.musicOn) return;
      while (this.nextNote < this.ctx.currentTime + 0.35) {
        const i = this.step % this.MEL.length;
        const m = this.MEL[i];
        if (m) this.pluck(m, this.nextNote, 0.32, this.mus);
        if (i % 4 === 0) { const b = this.BASS[(i / 4) % this.BASS.length]; if (b) this.pluck(b, this.nextNote, 0.38, this.mus); }
        if (i % 4 === 2) this.noise(0.04, { freq: 1800, q: 4, vol: 0.06, when: this.nextNote - this.ctx.currentTime, dest: this.mus });
        this.nextNote += spb; this.step++;
      }
    }, 90);
  },
  stopMusic() { if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; } },
};
