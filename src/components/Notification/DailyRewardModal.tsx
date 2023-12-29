import React, { useEffect, useMemo, useRef, useState } from 'react';
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

export default function DailyRewardModal({
  onHide,
  onSetHasBonus,
  onSetIsDailyRewardChecked
}: {
  onHide: () => void;
  onSetHasBonus: (hasBonus: boolean) => void;
  onSetIsDailyRewardChecked: (isChecked: boolean) => void;
}) {
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
  const hasBonusRef = useRef(false);
  const isRevealPressedRef = useRef(false);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const {
          cards,
          chosenCardId,
          hasBonus,
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
          onSetIsDailyRewardChecked(true);
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
        hasBonusRef.current = hasBonus;
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    return () => {
      setAnimateReveal(false);
      if (isRevealPressedRef.current && hasBonusRef.current) {
        onSetHasBonus(true);
      }
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

  const fourthSentenceText = useMemo(() => {
    const defaultCoinEarned = burnValue / 10;
    if (defaultCoinEarned < 100) {
      return 'Minimum reward amount is 100';
    }
    if (defaultCoinEarned < 1000) {
      return '...rounded to the nearest hundred';
    }
    return '...rounded to the nearest thousand';
  }, [burnValue]);

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
                Roll it!
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
                    style={{
                      fontWeight: 'bold',
                      width: '100%',
                      textAlign: 'center'
                    }}
                    className="fadeIn"
                  >
                    Congratulations!
                  </div>
                )}
                {showSecondSentence && (
                  <div
                    className="fadeIn"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr',
                      marginTop: '2rem',
                      width: '100%'
                    }}
                  >
                    <div className="column">
                      You rolled {chosenCard.quality === 'elite' ? 'an' : 'a'}{' '}
                      <span style={qualityProps[chosenCard.quality]}>
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
                    <div className="column">{burnValue} burn value</div>
                    <div
                      className="column"
                      style={{
                        fontWeight: showThirdSentence ? 'normal' : 'bold',
                        textAlign: 'right'
                      }}
                    >
                      {burnValue} coins
                    </div>
                  </div>
                )}

                {showThirdSentence && (
                  <div
                    className="fadeIn"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr',
                      marginTop: '1.5rem',
                      width: '100%'
                    }}
                  >
                    <div className="column">
                      You {isCardOwned ? '' : `don't `}own the card
                    </div>
                    <div className="column">
                      <Icon icon="times" /> {isCardOwned ? '1' : '1/10'}
                    </div>
                    <div
                      className="column"
                      style={{
                        fontWeight: showFourthSentence ? 'normal' : 'bold',
                        textAlign: 'right'
                      }}
                    >
                      {isCardOwned ? burnValue : burnValue / 10} coins
                    </div>
                  </div>
                )}

                {showFourthSentence && (
                  <div
                    className="fadeIn"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr',
                      marginTop: '1.5rem',
                      width: '100%'
                    }}
                  >
                    <div className="column">{fourthSentenceText}</div>
                    <div className="column" />
                    <div
                      className="column"
                      style={{
                        fontWeight: 'bold',
                        textAlign: 'right'
                      }}
                    >
                      {coinEarned} coins
                    </div>
                  </div>
                )}

                {showFifthSentence && (
                  <div
                    className="fadeIn"
                    style={{ marginTop: '2rem', textAlign: 'center' }}
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
    isRevealPressedRef.current = true;
    let currentIndex = 0;
    let interval = 1500;
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
        onSetIsDailyRewardChecked(true);
        setTimeout(() => setShowFirstSentence(true), 1500);
        setTimeout(() => setShowSecondSentence(true), 3500);
        setTimeout(() => setShowThirdSentence(true), 5500);
        setTimeout(() => setShowFourthSentence(true), 7500);
        setTimeout(() => setShowFifthSentence(true), 9500);
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
