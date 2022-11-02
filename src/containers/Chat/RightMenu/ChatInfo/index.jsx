import { memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import Members from './Members';
import ChannelDetails from './ChannelDetails';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useChatContext, useKeyContext } from '~/contexts';
import { socket } from '~/constants/io';
import { v1 as uuidv1 } from 'uuid';
import { GENERAL_CHAT_ID } from '~/constants/defaultValues';
import CallButton from './CallButton';
import localize from '~/constants/localize';

const madeCallLabel = localize('madeCall');
const onlineLabel = localize('online');

ChatInfo.propTypes = {
  channelName: PropTypes.string,
  channelOnCall: PropTypes.object,
  currentChannel: PropTypes.object.isRequired,
  currentChannelOnlineMembers: PropTypes.object.isRequired,
  displayedThemeColor: PropTypes.string,
  selectedChannelId: PropTypes.number
};

function ChatInfo({
  selectedChannelId,
  channelOnCall,
  currentChannel,
  currentChannelOnlineMembers,
  displayedThemeColor,
  channelName
}) {
  const {
    userId: myId,
    username,
    profilePicUrl,
    banned
  } = useKeyContext((v) => v.myState);
  const onSetCall = useChatContext((v) => v.actions.onSetCall);
  const onHangUp = useChatContext((v) => v.actions.onHangUp);
  const onSubmitMessage = useChatContext((v) => v.actions.onSubmitMessage);

  const callOngoing = useMemo(
    () =>
      selectedChannelId === channelOnCall.id && !!channelOnCall.members[myId],
    [channelOnCall.id, channelOnCall.members, myId, selectedChannelId]
  );

  const calling = useMemo(() => {
    return !channelOnCall.callReceived && channelOnCall.imCalling;
  }, [channelOnCall.callReceived, channelOnCall.imCalling]);

  const voiceChatButtonShown = useMemo(() => {
    if (currentChannel.twoPeople) {
      if (currentChannel.members?.length !== 2) return false;
      return !!currentChannel.id;
    }
    return false;
  }, [currentChannel]);

  const displayedChannelMembers = useMemo(() => {
    const totalChannelMembers = currentChannel?.members || [];
    const me = { id: myId, username, profilePicUrl };
    let currentChannelOnlineMembersOtherThanMe = Object.values(
      currentChannelOnlineMembers
    ).filter((member) => !!member.id && member.id !== myId);
    if (selectedChannelId !== GENERAL_CHAT_ID) {
      const totalChannelMemberIds = totalChannelMembers.map(
        (member) => member.id
      );
      currentChannelOnlineMembersOtherThanMe =
        currentChannelOnlineMembersOtherThanMe.filter((member) =>
          totalChannelMemberIds.includes(member.id)
        );
    }
    const totalValidChannelMembers = totalChannelMembers.filter(
      (member) => !!member.id
    );
    const currentlyOnlineIds = Object.keys(currentChannelOnlineMembers).map(
      (memberId) => Number(memberId)
    );
    if (totalValidChannelMembers.length > 0) {
      const offlineChannelMembers = totalValidChannelMembers.filter(
        (member) =>
          !currentlyOnlineIds.includes(member.id) && member.id !== myId
      );
      return [
        me,
        ...currentChannelOnlineMembersOtherThanMe,
        ...offlineChannelMembers
      ];
    }
    return [me, ...currentChannelOnlineMembersOtherThanMe];
  }, [
    currentChannel?.members,
    myId,
    username,
    profilePicUrl,
    currentChannelOnlineMembers,
    selectedChannelId
  ]);

  const numOnline = useMemo(() => {
    return Object.keys(currentChannelOnlineMembers).length;
  }, [currentChannelOnlineMembers]);

  const handleCall = useCallback(async () => {
    if (!channelOnCall.id) {
      if (numOnline === 1) {
        const messageId = uuidv1();
        const partnerName = currentChannel?.members
          ?.map((member) => member.username)
          ?.filter((memberName) => memberName !== username)?.[0];
        return onSubmitMessage({
          messageId,
          message: {
            content: `${partnerName} is not online. Try calling ${partnerName} again when there's a green circle inside ${partnerName}'s profile picture.`,
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
    numOnline,
    profilePicUrl,
    selectedChannelId,
    username
  ]);

  return (
    <>
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
            <CallButton callOngoing={callOngoing} onCall={handleCall} />
          )}
          <ChannelDetails
            style={{ marginTop: '1rem' }}
            channelId={currentChannel.id}
            channelName={channelName}
          />
          {displayedChannelMembers.length > 2 && (
            <div
              className={css`
                color: ${Color[displayedThemeColor]()};
                font-size: 1.5rem;
                font-weight: bold;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.3rem;
                }
              `}
            >
              {numOnline}
              {currentChannel.id !== GENERAL_CHAT_ID &&
                '/' + displayedChannelMembers.length}{' '}
              {onlineLabel}
            </div>
          )}
        </div>
      </div>
      <Members
        channelId={selectedChannelId}
        creatorId={currentChannel.creatorId}
        members={displayedChannelMembers}
        onlineMembers={currentChannelOnlineMembers}
      />
    </>
  );
}

export default memo(ChatInfo);
