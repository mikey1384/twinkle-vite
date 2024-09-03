import React, { useMemo, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color, borderRadius } from '~/constants/css';
import { socket } from '~/constants/io';
import { getColorFromName } from '~/helpers/stringHelpers';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import Icon from '~/components/Icon';

export default function SelectedGroupItem({
  group,
  onDeselect,
  isLink = false,
  style
}: {
  group: {
    id: number;
    allMemberIds: number[];
    channelName: string;
    thumbPath?: string;
    members: any[];
    pathId: number;
    isPublic?: boolean;
  };
  onDeselect?: (groupId: number) => void;
  isLink?: boolean;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const { userId, username, profilePicUrl } = useKeyContext((v) => v.myState);
  const acceptInvitation = useAppContext(
    (v) => v.requestHelpers.acceptInvitation
  );
  const channelPathIdHash = useChatContext((v) => v.state.channelPathIdHash);
  const checkChatAccessible = useAppContext(
    (v) => v.requestHelpers.checkChatAccessible
  );
  const onUpdateChannelPathIdHash = useChatContext(
    (v) => v.actions.onUpdateChannelPathIdHash
  );
  const bgColor = useMemo(() => getColorFromName(group.channelName), [group]);
  const [isShaking, setIsShaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const shakeAnimation = keyframes`
    0% { transform: translateX(0); }
    25% { transform: translateX(5px); }
    50% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
    100% { transform: translateX(0); }
  `;

  const fadeAnimation = keyframes`
    0% { opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; }
  `;

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        padding: 1rem;
        border-radius: ${borderRadius};
        border: 1px solid ${Color.borderGray()};
        position: relative;
        width: calc(50% - 0.5rem);
        margin-bottom: 1rem;
        ${isLink ? 'cursor: pointer;' : ''}
        ${isShaking ? `animation: ${shakeAnimation} 0.5s ease-in-out;` : ''}
        ${isLink
          ? `
            &:hover {
              border-color: ${Color.darkGray()};
            }
          `
          : ''}
      `}
      style={style}
      onClick={isLink ? handleClick : undefined}
    >
      <div
        className={css`
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          margin-right: 1rem;
          flex-shrink: 0;
          background-color: ${group.thumbPath ? Color.lightGray() : bgColor};
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        `}
      >
        {group.thumbPath ? (
          <img
            src={`${cloudFrontURL}/thumbs/${group.thumbPath}/thumb.png`}
            alt={group.channelName}
            className={css`
              width: 100%;
              height: 100%;
              object-fit: cover;
            `}
          />
        ) : (
          <div
            className={css`
              font-size: 1.5rem;
              font-weight: bold;
              color: white;
              font-family: 'Roboto', sans-serif;
            `}
          >
            {group.channelName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div
        className={css`
          flex-grow: 1;
          overflow: hidden;
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            margin-bottom: 0.3rem;
          `}
        >
          <div
            className={css`
              font-size: 1.1rem;
              font-weight: bold;
              color: ${Color.darkerGray()};
              margin-right: 0.5rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            {group.channelName}
          </div>
          {group.isPublic && (
            <span
              className={css`
                padding: 0.1rem 0.3rem;
                background-color: ${Color.green()};
                color: white;
                border-radius: 0.3rem;
                font-size: 0.7rem;
                font-weight: bold;
              `}
            >
              Public
            </span>
          )}
        </div>
        <div
          className={css`
            font-size: 0.9rem;
            color: ${Color.gray()};
          `}
        >
          {group.members.length}{' '}
          {group.members.length === 1 ? 'member' : 'members'}
        </div>
      </div>
      {!isLink && (
        <button
          className={css`
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.2rem;
            color: ${Color.darkGray()};
            &:hover {
              color: ${Color.red()};
            }
          `}
          onClick={(e) => {
            e.stopPropagation();
            onDeselect?.(group.id);
          }}
        >
          <Icon icon="times" />
        </button>
      )}
      {errorMessage && (
        <div
          className={css`
            position: absolute;
            bottom: -1.5rem;
            left: 0;
            right: 0;
            text-align: center;
            color: ${Color.red()};
            font-size: 0.8rem;
            animation: ${fadeAnimation} 2s forwards;
          `}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );

  async function handleClick() {
    try {
      const { isAccessible, isPublic } = await checkChatAccessible(
        group.pathId
      );
      if (isPublic) {
        if (isAccessible) {
          navigate(`/chat/${group.pathId}`);
        } else {
          if (!channelPathIdHash[group.pathId]) {
            onUpdateChannelPathIdHash({
              channelId: group.id,
              pathId: group.pathId
            });
          }
          const { channel, joinMessage } = await acceptInvitation(group.id);
          if (channel.id === group.id) {
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
            navigate(`/chat/${group.pathId}`);
          }
        }
      } else {
        if (isAccessible) {
          navigate(`/chat/${group.pathId}`);
        } else {
          setIsShaking(true);
          setErrorMessage('Chat is not accessible');
          setTimeout(() => {
            setIsShaking(false);
            setErrorMessage('');
          }, 2000);
        }
      }
    } catch (error) {
      console.error(error);
      setIsShaking(true);
      setErrorMessage('An error occurred');
      setTimeout(() => {
        setIsShaking(false);
        setErrorMessage('');
      }, 2000);
    }
  }
}
