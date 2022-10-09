import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import QuestionSlide from './QuestionSlide';
import SlideContainer from './SlideContainer';
import Loading from '~/components/Loading';
import correct from './correct_sound.mp3';

Main.propTypes = {
  onSetGameState: PropTypes.func.isRequired,
  questions: PropTypes.array
};

const correctSound = new Audio(correct);

export default function Main({ onSetGameState, questions }) {
  const timerRef = useRef(null);
  const gotWrongTimerRef = useRef(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questionIds, setQuestionIds] = useState(null);
  const [questionObj, setQuestionObj] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gotWrong, setGotWrong] = useState(false);
  const loadingRef = useRef(false);

  const scoreArray = useMemo(() => {
    return questionIds
      ?.map((id) => questionObj[id].score)
      .filter((score) => !!score);
  }, [questionIds, questionObj]);

  const isOnStreak = useMemo(() => {
    if (!scoreArray || scoreArray?.length < 2) return false;
    for (let score of scoreArray) {
      if (score !== 'S') {
        return false;
      }
    }
    return true;
  }, [scoreArray]);

  useEffect(() => {
    const resultObj = questions.reduce((prev, curr, index) => {
      return {
        ...prev,
        [index]: {
          ...curr,
          selectedChoiceIndex: null
        }
      };
    }, {});
    setQuestionObj(resultObj);
    setQuestionIds([...Array(questions.length).keys()]);
  }, [questions]);

  const Slides = useMemo(() => {
    return questionIds?.map((questionId) => (
      <QuestionSlide
        key={questionId}
        question={questionObj[questionId].question}
        choices={questionObj[questionId].choices}
        answerIndex={questionObj[questionId].answerIndex}
        selectedChoiceIndex={questionObj[questionId].selectedChoiceIndex}
        onCorrectAnswer={handleSelectCorrectAnswer}
        onSetGotWrong={handleSetGotWrong}
        gotWrong={gotWrong}
      />
    ));
    async function handleSelectCorrectAnswer() {
      if (!loadingRef.current) {
        clearTimeout(timerRef.current);
        loadingRef.current = true;
        const score = handleReturnCalculatedScore(elapsedTime);
        setQuestionObj((prev) => ({
          ...prev,
          [currentIndex]: {
            ...prev[currentIndex],
            score: score,
            selectedChoiceIndex: prev[currentIndex].answerIndex
          }
        }));
        correctSound.play();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (currentIndex < questionIds.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          loadingRef.current = false;
        } else {
          handleGameFinish();
        }
      }
    }
    function handleSetGotWrong(index) {
      if (!loadingRef.current) {
        loadingRef.current = true;
        setGotWrong(true);
        setQuestionObj((prev) => ({
          ...prev,
          [currentIndex]: {
            ...prev[currentIndex],
            selectedChoiceIndex: index
          }
        }));
        gotWrongTimerRef.current = setTimeout(() => {
          setQuestionObj((prev) => ({
            ...prev,
            [currentIndex]: {
              ...prev[currentIndex],
              selectedChoiceIndex: null
            }
          }));
          setGotWrong(false);
          loadingRef.current = false;
        }, 1000);
      }
    }
    async function handleGameFinish() {
      setIsCompleted(true);
      setTimeout(() => {
        onSetGameState('finished');
      }, 10000000);
    }

    function handleReturnCalculatedScore(elapsedTime) {
      let baseTime = 1000;
      if (questionObj[currentIndex]) {
        const { choices } = questionObj[currentIndex];
        let numLetters = 0;
        for (let choice of choices) {
          numLetters += choice.length;
        }
        baseTime = numLetters * 9 + 500;
      }
      if (elapsedTime < baseTime * 0.35) return 'S';
      if (elapsedTime < baseTime * 0.55) return 'A';
      if (elapsedTime < baseTime * 0.75) return 'B';
      if (elapsedTime < baseTime * 0.9) return 'C';
      if (elapsedTime < baseTime * 1) return 'D';
      return 'F';
    }
  }, [
    currentIndex,
    elapsedTime,
    gotWrong,
    onSetGameState,
    questionIds,
    questionObj
  ]);

  const displayedQuestions = useMemo(() => {
    if (!questionIds || !Object.values(questionObj)?.length) return [];
    return questionIds.map((questionId) => questionObj[questionId]);
  }, [questionIds, questionObj]);

  return (
    <ErrorBoundary componentPath="GrammarGameModal/Game/Carousel/index">
      <SlideContainer
        questions={displayedQuestions}
        selectedIndex={currentIndex}
        isOnStreak={isOnStreak}
        isCompleted={isCompleted}
        onCountdownStart={handleCountdownStart}
      >
        {Slides || <Loading />}
      </SlideContainer>
    </ErrorBoundary>
  );

  function handleCountdownStart() {
    clearTimeout(timerRef.current);
    setElapsedTime(0);
    timerRef.current = setInterval(() => {
      setElapsedTime((elapsedTime) => elapsedTime + 1);
    }, 1);
  }
}
