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
      <div className={`ball gloss ${isGraded ? 'lighted' : ''}`} />
    </div>
  );
}
