import { useMemo } from 'react';
import PropTypes from 'prop-types';

Bubble.propTypes = {
  question: PropTypes.object.isRequired,
  style: PropTypes.object
};

export default function Bubble({ question, style }) {
  const isGraded = useMemo(() => !!question.score, [question.score]);

  return (
    <div style={style} className="bubble">
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold',
          color: '#fff',
          fontSize: '2rem'
        }}
        className={`ball gloss ${isGraded ? 'lighted' : ''}`}
      >
        {isGraded ? question.score : ''}
      </div>
    </div>
  );
}
