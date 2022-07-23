import { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { karmaMultiplier, SELECTED_LANGUAGE } from '~/constants/defaultValues';
import Loading from '~/components/Loading';
import localize from '~/constants/localize';

const karmaCalculationLabel =
  SELECTED_LANGUAGE === 'kr' ? (
    <>
      회원님의 카마포인트 = 회원님이 보상한{' '}
      <b style={{ color: Color.pink() }}>트윈클 개수</b> + (
      {karmaMultiplier.recommendation.student} × 선생님 유저들이 승인한 회원님의{' '}
      <b style={{ color: Color.brownOrange() }}>추천 개수</b>)
    </>
  ) : (
    <>
      Your Karma Points = Total number of Twinkles you{' '}
      <b style={{ color: Color.pink() }}>rewarded</b> + (
      {karmaMultiplier.recommendation.student} × total number of your{' '}
      <b style={{ color: Color.brownOrange() }}>recommendations</b> that were
      approved by teachers)
    </>
  );
const rewardedTwinklesLabel =
  SELECTED_LANGUAGE === 'kr' ? (
    <>
      회원님이 보상한 <b style={{ color: Color.pink() }}>트윈클 개수</b>
    </>
  ) : (
    <>
      Total number of Twinkles you{' '}
      <b style={{ color: Color.pink() }}>rewarded</b>
    </>
  );

const approvedRecommendationsLabel =
  SELECTED_LANGUAGE === 'kr' ? (
    <>
      선생님 유저들이 승인한 회원님의{' '}
      <b style={{ color: Color.brownOrange() }}>추천 개수</b>
    </>
  ) : (
    <>
      Total number of{' '}
      <b style={{ color: Color.brownOrange() }}>recommendations</b> approved by
      teachers
    </>
  );

const karmaPointsLabel = localize('karmaPoints');

export default function KarmaStatus() {
  const loadKarmaPoints = useAppContext(
    (v) => v.requestHelpers.loadKarmaPoints
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const { authLevel, userType, userId, karmaPoints } = useKeyContext(
    (v) => v.myState
  );
  const [loadingKarma, setLoadingKarma] = useState(false);
  const [numTwinklesRewarded, setNumTwinklesRewarded] = useState(0);
  const [numApprovedRecommendations, setNumApprovedRecommendations] =
    useState(0);
  const [numPostsRewarded, setNumPostsRewarded] = useState(0);
  const [numRecommended, setNumRecommended] = useState(0);

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

  const instructionText = useMemo(() => {
    if (authLevel < 2) {
      return <span>{karmaCalculationLabel}</span>;
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <span>
          회원님의 카마포인트 = (회원님이 보상한 <b>게시물</b>의 총 개수 ×{' '}
          {karmaMultiplier.post}) + (회원님이 추천한 <b>게시물</b>의 총 개수 ×{' '}
          {karmaMultiplier.recommendation.teacher})
        </span>
      );
    }
    return (
      <span>
        Your Karma Points = (Total number of posts you{' '}
        <b style={{ color: Color.pink() }}>rewarded</b> × {karmaMultiplier.post}
        ) + (Total number of posts you{' '}
        <b style={{ color: Color.brownOrange() }}>recommended</b> ×{' '}
        {karmaMultiplier.recommendation.teacher})
      </span>
    );
  }, [authLevel]);

  const calculationText = useMemo(() => {
    if (authLevel < 2) {
      return (
        <div style={{ fontSize: '1.5rem', marginTop: '3rem' }}>
          <p>
            {rewardedTwinklesLabel}: {addCommasToNumber(numTwinklesRewarded)}
          </p>
          <p>
            {approvedRecommendationsLabel}:{' '}
            {addCommasToNumber(numApprovedRecommendations)}
          </p>
          <p style={{ marginTop: '1rem', fontSize: '1.7rem' }}>
            {numTwinklesRewarded} + ({karmaMultiplier.recommendation.student} ×{' '}
            {numApprovedRecommendations}) ={' '}
            <b style={{ color: Color.darkerGray() }}>
              {addCommasToNumber(karmaPoints)} {karmaPointsLabel}
            </b>
          </p>
        </div>
      );
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <div style={{ fontSize: '1.5rem', marginTop: '3rem' }}>
          <p>
            회원님이 보상한 게시물의 총 개수:{' '}
            {addCommasToNumber(numPostsRewarded)}
          </p>
          <p>
            회원님이 추천 게시물의 총 개수: {addCommasToNumber(numRecommended)}
          </p>
          <p style={{ marginTop: '1rem', fontSize: '1.7rem' }}>
            ({numPostsRewarded} × {karmaMultiplier.post}) + ({numRecommended} ×{' '}
            {karmaMultiplier.recommendation.teacher}) ={' '}
            <b>
              {addCommasToNumber(karmaPoints)} {karmaPointsLabel}
            </b>
          </p>
        </div>
      );
    }
    return (
      <div style={{ fontSize: '1.5rem', marginTop: '3rem' }}>
        <p>
          Total number of posts you{' '}
          <b style={{ color: Color.pink() }}>rewarded</b>:{' '}
          {addCommasToNumber(numPostsRewarded)}
        </p>
        <p>
          Total number of posts you{' '}
          <b style={{ color: Color.brownOrange() }}>recommended</b>:{' '}
          {addCommasToNumber(numRecommended)}
        </p>
        <p style={{ marginTop: '1rem', fontSize: '1.7rem' }}>
          ({numPostsRewarded} × {karmaMultiplier.post}) + ({numRecommended} ×{' '}
          {karmaMultiplier.recommendation.teacher}) ={' '}
          <b>
            {addCommasToNumber(karmaPoints)} {karmaPointsLabel}
          </b>
        </p>
      </div>
    );
  }, [
    authLevel,
    karmaPoints,
    numApprovedRecommendations,
    numPostsRewarded,
    numRecommended,
    numTwinklesRewarded
  ]);

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
            {userType && (
              <p
                className={css`
                  font-size: 2rem;
                  font-weight: bold;
                `}
              >
                {userType}
              </p>
            )}
            <p
              className={css`
                font-size: 1.7rem;
              `}
            >
              {instructionText}
            </p>
            <div>{calculationText}</div>
          </div>
        </>
      )}
    </div>
  );
}
