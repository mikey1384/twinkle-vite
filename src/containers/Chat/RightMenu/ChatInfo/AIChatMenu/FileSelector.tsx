import React, { useContext, useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import LocalContext from '~/containers/Chat/Context';
import Icon from '~/components/Icon';
import { useKeyContext } from '~/contexts';
import { FileData } from '~/types';

export default function FileSelector({
  channelId,
  files = [],
  isTopic
}: {
  channelId: number;
  files: FileData[];
  isTopic: boolean;
}) {
  const {
    actions: { onSetReplyTarget }
  } = useContext(LocalContext);
  const { userId, username } = useKeyContext((v) => v.myState);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
            files.map((file, index) => (
              <div
                key={index}
                onClick={() => handleFileSelect(file)}
                className={css`
                  padding: 0.2rem;
                  cursor: pointer;
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
                {`> ${file.actualFileName || file.fileName}`}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

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
