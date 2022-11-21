import PropTypes from 'prop-types';
import { Color } from '~/constants/css';

CardInfo.propTypes = {
  style: PropTypes.object,
  quality: PropTypes.string,
  cardObj: PropTypes.object.isRequired
};

export default function CardInfo({ cardObj, quality, style }) {
  return (
    <div style={style}>
      <div>
        created a {quality}{' '}
        <b style={{ color: Color[cardObj?.color]() }}>{cardObj?.label}</b> card
      </div>
    </div>
  );
}
