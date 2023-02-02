import PropTypes from 'prop-types';

SelectedCards.propTypes = {
  selectedCards: PropTypes.array.isRequired
};
export default function SelectedCards({ selectedCards }) {
  return (
    <div>
      <div>{selectedCards.length}</div>
    </div>
  );
}
