import React from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { ADMIN_USER_ID } from '~/constants/defaultValues';
import {
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
  const reviewId = Number(review?.reviewId || 0);
  const buildId = Number(review?.buildId || 0);
  const title = String(review?.title || 'Untitled Build');
  const status = normalizeBuildRewardReviewStatus(review?.status);
  const reason = String(review?.reason || '').trim();
  const thumbnailUrl = String(review?.thumbnailUrl || '').trim();
  const sourceVersionId = Number(review?.sourceVersionId || 0);
  const budgets = review?.budgets || {};
  const sentByMe = Number(sender.id) === Number(myId);
  const isReviewer = Number(myId) === ADMIN_USER_ID;
  const rulesSummary = formatBuildRewardRulesSummary(review?.rules);

  if (!reviewId || !buildId) return null;

  return (
    <BuildMessageCard
      bannerIcon="coins"
      themeName={sender.profileTheme}
      bannerText={getBuildRewardReviewBannerText(status)}
      title={title}
      chips={
        <>
          <BuildMessageCardChip
            icon={
              status === 'approved'
                ? 'check-circle'
                : status === 'pending'
                  ? 'clock'
                  : 'times-circle'
            }
            themeName={sender.profileTheme}
            muted={status !== 'pending'}
          >
            {getBuildRewardReviewStatusLabel(status)}
          </BuildMessageCardChip>
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
          {isReviewer ? (
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
                  You sent <strong>{title}</strong> for XP & Coin reward
                  review. An admin will check this saved version; you can keep
                  building while you wait.
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
            ) : status === 'approved' ? (
              <>
                This saved release of <strong>{title}</strong> is approved.
                Publishing it turns rewards on; later code changes need another
                review.
              </>
            ) : status === 'rejected' ? (
              <>
                This release of <strong>{title}</strong> was not approved.
                {sentByMe
                  ? ' Lumine can help make the changes and send a new version.'
                  : ''}
              </>
            ) : status === 'revoked' ? (
              <>
                Reward approval for <strong>{title}</strong> was revoked, so
                the app no longer awards XP or Coins.
              </>
            ) : (
              <>
                A newer version of <strong>{title}</strong> was sent for
                review, so this request is closed.
              </>
            )}
          </div>
          {reason && (status === 'rejected' || status === 'revoked') ? (
            <div className={reasonClass}>
              <Icon icon="comment" />
              <span>{reason}</span>
            </div>
          ) : null}
          <div className={budgetClass}>
            <span>
              Daily budget {formatAmount(budgets.dailyXP)} XP ·{' '}
              {formatAmount(budgets.dailyCoins)} Coins
            </span>
            <span>
              Lifetime {formatAmount(budgets.lifetimeXP)} XP ·{' '}
              {formatAmount(budgets.lifetimeCoins)} Coins
            </span>
          </div>
        </div>
      </div>
    </BuildMessageCard>
  );
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
