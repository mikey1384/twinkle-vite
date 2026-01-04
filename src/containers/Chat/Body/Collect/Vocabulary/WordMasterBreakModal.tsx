import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import MultipleChoiceQuestion from '~/components/MultipleChoiceQuestion';
import Icon from '~/components/Icon';
import NextDayCountdown from '~/components/NextDayCountdown';
import ProfilePic from '~/components/ProfilePic';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color, mobileMaxWidth } from '~/constants/css';
import { WORD_MASTER_BREAK_INTERVAL } from '~/constants/defaultValues';
import { timeSinceShort } from '~/helpers/timeStampHelpers';
import { socket } from '~/constants/sockets/api';

interface WordMasterBreakModalProps {
  breakStatus: any;
  isOpen: boolean;
  loading?: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onClearBreak: () => Promise<any>;
  onPayBreak: () => Promise<any>;
  onLoadQuizQuestion: () => Promise<any>;
  onSubmitQuizAnswer: (selectedIndex: number) => Promise<any>;
  onOpenWordle?: () => void;
  onOpenGrammarGame?: () => void;
  onOpenAIStories?: () => void;
  onOpenDailyQuestion?: () => void;
  onOpenChessPuzzle?: () => void;
  onOpenPendingOmok?: (channelId: number) => void;
  onOpenOmokStart?: () => void;
  onStartOmokWithUser?: (user: {
    id: number;
    username: string;
    profilePicUrl?: string;
    lastActive?: number;
  }) => void;
}

const timerPulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 ${Color.rose(0)};
  }
  50% {
    transform: scale(1.03);
    box-shadow: 0 0 12px ${Color.rose(0.4)};
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 ${Color.rose(0)};
  }
