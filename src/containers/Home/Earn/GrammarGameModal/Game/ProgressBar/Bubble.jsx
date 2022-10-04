import PropTypes from 'prop-types';

Bubble.propTypes = {
  style: PropTypes.object
};

export default function Bubble({ style }) {
  return (
    <div style={style} className="marble">
      <div className="ball bubble" />
    </div>
  );
}
