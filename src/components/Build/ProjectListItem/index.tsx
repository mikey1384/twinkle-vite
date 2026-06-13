import React from 'react';
import { BuildWideCard } from '~/components/Build/Cards';
import type { BuildFavoriteChange } from '~/components/Build/FavoriteButton';
import type { BuildProjectListItemData, BuildTag } from './types';

export type { BuildProjectListItemData, BuildTag } from './types';

export default function ProjectListItem({
  build,
  to,
  navigationState,
  isOwner = false,
  themeName,
  primaryActionLabel,
  primaryActionIcon,
  primaryActionTo,
  primaryActionNavigationState,
  showCollaborationRequestAction = true,
  showFavoriteAction = false,
  showForkBadge = true,
  showOpenAppAction,
  updatedAtSource = 'workspace',
  onAddDescription,
  onDelete,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onOpenForkHistory,
  onTagClick
}: {
  build: BuildProjectListItemData;
  to?: string;
  navigationState?: Record<string, any>;
  isOwner?: boolean;
  themeName?: string;
  primaryActionLabel?: string;
  primaryActionIcon?: string;
  primaryActionTo?: string;
  primaryActionNavigationState?: Record<string, any>;
  showCollaborationRequestAction?: boolean;
  showFavoriteAction?: boolean;
  showForkBadge?: boolean;
  showOpenAppAction?: boolean;
  updatedAtSource?: 'workspace' | 'publicVersion';
  onAddDescription?: (build: BuildProjectListItemData) => void;
  onDelete?: (build: BuildProjectListItemData) => void;
  onFavoriteChange?: (
    build: BuildProjectListItemData,
    change: BuildFavoriteChange
  ) => void;
  onFavoriteError?: (
    build: BuildProjectListItemData,
    error: unknown,
    params: { buildId: number; requestedFavorited: boolean }
  ) => void;
  onFavoriteStart?: (
    build: BuildProjectListItemData,
    params: { buildId: number; requestedFavorited: boolean }
  ) => void;
  onOpenForkHistory?: (buildId: number) => void;
  onTagClick?: (tag: BuildTag) => void;
}) {
  return (
    <BuildWideCard
      build={build}
      isOwner={isOwner}
      navigationState={navigationState}
      primaryActionIcon={primaryActionIcon}
      primaryActionLabel={primaryActionLabel}
      primaryActionTo={primaryActionTo}
      primaryActionNavigationState={primaryActionNavigationState}
      showCollaborationRequestAction={showCollaborationRequestAction}
      showFavoriteAction={showFavoriteAction}
      showForkBadge={showForkBadge}
      showOpenAppAction={showOpenAppAction}
      themeName={themeName}
      to={to}
      updatedAtSource={updatedAtSource}
      onAddDescription={onAddDescription}
      onDelete={onDelete}
      onFavoriteChange={onFavoriteChange}
      onFavoriteError={onFavoriteError}
      onFavoriteStart={onFavoriteStart}
      onOpenForkHistory={onOpenForkHistory}
      onTagClick={onTagClick}
    />
  );
}
