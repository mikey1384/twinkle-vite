import React from 'react';
import { css } from '@emotion/css';
import AchievementItem from '~/components/AchievementItem';
import Icon from '~/components/Icon';
import { Color, borderRadius } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Content } from '~/types';

export default function CompactAchievementCard({
  achievement,
  onClick
}: {
  achievement: Content;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button type="button" className={compactAchievementClass} onClick={onClick}>
      <div className="compact-achievement__badge">
        <AchievementItem
          isSmall
          isThumb
          achievement={achievement}
          thumbSize="5.8rem"
        />
      </div>
      <div className="compact-achievement__copy">
        <span className="compact-achievement__chip">
          <Icon icon="certificate" />
          Achievement
        </span>
        <strong>
          {achievement.title || 'Achievement'}
          {achievement.ap ? (
            <span>({addCommasToNumber(Number(achievement.ap))} AP)</span>
          ) : null}
        </strong>
        {achievement.description ? <p>{achievement.description}</p> : null}
      </div>
    </button>
  );
}

const compactAchievementClass = css`
  appearance: none;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(6.2rem, 28%) minmax(0, 1fr);
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  height: 100%;
  min-height: 10.5rem;
  padding: 0.85rem;
  overflow: hidden;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  font: inherit;
  text-align: left;
  cursor: pointer;
  .compact-achievement__badge {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: center;
  }
  .compact-achievement__badge > div {
    padding: 0;
  }
  .compact-achievement__copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: center;
    gap: 0.42rem;
  }
  .compact-achievement__chip {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 0.38rem;
    min-height: 1.9rem;
    padding: 0.32rem 0.58rem;
    border: 1px solid ${Color.gold(0.36)};
    border-radius: 999px;
    background: ${Color.gold(0.14)};
    color: ${Color.gold()};
    font-size: 1.05rem;
    font-weight: 850;
    line-height: 1;
    white-space: nowrap;
  }
  strong {
    overflow: hidden;
    color: ${Color.black()};
    font-size: max(1.9rem, 19px);
    font-weight: 850;
    line-height: 1.18;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  strong span {
    margin-left: 0.38rem;
    color: ${Color.darkGray()};
    font-size: 1.12rem;
    font-weight: 700;
  }
  p {
    margin: 0;
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: max(1.8rem, 18px);
    font-weight: 400;
    line-height: 1.34;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
`;
