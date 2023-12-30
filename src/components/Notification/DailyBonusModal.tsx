import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Question from '~/components/Question';
import Loading from '~/components/Loading';
import SanitizedHTML from 'react-sanitized-html';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { cardLevelHash } from '~/constants/defaultValues';
import { useAppContext } from '~/contexts';

export default function DailyBonusModal({ onHide }: { onHide: () => void }) {
  const loadDailyBonus = useAppContext((v) => v.requestHelpers.loadDailyBonus);
  const postDailyBonus = useAppContext((v) => v.requestHelpers.postDailyBonus);
  const [questions, setQuestions] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isGraded, setIsGraded] = useState(false);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number>();
  const [showFirstSentence, setShowFirstSentence] = useState(false);
  const [showSecondSentence, setShowSecondSentence] = useState(false);
  const [showThirdSentence, setShowThirdSentence] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [rewardAmount, setRewardAmount] = useState<number>(0);

  useEffect(() => {
    init();
    async function init() {
      try {
        setLoading(true);
        const questions = await loadDailyBonus();
        setQuestions(questions);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
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
      <header>Bonus Chance!</header>
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
                const appliedQuestion = getRenderedText(
                  question.question,
                  question.word,
                  cardLevelHash[question.wordLevel]?.color || 'green'
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
                    onSelectChoice={(index) => setSelectedChoiceIndex(index)}
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
              display: 'flex',
              width: '100%',
              justifyContent: 'center',
              flexDirection: 'column',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}
          >
            {showFirstSentence && (
              <div className="fadeIn">
                {isCorrect
                  ? 'Correct!'
                  : 'Oops! Wrong answer... Better luck next time'}
              </div>
            )}
            {showSecondSentence && (
              <div className="fadeIn">{`You've earned ${rewardAmount} XP`}</div>
            )}
            {showThirdSentence && (
              <div className="fadeIn">Some additional message or feedback</div>
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
      const response = await postDailyBonus(selectedChoiceIndex);
      setIsGraded(true);
      setIsCorrect(response.isCorrect);
      setRewardAmount(response.rewardAmount);

      setShowFirstSentence(true);
      if (response.isCorrect) {
        setTimeout(() => setShowSecondSentence(true), 1500);
        setTimeout(() => setShowThirdSentence(true), 3000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  function getRenderedText(text: string, word: string, color: string) {
    if (word) {
      const regex = new RegExp(word, 'gi');
      return text.replace(
        regex,
        `<b style="color:${Color[color]()}">${word}</b>`
      );
    }
    return text || '';
  }
}
