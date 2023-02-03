import PropTypes from 'prop-types';

Details.propTypes = {
  selectedOption: PropTypes.string.isRequired
};

export default function Details({ selectedOption }) {
  return (
    <div>
      <div>the details go here {selectedOption}</div>
    </div>
  );
}
