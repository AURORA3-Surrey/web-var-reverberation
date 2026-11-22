import { useEffect, useRef, useState } from 'react';

// The milliseconds a glide takes.
const DURATION = 500;

// Slow at both ends and quick between them.
const eased = t => t * t * (3 - 2 * t);

// `target`, reached by gliding: when it becomes another value, what this gives
// passes through the values in between for DURATION milliseconds.
// `between(from, to, t)` is the value part of the way from one to the other, t
// running from 0 to 1. A change that comes in mid-glide starts from where the
// glide has got to. Readers who ask their system for less motion get the new
// value at once.
export default function useGlide(target, between) {
  const [shown, setShown] = useState(target);
  const latest = useRef(shown);
  latest.current = shown;

  useEffect(() => {
    const from = latest.current;
    if (from === target) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(target);
      return;
    }
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - start) / DURATION);
      setShown(t < 1 ? between(from, target, eased(t)) : target);
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, between]);

  return shown;
}
