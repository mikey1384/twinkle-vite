import PropTypes from 'prop-types';

Trade.propTypes = {
  wantCards: PropTypes.array.isRequired
};

export default function Trade({ wantCards }) {
  return (
    <div>
      <div>{wantCards.length}</div>
    </div>
  );
}
