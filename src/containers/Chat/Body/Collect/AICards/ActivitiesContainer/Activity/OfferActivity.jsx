import PropTypes from 'prop-types';
import CardThumb from '../../../../../CardThumb';

OfferActivity.propTypes = {
  card: PropTypes.object.isRequired
};

export default function OfferActivity({ card }) {
  return (
    <div>
      <div>
        <CardThumb card={card} />
      </div>
    </div>
  );
}
