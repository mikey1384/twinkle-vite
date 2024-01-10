import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import Loading from '~/components/Loading';
import KarmaExplanationModal from './KarmaExplanationModal';

export default function KarmaStatus({
  karmaPoints,
  isAchievementsLoaded,
  level,
  loading,
  numApprovedRecommendations,
  numPostsRewarded,
  numRecommended,
  numTwinklesRewarded,
  title,
  userId,
  userType
}: {
  karmaPoints: number;
  isAchievementsLoaded: boolean;
  level: number;
  loading: boolean;
  numApprovedRecommendations: number;
  numPostsRewarded: number;
  numRecommended: number;
  numTwinklesRewarded: number;
  title: string;
  userId: number;
  userType: string;
}) {
  const [karmaExplanationShown, setKarmaExplanationShown] = useState(false);

  const displayedKarmaPoints = useMemo(() => {
    if (karmaPoints) {
      return addCommasToNumber(karmaPoints);
    }
    return '0';
  }, [karmaPoints]);

  const youHaveKarmaPointsText = useMemo(() => {
    return SELECTED_LANGUAGE === 'kr'
      ? `회원님의 카마포인트는 ${displayedKarmaPoints}점입니다`
      : `You have ${displayedKarmaPoints} Karma Points`;
  }, [displayedKarmaPoints]);

  if (!userId) return null;

  return (
    <div
      className={css`
        background: #fff;
        padding: 1rem;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
          border-left: 0;
          border-right: 0;
        }
      `}
    >
      {loading || !isAchievementsLoaded ? (
        <Loading style={{ height: '10rem' }} />
      ) : (
        <div>
          <div
            className={css`
              font-weight: bold;
              font-size: 2.2rem;
            `}
          >
            {youHaveKarmaPointsText}
            <div>
              <a
                style={{
                  cursor: 'pointer',
                  fontSize: '1.5rem'
                }}
                onClick={() => setKarmaExplanationShown(true)}
              >
                tap here to learn why
              </a>
            </div>
          </div>
          {karmaExplanationShown && (
            <div
              className={css`
                margin-top: 2rem;
              `}
            >
              <KarmaExplanationModal
                userLevel={level}
                displayedKarmaPoints={displayedKarmaPoints}
                numApprovedRecommendations={numApprovedRecommendations}
                numPostsRewarded={numPostsRewarded}
                numRecommended={numRecommended}
                numTwinklesRewarded={numTwinklesRewarded}
                onHide={() => setKarmaExplanationShown(false)}
                userType={userType}
                userTitle={title}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
