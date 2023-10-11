import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import AchievementItem from '~/components/AchievementItem';
import { useAppContext } from '~/contexts';
import { achievementIdToType } from '~/constants/defaultValues';

export default function AchievementBadges({
  unlockedAchievementIds = []
}: {
  unlockedAchievementIds: number[];
}) {
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const achievements = useMemo(() => {
    if (!achievementsObj) return [];
    return unlockedAchievementIds.map(
      (achievementId) => achievementsObj[achievementIdToType[achievementId]]
    );
  }, [achievementsObj, unlockedAchievementIds]);

  return (
    <ErrorBoundary
      style={{ width: '100%' }}
      componentPath="ProfilePanel/AchievementBadges"
    >
      {achievements.map((achievement) =>
        achievement ? (
          <AchievementItem
            key={achievement.type}
            isSmall
            achievement={achievement}
          />
        ) : null
      )}
    </ErrorBoundary>
  );
}
