import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Question from '~/components/Question';
import Loading from '~/components/Loading';
import SanitizedHTML from 'react-sanitized-html';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import {
  addCommasToNumber,
  getRenderedTextForVocabQuestions
} from '~/helpers/stringHelpers';
import {
  cardLevelHash,
  qualityProps,
  returnCardBurnXP
} from '~/constants/defaultValues';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

const colors: {
  [key: number]: string;
} = {
  1: 'blue',
  2: 'pink',
  3: 'orange',
  4: 'magenta',
  5: 'gold'
};

export default function DailyBonusModal({
  isBonusAttempted,
  isBonusAchieved,
  modalOverModal,
  xpEarned,
  onHide,
  onSetDailyBonusAttempted
}: {
  isBonusAttempted?: boolean;
  isBonusAchieved?: boolean;
  modalOverModal?: boolean;
  xpEarned?: number;
  onHide: () => void;
  onSetDailyBonusAttempted?: () => void;
}) {
  const { userId, twinkleXP } = useKeyContext((v) => v.myState);
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const loadDailyBonus = useAppContext((v) => v.requestHelpers.loadDailyBonus);
  const postDailyBonus = useAppContext((v) => v.requestHelpers.postDailyBonus);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [questions, setQuestions] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCardOwned, setIsCardOwned] = useState(false);
  const [isGraded, setIsGraded] = useState(false);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number>();
  const [showFirstSentence, setShowFirstSentence] = useState(false);
  const [showSecondSentence, setShowSecondSentence] = useState(false);
  const [showThirdSentence, setShowThirdSentence] = useState(false);
  const [showFourthSentence, setShowFourthSentence] = useState(false);
  const [showFifthSentence, setShowFifthSentence] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [chosenCardId, setChosenCardId] = useState<number | null>(null);
  const chosenCard = useMemo(() => {
    if (!chosenCardId) return null;
    return cardObj[chosenCardId];
  }, [cardObj, chosenCardId]);
  const chosenCardColorDescription = useMemo(() => {
    return chosenCard ? colors[chosenCard?.level] : '';
  }, [chosenCard]);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
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

  const displayedBurnValue = useMemo(() => {
    return addCommasToNumber(burnValue);
  }, [burnValue]);

  const xpAdjustedToCardOwnership = useMemo(() => {
    if (!chosenCard) {
      return 0;
    }
    return addCommasToNumber(isCardOwned ? burnValue : burnValue / 10);
  }, [burnValue, chosenCard, isCardOwned]);

  const fourthSentenceText = useMemo(() => {
    const defaultXPEarned = isCardOwned ? burnValue : burnValue / 10;
    if (defaultXPEarned < 100) {
      return 'Minimum reward amount is 100';
    }
    if (defaultXPEarned < 1000) {
      return '...rounded to the nearest hundred';
    }
    return '...rounded to the nearest thousand';
  }, [burnValue, isCardOwned]);

  const displayedXPEarned = useMemo(() => {
    return addCommasToNumber(rewardAmount);
  }, [rewardAmount]);

  const isGradedRef = useRef(isGraded);

  useEffect(() => {
    init();
    async function init() {
      try {
        setLoading(true);
        const { questions, chosenCard, isCardOwned, isUnavailable } =
          await loadDailyBonus();
        if (isUnavailable) {
          return window.location.reload();
        }
        setChosenCardId(chosenCard?.id);
        onUpdateAICard({
          cardId: chosenCard?.id,
          newState: chosenCard
        });
        setIsCardOwned(isCardOwned);
        setQuestions(questions);
        if (isBonusAttempted) {
          setIsGraded(true);
          if (isBonusAchieved) {
            setShowFirstSentence(true);
            setShowSecondSentence(true);
            setShowThirdSentence(true);
            setShowFourthSentence(true);
            setShowFifthSentence(true);
            setSelectedChoiceIndex(questions[0].answerIndex);
            setRewardAmount(xpEarned || 0);
          }
          setIsCorrect(!!isBonusAchieved);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    return () => {
      if (isGradedRef.current) {
        onSetDailyBonusAttempted?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      modalOverModal={modalOverModal}
      closeWhenClickedOutside={!!isBonusAttempted}
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
      `}
      wrapped
      onHide={onHide}
    >
      <header>
        {isBonusAttempted
          ? isBonusAchieved
            ? 'Bonus Earned!'
            : 'Bonus Failed...'
          : 'Bonus Chance!'}
      </header>
      <main>
        {loading ? (
          <Loading />
        ) : (
          <>
            {questions.map(
              (question: {
                id: number;
                question: string;
                word: string;
                wordLevel: number;
                choices: string[];
                answerIndex: number;
              }) => {
                const appliedQuestion = getRenderedTextForVocabQuestions(
                  question.question,
                  chosenCard?.word,
                  cardLevelHash[chosenCard?.level]?.color || 'green'
                );
                return (
                  <Question
                    key={question.id}
                    isGraded={isGraded}
                    question={
                      <SanitizedHTML
                        allowedAttributes={{ b: ['style'] }}
                        html={appliedQuestion as string}
                      />
                    }
                    choices={question.choices}
                    selectedChoiceIndex={selectedChoiceIndex}
                    answerIndex={question.answerIndex}
                    onSelectChoice={setSelectedChoiceIndex}
                  />
                );
              }
            )}
          </>
        )}
        {!loading && !isGraded && (
          <div style={{ fontWeight: 'bold', marginTop: '2rem' }}>
            Feel free to ask anyone or look up anywhere for the answer
          </div>
        )}
        {!isGraded && (
          <div>
            <Button
              style={{ marginTop: '1.5rem' }}
              filled
              loading={submitting}
              disabled={selectedChoiceIndex === undefined}
              color="logoBlue"
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </div>
        )}
        {isGraded && (
          <div
            style={{
              marginTop: '2.5rem',
              width: '80%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}
          >
            {showFirstSentence && (
              <div
                className="fadeIn"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontWeight: isCorrect ? 'bold' : 'normal'
                }}
              >
                {isCorrect
                  ? 'Correct!'
                  : 'Oops! Wrong answer... Better luck next time'}
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
                  card
                </div>
                <div>{burnValue} burn value</div>
                <div
                  style={{
                    fontWeight: showThirdSentence ? 'normal' : 'bold',
                    textAlign: 'right'
                  }}
                >
                  {displayedBurnValue} XP
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
                  {xpAdjustedToCardOwnership} XP
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
                  {displayedXPEarned} XP
                </div>
              </div>
            )}
            {showFifthSentence && (
              <div
                className="fadeIn"
                style={{ marginTop: '2rem', textAlign: 'center' }}
              >
                You earned{' '}
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
                    {displayedXPEarned}
                  </span>{' '}
                  <span style={{ color: Color.gold() }}>XP</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  async function handleConfirm() {
    try {
      setSubmitting(true);
      const { isCorrect, isAlreadyAttempted, rewardAmount } =
        await postDailyBonus(selectedChoiceIndex);
      if (isAlreadyAttempted) {
        return window.location.reload();
      }
      setIsGraded(true);
      isGradedRef.current = true;
      setIsCorrect(isCorrect);
      setRewardAmount(rewardAmount);

      setShowFirstSentence(true);
      if (isCorrect) {
        onSetUserState({
          userId,
          newState: { twinkleXP: twinkleXP + rewardAmount }
        });
        setTimeout(() => setShowSecondSentence(true), 2000);
        setTimeout(() => setShowThirdSentence(true), 4000);
        setTimeout(() => setShowFourthSentence(true), 6000);
        setTimeout(() => setShowFifthSentence(true), 8000);
      }
    } catch (error) {
      console.error(error);
    }
  }
}
