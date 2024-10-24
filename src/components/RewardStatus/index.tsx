import React, { memo, useEffect, useState, useMemo, useCallback } from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber, stringIsEmpty } from '~/helpers/stringHelpers';
import { returnTheme } from '~/helpers';
import { returnMaxRewards, SELECTED_LANGUAGE } from '~/constants/defaultValues';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Comment from './Comment';
import ErrorBoundary from '~/components/ErrorBoundary';
import Starmarks from './Starmarks';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const showMoreRewardRecordsLabel = localize('showMoreRewardRecords');

const INITIAL_LOAD_COUNT = 2;
const LOAD_MORE_COUNT = 3;

function RewardStatus({
  contentType,
  contentId,
  className,
  rewardLevel,
  noMarginForEditButton,
  onCommentEdit,
  rewards = [],
  style,
  theme
}: {
  contentType: string;
  contentId: number;
  className?: string;
  rewardLevel: number;
  noMarginForEditButton?: boolean;
  onCommentEdit?: () => void;
  rewards?: any[];
  style?: React.CSSProperties;
  theme?: any;
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    info: { color: infoColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);

  const [numLoaded, setNumLoaded] = useState(INITIAL_LOAD_COUNT);

  const sortedRewards = useMemo(() => {
    if (!Array.isArray(rewards)) return [];
    return [...rewards].sort((a, b) => {
      const aHasComment = !stringIsEmpty(a.rewardComment);
      const bHasComment = !stringIsEmpty(b.rewardComment);
      return aHasComment === bHasComment ? 0 : aHasComment ? 1 : -1;
    });
  }, [rewards]);

  const maxRewards = useMemo(
    () => returnMaxRewards({ rewardLevel }),
    [rewardLevel]
  );

  const amountRewarded = useMemo(() => {
    if (!Array.isArray(rewards)) return 0;
    const total = rewards.reduce(
      (prev, reward) => prev + (reward.rewardAmount || 0),
      0
    );
    return Math.min(total, maxRewards);
  }, [maxRewards, rewards]);

  const rewardStatusLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `총 ${amountRewarded}개의 트윈클(${addCommasToNumber(
        amountRewarded * 200
      )} XP)이 지급되었습니다 (최대 ${maxRewards}개)`;
    }
    return `${amountRewarded} Twinkle${
      amountRewarded > 1 ? 's' : ''
    } (${addCommasToNumber(
      amountRewarded * 200
    )} XP) rewarded out of max ${maxRewards}`;
  }, [amountRewarded, maxRewards]);

  const handleLoadMore = useCallback(() => {
    setNumLoaded((prev) => prev + LOAD_MORE_COUNT);
  }, []);

  useEffect(() => {
    const rewardsWithComment = sortedRewards.filter(
      (reward) => !stringIsEmpty(reward.rewardComment)
    );
    if (rewardsWithComment.length >= 3) {
      setNumLoaded((numLoaded) => Math.max(numLoaded, 3));
    }
  }, [sortedRewards]);

  if (!Array.isArray(rewards) || rewards.length === 0) return null;

  return (
    <ErrorBoundary componentPath="RewardStatus/index">
      <div
        style={style}
        className={`${className} ${css`
          font-size: 1.3rem;
          padding: 0.7rem 0.8rem;
          color: rgba(255, 255, 255, 0.92);
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(5, 75, 170, 0.5);
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            sans-serif;
          letter-spacing: 0.2px;
          transform: translateY(-0.3px);
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08),
            0 1px 1px rgba(0, 0, 0, 0.12), 0 -1px 1px rgba(255, 255, 255, 0.02);

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              180deg,
              rgba(205, 210, 255, 0.1) 0%,
              transparent 50%
            );
            pointer-events: none;
          }

          &::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 12%;
            width: 76%;
            height: 5px;
            background: rgba(0, 0, 0, 0.08);
            filter: blur(2px);
            border-radius: 50%;
            z-index: -1;

            @media (max-width: ${mobileMaxWidth}) {
              height: 4px;
              background: rgba(0, 0, 0, 0.06);
              filter: blur(1.5px);
              width: 70%;
              left: 15%;
            }
          }

          @media (max-width: ${mobileMaxWidth}) {
            padding: 0.8rem 1rem;
            font-size: 1.3rem;
            transform: translateY(-0.2px);
            box-shadow: 0 1px 1px rgba(0, 0, 0, 0.06),
              0 1px 1px rgba(0, 0, 0, 0.1), 0 -1px 1px rgba(255, 255, 255, 0.01);
          }
        `}`}
      >
        <Starmarks stars={amountRewarded} />
        <div
          className={css`
            font-size: 1.15rem;
            font-weight: 400;
            margin-top: 0.3rem;
            opacity: 0.85;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.2rem;
              margin-top: 0.4rem;
              line-height: 1.4;
            }
          `}
        >
          {rewardStatusLabel}
        </div>
      </div>
      {numLoaded < sortedRewards.length && (
        <LoadMoreButton
          color={infoColor}
          label={showMoreRewardRecordsLabel}
          filled
          style={{
            fontSize: '1.3rem',
            marginTop: '1rem'
          }}
          onClick={handleLoadMore}
        />
      )}
      {sortedRewards.slice(-numLoaded).map((reward) => (
        <Comment
          key={reward.id}
          contentType={contentType}
          contentId={contentId}
          noMarginForEditButton={noMarginForEditButton}
          reward={reward}
          onEditDone={onCommentEdit}
        />
      ))}
    </ErrorBoundary>
  );
}

export default memo(RewardStatus);
