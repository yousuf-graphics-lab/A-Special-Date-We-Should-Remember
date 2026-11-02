'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { PROPOSAL_COPY } from '@/lib/content';
import { apiPost } from '@/lib/api-client';
import { Ambience } from './ambience';
import { CoupleArt } from './couple';
import { Ornament } from './ornaments';
import { Celebration } from './celebration';
import { WanderingNo } from './wandering-no';

type View = 'question' | 'declined' | 'farewell';

const MAX_DODGES = 3;

export function ProposalScreen({
  onAccept,
  alreadyAccepted = false,
  onReviewPlan,
}: {
  onAccept: () => void;
  alreadyAccepted?: boolean;
  onReviewPlan?: () => void;
}) {
  const [view, setView] = useState<View>('question');
  const [dodges, setDodges] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [chosen, setChosen] = useState(false);
  const [pressedNo, setPressedNo] = useState(false);
  const reduce = useReducedMotion();

  const yesRef = useRef<HTMLButtonElement>(null);
  const dodgesRef = useRef(0);
  const [wandering, setWandering] = useState(false);

  const settled = dodges >= MAX_DODGES;

  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(onAccept, reduce ? 600 : 2700);
    return () => clearTimeout(timer);
  }, [celebrating, onAccept, reduce]);

  const recordAnswer = useCallback(async (answer: 'yes' | 'no') => {
    // Fire and forget: her real plan is saved on the next screen.
    await apiPost('/api/proposal', { answer }).catch(() => null);
  }, []);

  const handleWander = useCallback(() => {
    if (dodgesRef.current >= MAX_DODGES) return;
    dodgesRef.current += 1;
    setDodges(dodgesRef.current);
    setPressedNo(true);
    setMessage(
      dodgesRef.current >= MAX_DODGES
        ? PROPOSAL_COPY.settled
        : PROPOSAL_COPY.dodges[Math.min(dodgesRef.current - 1, PROPOSAL_COPY.dodges.length - 1)],
    );
  }, []);

  // A tap on a fleeing button counts the same as a hover.
  function handleGiveUp() {
    setPressedNo(true);
    if (dodgesRef.current >= MAX_DODGES - 1) {
      decline();
      return;
    }
    handleWander();
  }

  function decline() {
    if (chosen) return;
    setChosen(true);
    setView('declined');
    setWandering(false);
    void recordAnswer('no');
  }

  function accept() {
    if (chosen) return;
    setChosen(true);
    setCelebrating(true);
    void recordAnswer('yes');
  }

  // The No button only starts roaming when she has actually seen the question.
  useEffect(() => {
    if (view !== 'question' || alreadyAccepted || reduce) {
      setWandering(false);
      return;
    }
    const timer = setTimeout(() => setWandering(true), 1500);
    return () => clearTimeout(timer);
  }, [view, alreadyAccepted, reduce]);

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden dusk-bg">
      <Ambience tone="dusk" hearts petals />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 pb-[38vh] pt-16 sm:px-8 sm:pb-[30vh] sm:pt-20">
        <AnimatePresence mode="wait">
          {view === 'question' && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full flex-col items-center text-center"
            >
              <p className="eyebrow text-[#F3CFC9]/60">{PROPOSAL_COPY.eyebrow}</p>

              <h1 className="script mt-3 text-[3.4rem] leading-none text-[#FBEAE4] drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:text-[4.4rem]">
                {PROPOSAL_COPY.title}
              </h1>

              <p className="mt-5 text-[0.98rem] font-light text-[#F6DEDA]/80 sm:text-[1.05rem]">
                {PROPOSAL_COPY.line}
              </p>

              <h2 className="display-hero mt-3 max-w-[24rem] text-balance text-[#FFF3EC] sm:max-w-none">
                {PROPOSAL_COPY.question}
              </h2>

              <Ornament tone="dusk" className="my-5" />

              <p className="max-w-[30rem] text-[0.92rem] font-light leading-[1.9] text-[#F1D9D4]/75 sm:text-[0.98rem]">
                {PROPOSAL_COPY.sub}
              </p>

              {alreadyAccepted ? (
                <div className="mt-9 flex flex-col items-center gap-4">
                  <p className="hand text-[1.15rem] text-[#F7D7D0]/85">
                    you already said yes, and my heart is still smiling
                  </p>
                  <button type="button" onClick={onReviewPlan} className="btn btn-primary">
                    Look at our little plan
                    <Heart className="h-3.5 w-3.5" strokeWidth={1.5} fill="currentColor" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mt-9 flex w-full flex-col items-center justify-center gap-4">
                    <span className="yes-pulse relative inline-flex">
                      <span className="yes-glow" aria-hidden />
                      <motion.button
                        ref={yesRef}
                        type="button"
                        onClick={accept}
                        disabled={celebrating}
                        whileHover={reduce ? undefined : { scale: 1.025 }}
                        whileTap={reduce ? undefined : { scale: 0.985 }}
                        className="btn btn-primary relative min-w-[13.5rem] px-8 py-4 text-[0.9rem] tracking-[0.1em]"
                      >
                        <Heart className="h-4 w-4" strokeWidth={1.6} fill="currentColor" />
                        {PROPOSAL_COPY.yes}
                      </motion.button>
                    </span>

                    <WanderingNo
                      label={PROPOSAL_COPY.no}
                      onGiveUp={handleGiveUp}
                      onDecline={decline}
                      yesRef={yesRef}
                      wandering={wandering && !settled && !celebrating}
                      onWander={handleWander}
                    />
                  </div>

                  <div className="mt-3 min-h-[2.6rem] max-w-[26rem]" aria-live="polite">
                    <AnimatePresence mode="wait">
                      {message && (
                        <motion.p
                          key={message}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="font-display text-[1rem] italic text-[#F7D8D0]/80"
                        >
                          {message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <span id="no-hint" className="sr-only">
                      {pressedNo && !settled
                        ? 'Press it again if you would really rather not.'
                        : 'You can decline if you would like to.'}
                    </span>
                  </div>

                  {pressedNo && !settled && (
                    <button
                      type="button"
                      onClick={decline}
                      className="mt-1 border-b border-white/25 pb-0.5 text-[0.68rem] uppercase tracking-[0.24em] text-[#F4D9D4]/60 transition hover:border-white/50 hover:text-[#FBE8E3]"
                    >
                      It's okay — I'll say no
                    </button>
                  )}
                </>
              )}
            </motion.div>
          )}

          {view === 'declined' && (
            <motion.div
              key="declined"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="glass w-full max-w-[34rem] rounded-[14px] px-6 py-10 text-center sm:px-10 sm:py-12"
            >
              <p className="eyebrow text-[#F3CFC9]/55">no hurry, no pressure</p>
              <h2 className="script mt-3 text-[2.4rem] leading-tight text-[#FBEAE4] sm:text-[2.9rem]">
                {PROPOSAL_COPY.declineTitle}
              </h2>
              <p className="mt-4 text-[0.96rem] font-light leading-[1.9] text-[#F1D9D4]/80">
                {PROPOSAL_COPY.declineBody}
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setView('question');
                    setChosen(false);
                    setMessage(null);
                  }}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  {PROPOSAL_COPY.declineRetry}
                </button>
                <button
                  type="button"
                  onClick={() => setView('farewell')}
                  className="btn btn-ghost-dusk w-full sm:w-auto"
                >
                  {PROPOSAL_COPY.declineLeave}
                </button>
              </div>
            </motion.div>
          )}

          {view === 'farewell' && (
            <motion.div
              key="farewell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-[32rem] text-center"
            >
              <Heart className="mx-auto h-8 w-8 text-[#E9B9B2]/70" strokeWidth={1} />
              <p className="script mt-4 text-[2.2rem] leading-tight text-[#FBEAE4]">Always, for you.</p>
              <p className="mt-3 text-[0.95rem] font-light leading-[1.9] text-[#F1D9D4]/75">
                {PROPOSAL_COPY.leaveBody}
              </p>
              <button
                type="button"
                onClick={() => setView('question')}
                className="btn btn-ghost-dusk mt-7"
              >
                Stay a little longer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 opacity-95">
        <CoupleArt className="w-full" />
      </div>

      <Celebration show={celebrating} />
    </section>
  );
}
