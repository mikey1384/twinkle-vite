import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { karmaMultiplier, SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

export default function KarmaExplanation({
  authLevel,
  karmaPoints,
  numApprovedRecommendations,
  numPostsRewarded,
  numRecommended,
  numTwinklesRewarded
}: {
  authLevel: number;
  karmaPoints: number;
  numApprovedRecommendations: number;
  numPostsRewarded: number;
  numRecommended: number;
  numTwinklesRewarded: number;
}) {
  const karmaPointsLabel = localize('karmaPoints');
  const calculationText = useMemo(() => {
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
          <b style={{ color: Color.brownOrange() }}>recommendations</b> approved
          by teachers
        </>
      );
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
    karmaPointsLabel,
    numApprovedRecommendations,
    numPostsRewarded,
    numRecommended,
    numTwinklesRewarded
  ]);

  const instructionText = useMemo(() => {
    const karmaCalculationLabel =
      SELECTED_LANGUAGE === 'kr' ? (
        <>
          회원님의 카마포인트 = 회원님이 보상한{' '}
          <b style={{ color: Color.pink() }}>트윈클 개수</b> + (
          {karmaMultiplier.recommendation.student} × 선생님 유저들이 승인한
          회원님의 <b style={{ color: Color.brownOrange() }}>추천 개수</b>)
        </>
      ) : (
        <>
          Your Karma Points = Total number of Twinkles you{' '}
          <b style={{ color: Color.pink() }}>rewarded</b> + (
          {karmaMultiplier.recommendation.student} × total number of your{' '}
          <b style={{ color: Color.brownOrange() }}>recommendations</b> that
          were approved by teachers)
        </>
      );
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

  return (
    <p
      className={css`
        font-size: 1.7rem;
      `}
    >
      {instructionText}
      {calculationText}
    </p>
  );
}
