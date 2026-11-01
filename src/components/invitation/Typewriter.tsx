'use client';

/**
 * A gentle typewriter. Screen readers get the finished sentence immediately —
 * the animated characters are hidden from them, so nothing is read letter by
 * letter. Reduced-motion visitors skip straight to the full text.
 */
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface TypewriterProps {
  text: string;
  className?: string;
  speed?: number;
  startDelay?: number;
  onComplete?: () => void;
  showCaret?: boolean;
}

export function Typewriter({
  text,
  className,
  speed = 78,
  startDelay = 320,
  onComplete,
  showCaret = true,
}: TypewriterProps): JSX.Element {
  const reducedMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(reducedMotion ? text.length : 0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      setVisibleCount(text.length);
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      return;
    }

    setVisibleCount(0);
    completedRef.current = false;
    let index = 0;
    let timer: number | undefined;

    const startTimer = window.setTimeout(function tick() {
      index += 1;
      setVisibleCount(index);
      if (index >= text.length) {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
        return;
      }
      // Slight rhythm variation keeps it feeling hand-written.
      const jitter = index % 5 === 0 ? 90 : 0;
      timer = window.setTimeout(tick, speed + jitter);
    }, startDelay);

    return () => {
      window.clearTimeout(startTimer);
      if (timer) window.clearTimeout(timer);
    };
    // `onComplete` is intentionally excluded: it is a fire-once callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, startDelay, reducedMotion]);

  const isDone = visibleCount >= text.length;

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, visibleCount)}
        {showCaret && !isDone && (
          <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-rose align-middle" style={{ height: '0.9em' }} />
        )}
      </span>
    </span>
  );
}
