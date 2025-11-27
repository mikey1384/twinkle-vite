import React from 'react';
import Icon from '~/components/Icon';
import RichText from '~/components/Texts/RichText';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export default function AnswerFeedback({
  isCorrect,
  explanation
}: {
  isCorrect: boolean;
  explanation: string;
}) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.2rem;
        padding: 1.5rem 2rem;
        border-radius: 12px;
        background: ${isCorrect ? Color.green(0.08) : Color.rose(0.08)};
        border: 1px solid ${isCorrect ? Color.green(0.3) : Color.rose(0.3)};
        text-align: center;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1.2rem 1.5rem;
        }
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.7rem;
          font-size: 1.8rem;
          font-weight: 700;
          color: ${isCorrect ? Color.green() : Color.rose()};
        `}
      >
        <Icon icon={isCorrect ? 'check' : 'xmark'} />
        <span>{isCorrect ? 'Correct!' : 'Not Quite'}</span>
      </div>
      {explanation && (
        <RichText
          style={{
            fontSize: '1.5rem',
            color: Color.darkGray(),
            lineHeight: 1.5
          }}
        >
          {explanation}
        </RichText>
      )}
    </div>
  );
}
