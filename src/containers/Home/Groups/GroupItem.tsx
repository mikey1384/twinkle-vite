import React, { useState } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import { socket } from '~/constants/io';
import { useNavigate } from 'react-router-dom';
import Icon from '~/components/Icon';

export default function GroupItem({
  groupId,
  groupName,
  allMemberIds,
  description,
  isOwner,
  isMember,
  pathId,
  thumbPath
}: {
  groupId: number;
  groupName: string;
  allMemberIds: number[];
  description: string;
  isOwner: boolean;
  isMember: boolean;
  thumbPath: string;
  pathId: number;
}) {
  const navigate = useNavigate();
  const { userId, username, profilePicUrl } = useKeyContext((v) => v.myState);
  const onUpdateChannelPathIdHash = useChatContext(
    (v) => v.actions.onUpdateChannelPathIdHash
  );
  const channelPathIdHash = useChatContext((v) => v.state.channelPathIdHash);
  const acceptInvitation = useAppContext(
    (v) => v.requestHelpers.acceptInvitation
  );
  const [joining, setJoining] = useState(false);
  const numTotalMembers = allMemberIds.length;
  return (
    <ErrorBoundary componentPath="Home/Groups/GroupItem">
      <div
        className={css`
          display: grid;
          grid-template-columns: ${thumbPath ? 'auto 1fr' : '1fr'};
          grid-template-rows: auto auto auto;
          gap: 1rem;
          background: #fff;
          padding: 1.5rem;
          margin: 1rem 0;
          border: 1px solid gray;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          font-family: 'Roboto', sans-serif;
        `}
      >
        {thumbPath && (
          <img
            src={`${cloudFrontURL}/thumbs/${thumbPath}/thumb.png`}
            alt="Group"
            className={css`
              grid-row: 1 / 4;
              grid-column: 1 / 2;
              border-radius: 50%;
              width: 7rem;
              height: 7rem;
              margin-right: 1.5rem;
              object-fit: cover;
            `}
          />
        )}
        <h2
          className={css`
            grid-row: 1 / 2;
            grid-column: ${thumbPath ? '2 / 3' : '1 / 2'};
            margin: 0;
            font-size: 1.7rem;
            font-weight: bold;
          `}
        >
          {groupName}
        </h2>
        <p
          className={css`
            grid-row: 2 / 3;
            grid-column: ${thumbPath ? '2 / 3' : '1 / 2'};
            margin: 0;
            font-size: 1.5rem;
            color: #666;
          `}
        >
          Member{numTotalMembers === 1 ? '' : 's'}:{' '}
          <strong>{numTotalMembers}</strong>
        </p>
        <p
          className={css`
            grid-row: 3 / 4;
            grid-column: ${thumbPath ? '2 / 3' : '1 / 2'};
            margin: 0;
            font-size: 1.5rem;
            color: #666;
          `}
        >
          {description}
        </p>
        {isOwner ? null : isMember ? (
          <div
            className={css`
              grid-row: 4 / 5;
              grid-column: ${thumbPath ? '2 / 3' : '1 / 2'};
              margin: 0;
              font-size: 1.5rem;
              color: #4caf50;
              text-align: end;
            `}
          >
            <Icon icon="check" />
            <span style={{ marginLeft: '0.7rem' }}>Joined</span>
          </div>
        ) : (
          <button
            className={css`
              grid-row: 4 / 5;
              grid-column: ${thumbPath ? '2 / 3' : '1 / 2'};
              opacity: ${joining ? 0.5 : 1};
              background: #4caf50;
              color: white;
              border: none;
              border-radius: 0.5rem;
              padding: 1rem 2rem;
              cursor: pointer;
              font-size: 1.5rem;
              margin-top: 2rem;
              font-weight: bold;
              font-family: 'Montserrat', sans-serif;
              ${joining ? '' : '&:hover { background: #15a049; }'}
            `}
            disabled={joining}
            onClick={handleJoinGroup}
          >
            <span>Join</span>
            {joining && (
              <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
            )}
          </button>
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleJoinGroup() {
    setJoining(true);
    try {
      if (!channelPathIdHash[pathId]) {
        onUpdateChannelPathIdHash({
          channelId: groupId,
          pathId
        });
      }
      const { channel, joinMessage } = await acceptInvitation(groupId);
      if (channel.id === groupId) {
        socket.emit('join_chat_group', channel.id);
        socket.emit('new_chat_message', {
          message: joinMessage,
          channel: {
            id: channel.id,
            channelName: channel.channelName,
            pathId: channel.pathId
          },
          newMembers: [{ id: userId, username, profilePicUrl }]
        });
        navigate(`/chat/${pathId}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setJoining(false);
    }
  }
}
