import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Question from './Question';
import GradientButton from '~/components/Buttons/GradientButton';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';

Questions.propTypes = {
  questions: PropTypes.array.isRequired,
  questionsLoaded: PropTypes.bool,
  onReadAgain: PropTypes.func.isRequired
};

export default function Questions({ questions, onReadAgain, questionsLoaded }) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [userChoiceObj, setUserChoiceObj] = useState({});

  useEffect(() => {
    if (!questionsLoaded && loadingProgress < 99) {
      setTimeout(() => {
        setLoadingProgress(loadingProgress + 1);
      }, 500);
    }
    if (questionsLoaded) {
      setLoadingProgress(100);
    }
  }, [loadingProgress, questionsLoaded]);

  return !questionsLoaded ? (
    <div>
      <Loading text="Generating Questions..." />
      <ProgressBar progress={loadingProgress} />
    </div>
  ) : (
    <div>
      {questions.map((question, index) => (
        <Question
          key={question.id}
          style={{ marginTop: index === 0 ? 0 : '3rem' }}
          question={question.question}
          choices={question.choices}
          selectedChoiceIndex={userChoiceObj[question.id]}
          answerIndex={question.answerIndex}
          onSelectChoice={(index) =>
            setUserChoiceObj((obj) => ({
              ...obj,
              [question.id]: index
            }))
          }
        />
      ))}
      <div
        style={{
          marginTop: '10rem',
          width: '100%',
          justifyContent: 'center',
          display: 'flex'
        }}
      >
        <GradientButton onClick={onReadAgain}>Read Again</GradientButton>
      </div>
    </div>
  );
}
