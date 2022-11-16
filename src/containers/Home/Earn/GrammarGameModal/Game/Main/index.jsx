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
const delay = 1000;
let elapsedTime = 0;
let timer = null;
let gotWrongTimer = null;

export default function Main({
  isOnStreak,
  onSetQuestionObj,
  onGameFinish,
  questionIds,
  questionObj
}) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gotWrong, setGotWrong] = useState(false);
  const loadingRef = useRef(false);
  const isWrongRef = useRef(false);
  const numWrong = useRef(0);

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
        clearTimeout(timer);
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
          numWrong.current = 0;
          loadingRef.current = false;
        } else {
          handleGameFinish();
        }
      }
    }
    function handleSetGotWrong(index) {
      if (!isWrongRef.current) {
        isWrongRef.current = true;
      }
      numWrong.current = numWrong.current + 1;
      clearTimeout(gotWrongTimer);
      if (!loadingRef.current) {
        setGotWrong(true);
        onSetQuestionObj((prev) => ({
          ...prev,
          [currentIndex]: {
            ...prev[currentIndex],
            selectedChoiceIndex: index
          }
        }));
      }
      gotWrongTimer = setTimeout(() => {
        onSetQuestionObj((prev) => ({
          ...prev,
          [currentIndex]: {
            ...prev[currentIndex],
            wasWrong: true,
            selectedChoiceIndex: null
          }
        }));
        setGotWrong(false);
        isWrongRef.current = false;
      }, delay);
    }
    async function handleGameFinish() {
      setIsCompleted(true);
      onGameFinish();
    }

    function handleReturnCalculatedScore(elapsedTime) {
      const defaultBaseLetterLengthTime = 500;
      let baseLetterLengthTime = defaultBaseLetterLengthTime;
      if (questionObj[currentIndex]) {
        const { choices, wasWrong } = questionObj[currentIndex];
        let numLetters = 0;
        for (let choice of choices) {
          numLetters += choice.length;
        }
        baseLetterLengthTime = Math.max(
          numLetters * 6,
          defaultBaseLetterLengthTime
        );
        if (wasWrong) {
          baseLetterLengthTime = Math.min(
            baseLetterLengthTime,
            defaultBaseLetterLengthTime
          );
        }
      }
      let baseNumWordsTime = baseLetterLengthTime;
      if (questionObj[currentIndex]) {
        const { choices, wasWrong } = questionObj[currentIndex];
        let numWords = 0;
        for (let choice of choices) {
          numWords += choice.split(' ').length;
        }
        baseNumWordsTime = Math.max(numWords * 40, baseLetterLengthTime);
        if (wasWrong) {
          baseNumWordsTime = Math.min(baseNumWordsTime, baseLetterLengthTime);
        }
      }
      const measureTime =
        Number(elapsedTime) + handleCalculatePenalty(numWrong.current);
      const baseTime = baseLetterLengthTime + baseNumWordsTime;
      if (measureTime < baseTime * 0.37) return 'S';
      if (measureTime < baseTime * 0.5) return 'A';
      if (measureTime < baseTime * 0.6) return 'B';
      if (measureTime < baseTime * 0.7) return 'C';
      if (measureTime < baseTime * 1) return 'D';
      return 'F';
    }
  }, [
    currentIndex,
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

  function handleCalculatePenalty(numWrong) {
    if (numWrong < 1) return 0;
    return numWrong * 200;
  }
}

function handleCountdownStart() {
  clearTimeout(timer);
  elapsedTime = 0;
  timer = setInterval(() => {
    elapsedTime = elapsedTime + 1;
  }, 1);
}
