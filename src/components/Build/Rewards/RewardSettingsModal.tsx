import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { rewardApprovalPresentation } from './approvalPresentation';
import useRewardStatus from './useRewardStatus';
import type { RewardSettings } from './types';

// The creator's whole job here is to understand that an admin must approve
// the app and to press Send (or Cancel). No Lumine run, no setup, no forms.
// The modal reads like the rest of the Build editor: a status band, cards
// for what the app asks to pay, and a stepper for what happens next.
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
  const declaration = settings?.declaration || null;
  const canSend =
    presentation?.state === 'needs_review' &&
    !agentEditing &&
    !loading &&
    (declaration ? declaration.ok : true);
  const tone = presentation ? toneFor(presentation.state) : 'neutral';

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
        {!settings && !loadError && <CheckingSkeleton />}
        {settings && presentation && (
          <>
            <section
              className={bandClass}
              data-tone={tone}
              aria-live="polite"
            >
              <span className={bandIconClass} aria-hidden="true">
                <Icon icon={iconFor(presentation.state)} />
              </span>
              <div className={bandTextClass}>
                <span className={pillClass} data-tone={tone}>
                  {pillFor(presentation.state)}
                </span>
                <h3>{presentation.title}</h3>
                <p>{presentation.detail}</p>
                {agentEditing && presentation.state === 'needs_review' && (
                  <p>
                    Lumine is still editing your app. Wait until it finishes,
                    then send this version for review.
                  </p>
                )}
              </div>
            </section>

            {settings.reviewNote && (
              <section className={cardClass} data-accent="note">
                <h4>Admin’s note</h4>
                <p>{settings.reviewNote}</p>
              </section>
            )}

            {declaration && presentation.state === 'needs_review' && (
              <section className={cardClass}>
                <h4>What this version asks to pay</h4>
                {declaration.ok ? (
                  <>
                    <ul className={rewardListClass}>
                      {declaration.rules.map((rule) => (
                        <li key={rule.id}>
                          <span className={rewardAmountClass}>
                            {rule.xp.toLocaleString()} XP
                            {rule.coins > 0
                              ? ` + ${rule.coins.toLocaleString()} Coins`
                              : ''}
                          </span>
                          <span className={rewardTitleClass}>
                            <strong>{rule.title}</strong>
                            <small>
                              {rule.verifier === 'completion'
                                ? 'for finishing it'
                                : 'for a correct answer'}
                            </small>
                          </span>
                        </li>
                      ))}
                    </ul>
                    {declaration.budgets && (
                      <p className={mutedClass}>
                        Up to{' '}
                        <strong>
                          {declaration.budgets.userDailyXP.toLocaleString()} XP
                        </strong>
                        {declaration.budgets.userDailyCoins > 0 ? (
                          <>
                            {' '}
                            and{' '}
                            <strong>
                              {declaration.budgets.userDailyCoins.toLocaleString()}{' '}
                              Coins
                            </strong>
                          </>
                        ) : null}{' '}
                        per person per day. The admin can change any of this
                        while approving.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p role="alert">
                      Lumine still has to finish the reward setup before this
                      version can be sent:
                    </p>
                    <ul className={problemListClass}>
                      {declaration.errors.map((problem, index) => (
                        <li key={index}>{problem}</li>
                      ))}
                    </ul>
                    <p className={mutedClass}>
                      Ask Lumine to fix it, then come back here.
                    </p>
                  </>
                )}
              </section>
            )}

            {presentation.state === 'needs_review' && (
              <section className={cardClass}>
                <h4>What happens next</h4>
                <ol className={stepperClass}>
                  <li>
                    <strong>You send it.</strong> Your current code is saved
                    and sent to the admin.
                  </li>
                  <li>
                    <strong>The admin reads it.</strong> They check what it
                    asks to pay and decide what people can actually earn, and
                    how often.
                  </li>
                  <li>
                    <strong>You get the answer here.</strong> If it’s
                    approved, you can publish.
                  </li>
                </ol>
              </section>
            )}

            {settings.summary.length > 0 && (
              <section className={cardClass}>
                <h4>What people can earn</h4>
                <ul className={rewardListClass}>
                  {settings.summary.map((reward, index) => (
                    <li key={index}>
                      <span className={rewardAmountClass}>
                        {reward.xp.toLocaleString()} XP
                        {reward.coins > 0
                          ? ` + ${reward.coins.toLocaleString()} Coins`
                          : ''}
                      </span>
                      <span className={rewardTitleClass}>
                        <strong>{reward.title}</strong>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(settings.liveActive && presentation.state !== 'published') ||
            settings.approvalRequired ? (
              <p className={mutedClass}>
                {settings.liveActive && presentation.state !== 'published'
                  ? presentation.state === 'removed'
                    ? 'Your current published app still has rewards. Publishing this update will turn them off. '
                    : 'Your current published app is still available with its approved rewards. '
                  : ''}
                {settings.approvalRequired
                  ? 'Real rewards work only in an approved published app. Updates that keep rewards need a new approval.'
                  : ''}
              </p>
            ) : null}
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

// While the status loads the modal keeps its shape: a band and two cards.
function CheckingSkeleton() {
  return (
    <div role="status" aria-label="Checking approval" className={skeletonClass}>
      <div className={bandClass} data-tone="neutral">
        <span className={`${bandIconClass} ${shimmerClass}`} />
        <div className={bandTextClass}>
          <span className={`${pillClass} ${shimmerClass}`} style={{ width: '9rem' }}>
            &nbsp;
          </span>
          <span className={shimmerClass} style={{ height: '1.9rem', width: '60%' }} />
          <span className={shimmerClass} style={{ height: '1.2rem', width: '90%' }} />
          <span className={shimmerClass} style={{ height: '1.2rem', width: '70%' }} />
        </div>
      </div>
      {[0, 1].map((index) => (
        <div key={index} className={cardClass}>
          <span className={shimmerClass} style={{ height: '1.4rem', width: '35%' }} />
          <span className={shimmerClass} style={{ height: '1.1rem', width: '95%' }} />
          <span className={shimmerClass} style={{ height: '1.1rem', width: '80%' }} />
        </div>
      ))}
      <p className={mutedClass}>Checking approval…</p>
    </div>
  );
}

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

function toneFor(state: string): Tone {
  if (state === 'approved' || state === 'published') return 'success';
  if (state === 'in_review') return 'info';
  if (state === 'changes_requested' || state === 'paused') return 'danger';
  if (state === 'needs_review' || state === 'check_changes') return 'warning';
  return 'neutral';
}

function pillFor(state: string) {
  return (
    {
      removed: 'No approval needed',
      check_changes: 'Will be checked',
      needs_review: 'Approval needed',
      in_review: 'Waiting for the admin',
      approved: 'Approved',
      published: 'Live',
      changes_requested: 'Changes requested',
      paused: 'Paused'
    } as Record<string, string>
  )[state] || 'Status';
}

function iconFor(state: string) {
  return (
    {
      removed: 'check-circle',
      check_changes: 'magnifying-glass',
      needs_review: 'paper-plane',
      in_review: 'clock',
      approved: 'check-circle',
      published: 'coins',
      changes_requested: 'comment',
      paused: 'pause'
    } as Record<string, any>
  )[state] || 'coins';
}

const bodyClass = css`
  display: grid;
  gap: 1.2rem;
  color: #172033;
  font-size: 1.4rem;
  line-height: 1.5;
  p,
  h3,
  h4 {
    margin: 0;
  }
  [role='alert'] {
    color: #b42318;
    font-weight: 700;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.3rem;
  }
`;

const bandClass = css`
  display: flex;
  gap: 1.1rem;
  align-items: flex-start;
  padding: 1.3rem 1.4rem;
  border-radius: 14px;
  border: 1px solid var(--band-border, #d8e0ea);
  background: var(--band-bg, #f8fafc);
  &[data-tone='info'] {
    --band-bg: #eff6ff;
    --band-border: #bfdbfe;
    --band-accent: #2563eb;
  }
  &[data-tone='success'] {
    --band-bg: #f0fdf4;
    --band-border: #bbf7d0;
    --band-accent: #16a34a;
  }
  &[data-tone='warning'] {
    --band-bg: #fffbeb;
    --band-border: #fde68a;
    --band-accent: #d97706;
  }
  &[data-tone='danger'] {
    --band-bg: #fef2f2;
    --band-border: #fecaca;
    --band-accent: #dc2626;
  }
  &[data-tone='neutral'] {
    --band-accent: #64748b;
  }
  h3 {
    font-size: 1.7rem;
    line-height: 1.25;
    font-weight: 900;
    color: #111827;
  }
  p {
    color: #475569;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.1rem;
    gap: 0.9rem;
    h3 {
      font-size: 1.5rem;
    }
  }
`;

const bandIconClass = css`
  flex: none;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: var(--band-accent, #64748b);
  border: 1px solid var(--band-border, #d8e0ea);
  font-size: 1.5rem;
`;

const bandTextClass = css`
  display: grid;
  gap: 0.45rem;
  min-width: 0;
`;

const pillClass = css`
  display: inline-flex;
  align-items: center;
  align-self: start;
  justify-self: start;
  width: max-content;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--band-accent, #64748b);
  background: #ffffff;
  border: 1px solid var(--band-border, #d8e0ea);
`;

const cardClass = css`
  display: grid;
  gap: 0.8rem;
  padding: 1.2rem 1.4rem;
  border-radius: 14px;
  border: 1px solid #d8e0ea;
  background: #ffffff;
  h4 {
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #64748b;
  }
  &[data-accent='note'] {
    border-left: 4px solid #2563eb;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1rem 1.1rem;
  }
`;

const rewardListClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
  li {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 0.7rem 0.9rem;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #e9edf2;
  }
`;

const rewardAmountClass = css`
  flex: none;
  min-width: 9rem;
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  background: #fff7ed;
  color: #c2410c;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  text-align: center;
  font-size: 1.25rem;
  @media (max-width: ${mobileMaxWidth}) {
    min-width: 7rem;
    font-size: 1.15rem;
  }
`;

const rewardTitleClass = css`
  display: grid;
  min-width: 0;
  strong {
    color: #111827;
    overflow-wrap: anywhere;
  }
  small {
    color: #64748b;
    font-size: 1.1rem;
  }
`;

const stepperClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0;
  counter-reset: step;
  li {
    position: relative;
    padding: 0 0 1.1rem 3.2rem;
    counter-increment: step;
    color: #475569;
    strong {
      color: #111827;
    }
    &::before {
      content: counter(step);
      position: absolute;
      left: 0;
      top: 0;
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #e9f2ff;
      color: #2563eb;
      font-weight: 900;
      font-size: 1.15rem;
    }
    &:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 1.05rem;
      top: 2.3rem;
      bottom: 0.2rem;
      width: 2px;
      background: #dbe4ee;
    }
    &:last-child {
      padding-bottom: 0;
    }
  }
`;

const problemListClass = css`
  margin: 0;
  padding-left: 1.6rem;
  display: grid;
  gap: 0.4rem;
  color: #7f1d1d;
`;

const mutedClass = css`
  color: #64748b;
  font-size: 1.25rem;
  strong {
    color: #172033;
  }
`;

const skeletonClass = css`
  display: grid;
  gap: 1.2rem;
`;

const shimmerClass = css`
  display: block;
  border-radius: 6px;
  background: linear-gradient(90deg, #e9edf2 25%, #f5f7fa 50%, #e9edf2 75%);
  background-size: 200% 100%;
  animation: reward-shimmer 1.4s ease-in-out infinite;
  @keyframes reward-shimmer {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }
`;

export type { RewardSettings };
