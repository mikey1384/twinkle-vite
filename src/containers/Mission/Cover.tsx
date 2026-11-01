import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { checkMultiMissionPassStatus } from '~/helpers/userDataHelpers';
import ProfilePic from '~/components/ProfilePic';
import ThemeCoverBackdrop from '~/components/ThemeCoverBackdrop';
import { platinumCoverInk } from '~/components/PlatinumSurface/styles';
import { platinumCoverOf } from '~/constants/profileThemes';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { resolveColorValue } from '~/theme/resolveColor';

const completedLabel = 'Completed';
const grammarRankLabel = 'Grammar Rank';

export default function Cover({
  missionIds,
  missionObj,
  myAttempts
}: {
  missionIds: number[];
  missionObj: { [key: string]: any };
  myAttempts: { [key: string]: any };
}) {
  const navigate = useNavigate();
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const profileCoverUrl = useKeyContext((v) => v.myState.profileCoverUrl);
  const profileCoverPosition = useKeyContext(
    (v) => v.myState.profileCoverPosition
  );
  const profileCoverShine = useKeyContext((v) => v.myState.profileCoverShine);
  const {
    color: coverColorValue,
    colorKey: coverColorKey,
    themeName: coverThemeName
  } = useRoleColor('cover', {
    themeName: profileTheme,
    fallback: 'logoBlue'
  });
  const coverTextRole = useRoleColor('coverText', {
    themeName: coverThemeName,
    fallback: 'white'
  });
  const coverTextColorValue = coverTextRole.color;
  const coverTextColorKey = coverTextRole.colorKey;
  const coverTextShadowKey = coverTextRole.token?.shadow;
  const coverColor =
    coverColorValue ||
    resolveColorValue(coverColorKey) ||
    resolveColorValue('logoBlue') ||
    Color.logoBlue();
  const coverTextColor =
    coverTextColorValue ||
    resolveColorValue(coverTextColorKey) ||
    resolveColorValue('#fff') ||
    '#fff';
  const coverTextShadowColor =
    coverTextShadowKey && (resolveColorValue(coverTextShadowKey) || undefined);
  // the same cover as the profile page: platinum is the metal plate with the
  // member's own photo and Shine setting, and its text is inked for that plate
  const cover = platinumCoverOf(
    { profileCoverUrl, profileCoverPosition, profileCoverShine },
    coverThemeName
  );
  const platinumInk = platinumCoverInk(!!cover.photoUrl);
  const coverInk = cover.isPlatinum ? platinumInk.color : coverTextColor;
  const coverInkShadow = cover.isPlatinum
    ? platinumInk.shadow
    : coverTextShadowColor
      ? `1px 1px ${coverTextShadowColor}`
      : 'none';
  const loadMissionRankings = useAppContext(
    (v) => v.requestHelpers.loadMissionRankings
  );
  const [numComplete, setNumComplete] = useState(0);
  const [myGrammarRank, setMyGrammarRank] = useState(0);
  useEffect(() => {
    let numCompleteCount = 0;
    for (const missionId of missionIds) {
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
        handleLoadRanking(missionId, (myRank: number) =>
          setMyGrammarRank(myRank)
        );
      }
    }
    setNumComplete(numCompleteCount);

    async function handleLoadRanking(missionId: number, callback: any) {
      const { myRank } = await loadMissionRankings(missionId);
      callback(myRank);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionObj, missionIds]);

  const completedStatusLabel = useMemo(() => {
    return (
      <>
        Completed {numComplete} out of {missionIds.length} mission
        {missionIds.length > 1 ? 's' : ''}
      </>
    );
  }, [missionIds?.length, numComplete]);

  // a first place shows in gold unless the cover itself is gold or bare
  // platinum metal, where gold would not read
  const rankColor =
    myGrammarRank === 1 &&
    coverThemeName !== 'gold' &&
    !(cover.isPlatinum && !cover.photoUrl)
      ? Color.gold()
      : coverInk;

  return (
    <div
      className={css`
        position: relative;
        width: 100%;
        height: 15vh;
        display: flex;
        justify-content: space-between;
        background: ${coverColor};
        padding: 0 5%;
        @media (max-width: ${mobileMaxWidth}) {
          height: 8rem;
          padding-left: 1rem;
          padding-right: 1rem;
        }
      `}
    >
      {/* the text sits mid-strip, so the photo gets an even veil */}
      <ThemeCoverBackdrop cover={cover} photoFade="even" size="card" />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div>
          <ProfilePic
            className={css`
              --profile-pic-size: 9rem;
              font-size: 2rem;
              z-index: 10;
              @media (max-width: ${mobileMaxWidth}) {
                --profile-pic-size: 5rem;
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
            color: ${coverInk};
            text-shadow: ${coverInkShadow};
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
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: center;
          color: ${coverInk};
          text-shadow: ${coverInkShadow};
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
            style={{ color: rankColor }}
          >
            <span>{`${grammarRankLabel} #${myGrammarRank}`}</span>
          </div>
        )}
      </div>
    </div>
  );
}
