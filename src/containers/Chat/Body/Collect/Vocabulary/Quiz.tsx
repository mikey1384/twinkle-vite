import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import Loading from '~/components/Loading';
import SlideContainer from '~/components/QuizCore/SlideContainer';
import QuestionSlide from '~/components/QuizCore/QuestionSlide';
import useLiveGrade from '~/components/QuizCore/useLiveGrade';

interface VocabQuestion {
  attemptId: number;
  question: string;
  choices: string[];
  answerIndex: number;
}

export default function VocabularyQuiz({
  onDone,
  onUpdateRejectedCount
}: {
  onDone?: (passed?: boolean) => void;
  onUpdateRejectedCount?: (count: number) => void;
}) {
  const loadVocabQuiz = useAppContext((v) => v.requestHelpers.loadVocabQuiz);
  const submitVocabQuiz = useAppContext(
    (v) => v.requestHelpers.submitVocabQuiz
  );
  const cancelVocabQuiz = useAppContext(
    (v) => v.requestHelpers.cancelVocabQuiz
  );
  const loadVocabRejectedCount = useAppContext(
    (v) => v.requestHelpers.loadVocabRejectedCount
  );
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gotWrong, setGotWrong] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [triggerEffect, setTriggerEffect] = useState(false);
  const [questionIds, setQuestionIds] = useState<number[]>([]);
  const [attemptByIndex, setAttemptByIndex] = useState<number[]>([]);
  const sessionIdRef = useRef<number | undefined>(undefined);
  const questionObjRef = useRef<Record<number, any>>({});
  const loadingRef = useRef(false);
  const gotWrongRef = useRef(false);
  const gotWrongTimerRef = useRef<any>(null);
  const wrongCountRef = useRef(0);
  const [baseTime, setBaseTime] = useState(12000);
  const liveGradeRef = useRef<string>('');

  useEffect(() => {
    (async () => {
      try {
        const { questions, sessionId } = await loadVocabQuiz();
        sessionIdRef.current = sessionId;
        const ids: number[] = [];
        const attempts: number[] = [];
        const obj: Record<number, any> = {};
        (questions || [])
          .slice(0, 20)
          .forEach((q: VocabQuestion, idx: number) => {
            ids.push(idx);
            attempts.push(q.attemptId);
            obj[idx] = {
              question: q.question,
              choices: q.choices,
              answerIndex: q.answerIndex,
              selectedChoiceIndex: null
            };
          });
        questionObjRef.current = obj;
        setQuestionIds(ids);
        setAttemptByIndex(attempts);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    })();
    return () => {
      if (gotWrongTimerRef.current) clearTimeout(gotWrongTimerRef.current);
      // If quitting before completion, count as failed
      if (!isCompleted) {
        cancelVocabQuiz(sessionIdRef.current).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOnStreak = false;

  const { start: startGradeClock } = useLiveGrade({
    baseTime,
    getWrongCount: () => wrongCountRef.current,
    onGradeChange: (grade: string) => {
      liveGradeRef.current = grade;
    }
  });

  const slides = useMemo(() => {
    if (!questionIds?.length) return null;
    return questionIds.map((id) => (
      <QuestionSlide
        key={id}
        question={questionObjRef.current[id]?.question}
        choices={questionObjRef.current[id]?.choices}
        answerIndex={questionObjRef.current[id]?.answerIndex}
        selectedChoiceIndex={questionObjRef.current[id]?.selectedChoiceIndex}
        onCorrectAnswer={handleCorrect}
        onSetGotWrong={handleWrong}
        gotWrong={gotWrong}
        onCountdownStart={handleCountdownStart}
      />
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIds, gotWrong, triggerEffect]);

  if (loading) return <Loading text="Loading Quiz..." />;
  if (!questionIds.length)
    return <div style={{ padding: '2rem' }}>No quiz available.</div>;

  return (
    <div style={{ width: '100%' }}>
      <SlideContainer
        questions={questionIds.map((id) => questionObjRef.current[id])}
        selectedIndex={currentIndex}
        isOnStreak={isOnStreak}
        isCompleted={isCompleted}
        onCountdownStart={handleCountdownStart}
      >
        {slides}
      </SlideContainer>
    </div>
  );

  async function handleCorrect() {
    if (loadingRef.current || gotWrongRef.current) return;
    loadingRef.current = true;
    const idx = currentIndex;
    questionObjRef.current[idx] = {
      ...questionObjRef.current[idx],
      selectedChoiceIndex: questionObjRef.current[idx].answerIndex,
      score: liveGradeRef.current
    };
    setTriggerEffect((prev) => !prev);
    await new Promise((r) => setTimeout(r, 800));
    const nextUnanswered = questionIds.findIndex(
      (id) => !questionObjRef.current[id]?.score
    );
    if (nextUnanswered !== -1) {
      setCurrentIndex(nextUnanswered);
      loadingRef.current = false;
    } else {
      await new Promise((r) => setTimeout(r, 100));
      await handleFinish();
    }
  }

  function handleWrong(index: number) {
    if (loadingRef.current) return;
    const idx = currentIndex;
    setGotWrong(true);
    wrongCountRef.current = wrongCountRef.current + 1;
    questionObjRef.current[idx] = {
      ...questionObjRef.current[idx],
      selectedChoiceIndex: index
    };
    setTriggerEffect((prev) => !prev);
    gotWrongRef.current = true;
    clearTimeout(gotWrongTimerRef.current);
    gotWrongTimerRef.current = setTimeout(() => {
      questionObjRef.current[idx] = {
        ...questionObjRef.current[idx],
        selectedChoiceIndex: null,
        wasWrong: true
      };
      setTriggerEffect((prev) => !prev);
      setGotWrong(false);
      gotWrongRef.current = false;
    }, 700);
  }

  async function handleFinish() {
    const results = questionIds.map((id, idx) => {
      const q = questionObjRef.current[id];
      const isCorrect = q?.selectedChoiceIndex === q?.answerIndex;
      const grade = q?.score || (isCorrect ? 'A' : 'F');
      const selectedChoiceIndex = q?.selectedChoiceIndex ?? null;
      return {
        attemptId: attemptByIndex[idx],
        isCorrect,
        grade,
        selectedChoiceIndex
      };
    });
    try {
      const { isPassed } = await submitVocabQuiz({
        sessionId: sessionIdRef.current,
        results
      });
      setIsCompleted(true);
      onDone?.(!!isPassed);
    } catch (error) {
      console.error(error);
    }
    try {
      const { count } = await loadVocabRejectedCount();
      if (typeof count === 'number') onUpdateRejectedCount?.(count);
    } catch {}
  }

  function handleCountdownStart() {
    // Estimate baseTime similarly to Grammarbles
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
    const bounded = Math.min(30000, Math.max(12000, Math.floor(estimatedMs)));
    setBaseTime(bounded);
    wrongCountRef.current = 0;
    startGradeClock();
  }
}
