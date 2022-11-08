import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';

QuestionItem.propTypes = {
  question: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired
};
export default function QuestionItem({ index, question }) {
  return (
    <div
      style={{
        padding: '1rem',
        border: `1px solid ${Color.borderGray()}`,
        marginTop: index === 0 ? 0 : '1rem'
      }}
      key={question.id}
    >
      {question.content}
      {question.choices.map((choice, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '1rem'
          }}
        >
          <span>{choice.label}</span>
          {choice.isAnswer && (
            <span
              style={{
                marginLeft: '1rem',
                color: Color.green()
              }}
            >
              <Icon icon="check" />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
