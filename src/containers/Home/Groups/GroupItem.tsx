import React, { useState, useMemo } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import { cloudFrontURL } from '~/constants/defaultValues';
import {
  useAppContext,
  useKeyContext,
  useChatContext,
  useHomeContext
} from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import UsernameText from '~/components/Texts/UsernameText';
import { getColorFromName } from '~/helpers/stringHelpers';

export default function GroupItem({
  groupId,
  groupName,
  allMemberIds,
  description,
  isOwner,
  isMember,
  pathId,
  thumbPath,
  members,
  ownerId
}: {
  groupId: number;
  groupName: string;
  allMemberIds: number[];
  description: string;
  isOwner: boolean;
  isMember: boolean;
  thumbPath: string;
  pathId: number;
  members: { id: number; username: string; profilePicUrl: string }[];
  ownerId: number;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const onUpdateChannelPathIdHash = useChatContext(
    (v) => v.actions.onUpdateChannelPathIdHash
  );
  const onSetGroupMemberState = useHomeContext(
    (v) => v.actions.onSetGroupMemberState
  );
  const channelPathIdHash = useChatContext((v) => v.state.channelPathIdHash);
  const acceptInvitation = useAppContext(
    (v) => v.requestHelpers.acceptInvitation
  );
  const [joining, setJoining] = useState(false);
  const numTotalMembers = allMemberIds?.length;

  const owner = useMemo(() => {
    return members.find((member) => member.id === ownerId) || null;
  }, [members, ownerId]);

  const bgColor = getColorFromName(groupName);

  return (
    <ErrorBoundary componentPath="Home/Groups/GroupItem">
      <div
        className={css`
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-rows: auto auto auto 1fr;
          gap: 1rem;
          background: #fff;
          padding: 1.5rem;
          margin: 1rem 0;
          border: 1px solid ${Color.borderGray()};
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          font-family: 'Roboto', sans-serif;
        `}
      >
        <div
          className={css`
            grid-row: 1 / 5;
            grid-column: 1 / 2;
            width: 7rem;
            height: 7rem;
            margin-right: 1.5rem;
          `}
        >
          {thumbPath ? (
            <img
              loading="lazy"
              src={`${cloudFrontURL}/thumbs/${thumbPath}/thumb.png`}
              alt="Group"
              className={css`
                border-radius: 50%;
                width: 100%;
                height: 100%;
                object-fit: cover;
              `}
            />
          ) : (
            <div
              className={css`
                border-radius: 50%;
                width: 100%;
                height: 100%;
                background-color: ${bgColor};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 3rem;
                font-weight: bold;
                color: white;
                font-family: 'Roboto', sans-serif;
              `}
            >
              {groupName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div
          className={css`
            grid-row: 1 / 2;
            grid-column: 2 / 3;
            display: flex;
            flex-direction: column;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
            `}
          >
            <h2
              className={css`
                margin: 0;
                font-size: 1.7rem;
                font-weight: bold;
              `}
            >
              {groupName}
            </h2>
            {isOwner && (
              <span
                className={css`
                  margin-left: 1rem;
                  padding: 0.3rem 0.6rem;
                  background-color: #f1c40f;
                  color: #fff;
                  border-radius: 0.5rem;
                  font-size: 1rem;
                  font-weight: bold;
                `}
              >
                Owner
              </span>
            )}
            {isMember && !isOwner && (
              <span
                className={css`
                  margin-left: 1rem;
                  padding: 0.3rem 0.6rem;
                  background-color: #3498db;
                  color: #fff;
                  border-radius: 0.5rem;
                  font-size: 1rem;
                  font-weight: bold;
                `}
              >
                Member
              </span>
            )}
          </div>
          <div
            className={css`
              display: flex;
              align-items: center;
              margin-top: 0.5rem;
              color: #666;
              font-size: 1.2rem;
            `}
          >
            {owner && (
              <>
                <Icon
                  icon="crown"
                  style={{
                    marginRight: '0.5rem',
                    color: Color.gold()
                  }}
                />
                <UsernameText user={owner} />
              </>
            )}
          </div>
        </div>
        <p
          className={css`
            grid-row: 2 / 3;
            grid-column: 2 / 3;
            margin: 0;
            color: #666;
            font-size: 1.3rem;
          `}
        >
          Member{numTotalMembers === 1 ? '' : 's'}:{' '}
          <strong>{numTotalMembers}</strong>
        </p>
        <p
          className={css`
            grid-row: 3 / 4;
            grid-column: 2 / 3;
            margin: 0;
            font-size: 1.5rem;
            color: #666;
          `}
        >
          {description}
        </p>
        <button
          className={css`
            grid-row: 4 / 5;
            grid-column: 2 / 3;
            opacity: ${joining ? 0.5 : 1};
            background: ${isMember ? Color.logoBlue() : Color.green()};
            color: white;
            border: none;
            border-radius: 0.5rem;
            padding: 1rem 2rem;
            cursor: pointer;
            font-size: 1.5rem;
            margin-top: 2rem;
            font-weight: bold;
            font-family: 'Montserrat', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            ${joining ? '' : '&:hover { filter: brightness(110%); }'}
          `}
          disabled={joining}
          onClick={
            isMember ? () => navigate(`/chat/${pathId}`) : handleJoinGroup
          }
        >
          <Icon
            icon={isMember ? 'right-from-bracket' : 'user-plus'}
            style={{ marginRight: '0.7rem' }}
          />
          <span>{isMember || isOwner ? 'Go' : 'Join Group'}</span>
          {joining && (
            <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
          )}
        </button>
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
        onSetGroupMemberState({
          groupId,
          action: 'add',
          memberId: userId
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
