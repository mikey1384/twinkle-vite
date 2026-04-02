import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import CodeDiff from '~/components/CodeDiff';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { getFileNameFromPath, isIndexHtmlPath } from './projectFiles';
import type { EditableProjectFile, ProjectExplorerEntry } from './types';

interface CodeWorkspacePaneProps {
  displayedProjectFiles: EditableProjectFile[];
  projectExplorerEntries: ProjectExplorerEntry[];
  selectedFolderPath: string | null;
  folderMoveTargetPath: string;
  projectFileUploadAccept: string;
  newFilePath: string;
  activeFilePath: string;
  activeFile: EditableProjectFile | null;
  renamePathInput: string;
  isOwner: boolean;
  isShowingStreamingCode: boolean;
  hasUnsavedProjectFileChanges: boolean;
  savingProjectFiles: boolean;
  projectFileError: string;
  streamingAutoFollowEnabled: boolean;
  persistedFileContentByPath: Map<string, string>;
  onNewFilePathChange: (value: string) => void;
  onAddProjectFile: () => void;
  onOpenProjectFileUploadPicker: () => void;
  onImportProjectFolder: (files: FileList | null) => void;
  onFolderMoveTargetPathChange: (value: string) => void;
  onMoveSelectedFolder: () => void;
  onSelectFolder: (path: string) => void;
  onToggleFolderCollapsed: (path: string) => void;
  onSelectFile: (path: string) => void;
  onDeleteProjectFile: (path: string) => void;
  onRenamePathInputChange: (value: string) => void;
  onRenameOrMoveActiveFile: () => void;
  onSaveEditableProjectFiles: () => void;
  onActiveFileContentChange: (value: string) => void;
}

