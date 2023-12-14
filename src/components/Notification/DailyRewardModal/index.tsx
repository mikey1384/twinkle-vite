import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import GradientButton from '~/components/Buttons/GradientButton';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import AICard from '~/components/AICard';
import AICardModal from '~/components/Modals/AICardModal';
import {
  cardLevelHash,
  qualityProps,
  returnCardBurnXP
} from '~/constants/defaultValues';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { Card } from '~/types';
import { useAppContext, useChatContext } from '~/contexts';

const colors: {
  [key: number]: string;
} = {
  1: 'blue',
  2: 'pink',
  3: 'orange',
  4: 'magenta',
  5: 'gold'
};

export default function DailyRewardModal({ onHide }: { onHide: () => void }) {
  const unlockDailyReward = useAppContext(
    (v) => v.requestHelpers.unlockDailyReward
  );
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [animateReveal, setAnimateReveal] = useState(false);
  const [cardModalShown, setCardModalShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cardIds, setCardIds] = useState<number[]>([]);
  const [chosenCardId, setChosenCardId] = useState(0);
  const [coinEarned, setCoinEarned] = useState(0);
  const [isCardOwned, setIsCardOwned] = useState(false);
  const [currentCardId, setCurrentCardId] = useState(0);
  const [alreadyChecked, setAlreadyChecked] = useState(false);
  const [isRevealPressed, setIsRevealPressed] = useState(false);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const {
          cards,
          chosenCardId,
          isAlreadyChecked,
          coinEarned,
          isCardOwned
        } = await unlockDailyReward();
        if (isAlreadyChecked) {
          setCurrentCardId(chosenCardId);
          setAlreadyChecked(true);
        }
        setCardIds(cards.map((card: Card) => card.id));
        for (const card of cards) {
          onUpdateAICard({
            cardId: card.id,
            newState: card
          });
        }
        setCoinEarned(coinEarned);
        setIsCardOwned(isCardOwned);
        setChosenCardId(chosenCardId);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    return () => {
      setAnimateReveal(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCard = useMemo(() => {
    return cardObj[currentCardId];
  }, [cardObj, currentCardId]);

  const chosenCard = useMemo(() => {
    return cardObj[chosenCardId];
  }, [cardObj, chosenCardId]);

  const chosenCardColorDescription = useMemo(() => {
    return chosenCard ? colors[chosenCard.level] : '';
  }, [chosenCard]);

  const burnValue = useMemo(() => {
    if (!chosenCard) {
      return 0;
    }
    return addCommasToNumber(
      returnCardBurnXP({
        cardLevel: chosenCard.level,
        cardQuality: chosenCard.quality
      })
    );
  }, [chosenCard]);

  const displayedCoinEarned = useMemo(() => {
    return addCommasToNumber(coinEarned);
  }, [coinEarned]);

  return (
    <Modal
      className={css`
        @keyframes flashEffect {
          0% {
            background-color: transparent;
          }
          50% {
            background-color: ${Color?.[
              cardLevelHash?.[chosenCard?.level]?.color
            ]?.(0.7) || 'transparent'};
          }
          100% {
            background-color: transparent;
          }
        }

        .flashBackground {
          animation: flashEffect 0.6s ease-out;
        }
      `}
      wrapped
      onHide={handleHide}
    >
      <header>Daily Reward</header>
      <main className={animateReveal ? 'flashBackground' : ''}>
        {loading ? (
          <Loading />
        ) : (
          <div
            style={{
              minHeight: '30vh',
              display: 'flex',
              height: '100%',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column'
            }}
            className={css`
              @keyframes popEffect {
                0% {
                  transform: scale(0.9);
                  opacity: 0.7;
                }
                50% {
                  transform: scale(1.2);
                  opacity: 1;
                }
                100% {
                  transform: scale(1);
                  opacity: 1;
                }
              }

              .chosenCardWrapper {
                animation: popEffect 0.6s ease-out;
              }
            `}
          >
            {!isRevealPressed && !alreadyChecked && (
              <GradientButton
                onClick={handleReveal}
                fontSize="1.5rem"
                mobileFontSize="1.1rem"
              >
                Roll the reward!
              </GradientButton>
            )}
            {currentCard && (
              <div
                className={
                  currentCardId === chosenCardId &&
                  isRevealPressed &&
                  animateReveal
                    ? 'chosenCardWrapper'
                    : ''
                }
              >
                <AICard
                  key={currentCard.id}
                  card={currentCard}
                  onClick={
                    animateReveal || alreadyChecked
                      ? () => {
                          setCardModalShown(true);
                        }
                      : undefined
                  }
                  detailShown
                />
              </div>
            )}
            {(animateReveal || alreadyChecked) && chosenCard && (
              <div style={{ marginTop: '5rem', textAlign: 'center' }}>
                <p>Congratulations!</p>
                <p>
                  You rolled {chosenCard.quality === 'elite' ? 'an' : 'a'}{' '}
                  <span style={{ ...qualityProps[chosenCard.quality] }}>
                    {chosenCard.quality}
                  </span>{' '}
                  <span
                    style={{
                      fontWeight: 'bold',
                      color: Color[colors[chosenCard.level]]()
                    }}
                  >
                    {chosenCardColorDescription}
                  </span>{' '}
                  card! (burn value: {burnValue})
                </p>
                <p>You {isCardOwned ? '' : `don't `}own this card</p>
                <p>
                  You earned{' '}
                  <Icon
                    icon={['far', 'badge-dollar']}
                    style={{
                      color: Color.brownOrange()
                    }}
                  />
                  <span
                    style={{
                      color: Color.brownOrange(),
                      fontWeight: 'bold',
                      marginLeft: '0.2rem'
                    }}
                  >
                    {displayedCoinEarned}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      <footer>
        <Button transparent onClick={handleHide}>
          Close
        </Button>
      </footer>
      {cardModalShown && (
        <AICardModal
          cardId={chosenCardId}
          onHide={() => setCardModalShown(false)}
        />
      )}
    </Modal>
  );

  function handleHide() {
    if (cardModalShown) {
      return;
    }
    onHide();
  }

  function handleReveal() {
    setIsRevealPressed(true);
    let currentIndex = 0;
    let interval = 2000;
    let isFirstIteration = true;
    let fastIterations = 0;

    setCurrentCardId(cardIds[currentIndex]);

    const reveal = () => {
      if (
        currentIndex === cardIds.indexOf(chosenCardId) &&
        fastIterations >= 2
      ) {
        setCurrentCardId(chosenCardId);
        setAnimateReveal(true);
      } else {
        currentIndex = (currentIndex + 1) % cardIds.length;
        setCurrentCardId(cardIds[currentIndex]);

        if (currentIndex === 0 && interval <= 100) {
          fastIterations++;
        }

        if (currentIndex === 0 && isFirstIteration) {
          isFirstIteration = false;
        } else if (!isFirstIteration && interval > 100) {
          interval *= 0.8;
        }

        setTimeout(reveal, interval);
      }
    };
    setTimeout(reveal, interval);
  }
}
