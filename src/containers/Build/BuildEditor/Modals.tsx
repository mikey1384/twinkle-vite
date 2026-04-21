import React from 'react';
import UploadModal from '~/components/Modals/UploadModal';
import UploadFileModal from '~/containers/Chat/Modals/UploadFileModal';
import BuildDescriptionModal from '../BuildDescriptionModal';
import BuildThumbnailModal from './BuildThumbnailModal';

interface ModalsProps {
  buildChatDraftMessage: string;
  buildChatUploadFileObj: File | File[] | null;
  buildChatUploadModalShown: boolean;
  buildDescription: string | null;
  buildTitle: string;
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
  onHideDescriptionModal: () => void;
  onHideThumbnailModal: () => void;
  onSaveThumbnail: (croppedImageUrl: string | null) => Promise<void> | void;
  onSelectBuildChatUploadFile: (file: File) => void;
  onSelectBuildChatUploadFiles: (files: File[]) => void;
  onSubmitBuildMetadata: (args: {
    title: string;
    description: string;
  }) => Promise<void> | void;
}

export default function Modals({
  buildChatDraftMessage,
  buildChatUploadFileObj,
  buildChatUploadModalShown,
  buildDescription,
  buildTitle,
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
  onHideDescriptionModal,
  onHideThumbnailModal,
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
      {descriptionModalShown && isOwner ? (
        <BuildDescriptionModal
          initialTitle={buildTitle}
          initialDescription={buildDescription}
          loading={savingDescription}
          onHide={onHideDescriptionModal}
          onSubmit={onSubmitBuildMetadata}
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
