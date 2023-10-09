import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE, TEACHER_LEVEL } from '~/constants/defaultValues';
import Loading from '~/components/Loading';
import KarmaExplanationModal from './KarmaExplanationModal';

export default function KarmaStatus() {
  const loadKarmaPoints = useAppContext(
    (v) => v.requestHelpers.loadKarmaPoints
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const { level, userId, karmaPoints, userType } = useKeyContext(
    (v) => v.myState
  );
  const [karmaExplanationShown, setKarmaExplanationShown] = useState(false);
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
      if (level < TEACHER_LEVEL) {
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
      {loadingKarma ? (
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
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
