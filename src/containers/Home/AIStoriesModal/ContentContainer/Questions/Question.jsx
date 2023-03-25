import PropTypes from 'prop-types';
import CheckListGroup from '~/components/CheckListGroup';

Question.propTypes = {
  question: PropTypes.string.isRequired,
  choices: PropTypes.array.isRequired,
  selectedChoiceIndex: PropTypes.number,
  onSelectChoice: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function Question({
  question,
  choices,
  selectedChoiceIndex,
  onSelectChoice,
  style
}) {
  const listItems = choices.map((choice, index) => ({
    label: choice,
    checked: index === selectedChoiceIndex
  }));
  return (
    <div style={style}>
      <div>
        <p style={{ fontWeight: 'bold' }}>{question}</p>
      </div>
      <CheckListGroup
        inputType="radio"
        listItems={listItems}
        onSelect={onSelectChoice}
        style={{ marginTop: '1.5rem', paddingRight: '1rem' }}
      />
    </div>
  );
}
