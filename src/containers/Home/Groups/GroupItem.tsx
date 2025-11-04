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
import { Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import UsernameText from '~/components/Texts/UsernameText';
import { getColorFromName } from '~/helpers/stringHelpers';
import Button from '~/components/Button';
import { themedCardBase } from '~/theme/themedCard';

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
          ${themedCardBase};
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-rows: auto auto auto 1fr;
          gap: 1rem;
          background: #fff;
          padding: 1.4rem 1.6rem;
          margin: 1rem 0;
          border-color: var(--ui-border);
          box-shadow: none;
          @media (max-width: ${mobileMaxWidth}) {
            margin: 0.6rem 0;
            padding: 1.4rem 1.5rem;
            border: none;
            border-radius: 0;
          }
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
                font-weight: 700;
              `}
            >
              {groupName}
            </h2>
            {isOwner && (
              <span
                className={css`
                  margin-left: 0.6rem;
                  padding: 0.2rem 0.5rem;
                  background: ${Color.brightGold(0.18)};
                  color: ${Color.darkBrownOrange()};
                  border: 1px solid ${Color.brightGold(0.45)};
                  border-radius: 6px;
                  font-size: 1.1rem;
                  font-weight: 700;
                `}
              >
                Owner
              </span>
            )}
            {isMember && !isOwner && (
              <span
                className={css`
                  margin-left: 0.6rem;
                  padding: 0.2rem 0.5rem;
                  background: ${Color.logoBlue(0.12)};
                  color: ${Color.logoBlue()};
                  border: 1px solid ${Color.logoBlue(0.35)};
                  border-radius: 6px;
                  font-size: 1.1rem;
                  font-weight: 700;
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
            overflow-wrap: anywhere;
            word-break: break-word;
          `}
        >
          {description}
        </p>
        <div
          className={css`
            grid-row: 4 / 5;
            grid-column: 2 / 3;
            margin-top: 1.2rem;
            display: flex;
            justify-content: center;
          `}
        >
          <Button
            onClick={
              isMember || isOwner
                ? () => navigate(`/chat/${pathId}`)
                : handleJoinGroup
            }
            loading={joining}
            color={isMember || isOwner ? 'logoBlue' : 'green'}
            variant="solid"
            size="md"
            tone="flat"
            style={{
              fontWeight: 700,
              minWidth: '20rem',
              justifyContent: 'center'
            }}
          >
            <Icon
              icon={isMember || isOwner ? 'right-from-bracket' : 'user-plus'}
            />
            <span style={{ marginLeft: '0.7rem' }}>
              {isMember || isOwner ? 'Go' : 'Join Group'}
            </span>
          </Button>
        </div>
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
