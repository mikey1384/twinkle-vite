import React, { useMemo, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import UserListModal from '~/components/Modals/UserListModal';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { useTheme } from '~/helpers/hooks';
import {
  SELECTED_LANGUAGE,
  TEACHER_AUTH_LEVEL
} from '~/constants/defaultValues';
import localize from '~/constants/localize';

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
  const { userId, profileTheme } = useKeyContext((v) => v.myState);
  const {
    rewardableRecommendation: {
      color: rewardableColor,
      opacity: rewardableOpacity
    }
  } = useTheme(theme || profileTheme);
  const [userListModalShown, setUserListModalShown] = useState(false);
  const recommendationsByUsertype = useMemo(() => {
    const result = [...recommendations];
    result.sort(
      (
        a: { authLevel: number; level: number },
        b: { authLevel: number; level: number }
      ) => {
        const bRecommenderLevel = (b.authLevel || 0) + 1 || b.level;
        const aRecommenderLevel = (a.authLevel || 0) + 1 || a.level;
        return bRecommenderLevel - aRecommenderLevel;
      }
    );
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
    const myRecommendationLevel =
      (myRecommendation?.authLevel || 0) + 1 || myRecommendation?.level || 0;
    const mostRecentRewardEnabledRecommenderOtherThanMeLevel =
      (mostRecentRewardEnabledRecommenderOtherThanMe?.authLevel || 0) + 1 ||
      mostRecentRewardEnabledRecommenderOtherThanMe?.level ||
      0;
    return (
      contentType !== 'pass' &&
      contentType !== 'aiStory' &&
      ((myRecommendationLevel >= TEACHER_AUTH_LEVEL &&
        !myRecommendation?.rewardDisabled) ||
        (mostRecentRewardEnabledRecommenderOtherThanMeLevel >=
          TEACHER_AUTH_LEVEL &&
          !mostRecentRewardEnabledRecommenderOtherThanMe?.rewardDisabled))
    );
  }, [
    contentType,
    mostRecentRewardEnabledRecommenderOtherThanMe,
    myRecommendation?.authLevel,
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
    () => Color[rewardableColor](rewardableOpacity),
    [rewardableColor, rewardableOpacity]
  );

  return recommendations.length > 0 ? (
    <div
      style={{
        padding: '0.5rem',
        ...(isRewardable ? { background: rewardableRecommendationColor } : {}),
        borderTop: `1px solid ${Color.borderGray()}`,
        borderBottom: `1px solid ${Color.borderGray()}`,
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '1.5rem',
        ...style
      }}
    >
      <div>
        {recommendedByLabel}{' '}
        {myRecommendation && (
          <b
            style={{
              color: isRewardable ? '#000' : Color.black()
            }}
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
              color={isRewardable ? '#000' : Color.black()}
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
              color={isRewardable ? '#000' : Color.black()}
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
              style={{ cursor: 'pointer', fontWeight: 'bold', color: '#000' }}
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
