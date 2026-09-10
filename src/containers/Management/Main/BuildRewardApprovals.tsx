import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { parseBuildRewardReviewFocusId } from '~/helpers/buildRewardReviewCard';
import {
  rewardPanelClass,
  RewardReviewDetails
} from '~/components/Build/Rewards/RewardConfigView';
import type { RewardReview } from '~/components/Build/Rewards/types';

export default function BuildRewardApprovals() {
  const location = useLocation();
  // /management?rewardReview=<id> (the chat card's button) opens straight on
  // that review so the reviewer never has to find it in the list.
  const focusReviewId = parseBuildRewardReviewFocusId(location.search);
  const focusedReviewIdRef = useRef(0);
  const loadReviews = useAppContext(
    (v) => v.requestHelpers.loadBuildRewardReviews
  );
  const loadReview = useAppContext(
    (v) => v.requestHelpers.loadBuildRewardReview
  );
  const decideReview = useAppContext(
    (v) => v.requestHelpers.decideBuildRewardReview
  );
  const [data, setData] = useState<{
    canReview: boolean;
    reviews: RewardReview[];
    nextCursor?: number | null;
  } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  useEffect(() => {
    let active = true;
    loadReviews()
      .then(
        (result: {
          canReview: boolean;
          reviews: RewardReview[];
          nextCursor?: number | null;
        }) => {
          if (active) setData(result);
        }
      )
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (
      !data?.canReview ||
      !focusReviewId ||
      focusedReviewIdRef.current === focusReviewId
    ) {
      return;
    }
    focusedReviewIdRef.current = focusReviewId;
    focusReview(focusReviewId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.canReview, focusReviewId]);
  const selected = data?.reviews.find((review) => review.id === selectedId);
  if (data && !data.canReview) return null;
  return (
    <section
      className={rewardPanelClass}
      style={{
        margin: '2rem 0',
        padding: '1.5rem',
        border: '1px solid var(--ui-border)',
        borderRadius: 12
      }}
      aria-label="App reward approvals"
    >
      <h2 style={{ margin: 0 }}>App reward approvals</h2>
      <p>
        Approve one saved release and its XP / Coin budgets. Editing the code
        requires another review. Revoking a live approval stops new awards
        immediately.
      </p>
      {error && <p role="alert">{error}</p>}
      <Button variant="outline" disabled={busy} onClick={handleRefresh}>
        Refresh requests
      </Button>
      {!data && !error && <p role="status">Loading requests…</p>}
      {data?.reviews.length === 0 && (
        <p>No pending or approved reward releases.</p>
      )}
      {data?.reviews.map((review) => (
        <article key={review.id} id={`reward-review-${review.id}`}>
          <h3>{review.title || `App ${review.buildId}`}</h3>
          <p>
            {review.status} · Request #{review.id} · Saved version{' '}
            {review.sourceVersionId}
          </p>
          <Button variant="outline" disabled={busy} onClick={() => handleSelect(review.id)}>
            Review code and earning rules
          </Button>
          {selected?.id === review.id && (
            <div className={rewardPanelClass} style={{ marginTop: '1rem' }}>
              <RewardReviewDetails review={selected} />
              <label>
                Review note
                <textarea
                  maxLength={1000}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Required for rejection or revocation"
                />
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
                {review.status === 'pending' ? (
                  <>
                    <Button
                      color="logoBlue"
                      disabled={busy}
                      onClick={() => handleDecision('approve')}
                    >
                      Approve this saved release
                    </Button>
                    <Button
                      variant="outline"
                      color="red"
                      disabled={busy || !reason.trim()}
                      onClick={() => handleDecision('reject')}
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                      color="red"
                    disabled={busy || !reason.trim()}
                    onClick={() => handleDecision('revoke')}
                  >
                    Revoke approval
                  </Button>
                )}
              </div>
            </div>
          )}
        </article>
      ))}
      {data?.nextCursor && (
        <Button variant="outline" disabled={busy} onClick={handleLoadOlder}>
          Load older releases
        </Button>
      )}
    </section>
  );
  async function focusReview(reviewId: number) {
    // A decided (rejected/revoked/superseded) review is not in the queue list,
    // so it is fetched directly and shown at the top rather than reported as
    // missing.
    setBusy(true);
    setError('');
    setReason('');
    try {
      const review = await loadReview(reviewId);
      setData((current) =>
        current
          ? {
              ...current,
              reviews: current.reviews.some((r) => r.id === reviewId)
                ? current.reviews.map((r) =>
                    r.id === reviewId ? { ...r, ...review } : r
                  )
                : [review, ...current.reviews]
            }
          : current
      );
      setSelectedId(reviewId);
      requestAnimationFrame(() => {
        document
          .getElementById(`reward-review-${reviewId}`)
          ?.scrollIntoView({ block: 'start' });
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load that review.'
      );
    } finally {
      setBusy(false);
    }
  }
  async function handleSelect(reviewId: number) {
    if (selectedId === reviewId) {
      setSelectedId(null);
      return;
    }
    setBusy(true);
    setError('');
    setReason('');
    try {
      const review = await loadReview(reviewId);
      setData((current) =>
        current
          ? {
              ...current,
              reviews: current.reviews.map((r) =>
                r.id === reviewId ? { ...r, ...review } : r
              )
            }
          : current
      );
      setSelectedId(reviewId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load source.');
    } finally {
      setBusy(false);
    }
  }
  async function handleLoadOlder() {
    if (!data?.nextCursor || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await loadReviews(data.nextCursor);
      setData((current) =>
        current
          ? { ...result, reviews: [...current.reviews, ...result.reviews] }
          : result
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load older reviews.'
      );
    } finally {
      setBusy(false);
    }
  }
  async function handleRefresh() {
    setBusy(true);
    setError('');
    try {
      setData(await loadReviews());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reviews.');
    } finally {
      setBusy(false);
    }
  }
  async function handleDecision(decision: string) {
    if (!selected || busy) return;
    setBusy(true);
    setError('');
    try {
      setData(await decideReview(selected.id, decision, reason));
      setSelectedId(null);
      setReason('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save this decision.'
      );
    } finally {
      setBusy(false);
    }
  }
}
