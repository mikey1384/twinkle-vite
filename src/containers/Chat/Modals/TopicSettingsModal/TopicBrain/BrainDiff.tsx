import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { diffTopicBrainLines, foldTopicBrainDiff } from '~/helpers/topicBrain';

// What changes between two texts, line by line: added lines marked "+" on
// green, removed lines marked "−" and struck through, and long stretches
// that stay the same folded into one quiet line, so the change is what the
// member sees. With nothing before, the new text is shown as it is.
export default function BrainDiff({
  before,
  after,
  emptyLabel = 'Nothing here.'
}: {
  before: string;
  after: string;
  emptyLabel?: string;
}) {
  const rows = useMemo(
    () => foldTopicBrainDiff(diffTopicBrainLines(before, after)),
    [before, after]
  );
  if (!before && !after) {
    return <p className={emptyCls}>{emptyLabel}</p>;
  }
  return (
    <div className={boxCls}>
      {rows.map((line, index) =>
        line.type === 'skipped' ? (
          <div key={index} className={skippedCls}>
            {line.count} lines stay the same
          </div>
        ) : (
          <div key={index} className={lineCls} data-type={line.type}>
            <span className="mark" aria-hidden>
              {line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ''}
            </span>
            <span className="sr">
              {line.type === 'added'
                ? 'Added: '
                : line.type === 'removed'
                  ? 'Removed: '
                  : ''}
            </span>
            <span className="text">{line.text || ' '}</span>
          </div>
        )
      )}
    </div>
  );
}

const emptyCls = css`
  margin: 0;
  color: #526176;
  font-size: calc(14 * var(--px));
`;

const boxCls = css`
  max-height: min(46vh, 360px);
  overflow-y: auto;
  padding: 8px 0;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  color: #273449;
  font-size: calc(15 * var(--px));
  line-height: 1.55;
  text-align: left;
`;

const skippedCls = css`
  padding: 2px 12px 2px 26px;
  color: #64748b;
  font-size: calc(14 * var(--px));
  font-style: italic;
`;

const lineCls = css`
  display: flex;
  gap: 6px;
  padding: 1px 12px 1px 6px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  .mark {
    flex: 0 0 14px;
    font-weight: 700;
    text-align: center;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .text {
    min-width: 0;
  }
  &[data-type='added'] {
    background: #e7f6ec;
    color: #14532d;
  }
  &[data-type='removed'] {
    background: #fdecea;
    color: #7f1d1d;
    .text {
      text-decoration: line-through;
    }
  }
`;
