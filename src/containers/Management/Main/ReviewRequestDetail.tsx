import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { Color, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import {
  type BuildReviewRequestItem,
  formatReviewBytes
} from '~/helpers/buildReviewRequests';

// Detail and decision for a project-room, file-storage or card crafting
// request in the shared Management queue. XP & Coin reward requests keep
// their richer source/rules view in BuildRewardApprovals.
export default function ReviewRequestDetail({
  item,
  onDecided
}: {
  item: BuildReviewRequestItem;
  onDecided: (item: BuildReviewRequestItem) => void;
}) {
  const navigate = useNavigate();
  const { colorKey: successColor } = useRoleColor('success', {
    fallback: 'green'
  });
  const loadRequest = useAppContext(
    (v) => v.requestHelpers.loadBuildReviewRequest
  );
  const decide = useAppContext(
    (v) => v.requestHelpers.decideBuildReviewRequest
  );
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const requestedBytes = Number(item.details?.requestedBytes || 0);
  const [sizeBytes, setSizeBytes] = useState(requestedBytes);

  useEffect(() => {
    let active = true;
    setDetail(null);
    setError('');
    loadRequest(item.type, item.id)
      .then((result: any) => {
        if (active) setDetail(result);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
    // Request helpers are stable context actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.type, item.id, item.eventTimeMs]);

  const events: any[] = detail?.events || [];
  const needsNote = item.type === 'cardcraft';
  const tiers: number[] = Array.from(
    new Set([requestedBytes, ...((item.details?.tiers as number[]) || [])])
  )
    .filter((bytes) => bytes > 0)
    .sort((a, b) => a - b);

  return (
    <div className={panelClass}>
      <p className={summaryClass}>{item.summary}</p>
      {item.reason ? (
        <p>
          <strong>Creator’s reason:</strong> “{item.reason}”
        </p>
      ) : null}
      {item.type === 'storage-limit' && detail?.storage ? (
        <p>
          <strong>Now:</strong>{' '}
          {formatReviewBytes(detail.storage.runtimeFileStorageBytes)} used of{' '}
          {formatReviewBytes(detail.storage.maxRuntimeFileStorageBytes)} across{' '}
          {Number(detail.storage.runtimeFileCount || 0)} file(s). Default{' '}
          {formatReviewBytes(detail.storage.defaultMaxRuntimeFileStorageBytes)}
          , cap{' '}
          {formatReviewBytes(detail.storage.maxApprovableRuntimeFileStorageBytes)}
          . An approval never lowers what they already have.
        </p>
      ) : null}
      {item.type === 'project-limit' && detail?.currentLimits ? (
        <p>
          <strong>Now:</strong> {detail.currentLimits.maxFilesPerProject} files,{' '}
          {formatReviewBytes(detail.currentLimits.maxProjectBytes)}. Approving
          changes Main; every branch inherits it.
        </p>
      ) : null}
      {item.type === 'cardcraft' && detail?.review ? (
        <CardCraftRecipe review={detail.review} />
      ) : null}
      {item.reviewReason && item.status !== 'pending' ? (
        <p>
          <strong>Your note:</strong> {item.reviewReason}
        </p>
      ) : null}
      {events.length ? (
        <div>
          <strong>History</strong>
          <ul className={historyClass}>
            {events.map((event, index) => (
              <li key={index}>
                {event.action} · user {event.actorId} ·{' '}
                {timeSince(event.createdAt)}
                {event.reason ? ` · “${event.reason}”` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
      {item.decisions.length ? (
        <>
          <label className={labelClass}>
            Note {needsNote ? '(the creator reads it; needed to decline)' : '(optional; the creator reads it)'}
            <textarea
              maxLength={1000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <div className={actionsClass}>
            {item.type === 'storage-limit' &&
            item.decisions.includes('approve') ? (
              <select
                aria-label="Storage to approve"
                className={selectClass}
                value={sizeBytes || requestedBytes}
                disabled={busy}
                onChange={(event) => setSizeBytes(Number(event.target.value))}
              >
                {tiers.map((bytes) => (
                  <option key={bytes} value={bytes}>
                    {formatReviewBytes(bytes)}
                  </option>
                ))}
              </select>
            ) : null}
            {item.decisions.includes('approve') ? (
              <Button
                color={successColor}
                variant="solid"
                tone="raised"
                disabled={busy}
                onClick={() => handleDecision('approve')}
              >
                <Icon icon="check" />
                <span style={{ marginLeft: '0.7rem' }}>Approve</span>
              </Button>
            ) : null}
            {item.decisions.includes('reject') ? (
              <Button
                variant="outline"
                color="redOrange"
                disabled={busy || (needsNote && !note.trim())}
                onClick={() => handleDecision('reject')}
              >
                Decline
              </Button>
            ) : null}
            {item.decisions.includes('revoke') ? (
              <Button
                variant="outline"
                color="redOrange"
                disabled={busy || !note.trim()}
                onClick={() => handleDecision('revoke')}
              >
                Revoke approval
              </Button>
            ) : null}
            {item.buildId ? (
              <Button
                variant="ghost"
                color="logoBlue"
                onClick={() => navigate(`/build/${item.buildId}`)}
              >
                <Icon icon="external-link-alt" />
                <span style={{ marginLeft: '0.7rem' }}>Open app</span>
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <p>This request is closed. There is nothing to decide here.</p>
      )}
    </div>
  );

  async function handleDecision(decision: 'approve' | 'reject' | 'revoke') {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await decide({
        type: item.type,
        id: item.id,
        decision,
        reason: note.trim(),
        sizeBytes:
          item.type === 'storage-limit' && decision === 'approve'
            ? sizeBytes || requestedBytes
            : null
      });
      setNote('');
      if (result?.item) onDecided(result.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }
}

function CardCraftRecipe({ review }: { review: any }) {
  const declaration = review.declaration || {};
  const colours = ['', 'blue', 'pink', 'orange', 'magenta', 'gold', 'black'];
  return (
    <div>
      {review.problems?.length ? (
        <p role="alert">Problems: {review.problems.join(' · ')}</p>
      ) : null}
      {declaration.guidance ? (
        <p>
          <strong>Guidance:</strong> {declaration.guidance}
        </p>
      ) : null}
      <ul className={historyClass}>
        {(declaration.kinds || []).map((kind: any) => (
          <li key={kind.id}>
            <strong>{kind.label}</strong> ({kind.id})
            {kind.description ? ` — ${kind.description}` : ''}:{' '}
            {Object.keys(kind.params || {}).join(', ') || 'no parameters'}
          </li>
        ))}
      </ul>
      <p>
        <strong>Card levels:</strong>{' '}
        {['1', '2', '3', '4', '5', '6']
          .map((level) => {
            const kinds = (declaration.tiers || {})[level];
            return `${colours[Number(level)]}: ${
              kinds?.length ? kinds.join(', ') : '—'
            }`;
          })
          .join(' · ')}
      </p>
      {review.isLive ? (
        <p>
          This recipe is live. {review.craftedCount || 0} card(s) crafted with
          it.
        </p>
      ) : null}
    </div>
  );
}

const panelClass = css`
  display: grid;
  gap: 1rem;
  font-size: 1.4rem;
  line-height: 1.55;
  color: ${Color.darkerGray()};
  p {
    margin: 0;
  }
  [role='alert'] {
    color: ${Color.red()};
    font-weight: 700;
  }
`;

const summaryClass = css`
  && {
    font-weight: 700;
    font-size: 1.5rem;
  }
`;

const historyClass = css`
  margin: 0.4rem 0 0;
  padding-left: 1.8rem;
  font-size: 1.3rem;
  color: ${Color.darkGray()};
`;

const labelClass = css`
  display: grid;
  gap: 0.4rem;
  font-weight: 700;
  textarea {
    min-height: 6rem;
    font: inherit;
    font-weight: 400;
    padding: 0.8rem;
    border-radius: 8px;
    border: 1px solid ${Color.borderGray()};
  }
`;

const actionsClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.6rem;
  }
`;

const selectClass = css`
  font-size: 1.4rem;
  font-weight: 700;
  padding: 0.7rem 0.8rem;
  border-radius: 8px;
  border: 1px solid ${Color.borderGray()};
  background: #fff;
`;
