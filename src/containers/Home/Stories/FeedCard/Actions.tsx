import React from 'react';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function Actions({
  commentsCount,
  commentLabel = 'Comment',
  likesCount,
  onOpen,
  rewardsCount
}: {
  commentsCount: number;
  commentLabel?: string;
  likesCount: number;
  onOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
  rewardsCount: number;
}) {
  return (
    <div className={`${actionsClass} home-feed-card__actions`}>
      <div className="home-feed-card__counts">
        <span className="home-feed-card__count-pill like">
          <Icon icon="thumbs-up" />
          <strong>Like</strong>
          <em>{likesCount}</em>
        </span>
        <span className="home-feed-card__count-pill comment">
          <Icon icon="comment-alt" />
          <strong>{commentLabel}</strong>
          <em>{commentsCount}</em>
        </span>
        <span className="home-feed-card__count-pill reward">
          <Icon icon="certificate" />
          <strong>Reward</strong>
          <em>{rewardsCount}</em>
        </span>
      </div>
      <button
        className="home-feed-card__open"
        data-feed-card-interactive="true"
        type="button"
        onClick={onOpen}
      >
        Open <Icon icon="arrow-right" />
      </button>
    </div>
  );
}

const actionsClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 0 0.2rem;
  .home-feed-card__counts {
    display: flex;
    align-items: center;
    gap: 0.42rem;
    min-width: 0;
    color: ${Color.darkGray()};
    font-size: 1rem;
    font-weight: 700;
    line-height: 1;
    .home-feed-card__count-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.28rem;
      min-width: 0;
      height: 1.5rem;
      padding: 0.12rem 0.4rem;
      border: 1px solid ${Color.borderGray()};
      border-radius: 0.65rem;
      background: #fff;
      box-shadow: 0 0.05rem 0 rgba(17, 24, 39, 0.08);
      strong {
        overflow: hidden;
        font-size: 1rem;
        font-weight: 850;
        line-height: 1;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;
      }
      em {
        font-size: 1rem;
        font-style: normal;
        font-weight: 850;
        line-height: 1;
      }
      svg {
        flex-shrink: 0;
        font-size: 1rem;
      }
    }
    .home-feed-card__count-pill.like {
      border-color: ${Color.logoBlue(0.24)};
      background: ${Color.logoBlue(0.08)};
      color: ${Color.logoBlue()};
    }
    .home-feed-card__count-pill.comment {
      border-color: rgba(92, 92, 92, 0.2);
      color: ${Color.darkGray()};
    }
    .home-feed-card__count-pill.reward {
      border-color: ${Color.pink(0.28)};
      background: ${Color.pink(0.08)};
      color: ${Color.pink()};
    }
  }
  .home-feed-card__open {
    appearance: none;
    border: 0;
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0;
    color: ${Color.logoBlue()};
    font-size: 1.3rem;
    font-weight: 800;
    line-height: 1;
    font-family: inherit;
    white-space: nowrap;
  }
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.5rem;
    .home-feed-card__counts {
      gap: 0.32rem;
    }
    .home-feed-card__counts .home-feed-card__count-pill {
      padding: 0.12rem 0.36rem;
      strong {
        display: none;
      }
    }
    .home-feed-card__open {
      font-size: 1.1rem;
    }
  }
`;
