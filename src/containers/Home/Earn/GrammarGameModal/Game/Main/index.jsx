import { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import QuestionSlide from './QuestionSlide';
import SlideContainer from './SlideContainer';
import Loading from '~/components/Loading';
import correct from './correct_sound.mp3';
import { isMobile } from '~/helpers';

Main.propTypes = {
  isOnStreak: PropTypes.bool,
  onGameFinish: PropTypes.func.isRequired,
  onSetQuestionObj: PropTypes.func.isRequired,
  questionIds: PropTypes.array,
  questionObj: PropTypes.object
};

const deviceIsMobile = isMobile(navigator);
const correctSound = new Audio(correct);

export default function Main({
  isOnStreak,
  onSetQuestionObj,
  onGameFinish,
  questionIds,
  questionObj
}) {
  const timerRef = useRef(null);
  const gotWrongTimerRef = useRef(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gotWrong, setGotWrong] = useState(false);
  const loadingRef = useRef(false);

  const Slides = useMemo(() => {
    if (!questionIds || questionIds?.length === 0) return null;
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
        onSetQuestionObj((prev) => ({
          ...prev,
          [currentIndex]: {
            ...prev[currentIndex],
            score: score,
            selectedChoiceIndex: prev[currentIndex].answerIndex
          }
        }));
        if (!deviceIsMobile) {
          correctSound.play();
        }
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
        onSetQuestionObj((prev) => ({
          ...prev,
          [currentIndex]: {
            ...prev[currentIndex],
            selectedChoiceIndex: index
          }
        }));
        gotWrongTimerRef.current = setTimeout(() => {
          onSetQuestionObj((prev) => ({
            ...prev,
            [currentIndex]: {
              ...prev[currentIndex],
              wasWrong: true,
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
      onGameFinish();
    }

    function handleReturnCalculatedScore(elapsedTime) {
      const defaultBaseLetterLengthTime = 500;
      const defaultBaseNumWordsTime = 500;
      let baseLetterLengthTime = defaultBaseLetterLengthTime;
      if (questionObj[currentIndex]) {
        const { choices, wasWrong } = questionObj[currentIndex];
        let numLetters = 0;
        for (let choice of choices) {
          numLetters += choice.length;
        }
        baseLetterLengthTime = Math.max(
          numLetters * 9,
          defaultBaseLetterLengthTime
        );
        if (wasWrong) {
          baseLetterLengthTime = Math.min(
            baseLetterLengthTime,
            defaultBaseLetterLengthTime
          );
        }
      }
      let baseNumWordsTime = defaultBaseNumWordsTime;
      if (questionObj[currentIndex]) {
        const { choices, wasWrong } = questionObj[currentIndex];
        let numWords = 0;
        for (let choice of choices) {
          numWords += choice.split(' ').length;
        }
        baseNumWordsTime = numWords * 100;
        if (wasWrong) {
          baseNumWordsTime = Math.min(
            baseNumWordsTime,
            defaultBaseNumWordsTime
          );
        }
      }
      const baseTime = baseLetterLengthTime + baseNumWordsTime;
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
    onGameFinish,
    onSetQuestionObj,
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
