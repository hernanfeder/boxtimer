type Win = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private bellBuffer: AudioBuffer | null = null;
  private bellLoading: Promise<void> | null = null;

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
    void this.loadBell(); // warm the bell sample (no-op after first load)
  }

  /** Fetch + decode the bell sample once. Silent fallback to FM bells on failure. */
  private async loadBell(): Promise<void> {
    if (this.bellBuffer || !this.ctx) return;
    if (this.bellLoading) return this.bellLoading;
    const ctx = this.ctx;
    this.bellLoading = (async () => {
      try {
        const res = await fetch("/bell.ogg");
        const data = await res.arrayBuffer();
        this.bellBuffer = await ctx.decodeAudioData(data);
      } catch {
        this.bellBuffer = null; // fall back to synthesized bells
      }
    })();
    return this.bellLoading;
  }

  /** Play the bell sample, capped to its first `maxDuration` seconds. */
  private playBell(at = 0, maxDuration = 3, gainValue = 1): void {
    if (!this.ctx || !this.bellBuffer) return;
    const t = this.ctx.currentTime + at;
    const src = this.ctx.createBufferSource();
    src.buffer = this.bellBuffer;
    const g = this.ctx.createGain();
    g.gain.value = gainValue;
    src.connect(g).connect(this.ctx.destination);
    src.start(t, 0, maxDuration);
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

  /**
   * A struck metal bell via FM synthesis. A modulator detuned to an inharmonic
   * ratio injects the metallic partials; its depth decays fast (the bright
   * "clang" fades quickly into a purer ring), while the amplitude decays slowly.
   * This reads as a bell far better than summed sine partials do.
   */
  private fmBell(
    freq: number,
    peak: number,
    duration: number,
    at = 0,
    ratio = 1.4,
    modIndex = 6,
  ): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + at;
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const ampGain = this.ctx.createGain();

    carrier.type = "sine";
    modulator.type = "sine";
    carrier.frequency.setValueAtTime(freq, t);
    modulator.frequency.setValueAtTime(freq * ratio, t);

    // Modulation depth in Hz; decays quickly so the inharmonic shimmer is only
    // present in the attack (the bell "clang"), then settles toward the tone.
    const modDepth = modIndex * freq * ratio;
    modGain.gain.setValueAtTime(modDepth, t);
    modGain.gain.exponentialRampToValueAtTime(Math.max(1, modDepth * 0.02), t + duration * 0.4);

    // Percussive amplitude envelope: near-instant attack, long exponential tail.
    ampGain.gain.setValueAtTime(0.0001, t);
    ampGain.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    ampGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    modulator.connect(modGain).connect(carrier.frequency);
    carrier.connect(ampGain).connect(this.ctx.destination);
    modulator.start(t);
    carrier.start(t);
    modulator.stop(t + duration);
    carrier.stop(t + duration);
  }

  /** Exercise start — rising 3-note chime, intentionally not a bell. */
  startSignal(): void {
    this.tone(523, 0.6, 0.16, 0);
    this.tone(659, 0.6, 0.16, 0.16);
    this.tone(784, 0.7, 0.28, 0.32);
  }

  /** Round begins — a single bell ring (first 3s of the sample). */
  roundStartBell(): void {
    if (this.bellBuffer) {
      this.playBell(0);
    } else {
      this.fmBell(880, 0.85, 1.3); // fallback if the sample didn't load
    }
  }

  /** Round ends — a double "ding-ding" ring, distinct from the single start ring. */
  roundEndBell(): void {
    if (this.bellBuffer) {
      this.playBell(0);
      this.playBell(0.45);
    } else {
      this.fmBell(620, 0.8, 0.55, 0);
      this.fmBell(620, 0.8, 0.55, 0.22);
    }
  }

  /** Last 3 seconds of a phase — short countdown tick. */
  countdownBeep(): void {
    this.tone(600, 0.5, 0.1);
  }

  /** Exercise complete — a triple ring, a distinct "you're done" peal. */
  finishSignal(): void {
    if (this.bellBuffer) {
      this.playBell(0);
      this.playBell(0.5);
      this.playBell(1.0);
    } else {
      this.fmBell(660, 0.8, 0.6, 0);
      this.fmBell(880, 0.8, 0.6, 0.45);
      this.fmBell(1175, 0.9, 1.7, 0.95);
    }
  }
}
