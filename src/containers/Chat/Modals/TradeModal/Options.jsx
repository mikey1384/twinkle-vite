import PropTypes from 'prop-types';
import Button from '~/components/Button';

Options.propTypes = {
  partnerName: PropTypes.string.isRequired,
  onSelectOption: PropTypes.func.isRequired
};

export default function Options({ partnerName, onSelectOption }) {
  return (
    <div>
      <Button filled color="logoBlue" onClick={() => onSelectOption('want')}>
        I want something {partnerName} has
      </Button>
      <Button
        style={{ marginTop: '1rem' }}
        filled
        color="pink"
        onClick={() => onSelectOption('offer')}
      >
        {`I want ${partnerName} to make me an offer`}
      </Button>
      <Button
        style={{ marginTop: '1rem' }}
        filled
        color="green"
        onClick={() => onSelectOption('give')}
      >
        {`I want to give ${partnerName} what I have`}
      </Button>
    </div>
  );
}
