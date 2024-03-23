import React, { memo, useState, useMemo } from 'react';
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
  style?: any;
  theme?: any;
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    info: { color: infoColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
  const [numLoaded, setNumLoaded] = useState(2);
  rewards = useMemo(() => {
    const rewardsWithComment = rewards.filter(
      (reward) => !stringIsEmpty(reward.rewardComment)
    );
    if (rewardsWithComment.length > 2) {
      setNumLoaded(3);
    }
    const rewardsWithoutComment = rewards.filter((reward) =>
      stringIsEmpty(reward.rewardComment)
    );
    return rewardsWithoutComment.concat(rewardsWithComment);
  }, [rewards]);
  const maxRewards = useMemo(
    () => returnMaxRewards({ rewardLevel }),
    [rewardLevel]
  );
  const amountRewarded = useMemo(() => {
    let result = rewards.reduce(
      (prev, reward) => prev + reward.rewardAmount,
      0
    );
    result = Math.min(result, maxRewards);
    return result;
  }, [maxRewards, rewards]);

  const rewardStatusLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          총 {amountRewarded}개의 트윈클(
          {addCommasToNumber(amountRewarded * 200)} XP)이 지급되었습니다 (최대{' '}
          {maxRewards}개)
        </>
      );
    }
    return (
      <>
        {amountRewarded} Twinkle
        {amountRewarded > 1 ? 's' : ''} (
        {addCommasToNumber(amountRewarded * 200)} XP) rewarded out of max{' '}
        {maxRewards}
      </>
    );
  }, [amountRewarded, maxRewards]);

  return rewards && rewards.length > 0 ? (
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
          background: ${amountRewarded === maxRewards
            ? Color.gold()
            : amountRewarded >= 25
            ? Color.brownOrange()
            : Color.logoBlue()};
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
      {numLoaded < rewards.length && (
        <LoadMoreButton
          color={infoColor}
          label={showMoreRewardRecordsLabel}
          filled
          style={{
            fontSize: '1.3rem',
            marginTop: '1rem'
          }}
          onClick={() => setNumLoaded(numLoaded + 3)}
        />
      )}
      {rewards
        .filter((reward, index) => index > rewards.length - numLoaded - 1)
        .map((reward) => (
          <Comment
            contentType={contentType}
            contentId={contentId}
            noMarginForEditButton={noMarginForEditButton}
            key={reward.id}
            reward={reward}
            onEditDone={onCommentEdit}
          />
        ))}
    </ErrorBoundary>
  ) : null;
}

export default memo(RewardStatus);
