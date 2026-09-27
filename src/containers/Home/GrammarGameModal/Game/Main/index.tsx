import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import QuestionSlide from './QuestionSlide';
import SlideContainer from './SlideContainer';
import Loading from '~/components/Loading';
import correct from './correct_sound.wav';
import useLiveGrade from './hooks/useLiveGrade';
import { useAgentScreenState } from '~/helpers/websiteAgentScreenState';
import type {
  GrammarAnswerCheck,
  GrammarAnswerResult
} from '../../answerCheck';

const delay = 1000;

export default function Main({
  currentIndex,
  isOnStreak,
  onCheckAnswer,
  onSessionLost,
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
  onCheckAnswer: GrammarAnswerCheck;
  onSessionLost: () => void;
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
  // The pick being checked on the server; shown pressed until it answers.
  const [pendingChoiceIndex, setPendingChoiceIndex] = useState<number | null>(
    null
  );
  const checkingRef = useRef(false);
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

  useEffect(() => {
    if (correctSoundRef.current) {
      correctSoundRef.current.volume = 1;
    }
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
        pendingChoiceIndex={pendingChoiceIndex}
        onSelect={handleSelectChoice}
        gotWrong={gotWrong}
      />
    ));

    // One pick: the server says right or wrong (it holds the answer key).
    // Picks are ignored while one is being checked, during the red "Wrong!"
    // flash, and once the question is answered.
    async function handleSelectChoice(choiceIndex: number) {
      if (checkingRef.current || loadingRef.current || gotWrongRef.current) {
        return;
      }
      checkingRef.current = true;
      setPendingChoiceIndex(choiceIndex);
      // Time since the choices appeared, as this device measured it.
      const now =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsedMs = startTimeRef.current
        ? Math.max(0, Math.floor(now - startTimeRef.current))
        : 0;
      const outcome = await onCheckAnswer({
        questionIndex: currentIndex,
        choiceIndex,
        elapsedMs
      });
      checkingRef.current = false;
      if (!isMountedRef.current) return;
      setPendingChoiceIndex(null);
      if (outcome.type === 'sessionClosed') {
        onSessionLost();
        return;
      }
      if (outcome.type === 'failed') return;
      if (outcome.result.isCorrect) {
        handleSelectCorrectAnswer(outcome.result);
      } else {
        handleSetGotWrong(choiceIndex);
      }
    }

    async function handleSelectCorrectAnswer(result: GrammarAnswerResult) {
      if (!loadingRef.current && !gotWrongRef.current) {
        loadingRef.current = true;
        const choiceIndex = Number(result.choiceIndex);
        const nextQuestion = result.nextQuestion;
        onSetQuestionObj({
          ...questionObjRef.current,
          [currentIndex]: {
            ...questionObjRef.current[currentIndex],
            score: result.grade,
            answerIndex: choiceIndex,
            selectedChoiceIndex: choiceIndex
          },
          ...(nextQuestion
            ? {
                [nextQuestion.index]: {
                  ...questionObjRef.current[nextQuestion.index],
                  question: nextQuestion.question,
                  choices: nextQuestion.choices,
                  selectedChoiceIndex: null
                }
              }
            : {})
        });
        onSetTriggerEffect((prev) => !prev);
        // The pause starts now, alongside the sound, so it matches the pause
        // the server allows for before the next question's clock starts.
        const advanceDelay = new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );
        if (correctSoundRef.current) {
          try {
            correctSoundRef.current.currentTime = 0;
            // Reinforce full volume before playback
            correctSoundRef.current.volume = 1;
            await correctSoundRef.current.play();
          } catch (error) {
            console.error('Error playing sound:', error);
          }
        }
        await advanceDelay;
        if (isMountedRef.current) {
          const nextUnansweredIndex = questionIds.findIndex(
            (id) => !questionObjRef.current[id]?.score
          );
          if (nextUnansweredIndex !== -1) {
            if (!questionObjRef.current[nextUnansweredIndex]?.question) {
              // The server always sends the next question with a right
              // answer; without it the round cannot go on.
              onSessionLost();
              return;
            }
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
    pendingChoiceIndex,
    onCheckAnswer,
    onSessionLost,
    onGameFinish,
    onSetCurrentIndex,
    onSetQuestionObj,
    onSetTriggerEffect,
    questionIds,
    questionObjRef
  ]);

  // The grade itself comes from the server; the clock here is only reported
  // alongside each pick (the server accepts it within a latency tolerance).
  const { start: startGradeClock, getElapsedMs } = useLiveGrade({
    baseTime: baseTimeRef.current || 10000,
    getWrongCount: () => numWrong.current,
    onGradeChange: () => {}
  });

  const displayedQuestions = useMemo(() => {
    if (!questionIds || !Object.values(questionObjRef.current)?.length)
      return [];
    return questionIds.map((questionId) => questionObjRef.current[questionId]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIds, triggerEffect]);

  // Hands Zero and Ciel where the game is and the grades already earned,
  // never a question or its choices (the user answers alone).
  useAgentScreenState('grammarblesPlay', {
    questionNumber: currentIndex + 1,
    totalQuestions: questionIds.length,
    grades: displayedQuestions
      .slice(0, 30)
      .map((question: any) => question?.score || null),
    finished: isCompleted
  });

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
    let numWords = 0;
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
