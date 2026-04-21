import React from 'react';
import { css } from '@emotion/css';
import AICardModal from '~/components/Modals/AICardModal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import Modal from '~/components/Modal';
import NextDayCountdown from '~/components/NextDayCountdown';
import { Color } from '~/constants/css';
import BonusView from './BonusView';
import RewardView from './RewardView';
import { loadingWrapClass } from './styles';

export default function Content({
  alreadyChecked,
  animateReveal,
  bonusAchieved,
  bonusAttempted,
  bonusIsCorrect,
  bonusIsGraded,
  bonusLoading,
  bonusQuestions,
  bonusSelectedChoiceIndex,
  bonusSubmitting,
  burnValue,
  cardModalShown,
  cardOwnStatusText,
  chosenCard,
  chosenCardColorDescription,
  chosenCardId,
  coinFontSize,
  currentCard,
  currentCardId,
  dailyTaskMultiplierColor,
  dailyTaskMultiplierLabel,
  dailyTaskRewardText,
  deviceIsMobile,
  displayedBurnValue,
  displayedCoinEarned,
  displayedRewardAmountBeforeFinalRounding,
  handleBonusConfirm,
  handleCountdownComplete,
  handleHide,
  handleReveal,
  imagesPreloaded,
  isCardOwned,
  isRevealPressed,
  levelColorHex,
  linkColor,
  loading,
  nextDayTimeStamp,
  numCoinsAdjustedToCardOwnership,
  onHideBonusSummary,
  onOpenBonusSummary,
  onSelectBonusChoice,
  onSetCardModalShown,
  openedFromSummary,
  showBonusLine1,
  showBonusLine2,
  showBonusLine3,
  showBonusLine4,
  showBonusLine5,
  showBonusSentence,
  showBonusUI,
  showDailyTaskMultiplier,
  showFifthSentence,
  showFirstSentence,
  showFourthSentence,
  showSecondSentence,
  showThirdSentence,
  xpAdjustedToCardOwnership,
  xpEarned,
  xpFontSize,
  xpNumberColor
}: {
  alreadyChecked: boolean;
  animateReveal: boolean;
  bonusAchieved: boolean;
  bonusAttempted: boolean;
  bonusIsCorrect: boolean | null;
  bonusIsGraded: boolean;
  bonusLoading: boolean;
  bonusQuestions: any[];
  bonusSelectedChoiceIndex?: number;
  bonusSubmitting: boolean;
  burnValue: number;
  cardModalShown: boolean;
  cardOwnStatusText: string;
  chosenCard: any;
  chosenCardColorDescription: string;
  chosenCardId: number;
  coinFontSize: string;
  currentCard: any;
  currentCardId: number;
  dailyTaskMultiplierColor: string;
  dailyTaskMultiplierLabel: string;
  dailyTaskRewardText: string;
  deviceIsMobile: boolean;
  displayedBurnValue: string;
  displayedCoinEarned: string;
  displayedRewardAmountBeforeFinalRounding: string;
  handleBonusConfirm: () => void;
  handleCountdownComplete: () => void;
  handleHide: () => void;
  handleReveal: () => void;
  imagesPreloaded: boolean;
  isCardOwned: boolean;
  isRevealPressed: boolean;
  levelColorHex: string;
  linkColor: string;
  loading: boolean;
  nextDayTimeStamp: number;
  numCoinsAdjustedToCardOwnership: string;
  onHideBonusSummary: () => void;
  onOpenBonusSummary: () => void;
  onSelectBonusChoice: (index: number) => void;
  onSetCardModalShown: (shown: boolean) => void;
  openedFromSummary: boolean;
  showBonusLine1: boolean;
  showBonusLine2: boolean;
  showBonusLine3: boolean;
  showBonusLine4: boolean;
  showBonusLine5: boolean;
  showBonusSentence: boolean;
  showBonusUI: boolean;
  showDailyTaskMultiplier: boolean;
  showFifthSentence: boolean;
  showFirstSentence: boolean;
  showFourthSentence: boolean;
  showSecondSentence: boolean;
  showThirdSentence: boolean;
  xpAdjustedToCardOwnership: string;
  xpEarned: number;
  xpFontSize: string;
  xpNumberColor: string;
}) {
  const modalTitle = getModalTitle({
    bonusIsCorrect,
    bonusIsGraded,
    openedFromSummary,
    showBonusUI
  });
  const flashColor = levelColorHex || 'transparent';
  const modalClass = css`
    @keyframes flashEffect {
      0% {
        background-color: transparent;
      }
      50% {
        background-color: ${flashColor};
      }
      100% {
        background-color: transparent;
      }
    }

    .flashBackground {
      animation: flashEffect 0.6s ease-out;
    }

    box-shadow: none !important;
  `;
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
      font-weight: bold;
      color: ${Color.black(0.75)};
      line-height: 1.2;
      text-align: center;
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

  const header = showBonusUI ? (
    <div
      className={css`
        display: grid;
        grid-template-columns: ${openedFromSummary
          ? 'max-content 1fr'
          : '1fr'};
        align-items: center;
        column-gap: 1rem;
        width: 100%;
      `}
    >
      {openedFromSummary ? (
        <Button
          variant="ghost"
          shape="pill"
          size="sm"
          color={linkColor}
          onClick={onHideBonusSummary}
        >
          <Icon icon="chevron-left" /> Back to summary
        </Button>
      ) : null}
      {modalTitle ? (
        <div
          className={css`
            text-align: left;
            font-weight: 600;
          `}
        >
          {modalTitle}
        </div>
      ) : (
        <div />
      )}
    </div>
  ) : undefined;

  const footer = (
    <div className={footerClass}>
      <div className="countdown-wrapper">
        <div className="countdown-block">
          {!loading && showFifthSentence ? (
            <>
              <Icon
                icon="sparkles"
                style={{ color: Color.gold(), fontSize: '1.8rem' }}
              />
              <NextDayCountdown
                label="Next Daily Reward"
                nextDayTimeStamp={nextDayTimeStamp}
                onComplete={handleCountdownComplete}
                className="countdown-label"
                timerClassName="countdown-timer"
              />
            </>
          ) : null}
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
      <Modal
        modalKey="DailyRewardModal"
        isOpen
        onClose={handleHide}
        title={modalTitle}
        header={header}
        closeOnBackdropClick={showBonusUI ? !!bonusAttempted : false}
        size="lg"
        allowOverflow
        className={modalClass}
        footer={footer}
      >
        <div
          className={animateReveal ? 'flashBackground' : ''}
          style={{ width: '100%' }}
        >
          {loading ? (
            <div className={loadingWrapClass}>
              <Loading />
            </div>
          ) : showBonusUI ? (
            <BonusView
              bonusIsCorrect={bonusIsCorrect}
              bonusIsGraded={bonusIsGraded}
              bonusLoading={bonusLoading}
              bonusQuestions={bonusQuestions}
              bonusSelectedChoiceIndex={bonusSelectedChoiceIndex}
              bonusSubmitting={bonusSubmitting}
              burnValue={burnValue}
              cardOwnStatusText={cardOwnStatusText}
              chosenCard={chosenCard}
              chosenCardColorDescription={chosenCardColorDescription}
              dailyTaskMultiplierColor={dailyTaskMultiplierColor}
              dailyTaskMultiplierLabel={dailyTaskMultiplierLabel}
              dailyTaskRewardText={dailyTaskRewardText}
              deviceIsMobile={deviceIsMobile}
              displayedBurnValue={displayedBurnValue}
              displayedRewardAmountBeforeFinalRounding={
                displayedRewardAmountBeforeFinalRounding
              }
              isCardOwned={isCardOwned}
              levelColorHex={levelColorHex}
              onConfirm={handleBonusConfirm}
              onSelectChoice={onSelectBonusChoice}
              showBonusLine1={showBonusLine1}
              showBonusLine2={showBonusLine2}
              showBonusLine3={showBonusLine3}
              showBonusLine4={showBonusLine4}
              showBonusLine5={showBonusLine5}
              showDailyTaskMultiplier={showDailyTaskMultiplier}
              xpAdjustedToCardOwnership={xpAdjustedToCardOwnership}
              xpEarned={xpEarned}
              xpFontSize={xpFontSize}
              xpNumberColor={xpNumberColor}
            />
          ) : (
            <RewardView
              alreadyChecked={alreadyChecked}
              animateReveal={animateReveal}
              bonusAchieved={bonusAchieved}
              burnValue={burnValue}
              cardOwnStatusText={cardOwnStatusText}
              chosenCard={chosenCard}
              chosenCardColorDescription={chosenCardColorDescription}
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
              isCardOwned={isCardOwned}
              isRevealPressed={isRevealPressed}
              imagesPreloaded={imagesPreloaded}
              levelColorHex={levelColorHex}
              linkColor={linkColor}
              numCoinsAdjustedToCardOwnership={numCoinsAdjustedToCardOwnership}
              onCardClick={() => onSetCardModalShown(true)}
              onOpenBonusSummary={onOpenBonusSummary}
              onReveal={handleReveal}
              showBonusSentence={showBonusSentence}
              showDailyTaskMultiplier={showDailyTaskMultiplier}
              showFifthSentence={showFifthSentence}
              showFirstSentence={showFirstSentence}
              showFourthSentence={showFourthSentence}
              showSecondSentence={showSecondSentence}
              showThirdSentence={showThirdSentence}
              xpEarned={xpEarned}
              xpFontSize={xpFontSize}
              xpNumberColor={xpNumberColor}
            />
          )}
        </div>
      </Modal>
      {cardModalShown ? (
        <AICardModal
          cardId={chosenCardId}
          modalOverModal
          onHide={() => onSetCardModalShown(false)}
        />
      ) : null}
    </>
  );
}

function getModalTitle({
  bonusIsCorrect,
  bonusIsGraded,
  openedFromSummary,
  showBonusUI
}: {
  bonusIsCorrect: boolean | null;
  bonusIsGraded: boolean;
  openedFromSummary: boolean;
  showBonusUI: boolean;
}) {
  if (openedFromSummary) {
    return '';
  }
  if (showBonusUI) {
    if (bonusIsGraded) {
      return bonusIsCorrect ? 'Bonus Earned!' : 'Bonus Failed...';
    }
    return 'Bonus Chance!';
  }
  return 'Daily Reward';
}
