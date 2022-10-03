import PropTypes from 'prop-types';

Marble.propTypes = {
  style: PropTypes.object
};

export default function Marble({ style }) {
  return (
    <div style={style} className="marble">
      <div className="ball bubble" />
    </div>
  );
}
