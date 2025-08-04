import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function RewardText({
  checked,
  xpReward = 0,
  coinReward = 0,
  isRepeating,
  labelClassName,
  rewardClassName,
  style
}: {
  checked?: boolean;
  xpReward?: number;
  coinReward?: number;
  isRepeating?: boolean;
  labelClassName?: string;
  rewardClassName?: string;
  style?: React.CSSProperties;
}) {
  const displayedXpReward = useMemo(
    () => addCommasToNumber(xpReward),
    [xpReward]
  );
  const displayedCoinReward = useMemo(
    () => addCommasToNumber(coinReward),
    [coinReward]
  );
  return xpReward || coinReward ? (
    <div style={{ ...style, display: 'flex' }}>
      <p
        className={
          labelClassName ||
          css`
            font-size: 1.7rem;
          `
        }
        style={{ fontWeight: 'bold' }}
      >
        {isRepeating ? 'Repeat ' : ''}Reward:
      </p>
      <div
        className={
          rewardClassName ||
          css`
            font-size: 1.5rem;
          `
        }
        style={{ display: 'flex', alignItems: 'center', marginLeft: '0.7rem' }}
      >
        {!!xpReward && (
          <div>
            <span style={{ fontWeight: 'bold', color: Color.logoGreen() }}>
              {displayedXpReward}
            </span>{' '}
            <span style={{ color: Color.gold(), fontWeight: 'bold' }}>XP</span>
            {coinReward && ','}
          </div>
        )}
        {!!coinReward && (
          <div
            style={{
              color: Color.brownOrange(),
              marginLeft: xpReward ? '0.8rem' : 0,
              fontWeight: 'bold'
            }}
          >
            <Icon icon={['far', 'badge-dollar']} /> {displayedCoinReward}
          </div>
        )}
        {checked && (
          <Icon
            icon="check"
            style={{ marginLeft: '1rem', color: Color.green() }}
          />
        )}
      </div>
    </div>
  ) : null;
}
