import PropTypes from 'prop-types';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { cloudFrontURL, cardProps } from '~/constants/defaultValues';

CardThumb.propTypes = {
  borderColor: PropTypes.string,
  card: PropTypes.object.isRequired,
  cardColor: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func
};

export default function CardThumb({
  card,
  borderColor,
  cardColor,
  style,
  onClick
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onClick={onClick}
    >
      <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '1.3rem' }}>
        #{card.id}
      </div>
      <div
        className={css`
          width: 8rem;
          height: 12rem;
          border-radius: 3px;
          @media (max-width: ${mobileMaxWidth}) {
            width: 7rem;
            height: 11rem;
            border-radius: 2px;
          }
        `}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: cardColor,
          border:
            cardProps[card.quality]?.includes('glowy') && !card.isBurned
              ? `3px solid ${borderColor}`
              : 'none',
          position: 'relative'
        }}
      >
        {card.imagePath && !card.isBurned && (
          <img
            style={{ width: '100%' }}
            src={`${cloudFrontURL}${card.imagePath}`}
          />
        )}
      </div>
      {card.word ? (
        <div style={{ display: 'inline', marginTop: '0.5rem' }}>
          {' '}
          <b style={{ color: cardColor, fontSize: '1.3rem' }}>{card.word}</b>
        </div>
      ) : null}
    </div>
  );
}
