import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext, useKeyContext, useMissionContext } from '~/contexts';
import MissionItem from '~/components/MissionItem';
import CompactMissionEmbedPreview from '~/components/CompactMissionEmbedPreview';
import ChatMissionEmbedPreview from '~/components/ChatMissionEmbedPreview';
import Loading from '~/components/Loading';
import InvalidContent from '../InvalidContent';
import EmbedLoadError from '../EmbedLoadError';
import LoginToViewContent from '~/components/LoginToViewContent';
import { isMobile } from '~/helpers';

const displayIsMobile = isMobile(navigator);

export default function MissionComponent({
  src,
  isPreview,
  isChat = false
}: {
  src: string;
  isPreview?: boolean;
  isChat?: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const [requestState, setRequestState] = useState<{
    key: string;
    status: 'idle' | 'loading' | 'error' | 'notFound';
  }>({ key: '', status: 'idle' });
  const [retryAttempt, setRetryAttempt] = useState(0);
  const missionTypeIdHash = useMissionContext((v) => v.state.missionTypeIdHash);
  const loadMissionTypeIdHash = useAppContext(
    (v) => v.requestHelpers.loadMissionTypeIdHash
  );
  const loadMission = useAppContext((v) => v.requestHelpers.loadMission);
  const onLoadMission = useMissionContext((v) => v.actions.onLoadMission);
  const missionObj = useMissionContext((v) => v.state.missionObj);
  const onLoadMissionTypeIdHash = useMissionContext(
    (v) => v.actions.onLoadMissionTypeIdHash
  );

  const pathParts = useMemo(
    () => src.split(/[?#]/)[0].split('/').filter(Boolean),
    [src]
  );
  const missionType = pathParts[pathParts.length - 1];
  const isTask = pathParts.length > 2;

  const missionId = useMemo(() => {
    return missionTypeIdHash?.[missionType];
  }, [missionTypeIdHash, missionType]);

  const mission = useMemo(
    () => missionObj[missionId] || {},
    [missionId, missionObj]
  );

  // The global mission viewer marker can belong to another cached mission.
  const loadedForUser = Boolean(mission.loaded && mission.prevUserId === userId);
  const requestKey = `${userId}:${missionType}:${isTask}`;
  const status = requestState.key === requestKey ? requestState.status : 'idle';

  useEffect(() => {
    let cancelled = false;
    if (!userId || loadedForUser) {
      setRequestState({ key: requestKey, status: 'idle' });
    } else {
      setRequestState({ key: requestKey, status: 'loading' });
      loadPreview();
    }

    async function loadPreview() {
      try {
        if (!missionId) {
          const hash = await loadMissionTypeIdHash();
          if (cancelled) return;
          onLoadMissionTypeIdHash(hash);
          setRequestState({
            key: requestKey,
            status: hash?.[missionType] ? 'idle' : 'notFound'
          });
          // The canonical hash update starts the page phase on the next render.
          return;
        }
        const { page } = await loadMission({ missionId, isTask });
        if (cancelled) return;
        if (page) {
          onLoadMission({ mission: page, prevUserId: userId });
        }
        setRequestState({ key: requestKey, status: page ? 'idle' : 'notFound' });
      } catch (_error) {
        if (!cancelled) setRequestState({ key: requestKey, status: 'error' });
      }
    }

    return () => { cancelled = true; };
  }, [
    userId, loadedForUser, missionId, missionType, isTask, requestKey,
    retryAttempt, loadMissionTypeIdHash, loadMission, onLoadMissionTypeIdHash,
    onLoadMission
  ]);

  if (!userId) {
    return <LoginToViewContent />;
  }
  if (status === 'error') {
    return <EmbedLoadError onRetry={() => setRetryAttempt(value => value + 1)} />;
  }
  if (status === 'notFound') {
    return <InvalidContent />;
  }
  if (status === 'loading' || !missionId || !loadedForUser) {
    return <Loading text="Loading mission" innerStyle={{ fontSize: '14px' }} />;
  }

  if (isChat) {
    return <ChatMissionEmbedPreview mission={mission} missionLink={src} isPreview={isPreview} />;
  }
  if (isPreview) {
    return <CompactMissionEmbedPreview mission={mission} missionLink={src} />;
  }

  return (
    <MissionItem
      showStatus={false}
      style={{ marginTop: '1rem', minWidth: displayIsMobile ? '100%' : '80%' }}
      mission={mission}
      missionLink={src}
    />
  );
}
