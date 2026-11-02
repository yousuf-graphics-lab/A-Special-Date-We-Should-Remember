'use client';

import { useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ImagePlus, Lock, Plus, Trash2, Upload } from 'lucide-react';
import { OPTIONAL_COPY } from '@/lib/content';
import type { PublicMediaItem } from '@/lib/responses';

export type LocalPhoto = {
  id: string;
  file: File;
  url: string;
  name: string;
};

const MAX_PHOTOS = 5;

export function PhotoUploader({
  items,
  existing,
  error,
  consent,
  busy,
  onConsentChange,
  onAdd,
  onRemove,
  onReplace,
  onMove,
  onRemoveExisting,
}: {
  items: LocalPhoto[];
  existing: PublicMediaItem[];
  error?: string | null;
  consent: boolean;
  busy: boolean;
  onConsentChange: (value: boolean) => void;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onReplace: (id: string, file: File) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemoveExisting: (mediaId: string) => Promise<void>;
}) {
  const copy = OPTIONAL_COPY.photos;
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const total = items.length + existing.length;
  const remaining = Math.max(0, MAX_PHOTOS - total);
  const consentId = useId();

  return (
    <section aria-labelledby="photos-heading" className="soft-card rounded-[16px] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-[0.58rem] text-rose-deep/70">{copy.eyebrow}</p>
          <h3 id="photos-heading" className="display-sub mt-1.5 text-wine-deep">
            {copy.title}
          </h3>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-wine/12 bg-white/60 text-wine/70">
          <ImagePlus className="h-4 w-4" strokeWidth={1.5} />
        </span>
      </div>

      <p className="prose-body mt-3 text-[0.9rem] leading-[1.8]">{copy.body}</p>
      <p className="mt-2 flex items-start gap-1.5 text-[0.78rem] leading-relaxed text-ink-soft/70">
        <Lock className="mt-[3px] h-3 w-3 shrink-0" strokeWidth={1.6} />
        {copy.privacy}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="font-display text-[1rem] italic text-wine/80" aria-live="polite">
          {total} of 5 photos selected
        </p>
        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-ink-soft/50">
          {total === 0 ? 'none yet' : remaining > 0 ? `${remaining} space left` : 'that is all five'}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {existing.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative aspect-[4/5] overflow-hidden rounded-[12px] border border-gold/30 bg-white/50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={`Shared photo ${index + 1}`} className="h-full w-full object-cover" />
            <span className="absolute left-2 top-2 rounded-full bg-wine/80 px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.16em] text-white/90">
              shared
            </span>
            <button
              type="button"
              onClick={() => onRemoveExisting(photo.id)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-wine shadow transition hover:bg-white"
              aria-label={`Remove shared photo ${index + 1}`}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
            </button>
          </div>
        ))}

        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="group relative aspect-[4/5] overflow-hidden rounded-[12px] border border-gold/30 bg-white/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.name || `Your photo ${index + 1}`} className="h-full w-full object-cover" />
              <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.16em] text-wine/80">
                {index + 1}
              </span>

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/55 to-transparent p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onMove(item.id, -1)}
                    disabled={index === 0}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-wine disabled:opacity-40"
                    aria-label={copy.moveLeft}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(item.id, 1)}
                    disabled={index === items.length - 1}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-wine disabled:opacity-40"
                    aria-label={copy.moveRight}
                  >
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => replaceInputs.current[item.id]?.click()}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-wine"
                    aria-label={`${copy.replace}: ${item.name}`}
                  >
                    <Upload className="h-3 w-3" strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-wine"
                    aria-label={`${copy.remove}: ${item.name}`}
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={1.8} />
                  </button>
                </div>
              </div>

              <input
                ref={(element) => {
                  replaceInputs.current[item.id] = element;
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onReplace(item.id, file);
                  event.target.value = '';
                }}
              />
            </motion.div>
          ))}

          {items.length + existing.length < MAX_PHOTOS && (
            <button
              key="add"
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="group flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-rose-deep/35 bg-white/40 px-2 text-center transition hover:border-wine/50 hover:bg-white/70 disabled:opacity-50"
              aria-label={copy.add}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-deep/30 text-wine/70 transition group-hover:scale-105">
                <Plus className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <span className="text-[0.7rem] leading-snug text-ink-soft/70">{copy.add}</span>
            </button>
          )}
        </AnimatePresence>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) onAdd(files);
          event.target.value = '';
        }}
      />

      {items.length > 0 && (
        <div className="mt-4 rounded-[12px] border border-gold/30 bg-white/55 p-3.5">
          <label htmlFor={consentId} className="flex cursor-pointer items-start gap-3">
            <input
              id={consentId}
              type="checkbox"
              checked={consent}
              onChange={(event) => onConsentChange(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#B66279]"
            />
            <span className="text-[0.82rem] leading-relaxed text-ink-soft">
              I&apos;m happy to share these photos with Yousuf. They will be private and visible only in his
              admin panel.
            </span>
          </label>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[0.82rem] text-[#8E3F3F]">
          {error}
        </p>
      )}

      {total === 0 && <p className="mt-4 text-[0.78rem] leading-relaxed text-ink-soft/60">{copy.emptyHint}</p>}
      <p className="mt-3 text-[0.72rem] uppercase tracking-[0.16em] text-ink-soft/50">{copy.skip}</p>
    </section>
  );
}
