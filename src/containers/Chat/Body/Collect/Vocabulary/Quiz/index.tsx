import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import Loading from '~/components/Loading';
import MarbleQuestions from '~/components/MarbleQuestions';
import StartMenu from './StartMenu';
import ResultScreen from './ResultScreen';

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

  // Phases: 'start' -> 'loading' -> 'playing' -> 'result'
  const [phase, setPhase] = useState<
    'start' | 'loading' | 'playing' | 'result'
  >('start');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [triggerEffect, setTriggerEffect] = useState(false);
  const [questionIds, setQuestionIds] = useState<number[]>([]);
  const sessionIdRef = useRef<number | undefined>(undefined);
  const questionObjRef = useRef<Record<number, any>>({});
  const attemptIdByIndexRef = useRef<number[]>([]);
  const startedRef = useRef(false);
  const finishedRef = useRef(false);
  const [result, setResult] = useState<{
    isPassed: boolean;
    numCorrect: number;
    total: number;
    grades: string[];
  } | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (startedRef.current && !finishedRef.current) {
        cancelVocabQuiz(sessionIdRef.current).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOnStreak = false;

  if (phase === 'start') {
    return <StartMenu onStart={handleStart} />;
  }
  if (phase === 'loading') {
    return <Loading text="Loading Quiz..." />;
  }
  if (phase === 'result' && result) {
    return (
      <ResultScreen
        result={result}
        onClose={() => {
          if (typeof pendingCount === 'number') {
            onUpdateRejectedCount?.(pendingCount);
          }
          onDone?.(result.isPassed);
        }}
      />
    );
  }
  if (phase === 'playing' && !questionIds.length) {
    return <div style={{ padding: '2rem' }}>No quiz available.</div>;
  }
  if (phase === 'playing') {
    return (
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <MarbleQuestions
          currentIndex={currentIndex}
          isOnStreak={isOnStreak}
          questionIds={questionIds}
          questionObjRef={questionObjRef}
          onSetTriggerEffect={setTriggerEffect}
          onSetCurrentIndex={setCurrentIndex}
          onSetQuestionObj={(newState: Record<number, any>) => {
            questionObjRef.current = newState;
          }}
          onGameFinish={handleFinish}
          triggerEffect={triggerEffect}
          compact
          style={{ height: '100%' }}
        />
      </div>
    );
  }
  return null;

  async function handleFinish() {
    const results = questionIds.map((qid, idx) => {
      const q = questionObjRef.current[qid];
      const attemptId = attemptIdByIndexRef.current[idx];
      const isCorrect = q?.selectedChoiceIndex === q?.answerIndex;
      const grade = q?.score || (isCorrect ? 'A' : 'F');
      const selectedChoiceIndex = q?.selectedChoiceIndex ?? null;
      return {
        attemptId,
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
      finishedRef.current = true;
      const numCorrect = results.filter((r) => r.isCorrect).length;
      const total = results.length;
      const grades = results.map((r) =>
        String(r.grade || (r.isCorrect ? 'A' : 'F')).toUpperCase()
      );
      setResult({ isPassed: !!isPassed, numCorrect, total, grades });
      setPhase('result');
    } catch (error) {
      console.error(error);
    }
    try {
      const { count } = await loadVocabRejectedCount();
      if (typeof count === 'number') setPendingCount(count);
    } catch {}
  }

  async function handleStart() {
    setPhase('loading');
    try {
      const { questions, sessionId } = await loadVocabQuiz();
      sessionIdRef.current = sessionId;
      const list = (questions || []).slice(0, 20);
      const ids: number[] = list.map((_: any, idx: number) => idx);
      attemptIdByIndexRef.current = list.map((q: VocabQuestion) => q.attemptId);
      questionObjRef.current = list.reduce(
        (prev: Record<number, any>, q: VocabQuestion, idx: number) => {
          prev[idx] = {
            question: q.question,
            choices: q.choices,
            answerIndex: q.answerIndex,
            selectedChoiceIndex: null
          };
          return prev;
        },
        {}
      );
      setQuestionIds(ids);
      startedRef.current = true;
      setPhase('playing');
    } catch (error) {
      console.error(error);
      setPhase('start');
    }
  }
}
