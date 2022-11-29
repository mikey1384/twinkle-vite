import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { cardLevelHash, cloudFrontURL } from '~/constants/defaultValues';

CardItem.propTypes = {
  index: PropTypes.number.isRequired,
  card: PropTypes.object.isRequired
};

export default function CardItem({ card, index }) {
  const cardObj = useMemo(() => cardLevelHash[card?.level], [card?.level]);
  const cardColor = useMemo(() => Color[cardObj?.color](), [cardObj?.color]);
  return (
    <div
      style={{
        height: '10rem',
        display: 'flex',
        borderTop: index === 0 ? 0 : `1px solid ${Color.borderGray()}`
      }}
      key={card.id}
    >
      <div
        style={{
          width: '5rem',
          height: '7rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: cardColor
        }}
      >
        <img
          style={{ width: '100%' }}
          src={`${cloudFrontURL}${card.imagePath}`}
        />
      </div>
      <div>{card.prompt}</div>
    </div>
  );
}
