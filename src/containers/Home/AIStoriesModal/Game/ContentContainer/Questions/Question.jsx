import { useMemo } from 'react';
import PropTypes from 'prop-types';
import CheckListGroup from '~/components/CheckListGroup';

Question.propTypes = {
  question: PropTypes.string.isRequired,
  choices: PropTypes.array.isRequired,
  isGraded: PropTypes.bool,
  selectedChoiceIndex: PropTypes.number,
  onSelectChoice: PropTypes.func.isRequired,
  style: PropTypes.object,
  answerIndex: PropTypes.number
};

export default function Question({
  question,
  choices,
  isGraded,
  selectedChoiceIndex,
  onSelectChoice,
  answerIndex,
  style
}) {
  const listItems = useMemo(
    () =>
      choices.map((choice, index) => ({
        label: choice,
        checked: index === selectedChoiceIndex,
        isCorrect:
          isGraded &&
          typeof selectedChoiceIndex === 'number' &&
          index === selectedChoiceIndex &&
          selectedChoiceIndex === answerIndex,
        isWrong:
          isGraded &&
          typeof selectedChoiceIndex === 'number' &&
          index === selectedChoiceIndex &&
          selectedChoiceIndex !== answerIndex
      })),
    [choices, selectedChoiceIndex, isGraded, answerIndex]
  );

  return (
    <div style={style}>
      <div>
        <p style={{ fontWeight: 'bold' }}>{question}</p>
      </div>
      <CheckListGroup
        inputType="checkbox"
        listItems={listItems}
        onSelect={onSelectChoice}
        style={{ marginTop: '1.5rem', paddingRight: '1rem' }}
      />
    </div>
  );
}
