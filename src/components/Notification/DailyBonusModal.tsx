import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Question from '~/components/Question';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';

export default function DailyBonusModal({ onHide }: { onHide: () => void }) {
  const loadDailyBonus = useAppContext((v) => v.requestHelpers.loadDailyBonus);
  const [questions, setQuestions] = useState<any>([]);
  const [loading, setLoading] = useState(true);
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
                choices: string[];
                answerIndex: number;
              }) => (
                <Question
                  key={question.id}
                  isGraded={false}
                  question={question.question}
                  choices={question.choices}
                  selectedChoiceIndex={selectedChoiceIndex}
                  answerIndex={question.answerIndex}
                  onSelectChoice={(index) => setSelectedChoiceIndex(index)}
                />
              )
            )}
          </>
        )}
        <div style={{ fontWeight: 'bold', marginTop: '2rem' }}>
          Feel free to get help from anyone or anywhere
        </div>
        <div>
          <Button
            style={{ marginTop: '1.5rem' }}
            filled
            disabled={selectedChoiceIndex === undefined}
            color="logoBlue"
            onClick={() => console.log('clicked')}
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
}
