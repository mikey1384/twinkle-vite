import React from 'react';
import { css } from '@emotion/css';
import { BUILD_PROJECT_ASSET_UPLOAD_ACCEPT } from './agentWorkspaceAssets';
import { BUILD_PROJECT_UPLOAD_ACCEPT } from './previewHelpers';

export default function ProjectFileInputs({
  projectAssetInputRef,
  projectFileInputRef,
  projectFolderInputRef,
  onImportProjectFolder,
  onUploadProjectAssets,
  onUploadProjectFiles
}: {
  projectAssetInputRef: React.RefObject<HTMLInputElement | null>;
  projectFileInputRef: React.RefObject<HTMLInputElement | null>;
  projectFolderInputRef: React.RefObject<HTMLInputElement | null>;
  onImportProjectFolder: (fileList: FileList | null) => void;
  onUploadProjectAssets: (fileList: FileList | null) => void;
  onUploadProjectFiles: (fileList: FileList | null) => void;
}) {
  return (
    <>
      <input
        ref={projectFileInputRef}
        type="file"
        multiple
        accept={BUILD_PROJECT_UPLOAD_ACCEPT}
        className={css`
          display: none;
        `}
        onChange={(event) => {
          onUploadProjectFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <input
        ref={projectFolderInputRef}
        type="file"
        multiple
        className={css`
          display: none;
        `}
        onChange={(event) => {
          onImportProjectFolder(event.target.files);
          event.target.value = '';
        }}
      />
      <input
        ref={projectAssetInputRef}
        type="file"
        multiple
        accept={BUILD_PROJECT_ASSET_UPLOAD_ACCEPT}
        className={css`
          display: none;
        `}
        onChange={(event) => {
          onUploadProjectAssets(event.target.files);
          event.target.value = '';
        }}
      />
    </>
  );
}
