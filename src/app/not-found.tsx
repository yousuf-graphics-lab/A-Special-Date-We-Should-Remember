import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function NotFound(): JSX.Element {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <Heart size={26} className="mb-5 text-rose/70" aria-hidden="true" />
      <h1 className="font-display text-3xl text-white">This page went quiet.</h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/45">
        There is nothing here. Whatever you were looking for, it is not on this page.
      </p>
      <Link
        href="/"
        className="btn-ghost mt-7 px-6 py-2.5 text-sm"
      >
        Back to the letter
      </Link>
    </main>
  );
}
