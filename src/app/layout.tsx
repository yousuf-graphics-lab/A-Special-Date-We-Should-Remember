import type { Metadata, Viewport } from 'next';
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/300-italic.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/great-vibes/400.css';
import '@fontsource/caveat/400.css';
import '@fontsource/caveat/600.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'For Samiya',
  description: 'A little world made only for you.',
  robots: { index: false, follow: false, nocache: true },
  appleWebApp: { capable: true, title: 'For Samiya', statusBarStyle: 'default' },
  openGraph: {
    title: 'For Samiya',
    description: 'Someone has a little surprise for you.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#FCF8F3',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="noise-overlay" aria-hidden />
      </body>
    </html>
  );
}
