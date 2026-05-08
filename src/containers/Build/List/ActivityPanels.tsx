import React from 'react';
import { css } from '@emotion/css';
import ActivityPanel, {
  type ActivityItem
} from '../ActivityPanel';
import type {
  BuildActivitySubtab,
  BuildActivityTab
} from '~/contexts/Build/reducer';
import {
  buildActivityRailBreakpoint,
  buildPageTopGap
} from './layout';

const desktopHeaderHeight = '4.5rem';
const buildActivityPanelInitialViewportTop = `calc(
  ${desktopHeaderHeight} + ${buildPageTopGap}
)`;

const buildActivityRailClass = css`
  --build-activity-rail-top: ${buildPageTopGap};
  --build-activity-panel-top-offset: ${buildActivityPanelInitialViewportTop};
  --build-activity-rail-bottom-gap: ${buildPageTopGap};
  position: sticky;
  top: var(--build-activity-rail-top);
  width: 100%;
  z-index: 12;

  @media (max-width: ${buildActivityRailBreakpoint}) {
    display: none;
  }
`;

export default function ActivityPanels({
  activeSubtab,
  activeTab,
  activities,
  color,
  currentUserId,
  error,
  hasMore,
  hasNewActivity,
  loading,
  loadingMore,
  onLoadMore,
  onMobileOpen,
  onRefresh,
  onSubtabChange,
  onTabChange,
  variant
}: {
  activeSubtab: BuildActivitySubtab;
  activeTab: BuildActivityTab;
  activities: ActivityItem[];
  color?: string;
  currentUserId: number;
  error: string;
  hasMore: boolean;
  hasNewActivity?: boolean;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onMobileOpen?: () => void;
  onRefresh: () => void;
  onSubtabChange: (subtab: Exclude<BuildActivitySubtab, 'all'>) => void;
  onTabChange: (tab: BuildActivityTab) => void;
  variant: 'mobile' | 'rail';
}) {
  const panel = (
    <ActivityPanel
      activeSubtab={activeSubtab}
      activeTab={activeTab}
      activities={activities}
      color={color}
      currentUserId={currentUserId}
      error={error}
      hasNewActivity={hasNewActivity}
      hasMore={hasMore}
      loading={loading}
      loadingMore={loadingMore}
      onLoadMore={onLoadMore}
      onMobileOpen={onMobileOpen}
      onRefresh={onRefresh}
      onSubtabChange={onSubtabChange}
      onTabChange={onTabChange}
      variant={variant}
    />
  );
  if (variant === 'rail') {
    return <aside className={buildActivityRailClass}>{panel}</aside>;
  }
  return panel;
}
