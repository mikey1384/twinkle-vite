import React, { useEffect, useMemo, useRef, useState } from 'react';
import { socket } from '~/constants/sockets/api';
import { WORD_MASTER_BREAK_INTERVAL } from '~/constants/defaultValues';
import BreakSection from './BreakSection';
import Content from './Content';
import { WordMasterBreakModalProps } from './types';
import { getBreakAccent } from './utils';

export default function WordMasterBreakModal({
  breakStatus,
  isOpen,
  loading,
  onClose,
  onRefresh,
  onClearBreak,
  onPayBreak,
  onSpinRoulette,
  onLoadQuizQuestion,
  onSubmitQuizAnswer,
  onOpenWordle,
  onOpenGrammarGame,
  onOpenAIStories,
  onOpenDailyQuestion,
  onOpenChessPuzzle,
  onOpenPendingOmok,
  onOpenOmokStart,
  onStartOmokWithUser
}: WordMasterBreakModalProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizLoadProgress, setQuizLoadProgress] = useState(0);
  const [quizLoadStep, setQuizLoadStep] = useState('');
  const [readyCountdown, setReadyCountdown] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusIsError, setStatusIsError] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [confirmBypassShown, setConfirmBypassShown] = useState(false);
  const refreshOnceRef = useRef(false);
  const readyCountdownTimerRef = useRef<any>(null);
  const readyCountdownKeyRef = useRef<number | null>(null);

  const breakType = breakStatus?.breakType;
  const breakIndex = Number(breakStatus?.activeBreakIndex || 0);
  const breakInterval =
    breakStatus?.breakInterval || WORD_MASTER_BREAK_INTERVAL;
  const hasActiveBreak = Boolean(breakIndex && breakType);
  const isLocked = Boolean(breakStatus?.locked);
  const failedBreaks = Array.isArray(breakStatus?.failedBreaks)
    ? breakStatus.failedBreaks
    : [];
  const requirement = breakStatus?.requirement || {};
  const quiz = breakStatus?.quiz || null;
  const quizQuestion = quiz?.question || null;
  const questionId = quizQuestion?.id;
  const quizStarted = Boolean(quizQuestion);
  const summaryAccent = getBreakAccent(breakType);
  const strikeBlurb = hasActiveBreak
    ? 'Complete the requirement below to clear this break and continue collecting words.'
    : `A strike is added when you look up a word already collected this year (by anyone). Each word only adds one strike per year. Every ${breakInterval} strikes triggers a break. Resets each day.`;
  const canClearRequirement =
    breakType &&
    breakType !== 'vocab_quiz' &&
    requirement?.isComplete &&
    !isLocked;
  const canBypass = Boolean(breakStatus?.canBypass);
  const bypassCost = Number(breakStatus?.bypassCost || 0);
  const rolledPrice =
    typeof breakStatus?.rolledPrice === 'number'
      ? breakStatus.rolledPrice
      : null;
  const hasRolledPrice = rolledPrice !== null;

  useEffect(() => {
    setStatusMessage('');
    setSelectedIndex(null);
    setQuizResult(null);
    setQuizLoadProgress(0);
    setQuizLoadStep('');
    setReadyCountdown(0);
    readyCountdownKeyRef.current = null;
    if (readyCountdownTimerRef.current) {
      clearInterval(readyCountdownTimerRef.current);
      readyCountdownTimerRef.current = null;
    }
    refreshOnceRef.current = false;
  }, [breakIndex, breakType, questionId, isOpen]);

  useEffect(() => {
    if (!quizQuestion || isLocked) {
      setTimeRemaining(null);
      return;
    }
    const initial = Number(quiz?.timeRemainingSec ?? 0);
    setTimeRemaining(Number.isFinite(initial) ? initial : null);
  }, [questionId, quiz?.timeRemainingSec, isLocked, quizQuestion]);

  useEffect(() => {
    if (!quizStarted || !quizQuestion) {
      setReadyCountdown(0);
      readyCountdownKeyRef.current = null;
      if (readyCountdownTimerRef.current) {
        clearInterval(readyCountdownTimerRef.current);
        readyCountdownTimerRef.current = null;
      }
      return;
    }
    if (quiz?.currentIndex !== 1) return;
    if (readyCountdownKeyRef.current === quizQuestion.id) return;

    const initialCountdown = Math.max(0, Number(quiz?.readyCountdownSec ?? 0));
    if (!initialCountdown) return;

    readyCountdownKeyRef.current = quizQuestion.id;
    setReadyCountdown(initialCountdown);
    if (readyCountdownTimerRef.current) {
      clearInterval(readyCountdownTimerRef.current);
    }
    readyCountdownTimerRef.current = setInterval(() => {
      setReadyCountdown((prev) => {
        if (prev <= 1) {
          if (readyCountdownTimerRef.current) {
            clearInterval(readyCountdownTimerRef.current);
            readyCountdownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [quizStarted, quizQuestion, quiz?.currentIndex, quiz?.readyCountdownSec]);

  useEffect(() => {
    function handleQuizProgress({
      progress,
      step
    }: {
      progress: number;
      step: string;
    }) {
      setQuizLoadProgress(progress);
      setQuizLoadStep(step);
    }

    function handleQuizTimer({
      timeRemainingSec
    }: {
      timeRemainingSec: number;
    }) {
      setTimeRemaining(timeRemainingSec);
    }

    socket.on('word_master_quiz_progress', handleQuizProgress);
    socket.on('word_master_quiz_timer', handleQuizTimer);

    return () => {
      socket.off('word_master_quiz_progress', handleQuizProgress);
      socket.off('word_master_quiz_timer', handleQuizTimer);
    };
  }, []);

  useEffect(() => {
    if (
      timeRemaining !== 0 ||
      breakType !== 'vocab_quiz' ||
      isLocked ||
      refreshOnceRef.current
    ) {
      return;
    }
    refreshOnceRef.current = true;
    (async () => {
      try {
        await onRefresh();
      } catch (error) {
        console.error(error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, breakType, isLocked]);

  const modalTitle = useMemo(() => {
    if (!hasActiveBreak) return 'Word Master Breaks';
    return `Word Master Break ${breakIndex}`;
  }, [breakIndex, hasActiveBreak]);

  const summaryLabel = useMemo(() => {
    if (isLocked) return 'Locked today';
    if (!hasActiveBreak) return 'All clear';
    return `Break ${breakIndex} active`;
  }, [breakIndex, hasActiveBreak, isLocked]);

  const quizTimeRemaining = useMemo(() => {
    if (!quizStarted) return null;
    if (typeof timeRemaining === 'number') return timeRemaining;
    const fallback = Number(quiz?.timeRemainingSec ?? NaN);
    if (!Number.isFinite(fallback)) return null;
    return fallback;
  }, [quizStarted, timeRemaining, quiz?.timeRemainingSec]);
  const showReadyCountdown = quizStarted && readyCountdown > 0;
  const showQuizQuestion = quizStarted && readyCountdown === 0;

  return (
    <Content
      actionLoading={actionLoading}
      body={
        <BreakSection
          breakIndex={breakIndex}
          breakInterval={breakInterval}
          breakStatus={breakStatus}
          breakType={breakType}
          failedBreaks={failedBreaks}
          hasActiveBreak={hasActiveBreak}
          isLocked={isLocked}
          loading={loading}
          onOpenAIStories={onOpenAIStories}
          onOpenChessPuzzle={onOpenChessPuzzle}
          onOpenDailyQuestion={onOpenDailyQuestion}
          onOpenGrammarGame={onOpenGrammarGame}
          onOpenOmokStart={onOpenOmokStart}
          onOpenPendingOmok={onOpenPendingOmok}
          onOpenWordle={onOpenWordle}
          onQuizSelect={handleQuizSelect}
          onStartOmokWithUser={onStartOmokWithUser}
          onStartQuiz={handleStartQuiz}
          quiz={quiz}
          quizLoadProgress={quizLoadProgress}
          quizLoadStep={quizLoadStep}
          quizLoading={quizLoading}
          quizQuestion={quizQuestion}
          quizResult={quizResult}
          quizStarted={quizStarted}
          quizTimeRemaining={quizTimeRemaining}
          readyCountdown={readyCountdown}
          selectedIndex={selectedIndex}
          showQuizQuestion={showQuizQuestion}
          showReadyCountdown={showReadyCountdown}
        />
      }
      bypassCost={bypassCost}
      canBypass={canBypass}
      canClearRequirement={Boolean(canClearRequirement)}
      confirmBypassShown={confirmBypassShown}
      hasActiveBreak={hasActiveBreak}
      hasRolledPrice={hasRolledPrice}
      isOpen={isOpen}
      loading={loading}
      modalTitle={modalTitle}
      onClear={handleClear}
      onClose={onClose}
      onConfirmBypass={handleConfirmBypass}
      onCountdownComplete={handleCountdownComplete}
      onModalClose={handleModalClose}
      onRefresh={onRefresh}
      onSetConfirmBypassShown={setConfirmBypassShown}
      onSpinRoulette={onSpinRoulette}
      rolledPrice={rolledPrice}
      statusIsError={statusIsError}
      statusMessage={statusMessage}
      strikeBlurb={strikeBlurb}
      summaryAccent={summaryAccent}
      summaryLabel={summaryLabel}
    />
  );

  function handleModalClose() {
    if (canClearRequirement) {
      handleClear();
    } else {
      onClose();
    }
  }

  function handleConfirmBypass() {
    setConfirmBypassShown(false);
    handlePayBreak();
  }

  function handleClear() {
    setActionLoading(true);
    setStatusMessage('');
    onClearBreak()
      .then((result) => {
        if (result?.cleared) {
          onClose();
        } else if (result?.message) {
          setStatusMessage(result.message);
        }
      })
      .catch((error) => {
        console.error(error);
        setStatusMessage('Unable to clear the break right now.');
      })
      .finally(() => setActionLoading(false));
  }

  function handlePayBreak() {
    setActionLoading(true);
    setStatusMessage('');
    onPayBreak()
      .then((result) => {
        if (result?.message) setStatusMessage(result.message);
      })
      .catch((error) => {
        console.error(error);
        setStatusMessage('Unable to bypass the break right now.');
      })
      .finally(() => setActionLoading(false));
  }

  function handleStartQuiz() {
    setQuizLoading(true);
    setStatusMessage('');
    setStatusIsError(false);
    setQuizLoadProgress(0);
    setQuizLoadStep('Starting quiz...');
    onLoadQuizQuestion()
      .then((result) => {
        if (result?.message) {
          setStatusMessage(result.message);
          setStatusIsError(false);
        }
        if (result?.wordMasterBreak?.quiz?.question) {
          setQuizLoadProgress(100);
          setQuizLoadStep('Quiz ready');
        }
      })
      .catch((error) => {
        console.error(error);
        setStatusMessage(
          'Failed to load quiz. Please try again or check your connection.'
        );
        setStatusIsError(true);
      })
      .finally(() => setQuizLoading(false));
  }

  function handleCountdownComplete() {
    onRefresh().catch((error) => {
      console.error(error);
    });
  }

  function handleQuizSelect(index: number) {
    if (!quizQuestion || quizLoading || actionLoading || loading) return;
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    setActionLoading(true);
    setStatusMessage('');
    onSubmitQuizAnswer(index)
      .then((result) => {
        if (result?.message) {
          setStatusMessage(result.message);
        }
        if (result?.quizResult) {
          setQuizResult(result.quizResult);
          if (result.quizResult.isCorrect) {
            setStatusMessage('Correct!');
          }
        }
      })
      .catch((error) => {
        console.error(error);
        setStatusMessage('Unable to submit the answer right now.');
      })
      .finally(() => setActionLoading(false));
  }
}
