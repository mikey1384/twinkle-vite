import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useChatContext, useKeyContext, useAppContext } from '~/contexts';
import UserListModal from '~/components/Modals/UserListModal';
import localize from '~/constants/localize';

const membersLabel = localize('members');

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
  const {
    chatInvitation: { color: chatInvitationColor },
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
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
  useEffect(() => {
    if (allMemberIds?.length > 3) {
      setShownMembers(members.filter((member, index) => index < 3));
      setMore(allMemberIds.length - 3);
    } else {
      setShownMembers(members);
    }
  }, [allMemberIds?.length, members]);
  useEffect(() => {
    setLoadMoreButtonShown(members.length < allMemberIds.length);
  }, [allMemberIds?.length, members.length]);
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
          loadMoreButtonShown={loadMoreButtonShown}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
        />
      )}
    </div>
  );

  async function handleLoadMore() {
    setLoadingMore(true);
    const { members: loadedMembers } = await loadMoreChannelMembers({
      channelId,
      lastId: members[members.length - 1].id
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
