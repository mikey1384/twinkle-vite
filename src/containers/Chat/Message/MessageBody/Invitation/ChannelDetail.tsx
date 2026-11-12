import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { useChatContext, useAppContext } from '~/contexts';
import UserListModal from '~/components/Modals/UserListModal';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { useReplyCardPresentation } from '../ReplyCardPresentation';

const membersLabel = 'Members';

export default function ChannelDetail({
  allMemberIds,
  alreadyJoined,
  channelName,
  channelId,
  creatorId,
  invitePath,
  invitationMessageId,
  members,
  sourceChannelId
}: {
  allMemberIds: number[];
  alreadyJoined: boolean;
  channelName: string;
  channelId: number;
  creatorId: number;
  invitePath: string;
  invitationMessageId: number;
  members: {
    id: number;
    username: string;
    profilePicUrl: string;
  }[];
  sourceChannelId: number;
}) {
  const inReply = useReplyCardPresentation();
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
        marginBottom: inReply ? '0.6rem' : '1rem',
        padding: inReply ? '0.8rem 1rem' : '1rem',
        background: Color.highlightGray(),
        color: Color.black(),
        borderRadius
      }}
    >
      <p
        data-quote-own-click={alreadyJoined ? '' : undefined}
        className={css`
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          line-height: 1.3;
          font-weight: bold;
          font-size: ${inReply ? '1.5rem' : '2.2rem'};
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
          font-size: ${inReply ? '1.2rem' : '1.5rem'};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.1rem;
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
            data-quote-own-click
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
      lastId,
      isForInvitation: true,
      invitationSourceChannelId: sourceChannelId,
      invitationMessageId
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
