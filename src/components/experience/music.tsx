'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Music2, VolumeX } from 'lucide-react';
import { SITE } from '@/lib/content';
import { clsx } from 'clsx';

type MusicContextValue = {
  playing: boolean;
  available: boolean;
  toggle: () => void;
  playChime: () => void;
  hasStarted: boolean;
};

const MusicContext = createContext<MusicContextValue | null>(null);

const PREFERENCE_KEY = 'for-samiya.music';

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chimeRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);

  // Load the listener's preference once.
  useEffect(() => {
    try {
      setMuted(window.localStorage.getItem(PREFERENCE_KEY) === 'muted');
    } catch {
      /* ignore */
    }
  }, []);

  const fadeTo = useCallback((target: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeTimer.current) clearInterval(fadeTimer.current);
    const step = target > audio.volume ? 0.02 : -0.03;
    fadeTimer.current = setInterval(() => {
      if (!audioRef.current) return;
      const next = audioRef.current.volume + step;
      if ((step > 0 && next >= target) || (step < 0 && next <= target)) {
        audioRef.current.volume = Math.max(0, Math.min(1, target));
        if (fadeTimer.current) clearInterval(fadeTimer.current);
        fadeTimer.current = null;
        return;
      }
      audioRef.current.volume = Math.max(0, Math.min(1, next));
    }, 120);
  }, []);

  const start = useCallback(
    async (force = false) => {
      const audio = audioRef.current;
      if (!audio || !available) return;
      if (muted && !force) return;
      if (!audio.paused) {
        setPlaying(true);
        return;
      }
      try {
        audio.volume = 0;
        await audio.play();
        hasStartedRef.current = true;
        setPlaying(true);
        setHasStarted(true);
        fadeTo(SITE.music.volume);
      } catch {
        setPlaying(false);
      }
    },
    [available, fadeTo, muted],
  );

  // Browsers need a gesture before audio can begin.
  useEffect(() => {
    // Only listen until the very first successful start, so pausing is respected.
    if (muted || hasStarted) return;
    const onGesture = () => {
      void start();
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, onGesture, { passive: true }));
    return () => {
      events.forEach((event) => window.removeEventListener(event, onGesture));
    };
  }, [start, muted, hasStarted]);

  useEffect(
    () => () => {
      if (fadeTimer.current) clearInterval(fadeTimer.current);
    },
    [],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      setMuted(true);
      try {
        window.localStorage.setItem(PREFERENCE_KEY, 'muted');
      } catch {
        /* ignore */
      }
      return;
    }
    setMuted(false);
    try {
      window.localStorage.removeItem(PREFERENCE_KEY);
    } catch {
      /* ignore */
    }
    void start(true);
  }, [playing, start]);

  const playChime = useCallback(() => {
    if (muted) return;
    const chime = chimeRef.current;
    if (!chime) return;
    try {
      chime.currentTime = 0;
      chime.volume = 0.45;
      void chime.play();
    } catch {
      /* never block the experience on audio */
    }
  }, [muted]);

  const value = useMemo<MusicContextValue>(
    () => ({ playing, available, toggle, playChime, hasStarted }),
    [playing, available, toggle, playChime, hasStarted],
  );

  return (
    <MusicContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        src={SITE.music.src}
        loop
        preload="auto"
        playsInline
        aria-hidden
        className="hidden"
        onError={() => {
          setAvailable(false);
          setPlaying(false);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <audio ref={chimeRef} src={SITE.music.chime} preload="auto" aria-hidden className="hidden" />
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextValue {
  const context = useContext(MusicContext);
  if (!context) {
    return { playing: false, available: false, toggle: () => {}, playChime: () => {}, hasStarted: false };
  }
  return context;
}

export function MusicControl({ tone = 'day' }: { tone?: 'day' | 'dusk' }) {
  const { playing, available, toggle } = useMusic();
  const dusk = tone === 'dusk';

  return (
    <div className="no-print fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 sm:right-6">
      <button
        type="button"
        onClick={toggle}
        disabled={!available}
        className={clsx(
          'group relative flex h-11 w-11 items-center justify-center rounded-full opacity-80 transition-all duration-500 hover:opacity-100 focus-visible:opacity-100',
          dusk
            ? 'border border-white/20 bg-white/10 text-[#FBEDE9] backdrop-blur-md hover:bg-white/20'
            : 'border border-wine/15 bg-white/70 text-wine shadow-soft backdrop-blur-md hover:bg-white/90',
          !available && 'cursor-not-allowed opacity-60',
        )}
        aria-label={
          !available
            ? 'Background music is not available'
            : playing
              ? 'Pause the background music'
              : 'Play the background music'
        }
        aria-pressed={playing}
        title={available ? (playing ? 'Pause music' : 'Play music') : 'Music unavailable'}
      >
        {playing && (
          <span
            className={clsx(
              'absolute inset-0 rounded-full',
              dusk ? 'bg-white/10' : 'bg-rose/10',
            )}
            style={{ animation: 'breathe 4.5s ease-in-out infinite' }}
            aria-hidden
          />
        )}
        {available ? (
          <Music2 className={clsx('h-[18px] w-[18px]', playing ? 'opacity-90' : 'opacity-60')} strokeWidth={1.5} />
        ) : (
          <VolumeX className="h-[18px] w-[18px] opacity-60" strokeWidth={1.5} />
        )}
      </button>
      {!available && (
        <span
          className={clsx(
            'pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md px-2 py-1 text-[0.65rem] tracking-wide',
            dusk ? 'bg-black/50 text-white/80' : 'bg-white/90 text-ink-soft shadow',
          )}
        >
          No audio track added yet
        </span>
      )}
    </div>
  );
}
