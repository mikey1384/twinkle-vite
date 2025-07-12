import React, { useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import { Color, tabletMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

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
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  
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

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: donor.id === myId && userRank > 3 ? Color.highlightGray() : '#fff'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <span
          className={css`
            font-weight: bold;
            font-size: ${rankFontSize};
            width: 3rem;
            margin-right: 1rem;
            text-align: center;
            color: ${rankColor ||
            (userRank <= 10 ? Color.logoBlue() : Color.darkGray())};
            @media (max-width: ${tabletMaxWidth}) {
              font-size: ${mobileRankFontSize};
            }
          `}
        >
          {userRank ? `#${userRank}` : '--'}
        </span>
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