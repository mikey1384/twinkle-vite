import React, { memo, useEffect, useState, useMemo, useCallback } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
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

  const backgroundColor = useMemo(() => {
    if (amountRewarded === maxRewards) return Color.gold();
    if (amountRewarded >= 25) return Color.brownOrange();
    return Color.logoBlue();
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
          font-size: 1.6rem;
          padding: 0.4rem 1rem 0.2rem 1rem;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: ${backgroundColor};
        `}`}
      >
        <Starmarks stars={amountRewarded} />
        <div
          className={css`
            font-size: 1.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.2rem;
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
