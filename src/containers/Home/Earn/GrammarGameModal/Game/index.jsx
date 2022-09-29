import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import StatusMessage from './StatusMessage';
import Loading from '~/components/Loading';
import QuestionCarousel from './QuestionCarousel';

Game.propTypes = {
  questions: PropTypes.array
};

export default function Game({ questions = [] }) {
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [questionIds, setQuestionIds] = useState([]);
  const [questionObj, setQuestionObj] = useState({});
  useEffect(() => {
    const resultObj = questions.reduce((prev, curr, index) => {
      const choices = curr.choices.map((choice) => ({
        label: choice,
        checked: false
      }));
      return {
        ...prev,
        [index]: {
          ...curr,
          choices,
          failMessage: renderFailMessage(),
          selectedChoiceIndex: null
        }
      };

      function renderFailMessage() {
        const answer = curr.choices[curr.answerIndex];
        const answerInBold = answer
          .split(' ')
          .map((word) => `*${word}*`)
          .join(' ');
        return `Wrong. Correct sentence is "${curr.question.replace(
          '_____',
          answerInBold
        )}"`;
      }
    }, {});
    setQuestionObj(resultObj);
    setQuestionIds([...Array(questions.length).keys()]);
  }, [questions]);

  const selectedAnswerIndex = useRef(null);
  const statusRef = useRef(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [conditionPassStatus, setConditionPassStatus] = useState('');
  const objectiveMessage = useMemo(() => {
    if (questionObj[currentSlideIndex]?.type === 'fill in the blank') {
      return 'Choose the word or phrase that correctly completes the sentence';
    }
    return '';
  }, [currentSlideIndex, questionObj]);

  return (
    <div style={{ width: '100%', padding: '0 3rem 2rem 3rem' }}>
      {questionIds.length > 0 ? (
        <QuestionCarousel
          conditionPassStatus={isComplete ? 'complete' : conditionPassStatus}
          currentSlideIndex={currentSlideIndex}
          onAfterSlide={(index) => {
            statusRef.current = null;
            setSubmitDisabled(true);
            setConditionPassStatus('');
            setCurrentSlideIndex(index);
          }}
          onCheckNavCondition={handleCheckNavCondition}
          objectiveMessage={objectiveMessage}
          questionIds={questionIds}
          questionObj={questionObj}
          onSelectChoice={handleSelectChoice}
          submitDisabled={submitDisabled}
        />
      ) : (
        <Loading />
      )}
      {conditionPassStatus && (
        <div style={{ marginTop: '-0.5rem' }}>
          <StatusMessage
            isComplete={isComplete}
            status={conditionPassStatus}
            passMessage="*Correct!*"
            failMessage={questionObj[currentSlideIndex].failMessage}
            onBackToStart={() => console.log('back to start')}
          />
        </div>
      )}
    </div>
  );

  function handleSelectChoice({ selectedIndex, questionId }) {
    if (!statusRef.current) {
      setQuestionObj((questionObj) => ({
        ...questionObj,
        [questionId]: {
          ...questionObj[questionId],
          choices: questionObj[questionId].choices.map((choice, index) =>
            index === selectedIndex
              ? { ...choice, checked: true }
              : { ...choice, checked: false }
          )
        },
        selectedChoiceIndex: selectedIndex
      }));
      selectedAnswerIndex.current = selectedIndex;
      setSubmitDisabled(false);
    }
  }

  function handleCheckNavCondition(onNext) {
    if (statusRef.current === 'pass') {
      if (currentSlideIndex < questionIds.length - 1) {
        return onNext();
      }
      return handleSuccess();
    }
    statusRef.current =
      questionObj[currentSlideIndex].answerIndex === selectedAnswerIndex.current
        ? 'pass'
        : 'fail';
    setConditionPassStatus(statusRef.current);
    selectedAnswerIndex.current = null;
  }

  async function handleSuccess() {
    console.log('success!');
    setIsComplete(true);
  }
}
