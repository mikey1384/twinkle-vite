import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import QuestionSlide from './QuestionSlide';
import SlideContainer from './SlideContainer';
import Loading from '~/components/Loading';
import correct from './correct_sound.wav';
import useLiveGrade from './useLiveGrade';

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
  const gotWrongTimerRef = useRef<any>(null);
  const rafIdRef = useRef<number | null>(null);
  const baseTimeRef = useRef<number>(10000);
  const displayedPenaltyRef = useRef(0);
  const liveGradeRef = useRef<string>('');

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
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
        loadingRef.current = true;
        const score = liveGradeRef.current;
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
        if (correctSoundRef.current) {
          try {
            correctSoundRef.current.currentTime = 0;
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
            displayedPenaltyRef.current = 0;
            loadingRef.current = false;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 100));
            handleGameFinish();
          }
        }
      }
    }

    function handleSetGotWrong(index: number) {
      if (loadingRef.current) return;
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

  const { start: startGradeClock, getElapsedMs } = useLiveGrade({
    baseTime: baseTimeRef.current || 10000,
    getWrongCount: () => numWrong.current,
    onGradeChange: (grade: string) => {
      liveGradeRef.current = grade;
    }
  });

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

  function handleCountdownStart() {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    startTimeRef.current =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    elapsedTimeRef.current = 0;
    startGradeClock();

    const activeNode =
      questionObjRef.current?.[questionIds[currentIndex]] ||
      questionObjRef.current?.[currentIndex] ||
      {};
    const activeChoices = Array.isArray(activeNode?.choices)
      ? activeNode.choices
      : [];
    const activeQuestion =
      typeof activeNode?.question === 'string' ? activeNode.question : '';
    let numWords = 0;
    if (activeQuestion) {
      numWords += activeQuestion.split(/\s+/).filter(Boolean).length;
    }
    for (const choice of activeChoices) {
      if (typeof choice === 'string') {
        numWords += choice.split(/\s+/).filter(Boolean).length;
      }
    }

    const longTailMs = Math.max(0, numWords - 20) * 200;
    const estimatedMs =
      6000 + 1000 * Math.sqrt(Math.max(1, numWords)) + longTailMs;
    baseTimeRef.current = Math.min(
      30000,
      Math.max(12000, Math.floor(estimatedMs))
    );
    const sync = () => {
      elapsedTimeRef.current = getElapsedMs();
      rafIdRef.current = requestAnimationFrame(sync);
    };
    rafIdRef.current = requestAnimationFrame(sync);
  }
}
