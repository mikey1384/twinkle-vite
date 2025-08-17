import React, { useState } from 'react';
import ChoiceList from './ChoiceList';
import { borderRadius, mobileMaxWidth, Color } from '~/constants/css';
import LiveGradeIndicator from './LiveGradeIndicator';
import { css } from '@emotion/css';

export default function QuestionSlide({
  answerIndex,
  isCompleted,
  question,
  selectedChoiceIndex,
  choices,
  baseTime,
  getMeasureTime,
  onGradeLock,
  fixedGrade,
  onCorrectAnswer,
  onCountdownStart,
  onSetGotWrong,
  gotWrong
}: {
  answerIndex: number;
  isCompleted?: boolean;
  question: string;
  selectedChoiceIndex: number;
  choices: any[];
  baseTime: number;
  getMeasureTime: () => number;
  onGradeLock: (g: string) => void;
  fixedGrade?: string;
  onCorrectAnswer: () => void;
  onCountdownStart?: () => void;
  onSetGotWrong: (arg0: number) => void;
  gotWrong: boolean;
}) {
  const [choicesShown, setChoicesShown] = useState(false);

  function handleCountdownStart() {
    setChoicesShown(true);
    onCountdownStart?.();
  }
  return (
    <div
      className={css`
        width: 100%;
        padding: 0 1rem 3rem 1rem;
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
            min-height: 25rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin-top: 2rem;
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
          {choicesShown && !fixedGrade && (
            <LiveGradeIndicator
              baseTime={baseTime}
              getMeasureTime={getMeasureTime}
              onGradeChange={onGradeLock}
            />
          )}
          {choicesShown && fixedGrade && (
            <div
              className={css`
                margin-top: 0.75rem;
                font-weight: 800;
                font-size: 1.7rem;
              `}
              style={{ color: gradeColor(fixedGrade) }}
            >
              {gradeMessage(fixedGrade)}
            </div>
          )}
          <ChoiceList
            style={{ marginTop: '3rem', fontSize: '1.6rem' }}
            answerIndex={answerIndex}
            isCompleted={isCompleted}
            selectedChoiceIndex={selectedChoiceIndex}
            onCorrectAnswer={onCorrectAnswer}
            onCountdownStart={handleCountdownStart}
            onSetGotWrong={onSetGotWrong}
            listItems={choices}
            questionLength={question.length}
            gotWrong={gotWrong}
          />
        </div>
      </div>
    </div>
  );
}

function gradeMessage(grade?: string) {
  switch ((grade || '').toUpperCase()) {
    case 'S':
      return 'You got an S!';
    case 'A':
      return 'You got an A';
    case 'B':
      return 'You got a B';
    case 'C':
      return 'You got a C';
    case 'D':
      return 'You got a D';
    default:
      return 'Ouch!';
  }
}

function gradeColor(grade?: string) {
  const g = String(grade || '').toUpperCase();
  switch (g) {
    case 'S':
      return Color.gold();
    case 'A':
      return Color.magenta();
    case 'B':
      return Color.orange();
    case 'C':
      return Color.pink();
    case 'D':
      return Color.logoBlue();
    default:
      return Color.gray(0.7);
  }
}
