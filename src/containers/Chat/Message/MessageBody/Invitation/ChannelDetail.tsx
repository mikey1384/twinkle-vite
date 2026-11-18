import React, { useCallback, useMemo, useState } from 'react';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { useChatContext, useAppContext, useKeyContext } from '~/contexts';
import UserListModal from '~/components/Modals/UserListModal';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { useReplyCardPresentation } from '../ReplyCardPresentation';

const membersLabel = 'Members';

export default function ChannelDetail({
  allMemberIds,
  alreadyJoined,
  channelName,
  channelId,
  invitePath,
  invitationMessageId,
  members,
  sourceChannelId
}: {
  allMemberIds: number[];
  alreadyJoined: boolean;
  channelName: string;
  channelId: number;
  invitePath: string;
  invitationMessageId: number;
  members: {
    id: number;
    username: string;
    profilePicUrl: string;
  }[];
  sourceChannelId: number;
}) {
  const nextMemberCursor = useChatContext(
    (v) => v.state.channelsObj[channelId]?.nextMemberCursor
  );
  const userId = useKeyContext((v) => v.myState.userId);
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
  const [userListModalShown, setUserListModalShown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const more = Math.max(0, (allMemberIds?.length || 0) - 3);
  const shownMembers = (members || []).slice(0, 3);
  const loadMoreButtonShown = nextMemberCursor === undefined
    ? (members?.length || 0) < (allMemberIds?.length || 0)
    : nextMemberCursor !== null;
  const chatInvitationColor = useMemo(
    () => chatInvitationRole.getColor() || Color.logoBlue(),
    [chatInvitationRole]
  );
  const linkColor = useMemo(
    () => linkRole.getColor() || Color.logoBlue(),
    [linkRole]
  );
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
        {more > 0 && (
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
    if (loadingMore || nextMemberCursor === null) return;
    setLoadingMore(true);
    try {
      const page = await loadMoreChannelMembers({
        channelId,
        memberCursor: nextMemberCursor ?? 0,
        isForInvitation: true,
        invitationSourceChannelId: sourceChannelId,
        invitationMessageId
      });
      onLoadMoreChannelMembers({
        channelId,
        userId,
        page,
        requested: { nextMemberCursor, members, allMemberIds }
      });
    } catch (error) {
      console.error('Error loading invitation members:', error);
    } finally {
      setLoadingMore(false);
    }
  }
}
