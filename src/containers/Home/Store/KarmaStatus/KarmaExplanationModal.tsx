import React, { useMemo } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { isSupermod } from '~/helpers';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { karmaMultiplier } from '~/constants/defaultValues';
export default function KarmaExplanationModal({
  userLevel,
  displayedKarmaPoints,
  numApprovedRecommendations,
  numPostsRewarded,
  numRecommended,
  numTwinklesRewarded,
  onHide,
  userType,
  userTitle
}: {
  userLevel: number;
  displayedKarmaPoints: string;
  numApprovedRecommendations: number;
  numPostsRewarded: number;
  numRecommended: number;
  numTwinklesRewarded: number;
  onHide: () => void;
  userType: string;
  userTitle: string;
}) {
  const karmaPointsLabel = 'Karma Points';
  const displayedTitle = useMemo(() => {
    return userTitle || userType;
  }, [userTitle, userType]);
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
    const karmaCalculationLabel = (
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
    if (!isSupermod(userLevel)) {
      return <span>{karmaCalculationLabel}</span>;
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
    const rewardedTwinklesLabel = (
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
    const approvedRecommendationsLabel = (
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
    if (!isSupermod(userLevel)) {
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
    <Modal isOpen onClose={onHide} hasHeader={false} bodyPadding={0}>
      <LegacyModalLayout>
        <header>Your Karma Points</header>
        <main>
          <div
            className={css`
              font-size: 1.7rem;
            `}
          >
            {displayedTitle && (
              <p
                className={css`
                  font-size: 2rem;
                  font-weight: bold;
                  margin-bottom: 1rem;
                `}
              >
                {displayedTitle}
              </p>
            )}
            {instructionText}
            {calculationText}
          </div>
        </main>
        <footer>
          <Button
            variant="ghost"
            style={{ marginRight: '0.7rem' }}
            onClick={onHide}
          >
            Close
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );
}
