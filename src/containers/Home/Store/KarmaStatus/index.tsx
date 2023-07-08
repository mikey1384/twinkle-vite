import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import Loading from '~/components/Loading';
import KarmaExplanation from './KarmaExplanation';

export default function KarmaStatus() {
  const loadKarmaPoints = useAppContext(
    (v) => v.requestHelpers.loadKarmaPoints
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const { authLevel, userId, karmaPoints, userType } = useKeyContext(
    (v) => v.myState
  );
  const [loadingKarma, setLoadingKarma] = useState(false);
  const [numTwinklesRewarded, setNumTwinklesRewarded] = useState(0);
  const [numPostsRewarded, setNumPostsRewarded] = useState(0);
  const [numRecommended, setNumRecommended] = useState(0);
  const [numApprovedRecommendations, setNumApprovedRecommendations] =
    useState(0);

  useEffect(() => {
    if (userId) {
      handleLoadKarmaPoints();
    }
    async function handleLoadKarmaPoints() {
      setLoadingKarma(true);
      const {
        karmaPoints: kp,
        numTwinklesRewarded,
        numApprovedRecommendations,
        numPostsRewarded,
        numRecommended
      } = await loadKarmaPoints();
      onSetUserState({ userId, newState: { karmaPoints: kp } });
      if (authLevel < 2) {
        setNumTwinklesRewarded(numTwinklesRewarded);
        setNumApprovedRecommendations(numApprovedRecommendations);
      } else {
        setNumPostsRewarded(numPostsRewarded);
        setNumRecommended(numRecommended);
      }
      setLoadingKarma(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const youHaveKarmaPointsText = useMemo(() => {
    return SELECTED_LANGUAGE === 'kr'
      ? `회원님의 카마포인트는 ${addCommasToNumber(karmaPoints)}점입니다`
      : `You have ${addCommasToNumber(karmaPoints)} Karma Points`;
  }, [karmaPoints]);

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
      {loadingKarma ? (
        <Loading style={{ height: '10rem' }} />
      ) : (
        <>
          <p
            className={css`
              font-weight: bold;
              font-size: 2.2rem;
              color: ${Color.darkerGray()};
            `}
          >
            {youHaveKarmaPointsText}
          </p>
          <div
            className={css`
              margin-top: 2rem;
            `}
          >
            <KarmaExplanation
              authLevel={authLevel}
              karmaPoints={karmaPoints}
              numApprovedRecommendations={numApprovedRecommendations}
              numPostsRewarded={numPostsRewarded}
              numRecommended={numRecommended}
              numTwinklesRewarded={numTwinklesRewarded}
              userType={userType}
            />
          </div>
        </>
      )}
    </div>
  );
}
