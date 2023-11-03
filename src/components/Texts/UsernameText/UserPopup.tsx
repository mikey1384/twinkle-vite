import React from 'react';
import DropdownList from '~/components/DropdownList';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import localize from '~/constants/localize';

const chatLabel = localize('chat2');
const profileLabel = localize('Profile');

export default function UserPopup({
  myId,
  navigate,
  onHide,
  onLinkClick,
  onMouseEnter,
  onMouseLeave,
  popupContext,
  userId,
  username,
  userRank,
  userXP
}: {
  myId: number;
  navigate: (path: string) => void;
  onHide: () => void;
  onLinkClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  popupContext: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  userId: number;
  username: string;
  userRank?: number;
  userXP?: string | null;
}) {
  return (
    <DropdownList
      dropdownContext={popupContext}
      onHideMenu={onHide}
      onMouseEnter={onMouseEnter}
      style={{ minWidth: '10rem' }}
      onMouseLeave={onMouseLeave}
    >
      <li
        style={{
          color: Color.darkerGray()
        }}
        onClick={() => navigate(`/users/${username}`)}
      >
        <Icon icon="user" />
        <span style={{ marginLeft: '1rem' }}>{profileLabel}</span>
      </li>
      {userId !== myId && (
        <li
          style={{
            color: Color.darkerGray()
          }}
          onClick={onLinkClick}
        >
          <Icon icon="comment" />
          <span style={{ marginLeft: '1rem' }}>{chatLabel}</span>
        </li>
      )}
      {userXP && (
        <li
          style={{
            padding: '5px',
            background:
              !!userRank && userRank < 4
                ? Color.darkerGray()
                : Color.highlightGray(),
            color: !!userRank && userRank < 4 ? '#fff' : Color.darkerGray(),
            fontSize: '1rem',
            textAlign: 'center',
            fontWeight: 'bold'
          }}
        >
          {userXP} XP
          {!!userRank && userRank < 4 ? (
            <span
              style={{
                fontWeight: 'bold',
                color:
                  userRank === 1
                    ? Color.gold()
                    : userRank === 2
                    ? '#fff'
                    : Color.orange()
              }}
            >
              {' '}
              (#{userRank})
            </span>
          ) : (
            ''
          )}
        </li>
      )}
    </DropdownList>
  );
}
