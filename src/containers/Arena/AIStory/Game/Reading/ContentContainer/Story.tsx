import React from 'react';
import ArenaButton from '../../../../ArenaButton';
import RichText from '~/components/Texts/RichText';
import { mobileMaxWidth } from '~/constants/css';
import { css, cx } from '@emotion/css';
import { ARENA } from '../../../../theme';

export default function Story({
  storyId,
  story,
  storyStreamComplete,
  isGraded,
  explanation,
  explanationStreamComplete,
  onFinishRead,
  questionsButtonEnabled
}: {
  storyId: number;
  story: string;
  storyStreamComplete: boolean;
  isGraded: boolean;
  explanation: string;
  explanationStreamComplete: boolean;
  onFinishRead: () => void;
  questionsButtonEnabled: boolean;
}) {
  return (
    <div
      className={css`
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
      `}
    >
      <div
        className={cx(
          sheetCls,
          css`
            user-select: ${isGraded ? 'text' : 'none'};
          `
        )}
      >
        <RichText
          key={storyId}
          contentId={storyId}
          contentType="ai_story"
          isAIMessage
          aiActionPlacement="inline"
          aiActionClassName={readingToolsCls}
          isStreaming={!storyStreamComplete}
          style={{ lineHeight: 2 }}
          maxLines={1000}
        >
          {story}
        </RichText>
      </div>
      {explanation && (
        <div className={cx(sheetCls, vocabCls)}>
          <p className={vocabHeadCls}>Vocabulary</p>
          <RichText
            isAIMessage
            aiActionPlacement="inline"
            aiActionClassName={readingToolsCls}
            isStreaming={!explanationStreamComplete}
            className={css`
              font-size: 1.7rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.5rem;
              }
            `}
            style={{ lineHeight: 1.5 }}
            maxLines={1000}
          >
            {explanation}
          </RichText>
        </div>
      )}
      {story && (
        <div
          style={{
            marginTop: '10rem',
            paddingBottom: '10rem',
            width: '100%',
            justifyContent: 'center',
            display: 'flex'
          }}
        >
          {isGraded ? (
            <ArenaButton tone="orange" onClick={onFinishRead}>
              Review Questions
            </ArenaButton>
          ) : (
            <ArenaButton
              tone="train"
              loading={!questionsButtonEnabled}
              onClick={onFinishRead}
            >
              {questionsButtonEnabled ? 'Solve Questions' : 'Generating...'}
            </ArenaButton>
          )}
        </div>
      )}
    </div>
  );
}

// the story on a paper reading sheet, Arena's look (Mikey 10-24)
const sheetCls = css`
  width: 100%;
  max-width: 72rem;
  padding: 2.4rem 2.8rem;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 4px 4px 0 ${ARENA.line};
  font-family: 'Poppins', sans-serif;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.6rem 1.4rem;
  }
`;

const readingToolsCls = css`
  margin-top: 1.6rem;
  align-items: flex-start;
  gap: 0.8rem;

  button {
    min-width: calc(44 * var(--px));
    min-height: calc(44 * var(--px));
    flex-shrink: 0;
    background: ${ARENA.background};
    border: 2px solid ${ARENA.line};
    border-radius: 8px;
    box-shadow: 3px 3px 0 ${ARENA.line};
    font-family: inherit;
    font-size: calc(16 * var(--px));
    transition:
      transform 0.1s,
      box-shadow 0.1s,
      background 0.1s;

    @media (hover: hover) and (pointer: fine) {
      &:hover:not(:disabled) {
        background: ${ARENA.paper};
        border-color: ${ARENA.line};
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0 ${ARENA.line};
      }
    }

    &:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 ${ARENA.line};
    }

    &:focus-visible {
      outline-color: ${ARENA.ink};
    }
  }
`;

const vocabCls = css`
  margin-top: 2.4rem;
  padding-top: 0;
  overflow: hidden;
`;

const vocabHeadCls = css`
  margin: 0 -2.8rem 1.8rem;
  padding: 0.9rem 2.8rem;
  background: ${ARENA.ink};
  color: #fff;
  font-size: 1.8rem;
  font-weight: 900;
  @media (max-width: ${mobileMaxWidth}) {
    margin: 0 -1.4rem 1.4rem;
    padding: 0.8rem 1.4rem;
    font-size: 1.6rem;
  }
`;