`;

export default function WordMasterBreakModal({
  breakStatus,
  isOpen,
  loading,
  onClose,
  onRefresh,
  onClearBreak,
  onPayBreak,
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
  const lockReason = breakStatus?.lockReason || null;
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

  const summaryTone = useMemo(() => {
    if (isLocked) return 'rose';
    if (hasActiveBreak) return 'orange';
    return 'green';
  }, [hasActiveBreak, isLocked]);

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
    <ErrorBoundary componentPath="Chat/Body/Collect/Vocabulary/WordMasterBreakModal">
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        title={modalTitle}
        size="lg"
        closeOnBackdropClick
        showCloseButton
        allowOverflow
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1.8rem;
          `}
        >
          <section
            className={css`
              padding: 1.4rem 1.6rem;
              border-radius: 1.2rem;
              background: ${Color.white()};
              border: 1px solid ${Color.borderGray()};
              display: flex;
              flex-direction: column;
              gap: 1rem;
              box-shadow: 0 10px 24px ${Color.black(0.06)};
            `}
          >
            <div
              className={css`
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
              `}
            >
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.9rem;
                  flex-wrap: wrap;
                `}
              >
                <div
                  className={css`
                    width: 3.1rem;
                    height: 3.1rem;
                    border-radius: 1rem;
                    background: ${getToneColor(summaryTone, 0.12)};
                    color: ${getToneColor(summaryTone)};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.6rem;
                  `}
                >
                  <Icon icon={hasActiveBreak ? 'lock' : 'sparkles'} />
                </div>
                <div
                  className={css`
                    padding: 0.35rem 1rem;
                    border-radius: 999px;
                    background: ${getToneColor(summaryTone, 0.12)};
                    color: ${getToneColor(summaryTone)};
                    font-size: 1.2rem;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                  `}
                >
                  {summaryLabel}
                </div>
              </div>
            </div>
            <div
              className={css`
                padding: 0.9rem 1.1rem;
                border-radius: 1rem;
                border: 1px solid ${Color.borderGray()};
                background: ${Color.whiteGray()};
                font-size: 1.15rem;
                color: ${Color.darkGray()};
                font-weight: 600;
                line-height: 1.5;
              `}
            >
              {strikeBlurb}
            </div>
          </section>

          {renderBreakBody()}

          {statusMessage ? (
            <div
              className={css`
                font-size: 1.3rem;
                color: ${statusIsError ? Color.rose() : Color.darkerGray()};
                font-weight: 600;
                text-align: center;
                ${statusIsError
                  ? `
                  background: ${Color.rose(0.1)};
                  padding: 0.8rem 1rem;
                  border-radius: 8px;
                  border: 1px solid ${Color.rose(0.3)};
                  margin: 0.5rem 0;
                `
                  : ''}
              `}
            >
              {statusMessage}
            </div>
          ) : null}

          {canClearRequirement ? (
            <div
              className={css`
                display: flex;
                justify-content: center;
                padding: 0.9rem 1.4rem;
              `}
            >
              <GameCTAButton
                variant="success"
                icon="arrow-right"
                shiny
                size="lg"
                disabled={actionLoading || loading}
                loading={actionLoading}
                onClick={handleClear}
              >
                Keep Collecting Words
              </GameCTAButton>
            </div>
          ) : (
            <div
              className={css`
                display: grid;
                grid-auto-flow: column;
                align-items: center;
                justify-content: center;
                column-gap: 1.2rem;
                padding: 0.9rem 1.4rem;
                text-align: center;
                border-radius: 1rem;
                background: ${summaryAccent.soft};
                border: 1px solid ${summaryAccent.main};
              `}
            >
              <Icon
                icon="clock"
                style={{ color: summaryAccent.main, fontSize: '1.7rem' }}
              />
              <NextDayCountdown
                label="Next reset"
                onComplete={handleCountdownComplete}
                className={css`
                  display: grid;
                  grid-auto-rows: max-content;
                  row-gap: 0.35rem;
                  font-size: 1.45rem;
                  font-weight: 700;
                  color: ${Color.black(0.75)};
                  line-height: 1.2;
                  text-align: center;
                `}
                timerClassName={css`
                  font-family: 'Fira Code', 'Roboto Mono', monospace;
                  font-size: 2.1rem;
                  font-weight: 700;
                  letter-spacing: 0.05em;
                  color: ${summaryAccent.main};
                `}
              />
            </div>
          )}

          <div
            className={css`
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
              justify-content: flex-end;
            `}
          >
            {!canClearRequirement && (
              <Button variant="ghost" onClick={handleModalClose}>
                Close
              </Button>
            )}
            {hasActiveBreak && !canClearRequirement && (
              <GameCTAButton
                variant="gold"
                icon="coins"
                shiny
                disabled={!canBypass || actionLoading || loading}
                onClick={() => setConfirmBypassShown(true)}
              >
                {`Pay ${formatCoins(bypassCost)} coins to bypass`}
              </GameCTAButton>
            )}
          </div>
        </div>
      </Modal>
      {confirmBypassShown && (
        <Modal
          isOpen={confirmBypassShown}
          onClose={() => setConfirmBypassShown(false)}
          title="Confirm Bypass"
          size="sm"
          closeOnBackdropClick
          showCloseButton
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
            `}
          >
            <div
              className={css`
                font-size: 1.4rem;
                color: ${Color.darkerGray()};
                text-align: center;
                line-height: 1.5;
              `}
            >
              Are you sure you want to spend{' '}
              <strong style={{ color: Color.orange() }}>
                {formatCoins(bypassCost)} coins
              </strong>{' '}
              to bypass this break?
            </div>
            <div
              className={css`
                display: flex;
                gap: 1rem;
                justify-content: center;
              `}
            >
              <Button
                variant="ghost"
                onClick={() => setConfirmBypassShown(false)}
              >
                Cancel
              </Button>
              <GameCTAButton
                variant="gold"
                icon="coins"
                shiny
                disabled={actionLoading || loading}
                loading={actionLoading}
                onClick={handleConfirmBypass}
              >
                Confirm
              </GameCTAButton>
            </div>
          </div>
        </Modal>
      )}
    </ErrorBoundary>
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

  function renderBreakBody() {
    const breaksCleared = Number(breakStatus?.clearedThrough || 0);
    if (!hasActiveBreak) {
      return renderGuide(false, 0, breaksCleared, failedBreaks);
    }

    let breakPanel = null;
    // If user just failed quiz, keep showing the quiz with the result
    const justFailedQuiz =
      quizResult && !quizResult.isCorrect && quizResult.locked;
    if (isLocked && !justFailedQuiz) {
      breakPanel = renderLockedPanel();
    } else {
      switch (breakType) {
        case 'daily_tasks':
          breakPanel = renderDailyTasks();
          break;
        case 'daily_reflection':
          breakPanel = renderDailyReflection();
          break;
        case 'chess_puzzle':
          breakPanel = renderChessPuzzle();
          break;
        case 'pending_moves':
          breakPanel = renderPendingMoves();
          break;
        case 'grammarbles':
          breakPanel = renderGrammarbles();
          break;
        case 'vocab_quiz':
          breakPanel = renderQuiz();
          break;
        default:
          break;
      }
    }

    return (
      <>
        {breakPanel}
        {renderGuide(true, breakIndex, breaksCleared, failedBreaks)}
      </>
    );
  }

  function renderGuide(
    isCompact: boolean,
    activeBreakIdx = 0,
    breaksCleared = 0,
    failedBreaksList: number[] = []
  ) {
    const guideRows = [
      {
        breakNum: 1,
        label: 'Break 1',
        title: 'Daily Tasks',
        description: 'Finish Wordle, Grammarbles, and AI Story.',
        tone: 'logoBlue'
      },
      {
        breakNum: 2,
        label: 'Break 2',
        title: 'Daily Reflection',
        description: "Complete today's reflection.",
        tone: 'brownOrange'
      },
      {
        breakNum: 3,
        label: 'Break 3',
        title: 'Chess Puzzle',
        description: 'Solve a chess puzzle (your current highest level).',
        tone: 'darkOceanBlue'
      },
      {
        breakNum: 4,
        label: 'Break 4',
        title: 'Omok Moves',
        description:
          'Reply to pending omok moves and send a first move to a user active within 7 days.',
        tone: 'orange'
      },
      {
        breakNum: 5,
        label: 'Break 5',
        title: 'Grammarbles Full Run',
        description:
          'Clear all 5 Grammarbles levels today. Failing locks Word Master for the day.',
        tone: 'gold'
      },
      {
        breakNum: 6,
        label: 'Break 6+',
        title: 'Timed Vocab Quiz',
        description:
          'Quiz length grows from 1 to 5 questions (30s per question). Wrong answer locks Word Master for the day.',
        tone: 'rose'
      }
    ];

    return (
      <section
        className={css`
          padding: 1.8rem;
          border-radius: 1.2rem;
          border: 1px solid ${Color.borderGray()};
          background: ${Color.white()};
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          box-shadow: 0 10px 20px ${Color.black(0.04)};
        `}
      >
        {!isCompact && (
          <div>
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 0.6rem;
                font-size: 1.6rem;
                font-weight: 700;
                color: ${Color.darkerGray()};
              `}
            >
              <Icon
                icon="sparkles"
                style={{ color: Color.gold(), fontSize: '1.6rem' }}
              />
              No active break right now.
            </div>
            <div
              className={css`
                font-size: 1.2rem;
                color: ${Color.gray()};
                margin-top: 0.6rem;
                padding: 0.6rem 0.9rem;
                border-radius: 0.9rem;
                border: 1px solid ${Color.borderGray()};
                background: ${Color.whiteGray()};
              `}
            >
              {`Breaks trigger every ${breakInterval} strikes from already-collected word lookups.`}
            </div>
          </div>
        )}
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1rem;
          `}
        >
          {guideRows.map((row) => {
            const isActive =
              activeBreakIdx > 0 &&
              (row.breakNum === activeBreakIdx ||
                (row.breakNum === 6 && activeBreakIdx >= 6));
            const isCleared = row.breakNum <= breaksCleared && !isActive;
            const isFailed = failedBreaksList.includes(row.breakNum);
            const quizzesClearedCount =
              row.breakNum === 6 && breaksCleared >= 6
                ? activeBreakIdx >= 6
                  ? breaksCleared - 6
                  : breaksCleared - 5
                : 0;
            return (
              <GuideRow
                key={row.label}
                label={row.label}
                title={row.title}
                description={row.description}
                tone={row.tone}
                isActive={isActive}
                isCleared={isCleared}
                isFailed={isFailed}
                clearedCount={quizzesClearedCount}
              />
            );
          })}
        </div>
      </section>
    );
  }

  function renderLockedPanel() {
    const failureLabel = getFailureLabel();
    return (
      <section
        className={css`
          padding: 2rem;
          border-radius: 1.2rem;
          background: ${Color.rose(0.08)};
          border: 1px solid ${Color.rose(0.25)};
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: 0 10px 20px ${Color.black(0.04)};
        `}
      >
        <div
          className={css`
            font-size: 1.6rem;
            font-weight: 700;
            color: ${Color.rose()};
            display: flex;
            align-items: center;
            gap: 0.8rem;
          `}
        >
          <Icon icon="lock" />
          Word Master is locked for today.
        </div>
        <div
          className={css`
            font-size: 1.3rem;
            color: ${Color.darkerGray()};
          `}
        >
          You can wait until the next day or pay to clear this break.
        </div>
        {failureLabel ? (
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.6rem;
              padding: 0.8rem 1rem;
              border-radius: 0.9rem;
              background: ${Color.red(0.08)};
              border: 1px solid ${Color.red(0.2)};
              color: ${Color.red()};
              font-size: 1.25rem;
              font-weight: 700;
            `}
          >
            <Icon icon="times" />
            <span>{failureLabel}</span>
          </div>
        ) : null}
      </section>
    );
  }

  function renderDailyTasks() {
    const wordleDone = Boolean(requirement?.wordleDone);
    const grammarblesDone = Boolean(requirement?.grammarblesDone);
    const aiStoryDone = Boolean(requirement?.aiStoryDone);
    return renderRequirementSection({
      title: 'Daily Tasks',
      description: 'Finish Wordle, Grammarbles, and AI Story today.',
      rows: [
        {
          label: wordleDone ? 'Wordle completed' : 'Complete Wordle',
          done: wordleDone,
          onClick: onOpenWordle
        },
        {
          label: grammarblesDone
            ? 'Grammarbles completed'
            : 'Complete Grammarbles',
          done: grammarblesDone,
          onClick: onOpenGrammarGame
        },
        {
          label: aiStoryDone ? 'AI Story completed' : 'Complete AI Story',
          done: aiStoryDone,
          onClick: onOpenAIStories
        }
      ],
      tone: 'logoBlue'
    });
  }

  function renderDailyReflection() {
    const reflectionDone = Boolean(requirement?.reflectionDone);
    return renderRequirementSection({
      title: 'Daily Reflection',
      description: "Complete today's reflection.",
      rows: [
        {
          label: reflectionDone
            ? 'Daily reflection submitted'
            : "Answer today's reflection",
          done: reflectionDone,
          onClick: reflectionDone ? undefined : onOpenDailyQuestion
        }
      ],
      tone: 'brownOrange'
    });
  }

  function renderChessPuzzle() {
    const level = Number(requirement?.currentLevel || 1);
    const solved = Boolean(requirement?.solvedAtLevel);
    return renderRequirementSection({
      title: 'Chess Puzzle',
      description: `Solve a level ${level} puzzle (your current highest level).`,
      rows: [
        {
          label: solved
            ? `Level ${level} puzzle solved`
            : `Play level ${level} puzzle`,
          done: solved,
          onClick: solved ? undefined : onOpenChessPuzzle
        }
      ],
      tone: 'darkOceanBlue'
    });
  }

  function renderPendingMoves() {
    const omokPending = Boolean(requirement?.unansweredOmokMsgChannelId);
    const omokChannelId = Number(requirement?.unansweredOmokMsgChannelId || 0);
    const sentMove = Boolean(requirement?.hasRecentMoveToActiveUser);
    const recommendedUsers = Array.isArray(requirement?.recommendedUsers)
      ? requirement.recommendedUsers
      : [];
    const hasSuggestions = recommendedUsers.length > 0;
    return renderRequirementSection({
      title: 'Omok Moves',
      description:
        'Clear pending omok moves and send a first omok move to a user active within 7 days.',
      rows: [
        {
          label: omokPending
            ? 'Reply to pending omok moves'
            : 'Pending omok moves cleared',
          done: !omokPending,
          onClick:
            omokPending && onOpenPendingOmok && omokChannelId
              ? () => onOpenPendingOmok(omokChannelId)
              : undefined
        },
        {
          label: sentMove
            ? 'First omok move sent'
            : 'Send a first omok move to a recent player',
          done: sentMove,
          onClick: sentMove || hasSuggestions ? undefined : onOpenOmokStart
        }
      ],
      extra: (
        <SuggestedOmokPlayers
          hidden={sentMove}
          users={recommendedUsers}
          onSelectUser={onStartOmokWithUser}
          onBrowse={onOpenOmokStart}
        />
      ),
      tone: 'orange'
    });
  }

  function renderGrammarbles() {
    const passes = Number(requirement?.passes || 0);
    const done = passes >= 5;
    return renderRequirementSection({
      title: 'Grammarbles Full Run',
      description: 'Clear all 5 Grammarbles levels today.',
      rows: [
        {
          label: done
            ? `Levels cleared (${passes}/5)`
            : `Continue Grammarbles (${passes}/5)`,
          done,
          onClick: done ? undefined : onOpenGrammarGame
        }
      ],
      tone: 'gold'
    });
  }

  function getFailureLabel() {
    if (!lockReason) return '';
    if (lockReason === 'grammarbles')
      return 'You failed to complete the Grammarbles full run';
    if (lockReason === 'quiz') return 'You failed timed vocab quiz';
    return '';
  }

  function renderQuiz() {
    const justFailedQuiz =
      quizResult && !quizResult.isCorrect && quizResult.locked;

    return (
      <section
        className={css`
          padding: 1.8rem;
          border-radius: 1.2rem;
          border: 1px solid
            ${justFailedQuiz ? Color.rose(0.4) : Color.borderGray()};
          background: ${justFailedQuiz ? Color.rose(0.04) : Color.white()};
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          box-shadow: 0 10px 20px ${Color.black(0.04)};
        `}
      >
        {justFailedQuiz ? (
          <>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.8rem;
                padding: 1.2rem;
                border-radius: 1rem;
                background: ${Color.rose(0.1)};
                border: 1px solid ${Color.rose(0.3)};
              `}
            >
              <Icon
                icon="times-circle"
                style={{ fontSize: '3rem', color: Color.rose() }}
              />
              <div
                className={css`
                  font-size: 1.8rem;
                  font-weight: 800;
                  color: ${Color.rose()};
                `}
              >
                Quiz Failed
              </div>
              <div
                className={css`
                  font-size: 1.3rem;
                  color: ${Color.darkerGray()};
                  text-align: center;
                `}
              >
                Word Master is locked for today. You can wait until tomorrow or
                pay to bypass.
              </div>
            </div>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: 1.2rem;
              `}
            >
              <div
                className={css`
                  font-size: 1.2rem;
                  color: ${Color.gray()};
                  font-weight: 600;
                `}
              >
                {`Question ${quiz?.currentIndex ?? 1} of ${
                  quiz?.totalQuestions ?? quiz?.questionCount ?? 1
                }`}
              </div>
              <MultipleChoiceQuestion
                question={quizQuestion?.question || ''}
                choices={quizQuestion?.choices || []}
                isGraded={true}
                selectedChoiceIndex={selectedIndex}
                answerIndex={Number(quizResult?.answerIndex || 0)}
                onSelectChoice={() => {}}
                allowReselect={false}
              />
            </div>
          </>
        ) : (
          <>
            <div
              className={css`
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                align-items: center;
                justify-content: space-between;
              `}
            >
              <SectionHeader
                title="Timed Vocabulary Quiz"
                description={`Questions: ${quiz?.questionCount ?? 1} | Time: ${
                  quiz?.timeLimitSec ?? 0
                }s total`}
                tone="rose"
              />
            </div>

            {showQuizQuestion && typeof quizTimeRemaining === 'number' ? (
              <div
                className={css`
                  display: flex;
                  flex-wrap: wrap;
                  align-items: center;
                  justify-content: center;
                  gap: 1rem;
                  padding: 1rem 1.4rem;
                  border-radius: 1.2rem;
                  background: ${quizTimeRemaining <= 3
                    ? Color.rose(0.12)
                    : Color.logoBlue(0.12)};
                  border: 1px solid
                    ${quizTimeRemaining <= 3
                      ? Color.rose(0.4)
                      : Color.logoBlue(0.3)};
                  ${quizTimeRemaining <= 3
                    ? `animation: ${timerPulse} 0.8s ease-in-out infinite;`
                    : ''}
                `}
              >
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    font-size: 1.3rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: ${quizTimeRemaining <= 3
                      ? Color.rose()
                      : Color.logoBlue()};
                  `}
                >
                  <Icon icon="clock" />
                  Time left
                </div>
                <div
                  className={css`
                    font-size: 3rem;
                    font-weight: 800;
                    color: ${quizTimeRemaining <= 3
                      ? Color.rose()
                      : Color.black()};
                  `}
                >
                  {quizTimeRemaining}s
                </div>
              </div>
            ) : null}

            {!quizStarted || showReadyCountdown ? (
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  gap: 1rem;
                  font-size: 1.3rem;
                  color: ${Color.darkerGray()};
                `}
              >
                <div>
                  Answer every question before the timer runs out. A wrong
                  answer locks Word Master for today.
                </div>
                <div>
                  <div
                    className={css`
                      display: flex;
                      justify-content: center;
                      padding-top: 0.4rem;
                    `}
                  >
                    <GameCTAButton
                      variant="magenta"
                      icon="bolt"
                      shiny
                      size="xl"
                      disabled={quizLoading || loading || showReadyCountdown}
                      loading={quizLoading}
                      onClick={handleStartQuiz}
                      style={{ width: 'min(100%, 320px)' }}
                    >
                      {showReadyCountdown
                        ? `Ready? ${readyCountdown}`
                        : 'Start Quiz'}
                    </GameCTAButton>
                  </div>
                </div>
                {quizLoading ? (
                  <div
                    className={css`
                      display: flex;
                      flex-direction: column;
                      gap: 0.6rem;
                      padding: 0.8rem 0.9rem;
                      border-radius: 0.9rem;
                      border: 1px solid ${Color.borderGray()};
                      background: ${Color.whiteGray()};
                    `}
                  >
                    <div
                      className={css`
                        font-size: 1.2rem;
                        font-weight: 600;
                        color: ${Color.darkerGray()};
                      `}
                    >
                      {quizLoadStep || 'Preparing quiz...'}
                    </div>
                    <div
                      className={css`
                        width: 100%;
                        height: 0.5rem;
                        border-radius: 999px;
                        background: ${Color.borderGray()};
                        overflow: hidden;
                      `}
                    >
                      <div
                        className={css`
                          height: 100%;
                          border-radius: 999px;
                          background: linear-gradient(
                            90deg,
                            ${Color.logoBlue()} 0%,
                            ${Color.oceanBlue()} 100%
                          );
                          transition: width 0.3s ease;
                        `}
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, quizLoadProgress)
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  gap: 1.2rem;
                `}
              >
                <div
                  className={css`
                    font-size: 1.2rem;
                    color: ${Color.gray()};
                    font-weight: 600;
                  `}
                >
                  {`Question ${quiz?.currentIndex ?? 1} of ${
                    quiz?.totalQuestions ?? quiz?.questionCount ?? 1
                  }`}
                </div>
                <MultipleChoiceQuestion
                  question={quizQuestion?.question || ''}
                  choices={quizQuestion?.choices || []}
                  isGraded={Boolean(quizResult)}
                  selectedChoiceIndex={selectedIndex}
                  answerIndex={Number(quizResult?.answerIndex || 0)}
                  onSelectChoice={handleQuizSelect}
                  allowReselect={false}
                />
              </div>
            )}
          </>
        )}
      </section>
    );
  }

  function renderRequirementSection({
    title,
    description,
    rows,
    footer,
    extra,
    tone
  }: {
    title: string;
    description: string;
    rows: Array<{ label: string; done: boolean; onClick?: () => void }>;
    footer?: string;
    extra?: React.ReactNode;
    tone?: string;
  }) {
    return (
      <section
        className={css`
          padding: 1.8rem;
          border-radius: 1.2rem;
          border: 1px solid ${Color.borderGray()};
          background: ${Color.white()};
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          box-shadow: 0 10px 20px ${Color.black(0.04)};
        `}
      >
        <SectionHeader title={title} description={description} tone={tone} />
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
          `}
        >
          {rows.map((row) => (
            <RequirementRow
              key={row.label}
              label={row.label}
              done={row.done}
              onClick={row.onClick}
            />
          ))}
        </div>
        {extra ? extra : null}
        {footer ? (
          <div
            className={css`
              font-size: 1.2rem;
              color: ${Color.gray()};
              font-weight: 600;
            `}
          >
            {footer}
          </div>
        ) : null}
      </section>
    );
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
          // Don't show status message for wrong answers - the Quiz Failed banner handles it
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

function RequirementRow({
  label,
  done,
  onClick
}: {
  label: string;
  done: boolean;
  onClick?: () => void;
}) {
  const isClickable = Boolean(onClick) && !done;
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        gap: 0.8rem;
        font-size: 1.3rem;
        font-weight: 600;
        color: ${done ? Color.green() : Color.darkerGray()};
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.2rem;
        }
      `}
    >
      <Icon
        icon={done ? 'check' : 'times'}
        style={{ color: done ? Color.green() : Color.gray() }}
      />
      {isClickable ? (
        <span
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick?.();
            }
          }}
          className={css`
            color: ${Color.logoBlue()};
            cursor: pointer;
            text-decoration: underline;
            text-underline-offset: 2px;

            &:hover {
              color: ${Color.darkBlue()};
            }
          `}
        >
          {label}
        </span>
      ) : (
        <span>{label}</span>
      )}
    </div>
  );
}

