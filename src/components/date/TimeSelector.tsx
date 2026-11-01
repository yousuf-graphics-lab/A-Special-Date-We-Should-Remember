'use client';

/**
 * Four presets plus an exact time field. Presets only *suggest* a time — the
 * input stays editable and is the single source of truth for what gets saved.
 */
import { useId } from 'react';
import { Moon, Sun, Sunrise, Sunset, Clock } from 'lucide-react';
import { TIME_PRESETS } from '@/lib/constants';
import { formatTime12h } from '@/lib/datetime';

const PRESET_ICONS = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
} as const;

interface TimeSelectorProps {
  value: string;
  onChange: (time: string) => void;
  describedBy?: string;
}

export function TimeSelector({ value, onChange, describedBy }: TimeSelectorProps): JSX.Element {
  const groupName = useId();
  const inputId = useId();

  return (
    <div className="w-full">
      <fieldset aria-describedby={describedBy}>
        <legend className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
          <Clock size={15} aria-hidden="true" className="text-rose-soft" />
          What time feels right?
        </legend>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {TIME_PRESETS.map((preset) => {
            const Icon = PRESET_ICONS[preset.value];
            const active = value === preset.time;
            return (
              <label
                key={preset.value}
                className={[
                  'group relative flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-center transition',
                  'focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-midnight',
                  active
                    ? 'border-rose/60 bg-gradient-to-br from-rose/20 to-violet/15 text-white shadow-[0_0_24px_-6px_rgba(255,77,141,0.6)]'
                    : 'border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25 hover:text-white',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name={groupName}
                  value={preset.value}
                  checked={active}
                  onChange={() => onChange(preset.time)}
                  className="sr-only"
                />
                <Icon size={18} aria-hidden="true" className={active ? 'text-rose-soft' : ''} />
                <span className="text-[0.8rem] font-medium leading-none">{preset.label}</span>
                <span className="text-[0.62rem] leading-none text-white/40">{preset.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-[190px]">
          <label htmlFor={inputId} className="field-label">
            Or pick an exact time
          </label>
          <input
            id={inputId}
            type="time"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required
            aria-describedby={describedBy}
            className="text-input appearance-none [color-scheme:dark]"
          />
        </div>

        <p className="text-sm text-white/55" aria-live="polite">
          {value ? (
            <>
              You chose{' '}
              <span className="font-medium text-gold">{formatTime12h(value)}</span>
            </>
          ) : (
            'No time picked yet'
          )}
        </p>
      </div>
    </div>
  );
}
