import PropTypes from 'prop-types';

Bubble.propTypes = {
  style: PropTypes.object
};

export default function Bubble({ style }) {
  return (
    <div style={style} className="bubble">
      <div className="ball gloss" />
    </div>
  );
}
