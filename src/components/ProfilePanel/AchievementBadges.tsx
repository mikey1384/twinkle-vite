import React, { useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext } from '~/contexts';
import { achievementIdToType } from '~/constants/defaultValues';

export default function AchievementBadges({
  unlockedAchievementIds = []
}: {
  unlockedAchievementIds: number[];
}) {
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  useEffect(() => {
    console.log(achievementsObj);
    console.log(
      unlockedAchievementIds.map(
        (achievementId) => achievementIdToType[achievementId]
      )
    );
  }, []);

  return (
    <ErrorBoundary componentPath="ProfilePanel/AchievementBadges">
      AchievementBadges
    </ErrorBoundary>
  );
}
