import React, { useEffect, useRef, useState } from 'react';
import { releaseScrollAnchorTopPin } from '~/helpers/scrollAnchorRestorationCoordinator';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import SectionPanel from '~/components/SectionPanel';
import RewardProposalTryButton from '~/components/Build/Rewards/RewardProposalTryButton';
import Table from '../Table';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { Color, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { formatBuildRewardProposalSummary } from '~/helpers/buildRewardReviewCard';
import {
  BUILD_REVIEW_REQUEST_TYPES,
  BUILD_REVIEW_TYPE_ICONS,
  BUILD_REVIEW_TYPE_LABELS,
  type BuildReviewRequestItem,
  type BuildReviewRequestType,
  buildReviewStatusLabel,
  parseBuildReviewRequestFocus
} from '~/helpers/buildReviewRequests';
import ReviewRequestDetail from './ReviewRequestDetail';
import { getBuildWorkspacePath } from '~/helpers/buildNavigationHelpers';
import {
  rewardPanelClass,
  RewardReviewDetails
} from '~/components/Build/Rewards/RewardConfigView';
import type {
  RewardConfig,
  RewardReview
} from '~/components/Build/Rewards/types';

// Every Build unlock a creator asks Mikey for, in one queue: XP & Coin rewards,
// project room, file storage and card crafting (the API's review-request
// registry; `lumine admin review` is the same queue). Reward requests keep
// their source/rules view below: creators send code only, the reviewer writes
// the earning rules and approval freezes and publishes both.
const EMPTY_CONFIG: RewardConfig = {
  userDailyXP: 0,
  userDailyCoins: 0,
  rules: []
};

// The queue pages like the other Management tables: a short first page, then
// Load More reveals what is already fetched before asking the server for older
// requests.
const PAGE_SIZE = 5;

const STATUS_LABEL: Record<string, string> = {
  pending: 'Waiting for review',
  changes_offered: 'Waiting for the creator',
  approved: 'Approved · live',
  rejected: 'Declined',
  revoked: 'Revoked',
  superseded: 'Closed'
};

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'queue', label: 'To do' },
  { value: 'pending', label: 'Waiting' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Declined' },
  { value: 'all', label: 'All' }
];

interface QueueData {
  canReview: boolean;
  items: BuildReviewRequestItem[];
  nextCursor?: string | null;
}

// A pending request (or one whose proposal awaits the creator) can be
// approved, rejected or given a proposal; only an approval can be revoked;
// every other status is history and gets no buttons.
function isDecidable(status: string) {
  return (
    status === 'pending' || status === 'changes_offered' || status === 'approved'
  );
}

function isOpenRequest(status: string) {
  return status === 'pending' || status === 'changes_offered';
}

function statusColorKey(status: string) {
  if (status === 'approved') return 'limeGreen';
  if (status === 'rejected' || status === 'revoked') return 'redOrange';
  if (status === 'pending' || status === 'changes_offered') return 'logoBlue';
  return 'gray';
}

