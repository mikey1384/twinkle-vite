import React, {
  createContext,
  useCallback,
  useContext,
  useState
} from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '~/components/Toast';
import AchievementToast from '~/components/AchievementToast';

interface MessageToastOptions {
  kind?: 'message';
  message: string;
  duration?: number;
  linkTo?: string;
}

interface AchievementToastOptions {
  kind: 'achievement';
  mode?: 'progress' | 'unlock';
  title: string;
  badgeSrc?: string;
  currentValue?: number;
  targetValue?: number;
  prevValue?: number;
  delta?: number;
  ap?: number;
  duration?: number;
  linkTo?: string;
}

type ToastOptions = MessageToastOptions | AchievementToastOptions;
type QueuedToast = ToastOptions & { id: number };

type ShowToast = (options: ToastOptions) => void;

// Plain context exposing only the stable `showToast` dispatcher, so consumers
// that call it never re-render when a toast is shown. The provider owns the
// queue and renders the single global toast itself.
const ToastContext = createContext<ShowToast>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  // Queue so back-to-back events (e.g. finishing a grammar game that also
  // crosses a milestone) play one after another instead of clobbering.
  const [queue, setQueue] = useState<QueuedToast[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    setQueue((q) => [...q, { ...options, id: Date.now() + Math.random() }]);
  }, []);

  const handleClose = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  const current = queue[0] || null;

  function renderCurrent() {
    if (!current) return null;
    const goLink = current.linkTo
      ? () => navigate(current.linkTo as string)
      : undefined;

    if (current.kind === 'achievement') {
      return (
        <AchievementToast
          key={current.id}
          variant={current.mode || 'progress'}
          title={current.title}
          badgeSrc={current.badgeSrc}
          currentValue={current.currentValue}
          targetValue={current.targetValue}
          prevValue={current.prevValue}
          delta={current.delta}
          ap={current.ap}
          duration={current.duration}
          onClose={handleClose}
          onClick={goLink}
        />
      );
    }

    return (
      <Toast
        key={current.id}
        message={current.message}
        duration={current.duration}
        onClose={handleClose}
        onClick={goLink}
      />
    );
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {renderCurrent()}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
