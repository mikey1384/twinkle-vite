import React, { useMemo, useState } from 'react';
import EditMemoryInstructionsModal from './EditMemoryInstructionsModal';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { capitalize } from '~/helpers/stringHelpers';

const defaultMemoryInstructions = 'any important information the user shares';

export default function AIChatMenu({
  bookmarkedMessages,
  channelId,
  topicId,
  isZeroChat,
  isCielChat,
  settings
}: {
  bookmarkedMessages: any[];
  channelId: number;
  topicId: number;
  isZeroChat: boolean;
  isCielChat: boolean;
  settings: {
    memoryInstructions?: string;
    aiMemory?: string;
  };
}) {
  const { memoryInstructions = defaultMemoryInstructions, aiMemory = {} } =
    settings;
  const appliedAIMemory = useMemo(() => {
    if (Object.keys(aiMemory).length === 0) return 'No memory saved yet';
    return JSON.stringify(aiMemory);
  }, [aiMemory]);
  const aiName = useMemo(
    () => (isZeroChat ? 'Zero' : isCielChat ? 'Ciel' : 'AI'),
    [isZeroChat, isCielChat]
  );
  const capitalizedMemoryInstructions = useMemo(
    () => capitalize(memoryInstructions),
    [memoryInstructions]
  );
  const [
    isEditMemoryInstructionsModalShown,
    setIsEditMemoryInstructionsModalShown
  ] = useState(false);

  return (
    <div
      className={css`
        height: CALC(100% - 21rem);
        border-top: 1px solid ${Color.borderGray()};
        padding: 1rem 1rem 0 1rem;
        background-color: #fff;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        max-width: 300px;
        margin: 0 auto;
        display: grid;
        grid-template-rows: auto auto 1fr;
        gap: 1rem;
      `}
    >
      <div
        className={css`
          display: grid;
          grid-template-rows: auto 1fr;
          overflow: hidden;
        `}
      >
        <div
          className={css`
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            margin-bottom: 0.5rem;
            border-bottom: 1px solid ${Color.borderGray()};
            padding-bottom: 0.5rem;
          `}
        >
          <h3
            className={css`
              font-size: 1.4rem;
              color: #333;
              white-space: normal;
            `}
          >
            Things {aiName} remembers
          </h3>
          <button
            className={css`
              background: none;
              border: none;
              color: #007bff;
              cursor: pointer;
              font-size: 1rem;
              &:hover {
                text-decoration: underline;
              }
            `}
            onClick={() => setIsEditMemoryInstructionsModalShown(true)}
          >
            Edit
          </button>
        </div>
        <div
          className={css`
            overflow-y: auto;
            height: 3.5rem;
          `}
        >
          <p
            className={css`
              font-size: 1rem;
              color: #666;
              line-height: 1.5;
              white-space: normal;
            `}
          >
            {capitalizedMemoryInstructions}
          </p>
        </div>
      </div>
      <div
        className={css`
          display: grid;
          grid-template-rows: auto 1fr;
          overflow: hidden;
        `}
      >
        <div
          className={css`
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            margin-bottom: 0.5rem;
            border-bottom: 1px solid ${Color.borderGray()};
            padding-bottom: 0.5rem;
          `}
        >
          <h3
            className={css`
              font-size: 1.4rem;
              color: #333;
              white-space: normal;
            `}
          >
            {`${aiName}'s Memory`}
          </h3>
          <button
            className={css`
              background: none;
              border: none;
              color: #007bff;
              cursor: pointer;
              font-size: 1rem;
              &:hover {
                text-decoration: underline;
              }
            `}
            onClick={() => {
              // Implement your edit logic here
              alert('Edit "Memory"');
            }}
          >
            Edit
          </button>
        </div>
        <div
          className={css`
            overflow-y: auto;
            height: 7.5rem;
          `}
        >
          <p
            className={css`
              font-size: 1rem;
              color: #666;
              line-height: 1.5;
              white-space: normal;
            `}
          >
            {appliedAIMemory}
          </p>
        </div>
      </div>
      <div
        className={css`
          display: grid;
          grid-template-rows: auto 1fr;
          overflow: hidden;
        `}
      >
        <h3
          className={css`
            font-size: 1.4rem;
            margin-bottom: 0.5rem;
            color: #333;
            border-bottom: 1px solid ${Color.borderGray()};
            padding-bottom: 0.5rem;
            white-space: normal;
          `}
        >
          <Icon icon="bookmark" />
          <span style={{ marginLeft: '0.7rem' }}>Bookmarks</span>
        </h3>
        <ul
          className={css`
            list-style: none;
            padding: 0;
            white-space: normal;
            overflow-y: auto;
            margin: 0;
          `}
        >
          {bookmarkedMessages.map((message, index) => (
            <li
              key={index}
              className={css`
                font-size: 1rem;
                color: #666;
                margin-bottom: 0.5rem;
                cursor: pointer;
                white-space: normal;
                &:hover {
                  color: #000;
                }
              `}
            >
              {message.content.length > 100
                ? `${message.content.slice(0, 100)}...`
                : message.content}
            </li>
          ))}
        </ul>
      </div>
      {isEditMemoryInstructionsModalShown && (
        <EditMemoryInstructionsModal
          channelId={channelId}
          topicId={topicId}
          memoryInstructions={capitalizedMemoryInstructions}
          onHide={() => setIsEditMemoryInstructionsModalShown(false)}
        />
      )}
    </div>
  );
}
