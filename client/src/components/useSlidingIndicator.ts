import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type Box = { left: number; top: number; width: number; height: number };

/**
 * Position for a highlight that slides to whichever child is active (a
 * segmented toggle, the sidebar nav). The container must be `relative`; the
 * active child is found by `activeSelector`. It's re-measured when
 * `activeKey` changes or the container resizes. Transitions switch on only
 * after the first placement, so the highlight doesn't fly in from a corner
 * when the page loads.
 */
export function useSlidingIndicator<T extends HTMLElement>(activeKey: string, activeSelector: string) {
  const containerRef = useRef<T>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function measure() {
      const active = container?.querySelector<HTMLElement>(activeSelector);
      setBox(active ? { left: active.offsetLeft, top: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight } : null);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeKey, activeSelector]);

  useEffect(() => {
    if (!box || animate) return;
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [box, animate]);

  const style = box ? { left: box.left, top: box.top, width: box.width, height: box.height } : { display: 'none' };
  const transitionClass = animate ? 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]' : '';
  return { containerRef, style, transitionClass };
}
