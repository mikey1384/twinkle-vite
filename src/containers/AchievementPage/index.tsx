import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import AchievementItem from '~/components/AchievementItem';
import Loading from '~/components/Loading';
import InvalidPage from '~/components/InvalidPage';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useKeyContext } from '~/contexts';

interface MyAchievementProgress {
  milestones?: { name: string; completed: boolean }[];
  progressObj?: { label: string; currentValue: number; targetValue: number };
  phases?: {
    label: string;
    type?: 'bar' | 'check';
    currentValue?: number;
    targetValue?: number;
    completed: boolean;
  }[];
}

export default function AchievementPage() {
  const { achievementType } = useParams();
  const userId = useKeyContext((v) => v.myState.userId);
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const loadMyAchievements = useAppContext(
    (v) => v.requestHelpers.loadMyAchievements
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [myAchievement, setMyAchievement] =
    useState<MyAchievementProgress | null>(null);

  const achievementsLoaded =
    !!achievementsObj && Object.keys(achievementsObj).length > 0;
  const achievement = achievementType
    ? achievementsObj?.[achievementType]
    : null;

  useEffect(() => {
    let active = true;
    // Drop any progress from a previously viewed achievement so it can never be
    // merged into the current one while this request is in flight.
    setMyAchievement(null);
    if (userId && achievementType) loadMine();
    async function loadMine() {
      try {
        const data = await loadMyAchievements();
        if (!active) return;
        if (data) {
          const unlockedAchievementIds = [];
          for (const key in data) {
            if (data[key]?.isUnlocked) {
              unlockedAchievementIds.push(data[key].id);
            }
          }
          onSetUserState({ userId, newState: { unlockedAchievementIds } });
        }
        setMyAchievement(data?.[achievementType as string] || null);
      } catch {
        if (active) setMyAchievement(null);
      }
    }
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, achievementType]);

  const mergedAchievement = useMemo(() => {
    if (!achievement) return null;
    return {
      ...achievement,
      milestones: myAchievement?.milestones ?? achievement.milestones,
      progressObj: myAchievement?.progressObj ?? achievement.progressObj,
      phases: myAchievement?.phases ?? achievement.phases
    };
  }, [achievement, myAchievement]);

  if (!achievementsLoaded) {
    return <Loading />;
  }

  if (!mergedAchievement) {
    return <InvalidPage />;
  }

  return (
    <ErrorBoundary componentPath="AchievementPage">
      <div
        className={css`
          width: 100%;
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
          padding-bottom: 20rem;
        `}
      >
        <section
          className={css`
            width: 65%;
            margin-top: 1rem;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
              margin-top: 0;
            }
          `}
        >
          <AchievementItem achievement={mergedAchievement} />
        </section>
      </div>
    </ErrorBoundary>
  );
}
