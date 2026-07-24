import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { cardLevelHash } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';

export default function CompactEffortStrip({
  className,
  rewardLevel
}: {
  className?: string;
  rewardLevel: number;
}) {
  const level = Math.max(1, Math.floor(Number(rewardLevel || 1)));
  const starCount = Math.min(level, 5);
  const colorKey = cardLevelHash[level]?.color || 'logoBlue';
  const colorGetter = (Color as any)[colorKey];
  const color =
    typeof colorGetter === 'function' ? colorGetter() : Color.logoBlue();
  const starColor = level >= 5 ? '#fff' : '#ffd700';

  return (
    <div
      className={`${compactEffortStripClass} home-feed-card__compact-effort ${
        className || ''
      }`}
      style={
        {
          '--effort-color': color,
          '--effort-star-color': starColor
        } as React.CSSProperties & {
          '--effort-color': string;
          '--effort-star-color': string;
        }
      }
    >
      <span className="home-feed-card__compact-effort-left">
        <span className="home-feed-card__compact-effort-label">
          Effort Level:
        </span>
        <span className="home-feed-card__compact-effort-stars">
          {Array.from({ length: starCount }, (_, index) => (
            <Icon key={index} icon="star" />
          ))}
        </span>
      </span>
      <span className="home-feed-card__compact-effort-xp">
        Earn up to {addCommasToNumber(level * 2000)} XP
      </span>
    </div>
  );
}

const compactEffortStripClass = css`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  align-self: stretch;
  gap: 0.75rem;
  max-width: 100%;
  min-height: 2.9rem;
  padding: 0.48rem 0.82rem;
  border: 0;
  border-radius: 0.78rem;
  background: var(--effort-color);
  color: #fff;
  line-height: 1;
  box-shadow: 0 0.08rem 0 rgba(17, 24, 39, 0.08);

  .home-feed-card__compact-effort-left {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: 0.42rem;
  }

  .home-feed-card__compact-effort-label,
  .home-feed-card__compact-effort-xp {
    font-size: 1.1rem;
    font-weight: 850;
    white-space: nowrap;
  }

  .home-feed-card__compact-effort-label {
    color: #fff;
  }

  .home-feed-card__compact-effort-stars {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.18rem;
    overflow: hidden;
    color: var(--effort-star-color, #ffd700);
    font-size: 1.2rem;
  }

  .home-feed-card__compact-effort-xp {
    min-width: 0;
    overflow: hidden;
    color: #fff;
    text-align: right;
    text-overflow: ellipsis;
  }
`;
