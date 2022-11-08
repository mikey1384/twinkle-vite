import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';

Question.propTypes = {
  question: PropTypes.object.isRequired
};

export default function Question({ question }) {
  return (
    <div
      style={{
        padding: '1rem',
        border: `1px solid ${Color.borderGray()}`
      }}
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
