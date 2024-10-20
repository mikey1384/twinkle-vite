import React, { memo, useCallback, useContext, useMemo, useState } from 'react';
import Members from './Members';
import ChannelDetails from './ChannelDetails';
import AIChatMenu from './AIChatMenu';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useChatContext, useNotiContext, useKeyContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { v1 as uuidv1 } from 'uuid';
import {
  GENERAL_CHAT_ID,
  MAX_AI_CALL_DURATION
} from '~/constants/defaultValues';
import { objectify } from '~/helpers';
import ErrorBoundary from '~/components/ErrorBoundary';
import CallButton from './CallButton';
import localize from '~/constants/localize';
import LocalContext from '../../Context';
import MicrophoneAccessModal from './MicrophoneAccessModal';

const madeCallLabel = localize('madeCall');
const onlineLabel = localize('online');

function ChatInfo({
  topicId,
  selectedChannelId,
  channelOnCall,
  currentChannel,
  currentOnlineUsers,
  displayedThemeColor,
  channelName,
  isZeroChat,
  isCielChat
}: {
  topicId: number;
  selectedChannelId: number;
  channelOnCall: any;
  currentChannel: any;
  currentOnlineUsers: any[];
  displayedThemeColor: string;
  channelName: string;
  isZeroChat: boolean;
  isCielChat: boolean;
}) {
  const {
    userId: myId,
    username,
    profilePicUrl,
    banned,
    isAdmin
  } = useKeyContext((v) => v.myState);
  const [callDisabled, setCallDisabled] = useState(false);
  const onSetCall = useChatContext((v) => v.actions.onSetCall);
  const onSetAICall = useChatContext((v) => v.actions.onSetAICall);
  const onHangUp = useChatContext((v) => v.actions.onHangUp);
  const onSubmitMessage = useChatContext((v) => v.actions.onSubmitMessage);
  const todayStats = useNotiContext((v) => v.state.todayStats);

  const {
    state: { aiCallChannelId }
  } = useContext(LocalContext);

  const aiCallDuration = useMemo(() => {
    if (!todayStats) return 0;
    return todayStats.aiCallDuration;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStats?.aiCallDuration]);

  const maxAiCallDurationReachedAndIsAIChat = useMemo(() => {
    if (isAdmin) return false;
    return aiCallDuration >= MAX_AI_CALL_DURATION && (isZeroChat || isCielChat);
  }, [aiCallDuration, isAdmin, isZeroChat, isCielChat]);

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
  const aiCallOngoing = useMemo(
    () => !!selectedChannelId && selectedChannelId === aiCallChannelId,
    [aiCallChannelId, selectedChannelId]
  );

  const calling = useMemo(() => {
    return !channelOnCall.callReceived && channelOnCall.imCalling;
  }, [channelOnCall.callReceived, channelOnCall.imCalling]);

  const isTwoPeopleConnected = useMemo(() => {
    if (currentChannel?.twoPeople) {
      if (currentChannel?.members?.length !== 2) return false;
      return !!currentChannel?.id;
    }
    return false;
  }, [
    currentChannel?.twoPeople,
    currentChannel?.members?.length,
    currentChannel?.id
  ]);

  const isCallButtonShown = useMemo(() => {
    if (banned?.chat) return false;
    const isRegularChat = !(isZeroChat || isCielChat);
    return (isZeroChat || isRegularChat) && isTwoPeopleConnected;
  }, [banned?.chat, isZeroChat, isCielChat, isTwoPeopleConnected]);

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

  const [showMicrophoneModal, setShowMicrophoneModal] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  const initiateCall = useCallback(() => {
    if (isZeroChat || isCielChat) {
      if (aiCallOngoing) {
        onSetAICall(null);
        socket.emit('ai_end_ai_voice_conversation');
      } else {
        onSetAICall(selectedChannelId);
        socket.emit('ai_start_ai_voice_conversation', {
          channelId: selectedChannelId,
          topicId: currentChannel.selectedTab === 'topic' ? topicId : undefined
        });
      }
    } else {
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
            isCallMsg: true
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
                isCallMsg: true
              }
            });
            onSetCall({
              imCalling: true,
              channelId: selectedChannelId
            });
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    aiCallOngoing,
    isZeroChat,
    isCielChat,
    calling,
    selectedChannelId,
    channelOnCall?.id,
    onlineChannelMembers?.length,
    profilePicUrl,
    myId,
    username,
    topicId,
    currentChannel?.members
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
          <ErrorBoundary componentPath="Chat/RightMenu/ChatInfo/CallButton">
            {isCallButtonShown && (
              <CallButton
                callOngoing={callOngoing || aiCallOngoing}
                disabled={
                  callDisabled ||
                  (!aiCallOngoing &&
                    !isAdmin &&
                    maxAiCallDurationReachedAndIsAIChat)
                }
                onCall={handleCall}
              />
            )}
          </ErrorBoundary>
          <ErrorBoundary componentPath="Chat/RightMenu/ChatInfo/ChannelDetails">
            <ChannelDetails
              style={{ marginTop: '1rem' }}
              channelId={currentChannel.id}
              channelName={channelName}
            />
          </ErrorBoundary>
          <ErrorBoundary componentPath="Chat/RightMenu/ChatInfo/OnlineMembers">
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
          </ErrorBoundary>
        </div>
      </div>
      <Members
        key={selectedChannelId}
        channelId={selectedChannelId}
        creatorId={currentChannel.creatorId}
        isAIChat={isZeroChat || isCielChat}
        members={displayedChannelMembers}
        theme={displayedThemeColor}
        loadMoreMembersShown={currentChannel?.loadMoreMembersShown}
        onlineMemberObj={objectify(onlineChannelMembers)}
      />
      {(isZeroChat || isCielChat) && (
        <AIChatMenu
          channelId={selectedChannelId}
          displayedThemeColor={displayedThemeColor}
          topicId={topicId}
          isZeroChat={isZeroChat}
          isCielChat={isCielChat}
          isCallButtonShown={isCallButtonShown}
          isTwoPeopleConnected={isTwoPeopleConnected}
          bookmarkedMessages={currentChannel.bookmarkedMessages}
          loadMoreBookmarksShown={currentChannel.loadMoreBookmarksShown}
          topicObj={currentChannel.topicObj}
          settings={currentChannel.settings}
          aiThinkingLevel={currentChannel.aiThinkingLevel}
        />
      )}
      <MicrophoneAccessModal
        show={showMicrophoneModal}
        onHide={() => setShowMicrophoneModal(false)}
        onGrantAccess={requestMicrophoneAccess}
        showManualInstructions={showManualInstructions}
      />
    </ErrorBoundary>
  );

  async function checkMicrophoneAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone access not granted:', error);
      return false;
    }
  }

  async function requestMicrophoneAccess() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setShowMicrophoneModal(false);
      initiateCall();
    } catch (error) {
      console.error('Failed to get microphone access:', error);
      setShowManualInstructions(true);
    }
  }

  async function handleCall() {
    const hasAccess = await checkMicrophoneAccess();
    if (hasAccess) {
      initiateCall();
    } else {
      setShowMicrophoneModal(true);
    }
  }
}

export default memo(ChatInfo);
