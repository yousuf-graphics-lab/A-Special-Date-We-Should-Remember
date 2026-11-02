'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CalendarDays,
  Camera,
  Check,
  Clock,
  Coffee,
  Compass,
  Footprints,
  Heart,
  Loader2,
  MapPin,
  Sparkles,
  Sunset,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  ACTIVITIES,
  PLANNER_COPY,
  TIME_SLOTS,
  ACTIVITY_LABELS,
  type ActivityId,
} from '@/lib/content';
import { apiPatch, apiPost, uploadFile } from '@/lib/api-client';
import type { PublicDateResponse, PublicMediaItem } from '@/lib/responses';
import { formatCalendarDate, formatTimeLabel, todayInDhaka } from '@/lib/time';
import { Calendar } from './calendar';
import { VoiceRecorder } from './voice-recorder';
import { PhotoUploader, type LocalPhoto } from './photo-uploader';
import { LocationPicker, type LocationDraft } from './location-picker';
import { Ambience } from './ambience';
import { Ornament } from './ornaments';

const ACTIVITY_ICONS: Record<ActivityId, LucideIcon> = {
  coffee: Coffee,
  dinner: UtensilsCrossed,
  walk: Footprints,
  sunset: Sunset,
  surprise: Sparkles,
  elsewhere: Compass,
};

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function sectionLabel(index: string, title: string) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="script text-[1.35rem] leading-none text-rose-deep/60">{index}</span>
      <h2 className="font-display text-[1.12rem] uppercase tracking-[0.2em] text-wine/80">{title}</h2>
      <span className="h-px flex-1 bg-gold/30" aria-hidden />
    </div>
  );
}

