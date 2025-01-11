import React, { useMemo, useState } from 'react';
import MemberListItem from './MemberListItem';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';

export default function Members({
  channelId,
  creatorId,
  isAIChat,
  isClass,
  loadMoreMembersShown,
  members,
  onlineMemberObj,
  theme
}: {
  channelId: number;
  creatorId: number;
  isAIChat: boolean;
  isClass: boolean;
  loadMoreMembersShown: boolean;
  members: any[];
  onlineMemberObj: any;
  theme: string;
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showRemoveButtons, setShowRemoveButtons] = useState(false);
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

  const userIsOwner = useMemo(() => {
    return creatorId === userId;
  }, [creatorId, userId]);

  return (
    <ErrorBoundary componentPath="Chat/RightMenu/ChatInfo/Members/index">
      <div
        style={{
          width: '100%',
          paddingBottom: loadMoreMembersShown ? 0 : '10rem',
          ...(isAIChat ? { height: '15rem' } : {})
        }}
      >
        {isClass && userIsOwner && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '0 1rem',
              marginTop: '-1rem'
            }}
          >
            {showRemoveButtons ? (
              <span
                className={css`
                  cursor: pointer;
                  color: ${Color.darkerGray()};
                  font-size: 1.4rem;
                  border: none;
                  padding: 0.5rem 1rem;
                  border-radius: 5px;
                  transition: background 0.2s, color 0.2s;

                  &:hover {
                    background: ${Color.highlightGray()};
                  }
                `}
                onClick={() => setShowRemoveButtons(false)}
              >
                Done
              </span>
            ) : (
              <DropdownButton
                icon="ellipsis-h"
                skeuomorphic
                listStyle={{ minWidth: '30ch' }}
                menuProps={[
                  {
                    label: (
                      <div>
                        <Icon icon="times" />
                        <span style={{ marginLeft: '1rem' }}>
                          Remove Members
                        </span>
                      </div>
                    ),
                    key: 'remove-members',
                    onClick: () => setShowRemoveButtons(!showRemoveButtons)
                  }
                ]}
              />
            )}
          </div>
        )}
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
                  showRemoveButton={showRemoveButtons}
                  onRemove={() => handleRemoveMember(member.id)}
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
              showRemoveButton={showRemoveButtons}
              onRemove={() => handleRemoveMember(member.id)}
            />
          ) : null
        )}
        {loadMoreMembersShown && (
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

  function handleRemoveMember(memberId: number) {
    console.log('Remove member:', memberId);
    // Actual removal logic will be implemented later
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const { members, loadMoreShown } = await loadMoreChannelMembers({
        channelId,
        lastId: membersNotOnCall[membersNotOnCall.length - 1].id
      });
      onLoadMoreChannelMembers({
        channelId,
        loadMoreShown,
        members: members.filter(
          (member: { id: number }) => member.id !== creatorId
        )
      });
    } catch (error) {
      console.error('Error loading more channel members:', error);
    } finally {
      setLoadingMore(false);
    }
  }
}
