import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Question from './Question';
import Button from '~/components/Button';
import GradientButton from '~/components/Buttons/GradientButton';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import { Color } from '~/constants/css';

Questions.propTypes = {
  isGrading: PropTypes.bool,
  solveObj: PropTypes.object.isRequired,
  onGrade: PropTypes.func.isRequired,
  questions: PropTypes.array.isRequired,
  questionsLoaded: PropTypes.bool,
  onReadAgain: PropTypes.func.isRequired,
  onRetryLoadingQuestions: PropTypes.func.isRequired,
  onSetUserChoiceObj: PropTypes.func.isRequired,
  questionsLoadError: PropTypes.bool,
  userChoiceObj: PropTypes.object.isRequired
};

export default function Questions({
  isGrading,
  solveObj,
  onGrade,
  questions,
  onReadAgain,
  questionsLoaded,
  onRetryLoadingQuestions,
  questionsLoadError,
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

  return questionsLoadError ? (
    <div
      style={{
        marginTop: '5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div>There was an error while loading the questions.</div>
      <GradientButton
        style={{ marginTop: '3rem' }}
        onClick={() => {
          setLoadingProgress(0);
          onRetryLoadingQuestions();
        }}
      >
        Retry
      </GradientButton>
    </div>
  ) : !questionsLoaded ? (
    <div>
      <Loading text="Generating Questions..." />
      <ProgressBar progress={loadingProgress} />
    </div>
  ) : (
    <div>
      {questions.map((question, index) => (
        <Question
          key={question.id}
          isGraded={solveObj.isGraded}
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
        {solveObj.isGraded ? (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                color:
                  solveObj.numCorrect === questions.length
                    ? Color.green()
                    : null,
                fontWeight:
                  solveObj.numCorrect === questions.length ? 'bold' : null
              }}
            >
              {solveObj.numCorrect} / {questions.length} correct
              {solveObj.numCorrect === questions.length ? '!' : ''}
            </div>
            <div style={{ marginTop: '2rem' }}>
              <Button filled color="logoBlue" onClick={onReadAgain}>
                Read Again
              </Button>
            </div>
          </div>
        ) : (
          <GradientButton loading={isGrading} onClick={onGrade}>
            Finish
          </GradientButton>
        )}
      </div>
    </div>
  );
}
