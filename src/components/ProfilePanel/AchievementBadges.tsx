import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function AchievementBadges() {
  return (
    <ErrorBoundary componentPath="ProfilePanel/AchievementBadges">
      AchievementBadges
    </ErrorBoundary>
  );
}
