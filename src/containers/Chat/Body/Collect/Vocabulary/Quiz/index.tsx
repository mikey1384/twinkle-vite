import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import Loading from '~/components/Loading';
import MarbleQuestions from '~/components/MarbleQuestions';
import StartMenu from './StartMenu';
import ResultScreen from './ResultScreen';
import { Color } from '~/constants/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';

interface QuizBatch {
  id: number;
  title: string;
  questionCount: number;
  quiz?: QuizSummary | null;
}

interface VocabQuestion {
  attemptId: number;
  question: string;
  choices: string[];
  answerIndex: number;
}

interface QuizSummary {
  attemptsPlayed: number;
  attemptsRemaining: number;
  bestAttemptIndex: number | null;
  bestAttemptTotal: number;
  historyId: number | null;
  finished: boolean;
  maxAttempts: number;
}

interface QuizAttemptResult extends QuizSummary {
  attemptIndex: number;
  numQuestions: number;
  numCorrect: number;
  numS: number;
  numA: number;
  questionPoints: number;
  bonusPoints: number;
  totalPoints: number;
  allPerfect: boolean;
  finalized: boolean;
  bestAttemptBonusPoints?: number;
  bestAttemptQuestionPoints?: number;
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
  const [quizProgress, setQuizProgress] = useState<QuizSummary | null>(
    batch?.quiz || null
  );
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const funFont =
    "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

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
    setQuizResult(null);
    setQuizProgress(batch?.quiz || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch?.id]);

  useEffect(() => {
    setQuizProgress(batch?.quiz || null);
  }, [batch?.quiz]);

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
        quiz={quizProgress}
      />
    );
  }

  if (phase === 'loading') {
    return <Loading text="Loading Quiz..." />;
  }

  if (phase === 'result' && result) {
    return (
      <ResultScreen
        result={result}
        onClose={handleResultClose}
        quiz={quizResult}
      />
    );
  }

  if (phase === 'playing') {
    return (
      <div className={playingContainerCls(funFont)}>
        <div className={headerCls(funFont)}>
          <div>
            <div className="quiz-title">{batch.title}</div>
            {quizProgress && (
              <div className="quiz-subtitle">
                Attempt{' '}
                {Math.min(
                  quizProgress.attemptsPlayed + 1,
                  quizProgress.maxAttempts
                )}{' '}
                /{quizProgress.maxAttempts}
              </div>
            )}
          </div>
          <GameCTAButton
            icon="times"
            onClick={handleAbort}
            variant="magenta"
            size="md"
          >
            Exit
          </GameCTAButton>
        </div>
        <div className={contentWrapCls}>
          <div className="marble-shell">
            <div className="marble-scroll">
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
        </div>
      </div>
    );
  }

  return null;

  async function handleStart() {
    if (!batch?.id) return;
    setPhase('loading');
    try {
      const { questions, sessionId, quiz } = await loadVocabQuiz({
        batchId: batch.id
      });
      if (quiz) {
        setQuizProgress(quiz);
      }
      if (!questions?.length) {
        setPhase('start');
        if (quiz?.finished) {
          onDone?.(true);
        }
        onCancel?.();
        return;
      }
      setQuizResult(null);
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
      const { isPassed, quiz: submittedQuiz } = await submitVocabQuiz({
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
      if (submittedQuiz) {
        setQuizResult(submittedQuiz as QuizAttemptResult);
        setQuizProgress({
          attemptsPlayed: submittedQuiz.attemptsPlayed,
          attemptsRemaining: submittedQuiz.attemptsRemaining,
          bestAttemptIndex: submittedQuiz.bestAttemptIndex || null,
          bestAttemptTotal: submittedQuiz.bestAttemptTotal || 0,
          historyId: submittedQuiz.historyId || null,
          finished: submittedQuiz.finalized,
          maxAttempts: submittedQuiz.maxAttempts
        });
      }
      setPhase('result');
    } catch (error) {
      console.error(error);
    }
  }

  function handleResultClose() {
    const passed = result?.isPassed;
    const finalized = quizResult?.finalized;
    sessionIdRef.current = undefined;
    startedRef.current = false;
    finishedRef.current = false;
    setPhase('start');
    setQuestionIds([]);
    questionObjRef.current = {};
    attemptIdByIndexRef.current = [];
    setResult(null);
    setQuizResult(null);
    onDone?.(finalized ? true : passed);
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
    setQuizResult(null);
    onCancel?.();
  }
}

const playingContainerCls = (funFont: string) =>
  css`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: ${Color.whiteGray()};
    background-image: radial-gradient(${Color.logoBlue(0.08)} 8%, transparent 9%),
      radial-gradient(${Color.pink(0.06)} 8%, transparent 9%);
    background-position: 0 0, 2.4rem 2.4rem;
    background-size: 4.8rem 4.8rem;
    padding: 1.2rem;
    box-sizing: border-box;
    font-family: ${funFont};
  `;

const headerCls = (funFont: string) =>
  css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.4rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.92);
    border: 2px dashed ${Color.logoBlue(0.4)};
    box-shadow: 0 8px 18px ${Color.black(0.08)};
    gap: 1rem;
    font-family: ${funFont};

    .quiz-title {
      font-size: 1.8rem;
      font-weight: 800;
      color: ${Color.logoBlue()};
      letter-spacing: 0.6px;
    }

    .quiz-subtitle {
      margin-top: 0.4rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: ${Color.green()};
      letter-spacing: 0.4px;
    }
  `;

const contentWrapCls = css`
  flex: 1;
  margin-top: 1.4rem;
  display: flex;
  align-items: stretch;
  justify-content: center;

  .marble-shell {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.96);
    border-radius: 1.4rem;
    border: 3px dashed ${Color.logoBlue(0.25)};
    box-shadow: 0 14px 26px ${Color.black(0.1)};
  }

  .marble-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 1.2rem 1.6rem;
  }

  .marble-scroll::-webkit-scrollbar {
    width: 10px;
  }

  .marble-scroll::-webkit-scrollbar-thumb {
    background: ${Color.logoBlue(0.35)};
    border-radius: 999px;
  }
`;
