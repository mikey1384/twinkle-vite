import React, { useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);
const collectedLabel = localize('collected');

export default function Collector({
  style,
  user
}: {
  style: React.CSSProperties;
  user: {
    id: number;
    rank: number;
    username: string;
    profilePicUrl: string;
    numWords: number;
  };
}) {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const rankColor = useMemo(() => {
    return user.rank === 1
      ? Color.gold()
      : user.rank === 2
      ? Color.lighterGray()
      : user.rank === 3
      ? Color.orange()
      : undefined;
  }, [user.rank]);
  const textColor = useMemo(
    () => rankColor || (user.rank <= 10 ? Color.logoBlue() : Color.darkGray()),
    [rankColor, user.rank]
  );

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background:
          user.id === myId && user.rank > 3 ? Color.highlightGray() : '#fff',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          className={css`
            font-weight: bold;
            font-size: 1.5rem;
            width: 3rem;
            margin-right: 1rem;
            text-align: center;
            color: ${rankColor ||
            (user.rank <= 10 ? Color.logoBlue() : Color.darkGray())};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.2rem;
            }
          `}
        >
          {user.rank ? `#${user.rank}` : '--'}
        </span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div>
            <ProfilePic
              style={{ width: '3rem' }}
              profilePicUrl={user.profilePicUrl}
              userId={user.id}
            />
          </div>
          <UsernameText
            color={textColor}
            user={{ ...user, username: user.username }}
            className={css`
              max-width: 15rem;
              margin-top: 0.5rem;
              text-align: center;
              font-size: 1.2rem;
              @media (max-width: ${mobileMaxWidth}) {
                max-width: 7rem;
                font-size: 1rem;
              }
            `}
          />
        </div>
      </div>
      <div>
        {deviceIsMobile && (
          <Icon
            className={css`
              color: ${textColor};
              margin-right: 0.7rem;
              font-size: 1.1rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
              }
            `}
            icon="times"
          />
        )}
        <span
          className={css`
            color: ${textColor};
            font-size: 1.5rem;
            font-weight: bold;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.1rem;
            }
          `}
        >
          {addCommasToNumber(user.numWords || 0)}
          {!deviceIsMobile && <span>{collectedLabel}</span>}
        </span>
      </div>
    </nav>
  );
}
