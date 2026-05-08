import { useEffect } from 'react';

export default function useOrientationReflow() {
  useEffect(() => {
    function handleOrientationChange() {
      // Naver Whale sometimes keeps stale vw units until layout is nudged.
      requestAnimationFrame(() => {
        document.body.style.zoom = '99.99%';
        requestAnimationFrame(() => {
          document.body.style.zoom = '';
        });
      });
    }
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);
}
