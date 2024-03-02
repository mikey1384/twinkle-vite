/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useEffect } from 'react';
import useAICard from '~/helpers/hooks/useAICard';
import UsernameText from '~/components/Texts/UsernameText';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { cloudFrontURL, returnCardBurnXP } from '~/constants/defaultValues';
import { animated } from 'react-spring';
import { Card as CardType } from '~/types';

export default function Card({
  bind,
  card,
  cardStyle,
  detailShown,
  innerRef,
  isAnimated,
  onMouseLeave,
  onMouseMove
}: {
  bind: () => any;
  card: CardType;
  cardStyle: React.CSSProperties;
  detailShown?: boolean;
  innerRef: any;
  isAnimated: boolean;
  onMouseLeave: () => void;
  onMouseMove: (event: any) => void;
}) {
  const loadAICard = useAppContext((v) => v.requestHelpers.loadAICard);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const {
    userLink: { color: userLinkColor },
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);

  useEffect(() => {
    if (!cardObj?.[card.id]?.word) {
      initCard();
    }
    async function initCard() {
      try {
        const { card: loadedCard } = await loadAICard(card.id);
        onUpdateAICard({
          cardId: card.id,
          newState: loadedCard
        });
      } catch (error) {
        console.error(error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, cardObj?.[card.id]?.word]);

  const finalCard = useMemo(
    () => ({
      ...card,
      ...(cardObj?.[card.id] || {})
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      card?.id,
      cardObj?.[card.id]?.isBurning,
      cardObj?.[card.id]?.isBurned,
      cardObj?.[card.id]?.owner?.username,
      cardObj?.[card.id]?.askPrice,
      cardObj?.[card.id]?.imagePath
    ]
  );

  const burnXP = useMemo(
    () =>
      returnCardBurnXP({
        cardLevel: finalCard?.level,
        cardQuality: finalCard?.quality
      }),
    [finalCard?.level, finalCard?.quality]
  );
  const imageExists = useMemo(
    () => !!finalCard.imagePath,
    [finalCard.imagePath]
  );
  const frontPicUrl = useMemo(
    () => `${cloudFrontURL}${finalCard.imagePath}`,
    [finalCard.imagePath]
  );
  const { cardCss, cardColor } = useAICard(finalCard);

  return (
    <div className={cardCss}>
      <animated.div
        {...bind()}
        ref={innerRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={cardStyle}
        className={`card${isAnimated ? ' animated' : ''} ${
          finalCard.isBurning && !finalCard.isBurned
            ? css`
                animation: burning 2s linear;
                animation-fill-mode: forwards;
                &:hover {
                  animation: burning 2s linear !important;
                  animation-fill-mode: forwards !important;
                }
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
          {imageExists && !finalCard.isBurned ? (
            <img
              style={{
                width: '100%'
              }}
              src={frontPicUrl}
            />
          ) : null}
          {!!finalCard.isBurned && (
            <div
              className={css`
                font-size: 1.6rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.2rem;
                }
              `}
              style={{
                background: '#fff',
                textAlign: 'center',
                padding: '1rem'
              }}
            >
              <div>
                <UsernameText
                  color={Color[userLinkColor]()}
                  user={{
                    username: finalCard.owner?.username,
                    id: finalCard.owner?.id
                  }}
                />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                burned this card and earned
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <b style={{ color: Color[xpNumberColor]() }}>
                  {addCommasToNumber(burnXP)}
                </b>{' '}
                <b style={{ color: Color.gold() }}>XP</b>
              </div>
            </div>
          )}
        </div>
        {detailShown && !finalCard.isBurned && (
          <div
            className={css`
              font-size: 1.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.2rem;
              }
            `}
            style={{
              color: '#fff',
              padding: '1rem',
              bottom: 0,
              position: 'absolute',
              background: Color.black(0.9),
              height: '30%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}
          >
            <div>
              #{finalCard.id}
              {finalCard.word ? (
                <div style={{ display: 'inline' }}>
                  {' '}
                  <b style={{ color: cardColor }}>{finalCard.word}</b>
                </div>
              ) : null}
            </div>
            <div>
              Owned by <UsernameText color="#fff" user={finalCard.owner} />
            </div>
            {finalCard.askPrice ? (
              <div>
                price:{' '}
                <b style={{ color: Color.gold() }}>
                  <Icon icon={['far', 'badge-dollar']} />
                  <span style={{ marginLeft: '2px' }}>
                    {addCommasToNumber(finalCard.askPrice)}
                  </span>
                </b>
              </div>
            ) : null}
          </div>
        )}
      </animated.div>
    </div>
  );
}
