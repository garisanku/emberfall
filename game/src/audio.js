// Procedural WebAudio sound: no audio files, everything is synthesized.
// A tiny synth for shots, hits, deaths, coins, wave horns, victory and defeat.

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.enabled = false;
  }

  // Call from a user gesture (start button / first key). Browsers need one.
  unlock() {
    if (this.enabled) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.ctx.destination);
      this.enabled = true;
    } catch {
      this.enabled = false;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.32;
    return this.muted;
  }

  _tone(freq, dur, type, vol, slideTo) {
    if (!this.enabled || this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol || 0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise(dur, vol, filterFreq) {
    if (!this.enabled || this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq || 1200;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol || 0.15, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  shoot(kind) {
    if (kind === 'flame') this._tone(220, 0.16, 'sawtooth', 0.12, 90);
    else if (kind === 'frost') this._tone(880, 0.12, 'sine', 0.1, 1400);
    else this._tone(660, 0.07, 'square', 0.06, 440);
  }

  hit() {
    this._noise(0.06, 0.08, 2000);
  }

  enemyDie() {
    this._tone(320, 0.18, 'triangle', 0.14, 60);
    this._noise(0.1, 0.06, 900);
  }

  coin() {
    this._tone(1320, 0.09, 'sine', 0.1);
    setTimeout(() => this._tone(1760, 0.12, 'sine', 0.08), 60);
  }

  build() {
    this._tone(180, 0.12, 'triangle', 0.16, 360);
  }

  upgrade() {
    this._tone(440, 0.1, 'triangle', 0.14, 660);
    setTimeout(() => this._tone(660, 0.14, 'triangle', 0.12, 880), 90);
  }

  emberHurt() {
    this._tone(140, 0.3, 'sawtooth', 0.2, 50);
    this._noise(0.2, 0.12, 500);
  }

  waveHorn() {
    this._tone(196, 0.5, 'sawtooth', 0.14, 196);
    setTimeout(() => this._tone(294, 0.5, 'sawtooth', 0.12, 294), 160);
  }

  victory() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => this._tone(n, 0.35, 'triangle', 0.16), i * 140));
  }

  defeat() {
    const notes = [392, 330, 262, 196];
    notes.forEach((n, i) => setTimeout(() => this._tone(n, 0.4, 'sawtooth', 0.12), i * 170));
  }
}
