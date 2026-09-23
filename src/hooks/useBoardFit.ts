import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Measures a board container and returns a square tile size that makes the
 *  whole board (rows × cols, with `gap` between tiles) fit exactly inside it —
 *  so the board never needs an internal scroll container. Mirrors how
 *  wordle.global sizes its grid to the viewport.
 *
 *  Uses a callback ref rather than an effect so a board that mounts later
 *  (a duel flipping from waiting to live, a remounted round) is measured the
 *  moment it appears, instead of staying on the fallback size. */
export function useBoardFit(
  rows: number,
  cols: number,
  gap = 6,
  max = 72
) {
  const [size, setSize] = useState<number | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const measureRef = useRef<() => void>(() => {});

  const measure = useCallback(() => {
    const el = nodeRef.current;
    if (!el) return;
    const { clientWidth: w, clientHeight: h } = el;
    if (w <= 0 || h <= 0) return;
    const byWidth = (w - gap * (cols - 1)) / cols;
    const byHeight = (h - gap * (rows - 1)) / rows;
    const fit = Math.floor(Math.min(byWidth, byHeight));
    setSize(Math.max(1, Math.min(max, fit)));
  }, [rows, cols, gap, max]);

  measureRef.current = measure;

  const observe = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    const el = nodeRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    observerRef.current = new ResizeObserver(() => measureRef.current());
    observerRef.current.observe(el);
  }, []);

  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      nodeRef.current = el;
      if (!el) {
        observerRef.current?.disconnect();
        observerRef.current = null;
        return;
      }
      measureRef.current();
      observe();
    },
    [observe]
  );

  useLayoutEffect(() => {
    measureRef.current();
    if (nodeRef.current) observe();
  }, [measure, observe]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref, size };
}
