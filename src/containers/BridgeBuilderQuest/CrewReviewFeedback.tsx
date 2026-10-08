import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import type { FeedbackStep, StepReview } from './types';

// Shared with every crew member. Identity-check questions and answers belong
// in MemberInfoCheck, never here. Compact mode is the crew chat's status card.
export default function CrewReviewFeedback({
  step, review, onRequestReview, onManageCrew, busy = false, error = '', compact = false
}: {
  step: FeedbackStep;
  review: StepReview;
  onRequestReview?: () => void;
  onManageCrew?: () => void;
  busy?: boolean;
  error?: string;
  compact?: boolean;
}) {
  const needsChanges = review.status === 'changes_requested';
  const requirementsMissing = review.status === 'not_ready';
  if (!needsChanges && !(review.note && (review.status === 'pending' || requirementsMissing))) return null;
  const color = needsChanges ? Color.orange : Color.logoBlue;
  return (
    <section
      aria-label="Crew approval status"
      className={css`
        width: 100%;
        margin-top: 1.4rem;
        padding: ${compact ? '1.1rem' : '1.6rem'};
        border: 1px solid ${color(0.4)};
        border-left: 0.4rem solid ${color()};
        border-radius: 0.9rem;
        background: ${color(0.06)};
        font-size: ${compact ? '1.3rem' : '1.4rem'};
        line-height: 1.6;
        overflow-wrap: anywhere;
      `}
    >
      <div role="status" style={{ fontWeight: 700, fontSize: compact ? '1.4rem' : '1.6rem' }}>
        <Icon icon={needsChanges ? 'comment' : 'clock'} style={{ marginRight: '0.7rem', color: color() }} />
        {needsChanges ? 'Changes requested' : requirementsMissing ? 'Finish this step' : 'Waiting for staff'}
        {!compact && ` · ${step === 'crew' ? 'Your crew' : 'Parents and the adult'}`}
      </div>
      <div style={{ color: Color.darkerGray(), marginTop: '0.4rem', fontSize: '1.2rem' }}>
        {needsChanges || requirementsMissing ? 'Staff note · visible to everyone in your crew' : 'Previous staff note'}
      </div>
      <p style={{ whiteSpace: 'pre-wrap', margin: '0.5rem 0 1rem' }}>{review.note}</p>
      {needsChanges ? (
        <p style={{ margin: 0 }}>
          Make these changes, then request review again. Staff will check before your crew moves on.
        </p>
      ) : requirementsMissing ? (
        <p style={{ margin: 0 }}>Finish the requirements below so staff can review your changes.</p>
      ) : (
        <p style={{ margin: 0 }}>Your crew has requested another review. You can check the result here.</p>
      )}
      {needsChanges && onRequestReview && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '1.2rem' }}>
            {onManageCrew && (
              <Button color="logoBlue" variant="soft" disabled={busy} onClick={onManageCrew}>Manage crew</Button>
            )}
            <Button color="logoBlue" loading={busy} disabled={busy || !review.canRequestReview} onClick={onRequestReview}>
              Request review again
            </Button>
          </div>
          {!review.canRequestReview && (
            <p style={{ margin: '0.8rem 0 0', fontSize: '1.2rem' }}>
              Finish the {step === 'crew' ? 'crew requirements and any open member checks' : 'parent permissions and grown-up requirements'} below to request review.
            </p>
          )}
        </>
      )}
      {error && <p role="alert" style={{ margin: '0.8rem 0 0', color: Color.red() }}>{error}</p>}
    </section>
  );
}
