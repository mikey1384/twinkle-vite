import React from 'react';
import type { BuildFavoriteChange } from '~/components/Build/FavoriteButton';
import type { BuildProjectListItemData } from '~/components/Build/ProjectListItem';
import ForkHistoryModal from '~/components/Modals/BuildForkHistoryModal';
import DescriptionModal from '~/components/Modals/BuildDescriptionModal';
import { BuildQuickAccessModal } from './QuickAccess';
import type { BuildQuickAccessMode, QuickAccessBuild } from './types';

export default function Overlays({
  editingBuild,
  forkHistoryBuildId,
  quickAccessLoadingMore,
  quickAccessModalBuilds,
  quickAccessModalCursor,
  quickAccessModalMode,
  quickAccessModalPage,
  quickAccessOpenButtonStyle,
  savingMetadata,
  onCloseEdit,
  onCloseForkHistory,
  onCloseQuickAccess,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onNextQuickAccessPage,
  onOpenQuickAccessBuild,
  onPreviousQuickAccessPage,
  onSubmitMetadata
}: {
  editingBuild: BuildProjectListItemData | null;
  forkHistoryBuildId: number | null;
  quickAccessLoadingMore: boolean;
  quickAccessModalBuilds: QuickAccessBuild[];
  quickAccessModalCursor: string | null;
  quickAccessModalMode: BuildQuickAccessMode | null;
  quickAccessModalPage: number;
  quickAccessOpenButtonStyle?: React.CSSProperties;
  savingMetadata: boolean;
  onCloseEdit: () => void;
  onCloseForkHistory: () => void;
  onCloseQuickAccess: () => void;
  onFavoriteChange: (
    build: BuildProjectListItemData,
    change: BuildFavoriteChange
  ) => void;
  onFavoriteError: (
    build: BuildProjectListItemData,
    error: unknown,
    params: { buildId: number; requestedFavorited: boolean }
  ) => void;
  onFavoriteStart: (
    build: BuildProjectListItemData,
    params: { buildId: number; requestedFavorited: boolean }
  ) => void;
  onNextQuickAccessPage: () => void;
  onOpenQuickAccessBuild: (build: QuickAccessBuild) => void;
  onPreviousQuickAccessPage: () => void;
  onSubmitMetadata: (args: {
    title: string;
    description: string;
  }) => Promise<void> | void;
}) {
  return (
    <>
      {editingBuild ? (
        <DescriptionModal
          initialTitle={editingBuild.title}
          initialDescription={editingBuild.description}
          loading={savingMetadata}
          onHide={onCloseEdit}
          onSubmit={onSubmitMetadata}
        />
      ) : null}
      {forkHistoryBuildId ? (
        <ForkHistoryModal
          buildId={forkHistoryBuildId}
          isOpen
          onClose={onCloseForkHistory}
        />
      ) : null}
      {quickAccessModalMode ? (
        <BuildQuickAccessModal
          builds={quickAccessModalBuilds}
          cursor={quickAccessModalCursor}
          loadingMore={quickAccessLoadingMore}
          mode={quickAccessModalMode}
          openButtonStyle={quickAccessOpenButtonStyle}
          page={quickAccessModalPage}
          onClose={onCloseQuickAccess}
          onNextPage={onNextQuickAccessPage}
          onOpenBuild={onOpenQuickAccessBuild}
          onPreviousPage={onPreviousQuickAccessPage}
          onFavoriteChange={onFavoriteChange}
          onFavoriteError={onFavoriteError}
          onFavoriteStart={onFavoriteStart}
        />
      ) : null}
    </>
  );
}
