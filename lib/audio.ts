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

  /** A single decaying tone. `at` is an offset (seconds) from now. */
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

  bell(): void {
    this.tone(800, 0.8, 1.5);
  }

  doubleBeep(): void {
    this.tone(400, 0.6, 0.15, 0);
    this.tone(400, 0.6, 0.15, 0.35); // 0.15 + 0.2 gap
  }

  countdownBeep(): void {
    this.tone(600, 0.5, 0.1);
  }

  tripleBell(): void {
    this.tone(800, 0.8, 0.4, 0);
    this.tone(800, 0.8, 0.4, 0.5);
    this.tone(800, 0.8, 0.4, 1.0);
  }
}
