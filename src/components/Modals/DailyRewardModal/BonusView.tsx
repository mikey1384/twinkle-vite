import React from 'react';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import MultipleChoiceQuestion from '~/components/MultipleChoiceQuestion';
import SanitizedHTML from 'react-sanitized-html';
import { cardLevelHash, qualityProps } from '~/constants/defaultValues';
import Icon from '~/components/Icon';
import {
  addCommasToNumber,
  getRenderedTextForVocabQuestions
} from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { BonusQuestion } from './types';
import {
  bonusMessageClass,
  coinsNumberClass,
  contentClass,
  contentGridClass,
  loadingWrapClass,
  summaryColCenter,
  summaryColLeft,
  summaryColRight,
  summaryContainerClass,
  summaryHeadlineClass,
  summaryRowClass
} from './styles';

export default function BonusView({
  bonusIsCorrect,
  bonusIsGraded,
  bonusLoading,
  bonusQuestions,
  bonusSelectedChoiceIndex,
  bonusSubmitting,
  burnValue,
  cardOwnStatusText,
  chosenCard,
  chosenCardColorDescription,
  dailyTaskMultiplierColor,
  dailyTaskMultiplierLabel,
  dailyTaskRewardText,
  deviceIsMobile,
  displayedBurnValue,
  displayedRewardAmountBeforeFinalRounding,
  isCardOwned,
  levelColorHex,
  onConfirm,
  onSelectChoice,
  showBonusLine1,
  showBonusLine2,
  showBonusLine3,
  showBonusLine4,
  showBonusLine5,
  showDailyTaskMultiplier,
  xpAdjustedToCardOwnership,
  xpEarned,
  xpFontSize,
  xpNumberColor
}: {
  bonusIsCorrect: boolean | null;
  bonusIsGraded: boolean;
  bonusLoading: boolean;
  bonusQuestions: BonusQuestion[];
  bonusSelectedChoiceIndex?: number;
  bonusSubmitting: boolean;
  burnValue: number;
  cardOwnStatusText: string;
  chosenCard: any;
  chosenCardColorDescription: string;
  dailyTaskMultiplierColor: string;
  dailyTaskMultiplierLabel: string;
  dailyTaskRewardText: string;
  deviceIsMobile: boolean;
  displayedBurnValue: string;
  displayedRewardAmountBeforeFinalRounding: string;
  isCardOwned: boolean;
  levelColorHex: string;
  onConfirm: () => void;
  onSelectChoice: (index: number) => void;
  showBonusLine1: boolean;
  showBonusLine2: boolean;
  showBonusLine3: boolean;
  showBonusLine4: boolean;
  showBonusLine5: boolean;
  showDailyTaskMultiplier: boolean;
  xpAdjustedToCardOwnership: string;
  xpEarned: number;
  xpFontSize: string;
  xpNumberColor: string;
}) {
  if (bonusLoading) {
    return (
      <div className={`${contentGridClass} ${contentClass}`}>
        <div className={loadingWrapClass}>
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className={`${contentGridClass} ${contentClass}`}>
      {bonusQuestions.map((question) => {
        const appliedQuestion = getRenderedTextForVocabQuestions(
          question.question,
          chosenCard?.word,
          cardLevelHash[chosenCard?.level]?.color || 'green'
        );
        return (
          <MultipleChoiceQuestion
            key={question.id}
            isGraded={bonusIsGraded}
            question={
              <div
                style={{
                  textAlign: 'center',
                  fontFamily:
                    "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                  fontSize: '1.8rem',
                  marginBottom: '5rem'
                }}
              >
                <SanitizedHTML
                  allowedAttributes={{ b: ['style'] }}
                  html={appliedQuestion as string}
                />
              </div>
            }
            choices={question.choices}
            selectedChoiceIndex={bonusSelectedChoiceIndex}
            answerIndex={question.answerIndex}
            onSelectChoice={onSelectChoice}
            style={{ width: '100%', maxWidth: '680px' }}
          />
        );
      })}
      {!bonusIsGraded ? (
        <div style={{ width: '100%' }}>
          <div
            style={{
              fontWeight: 'bold',
              marginTop: '2rem',
              textAlign: 'center'
            }}
          >
            Feel free to ask anyone or look up anywhere for the answer
          </div>
          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            <Button
              variant="solid"
              loading={bonusSubmitting}
              disabled={bonusSelectedChoiceIndex === undefined}
              color="logoBlue"
              onClick={onConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>
      ) : (
        <div className={summaryContainerClass}>
          {showBonusLine1 ? (
            <div
              className={`fadeIn ${summaryHeadlineClass}`}
              style={{
                color: bonusIsCorrect ? levelColorHex : Color.rose(),
                fontWeight: 700,
                ...(!bonusIsCorrect && {
                  fontSize: '1.8rem',
                  whiteSpace: 'normal'
                })
              }}
            >
              {bonusIsCorrect
                ? 'Correct!'
                : 'Oops, wrong answer... Better luck next time!'}
            </div>
          ) : null}
          {showBonusLine2 ? (
            <div className={`fadeIn ${summaryRowClass}`}>
              <div className={summaryColLeft}>
                You rolled {chosenCard?.quality === 'elite' ? 'an' : 'a'}{' '}
                <span
                  style={
                    chosenCard ? qualityProps[chosenCard.quality] : undefined
                  }
                >
                  {chosenCard?.quality}
                </span>{' '}
                <strong style={{ color: levelColorHex }}>
                  {chosenCardColorDescription}
                </strong>{' '}
                card
              </div>
              <div
                className={summaryColCenter}
                style={{ color: Color.redOrange() }}
              >
                {burnValue} {deviceIsMobile ? 'bv' : 'burn value'}
              </div>
              <div className={summaryColRight}>
                <span
                  className={coinsNumberClass}
                  style={{
                    color: Color[xpNumberColor](),
                    whiteSpace: 'nowrap'
                  }}
                >
                  {displayedBurnValue}
                </span>
                <span style={{ color: Color.gold() }}>XP</span>
              </div>
            </div>
          ) : null}
          {showBonusLine3 ? (
            <div className={`fadeIn ${summaryRowClass}`}>
              <div className={summaryColLeft}>{cardOwnStatusText}</div>
              <div className={summaryColCenter}>
                <Icon icon="times" /> {isCardOwned ? '5' : '1/2'}
              </div>
              <div className={summaryColRight}>
                <span
                  className={coinsNumberClass}
                  style={{
                    color: Color[xpNumberColor](),
                    whiteSpace: 'nowrap'
                  }}
                >
                  {xpAdjustedToCardOwnership}
                </span>
                <span style={{ color: Color.gold() }}>XP</span>
              </div>
            </div>
          ) : null}
          {showBonusLine4 ? (
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
                <span
                  className={coinsNumberClass}
                  style={{
                    color: Color[xpNumberColor](),
                    whiteSpace: 'nowrap'
                  }}
                >
                  {showDailyTaskMultiplier
                    ? displayedRewardAmountBeforeFinalRounding
                    : addCommasToNumber(xpEarned)}
                </span>
                <span style={{ color: Color.gold() }}>XP</span>
              </div>
            </div>
          ) : null}
          {showBonusLine5 ? (
            <div className={`fadeIn ${bonusMessageClass}`}>
              You earned{' '}
              <span
                style={{
                  fontWeight: 'bold',
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
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
