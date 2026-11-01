import type { Metadata, Viewport } from 'next';
import './globals.css';

function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  try {
    return new URL(raw).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'For Samiya',
    template: '%s · For Samiya',
  },
  description:
    'A letter, a question, and a countdown — something small and sincere, made only for you.',
  applicationName: 'For Samiya',
  authors: [{ name: 'For Samiya' }],
  keywords: ['for samiya', 'a letter', 'a date'],
  openGraph: {
    type: 'website',
    siteName: 'For Samiya',
    title: 'For Samiya',
    description: 'A letter, a question, and a countdown — made only for you.',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Samiya',
    description: 'A letter, a question, and a countdown — made only for you.',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: ['/icon.svg'],
  },
  robots: {
    index: true,
    follow: false,
    googleBot: { index: true, follow: false },
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: '#0B0713',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="relative bg-midnight font-body text-white antialiased">
        <a
          href="#main"
          className="sr-only-focusable absolute left-4 top-4 z-[100] rounded-full bg-rose px-4 py-2 text-sm font-medium text-white"
        >
          Skip to the letter
        </a>
        <div id="main">{children}</div>
      </body>
    </html>
  );
}
