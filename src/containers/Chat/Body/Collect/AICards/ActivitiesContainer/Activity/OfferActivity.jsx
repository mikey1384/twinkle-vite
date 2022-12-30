import PropTypes from 'prop-types';
import CardThumb from '../../../../../CardThumb';

OfferActivity.propTypes = {
  card: PropTypes.object.isRequired,
  feed: PropTypes.object.isRequired
};

export default function OfferActivity({ card, feed }) {
  return (
    <div>
      {JSON.stringify(feed)}
      <div>
        <CardThumb card={card} />
      </div>
    </div>
  );
}
