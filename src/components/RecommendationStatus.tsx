import React, { useMemo, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import UserListModal from '~/components/Modals/UserListModal';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { isSupermod } from '~/helpers';
import { useRoleColor } from '~/theme/useRoleColor';
import { css } from '@emotion/css';

const recommendedByLabel = 'Recommended by';
const youLabel = 'you';
const othersLabel = ' others';

export default function RecommendationStatus({
  contentType,
  recommendations = [],
  style,
  theme,
  className,
  compact = false
}: {
  contentType: string;
  recommendations: any[];
  style?: React.CSSProperties;
  theme?: any;
  className?: string;
  compact?: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const {
    defaultOpacity: rewardableDefaultOpacity,
    getColor: getRewardableColor
  } = useRoleColor('rewardableRecommendation', {
    themeName: theme,
    fallback: 'yellow'
  });
  const rewardableOpacity =
    rewardableDefaultOpacity !== undefined ? rewardableDefaultOpacity : 0.25;
  const [userListModalShown, setUserListModalShown] = useState(false);
  const recommendationsByUsertype = useMemo(() => {
    const result = [...recommendations];
    result.sort((a: { level: number }, b: { level: number }) => {
      return b.level - a.level;
    });
    return result;
  }, [recommendations]);

  const myRecommendation = useMemo(
    () =>
      recommendationsByUsertype.filter(
        (recommendation) => recommendation.userId === userId
      )[0],
    [recommendationsByUsertype, userId]
  );

  const recommendationsByUsertypeExceptMe = useMemo(
    () =>
      recommendationsByUsertype.filter(
        (recommendation) => recommendation.userId !== userId
      ),
    [recommendationsByUsertype, userId]
  );

  const mostRecentRecommenderOtherThanMe = useMemo(
    () => recommendationsByUsertypeExceptMe?.[0],
    [recommendationsByUsertypeExceptMe]
  );

  const mostRecentRewardEnabledRecommenderOtherThanMe = useMemo(
    () =>
      recommendationsByUsertypeExceptMe.filter(
        (recommendation) => !recommendation.rewardDisabled
      )?.[0],
    [recommendationsByUsertypeExceptMe]
  );

  const isRewardable = useMemo(() => {
    return (
      contentType !== 'pass' &&
      contentType !== 'aiStory' &&
      ((isSupermod(myRecommendation?.level) &&
        !myRecommendation?.rewardDisabled) ||
        (isSupermod(mostRecentRewardEnabledRecommenderOtherThanMe?.level) &&
          !mostRecentRewardEnabledRecommenderOtherThanMe?.rewardDisabled))
    );
  }, [
    contentType,
    mostRecentRewardEnabledRecommenderOtherThanMe,
    myRecommendation?.level,
    myRecommendation?.rewardDisabled
  ]);

  const rewardableRecommendationColor = useMemo(
    () => getRewardableColor(),
    [getRewardableColor]
  );
  const rewardableBorderColor = useMemo(
    () => getRewardableColor(Math.min(1, rewardableOpacity + 0.14)),
    [getRewardableColor, rewardableOpacity]
  );

  const baseFontSize = compact ? '1.2rem' : '1.4rem';
  const basePadding = compact ? '0.5rem 0.9rem' : '0.6rem 1rem';
  const baseGap = compact ? '0.35rem' : '0.4rem';
  const mobileFontSize = compact ? '1.05rem' : '1.2rem';
  const mobilePadding = compact ? '0.45rem 0.8rem' : '0.55rem 0.9rem';
  const mobileGap = compact ? '0.3rem' : '0.35rem';

  const containerCss = useMemo(
    () => css`
      padding: ${basePadding};
      width: 100%;
      margin: 0.6rem 0;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: ${baseGap};
      font-size: ${baseFontSize};
      background: ${isRewardable ? rewardableRecommendationColor : '#fff'};
      border: 1px solid
        ${isRewardable ? rewardableBorderColor : 'var(--ui-border)'};
      border-radius: ${borderRadius};
      color: ${isRewardable ? Color.black() : Color.darkBlueGray()};
      @media (max-width: ${mobileMaxWidth}) {
        padding: ${mobilePadding};
        gap: ${mobileGap};
        font-size: ${mobileFontSize};
      }
    `,
    [
      baseFontSize,
      baseGap,
      basePadding,
      isRewardable,
      mobileFontSize,
      mobileGap,
      mobilePadding,
      rewardableBorderColor,
      rewardableRecommendationColor
    ]
  );

  return recommendations.length > 0 ? (
    <div
      className={`${containerCss} ${className ? className : ''}`}
      style={style}
    >
      <div>
        {recommendedByLabel}{' '}
        {myRecommendation && (
          <b
            style={{
              color: isRewardable ? Color.black() : Color.darkBlueGray()
            }}
          >
            {youLabel}
          </b>
        )}
        {mostRecentRecommenderOtherThanMe && (
          <>
            {myRecommendation &&
              (recommendationsByUsertypeExceptMe.length > 1 ? ', ' : ' and ')}
            <UsernameText
              color={isRewardable ? 'black' : 'darkBlueGray'}
              user={{
                username: mostRecentRecommenderOtherThanMe.username,
                id: mostRecentRecommenderOtherThanMe.userId
              }}
            />
          </>
        )}
        {recommendationsByUsertypeExceptMe.length === 2 && (
          <>
            {' '}
            and{' '}
            <UsernameText
              color={isRewardable ? 'black' : 'darkBlueGray'}
              user={{
                username: recommendationsByUsertypeExceptMe[1].username,
                id: recommendationsByUsertypeExceptMe[1].userId
              }}
            />
          </>
        )}
        {recommendationsByUsertypeExceptMe.length > 2 && (
          <>
            {' '}
            and{' '}
            <a
              style={{
                cursor: 'pointer',
                fontWeight: 'bold',
                color: isRewardable ? Color.black() : Color.darkBlueGray()
              }}
              onClick={() => setUserListModalShown(true)}
            >
              {recommendationsByUsertypeExceptMe.length - 1}
              {othersLabel}
            </a>
          </>
        )}
      </div>
      {userListModalShown && (
        <UserListModal
          onHide={() => setUserListModalShown(false)}
          title={`People who recommended this ${contentType}`}
          users={recommendationsByUsertype.map((user) => ({
            ...user,
            id: user.userId
          }))}
        />
      )}
    </div>
  ) : null;
}
