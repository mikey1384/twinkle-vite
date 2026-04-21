import React from 'react';
import { css } from '@emotion/css';
import AICard from '~/components/AICard';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { qualityProps } from '~/constants/defaultValues';
import { Color } from '~/constants/css';
import {
  bonusFailClass,
  bonusMessageClass,
  coinsNumberClass,
  contentClass,
  contentGridClass,
  rewardAmountClass,
  rewardHighlightClass,
  summaryColCenter,
  summaryColLeft,
  summaryColRight,
  summaryContainerClass,
  summaryHeadlineClass,
  summaryRowClass
} from './styles';

export default function RewardView({
  alreadyChecked,
  animateReveal,
  bonusAchieved,
  burnValue,
  cardOwnStatusText,
  chosenCard,
  chosenCardColorDescription,
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
  isCardOwned,
  isRevealPressed,
  imagesPreloaded,
  levelColorHex,
  linkColor,
  numCoinsAdjustedToCardOwnership,
  onCardClick,
  onOpenBonusSummary,
  onReveal,
  showBonusSentence,
  showDailyTaskMultiplier,
  showFifthSentence,
  showFirstSentence,
  showFourthSentence,
  showSecondSentence,
  showThirdSentence,
  xpEarned,
  xpFontSize,
  xpNumberColor
}: {
  alreadyChecked: boolean;
  animateReveal: boolean;
  bonusAchieved: boolean;
  burnValue: number;
  cardOwnStatusText: string;
  chosenCard: any;
  chosenCardColorDescription: string;
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
  isCardOwned: boolean;
  isRevealPressed: boolean;
  imagesPreloaded: boolean;
  levelColorHex: string;
  linkColor: string;
  numCoinsAdjustedToCardOwnership: string;
  onCardClick: () => void;
  onOpenBonusSummary: () => void;
  onReveal: () => void;
  showBonusSentence: boolean;
  showDailyTaskMultiplier: boolean;
  showFifthSentence: boolean;
  showFirstSentence: boolean;
  showFourthSentence: boolean;
  showSecondSentence: boolean;
  showThirdSentence: boolean;
  xpEarned: number;
  xpFontSize: string;
  xpNumberColor: string;
}) {
  return (
    <div
      className={`${contentGridClass} ${contentClass} ${
        animateReveal || alreadyChecked ? 'revealed' : ''
      }`}
    >
      {!isRevealPressed && !alreadyChecked ? (
        <GameCTAButton
          icon="sparkles"
          variant="gold"
          size="xl"
          shiny
          style={{ marginBottom: '2rem', justifySelf: 'center' }}
          loading={!imagesPreloaded}
          disabled={!imagesPreloaded}
          onClick={onReveal}
        >
          Roll it!
        </GameCTAButton>
      ) : null}
      {currentCard ? (
        <div
          className={
            currentCardId === chosenCard?.id && isRevealPressed && animateReveal
              ? 'chosenCardWrapper'
              : ''
          }
        >
          <AICard
            key={currentCard.id}
            card={currentCard}
            onClick={animateReveal || alreadyChecked ? onCardClick : undefined}
            detailShown
          />
        </div>
      ) : null}
      {(animateReveal || alreadyChecked) && chosenCard ? (
        <div className={summaryContainerClass}>
          {showFirstSentence ? (
            <div
              className={`fadeIn ${summaryHeadlineClass}`}
              style={{ color: levelColorHex }}
            >
              Congratulations!
            </div>
          ) : null}
          {showSecondSentence ? (
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
                  icon="coins"
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
          ) : null}
          {showThirdSentence ? (
            <div className={`fadeIn ${summaryRowClass}`}>
              <div className={summaryColLeft}>{cardOwnStatusText}</div>
              <div className={summaryColCenter}>
                <Icon icon="times" /> {isCardOwned ? '5' : '1/2'}
              </div>
              <div className={summaryColRight}>
                <Icon
                  icon="coins"
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
          ) : null}
          {showFourthSentence ? (
            <div className={`fadeIn ${summaryRowClass}`}>
              <div className={summaryColLeft}>{dailyTaskRewardText}</div>
              <div
                className={summaryColCenter}
                style={{ color: dailyTaskMultiplierColor }}
              >
                {showDailyTaskMultiplier ? (
                  <>
                    <Icon icon="times" /> {dailyTaskMultiplierLabel}
                  </>
                ) : null}
              </div>
              <div className={summaryColRight}>
                <Icon
                  icon="coins"
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
                  {showDailyTaskMultiplier
                    ? displayedRewardAmountBeforeFinalRounding
                    : displayedCoinEarned}
                </span>
              </div>
            </div>
          ) : null}
          {showFifthSentence ? (
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
                  icon="coins"
                  style={{
                    fontSize: coinFontSize,
                    color: Color.brownOrange()
                  }}
                />
                {displayedCoinEarned}
              </div>
            </div>
          ) : null}
          {showBonusSentence ? (
            bonusAchieved ? (
              <div
                className={`fadeIn ${bonusMessageClass}`}
                style={{
                  display: 'grid',
                  gridAutoRows: 'max-content',
                  rowGap: '0.6rem',
                  justifyItems: 'center'
                }}
              >
                <div>...and</div>
                <div
                  className={rewardAmountClass}
                  style={{
                    fontSize: xpFontSize,
                    display: 'grid',
                    gridAutoFlow: 'column',
                    alignItems: 'center',
                    columnGap: '0.6rem'
                  }}
                >
                  <span style={{ color: Color[xpNumberColor]() }}>
                    {xpEarned.toLocaleString()}
                  </span>
                  <span style={{ color: Color.gold() }}>XP</span>
                </div>
                <div>for correctly answering the</div>
                <span
                  className={css`
                    font-weight: bold;
                    cursor: pointer;
                    color: ${Color[linkColor]()};
                    &:hover {
                      text-decoration: underline;
                    }
                  `}
                  onClick={onOpenBonusSummary}
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
                    onClick={onOpenBonusSummary}
                  >
                    bonus question
                  </span>{' '}
                  wrong
                </span>
              </div>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
