import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { checkMultiMissionPassStatus } from '~/helpers/userDataHelpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import ProfilePic from '~/components/ProfilePic';
import localize from '~/constants/localize';

const completedLabel = localize('completed');
const grammarRankLabel = localize('grammarRank');

Cover.propTypes = {
  missionIds: PropTypes.array.isRequired,
  missionObj: PropTypes.object.isRequired,
  myAttempts: PropTypes.object.isRequired
};

export default function Cover({ missionIds, missionObj, myAttempts }) {
  const navigate = useNavigate();
  const { profilePicUrl, userId, username } = useKeyContext((v) => v.myState);
  const {
    cover: { color: coverColor },
    coverText: { color: coverTextColor, shadow: coverTextShadowColor }
  } = useKeyContext((v) => v.theme);
  const loadMissionRankings = useAppContext(
    (v) => v.requestHelpers.loadMissionRankings
  );
  const [numComplete, setNumComplete] = useState(0);
  const [myGrammarRank, setMyGrammarRank] = useState(0);
  useEffect(() => {
    let numCompleteCount = 0;
    for (let missionId of missionIds) {
      const mission = missionObj[missionId];
      if (mission.isMultiMission) {
        const { passed } = checkMultiMissionPassStatus({
          mission,
          myAttempts
        });
        if (passed) {
          numCompleteCount++;
        }
      } else if (myAttempts[missionId]?.status === 'pass') {
        numCompleteCount++;
      }
      if (mission.missionType === 'grammar') {
        handleLoadRanking(missionId, (myRank) => setMyGrammarRank(myRank));
      }
    }
    setNumComplete(numCompleteCount);

    async function handleLoadRanking(missionId, callback) {
      const { myRank } = await loadMissionRankings(missionId);
      callback(myRank);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionObj, missionIds]);

  const completedStatusLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          {missionIds.length} 미션 중 {numComplete} 완료
        </>
      );
    }
    return (
      <>
        Completed {numComplete} out of {missionIds.length} mission
        {missionIds.length > 1 ? 's' : ''}
      </>
    );
  }, [missionIds?.length, numComplete]);

  return (
    <div
      className={css`
        width: 100%;
        height: 15vh;
        display: flex;
        justify-content: space-between;
        background: ${Color[coverColor]()};
        padding: 0 5%;
        @media (max-width: ${mobileMaxWidth}) {
          height: 8rem;
          padding-left: 1rem;
          padding-right: 1rem;
        }
      `}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div>
          <ProfilePic
            className={css`
              width: 9rem;
              font-size: 2rem;
              z-index: 10;
              @media (max-width: ${mobileMaxWidth}) {
                width: 5rem;
                height: 5rem;
              }
            `}
            userId={userId}
            profilePicUrl={profilePicUrl}
          />
        </div>
        <div
          className={css`
            margin-left: 3rem;
            font-size: 3rem;
            color: ${Color[coverTextColor]()};
            ${coverTextShadowColor
              ? `text-shadow: 1px 1px ${Color[coverTextShadowColor]()};`
              : ''}
            font-weight: bold;
            @media (max-width: ${mobileMaxWidth}) {
              margin-left: 1.5rem;
              font-size: 1.7rem;
            }
          `}
        >
          {username}
        </div>
      </div>
      <div
        className={css`
          height: 100%;
          display: flex;
          align-items: center;
          color: ${Color[coverTextColor]()};
          ${coverTextShadowColor
            ? `text-shadow: 1px 1px ${Color[coverTextShadowColor]()};`
            : ''}
          justify-content: center;
          flex-direction: column;
          font-weight: bold;
          font-size: 2rem;
          line-height: 2;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.3rem;
          }
        `}
      >
        {numComplete > 0 && (
          <div>
            <span className="mobile">
              {completedLabel}: {numComplete}/{missionIds.length}
            </span>
            <span className="desktop">{completedStatusLabel}</span>
          </div>
        )}
        {!!myGrammarRank && myGrammarRank < 31 && (
          <div
            className={css`
              cursor: pointer;
              &:hover {
                text-decoration: underline;
              }
              @media (max-width: ${mobileMaxWidth}) {
                &:hover {
                  text-decoration: none;
                }
              }
            `}
            onClick={() => navigate('/missions/grammar')}
            style={{ color: myGrammarRank === 1 ? Color.gold() : '#fff' }}
          >
            {grammarRankLabel} #{myGrammarRank}
          </div>
        )}
      </div>
    </div>
  );
}