export function PlannerScreen({
  token,
  existing,
  onConfirmed,
}: {
  token: string;
  existing: PublicDateResponse | null;
  onConfirmed: (response: PublicDateResponse) => void;
}) {
  const today = useMemo(() => todayInDhaka(), []);

  const [date, setDate] = useState(existing?.selectedDate ?? '');
  const [time, setTime] = useState(existing?.selectedTime ?? '');
  const [timeMode, setTimeMode] = useState<'preset' | 'custom'>(existing?.timeMode ?? 'preset');
  const [activity, setActivity] = useState<ActivityId | ''>((existing?.activity as ActivityId) ?? '');
  const [customActivity, setCustomActivity] = useState(existing?.customActivity ?? '');
  const [message, setMessage] = useState(existing?.personalMessage ?? '');
  const [location, setLocation] = useState<LocationDraft | null>(
    existing?.location
      ? {
          placeName: existing.location.placeName ?? '',
          latitude: existing.location.latitude,
          longitude: existing.location.longitude,
          accuracyMeters: existing.location.accuracyMeters,
          source: existing.location.source,
        }
      : null,
  );

  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [existingMedia, setExistingMedia] = useState<PublicMediaItem[]>(existing?.media ?? []);
  const [pendingVoice, setPendingVoice] = useState<{ path: string; duration: number } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const dateRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<HTMLDivElement>(null);

  const existingVoice = existingMedia.find((item) => item.type === 'voice') ?? null;
  const existingPhotos = existingMedia.filter((item) => item.type === 'photo');
  const totalPhotos = existingPhotos.length + photos.length;

  // Keep local lists in sync if her saved plan changes underneath us.
  useEffect(() => {
    if (!existing) return;
    setExistingMedia(existing.media);
  }, [existing]);

  // Release preview URLs when leaving the screen.
  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPhotos = useCallback(
    (files: File[]) => {
      setPhotoError(null);
      setPhotos((current) => {
        const room = Math.max(0, 5 - existingPhotos.length - current.length);
        if (room === 0) {
          setPhotoError('Five photos is the little limit here.');
          return current;
        }
        const next = [...current];
        for (const file of files) {
          if (next.length >= room + current.length) break;
          if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
            setPhotoError('Please choose a JPEG, PNG or WebP photo.');
            continue;
          }
          if (file.size > MAX_PHOTO_BYTES) {
            setPhotoError('That photo is a little too large (max 8 MB).');
            continue;
          }
          const duplicate = next.some(
            (item) =>
              item.file.name === file.name &&
              item.file.size === file.size &&
              item.file.lastModified === file.lastModified,
          );
          if (duplicate) continue;
          next.push({
            id: `${Date.now()}-${next.length}-${file.name}`,
            file,
            url: URL.createObjectURL(file),
            name: file.name,
          });
        }
        return next.slice(0, room + current.length);
      });
    },
    [existingPhotos.length],
  );

  const removePhoto = useCallback((id: string) => {
    setPhotos((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const replacePhoto = useCallback((id: string, file: File) => {
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError('Please choose a JPEG, PNG or WebP photo.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('That photo is a little too large (max 8 MB).');
      return;
    }
    setPhotoError(null);
    setPhotos((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        URL.revokeObjectURL(item.url);
        return { id: item.id, file, url: URL.createObjectURL(file), name: file.name };
      }),
    );
  }, []);

  const movePhoto = useCallback((id: string, direction: -1 | 1) => {
    setPhotos((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const removeExistingMedia = useCallback(
    async (mediaId: string) => {
      const result = await apiPatch<{ response: PublicDateResponse }>('/api/date-response', {
        token,
        action: 'remove-media',
        mediaId,
      });
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      setExistingMedia(result.data.response.media);
    },
    [token],
  );

  function focusFirst(errorKey: string) {
    const map: Record<string, React.RefObject<HTMLDivElement | null>> = {
      date: dateRef,
      time: timeRef,
      activity: activityRef,
      photos: photosRef,
    };
    map[errorKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function handleConfirm() {
    if (phase !== 'idle') return;

    const nextErrors: Record<string, string> = {};
    if (!date) nextErrors.date = PLANNER_COPY.dateRequired;
    else if (date < today) nextErrors.date = PLANNER_COPY.pastDate;
    if (!time || !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time)) nextErrors.time = PLANNER_COPY.timeRequired;
    if (!activity) nextErrors.activity = PLANNER_COPY.activityRequired;
    if (activity === 'elsewhere' && !customActivity.trim()) {
      nextErrors.activity = PLANNER_COPY.activityCustomRequired;
    }
    if (photos.length > 0 && !photoConsent) {
      nextErrors.photos = 'Please confirm you are happy to share these photos, or remove them first.';
      setPhotoError(nextErrors.photos);
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setSubmitError(null);
      focusFirst(Object.keys(nextErrors)[0]);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setPhase('uploading');

    const media: { path: string; kind: 'photo' | 'voice'; durationSeconds?: number }[] = [];

    try {
      for (const [index, photo] of photos.entries()) {
        setSavedNote(`Sharing photo ${index + 1} of ${photos.length}…`);
        const uploaded = await uploadFile(token, 'photo', photo.file, photo.file.type, photo.file.size);
        if (!uploaded.ok) {
          setPhotoError(uploaded.error);
          setSubmitError(
            `${uploaded.error} Nothing has been confirmed yet — your choices are all still here.`,
          );
          setPhase('idle');
          setSavedNote(null);
          return;
        }
        media.push({ path: uploaded.data.path, kind: 'photo' });
      }

      if (pendingVoice) {
        media.push({ path: pendingVoice.path, kind: 'voice', durationSeconds: pendingVoice.duration });
      }

      setPhase('saving');
      setSavedNote(null);

      const result = await apiPost<{ response: PublicDateResponse }>('/api/date-response', {
        token,
        selectedDate: date,
        selectedTime: time,
        timeMode,
        activity,
        customActivity: customActivity.trim() || null,
        personalMessage: message.trim() || null,
        location: location
          ? {
              placeName: location.placeName.trim() || null,
              latitude: location.latitude,
              longitude: location.longitude,
              accuracyMeters: location.accuracyMeters,
              source: location.source,
            }
          : null,
        media,
      });

      if (!result.ok) {
        setSubmitError(result.error);
        setPhase('idle');
        return;
      }

      onConfirmed(result.data.response);
    } catch {
      setSubmitError(PLANNER_COPY.saveError);
      setPhase('idle');
    }
  }

  const busy = phase !== 'idle';

  return (
    <section className="relative min-h-[100svh] overflow-hidden garden-bg">
      <Ambience tone="garden" hearts={false} />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-14 sm:px-8 sm:py-20">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="eyebrow">{PLANNER_COPY.eyebrow}</p>
          <h1 className="display-title mt-3 text-balance text-wine-deep">{PLANNER_COPY.title}</h1>
          <p className="prose-body mt-4 text-balance">{PLANNER_COPY.sub}</p>
          <Ornament className="mt-6" />
        </motion.header>

        <div className="mt-10 grid gap-7 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="space-y-9">
            <div ref={dateRef}>
              {sectionLabel('i', 'The day')}
              <Calendar
                value={date}
                minDate={today}
                onChange={(iso) => {
                  setDate(iso);
                  setErrors((current) => ({ ...current, date: '' }));
                }}
              />
              {errors.date && (
                <p role="alert" className="mt-2 text-[0.82rem] text-[#8E3F3F]">
                  {errors.date}
                </p>
              )}
            </div>

            <div ref={timeRef}>
              {sectionLabel('ii', 'The hour')}
              <div className="soft-card rounded-[14px] p-4 sm:p-6">
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => {
                        setTime(slot.value);
                        setTimeMode('preset');
                        setErrors((current) => ({ ...current, time: '' }));
                      }}
                      className="chip"
                      data-selected={time === slot.value && timeMode === 'preset'}
                      aria-pressed={time === slot.value && timeMode === 'preset'}
                    >
                      {slot.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setTimeMode('custom');
                      if (!time) setTime('18:00');
                    }}
                    className="chip border-dashed"
                    data-selected={timeMode === 'custom'}
                    aria-pressed={timeMode === 'custom'}
                  >
                    A custom time
                  </button>
                </div>

                {timeMode === 'custom' && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label htmlFor="custom-time" className="text-[0.8rem] text-ink-soft">
                      {PLANNER_COPY.customTimeLabel}
                    </label>
                    <input
                      id="custom-time"
                      type="time"
                      value={time}
                      onChange={(event) => {
                        setTime(event.target.value);
                        setTimeMode('custom');
                        setErrors((current) => ({ ...current, time: '' }));
                      }}
                      className="field w-auto"
                      step={300}
                    />
                  </div>
                )}

                <p className="mt-4 text-[0.78rem] text-ink-soft/65">
                  {time ? `You chose ${formatTimeLabel(time)}.` : 'Morning, afternoon or evening — your call.'}
                </p>
                {errors.time && (
                  <p role="alert" className="mt-2 text-[0.82rem] text-[#8E3F3F]">
                    {errors.time}
                  </p>
                )}
              </div>
            </div>

            <div ref={activityRef}>
              {sectionLabel('iii', 'The feeling')}
              <div className="soft-card rounded-[14px] p-4 sm:p-6">
                <p className="font-display text-[1.1rem] text-wine-deep">{PLANNER_COPY.activityLabel}</p>
                <p className="mt-1 text-[0.8rem] text-ink-soft/65">{PLANNER_COPY.activityHelper}</p>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {ACTIVITIES.map((item) => {
                    const Icon = ACTIVITY_ICONS[item.id];
                    const selected = activity === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActivity(item.id);
                          setErrors((current) => ({ ...current, activity: '' }));
                        }}
                        className={clsx(
                          'group relative flex items-start gap-3 rounded-[12px] border p-3.5 text-left transition-all duration-500',
                          selected
                            ? 'border-wine/45 bg-blush-soft/70 shadow-[0_14px_30px_-24px_rgba(110,42,58,0.6)]'
                            : 'border-wine/12 bg-white/55 hover:border-wine/30 hover:bg-white/80',
                        )}
                        aria-pressed={selected}
                      >
                        <span
                          className={clsx(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition',
                            selected
                              ? 'border-wine/30 bg-wine/90 text-white'
                              : 'border-wine/15 bg-white/70 text-wine/70',
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[0.9rem] leading-snug text-ink">{item.label}</span>
                          <span className="mt-0.5 block text-[0.74rem] leading-snug text-ink-soft/65">{item.note}</span>
                        </span>
                        {selected && (
                          <span className="absolute right-2.5 top-2.5 text-wine">
                            <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {activity && (
                  <div className="mt-4">
                    <label htmlFor="custom-activity" className="block text-[0.66rem] uppercase tracking-[0.2em] text-wine/60">
                      {activity === 'elsewhere' ? 'Where do you have in mind?' : 'Anything more about this plan?'}
                    </label>
                    <input
                      id="custom-activity"
                      type="text"
                      value={customActivity}
                      onChange={(event) => {
                        setCustomActivity(event.target.value.slice(0, 240));
                        setErrors((current) => ({ ...current, activity: '' }));
                      }}
                      maxLength={240}
                      placeholder={
                        activity === 'elsewhere' ? 'a place that means something to us' : 'optional'
                      }
                      className="field mt-1.5"
                    />
                  </div>
                )}

                {errors.activity && (
                  <p role="alert" className="mt-2 text-[0.82rem] text-[#8E3F3F]">
                    {errors.activity}
                  </p>
                )}

                <div className="mt-6 border-t border-gold/25 pt-5">
                  <label htmlFor="personal-message" className="block text-[0.66rem] uppercase tracking-[0.2em] text-wine/60">
                    {PLANNER_COPY.messageLabel}
                  </label>
                  <textarea
                    id="personal-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value.slice(0, 2000))}
                    placeholder={PLANNER_COPY.messagePlaceholder}
                    rows={4}
                    maxLength={2000}
                    className="field mt-1.5 resize-y"
                  />
                  <div className="mt-1 flex items-center justify-between text-[0.7rem] text-ink-soft/55">
                    <span>{PLANNER_COPY.messageHelper}</span>
                    <span className="tabular-nums">{message.length}/2000</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              {sectionLabel('iv', 'A little extra, if you like')}
              <div className="space-y-5">
                <VoiceRecorder
                  token={token}
                  pendingPath={pendingVoice?.path ?? null}
                  existing={existingVoice}
                  onPendingChange={(media) => setPendingVoice(media)}
                  onRemoveExisting={removeExistingMedia}
                />

                <div ref={photosRef}>
                  <PhotoUploader
                    items={photos}
                    existing={existingPhotos}
                    error={photoError}
                    consent={photoConsent}
                    busy={busy}
                    onConsentChange={(value) => {
                      setPhotoConsent(value);
                      if (value) setPhotoError(null);
                    }}
                    onAdd={addPhotos}
                    onRemove={removePhoto}
                    onReplace={replacePhoto}
                    onMove={movePhoto}
                    onRemoveExisting={removeExistingMedia}
                  />
                  {errors.photos && !photoError && (
                    <p role="alert" className="mt-2 text-[0.82rem] text-[#8E3F3F]">
                      {errors.photos}
                    </p>
                  )}
                </div>

                <LocationPicker value={location} onChange={setLocation} disabled={busy} />
              </div>
            </div>
          </div>

          {/* Appointment summary */}
          <aside className="lg:sticky lg:top-20">
            <div className="paper relative rounded-[10px] p-5 sm:p-6">
              <div className="pointer-events-none absolute inset-[8px] rounded-[4px] border border-gold/25" aria-hidden />
              <div className="relative">
                <p className="eyebrow text-[0.56rem] text-wine/50">our little appointment</p>
                <h2 className="display-sub mt-1 text-wine-deep">Our Little Date</h2>

                <div className="mt-4 space-y-3.5">
                  <SummaryRow
                    icon={CalendarDays}
                    label="Day"
                    value={date ? formatCalendarDate(date) : null}
                  />
                  <SummaryRow
                    icon={Clock}
                    label="Time"
                    value={time ? formatTimeLabel(time) : null}
                  />
                  <SummaryRow
                    icon={activity ? ACTIVITY_ICONS[activity] : Heart}
                    label="Our plan"
                    value={activity ? ACTIVITY_LABELS[activity] : null}
                    secondary={activity === 'elsewhere' ? customActivity || null : customActivity || null}
                  />
                  {(location?.placeName || location?.latitude) && (
                    <SummaryRow
                      icon={MapPin}
                      label="Where"
                      value={location?.placeName || 'Your shared location'}
                      secondary={
                        location?.latitude && location?.longitude
                          ? `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`
                          : null
                      }
                    />
                  )}
                  {(totalPhotos > 0 || pendingVoice) && (
                    <SummaryRow
                      icon={Camera}
                      label="Little extras"
                      value={[
                        totalPhotos > 0 ? `${totalPhotos} photo${totalPhotos > 1 ? 's' : ''}` : null,
                        pendingVoice ? 'a voice message' : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    />
                  )}
                </div>

                {!date && !time && (
                  <p className="mt-4 text-[0.8rem] leading-relaxed text-ink-soft/60">{PLANNER_COPY.summaryEmpty}</p>
                )}

                <div className="my-5 h-px bg-gold/30" aria-hidden />

                <p className="text-[0.72rem] leading-relaxed text-ink-soft/60">{PLANNER_COPY.savedNote}</p>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={busy}
                  className="btn btn-primary mt-5 w-full text-[0.78rem]"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
                      {phase === 'uploading' ? savedNote ?? 'Sharing…' : PLANNER_COPY.confirming}
                    </>
                  ) : (
                    <>
                      <Heart className="h-3.5 w-3.5" strokeWidth={1.6} fill="currentColor" />
                      {PLANNER_COPY.confirm}
                    </>
                  )}
                </button>

                {submitError && (
                  <div role="alert" className="mt-3 flex items-start gap-2 rounded-[10px] bg-[#FBEDEA] p-3 text-[0.8rem] leading-relaxed text-[#8E3F3F]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
                    <span>{submitError}</span>
                  </div>
                )}
                {!submitError && Object.values(errors).some(Boolean) && (
                  <p role="alert" className="mt-3 text-[0.8rem] leading-relaxed text-[#8E3F3F]">
                    A few little things are still missing above.
                  </p>
                )}
              </div>
            </div>

            <p className="mt-4 px-1 text-center text-[0.7rem] leading-relaxed text-ink-soft/55">
              Everything here is kept private. Only Yousuf can see it.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  secondary,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  secondary?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-wine/12 bg-white/60 text-wine/60">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
      </span>
      <div className="min-w-0">
        <p className="text-[0.58rem] uppercase tracking-[0.2em] text-ink-soft/50">{label}</p>
        <p className={clsx('font-display text-[0.98rem] leading-snug', value ? 'text-ink' : 'text-ink-soft/45')}>
          {value ?? 'Not chosen yet'}
        </p>
        {secondary && <p className="mt-0.5 text-[0.76rem] leading-snug text-ink-soft/65">{secondary}</p>}
      </div>
    </div>
  );
}
