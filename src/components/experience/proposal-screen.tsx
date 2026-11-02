'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { Heart } from 'lucide-react';
import { PROPOSAL_COPY } from '@/lib/content';
import { apiPost } from '@/lib/api-client';
import { Ambience } from './ambience';
import { CoupleArt } from './couple';
import { Ornament } from './ornaments';

type View = 'question' | 'declined' | 'farewell';

const MAX_DODGES = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function seeded(index: number, salt = 1) {
  const x = Math.sin(index * 12.9898 * salt) * 43758.5453;
  return x - Math.floor(x);
}

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

  const wrapRef = useRef<HTMLDivElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  const noRef = useRef<HTMLButtonElement>(null);
  const noX = useMotionValue(0);
  const noY = useMotionValue(0);
  const noSpringX = useSpring(noX, { stiffness: 240, damping: 20, mass: 0.6 });
  const noSpringY = useSpring(noY, { stiffness: 240, damping: 20, mass: 0.6 });
  const movedRef = useRef({ x: 0, y: 0 });
  const dodgesRef = useRef(0);

  const settled = dodges >= MAX_DODGES;

  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(onAccept, reduce ? 600 : 2400);
    return () => clearTimeout(timer);
  }, [celebrating, onAccept, reduce]);

  const recordAnswer = useCallback(async (answer: 'yes' | 'no') => {
    // Fire and forget: her real plan is saved on the next screen.
    await apiPost('/api/proposal', { answer }).catch(() => null);
  }, []);

  const dodge = useCallback(() => {
    if (dodgesRef.current >= MAX_DODGES) return;
    const wrap = wrapRef.current;
    const no = noRef.current;
    const yes = yesRef.current;
    if (!wrap || !no || !yes) return;

    const wrapRect = wrap.getBoundingClientRect();
    const noRect = no.getBoundingClientRect();
    const yesRect = yes.getBoundingClientRect();

    const maxX = Math.max(28, (wrapRect.width - noRect.width) / 2 - 6);
    const maxY = Math.max(26, (wrapRect.height - noRect.height) / 2 - 4);

    let best: { x: number; y: number; overlaps: boolean } | null = null;

    for (let attempt = 0; attempt < 16; attempt += 1) {
      const candidateX = clamp(movedRef.current.x + (seeded(attempt + dodgesRef.current, 2.3) * 2 - 1) * 150, -maxX, maxX);
      const candidateY = clamp(movedRef.current.y + (seeded(attempt + dodgesRef.current, 4.7) * 2 - 1) * 78, -maxY, maxY);
      const dx = candidateX - movedRef.current.x;
      const dy = candidateY - movedRef.current.y;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) continue;

      const prospective = {
        left: noRect.left + dx,
        top: noRect.top + dy,
        right: noRect.right + dx,
        bottom: noRect.bottom + dy,
      };
      const overlapsYes =
        prospective.right > yesRect.left - 14 &&
        prospective.left < yesRect.right + 14 &&
        prospective.bottom > yesRect.top - 14 &&
        prospective.top < yesRect.bottom + 14;

      if (!best) best = { x: candidateX, y: candidateY, overlaps: overlapsYes };
      if (!overlapsYes) {
        best = { x: candidateX, y: candidateY, overlaps: false };
        break;
      }
    }

    if (!best) return;
    movedRef.current = { x: best.x, y: best.y };
    noX.set(best.x);
    noY.set(best.y);
    dodgesRef.current += 1;
    setDodges(dodgesRef.current);
    setMessage(
      dodgesRef.current >= MAX_DODGES
        ? PROPOSAL_COPY.settled
        : PROPOSAL_COPY.dodges[Math.min(dodgesRef.current - 1, PROPOSAL_COPY.dodges.length - 1)],
    );
  }, [noX, noY]);

  function handleNoAttempt() {
    setPressedNo(true);
    if (dodgesRef.current < 2) {
      dodge();
      return;
    }
    decline();
  }

  function decline() {
    if (chosen) return;
    setChosen(true);
    setView('declined');
    void recordAnswer('no');
  }

  function accept() {
    if (chosen) return;
    setChosen(true);
    setCelebrating(true);
    void recordAnswer('yes');
  }

  const particles = useMemo(() => {
    return Array.from({ length: reduce ? 8 : 26 }, (_, index) => ({
      id: index,
      left: seeded(index + 1, 1.7) * 100,
      delay: seeded(index + 1, 2.9) * 0.8,
      duration: 2 + seeded(index + 1, 3.7) * 1.6,
      size: 10 + seeded(index + 1, 5.1) * 18,
      drift: (seeded(index + 1, 6.3) - 0.5) * 160,
      type: index % 3 === 0 ? 'petal' : 'heart',
      rotate: seeded(index + 1, 7.7) * 220,
    }));
  }, [reduce]);

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
                  <div
                    ref={wrapRef}
                    className="relative mt-9 flex w-full max-w-[32rem] flex-wrap items-center justify-center gap-4 pb-2 pt-2"
                  >
                    <button
                      ref={yesRef}
                      type="button"
                      onClick={accept}
                      disabled={celebrating}
                      className="btn btn-primary relative min-w-[13.5rem] px-8 py-4 text-[0.9rem] tracking-[0.1em]"
                      style={{ animation: 'heartbeat 2.8s ease-in-out infinite' }}
                    >
                      <Heart className="h-4 w-4" strokeWidth={1.6} fill="currentColor" />
                      {PROPOSAL_COPY.yes}
                    </button>

                    <motion.button
                      ref={noRef}
                      type="button"
                      style={{ x: noSpringX, y: noSpringY }}
                      onPointerEnter={(event) => {
                        if (event.pointerType === 'mouse' && !settled) dodge();
                      }}
                      onFocus={() => {
                        /* keyboard users are never chased */
                      }}
                      onClick={handleNoAttempt}
                      className="btn btn-ghost-dusk relative min-w-[10.5rem] px-6 py-3.5 text-[0.8rem] tracking-[0.1em]"
                      aria-describedby="no-hint"
                    >
                      {PROPOSAL_COPY.no}
                    </motion.button>
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
                        ? 'Press again if you would really rather not.'
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

      <AnimatePresence>
        {celebrating && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
          >
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(60% 50% at 50% 45%, rgba(255,214,206,0.16), transparent 70%)' }}
            />
            {particles.map((particle) => (
              <motion.span
                key={particle.id}
                initial={{ opacity: 0, y: '-10vh', x: 0, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: '112vh',
                  x: particle.drift,
                  rotate: particle.rotate,
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: 'easeIn',
                }}
                className="absolute top-0"
                style={{ left: `${particle.left}%` }}
              >
                {particle.type === 'heart' ? (
                  <Heart
                    style={{ width: particle.size, height: particle.size }}
                    className="text-[#F0B9B0]"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                ) : (
                  <span
                    className="block"
                    style={{
                      width: particle.size,
                      height: particle.size * 0.7,
                      background: 'linear-gradient(135deg, rgba(247,214,208,0.95), rgba(214,138,152,0.75))',
                      borderRadius: '60% 40% 55% 45% / 55% 55% 45% 45%',
                    }}
                  />
                )}
              </motion.span>
            ))}
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: [0, 1, 1], scale: 1 }}
              transition={{ duration: 1.4, times: [0, 0.3, 1] }}
              className="absolute inset-x-0 top-[42%] text-center script text-[2.6rem] text-[#FFF1EA] sm:text-[3.4rem]"
            >
              She said yes.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
