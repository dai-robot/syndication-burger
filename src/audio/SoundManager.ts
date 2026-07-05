import type { ComboLabel, IngredientType } from '../game/GameConfig';
import { MusicEngine } from './MusicEngine';

const STORAGE_KEY = 'sb_mute';

class SoundManagerImpl {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private initialized = false;
  private voiceCount = 0;
  private currentMusic: 'intro' | 'menu' | 'game' | null = null;

  init(): void {
    if (this.initialized) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.muted = saved === 'true';
    } catch {
      this.muted = false;
    }

    try {
      this.ctx = new AudioContext();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
      this.musicGain.gain.value = this.muted ? 0 : 0.18;
      this.sfxGain.gain.value = this.muted ? 0 : 0.32;
      MusicEngine.attach(this.ctx, this.musicGain);
      this.initialized = true;
    } catch {
      this.initialized = false;
    }
  }

  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem(STORAGE_KEY, String(this.muted));
    } catch { /* ignore */ }
    const vol = this.muted ? 0 : 1;
    if (this.musicGain) this.musicGain.gain.value = 0.18 * vol;
    if (this.sfxGain) this.sfxGain.gain.value = 0.32 * vol;
    MusicEngine.setMuted(this.muted);
    if (this.muted) {
      MusicEngine.stop();
    } else if (this.currentMusic) {
      MusicEngine.start(this.currentMusic);
    }
    return this.muted;
  }

  startIntroMusic(): void {
    this.playMusic('intro');
  }

  startMenuMusic(): void {
    this.playMusic('menu');
  }

  startGameMusic(): void {
    this.playMusic('game');
  }

  private playMusic(track: 'intro' | 'menu' | 'game'): void {
    if (!this.ctx || this.muted) return;
    this.currentMusic = track;
    MusicEngine.start(track === 'game' ? 'game' : track === 'intro' ? 'intro' : 'menu');
  }

  stopBgm(): void {
    MusicEngine.stop();
    this.currentMusic = null;
  }

  duckBgm(duration = 0.8): void {
    MusicEngine.duck(duration);
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3,
    pitchBend?: number,
    delay = 0,
  ): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    if (this.voiceCount >= 8) return;
    this.voiceCount++;

    const startTime = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (pitchBend) {
      osc.frequency.linearRampToValueAtTime(freq + pitchBend, startTime + duration);
    }
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
    osc.onended = () => { this.voiceCount--; };
  }

  playLand(type: IngredientType): void {
    this.duckBgm(0.35);
    switch (type) {
      case 'patty':
        this.playTone(55, 0.1, 'sine', 0.5);
        this.playTone(95, 0.22, 'triangle', 0.3, undefined, 0.03);
        this.playTone(140, 0.08, 'square', 0.08, undefined, 0.05);
        break;
      case 'cheese':
        this.playTone(280, 0.1, 'triangle', 0.3);
        break;
      case 'lettuce':
        this.playTone(520, 0.08, 'sine', 0.2);
        break;
      case 'tomato':
        this.playTone(320, 0.1, 'sine', 0.28, 60);
        break;
      case 'pickle':
        this.playTone(720, 0.06, 'square', 0.18);
        break;
      case 'bottom_bun':
        this.playTone(140, 0.15, 'sine', 0.25);
        break;
      case 'top_bun':
        this.playTone(110, 0.12, 'sine', 0.4);
        this.playTone(180, 0.2, 'triangle', 0.2, undefined, 0.06);
        break;
      default:
        this.playTone(250, 0.15, 'sine', 0.25);
    }
  }

  playCombo(label: ComboLabel, delay = 0.12): void {
    switch (label) {
      case 'Nice':
        this.playTone(880, 0.12, 'sine', 0.28, undefined, delay);
        break;
      case 'Great':
        this.playTone(880, 0.1, 'sine', 0.28, undefined, delay);
        this.playTone(1100, 0.12, 'sine', 0.3, undefined, delay + 0.08);
        break;
      case 'Perfect':
        this.playTone(523, 0.1, 'triangle', 0.3, undefined, delay);
        this.playTone(659, 0.1, 'triangle', 0.3, undefined, delay + 0.09);
        this.playTone(784, 0.14, 'triangle', 0.35, undefined, delay + 0.18);
        break;
    }
  }

  playKetchupDrip(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    this.playTone(420, 0.06, 'triangle', 0.08);
  }

  playKetchupFinish(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    this.playTone(350, 0.15, 'sine', 0.15, -80, 0.05);
  }

  playSquish(): void {
    this.duckBgm(1.0);
    this.playTone(75, 0.12, 'sine', 0.45);
    this.playTone(48, 0.25, 'triangle', 0.35, undefined, 0.04);
    this.playTone(110, 0.15, 'sine', 0.15, -40, 0.12);
  }

  playComplete(): void {
    this.duckBgm(1.5);
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
    notes.forEach((n, i) => {
      this.playTone(n, 0.4, 'triangle', 0.34 - i * 0.02, undefined, i * 0.11);
    });
  }

  playStar(starIndex: number): void {
    const freqs = [660, 880, 1100];
    this.playTone(freqs[starIndex - 1] ?? 880, 0.15, 'sine', 0.22);
  }

  playFail(): void {
    this.playTone(350, 0.12, 'sine', 0.25);
    this.playTone(260, 0.15, 'sine', 0.2, undefined, 0.1);
  }

  playTap(): void {
    this.playTone(880, 0.025, 'sine', 0.12);
  }

  /** @deprecated use startMenuMusic */
  startBgm(): void {
    this.startMenuMusic();
  }
}

export const SoundManager = new SoundManagerImpl();
