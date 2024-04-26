import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ChoiceList from './ChoiceList';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';

QuestionListItem.propTypes = {
  question: PropTypes.object.isRequired,
  style: PropTypes.object
};

export default function QuestionListItem({
  question: { question, choices: choiceLabels, answerIndex } = {},
  style
}: {
  question: any;
  style?: React.CSSProperties;
}) {
  const [passStatus, setPassStatus] = useState('');
  const [choices, setChoices] = useState(
    choiceLabels.map((label: string) => ({ label, checked: false }))
  );
  return (
    <div
      style={style}
      className={css`
        > h3 {
          font-size: 1.7rem;
        }
        background: #fff;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        padding: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          > h3 {
            font-size: 1.5rem;
          }
          border-left: 0;
          border-right: 0;
          border-radius: 0;
        }
      `}
    >
      <h3>{question}</h3>
      <ChoiceList
        style={{ marginTop: '2rem', fontSize: '1.5rem' }}
        answerIndex={answerIndex}
        conditionPassStatus={passStatus}
        onSelect={handleSelect}
        listItems={choices}
      />
    </div>
  );

  function handleSelect(selectedIndex: number) {
    setChoices((choices: any[]) =>
      choices.map((choice, index) =>
        index === selectedIndex
          ? { ...choice, checked: true }
          : { ...choice, checked: false }
      )
    );
    setPassStatus(selectedIndex === answerIndex ? 'pass' : 'fail');
  }
}
