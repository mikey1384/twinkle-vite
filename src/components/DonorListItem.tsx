import React, { useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import { Color, tabletMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useRoleColor } from '~/theme/useRoleColor';
import { css } from '@emotion/css';
import RankBadge from '~/components/RankBadge';

export default function DonorListItem({
  myId,
  donor,
  onUsermenuShownChange = () => null
}: {
  myId: number;
  donor: {
    id: number;
    username: string;
    realName: string;
    profileFirstRow: string;
    profileTheme: string;
    profilePicUrl: string;
    totalDonated: number;
    rank: number;
  };
  onUsermenuShownChange?: (v: boolean) => void;
}) {
  const xpNumberRole = useRoleColor('xpNumber', { fallback: 'logoBlue' });
  const xpNumberColor = useMemo(() => {
    const key = xpNumberRole.colorKey;
    return key && key in Color ? key : 'logoGreen';
  }, [xpNumberRole]);

  const userRank = useMemo(() => Number(donor.rank), [donor.rank]);
  const rankColor = useMemo(() => {
    return userRank === 1
      ? Color.gold()
      : userRank === 2
      ? Color.lighterGray()
      : userRank === 3
      ? Color.orange()
      : undefined;
  }, [userRank]);

  const rankFontSize = useMemo(() => {
    return userRank < 100 ? '1.5rem' : '1rem';
  }, [userRank]);

  const mobileRankFontSize = useMemo(() => {
    return userRank < 100 ? '1.2rem' : '1rem';
  }, [userRank]);

  const usernameFontSize = '1.2rem';
  const mobileUsernameFontSize = '1rem';
  const donationFontSize = '1.3rem';
  const mobileDonationFontSize = '1.1rem';
  const profileSize = '3rem';
  const rankBadgeClass = useMemo(
    () =>
      css`
        margin-right: 1rem;
        font-size: ${rankFontSize};
        min-width: 3rem;
        height: 2.4rem;
        @media (max-width: ${tabletMaxWidth}) {
          font-size: ${mobileRankFontSize};
          min-width: 2.6rem;
          height: 2.1rem;
        }
      `,
    [mobileRankFontSize, rankFontSize]
  );

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background:
          donor.id === myId && userRank > 3 ? '#eef2ff' : '#fff'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <RankBadge rank={userRank} className={rankBadgeClass} />
        <div
          style={{
            marginLeft: '1.3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div>
            <ProfilePic
              style={{ width: profileSize }}
              profilePicUrl={donor.profilePicUrl}
              userId={donor.id}
            />
          </div>
          <UsernameText
            color={
              rankColor ||
              (userRank <= 10 ? Color.logoBlue() : Color.darkGray())
            }
            user={{ ...donor, username: donor.username }}
            onMenuShownChange={onUsermenuShownChange}
            className={css`
              max-width: 15rem;
              margin-top: 0.5rem;
              text-align: center;
              font-size: ${usernameFontSize};
              @media (max-width: ${tabletMaxWidth}) {
                max-width: 7rem;
                font-size: ${mobileUsernameFontSize};
              }
            `}
            activityContext="donation"
            activityPoints={donor.totalDonated}
          />
        </div>
      </div>
      <div
        className={css`
          font-weight: bold;
          font-size: ${donationFontSize};
          @media (max-width: ${tabletMaxWidth}) {
            font-size: ${mobileDonationFontSize};
          }
        `}
      >
        <span style={{ color: Color[xpNumberColor]() }}>
          {addCommasToNumber(donor.totalDonated)}
        </span>{' '}
        <span style={{ color: Color.gold() }}>Coins</span>
      </div>
    </nav>
  );
}
