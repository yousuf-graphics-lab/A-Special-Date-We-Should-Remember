'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { LETTER_ONE } from '@/lib/content';
import { Ambience } from './ambience';
import { WaxSeal } from './heart-lock';
import { Ornament } from './ornaments';
import { BloomBurst } from './bloom';

export function LetterScreen({ onContinue }: { onContinue: () => void }) {
  const [opened, setOpened] = useState(false);
  const [blooming, setBlooming] = useState(false);
  const reduce = useReducedMotion();

  function openLetter() {
    setOpened(true);
    setBlooming(true);
    setTimeout(() => setBlooming(false), 1600);
  }

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden day-bg">
      <Ambience tone="day" hearts={false} />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-14 sm:px-8 sm:py-20">
        <AnimatePresence mode="wait" initial={false}>
          {!opened ? (
            <motion.div
              key="envelope"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18, scale: 0.97 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full max-w-[31rem] flex-col items-center"
            >
              <p className="eyebrow">Sealed with everything I feel</p>

              <div className="relative mt-7 w-full [perspective:1400px]">
                <div
                  className="pointer-events-none absolute -inset-x-6 -bottom-6 top-8 rounded-[50%] opacity-70 blur-2xl"
                  style={{ background: 'radial-gradient(60% 60% at 50% 60%, rgba(210,147,160,0.35), transparent 70%)' }}
                  aria-hidden
                />

                <motion.div
                  className="relative aspect-[1.42/1] w-full"
                  animate={
                    reduce
                      ? {}
                      : {
                          y: [0, -6, 0],
                          rotate: [0, -0.35, 0],
                        }
                  }
                  transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {/* envelope body */}
                  <div className="absolute inset-0 overflow-hidden rounded-[10px] envelope-body">
                    <div
                      className="absolute inset-0 opacity-50"
                      style={{
                        backgroundImage:
                          'linear-gradient(160deg, rgba(255,255,255,0.55), rgba(255,255,255,0) 42%), repeating-linear-gradient(90deg, rgba(199,169,123,0.05) 0 1px, transparent 1px 9px)',
                      }}
                      aria-hidden
                    />
                    {/* lower folds */}
                    <div
                      className="absolute inset-x-0 bottom-0 top-[34%]"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(140,84,72,0.06))',
                        clipPath: 'polygon(0 36%, 50% 78%, 100% 36%, 100% 100%, 0 100%)',
                      }}
                      aria-hidden
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 top-[34%] opacity-60"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(150,96,84,0.12))',
                        clipPath: 'polygon(0 100%, 50% 62%, 100% 100%)',
                      }}
                      aria-hidden
                    />
                    {/* edges */}
                    <div className="absolute inset-0 rounded-[10px] border border-[#c8a98f]/50" aria-hidden />
                    <div className="absolute inset-[3px] rounded-[8px] border border-white/40" aria-hidden />

                    {/* her name */}
                    <div className="absolute inset-x-0 top-[46%] flex flex-col items-center px-6 text-center">
                      <p className="script text-[1.7rem] leading-none text-wine/85 sm:text-[2.1rem]">
                        {LETTER_ONE.envelopeLabel}
                      </p>
                      <span className="mt-3 block h-px w-16 bg-[#c8a98f]/70" aria-hidden />
                    </div>

                    {/* top flap */}
                    <motion.div
                      className="absolute inset-x-0 top-0 z-20 origin-top"
                      style={{ height: '66%', transformStyle: 'preserve-3d' }}
                      animate={reduce ? { rotateX: 0 } : { rotateX: 0 }}
                    >
                      <div className="envelope-flap relative h-full w-full" style={{ height: '100%' }}>
                        <div
                          className="absolute inset-0"
                          style={{
                            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                            background:
                              'linear-gradient(178deg, #fbeade 0%, #f4ddcd 58%, #e9cbb8 100%)',
                            boxShadow: '0 14px 30px -18px rgba(94,46,55,0.45)',
                          }}
                        />
                        <div
                          className="absolute inset-x-0 top-0 h-[86%] opacity-60"
                          style={{
                            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                            background:
                              'linear-gradient(200deg, rgba(255,255,255,0.75), rgba(255,255,255,0) 55%)',
                          }}
                          aria-hidden
                        />
                      </div>
                    </motion.div>

                    {/* seal */}
                    <button
                      type="button"
                      onClick={openLetter}
                      className="group absolute left-1/2 top-[64%] z-30 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-500 hover:scale-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine/50 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f4ddcd]"
                      aria-label="Open the letter"
                    >
                      <span className="absolute inset-[-10px] rounded-full bg-[#f8e6da]/70 blur-[6px]" aria-hidden />
                      <WaxSeal size={74} className="relative drop-shadow-[0_10px_16px_rgba(78,27,40,0.42)]" />
                      <span className="absolute inset-0 rounded-full ring-1 ring-white/25 transition group-hover:ring-white/40" aria-hidden />
                    </button>
                  </div>
                </motion.div>
              </div>

              <p className="hand mt-9 text-[1.1rem] text-ink-soft/80">{LETTER_ONE.envelopeHint}</p>
            </motion.div>
          ) : (
            <motion.article
              key="letter"
              initial={{ opacity: 0, y: 34, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="paper w-full max-w-[43rem] rounded-[6px] px-6 py-9 sm:px-11 sm:py-12 md:px-14 md:py-14"
            >
              {blooming && <BloomBurst count={8} className="left-1/2 top-12 h-0 w-0" />}

              <div className="pointer-events-none absolute inset-[10px] rounded-[3px] border border-gold/25" aria-hidden />

              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <p className="eyebrow text-[0.6rem] text-wine/45">For Samiya</p>
                  <p className="hand text-[0.95rem] text-ink-soft/60">from Yousuf, with all his heart</p>
                </div>

                <Ornament className="mt-5" />

                <h2 className="display-title mt-6 text-wine-deep">{LETTER_ONE.heading}</h2>

                <div className="mt-6 space-y-[1.15rem]">
                  {LETTER_ONE.paragraphs.map((paragraph, index) => (
                    <motion.p
                      key={index}
                      initial={reduce ? undefined : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.65, delay: reduce ? 0 : 0.12 + index * 0.11 }}
                      className="text-[0.99rem] leading-[1.95] text-[#4A3438] sm:text-[1.04rem]"
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </div>

                <div className="mt-9 flex flex-col items-start">
                  <p className="text-[0.95rem] italic text-ink-soft">{LETTER_ONE.signOff}</p>
                  <p className="script mt-1 text-[2.3rem] leading-none text-wine sm:text-[2.7rem]">
                    {LETTER_ONE.signature}
                  </p>
                  <svg viewBox="0 0 160 12" className="mt-1 w-32 text-wine/35" fill="none" aria-hidden>
                    <path d="M2 7C34 2 64 10 96 5C116 2 138 4 158 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="mt-10 flex flex-col items-center gap-4 border-t border-gold/25 pt-8 text-center">
                  <p className="hand text-[1.05rem] text-ink-soft/70">
                    there is a little more waiting for you
                  </p>
                  <button type="button" onClick={onContinue} className="btn btn-primary group w-full sm:w-auto">
                    {LETTER_ONE.cta}
                    <Heart
                      className="h-3.5 w-3.5 transition-transform duration-500 group-hover:scale-110"
                      strokeWidth={1.5}
                      fill="currentColor"
                    />
                  </button>
                </div>
              </div>
            </motion.article>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
