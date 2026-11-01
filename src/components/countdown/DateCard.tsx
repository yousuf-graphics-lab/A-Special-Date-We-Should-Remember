'use client';

/**
 * The shareable date card. It is rendered off-screen (never visible in the
 * layout) and rasterised by html-to-image on demand, so it costs nothing until
 * Samiya presses the button.
 *
 * Sizes are fixed in pixels on purpose: the exported PNG must look identical on
 * a phone and a desktop, independent of the page's responsive classes.
 */
import { forwardRef } from 'react';
import { activityLabel } from '@/lib/constants';
import { formatLongDate, formatTime12h } from '@/lib/datetime';

interface DateCardProps {
  dateISO: string;
  time: string;
  activity: string;
  countdownLine: string;
}

export const DateCard = forwardRef<HTMLDivElement, DateCardProps>(function DateCard(
  { dateISO, time, activity, countdownLine },
  ref,
) {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', top: 0, left: '-10000px', pointerEvents: 'none', zIndex: -1 }}
    >
      <div
        ref={ref}
        style={{
          width: 440,
          height: 620,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 28,
          background:
            'radial-gradient(120% 90% at 50% -10%, #241339 0%, #0B0713 58%, #070410 100%)',
          color: '#F4EEFB',
          fontFamily: "'Inter Variable', system-ui, sans-serif",
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 36,
          boxSizing: 'border-box',
        }}
      >
        {/* Aurora accents */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: -80,
            width: 340,
            height: 340,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.42), rgba(168,85,247,0) 66%)',
            filter: 'blur(20px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -140,
            right: -90,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,77,141,0.34), rgba(255,77,141,0) 68%)',
            filter: 'blur(20px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 120,
            left: -60,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,217,160,0.18), rgba(255,217,160,0) 70%)',
            filter: 'blur(24px)',
          }}
        />

        <div style={{ position: 'relative' }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
              color: 'rgba(255,217,160,0.85)',
            }}
          >
            For Samiya
          </p>
          <p
            style={{
              margin: '14px 0 0',
              fontFamily: "'Playfair Display Variable', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 30,
              lineHeight: 1.15,
              color: '#FFFFFF',
            }}
          >
            Our date
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <div
            style={{
              height: 1,
              width: '100%',
              marginBottom: 26,
              background:
                'linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.22), rgba(255,255,255,0))',
            }}
          />
          <p
            style={{
              margin: 0,
              fontFamily: "'Playfair Display Variable', Georgia, serif",
              fontSize: 34,
              lineHeight: 1.2,
              color: '#FFFFFF',
            }}
          >
            {formatLongDate(dateISO)}
          </p>
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 22,
              fontWeight: 500,
              color: '#FFD9A0',
              letterSpacing: '0.01em',
            }}
          >
            {formatTime12h(time)}
          </p>
          <p
            style={{
              margin: '18px 0 0',
              display: 'inline-block',
              padding: '9px 16px',
              borderRadius: 999,
              fontSize: 14,
              color: '#FFFFFF',
              background: 'linear-gradient(100deg, rgba(255,77,141,0.32), rgba(168,85,247,0.28))',
              border: '1px solid rgba(255,255,255,0.16)',
            }}
          >
            {activityLabel(activity)}
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.42)',
            }}
          >
            {countdownLine}
          </p>
          <p
            style={{
              margin: '14px 0 0',
              fontFamily: "'Playfair Display Variable', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 22,
              color: '#FF9DBF',
            }}
          >
            I&rsquo;ll be there. Will you?
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            ♥ sealed in the vault
          </p>
        </div>
      </div>
    </div>
  );
});
