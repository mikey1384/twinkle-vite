import PropTypes from 'prop-types';
import { cardLevelHash } from '~/constants/defaultValues';
import { Color } from '~/constants/css';

CardInfo.propTypes = {
  style: PropTypes.object
};

export default function CardInfo({ style }) {
  return (
    <div style={style}>
      <div>
        created a{' '}
        <b style={{ color: Color[cardLevelHash[4].color]() }}>
          {cardLevelHash[4].label}
        </b>{' '}
        card
      </div>
    </div>
  );
}
