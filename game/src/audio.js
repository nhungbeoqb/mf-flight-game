// Synthesised sound: a WebAudio engine hum, wind, a ring chime and a
// landing thump. No audio files — everything is generated at run time.
export class SoundBank {
  constructor() {
    this.ctx = null; this.engine = null; this.engineGain = null; this.muted = false;
  }

  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth'; osc.frequency.value = 62;
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 320;
      this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0.0;
      osc.connect(filt); filt.connect(this.engineGain); this.engineGain.connect(this.ctx.destination);
      osc.start();
      this.engine = osc; this.engineFilter = filt;
    } catch { this.ctx = null; }
  }

  setEngine(throttle, speed) {
    if (!this.ctx || !this.engine) return;
    const t = this.ctx.currentTime;
    this.engine.frequency.setTargetAtTime(52 + throttle * 0.9 + speed * 0.12, t, 0.12);
    this.engineFilter.frequency.setTargetAtTime(240 + throttle * 4, t, 0.15);
    this.engineGain.gain.setTargetAtTime(this.muted ? 0 : 0.028 + throttle * 0.00035, t, 0.2);
  }

  blip(freq, dur, type, vol) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  ringChime() { this.blip(880, 0.5, 'sine', 0.14); setTimeout(() => this.blip(1318, 0.6, 'sine', 0.1), 90); }
  parcelPop() { this.blip(660, 0.18, 'triangle', 0.12); }
  warnBeep() { this.blip(220, 0.22, 'square', 0.07); }
  thump() { this.blip(70, 0.3, 'sine', 0.22); }
  fanfare() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.blip(f, 0.5, 'triangle', 0.12), i * 130)); }
  toggleMute() { this.muted = !this.muted; return this.muted; }
}
