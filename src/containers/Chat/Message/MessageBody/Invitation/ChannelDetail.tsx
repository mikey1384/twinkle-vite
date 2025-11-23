import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { useChatContext, useAppContext } from '~/contexts';
import UserListModal from '~/components/Modals/UserListModal';
import { useRoleColor } from '~/theme/useRoleColor';

const membersLabel = 'Members';

export default function ChannelDetail({
  allMemberIds,
  alreadyJoined,
  channelName,
  channelId,
  creatorId,
  invitePath,
  members
}: {
  allMemberIds: number[];
  alreadyJoined: boolean;
  channelName: string;
  channelId: number;
  creatorId: number;
  invitePath: string;
  members: {
    id: number;
    username: string;
    profilePicUrl: string;
  }[];
}) {
  const navigate = useNavigate();
  const chatInvitationRole = useRoleColor('chatInvitation', {
    fallback: 'logoBlue'
  });
  const linkRole = useRoleColor('link', {
    fallback: 'logoBlue'
  });
  const loadMoreChannelMembers = useAppContext(
    (v) => v.requestHelpers.loadMoreChannelMembers
  );
  const onLoadMoreChannelMembers = useChatContext(
    (v) => v.actions.onLoadMoreChannelMembers
  );
  const [shownMembers, setShownMembers] = useState<
    { id: number; username: string }[]
  >([]);
  const [userListModalShown, setUserListModalShown] = useState(false);
  const [loadMoreButtonShown, setLoadMoreButtonShown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [more, setMore] = useState<number | null>(null);
  const chatInvitationColor = useMemo(
    () => chatInvitationRole.getColor() || Color.logoBlue(),
    [chatInvitationRole]
  );
  const linkColor = useMemo(
    () => linkRole.getColor() || Color.logoBlue(),
    [linkRole]
  );
  useEffect(() => {
    if (allMemberIds?.length > 3) {
      setShownMembers(members?.filter((member, index) => index < 3) || []);
      setMore(allMemberIds.length - 3);
    } else {
      setShownMembers(members || []);
    }
  }, [allMemberIds?.length, members]);
  useEffect(() => {
    setLoadMoreButtonShown((members?.length || 0) < (allMemberIds?.length || 0));
  }, [allMemberIds?.length, members?.length]);
  const handleChannelEnter = useCallback(() => {
    if (alreadyJoined) {
      navigate(`/chat/${invitePath}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alreadyJoined, invitePath]);
  const invitationLabel = useMemo(() => {
    return `Invitation to ${channelName}`;
  }, [channelName]);
  const andMoreLabel = useMemo(() => {
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
          color: ${chatInvitationColor};
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
              color: ${linkColor};
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
          loadMoreButtonShown={loadMoreButtonShown}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
        />
      )}
    </div>
  );

  async function handleLoadMore() {
    if (!members?.length) return;
    setLoadingMore(true);
    const lastId = members[members.length - 1].id;
    const { members: loadedMembers } = await loadMoreChannelMembers({
      channelId,
      lastId
    });
    onLoadMoreChannelMembers({
      channelId,
      members: loadedMembers.filter(
        (member: { id: number }) => member.id !== creatorId
      )
    });
    setLoadingMore(false);
  }
}
