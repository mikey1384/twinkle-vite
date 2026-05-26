import React, { useRef, useState } from 'react';
import Icon from '~/components/Icon';
import ViewCount from '~/components/ViewCount';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import { isMobile } from '~/helpers';

const deviceIsMobile = typeof navigator !== 'undefined' && isMobile(navigator);

export default function Actions({
  commentsCount,
  commentDisabled,
  commentLabel = 'Comment',
  likedByUser,
  likeDisabled,
  likeLoading,
  likesCount,
  onComment,
  onLike,
  onOpen,
  openProminent,
  onRecommend,
  onReward,
  recommendedByUser,
  recommendDisabled,
  recommendShown = true,
  recommendationsCount,
  rewardedByUser,
  rewardDisableReason,
  rewardDisabled,
  rewardShown = true,
  rewardsCount,
  signInRequired,
  viewCount
}: {
  commentsCount: number;
  commentDisabled?: boolean;
  commentLabel?: string;
  likedByUser: boolean;
  likeDisabled?: boolean;
  likeLoading?: boolean;
  likesCount: number;
  onComment: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onLike: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
  openProminent?: boolean;
  onRecommend: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onReward: (event: React.MouseEvent<HTMLButtonElement>) => void;
  recommendedByUser: boolean;
  recommendDisabled?: boolean;
  recommendShown?: boolean;
  recommendationsCount: number;
  rewardedByUser: boolean;
  rewardDisableReason?: string;
  rewardDisabled?: boolean;
  rewardShown?: boolean;
  rewardsCount: number;
  signInRequired?: boolean;
  viewCount?: number;
}) {
  const [rewardReasonShown, setRewardReasonShown] = useState(false);
  const rewardActionRef = useRef<HTMLDivElement | null>(null);
  const rewardBlockedReason =
    rewardDisableReason ||
    (rewardDisabled ? 'You cannot reward this right now.' : '');
  const rewardIsBlocked = Boolean(
    !signInRequired && rewardDisabled && rewardBlockedReason
  );

  return (
    <div className={`${actionsClass} home-feed-card__actions`}>
      <div className="home-feed-card__counts">
        <button
          aria-pressed={likedByUser}
          className={`home-feed-card__action-button like ${
            likedByUser ? 'selected' : ''
          }`}
          data-feed-card-interactive="true"
          disabled={likeLoading || (!signInRequired && likeDisabled)}
          type="button"
          onClick={onLike}
        >
          <span className="home-feed-card__action-icon">
            <Icon icon="thumbs-up" />
          </span>
          <strong>Like</strong>
          <em>{likesCount}</em>
        </button>
        <button
          className="home-feed-card__action-button comment"
          data-feed-card-interactive="true"
          disabled={!signInRequired && commentDisabled}
          type="button"
          onClick={onComment}
        >
          <span className="home-feed-card__action-icon">
            <Icon icon="comment-alt" />
          </span>
          <strong>{commentLabel}</strong>
          <em>{commentsCount}</em>
        </button>
        {rewardShown && (
          <div
            ref={rewardActionRef}
            className="home-feed-card__action-wrapper"
            onMouseEnter={handleRewardMouseEnter}
            onMouseLeave={handleRewardMouseLeave}
          >
            <button
              aria-disabled={rewardIsBlocked || undefined}
              aria-pressed={rewardedByUser}
              className={`home-feed-card__action-button reward ${
                rewardedByUser ? 'selected' : ''
              } ${rewardIsBlocked ? 'blocked' : ''}`}
              data-feed-card-interactive="true"
              type="button"
              onClick={handleRewardClick}
            >
              <span className="home-feed-card__action-icon">
                <Icon icon="certificate" />
              </span>
              <strong>Reward</strong>
              <em>{rewardsCount}</em>
            </button>
            <FullTextReveal
              alignment="center"
              anchorRef={rewardActionRef}
              dismissTouchMoveThreshold={10}
              onDismiss={handleRewardReasonDismiss}
              show={rewardReasonShown && rewardIsBlocked}
              text={rewardBlockedReason}
              style={{
                minWidth: '14rem',
                width: 'max-content',
                maxWidth: '32rem',
                fontSize: '1.2rem'
              }}
            />
          </div>
        )}
        {recommendShown && (
          <button
            aria-pressed={recommendedByUser}
            className={`home-feed-card__action-button recommend ${
              recommendedByUser ? 'selected' : ''
            }`}
            data-feed-card-interactive="true"
            disabled={!signInRequired && recommendDisabled}
            type="button"
            onClick={onRecommend}
          >
            <span className="home-feed-card__action-icon">
              <Icon icon="heart" />
            </span>
            <strong>Recommend</strong>
            <em>{recommendationsCount}</em>
          </button>
        )}
        <ViewCount
          count={viewCount}
          minimumCount={10}
          variant="feedAction"
          className="home-feed-card__action-button view-count"
          iconClassName="home-feed-card__action-icon"
        />
      </div>
      <button
        className={`home-feed-card__open${
          openProminent ? ' home-feed-card__open--show-more' : ''
        }`}
        data-feed-card-interactive="true"
        type="button"
        onClick={onOpen}
      >
        <span>{openProminent ? 'Show More' : 'Open'}</span>
        <Icon icon="arrow-right" />
      </button>
    </div>
  );

  function handleRewardMouseEnter() {
    if (!deviceIsMobile && rewardIsBlocked) {
      setRewardReasonShown(true);
    }
  }

  function handleRewardMouseLeave() {
    if (!deviceIsMobile) {
      setRewardReasonShown(false);
    }
  }

  function handleRewardClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!rewardIsBlocked) {
      onReward(event);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setRewardReasonShown((shown) => !shown);
  }

  function handleRewardReasonDismiss() {
    setRewardReasonShown(false);
  }
}

const actionsClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 0.05rem 0.2rem 0;
  .home-feed-card__counts {
    display: flex;
    align-items: center;
    gap: 0.62rem;
    min-width: 0;
    color: ${Color.darkGray()};
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1;
    .home-feed-card__action-wrapper {
      display: inline-flex;
      align-items: center;
    }
    .home-feed-card__action-button {
      appearance: none;
      display: inline-flex;
      align-items: center;
      gap: 0.46rem;
      min-width: 0;
      height: 2.6rem;
      padding: 0.32rem 0.72rem 0.32rem 0.52rem;
      border: 1px solid rgba(148, 163, 184, 0.34);
      border-radius: 0.95rem;
      background: linear-gradient(180deg, #fff, #f8fafc);
      box-shadow:
        0 0.08rem 0 rgba(17, 24, 39, 0.06),
        0 0.28rem 0.9rem rgba(17, 24, 39, 0.05);
      cursor: pointer;
      color: inherit;
      font-family: inherit;
      transition:
        border-color 0.16s ease,
        box-shadow 0.16s ease,
        transform 0.16s ease,
        background 0.16s ease;
      --home-feed-action-color: ${Color.darkGray()};
      .home-feed-card__action-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.58rem;
        height: 1.58rem;
        flex: 0 0 1.58rem;
        border-radius: 0.55rem;
        background: var(--home-feed-action-color);
        color: #fff;
      }
      strong {
        overflow: hidden;
        font-size: 1.1rem;
        font-weight: 800;
        line-height: 1;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      em {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.45rem;
        height: 1.45rem;
        padding: 0 0.36rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.74);
        box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
        font-size: 1rem;
        font-style: normal;
        font-weight: 850;
        line-height: 1;
      }
      svg {
        flex-shrink: 0;
        font-size: 0.9rem;
      }
      @media (hover: hover) and (pointer: fine) {
        &:not(:disabled):not(.blocked):not(.view-count):hover {
          box-shadow:
            0 0.08rem 0 rgba(17, 24, 39, 0.08),
            0 0.38rem 1rem rgba(17, 24, 39, 0.08);
          transform: translateY(-1px);
        }
      }
      &.blocked {
        cursor: default;
      }
      &:disabled {
        cursor: default;
        opacity: 0.56;
      }
    }
    .home-feed-card__action-button.like {
      --home-feed-action-color: ${Color.logoBlue()};
      border-color: ${Color.logoBlue(0.28)};
      background: linear-gradient(
        180deg,
        ${Color.logoBlue(0.1)},
        ${Color.logoBlue(0.04)}
      );
      color: ${Color.logoBlue()};
    }
    .home-feed-card__action-button.like.selected {
      background: ${Color.logoBlue()};
      color: #fff;
    }
    .home-feed-card__action-button.selected .home-feed-card__action-icon {
      background: #fff;
      color: var(--home-feed-action-color);
    }
    .home-feed-card__action-button.selected em {
      background: rgba(255, 255, 255, 0.18);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.34);
      color: #fff;
    }
    .home-feed-card__action-button.comment {
      --home-feed-action-color: ${Color.darkGray()};
      border-color: rgba(71, 85, 105, 0.22);
      color: ${Color.darkGray()};
    }
    .home-feed-card__action-button.reward {
      --home-feed-action-color: ${Color.pink()};
      border-color: ${Color.pink(0.3)};
      background: linear-gradient(
        180deg,
        ${Color.pink(0.1)},
        ${Color.pink(0.04)}
      );
      color: ${Color.pink()};
    }
    .home-feed-card__action-button.reward.selected {
      background: ${Color.pink()};
      color: #fff;
    }
    .home-feed-card__action-button.recommend {
      --home-feed-action-color: ${Color.rose()};
      border-color: ${Color.rose(0.32)};
      background: linear-gradient(
        180deg,
        ${Color.rose(0.11)},
        ${Color.rose(0.04)}
      );
      color: ${Color.rose()};
    }
    .home-feed-card__action-button.recommend.selected {
      background: ${Color.rose()};
      color: #fff;
    }
    .home-feed-card__action-button.view-count {
      --home-feed-action-color: ${Color.darkGray()};
      border-color: rgba(71, 85, 105, 0.2);
      background: rgba(248, 250, 252, 0.82);
      color: ${Color.darkGray()};
      cursor: default;
    }
  }
  .home-feed-card__open {
    appearance: none;
    border: 1px solid ${Color.logoBlue(0.22)};
    border-radius: 0.95rem;
    background: ${Color.logoBlue(0.06)};
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 2.6rem;
    padding: 0.42rem 0.82rem;
    color: ${Color.logoBlue()};
    font-size: 1.15rem;
    font-weight: 800;
    line-height: 1;
    font-family: inherit;
    white-space: nowrap;
    box-shadow: 0 0.24rem 0.8rem ${Color.logoBlue(0.08)};
    transition:
      background 0.16s ease,
      border-color 0.16s ease,
      transform 0.16s ease;
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: ${Color.logoBlue(0.1)};
        border-color: ${Color.logoBlue(0.34)};
        transform: translateY(-1px);
      }
    }
    &.home-feed-card__open--show-more {
      min-height: 2.8rem;
      padding: 0.46rem 1rem;
      border-color: ${Color.logoBlue(0.5)};
      background: ${Color.logoBlue()};
      color: #fff;
      font-size: 1.2rem;
      box-shadow: 0 0.32rem 1rem ${Color.logoBlue(0.18)};
      @media (hover: hover) and (pointer: fine) {
        &:hover {
          background: ${Color.logoBlue(0.9)};
          border-color: ${Color.logoBlue(0.62)};
        }
      }
    }
  }
  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
    gap: 0.55rem;
    .home-feed-card__counts {
      flex-wrap: wrap;
      gap: 0.48rem;
    }
    .home-feed-card__counts .home-feed-card__action-button {
      height: 2.75rem;
      padding: 0.32rem 0.58rem;
      .home-feed-card__action-icon {
        width: 1.75rem;
        height: 1.75rem;
        flex-basis: 1.75rem;
      }
      em {
        min-width: 1.55rem;
        height: 1.55rem;
        font-size: 1.05rem;
      }
      strong {
        display: none;
      }
    }
    .home-feed-card__open {
      min-height: 2.75rem;
      padding: 0.42rem 0.74rem;
      font-size: 1.12rem;
    }
    .home-feed-card__open.home-feed-card__open--show-more {
      min-height: 2.85rem;
      padding: 0.44rem 0.86rem;
      font-size: 1.12rem;
    }
  }
`;
