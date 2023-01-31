import PropTypes from 'prop-types';
import Button from '~/components/Button';

Options.propTypes = {
  partnerName: PropTypes.string.isRequired,
  onSelectOption: PropTypes.func.isRequired,
  selectedOption: PropTypes.string.isRequired
};

export default function Options({
  partnerName,
  onSelectOption,
  selectedOption
}) {
  return (
    <div>
      <Button
        skeuomorphic={selectedOption === 'want'}
        color="logoBlue"
        onClick={() => onSelectOption('want')}
      >
        I want something {partnerName} has
      </Button>
      <Button
        skeuomorphic={selectedOption === 'offer'}
        style={{ marginTop: '1rem' }}
        color="pink"
        onClick={() => onSelectOption('offer')}
      >
        {`I want ${partnerName} to make me an offer`}
      </Button>
      <Button
        skeuomorphic={selectedOption === 'give'}
        style={{ marginTop: '1rem' }}
        color="green"
        onClick={() => onSelectOption('give')}
      >
        {`I want to give ${partnerName} what I have`}
      </Button>
    </div>
  );
}
