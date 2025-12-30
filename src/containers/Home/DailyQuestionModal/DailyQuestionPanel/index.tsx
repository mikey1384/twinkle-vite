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
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';

type Screen = 'loading' | 'start' | 'writing' | 'grading' | 'result';

const INACTIVITY_LIMIT = 10;
const MIN_RESPONSE_LENGTH = 50;

// Typing metadata for anti-cheat - keep it simple, calculate at submit
interface TypingMetadata {
  startTime: number;
  keystrokeTimestamps: number[]; // just raw timestamps
}

const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export default function DailyQuestionPanel({
  onClose
}: {
  onClose: () => void;
}) {
  const { userId, profileTheme, twinkleCoins } = useKeyContext(
    (v) => v.myState
  );
  const STREAK_REPAIR_COST = 100000;
  const getDailyQuestion = useAppContext(
    (v) => v.requestHelpers.getDailyQuestion
  );
  const submitDailyQuestionResponse = useAppContext(
    (v) => v.requestHelpers.submitDailyQuestionResponse
  );
  const simplifyDailyQuestion = useAppContext(
    (v) => v.requestHelpers.simplifyDailyQuestion
  );
  const purchaseDailyQuestionRepair = useAppContext(
    (v) => v.requestHelpers.purchaseDailyQuestionRepair
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );

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
    sharedWithZero: boolean;
    sharedWithCiel: boolean;
    originalResponse: string;
    sharedResponse: string | null;
    streak?: number;
    streakMultiplier?: number;
    usedRepair?: boolean;
  } | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakRepairAvailable, setStreakRepairAvailable] = useState(false);
  const [streakAtRisk, setStreakAtRisk] = useState(false);
  const [streakBroken, setStreakBroken] = useState(false);
  const [purchasingRepair, setPurchasingRepair] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gradingCompleteRef = useRef(false);
  const hasStartedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSubmittingRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());
  const handleSubmitRef = useRef<() => void>(() => {});

  // Typing metadata for anti-cheat verification
  const typingMetadataRef = useRef<TypingMetadata>({
    startTime: 0,
    keystrokeTimestamps: []
  });

  // Refs for smooth progress animation
  const loadingProgressRef = useRef(0);
  const loadingTargetRef = useRef(0);
  const gradingProgressRef = useRef(0);
  const gradingTargetRef = useRef(0);
  const loadingAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const gradingAnimationRef = useRef<NodeJS.Timeout | null>(null);

  // Socket event listeners for progress updates with smooth animation
  useEffect(() => {
    function animateProgress(
      currentRef: React.RefObject<number>,
      targetRef: React.RefObject<number>,
      newTarget: number,
      setter: React.Dispatch<React.SetStateAction<number>>,
      animationRef: React.RefObject<NodeJS.Timeout | null>,
      duration: number = 10000
    ) {
      // Clear any existing animation
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }

      // If going backwards, jump immediately
      if (newTarget <= currentRef.current) {
        currentRef.current = newTarget;
        targetRef.current = newTarget;
        setter(newTarget);
        return;
      }

      // Jump to the previous target first (complete the previous stage)
      const previousTarget = targetRef.current;
      if (previousTarget > currentRef.current) {
        currentRef.current = previousTarget;
        setter(previousTarget);
      }

      // Now animate from the previous target to the new target
      const startValue = currentRef.current;
      targetRef.current = newTarget;
      const difference = newTarget - startValue;
      const steps = 60; // 60 steps for smooth animation
      const stepDuration = duration / steps;
      let currentStep = 0;

      animationRef.current = setInterval(() => {
        currentStep++;
        // Ease-out curve for more natural feel
        const easeProgress = 1 - Math.pow(1 - currentStep / steps, 2);
        const newValue = Math.round(startValue + difference * easeProgress);

        currentRef.current = newValue;
        setter(newValue);

        if (currentStep >= steps) {
          if (animationRef.current) {
            clearInterval(animationRef.current);
            animationRef.current = null;
          }
          currentRef.current = newTarget;
          setter(newTarget);
        }
      }, stepDuration);
    }

    function handleQuestionProgress({
      step,
      progress
    }: {
      step: string;
      progress: number;
    }) {
      setLoadingMessage(step);

      const duration = step.toLowerCase().includes('analyzing') ? 30000 : 10000;
      animateProgress(
        loadingProgressRef,
        loadingTargetRef,
        progress,
        setLoadingProgress,
        loadingAnimationRef,
        duration
      );
    }

    function handleGradingProgress({
      step,
      progress
    }: {
      step: string;
      progress: number;
    }) {
      setGradingMessage(step);
      animateProgress(
        gradingProgressRef,
        gradingTargetRef,
        progress,
        setGradingProgress,
        gradingAnimationRef
      );
    }

    socket.on('daily_question_progress', handleQuestionProgress);
    socket.on('daily_question_grading_progress', handleGradingProgress);

    return () => {
      socket.off('daily_question_progress', handleQuestionProgress);
      socket.off('daily_question_grading_progress', handleGradingProgress);
      if (loadingAnimationRef.current) {
        clearInterval(loadingAnimationRef.current);
      }
      if (gradingAnimationRef.current) {
        clearInterval(gradingAnimationRef.current);
      }
    };
  }, []);

  // Use a ref to track mount state - survives across effect re-runs
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Store getDailyQuestion in a ref to avoid dependency issues
  const getDailyQuestionRef = useRef(getDailyQuestion);
  useEffect(() => {
    getDailyQuestionRef.current = getDailyQuestion;
  }, [getDailyQuestion]);

  useEffect(() => {
    if (!userId) return;

    // Reset progress refs
    loadingProgressRef.current = 0;
    loadingTargetRef.current = 0;
    if (loadingAnimationRef.current) {
      clearInterval(loadingAnimationRef.current);
      loadingAnimationRef.current = null;
    }

    setScreen('loading');
    setError(null);
    setLoadingProgress(0);
    setLoadingMessage('Loading...');

    // Track this specific request to avoid race conditions
    const requestId = Date.now();
    const currentRequestRef = { id: requestId, cancelled: false };

    async function loadDailyQuestion() {
      try {
        const data = await getDailyQuestionRef.current();

        // Skip if component unmounted or this request was superseded
        if (!isMountedRef.current || currentRequestRef.cancelled) return;

        if (data.error) {
          setError(data.error);
          return;
        }

        setLoadingProgress(100);
        setQuestionId(data.questionId);
        setQuestion(data.question);
        setOriginalQuestion(data.question);

        // Save streak info
        setCurrentStreak(data.currentStreak || 0);
        setStreakRepairAvailable(!!data.streakRepairAvailable);
        setStreakAtRisk(!!data.streakAtRisk);
        setStreakBroken(!!data.streakBroken);

        if (data.hasResponded && data.response) {
          setGradingResult({
            grade: data.response.grade,
            xpAwarded: data.response.xpAwarded,
            feedback: data.response.feedback,
            responseId: data.response.id,
            isShared: data.response.isShared,
            sharedWithZero: !!data.response.sharedWithZero,
            sharedWithCiel: !!data.response.sharedWithCiel,
            originalResponse: data.response.response || '',
            sharedResponse: data.response.sharedResponse || null,
            streak: data.response.streakAtTime || data.currentStreak || 1,
            streakMultiplier: Math.min(data.response.streakAtTime || 1, 10)
          });
          setResponse(data.response.response || '');
          setScreen('result');
        } else {
          setScreen('start');
        }
      } catch (err: any) {
        if (!isMountedRef.current || currentRequestRef.cancelled) return;
        console.error('Failed to load daily question:', err);
        setError(
          err?.message || 'Failed to load daily question. Please try again.'
        );
      }
    }

    loadDailyQuestion();

    return () => {
      currentRequestRef.cancelled = true;
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

  const handleStart = useCallback(() => {
    hasStartedRef.current = true;
    // Initialize typing metadata
    typingMetadataRef.current = {
      startTime: Date.now(),
      keystrokeTimestamps: []
    };
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

  const hasEnoughCoins = (twinkleCoins || 0) >= STREAK_REPAIR_COST;

  async function handlePurchaseRepair() {
    if (purchasingRepair || streakRepairAvailable || !hasEnoughCoins) return;

    try {
      setPurchasingRepair(true);
      const result = await purchaseDailyQuestionRepair();

      if (result.error) {
        // "Not enough coins" is expected if client data is stale - button will disable
        // Other errors should be shown to the user
        if (!result.error.toLowerCase().includes('not enough coins')) {
          setError(result.error);
        }
        return;
      }

      if (result.success) {
        setStreakRepairAvailable(true);
        // Update user's coin balance
        if (userId && result.newBalance !== undefined) {
          onSetUserState({
            userId,
            newState: { twinkleCoins: result.newBalance }
          });
        }
      }
    } catch (err: any) {
      // "Not enough coins" from API is expected if client data is stale
      // Other errors (network, server) should be shown
      const errorMessage = err?.message || '';
      if (!errorMessage.toLowerCase().includes('not enough coins')) {
        console.error('Failed to purchase repair:', err);
        setError('Failed to purchase repair. Please try again.');
      }
    } finally {
      setPurchasingRepair(false);
    }
  }

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
    },
    []
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length >= response.length) {
        const now = Date.now();

        // Track keystroke for anti-cheat (just push timestamp)
        typingMetadataRef.current.keystrokeTimestamps.push(now);

        setResponse(newValue);
        lastActivityRef.current = now;
      }
    },
    [response.length]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
  }, []);

  function handleDragOver(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
  }

  const handleSubmit = useCallback(async () => {
    if (!questionId || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // Calculate typing metrics from raw timestamps
    const metadata = typingMetadataRef.current;
    const endTime = Date.now();
    const timestamps = metadata.keystrokeTimestamps;

    // Calculate burst metrics (chars typed within 500ms of each other)
    let maxBurstSize = 0;
    let burstCount = 0;
    const BURST_PAUSE_THRESHOLD = 500;

    if (timestamps.length > 0) {
      let currentBurst = 1;
      for (let i = 1; i < timestamps.length; i++) {
        const gap = timestamps[i] - timestamps[i - 1];
        if (gap <= BURST_PAUSE_THRESHOLD) {
          currentBurst++;
        } else {
          // End of a burst
          if (currentBurst > 1) {
            burstCount++;
            if (currentBurst > maxBurstSize) {
              maxBurstSize = currentBurst;
            }
          }
          currentBurst = 1;
        }
      }
      // Check final burst
      if (currentBurst > 1) {
        burstCount++;
        if (currentBurst > maxBurstSize) {
          maxBurstSize = currentBurst;
        }
      }
    }

    // Reset grading progress refs
    gradingProgressRef.current = 0;
    gradingTargetRef.current = 0;
    if (gradingAnimationRef.current) {
      clearInterval(gradingAnimationRef.current);
      gradingAnimationRef.current = null;
    }

    setScreen('grading');
    setGradingProgress(0);
    setGradingMessage('Submitting...');
    gradingCompleteRef.current = false;

    try {
      const result = await submitDailyQuestionResponse({
        questionId,
        response: response.trim() || '(no response)',
        typingMetadata: {
          startTime: metadata.startTime,
          endTime,
          keystrokeCount: timestamps.length,
          totalCharsTyped: response.trim().length,
          maxBurstSize,
          burstCount
        }
      });

      if (result.error) {
        setError(result.error);
        isSubmittingRef.current = false;
        return;
      }

      gradingCompleteRef.current = true;
      setGradingProgress(100);

      if (result.newXP && userId) {
        onSetUserState({
          userId,
          newState: { twinkleXP: result.newXP }
        });
      }

      if (result.isThoughtful) {
        onUpdateTodayStats({
          newStats: { dailyQuestionCompleted: true }
        });
      }

      setTimeout(() => {
        setGradingResult({
          grade: result.isThoughtful ? result.grade || 'Pass' : 'Fail',
          xpAwarded: result.xpAwarded || 0,
          feedback: result.isThoughtful
            ? result.feedback || ''
            : result.rejectionReason ||
              'Nice try — you can start over and try again right away.',
          responseId: result.responseId || 0,
          isShared: false,
          sharedWithZero: false,
          sharedWithCiel: false,
          originalResponse: response.trim(),
          sharedResponse: null,
          streak: result.streak || 1,
          streakMultiplier: result.streakMultiplier || 1,
          usedRepair: result.usedRepair || false
        });
        setScreen('result');
      }, 500);
    } catch (err: any) {
      console.error('Failed to submit response:', err);
      setError(err?.message || 'Failed to submit. Please try again.');
      isSubmittingRef.current = false;
    }
  }, [
    questionId,
    response,
    userId,
    submitDailyQuestionResponse,
    onSetUserState,
    onUpdateTodayStats
  ]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const wordCount = useMemo(() => {
    return response
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }, [response]);

  const trimmedResponseLength = useMemo(
    () => response.trim().length,
    [response]
  );
  const minEffortBarShown = trimmedResponseLength > 0;
  const minLengthMet = trimmedResponseLength >= MIN_RESPONSE_LENGTH;
  const remainingChars = Math.max(
    0,
    MIN_RESPONSE_LENGTH - trimmedResponseLength
  );
  const minEffortProgress = useMemo(
    () => Math.min(100 * (trimmedResponseLength / MIN_RESPONSE_LENGTH), 100),
    [trimmedResponseLength]
  );
  const minEffortDisplayLabel = useMemo(() => {
    if (trimmedResponseLength < MIN_RESPONSE_LENGTH) {
      return `${Math.floor(minEffortProgress)}%`;
    }
    return <Icon icon="check" />;
  }, [minEffortProgress, trimmedResponseLength]);
  const minEffortColor = useMemo(
    () => (minLengthMet ? Color.green() : Color.rose()),
    [minLengthMet]
  );

  const timeWarning = inactivityTimer <= 3 && inactivityTimer > 0;

  // Loading screen
  if (screen === 'loading') {
    return (
      <div className={centeredContainerCls}>
        <div className={innerContainerCls}>
          <Loading text={loadingMessage || "Loading today's question..."} />
          <div style={{ width: '60%', marginTop: 0 }}>
            <ProgressBar progress={loadingProgress} />
          </div>
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
          {/* Streak Display */}
          {currentStreak > 0 && !streakBroken && !streakAtRisk && (
            <div
              className={css`
                text-align: center;
                margin-bottom: 1.5rem;
                padding: 1rem 1.5rem;
                background: ${currentStreak >= 10
                  ? '#FFD700'
                  : currentStreak >= 7
                  ? '#E53935'
                  : currentStreak >= 4
                  ? '#FF9800'
                  : '#9E9E9E'}15;
                border: 2px solid
                  ${currentStreak >= 10
                    ? '#FFD700'
                    : currentStreak >= 7
                    ? '#E53935'
                    : currentStreak >= 4
                    ? '#FF9800'
                    : '#9E9E9E'}40;
                border-radius: 12px;
              `}
            >
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.5rem;
                `}
              >
                <span
                  className={css`
                    font-size: 1.8rem;
                  `}
                >
                  🔥
                </span>
                <span
                  className={css`
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: ${currentStreak >= 10
                      ? '#FFD700'
                      : currentStreak >= 7
                      ? '#E53935'
                      : currentStreak >= 4
                      ? '#FF9800'
                      : '#9E9E9E'};
                  `}
                >
                  {currentStreak}-day streak
                </span>
              </div>
              <p
                className={css`
                  font-size: 1.2rem;
                  color: ${Color.darkerGray()};
                  margin-top: 0.3rem;
                `}
              >
                Keep it going for x{Math.min(currentStreak + 1, 10)} XP!
              </p>
            </div>
          )}

          {/* Missed Yesterday Warning */}
          {streakAtRisk && currentStreak > 0 && (
            <div
              className={css`
                text-align: center;
                margin-bottom: 1.5rem;
                padding: 1rem 1.5rem;
                background: ${Color.rose()}15;
                border: 2px solid ${Color.rose()}40;
                border-radius: 12px;
              `}
            >
              <p
                className={css`
                  font-size: 1.3rem;
                  font-weight: bold;
                  color: ${Color.rose()};
                  margin-bottom: 0.5rem;
                `}
              >
                ⚠️ You missed yesterday
              </p>
              <p
                className={css`
                  font-size: 1.2rem;
                  color: ${Color.darkerGray()};
                  margin-bottom: 0.75rem;
                `}
              >
                Your {currentStreak}-day streak is broken. Use a repair today to
                restore it and continue to {currentStreak + 1} days when you
                answer.
              </p>
              {streakRepairAvailable ? (
                <p
                  className={css`
                    font-size: 1.2rem;
                    color: ${Color.green()};
                    font-weight: 600;
                    margin-bottom: 0;
                  `}
                >
                  ✨ Repair ready — answer today to restore your{' '}
                  {currentStreak}-day streak and continue to{' '}
                  {currentStreak + 1} days.
                </p>
              ) : (
                <Button
                  variant="solid"
                  color="orange"
                  onClick={handlePurchaseRepair}
                  disabled={purchasingRepair || !hasEnoughCoins}
                  loading={purchasingRepair}
                >
                  <Icon icon="wrench" style={{ marginRight: '0.5rem' }} />
                  {hasEnoughCoins
                    ? `Restore Streak (100,000 coins)`
                    : `Need 100,000 coins (you have ${(
                        twinkleCoins || 0
                      ).toLocaleString()})`}
                </Button>
              )}
            </div>
          )}

          {/* Streak Broken Warning */}
          {streakBroken && (
            <div
              className={css`
                text-align: center;
                margin-bottom: 1.5rem;
                padding: 1rem 1.5rem;
                background: ${Color.gray()}10;
                border: 2px solid ${Color.borderGray()};
                border-radius: 12px;
              `}
            >
              <p
                className={css`
                  font-size: 1.3rem;
                  font-weight: bold;
                  color: ${Color.darkerGray()};
                  margin-bottom: 0.5rem;
                `}
              >
                Your streak has already reset
              </p>
              <p
                className={css`
                  font-size: 1.2rem;
                  color: ${Color.darkerGray()};
                  margin-bottom: 0;
                `}
              >
                Start a new streak by answering today.
              </p>
            </div>
          )}

          {/* Streak Repair Available */}
          {streakRepairAvailable &&
            !streakAtRisk &&
            !streakBroken &&
            currentStreak > 0 && (
            <div
              className={css`
                text-align: center;
                margin-bottom: 1rem;
                padding: 0.75rem 1rem;
                background: ${Color.green()}15;
                border-radius: 8px;
              `}
            >
              <p
                className={css`
                  font-size: 1.2rem;
                  color: ${Color.green()};
                  font-weight: 600;
                `}
              >
                ✨ Streak repair ready - your streak is protected!
              </p>
            </div>
          )}

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
                <span className={ruleTitleCls}>Keep typing</span> — if you stop
                for more than{' '}
                <span className={ruleWarningCls}>
                  {INACTIVITY_LIMIT} seconds
                </span>
                , your response auto-submits
              </li>
              <li>
                <span className={ruleSuccessCls}>Typos are fine</span> —
                spelling, grammar, and even language don't affect your grade.
                Write in whatever language you're comfortable with!
                <p
                  className={css`
                    margin-top: 1rem;
                    font-size: 1.2rem;
                    color: ${Color.darkerGray()};
                    line-height: 1.5;
                  `}
                >
                  After grading, you'll get a{' '}
                  <span className={ruleSuccessCls}>
                    polished English version
                  </span>{' '}
                  you can choose to share instead.
                </p>
              </li>
              <li>
                <span className={ruleTitleCls}>Minimum length</span> — write at
                least{' '}
                <span className={ruleSuccessCls}>
                  {MIN_RESPONSE_LENGTH} characters
                </span>{' '}
                before the timer runs out, or it's an{' '}
                <span className={ruleWarningCls}>automatic fail</span>
              </li>
              <li>
                <span className={ruleTitleCls}>No going back</span> —{' '}
                <span className={ruleWarningCls}>
                  backspace and delete are disabled
                </span>
                . Just keep moving forward!
              </li>
              <li>
                <span className={ruleTitleCls}>No copy‑paste</span> — write in
                your own words
              </li>
              <li>
                <span className={ruleTitleCls}>
                  Closing this window cancels
                </span>{' '}
                — your response{' '}
                <span className={ruleWarningCls}>won't be saved</span>, so
                you'll need to start over
              </li>
            </ul>
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
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            placeholder="Just start typing... don't stop to think, just write..."
            className={textareaCls}
            autoFocus
          />

          <div className={statsRowCls}>
            <span style={{ color: Color.lightGray() }}>{wordCount} words</span>
            <span style={{ color: Color.lightGray(), fontSize: '1.1rem' }}>
              {minLengthMet ? 'Minimum met' : `${remainingChars} chars to go`}
            </span>
          </div>
          {minEffortBarShown && (
            <div style={{ width: '100%' }}>
              <ProgressBar
                text={minEffortDisplayLabel}
                color={minEffortColor}
                progress={minEffortProgress}
              />
            </div>
          )}
          <div
            style={{
              color: Color.lightGray(),
              fontSize: '1.1rem',
              marginTop: '0.3rem'
            }}
          >
            No backspace allowed - keep going!
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (screen === 'grading') {
    return (
      <div className={centeredContainerCls}>
        <div className={innerContainerCls}>
          <Loading text={gradingMessage || 'Evaluating your response...'} />
          <div style={{ width: '60%' }}>
            <ProgressBar progress={gradingProgress} />
          </div>
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
          questionId={questionId}
          grade={gradingResult.grade}
          xpAwarded={gradingResult.xpAwarded}
          feedback={gradingResult.feedback}
          responseId={gradingResult.responseId}
          streak={gradingResult.streak}
          streakMultiplier={gradingResult.streakMultiplier}
          usedRepair={gradingResult.usedRepair}
          isShared={gradingResult.isShared}
          sharedWithZero={gradingResult.sharedWithZero}
          sharedWithCiel={gradingResult.sharedWithCiel}
          originalResponse={gradingResult.originalResponse}
          initialRefinedResponse={gradingResult.sharedResponse}
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

const centeredContainerCls = css`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
`;

const innerContainerCls = css`
  margin-top: -7rem;
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  flex-direction: column;
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

const ruleTitleCls = css`
  font-weight: 700;
  color: ${Color.black()};
`;

const ruleWarningCls = css`
  font-weight: 700;
  color: ${Color.rose()};
`;

const ruleSuccessCls = css`
  font-weight: 700;
  color: ${Color.green()};
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
