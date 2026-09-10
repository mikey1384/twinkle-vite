import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { rewardApprovalPresentation } from './approvalPresentation';
import useRewardStatus from './useRewardStatus';

// The creator's whole job here is to understand that an admin must approve
// the app and to press Send (or Cancel). No Lumine run, no setup, no forms.
export default function RewardSettingsModal({
  buildId,
  onClose,
  onSaveCode,
  onPublish,
  onStatusChange,
  hasUnsavedChanges = false,
  changeKey = '',
  agentEditing = false
}: {
  buildId: number;
  onClose: () => void;
  onSaveCode: () => Promise<boolean>;
  onPublish: () => void;
  onStatusChange?: () => void;
  hasUnsavedChanges?: boolean;
  changeKey?: string;
  agentEditing?: boolean;
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
    ? rewardApprovalPresentation(settings, hasUnsavedChanges || agentEditing)
    : null;
  const canSend =
    presentation?.state === 'needs_review' && !agentEditing && !loading;
  return (
    <Modal
      modalKey="BuildRewardSettings"
      isOpen
      onClose={onClose}
      title="XP & Coin rewards"
      footer={
        settings && presentation ? (
          <>
            <Button variant="ghost" disabled={busy} onClick={onClose}>
              {presentation.state === 'needs_review' ? 'Cancel' : 'Close'}
            </Button>
            <Button variant="ghost" disabled={busy || loading} onClick={refresh}>
              Refresh status
            </Button>
            {presentation.state === 'needs_review' && (
              <Button
                color="logoBlue"
                loading={busy}
                disabled={!canSend}
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
                disabled={busy || agentEditing}
                onClick={onPublish}
              >
                Publish app
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
              <h3>{presentation.title}</h3>
              <p>{presentation.detail}</p>
              {agentEditing && presentation.state === 'needs_review' && (
                <p style={{ marginTop: '0.8rem' }}>
                  Lumine is still editing your app. Wait until it finishes,
                  then send this version for review.
                </p>
              )}
              {settings.reviewNote && (
                <p style={{ marginTop: '0.8rem' }}>
                  <strong>Admin’s note:</strong> {settings.reviewNote}
                </p>
              )}
            </section>
            {presentation.state === 'needs_review' && (
              <div>
                <h3>What happens next</h3>
                <ol className={stepsClass}>
                  <li>Your current code is saved and sent to the admin.</li>
                  <li>
                    The admin reads it and decides how much XP and how many
                    Coins people can earn, and how often.
                  </li>
                  <li>
                    You get the answer right here. If it’s approved, you can
                    publish.
                  </li>
                </ol>
              </div>
            )}
            {settings.summary.length > 0 && (
              <div>
                <h3>What people can earn</h3>
                {settings.summary.map((reward, index) => (
                  <p key={index}>
                    <strong>{reward.title}</strong> ·{' '}
                    {reward.xp.toLocaleString()} XP +{' '}
                    {reward.coins.toLocaleString()} Coins
                  </p>
                ))}
              </div>
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
const stepsClass = css`
  margin: 0;
  padding-left: 2rem;
  display: grid;
  gap: 0.4rem;
`;
