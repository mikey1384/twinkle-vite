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
        {partnerName} has something I want
      </Button>
      <Button
        skeuomorphic={selectedOption === 'offer'}
        style={{ marginTop: '1rem' }}
        color="pink"
        onClick={() => onSelectOption('offer')}
      >
        {`I want to show ${partnerName} what I have`}
      </Button>
      <Button
        skeuomorphic={selectedOption === 'send'}
        style={{ marginTop: '1rem' }}
        color="green"
        onClick={() => onSelectOption('send')}
      >
        {`I want to send ${partnerName} something`}
      </Button>
    </div>
  );
}
