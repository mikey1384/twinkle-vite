import { useEffect, useRef, useState } from 'react';

export default function useMessageInView() {
  const componentRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = componentRef.current;
    if (!element) return;
    if (typeof IntersectionObserver !== 'function') {
      setInView(true);
      return;
    }

    let active = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!active) return;
        setInView(Boolean(entry?.isIntersecting));
      },
      { rootMargin: '480px 0px' }
    );

    observer.observe(element);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, []);

  return { componentRef, inView };
}
