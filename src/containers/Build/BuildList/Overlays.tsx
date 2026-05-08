import React from 'react';
import type { BuildFavoriteChange } from '~/components/Buttons/BuildFavoriteButton';
import type { BuildProjectListItemData } from '~/containers/Build/shared/components/BuildProjectListItem';
import BuildForkHistoryModal from '~/containers/Build/shared/components/BuildForkHistoryModal';
import BuildDescriptionModal from '../BuildDescriptionModal';
import BuildDeleteModal from '../BuildDeleteModal';
import { BuildQuickAccessModal } from './QuickAccess';
import type { BuildQuickAccessMode, QuickAccessBuild } from './types';

export default function Overlays({
  deleting,
  deletingBuild,
  editingBuild,
  forkHistoryBuildId,
  quickAccessLoadingMore,
  quickAccessModalBuilds,
  quickAccessModalCursor,
  quickAccessModalMode,
  quickAccessModalPage,
  quickAccessOpenButtonStyle,
  savingMetadata,
  onCloseDelete,
  onCloseEdit,
  onCloseForkHistory,
  onCloseQuickAccess,
  onDeleteBuild,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onNextQuickAccessPage,
  onOpenQuickAccessBuild,
  onPreviousQuickAccessPage,
  onSubmitMetadata
}: {
  deleting: boolean;
  deletingBuild: BuildProjectListItemData | null;
  editingBuild: BuildProjectListItemData | null;
  forkHistoryBuildId: number | null;
  quickAccessLoadingMore: boolean;
  quickAccessModalBuilds: QuickAccessBuild[];
  quickAccessModalCursor: string | null;
  quickAccessModalMode: BuildQuickAccessMode | null;
  quickAccessModalPage: number;
  quickAccessOpenButtonStyle?: React.CSSProperties;
  savingMetadata: boolean;
  onCloseDelete: () => void;
  onCloseEdit: () => void;
  onCloseForkHistory: () => void;
  onCloseQuickAccess: () => void;
  onDeleteBuild: (confirmTitle: string) => void;
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
        <BuildDescriptionModal
          initialTitle={editingBuild.title}
          initialDescription={editingBuild.description}
          loading={savingMetadata}
          onHide={onCloseEdit}
          onSubmit={onSubmitMetadata}
        />
      ) : null}
      {deletingBuild ? (
        <BuildDeleteModal
          buildTitle={deletingBuild.title}
          loading={deleting}
          onHide={onCloseDelete}
          onSubmit={onDeleteBuild}
        />
      ) : null}
      {forkHistoryBuildId ? (
        <BuildForkHistoryModal
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
