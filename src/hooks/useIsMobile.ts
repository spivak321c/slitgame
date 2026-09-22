import { useState, useEffect } from 'react';

/** Reactive mobile check (max-width: 639px). Used to switch modal-family
 *  surfaces between the native mobile bottom-sheet convention and the
 *  centered/desktop card. Reacts to orientation changes too. */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 639px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
