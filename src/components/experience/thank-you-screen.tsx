'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  CalendarDays,
  Clock,
  Heart,
  MapPin,
  MessageSquare,
  Mic,
  Trash2,
  Camera,
} from 'lucide-react';
import { LETTER_TWO, ACTIVITY_LABELS, type ActivityId } from '@/lib/content';
import { apiPatch } from '@/lib/api-client';
import type { PublicDateResponse } from '@/lib/responses';
import { formatCalendarDate, formatDuration, formatTimeLabel } from '@/lib/time';
import { Ambience } from './ambience';
import { Ornament } from './ornaments';
import { BloomBurst } from './bloom';

export function ThankYouScreen({
  response,
  onReadLetter,
  onReview,
  onUpdate,
}: {
  response: PublicDateResponse | null;
  onReadLetter: () => void;
  onReview: () => void;
  onUpdate: (response: PublicDateResponse) => void;
}) {
  const reduce = useReducedMotion();
  const [revealed, setRevealed] = useState(Boolean(reduce));
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (reduce) {
      setRevealed(true);
      return;
    }
    const timer = setTimeout(() => setRevealed(true), 1500);
    return () => clearTimeout(timer);
  }, [reduce]);

  const voice = response?.media.find((item) => item.type === 'voice') ?? null;
  const photos = response?.media.filter((item) => item.type === 'photo') ?? [];
  const location = response?.location ?? null;
  const activityLabel = response ? ACTIVITY_LABELS[response.activity as ActivityId] ?? response.activity : '';

  async function removeMedia(mediaId: string) {
    if (!response) return;
    setRemoving(mediaId);
    setError(null);
    const result = await apiPatch<{ response: PublicDateResponse }>('/api/date-response', {
      token: response.token,
      action: 'remove-media',
      mediaId,
    });
    setRemoving(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onUpdate(result.data.response);
  }

  async function removeLocation() {
    if (!response) return;
    setRemoving('location');
    setError(null);
    const result = await apiPatch<{ response: PublicDateResponse }>('/api/date-response', {
      token: response.token,
      action: 'remove-location',
    });
    setRemoving(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onUpdate(result.data.response);
  }

  return (
    <section className="relative min-h-[100svh] overflow-hidden dusk-bg">
      <Ambience tone="dusk" hearts petals />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        {revealed && <BloomBurst count={9} tone="dusk" className="left-1/2 top-16 h-0 w-0" />}

        {/* the envelope opening, as a quiet opening scene */}
        <div className="flex flex-col items-center">
          <AnimatePresence>
            {!revealed && (
              <motion.div
                key="envelope"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.03, y: -14 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-10 h-[150px] w-[230px] [perspective:900px]"
              >
                <div className="absolute inset-0 rounded-[8px] envelope-body" />
                <div
                  className="absolute inset-0 rounded-[8px] border border-[#c8a98f]/60"
                  aria-hidden
                />
                <motion.div
                  className="absolute inset-x-0 top-0 origin-top"
                  style={{ height: '62%' }}
                  animate={{ rotateX: -160 }}
                  transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="envelope-flap h-full w-full" />
                </motion.div>
                <motion.div
                  className="absolute inset-x-6 top-[24%] h-[70%] rounded-[3px] bg-[#FCF5EA] shadow-lg"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: -28, opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
                <p className="absolute inset-x-0 bottom-[-2.2rem] text-center hand text-[1rem] text-[#F3D9D2]/70">
                  one last letter…
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={false}
            animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 14 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <div className="text-center">
              <p className="eyebrow text-[#F3CFC9]/60">the last little chapter</p>
              <h1 className="script mt-2 text-[2.5rem] leading-tight text-[#FBEAE4] sm:text-[3.2rem]">
                A Little Thank You
              </h1>
            </div>

            <article className="paper relative mt-8 rounded-[6px] px-6 py-9 sm:px-11 sm:py-12">
              <div className="pointer-events-none absolute inset-[10px] rounded-[3px] border border-gold/25" aria-hidden />
              <div className="relative">
                <h2 className="display-title text-wine-deep">{LETTER_TWO.heading}</h2>
                <div className="mt-6 space-y-[1.1rem]">
                  {LETTER_TWO.paragraphs.map((paragraph, index) => (
                    <motion.p
                      key={index}
                      initial={reduce ? undefined : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: reduce ? 0 : 0.15 + index * 0.09 }}
                      className="text-[0.99rem] leading-[1.95] text-[#4A3438] sm:text-[1.04rem]"
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </div>
                <div className="mt-8">
                  <p className="text-[0.95rem] italic text-ink-soft">{LETTER_TWO.signOff}</p>
                  <p className="script mt-1 text-[2.3rem] leading-none text-wine sm:text-[2.6rem]">
                    {LETTER_TWO.signature}
                  </p>
                  <svg viewBox="0 0 160 12" className="mt-1 w-32 text-wine/35" fill="none" aria-hidden>
                    <path d="M2 7C34 2 64 10 96 5C116 2 138 4 158 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </article>

            {/* Confirmation card */}
            {response ? (
              <div className="glass mt-7 rounded-[16px] p-5 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="eyebrow text-[#F3CFC9]/55">saved for us</p>
                    <h2 className="display-sub mt-1 text-[#FDF0E9]">Our Little Date</h2>
                  </div>
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[#F5DAD4]/50">
                    your preferred plan
                  </p>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Detail icon={CalendarDays} label="Selected date" value={formatCalendarDate(response.selectedDate)} />
                  <Detail icon={Clock} label="Selected time" value={formatTimeLabel(response.selectedTime)} />
                  <Detail
                    icon={Heart}
                    label="Our plan"
                    value={activityLabel}
                    secondary={response.customActivity || null}
                  />
                  {response.personalMessage && (
                    <Detail
                      icon={MessageSquare}
                      label="Your message"
                      value={response.personalMessage}
                      multiline
                    />
                  )}

                  {location && (
                    <div className="sm:col-span-2">
                      <div className="flex items-start justify-between gap-3 rounded-[12px] border border-white/12 bg-white/5 p-3.5">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-[#F4D7D1]/80">
                            <MapPin className="h-3.5 w-3.5" strokeWidth={1.6} />
                          </span>
                          <div>
                            <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[#F5DAD4]/50">Shared location</p>
                            <p className="font-display text-[1rem] text-[#FDF0E9]">
                              {location.placeName || 'Your current location'}
                            </p>
                            {location.latitude !== null && location.longitude !== null && (
                              <p className="text-[0.78rem] text-[#F5DAD4]/60">
                                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                                {' · '}
                                {location.source === 'device' ? 'shared from your device' : 'a place you chose'}
                              </p>
                            )}
                            {location.source === 'manual' && location.placeName && (
                              <p className="text-[0.74rem] text-[#F5DAD4]/50">A place you chose.</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeLocation}
                          disabled={removing === 'location'}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-[#F5DAD4]/70 transition hover:bg-white/10 disabled:opacity-50"
                          aria-label="Remove the location you shared"
                        >
                          <Trash2 className="h-3 w-3" strokeWidth={1.6} />
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {voice && (
                    <div className="sm:col-span-2">
                      <div className="flex items-start gap-3 rounded-[12px] border border-white/12 bg-white/5 p-3.5">
                        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-[#F4D7D1]/80">
                          <Mic className="h-3.5 w-3.5" strokeWidth={1.6} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[#F5DAD4]/50">Voice message</p>
                          <p className="font-display text-[1rem] text-[#FDF0E9]">
                            Shared with Yousuf
                            {voice.durationSeconds ? ` · ${formatDuration(voice.durationSeconds)}` : ''}
                          </p>
                          <audio controls src={voice.url} className="mt-2 max-w-full">
                            Your browser does not support audio playback.
                          </audio>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMedia(voice.id)}
                          disabled={removing === voice.id}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-[#F5DAD4]/70 transition hover:bg-white/10 disabled:opacity-50"
                          aria-label="Delete your voice message"
                        >
                          <Trash2 className="h-3 w-3" strokeWidth={1.6} />
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {photos.length > 0 && (
                    <div className="sm:col-span-2">
                      <p className="flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.2em] text-[#F5DAD4]/50">
                        <Camera className="h-3 w-3" strokeWidth={1.6} />
                        Your photos · {photos.length}
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {photos.map((photo, index) => (
                          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-[8px] border border-white/15">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.url}
                              alt={`Photo ${index + 1} you shared`}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeMedia(photo.id)}
                              disabled={removing === photo.id}
                              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white/85 opacity-90 backdrop-blur transition hover:bg-black/70 disabled:opacity-50"
                              aria-label={`Remove photo ${index + 1}`}
                            >
                              <Trash2 className="h-3 w-3" strokeWidth={1.8} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-[0.7rem] text-[#F5DAD4]/45">
                        Only Yousuf can see these. You can remove any of them here.
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-[#3A1620]/60 p-3 text-[0.8rem] leading-relaxed text-[#F7C9C4]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
                    {error}
                  </p>
                )}

                <p className="mt-5 border-t border-white/10 pt-4 text-[0.72rem] leading-relaxed text-[#F5DAD4]/45">
                  This is your preferred plan for us, saved with love — not a booking. We will arrange the rest
                  together.
                </p>
              </div>
            ) : (
              <div className="glass mt-7 rounded-[16px] p-7 text-center">
                <p className="text-[0.95rem] leading-relaxed text-[#F5DAD4]/75">
                  Your plan is saved. If this page was refreshed, it will appear again for you shortly.
                </p>
                <button type="button" onClick={onReview} className="btn btn-ghost-dusk mt-4">
                  Review our date
                </button>
              </div>
            )}

            <div className="mt-12 flex flex-col items-center text-center">
              <Ornament tone="dusk" />
              <p className="script mt-5 text-[1.8rem] leading-snug text-[#FBEAE4] sm:text-[2.2rem]">
                {LETTER_TWO.closing}
              </p>
              <motion.div
                className="mt-4 text-[#E9A9A3]"
                animate={reduce ? undefined : { scale: [1, 1.14, 1, 1.1, 1] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              >
                <Heart className="h-8 w-8" strokeWidth={1} fill="currentColor" />
              </motion.div>
              <p className="mt-2 text-[0.7rem] uppercase tracking-[0.24em] text-[#F5DAD4]/40">
                until then
              </p>

              <div className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button type="button" onClick={onReadLetter} className="btn btn-ghost-dusk w-full sm:w-auto">
                  {LETTER_TWO.readAgain}
                </button>
                <button type="button" onClick={onReview} className="btn btn-primary w-full sm:w-auto">
                  {LETTER_TWO.review}
                  <Heart className="h-3.5 w-3.5" strokeWidth={1.6} fill="currentColor" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  secondary,
  multiline,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  secondary?: string | null;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-[#F4D7D1]/80">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
      </span>
      <div className="min-w-0">
        <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[#F5DAD4]/50">{label}</p>
        <p
          className={
            multiline
              ? 'whitespace-pre-line font-display text-[0.98rem] leading-relaxed text-[#FDF0E9]'
              : 'font-display text-[1rem] leading-snug text-[#FDF0E9]'
          }
        >
          {value}
        </p>
        {secondary && <p className="mt-0.5 text-[0.78rem] leading-snug text-[#F5DAD4]/60">{secondary}</p>}
      </div>
    </div>
  );
}