function SuggestedOmokPlayers({
  hidden,
  users,
  onSelectUser,
  onBrowse
}: {
  hidden?: boolean;
  users: Array<{
    id: number;
    username: string;
    profilePicUrl?: string;
    lastActive?: number;
  }>;
  onSelectUser?: (user: {
    id: number;
    username: string;
    profilePicUrl?: string;
    lastActive?: number;
  }) => void;
  onBrowse?: () => void;
}) {
  if (hidden) return null;
  const hasUsers = users.length > 0;
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
        padding: 0.9rem 1rem;
        border-radius: 1rem;
        border: 1px solid ${Color.borderGray()};
        background: ${Color.whiteGray()};
      `}
    >
      <div
        className={css`
          font-size: 1.2rem;
          color: ${Color.gray()};
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        `}
      >
        Suggested players
      </div>
      {hasUsers ? (
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
          `}
        >
          {users.map((user) => (
            <SuggestedOmokPlayerRow
              key={user.id}
              user={user}
              onSelect={onSelectUser}
            />
          ))}
        </div>
      ) : (
        <div
          className={css`
            font-size: 1.2rem;
            color: ${Color.darkGray()};
          `}
        >
          No recent players right now.
        </div>
      )}
      {!hasUsers && onBrowse ? (
        <div>
          <Button variant="ghost" onClick={onBrowse}>
            Browse users
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function SuggestedOmokPlayerRow({
  user,
  onSelect
}: {
  user: {
    id: number;
    username: string;
    profilePicUrl?: string;
    lastActive?: number;
  };
  onSelect?: (user: {
    id: number;
    username: string;
    profilePicUrl?: string;
    lastActive?: number;
  }) => void;
}) {
  const lastActiveLabel =
    typeof user.lastActive === 'number'
      ? `Active ${timeSinceShort(user.lastActive)} ago`
      : 'Recently active';
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.7rem 0.9rem;
        border-radius: 0.9rem;
        background: ${Color.white()};
        border: 1px solid ${Color.borderGray()};
        @media (max-width: ${mobileMaxWidth}) {
          flex-direction: column;
          align-items: stretch;
        }
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.8rem;
        `}
      >
        <ProfilePic
          userId={user.id}
          profilePicUrl={user.profilePicUrl}
          size="3rem"
        />
        <div>
          <div
            className={css`
              font-size: 1.3rem;
              font-weight: 700;
              color: ${Color.darkerGray()};
            `}
          >
            {user.username}
          </div>
          <div
            className={css`
              font-size: 1.1rem;
              color: ${Color.gray()};
            `}
          >
            {lastActiveLabel}
          </div>
        </div>
      </div>
      <GameCTAButton
        variant="orange"
        size="sm"
        icon="comments"
        shiny
        disabled={!onSelect}
        onClick={() => onSelect?.(user)}
      >
        Send omok move
      </GameCTAButton>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  tone
}: {
  title: string;
  description?: React.ReactNode;
  tone?: string;
}) {
  const accentColor = getToneColor(tone);
  return (
    <div
      className={css`
        display: flex;
        align-items: flex-start;
        gap: 0.9rem;
      `}
    >
      <div
        className={css`
          width: 0.7rem;
          height: 2.6rem;
          border-radius: 999px;
          background: ${accentColor};
          margin-top: 0.2rem;
        `}
      />
      <div>
        <div
          className={css`
            font-size: 1.6rem;
            font-weight: 700;
            color: ${Color.darkerGray()};
          `}
        >
          {title}
        </div>
        {description ? (
          <div
            className={css`
              font-size: 1.2rem;
              color: ${Color.gray()};
              margin-top: 0.3rem;
            `}
          >
            {description}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GuideRow({
  label,
  title,
  description,
  tone,
  isActive,
  isCleared,
  isFailed,
  clearedCount
}: {
  label: string;
  title: string;
  description: string;
  tone?: string;
  isActive?: boolean;
  isCleared?: boolean;
  isFailed?: boolean;
  clearedCount?: number;
}) {
  const toneColor = getToneColor(tone);
  const toneSoft = getToneColor(tone, 0.12);
  const showFailed = Boolean(isFailed);
  const showCleared =
    !showFailed &&
    !isActive &&
    !!(isCleared || (clearedCount && clearedCount > 0));
  return (
    <div
      className={css`
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        padding: 0.6rem 0.8rem;
        margin: -0.6rem -0.8rem;
        border-radius: 0.8rem;
        background: ${showFailed
          ? Color.red(0.08)
          : isActive
          ? toneSoft
          : 'transparent'};
        border-left: ${showFailed
          ? `3px solid ${Color.red()}`
          : isActive
          ? `3px solid ${toneColor}`
          : '3px solid transparent'};
        opacity: ${isCleared && !clearedCount && !showFailed ? 0.6 : 1};
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.5rem;
        `}
      >
        <div
          className={css`
            padding: 0.3rem 0.8rem;
            border-radius: 999px;
            background: ${showFailed
              ? Color.red(0.15)
              : showCleared
              ? Color.green(0.15)
              : isActive
              ? toneColor
              : toneSoft};
            color: ${showFailed
              ? Color.red()
              : showCleared
              ? Color.green()
              : isActive
              ? Color.white()
              : toneColor};
            font-size: 1.1rem;
            font-weight: 700;
            white-space: nowrap;
          `}
        >
          {label}
        </div>
        {showFailed && (
          <span
            className={css`
              display: flex;
              align-items: center;
              gap: 0.2rem;
              color: ${Color.red()};
              font-size: 1.1rem;
              font-weight: 700;
            `}
          >
            <Icon icon="times" />
          </span>
        )}
        {showCleared && (
          <span
            className={css`
              display: flex;
              align-items: center;
              gap: 0.2rem;
              color: ${Color.green()};
              font-size: 1.1rem;
              font-weight: 700;
            `}
          >
            <Icon icon="check" />
            {!!clearedCount && clearedCount > 0
              ? `×${clearedCount}`
              : undefined}
          </span>
        )}
      </div>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        `}
      >
        <div
          className={css`
            font-size: 1.3rem;
            font-weight: 700;
            color: ${Color.darkerGray()};
          `}
        >
          {title}
        </div>
        <div
          className={css`
            font-size: 1.2rem;
            color: ${Color.gray()};
            line-height: 1.4;
          `}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

function formatCoins(amount: number) {
  if (!amount) return '0';
  return amount.toLocaleString('en-US');
}

function getBreakAccent(breakType?: string) {
  const tone = getBreakTone(breakType);
  return {
    main: getToneColor(tone),
    soft: getToneColor(tone, 0.12)
  };
}

function getBreakTone(breakType?: string) {
  switch (breakType) {
    case 'daily_tasks':
      return 'logoBlue';
    case 'daily_reflection':
      return 'brownOrange';
    case 'chess_puzzle':
      return 'darkOceanBlue';
    case 'pending_moves':
      return 'orange';
    case 'grammarbles':
      return 'gold';
    case 'vocab_quiz':
      return 'rose';
    default:
      return 'logoBlue';
  }
}

function getToneColor(tone?: string, opacity = 1) {
  if (tone && typeof Color[tone] === 'function') {
    return Color[tone](opacity);
  }
  return Color.logoBlue(opacity);
}
