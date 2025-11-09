/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useEffect, useState } from 'react';
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
  const userLinkColor = useKeyContext((v) => v.theme.userLink.color);
  const xpNumberColor = useKeyContext((v) => v.theme.xpNumber.color);

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
  }, [card?.id, cardObj?.[card.id]?.word, cardObj?.[card.id]?.isBurned]);

  const finalCard = useMemo(
    () => ({
      ...card,
      ...(cardObj?.[card.id] || {})
    }),

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
  const frontPicUrl = useMemo(() => {
    if (!finalCard.imagePath) return '';
    if (
      typeof finalCard.imagePath === 'string' &&
      (finalCard.imagePath.startsWith('data:') ||
        finalCard.imagePath.startsWith('http'))
    ) {
      return finalCard.imagePath;
    }
    return `${cloudFrontURL}${finalCard.imagePath}`;
  }, [finalCard.imagePath]);
  const isImageOne = useMemo(
    () => finalCard?.engine === 'image-1',
    [finalCard?.engine]
  );
  const { cardCss, cardColor } = useAICard(finalCard);
  const [showFullOnTouch, setShowFullOnTouch] = useState(false);

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
            position: relative;
            overflow: hidden;
            width: 100%;
            height: CALC(100% - 110px);
            display: flex;
            align-items: center;
            @media (max-width: ${mobileMaxWidth}) {
              height: CALC(100% - 55px);
            }
          `}
          onTouchStart={() => setShowFullOnTouch(true)}
          onTouchEnd={() => setShowFullOnTouch(false)}
          onTouchCancel={() => setShowFullOnTouch(false)}
        >
          {imageExists && !finalCard.isBurned ? (
            isImageOne ? (
              <>
                <img
                  loading="lazy"
                  className={css`
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: opacity 0.2s ease;
                    @media (hover: hover) {
                      .card:hover & {
                        opacity: 0;
                      }
                    }
                  `}
                  style={{ opacity: showFullOnTouch ? 0 : 1 }}
                  src={frontPicUrl}
                />
                <img
                  loading="lazy"
                  className={css`
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    transition: opacity 0.2s ease;
                    opacity: 0;
                    @media (hover: hover) {
                      .card:hover & {
                        opacity: 1;
                      }
                    }
                  `}
                  style={{ opacity: showFullOnTouch ? 1 : undefined }}
                  src={frontPicUrl}
                />
              </>
            ) : (
              <img loading="lazy" style={{ width: '100%' }} src={frontPicUrl} />
            )
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
                width: '100%',
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
                  <b style={{ color: card.level === 6 ? '#fff' : cardColor }}>
                    {finalCard.word}
                  </b>
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
