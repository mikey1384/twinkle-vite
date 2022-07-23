import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import UserListModal from '~/components/Modals/UserListModal';
import localize from '~/constants/localize';

const membersLabel = localize('members');

ChannelDetail.propTypes = {
  invitePath: PropTypes.number.isRequired,
  alreadyJoined: PropTypes.bool.isRequired,
  channelName: PropTypes.string.isRequired,
  members: PropTypes.array.isRequired
};

export default function ChannelDetail({
  alreadyJoined,
  channelName,
  invitePath,
  members
}) {
  const navigate = useNavigate();
  const {
    chatInvitation: { color: chatInvitationColor },
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
  const [shownMembers, setShownMembers] = useState([]);
  const [userListModalShown, setUserListModalShown] = useState(false);
  const [more, setMore] = useState(null);
  useEffect(() => {
    if (members.length > 3) {
      setShownMembers(members.filter((member, index) => index < 3));
      setMore(members.length - 3);
    } else {
      setShownMembers(members);
    }
  }, [members]);
  const handleChannelEnter = useCallback(() => {
    if (alreadyJoined) {
      navigate(`/chat/${invitePath}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alreadyJoined, invitePath]);
  const invitationLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `${channelName} 대화방에 초대합니다`;
    }
    return `Invitation to ${channelName}`;
  }, [channelName]);
  const andMoreLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `외 ${more}명`;
    }
    return `and ${more} more`;
  }, [more]);

  return (
    <div
      style={{
        width: '100%',
        marginBottom: '1rem',
        padding: '1rem',
        background: Color.highlightGray(),
        color: Color.black(),
        borderRadius
      }}
    >
      <p
        className={css`
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          line-height: 1.3;
          font-weight: bold;
          font-size: 2.2rem;
          color: ${Color[chatInvitationColor]()};
          cursor: ${alreadyJoined ? 'pointer' : 'default'};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.5rem;
          }
        `}
        onClick={handleChannelEnter}
      >
        {invitationLabel}
      </p>
      <div
        style={{ marginTop: '0.5rem' }}
        className={css`
          font-size: 1.5rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1rem;
          }
        `}
      >
        <span style={{ fontWeight: 'bold' }}>{membersLabel}:</span>{' '}
        {shownMembers.map((member, index) => (
          <span key={member.id}>
            {member.username}
            {index === members.length - 1 ? '' : ', '}
          </span>
        ))}
        {more && (
          <p
            className={css`
              cursor: pointer;
              color: ${Color[linkColor]()};
              &:hover {
                text-decoration: underline;
              }
            `}
            onClick={() => setUserListModalShown(true)}
          >
            ...{andMoreLabel}
          </p>
        )}
      </div>
      {userListModalShown && (
        <UserListModal
          onHide={() => setUserListModalShown(false)}
          title="Members"
          users={members}
        />
      )}
    </div>
  );
}
