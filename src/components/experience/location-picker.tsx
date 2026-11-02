'use client';

import { useState } from 'react';
import { MapPin, Navigation, ShieldCheck, X } from 'lucide-react';
import { OPTIONAL_COPY } from '@/lib/content';

export type LocationDraft = {
  placeName: string;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  source: 'manual' | 'device';
};

type GeoState = 'idle' | 'requesting' | 'ready' | 'denied' | 'error';

export function LocationPicker({
  value,
  onChange,
  disabled,
}: {
  value: LocationDraft | null;
  onChange: (value: LocationDraft | null) => void;
  disabled?: boolean;
}) {
  const copy = OPTIONAL_COPY.location;
  const [geoState, setGeoState] = useState<GeoState>('idle');
  const [geoError, setGeoError] = useState<string | null>(null);

  const placeName = value?.placeName ?? '';
  const hasCoords = typeof value?.latitude === 'number' && typeof value?.longitude === 'number';

  function update(patch: Partial<LocationDraft>) {
    const next: LocationDraft = {
      placeName: value?.placeName ?? '',
      latitude: value?.latitude ?? null,
      longitude: value?.longitude ?? null,
      accuracyMeters: value?.accuracyMeters ?? null,
      source: value?.source ?? 'manual',
      ...patch,
    };
    const hasValue = Boolean(next.placeName.trim()) || (next.latitude !== null && next.longitude !== null);
    onChange(hasValue ? next : null);
  }

  function requestLocation() {
    setGeoError(null);
    if (!('geolocation' in navigator)) {
      setGeoState('error');
      setGeoError(copy.error);
      return;
    }
    setGeoState('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState('ready');
        update({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracyMeters: position.coords.accuracy ? Math.round(position.coords.accuracy) : null,
          source: 'device',
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoState('denied');
          setGeoError(copy.denied);
        } else {
          setGeoState('error');
          setGeoError(copy.error);
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 0 },
    );
  }

  return (
    <section aria-labelledby="location-heading" className="soft-card rounded-[16px] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-[0.58rem] text-rose-deep/70">{copy.eyebrow}</p>
          <h3 id="location-heading" className="display-sub mt-1.5 text-wine-deep">
            {copy.title}
          </h3>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-wine/12 bg-white/60 text-wine/70">
          <MapPin className="h-4 w-4" strokeWidth={1.5} />
        </span>
      </div>

      <p className="prose-body mt-3 text-[0.9rem] leading-[1.8]">{copy.body}</p>

      <label htmlFor="place-name" className="mt-5 block text-[0.66rem] uppercase tracking-[0.2em] text-wine/60">
        {copy.placeLabel}
      </label>
      <input
        id="place-name"
        type="text"
        value={placeName}
        onChange={(event) => update({ placeName: event.target.value.slice(0, 200), source: hasCoords ? 'device' : 'manual' })}
        placeholder={copy.placePlaceholder}
        maxLength={200}
        disabled={disabled}
        className="field mt-1.5"
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={requestLocation}
          disabled={disabled || geoState === 'requesting'}
          className="btn btn-ghost px-4 py-2.5 text-[0.7rem]"
        >
          <Navigation className="h-3.5 w-3.5" strokeWidth={1.6} />
          {geoState === 'requesting' ? copy.sharing : hasCoords ? 'Location captured' : copy.share}
        </button>
        {hasCoords && (
          <button
            type="button"
            onClick={() => {
              setGeoState('idle');
              update({ latitude: null, longitude: null, accuracyMeters: null, source: 'manual' });
            }}
            className="inline-flex items-center gap-1 text-[0.72rem] uppercase tracking-[0.16em] text-wine/60 transition hover:text-wine"
          >
            <X className="h-3 w-3" strokeWidth={1.8} />
            {copy.clear}
          </button>
        )}
      </div>

      {hasCoords && value && (
        <div className="mt-4 rounded-[12px] border border-gold/30 bg-white/55 p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#4F6547]">{copy.shared}</p>
          <p className="mt-1 font-display text-[1rem] text-ink">
            {value.latitude?.toFixed(4)}, {value.longitude?.toFixed(4)}
          </p>
          {value.accuracyMeters ? (
            <p className="text-[0.76rem] text-ink-soft/65">Accurate to about {value.accuracyMeters} m</p>
          ) : null}
          <p className="mt-1 text-[0.74rem] text-ink-soft/70">{copy.deviceNote}</p>
          <a
            href={`https://www.google.com/maps?q=${value.latitude},${value.longitude}`}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 inline-block text-[0.72rem] uppercase tracking-[0.16em] text-wine/70 underline decoration-gold/50 underline-offset-4 transition hover:text-wine"
          >
            Check on a map
          </a>
        </div>
      )}

      {geoError && (
        <p role="status" className="mt-3 text-[0.8rem] leading-relaxed text-ink-soft">
          {geoError}
        </p>
      )}

      {!hasCoords && placeName.trim() && (
        <p className="mt-3 text-[0.76rem] text-ink-soft/65">{copy.manualNote}</p>
      )}

      <p className="mt-4 flex items-start gap-1.5 text-[0.77rem] leading-relaxed text-ink-soft/65">
        <ShieldCheck className="mt-[3px] h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
        {copy.privacy}
      </p>
      <p className="mt-2 text-[0.72rem] uppercase tracking-[0.16em] text-ink-soft/50">{copy.skip}</p>
    </section>
  );
}
