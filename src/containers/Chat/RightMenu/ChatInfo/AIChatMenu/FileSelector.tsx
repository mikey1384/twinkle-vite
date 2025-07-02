import React, { useContext, useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { FileData } from '~/types';
import LocalContext from '~/containers/Chat/Context';
import Icon from '~/components/Icon';
import ConfirmModal from '~/components/Modals/ConfirmModal';

export default function FileSelector({
  channelId,
  topicId,
  files = [],
  isTopic,
  hasMore
}: {
  channelId: number;
  topicId: number;
  files: FileData[];
  isTopic: boolean;
  hasMore: boolean;
}) {
  const {
    actions: { onSetReplyTarget }
  } = useContext(LocalContext);
  const { userId, username } = useKeyContext((v) => v.myState);
  const deleteAIChatFile = useAppContext(
    (v) => v.requestHelpers.deleteAIChatFile
  );
  const loadAIChatFiles = useAppContext(
    (v) => v.requestHelpers.loadAIChatFiles
  );
  const onDeleteAIChatFile = useChatContext(
    (v) => v.actions.onDeleteAIChatFile
  );
  const onLoadMoreAIChatFiles = useChatContext(
    (v) => v.actions.onLoadMoreAIChatFiles
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const [fileToDelete, setFileToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    if (scrollContainerRef.current && !loadingMoreRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [files]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    async function handleScroll() {
      if (!hasMore || isLoadingRef.current) return;
      if (scrollContainer?.scrollTop === 0) {
        isLoadingRef.current = true;
        loadingMoreRef.current = true;
        prevScrollHeightRef.current = scrollContainer.scrollHeight;

        try {
          const { files: newFiles, fileDataObj } = await loadAIChatFiles({
            channelId,
            lastFileLastUsed: files[files.length - 1]?.lastUsed
          });
          onLoadMoreAIChatFiles({
            channelId,
            topicId,
            files: newFiles,
            fileDataObj
          });

          if (scrollContainer) {
            setTimeout(() => {
              const newScrollHeight = scrollContainer.scrollHeight;
              const heightDifference =
                newScrollHeight - prevScrollHeightRef.current;
              scrollContainer.scrollTop = heightDifference;
              loadingMoreRef.current = false;
            }, 10);
          }

          isLoadingRef.current = false;
        } catch (error) {
          console.error(error);
          isLoadingRef.current = false;
          loadingMoreRef.current = false;
        }
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, files, channelId, topicId]);

  return (
    <div
      className={css`
        border-top: 1px solid ${Color.borderGray()};
        padding: 1rem 0;
        width: 100%;
      `}
    >
      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        `}
      >
        <h3
          className={css`
            font-size: 1.4rem;
            color: #333;
          `}
        >
          <Icon icon="folder-open" />
          <span style={{ marginLeft: '0.7rem' }}>Files</span>
          {files.length > 0 && (
            <span
              className={css`
                font-size: 0.9rem;
                color: #666;
                font-weight: normal;
                margin-left: 0.5rem;
              `}
            >
              ({files.length} file{files.length !== 1 ? 's' : ''})
            </span>
          )}
        </h3>
      </div>
      <div
        className={css`
          margin-top: 1rem;
          margin-bottom: 1rem;
        `}
      >
        <div
          ref={scrollContainerRef}
          className={css`
            background: #000;
            border: 1px solid ${Color.borderGray()};
            padding: 0.5rem;
            height: 100px;
            overflow-y: auto;
            font-family: 'Courier New', Courier, monospace;
            color: #00ff00;
            font-size: 1.1rem;
          `}
        >
          {files.length === 0 ? (
            <div
              className={css`
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #00cc00;
              `}
            >
              No files uploaded {isTopic ? 'for this topic' : ''}
            </div>
          ) : (
            files.map((file, index) => {
              const displayedFileName = file.actualFileName || file.fileName;
              const isMostRecentlyUsed = index === files.length - 1;
              const isRecentlyUsed =
                files.length > 1 && index >= files.length - 3; // Highlight top 3 most recent

              return (
                <div
                  key={index}
                  className={css`
                    padding: 0.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: relative;
                    ${isMostRecentlyUsed
                      ? `
                      background: #002200;
                      font-weight: bold;
                      border-left: 3px solid #00ff00;
                    `
                      : isRecentlyUsed
                      ? `
                      background: #001100;
                      border-left: 1px solid #00aa00;
                    `
                      : ''}
                    &:hover {
                      background: #003300;
                    }
                  `}
                >
                  <span
                    onClick={() => handleFileSelect(file)}
                    className={css`
                      cursor: pointer;
                      flex-grow: 1;
                      display: flex;
                      align-items: center;
                      &:hover {
                        color: #00ff00;
                      }
                    `}
                  >
                    {isMostRecentlyUsed && (
                      <span
                        className={css`
                          color: #00ff00;
                          margin-right: 0.5rem;
                          font-weight: bold;
                        `}
                      >
                        ●
                      </span>
                    )}
                    {`> ${displayedFileName}`}
                    {isMostRecentlyUsed && (
                      <span
                        className={css`
                          color: #00aa00;
                          margin-left: 0.5rem;
                          font-size: 0.9rem;
                        `}
                      >
                        [ACTIVE]
                      </span>
                    )}
                  </span>
                  <span
                    className={css`
                      transition: opacity 0.2s;
                      margin-left: 1rem;
                      color: #00aa00;
                    `}
                  >
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileToDelete({
                          id: file.id,
                          name: displayedFileName
                        });
                      }}
                      className={css`
                        cursor: pointer;
                        &:hover {
                          color: #00ff00;
                        }
                      `}
                    >
                      [x]
                    </span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
      {fileToDelete && (
        <ConfirmModal
          onHide={() => setFileToDelete(null)}
          title={`Delete file: ${fileToDelete.name}`}
          onConfirm={async () => {
            await handleFileDelete(fileToDelete.id);
            setFileToDelete(null);
          }}
        />
      )}
    </div>
  );

  async function handleFileDelete(fileId: number) {
    try {
      await deleteAIChatFile(fileId);
      onDeleteAIChatFile({
        channelId,
        topicId,
        fileId
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function handleFileSelect(file: FileData) {
    onSetReplyTarget({
      channelId,
      target: {
        id: file.messageId,
        userId,
        username,
        fileName: file.fileName,
        filePath: file.filePath,
        content: file.messageContent,
        timeStamp: file.timeStamp
      }
    });
  }
}
