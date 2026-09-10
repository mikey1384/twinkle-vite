import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { parseBuildRewardReviewFocusId } from '~/helpers/buildRewardReviewCard';
import {
  rewardPanelClass,
  RewardReviewDetails
} from '~/components/Build/Rewards/RewardConfigView';
import type {
  RewardConfig,
  RewardReview
} from '~/components/Build/Rewards/types';

// Creators send code only. The reviewer writes the earning rules here (or via
// `lumine admin reward-review approve --config`) and approval freezes both.
const EMPTY_CONFIG: RewardConfig = {
  dailyXP: 0,
  dailyCoins: 0,
  userDailyXP: 0,
  userDailyCoins: 0,
  lifetimeXP: 0,
  lifetimeCoins: 0,
  rules: []
};

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
  const [rulesText, setRulesText] = useState('');
  const [rulesError, setRulesError] = useState('');
  // Rules typed for a review survive collapsing it or switching to another
  // review; they are dropped only once a decision on that review is saved.
  const [rulesDrafts, setRulesDrafts] = useState<Record<number, string>>({});
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
        Creators send their saved code; you read it and write the earning rules
        that get approved with it. Editing the code requires another review.
        Revoking a live approval stops new awards immediately. The same queue is
        available as <code>lumine admin reward-review</code>.
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
            {review.status} · Request #{review.id}
            {review.ownerUsername ? ` · by ${review.ownerUsername}` : ''} ·
            Saved version {review.sourceVersionId}
            {review.config.rules.length === 0 ? ' · no earning rules yet' : ''}
          </p>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => handleSelect(review.id)}
          >
            Review code and earning rules
          </Button>
          {selected?.id === review.id && (
            <div className={rewardPanelClass} style={{ marginTop: '1rem' }}>
              <ReviewerContext review={selected} />
              <RewardReviewDetails review={selected} />
              {review.status === 'pending' && (
                <label>
                  Earning rules to approve (JSON). Rule IDs must match the ones
                  the code starts challenges with.
                  <textarea
                    value={rulesText}
                    spellCheck={false}
                    style={{ minHeight: '16rem', fontFamily: 'monospace' }}
                    onChange={(event) => {
                      setRulesText(event.target.value);
                      setRulesDrafts((drafts) => ({
                        ...drafts,
                        [review.id]: event.target.value
                      }));
                      setRulesError('');
                    }}
                  />
                  {rulesError && <span role="alert">{rulesError}</span>}
                </label>
              )}
              <label>
                Review note
                <textarea
                  maxLength={1000}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Required for rejection or revocation; the creator reads it"
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
                      Approve with these rules
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
  function openReview(review: RewardReview) {
    setSelectedId(review.id);
    setReason('');
    setRulesError('');
    // Resume the reviewer's typed draft if there is one; otherwise start from
    // the request's own rules (a code-only update carries the previous
    // approval forward) or an empty template for a first request.
    setRulesText(
      rulesDrafts[review.id] ??
        JSON.stringify(
          review.config?.rules?.length ? review.config : EMPTY_CONFIG,
          null,
          2
        )
    );
  }
  async function focusReview(reviewId: number) {
    // A decided (rejected/revoked/superseded) review is not in the queue list,
    // so it is fetched directly and shown at the top rather than reported as
    // missing.
    setBusy(true);
    setError('');
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
      openReview(review);
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
      openReview(review);
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
    let config: RewardConfig | undefined;
    if (decision === 'approve') {
      try {
        config = JSON.parse(rulesText);
      } catch {
        setRulesError('The earning rules must be valid JSON.');
        return;
      }
      if (!Array.isArray(config?.rules) || config.rules.length === 0) {
        setRulesError(
          'Write at least one earning rule before approving. The server refuses an approval with no rules.'
        );
        return;
      }
    }
    setBusy(true);
    setError('');
    try {
      setData(await decideReview(selected.id, decision, reason, config));
      setRulesDrafts(({ [selected.id]: _done, ...rest }) => rest);
      setSelectedId(null);
      setReason('');
      setRulesText('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save this decision.'
      );
    } finally {
      setBusy(false);
    }
  }
}

// What the code asks for and what this review has done, so the reviewer can
// judge the request without leaving the page.
function ReviewerContext({ review }: { review: RewardReview }) {
  const ids = review.detectedRuleIds || [];
  return (
    <div>
      <p>
        <strong>Rule IDs found in the code:</strong>{' '}
        {ids.length ? ids.map((id) => <code key={id}>{id} </code>) : 'none detected (heuristic scan; read the source)'}
      </p>
      {review.isLatest === false && (
        <p role="alert">
          A newer request exists for this app. Decide on the latest one.
        </p>
      )}
      {review.isLive && <p>This is the approval currently paying out.</p>}
      {review.awarded && (
        <p>
          Paid out by this approval: {review.awarded.awards} awards to{' '}
          {review.awarded.earners} people · {review.awarded.xp.toLocaleString()}{' '}
          XP · {review.awarded.coins.toLocaleString()} Coins
          {review.appLifetime
            ? ` · app lifetime ${review.appLifetime.xp.toLocaleString()} XP / ${review.appLifetime.coins.toLocaleString()} Coins`
            : ''}
        </p>
      )}
    </div>
  );
}