export default function BuildRewardApprovals() {
  const location = useLocation();
  const navigate = useNavigate();
  // /management?rewardReview=<id> or ?review=<type>:<id> (the chat cards'
  // buttons) opens straight on that request.
  const focus = parseBuildReviewRequestFocus(location.search);
  const focusKey = focus ? `${focus.type}:${focus.id}` : '';
  const focusedKeyRef = useRef('');
  const detailRef = useRef<HTMLDivElement | null>(null);
  const { colorKey: tableHeaderColor } = useRoleColor('tableHeader', {
    fallback: 'logoBlue'
  });
  const { colorKey: successColor } = useRoleColor('success', {
    fallback: 'green'
  });
  const loadQueue = useAppContext(
    (v) => v.requestHelpers.loadBuildReviewRequests
  );
  const loadRequest = useAppContext(
    (v) => v.requestHelpers.loadBuildReviewRequest
  );
  const loadReview = useAppContext(
    (v) => v.requestHelpers.loadBuildRewardReview
  );
  const decideReview = useAppContext(
    (v) => v.requestHelpers.decideBuildRewardReview
  );
  const openProposalWorkspace = useAppContext(
    (v) => v.requestHelpers.openBuildRewardReviewWorkspace
  );
  const proposeChanges = useAppContext(
    (v) => v.requestHelpers.proposeBuildRewardReviewChanges
  );
  const [data, setData] = useState<QueueData | null>(null);
  const [typeFilter, setTypeFilter] = useState<BuildReviewRequestType | ''>('');
  const [statusFilter, setStatusFilter] = useState('queue');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [numShown, setNumShown] = useState(PAGE_SIZE);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  // Full reward reviews (source files, reviewer context) by review id.
  const [rewardDetails, setRewardDetails] = useState<
    Record<number, RewardReview>
  >({});
  const [reason, setReason] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [rulesError, setRulesError] = useState('');
  const [proposalError, setProposalError] = useState('');
  // Rules typed for a review survive collapsing it or switching to another
  // review; they are dropped only once a decision on that review is saved.
  const [rulesDrafts, setRulesDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    let active = true;
    setError('');
    loadQueue({ status: statusFilter, type: typeFilter || undefined })
      .then((result: QueueData) => {
        if (!active) return;
        setData(result);
        setNumShown(PAGE_SIZE);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    if (!data?.canReview || !focus || focusedKeyRef.current === focusKey) {
      return;
    }
    focusedKeyRef.current = focusKey;
    void focusRequest(focus.type, focus.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.canReview, focusKey]);

  const items = data?.items || [];
  const selectedItem = items.find((item) => item.ref === selectedRef) || null;
  const selected: RewardReview | undefined =
    selectedItem?.type === 'rewards'
      ? rewardDetails[selectedItem.id] || selectedItem.review
      : undefined;
  const pendingCount = items.filter((item) => item.status === 'pending').length;
  const offeredCount = items.filter(
    (item) => item.status === 'changes_offered'
  ).length;
  const shownItems = items.slice(0, numShown);
  const moreLocally = items.length > numShown;
  const loadMoreShown = moreLocally || Boolean(data?.nextCursor);

  if (data && !data.canReview) return null;

  return (
    <ErrorBoundary componentPath="Management/Main/BuildRewardApprovals">
      <SectionPanel
        title="Build approvals"
        loaded={Boolean(data) || Boolean(error)}
        isEmpty={false}
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
            Everything creators ask you to unlock, in one list: XP & Coin
            rewards, project room, file storage and card crafting. For
            rewards, read the saved code, write the earning rules and approve
            both together: approval publishes that exact version immediately
            (or edit a private copy and offer it as the condition of
            approval). Quota unlocks change a limit and never lower one; a
            card crafting approval makes the recipe work in the published app
            right away. Revoking a live approval stops it immediately.
          </p>
          <p>
            {pendingCount === 0
              ? 'Nothing is waiting for review.'
              : `${pendingCount} ${
                  pendingCount === 1 ? 'request is' : 'requests are'
                } waiting for review.`}
            {offeredCount > 0
              ? ` ${offeredCount} ${
                  offeredCount === 1 ? 'proposal is' : 'proposals are'
                } waiting for a creator's answer.`
              : ''}{' '}
            The same queue is available as <code>lumine admin review</code>.
          </p>
          {error && <p role="alert">{error}</p>}
        </div>
        <div className={filterRowClass}>
          <div className={chipRowClass} role="group" aria-label="Request type">
            {(['', ...BUILD_REVIEW_REQUEST_TYPES] as const).map((type) => (
              <button
                key={type || 'all'}
                type="button"
                aria-pressed={typeFilter === type}
                className={chipClass}
                onClick={() => {
                  setTypeFilter(type);
                  setSelectedRef(null);
                }}
              >
                {type ? <Icon icon={BUILD_REVIEW_TYPE_ICONS[type]} /> : null}
                {type ? BUILD_REVIEW_TYPE_LABELS[type] : 'Everything'}
              </button>
            ))}
          </div>
          <select
            aria-label="Status"
            className={statusSelectClass}
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setSelectedRef(null);
            }}
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {data && items.length === 0 ? (
          <p className={emptyClass}>Nothing here.</p>
        ) : null}
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
                <th>Request</th>
                <th>Creator</th>
                <th>Status</th>
                <th>Type</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody>
              {shownItems.map((item) => {
                const isSelected = selectedRef === item.ref;
                return (
                  <tr
                    key={item.ref}
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    className={rowClass}
                  >
                    <td className={appCellClass}>
                      <span className={appTitleClass}>
                        <span className={typeBadgeClass}>
                          <Icon icon={BUILD_REVIEW_TYPE_ICONS[item.type]} />
                          {BUILD_REVIEW_TYPE_LABELS[item.type]}
                        </span>{' '}
                        {item.appTitle ||
                          (item.type === 'storage-limit'
                            ? 'All their Builds'
                            : `App ${item.buildId}`)}
                      </span>
                      <span className={appMetaClass}>
                        <span className={phoneOnlyClass}>
                          {item.requesterUsername || `User ${item.requesterId}`}{' '}
                          ·{' '}
                        </span>
                        #{item.id} · {item.summary}
                      </span>
                    </td>
                    <td>{item.requesterUsername || `User ${item.requesterId}`}</td>
                    <td>
                      <span
                        className={css`
                          font-weight: 700;
                          color: ${Color[
                          statusColorKey(item.status) as keyof typeof Color
                        ]()};
                        `}
                      >
                        {buildReviewStatusLabel(item)}
                      </span>
                    </td>
                    <td>{BUILD_REVIEW_TYPE_LABELS[item.type]}</td>
                    <td>{timeSince(item.createdAt)}</td>
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
        {selectedItem && selectedItem.type !== 'rewards' && (
          <div ref={detailRef} className={detailClass}>
            <div className={detailHeaderClass}>
              <div>
                <h3>
                  {BUILD_REVIEW_TYPE_LABELS[selectedItem.type]} ·{' '}
                  {selectedItem.appTitle ||
                    selectedItem.requesterUsername ||
                    `User ${selectedItem.requesterId}`}
                </h3>
                <p>
                  Request #{selectedItem.id}
                  {selectedItem.requesterUsername
                    ? ` · by ${selectedItem.requesterUsername}`
                    : ''}
                  {' · '}
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        Color[
                          statusColorKey(selectedItem.status) as keyof typeof Color
                        ]()
                    }}
                  >
                    {buildReviewStatusLabel(selectedItem)}
                  </span>
                </p>
              </div>
              <Button
                variant="ghost"
                color="darkerGray"
                onClick={() => setSelectedRef(null)}
              >
                <Icon icon="times" />
                <span style={{ marginLeft: '0.7rem' }}>Close</span>
              </Button>
            </div>
            <ReviewRequestDetail
              key={selectedItem.ref}
              item={selectedItem}
              onDecided={(decided) =>
                setData((current) =>
                  current
                    ? {
                        ...current,
                        items: current.items.map((entry) =>
                          entry.ref === decided.ref ? decided : entry
                        )
                      }
                    : current
                )
              }
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
                onClick={() => setSelectedRef(null)}
              >
                <Icon icon="times" />
                <span style={{ marginLeft: '0.7rem' }}>Close</span>
              </Button>
            </div>
            <ReviewerContext review={selected} />
            <RewardReviewDetails review={selected} />
            {isOpenRequest(selected.status) && (
              <div className={rewardPanelClass}>
                <h4>Propose changes instead</h4>
                <p>
                  Open a private copy of this exact submitted version in your
                  own workspace, edit it (Lumine included), save, then come
                  back here and offer it. The creator sees every changed line
                  and either accepts, which publishes your version with the
                  rules below, or declines, which closes the request. Nothing
                  here joins the creator’s team.
                </p>
                {selected.proposal ? (
                  <p>
                    <strong>Offered:</strong>{' '}
                    {formatBuildRewardProposalSummary(selected.proposal)}
                    {selected.proposal.offeredAt
                      ? ` · ${timeSince(selected.proposal.offeredAt)}`
                      : ''}
                    {selected.proposal.changedFiles.length > 0
                      ? ` · ${selected.proposal.changedFiles
                          .map((file) => file.path)
                          .join(', ')}`
                      : ''}
                    . Saving new edits in the copy and offering again replaces
                    it.
                  </p>
                ) : null}
                <div className={actionsClass}>
                  {selected.status === 'changes_offered' ? (
                    <RewardProposalTryButton reviewId={selected.id} />
                  ) : null}
                  <Button
                    variant="outline"
                    color="logoBlue"
                    disabled={busy}
                    onClick={handleOpenProposalWorkspace}
                  >
                    <Icon icon="code-branch" />
                    <span style={{ marginLeft: '0.7rem' }}>
                      {selected.proposalBuildId
                        ? 'Open my copy'
                        : 'Edit a copy to propose changes'}
                    </span>
                  </Button>
                  {selected.proposalBuildId ? (
                    <Button
                      color="logoBlue"
                      variant="solid"
                      tone="raised"
                      disabled={busy}
                      onClick={handlePropose}
                    >
                      <Icon icon="paper-plane" />
                      <span style={{ marginLeft: '0.7rem' }}>
                        {selected.status === 'changes_offered'
                          ? 'Offer my latest copy again'
                          : 'Offer my copy with these rules'}
                      </span>
                    </Button>
                  ) : null}
                </div>
                {proposalError && <p role="alert">{proposalError}</p>}
              </div>
            )}
            {isDecidable(selected.status) && (
              <div className={rewardPanelClass}>
                {isOpenRequest(selected.status) && (
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
                    The creator reads it. Required for rejection or
                    revocation; with a proposal it explains your changes.
                  </span>
                  <textarea
                    maxLength={1000}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
                <div className={actionsClass}>
                  {isOpenRequest(selected.status) ? (
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
                          {selected.status === 'changes_offered'
                            ? 'Approve as submitted & publish'
                            : 'Approve & publish'}
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
    setSelectedRef(`rewards:${review.id}`);
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
      releaseScrollAnchorTopPin();
      detailRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }

  function upsertItem(item: BuildReviewRequestItem) {
    setData((current) =>
      current
        ? {
            ...current,
            items: current.items.some((entry) => entry.ref === item.ref)
              ? current.items.map((entry) =>
                  entry.ref === item.ref ? { ...entry, ...item } : entry
                )
              : [item, ...current.items]
          }
        : current
    );
  }

  async function loadRewardDetail(reviewId: number) {
    const review: RewardReview = await loadReview(reviewId);
    setRewardDetails((current) => ({ ...current, [reviewId]: review }));
    return review;
  }

  async function focusRequest(type: BuildReviewRequestType, id: number) {
    // A decided request is not in the default list, so it is fetched
    // directly and shown at the top rather than reported as missing.
    setBusy(true);
    setError('');
    try {
      const shown = await loadRequest(type, id);
      if (shown?.item) {
        upsertItem(
          type === 'rewards' ? { ...shown.item, review: shown.review } : shown.item
        );
      }
      if (type === 'rewards') {
        openReview(await loadRewardDetail(id));
      } else {
        setSelectedRef(`${type}:${id}`);
      }
      scrollToDetail();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load that request.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSelect(item: BuildReviewRequestItem) {
    if (busy) return;
    if (selectedRef === item.ref) {
      setSelectedRef(null);
      return;
    }
    if (item.type !== 'rewards') {
      setSelectedRef(item.ref);
      scrollToDetail();
      return;
    }
    setBusy(true);
    setError('');
    try {
      openReview(await loadRewardDetail(item.id));
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
      const result: QueueData = await loadQueue({
        status: statusFilter,
        type: typeFilter || undefined,
        cursor: data.nextCursor
      });
      setData((current) =>
        current
          ? { ...result, items: [...current.items, ...result.items] }
          : result
      );
      setNumShown((count) => count + PAGE_SIZE);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load older requests.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRefresh() {
    setBusy(true);
    setError('');
    try {
      setData(
        await loadQueue({ status: statusFilter, type: typeFilter || undefined })
      );
      setRewardDetails({});
      setNumShown(PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load requests.');
    } finally {
      setBusy(false);
    }
  }

  function parseRulesForOffer(): RewardConfig | null {
    let config: RewardConfig | undefined;
    try {
      config = JSON.parse(rulesText);
    } catch {
      setRulesError('The earning rules must be valid JSON.');
      return null;
    }
    if (!Array.isArray(config?.rules) || config.rules.length === 0) {
      setRulesError(
        'Write at least one earning rule before offering changes. The server refuses a proposal with no rules.'
      );
      return null;
    }
    return config;
  }

  async function handleOpenProposalWorkspace() {
    if (!selected || busy) return;
    setBusy(true);
    setProposalError('');
    try {
      const result = await openProposalWorkspace(selected.id);
      const proposalBuildId = Number(result?.buildId || 0);
      if (!proposalBuildId) throw new Error('No workspace was created.');
      setRewardDetails((current) => ({
        ...current,
        [selected.id]: { ...selected, proposalBuildId }
      }));
      navigate(getBuildWorkspacePath({ id: proposalBuildId }));
    } catch (err) {
      setProposalError(
        err instanceof Error
          ? err.message
          : 'Could not open the proposal workspace.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePropose() {
    if (!selected || busy) return;
    const config = parseRulesForOffer();
    if (!config) return;
    setBusy(true);
    setProposalError('');
    setError('');
    try {
      const review = await proposeChanges(selected.id, {
        config,
        reason: reason.trim()
      });
      setRewardDetails((current) => ({
        ...current,
        [selected.id]: { ...selected, ...review }
      }));
      await handleRefresh();
    } catch (err) {
      setProposalError(
        err instanceof Error ? err.message : 'Could not offer these changes.'
      );
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
      await decideReview(selected.id, decision, reason, config);
      setRulesDrafts(({ [selected.id]: _done, ...rest }) => rest);
      setSelectedRef(null);
      await handleRefresh();
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
      {review.status === 'changes_offered' && (
        <p>
          Your proposed changes are waiting for the creator. They can accept
          (your version is approved and published) or decline (the request
          closes). You can still approve or reject the version as submitted.
        </p>
      )}
      {review.status === 'rejected' && review.declinedByCreator && (
        <p>The creator declined the proposed changes, which closed this request.</p>
      )}
      {review.publishedArtifactVersionId && review.status === 'approved' && (
        <p>
          Published on approval as artifact version{' '}
          {review.publishedArtifactVersionId}.
        </p>
      )}
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

const filterRowClass = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0 1.8rem 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 1.2rem 1rem;
  }
`;

const chipRowClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const chipClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1px solid ${Color.borderGray()};
  background: #fff;
  color: ${Color.darkerGray()};
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  &[aria-pressed='true'] {
    background: ${Color.logoBlue()};
    border-color: ${Color.logoBlue()};
    color: #fff;
  }
`;

const statusSelectClass = css`
  font-size: 1.3rem;
  font-weight: 700;
  padding: 0.45rem 0.7rem;
  border-radius: 8px;
  border: 1px solid ${Color.borderGray()};
  background: #fff;
`;

const typeBadgeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-right: 0.3rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: ${Color.logoBlue(0.12)};
  color: ${Color.logoBlue()};
  font-size: 1.1rem;
  font-weight: 800;
  vertical-align: middle;
`;

const emptyClass = css`
  padding: 0 1.8rem 1.2rem;
  font-size: 1.4rem;
  color: ${Color.gray()};
`;

