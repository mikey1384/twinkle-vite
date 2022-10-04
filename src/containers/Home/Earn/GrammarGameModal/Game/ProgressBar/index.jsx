import PropTypes from 'prop-types';
import Bubble from './Bubble';
import './styles.css';

ProgressBar.propTypes = {
  questions: PropTypes.arrayOf(PropTypes.object).isRequired,
  style: PropTypes.object
};

export default function ProgressBar({ questions, style }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        ...style
      }}
    >
      {questions.map((_, index) => (
        <Bubble
          key={index}
          style={{
            marginLeft: index === 0 ? 0 : '-1rem',
            zIndex: 10 - index
          }}
        />
      ))}
    </div>
  );
}
