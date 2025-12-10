import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import ProgressBar from '~/components/ProgressBar';
import GradingResult from './GradingResult';
import Icon from '~/components/Icon';
import { css, keyframes } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';

type Screen = 'loading' | 'start' | 'writing' | 'grading' | 'result';

const INACTIVITY_LIMIT = 7;

const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export default function DailyQuestionPanel({
  onClose
}: {
  onClose: () => void;
}) {
  const { userId, profileTheme } = useKeyContext((v) => v.myState);
  const simplifyDailyQuestion = useAppContext(
    (v) => v.requestHelpers.simplifyDailyQuestion
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  const [screen, setScreen] = useState<Screen>('loading');
  const [questionId, setQuestionId] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [originalQuestion, setOriginalQuestion] = useState('');
  const [isSimplified, setIsSimplified] = useState(false);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [response, setResponse] = useState('');
  const [inactivityTimer, setInactivityTimer] = useState(INACTIVITY_LIMIT);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [gradingProgress, setGradingProgress] = useState(0);
  const [gradingMessage, setGradingMessage] = useState('');
  const [gradingResult, setGradingResult] = useState<{
    grade: string;
    xpAwarded: number;
    feedback: string;
    responseId: number;
    isShared: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gradingCompleteRef = useRef(false);
  const hasStartedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSubmittingRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());
  const handleSubmitRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!userId) return;

    setScreen('loading');
    setError(null);
    setLoadingProgress(0);
    setLoadingMessage('Starting...');

    function handleProgress({
      step,
      totalSteps,
      message
    }: {
      step: number;
      totalSteps: number;
      status: string;
      message: string;
    }) {
      setLoadingProgress(Math.floor((step / totalSteps) * 100));
      setLoadingMessage(message);
    }

    function handleGenerated(data: {
      questionId: number;
      question: string;
      hasResponded: boolean;
      response: any;
    }) {
      setQuestionId(data.questionId);
      setQuestion(data.question);
      setOriginalQuestion(data.question);

      if (data.hasResponded && data.response) {
        setGradingResult({
          grade: data.response.grade,
          xpAwarded: data.response.xpAwarded,
          feedback: data.response.feedback,
          responseId: data.response.id,
          isShared: data.response.isShared
        });
        setResponse(data.response.response || '');
        setScreen('result');
      } else {
        setScreen('start');
      }
    }

    function handleError({ error: errorMsg }: { error: string }) {
      console.error('Failed to load daily question:', errorMsg);
      setError(errorMsg || 'Failed to load daily question. Please try again.');
    }

    socket.on('daily_question_progress', handleProgress);
    socket.on('daily_question_generated', handleGenerated);
    socket.on('daily_question_error', handleError);

    socket.emit('generate_daily_question');

    return () => {
      socket.off('daily_question_progress', handleProgress);
      socket.off('daily_question_generated', handleGenerated);
      socket.off('daily_question_error', handleError);
    };
  }, [userId]);

  useEffect(() => {
    if (screen !== 'writing') return;

    lastActivityRef.current = Date.now();
    setInactivityTimer(INACTIVITY_LIMIT);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, INACTIVITY_LIMIT - elapsed);
      setInactivityTimer(remaining);

      if (remaining === 0 && !isSubmittingRef.current) {
        clearInterval(interval);
        handleSubmitRef.current();
      }
    }, 200);

    timerRef.current = interval as unknown as NodeJS.Timeout;

    return () => {
      clearInterval(interval);
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== 'grading') return;

    function handleGradingProgress({
      step,
      totalSteps,
      message
    }: {
      step: number;
      totalSteps: number;
      status: string;
      message: string;
    }) {
      setGradingProgress(Math.floor((step / totalSteps) * 100));
      setGradingMessage(message);
    }

    function handleGraded(result: {
      isThoughtful: boolean;
      rejectionReason?: string;
      responseId?: number;
      grade?: string;
      xpAwarded?: number;
      feedback?: string;
      newXP?: number;
    }) {
      gradingCompleteRef.current = true;
      setGradingProgress(100);

      if (result.newXP && userId) {
        onSetUserState({
          userId,
          newState: { twinkleXP: result.newXP }
        });
      }

      setTimeout(() => {
        setGradingResult({
          grade: result.isThoughtful ? result.grade || 'Pass' : 'Fail',
          xpAwarded: result.xpAwarded || 0,
          feedback: result.isThoughtful
            ? result.feedback || ''
            : result.rejectionReason ||
              'Please try again tomorrow with more effort.',
          responseId: result.responseId || 0,
          isShared: false
        });
        setScreen('result');
      }, 500);
    }

    function handleGradingError({ error: errorMsg }: { error: string }) {
      console.error('Failed to grade response:', errorMsg);
      setError(errorMsg || 'Failed to submit. Please try again.');
    }

    socket.on('daily_question_grading_progress', handleGradingProgress);
    socket.on('daily_question_graded', handleGraded);
    socket.on('daily_question_grading_error', handleGradingError);

    return () => {
      socket.off('daily_question_grading_progress', handleGradingProgress);
      socket.off('daily_question_graded', handleGraded);
      socket.off('daily_question_grading_error', handleGradingError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, userId]);

  useEffect(() => {
    return () => {
      if (
        screen === 'writing' &&
        hasStartedRef.current &&
        !isSubmittingRef.current
      ) {
        handleSubmitRef.current();
      }
    };
  }, [screen]);

  const handleStart = useCallback(() => {
    hasStartedRef.current = true;
    setScreen('writing');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, []);

  const handleSimplify = useCallback(async () => {
    if (!questionId || isSimplifying) return;

    try {
      setIsSimplifying(true);
      const result = await simplifyDailyQuestion({ questionId });

      if (result.simplifiedQuestion) {
        setQuestion(result.simplifiedQuestion);
        setIsSimplified(true);
      }
    } catch (err) {
      console.error('Failed to simplify question:', err);
    } finally {
      setIsSimplifying(false);
    }
  }, [questionId, isSimplifying, simplifyDailyQuestion]);

  const handleShowOriginal = useCallback(() => {
    setQuestion(originalQuestion);
    setIsSimplified(false);
  }, [originalQuestion]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'a')) {
        e.preventDefault();
        return;
      }

      lastActivityRef.current = Date.now();
    },
    []
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length >= response.length) {
        setResponse(newValue);
        lastActivityRef.current = Date.now();
      }
    },
    [response.length]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!questionId || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setScreen('grading');
    setGradingProgress(0);
    setGradingMessage('Starting...');
    gradingCompleteRef.current = false;

    socket.emit('grade_daily_question_response', {
      questionId,
      response: response.trim() || '(no response)'
    });
  }, [questionId, response]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const wordCount = useMemo(() => {
    return response
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }, [response]);

  const timeWarning = inactivityTimer <= 3 && inactivityTimer > 0;

  // Loading screen
  if (screen === 'loading') {
    return (
      <div className={containerCls}>
        <Loading text={loadingMessage || "Loading today's question..."} />
        <div style={{ width: '60%', marginTop: '1rem' }}>
          <ProgressBar progress={loadingProgress} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerCls}>
        <p style={{ color: Color.darkerGray(), marginBottom: '1rem' }}>
          {error}
        </p>
        <Button variant="solid" color="logoBlue" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  if (screen === 'start') {
    return (
      <ErrorBoundary componentPath="DailyQuestionPanel/Start">
        <div className={containerCls}>
          <p className={questionTextCls}>{question}</p>

          <div
            className={css`
              margin-bottom: 1.5rem;
            `}
          >
            {isSimplified ? (
              <Button
                variant="soft"
                tone="raised"
                color={profileTheme}
                onClick={handleShowOriginal}
                uppercase={false}
              >
                <Icon icon="undo" style={{ marginRight: '0.5rem' }} />
                Show original question
              </Button>
            ) : (
              <Button
                variant="soft"
                tone="raised"
                color={profileTheme}
                onClick={handleSimplify}
                disabled={isSimplifying}
                loading={isSimplifying}
                uppercase={false}
              >
                <Icon icon="child" style={{ marginRight: '0.5rem' }} />
                {isSimplifying
                  ? 'Simplifying...'
                  : 'Make question easier to understand'}
              </Button>
            )}
          </div>

          <div className={instructionBoxCls}>
            <h4 style={{ marginBottom: '0.75rem', color: Color.black() }}>
              <Icon icon="info-circle" style={{ marginRight: '0.5rem' }} />
              Rules
            </h4>
            <ul className={instructionListCls}>
              <li>
                <strong>Keep typing</strong> - if you stop for more than 7
                seconds, your response auto-submits
              </li>
              <li>
                <strong>No going back</strong> - backspace and delete are
                disabled. Just keep moving forward!
              </li>
              <li>
                <strong>No copy-paste</strong> - write in your own words
              </li>
              <li>
                <strong>Closing this window = submit</strong> - once you start,
                you're committed
              </li>
            </ul>
            <p
              className={css`
                margin-top: 1rem;
                font-size: 1.2rem;
                color: ${Color.darkerGray()};
                line-height: 1.5;
              `}
            >
              Don't worry about spelling, grammar, or even language - write in
              whatever language you're comfortable with. After grading, you'll
              get a polished English version you can choose to share instead.
            </p>
          </div>

          <div className={buttonContainerCls}>
            <Button variant="ghost" onClick={onClose}>
              Maybe Later
            </Button>
            <Button variant="solid" color="green" onClick={handleStart}>
              <Icon icon="play" style={{ marginRight: '0.5rem' }} />
              Start Writing
            </Button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (screen === 'writing') {
    return (
      <ErrorBoundary componentPath="DailyQuestionPanel/Writing">
        <div className={containerCls}>
          <div className={timerContainerCls}>
            <div
              className={css`
                font-size: 2.5rem;
                font-weight: bold;
                color: ${timeWarning ? Color.rose() : Color.black()};
                ${timeWarning
                  ? `animation: ${pulseAnimation} 0.5s infinite;`
                  : ''}
              `}
            >
              {inactivityTimer}s
            </div>
            <div style={{ color: Color.darkerGray(), fontSize: '1.2rem' }}>
              {inactivityTimer <= 3 ? 'Done?' : 'Keep typing!'}
            </div>
          </div>

          <p className={questionTextSmallCls}>{question}</p>

          <textarea
            ref={textareaRef}
            value={response}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Just start typing... don't stop to think, just write..."
            className={textareaCls}
            autoFocus
          />

          <div className={statsRowCls}>
            <span style={{ color: Color.lightGray() }}>{wordCount} words</span>
            <span style={{ color: Color.lightGray(), fontSize: '1.1rem' }}>
              No backspace allowed - keep going!
            </span>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (screen === 'grading') {
    return (
      <div className={containerCls}>
        <Loading text={gradingMessage || 'Evaluating your response...'} />
        <div style={{ width: '60%', marginTop: '1rem' }}>
          <ProgressBar progress={gradingProgress} />
        </div>
      </div>
    );
  }

  if (screen === 'result' && gradingResult) {
    return (
      <ErrorBoundary componentPath="DailyQuestionPanel/GradingResult">
        <GradingResult
          question={question}
          response={response}
          grade={gradingResult.grade}
          xpAwarded={gradingResult.xpAwarded}
          feedback={gradingResult.feedback}
          responseId={gradingResult.responseId}
          isShared={gradingResult.isShared}
          onClose={onClose}
        />
      </ErrorBoundary>
    );
  }

  return null;
}

const containerCls = css`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 300px;
`;

const questionTextCls = css`
  font-size: 1.7rem;
  color: ${Color.black()};
  line-height: 1.5;
  font-weight: 500;
  text-align: center;
  margin-bottom: 1.5rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.5rem;
  }
`;

const questionTextSmallCls = css`
  font-size: 1.4rem;
  color: ${Color.darkerGray()};
  line-height: 1.4;
  text-align: center;
  margin-bottom: 1rem;
  font-style: italic;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
  }
`;

const instructionBoxCls = css`
  background: ${Color.highlightGray()};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: 500px;
`;

const instructionListCls = css`
  margin: 0;
  padding-left: 1.5rem;
  font-size: 1.3rem;
  color: ${Color.darkerGray()};
  line-height: 1.8;
  li {
    margin-bottom: 0.3rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
  }
`;

const timerContainerCls = css`
  text-align: center;
  margin-bottom: 1rem;
`;

const textareaCls = css`
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  font-size: 1.5rem;
  line-height: 1.7;
  border: 1px solid ${Color.borderGray()};
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: ${Color.logoBlue()};
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.3rem;
  }
`;

const statsRowCls = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 1.2rem;
  width: 100%;
`;

const buttonContainerCls = css`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
`;
