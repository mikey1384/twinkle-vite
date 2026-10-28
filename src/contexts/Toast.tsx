import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '~/components/Toast';
import AchievementToast from '~/components/AchievementToast';
import CompletionToast from '~/components/CompletionToast';
import { useAppContext } from '~/contexts';

interface MessageToastOptions {
  kind?: 'message';
  message: string;
  duration?: number;
  linkTo?: string;
  // instead of a link: what a tap does (e.g. open the sign-up window)
  onClick?: () => void;
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

interface CompletionToastOptions {
  kind: 'completion';
  ownerUserId: number;
  title: string;
  message: string;
  imageSrc?: string;
  actionLabel: string;
  linkTo: string;
  duration?: number;
  onShown?: () => void;
  onClick?: () => void | Promise<void>;
}

type ToastOptions =
  MessageToastOptions | AchievementToastOptions | CompletionToastOptions;
type QueuedToast = ToastOptions & { id: number };

type ShowToast = (options: ToastOptions) => void;

// Plain context exposing only the stable `showToast` dispatcher, so consumers
// that call it never re-render when a toast is shown. The provider owns the
// queue and renders the single global toast itself.
const ToastContext = createContext<ShowToast>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const userId = useAppContext((v) => v.user.state.userId);
  // Queue so back-to-back events (e.g. finishing a grammar game that also
  // crosses a milestone) play one after another instead of clobbering.
  const [queue, setQueue] = useState<QueuedToast[]>([]);
  useEffect(() => {
    setQueue((items) =>
      items.filter(
        (item) =>
          item.kind !== 'completion' || item.ownerUserId === Number(userId)
      )
    );
  }, [userId]);

  const showToast = useCallback((options: ToastOptions) => {
    setQueue((q) => [...q, { ...options, id: Date.now() + Math.random() }]);
  }, []);

  // Private task results must never cross an account switch, even if an
  // achievement ahead of them kept them queued until after logout.
  const current =
    queue.find(
      (toast) =>
        toast.kind !== 'completion' || toast.ownerUserId === Number(userId)
    ) || null;
  const closeCurrent = useCallback(() => {
    setQueue((items) => items.filter((item) => item.id !== current?.id));
  }, [current?.id]);

  function renderCurrent() {
    if (!current) return null;
    const goLink =
      current.kind !== 'achievement' && current.onClick
        ? current.onClick
        : current.linkTo
          ? () => navigate(current.linkTo as string)
          : undefined;

    if (current.kind === 'completion') {
      return (
        <CompletionToast
          key={current.id}
          {...current}
          onClose={closeCurrent}
          onClick={goLink}
        />
      );
    }

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
          onClose={closeCurrent}
          onClick={goLink}
        />
      );
    }

    return (
      <Toast
        key={current.id}
        message={current.message}
        duration={current.duration}
        onClose={closeCurrent}
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
