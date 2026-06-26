type Win = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

export class AudioEngine {
  private ctx: AudioContext | null = null;

  private getCtor(): typeof AudioContext | null {
    if (typeof window === "undefined") return null;
    const w = window as Win;
    return w.AudioContext ?? w.webkitAudioContext ?? null;
  }

  async resume(): Promise<void> {
    const Ctor = this.getCtor();
    if (!Ctor) return;
    if (!this.ctx) this.ctx = new Ctor();
    if (this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {
        /* ignore */
      }
    }
  }

  /** A single decaying sine tone. `at` is an offset (seconds) from now. */
  private tone(freq: number, peak: number, duration: number, at = 0): void {
    if (!this.ctx) return;
    const start = this.ctx.currentTime + at;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(peak, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  }

  /** A metallic bell strike: fundamental plus two inharmonic partials. */
  private bellStrike(freq: number, peak: number, duration: number, at = 0): void {
    this.tone(freq, peak, duration, at);
    this.tone(freq * 2.0, peak * 0.5, duration * 0.8, at);
    this.tone(freq * 2.96, peak * 0.25, duration * 0.6, at);
  }

  /** Exercise start — rising 3-note chime, intentionally not a bell. */
  startSignal(): void {
    this.tone(523, 0.6, 0.16, 0);
    this.tone(659, 0.6, 0.16, 0.16);
    this.tone(784, 0.7, 0.28, 0.32);
  }

  /** Round begins — single bright boxing-bell clang. */
  roundStartBell(): void {
    this.bellStrike(880, 0.85, 1.0);
  }

  /** Round ends — lower, double "ding-ding" boxing bell (distinct from the start bell). */
  roundEndBell(): void {
    this.bellStrike(740, 0.8, 0.45, 0);
    this.bellStrike(740, 0.8, 0.45, 0.18);
  }

  /** Last 3 seconds of a phase — short countdown tick. */
  countdownBeep(): void {
    this.tone(600, 0.5, 0.1);
  }

  /** Exercise complete — ascending bell fanfare, a distinct finale. */
  finishSignal(): void {
    this.bellStrike(660, 0.8, 0.5, 0);
    this.bellStrike(880, 0.8, 0.5, 0.45);
    this.bellStrike(1175, 0.9, 1.4, 0.9);
  }
}
