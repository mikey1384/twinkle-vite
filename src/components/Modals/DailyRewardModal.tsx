import React, { useEffect, useMemo, useRef, useState } from 'react';
import NewModal from '~/components/NewModal';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import AICard from '~/components/AICard';
import Countdown from 'react-countdown';
import AICardModal from '~/components/Modals/AICardModal';
import DailyBonusModal from './DailyBonusModal';
import {
  cardLevelHash,
  qualityProps,
  returnCardBurnXP,
  cloudFrontURL
} from '~/constants/defaultValues';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import { Card } from '~/types';
import {
  useAppContext,
  useKeyContext,
  useChatContext,
  useNotiContext
} from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';

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
  const userId = useKeyContext((v) => v.myState.userId);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const { colorKey: xpNumberColorKey } = useRoleColor('xpNumber', {
    fallback: 'logoGreen'
  });
  const { colorKey: linkColorKey } = useRoleColor('link', {
    fallback: 'logoBlue'
  });
  const xpNumberColor =
    xpNumberColorKey && xpNumberColorKey in Color
      ? xpNumberColorKey
      : 'logoGreen';
  const linkColor =
    linkColorKey && linkColorKey in Color ? linkColorKey : 'logoBlue';
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
  const [bonusAttempted, setBonusAttempted] = useState(false);
  const [bonusAchieved, setBonusAchieved] = useState(false);
  const [dailyBonusModalShown, setDailyBonusModalShown] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const hasBonusRef = useRef(false);
  const isRevealPressedRef = useRef(false);
  const isCoinReceivedRef = useRef(false);
  const isAlreadyCheckedRef = useRef(false);
  const newCoinsRef = useRef(0);
  const isComponentMounted = useRef(true);
  const deviceIsMobile = isMobile(navigator);

  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  const preloadCardImages = async (cardsToLoad: Card[]) => {
    const uniqueImagePaths = Array.from(
      new Set(
        cardsToLoad
          .map((card) => card.imagePath)
          .filter((path): path is string => !!path)
      )
    );

    if (uniqueImagePaths.length === 0) {
      if (isComponentMounted.current) {
        setImagesPreloaded(true);
      }
      return;
    }

    await Promise.all(
      uniqueImagePaths.map(
        (path) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.src = `${cloudFrontURL}${path}`;

            if (img.complete) {
              resolve();
              return;
            }

            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );

    if (isComponentMounted.current) {
      setImagesPreloaded(true);
    }
  };

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        setImagesPreloaded(false);
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
        await preloadCardImages(cards);
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
    if (!chosenCard?.level) return '';
    return cardLevelHash[chosenCard.level]?.label || '';
  }, [chosenCard?.level]);

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

  const coinDigitCount = useMemo(() => {
    const absolute = Math.abs(Math.trunc(coinEarned || 0));
    return String(absolute || 0).length;
  }, [coinEarned]);

  const displayedBurnValue = useMemo(() => {
    return addCommasToNumber(burnValue);
  }, [burnValue]);

  const numCoinsAdjustedToCardOwnership = useMemo(() => {
    return addCommasToNumber(isCardOwned ? burnValue * 5 : burnValue / 2);
  }, [burnValue, isCardOwned]);

  const xpDigitCount = useMemo(() => {
    const absolute = Math.abs(Math.trunc(xpEarned || 0));
    return String(absolute || 0).length;
  }, [xpEarned]);

  const levelColorHex = useMemo(() => {
    if (!chosenCard?.level) return Color.logoBlue();
    const colorToken = cardLevelHash[chosenCard.level]?.color;
    const resolved =
      colorToken && typeof Color[colorToken] === 'function'
        ? Color[colorToken]()
        : null;
    return resolved || Color.logoBlue();
  }, [chosenCard?.level]);

  const coinFontSize = useMemo(
    () => getRewardFontSize(coinDigitCount),
    [coinDigitCount]
  );
  const xpFontSize = useMemo(
    () => getRewardFontSize(xpDigitCount),
    [xpDigitCount]
  );

  const fourthSentenceText = useMemo(() => {
    const defaultCoinEarned = isCardOwned ? burnValue * 5 : burnValue / 2;
    if (defaultCoinEarned < 100) {
      return 'Minimum reward amount is 100';
    }
    if (defaultCoinEarned < 1000) {
      return '...rounded to the nearest hundred';
    }
    return '...rounded to the nearest thousand';
  }, [burnValue, isCardOwned]);

  const modalClass = css`
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

    /* Remove modal drop shadow for a cleaner look */
    box-shadow: none !important;
  `;

  const contentClass = css`
    width: 100%;

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
  `;

  // Pure grid container for the modal content body
  const contentGridClass = css`
    display: grid;
    grid-auto-rows: max-content;
    row-gap: 1.6rem;
    width: 100%;
    min-height: 30vh;
    justify-items: center;
    align-items: start;

    &.revealed {
      align-items: start;
    }
  `;

  const summaryContainerClass = css`
    margin-top: 2.5rem;
    width: 100%;
    max-width: 52rem;
    margin-left: auto;
    margin-right: auto;
    display: grid;
    grid-auto-rows: max-content;
    row-gap: 1.6rem;
  `;

  const summaryHeadlineClass = css`
    font-size: 3rem;
    font-weight: 800;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    @media (max-width: 480px) {
      font-size: 2.25rem;
    }
  `;

  const summaryRowClass = css`
    display: grid;
    grid-template-columns: 2.5fr auto 1fr;
    align-items: center;
    column-gap: 1rem;
    width: 100%;
  `;

  const summaryColLeft = css`
    font-size: 1.55rem;
    line-height: 1.4;
    color: #111827;
    white-space: nowrap;
    @media (max-width: 480px) {
      font-size: 1.45rem;
      white-space: normal;
      overflow-wrap: anywhere;
      min-width: 0;
    }
  `;

  const summaryColCenter = css`
    font-size: 1.55rem;
    font-weight: 700;
    color: ${Color.purple()};
    display: grid;
    grid-auto-flow: column;
    align-items: center;
    justify-content: center;
    column-gap: 0.75rem;
    min-width: 11rem;
    @media (max-width: 480px) {
      font-size: 1.45rem;
      column-gap: 0.5rem;
      min-width: 0;
      justify-content: start;
      justify-items: start;
      text-align: left;
    }
  `;

  const summaryColRight = css`
    text-align: right;
    font-size: 1.6rem;
    font-weight: 700;
    line-height: 1.4;
    min-width: 11rem;
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: max-content max-content;
    justify-content: end;
    align-items: center;
    column-gap: 0.5rem;
    @media (max-width: 480px) {
      font-size: 1.45rem;
      min-width: 0;
    }
  `;

  const rewardHighlightClass = css`
    display: grid;
    grid-auto-rows: max-content;
    row-gap: 0.8rem;
    align-items: center;
    justify-items: center;
    padding: 1.4rem 2rem;
    text-align: center;
    @media (max-width: 480px) {
      padding: 1rem 1.2rem;
    }
  `;

  const rewardAmountClass = css`
    font-size: 3.1rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    @media (max-width: 480px) {
      font-size: 2.2rem;
    }
  `;

  const bonusMessageClass = css`
    text-align: center;
    font-size: 1.6rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    padding: 1.1rem 1.6rem;
    @media (max-width: 480px) {
      font-size: 1.45rem;
      padding: 0.9rem 1.2rem;
      gap: 0.6rem;
    }
  `;

  const bonusFailClass = css`
    color: ${Color.rose()};
  `;

  const coinsNumberClass = css`
    display: inline-block;
    text-align: right;
    font-variant-numeric: tabular-nums;
    @media (max-width: 480px) {
      /* Let numbers shrink naturally on small screens */
      width: auto !important;
    }
  `;

  function getRewardFontSize(digitCount: number) {
    if (digitCount >= 7) return '2.6rem';
    if (digitCount === 6) return '2.2rem';
    if (digitCount === 5) return '2rem';
    if (digitCount === 4) return '1.8rem';
    return '1.6rem';
  }

  const footerClass = css`
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    width: 100%;
    gap: 1.5rem;

    .countdown-wrapper {
      display: grid;
      place-content: center;
      grid-column: 2;
    }

    .countdown-block {
      display: grid;
      grid-auto-flow: column;
      align-items: center;
      justify-content: center;
      column-gap: 1.2rem;
      padding: 0.9rem 1.4rem;
      text-align: center;
    }

    .countdown-label {
      display: grid;
      grid-auto-rows: max-content;
      row-gap: 0.35rem;
      font-size: 1.45rem;
      color: ${Color.black(0.75)};
      line-height: 1.2;
      text-align: left;
    }

    .countdown-timer {
      font-family: 'Fira Code', 'Roboto Mono', monospace;
      font-size: 2.1rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: ${Color.logoBlue()};
    }

    .button-wrapper {
      display: grid;
      justify-content: end;
      grid-column: 3;
    }
  `;

  const footerContent = (
    <div className={footerClass}>
      <div className="countdown-wrapper">
        <div className="countdown-block">
          {!loading && showFifthSentence && (
            <>
              <Icon
                icon="sparkles"
                style={{ color: Color.gold(), fontSize: '1.8rem' }}
              />
              <span className="countdown-label">
                <span>Next Daily Reward</span>
                <Countdown
                  key={nextDayTimeStamp}
                  className="countdown-timer"
                  date={nextDayTimeStamp}
                  now={() => {
                    const now = Date.now() + timeDifference;
                    return now;
                  }}
                  daysInHours={true}
                  onComplete={handleCountdownComplete}
                />
              </span>
            </>
          )}
        </div>
      </div>
      <div className="button-wrapper">
        <Button variant="ghost" onClick={handleHide}>
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <NewModal
        isOpen
        onClose={handleHide}
        title="Daily Reward"
        closeOnBackdropClick={false}
        size="lg"
        allowOverflow
        className={modalClass}
        footer={footerContent}
      >
        <div
          className={animateReveal ? 'flashBackground' : ''}
          style={{ width: '100%' }}
        >
          {loading ? (
            <div
              className={css`
                display: grid;
                place-items: center;
                min-height: 30vh;
                width: 100%;
              `}
            >
              <Loading />
            </div>
          ) : (
            <div
              className={`${contentGridClass} ${contentClass} ${
                animateReveal || alreadyChecked ? 'revealed' : ''
              }`}
            >
              {!isRevealPressed && !alreadyChecked && (
                <GameCTAButton
                  icon="sparkles"
                  variant="gold"
                  size="xl"
                  shiny
                  style={{ marginBottom: '2rem', justifySelf: 'center' }}
                  loading={!imagesPreloaded}
                  disabled={!imagesPreloaded}
                  onClick={handleReveal}
                >
                  Roll it!
                </GameCTAButton>
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
                <div className={summaryContainerClass}>
                  {showFirstSentence && (
                    <div
                      className={`fadeIn ${summaryHeadlineClass}`}
                      style={{ color: levelColorHex }}
                    >
                      Congratulations!
                    </div>
                  )}
                  {showSecondSentence && (
                    <div className={`fadeIn ${summaryRowClass}`}>
                      <div className={summaryColLeft}>
                        You rolled {chosenCard.quality === 'elite' ? 'an' : 'a'}{' '}
                        <span style={qualityProps[chosenCard.quality]}>
                          {chosenCard.quality}
                        </span>{' '}
                        <strong style={{ color: levelColorHex }}>
                          {chosenCardColorDescription}
                        </strong>{' '}
                        card!
                      </div>
                      <div
                        className={summaryColCenter}
                        style={{ color: Color.redOrange() }}
                      >
                        {burnValue} {deviceIsMobile ? 'bv' : 'burn value'}
                      </div>
                      <div className={summaryColRight}>
                        <Icon
                          icon={['far', 'badge-dollar']}
                          style={{
                            color: Color.brownOrange(),
                            fontSize: '1em'
                          }}
                        />
                        <span
                          className={coinsNumberClass}
                          style={{
                            color: Color.black(),
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {displayedBurnValue}
                        </span>
                      </div>
                    </div>
                  )}
                  {showThirdSentence && (
                    <div className={`fadeIn ${summaryRowClass}`}>
                      <div className={summaryColLeft}>{cardOwnStatusText}</div>
                      <div className={summaryColCenter}>
                        <Icon icon="times" /> {isCardOwned ? '5' : '1/2'}
                      </div>
                      <div className={summaryColRight}>
                        <Icon
                          icon={['far', 'badge-dollar']}
                          style={{
                            color: Color.brownOrange(),
                            fontSize: '1em'
                          }}
                        />
                        <span
                          className={coinsNumberClass}
                          style={{
                            color: Color.black(),
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {numCoinsAdjustedToCardOwnership}
                        </span>
                      </div>
                    </div>
                  )}
                  {showFourthSentence && (
                    <div className={`fadeIn ${summaryRowClass}`}>
                      <div className={summaryColLeft}>{fourthSentenceText}</div>
                      <div className={summaryColCenter} />
                      <div className={summaryColRight}>
                        <Icon
                          icon={['far', 'badge-dollar']}
                          style={{
                            color: Color.brownOrange(),
                            fontSize: '1em'
                          }}
                        />
                        <span
                          className={coinsNumberClass}
                          style={{
                            color: Color.black(),
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {displayedCoinEarned}
                        </span>
                      </div>
                    </div>
                  )}
                  {showFifthSentence && (
                    <div className={`fadeIn ${rewardHighlightClass}`}>
                      <div
                        style={{
                          fontSize: '1.3rem',
                          fontWeight: 600,
                          color: Color.black(0.65),
                          marginBottom: '0.35rem'
                        }}
                      >
                        You earned
                      </div>
                      <div
                        className={rewardAmountClass}
                        style={{
                          fontSize: coinFontSize,
                          display: 'grid',
                          gridAutoFlow: 'column',
                          alignItems: 'center',
                          columnGap: '0.6rem'
                        }}
                      >
                        <Icon
                          icon={['far', 'badge-dollar']}
                          style={{
                            fontSize: coinFontSize,
                            color: Color.brownOrange()
                          }}
                        />
                        {displayedCoinEarned}
                      </div>
                    </div>
                  )}
                  {showBonusSentence ? (
                    bonusAchieved ? (
                      <div className={`fadeIn ${bonusMessageClass}`}>
                        ...and{' '}
                        <div
                          style={{
                            display: 'inline',
                            fontWeight: 'bold'
                          }}
                        >
                          <span
                            style={{
                              color: Color[xpNumberColor](),
                              fontSize: xpFontSize
                            }}
                          >
                            {addCommasToNumber(xpEarned)}
                          </span>{' '}
                          <span
                            style={{
                              color: Color.gold(),
                              fontSize: xpFontSize
                            }}
                          >
                            XP
                          </span>
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
                        className={`fadeIn ${bonusMessageClass} ${bonusFailClass}`}
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
        </div>
      </NewModal>
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
    </>
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
