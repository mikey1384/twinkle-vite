import PropTypes from 'prop-types';
import Button from '~/components/Button';

Options.propTypes = {
  partnerName: PropTypes.string.isRequired
};

export default function Options({ partnerName }) {
  return (
    <div>
      <Button filled color="logoBlue">
        I want something {partnerName} has
      </Button>
      <Button style={{ marginTop: '1rem' }} filled color="pink">
        {`I want ${partnerName} to make me an offer`}
      </Button>
      <Button style={{ marginTop: '1rem' }} filled color="green">
        {`I want to give ${partnerName} what I have`}
      </Button>
    </div>
  );
}
