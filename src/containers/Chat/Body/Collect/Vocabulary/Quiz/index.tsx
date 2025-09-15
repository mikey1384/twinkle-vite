import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import Loading from '~/components/Loading';
import MarbleQuestions from '~/components/MarbleQuestions';
import StartMenu from './StartMenu';
import ResultScreen from './ResultScreen';
import { Color } from '~/constants/css';

interface QuizBatch {
  id: number;
  title: string;
  questionCount: number;
}

interface VocabQuestion {
  attemptId: number;
  question: string;
  choices: string[];
  answerIndex: number;
}

interface VocabularyQuizProps {
  batch: QuizBatch;
  onDone?: (passed?: boolean) => void;
  onCancel?: () => void;
}

export default function VocabularyQuiz({
  batch,
  onDone,
  onCancel
}: VocabularyQuizProps) {
  const loadVocabQuiz = useAppContext((v) => v.requestHelpers.loadVocabQuiz);
  const submitVocabQuiz = useAppContext(
    (v) => v.requestHelpers.submitVocabQuiz
  );
  const cancelVocabQuiz = useAppContext(
    (v) => v.requestHelpers.cancelVocabQuiz
  );

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

  // Cancel any in-progress quiz when the component unmounts
  useEffect(() => {
    return () => {
      if (startedRef.current && !finishedRef.current) {
        cancelVocabQuiz(sessionIdRef.current).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset state when a different batch is selected
  useEffect(() => {
    if (startedRef.current && !finishedRef.current) {
      cancelVocabQuiz(sessionIdRef.current).catch(() => {});
    }
    sessionIdRef.current = undefined;
    startedRef.current = false;
    finishedRef.current = false;
    setPhase('start');
    setCurrentIndex(0);
    setTriggerEffect(false);
    setQuestionIds([]);
    questionObjRef.current = {};
    attemptIdByIndexRef.current = [];
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch?.id]);

  const isOnStreak = false;

  if (!batch?.id) {
    return <div style={{ padding: '2rem' }}>No quiz selected.</div>;
  }

  if (phase === 'start') {
    return (
      <StartMenu
        onStart={handleStart}
        onCancel={() => {
          if (onCancel) onCancel();
        }}
        title={batch.title}
        questionCount={batch.questionCount}
      />
    );
  }

  if (phase === 'loading') {
    return <Loading text="Loading Quiz..." />;
  }

  if (phase === 'result' && result) {
    return <ResultScreen result={result} onClose={handleResultClose} />;
  }

  if (phase === 'playing') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: Color.black(0.85)
        }}
      >
        <div
          style={{
            padding: '0.8rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: Color.black(0.4),
            color: '#fff',
            borderBottom: `1px solid ${Color.black(0.4)}`
          }}
        >
          <div style={{ fontWeight: 600 }}>{batch.title}</div>
          <button
            style={{
              background: 'none',
              border: `1px solid ${Color.lighterGray(0.6)}`,
              color: Color.lighterGray(),
              padding: '0.45rem 1.1rem',
              borderRadius: 999,
              cursor: 'pointer',
              fontWeight: 600
            }}
            onClick={handleAbort}
          >
            Exit
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
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
      </div>
    );
  }

  return null;

  async function handleStart() {
    if (!batch?.id) return;
    setPhase('loading');
    try {
      const { questions, sessionId } = await loadVocabQuiz({
        batchId: batch.id
      });
      if (!questions?.length) {
        setPhase('start');
        onDone?.(true);
        onCancel?.();
        return;
      }
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
      sessionIdRef.current = sessionId;
      startedRef.current = true;
      setPhase('playing');
    } catch (error) {
      console.error(error);
      setPhase('start');
    }
  }

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
  }

  function handleResultClose() {
    const passed = result?.isPassed;
    sessionIdRef.current = undefined;
    startedRef.current = false;
    finishedRef.current = false;
    setPhase('start');
    setQuestionIds([]);
    questionObjRef.current = {};
    attemptIdByIndexRef.current = [];
    setResult(null);
    onDone?.(passed);
  }

  function handleAbort() {
    if (startedRef.current && !finishedRef.current) {
      cancelVocabQuiz(sessionIdRef.current).catch(() => {});
    }
    sessionIdRef.current = undefined;
    startedRef.current = false;
    finishedRef.current = false;
    setPhase('start');
    setQuestionIds([]);
    questionObjRef.current = {};
    attemptIdByIndexRef.current = [];
    setResult(null);
    onCancel?.();
  }
}
