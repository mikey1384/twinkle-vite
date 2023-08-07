import React, { useMemo } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import {
  karmaMultiplier,
  SELECTED_LANGUAGE,
  TEACHER_AUTH_LEVEL
} from '~/constants/defaultValues';
import localize from '~/constants/localize';

export default function KarmaExplanationModal({
  userLevel,
  displayedKarmaPoints,
  numApprovedRecommendations,
  numPostsRewarded,
  numRecommended,
  numTwinklesRewarded,
  onHide,
  userType
}: {
  userLevel: number;
  displayedKarmaPoints: string;
  numApprovedRecommendations: number;
  numPostsRewarded: number;
  numRecommended: number;
  numTwinklesRewarded: number;
  onHide: () => void;
  userType: string;
}) {
  const karmaPointsLabel = localize('karmaPoints');
  const displayedNumTwinklesRewarded = useMemo(() => {
    return addCommasToNumber(numTwinklesRewarded);
  }, [numTwinklesRewarded]);
  const displayedNumApprovedRecommendations = useMemo(() => {
    return addCommasToNumber(numApprovedRecommendations);
  }, [numApprovedRecommendations]);
  const displayedNumPostsRewarded = useMemo(() => {
    return addCommasToNumber(numPostsRewarded);
  }, [numPostsRewarded]);
  const displayedNumRecommended = useMemo(() => {
    return addCommasToNumber(numRecommended);
  }, [numRecommended]);

  const instructionText = useMemo(() => {
    const karmaCalculationLabel =
      SELECTED_LANGUAGE === 'kr' ? (
        <>
          회원님의 카마포인트 = 회원님이 보상한{' '}
          <b
            className={css`
              color: ${Color.pink()};
            `}
          >
            트윈클 개수
          </b>{' '}
          + ({karmaMultiplier.recommendation.student} × 선생님 유저들이 승인한
          회원님의{' '}
          <b
            className={css`
              color: ${Color.brownOrange()};
            `}
          >
            추천 개수
          </b>
          )
        </>
      ) : (
        <>
          Your Karma Points = Total number of Twinkles you{' '}
          <b
            className={css`
              color: ${Color.pink()};
            `}
          >
            rewarded
          </b>{' '}
          + ({karmaMultiplier.recommendation.student} × total number of your{' '}
          <b
            className={css`
              color: ${Color.brownOrange()};
            `}
          >
            recommendations
          </b>{' '}
          that were approved by teachers)
        </>
      );
    if (userLevel < TEACHER_AUTH_LEVEL) {
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
        <b
          className={css`
            color: ${Color.pink()};
          `}
        >
          rewarded
        </b>{' '}
        × {karmaMultiplier.post}) + (Total number of posts you{' '}
        <b
          className={css`
            color: ${Color.brownOrange()};
          `}
        >
          recommended
        </b>{' '}
        × {karmaMultiplier.recommendation.teacher})
      </span>
    );
  }, [userLevel]);

  const calculationText = useMemo(() => {
    const rewardedTwinklesLabel =
      SELECTED_LANGUAGE === 'kr' ? (
        <>
          회원님이 보상한{' '}
          <b
            className={css`
              color: ${Color.pink()};
            `}
          >
            트윈클 개수
          </b>
        </>
      ) : (
        <>
          Total number of Twinkles you{' '}
          <b
            className={css`
              color: ${Color.pink()};
            `}
          >
            rewarded
          </b>
        </>
      );
    const approvedRecommendationsLabel =
      SELECTED_LANGUAGE === 'kr' ? (
        <>
          선생님 유저들이 승인한 회원님의{' '}
          <b
            className={css`
              color: ${Color.brownOrange()};
            `}
          >
            추천 개수
          </b>
        </>
      ) : (
        <>
          Total number of{' '}
          <b
            className={css`
              color: ${Color.brownOrange()};
            `}
          >
            recommendations
          </b>{' '}
          approved by teachers
        </>
      );
    if (userLevel < TEACHER_AUTH_LEVEL) {
      return (
        <div
          className={css`
            font-size: 1.5rem;
            margin-top: 3rem;
          `}
        >
          <p>
            {rewardedTwinklesLabel}: {displayedNumTwinklesRewarded}
          </p>
          <p>
            {approvedRecommendationsLabel}:{' '}
            {displayedNumApprovedRecommendations}
          </p>
          <p
            className={css`
              margin-top: 1rem;
              font-size: 1.7rem;
            `}
          >
            {numTwinklesRewarded} + ({karmaMultiplier.recommendation.student} ×{' '}
            {numApprovedRecommendations}) ={' '}
            <b
              className={css`
                color: ${Color.darkerGray()};
              `}
            >
              {displayedKarmaPoints} {karmaPointsLabel}
            </b>
          </p>
        </div>
      );
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <div
          className={css`
            font-size: 1.5rem;
            margin-top: 3rem;
          `}
        >
          <p>회원님이 보상한 게시물의 총 개수: {displayedNumPostsRewarded}</p>
          <p>회원님이 추천 게시물의 총 개수: {displayedNumRecommended}</p>
          <p
            className={css`
              margin-top: 1rem;
              font-size: 1.7rem;
            `}
          >
            ({numPostsRewarded} × {karmaMultiplier.post}) + ({numRecommended} ×{' '}
            {karmaMultiplier.recommendation.teacher}) ={' '}
            <b>
              {displayedKarmaPoints} {karmaPointsLabel}
            </b>
          </p>
        </div>
      );
    }
    return (
      <div
        className={css`
          font-size: 1.5rem;
          margin-top: 3rem;
        `}
      >
        <p>
          Total number of posts you{' '}
          <b
            className={css`
              color: ${Color.pink()};
            `}
          >
            rewarded
          </b>
          : {displayedNumPostsRewarded}
        </p>
        <p>
          Total number of posts you{' '}
          <b
            className={css`
              color: ${Color.brownOrange()};
            `}
          >
            recommended
          </b>
          : {displayedNumRecommended}
        </p>
        <p
          className={css`
            margin-top: 1rem;
            font-size: 1.7rem;
          `}
        >
          ({numPostsRewarded} × {karmaMultiplier.post}) + ({numRecommended} ×{' '}
          {karmaMultiplier.recommendation.teacher}) ={' '}
          <b>
            {displayedKarmaPoints} {karmaPointsLabel}
          </b>
        </p>
      </div>
    );
  }, [
    userLevel,
    displayedKarmaPoints,
    karmaPointsLabel,
    numApprovedRecommendations,
    displayedNumApprovedRecommendations,
    numPostsRewarded,
    displayedNumPostsRewarded,
    numRecommended,
    displayedNumRecommended,
    numTwinklesRewarded,
    displayedNumTwinklesRewarded
  ]);

  return (
    <Modal onHide={onHide}>
      <header>Your Karma Points</header>
      <main>
        <p
          className={css`
            font-size: 1.7rem;
          `}
        >
          {userType && (
            <p
              className={css`
                font-size: 2rem;
                font-weight: bold;
                margin-bottom: 1rem;
              `}
            >
              {userType}
            </p>
          )}
          {instructionText}
          {calculationText}
        </p>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
