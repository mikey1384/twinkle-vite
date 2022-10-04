import PropTypes from 'prop-types';
import Bubble from './Bubble';
import './styles.css';

ProgressBar.propTypes = {
  style: PropTypes.object
};

export default function ProgressBar({ style }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        ...style
      }}
    >
      {Array(10)
        .fill()
        .map((_, index) => (
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
