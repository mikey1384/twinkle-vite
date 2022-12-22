import { useMemo } from 'react';
import PropTypes from 'prop-types';
import useAICard from '~/helpers/hooks/useAICard';
import UsernameText from '~/components/Texts/UsernameText';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { cloudFrontURL, returnCardBurnXP } from '~/constants/defaultValues';
import { animated } from 'react-spring';

LiveCard.propTypes = {
  animateOnMouseLeave: PropTypes.bool,
  bind: PropTypes.object.isRequired,
  card: PropTypes.object.isRequired,
  cardStyle: PropTypes.object.isRequired,
  innerRef: PropTypes.object.isRequired,
  isAnimated: PropTypes.bool.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
  onMouseMove: PropTypes.func.isRequired
};

export default function LiveCard({
  bind,
  card,
  cardStyle,
  innerRef,
  isAnimated,
  onMouseLeave,
  onMouseMove
}) {
  const {
    userLink: { color: userLinkColor },
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const burnXP = useMemo(() => {
    return returnCardBurnXP({
      cardLevel: card.level,
      cardQuality: card.quality
    });
  }, [card.level, card.quality]);
  const imageExists = useMemo(() => !!card.imagePath, [card.imagePath]);
  const frontPicUrl = `${cloudFrontURL}${card.imagePath}`;
  const { cardCss } = useAICard(card);

  return (
    <div className={cardCss}>
      <animated.div
        {...bind()}
        ref={innerRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={cardStyle}
        className={`card${isAnimated ? ' animated' : ''} ${
          card.isBurning && !card.isBurned
            ? css`
                animation: burning 2s linear;
                animation-fill-mode: forwards;
                @keyframes burning {
                  0% {
                    background-color: red;
                    box-shadow: 0 0 10px red;
                    filter: blur(0);
                  }

                  50% {
                    background-color: yellow;
                    box-shadow: 0 0 10px yellow;
                    filter: blur(5px);
                  }

                  100% {
                    background-color: red;
                    box-shadow: 0 0 10px red;
                    filter: blur(10px);
                    opacity: 0;
                  }
                }
              `
            : ''
        }`}
      >
        <div
          className={css`
            width: 100%;
          `}
        >
          {imageExists && !card.isBurned ? (
            <img
              style={{
                width: '100%'
              }}
              src={frontPicUrl}
            />
          ) : null}
          {!!card.isBurned && (
            <div
              style={{
                background: '#fff',
                textAlign: 'center',
                padding: '5rem 0',
                lineHeight: 1.7
              }}
            >
              <div>
                <UsernameText
                  color={Color[userLinkColor]()}
                  user={{
                    username: card.owner.username,
                    id: card.owner.id
                  }}
                />
              </div>
              <div>burned this card and earned</div>
              <b style={{ color: Color[xpNumberColor]() }}>
                {addCommasToNumber(burnXP)}
              </b>{' '}
              <b style={{ color: Color.gold() }}>XP</b>
            </div>
          )}
        </div>
      </animated.div>
    </div>
  );
}
