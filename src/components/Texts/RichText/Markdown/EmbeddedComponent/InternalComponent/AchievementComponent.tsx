import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import AchievementItem from '~/components/AchievementItem';
import CompactAchievementCard from './CompactAchievementCard';
import Loading from '~/components/Loading';
import InvalidContent from '../InvalidContent';
import EmbedLoadError from '../EmbedLoadError';
import { isMobile } from '~/helpers';

const displayIsMobile = isMobile(navigator);

export default function AchievementComponent({
  src,
  isPreview
}: {
  src: string;
  isPreview?: boolean;
}) {
  const navigate = useNavigate();
  const [requestState, setRequestState] = useState<{
    achievementType: string;
    status: 'loading' | 'ready' | 'error';
  } | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const loadAllAchievements = useAppContext(
    (v) => v.requestHelpers.loadAllAchievements
  );
  const onSetAchievementsObj = useAppContext(
    (v) => v.user.actions.onSetAchievementsObj
  );

  const achievementType = useMemo(() => {
    return src.split(/[?#]/)[0].split('/')[2];
  }, [src]);

  const achievementsLoaded =
    !!achievementsObj && Object.keys(achievementsObj).length > 0;
  const achievement = achievementType
    ? achievementsObj?.[achievementType]
    : null;

  useEffect(() => {
    let cancelled = false;
    if (achievementType && !achievementsLoaded) {
      loadDefinitions();
    }
    async function loadDefinitions() {
      setRequestState({ achievementType, status: 'loading' });
      try {
        const data = await loadAllAchievements();
        if (cancelled) return;
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('Achievement definitions are incomplete');
        }
        onSetAchievementsObj(data);
        setRequestState({ achievementType, status: 'ready' });
      } catch (_error) {
        if (!cancelled) setRequestState({ achievementType, status: 'error' });
      }
    }
    return () => {
      cancelled = true;
    };
  }, [
    achievementType,
    achievementsLoaded,
    retryAttempt,
    loadAllAchievements,
    onSetAchievementsObj
  ]);

  if (!achievementType) {
    return <InvalidContent />;
  }

  if (!achievementsLoaded) {
    const status =
      requestState?.achievementType === achievementType
        ? requestState.status
        : 'loading';
    if (status === 'error') {
      return (
        <EmbedLoadError onRetry={() => setRetryAttempt((value) => value + 1)} />
      );
    }
    if (status !== 'ready') {
      return (
        <Loading text="Loading achievement" innerStyle={{ fontSize: '14px' }} />
      );
    }
  }

  if (!achievement) {
    return <InvalidContent />;
  }

  if (isPreview) {
    return (
      <CompactAchievementCard
        achievement={achievement}
        onClick={handlePreviewClick}
      />
    );
  }

  return (
    <div
      className={css`
        cursor: pointer;
        width: 100%;
        min-width: ${displayIsMobile ? '100%' : '80%'};
      `}
      onClick={handleCardClick}
    >
      <AchievementItem isNotification achievement={achievement} />
    </div>
  );

  function handleCardClick(event: React.MouseEvent<HTMLDivElement>) {
    // Let nested interactive elements (e.g. the Mission card's /missions link,
    // achiever "Show all", or the DOB modal trigger) handle their own clicks.
    if ((event.target as HTMLElement)?.closest('a, button')) {
      return;
    }
    navigate(`/achievements/${achievementType}`);
  }

  function handlePreviewClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    navigate(`/achievements/${achievementType}`);
  }
}
