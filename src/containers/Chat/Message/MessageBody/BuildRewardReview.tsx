import React, { useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import RewardProposalDiffModal from '~/components/Build/Rewards/RewardProposalDiffModal';
import RewardProposalTryButton from '~/components/Build/Rewards/RewardProposalTryButton';
import type { RewardProposalDiff } from '~/components/Build/Rewards/types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { ADMIN_USER_ID } from '~/constants/defaultValues';
import { useAppContext } from '~/contexts';
import {
  formatBuildRewardProposalSummary,
  formatBuildRewardRulesSummary,
  getBuildRewardReviewBannerText,
  getBuildRewardReviewManagementPath,
  getBuildRewardReviewStatusLabel,
  normalizeBuildRewardReviewStatus,
  type BuildRewardReviewCardPayload
} from '~/helpers/buildRewardReviewCard';
import BuildMessageCard, { BuildMessageCardChip } from './BuildMessageCard';

// The DM a creator's "Send for review" produces. Everything shown here is the
// server's read of the review row at load time — status included — so the
// card never guesses whether Mikey already decided. Decisions are made on the
// Management page, which the button opens on this exact review.
export default function BuildRewardReview({
  review,
  myId,
  sender
}: {
  review?: BuildRewardReviewCardPayload | null;
  myId: number;
  sender: {
    id: number;
    username: string;
    profileTheme?: string | null;
  };
}) {
  const navigate = useNavigate();
  const respondToProposal = useAppContext(
    (v) => v.requestHelpers.respondToBuildRewardProposal
  );
  const loadProposal = useAppContext(
    (v) => v.requestHelpers.loadBuildRewardReviewProposal
  );
  const [diffOpen, setDiffOpen] = useState(false);
  const [confirmingDecline, setConfirmingDecline] = useState<{
    reviewId: number;
    proposalRevision: number;
  } | null>(null);
  const [answering, setAnswering] = useState<'accept' | 'decline' | ''>('');
  const [answerError, setAnswerError] = useState('');
  const reviewId = Number(review?.reviewId || 0);
  const buildId = Number(review?.buildId || 0);
  const title = String(review?.title || 'Untitled Build');
  const status = normalizeBuildRewardReviewStatus(review?.status);
  const closedBySave = status === 'superseded' && Boolean(review?.closedBySave);
  const declinedByCreator = Boolean(review?.declinedByCreator);
  const proposal = review?.proposal || null;
  const reason = String(review?.reason || '').trim();
  const thumbnailUrl = String(review?.thumbnailUrl || '').trim();
  const sourceVersionId = Number(review?.sourceVersionId || 0);
  const budgets = review?.budgets || {};
  const sentByMe = Number(sender.id) === Number(myId);
  const isReviewer = Number(myId) === ADMIN_USER_ID;
  // Both sides of an open offer can play the suggested version first; the
  // server re-checks that the viewer is the app's owner or the reviewer.
  const canTryProposal =
    status === 'changes_offered' && (sentByMe || isReviewer);
  const rulesSummary = formatBuildRewardRulesSummary(review?.rules);
  // Budgets exist only once the reviewer has written rules; a pending request
  // carries none, so showing zeros would read as a broken card.
  const hasRules = Array.isArray(review?.rules) && review.rules.length > 0;

  if (!reviewId || !buildId) return null;

  return (
    <BuildMessageCard
      bannerIcon="coins"
      themeName={sender.profileTheme}
      bannerText={getBuildRewardReviewBannerText(
        status,
        closedBySave,
        declinedByCreator
      )}
      title={title}
      chips={
        <>
          <BuildMessageCardChip
            icon={
              status === 'approved'
                ? 'check-circle'
                : status === 'pending'
                  ? 'clock'
                  : status === 'changes_offered'
                    ? 'code-branch'
                    : 'times-circle'
            }
            themeName={sender.profileTheme}
            muted={status !== 'pending' && status !== 'changes_offered'}
          >
            {getBuildRewardReviewStatusLabel(status)}
          </BuildMessageCardChip>
          {status === 'changes_offered' && proposal ? (
            <BuildMessageCardChip icon="file" themeName={sender.profileTheme}>
              {formatBuildRewardProposalSummary(proposal)}
            </BuildMessageCardChip>
          ) : null}
          <BuildMessageCardChip icon="coins" themeName={sender.profileTheme}>
            {rulesSummary}
          </BuildMessageCardChip>
          {sourceVersionId > 0 ? (
            <BuildMessageCardChip
              icon="save"
              themeName={sender.profileTheme}
              muted
            >
              Saved version {sourceVersionId}
            </BuildMessageCardChip>
          ) : null}
        </>
      }
      actions={
        <>
          {/* A closed request has nothing left to decide, so the reviewer
              gets no button at all rather than a live-looking one. */}
          {canTryProposal && !confirmingDecline ? (
            <RewardProposalTryButton reviewId={reviewId} />
          ) : null}
          {isReviewer && status !== 'superseded' ? (
            <GameCTAButton
              variant={status === 'pending' ? 'success' : 'neutral'}
              size="md"
              icon="clipboard-check"
              shiny={status === 'pending'}
              onClick={() =>
                navigate(getBuildRewardReviewManagementPath(reviewId))
              }
            >
              {status === 'pending' ? 'Review & approve' : 'Open in Management'}
            </GameCTAButton>
          ) : null}
          {sentByMe && status === 'changes_offered' && !confirmingDecline ? (
            <>
              <GameCTAButton
                variant="neutral"
                size="md"
                icon="code-branch"
                onClick={() => setDiffOpen(true)}
              >
                See the changes
              </GameCTAButton>
              <GameCTAButton
                variant="success"
                size="md"
                icon="check"
                shiny
                loading={answering === 'accept'}
                onClick={() => handleAnswer('accept')}
              >
                Accept & go live
              </GameCTAButton>
              <GameCTAButton
                variant="neutral"
                size="md"
                onClick={() =>
                  setConfirmingDecline({
                    reviewId,
                    proposalRevision: Number(proposal?.revision)
                  })
                }
              >
                No thanks
              </GameCTAButton>
            </>
          ) : null}
          {sentByMe && status === 'changes_offered' && confirmingDecline ? (
            <>
              <GameCTAButton
                variant="orange"
                size="md"
                icon="exclamation-triangle"
                loading={answering === 'decline'}
                onClick={() => handleAnswer('decline')}
              >
                Yes, say no to the changes
              </GameCTAButton>
              <GameCTAButton
                variant="neutral"
                size="md"
                onClick={() => setConfirmingDecline(null)}
              >
                Keep thinking
              </GameCTAButton>
            </>
          ) : null}
          {sentByMe ? (
            <GameCTAButton
              variant="logoBlue"
              size="md"
              icon="external-link-alt"
              onClick={() => navigate(`/build/${buildId}`)}
            >
              Open app
            </GameCTAButton>
          ) : null}
        </>
      }
    >
      {diffOpen ? (
        <RewardProposalDiffModal
          load={() => loadProposal(reviewId) as Promise<RewardProposalDiff>}
          onClose={() => setDiffOpen(false)}
          footer={(diff) =>
            sentByMe && diff.status === 'changes_offered' ? (
              <GameCTAButton
                variant="success"
                size="md"
                icon="check"
                loading={answering === 'accept'}
                onClick={async () => {
                  setDiffOpen(false);
                  await handleAnswer('accept', diff);
                }}
              >
                Accept & go live
              </GameCTAButton>
            ) : null
          }
        />
      ) : null}
      <div className={appRowClass}>
        {thumbnailUrl ? (
          <img
            className={thumbClass}
            src={thumbnailUrl}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className={thumbFallbackClass} aria-hidden="true">
            <Icon icon="coins" />
          </div>
        )}
        <div className={messageClass}>
          <div className={leadClass}>
            {status === 'pending' ? (
              sentByMe ? (
                <>
                  You sent <strong>{title}</strong> for XP & Coin reward review.
                  An admin will check this saved version; you can keep building
                  while you wait.
                </>
              ) : (
                <>
                  <strong>{sender.username}</strong> sent{' '}
                  <strong>{title}</strong> for XP & Coin reward review.
                  {isReviewer
                    ? ' Approve or decline this exact saved release from the Management page.'
                    : ''}
                </>
              )
            ) : status === 'changes_offered' ? (
              sentByMe ? (
                <>
                  The admin read <strong>{title}</strong> and suggested some
                  changes. Try the suggested version and look at the changes,
                  then accept to go live with them, or say no to close this
                  request.
                  {confirmingDecline
                    ? ' Saying no keeps your app exactly as it is and publishes nothing.'
                    : ''}
                </>
              ) : (
                <>
                  You offered changes to <strong>{title}</strong>. If{' '}
                  <strong>{sender.username}</strong> accepts them, the changed
                  version is approved and published right away.
                </>
              )
            ) : status === 'approved' ? (
              <>
                This release of <strong>{title}</strong> is approved for
                rewards.{' '}
                {Number(review?.publishedArtifactVersionId || 0) > 0
                  ? 'Approval published this version. '
                  : ''}
                Later code changes need another review.
              </>
            ) : status === 'rejected' && declinedByCreator ? (
              <>
                {sentByMe ? 'You' : <strong>{sender.username}</strong>} said no
                to the admin’s suggested changes, so this request is closed and
                nothing was published.
                {sentByMe ? ' Send a new version whenever you’re ready.' : ''}
              </>
            ) : status === 'rejected' ? (
              <>
                This release of <strong>{title}</strong> was not approved.
                {sentByMe
                  ? ' Read the admin’s note, update your app, save, and send the new version for review.'
                  : ''}
              </>
            ) : status === 'revoked' ? (
              <>
                Reward approval for <strong>{title}</strong> was revoked, so the
                app no longer awards XP or Coins.
              </>
            ) : closedBySave ? (
              <>
                {sentByMe ? 'You' : <strong>{sender.username}</strong>} saved a
                newer version of <strong>{title}</strong> after sending this
                request, so it can no longer be published and the request is
                closed.
                {sentByMe
                  ? ' Send the version you want reviewed when it’s ready.'
                  : ' Nothing to approve; a new request will arrive if the creator sends one.'}
              </>
            ) : (
              <>
                A newer version of <strong>{title}</strong> was sent for review,
                so this request is closed.
              </>
            )}
          </div>
          {reason &&
          (status === 'rejected' ||
            status === 'revoked' ||
            status === 'changes_offered') ? (
            <div className={reasonClass}>
              <Icon icon="comment" />
              <span>{reason}</span>
            </div>
          ) : null}
          {answerError ? (
            <div className={reasonClass} role="alert">
              <Icon icon="exclamation-triangle" />
              <span>{answerError}</span>
            </div>
          ) : null}
          {hasRules ? (
            <div className={budgetClass}>
              <span>
                Per learner per day {formatAmount(budgets.userDailyXP)} XP ·{' '}
                {formatAmount(budgets.userDailyCoins)} Coins
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </BuildMessageCard>
  );

  async function handleAnswer(
    decision: 'accept' | 'decline',
    diff?: RewardProposalDiff
  ) {
    if (answering) return;
    setAnswering(decision);
    setAnswerError('');
    try {
      // The card itself updates through the server's live review push; the
      // response is the creator's settings, which this card does not show.
      await respondToProposal(
        buildId,
        decision,
        decision === 'decline' && confirmingDecline
          ? confirmingDecline
          : {
              reviewId: Number(diff?.reviewId ?? reviewId),
              proposalRevision: Number(
                diff?.proposalRevision ?? proposal?.revision
              )
            }
      );
    } catch (error: any) {
      setAnswerError(
        error?.message || 'Couldn’t send your answer right now. Try again.'
      );
    } finally {
      setAnswering('');
      setConfirmingDecline(null);
    }
  }
}

function formatAmount(value?: number | null) {
  return Number(value || 0).toLocaleString('en-US');
}

const appRowClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  border: 1px solid ${Color.logoBlue(0.18)};
  border-radius: 10px;
  background: ${Color.logoBlue(0.07)};
  padding: 0.85rem 0.95rem;
`;

const thumbClass = css`
  flex: 0 0 auto;
  width: 7.2rem;
  height: 7.2rem;
  border-radius: 8px;
  object-fit: cover;
  background: #fff;
  border: 1px solid ${Color.borderGray()};
  @media (max-width: ${mobileMaxWidth}) {
    width: 5.6rem;
    height: 5.6rem;
  }
`;

const thumbFallbackClass = css`
  flex: 0 0 auto;
  width: 7.2rem;
  height: 7.2rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  color: ${Color.logoBlue()};
  background: #fff;
  border: 1px solid ${Color.borderGray()};
  @media (max-width: ${mobileMaxWidth}) {
    width: 5.6rem;
    height: 5.6rem;
    font-size: 2rem;
  }
`;

const messageClass = css`
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const leadClass = css`
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.45;
  overflow-wrap: anywhere;
`;

const reasonClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
  > svg {
    color: ${Color.logoBlue()};
    flex: 0 0 auto;
    margin-top: 0.2rem;
  }
`;

const budgetClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 1rem;
  color: ${Color.gray()};
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
`;
