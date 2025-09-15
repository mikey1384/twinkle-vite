import { css } from '@emotion/css';
import React from 'react';
import { Color } from '~/constants/css';
import WordLog from './WordLog';
import { useChatContext } from '~/contexts';

interface QuizBatch {
  id: number;
  title: string;
  createdAt: number;
  questionCount: number;
  status?: string;
}

export default function Backdrop({
  quizBatches,
  onSelectBatch,
  activeBatchId
}: {
  quizBatches: QuizBatch[];
  onSelectBatch?: (batch: QuizBatch | null) => void;
  activeBatchId?: number | null;
}) {
  const wordLogs = useChatContext((v) => v.state.wordLogs);

  const handleSelect = React.useCallback(
    (batch: QuizBatch) => {
      if (!onSelectBatch) return;
      if (Number(activeBatchId) === Number(batch?.id)) {
        onSelectBatch(null);
      } else {
        onSelectBatch(batch);
      }
    },
    [activeBatchId, onSelectBatch]
  );

  return (
    <div
      className={css`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        gap: 1rem;
        background: ${Color.black()};
        color: #fff;
        z-index: 0;
        padding: 1rem 1.2rem;
        box-sizing: border-box;
      `}
    >
      <div
        className={css`
          flex: 1;
          overflow-y: auto;
          padding-right: 0.5rem;
        `}
      >
        {wordLogs.map((entry: any) => (
          <WordLog key={entry.id} entry={entry} />
        ))}
      </div>
      <div
        className={css`
          width: 17rem;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          border-left: 1px solid ${Color.darkerGray(0.6)};
          padding-left: 1rem;
          overflow: hidden;
        `}
      >
        <div
          className={css`
            font-size: 1.2rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: ${Color.lighterGray()};
            margin-bottom: 0.6rem;
          `}
        >
          Quiz Batches
        </div>
        <div
          className={css`
            overflow-y: auto;
            flex: 1;
            padding-right: 0.5rem;
          `}
        >
          {quizBatches?.length ? (
            quizBatches.map((batch) => (
              <button
                key={batch.id}
                className={css`
                  width: 100%;
                  border: none;
                  background: none;
                  padding: 0;
                  text-align: left;
                  margin-bottom: 0.6rem;
                  cursor: pointer;
                `}
                onClick={() => handleSelect(batch)}
              >
                <div
                  className={css`
                    border-radius: 0.6rem;
                    padding: 0.75rem;
                    background: ${Number(activeBatchId) === Number(batch.id)
                      ? Color.green(0.85)
                      : Color.darkerGray(0.55)};
                    color: ${Number(activeBatchId) === Number(batch.id)
                      ? '#fff'
                      : Color.lighterGray()};
                    box-shadow: inset 0 0 0 1px ${Color.darkerGray(0.35)};
                    transition: all 0.2s;
                  `}
                >
                  <div
                    className={css`
                      font-size: 1.25rem;
                      font-weight: 600;
                      margin-bottom: 0.3rem;
                    `}
                  >
                    {batch.title}
                  </div>
                  <div
                    className={css`
                      font-size: 1rem;
                      opacity: 0.8;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                    `}
                  >
                    <span>{batch.questionCount} questions</span>
                    <span>
                      {batch.createdAt
                        ? new Date(batch.createdAt * 1000).toLocaleTimeString(
                            [],
                            {
                              hour: '2-digit',
                              minute: '2-digit'
                            }
                          )
                        : '--:--'}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div
              className={css`
                font-size: 1rem;
                color: ${Color.darkerGray(0.7)};
              `}
            >
              No pending batches yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
