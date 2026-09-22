import { useLayoutEffect, useRef, useState, useCallback } from 'react';

/** Measures a board container and returns a square tile size that makes the
 *  whole board (rows × cols, with `gap` between tiles) fit exactly inside it —
 *  so the board never needs an internal scroll container. Mirrors how
 *  wordle.global sizes its grid to the viewport. */
export function useBoardFit(
  rows: number,
  cols: number,
  gap = 6,
  min = 28,
  max = 72,
  reserve = 0
) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number | null>(null);

  const recompute = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { clientWidth: w, clientHeight: h } = el;
    if (w <= 0 || h <= 0) return;
    const availH = h - reserve;
    if (availH <= 0) return;
    const byWidth = (w - gap * (cols - 1)) / cols;
    const byHeight = (availH - gap * (rows - 1)) / rows;
    const fit = Math.floor(Math.min(byWidth, byHeight));
    setSize(Math.max(min, Math.min(max, fit)));
  }, [rows, cols, gap, min, max, reserve]);

  useLayoutEffect(() => {
    recompute();
    if (typeof ResizeObserver === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [recompute]);

  return { ref, size };
}