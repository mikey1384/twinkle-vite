import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { videoRewardHash } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const continueLabel = localize('continue');
const watchingLabel = localize('watching');
const perMinuteLabel = localize('perMinute');

export default function RewardAmountInfo({
  rewardLevel,
  startingPosition = 0
}: {
  rewardLevel: number;
  startingPosition?: number;
}) {
  const theme = useKeyContext((v) => v.theme);
  const xpLevelColor = useMemo(
    () => theme[`level${rewardLevel}`]?.color,
    [rewardLevel, theme]
  );
  const rewardBoostLvl = useKeyContext((v) => v.myState.rewardBoostLvl);
  const watching = startingPosition > 0;
  const xpRewardAmount = useMemo(
    () => rewardLevel * (videoRewardHash?.[rewardBoostLvl]?.xp || 20),
    [rewardBoostLvl, rewardLevel]
  );
  const coinRewardAmount = useMemo(
    () => videoRewardHash?.[rewardBoostLvl]?.coin || 2,
    [rewardBoostLvl]
  );
  const rewardAmountLabel = useMemo(() => {
    return addCommasToNumber(xpRewardAmount);
  }, [xpRewardAmount]);

  return (
    <div
      style={{ flexGrow: 1 }}
      className={css`
        font-size: 1.3rem;
        height: 2.7rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1rem;
          height: 2rem;
        }
      `}
    >
      <div
        className={css`
          height: 100%;
          background: ${watching ? Color.darkBlue() : Color[xpLevelColor]()};
          color: #fff;
          font-weight: bold;
          display: flex;
          flex-grow: 1;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        `}
      >
        <div
          className={css`
            margin-left: 0.7rem;
          `}
        >
          {watching && (
            <span>
              {continueLabel}
              {` ${watchingLabel}`} (
            </span>
          )}
          <span>{rewardAmountLabel} XP</span>
          {rewardLevel > 2 ? (
            <>
              {' '}
              <span>&</span>
              <Icon
                style={{ marginLeft: '0.5rem' }}
                icon={['far', 'badge-dollar']}
              />
              <span
                className={css`
                  margin-left: 0.2rem;
                `}
              >
                {coinRewardAmount}
              </span>
            </>
          ) : (
            ''
          )}
          {watching ? <span>{`)`}</span> : <span> {perMinuteLabel}</span>}
        </div>
      </div>
    </div>
  );
}
