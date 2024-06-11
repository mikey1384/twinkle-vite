import React, { useMemo, useState } from 'react';
import MemberListItem from './MemberListItem';
import { useAppContext, useChatContext } from '~/contexts';
import { Color } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';

export default function Members({
  channelId,
  creatorId,
  members,
  onlineMemberObj,
  theme
}: {
  channelId: number;
  creatorId: number;
  members: any[];
  onlineMemberObj: any;
  theme: string;
}) {
  const [loadMoreButtonShown, setLoadMoreButtonShown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreChannelMembers = useAppContext(
    (v) => v.requestHelpers.loadMoreChannelMembers
  );
  const channelOnCallId = useChatContext((v) => v.state.channelOnCall.id);
  const membersOnCallObj = useChatContext((v) => v.state.channelOnCall.members);
  const onLoadMoreChannelMembers = useChatContext(
    (v) => v.actions.onLoadMoreChannelMembers
  );
  const membersOnCall = useMemo(
    () =>
      channelOnCallId === channelId
        ? members.filter((member) => !!membersOnCallObj[member.id])
        : [],
    [channelId, channelOnCallId, members, membersOnCallObj]
  );

  const membersNotOnCall = useMemo(
    () =>
      channelOnCallId === channelId
        ? members.filter((member) => !membersOnCallObj[member.id])
        : members,
    [channelId, channelOnCallId, members, membersOnCallObj]
  );

  const callIsOnGoing = useMemo(
    () => membersOnCall.length > 0,
    [membersOnCall.length]
  );

  return (
    <ErrorBoundary componentPath="Chat/RightMenu/ChatInfo/Members/index">
      <div
        style={{
          width: '100%',
          paddingBottom: loadMoreButtonShown ? 0 : '10rem'
        }}
      >
        {callIsOnGoing && (
          <div
            style={{
              textAlign: 'center',
              width: '100%',
              fontWeight: 'bold',
              color: Color.darkerGray()
            }}
          >
            on call
          </div>
        )}
        {callIsOnGoing && (
          <div style={{ marginBottom: '2rem' }}>
            {membersOnCall.map((member) =>
              member.id ? (
                <MemberListItem
                  key={`oncall-member-${member.id}`}
                  creatorId={creatorId}
                  onlineMemberObj={onlineMemberObj}
                  member={member}
                />
              ) : null
            )}
          </div>
        )}
        {callIsOnGoing && membersNotOnCall.length > 0 && (
          <div
            style={{
              textAlign: 'center',
              width: '100%',
              fontWeight: 'bold',
              color: Color.darkerGray()
            }}
          >
            others
          </div>
        )}
        {membersNotOnCall.map((member) =>
          member.id ? (
            <MemberListItem
              key={`member-${member.id}`}
              creatorId={creatorId}
              onlineMemberObj={onlineMemberObj}
              member={member}
            />
          ) : null
        )}
        {loadMoreButtonShown && (
          <LoadMoreButton
            theme={theme}
            loading={loadingMore}
            onClick={handleLoadMore}
            filled
            style={{
              marginTop: '2rem',
              width: '100%',
              borderRadius: 0,
              border: 0
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const { members, loadMoreShown } = await loadMoreChannelMembers({
        channelId,
        lastId: membersNotOnCall[membersNotOnCall.length - 1].id
      });
      onLoadMoreChannelMembers({
        channelId,
        members: members.filter(
          (member: { id: number }) => member.id !== creatorId
        )
      });
      setLoadMoreButtonShown(loadMoreShown);
    } catch (error) {
      console.error('Error loading more channel members:', error);
    } finally {
      setLoadingMore(false);
    }
  }
}