export default function CodeWorkspacePane({
  displayedProjectFiles,
  projectExplorerEntries,
  selectedFolderPath,
  folderMoveTargetPath,
  projectFileUploadAccept,
  newFilePath,
  activeFilePath,
  activeFile,
  renamePathInput,
  isOwner,
  isShowingStreamingCode,
  hasUnsavedProjectFileChanges,
  savingProjectFiles,
  projectFileError,
  streamingAutoFollowEnabled,
  persistedFileContentByPath,
  onNewFilePathChange,
  onAddProjectFile,
  onOpenProjectFileUploadPicker,
  onImportProjectFolder,
  onFolderMoveTargetPathChange,
  onMoveSelectedFolder,
  onSelectFolder,
  onToggleFolderCollapsed,
  onSelectFile,
  onDeleteProjectFile,
  onRenamePathInputChange,
  onRenameOrMoveActiveFile,
  onSaveEditableProjectFiles,
  onActiveFileContentChange
}: CodeWorkspacePaneProps) {
  const projectFolderInputRef = React.useRef<HTMLInputElement | null>(null);
  const persistedActiveFileContent = activeFile
    ? persistedFileContentByPath.get(activeFile.path) || ''
    : '';
  const activeFileExistsInPersistedState = activeFile
    ? persistedFileContentByPath.has(activeFile.path)
    : false;
  const activeFileHasStreamingDiff = activeFile
    ? persistedActiveFileContent !== activeFile.content
    : false;

  React.useEffect(() => {
    const folderInput = projectFolderInputRef.current;
    if (!folderInput) return;
    folderInput.setAttribute('webkitdirectory', '');
    folderInput.setAttribute('directory', '');
  }, []);

  return (
    <div
      className={css`
        height: 100%;
        min-height: 0;
        display: grid;
        grid-template-columns: 280px 1fr;
        background: #111827;
        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 1fr;
          grid-template-rows: 220px 1fr;
        }
      `}
    >
      <div
        className={css`
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          background: #0b1220;
          min-height: 0;
          display: flex;
          flex-direction: column;
          @media (max-width: ${mobileMaxWidth}) {
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
        `}
      >
        <div
          className={css`
            padding: 0.7rem 0.8rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            color: #e5e7eb;
            font-size: 0.75rem;
            letter-spacing: 0.02em;
            text-transform: uppercase;
            font-weight: 800;
          `}
        >
          <span>Project files</span>
          <span>{displayedProjectFiles.length}</span>
        </div>
        {isOwner && !isShowingStreamingCode && (
          <div
            className={css`
              padding: 0.6rem 0.65rem;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08);
              display: flex;
              gap: 0.4rem;
              flex-wrap: wrap;
            `}
          >
            <input
              value={newFilePath}
              onChange={(e) => onNewFilePathChange(e.target.value)}
              placeholder="/src/app.js"
              className={css`
                flex: 1;
                min-width: 0;
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 8px;
                background: rgba(17, 24, 39, 0.8);
                color: #e5e7eb;
                padding: 0.45rem 0.5rem;
                font-size: 0.75rem;
                &:focus {
                  outline: none;
                  border-color: rgba(65, 140, 235, 0.8);
                }
              `}
            />
            <button
              type="button"
              onClick={onAddProjectFile}
              className={css`
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 8px;
                background: rgba(65, 140, 235, 0.18);
                color: #dbeafe;
                padding: 0.4rem 0.55rem;
                cursor: pointer;
                font-size: 0.75rem;
                font-weight: 700;
                &:hover {
                  background: rgba(65, 140, 235, 0.3);
                }
              `}
              aria-label="Add file"
              title="Add file"
            >
              <Icon icon="plus" />
            </button>
            <button
              type="button"
              onClick={onOpenProjectFileUploadPicker}
              className={css`
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 8px;
                background: rgba(148, 163, 184, 0.16);
                color: #e5e7eb;
                padding: 0.4rem 0.6rem;
                cursor: pointer;
                font-size: 0.75rem;
                font-weight: 700;
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                white-space: nowrap;
                &:hover {
                  background: rgba(148, 163, 184, 0.26);
                }
              `}
              aria-label="Upload files"
              title="Upload flat files into the project explorer"
            >
              <Icon icon="upload" />
              <span>Files</span>
            </button>
            <input
              ref={projectFolderInputRef}
              type="file"
              multiple
              accept={projectFileUploadAccept}
              className={css`
                display: none;
              `}
              onChange={(e) => {
                onImportProjectFolder(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => projectFolderInputRef.current?.click()}
              className={css`
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 8px;
                background: rgba(148, 163, 184, 0.16);
                color: #e5e7eb;
                padding: 0.4rem 0.6rem;
                cursor: pointer;
                font-size: 0.75rem;
                font-weight: 700;
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                white-space: nowrap;
                &:hover {
                  background: rgba(148, 163, 184, 0.26);
                }
              `}
              aria-label="Import folder"
              title="Import a project folder and preserve nested paths"
            >
              <Icon icon="folder-open" />
              <span>Folder</span>
            </button>
          </div>
        )}
        {isOwner && !isShowingStreamingCode && (
          <div
            className={css`
              padding: 0.55rem 0.7rem;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08);
              display: flex;
              flex-direction: column;
              gap: 0.45rem;
            `}
          >
            {selectedFolderPath && (
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.4rem;
                `}
              >
                <input
                  value={folderMoveTargetPath}
                  onChange={(e) => onFolderMoveTargetPathChange(e.target.value)}
                  placeholder="/new/folder/path"
                  className={css`
                    flex: 1;
                    min-width: 0;
                    border: 1px solid rgba(255, 255, 255, 0.16);
                    border-radius: 8px;
                    background: rgba(17, 24, 39, 0.82);
                    color: #e5e7eb;
                    padding: 0.42rem 0.5rem;
                    font-size: 0.72rem;
                  `}
                />
                <button
                  type="button"
                  onClick={onMoveSelectedFolder}
                  className={css`
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    border-radius: 8px;
                    background: rgba(34, 197, 94, 0.2);
                    color: #bbf7d0;
                    padding: 0.36rem 0.52rem;
                    font-size: 0.72rem;
                    font-weight: 700;
                    cursor: pointer;
                  `}
                  title={`Move folder ${selectedFolderPath}`}
                >
                  Move folder
                </button>
              </div>
            )}
          </div>
        )}
        <div
          className={css`
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 0.45rem;
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
          `}
        >
          {projectExplorerEntries.map((entry) => {
            if (entry.kind === 'folder') {
              const isSelected = selectedFolderPath === entry.path;
              return (
                <div
                  key={`folder-${entry.path}`}
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.28rem;
                  `}
                  style={{
                    marginLeft: `${entry.depth * 0.8}rem`
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onToggleFolderCollapsed(entry.path)}
                    className={css`
                      border: 1px solid rgba(255, 255, 255, 0.12);
                      border-radius: 8px;
                      background: rgba(148, 163, 184, 0.16);
                      color: #cbd5e1;
                      padding: 0.3rem 0.45rem;
                      font-size: 0.68rem;
                      cursor: pointer;
                    `}
                  >
                    {entry.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectFolder(entry.path)}
                    className={css`
                      flex: 1;
                      min-width: 0;
                      text-align: left;
                      border: 1px solid
                        ${isSelected
                          ? 'rgba(65, 140, 235, 0.7)'
                          : 'rgba(255, 255, 255, 0.08)'};
                      background: ${isSelected
                        ? 'rgba(65, 140, 235, 0.25)'
                        : 'rgba(148, 163, 184, 0.1)'};
                      color: #cbd5e1;
                      border-radius: 8px;
                      padding: 0.34rem 0.48rem;
                      cursor: pointer;
                      font-size: 0.74rem;
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      gap: 0.5rem;
                    `}
                    title={entry.path}
                  >
                    <span
                      className={css`
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                      `}
                    >
                      {entry.name}
                    </span>
                    <span>{entry.fileCount}</span>
                  </button>
                </div>
              );
            }

            const file = entry.file;
            const isActive = file.path === activeFilePath;
            const isDirty =
              !isShowingStreamingCode &&
              persistedFileContentByPath.get(file.path) !== file.content;
            const displayName = getFileNameFromPath(file.path);

            return (
              <div
                key={`file-${file.path}`}
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.3rem;
                  margin-left: ${(entry.depth + 1) * 0.8}rem;
                `}
              >
                <button
                  type="button"
                  onClick={() => onSelectFile(file.path)}
                  className={css`
                    flex: 1;
                    min-width: 0;
                    text-align: left;
                    border: 1px solid
                      ${isActive
                        ? 'rgba(65, 140, 235, 0.65)'
                        : 'rgba(255, 255, 255, 0.08)'};
                    background: ${isActive
                      ? 'rgba(65, 140, 235, 0.2)'
                      : 'rgba(17, 24, 39, 0.6)'};
                    color: ${isActive ? '#dbeafe' : '#e5e7eb'};
                    border-radius: 8px;
                    padding: 0.42rem 0.5rem;
                    cursor: pointer;
                    font-size: 0.76rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.45rem;
                  `}
                  title={file.path}
                >
                  <span
                    className={css`
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    `}
                  >
                    {displayName}
                  </span>
                  {isDirty && (
                    <span
                      className={css`
                        color: #fbbf24;
                        font-weight: 900;
                      `}
                      aria-label="Unsaved changes"
                      title="Unsaved changes"
                    >
                      •
                    </span>
                  )}
                </button>
                {isOwner &&
                  !isShowingStreamingCode &&
                  !isIndexHtmlPath(file.path) && (
                    <button
                      type="button"
                      onClick={() => onDeleteProjectFile(file.path)}
                      className={css`
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        background: rgba(239, 68, 68, 0.14);
                        color: #fecaca;
                        border-radius: 8px;
                        padding: 0.38rem 0.5rem;
                        cursor: pointer;
                        &:hover {
                          background: rgba(239, 68, 68, 0.24);
                        }
                      `}
                      title={`Delete ${file.path}`}
                    >
                      <Icon icon="trash-alt" />
                    </button>
                  )}
              </div>
            );
          })}
        </div>
      </div>
      <div
        className={css`
          position: relative;
          min-height: 0;
          display: grid;
          grid-template-rows: auto 1fr;
        `}
      >
        <div
          className={css`
            padding: 0.55rem 0.75rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
            background: #0f172a;
          `}
        >
          <div
            className={css`
              min-width: 0;
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 0.35rem;
            `}
          >
            <div
              className={css`
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                color: #e5e7eb;
                font-size: 0.8rem;
                font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
              `}
              title={activeFile?.path || '/index.html'}
            >
              {activeFile?.path || '/index.html'}
            </div>
            {isOwner && activeFile && !isShowingStreamingCode && (
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.4rem;
                `}
              >
                <input
                  value={renamePathInput}
                  onChange={(e) => onRenamePathInputChange(e.target.value)}
                  placeholder="/src/new-path.js"
                  className={css`
                    flex: 1;
                    min-width: 0;
                    border: 1px solid rgba(255, 255, 255, 0.16);
                    border-radius: 8px;
                    background: rgba(17, 24, 39, 0.85);
                    color: #e5e7eb;
                    padding: 0.3rem 0.45rem;
                    font-size: 0.72rem;
                    font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                    &:focus {
                      outline: none;
                      border-color: rgba(65, 140, 235, 0.8);
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={onRenameOrMoveActiveFile}
                  className={css`
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    border-radius: 8px;
                    background: rgba(65, 140, 235, 0.18);
                    color: #dbeafe;
                    padding: 0.3rem 0.55rem;
                    font-size: 0.72rem;
                    font-weight: 700;
                    cursor: pointer;
                    &:hover {
                      background: rgba(65, 140, 235, 0.3);
                    }
                  `}
                >
                  Move
                </button>
              </div>
            )}
          </div>
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.5rem;
              color: #e5e7eb;
              font-size: 0.72rem;
            `}
          >
            {isShowingStreamingCode ? (
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.45rem;
                  flex-wrap: wrap;
                  justify-content: flex-end;
                `}
              >
                <span
                  className={css`
                    color: #93c5fd;
                    font-weight: 700;
                  `}
                >
                  Lumine is writing...
                </span>
                {streamingAutoFollowEnabled && (
                  <span
                    className={css`
                      color: #cbd5e1;
                      opacity: 0.85;
                      font-size: 0.69rem;
                      font-weight: 700;
                      text-transform: uppercase;
                      letter-spacing: 0.03em;
                    `}
                  >
                    Following edits
                  </span>
                )}
              </div>
            ) : hasUnsavedProjectFileChanges ? (
              <span
                className={css`
                  color: #fbbf24;
                  font-weight: 700;
                `}
              >
                Unsaved
              </span>
            ) : (
              <span
                className={css`
                  color: #86efac;
                  font-weight: 700;
                `}
              >
                Saved
              </span>
            )}
            {isOwner && !isShowingStreamingCode && (
              <GameCTAButton
                variant="primary"
                size="sm"
                disabled={savingProjectFiles || !hasUnsavedProjectFileChanges}
                loading={savingProjectFiles}
                onClick={onSaveEditableProjectFiles}
              >
                {savingProjectFiles ? 'Saving...' : 'Save files'}
              </GameCTAButton>
            )}
          </div>
        </div>
        {activeFile ? (
          isShowingStreamingCode ? (
            <div
              className={css`
                height: 100%;
                min-height: 0;
                overflow: hidden;
                background: #111827;
                display: flex;
                flex-direction: column;
              `}
            >
              <div
                className={css`
                  padding: 0.7rem 1rem;
                  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 0.75rem;
                  flex-wrap: wrap;
                  background: rgba(15, 23, 42, 0.82);
                  color: #cbd5e1;
                  font-size: 0.74rem;
                `}
              >
                <span>
                  Showing live diff against the last saved
                  {activeFileExistsInPersistedState ? ' file' : ' version'}
                </span>
                <span
                  className={css`
                    color: #93c5fd;
                    font-weight: 700;
                  `}
                >
                  {activeFileHasStreamingDiff
                    ? 'Changed lines only'
                    : 'Waiting for file changes'}
                </span>
              </div>
              {activeFileHasStreamingDiff ? (
                <CodeDiff
                  oldCode={persistedActiveFileContent}
                  newCode={activeFile.content}
                  collapsible={false}
                  fullHeight={true}
                  className={css`
                    flex: 1;
                    min-height: 0;
                    border: none;
                    border-radius: 0;
                    background: #111827;
                  `}
                />
              ) : (
                <div
                  className={css`
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 0.82rem;
                    line-height: 1.5;
                  `}
                >
                  Lumine is still working on this file. The diff will appear
                  here as soon as changed lines arrive.
                </div>
              )}
            </div>
          ) : (
            <textarea
              value={activeFile.content}
              onChange={(e) => onActiveFileContentChange(e.target.value)}
              readOnly={!isOwner || isShowingStreamingCode}
              spellCheck={false}
              className={css`
                width: 100%;
                height: 100%;
                padding: 1rem;
                border: none;
                resize: none;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 0.85rem;
                line-height: 1.5;
                background: #111827;
                color: #d4d4d4;
                &:focus {
                  outline: none;
                }
              `}
            />
          )
        ) : (
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              color: #cbd5e1;
              background: #111827;
            `}
          >
            No file selected
          </div>
        )}
        {projectFileError && (
          <div
            className={css`
              position: absolute;
              right: 0.8rem;
              bottom: 0.8rem;
              background: rgba(239, 68, 68, 0.16);
              border: 1px solid rgba(239, 68, 68, 0.35);
              color: #fecaca;
              border-radius: 8px;
              padding: 0.45rem 0.6rem;
              font-size: 0.75rem;
              max-width: 28rem;
            `}
          >
            {projectFileError}
          </div>
        )}
      </div>
    </div>
  );
}
