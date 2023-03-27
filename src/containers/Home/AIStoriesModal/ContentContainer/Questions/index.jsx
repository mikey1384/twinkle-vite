import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Question from './Question';
import Button from '~/components/Button';
import GradientButton from '~/components/Buttons/GradientButton';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';

Questions.propTypes = {
  isGraded: PropTypes.bool,
  onGrade: PropTypes.func.isRequired,
  questions: PropTypes.array.isRequired,
  questionsLoaded: PropTypes.bool,
  onReadAgain: PropTypes.func.isRequired,
  onSetUserChoiceObj: PropTypes.func.isRequired,
  userChoiceObj: PropTypes.object.isRequired
};

export default function Questions({
  isGraded,
  onGrade,
  questions,
  onReadAgain,
  questionsLoaded,
  userChoiceObj,
  onSetUserChoiceObj
}) {
  const [loadingProgress, setLoadingProgress] = useState(0);

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
          isGraded={isGraded}
          style={{ marginTop: index === 0 ? 0 : '3rem' }}
          question={question.question}
          choices={question.choices}
          selectedChoiceIndex={userChoiceObj[question.id]}
          answerIndex={question.answerIndex}
          onSelectChoice={(index) =>
            onSetUserChoiceObj((obj) => ({
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
        {isGraded ? (
          <Button filled color="logoBlue" onClick={onReadAgain}>
            Read Again
          </Button>
        ) : (
          <GradientButton onClick={onGrade}>Finish</GradientButton>
        )}
      </div>
    </div>
  );
}
