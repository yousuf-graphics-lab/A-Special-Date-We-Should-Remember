'use client';

/**
 * Friendly boundary for unexpected failures. No stack traces, no internals —
 * just a way back.
 */
import { RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl text-white">Something slipped.</h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/45">
        The page could not finish loading. Nothing was lost — try again.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-7 px-6 py-2.5 text-sm">
        <RefreshCw size={15} aria-hidden="true" /> Try again
      </button>
    </main>
  );
}
