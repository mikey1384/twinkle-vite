import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import Guide from './Guide';
import QuizSection from './QuizSection';
import RequirementSection, {
  SuggestedOmokPlayers
} from './RequirementSection';
import { SuggestedOmokUser } from './types';

export default function BreakSection({
  breakIndex,
  breakInterval,
  breakStatus,
  breakType,
  failedBreaks,
  hasActiveBreak,
  isLocked,
  loading,
  onOpenAIStories,
  onOpenChessPuzzle,
  onOpenDailyQuestion,
  onOpenGrammarGame,
  onOpenOmokStart,
  onOpenPendingOmok,
  onOpenWordle,
  onQuizSelect,
  onStartOmokWithUser,
  onStartQuiz,
  quiz,
  quizLoadProgress,
  quizLoadStep,
  quizLoading,
  quizQuestion,
  quizResult,
  quizStarted,
  quizTimeRemaining,
  readyCountdown,
  selectedIndex,
  showQuizQuestion,
  showReadyCountdown
}: {
  breakIndex: number;
  breakInterval: number;
  breakStatus: any;
  breakType?: string;
  failedBreaks: number[];
  hasActiveBreak: boolean;
  isLocked: boolean;
  loading?: boolean;
  onOpenAIStories?: () => void;
  onOpenChessPuzzle?: () => void;
  onOpenDailyQuestion?: () => void;
  onOpenGrammarGame?: () => void;
  onOpenOmokStart?: () => void;
  onOpenPendingOmok?: (channelId: number) => void;
  onOpenWordle?: () => void;
  onQuizSelect: (index: number) => void;
  onStartOmokWithUser?: (user: SuggestedOmokUser) => void;
  onStartQuiz: () => void;
  quiz: any;
  quizLoadProgress: number;
  quizLoadStep: string;
  quizLoading: boolean;
  quizQuestion: any;
  quizResult: any;
  quizStarted: boolean;
  quizTimeRemaining: number | null;
  readyCountdown: number;
  selectedIndex: number | null;
  showQuizQuestion: boolean;
  showReadyCountdown: boolean;
}) {
  const breaksCleared = Number(breakStatus?.clearedThrough || 0);
  const requirement = breakStatus?.requirement || {};
  const lockReason = breakStatus?.lockReason || null;

  if (!hasActiveBreak) {
    return (
      <Guide
        isCompact={false}
        breakInterval={breakInterval}
        breaksCleared={breaksCleared}
        failedBreaksList={failedBreaks}
      />
    );
  }

  const justFailedQuiz =
    quizResult && !quizResult.isCorrect && quizResult.locked;

  let breakPanel: React.ReactNode = null;
  if (isLocked && !justFailedQuiz) {
    breakPanel = <LockedPanel lockReason={lockReason} />;
  } else {
    switch (breakType) {
      case 'daily_tasks':
        breakPanel = (
          <RequirementSection
            title="Daily Tasks"
            description="Finish Wordle, Grammarbles, and AI Story today."
            rows={[
              {
                label: requirement?.wordleDone
                  ? 'Wordle completed'
                  : 'Complete Wordle',
                done: Boolean(requirement?.wordleDone),
                onClick: onOpenWordle
              },
              {
                label: requirement?.grammarblesDone
                  ? 'Grammarbles completed'
                  : 'Complete Grammarbles',
                done: Boolean(requirement?.grammarblesDone),
                onClick: onOpenGrammarGame
              },
              {
                label: requirement?.aiStoryDone
                  ? 'AI Story completed'
                  : 'Complete AI Story',
                done: Boolean(requirement?.aiStoryDone),
                onClick: onOpenAIStories
              }
            ]}
            tone="logoBlue"
          />
        );
        break;
      case 'daily_reflection':
        breakPanel = (
          <RequirementSection
            title="Daily Reflection"
            description="Complete today's reflection."
            rows={[
              {
                label: requirement?.reflectionDone
                  ? 'Daily reflection submitted'
                  : "Answer today's reflection",
                done: Boolean(requirement?.reflectionDone),
                onClick: requirement?.reflectionDone
                  ? undefined
                  : onOpenDailyQuestion
              }
            ]}
            tone="brownOrange"
          />
        );
        break;
      case 'chess_puzzle': {
        const level = Number(requirement?.currentLevel || 1);
        const solved = Boolean(requirement?.solvedAtLevel);
        breakPanel = (
          <RequirementSection
            title="Chess Puzzle"
            description={`Solve a level ${level} puzzle (your current highest level).`}
            rows={[
              {
                label: solved
                  ? `Level ${level} puzzle solved`
                  : `Play level ${level} puzzle`,
                done: solved,
                onClick: solved ? undefined : onOpenChessPuzzle
              }
            ]}
            tone="darkOceanBlue"
          />
        );
        break;
      }
      case 'pending_moves': {
        const omokPending = Boolean(requirement?.unansweredOmokMsgChannelId);
        const omokChannelId = Number(
          requirement?.unansweredOmokMsgChannelId || 0
        );
        const sentMove = Boolean(requirement?.hasRecentMoveToActiveUser);
        const recommendedUsers = Array.isArray(requirement?.recommendedUsers)
          ? (requirement.recommendedUsers as SuggestedOmokUser[])
          : [];
        const hasSuggestions = recommendedUsers.length > 0;
        const hasRecentPlayers =
          typeof requirement?.hasRecentPlayers === 'boolean'
            ? requirement.hasRecentPlayers
            : hasSuggestions;
        const firstMoveComplete =
          typeof requirement?.firstMoveRequirementComplete === 'boolean'
            ? requirement.firstMoveRequirementComplete
            : sentMove || !hasRecentPlayers;
        const firstMoveLabel = sentMove
          ? 'First omok move sent'
          : hasRecentPlayers
            ? 'Send a first omok move to a recent player'
            : 'No recent players available';
        const description = hasRecentPlayers
          ? 'Clear pending omok moves and send a first omok move to a user active within 7 days.'
          : 'Clear pending omok moves. No recent players are available for a first move today.';
        breakPanel = (
          <RequirementSection
            title="Omok Moves"
            description={description}
            rows={[
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
                label: firstMoveLabel,
                done: firstMoveComplete,
                onClick:
                  firstMoveComplete || hasSuggestions
                    ? undefined
                    : onOpenOmokStart
              }
            ]}
            extra={
              <SuggestedOmokPlayers
                hidden={firstMoveComplete}
                users={recommendedUsers}
                onSelectUser={onStartOmokWithUser}
                onBrowse={onOpenOmokStart}
              />
            }
            tone="orange"
          />
        );
        break;
      }
      case 'grammarbles': {
        const passes = Number(requirement?.passes || 0);
        const done = passes >= 5;
        breakPanel = (
          <RequirementSection
            title="Grammarbles Full Run"
            description="Clear all 5 Grammarbles levels today."
            rows={[
              {
                label: done
                  ? `Levels cleared (${passes}/5)`
                  : `Continue Grammarbles (${passes}/5)`,
                done,
                onClick: done ? undefined : onOpenGrammarGame
              }
            ]}
            tone="gold"
          />
        );
        break;
      }
      case 'vocab_quiz':
        breakPanel = (
          <QuizSection
            loading={loading}
            onSelectChoice={onQuizSelect}
            onStartQuiz={onStartQuiz}
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
        );
        break;
      default:
        break;
    }
  }

  return (
    <>
      {breakPanel}
      <Guide
        isCompact
        breakInterval={breakInterval}
        activeBreakIdx={breakIndex}
        breaksCleared={breaksCleared}
        failedBreaksList={failedBreaks}
      />
    </>
  );
}

function LockedPanel({ lockReason }: { lockReason: string | null }) {
  const failureLabel = getFailureLabel(lockReason);
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

function getFailureLabel(lockReason: string | null) {
  if (!lockReason) return '';
  if (lockReason === 'grammarbles') {
    return 'You failed to complete the Grammarbles full run';
  }
  if (lockReason === 'quiz') {
    return 'You failed timed vocab quiz';
  }
  return '';
}
