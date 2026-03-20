import { useEffect, useRef, useState } from "react";

export type SlotDigit = {
  char: string;
  offset: number;
};

type SlotRollOptions = {
  duration?: number;
  decimals?: number;
  formatted?: boolean;
};

function formatNumber(
  value: number,
  decimals: number,
  formatted: boolean,
): string {
  if (formatted) {
    return decimals > 0
      ? value.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : value.toLocaleString("en-US");
  }
  return decimals > 0 ? value.toFixed(decimals) : String(value);
}

export function useSlotRoll(
  target: number,
  options?: SlotRollOptions,
): SlotDigit[] {
  const {
    duration = 800,
    decimals = 0,
    formatted = false,
  } = options ?? {};

  const chars = formatNumber(target, decimals, formatted).split("");
  const digitCount = chars.filter((c) => /\d/.test(c)).length;
  const staggerMs =
    digitCount > 0 ? Math.min(50, duration / (digitCount * 2)) : 0;

  const reducedMotion =
    target === 0 ||
    (typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const [offsets, setOffsets] = useState<number[]>(() =>
    chars.map((c) => {
      if (reducedMotion || !/\d/.test(c)) return 0;
      return 100;
    }),
  );

  useEffect(() => {
    if (reducedMotion) return;

    // Reset offsets to 100 for digits (handles StrictMode remount)
    setOffsets(chars.map((c) => (!/\d/.test(c) ? 0 : 100)));

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const rafs: number[] = [];
    let digitIdx = 0;

    for (let i = 0; i < chars.length; i++) {
      if (!/\d/.test(chars[i]!)) continue;
      const idx = i;
      const delay = digitIdx * staggerMs;
      digitIdx++;

      const timer = setTimeout(() => {
        const start = performance.now();
        function tick() {
          if (cancelled) return;
          const elapsed = performance.now() - start;
          const t = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const offset = 100 * (1 - eased);
          setOffsets((prev) => {
            const next = [...prev];
            next[idx] = offset;
            return next;
          });
          if (t < 1) {
            rafs.push(requestAnimationFrame(tick));
          }
        }
        rafs.push(requestAnimationFrame(tick));
      }, delay);
      timers.push(timer);
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      rafs.forEach(cancelAnimationFrame);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- animate once on mount

  return chars.map((char, i) => ({
    char,
    offset: offsets[i] ?? 0,
  }));
}
