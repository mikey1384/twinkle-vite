import { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import QuestionViewer from './QuestionViewer';
import { useAppContext } from '~/contexts';

export default function Game() {
  const [questions, setQuestions] = useState([]);
  const loadGrammarGame = useAppContext(
    (v) => v.requestHelpers.loadGrammarGame
  );
  useEffect(() => {
    init();
    async function init() {
      const questions = await loadGrammarGame();
      setQuestions(questions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: '100%', padding: '0' }}>
      {questions.length > 0 ? (
        <QuestionViewer questions={questions} />
      ) : (
        <Loading />
      )}
    </div>
  );
}
