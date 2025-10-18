import React, { useMemo, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import UserListModal from '~/components/Modals/UserListModal';
import { Color, wideBorderRadius } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { isSupermod } from '~/helpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';
import { useRoleColor } from '~/theme/useRoleColor';
import { css } from '@emotion/css';

const recommendedByLabel = localize('recommendedBy');
const youLabel = localize('you');
const othersLabel = localize('others');

export default function RecommendationStatus({
  contentType,
  recommendations = [],
  style,
  theme
}: {
  contentType: string;
  recommendations: any[];
  style?: React.CSSProperties;
  theme?: any;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const { defaultOpacity: rewardableDefaultOpacity, getColor: getRewardableColor } =
    useRoleColor('rewardableRecommendation', {
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

  const andLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      if (recommendationsByUsertypeExceptMe.length > 2) {
        return '님 외';
      }
      return ',';
    }
    return ' and';
  }, [recommendationsByUsertypeExceptMe.length]);

  const rewardableRecommendationColor = useMemo(
    () => getRewardableColor(),
    [getRewardableColor]
  );
  const rewardableBorderColor = useMemo(
    () => getRewardableColor(Math.min(1, rewardableOpacity + 0.14)),
    [getRewardableColor, rewardableOpacity]
  );

  const containerCss = useMemo(
    () => css`
      padding: 0.6rem 1rem;
      width: calc(100% - 1.2rem);
      margin: 0.6rem;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0.4rem;
      font-size: 1.4rem;
      background: ${isRewardable ? rewardableRecommendationColor : '#fff'};
      border: 1px solid ${
        isRewardable ? rewardableBorderColor : Color.borderGray(0.5)
      };
      border-radius: ${wideBorderRadius};
      color: ${isRewardable ? Color.black() : Color.darkBlueGray()};
    `,
    [isRewardable, rewardableRecommendationColor, rewardableBorderColor]
  );

  return recommendations.length > 0 ? (
    <div className={containerCss} style={style}>
      <div>
        {recommendedByLabel}{' '}
        {myRecommendation && (
          <b
            style={{ color: isRewardable ? Color.black() : Color.darkBlueGray() }}
          >
            {youLabel}
          </b>
        )}
        {mostRecentRecommenderOtherThanMe && (
          <>
            {myRecommendation &&
              (recommendationsByUsertypeExceptMe.length > 1
                ? ', '
                : `${andLabel} `)}
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
            {andLabel}{' '}
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
            {andLabel}{' '}
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
