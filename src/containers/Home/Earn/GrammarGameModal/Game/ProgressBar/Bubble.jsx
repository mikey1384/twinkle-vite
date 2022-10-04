import { useEffect } from 'react';
import PropTypes from 'prop-types';

Bubble.propTypes = {
  question: PropTypes.object.isRequired,
  style: PropTypes.object
};

export default function Bubble({ question, style }) {
  useEffect(() => {
    console.log(question);
  }, [question]);

  return (
    <div style={style} className="bubble">
      <div className="ball gloss" />
    </div>
  );
}
