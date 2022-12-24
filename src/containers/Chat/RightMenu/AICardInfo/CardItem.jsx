import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import {
  cardLevelHash,
  cloudFrontURL,
  returnCardBurnXP,
  cardProps,
  qualityProps
} from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import AICardModal from '~/components/Modals/AICardModal';
import ErrorBoundary from '~/components/ErrorBoundary';

CardItem.propTypes = {
  card: PropTypes.object.isRequired,
  isOverflown: PropTypes.bool.isRequired,
  isLast: PropTypes.bool.isRequired
};

export default function CardItem({ card, isOverflown, isLast }) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const burnXP = useMemo(() => {
    return returnCardBurnXP({
      cardLevel: card.level,
      cardQuality: card.quality
    });
  }, [card.level, card.quality]);
  const [cardModalShown, setCardModalShown] = useState(false);
  const cardObj = useMemo(() => cardLevelHash[card?.level], [card?.level]);
  const cardColor = useMemo(
    () => Color[card.isBurned ? 'black' : cardObj?.color](),
    [card.isBurned, cardObj?.color]
  );
  const borderColor = useMemo(() => qualityProps[card.quality]?.color, [card]);
  const promptText = useMemo(() => {
    if (card.word) {
      const prompt = card.prompt;
      const word = card.word;
      const wordIndex = prompt.toLowerCase().indexOf(word.toLowerCase());
      const isCapitalized =
        prompt[wordIndex] !== prompt[wordIndex].toLowerCase();
      const wordToDisplay = isCapitalized
        ? word[0].toUpperCase() + word.slice(1)
        : word;
      const promptToDisplay =
        prompt.slice(0, wordIndex) +
        `<b style="color:${Color[cardObj?.color]()}">${wordToDisplay}</b>` +
        prompt.slice(wordIndex + word.length);
      return promptToDisplay;
    }
    return card.prompt;
  }, [card.prompt, card.word, cardObj?.color]);
  return (
    <ErrorBoundary componentPath="Chat/RightMenu/AICardInfo/CardItem">
      <div
        className={`unselectable ${css`
          &:hover {
            background: ${Color.wellGray()};
          }
        `}`}
        style={{
          cursor: 'pointer',
          height: '10rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          borderBottom:
            isOverflown && isLast ? 'none' : `1px solid ${Color.borderGray()}`
        }}
        onClick={() => setCardModalShown(true)}
        key={card.id}
      >
        <div
          style={{
            marginLeft: '0.5rem',
            borderRadius: '3px',
            width: '5rem',
            height: '7rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: cardColor,
            border:
              cardProps[card.quality]?.includes('glowy') && !card.isBurned
                ? `3px solid ${borderColor}`
                : 'none'
          }}
        >
          {card.imagePath && !card.isBurned && (
            <img
              style={{ width: '100%' }}
              src={`${cloudFrontURL}${card.imagePath}`}
            />
          )}
          {!!card.isBurned && (
            <div
              className={css`
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 0.5rem 0;
                font-size: 0.7rem;
              `}
            >
              <b style={{ color: Color[xpNumberColor]() }}>
                {addCommasToNumber(burnXP)}
              </b>
              <b style={{ color: Color.gold(), marginLeft: '2px' }}>XP</b>
            </div>
          )}
        </div>
        <div
          style={{
            flexGrow: 1,
            marginLeft: '1rem',
            height: '100%',
            width: '17vw'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            className={css`
              font-size: 1.3rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.2rem;
              }
            `}
          >
            <b>#{card.id}</b>
            <div
              style={{
                fontSize: '1.2rem',
                display: '-webkit-box',
                alignItems: 'center',
                justifyContent: 'center',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                overflow: 'hidden',
                WebkitBoxOrient: 'vertical',
                fontFamily: 'Roboto Mono, monospace',
                WebkitLineClamp: 1
              }}
              dangerouslySetInnerHTML={{ __html: promptText }}
            />
            <b
              style={{
                marginTop: '1rem',
                fontSize: '1.1rem',
                fontFamily: 'helvetica, sans-serif',
                color: Color.darkerGray()
              }}
            >
              {card.style}
            </b>
          </div>
        </div>
      </div>
      {cardModalShown && (
        <AICardModal cardId={card.id} onHide={() => setCardModalShown(false)} />
      )}
    </ErrorBoundary>
  );
}
