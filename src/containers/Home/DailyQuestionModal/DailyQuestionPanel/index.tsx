import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import {
  DAILY_QUESTION_DRAFT_RESTORED_NOTICE,
  DAILY_QUESTION_DRAFT_SAVED_NOTICE,
  DAILY_QUESTION_RECOVERY_MAX_ATTEMPTS,
  DAILY_QUESTION_RECOVERY_NOT_FOUND_RETRY_LIMIT,
  DAILY_QUESTION_RECOVERY_POLL_MS,
  GRADING_DURATION_MULTIPLIER,
  INACTIVITY_LIMIT,
  MIN_GRADING_DURATION_MS,
  MIN_RESPONSE_LENGTH,
  PROGRESS_MILESTONE_HOLD,
  PROGRESS_TICK_MS,
  QUESTION_PROGRESS_DURATIONS
} from './constants';
import GradingResult from './GradingResult';
import ProgressScreen from './ProgressScreen';
import { getFocusLabel, getVibeLabel } from './questionPreferences';
import StartScreen from './StartScreen';
import {
  clearPendingDailyQuestionSubmission,
  cloneTypingMetadata,
  createDailyQuestionClientRequestId,
  createEmptyTypingMetadata,
  isDeletionOnlyChange,
  loadPendingDailyQuestionSubmission,
  normalizeSelectionArray,
  normalizeTypingMetadata,
  savePendingDailyQuestionSubmission
} from './storage';
import { centeredContainerCls } from './styles';
import type {
  DailyQuestionGradingResultState,
  DailyQuestionSubmitResult,
  RecoverPendingSubmissionArgs,
  Screen,
  TypingMetadata
} from './types';
import WritingScreen from './WritingScreen';

