import { useMemo } from 'react';
import PropTypes from 'prop-types';

Bubble.propTypes = {
  index: PropTypes.number.isRequired,
  isCompleted: PropTypes.bool,
  isOnStreak: PropTypes.bool,
  question: PropTypes.object.isRequired,
  style: PropTypes.object
};

export default function Bubble({
  index,
  isCompleted,
  isOnStreak,
  question,
  style
}) {
  const animationDelay = useMemo(() => {
    return isOnStreak && isCompleted ? `${(index * 350) / 5}ms` : null;
  }, [index, isCompleted, isOnStreak]);
  const grade = useMemo(() => question.score, [question.score]);
  return (
    <div
      style={{ ...style, animationDelay }}
      className={`${isOnStreak && isCompleted ? 'waving' : ''}`}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold',
          color: '#fff',
          fontSize: '2rem'
        }}
        className={`ball gloss ${
          grade ? `graded${grade}${isOnStreak ? ' streak' : ''}` : ''
        }`}
      >
        {!!grade ? question.score : ''}
      </div>
    </div>
  );
}
