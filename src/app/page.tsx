import { Experience } from '@/components/experience/experience';
import { SITE } from '@/lib/content';

export default function HomePage() {
  return (
    <>
      <Experience />
      <noscript>
        <div
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            fontFamily: 'Georgia, serif',
            color: '#6E2A3A',
            lineHeight: 1.8,
          }}
        >
          <p style={{ fontSize: '1.4rem' }}>Hey, My Samiya</p>
          <p>This little world needs JavaScript switched on to open — it is worth it, I promise.</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>— for {SITE.herName}, from {SITE.hisName}</p>
        </div>
      </noscript>
    </>
  );
}
