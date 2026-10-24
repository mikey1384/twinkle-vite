import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import AchievementItem from '~/components/AchievementItem';
import { useAppContext } from '~/contexts';
import { achievementIdToType } from '~/constants/defaultValues';

export default function AchievementBadges({
  style,
  thumbSize,
  unlockedAchievementIds = []
}: {
  style?: React.CSSProperties;
  thumbSize?: string;
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
      style={{
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
      componentPath="ProfilePanel/AchievementBadges"
    >
      <div
        style={{
          width: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        {achievements.map((achievement) =>
          achievement ? (
            <AchievementItem
              key={achievement.type}
              isSmall
              isThumb
              thumbSize={thumbSize}
              achievement={achievement}
            />
          ) : null
        )}
      </div>
    </ErrorBoundary>
  );
}
