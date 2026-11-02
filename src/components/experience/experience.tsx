'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import type { StageId } from '@/lib/content';
import { loadSavedResponse } from '@/lib/api-client';
import type { PublicDateResponse } from '@/lib/responses';
import { loadExperience, newToken, saveExperience } from '@/lib/client-store';
import { LockScreen } from './lock-screen';
import { LetterScreen } from './letter-screen';
import { FlowersScreen } from './flowers-screen';
import { ProposalScreen } from './proposal-screen';
import { PlannerScreen } from './planner-screen';
import { ThankYouScreen } from './thank-you-screen';
import { MusicControl, MusicProvider } from './music';
import { Progress } from './progress';

function LoadingVeil() {
  return (
    <div className="day-bg flex min-h-[100svh] flex-col items-center justify-center gap-5">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        className="text-rose-deep/60"
      >
        <Heart className="h-8 w-8" strokeWidth={1} fill="currentColor" />
      </motion.div>
      <p className="eyebrow text-[0.6rem]">opening something little…</p>
    </div>
  );
}

export function Experience() {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [stage, setStage] = useState<StageId>('lock');
  const [visited, setVisited] = useState<StageId[]>(['lock']);
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState<PublicDateResponse | null>(null);
  const reduce = useReducedMotion();
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const persisted = loadExperience();

    if (!persisted) {
      setReady(true);
      return;
    }

    setUnlocked(persisted.unlocked);
    setVisited(persisted.visited.length ? persisted.visited : ['lock']);
    setToken(persisted.token);

    if (!persisted.unlocked) {
      setReady(true);
      return;
    }

    const targetStage: StageId = persisted.stage === 'lock' ? 'letter' : persisted.stage;
    setStage(targetStage);
    if (persisted.token) {
      void loadSavedResponse(persisted.token)
        .then((response) => {
          if (cancelled) return;
          if (response) setSaved(response);
        })
        .finally(() => {
          if (!cancelled) setReady(true);
        });
    } else {
      setReady(true);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const goTo = useCallback(
    (next: StageId) => {
      setStage(next);
      const updated = visited.includes(next) ? visited : [...visited, next];
      setVisited(updated);
      saveExperience({ stage: next, visited: updated, unlocked: true });
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    },
    [visited],
  );

  const handleUnlocked = useCallback(() => {
    setUnlocked(true);
    saveExperience({ unlocked: true, stage: 'letter', visited: ['lock', 'letter'] });
    setVisited((current) => (current.includes('letter') ? current : [...current, 'letter']));
    setStage('letter');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const ensureToken = useCallback(() => {
    let next = token;
    if (!next) {
      next = newToken();
      setToken(next);
      saveExperience({ token: next, unlocked: true });
    }
    return next;
  }, [token]);

  useEffect(() => {
    if (stage === 'plan' && !token) ensureToken();
  }, [stage, token, ensureToken]);

  const handleConfirmed = useCallback((response: PublicDateResponse) => {
    setSaved(response);
    saveExperience({ token: response.token, unlocked: true, stage: 'thanks' });
    setToken(response.token);
    goTo('thanks');
  }, [goTo]);

  const tone = stage === 'proposal' || stage === 'thanks' ? 'dusk' : 'day';

  // A single soft beat while we remember where she left off — so the lock
  // screen never flashes for someone who has already unlocked the story.
  if (!ready) return <LoadingVeil />;

  return (
    <MusicProvider>
      <div className="relative flex min-h-[100svh] flex-col">
        {unlocked && stage !== 'lock' && (
          <div className="sticky top-0 z-40">
            <div
              className={
                tone === 'dusk'
                  ? 'border-b border-white/10 bg-[#24131B]/70 backdrop-blur-md'
                  : 'border-b border-wine/8 bg-ivory/70 backdrop-blur-md'
              }
            >
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
                <span
                  className={
                    tone === 'dusk'
                      ? 'script text-[1.15rem] leading-none text-[#FBE9E3]/80'
                      : 'script text-[1.15rem] leading-none text-wine/75'
                  }
                >
                  For Samiya
                </span>
                <Progress current={stage} visited={visited} onNavigate={goTo} tone={tone} />
                <span className="hidden w-16 sm:block" aria-hidden />
              </div>
            </div>
          </div>
        )}

        <main ref={mainRef} className="flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={stage}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduce ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              {stage === 'lock' && <LockScreen onUnlocked={handleUnlocked} />}

              {stage === 'letter' && <LetterScreen onContinue={() => goTo('flowers')} />}

              {stage === 'flowers' && <FlowersScreen onContinue={() => goTo('proposal')} />}

              {stage === 'proposal' && (
                <ProposalScreen
                  onAccept={() => {
                    ensureToken();
                    goTo('plan');
                  }}
                  alreadyAccepted={Boolean(saved)}
                  onReviewPlan={() => goTo('plan')}
                />
              )}

              {stage === 'plan' && (
                <PlannerScreen
                  token={token}
                  existing={saved}
                  onConfirmed={handleConfirmed}
                />
              )}

              {stage === 'thanks' && (
                <ThankYouScreen
                  response={saved}
                  onReadLetter={() => goTo('letter')}
                  onReview={() => {
                    if (saved) goTo('plan');
                    else goTo('proposal');
                  }}
                  onUpdate={(response) => {
                    setSaved(response);
                    saveExperience({ token: response.token });
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <MusicControl tone={tone} />
      </div>
    </MusicProvider>
  );
}
