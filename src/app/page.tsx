/**
 * The public page. Rendered on the server so a returning visitor's countdown is
 * already in the first HTML response — no flash, no extra request.
 */
import { Atmosphere } from '@/components/atmosphere/Atmosphere';
import { HeartTrail } from '@/components/atmosphere/HeartTrail';
import { Experience } from '@/components/experience/Experience';
import { getCurrentSelection } from '@/lib/server/session';
import type { PublicSelection } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage(): Promise<JSX.Element> {
  let selection: PublicSelection | null = null;

  try {
    selection = await getCurrentSelection();
  } catch (error) {
    // Missing/invalid environment configuration should never show a stack trace
    // to Samiya. Development gets a clear hint in the server log instead.
    console.error(
      '[page] could not read the visitor session:',
      (error as Error).message,
      '\n        Check .env.local against .env.example.',
    );
  }

  return (
    <>
      <Atmosphere />
      <HeartTrail />
      <Experience
        initialSelection={selection}
        musicUrl={process.env.NEXT_PUBLIC_MUSIC_URL ?? ''}
      />
    </>
  );
}
