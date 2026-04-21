import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  cardLevelHash,
  returnCardBurnXP,
  cloudFrontURL
} from '~/constants/defaultValues';
import {
  addCommasToNumber
} from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { isMobile } from '~/helpers';
import { Card } from '~/types';
import {
  useAppContext,
  useKeyContext,
  useChatContext,
  useNotiContext
} from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';
import Content from './Content';
import { DailyRewardModalProps } from './types';
import {
  formatRewardMultiplier,
  getRewardFontSize,
  roundRewardAmount
} from './utils';

export default function DailyRewardModal({
  onHide,
  onSetHasBonus,
  onSetIsDailyRewardChecked,
  onCountdownComplete,
  openBonus,
  onSetDailyBonusAttempted
}: DailyRewardModalProps) {
  const twinkleXP = useKeyContext((v) => v.myState.twinkleXP);
  const unlockDailyReward = useAppContext(
    (v) => v.requestHelpers.unlockDailyReward
  );
  const loadDailyBonus = useAppContext((v) => v.requestHelpers.loadDailyBonus);
  const postDailyBonus = useAppContext((v) => v.requestHelpers.postDailyBonus);
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
  const nextDayTimeStamp = useNotiContext(
    (v) => v.state.todayStats.nextDayTimeStamp
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
  const [showBonusUI, setShowBonusUI] = useState(!!openBonus);
  const [openedFromSummary, setOpenedFromSummary] = useState(false);
  const [animateReveal, setAnimateReveal] = useState(false);
  const [cardModalShown, setCardModalShown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cardIds, setCardIds] = useState<number[]>([]);
  const [chosenCardId, setChosenCardId] = useState(0);
  const [coinEarned, setCoinEarned] = useState(0);
  const [isCardOwned, setIsCardOwned] = useState(false);
  const [currentCardId, setCurrentCardId] = useState(0);
  const [alreadyChecked, setAlreadyChecked] = useState(false);
  const [isRevealPressed, setIsRevealPressed] = useState(false);
  const [xpEarned, setXPEarned] = useState(0);
  const [dailyTaskReward, setDailyTaskReward] = useState<any>(null);
  const [bonusAttempted, setBonusAttempted] = useState(false);
  const [bonusAchieved, setBonusAchieved] = useState(false);
  const [bonusQuestions, setBonusQuestions] = useState<any[]>([]);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusSubmitting, setBonusSubmitting] = useState(false);
  const [bonusIsGraded, setBonusIsGraded] = useState(false);
  const [bonusSelectedChoiceIndex, setBonusSelectedChoiceIndex] =
    useState<number>();
  const [bonusIsCorrect, setBonusIsCorrect] = useState<boolean | null>(null);
  const [showBonusLine1, setShowBonusLine1] = useState(false);
  const [showBonusLine2, setShowBonusLine2] = useState(false);
  const [showBonusLine3, setShowBonusLine3] = useState(false);
  const [showBonusLine4, setShowBonusLine4] = useState(false);
  const [showBonusLine5, setShowBonusLine5] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const hasBonusRef = useRef(false);
  const isRevealPressedRef = useRef(false);
  const isCoinReceivedRef = useRef(false);
  const isAlreadyCheckedRef = useRef(false);
  const newCoinsRef = useRef(0);
  const isComponentMounted = useRef(true);
  const bonusIsGradedRef = useRef(false);
  const deviceIsMobile = isMobile(navigator);

  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  useEffect(() => {
    init();

    async function init() {
      if (openBonus) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        setImagesPreloaded(false);
        const {
          cards,
          chosenCardId,
          hasBonus,
          bonusAttempted,
          bonusAchieved,
          dailyTaskReward,
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
        setDailyTaskReward(dailyTaskReward || null);
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
        if (openBonus) {
          setShowBonusUI(true);
        }
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

  useEffect(() => {
    if (!showBonusUI) return;
    let ignore = false;

    const applyGradedIfNeeded = (questions?: any[]) => {
      if (!bonusAttempted || bonusIsGradedRef.current) return;
      setBonusIsGraded(true);
      bonusIsGradedRef.current = true;
      if (bonusAchieved) {
        setShowBonusLine1(true);
        setShowBonusLine2(true);
        setShowBonusLine3(true);
        setShowBonusLine4(true);
        setShowBonusLine5(true);
        const first = (questions && questions[0]) || bonusQuestions?.[0];
        if (first?.answerIndex !== undefined) {
          setBonusSelectedChoiceIndex(first.answerIndex);
        }
      }
      setBonusIsCorrect(!!bonusAchieved);
    };

    (async () => {
      try {
        setBonusLoading(true);
        if (bonusQuestions.length === 0) {
          const {
            questions,
            chosenCard,
            isCardOwned,
            isUnavailable,
            dailyTaskReward
          } = await loadDailyBonus();
          if (ignore) return;
          if (isUnavailable) {
            return window.location.reload();
          }
          setChosenCardId(chosenCard?.id);
          onUpdateAICard({
            cardId: chosenCard?.id,
            newState: chosenCard
          });
          setIsCardOwned(isCardOwned);
          if (dailyTaskReward) {
            setDailyTaskReward(dailyTaskReward);
          }
          setBonusQuestions(questions);
          applyGradedIfNeeded(questions);
        } else {
          applyGradedIfNeeded(bonusQuestions);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setBonusLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBonusUI, bonusAttempted, bonusAchieved]);

  useEffect(() => {
    return () => {
      if (bonusIsGradedRef.current) {
        onSetDailyBonusAttempted?.();
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
    if (!chosenCard) return 0;
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

  const ownershipAdjustedRewardAmount = useMemo(() => {
    return isCardOwned ? burnValue * 5 : burnValue / 2;
  }, [burnValue, isCardOwned]);

  const xpAdjustedToCardOwnership = useMemo(() => {
    return addCommasToNumber(ownershipAdjustedRewardAmount);
  }, [ownershipAdjustedRewardAmount]);

  const numCoinsAdjustedToCardOwnership = useMemo(() => {
    return addCommasToNumber(ownershipAdjustedRewardAmount);
  }, [ownershipAdjustedRewardAmount]);

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

  const effectiveRewardMultiplier = useMemo(() => {
    return Number(dailyTaskReward?.finalMultiplier || 1);
  }, [dailyTaskReward]);

  const rewardAmountBeforeFinalRounding = useMemo(() => {
    return ownershipAdjustedRewardAmount * effectiveRewardMultiplier;
  }, [effectiveRewardMultiplier, ownershipAdjustedRewardAmount]);

  const displayedRoundedBaseRewardAmount = useMemo(() => {
    return addCommasToNumber(roundRewardAmount(ownershipAdjustedRewardAmount));
  }, [ownershipAdjustedRewardAmount]);

  const displayedRewardAmountBeforeFinalRounding = useMemo(() => {
    return addCommasToNumber(rewardAmountBeforeFinalRounding);
  }, [rewardAmountBeforeFinalRounding]);

  const showDailyTaskMultiplier = useMemo(() => {
    return Math.abs(effectiveRewardMultiplier - 1) > 0.001;
  }, [effectiveRewardMultiplier]);

  const fourthSentenceText = useMemo(() => {
    if (ownershipAdjustedRewardAmount < 100) {
      return 'Minimum reward amount is 100';
    }
    return `Rounded to ${displayedRoundedBaseRewardAmount}`;
  }, [displayedRoundedBaseRewardAmount, ownershipAdjustedRewardAmount]);

  const dailyTaskRewardText = useMemo(() => {
    if (!dailyTaskReward || !showDailyTaskMultiplier) {
      return fourthSentenceText;
    }
    if (dailyTaskReward.excellenceQualified) {
      return 'Daily task excellence bonus applied before final rounding';
    }
    if (dailyTaskReward.basicQualified) {
      return 'Daily task streak bonus applied before final rounding';
    }
    return 'Daily task multiplier applied before final rounding';
  }, [dailyTaskReward, fourthSentenceText, showDailyTaskMultiplier]);

  const dailyTaskMultiplierLabel = useMemo(() => {
    if (!showDailyTaskMultiplier) return '';
    return formatRewardMultiplier(effectiveRewardMultiplier);
  }, [effectiveRewardMultiplier, showDailyTaskMultiplier]);

  const dailyTaskMultiplierColor = useMemo(() => {
    if (dailyTaskReward?.excellenceQualified) {
      return Color.gold();
    }
    if (dailyTaskReward?.basicQualified) {
      return Color.purple();
    }
    return Color.darkGray();
  }, [dailyTaskReward]);

  return (
    <Content
      alreadyChecked={alreadyChecked}
      animateReveal={animateReveal}
      bonusAchieved={bonusAchieved}
      bonusAttempted={bonusAttempted}
      bonusIsCorrect={bonusIsCorrect}
      bonusIsGraded={bonusIsGraded}
      bonusLoading={bonusLoading}
      bonusQuestions={bonusQuestions}
      bonusSelectedChoiceIndex={bonusSelectedChoiceIndex}
      bonusSubmitting={bonusSubmitting}
      burnValue={burnValue}
      cardModalShown={cardModalShown}
      cardOwnStatusText={cardOwnStatusText}
      chosenCard={chosenCard}
      chosenCardColorDescription={chosenCardColorDescription}
      chosenCardId={chosenCardId}
      coinFontSize={coinFontSize}
      currentCard={currentCard}
      currentCardId={currentCardId}
      dailyTaskMultiplierColor={dailyTaskMultiplierColor}
      dailyTaskMultiplierLabel={dailyTaskMultiplierLabel}
      dailyTaskRewardText={dailyTaskRewardText}
      deviceIsMobile={deviceIsMobile}
      displayedBurnValue={displayedBurnValue}
      displayedCoinEarned={displayedCoinEarned}
      displayedRewardAmountBeforeFinalRounding={
        displayedRewardAmountBeforeFinalRounding
      }
      handleBonusConfirm={handleBonusConfirm}
      handleCountdownComplete={handleCountdownComplete}
      handleHide={handleHide}
      handleReveal={handleReveal}
      imagesPreloaded={imagesPreloaded}
      isCardOwned={isCardOwned}
      isRevealPressed={isRevealPressed}
      levelColorHex={levelColorHex}
      linkColor={linkColor}
      loading={loading}
      nextDayTimeStamp={nextDayTimeStamp}
      numCoinsAdjustedToCardOwnership={numCoinsAdjustedToCardOwnership}
      onHideBonusSummary={() => setShowBonusUI(false)}
      onOpenBonusSummary={() => {
        setOpenedFromSummary(true);
        setShowBonusUI(true);
      }}
      onSelectBonusChoice={setBonusSelectedChoiceIndex}
      onSetCardModalShown={setCardModalShown}
      openedFromSummary={openedFromSummary}
      showBonusLine1={showBonusLine1}
      showBonusLine2={showBonusLine2}
      showBonusLine3={showBonusLine3}
      showBonusLine4={showBonusLine4}
      showBonusLine5={showBonusLine5}
      showBonusSentence={showBonusSentence}
      showBonusUI={showBonusUI}
      showDailyTaskMultiplier={showDailyTaskMultiplier}
      showFifthSentence={showFifthSentence}
      showFirstSentence={showFirstSentence}
      showFourthSentence={showFourthSentence}
      showSecondSentence={showSecondSentence}
      showThirdSentence={showThirdSentence}
      xpAdjustedToCardOwnership={xpAdjustedToCardOwnership}
      xpEarned={xpEarned}
      xpFontSize={xpFontSize}
      xpNumberColor={xpNumberColor}
    />
  );

  async function preloadCardImages(cardsToLoad: Card[]) {
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
  }

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

  async function handleBonusConfirm() {
    try {
      setBonusSubmitting(true);
      const { isCorrect, isAlreadyAttempted, rewardAmount, dailyTaskReward } =
        await postDailyBonus(bonusSelectedChoiceIndex);
      if (isAlreadyAttempted) {
        return window.location.reload();
      }
      if (dailyTaskReward) {
        setDailyTaskReward(dailyTaskReward);
      }
      setBonusIsGraded(true);
      bonusIsGradedRef.current = true;
      setBonusIsCorrect(isCorrect);
      setBonusAttempted(true);
      setShowBonusSentence(true);
      setBonusAchieved(!!isCorrect);
      setXPEarned(rewardAmount);

      setShowBonusLine1(true);
      if (isCorrect) {
        onSetUserState({
          userId,
          newState: { twinkleXP: twinkleXP + rewardAmount }
        });
        setTimeout(() => setShowBonusLine2(true), 2000);
        setTimeout(() => setShowBonusLine3(true), 4000);
        setTimeout(() => setShowBonusLine4(true), 6000);
        setTimeout(() => setShowBonusLine5(true), 8000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBonusSubmitting(false);
    }
  }
}
