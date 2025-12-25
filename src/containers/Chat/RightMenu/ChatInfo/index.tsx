import React, { memo, useCallback, useContext, useMemo, useState } from 'react';
import Members from './Members';
import ChannelDetails from './ChannelDetails';
import AIChatMenu from './AIChatMenu';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useChatContext, useNotiContext, useKeyContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { v1 as uuidv1 } from 'uuid';
import {
  GENERAL_CHAT_ID,
  MAX_AI_CALL_DURATION
} from '~/constants/defaultValues';
import { checkMicrophoneAccess, objectify } from '~/helpers';
import ErrorBoundary from '~/components/ErrorBoundary';
import CallButton from './CallButton';
import LocalContext from '../../Context';
import MicrophoneAccessModal from '~/components/Modals/MicrophoneAccessModal';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import RichText from '~/components/Texts/RichText';

const madeCallLabel = 'made a call';
const onlineLabel = 'Online';

function ChatInfo({
  topicId,
  selectedChannelId,
  channelOnCall,
  currentChannel,
  currentOnlineUsers,
  displayedThemeColor,
  channelName,
  isZeroChat,
  isCielChat,
  isClass,
  onScrollToBottom
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
  isClass: boolean;
  onScrollToBottom: () => void;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const banned = useKeyContext((v) => v.myState.banned);
  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
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

  const files = useMemo(() => {
    if (!currentChannel?.files?.main?.ids) return [];
    if (currentChannel.selectedTab === 'topic') {
      if (!currentChannel?.files?.[topicId]?.ids) return [];
      return currentChannel.files[topicId].ids.map(
        (id: number) => currentChannel.fileDataObj[id]
      );
    }
    return (currentChannel.files?.main?.ids || []).map(
      (id: number) => currentChannel.fileDataObj?.[id]
    );
  }, [
    currentChannel.fileDataObj,
    currentChannel.selectedTab,
    currentChannel.files,
    topicId
  ]);

  const hasMoreFiles = useMemo(() => {
    if (currentChannel.selectedTab === 'topic') {
      return currentChannel.files?.[topicId]?.hasMore || false;
    }
    return currentChannel.files?.main?.hasMore || false;
  }, [currentChannel.selectedTab, currentChannel.files, topicId]);

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
    const onlineOthers = Object.values(currentOnlineUsers).filter(
      (member) =>
        !!member?.id &&
        member.id !== myId &&
        (currentChannel?.id === GENERAL_CHAT_ID ||
          allMemberIds?.includes(member.id))
    );
    return [me, ...onlineOthers];
  }, [
    myId,
    username,
    profilePicUrl,
    currentOnlineUsers,
    allMemberIds,
    currentChannel?.id
  ]);

  // Build members label (online count or total members)
  const showMembersLabel = useMemo(() => {
    return (
      ((onlineChannelMembers.length > 1 && !currentChannel.twoPeople) ||
        (onlineChannelMembers.length === 1 &&
          !!allMemberIds?.length &&
          allMemberIds?.length > 1 &&
          !currentChannel.twoPeople &&
          currentChannel.id !== GENERAL_CHAT_ID)) &&
      true
    );
  }, [
    onlineChannelMembers.length,
    currentChannel.twoPeople,
    allMemberIds?.length,
    currentChannel.id
  ]);

  const membersText = useMemo(() => {
    if (!showMembersLabel) return '';
    if (onlineChannelMembers.length > 1) {
      const totalPart =
        currentChannel.id !== GENERAL_CHAT_ID && allMemberIds?.length
          ? `/${allMemberIds.length}`
          : '';
      return `${onlineChannelMembers.length}${totalPart} ${onlineLabel}`;
    }
    return `${allMemberIds?.length || 0} members`;
  }, [
    showMembersLabel,
    onlineChannelMembers.length,
    currentChannel.id,
    allMemberIds?.length
  ]);

  const recentOfflineUsers = useChatContext((v) => v.state.recentOfflineUsers);
  const generalRecentOffline = useMemo(() => {
    if (currentChannel?.id !== GENERAL_CHAT_ID) return [];
    // Exclude anyone currently online; assume backend already sorted by lastActive desc
    const onlineIds = new Set(onlineChannelMembers.map((m) => m.id));
    const oneDayAgoSec = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
    const seenIds = new Set<number>();
    return (recentOfflineUsers || [])
      .filter((u: any) => !onlineIds.has(u.id))
      .filter((u: any) => Number(u.lastActive) >= oneDayAgoSec)
      .filter((u: any) => {
        if (seenIds.has(u.id)) return false;
        seenIds.add(u.id);
        return true;
      });
  }, [currentChannel?.id, onlineChannelMembers, recentOfflineUsers]);

  const displayedChannelMembers = useMemo(() => {
    if (currentChannel?.twoPeople) {
      const offlineMembers = (currentChannel?.members || []).filter(
        (m: { id: number }) =>
          !onlineChannelMembers.some((onlineM) => onlineM.id === m.id)
      );
      return [...onlineChannelMembers, ...offlineMembers];
    }
    if (currentChannel?.id === GENERAL_CHAT_ID) {
      return [...onlineChannelMembers, ...generalRecentOffline];
    }
    const offlineMembers = (currentChannel?.members || []).filter(
      (m: { id: number }) =>
        allMemberIds?.includes(m.id) &&
        !onlineChannelMembers.some((onlineM) => onlineM.id === m.id)
    );
    return [...onlineChannelMembers, ...offlineMembers];
  }, [
    currentChannel?.members,
    currentChannel?.twoPeople,
    onlineChannelMembers,
    allMemberIds,
    currentChannel?.id,
    generalRecentOffline
  ]);

  const [microphoneModalShown, setMicrophoneModalShown] = useState(false);

  const initiateCall = useCallback(() => {
    if (isZeroChat || isCielChat) {
      onSetAICall(selectedChannelId);
      socket.emit('ai_start_ai_voice_conversation', {
        channelId: selectedChannelId,
        topicId: currentChannel.selectedTab === 'topic' ? topicId : undefined
      });
    } else {
      if (onlineChannelMembers?.length === 1) {
        const messageId = uuidv1();
        const partnerName =
          currentChannel?.members
            ?.map((m: { username: string }) => m.username)
            ?.filter((name: string) => name !== username)?.[0] || '';

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
      onScrollToBottom();
      onSetCall({
        imCalling: true,
        channelId: selectedChannelId
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isZeroChat,
    isCielChat,
    selectedChannelId,
    currentChannel?.selectedTab,
    currentChannel?.members,
    topicId,
    onlineChannelMembers?.length,
    profilePicUrl,
    myId,
    username
  ]);

  const handleCallButtonClick = useCallback(async () => {
    // If call is ongoing, handle hang up
    if (callOngoing || aiCallOngoing) {
      if (isZeroChat || isCielChat) {
        onSetAICall(null);
        socket.emit('ai_end_ai_voice_conversation');
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
        socket.emit('hang_up_call', channelOnCall.id);
      }
      return;
    }

    // Check microphone access for new calls
    const hasAccess = await checkMicrophoneAccess();
    if (hasAccess) {
      initiateCall();
    } else {
      setMicrophoneModalShown(true);
    }
  }, [
    callOngoing,
    aiCallOngoing,
    isZeroChat,
    isCielChat,
    calling,
    myId,
    channelOnCall.id,
    onSetAICall,
    onSetCall,
    onHangUp,
    initiateCall
  ]);

  const isAIChat = useMemo(
    () => isZeroChat || isCielChat,
    [isZeroChat, isCielChat]
  );

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
                onCall={handleCallButtonClick}
              />
            )}
          </ErrorBoundary>
          <ErrorBoundary componentPath="Chat/RightMenu/ChatInfo/ChannelDetails">
            <ChannelDetails
              channelId={currentChannel.id}
              channelName={channelName}
              thumbPath={currentChannel.thumbPath}
              subLabel={
                currentChannel.thumbPath && showMembersLabel ? (
                  <span>{membersText}</span>
                ) : undefined
              }
            />
          </ErrorBoundary>

          <ErrorBoundary componentPath="Chat/RightMenu/ChatInfo/OnlineMembers">
            {showMembersLabel && !currentChannel.thumbPath && (
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
                <span>{membersText}</span>
              </div>
            )}
          </ErrorBoundary>

          {!currentChannel.twoPeople && (
            <div
              className={css`
                padding: 1rem;
                margin-top: 0.5rem;
                font-size: 1.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.3rem;
                }
              `}
            >
              {!stringIsEmpty(currentChannel.description) && (
                <div
                  className={css`
                    padding: 1rem;
                    background: ${Color.wellGray()};
                    border-radius: ${borderRadius};
                    max-height: 20rem;
                    overflow-y: auto;
                  `}
                >
                  <RichText
                    className={css`
                      font-size: 1.3rem;
                      @media (max-width: ${mobileMaxWidth}) {
                        font-size: 1.2rem;
                      }
                    `}
                    maxLines={5}
                    readMoreColor={Color.darkGray()}
                    showMoreButtonStyle={{ fontSize: '1.2rem' }}
                    isShowMoreButtonCentered
                    theme={displayedThemeColor}
                  >
                    {currentChannel.description}
                  </RichText>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!isAIChat && (
        <Members
          channelId={selectedChannelId}
          creatorId={currentChannel.creatorId}
          isAIChat={isZeroChat || isCielChat}
          isClass={isClass}
          members={displayedChannelMembers}
          theme={displayedThemeColor}
          loadMoreMembersShown={currentChannel?.loadMoreMembersShown}
          onlineMemberObj={objectify(onlineChannelMembers)}
        />
      )}
      {isAIChat && (
        <AIChatMenu
          channelId={selectedChannelId}
          displayedThemeColor={displayedThemeColor}
          files={files}
          hasMoreFiles={hasMoreFiles}
          topicId={topicId}
          isCielChat={isCielChat}
          isCallButtonShown={isCallButtonShown}
          isTwoPeopleConnected={isTwoPeopleConnected}
          bookmarkedMessages={currentChannel.bookmarkedMessages}
          loadMoreBookmarksShown={currentChannel.loadMoreBookmarksShown}
          topicObj={currentChannel.topicObj}
        />
      )}
      <MicrophoneAccessModal
        isShown={microphoneModalShown}
        onHide={() => setMicrophoneModalShown(false)}
        onSuccess={() => {
          setMicrophoneModalShown(false);
          initiateCall();
        }}
      />
    </ErrorBoundary>
  );
}

export default memo(ChatInfo);
