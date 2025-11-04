import React from 'react';
import MultipleChoiceQuestion from '~/components/MultipleChoiceQuestion';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function QuestionSlide({
  answerIndex,
  conditionPassStatus,
  gotWrong,
  question,
  choices,
  onSelectChoice
}: {
  answerIndex: number;
  conditionPassStatus: string;
  gotWrong: boolean;
  question: string;
  choices: any[];
  onSelectChoice: (index: number) => any;
}) {
  return (
    <div
      className={css`
        width: 100%;
        padding: 2rem 1rem 3rem 1rem;
        border-radius: ${borderRadius};
        @media (max-width: ${mobileMaxWidth}) {
          padding-bottom: 1rem;
        }
      `}
    >
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div
          className={css`
            width: 80%;
            display: flex;
            flex-direction: column;
            margin-top: 3rem;
            @media (max-width: ${mobileMaxWidth}) {
              > h3 {
                font-size: 1.8rem;
              }
            }
          `}
        >
          {gotWrong && conditionPassStatus !== 'complete' && (
            <div
              style={{
                marginTop: '-1rem',
                marginBottom: '1rem',
                fontWeight: conditionPassStatus === 'pass' ? 'bold' : 'normal',
                color:
                  conditionPassStatus === 'pass'
                    ? Color.green()
                    : Color.orange()
              }}
            >
              {conditionPassStatus === 'pass'
                ? [
                    'You did it!',
                    'Great job!',
                    'Excellent!',
                    'Bravo!',
                    'You are getting better at this!'
                  ].sort(() => Math.random() - 0.5)[0]
                : 'You got this wrong last time'}
            </div>
          )}
          <h3>{question}</h3>
          <MultipleChoiceQuestion
            style={{ marginTop: '2rem', fontSize: '1.6rem' }}
            question={null}
            listItems={choices}
            isGraded={!!conditionPassStatus}
            selectedChoiceIndex={choices.findIndex((c: any) => c.checked)}
            answerIndex={answerIndex}
            onSelectChoice={onSelectChoice}
            conditionPassStatus={conditionPassStatus}
          />
        </div>
      </div>
    </div>
  );
}
