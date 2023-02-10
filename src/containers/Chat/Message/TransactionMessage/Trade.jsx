import PropTypes from 'prop-types';

Trade.propTypes = {
  wantCardIds: PropTypes.array.isRequired
};

export default function Trade({ wantCardIds }) {
  return (
    <div>
      <div>{wantCardIds.length}</div>
    </div>
  );
}
