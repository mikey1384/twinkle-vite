import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import QuestionSlide from './QuestionSlide';
import SlideContainer from './SlideContainer';
import Loading from '~/components/Loading';
import correct from './correct_sound.mp3';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);
const delay = 1000;

export default function Main({
  isOnStreak,
  onSetQuestionObj,
  onGameFinish,
  questionIds,
  questionObj = {}
}: {
  isOnStreak: boolean;
  onSetQuestionObj: any;
  onGameFinish: any;
  questionIds: any[];
  questionObj: any;
}) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gotWrong, setGotWrong] = useState(false);
  const isMountedRef = useRef(true);
  const correctSoundRef = useRef<HTMLAudioElement>(null);
  const gotWrongRef = useRef(false);
  const loadingRef = useRef(false);
  const numWrong = useRef(0);
  const elapsedTimeRef = useRef(0);
  const timerRef = useRef<any>(null);
  const gotWrongTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (gotWrongTimerRef.current) {
        clearTimeout(gotWrongTimerRef.current);
      }
    };
  }, []);

  const Slides = useMemo(() => {
    if (!questionIds || questionIds?.length === 0) return null;
    return questionIds.map((questionId) => (
      <QuestionSlide
        key={questionId}
        question={questionObj[questionId]?.question}
        choices={questionObj[questionId]?.choices}
        answerIndex={questionObj[questionId]?.answerIndex}
        selectedChoiceIndex={questionObj[questionId]?.selectedChoiceIndex}
        onCorrectAnswer={handleSelectCorrectAnswer}
        onSetGotWrong={handleSetGotWrong}
        gotWrong={gotWrong}
      />
    ));

    async function handleSelectCorrectAnswer() {
      if (!loadingRef.current && !gotWrongRef.current) {
        clearInterval(timerRef.current);
        loadingRef.current = true;
        const score = handleReturnCalculatedScore({
          elapsedTime: elapsedTimeRef.current,
          currentIndex
        });
        onSetQuestionObj((prev: any) => ({
          ...prev,
          [currentIndex]: {
            ...prev[currentIndex],
            score,
            selectedChoiceIndex: prev[currentIndex].answerIndex
          }
        }));
        if (!deviceIsMobile) {
          try {
            if (correctSoundRef.current) {
              correctSoundRef.current.play();
            }
          } catch (error) {
            console.error('Error playing sound:', error);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (isMountedRef.current) {
          if (currentIndex < questionIds.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            numWrong.current = 0;
            loadingRef.current = false;
          } else {
            handleGameFinish();
          }
        }
      }
    }

    function handleSetGotWrong(index: number) {
      numWrong.current = numWrong.current + 1;
      clearTimeout(gotWrongTimerRef.current);
      if (!loadingRef.current) {
        setGotWrong(true);
        onSetQuestionObj((prev: any) => ({
          ...prev,
          [currentIndex]: {
            ...prev[currentIndex],
            selectedChoiceIndex: index
          }
        }));
      }
      gotWrongRef.current = true;
      gotWrongTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          onSetQuestionObj((prev: any) => ({
            ...prev,
            [currentIndex]: {
              ...prev[currentIndex],
              wasWrong: true,
              selectedChoiceIndex: null
            }
          }));
          setGotWrong(false);
          gotWrongRef.current = false;
        }
      }, delay);
    }
    async function handleGameFinish() {
      setIsCompleted(true);
      onGameFinish();
    }

    function handleReturnCalculatedScore({
      elapsedTime,
      currentIndex
    }: {
      elapsedTime: number;
      currentIndex: number;
    }) {
      let numWords = 0;
      const choices = questionObj?.[currentIndex]?.choices;
      if (Array.isArray(choices)) {
        for (const choice of choices) {
          if (typeof choice === 'string') {
            numWords += choice.split(' ').filter(Boolean).length;
          }
        }
      }

      // Calculate the base time
      const baseTime = Math.max(numWords * 100, 1500);

      // Apply penalty for wrong answers
      const measureTime =
        elapsedTime + handleCalculatePenalty(numWrong.current);

      // Return the grade
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
    <ErrorBoundary componentPath="GrammarGameModal/Game/Main/index">
      <SlideContainer
        questions={displayedQuestions}
        selectedIndex={currentIndex}
        isOnStreak={isOnStreak}
        isCompleted={isCompleted}
        onCountdownStart={handleCountdownStart}
      >
        {Slides || <Loading />}
      </SlideContainer>
      <audio src={correct} ref={correctSoundRef} preload="auto" />
    </ErrorBoundary>
  );

  function handleCalculatePenalty(numWrong: number) {
    if (numWrong < 1) return 0;
    return numWrong * 200;
  }

  function handleCountdownStart() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    elapsedTimeRef.current = 0;
    timerRef.current = setInterval(() => {
      elapsedTimeRef.current = elapsedTimeRef.current + 1;
    }, 1);
  }
}
