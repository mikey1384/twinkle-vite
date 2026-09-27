import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { ADMIN_USER_ID } from '~/constants/defaultValues';
import { useAppContext } from '~/contexts';
import {
  BUILD_REVIEW_TYPE_ICONS,
  BUILD_REVIEW_TYPE_LABELS,
  type BuildReviewRequestItem,
  buildReviewCardBanner,
  compareBuildReviewRequestVersions,
  formatReviewBytes,
  getBuildReviewRequestManagementPath
} from '~/helpers/buildReviewRequests';
import BuildMessageCard, { BuildMessageCardChip } from './BuildMessageCard';

// The one chat card for a creator's unlock request to Mikey (project room,
// file storage, card crafting). The server re-reads the request on every
// chat load and pushes decisions, so this only renders canonical state. Mikey
// can decide quota unlocks right here; card crafting opens the Management
// queue for the recipe (a decline there needs a note the creator reads).
export default function BuildReviewRequestCard({
  request,
  myId,
  sender
}: {
  request?: BuildReviewRequestItem | null;
  myId: number;
  sender: {
    id: number;
    username: string;
    profileTheme?: string | null;
  };
}) {
  const navigate = useNavigate();
  const decide = useAppContext(
    (v) => v.requestHelpers.decideBuildReviewRequest
  );
  const [decided, setDecided] = useState<BuildReviewRequestItem | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const item = useMemo(
    () =>
      decided && compareBuildReviewRequestVersions(decided, request) >= 0
        ? decided
        : request || null,
    [decided, request]
  );
  const requestedBytes = Number(item?.details?.requestedBytes || 0);
  const tiers: number[] = Array.isArray(item?.details?.tiers)
    ? item!.details.tiers
    : [];
  const [sizeBytes, setSizeBytes] = useState(0);
  if (!item || !item.type || !item.id) return null;

  const isReviewer = Number(myId) === ADMIN_USER_ID;
  const pending = item.status === 'pending';
  const canDecideHere =
    isReviewer && pending && item.decisions.includes('approve');
  const chosenBytes = sizeBytes || requestedBytes;
  const requestedByMe = Number(item.requesterId) === Number(myId);
  const projectPath =
    item.type === 'project-limit' &&
    item.buildId &&
    (requestedByMe || (isReviewer && pending))
      ? `/build/${item.buildId}`
      : null;

  return (
    <BuildMessageCard
      bannerIcon={BUILD_REVIEW_TYPE_ICONS[item.type]}
      themeName={sender.profileTheme}
      bannerText={buildReviewCardBanner(item)}
      title={
        item.appTitle ||
        (item.type === 'storage-limit'
          ? requestedByMe
            ? 'All your Builds'
            : `All of ${item.requesterUsername || sender.username}'s Builds`
          : 'Untitled Build')
      }
      chips={
        <>
          <BuildMessageCardChip
            icon={BUILD_REVIEW_TYPE_ICONS[item.type]}
            themeName={sender.profileTheme}
          >
            {BUILD_REVIEW_TYPE_LABELS[item.type]}
          </BuildMessageCardChip>
          {item.type === 'storage-limit' ? (
            <BuildMessageCardChip icon="save" themeName={sender.profileTheme}>
              {formatReviewBytes(
                Number(item.details?.approvedBytes || 0) || requestedBytes
              )}
            </BuildMessageCardChip>
          ) : null}
          {item.type === 'project-limit' && item.details?.requestedMaxFiles ? (
            <BuildMessageCardChip icon="copy" themeName={sender.profileTheme}>
              {item.details.requestedMaxFiles} files
            </BuildMessageCardChip>
          ) : null}
          {item.type === 'project-limit' &&
          item.details?.requestedMaxProjectBytes ? (
            <BuildMessageCardChip icon="save" themeName={sender.profileTheme}>
              {formatReviewBytes(item.details.requestedMaxProjectBytes)}
            </BuildMessageCardChip>
          ) : null}
          {item.type === 'cardcraft'
            ? (item.details?.kinds || []).slice(0, 4).map((kind: any) => (
                <BuildMessageCardChip
                  key={kind.id}
                  icon="star"
                  themeName={sender.profileTheme}
                >
                  {kind.label}
                </BuildMessageCardChip>
              ))
            : null}
        </>
      }
      actions={
        <>
          {canDecideHere && item.type !== 'cardcraft' ? (
            <>
              {item.type === 'storage-limit' && tiers.length ? (
                <select
                  className={selectClass}
                  aria-label="Storage to approve"
                  value={chosenBytes}
                  disabled={Boolean(busy)}
                  onChange={(event) => setSizeBytes(Number(event.target.value))}
                >
                  {Array.from(new Set([requestedBytes, ...tiers]))
                    .filter((bytes) => bytes > 0)
                    .sort((a, b) => a - b)
                    .map((bytes) => (
                      <option key={bytes} value={bytes}>
                        {formatReviewBytes(bytes)}
                      </option>
                    ))}
                </select>
              ) : null}
              <GameCTAButton
                variant="success"
                size="md"
                icon="check"
                shiny
                loading={busy === 'approve'}
                disabled={Boolean(busy)}
                onClick={() => handleDecision('approve')}
              >
                Approve
              </GameCTAButton>
              <GameCTAButton
                variant="neutral"
                size="md"
                icon="times"
                loading={busy === 'reject'}
                disabled={Boolean(busy)}
                onClick={() => handleDecision('reject')}
              >
                Decline
              </GameCTAButton>
            </>
          ) : null}
          {canDecideHere && item.type === 'cardcraft' ? (
            <GameCTAButton
              variant="success"
              size="md"
              icon="check"
              shiny
              loading={busy === 'approve'}
              disabled={Boolean(busy)}
              onClick={() => handleDecision('approve')}
            >
              Approve
            </GameCTAButton>
          ) : null}
          {isReviewer ? (
            <GameCTAButton
              variant="logoBlue"
              size="md"
              icon="list"
              onClick={() =>
                navigate(getBuildReviewRequestManagementPath(item.type, item.id))
              }
            >
              {item.type === 'cardcraft' && pending ? 'Read recipe' : 'Queue'}
            </GameCTAButton>
          ) : null}
          {projectPath ? (
            <GameCTAButton
              variant="logoBlue"
              size="md"
              icon="external-link-alt"
              onClick={() => navigate(projectPath)}
            >
              Open project
            </GameCTAButton>
          ) : null}
        </>
      }
    >
      <div className={messageClass}>
        <Icon
          icon={
            item.status === 'approved'
              ? 'check-circle'
              : item.status === 'pending'
                ? 'info-circle'
                : 'times-circle'
          }
        />
        <span>
          {describe(item, { isReviewer, requestedByMe, sender: sender.username })}
          {item.reason ? (
            <span className={quoteClass}>“{item.reason}”</span>
          ) : null}
          {item.reviewReason && item.status !== 'pending' ? (
            <span className={quoteClass}>Mikey: {item.reviewReason}</span>
          ) : null}
        </span>
      </div>
      {error ? <div className={errorClass}>{error}</div> : null}
    </BuildMessageCard>
  );

  async function handleDecision(decision: 'approve' | 'reject') {
    if (busy || !item) return;
    setBusy(decision);
    setError('');
    try {
      const result = await decide({
        type: item.type,
        id: item.id,
        decision,
        sizeBytes:
          item.type === 'storage-limit' && decision === 'approve'
            ? chosenBytes
            : null
      });
      if (result?.item) setDecided(result.item);
    } catch (err: any) {
      setError(err?.message || 'Could not save this decision.');
    } finally {
      setBusy('');
    }
  }
}

