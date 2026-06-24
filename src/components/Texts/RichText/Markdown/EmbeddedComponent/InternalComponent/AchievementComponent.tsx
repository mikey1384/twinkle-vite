import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import AchievementItem from '~/components/AchievementItem';
import CompactAchievementCard from './CompactAchievementCard';
import Loading from '~/components/Loading';
import InvalidContent from '../InvalidContent';
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
  const loadingRef = useRef(false);
  const [hasError, setHasError] = useState(false);
  const [attemptedLoad, setAttemptedLoad] = useState(false);

  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const loadAllAchievements = useAppContext(
    (v) => v.requestHelpers.loadAllAchievements
  );
  const onSetAchievementsObj = useAppContext(
    (v) => v.user.actions.onSetAchievementsObj
  );

  const achievementType = useMemo(() => {
    const parts = src.split('/');
    return parts[2]?.split('?')?.[0];
  }, [src]);

  const achievementsLoaded =
    !!achievementsObj && Object.keys(achievementsObj).length > 0;
  const achievement = achievementType
    ? achievementsObj?.[achievementType]
    : null;

  useEffect(() => {
    if (!achievementsLoaded && !loadingRef.current) {
      loadDefinitions();
    }
    async function loadDefinitions() {
      try {
        loadingRef.current = true;
        const data = await loadAllAchievements();
        if (data) {
          onSetAchievementsObj(data);
        }
      } catch (_error) {
        setHasError(true);
      } finally {
        loadingRef.current = false;
        setAttemptedLoad(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievementsLoaded]);

  if (!achievementType || hasError) {
    return <InvalidContent />;
  }

  if (!achievementsLoaded && !attemptedLoad) {
    return <Loading />;
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
