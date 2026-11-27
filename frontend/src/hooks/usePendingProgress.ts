"use client";

import { useEffect, useRef, useState } from "react";

export const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

const DURATION_MS = 350;

export function usePendingProgress(includePending: boolean) {
  const target = includePending ? 1 : 0;
  const linearRef = useRef(target);
  const [linear, setLinear] = useState(target);

  useEffect(() => {
    if (linearRef.current === target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      linearRef.current = target;
      setLinear(target);
      return;
    }
    let frame = 0;
    let last: number | null = null;
    const step = (now: number) => {
      const dt = last === null ? 16 : Math.min(now - last, 64);
      last = now;
      const next =
        linearRef.current + ((target === 1 ? 1 : -1) * dt) / DURATION_MS;
      const done = target === 1 ? next >= 1 : next <= 0;
      linearRef.current = done ? target : next;
      setLinear(linearRef.current);
      if (!done) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return easeInOutCubic(linear);
}
