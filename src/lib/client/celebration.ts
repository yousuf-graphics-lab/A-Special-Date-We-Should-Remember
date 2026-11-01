/**
 * Lazily-loaded celebration effects. `canvas-confetti` never enters the initial
 * bundle: it is imported the moment Samiya actually says yes.
 */

type ConfettiFunction = typeof import('canvas-confetti');
type ConfettiOptions = NonNullable<Parameters<ConfettiFunction>[0]>;
type ConfettiShape = NonNullable<ConfettiOptions['shapes']>[number];

/**
 * `canvas-confetti` is CommonJS (`export =`), so the runtime module object is
 * `{ default: fn, shapeFromText, shapeFromPath, … }` while TypeScript sees only
 * the callable. This interface describes what we actually receive.
 */
interface ConfettiModule {
  default: ConfettiFunction;
  shapeFromText?: (options: { text: string; scalar?: number }) => ConfettiShape;
}

let confettiPromise: Promise<ConfettiModule> | null = null;

function loadConfetti(): Promise<ConfettiModule> {
  if (!confettiPromise) {
    confettiPromise = import('canvas-confetti').then(
      (module) => module as unknown as ConfettiModule,
    );
  }
  return confettiPromise;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * A single, elegant burst: rose and gold hearts from the centre, with two side
 * streams. Short-lived (the canvas removes itself) and skipped entirely for
 * visitors who prefer reduced motion.
 */
export async function celebrateYes(): Promise<void> {
  if (typeof window === 'undefined' || prefersReducedMotion()) return;

  try {
    const confettiModule = await loadConfetti();
    const confetti = confettiModule.default;

    const heart = confettiModule.shapeFromText?.({ text: '❤', scalar: 2.2 });
    const shapes: ConfettiOptions['shapes'] = heart ? [heart, 'circle'] : ['circle'];

    const shared: ConfettiOptions = {
      colors: ['#FF4D8D', '#FFD9A0', '#A855F7', '#FFB6CE'],
      shapes,
      scalar: 1.1,
      zIndex: 70,
      disableForReducedMotion: true,
    };

    void confetti({
      ...shared,
      particleCount: 70,
      spread: 82,
      startVelocity: 42,
      origin: { x: 0.5, y: 0.66 },
      gravity: 0.9,
      drift: 0.2,
      ticks: 220,
    });

    window.setTimeout(() => {
      void confetti({
        ...shared,
        particleCount: 26,
        spread: 60,
        angle: 60,
        startVelocity: 38,
        origin: { x: 0, y: 0.85 },
        ticks: 180,
      });
      void confetti({
        ...shared,
        particleCount: 26,
        spread: 60,
        angle: 120,
        startVelocity: 38,
        origin: { x: 1, y: 0.85 },
        ticks: 180,
      });
    }, 180);
  } catch {
    /* confetti is decoration; a failure must never block the flow */
  }
}

/** A quieter puff used when the date is sealed. */
export async function celebrateSealed(): Promise<void> {
  if (typeof window === 'undefined' || prefersReducedMotion()) return;
  try {
    const confettiModule = await loadConfetti();
    void confettiModule.default({
      particleCount: 40,
      spread: 70,
      startVelocity: 28,
      origin: { x: 0.5, y: 0.55 },
      colors: ['#FFD9A0', '#FF4D8D', '#A855F7'],
      ticks: 160,
      zIndex: 70,
      disableForReducedMotion: true,
    });
  } catch {
    /* noop */
  }
}
