import React, { useState } from 'react';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import { AI_FEATURES_DISABLED } from '~/constants/ai';
import { useAppContext, useNotiContext } from '~/contexts';
import DailyQuestionPanel from './DailyQuestionPanel';

export default function DailyQuestionModal({ onHide }: { onHide: () => void }) {
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
    <ErrorBoundary componentPath="Home/DailyQuestionModal">
      <Modal
        modalKey="DailyQuestionModal"
        isOpen={true}
        allowOverflow
        onClose={onHide}
        title={`Today's Question`}
        size="lg"
        closeOnBackdropClick={false}
        modalLevel={0}
      >
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
            <Button
              color="purple"
              loading={preservingStreak}
              disabled={dailyQuestionCompleted}
              onClick={handleUnavailableDailyQuestionClear}
            >
              Preserve Question Streak
            </Button>
          </div>
        ) : (
          <DailyQuestionPanel onClose={onHide} />
        )}
      </Modal>
    </ErrorBoundary>
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
