import PropTypes from 'prop-types';
import { cloudFrontURL } from '~/constants/defaultValues';

CardItem.propTypes = {
  card: PropTypes.object.isRequired
};

export default function CardItem({ card }) {
  return (
    <div key={card.id}>
      <img src={`${cloudFrontURL}${card.imagePath}`} />
    </div>
  );
}
