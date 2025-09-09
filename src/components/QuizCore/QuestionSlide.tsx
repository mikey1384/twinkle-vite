import React from 'react';
import ChoiceList from './ChoiceList';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function QuestionSlide({
  answerIndex,
  isCompleted,
  question,
  selectedChoiceIndex,
  choices,
  onCorrectAnswer,
  onSetGotWrong,
  gotWrong,
  onCountdownStart,
  initialDelayMs,
  perWordMs,
  compact
}: {
  answerIndex: number;
  isCompleted?: boolean;
  question: string;
  selectedChoiceIndex: number;
  choices: any[];
  onCorrectAnswer: () => void;
  onSetGotWrong: (arg0: number) => void;
  gotWrong: boolean;
  onCountdownStart?: () => void;
  initialDelayMs?: number;
  perWordMs?: number;
  compact?: boolean;
}) {
  return (
    <div
      className={css`
        width: 100%;
        padding: 0 ${compact ? '0.5rem' : '1rem'} ${compact ? '1rem' : '3rem'} ${compact ? '0.5rem' : '1rem'};
        border-radius: ${borderRadius};
        @media (max-width: ${mobileMaxWidth}) {
          padding-bottom: 1rem;
        }
      `}
    >
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div
          className={css`
            width: 100%;
            min-height: ${compact ? '20rem' : '25rem'};
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin-top: ${compact ? '1rem' : '2rem'};
            text-align: center;
            align-items: center;
            .jiggle-jiggle-jiggle {
              animation: jiggle-jiggle-jiggle linear;
              animation-duration: 1000ms;
            }
            @media (max-width: ${mobileMaxWidth}) {
              > h3 {
                font-size: 1.8rem;
              }
            }
          `}
        >
          <h3 className="unselectable">{question}</h3>
          <ChoiceList
            style={{ marginTop: compact ? '1rem' : '3rem', fontSize: '1.6rem' }}
            answerIndex={answerIndex}
            isCompleted={isCompleted}
            selectedChoiceIndex={selectedChoiceIndex}
            onCorrectAnswer={onCorrectAnswer}
            onSetGotWrong={onSetGotWrong}
            listItems={choices}
            questionLength={question.length}
            gotWrong={gotWrong}
            onShown={onCountdownStart}
            initialDelayMs={initialDelayMs}
            perWordMs={perWordMs}
          />
        </div>
      </div>
    </div>
  );
}
