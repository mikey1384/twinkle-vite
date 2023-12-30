import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Question from '~/components/Question';
import Loading from '~/components/Loading';
import SanitizedHTML from 'react-sanitized-html';
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
    <Modal wrapped onHide={onHide}>
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
                wordLevel: number;
                choices: string[];
                answerIndex: number;
                word: string;
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
        {!loading && (
          <div style={{ fontWeight: 'bold', marginTop: '2rem' }}>
            Feel free to ask anyone or look up anywhere for the answer
          </div>
        )}
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
      const { isCorrect, rewardAmount } = await postDailyBonus(
        selectedChoiceIndex
      );
      setIsGraded(true);
      alert(
        isCorrect
          ? `Correct! You've earned ${rewardAmount} points`
          : 'Incorrect! Try again tomorrow'
      );
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  function getRenderedText(text: string, word: string, color: string) {
    if (word) {
      const regex = new RegExp(word, 'gi');
      const textToDisplay = text.replace(regex, (matched) => {
        return `<b style="color:${Color[color]()}">${matched}</b>`;
      });

      return textToDisplay;
    }
    return prompt || '';
  }
}
