import { useLayoutEffect, useRef, useState } from 'react';

// A narrow desktop split can have less room than a phone. Measure the panel,
// including height changes from the keyboard, instead of naming devices.
export default function useChatPanelSpace() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(true);
  const [short, setShort] = useState(false);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    function measure() {
      if (!panel) return;
      const { width, height } = panel.getBoundingClientRect();
      setCompact(width < 480 || height < 680);
      setShort(height < 480);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  return { panelRef, compact, short };
}
