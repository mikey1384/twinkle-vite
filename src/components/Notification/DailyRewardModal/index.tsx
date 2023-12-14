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
  const [showFirstSentence, setShowFirstSentence] = useState(false);
  const [showSecondSentence, setShowSecondSentence] = useState(false);
  const [showThirdSentence, setShowThirdSentence] = useState(false);
  const [showFourthSentence, setShowFourthSentence] = useState(false);
  const [showFifthSentence, setShowFifthSentence] = useState(false);
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
          setShowFirstSentence(true);
          setShowSecondSentence(true);
          setShowThirdSentence(true);
          setShowFourthSentence(true);
          setShowFifthSentence(true);
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
    return chosenCard ? colors[chosenCard?.level] : '';
  }, [chosenCard]);

  const burnValue = useMemo(() => {
    if (!chosenCard) {
      return 0;
    }
    return returnCardBurnXP({
      cardLevel: chosenCard.level,
      cardQuality: chosenCard.quality
    });
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
              .fadeIn {
                animation: fadeInEffect 1s ease-in;
              }

              @keyframes fadeInEffect {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }

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
              <div
                style={{
                  marginTop: '5rem',
                  width: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                {showFirstSentence && (
                  <div
                    style={{ width: '100%', textAlign: 'center' }}
                    className="fadeIn"
                  >
                    Congratulations!
                  </div>
                )}
                {showSecondSentence && (
                  <div
                    className="fadeIn"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '1rem'
                    }}
                  >
                    <div>
                      You rolled {chosenCard.quality === 'elite' ? 'an' : 'a'}{' '}
                      <span style={{ fontWeight: 'bold', ...qualityProps }}>
                        {chosenCard.quality}
                      </span>{' '}
                      <span
                        style={{
                          fontWeight: 'bold',
                          color:
                            Color[
                              colors[chosenCard.level] === 'blue'
                                ? 'logoBlue'
                                : colors[chosenCard.level]
                            ]()
                        }}
                      >
                        {chosenCardColorDescription}
                      </span>{' '}
                      card!
                    </div>
                    <div>{burnValue} burn value</div>
                    <div>{burnValue} coins</div>
                  </div>
                )}

                {showThirdSentence && (
                  <div
                    className="fadeIn"
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <div>You {isCardOwned ? '' : `don't `}own the card.</div>
                    <div>
                      <Icon icon="times" /> {isCardOwned ? '1' : '1/10'}
                    </div>
                    <div>{burnValue / 10} coins</div>
                  </div>
                )}

                {showFourthSentence && (
                  <div
                    className="fadeIn"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      {burnValue / 10 < 100
                        ? 'Minimum reward amount is 100'
                        : burnValue / 10 < 1000
                        ? 'rounded to 100'
                        : 'rounded to 1000'}
                    </div>
                    <div>
                      {burnValue / 10 < 100
                        ? 100
                        : burnValue / 10 < 1000
                        ? Math.round(burnValue / 10 / 100) * 100
                        : Math.round(burnValue / 10 / 1000) * 1000}{' '}
                      coins
                    </div>
                  </div>
                )}

                {showFifthSentence && (
                  <div
                    className="fadeIn"
                    style={{ marginTop: '1rem', textAlign: 'center' }}
                  >
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
                    </span>{' '}
                  </div>
                )}
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
        setTimeout(() => setShowFirstSentence(true), 1500);
        setTimeout(() => setShowSecondSentence(true), 3000);
        setTimeout(() => setShowThirdSentence(true), 4500);
        setTimeout(() => setShowFourthSentence(true), 6000);
        setTimeout(() => setShowFifthSentence(true), 7500);
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
