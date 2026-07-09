import { useEffect, useState } from 'react';
import { isMobile, isTablet } from '~/helpers';

// UA-based, static for the session. `deviceIsPhone` is a NON-tablet touch device
// (iPad is excluded — it gets the tablet/desktop treatment).
const deviceIsTablet = isTablet(navigator);
const deviceIsPhone = isMobile(navigator) && !deviceIsTablet;

// Reactive orientation for tablets AND phones. iPad LANDSCAPE gets the full
// desktop experience (labelled tabs, build apps in the global nav); iPad
// PORTRAIT gets the lighter treatment. `isMobilePortrait` lets phone surfaces
// (e.g. the build runtime toolbar) compact even further than tablet portrait.
// Updates live on rotation via the orientation media query. On plain desktop
// every flag is false, so callers keep their normal behavior.
export default function useTabletOrientation() {
  const [isLandscape, setIsLandscape] = useState(() =>
    (deviceIsTablet || deviceIsPhone) && typeof window !== 'undefined'
      ? window.matchMedia('(orientation: landscape)').matches
      : false
  );

  useEffect(() => {
    if (!deviceIsTablet && !deviceIsPhone) return;
    const mq = window.matchMedia('(orientation: landscape)');
    function handleChange() {
      setIsLandscape(mq.matches);
    }
    handleChange();
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  return {
    isTablet: deviceIsTablet,
    isTabletLandscape: deviceIsTablet && isLandscape,
    isTabletPortrait: deviceIsTablet && !isLandscape,
    isMobilePortrait: deviceIsPhone && !isLandscape
  };
}
