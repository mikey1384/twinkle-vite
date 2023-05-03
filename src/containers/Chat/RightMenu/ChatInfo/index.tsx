import React, { useCallback, useMemo, useState } from 'react';
import Members from './Members';
import ChannelDetails from './ChannelDetails';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useChatContext, useKeyContext } from '~/contexts';
import { socket } from '~/constants/io';
import { v1 as uuidv1 } from 'uuid';
import { GENERAL_CHAT_ID } from '~/constants/defaultValues';
import { objectify } from '~/helpers';
import ErrorBoundary from '~/components/ErrorBoundary';
import CallButton from './CallButton';
import localize from '~/constants/localize';

const madeCallLabel = localize('madeCall');
const onlineLabel = localize('online');

export default function ChatInfo({
  selectedChannelId,
  channelOnCall,
  currentChannel,
  currentOnlineUsers,
  displayedThemeColor,
  channelName
}: {
  selectedChannelId: number;
  channelOnCall: any;
  currentChannel: any;
  currentOnlineUsers: any[];
  displayedThemeColor: string;
  channelName: string;
}) {
  const {
    userId: myId,
    username,
    profilePicUrl,
    banned
  } = useKeyContext((v) => v.myState);
  const [callDisabled, setCallDisabled] = useState(false);
  const onSetCall = useChatContext((v) => v.actions.onSetCall);
  const onHangUp = useChatContext((v) => v.actions.onHangUp);
  const onSubmitMessage = useChatContext((v) => v.actions.onSubmitMessage);

  const allMemberIds = useMemo(() => {
    if (currentChannel?.twoPeople) {
      return (currentChannel?.members || []).map(
        (member: { id: number }) => member.id
      );
    }
    return currentChannel?.allMemberIds || [];
  }, [
    currentChannel?.allMemberIds,
    currentChannel?.members,
    currentChannel?.twoPeople
  ]);

  const callOngoing = useMemo(
    () =>
      selectedChannelId === channelOnCall.id && !!channelOnCall.members[myId],
    [channelOnCall.id, channelOnCall.members, myId, selectedChannelId]
  );

  const calling = useMemo(() => {
    return !channelOnCall.callReceived && channelOnCall.imCalling;
  }, [channelOnCall.callReceived, channelOnCall.imCalling]);

  const voiceChatButtonShown = useMemo(() => {
    if (currentChannel?.twoPeople) {
      if (currentChannel?.members?.length !== 2) return false;
      return !!currentChannel?.id;
    }
    return false;
  }, [currentChannel?.twoPeople, currentChannel?.members, currentChannel?.id]);

  const onlineChannelMembers = useMemo(() => {
    const me = { id: myId, username, profilePicUrl };
    const onlineMembersOtherThanMe = Object.values(currentOnlineUsers).filter(
      (member) =>
        !!member.id &&
        member.id !== myId &&
        (currentChannel?.id === GENERAL_CHAT_ID ||
          allMemberIds?.includes(member.id))
    );
    return [me, ...onlineMembersOtherThanMe];
  }, [
    myId,
    username,
    profilePicUrl,
    currentOnlineUsers,
    allMemberIds,
    currentChannel?.id
  ]);

  const displayedChannelMembers = useMemo(() => {
    const offlineChannelMembers = (currentChannel?.members || []).filter(
      (member: { id: number }) =>
        !onlineChannelMembers?.map((m) => m.id)?.includes(member.id)
    );
    return [...onlineChannelMembers, ...offlineChannelMembers];
  }, [currentChannel?.members, onlineChannelMembers]);

  const handleCall = useCallback(async () => {
    if (!channelOnCall.id) {
      if (onlineChannelMembers?.length === 1) {
        const messageId = uuidv1();
        const partnerName = currentChannel?.members
          ?.map((member: { username: string }) => member.username)
          ?.filter((memberName: string) => memberName !== username)?.[0];
        return onSubmitMessage({
          messageId,
          message: {
            content: `${partnerName} is not currently online. Try calling ${partnerName} again when there's a green circle at the bottom right corner of ${partnerName}'s profile picture.`,
            channelId: selectedChannelId,
            profilePicUrl,
            userId: myId,
            username,
            isNotification: true
          }
        });
      }
      const messageId = uuidv1();
      onSubmitMessage({
        messageId,
        message: {
          content: madeCallLabel,
          channelId: selectedChannelId,
          profilePicUrl,
          userId: myId,
          username,
          isNotification: true,
          isCallNotification: true
        }
      });
      onSetCall({
        imCalling: true,
        channelId: selectedChannelId
      });
    } else {
      if (calling) {
        onSetCall({});
      } else {
        onHangUp({ memberId: myId, iHungUp: true });
      }
      setCallDisabled(true);
      setTimeout(() => {
        setCallDisabled(false);
      }, 3000);
      socket.emit('hang_up_call', channelOnCall.id, () => {
        if (selectedChannelId !== channelOnCall.id) {
          const messageId = uuidv1();
          onSubmitMessage({
            messageId,
            message: {
              content: madeCallLabel,
              channelId: selectedChannelId,
              profilePicUrl,
              userId: myId,
              username,
              isNotification: true,
              isCallNotification: true
            }
          });
          onSetCall({
            imCalling: true,
            channelId: selectedChannelId
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    calling,
    channelOnCall?.id,
    myId,
    onlineChannelMembers?.length,
    profilePicUrl,
    selectedChannelId,
    username
  ]);

  return (
    <ErrorBoundary componentPath="Chat/RightMenu/ChatInfo">
      <div
        className={css`
          width: 100%;
          display: flex;
          padding-bottom: 1rem;
          justify-content: center;
          color: ${Color.darkerGray()};
        `}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'center',
            width: '100%'
          }}
          className="unselectable"
        >
          {voiceChatButtonShown && !banned?.chat && (
            <CallButton
              callOngoing={callOngoing}
              disabled={callDisabled}
              onCall={handleCall}
            />
          )}
          <ChannelDetails
            style={{ marginTop: '1rem' }}
            channelId={currentChannel.id}
            channelName={channelName}
          />
          {((onlineChannelMembers.length > 1 && !currentChannel.twoPeople) ||
            (onlineChannelMembers.length === 1 &&
              !!allMemberIds?.length &&
              allMemberIds?.length > 1 &&
              !currentChannel.twoPeople &&
              currentChannel.id !== GENERAL_CHAT_ID)) && (
            <div
              className={css`
                color: ${Color[
                  onlineChannelMembers.length === 1
                    ? 'darkGray'
                    : displayedThemeColor
                ]()};
                font-size: 1.5rem;
                font-weight: bold;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.3rem;
                }
              `}
            >
              {onlineChannelMembers.length > 1 ? (
                <>
                  {onlineChannelMembers.length}
                  {currentChannel.id !== GENERAL_CHAT_ID &&
                    '/' + allMemberIds?.length}{' '}
                  {onlineLabel}
                </>
              ) : (
                <>{allMemberIds?.length} members</>
              )}
            </div>
          )}
        </div>
      </div>
      <Members
        channelId={selectedChannelId}
        creatorId={currentChannel.creatorId}
        members={displayedChannelMembers}
        numMembers={allMemberIds?.length || 0}
        theme={displayedThemeColor}
        onlineMemberObj={objectify(onlineChannelMembers)}
      />
    </ErrorBoundary>
  );
}
