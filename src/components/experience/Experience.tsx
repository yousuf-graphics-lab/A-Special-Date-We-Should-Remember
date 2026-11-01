'use client';

/**
 * The single-page journey: invitation → choosing → countdown.
 *
 * Stages cross-fade with Framer Motion (AnimatePresence, wait mode) so the page
 * never reloads and never jumps. The stage is seeded from the server, which
 * means a returning visitor lands straight on their countdown.
 */
import { useCallback, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Invitation } from '../invitation/Invitation';
import { DateForm } from '../date/DateForm';
import { CountdownScreen } from '../countdown/CountdownScreen';
import { MusicControl } from '../ui/MusicControl';
import { celebrateYes } from '@/lib/client/celebration';
import { playHeartChime, readSoundPreference } from '@/lib/client/sound';
import type { PublicSelection } from '@/lib/types';

type Stage = 'invitation' | 'choosing' | 'countdown';

interface ExperienceProps {
  initialSelection: PublicSelection | null;
  musicUrl?: string;
}

export function Experience({ initialSelection, musicUrl }: ExperienceProps): JSX.Element {
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>(initialSelection ? 'countdown' : 'invitation');
  const [selection, setSelection] = useState<PublicSelection | null>(initialSelection);

  const accept = useCallback(() => {
    void celebrateYes();
    if (readSoundPreference()) playHeartChime();
    setStage('choosing');
  }, []);

  const sealed = useCallback((value: PublicSelection) => {
    setSelection(value);
    setStage('countdown');
  }, []);

  const variants = reducedMotion
    ? {
        enter: { opacity: 0 },
        centre: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: { opacity: 0, scale: 0.975, y: 16, filter: 'blur(8px)' },
        centre: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 1.015, y: -12, filter: 'blur(8px)' },
      };

  return (
    <main className="relative flex min-h-[100dvh] flex-col">
      <div className="flex items-center justify-between px-4 pt-4 sm:px-8 sm:pt-6">
        <div className="flex items-center gap-2 text-white/35">
          <Heart size={13} aria-hidden="true" className="fill-rose/60 text-rose/70" />
          <span className="font-display text-[0.78rem] uppercase tracking-[0.34em]">For Samiya</span>
        </div>
        <MusicControl musicUrl={musicUrl} />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <AnimatePresence mode="wait" initial={false}>
          {stage === 'invitation' && (
            <motion.section
              key="invitation"
              variants={variants}
              initial="enter"
              animate="centre"
              exit="exit"
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
              aria-label="The invitation"
            >
              <Invitation onAccept={accept} />
            </motion.section>
          )}

          {stage === 'choosing' && (
            <motion.section
              key="choosing"
              variants={variants}
              initial="enter"
              animate="centre"
              exit="exit"
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
              aria-label="Choose our date"
            >
              <DateForm onSealed={sealed} />
            </motion.section>
          )}

          {stage === 'countdown' && selection && (
            <motion.section
              key="countdown"
              variants={variants}
              initial="enter"
              animate="centre"
              exit="exit"
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
              aria-label="Our countdown"
            >
              <CountdownScreen selection={selection} />
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <footer className="px-4 pb-6 text-center sm:pb-8">
        <p className="text-[0.62rem] uppercase tracking-[0.3em] text-white/18">
          {stage === 'invitation'
            ? 'a small question, asked properly'
            : stage === 'choosing'
              ? 'choose it, and it is ours'
              : 'written for one person'}
        </p>
      </footer>
    </main>
  );
}
