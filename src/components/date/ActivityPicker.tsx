'use client';

/**
 * Single-select activity picker built on native radio inputs: arrow keys,
 * screen readers and touch all behave exactly as expected, while the styling is
 * entirely custom.
 */
import { useId } from 'react';
import {
  CarFront,
  Coffee,
  Film,
  Flower2,
  IceCream,
  Sparkles,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { ACTIVITIES, type ActivityValue } from '@/lib/constants';

const ACTIVITY_ICONS: Record<ActivityValue, LucideIcon> = {
  Dinner: UtensilsCrossed,
  'Coffee and a long conversation': Coffee,
  'Movie night': Film,
  'A long drive': CarFront,
  'A beach visit or evening walk': Waves,
  'Ice cream together': IceCream,
  'A surprise date': Sparkles,
};

interface ActivityPickerProps {
  value: ActivityValue | '';
  onChange: (activity: ActivityValue) => void;
  describedBy?: string;
}

export function ActivityPicker({ value, onChange, describedBy }: ActivityPickerProps): JSX.Element {
  const groupName = useId();

  return (
    <fieldset aria-describedby={describedBy}>
      <legend className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
        <Flower2 size={15} aria-hidden="true" className="text-rose-soft" />
        And what shall we do?
      </legend>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {ACTIVITIES.map((activity) => {
          const Icon = ACTIVITY_ICONS[activity.value];
          const active = value === activity.value;

          return (
            <label
              key={activity.value}
              className={[
                'group relative flex cursor-pointer flex-col gap-1.5 rounded-2xl border p-3 text-left transition duration-200',
                'focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-midnight',
                active
                  ? 'border-rose/60 bg-gradient-to-br from-rose/22 via-rose/10 to-violet/15 shadow-[0_0_26px_-8px_rgba(255,77,141,0.75)]'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.055]',
              ].join(' ')}
            >
              <input
                type="radio"
                name={groupName}
                value={activity.value}
                checked={active}
                onChange={() => onChange(activity.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                  active
                    ? 'border-rose/40 bg-rose/15 text-rose-soft'
                    : 'border-white/10 bg-white/[0.04] text-white/55 group-hover:text-white/80'
                }`}
              >
                <Icon size={16} strokeWidth={1.6} />
              </span>
              <span className="text-[0.82rem] font-medium leading-tight text-white/90">
                {activity.label}
              </span>
              <span className="text-[0.66rem] leading-tight text-white/40">{activity.blurb}</span>
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-rose shadow-[0_0_10px_rgba(255,77,141,0.9)]"
                />
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
