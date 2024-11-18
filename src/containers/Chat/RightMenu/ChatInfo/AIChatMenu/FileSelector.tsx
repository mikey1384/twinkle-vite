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
  isTopic
}: {
  channelId: number;
  topicId: number;
  files: FileData[];
  isTopic: boolean;
}) {
  const {
    actions: { onSetReplyTarget }
  } = useContext(LocalContext);
  const { userId, username } = useKeyContext((v) => v.myState);
  const deleteAIChatFile = useAppContext(
    (v) => v.requestHelpers.deleteAIChatFile
  );
  const onDeleteAIChatFile = useChatContext(
    (v) => v.actions.onDeleteAIChatFile
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [fileToDelete, setFileToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [files]);

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
              return (
                <div
                  key={index}
                  className={css`
                    padding: 0.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    ${index === files.length - 1
                      ? `
                      background: #002200;
                      font-weight: bold;
                    `
                      : ''}
                    &:hover {
                      background: #003300;
                    }
                  `}
                >
                  <>
                    <span
                      onClick={() => handleFileSelect(file)}
                      className={css`
                        cursor: pointer;
                        flex-grow: 1;
                      `}
                    >
                      {`> ${displayedFileName}`}
                    </span>
                    <span
                      className={css`
                        opacity: 0;
                        transition: opacity 0.2s;
                        margin-left: 1rem;
                        color: #00aa00;
                        div:hover & {
                          opacity: 1;
                        }
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
                  </>
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

  function handleFileSelect(file: FileData) {
    onSetReplyTarget({
      channelId,
      target: {
        id: file.messageId,
        userId,
        username,
        fileName: file.fileName,
        content: file.messageContent,
        timeStamp: file.timeStamp
      }
    });
  }
}
