import PropTypes from 'prop-types';

CardInfo.propTypes = {
  style: PropTypes.object
};

export default function CardInfo({ style }) {
  return (
    <div style={style}>
      <div>collected an EPIC card!!!</div>
    </div>
  );
}
