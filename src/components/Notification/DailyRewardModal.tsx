import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import GradientButton from '~/components/Buttons/GradientButton';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import AICard from '~/components/AICard';
import Countdown from 'react-countdown';
import AICardModal from '~/components/Modals/AICardModal';
import DailyBonusModal from './DailyBonusModal';
import { track } from '@vercel/analytics';
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
import {
  useAppContext,
  useKeyContext,
  useChatContext,
  useNotiContext
} from '~/contexts';

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
  onSetIsDailyRewardChecked,
  onCountdownComplete
}: {
  onHide: () => void;
  onSetHasBonus: (hasBonus: boolean) => void;
  onSetIsDailyRewardChecked: (isChecked: boolean) => void;
  onCountdownComplete: () => void;
}) {
  const unlockDailyReward = useAppContext(
    (v) => v.requestHelpers.unlockDailyReward
  );
  const updateDailyRewardViewStatus = useAppContext(
    (v) => v.requestHelpers.updateDailyRewardViewStatus
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const { userId, twinkleCoins } = useKeyContext((v) => v.myState);
  const {
    xpNumber: { color: xpNumberColor },
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const { timeDifference, nextDayTimeStamp } = useNotiContext(
    (v) => v.state.todayStats
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const [showFirstSentence, setShowFirstSentence] = useState(false);
  const [showSecondSentence, setShowSecondSentence] = useState(false);
  const [showThirdSentence, setShowThirdSentence] = useState(false);
  const [showFourthSentence, setShowFourthSentence] = useState(false);
  const [showFifthSentence, setShowFifthSentence] = useState(false);
  const [showBonusSentence, setShowBonusSentence] = useState(false);
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
  const [xpEarned, setXPEarned] = useState(0);
  const [dailyBonusModalShown, setDailyBonusModalShown] = useState(false);
  const [bonusAttempted, setBonusAttempted] = useState(false);
  const [bonusAchieved, setBonusAchieved] = useState(false);
  const hasBonusRef = useRef(false);
  const isRevealPressedRef = useRef(false);
  const isCoinReceivedRef = useRef(false);
  const isAlreadyCheckedRef = useRef(false);
  const newCoinsRef = useRef(0);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const {
          cards,
          chosenCardId,
          hasBonus,
          bonusAttempted,
          bonusAchieved,
          nextDayTimeStamp: newNextDayTimeStamp,
          xpEarned,
          isAlreadyChecked,
          coinEarned,
          isCardOwned
        } = await unlockDailyReward();
        if (isAlreadyChecked) {
          isAlreadyCheckedRef.current = true;
          setCurrentCardId(chosenCardId);
          setAlreadyChecked(true);
          setShowFirstSentence(true);
          setShowSecondSentence(true);
          setShowThirdSentence(true);
          setShowFourthSentence(true);
          setShowFifthSentence(true);
          if (bonusAttempted) {
            setBonusAttempted(true);
            setBonusAchieved(bonusAchieved);
            setShowBonusSentence(true);
            setXPEarned(xpEarned);
          }
          onSetIsDailyRewardChecked(true);
        }
        setCardIds(cards.map((card: Card) => card.id));
        for (const card of cards) {
          onUpdateAICard({
            cardId: card.id,
            newState: card
          });
        }
        onUpdateTodayStats({
          newStats: {
            nextDayTimeStamp: newNextDayTimeStamp
          }
        });
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
      if (
        (isRevealPressedRef.current || isAlreadyCheckedRef.current) &&
        hasBonusRef.current
      ) {
        onSetHasBonus(true);
      }
      if (isRevealPressedRef.current && !isCoinReceivedRef.current) {
        onSetUserState({
          userId,
          newState: { twinkleCoins: newCoinsRef.current }
        });
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

  const cardOwnStatusText = useMemo(() => {
    const currentIsCardOwned = chosenCard?.ownerId === userId;
    const appliedIsCardOwned = !!isCardOwned;
    return `You ${
      appliedIsCardOwned
        ? ''
        : currentIsCardOwned === appliedIsCardOwned
        ? `don't `
        : `didn't `
    }${!currentIsCardOwned && appliedIsCardOwned ? 'owned' : 'own'} the card`;
  }, [chosenCard?.ownerId, isCardOwned, userId]);

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

  const displayedBurnValue = useMemo(() => {
    return addCommasToNumber(burnValue);
  }, [burnValue]);

  const numCoinsAdjustedToCardOwnership = useMemo(() => {
    return addCommasToNumber(isCardOwned ? burnValue : burnValue / 10);
  }, [burnValue, isCardOwned]);

  const fourthSentenceText = useMemo(() => {
    const defaultCoinEarned = isCardOwned ? burnValue : burnValue / 10;
    if (defaultCoinEarned < 100) {
      return 'Minimum reward amount is 100';
    }
    if (defaultCoinEarned < 1000) {
      return '...rounded to the nearest hundred';
    }
    return '...rounded to the nearest thousand';
  }, [burnValue, isCardOwned]);

  return (
    <Modal
      closeWhenClickedOutside={false}
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
                theme="gold"
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
                    <div>
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
                    <div>{burnValue} burn value</div>
                    <div
                      style={{
                        fontWeight: showThirdSentence ? 'normal' : 'bold',
                        textAlign: 'right'
                      }}
                    >
                      {displayedBurnValue} coins
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
                    <div>{cardOwnStatusText}</div>
                    <div>
                      <Icon icon="times" /> {isCardOwned ? '1' : '1/10'}
                    </div>
                    <div
                      style={{
                        fontWeight: showFourthSentence ? 'normal' : 'bold',
                        textAlign: 'right'
                      }}
                    >
                      {numCoinsAdjustedToCardOwnership} coins
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
                    <div>{fourthSentenceText}</div>
                    <div />
                    <div
                      style={{
                        fontWeight: 'bold',
                        textAlign: 'right'
                      }}
                    >
                      {displayedCoinEarned} coins
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
                {showBonusSentence ? (
                  bonusAchieved ? (
                    <div
                      className="fadeIn"
                      style={{ marginTop: '0.5rem', textAlign: 'center' }}
                    >
                      ...and{' '}
                      <div
                        style={{
                          display: 'inline',
                          fontWeight: 'bold'
                        }}
                      >
                        <span
                          style={{
                            color: Color[xpNumberColor]()
                          }}
                        >
                          {addCommasToNumber(xpEarned)}
                        </span>{' '}
                        <span style={{ color: Color.gold() }}>XP</span>
                      </div>{' '}
                      for correctly answering the{' '}
                      <span
                        className={css`
                          font-weight: bold;
                          cursor: pointer;
                          color: ${Color[linkColor]()};
                          &:hover {
                            text-decoration: underline;
                          }
                        `}
                        onClick={() => setDailyBonusModalShown(true)}
                      >
                        bonus question
                      </span>
                    </div>
                  ) : (
                    <div
                      className="fadeIn"
                      style={{ marginTop: '0.5rem', textAlign: 'center' }}
                    >
                      <span>
                        ...but you got the{' '}
                        <span
                          className={css`
                            font-weight: bold;
                            cursor: pointer;
                            color: ${Color[linkColor]()};
                            &:hover {
                              text-decoration: underline;
                            }
                          `}
                          onClick={() => setDailyBonusModalShown(true)}
                        >
                          bonus question
                        </span>{' '}
                        wrong
                      </span>
                    </div>
                  )
                ) : null}
              </div>
            )}
          </div>
        )}
      </main>
      <footer>
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr'
          }}
        >
          <div />
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column'
            }}
          >
            {!loading && showFifthSentence && (
              <>
                <p style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                  Next Daily Reward
                </p>
                <Countdown
                  key={nextDayTimeStamp}
                  className={css`
                    font-size: 1.3rem;
                  `}
                  date={nextDayTimeStamp}
                  now={() => {
                    const now = Date.now() + timeDifference;
                    return now;
                  }}
                  daysInHours={true}
                  onComplete={handleCountdownComplete}
                />
              </>
            )}
          </div>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Button transparent onClick={handleHide}>
              Close
            </Button>
          </div>
        </div>
      </footer>
      {cardModalShown && (
        <AICardModal
          cardId={chosenCardId}
          onHide={() => setCardModalShown(false)}
        />
      )}
      {dailyBonusModalShown && (
        <DailyBonusModal
          modalOverModal
          isBonusAttempted={bonusAttempted}
          isBonusAchieved={bonusAchieved}
          xpEarned={xpEarned}
          onHide={() => setDailyBonusModalShown(false)}
        />
      )}
    </Modal>
  );

  function handleCountdownComplete() {
    isRevealPressedRef.current = false;
    isAlreadyCheckedRef.current = false;
    hasBonusRef.current = false;
    onCountdownComplete();
  }

  function handleHide() {
    if (cardModalShown) {
      return;
    }
    onHide();
  }

  async function handleReveal() {
    track('DailyRewardCollect');
    setIsRevealPressed(true);
    isRevealPressedRef.current = true;
    newCoinsRef.current = twinkleCoins + coinEarned;
    let currentIndex = 0;
    let interval = 1500;
    let isFirstIteration = true;
    let fastIterations = 0;

    await updateDailyRewardViewStatus();

    setCurrentCardId(cardIds[currentIndex]);

    const reveal = () => {
      if (
        currentIndex === cardIds.indexOf(chosenCardId) &&
        fastIterations >= 2
      ) {
        setCurrentCardId(chosenCardId);
        setAnimateReveal(true);
        onSetIsDailyRewardChecked(true);
        onSetUserState({
          userId,
          newState: { twinkleCoins: twinkleCoins + coinEarned }
        });
        isCoinReceivedRef.current = true;
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
