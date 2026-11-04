import React from 'react';
import { css, cx } from '@emotion/css';
import { FORMAT_INFO, GotchaText } from '../Quest/FormatQuestion';
import { decodeOrder } from '../Quest/MultiTapQuestion';
import type { QuestQuestion } from '../Quest/types';

export type QuestPresentation = Pick<QuestQuestion,
  'format' | 'question' | 'choices' | 'tokens' | 'parts' | 'end' |
  'instruction' | 'manualSubmit' | 'targets'>;

export function questPresentationText(question: QuestPresentation) {
  const format = question.format || 'blank';
  const body = ['which', 'stomp', 'momentum'].includes(format)
    ? question.choices : [question.question, ...question.choices];
  return [FORMAT_INFO[format].name, question.instruction, ...body].filter(Boolean).join('\n');
}

// Read-only replay of what was shown. No reconstructed key or new grading:
// the highlighted answers come only from the member's saved taps.
export default function QuestQuestionReview({
  question, selectedTaps = [], sourceIndex
}: {
  question: QuestPresentation;
  selectedTaps?: number[];
  sourceIndex?: number;
}) {
  const format = question.format || 'blank';
  const tap = selectedTaps[0];
  const tokens = question.tokens || [];
  const multi = format === 'stomp' || format === 'momentum';
  const how = format === 'stomp' && !question.manualSubmit && question.targets != null
    ? `Select all ${question.targets} wrong sentences.` : FORMAT_INFO[format].how;
  return (
    <div className={reviewCls} data-question-format={format}>
      <div className={instructionCls}><GotchaText text={how} /></div>
      {question.instruction && <p className={instructionCls}>{question.instruction}</p>}
      {format === 'crack' || format === 'build' ? (
        <>
          <div className={tokensCls} role="group" aria-label={format === 'crack' ? 'Original crack sentence' : 'Original sentence pieces'}>
            {tokens.map((word, i) => (
              <span key={i} className={cx(tokenCls, format === 'crack' && selectedTaps.includes(i) && selectedCls)}>
                {word}
                {format === 'crack' && selectedTaps.includes(i) && <small>Your tap</small>}
              </span>
            ))}
            {question.end && <span>{question.end}</span>}
          </div>
          {format === 'crack' && <div className={instructionCls}>A faulty phrase accepts any word in that phrase. For a missing word, either side of the gap counts.</div>}
          {format === 'build' && selectedTaps.map((value, i) => (
            <p key={i} className={instructionCls}>Your order: {decodeOrder(value, tokens.length).map((index) => tokens[index]).join(' ')}{question.end}</p>
          ))}
        </>
      ) : (
        <>
          {format === 'fix' && question.parts ? (
            <p>{question.parts.before}<mark className={wrongPartCls}>{question.parts.wrong}</mark>{question.parts.after}</p>
          ) : format === 'blank' ? <p>{question.question}</p> : null}
          <ol className={choicesCls}>
            {question.choices.map((choice, i) => {
              const picked = !multi && selectedTaps.includes(i);
              const judgment = multi && tap != null
                ? (format === 'stomp' ? !!(tap & (1 << i)) : !(tap & (1 << i))) ? 'You called this wrong' : 'You called this right'
                : null;
              return (
                <li key={i} className={cx(choiceCls, picked && selectedCls, sourceIndex === i && sourceCls)}>
                  <span>{choice}</span>
                  {(picked || judgment) && <small>{judgment || 'Your choice'}</small>}
                  {sourceIndex === i && <small>This is the sentence being reviewed</small>}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}

const reviewCls = css`
  font-size: 1.6rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  p { margin: 0.5rem 0; }
  small { display: block; font-size: 1.1rem; font-weight: 700; }
`;
const instructionCls = css`
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0.5rem 0;
`;
const tokensCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0.8rem 0;
`;
const tokenCls = css`
  border: 1px solid currentColor;
  border-radius: 5px;
  padding: 0.25rem 0.65rem;
  max-width: 100%;
`;
const choicesCls = css`
  margin: 0.6rem 0;
  padding-left: 2.2rem;
`;
const choiceCls = css`
  padding: 0.5rem 0.7rem;
  margin-bottom: 0.5rem;
  border: 1px solid currentColor;
  border-radius: 5px;
  white-space: pre-line;
`;
const selectedCls = css`
  background: #f8df9b;
  color: #382a18;
  box-shadow: inset 0 0 0 1px #80652d;
`;
const sourceCls = css`
  border-width: 3px;
`;
const wrongPartCls = css`
  background: #f9d6d8;
  color: #7b202d;
  text-decoration: underline;
  padding: 0.15rem 0.3rem;
`;
