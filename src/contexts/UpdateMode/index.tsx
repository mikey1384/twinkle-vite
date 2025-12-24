import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo
} from 'react';

type UpdateMode = 'idle' | 'scrolling' | 'transitioning';

interface UpdateModeContextType {
  updateMode: UpdateMode;
  isTransitioning: boolean;
  isScrolling: boolean;
  onScrollStart: () => void;
  onScrollEnd: () => void;
  onTransitionStart: () => void;
  onTransitionEnd: () => void;
}

const UpdateModeContext = createContext<UpdateModeContextType>({
  updateMode: 'idle',
  isTransitioning: false,
  isScrolling: false,
  onScrollStart: () => {},
  onScrollEnd: () => {},
  onTransitionStart: () => {},
  onTransitionEnd: () => {}
});

const SCROLL_IDLE_DELAY = 150; // ms after last scroll event to consider scrolling stopped
const TRANSITION_DURATION = 300; // ms to keep transition mode active

export function UpdateModeProvider({ children }: { children: React.ReactNode }) {
  const [updateMode, setUpdateMode] = useState<UpdateMode>('idle');
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef(false);
  const isTransitioningRef = useRef(false);

  // Cleanup timers on unmount to prevent state updates after unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const onScrollStart = useCallback(() => {
    // Clear any pending scroll end timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }

    // Only update state if not already scrolling
    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
      // Don't override transitioning mode
      if (!isTransitioningRef.current) {
        setUpdateMode('scrolling');
      }
    }

    // Set timeout to detect scroll end
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      if (!isTransitioningRef.current) {
        setUpdateMode('idle');
      }
      scrollTimeoutRef.current = null;
    }, SCROLL_IDLE_DELAY);
  }, []);

  const onScrollEnd = useCallback(() => {
    // Manual scroll end (usually not needed due to timeout)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    isScrollingRef.current = false;
    if (!isTransitioningRef.current) {
      setUpdateMode('idle');
    }
  }, []);

  const onTransitionStart = useCallback(() => {
    // Clear any pending transition end timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    isTransitioningRef.current = true;
    setUpdateMode('transitioning');
  }, []);

  const onTransitionEnd = useCallback(() => {
    // Delay returning to idle to allow components to fully render
    transitionTimeoutRef.current = setTimeout(() => {
      isTransitioningRef.current = false;
      if (isScrollingRef.current) {
        setUpdateMode('scrolling');
      } else {
        setUpdateMode('idle');
      }
      transitionTimeoutRef.current = null;
    }, TRANSITION_DURATION);
  }, []);

  const value = useMemo(
    () => ({
      updateMode,
      isTransitioning: updateMode === 'transitioning',
      isScrolling: updateMode === 'scrolling',
      onScrollStart,
      onScrollEnd,
      onTransitionStart,
      onTransitionEnd
    }),
    [updateMode, onScrollStart, onScrollEnd, onTransitionStart, onTransitionEnd]
  );

  return (
    <UpdateModeContext.Provider value={value}>
      {children}
    </UpdateModeContext.Provider>
  );
}

export function useUpdateMode() {
  return useContext(UpdateModeContext);
}

/**
 * Hook for components to determine if they should perform expensive updates.
 * Returns true if:
 * - Component is in view (visible in viewport)
 * - OR we're in transitioning mode (page/tab change)
 * - OR we're in idle mode (not actively scrolling)
 *
 * During active scrolling, only visible components should update.
 */
export function useShouldUpdate(inView: boolean): boolean {
  const { updateMode } = useUpdateMode();

  // During transitions or idle, all components can update
  if (updateMode === 'transitioning' || updateMode === 'idle') {
    return true;
  }

  // During scrolling, only visible components should update
  return inView;
}
