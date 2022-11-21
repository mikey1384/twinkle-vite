import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { cardLevelHash } from '~/constants/defaultValues';
import { Color } from '~/constants/css';

CardInfo.propTypes = {
  style: PropTypes.object,
  card: PropTypes.object.isRequired
};

export default function CardInfo({ card, style }) {
  const cardLevelObj = useMemo(() => cardLevelHash[card?.level], [card?.level]);
  return (
    <div style={style}>
      <div>
        created a {card.quality}{' '}
        <b style={{ color: Color[cardLevelObj?.color]() }}>
          {cardLevelObj?.label}
        </b>{' '}
        card
      </div>
    </div>
  );
}
