'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { FLOWERS_COPY, POEM_STANZAS, POEM_TITLE } from '@/lib/content';
import { Ambience } from './ambience';
import { BouquetArt } from './bouquet';
import { Ornament } from './ornaments';

export function FlowersScreen({ onContinue }: { onContinue: () => void }) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const bouquetLift = useTransform(scrollYProgress, [0, 1], [0, -46]);

  return (
    <section ref={sectionRef} className="relative flex min-h-[100svh] flex-col overflow-hidden garden-bg">
      <Ambience tone="garden" hearts={false} petals />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center"
        >
          <p className="eyebrow">{FLOWERS_COPY.eyebrow}</p>

          <motion.div
            initial={reduce ? undefined : { opacity: 0, scale: 0.92, y: 26, rotate: -2.5 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            style={reduce ? undefined : { y: bouquetLift }}
            className="relative mt-3 w-[210px] sm:mt-4 sm:w-[268px]"
          >
            <div
              className="pointer-events-none absolute inset-x-[-18%] top-[8%] h-[70%] rounded-full opacity-60 blur-3xl"
              style={{ background: 'radial-gradient(closest-side, rgba(210,147,160,0.35), transparent)' }}
              aria-hidden
            />
            <BouquetArt className="relative" />
          </motion.div>

          <p className="hand mt-1 text-[1.02rem] text-ink-soft/65">{FLOWERS_COPY.bouquetNote}</p>

          <h1 className="display-title mt-5 text-balance text-wine-deep">{FLOWERS_COPY.title}</h1>

          <Ornament className="my-6" />

          <p className="prose-body max-w-[34rem] text-balance">{FLOWERS_COPY.intro}</p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="paper relative mt-12 rounded-[6px] px-5 py-9 sm:px-10 sm:py-12"
        >
          <div className="pointer-events-none absolute inset-[9px] rounded-[3px] border border-gold/25" aria-hidden />

          <div className="relative">
            <div className="flex flex-col items-center text-center">
              <p className="eyebrow text-wine/50">my poem for you</p>
              <h2 className="script mt-2 text-[2rem] leading-tight text-wine sm:text-[2.5rem]">{POEM_TITLE}</h2>
              <div className="mt-4 h-px w-20 bg-gold/50" aria-hidden />
            </div>

            <div className="mt-9 space-y-8 sm:space-y-9">
              {POEM_STANZAS.map((stanza, index) => (
                <motion.div
                  key={index}
                  initial={reduce ? undefined : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.7, delay: reduce ? 0 : 0.04 * index, ease: [0.22, 1, 0.36, 1] }}
                  className="relative text-center"
                >
                  {stanza.map((line, lineIndex) => (
                    <p
                      key={lineIndex}
                      className="font-display text-[1.02rem] leading-[1.95] text-[#46323a] sm:text-[1.18rem] md:text-[1.24rem]"
                    >
                      {line}
                    </p>
                  ))}
                  {index < POEM_STANZAS.length - 1 && (
                    <div className="mt-7 flex items-center justify-center gap-2" aria-hidden>
                      <span className="h-px w-8 bg-gold/35" />
                      <span className="h-[3px] w-[3px] rotate-45 bg-rose-deep/40" />
                      <span className="h-px w-8 bg-gold/35" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center gap-3 border-t border-gold/25 pt-8">
              <p className="hand text-[1.05rem] text-ink-soft/65">every line was already about you</p>
            </div>
          </div>
        </motion.div>

        <div className="mt-12 flex flex-col items-center pb-6 text-center">
          <button
            type="button"
            onClick={onContinue}
            className="group flex flex-col items-center gap-3 focus-visible:outline-none"
            aria-label="Can I ask you something, Samiya? Continue to my question."
          >
            <span className="display-sub text-balance text-wine-deep transition-colors duration-500 group-hover:text-wine group-focus-visible:text-wine">
              {FLOWERS_COPY.cta}
            </span>
            <span className="flex items-center gap-2 border-b border-rose-deep/40 pb-1 text-[0.68rem] uppercase tracking-[0.3em] text-ink-soft/70 transition-all duration-500 group-hover:border-wine/60 group-hover:text-wine group-focus-visible:border-wine/60">
              ask me
              <ArrowRight className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" strokeWidth={1.6} />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
