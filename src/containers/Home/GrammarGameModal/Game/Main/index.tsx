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
  currentIndex,
  isOnStreak,
  onSetQuestionObj,
  onGameFinish,
  onSetCurrentIndex,
  questionIds,
  questionObjRef,
  onSetTriggerEffect,
  triggerEffect
}: {
  currentIndex: number;
  isOnStreak: boolean;
  onSetQuestionObj: any;
  onSetTriggerEffect: React.Dispatch<React.SetStateAction<boolean>>;
  onGameFinish: any;
  onSetCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  questionIds: any[];
  questionObjRef: React.RefObject<any>;
  triggerEffect: boolean;
}) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [gotWrong, setGotWrong] = useState(false);
  const isMountedRef = useRef(true);
  const correctSoundRef = useRef<HTMLAudioElement>(null);
  const gotWrongRef = useRef(false);
  const loadingRef = useRef(false);
  const numWrong = useRef(0);
  const elapsedTimeRef = useRef(0);
  const startTimeRef = useRef<number>(0);
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
        question={questionObjRef.current[questionId]?.question}
        choices={questionObjRef.current[questionId]?.choices}
        answerIndex={questionObjRef.current[questionId]?.answerIndex}
        selectedChoiceIndex={
          questionObjRef.current[questionId]?.selectedChoiceIndex
        }
        onCorrectAnswer={handleSelectCorrectAnswer}
        onSetGotWrong={handleSetGotWrong}
        gotWrong={gotWrong}
      />
    ));

    async function handleSelectCorrectAnswer() {
      if (!loadingRef.current && !gotWrongRef.current) {
        // Capture wall-clock elapsed time to avoid timer drift across devices
        const elapsedNow =
          typeof performance !== 'undefined'
            ? performance.now() - (startTimeRef.current || 0)
            : elapsedTimeRef.current;
        clearInterval(timerRef.current);
        loadingRef.current = true;
        const score = handleReturnCalculatedScore({
          elapsedTime: Math.max(0, Math.floor(elapsedNow)),
          currentIndex
        });
        onSetQuestionObj({
          ...questionObjRef.current,
          [currentIndex]: {
            ...questionObjRef.current[currentIndex],
            score,
            selectedChoiceIndex:
              questionObjRef.current[currentIndex].answerIndex
          }
        });
        onSetTriggerEffect((prev) => !prev);
        if (!deviceIsMobile && correctSoundRef.current) {
          try {
            await correctSoundRef.current.play();
          } catch (error) {
            console.error('Error playing sound:', error);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (isMountedRef.current) {
          const nextUnansweredIndex = questionIds.findIndex(
            (id) => !questionObjRef.current[id]?.score
          );
          if (nextUnansweredIndex !== -1) {
            onSetCurrentIndex(nextUnansweredIndex);
            numWrong.current = 0;
            loadingRef.current = false;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 100));
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
        onSetQuestionObj({
          ...questionObjRef.current,
          [currentIndex]: {
            ...questionObjRef.current[currentIndex],
            selectedChoiceIndex: index
          }
        });
        onSetTriggerEffect((prev) => !prev);
      }
      gotWrongRef.current = true;
      gotWrongTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          onSetQuestionObj({
            ...questionObjRef.current,
            [currentIndex]: {
              ...questionObjRef.current[currentIndex],
              wasWrong: true,
              selectedChoiceIndex: null
            }
          });
          setGotWrong(false);
          gotWrongRef.current = false;
        }
      }, delay);
    }
    async function handleGameFinish() {
      const unansweredIndex = questionIds.findIndex(
        (id) => !questionObjRef.current[id]?.score
      );
      if (unansweredIndex !== -1) {
        console.error(
          `Not all questions answered. Returning to question ${
            unansweredIndex + 1
          }`
        );
        onSetCurrentIndex(unansweredIndex);
        return;
      }
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
      const choices = questionObjRef.current?.[currentIndex]?.choices;
      if (Array.isArray(choices)) {
        for (const choice of choices) {
          if (typeof choice === 'string') {
            numWords += choice.split(' ').filter(Boolean).length;
          }
        }
      }

      const baseTime = Math.floor(Math.max(numWords * 1000, 10000));

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
    onSetCurrentIndex,
    onSetQuestionObj,
    onSetTriggerEffect,
    questionIds,
    questionObjRef
  ]);

  const displayedQuestions = useMemo(() => {
    if (!questionIds || !Object.values(questionObjRef.current)?.length)
      return [];
    return questionIds.map((questionId) => questionObjRef.current[questionId]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIds, triggerEffect]);

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
    return Math.ceil(numWrong * 2000);
  }

  function handleCountdownStart() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    // Initialize high-resolution start time
    startTimeRef.current =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    elapsedTimeRef.current = 0;
    // Periodically update elapsed for UI; scoring uses wall-clock at answer time
    timerRef.current = setInterval(() => {
      const now =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
      elapsedTimeRef.current = Math.max(
        0,
        Math.floor(now - startTimeRef.current)
      );
    }, 50);
  }
}
