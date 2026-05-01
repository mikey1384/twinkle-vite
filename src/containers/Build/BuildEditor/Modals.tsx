import React from 'react';
import UploadModal from '~/components/Modals/UploadModal';
import UploadFileModal from '~/containers/Chat/Modals/UploadFileModal';
import BuildDescriptionModal from '../BuildDescriptionModal';
import BuildCollaborationSettingsModal from './BuildCollaborationSettingsModal';
import BuildThumbnailModal from './BuildThumbnailModal';

interface ModalsProps {
  build: {
    id: number;
    isPublic?: boolean;
    collaborationMode?: 'private' | 'contribution' | 'open_source';
    contributionAccess?: 'anyone' | 'invite_only';
  };
  buildChatDraftMessage: string;
  buildChatUploadFileObj: File | File[] | null;
  buildChatUploadModalShown: boolean;
  canEditMetadata: boolean;
  canShowLumineChatVisibilitySetting: boolean;
  buildDescription: string | null;
  buildTitle: string;
  collaborationSettingsModalShown: boolean;
  descriptionModalShown: boolean;
  isOwner: boolean;
  savingDescription: boolean;
  savingThumbnail: boolean;
  thumbnailInitialImageUrl: string | null;
  thumbnailModalShown: boolean;
  thumbnailSaveError: string;
  onCaptureThumbnailFromPreview?: () => Promise<string>;
  onCompleteBuildChatUpload: () => void;
  onCustomUploadSubmit: (args: {
    files: File[];
    caption: string;
  }) => Promise<boolean | void> | boolean | void;
  onHideBuildChatUploadFileModal: () => void;
  onHideBuildChatUploadModal: () => void;
  onHideCollaborationSettingsModal: () => void;
  onHideDescriptionModal: () => void;
  onHideThumbnailModal: () => void;
  onBuildCollaborationPatch: (patch: Record<string, any>) => void;
  onSaveThumbnail: (croppedImageUrl: string | null) => Promise<void> | void;
  onSelectBuildChatUploadFile: (file: File) => void;
  onSelectBuildChatUploadFiles: (files: File[]) => void;
  onSubmitBuildMetadata: (args: {
    title: string;
    description: string;
  }) => Promise<void> | void;
}

export default function Modals({
  build,
  buildChatDraftMessage,
  buildChatUploadFileObj,
  buildChatUploadModalShown,
  canEditMetadata,
  canShowLumineChatVisibilitySetting,
  buildDescription,
  buildTitle,
  collaborationSettingsModalShown,
  descriptionModalShown,
  isOwner,
  savingDescription,
  savingThumbnail,
  thumbnailInitialImageUrl,
  thumbnailModalShown,
  thumbnailSaveError,
  onCaptureThumbnailFromPreview,
  onCompleteBuildChatUpload,
  onCustomUploadSubmit,
  onHideBuildChatUploadFileModal,
  onHideBuildChatUploadModal,
  onHideCollaborationSettingsModal,
  onHideDescriptionModal,
  onHideThumbnailModal,
  onBuildCollaborationPatch,
  onSaveThumbnail,
  onSelectBuildChatUploadFile,
  onSelectBuildChatUploadFiles,
  onSubmitBuildMetadata
}: ModalsProps) {
  return (
    <>
      {isOwner && buildChatUploadModalShown ? (
        <UploadModal
          isOpen
          multiple
          allowMultipleGenericFileSelection
          onHide={onHideBuildChatUploadModal}
          onFileSelect={onSelectBuildChatUploadFile}
          onFilesSelect={onSelectBuildChatUploadFiles}
        />
      ) : null}
      {isOwner && buildChatUploadFileObj ? (
        <UploadFileModal
          initialCaption={buildChatDraftMessage}
          fileObj={buildChatUploadFileObj}
          onEmbed={() => {}}
          onScrollToBottom={() => {}}
          onCustomUploadSubmit={onCustomUploadSubmit}
          onUpload={onCompleteBuildChatUpload}
          onHide={onHideBuildChatUploadFileModal}
        />
      ) : null}
      {descriptionModalShown && canEditMetadata ? (
        <BuildDescriptionModal
          initialTitle={buildTitle}
          initialDescription={buildDescription}
          loading={savingDescription}
          onHide={onHideDescriptionModal}
          onSubmit={onSubmitBuildMetadata}
        />
      ) : null}
      {collaborationSettingsModalShown && isOwner ? (
        <BuildCollaborationSettingsModal
          build={build}
          canShowLumineChatVisibilitySetting={
            canShowLumineChatVisibilitySetting
          }
          onBuildPatch={onBuildCollaborationPatch}
          onHide={onHideCollaborationSettingsModal}
        />
      ) : null}
      {thumbnailModalShown && isOwner ? (
        <BuildThumbnailModal
          initialImageUrl={thumbnailInitialImageUrl}
          loading={savingThumbnail}
          saveError={thumbnailSaveError}
          onHide={onHideThumbnailModal}
          onSave={onSaveThumbnail}
          onCaptureFromPreview={onCaptureThumbnailFromPreview}
        />
      ) : null}
    </>
  );
}
