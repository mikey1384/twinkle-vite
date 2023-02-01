import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import {
  borderRadius,
  innerBorderRadius,
  Color,
  mobileMaxWidth
} from '~/constants/css';
import {
  cardLevelHash,
  cloudFrontURL,
  cardProps,
  qualityProps
} from '~/constants/defaultValues';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';

CardItem.propTypes = {
  card: PropTypes.object.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  onDeselect: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
  successColor: PropTypes.string.isRequired
};

const deviceIsMobile = isMobile(navigator);

export default function CardItem({
  card,
  onSetAICardModalCardId,
  onDeselect,
  onSelect,
  selected,
  successColor
}) {
  const [mouseOver, setMouseOver] = useState(!!deviceIsMobile);
  const cardDetailObj = useMemo(
    () => cardLevelHash[card?.level],
    [card?.level]
  );
  const cardColor = useMemo(
    () => Color[cardDetailObj?.color](),
    [cardDetailObj?.color]
  );
  const borderColor = useMemo(
    () => qualityProps[card?.quality]?.color,
    [card?.quality]
  );

  return (
    <div
      onMouseEnter={deviceIsMobile ? null : () => setMouseOver(true)}
      onMouseLeave={deviceIsMobile ? null : () => setMouseOver(false)}
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        padding: '1rem',
        boxShadow: selected ? `0 0 5px ${successColor}` : null,
        border: `1px solid ${Color[selected ? successColor : 'borderGray']()}`,
        borderRadius
      }}
      className={css`
        margin: 0.3%;
        width: 16%;
        @media (max-width: ${mobileMaxWidth}) {
          margin: 1%;
          width: 30%;
        }
      `}
    >
      <div
        className={`inner ${css`
          width: 8rem;
          height: 12rem;
          border-radius: 3px;
          @media (max-width: ${mobileMaxWidth}) {
            width: 7rem;
            height: 11rem;
            border-radius: 2px;
          }
        `}`}
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
      {mouseOver ? (
        <div
          style={{
            borderRadius: innerBorderRadius,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'absolute',
            height: '100%',
            width: '100%'
          }}
          className={css`
            justify-content: center;
            background: rgba(0, 0, 0, 0.1);
            @media (max-width: ${mobileMaxWidth}) {
              justify-content: flex-end;
              background: transparent;
            }
          `}
        >
          <div>
            <Button
              opacity={0.8}
              skeuomorphic
              mobilePadding="0.5rem"
              onClick={() => onSetAICardModalCardId(card.id)}
            >
              Details
            </Button>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <Button
              color={selected ? successColor : 'black'}
              opacity={0.8}
              skeuomorphic
              mobilePadding="0.5rem"
              onClick={selected ? onDeselect : onSelect}
            >
              <Icon icon="check" />
              <span style={{ marginLeft: '0.7rem' }}>
                Select{selected ? 'ed' : ''}
              </span>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
