import React, { memo, useEffect, useState, useMemo, useCallback } from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth, Color, wideBorderRadius } from '~/constants/css';
import Icon from '~/components/Icon';
import { addCommasToNumber, stringIsEmpty } from '~/helpers/stringHelpers';
import { returnMaxRewards } from '~/constants/defaultValues';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Comment from './Comment';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useKeyContext } from '~/contexts';
import ScopedTheme from '~/theme/ScopedTheme';
import { useRoleColor } from '~/theme/useRoleColor';
import RewardProgressBar from './RewardProgressBar';

const INITIAL_LOAD_COUNT = 1;
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
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const infoRole = useRoleColor('info', {
    themeName: theme || profileTheme,
    fallback: 'logoBlue'
  });
  const rewardRole = useRoleColor('reward', {
    themeName: infoRole.themeName,
    fallback: 'orange'
  });
  const infoColor = infoRole.colorKey || 'logoBlue';
  const levelRole = useRoleColor(`level${rewardLevel}`, {
    themeName: rewardRole.themeName,
    fallback: 'logoBlue'
  });
  // Container background only tinted when full; otherwise neutral
  const [numLoaded, setNumLoaded] = useState(INITIAL_LOAD_COUNT);
  const scopedTheme = rewardRole.themeName;

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

  const isComplete = useMemo(
    () => maxRewards > 0 && amountRewarded >= maxRewards,
    [amountRewarded, maxRewards]
  );

  const containerBg = isComplete
    ? levelRole.getColor(0.12) || Color.logoBlue(0.12)
    : '#fff';
  const containerBorder = levelRole.getColor(0.4) || Color.logoBlue(0.4);

  const handleLoadMore = useCallback(() => {
    setNumLoaded((prev) => prev + LOAD_MORE_COUNT);
  }, []);

  useEffect(() => {
    const rewardsWithComment = sortedRewards.filter(
      (reward) => !stringIsEmpty(reward.rewardComment)
    );
    if (rewardsWithComment.length > INITIAL_LOAD_COUNT) {
      setNumLoaded((numLoaded) => Math.max(numLoaded, INITIAL_LOAD_COUNT + 2));
    }
  }, [sortedRewards]);

  if (!Array.isArray(rewards) || rewards.length === 0) return null;

  return (
    <ErrorBoundary componentPath="RewardStatus/index">
      <ScopedTheme theme={scopedTheme}>
        <div
          style={style}
          className={`${className || ''} ${css`
            font-size: 1.2rem;
            padding: 0.6rem 1rem;
            width: 100%;
            margin: 0.6rem 0;
            color: ${Color.darkBlueGray()};
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;
            min-height: 3.6rem;
            background: ${containerBg};
            border: 1px solid ${containerBorder};
            border-radius: ${wideBorderRadius};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.05rem;
              padding: 0.8rem 0.9rem;
              gap: 0.6rem;
              justify-content: center;
            }
          `}`}
        >
          <div
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.45rem;
              background: #fff;
              color: ${Color.darkBlueGray()};
              border-radius: 999px;
              padding: 0.35rem 0.85rem;
              font-weight: 700;
              letter-spacing: 0.18px;
              border: 1px solid ${levelRole.getColor() || Color.logoBlue()};
              box-shadow: none;
              font-size: 0.95em;
              flex-shrink: 0;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 0.92em;
                padding: 0.3rem 0.75rem;
              }
            `}
          >
            <Icon
              icon="sparkles"
              style={{
                fontSize: '1em',
                color: levelRole.getColor() || Color.logoBlue()
              }}
            />
            <span>
              {addCommasToNumber(amountRewarded)} /{' '}
              {addCommasToNumber(maxRewards)}
            </span>
          </div>
          <div
            className={css`
              flex: 1 1 auto;
              min-width: 0;
              display: flex;
              align-items: center;
            `}
          >
            <RewardProgressBar
              amount={amountRewarded}
              max={maxRewards}
              color={levelRole.getColor() || Color.logoBlue()}
            />
          </div>
        </div>
      </ScopedTheme>
      <div
        className={css`
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--ui-border);
        `}
      >
        {numLoaded < sortedRewards.length && (
          <LoadMoreButton
            color={infoColor}
            label={
              sortedRewards.length - numLoaded === 1
                ? 'Show more'
                : `Show more (${sortedRewards.length - numLoaded})`
            }
            filled
            style={{
              fontSize: '1.3rem',
              marginBottom: '1rem'
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
      </div>
    </ErrorBoundary>
  );
}

export default memo(RewardStatus);
