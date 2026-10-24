import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useNotiContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { ARENA } from './theme';

// Train: everything that is not a real fight. AI Story is here unchanged;
// fight review, untimed retakes and boss prep join as Arena's fights arrive.
export default function Train({
  onPlayAIStory
}: {
  onPlayAIStory: () => void;
}) {
  const aiStoryTask = useNotiContext(
    (v) => v.state.todayStats?.dailyTaskStatus?.aiStory
  );

  return (
    <div className={wrapCls}>
      <button type="button" className={rowCls} onClick={onPlayAIStory}>
        <span className={badgeCls} style={{ background: ARENA.sky }}>
          <Icon icon="book-open" />
        </span>
        <span className={textCls}>
          <strong>AI Story</strong>
          <span>
            Read or listen to a story at your level, then answer its
            questions.
          </span>
        </span>
        <span className={statusCls}>
          {aiStoryTask?.isPassed ? (
            <>
              <Icon icon="check" /> Cleared today
            </>
          ) : (
            'Play'
          )}
          <Icon icon="chevron-right" />
        </span>
      </button>

      <div className={rowCls} aria-disabled="true">
        <span className={badgeCls} style={{ background: ARENA.violet }}>
          <Icon icon="redo" />
        </span>
        <span className={textCls}>
          <strong>Review your fights</strong>
          <span>
            Every fight you finish in the Arena shows up here, question by
            question, with an untimed retake.
          </span>
        </span>
        <span className={mutedCls}>No fights yet</span>
      </div>
    </div>
  );
}

const wrapCls = css`
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const rowCls = css`
  display: flex;
  align-items: center;
  gap: 1.4rem;
  width: 100%;
  padding: 1.2rem 1.4rem;
  text-align: left;
  background: ${ARENA.paper};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 3px 3px 0 ${ARENA.line};
  color: ${ARENA.ink};
  font: inherit;
  &:is(button) {
    cursor: pointer;
  }
  &:is(button):hover {
    transform: translate(-1px, -1px);
  }
  &[aria-disabled='true'] {
    box-shadow: none;
    border-style: dashed;
  }
  @media (max-width: ${mobileMaxWidth}) {
    flex-wrap: wrap;
    gap: 1rem;
  }
`;

const badgeCls = css`
  flex-shrink: 0;
  width: 4.6rem;
  height: 4.6rem;
  border: 3px solid ${ARENA.line};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 2rem;
`;

const textCls = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  strong {
    font-size: 1.7rem;
    font-weight: 800;
  }
  span {
    font-size: 1.35rem;
    line-height: 1.45;
    color: ${ARENA.inkSoft};
  }
`;

const statusCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.35rem;
  font-weight: 800;
  white-space: nowrap;
`;

const mutedCls = css`
  font-size: 1.3rem;
  font-weight: 600;
  color: ${ARENA.inkSoft};
  white-space: nowrap;
`;
