import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

MemberListItem.propTypes = {
  onlineMembers: PropTypes.object,
  creatorId: PropTypes.number,
  member: PropTypes.object,
  style: PropTypes.object
};

function MemberListItem({ onlineMembers, creatorId, member, style }) {
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const { username: memberName, profilePicUrl: memberProfilePicUrl } =
    useAppContext((v) => v.user.state.userObj[member.id] || {});
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
          alignItems: 'center'
        }}
      >
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
            online={!!onlineMembers[member.id]}
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
    </div>
  ) : null;
}

export default memo(MemberListItem);
