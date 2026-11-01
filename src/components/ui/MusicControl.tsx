'use client';

/**
 * Sound control, top-right. Off by default, remembered per visitor, and always
 * driven by a real click so browsers never block it. If no music file is
 * configured the control simply governs the little celebration chimes instead —
 * and if audio is unsupported it hides itself rather than erroring.
 */
import { useEffect, useMemo, useState } from 'react';
import { Music2, VolumeX } from 'lucide-react';
import { createMusicController, readSoundPreference, playSoftTick, writeSoundPreference } from '@/lib/client/sound';

interface MusicControlProps {
  musicUrl?: string;
}

export function MusicControl({ musicUrl = '' }: MusicControlProps): JSX.Element {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const controller = useMemo(() => createMusicController(musicUrl), [musicUrl]);

  useEffect(() => {
    const preferred = readSoundPreference();
    setEnabled(preferred);
    setReady(true);
    if (preferred && controller) {
      // Browsers require a gesture for playback — this will quietly fail and
      // stay "blocked" until the visitor taps the control.
      void controller.play().then((playing) => {
        if (!playing) setBlocked(true);
      });
    }
  }, [controller]);

  const toggle = async (): Promise<void> => {
    const next = !enabled;
    setEnabled(next);
    writeSoundPreference(next);
    setBlocked(false);

    if (next) {
      playSoftTick();
      if (controller) {
        const playing = await controller.play();
        if (!playing) setBlocked(true);
      }
    } else {
      controller?.pause();
    }
  };

  if (!ready) return <div className="h-10 w-10" aria-hidden="true" />;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={enabled ? 'Turn sound off' : 'Turn sound on'}
        title={
          blocked
            ? 'Your browser paused the audio — tap to try again'
            : enabled
              ? 'Sound on'
              : 'Sound off'
        }
        className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.045] text-white/70 backdrop-blur-md transition hover:border-rose/40 hover:text-white"
      >
        {enabled ? (
          <Music2 size={16} aria-hidden="true" className="animate-soft-pulse" />
        ) : (
          <VolumeX size={16} aria-hidden="true" />
        )}
        <span
          aria-hidden="true"
          className={`absolute inset-0 rounded-full transition ${
            enabled ? 'shadow-[0_0_18px_-2px_rgba(255,77,141,0.55)]' : ''
          }`}
        />
      </button>
      {enabled && (
        <span className="hidden text-[0.6rem] uppercase tracking-[0.2em] text-white/35 sm:block">
          sound on
        </span>
      )}
    </div>
  );
}
