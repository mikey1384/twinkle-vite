import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import SectionPanel from '~/components/SectionPanel';
import Table from '../Table';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { Color, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
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

// The queue pages like the other Management tables: a short first page, then
// Load More reveals what is already fetched before asking the server for older
// requests.
const PAGE_SIZE = 5;

const STATUS_LABEL: Record<string, string> = {
  pending: 'Waiting for review',
  approved: 'Approved',
  rejected: 'Declined',
  revoked: 'Revoked',
  superseded: 'Closed'
};

// Only a pending request can be approved or rejected and only an approval can
// be revoked; every other status is history and gets no buttons.
function isDecidable(status: string) {
  return status === 'pending' || status === 'approved';
}

function statusColorKey(status: string) {
  if (status === 'approved') return 'limeGreen';
  if (status === 'rejected' || status === 'revoked') return 'redOrange';
  if (status === 'pending') return 'logoBlue';
  return 'gray';
}

export default function BuildRewardApprovals() {
  const location = useLocation();
  // /management?rewardReview=<id> (the chat card's button) opens straight on
  // that review so the reviewer never has to find it in the list.
  const focusReviewId = parseBuildRewardReviewFocusId(location.search);
  const focusedReviewIdRef = useRef(0);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const { colorKey: tableHeaderColor } = useRoleColor('tableHeader', {
    fallback: 'logoBlue'
  });
  const { colorKey: successColor } = useRoleColor('success', {
    fallback: 'green'
  });
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
  const [numShown, setNumShown] = useState(PAGE_SIZE);
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

  const reviews = data?.reviews || [];
  const selected = reviews.find((review) => review.id === selectedId);
  const pendingCount = reviews.filter(
    (review) => review.status === 'pending'
  ).length;
  const shownReviews = reviews.slice(0, numShown);
  const moreLocally = reviews.length > numShown;
  const loadMoreShown = moreLocally || Boolean(data?.nextCursor);

  if (data && !data.canReview) return null;

  return (
    <ErrorBoundary componentPath="Management/Main/BuildRewardApprovals">
      <SectionPanel
        title="App reward approvals"
        loaded={Boolean(data) || Boolean(error)}
        isEmpty={Boolean(data) && reviews.length === 0}
        emptyMessage="No pending or approved reward releases"
        innerStyle={{ paddingLeft: 0, paddingRight: 0 }}
        button={
          <Button
            color="darkerGray"
            variant="solid"
            tone="raised"
            disabled={busy}
            onClick={handleRefresh}
          >
            <Icon icon="redo" />
            <span style={{ marginLeft: '0.7rem' }}>Refresh</span>
          </Button>
        }
      >
        <div className={introClass}>
          <p>
            Creators send their saved code. You read it, write the earning
            rules, and approve both together. Editing the code afterwards needs
            another review, and revoking a live approval stops new awards
            immediately.
          </p>
          <p>
            {pendingCount === 0
              ? 'Nothing is waiting for review.'
              : `${pendingCount} ${
                  pendingCount === 1 ? 'request is' : 'requests are'
                } waiting for review.`}{' '}
            The same queue is available as{' '}
            <code>lumine admin reward-review</code>.
          </p>
          {error && <p role="alert">{error}</p>}
        </div>
        <div className={tableWrapClass}>
          <Table
            color={tableHeaderColor}
            columns={`
            minmax(16rem, 2fr)
            minmax(12rem, 1.2fr)
            minmax(14rem, 1.3fr)
            minmax(10rem, 1fr)
            minmax(10rem, 1fr)
          `}
          >
            <thead>
              <tr>
                <th>App</th>
                <th>Creator</th>
                <th>Status</th>
                <th>Saved version</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody>
              {shownReviews.map((review) => {
                const isSelected = selected?.id === review.id;
                return (
                  <tr
                    key={review.id}
                    aria-selected={isSelected}
                    onClick={() => handleSelect(review.id)}
                    className={rowClass}
                  >
                    <td className={appCellClass}>
                      <span className={appTitleClass}>
                        {review.title || `App ${review.buildId}`}
                      </span>
                      <span className={appMetaClass}>
                        <span className={phoneOnlyClass}>
                          {review.ownerUsername || `User ${review.ownerId}`} · v
                          {review.sourceVersionId} ·{' '}
                        </span>
                        Request #{review.id}
                        {review.config.rules.length === 0
                          ? ' · no earning rules yet'
                          : ` · ${review.config.rules.length} ${
                              review.config.rules.length === 1
                                ? 'rule'
                                : 'rules'
                            }`}
                      </span>
                    </td>
                    <td>{review.ownerUsername || `User ${review.ownerId}`}</td>
                    <td>
                      <span
                        className={css`
                          font-weight: 700;
                          color: ${Color[
                          statusColorKey(review.status) as keyof typeof Color
                        ]()};
                        `}
                      >
                        {STATUS_LABEL[review.status] || review.status}
                      </span>
                    </td>
                    <td>{review.sourceVersionId}</td>
                    <td>{timeSince(review.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
        {loadMoreShown && (
          <div className={loadMoreRowClass}>
            <LoadMoreButton
              variant="ghost"
              loading={busy}
              style={{ fontSize: '2rem' }}
              onClick={handleLoadMore}
            />
          </div>
        )}
        {selected && (
          <div ref={detailRef} className={detailClass}>
            <div className={detailHeaderClass}>
              <div>
                <h3>{selected.title || `App ${selected.buildId}`}</h3>
                <p>
                  Request #{selected.id}
                  {selected.ownerUsername
                    ? ` · by ${selected.ownerUsername}`
                    : ''}
                  {' · '}
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        Color[
                          statusColorKey(selected.status) as keyof typeof Color
                        ]()
                    }}
                  >
                    {STATUS_LABEL[selected.status] || selected.status}
                  </span>
                  {' · saved version '}
                  {selected.sourceVersionId}
                </p>
              </div>
              <Button
                variant="ghost"
                color="darkerGray"
                disabled={busy}
                onClick={() => setSelectedId(null)}
              >
                <Icon icon="times" />
                <span style={{ marginLeft: '0.7rem' }}>Close</span>
              </Button>
            </div>
            <ReviewerContext review={selected} />
            <RewardReviewDetails review={selected} />
            {isDecidable(selected.status) && (
              <div className={rewardPanelClass}>
                {selected.status === 'pending' && (
                  <label>
                    Earning rules to approve (JSON)
                    <span className={hintClass}>
                      Rule IDs must match the ones the code starts challenges
                      with.
                    </span>
                    <textarea
                      value={rulesText}
                      spellCheck={false}
                      style={{ minHeight: '18rem', fontFamily: 'monospace' }}
                      onChange={(event) => {
                        setRulesText(event.target.value);
                        setRulesDrafts((drafts) => ({
                          ...drafts,
                          [selected.id]: event.target.value
                        }));
                        setRulesError('');
                      }}
                    />
                    {rulesError && <span role="alert">{rulesError}</span>}
                  </label>
                )}
                <label>
                  Review note
                  <span className={hintClass}>
                    Required for rejection or revocation. The creator reads it.
                  </span>
                  <textarea
                    maxLength={1000}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
                <div className={actionsClass}>
                  {selected.status === 'pending' ? (
                    <>
                      <Button
                        color={successColor}
                        variant="solid"
                        tone="raised"
                        disabled={busy}
                        onClick={() => handleDecision('approve')}
                      >
                        <Icon icon="check" />
                        <span style={{ marginLeft: '0.7rem' }}>
                          Approve with these rules
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        color="redOrange"
                        disabled={busy || !reason.trim()}
                        onClick={() => handleDecision('reject')}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      color="redOrange"
                      disabled={busy || !reason.trim()}
                      onClick={() => handleDecision('revoke')}
                    >
                      Revoke approval
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionPanel>
    </ErrorBoundary>
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

  function scrollToDetail() {
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
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
      scrollToDetail();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load that review.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSelect(reviewId: number) {
    if (busy) return;
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
      scrollToDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load source.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLoadMore() {
    if (busy) return;
    if (moreLocally) {
      setNumShown((count) => count + PAGE_SIZE);
      return;
    }
    if (!data?.nextCursor) return;
    setBusy(true);
    setError('');
    try {
      const result = await loadReviews(data.nextCursor);
      setData((current) =>
        current
          ? { ...result, reviews: [...current.reviews, ...result.reviews] }
          : result
      );
      setNumShown((count) => count + PAGE_SIZE);
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
      setNumShown(PAGE_SIZE);
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
    <div className={rewardPanelClass}>
      <p>
        <strong>Rule IDs found in the code:</strong>{' '}
        {ids.length
          ? ids.map((id) => (
              <code key={id} className={ruleIdClass}>
                {id}
              </code>
            ))
          : 'none detected (heuristic scan; read the source)'}
      </p>
      {review.closedBySave && (
        <p role="alert">
          The creator saved a newer version after sending this request, so this
          version can never be published. The request closed itself; a new one
          arrives if the creator sends it.
        </p>
      )}
      {!isDecidable(review.status) && !review.closedBySave && (
        <p>This request is closed. There is nothing to decide here.</p>
      )}
      {review.isLatest === false && (
        <p role="alert">
          A newer request exists for this app. Decide on the latest one.
        </p>
      )}
      {review.isLive && <p>This is the approval currently paying out.</p>}
      {review.awarded && (review.awarded.awards > 0 || review.isLive) && (
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

const introClass = css`
  padding: 0 1.8rem 1.4rem;
  color: ${Color.darkerGray()};
  font-size: 1.4rem;
  line-height: 1.6;
  display: grid;
  gap: 0.6rem;
  max-width: 78ch;
  p {
    margin: 0;
  }
  code {
    font-size: 1.25rem;
  }
  [role='alert'] {
    color: ${Color.red()};
    font-weight: 700;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 1.4rem 1.2rem;
    font-size: 1.3rem;
  }
`;

// On phones the five columns cannot fit, so the creator and the saved version
// fold into the app cell's second line and their columns disappear.
const tableWrapClass = css`
  width: 100%;
  @media (max-width: ${mobileMaxWidth}) {
    > table {
      grid-template-columns: minmax(0, 2fr) minmax(11rem, 1fr) minmax(
          9rem,
          1fr
        );
      th:nth-child(2),
      th:nth-child(4),
      td:nth-child(2),
      td:nth-child(4) {
        display: none;
      }
      th,
      td {
        padding-left: 1.4rem;
        padding-right: 1.4rem;
      }
      td {
        white-space: normal;
      }
    }
  }
`;

const phoneOnlyClass = css`
  display: none;
  @media (max-width: ${mobileMaxWidth}) {
    display: inline;
  }
`;

const rowClass = css`
  cursor: pointer;
  td {
    display: flex;
    align-items: center;
  }
  &[aria-selected='true'] td {
    background: ${Color.whitePurple()};
    box-shadow: inset 0 -2px 0 var(--section-panel-accent, ${Color.logoBlue()});
  }
`;

const appCellClass = css`
  && {
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 0.2rem;
    white-space: normal;
  }
`;

const appTitleClass = css`
  font-weight: 700;
  font-size: 1.6rem;
  color: ${Color.darkerGray()};
`;

const appMetaClass = css`
  font-size: 1.2rem;
  color: ${Color.gray()};
`;

const loadMoreRowClass = css`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  width: 100%;
`;

// The selected review opens beneath the table in a frame that carries the
// panel's accent, so the transition from "row in a list" to "thing being
// judged" is visible without leaving the section.
const detailClass = css`
  margin: 2rem 1.8rem 0;
  padding: 1.6rem 1.8rem;
  border: 1px solid var(--section-panel-border-color, ${Color.borderGray()});
  border-top: 4px solid var(--section-panel-accent, ${Color.logoBlue()});
  border-radius: 12px;
  background: #fff;
  display: grid;
  gap: 1.6rem;
  scroll-margin-top: 8rem;
  @media (max-width: ${mobileMaxWidth}) {
    margin: 1.6rem 1.2rem 0;
    padding: 1.2rem 1.4rem;
  }
`;

const detailHeaderClass = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.2rem;
  flex-wrap: wrap;
  h3 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    color: ${Color.darkerGray()};
  }
  p {
    margin: 0.3rem 0 0;
    font-size: 1.4rem;
    color: ${Color.darkGray()};
  }
`;

const hintClass = css`
  font-weight: 400;
  font-size: 1.3rem;
  color: ${Color.gray()};
`;

const ruleIdClass = css`
  display: inline-block;
  margin-right: 0.6rem;
  padding: 0.1rem 0.6rem;
  border-radius: 6px;
  background: ${Color.wellGray()};
`;

const actionsClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
`;
