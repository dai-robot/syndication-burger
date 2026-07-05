/**
 * Web Audio API によるループBGMエンジン
 * メロディ + コードパッド + ベース + リズム
 */

const NOTE: Record<string, number> = {
  C3: 130.81, E3: 164.81, G3: 196.0, A3: 220.0,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25,
  D5: 587.33, E5: 659.25, G5: 783.99,
};

type TrackId = 'intro' | 'menu' | 'game';

interface ChordDef { notes: number[]; name: string }

const CHORDS: ChordDef[] = [
  { notes: [NOTE.C4!, NOTE.E4!, NOTE.G4!], name: 'C' },
  { notes: [NOTE.G4!, NOTE.B4!, NOTE.D5!], name: 'G' },
  { notes: [NOTE.A4!, NOTE.C5!, NOTE.E5!], name: 'Am' },
  { notes: [NOTE.F4!, NOTE.A4!, NOTE.C5!], name: 'F' },
];

const MELODY_GAME = [
  'E4', 'G4', 'C5', 'G4', 'E4', 'G4', 'A4', 'G4',
  'F4', 'A4', 'C5', 'A4', 'F4', 'E4', 'D4', 'C4',
  'G4', 'E4', 'C4', 'E4', 'G4', 'A4', 'G4', 'E4',
  'C4', 'D4', 'E4', 'G4', 'E4', 'D4', 'C4', 'G4',
] as const;

const MELODY_INTRO = [
  'C4', 'E4', 'G4', 'C5', 'G4', 'E4',
  'A4', 'C5', 'E5', 'C5', 'A4', 'G4',
  'F4', 'A4', 'C5', 'A4', 'F4', 'E4',
  'G4', 'E4', 'C4', 'E4', 'G4', 'C5',
] as const;

class MusicEngineImpl {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private melodyGain: GainNode | null = null;
  private bassGain: GainNode | null = null;
  private drumGain: GainNode | null = null;

  private schedulerTimer: ReturnType<typeof setInterval> | null = null;
  private nextBeat = 0;
  private beatIndex = 0;
  private melodyStep = 0;
  private chordIndex = 0;
  private currentTrack: TrackId = 'menu';
  private running = false;
  private muted = false;
  private activePads: OscillatorNode[] = [];
  private activeBass: OscillatorNode | null = null;

  attach(ctx: AudioContext, masterGain: GainNode): void {
    this.ctx = ctx;
    this.masterGain = masterGain;

    this.padGain = ctx.createGain();
    this.melodyGain = ctx.createGain();
    this.bassGain = ctx.createGain();
    this.drumGain = ctx.createGain();

    this.padGain.gain.value = 0.14;
    this.melodyGain.gain.value = 0.16;
    this.bassGain.gain.value = 0.12;
    this.drumGain.gain.value = 0.07;

    this.padGain.connect(masterGain);
    this.melodyGain.connect(masterGain);
    this.bassGain.connect(masterGain);
    this.drumGain.connect(masterGain);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  getBpm(): number {
    return this.currentTrack === 'intro' ? 92 : 108;
  }

  getBeatDuration(): number {
    return 60 / this.getBpm();
  }

  start(track: TrackId = 'menu'): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    this.stop();
    this.currentTrack = track;
    this.running = true;
    this.nextBeat = this.ctx.currentTime + 0.15;
    this.beatIndex = 0;
    this.melodyStep = 0;
    this.chordIndex = 0;

    this.schedulerTimer = setInterval(() => this.schedule(), 50);
  }

  stop(): void {
    this.running = false;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    for (const osc of this.activePads) {
      try { osc.stop(); } catch { /* */ }
    }
    this.activePads = [];
    if (this.activeBass) {
      try { this.activeBass.stop(); } catch { /* */ }
      this.activeBass = null;
    }
  }

  duck(duration = 0.6): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const vol = this.currentTrack === 'intro' ? 0.18 : 0.22;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(vol * 0.4, now);
    this.masterGain.gain.linearRampToValueAtTime(this.muted ? 0 : vol, now + duration);
  }

  private schedule(): void {
    if (!this.ctx || !this.running) return;
    const beat = this.getBeatDuration();

    while (this.nextBeat < this.ctx.currentTime + 0.12) {
      const bi = this.beatIndex;

      if (bi % 8 === 0) {
        this.playChord(this.nextBeat, beat * 7.5);
      }

      if (bi % 2 === 0) {
        this.playMelody(this.nextBeat, beat * 0.9);
      }

      if (bi % 4 === 0) {
        this.playBass(this.nextBeat, beat * 3.5);
      }

      if (bi % 2 === 0) {
        this.playDrum(this.nextBeat, bi % 4 === 0);
      }

      this.nextBeat += beat;
      this.beatIndex++;
    }
  }

  private playChord(time: number, duration: number): void {
    if (!this.ctx || !this.padGain) return;
    const chord = CHORDS[this.chordIndex % CHORDS.length]!;
    this.chordIndex++;

    for (const freq of chord.notes) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 0.08);
      gain.gain.setValueAtTime(0.05, time + duration * 0.7);
      gain.gain.linearRampToValueAtTime(0, time + duration);
      osc.connect(gain);
      gain.connect(this.padGain);
      osc.start(time);
      osc.stop(time + duration + 0.05);
      this.activePads.push(osc);
      osc.onended = () => {
        this.activePads = this.activePads.filter((o) => o !== osc);
      };
    }
  }

  private playMelody(time: number, duration: number): void {
    if (!this.ctx || !this.melodyGain) return;
    const melody = this.currentTrack === 'intro' ? MELODY_INTRO : MELODY_GAME;
    const noteName = melody[this.melodyStep % melody.length]!;
    this.melodyStep++;
    const freq = NOTE[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(this.melodyGain);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  private playBass(time: number, duration: number): void {
    if (!this.ctx || !this.bassGain) return;
    const chord = CHORDS[(this.chordIndex - 1 + CHORDS.length) % CHORDS.length]!;
    const freq = chord.notes[0]! / 2;

    if (this.activeBass) {
      try { this.activeBass.stop(); } catch { /* */ }
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(this.bassGain);
    osc.start(time);
    osc.stop(time + duration + 0.05);
    this.activeBass = osc;
  }

  private playDrum(time: number, accent: boolean): void {
    if (!this.ctx || !this.drumGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * (accent ? 0.06 : 0.04));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = accent ? 9000 : 7000;
    gain.gain.value = accent ? 0.18 : 0.1;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGain);
    src.start(time);
  }
}

export const MusicEngine = new MusicEngineImpl();
