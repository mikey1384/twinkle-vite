import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useKeyContext } from '~/contexts';
import { useToast } from '~/contexts/Toast';
import { socket } from '~/constants/sockets/api';
import { TWINKLE_SOCKET_AUTH_READY_EVENT } from '~/constants/socketEvents';
import { cloudFrontURL } from '~/constants/defaultValues';
import {
  dailyPictureJobs,
  type DailyPictureResult
} from '~/helpers/dailyPictureJobs';

// Lives at the app shell, not the Picture Day page. Neither navigation nor a
// hidden tab loses the request or consumes its completion banner unseen.
export default function DailyPictureNotifications() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadDailyPicture = useAppContext(
    (v) => v.requestHelpers.loadDailyPicture
  );
  const showToast = useToast();
  const navigate = useNavigate();
  const snapshot = useSyncExternalStore(
    dailyPictureJobs.subscribe,
    dailyPictureJobs.getSnapshot
  );
  const [visible, setVisible] = useState(!document.hidden);
  const queuedRef = useRef(new Set<string>());
  const pending =
    snapshot.userId === Number(userId) &&
    snapshot.jobs.some(
      (job) => job.status === 'painting' || job.status === 'checking'
    );

  useEffect(() => {
    queuedRef.current.clear();
    dailyPictureJobs.activate(Number(userId) || 0);
    if (!userId) return;
    function recover() {
      setVisible(!document.hidden);
      if (!document.hidden)
        void dailyPictureJobs.recover(loadDailyPicture, true);
    }
    function receive(result: DailyPictureResult) {
      dailyPictureJobs.receive(result);
    }
    function sync(event: StorageEvent) {
      if (event.key !== `daily-picture-jobs:${userId}`) return;
      dailyPictureJobs.syncStored();
      recover();
    }
    socket.on('daily_picture_ready', receive);
    window.addEventListener(TWINKLE_SOCKET_AUTH_READY_EVENT, recover);
    window.addEventListener('online', recover);
    window.addEventListener('storage', sync);
    document.addEventListener('visibilitychange', recover);
    recover();
    // Read-only fallback for a dropped reply/socket or a browser reload. It
    // skips requests still owned by this page and never starts new images.
    return () => {
      socket.off('daily_picture_ready', receive);
      window.removeEventListener(TWINKLE_SOCKET_AUTH_READY_EVENT, recover);
      window.removeEventListener('online', recover);
      window.removeEventListener('storage', sync);
      document.removeEventListener('visibilitychange', recover);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!userId || !visible || !pending) return;
    const timer = window.setInterval(() => {
      void dailyPictureJobs.recover(loadDailyPicture);
    }, 15000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, visible, pending]);

  useEffect(() => {
    if (!visible || !userId || snapshot.userId !== Number(userId)) return;
    for (const job of snapshot.jobs) {
      if (
        job.notified ||
        queuedRef.current.has(job.requestId) ||
        (job.status !== 'ready' && job.status !== 'failed')
      )
        continue;
      queuedRef.current.add(job.requestId);
      showToast({
        kind: 'completion',
        ownerUserId: Number(userId),
        title:
          job.status === 'ready'
            ? 'Your picture is ready'
            : 'Your picture needs another try',
        message:
          job.status === 'ready'
            ? 'Saved in your Picture Day.'
            : job.error || 'Open Picture Day to try again.',
        imageSrc: job.path ? `${cloudFrontURL}/${job.path}` : undefined,
        actionLabel:
          job.status === 'ready' ? 'View picture' : 'Open Picture Day',
        linkTo:
          job.isToday === false
            ? `/daily-reflection?mode=pictures&picture=${encodeURIComponent(job.path || '')}`
            : `/daily-reflection?mode=classic&picture=${encodeURIComponent(job.path || '')}`,
        duration: 12000,
        onClick: async () => {
          if (dailyPictureJobs.getSnapshot().userId !== Number(userId)) return;
          // A banner may have waited overnight behind another notification
          // or in a sleeping tab. Resolve the original day's destination now.
          const fresh = await loadDailyPicture(job.questionId);
          if (dailyPictureJobs.getSnapshot().userId !== Number(userId)) return;
          navigate(
            `/daily-reflection?mode=${fresh.isToday ? 'classic' : 'pictures'}&picture=${encodeURIComponent(job.path || '')}`
          );
        },
        onShown: () => {
          if (dailyPictureJobs.getSnapshot().userId === Number(userId)) {
            dailyPictureJobs.markNotified(job.requestId);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, userId, visible]);

  return null;
}
