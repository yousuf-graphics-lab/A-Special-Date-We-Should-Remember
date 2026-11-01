'use client';

/**
 * Step three — the countdown, the summary, and the two things worth keeping:
 * a calendar file and a picture of the plan.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CalendarPlus,
  Check,
  Heart,
  ImageDown,
  Loader2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Countdown } from './Countdown';
import { DateCard } from './DateCard';
import { activityLabel } from '@/lib/constants';
import {
  formatLongDate,
  formatTime12h,
  getRemainingTime,
  resolveDateInstant,
  timeZoneLabel,
} from '@/lib/datetime';
import { buildIcsFile, downloadIcs } from '@/lib/ics';
import { downloadDataUrl, generateDateCard } from '@/lib/client/dateCard';
import { playSoftTick } from '@/lib/client/sound';
import type { PublicSelection } from '@/lib/types';

interface CountdownScreenProps {
  selection: PublicSelection;
}

export function CountdownScreen({ selection }: CountdownScreenProps): JSX.Element {
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [arrived, setArrived] = useState(false);
  const [cardState, setCardState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [calendarDone, setCalendarDone] = useState(false);

  const target = useMemo(
    () => resolveDateInstant(selection.date, selection.time, selection.timezone),
    [selection.date, selection.time, selection.timezone],
  );

  const countdownLine = useMemo(() => {
    const remaining = getRemainingTime(target);
    if (remaining.isPast) return 'It is today';
    if (remaining.days >= 1) return `${remaining.days} day${remaining.days === 1 ? '' : 's'} to go`;
    return `${remaining.hours} hour${remaining.hours === 1 ? '' : 's'} to go`;
  }, [target]);

  const handleCalendar = useCallback(() => {
    const ics = buildIcsFile({
      uid: `samiya-${selection.date}-${selection.time.replace(':', '')}`,
      dateISO: selection.date,
      time: selection.time,
      timezone: selection.timezone,
      activity: selection.activity,
    });
    downloadIcs(`our-date-${selection.date}.ics`, ics);
    setCalendarDone(true);
    playSoftTick();
  }, [selection]);

  const handleCard = useCallback(async () => {
    if (!cardRef.current || cardState === 'working') return;
    setCardState('working');
    try {
      const dataUrl = await generateDateCard(cardRef.current);
      downloadDataUrl(dataUrl, `for-samiya-${selection.date}.png`);
      setCardState('done');
      playSoftTick();
      window.setTimeout(() => setCardState('idle'), 3200);
    } catch {
      setCardState('error');
      window.setTimeout(() => setCardState('idle'), 4000);
    }
  }, [cardState, selection.date]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-2xl text-center"
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.07] px-4 py-1.5 text-[0.64rem] font-medium uppercase tracking-[0.28em] text-gold/85"
      >
        <Sparkles size={12} aria-hidden="true" />
        It&rsquo;s official
      </motion.p>

      <h2 className="section-title">
        {arrived ? (
          <>
            Today is the day<span className="text-rose">.</span>
          </>
        ) : (
          <>
            Counting down <span className="italic text-rose-soft">to us</span>
          </>
        )}
      </h2>

      <div className="mt-7">
        {arrived ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass mx-auto max-w-md px-6 py-8"
          >
            <Heart className="mx-auto mb-3 text-rose" size={30} aria-hidden="true" />
            <p className="font-display text-xl leading-relaxed text-white">
              No more counting. Just be there.
            </p>
            <p className="mt-2 text-sm text-white/50">I&rsquo;ll be the one with the flowers.</p>
          </motion.div>
        ) : (
          <Countdown
            dateISO={selection.date}
            time={selection.time}
            timezone={selection.timezone}
            onArrive={() => setArrived(true)}
          />
        )}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reducedMotion ? 0 : 0.35, duration: 0.8 }}
        className="glass mt-8 px-5 py-6 text-left sm:px-7 sm:py-7"
      >
        <p className="font-display text-[clamp(1.05rem,4.6vw,1.45rem)] leading-snug text-white">
          {formatLongDate(selection.date)}
          <span className="mx-1.5 text-rose/60" aria-hidden="true">
            ·
          </span>
          {formatTime12h(selection.time)}
          <span className="mx-1.5 text-rose/60" aria-hidden="true">
            ·
          </span>
          <span className="text-gold">{activityLabel(selection.activity)}</span>
        </p>

        <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-white/35">
          <MapPin size={11} aria-hidden="true" />
          {timeZoneLabel(selection.timezone)} time
        </p>

        <div className="hairline my-5" />

        <p className="font-display text-lg italic leading-relaxed text-rose-soft/95">
          I&rsquo;ll be there. Will you?
        </p>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={handleCalendar}
            className="btn-ghost flex-1 justify-center py-3 text-[0.8rem]"
          >
            {calendarDone ? (
              <>
                <Check size={15} aria-hidden="true" /> Saved to your downloads
              </>
            ) : (
              <>
                <CalendarPlus size={15} aria-hidden="true" /> Add to Calendar
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCard}
            disabled={cardState === 'working'}
            className="btn-gold flex-1 justify-center py-3 text-[0.8rem] disabled:opacity-60"
          >
            {cardState === 'working' ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Making your card…
              </>
            ) : cardState === 'done' ? (
              <>
                <Check size={15} aria-hidden="true" /> Card saved
              </>
            ) : (
              <>
                <ImageDown size={15} aria-hidden="true" /> Create Our Date Card
              </>
            )}
          </button>
        </div>

        {cardState === 'error' && (
          <p role="alert" className="mt-3 text-xs text-rose-soft">
            The card would not render this time — try once more, or keep the calendar file instead.
          </p>
        )}
      </motion.div>

      <p className="mt-6 text-[0.68rem] leading-relaxed text-white/25">
        Sealed privately. Only the two of us know what we planned.
      </p>

      <DateCard
        ref={cardRef}
        dateISO={selection.date}
        time={selection.time}
        activity={selection.activity}
        countdownLine={countdownLine}
      />
    </motion.div>
  );
}
