import React, { useState } from 'react';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import { paperPrimaryButtonCls } from './paperTheme';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import { useAppContext, useNotiContext, useViewContext } from '~/contexts';
import DailyQuestionPanel from './DailyQuestionPanel';

export default function DailyQuestionModal({ onHide }: { onHide: () => void }) {
  return (
    <ErrorBoundary componentPath="DailyQuestion/Modal">
      <Modal
        xpActivity
        modalKey="DailyQuestionModal"
        isOpen={true}
        allowOverflow
        onClose={onHide}
        title={`Today's Question`}
        size="lg"
        closeOnBackdropClick={false}
        modalLevel={0}
      >
        <DailyQuestionContent onHide={onHide} />
      </Modal>
    </ErrorBoundary>
  );
}

// The reflection itself, shared by the modal and the full-screen Daily
// Reflection page (Mikey 2026-10-12): the panel, or the AI-unavailable notice
// with its streak-preserving button.
export function DailyQuestionContent({
  onHide,
  mode = 'classic',
  trainingAxis = null
}: {
  onHide: () => void;
  mode?: 'classic' | 'training';
  trainingAxis?: string | null;
}) {
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const clearUnavailableDailyQuestion = useAppContext(
    (v) => v.requestHelpers.clearUnavailableDailyQuestion
  );
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const onApplyTodayStatsProgress = useNotiContext(
    (v) => v.actions.onApplyTodayStatsProgress
  );
  const [preservingStreak, setPreservingStreak] = useState(false);
  const [unavailableActionMessage, setUnavailableActionMessage] = useState('');
  const dailyQuestionCompleted = !!todayStats?.dailyQuestionCompleted;

  return (
    <>
      {AI_FEATURES_DISABLED ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <AIDisabledNotice title="Today's Question Unavailable" />
          <div
            style={{
              maxWidth: '48rem',
              textAlign: 'center',
              lineHeight: 1.5
            }}
          >
            {dailyQuestionCompleted
              ? "Today's Question is already complete for today."
              : unavailableActionMessage ||
                "Press the button below to preserve today's Question streak while AI is unavailable."}
          </div>
          <button
            type="button"
            className={paperPrimaryButtonCls}
            disabled={dailyQuestionCompleted || preservingStreak}
            onClick={handleUnavailableDailyQuestionClear}
          >
            {preservingStreak ? 'Preserving...' : 'Preserve my streak'}
          </button>
        </div>
      ) : (
        <DailyQuestionPanel
          onClose={onHide}
          mode={mode}
          trainingAxis={trainingAxis}
        />
      )}
    </>
  );

  async function handleUnavailableDailyQuestionClear() {
    if (preservingStreak || dailyQuestionCompleted) return;
    setPreservingStreak(true);
    try {
      const result = await clearUnavailableDailyQuestion();
      if (result?.success) {
        onApplyTodayStatsProgress({
          newStats: { dailyQuestionCompleted: true }
        });
        setUnavailableActionMessage(
          "Today's Question was marked complete to preserve your streak."
        );
      } else {
        setUnavailableActionMessage(
          "Could not preserve today's Question streak right now."
        );
      }
    } catch (error) {
      console.error(error);
      setUnavailableActionMessage(
        "Could not preserve today's Question streak right now."
      );
    } finally {
      setPreservingStreak(false);
    }
  }
}
