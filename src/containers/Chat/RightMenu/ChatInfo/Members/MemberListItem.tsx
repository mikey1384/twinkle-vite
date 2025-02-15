import React, { memo, useMemo } from 'react';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

function MemberListItem({
  onlineMemberObj,
  creatorId,
  member,
  style,
  showRemoveButton,
  onRemoveMember
}: {
  onlineMemberObj: any;
  creatorId: number;
  member: any;
  style?: React.CSSProperties;
  showRemoveButton?: boolean;
  onRemoveMember?: () => void;
}) {
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const updatedMemberState = useAppContext(
    (v) => v.user.state.userObj[member.id] || {}
  );
  const { username: memberName, profilePicUrl: memberProfilePicUrl } =
    updatedMemberState;
  const { isAway, isBusy, username, profilePicUrl } = useMemo(
    () => chatStatus[member.id] || {},
    [chatStatus, member.id]
  );

  const { userId: myId } = useKeyContext((v) => v.myState);
  return username || member.username ? (
    <div
      style={{
        display: 'flex',
        width: '100%',
        padding: '1rem',
        ...style
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div>
            <ProfilePic
              className={css`
                width: 4rem;
                @media (max-width: ${mobileMaxWidth}) {
                  width: 3rem;
                }
              `}
              userId={member.id}
              profilePicUrl={
                memberProfilePicUrl || member.profilePicUrl || profilePicUrl
              }
              online={!!onlineMemberObj[member.id]}
              isAway={member.id === myId ? false : isAway}
              isBusy={member.id === myId ? false : isBusy}
              statusShown
            />
          </div>
          <UsernameText
            style={{
              color: Color.darkerGray(),
              marginLeft: '2rem'
            }}
            className={css`
              font-size: 1.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.3rem;
              }
            `}
            user={{
              ...updatedMemberState,
              id: member.id,
              username: memberName || member.username || username
            }}
          />
          {creatorId === member.id ? (
            <div
              style={{
                width: '2.5rem',
                marginLeft: '1rem'
              }}
            >
              <Icon icon="crown" style={{ color: Color.brownOrange() }} />
            </div>
          ) : null}
        </div>

        {showRemoveButton && member.id !== creatorId && (
          <button
            className={css`
              background: transparent;
              color: ${Color.darkerGray()};
              border: none;
              cursor: pointer;
              font-size: 1.6rem;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0.5rem;
              border-radius: 4px;
              transition: background 0.2s;
              &:hover {
                background: ${Color.highlightGray()};
              }
            `}
            onClick={onRemoveMember}
            aria-label="Remove Member"
          >
            <Icon icon="times" />
          </button>
        )}
      </div>
    </div>
  ) : null;
}

export default memo(MemberListItem);
