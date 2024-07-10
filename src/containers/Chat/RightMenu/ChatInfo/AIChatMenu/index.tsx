import React, { useMemo, useState } from 'react';
import EditMemoryInstructionsModal from './EditMemoryInstructionsModal';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { capitalize } from '~/helpers/stringHelpers';

const defaultMemoryInstructions = 'any important information the user shares';

export default function AIChatMenu({
  channelId,
  topicId,
  isZeroChat,
  isCielChat,
  settings
}: {
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
        height: CALC(100% - 30rem);
        border-top: 1px solid ${Color.borderGray()};
        padding: 1rem;
        background-color: #fff;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        max-width: 300px;
        margin: 0 auto;
        word-wrap: break-word; /* Ensures long words break to fit within the container */
        overflow-wrap: break-word; /* Ensures long words break to fit within the container */
      `}
    >
      <div
        className={css`
          margin-bottom: 1.5rem;
        `}
      >
        <div
          className={css`
            display: flex;
            justify-content: space-between;
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
            height: 3.5rem;
            overflow-y: auto;
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
          margin-bottom: 1.5rem;
        `}
      >
        <div
          className={css`
            display: flex;
            justify-content: space-between;
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
            height: 8.5rem;
            overflow-y: auto;
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
          height: CALC(100% - 16rem);
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
            height: 100%;
            overflow-y: auto;
          `}
        >
          <li
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
            Chat 1: [Generated title]
          </li>
          <li
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
            Chat 2: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          <li
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
            Chat 3: [Generated title]
          </li>
          {/* Add more mockup history items as needed */}
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