function describe(
  item: BuildReviewRequestItem,
  {
    isReviewer,
    requestedByMe,
    sender
  }: { isReviewer: boolean; requestedByMe: boolean; sender: string }
) {
  if (item.status === 'pending') {
    if (isReviewer && !requestedByMe) {
      if (item.type === 'storage-limit')
        return `${sender} asks for ${formatReviewBytes(item.details?.requestedBytes)} of Lumine file storage across all their Builds (using ${formatReviewBytes(item.details?.usageBytesAtRequest)} when they asked). Approve any size up to ${formatReviewBytes(item.details?.maxBytes)}.`;
      if (item.type === 'project-limit')
        return `${sender} is nearing this project's limit. Approving changes Main, and every branch inherits it.`;
      if (item.type === 'cardcraft')
        return `${sender} wants players to craft AI Cards in this app with this recipe. Approval makes it work in the published app right away.`;
      return item.summary;
    }
    if (item.type === 'project-limit')
      return 'Mikey can open this project while the request waits so he can check it. Nothing changes until he says yes.';
    if (item.type === 'storage-limit')
      return 'Your uploads keep working with your current space until Mikey says yes.';
    return 'Mikey will read your recipe. The card shows his answer here.';
  }
  if (item.status === 'approved') {
    if (item.type === 'storage-limit')
      return `Lumine file storage is now ${formatReviewBytes(
        item.details?.approvedBytes || item.details?.requestedBytes
      )} across all your Builds.`;
    if (item.type === 'project-limit')
      return 'Main and all of its branches can use the approved room now.';
    if (item.type === 'cardcraft')
      return 'Players can craft their cards in the published app now.';
    return item.summary;
  }
  if (item.status === 'rejected') {
    if (item.type === 'cardcraft')
      return 'The recipe was not approved. Ask Lumine to change it, then ask again.';
    return 'Nothing changed. You can ask again later.';
  }
  if (item.status === 'revoked')
    return 'Crafting with this recipe stopped. Cards already crafted stay crafted.';
  return 'A newer request replaced this one.';
}

const messageClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  border: 1px solid ${Color.logoBlue(0.18)};
  border-radius: 10px;
  background: ${Color.logoBlue(0.07)};
  color: ${Color.darkerGray()};
  padding: 0.85rem 0.95rem;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.45;
  > svg {
    color: ${Color.logoBlue()};
    flex: 0 0 auto;
    margin-top: 0.2rem;
  }
`;

const quoteClass = css`
  display: block;
  margin-top: 0.35rem;
  font-weight: 600;
  opacity: 0.85;
`;

const selectClass = css`
  font-size: 1.2rem;
  font-weight: 700;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--ui-border, #ccd3df);
  background: #fff;
`;

const errorClass = css`
  color: ${Color.rose()};
  font-size: 1.1rem;
  font-weight: 700;
`;
