import React, { useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function AchievementBadges({
  unlockedAchievementIds = []
}: {
  unlockedAchievementIds: number[];
}) {
  useEffect(() => {
    console.log(unlockedAchievementIds);
  }, []);

  return (
    <ErrorBoundary componentPath="ProfilePanel/AchievementBadges">
      AchievementBadges
    </ErrorBoundary>
  );
}
