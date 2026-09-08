import React, { useState } from 'react';
import Modal from '~/components/Modal';
import { useAppContext } from '~/contexts';
import { rewardPanelClass } from './RewardConfigView';
import { rewardApprovalPresentation } from './approvalPresentation';
import useRewardStatus from './useRewardStatus';

export default function RewardSettingsModal({
  buildId,
  onClose,
  onSaveCode,
  onPublish,
  onAskLumine,
  onStatusChange,
  hasUnsavedChanges = false,
  changeKey = '',
  preparing = false
}: {
  buildId: number;
  onClose: () => void;
  onSaveCode: () => Promise<boolean>;
  onPublish: () => void;
  onAskLumine: (reviewNote: string) => void;
  onStatusChange?: () => void;
  hasUnsavedChanges?: boolean;
  changeKey?: string;
  preparing?: boolean;
}) {
  const requestReview = useAppContext(
    (v) => v.requestHelpers.requestBuildRewardReview
  );
  const {
    settings,
    error: loadError,
    refresh
  } = useRewardStatus(buildId, true, changeKey);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const presentation = settings
    ? rewardApprovalPresentation(settings, hasUnsavedChanges || preparing)
    : null;
  return (
    <Modal
      modalKey="BuildRewardSettings"
      isOpen
      onClose={onClose}
      title="XP & Coin rewards"
    >
      <div
        className={rewardPanelClass}
        style={{ padding: '1.2rem', maxHeight: '75vh', overflowY: 'auto' }}
      >
        {(error || loadError) && <p role="alert">{error || loadError}</p>}
        {!settings && !loadError && <p role="status">Checking approval…</p>}
        {settings && presentation && (
          <>
            <article aria-live="polite">
              <h3>
                {preparing
                  ? 'Lumine is working on your update'
                  : presentation.title}
              </h3>
              <p>
                {preparing
                  ? 'Wait for Lumine to finish before sending this version for review.'
                  : presentation.detail}
              </p>
              {settings.reviewNote && (
                <p style={{ marginTop: '0.8rem' }}>
                  <strong>Admin’s note:</strong> {settings.reviewNote}
                </p>
              )}
            </article>
            {settings.summary.length > 0 && (
              <div>
                <h3>What people can earn</h3>
                {settings.summary.map((reward, index) => (
                  <p key={index}>
                    <strong>{reward.title}</strong> · {reward.xp} XP +{' '}
                    {reward.coins} Coins
                  </p>
                ))}
              </div>
            )}
            {settings.approvalRequired &&
              settings.configured &&
              settings.summary.length === 0 && (
                <p>This update turns rewards off.</p>
              )}
            {settings.liveActive && presentation.state !== 'published' && (
              <p>
                {presentation.state === 'removed'
                  ? 'Your current published app still has rewards. Publishing this update will turn them off.'
                  : 'Your current published app is still available with its approved rewards.'}
              </p>
            )}
            {settings.approvalRequired && (
              <p>
                Real rewards work only in an approved published app. Updates
                that keep rewards need a new approval.
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
              {presentation.state === 'needs_review' && (
                <button
                  data-primary
                  disabled={busy || preparing}
                  onClick={handleSubmit}
                >
                  {busy ? 'Sending…' : 'Send for review'}
                </button>
              )}
              {(presentation.state === 'approved' ||
                (['removed', 'check_changes'].includes(presentation.state) &&
                  (settings.canPublish || hasUnsavedChanges))) && (
                <button
                  data-primary
                  disabled={busy || preparing}
                  onClick={onPublish}
                >
                  Publish app
                </button>
              )}
              {['not_configured', 'changes_requested', 'paused'].includes(
                presentation.state
              ) && (
                <button
                  data-primary
                  disabled={busy || preparing}
                  onClick={() => onAskLumine(settings.reviewNote)}
                >
                  Ask Lumine to help
                </button>
              )}
              <button disabled={busy} onClick={refresh}>
                Refresh status
              </button>
            </div>
          </>
        )}
        {loadError && <button onClick={refresh}>Try again</button>}
      </div>
    </Modal>
  );

  async function handleSubmit() {
    setBusy(true);
    setError('');
    try {
      if (!(await onSaveCode())) {
        setError(
          'Your changes couldn’t be saved. Please try again before sending them for review.'
        );
        return;
      }
      await requestReview(buildId);
      refresh();
      onStatusChange?.();
    } catch (err: any) {
      setError(
        err?.message ||
          'Couldn’t send this version for review. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }
}
