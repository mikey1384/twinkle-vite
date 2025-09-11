import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import Loading from '~/components/Loading';
import MarbleQuestions from '~/components/MarbleQuestions';

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
  const [isCompleted, setIsCompleted] = useState(false);
  const [triggerEffect, setTriggerEffect] = useState(false);
  const [questionIds, setQuestionIds] = useState<number[]>([]);
  const sessionIdRef = useRef<number | undefined>(undefined);
  const questionObjRef = useRef<Record<number, any>>({});
  const attemptIdByIndexRef = useRef<number[]>([]);
  const gotWrongTimerRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const { questions, sessionId } = await loadVocabQuiz();
        sessionIdRef.current = sessionId;
        const list = (questions || []).slice(0, 20);
        const ids: number[] = list.map((_: any, idx: number) => idx);
        attemptIdByIndexRef.current = list.map(
          (q: VocabQuestion) => q.attemptId
        );
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
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    })();
    const gotWrongTimer = gotWrongTimerRef.current;
    return () => {
      if (gotWrongTimer) clearTimeout(gotWrongTimer);
      if (!isCompleted) {
        cancelVocabQuiz(sessionIdRef.current).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOnStreak = false;

  if (loading) return <Loading text="Loading Quiz..." />;
  if (!questionIds.length)
    return <div style={{ padding: '2rem' }}>No quiz available.</div>;

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
      />
    </div>
  );

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
}
