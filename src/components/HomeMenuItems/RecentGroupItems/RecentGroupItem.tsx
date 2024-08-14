import React, { useState } from 'react';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import { socket } from '~/constants/io';

export default function RecentGroupItem({
  groupId,
  groupName,
  isMember,
  thumbPath,
  pathId
}: {
  groupId: number;
  groupName: string;
  isMember: boolean;
  thumbPath: string;
  pathId: number;
}) {
  const navigate = useNavigate();
  const { userId, username, profilePicUrl } = useKeyContext((v) => v.myState);
  const acceptInvitation = useAppContext(
    (v) => v.requestHelpers.acceptInvitation
  );
  const channelPathIdHash = useChatContext((v) => v.state.channelPathIdHash);
  const onUpdateChannelPathIdHash = useChatContext(
    (v) => v.actions.onUpdateChannelPathIdHash
  );
  const [joining, setJoining] = useState(false);

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem;
      `}
    >
      <div
        className={css`
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          margin-right: 1rem;
          background-color: ${Color.lightGray()};
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        `}
      >
        {thumbPath ? (
          <img
            src={`${cloudFrontURL}/thumbs/${thumbPath}/thumb.png`}
            alt={groupName}
            className={css`
              width: 100%;
              height: 100%;
              object-fit: cover;
            `}
          />
        ) : (
          <Icon icon="users" />
        )}
      </div>
      <span
        className={css`
          font-size: 1.1rem;
          color: ${Color.darkerGray()};
          flex-grow: 1;
        `}
      >
        {groupName}
      </span>
      <button
        className={css`
          background: ${isMember ? Color.logoBlue() : Color.green()};
          color: white;
          border: none;
          border-radius: 3px;
          padding: 0.3rem 0.5rem;
          cursor: pointer;
          font-size: 0.7rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          &:hover {
            filter: brightness(110%);
          }
        `}
        onClick={isMember ? () => navigate(`/chat/${pathId}`) : handleJoinGroup}
        disabled={joining}
      >
        <Icon
          icon={isMember ? 'right-from-bracket' : 'user-plus'}
          style={{ marginRight: '0.3rem' }}
        />
        <span>{isMember ? 'Go' : 'Join'}</span>
        {joining && (
          <Icon style={{ marginLeft: '0.3rem' }} icon="spinner" pulse />
        )}
      </button>
    </div>
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