export default function DailyQuestionPanel({
  onClose
}: {
  onClose: () => void;
}) {
  const { userId, profileTheme, twinkleCoins } = useKeyContext(
    (v) => v.myState
  );
  const getDailyQuestion = useAppContext(
    (v) => v.requestHelpers.getDailyQuestion
  );
  const submitDailyQuestionResponse = useAppContext(
    (v) => v.requestHelpers.submitDailyQuestionResponse
  );
  const recoverDailyQuestionSubmission = useAppContext(
    (v) => v.requestHelpers.recoverDailyQuestionSubmission
  );
  const simplifyDailyQuestion = useAppContext(
    (v) => v.requestHelpers.simplifyDailyQuestion
  );
  const purchaseDailyQuestionRepair = useAppContext(
    (v) => v.requestHelpers.purchaseDailyQuestionRepair
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onApplyTodayStatsProgress = useNotiContext(
    (v) => v.actions.onApplyTodayStatsProgress
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
  const [gradingResult, setGradingResult] =
    useState<DailyQuestionGradingResultState | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayVibe, setTodayVibe] = useState<string | null>(null);
  const [todayCurrentFocus, setTodayCurrentFocus] = useState<string | null>(
    null
  );
  const [streakRepairAvailable, setStreakRepairAvailable] = useState(false);
  const [streakAtRisk, setStreakAtRisk] = useState(false);
  const [streakBroken, setStreakBroken] = useState(false);
  const [nextQuestionCategory, setNextQuestionCategory] = useState<
    string | null
  >(null);
  const [currentFocus, setCurrentFocus] = useState<string | null>(null);
  const [paidTomorrowVibeSelections, setPaidTomorrowVibeSelections] = useState<
    string[]
  >([]);
  const [paidCurrentFocusSelections, setPaidCurrentFocusSelections] = useState<
    string[]
  >([]);
  const [reusableCurrentFocusSelection, setReusableCurrentFocusSelection] =
    useState<string | null>(null);
  const [isAdultUser, setIsAdultUser] = useState<boolean>(false);
  const [purchasingRepair, setPurchasingRepair] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const [restoredDraftNeedsFreshTyping, setRestoredDraftNeedsFreshTyping] =
    useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gradingCompleteRef = useRef(false);
  const hasStartedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSubmittingRef = useRef(false);
  const isComposingRef = useRef(false);
  const committedResponseRef = useRef('');
  const lastActivityRef = useRef<number>(Date.now());
  const restoredDraftNeedsFreshTypingRef = useRef(
    restoredDraftNeedsFreshTyping
  );
  restoredDraftNeedsFreshTypingRef.current = restoredDraftNeedsFreshTyping;
  const handleSubmitRef = useRef<() => void>(() => {});
  const activeClientRequestIdRef = useRef<string | null>(null);
  const recoveryPollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clearPendingSubmissionRef = useRef<() => void>(() => {});
  const returnToDraftStartScreenRef = useRef<
    (args: {
      responseText: string;
      notice: string;
      typingMetadata?: TypingMetadata | null;
    }) => void
  >(() => {});
  const recoverPendingSubmissionRef = useRef<
    (args: RecoverPendingSubmissionArgs) => Promise<void>
  >(async () => {});

  const typingMetadataRef = useRef<TypingMetadata>(createEmptyTypingMetadata());
  const loadingProgressRef = useRef(0);
  const loadingTargetRef = useRef(0);
  const gradingProgressRef = useRef(0);
  const gradingTargetRef = useRef(0);
  const loadingAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const gradingAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const getDailyQuestionRef = useRef(getDailyQuestion);
  const submitDailyQuestionResponseRef = useRef(submitDailyQuestionResponse);
  const recoverDailyQuestionSubmissionRef = useRef(
    recoverDailyQuestionSubmission
  );
  const simplifyDailyQuestionRef = useRef(simplifyDailyQuestion);
  const onSetUserStateRef = useRef(onSetUserState);
  const onApplyTodayStatsProgressRef = useRef(onApplyTodayStatsProgress);

  getDailyQuestionRef.current = getDailyQuestion;
  submitDailyQuestionResponseRef.current = submitDailyQuestionResponse;
  recoverDailyQuestionSubmissionRef.current = recoverDailyQuestionSubmission;
  simplifyDailyQuestionRef.current = simplifyDailyQuestion;
  onSetUserStateRef.current = onSetUserState;
  onApplyTodayStatsProgressRef.current = onApplyTodayStatsProgress;

  useEffect(() => {
    function animateProgress(
      currentRef: React.RefObject<number>,
      targetRef: React.RefObject<number>,
      newTarget: number,
      setter: React.Dispatch<React.SetStateAction<number>>,
      animationRef: React.RefObject<NodeJS.Timeout | null>,
      duration: number = 10000
    ) {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }

      if (newTarget <= currentRef.current) {
        currentRef.current = newTarget;
        targetRef.current = newTarget;
        setter(newTarget);
        return;
      }

      const startValue = currentRef.current;
      targetRef.current = newTarget;
      const effectiveTarget =
        newTarget >= 100
          ? 100 - PROGRESS_MILESTONE_HOLD
          : Math.max(startValue, newTarget - PROGRESS_MILESTONE_HOLD);
      const startedAt = Date.now();

      animationRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const normalizedTime = Math.max(elapsed / duration, 0);
        const easedProgress = 1 - Math.exp(-4 * normalizedTime);
        const nextValue =
          startValue + (effectiveTarget - startValue) * easedProgress;
        const normalizedValue = Math.min(
          effectiveTarget,
          Math.max(currentRef.current, nextValue)
        );
        const displayValue = Math.round(normalizedValue * 10) / 10;

        if (displayValue > currentRef.current) {
          currentRef.current = displayValue;
          setter(displayValue);
        }

        if (
          elapsed >= duration * 1.5 ||
          effectiveTarget - normalizedValue <= 0.05
        ) {
          if (animationRef.current) {
            clearInterval(animationRef.current);
            animationRef.current = null;
          }
          const settledValue = Math.round(effectiveTarget * 10) / 10;
          currentRef.current = settledValue;
          setter(settledValue);
        }
      }, PROGRESS_TICK_MS);
    }

    function handleQuestionProgress({
      step,
      progress
    }: {
      step: string;
      progress: number;
    }) {
      setLoadingMessage(step);

      const duration =
        progress <= 33
          ? QUESTION_PROGRESS_DURATIONS.early
          : progress <= 66
            ? QUESTION_PROGRESS_DURATIONS.middle
            : QUESTION_PROGRESS_DURATIONS.late;
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
      progress,
      durationMs
    }: {
      step: string;
      progress: number;
      durationMs?: number;
    }) {
      setGradingMessage(step);
      const duration =
        typeof durationMs === 'number' && durationMs > 0
          ? Math.max(
              Math.round(durationMs * GRADING_DURATION_MULTIPLIER),
              MIN_GRADING_DURATION_MS
            )
          : MIN_GRADING_DURATION_MS;
      animateProgress(
        gradingProgressRef,
        gradingTargetRef,
        progress,
        setGradingProgress,
        gradingAnimationRef,
        duration
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

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (recoveryPollTimeoutRef.current) {
        clearTimeout(recoveryPollTimeoutRef.current);
        recoveryPollTimeoutRef.current = null;
      }
    };
  }, []);

  function clearRecoveryPoll() {
    if (recoveryPollTimeoutRef.current) {
      clearTimeout(recoveryPollTimeoutRef.current);
      recoveryPollTimeoutRef.current = null;
    }
  }

  function clearPendingSubmission() {
    clearRecoveryPoll();
    if (userId) {
      clearPendingDailyQuestionSubmission(userId);
    }
    activeClientRequestIdRef.current = null;
  }

  function returnToDraftStartScreen({
    responseText,
    notice,
    typingMetadata
  }: {
    responseText: string;
    notice: string;
    typingMetadata?: TypingMetadata | null;
  }) {
    const restoredTypingMetadata = normalizeTypingMetadata(typingMetadata);
    clearRecoveryPoll();
    activeClientRequestIdRef.current = null;
    committedResponseRef.current = responseText || '';
    setResponse(responseText || '');
    typingMetadataRef.current = restoredTypingMetadata
      ? cloneTypingMetadata(restoredTypingMetadata)
      : createEmptyTypingMetadata();
    setGradingResult(null);
    setError(null);
    setRecoveryNotice(notice);
    setRestoredDraftNeedsFreshTyping(
      Boolean((responseText || '').trim()) && !restoredTypingMetadata
    );
    setScreen('start');
    isSubmittingRef.current = false;
  }

  function saveDraftOnlyPendingSubmission({
    questionId,
    clientRequestId,
    responseText,
    typingMetadata
  }: {
    questionId: number;
    clientRequestId: string;
    responseText: string;
    typingMetadata?: TypingMetadata | null;
  }) {
    if (!userId) return;
    savePendingDailyQuestionSubmission({
      userId,
      questionId,
      clientRequestId,
      response: responseText,
      createdAt: Date.now(),
      recoveryState: 'draft',
      typingMetadata
    });
  }

  function persistDraftRecovery({
    questionId,
    clientRequestId,
    responseText,
    typingMetadata
  }: {
    questionId: number;
    clientRequestId: string;
    responseText: string;
    typingMetadata?: TypingMetadata | null;
  }) {
    clearRecoveryPoll();
    activeClientRequestIdRef.current = null;
    saveDraftOnlyPendingSubmission({
      questionId,
      clientRequestId,
      responseText,
      typingMetadata
    });
  }

  function applyCompletedSubmitResult({
    result,
    fallbackOriginalResponse
  }: {
    result: DailyQuestionSubmitResult;
    fallbackOriginalResponse?: string;
  }) {
    gradingCompleteRef.current = true;
    setGradingProgress(100);
    setError(null);
    setRecoveryNotice(null);
    setRestoredDraftNeedsFreshTyping(false);
    typingMetadataRef.current = createEmptyTypingMetadata();
    clearPendingSubmission();

    if (result.newXP && userId) {
      onSetUserStateRef.current({
        userId,
        newState: { twinkleXP: result.newXP }
      });
    }

    if (result.isThoughtful) {
      onApplyTodayStatsProgressRef.current({
        newStats: { dailyQuestionCompleted: true }
      });
    }

    const originalResponse =
      result.originalResponse || fallbackOriginalResponse || '';
    committedResponseRef.current = originalResponse;
    setResponse(originalResponse);

    setTimeout(() => {
      if (!isMountedRef.current) return;

      setGradingResult({
        grade: result.isThoughtful ? result.grade || 'Pass' : 'Fail',
        masterpieceType: result.masterpieceType || null,
        xpAwarded: result.xpAwarded || 0,
        feedback: result.isThoughtful
          ? result.feedback || ''
          : result.rejectionReason ||
            'Nice try — you can start over and try again right away.',
        responseId: result.responseId || 0,
        isShared: false,
        sharedWithZero: false,
        sharedWithCiel: false,
        originalResponse,
        sharedResponse: result.sharedResponse || null,
        streak: result.streak || 1,
        streakMultiplier: result.streakMultiplier || 1,
        usedRepair: result.usedRepair || false
      });
      setScreen('result');
      isSubmittingRef.current = false;
    }, 500);
  }

  function scheduleRecoveryPoll({
    questionId,
    clientRequestId,
    responseText,
    attempt
  }: {
    questionId: number;
    clientRequestId: string;
    responseText: string;
    attempt: number;
  }) {
    clearRecoveryPoll();
    recoveryPollTimeoutRef.current = setTimeout(() => {
      void recoverPendingSubmission({
        questionId,
        clientRequestId,
        responseText,
        attempt
      });
    }, DAILY_QUESTION_RECOVERY_POLL_MS) as unknown as NodeJS.Timeout;
  }

  async function recoverPendingSubmission({
    questionId,
    clientRequestId,
    responseText,
    attempt = 0
  }: RecoverPendingSubmissionArgs) {
    try {
      const result = await recoverDailyQuestionSubmissionRef.current({
        questionId,
        clientRequestId
      });

      if (!isMountedRef.current) return;

      if (result.status === 'completed' && result.submitResult) {
        applyCompletedSubmitResult({
          result: result.submitResult,
          fallbackOriginalResponse: responseText
        });
        return;
      }

      const shouldRetryNotFound =
        result.status === 'not_found' &&
        attempt < DAILY_QUESTION_RECOVERY_NOT_FOUND_RETRY_LIMIT;
      if (result.status === 'processing' || shouldRetryNotFound) {
        setScreen('grading');
        setGradingMessage('Restoring your result...');
        setGradingProgress((current) => Math.max(current, 95));
        if (attempt + 1 < DAILY_QUESTION_RECOVERY_MAX_ATTEMPTS) {
          scheduleRecoveryPoll({
            questionId,
            clientRequestId,
            responseText,
            attempt: attempt + 1
          });
          return;
        }
      }

      if (result.status === 'not_found') {
        persistDraftRecovery({
          questionId,
          clientRequestId,
          responseText,
          typingMetadata: typingMetadataRef.current
        });
        returnToDraftStartScreen({
          responseText,
          notice: DAILY_QUESTION_DRAFT_RESTORED_NOTICE,
          typingMetadata: typingMetadataRef.current
        });
        return;
      }

      clearPendingSubmission();
      isSubmittingRef.current = false;
      setError(
        'Failed to recover your submission. Please try again from a new question screen.'
      );
    } catch (err: any) {
      if (!isMountedRef.current) return;

      if (attempt + 1 < DAILY_QUESTION_RECOVERY_MAX_ATTEMPTS) {
        setScreen('grading');
        setGradingMessage('Restoring your result...');
        setGradingProgress((current) => Math.max(current, 95));
        scheduleRecoveryPoll({
          questionId,
          clientRequestId,
          responseText,
          attempt: attempt + 1
        });
        return;
      }

      console.error(
        'Failed to recover pending daily question submission:',
        err
      );
      persistDraftRecovery({
        questionId,
        clientRequestId,
        responseText,
        typingMetadata: typingMetadataRef.current
      });
      returnToDraftStartScreen({
        responseText,
        notice: DAILY_QUESTION_DRAFT_SAVED_NOTICE,
        typingMetadata: typingMetadataRef.current
      });
    }
  }

  clearPendingSubmissionRef.current = clearPendingSubmission;
  returnToDraftStartScreenRef.current = returnToDraftStartScreen;
  recoverPendingSubmissionRef.current = recoverPendingSubmission;

  useEffect(() => {
    if (!userId) return;

    loadingProgressRef.current = 0;
    loadingTargetRef.current = 0;
    if (loadingAnimationRef.current) {
      clearInterval(loadingAnimationRef.current);
      loadingAnimationRef.current = null;
    }

    setScreen('loading');
    setError(null);
    setRecoveryNotice(null);
    setLoadingProgress(0);
    setLoadingMessage('Loading...');

    const requestId = Date.now();
    const currentRequestRef = { id: requestId, cancelled: false };

    async function loadDailyQuestion() {
      try {
        const data = await getDailyQuestionRef.current();

        if (!isMountedRef.current || currentRequestRef.cancelled) return;

        if (data.error) {
          setError(data.error);
          return;
        }

        setLoadingProgress(100);
        setQuestionId(data.questionId);
        setQuestion(data.question);
        setOriginalQuestion(data.question);
        setCurrentStreak(data.currentStreak || 0);
        setTodayVibe(data.todayVibe || null);
        setTodayCurrentFocus(data.todayCurrentFocus || null);
        setStreakRepairAvailable(!!data.streakRepairAvailable);
        setStreakAtRisk(!!data.streakAtRisk);
        setStreakBroken(!!data.streakBroken);
        setNextQuestionCategory(data.nextQuestionCategory || null);
        setCurrentFocus(data.currentFocus || null);
        setPaidTomorrowVibeSelections(
          normalizeSelectionArray(data.paidTomorrowVibeSelections)
        );
        setPaidCurrentFocusSelections(
          normalizeSelectionArray(data.paidCurrentFocusSelections)
        );
        setReusableCurrentFocusSelection(
          data.reusableCurrentFocusSelection || null
        );
        setIsAdultUser(!!data.isAdult);

        const pendingSubmission = loadPendingDailyQuestionSubmission(userId);
        if (
          pendingSubmission &&
          pendingSubmission.questionId !== data.questionId
        ) {
          clearPendingDailyQuestionSubmission(userId);
        }

        typingMetadataRef.current = createEmptyTypingMetadata();
        setRestoredDraftNeedsFreshTyping(false);

        if (data.hasResponded && data.response) {
          clearPendingSubmissionRef.current();
          committedResponseRef.current = data.response.response || '';
          setGradingResult({
            grade: data.response.grade,
            masterpieceType: data.response.masterpieceType || null,
            xpAwarded: data.response.xpAwarded,
            feedback: data.response.feedback,
            responseId: data.response.id,
            isShared: data.response.isShared,
            sharedWithZero: !!data.response.sharedWithZero,
            sharedWithCiel: !!data.response.sharedWithCiel,
            originalResponse: data.response.response || '',
            sharedResponse: data.response.sharedResponse || null,
            streak: data.response.streakAtTime || data.currentStreak || 1,
            streakMultiplier: Math.min(data.response.streakAtTime || 1, 10),
            usedRepair: !!data.response.usedRepair
          });
          setResponse(data.response.response || '');
          setScreen('result');
        } else if (
          pendingSubmission &&
          pendingSubmission.questionId === data.questionId
        ) {
          if (pendingSubmission.recoveryState === 'draft') {
            returnToDraftStartScreenRef.current({
              responseText: pendingSubmission.response || '',
              notice: DAILY_QUESTION_DRAFT_SAVED_NOTICE,
              typingMetadata: pendingSubmission.typingMetadata
            });
          } else {
            typingMetadataRef.current = pendingSubmission.typingMetadata
              ? cloneTypingMetadata(pendingSubmission.typingMetadata)
              : createEmptyTypingMetadata();
            activeClientRequestIdRef.current =
              pendingSubmission.clientRequestId;
            committedResponseRef.current = pendingSubmission.response || '';
            setResponse(pendingSubmission.response || '');
            setScreen('grading');
            setGradingProgress(95);
            setGradingMessage('Restoring your result...');
            setGradingResult(null);
            isSubmittingRef.current = true;
            void recoverPendingSubmissionRef.current({
              questionId: data.questionId,
              clientRequestId: pendingSubmission.clientRequestId,
              responseText: pendingSubmission.response || ''
            });
          }
        } else {
          clearPendingSubmissionRef.current();
          committedResponseRef.current = '';
          setResponse('');
          setGradingResult(null);
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

    if (restoredDraftNeedsFreshTyping) {
      return;
    }

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
  }, [screen, restoredDraftNeedsFreshTyping]);

  function handleStart() {
    setRecoveryNotice(null);
    hasStartedRef.current = true;
    clearRecoveryPoll();
    activeClientRequestIdRef.current = null;
    committedResponseRef.current = response;
    if (!normalizeTypingMetadata(typingMetadataRef.current)) {
      typingMetadataRef.current = {
        startTime: Date.now(),
        keystrokeTimestamps: []
      };
    }
    setScreen('writing');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }

  async function handleSimplify() {
    if (!questionId || isSimplifying) return;

    try {
      setIsSimplifying(true);
      const result = await simplifyDailyQuestionRef.current({ questionId });

      if (result.simplifiedQuestion) {
        setQuestion(result.simplifiedQuestion);
        setIsSimplified(true);
      }
    } catch (err) {
      console.error('Failed to simplify question:', err);
    } finally {
      setIsSimplifying(false);
    }
  }

  function handleShowOriginal() {
    setQuestion(originalQuestion);
    setIsSimplified(false);
  }

  const hasEnoughCoins = (twinkleCoins || 0) >= 100000;

  async function handlePurchaseRepair() {
    if (purchasingRepair || streakRepairAvailable || !hasEnoughCoins) return;

    try {
      setPurchasingRepair(true);
      const result = await purchaseDailyQuestionRepair();

      if (result.error) {
        if (!result.error.toLowerCase().includes('not enough coins')) {
          setError(result.error);
        }
        return;
      }

      if (result.success) {
        setStreakRepairAvailable(true);
        if (userId && result.newBalance !== undefined) {
          onSetUserState({
            userId,
            newState: { twinkleCoins: result.newBalance }
          });
        }
      }
    } catch (err: any) {
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
      if (isComposingRef.current || e.nativeEvent.isComposing) {
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        return;
      }

      const lowerCaseKey = e.key.toLowerCase();
      if (
        (e.ctrlKey || e.metaKey) &&
        (lowerCaseKey === 'x' || lowerCaseKey === 'a' || lowerCaseKey === 'z')
      ) {
        e.preventDefault();
        return;
      }
    },
    []
  );

  const handleBeforeInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (isComposingRef.current) {
        return;
      }

      const inputType = (e.nativeEvent as InputEvent).inputType;
      if (
        inputType?.startsWith('delete') ||
        inputType === 'insertFromPaste' ||
        inputType === 'insertFromDrop' ||
        inputType === 'historyUndo'
      ) {
        e.preventDefault();
      }
    },
    []
  );

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      const now = Date.now();
      const finalValue = e.currentTarget.value;
      const committedResponse = committedResponseRef.current;

      isComposingRef.current = false;

      const looksLikeDeletionOnly =
        finalValue.length < committedResponse.length &&
        isDeletionOnlyChange(committedResponse, finalValue);
      if (looksLikeDeletionOnly) {
        e.currentTarget.value = committedResponse;
        setResponse(committedResponse);
        return;
      }

      if (finalValue.length > committedResponse.length) {
        if (restoredDraftNeedsFreshTypingRef.current) {
          setRestoredDraftNeedsFreshTyping(false);
        }
        typingMetadataRef.current.keystrokeTimestamps.push(now);
      }

      committedResponseRef.current = finalValue;
      setResponse(finalValue);
      lastActivityRef.current = now;
    },
    []
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const now = Date.now();
      const newValue = e.target.value;
      const committedResponse = committedResponseRef.current;
      const nativeEvent = e.nativeEvent as InputEvent;

      if (isComposingRef.current || nativeEvent.isComposing) {
        setResponse(newValue);
        lastActivityRef.current = now;
        return;
      }

      const looksLikeDeletionOnly =
        newValue.length < committedResponse.length &&
        isDeletionOnlyChange(committedResponse, newValue);
      const isUndo = nativeEvent.inputType === 'historyUndo';
      if (looksLikeDeletionOnly || isUndo) {
        e.target.value = committedResponse;
        setResponse(committedResponse);
        return;
      }

      if (newValue.length > committedResponse.length) {
        if (restoredDraftNeedsFreshTypingRef.current) {
          setRestoredDraftNeedsFreshTyping(false);
        }
        typingMetadataRef.current.keystrokeTimestamps.push(now);
      }

      committedResponseRef.current = newValue;
      setResponse(newValue);
      lastActivityRef.current = now;
    },
    []
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
    },
    []
  );

  const handleCut = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
    },
    []
  );

  function handleDragOver(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
  }

  const handleSubmit = useCallback(async () => {
    if (
      !questionId ||
      isSubmittingRef.current ||
      restoredDraftNeedsFreshTypingRef.current
    ) {
      return;
    }
    isSubmittingRef.current = true;
    clearRecoveryPoll();
    setRecoveryNotice(null);

    const metadata = typingMetadataRef.current;
    const endTime = Date.now();
    const timestamps = metadata.keystrokeTimestamps;
    const trimmedResponse = response.trim() || '(no response)';
    const clientRequestId =
      activeClientRequestIdRef.current || createDailyQuestionClientRequestId();
    activeClientRequestIdRef.current = clientRequestId;

    if (userId) {
      savePendingDailyQuestionSubmission({
        userId,
        questionId,
        clientRequestId,
        response: trimmedResponse,
        createdAt: endTime,
        recoveryState: 'pending',
        typingMetadata: typingMetadataRef.current
      });
    }

    let maxBurstSize = 0;
    let burstCount = 0;
    const burstPauseThreshold = 500;

    if (timestamps.length > 0) {
      let currentBurst = 1;
      for (let i = 1; i < timestamps.length; i++) {
        const gap = timestamps[i] - timestamps[i - 1];
        if (gap <= burstPauseThreshold) {
          currentBurst++;
        } else {
          if (currentBurst > 1) {
            burstCount++;
            if (currentBurst > maxBurstSize) {
              maxBurstSize = currentBurst;
            }
          }
          currentBurst = 1;
        }
      }
      if (currentBurst > 1) {
        burstCount++;
        if (currentBurst > maxBurstSize) {
          maxBurstSize = currentBurst;
        }
      }
    }

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
      const result = await submitDailyQuestionResponseRef.current({
        questionId,
        response: trimmedResponse,
        clientRequestId,
        typingMetadata: {
          startTime: metadata.startTime,
          endTime,
          keystrokeCount: timestamps.length,
          totalCharsTyped: trimmedResponse.length,
          maxBurstSize,
          burstCount
        }
      });

      if (result.error) {
        setError(result.error);
        clearPendingSubmission();
        isSubmittingRef.current = false;
        return;
      }

      applyCompletedSubmitResult({
        result,
        fallbackOriginalResponse: trimmedResponse
      });
    } catch (err: any) {
      console.error('Failed to submit response:', err);
      if (err?.status && err.status < 500 && err.status !== 409) {
        clearPendingSubmission();
        setError(err?.message || 'Failed to submit. Please try again.');
        isSubmittingRef.current = false;
        return;
      }
      setScreen('grading');
      setGradingMessage('Restoring your result...');
      setGradingProgress((current) => Math.max(current, 95));
      void recoverPendingSubmission({
        questionId,
        clientRequestId,
        responseText: trimmedResponse
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, response, userId]);

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
  const todayVibeLabel = getVibeLabel(todayVibe);
  const todayCurrentFocusLabel = getFocusLabel(todayCurrentFocus, isAdultUser);

  if (screen === 'loading') {
    return (
      <ProgressScreen
        text={loadingMessage || "Loading today's question..."}
        progress={loadingProgress}
      />
    );
  }

  if (error) {
    return (
      <div className={centeredContainerCls}>
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
      <StartScreen
        currentStreak={currentStreak}
        hasEnoughCoins={hasEnoughCoins}
        isSimplified={isSimplified}
        isSimplifying={isSimplifying}
        profileTheme={profileTheme}
        purchasingRepair={purchasingRepair}
        question={question}
        recoveryNotice={recoveryNotice}
        streakAtRisk={streakAtRisk}
        streakBroken={streakBroken}
        streakRepairAvailable={streakRepairAvailable}
        todayCurrentFocusLabel={todayCurrentFocusLabel}
        todayVibeLabel={todayVibeLabel}
        twinkleCoins={twinkleCoins}
        onClose={onClose}
        onPurchaseRepair={handlePurchaseRepair}
        onShowOriginal={handleShowOriginal}
        onSimplify={handleSimplify}
        onStart={handleStart}
      />
    );
  }

  if (screen === 'writing') {
    return (
      <WritingScreen
        inactivityTimer={inactivityTimer}
        minEffortBarShown={minEffortBarShown}
        minEffortColor={minEffortColor}
        minEffortDisplayLabel={minEffortDisplayLabel}
        minEffortProgress={minEffortProgress}
        minLengthMet={minLengthMet}
        question={question}
        remainingChars={remainingChars}
        response={response}
        restoredDraftNeedsFreshTyping={restoredDraftNeedsFreshTyping}
        textareaRef={textareaRef}
        timeWarning={timeWarning}
        wordCount={wordCount}
        onBeforeInput={handleBeforeInput}
        onCompositionEnd={handleCompositionEnd}
        onCompositionStart={handleCompositionStart}
        onCut={handleCut}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
    );
  }

  if (screen === 'grading') {
    return (
      <ProgressScreen
        text={gradingMessage || 'Evaluating your response...'}
        progress={gradingProgress}
      />
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
          masterpieceType={gradingResult.masterpieceType}
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
          initialNextQuestionCategory={nextQuestionCategory}
          initialCurrentFocus={currentFocus}
          initialPaidTomorrowVibeSelections={paidTomorrowVibeSelections}
          initialPaidCurrentFocusSelections={paidCurrentFocusSelections}
          initialReusableCurrentFocusSelection={reusableCurrentFocusSelection}
          isAdultUser={isAdultUser}
          onClose={onClose}
        />
      </ErrorBoundary>
    );
  }

  return null;
}
