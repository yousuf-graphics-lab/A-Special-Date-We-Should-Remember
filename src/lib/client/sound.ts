/**
 * Tiny WebAudio toolkit: a soft "heart chime" for the celebration and an
 * ambient-music controller. No audio files are required, so the experience
 * always works — and sound is off until the visitor explicitly asks for it.
 */
const SOUND_PREF_KEY = 'samiya:sound';

let context: AudioContext | null = null;
let music: HTMLAudioElement | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === 'suspended') void context.resume();
  return context;
}

export function readSoundPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SOUND_PREF_KEY) === 'on';
  } catch {
    return false;
  }
}

export function writeSoundPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOUND_PREF_KEY, enabled ? 'on' : 'off');
  } catch {
    /* storage blocked — preference simply won't persist */
  }
}

function tone(
  ctx: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  peak: number,
): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  const start = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

/** A gentle, bell-like arpeggio — warm, short, never startling. */
export function playHeartChime(): void {
  try {
    const ctx = audioContext();
    if (!ctx) return;
    // E5 · G#5 · B5 · E6 — a soft major lift.
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((frequency, index) => {
      tone(ctx, frequency, index * 0.09, 1.25, 0.075);
    });
    tone(ctx, 329.63, 0, 1.6, 0.045);
  } catch {
    /* audio is a bonus, never a requirement */
  }
}

/** Short confirmation tick for saving / copying. */
export function playSoftTick(): void {
  try {
    const ctx = audioContext();
    if (!ctx) return;
    tone(ctx, 880, 0, 0.18, 0.05);
    tone(ctx, 1318.51, 0.06, 0.22, 0.04);
  } catch {
    /* noop */
  }
}

export interface MusicController {
  play: () => Promise<boolean>;
  pause: () => void;
}

/** Lazily creates the ambient <audio> element (only if a URL is configured). */
export function createMusicController(url: string): MusicController | null {
  if (typeof window === 'undefined' || !url) return null;
  return {
    async play(): Promise<boolean> {
      try {
        if (!music) {
          music = new Audio(url);
          music.loop = true;
          music.volume = 0.32;
          music.preload = 'none';
        }
        await music.play();
        return true;
      } catch {
        // Autoplay blocked or asset missing — fail quietly.
        return false;
      }
    },
    pause(): void {
      music?.pause();
    },
  };
}
