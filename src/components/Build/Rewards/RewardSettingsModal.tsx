import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
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
    loading,
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
      footer={
        settings && presentation ? (
          <>
            <Button variant="ghost" disabled={busy || loading} onClick={refresh}>
              Refresh status
            </Button>
            {presentation.state === 'needs_review' && (
              <Button
                color="logoBlue"
                loading={busy}
                disabled={preparing}
                onClick={handleSubmit}
              >
                {busy ? 'Sending…' : 'Send for review'}
              </Button>
            )}
            {(presentation.state === 'approved' ||
              (['removed', 'check_changes'].includes(presentation.state) &&
                (settings.canPublish || hasUnsavedChanges))) && (
              <Button
                color="logoBlue"
                disabled={busy || preparing}
                onClick={onPublish}
              >
                Publish app
              </Button>
            )}
            {['not_configured', 'changes_requested', 'paused'].includes(
              presentation.state
            ) && (
              <Button
                color="logoBlue"
                disabled={busy || preparing}
                onClick={() => onAskLumine(settings.reviewNote)}
              >
                Ask Lumine to help
              </Button>
            )}
          </>
        ) : loadError ? (
          <Button variant="outline" onClick={refresh}>
            Try again
          </Button>
        ) : undefined
      }
    >
      <div className={bodyClass}>
        {(error || loadError) && <p role="alert">{error || loadError}</p>}
        {!settings && !loadError && <p role="status">Checking approval…</p>}
        {settings && presentation && (
          <>
            <section aria-live="polite">
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
            </section>
            {settings.summary.length > 0 && (
              <div>
                <h3>What people can earn</h3>
                {settings.summary.map((reward, index) => (
                  <p key={index}>
                    <strong>{reward.title}</strong> · {reward.xp.toLocaleString()} XP +{' '}
                    {reward.coins.toLocaleString()} Coins
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
          </>
        )}
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

const bodyClass = css`
  display: grid;
  gap: 1.5rem;
  color: var(--chat-text);
  font-size: 1.4rem;
  line-height: 1.5;
  p,
  h3 {
    margin: 0;
  }
  h3 {
    font-size: 1.5rem;
    margin-bottom: 0.6rem;
  }
  [role='alert'] {
    color: var(--danger-color, #a1233c);
  }
`;
