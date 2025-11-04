import React, { useState } from 'react';
import MultipleChoiceQuestion from '~/components/MultipleChoiceQuestion';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';

export default function QuestionListItem({
  question: { question, choices: choiceLabels, answerIndex } = {},
  style
}: {
  question: any;
  style?: React.CSSProperties;
}) {
  const [passStatus, setPassStatus] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  return (
    <div
      style={style}
      className={css`
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        padding: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          border-left: 0;
          border-right: 0;
          border-radius: 0;
        }
      `}
    >
      <MultipleChoiceQuestion
        question={
          <div
            className={css`
              font-size: 1.7rem;
              font-weight: 600;
              margin-bottom: 0.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.5rem;
              }
            `}
          >
            {question}
          </div>
        }
        choices={choiceLabels}
        isGraded
        selectedChoiceIndex={selectedIndex}
        answerIndex={answerIndex}
        onSelectChoice={handleSelect}
        conditionPassStatus={passStatus}
        allowReselect={false}
        style={{ marginTop: '0.5rem' }}
      />
    </div>
  );

  function handleSelect(selectedIndex: number) {
    setSelectedIndex(selectedIndex);
    setPassStatus(selectedIndex === answerIndex ? 'pass' : 'fail');
  }
}
