import { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import AccountMenu from './AccountMenu';
import MainNavs from './MainNavs';
import TwinkleLogo from './TwinkleLogo';
import ErrorBoundary from '~/components/ErrorBoundary';
import Peer from 'simple-peer';
import { css } from '@emotion/css';
import { capitalize } from '~/helpers/stringHelpers';
import { Color, mobileMaxWidth, desktopMinWidth } from '~/constants/css';
import { socket } from '~/constants/io';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSectionFromPathname, parseChannelPath } from '~/helpers';
import {
  useAppContext,
  useContentContext,
  useViewContext,
  useHomeContext,
  useMissionContext,
  useNotiContext,
  useChatContext,
  useKeyContext
} from '~/contexts';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID,
  TURN_USERNAME,
  TURN_PASSWORD
} from '~/constants/defaultValues';

Header.propTypes = {
  onMobileMenuOpen: PropTypes.func,
  style: PropTypes.object
};

export default function Header({ onMobileMenuOpen, style = {} }) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const currentPathId = useMemo(
    () => pathname.split('chat/')[1]?.split('/')?.[0],
    [pathname]
  );
  const pageTitle = useViewContext((v) => v.state.pageTitle);
  const usingChat = useMemo(
    () => getSectionFromPathname(pathname)?.section === 'chat',
    [pathname]
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onSetLastChatPath = useAppContext(
    (v) => v.user.actions.onSetLastChatPath
  );
  const checkChatAccessible = useAppContext(
    (v) => v.requestHelpers.checkChatAccessible
  );
  const checkIfHomeOutdated = useAppContext(
    (v) => v.requestHelpers.checkIfHomeOutdated
  );
  const checkVersion = useAppContext((v) => v.requestHelpers.checkVersion);
  const fetchNotifications = useAppContext(
    (v) => v.requestHelpers.fetchNotifications
  );
  const loadRewards = useAppContext((v) => v.requestHelpers.loadRewards);
  const getNumberOfUnreadMessages = useAppContext(
    (v) => v.requestHelpers.getNumberOfUnreadMessages
  );
  const loadChat = useAppContext((v) => v.requestHelpers.loadChat);
  const loadRankings = useAppContext((v) => v.requestHelpers.loadRankings);
  const loadCoins = useAppContext((v) => v.requestHelpers.loadCoins);
  const loadXP = useAppContext((v) => v.requestHelpers.loadXP);
  const updateChatLastRead = useAppContext(
    (v) => v.requestHelpers.updateChatLastRead
  );

  const { searchFilter, userId, username, loggedIn, profilePicUrl } =
    useKeyContext((v) => v.myState);
  const {
    header: { color: headerColor }
  } = useKeyContext((v) => v.theme);

  const channelOnCall = useChatContext((v) => v.state.channelOnCall);
  const chatType = useChatContext((v) => v.state.chatType);
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);

  const subchannelPath = useMemo(() => {
    if (!currentPathId) return null;
    const [, result] = pathname.split(currentPathId)?.[1]?.split('/') || [];
    return result;
  }, [currentPathId, pathname]);

  const myStream = useChatContext((v) => v.state.myStream);
  const numUnreads = useChatContext((v) => v.state.numUnreads);
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const onAddReactionToMessage = useChatContext(
    (v) => v.actions.onAddReactionToMessage
  );
  const onChangeAwayStatus = useChatContext(
    (v) => v.actions.onChangeAwayStatus
  );
  const onChangeBusyStatus = useChatContext(
    (v) => v.actions.onChangeBusyStatus
  );
  const onChangeOnlineStatus = useChatContext(
    (v) => v.actions.onChangeOnlineStatus
  );
  const onChangeChatSubject = useChatContext(
    (v) => v.actions.onChangeChatSubject
  );
  const onEnableChatSubject = useChatContext(
    (v) => v.actions.onEnableChatSubject
  );
  const onSetReconnecting = useChatContext((v) => v.actions.onSetReconnecting);
  const onChangeChannelOwner = useChatContext(
    (v) => v.actions.onChangeChannelOwner
  );
  const onChangeChannelSettings = useChatContext(
    (v) => v.actions.onChangeChannelSettings
  );
  const onClearRecentChessMessage = useChatContext(
    (v) => v.actions.onClearRecentChessMessage
  );
  const onHideAttachment = useChatContext((v) => v.actions.onHideAttachment);
  const onCallReceptionConfirm = useChatContext(
    (v) => v.actions.onCallReceptionConfirm
  );
  const onDeleteMessage = useChatContext((v) => v.actions.onDeleteMessage);
  const onEditMessage = useChatContext((v) => v.actions.onEditMessage);
  const onLeaveChannel = useChatContext((v) => v.actions.onLeaveChannel);
  const onGetNumberOfUnreadMessages = useChatContext(
    (v) => v.actions.onGetNumberOfUnreadMessages
  );
  const onHangUp = useChatContext((v) => v.actions.onHangUp);
  const onInitChat = useChatContext((v) => v.actions.onInitChat);
  const onReceiveFirstMsg = useChatContext((v) => v.actions.onReceiveFirstMsg);
  const onReceiveMessage = useChatContext((v) => v.actions.onReceiveMessage);
  const onReceiveMessageOnDifferentChannel = useChatContext(
    (v) => v.actions.onReceiveMessageOnDifferentChannel
  );
  const onReceiveVocabActivity = useChatContext(
    (v) => v.actions.onReceiveVocabActivity
  );
  const onRemoveReactionFromMessage = useChatContext(
    (v) => v.actions.onRemoveReactionFromMessage
  );
  const onResetChat = useChatContext((v) => v.actions.onResetChat);
  const onSetCall = useChatContext((v) => v.actions.onSetCall);
  const onSetMembersOnCall = useChatContext(
    (v) => v.actions.onSetMembersOnCall
  );
  const onSetMyStream = useChatContext((v) => v.actions.onSetMyStream);
  const onSetOnlineUserData = useChatContext(
    (v) => v.actions.onSetOnlineUserData
  );
  const onSetOnlineMembers = useChatContext(
    (v) => v.actions.onSetOnlineMembers
  );
  const onSetPeerStreams = useChatContext((v) => v.actions.onSetPeerStreams);
  const onShowIncoming = useChatContext((v) => v.actions.onShowIncoming);
  const onShowOutgoing = useChatContext((v) => v.actions.onShowOutgoing);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onUpdateCollectorsRankings = useChatContext(
    (v) => v.actions.onUpdateCollectorsRankings
  );

  const category = useHomeContext((v) => v.state.category);
  const feeds = useHomeContext((v) => v.state.feeds);
  const subFilter = useHomeContext((v) => v.state.subFilter);
  const onSetFeedsOutdated = useHomeContext(
    (v) => v.actions.onSetFeedsOutdated
  );

  const numNewNotis = useNotiContext((v) => v.state.numNewNotis);
  const numNewPosts = useNotiContext((v) => v.state.numNewPosts);
  const notiObj = useNotiContext((v) => v.state.notiObj);
  const totalRewardedTwinkles = useMemo(
    () => notiObj[userId]?.totalRewardedTwinkles || 0,
    [notiObj, userId]
  );
  const totalRewardedTwinkleCoins = useMemo(
    () => notiObj[userId]?.totalRewardedTwinkleCoins || 0,
    [notiObj, userId]
  );
  const versionMatch = useNotiContext((v) => v.state.versionMatch);
  const prevUserId = useNotiContext((v) => v.state.prevUserId);
  const onChangeSocketStatus = useNotiContext(
    (v) => v.actions.onChangeSocketStatus
  );
  const onCheckVersion = useNotiContext((v) => v.actions.onCheckVersion);
  const onLoadNotifications = useNotiContext(
    (v) => v.actions.onLoadNotifications
  );
  const onLoadRewards = useNotiContext((v) => v.actions.onLoadRewards);
  const onGetRanks = useNotiContext((v) => v.actions.onGetRanks);
  const onIncreaseNumNewPosts = useNotiContext(
    (v) => v.actions.onIncreaseNumNewPosts
  );
  const onIncreaseNumNewNotis = useNotiContext(
    (v) => v.actions.onIncreaseNumNewNotis
  );
  const onNotifyChatSubjectChange = useNotiContext(
    (v) => v.actions.onNotifyChatSubjectChange
  );
  const onShowUpdateNotice = useNotiContext(
    (v) => v.actions.onShowUpdateNotice
  );
  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const onAttachReward = useContentContext((v) => v.actions.onAttachReward);
  const onLikeContent = useContentContext((v) => v.actions.onLikeContent);
  const onRecommendContent = useContentContext(
    (v) => v.actions.onRecommendContent
  );
  const onUploadComment = useContentContext((v) => v.actions.onUploadComment);
  const onUploadReply = useContentContext((v) => v.actions.onUploadReply);
  const state = useContentContext((v) => v.state);

  const onUpdateMissionAttempt = useMissionContext(
    (v) => v.actions.onUpdateMissionAttempt
  );

  const prevProfilePicUrl = useRef(profilePicUrl);
  const peersRef = useRef({});
  const prevMyStreamRef = useRef(null);
  const prevIncomingShown = useRef(false);
  const membersOnCall = useRef({});
  const receivedCallSignals = useRef([]);

  useEffect(() => {
    if (userId !== prevUserId) {
      onResetChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevUserId, userId]);

  useEffect(() => {
    socket.disconnect();
    socket.connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const currentPathIdRef = useRef(Number(currentPathId));

  useEffect(() => {
    socket.on('ban_status_updated', handleBanStatusUpdate);
    socket.on('signal_received', handleCallSignal);
    socket.on('online_status_changed', handleOnlineStatusChange);
    socket.on('away_status_changed', handleAwayStatusChange);
    socket.on('busy_status_changed', handleBusyStatusChange);
    socket.on('call_terminated', handleCallTerminated);
    socket.on('call_reception_confirmed', handleCallReceptionConfirm);
    socket.on('chat_invitation_received', handleChatInvitation);
    socket.on('chat_message_deleted', onDeleteMessage);
    socket.on('chat_message_edited', onEditMessage);
    socket.on('chat_reaction_added', onAddReactionToMessage);
    socket.on('chat_reaction_removed', onRemoveReactionFromMessage);
    socket.on('chat_subject_purchased', onEnableChatSubject);
    socket.on('channel_owner_changed', handleChangeChannelOwner);
    socket.on('channel_settings_changed', onChangeChannelSettings);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('left_chat_from_another_tab', handleLeftChatFromAnotherTab);
    socket.on('message_attachment_hid', onHideAttachment);
    socket.on('mission_rewards_received', handleMissionRewards);
    socket.on('new_call_member', handleNewCallMember);
    socket.on('new_call_started', handleNewCall);
    socket.on('new_post_uploaded', handleNewPost);
    socket.on('new_notification_received', handleNewNotification);
    socket.on('new_message_received', handleReceiveMessage);
    socket.on('new_reward_posted', handleNewReward);
    socket.on('new_recommendation_posted', handleNewRecommendation);
    socket.on('new_vocab_activity_received', handleReceiveVocabActivity);
    socket.on('new_wordle_attempt_received', handleNewWordleAttempt);
    socket.on('peer_accepted', handlePeerAccepted);
    socket.on('peer_hung_up', handlePeerHungUp);
    socket.on('profile_pic_changed', handleProfilePicChange);
    socket.on('subject_changed', handleTopicChange);
    socket.on('user_type_updated', handleUserTypeUpdate);
    socket.on('username_changed', handleUsernameChange);

    return function cleanUp() {
      socket.removeListener('ban_status_updated', handleBanStatusUpdate);
      socket.removeListener('signal_received', handleCallSignal);
      socket.removeListener('online_status_changed', handleOnlineStatusChange);
      socket.removeListener('away_status_changed', handleAwayStatusChange);
      socket.removeListener('busy_status_changed', handleBusyStatusChange);
      socket.removeListener('call_terminated', handleCallTerminated);
      socket.removeListener(
        'call_reception_confirmed',
        handleCallReceptionConfirm
      );
      socket.removeListener('chat_invitation_received', handleChatInvitation);
      socket.removeListener('chat_message_deleted', onDeleteMessage);
      socket.removeListener('chat_message_edited', onEditMessage);
      socket.removeListener('chat_reaction_added', onAddReactionToMessage);
      socket.removeListener(
        'chat_reaction_removed',
        onRemoveReactionFromMessage
      );
      socket.removeListener('chat_subject_purchased', onEnableChatSubject);
      socket.removeListener('channel_owner_changed', handleChangeChannelOwner);
      socket.removeListener(
        'channel_settings_changed',
        onChangeChannelSettings
      );
      socket.removeListener('connect', handleConnect);
      socket.removeListener('disconnect', handleDisconnect);
      socket.removeListener(
        'left_chat_from_another_tab',
        handleLeftChatFromAnotherTab
      );
      socket.removeListener('message_attachment_hid', onHideAttachment);
      socket.removeListener('mission_rewards_received', handleMissionRewards);
      socket.removeListener('new_call_member', handleNewCallMember);
      socket.removeListener('new_call_started', handleNewCall);
      socket.removeListener('new_post_uploaded', handleNewPost);
      socket.removeListener('new_notification_received', handleNewNotification);
      socket.removeListener('new_message_received', handleReceiveMessage);
      socket.removeListener('new_reward_posted', handleNewReward);
      socket.removeListener(
        'new_vocab_activity_received',
        handleReceiveVocabActivity
      );
      socket.removeListener(
        'new_wordle_attempt_received',
        handleNewWordleAttempt
      );
      socket.removeListener(
        'new_recommendation_posted',
        handleNewRecommendation
      );
      socket.removeListener('peer_accepted', handlePeerAccepted);
      socket.removeListener('peer_hung_up', handlePeerHungUp);
      socket.removeListener('profile_pic_changed', handleProfilePicChange);
      socket.removeListener('subject_changed', handleTopicChange);
      socket.removeListener('user_type_updated', handleUserTypeUpdate);
      socket.removeListener('username_changed', handleUsernameChange);
    };

    function handleBanStatusUpdate(banStatus) {
      onSetUserState({ userId, newState: { banned: banStatus } });
    }

    function handleChangeChannelOwner({ channelId, message, newOwner }) {
      updateChatLastRead(channelId);
      onChangeChannelOwner({ channelId, message, newOwner });
    }

    async function handleConnect() {
      console.log('connected to socket');
      onClearRecentChessMessage(selectedChannelId);
      onChangeSocketStatus(true);
      handleCheckVersion();
      handleCheckOutdated();
      if (userId) {
        handleGetNumberOfUnreadMessages();
        socket.emit(
          'bind_uid_to_socket',
          { userId, username, profilePicUrl },
          () => {
            socket.emit('change_busy_status', !usingChat);
          }
        );
        socket.emit('enter_my_notification_channel', userId);
        handleLoadChat(selectedChannelId);
      }

      async function handleLoadChat() {
        onSetReconnecting(true);
        const pathId = Number(currentPathId);
        let currentChannelIsAccessible = true;
        if (!isNaN(pathId)) {
          const { isAccessible } = await checkChatAccessible(pathId);
          currentChannelIsAccessible = isAccessible;
        }
        const data = await loadChat({
          channelId: !isNaN(pathId)
            ? parseChannelPath(pathId)
            : selectedChannelId,
          subchannelPath
        });
        onInitChat(data);
        socket.emit(
          'check_online_members',
          selectedChannelId,
          ({ membersOnline }) => {
            const members = Object.values(membersOnline);
            const onlineMemberIds = members.map((member) => member.id);
            onSetOnlineMembers(onlineMemberIds);
            for (let member of members) {
              onSetOnlineUserData(member);
            }
          }
        );
        if (!currentChannelIsAccessible) {
          onUpdateSelectedChannelId(GENERAL_CHAT_ID);
          return navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
        }
      }

      async function handleCheckOutdated() {
        const firstFeed = feeds[0];
        if (
          firstFeed?.lastInteraction &&
          (category === 'uploads' || category === 'recommended')
        ) {
          const outdated = await checkIfHomeOutdated({
            lastInteraction: feeds[0] ? feeds[0].lastInteraction : 0,
            category,
            subFilter
          });
          onSetFeedsOutdated(outdated.length > 0);
        }
      }

      async function handleCheckVersion() {
        const data = await checkVersion();
        onCheckVersion(data);
      }

      async function handleGetNumberOfUnreadMessages() {
        const numUnreads = await getNumberOfUnreadMessages();
        onGetNumberOfUnreadMessages(numUnreads);
      }
    }

    function handleOnlineStatusChange({ userId, member, isOnline }) {
      onChangeOnlineStatus({ userId, member, isOnline });
    }
    function handleAwayStatusChange({ userId, isAway }) {
      if (chatStatus[userId] && chatStatus[userId].isAway !== isAway) {
        onChangeAwayStatus({ userId, isAway });
      }
    }

    function handleBusyStatusChange({ userId, isBusy }) {
      if (chatStatus[userId] && chatStatus[userId].isBusy !== isBusy) {
        onChangeBusyStatus({ userId, isBusy });
      }
    }

    function handleCallTerminated() {
      onSetCall({});
      onSetMyStream(null);
      onSetPeerStreams({});
      onSetMembersOnCall({});
      membersOnCall.current = {};
      peersRef.current = {};
      prevMyStreamRef.current = null;
      prevIncomingShown.current = false;
      receivedCallSignals.current = [];
    }

    function handleCallReceptionConfirm(channelId) {
      onCallReceptionConfirm(channelId);
    }

    function handleCallSignal({ peerId, signal, to }) {
      if (to === userId && peersRef.current[peerId]) {
        if (peersRef.current[peerId].signal) {
          try {
            peersRef.current[peerId].signal(signal);
          } catch (error) {
            console.error(error);
          }
        }
      }
    }

    function handleChatInvitation({ message, members, isClass, pathId }) {
      let duplicate = false;
      if (selectedChannelId === 0) {
        if (
          members.filter((member) => member.userId !== userId)[0].userId ===
          channelsObj[selectedChannelId].members.filter(
            (member) => member.userId !== userId
          )[0].userId
        ) {
          duplicate = true;
        }
      }
      socket.emit('join_chat_group', message.channelId);
      onReceiveFirstMsg({ message, duplicate, isClass, pageVisible, pathId });
    }

    function handleDisconnect(reason) {
      console.log('disconnected from socket. reason: ', reason);
      onChangeSocketStatus(false);
    }

    async function handleLeftChatFromAnotherTab(channelId) {
      if (selectedChannelId === channelId) {
        onLeaveChannel({ channelId, userId });
        if (usingChat) {
          navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
        } else {
          onUpdateSelectedChannelId(GENERAL_CHAT_ID);
          onSetLastChatPath(`/${GENERAL_CHAT_PATH_ID}`);
        }
      } else {
        onLeaveChannel({ channelId, userId });
      }
    }

    function handleMissionRewards({
      includesCoinReward,
      includesXpReward,
      missionId
    }) {
      if (includesCoinReward) {
        handleUpdateMyCoins();
      }
      if (includesXpReward) {
        handleUpdateMyXp();
      }
      onUpdateMissionAttempt({
        missionId,
        newState: { status: 'pass', tryingAgain: false }
      });
    }

    function handleNewNotification({ likes, target }) {
      if (likes) {
        onLikeContent({
          likes,
          contentId: target.contentId,
          contentType: target.contentType
        });
      }
      onIncreaseNumNewNotis();
    }

    function handleNewPost({ comment, target }) {
      if (comment) {
        if (target.commentId || target.replyId) {
          onUploadReply({
            ...target,
            ...comment
          });
        } else {
          onUploadComment({
            contentId: target.contentId,
            contentType: target.contentType,
            ...comment
          });
        }
      }
      onIncreaseNumNewPosts();
    }

    function handleNewRecommendation({
      uploaderId,
      recommendations,
      recommenderId,
      target,
      newlyRecommended
    }) {
      if (state[target.contentType + target.contentId]) {
        onRecommendContent({
          recommendations,
          contentId: target.contentId,
          contentType: target.contentType
        });
      }
      if (
        uploaderId === userId &&
        newlyRecommended &&
        recommenderId !== userId
      ) {
        onIncreaseNumNewNotis();
      }
    }

    async function handleNewReward({ target, reward, receiverId }) {
      if (reward.rewarderId !== userId) {
        onAttachReward({
          reward,
          contentId: target.contentId,
          contentType: target.contentType
        });
      }
      if (receiverId === userId) {
        const [
          { currentChatSubject, loadMoreNotifications, notifications },
          {
            rewards,
            loadMoreRewards,
            totalRewardedTwinkles,
            totalRewardedTwinkleCoins
          }
        ] = await Promise.all([fetchNotifications(), loadRewards()]);
        onLoadRewards({
          rewards,
          loadMoreRewards,
          totalRewardedTwinkles,
          totalRewardedTwinkleCoins,
          userId
        });
        onLoadNotifications({
          currentChatSubject,
          loadMoreNotifications,
          notifications,
          userId
        });
      }
    }

    function handleNewCallMember({ socketId, memberId }) {
      if (!channelOnCall.members?.[memberId]) {
        onSetMembersOnCall({ [memberId]: socketId });
      }
      membersOnCall.current[socketId] = true;
    }

    function handleNewCall({ memberId, channelId, peerId }) {
      if (!channelOnCall.id) {
        if (memberId !== userId && !membersOnCall.current[peerId]) {
          onSetCall({
            channelId,
            isClass: channelsObj[selectedChannelId]?.isClass
          });
        }
      }
      if (
        !channelOnCall.id ||
        (channelOnCall.id === channelId && channelOnCall.imCalling)
      ) {
        if (!channelOnCall.members?.[memberId]) {
          onSetMembersOnCall({ [memberId]: peerId });
        }
        membersOnCall.current[peerId] = true;
      }
    }

    function handleNewWordleAttempt({
      channelId,
      channelName,
      user,
      message,
      pathId
    }) {
      const isForCurrentChannel = channelId === selectedChannelId;
      if (isForCurrentChannel) {
        if (usingChat) {
          updateChatLastRead(channelId);
        }
        onReceiveMessage({
          message,
          pageVisible,
          usingChat
        });
      }
      if (!isForCurrentChannel) {
        onReceiveMessageOnDifferentChannel({
          message,
          channel: {
            id: channelId,
            channelName,
            pathId
          },
          pageVisible,
          usingChat
        });
      }
      if (user.id === userId && user.newXp) {
        handleUpdateMyXp();
      }
    }

    function handlePeerAccepted({ channelId, to, peerId }) {
      if (to === userId) {
        try {
          handleNewPeer({
            peerId,
            channelId,
            stream: myStream
          });
        } catch (error) {
          console.error(error);
        }
      }
    }

    function handlePeerHungUp({ channelId, memberId, peerId }) {
      if (
        Number(channelId) === Number(channelOnCall.id) &&
        membersOnCall.current[peerId]
      ) {
        delete membersOnCall.current[peerId];
        onHangUp({ peerId, memberId, iHungUp: memberId === userId });
      }
    }

    function handleProfilePicChange({ userId, profilePicUrl }) {
      onSetUserState({ userId, newState: { profilePicUrl } });
    }

    async function handleReceiveMessage({ message, channel, newMembers }) {
      const messageIsForCurrentChannel =
        message.channelId === selectedChannelId;
      const senderIsUser = message.userId === userId;
      if (senderIsUser && pageVisible) return;
      if (messageIsForCurrentChannel) {
        if (usingChat) {
          updateChatLastRead(message.channelId);
        }
        onReceiveMessage({
          message,
          pageVisible,
          usingChat,
          newMembers
        });
      }
      if (!messageIsForCurrentChannel) {
        onReceiveMessageOnDifferentChannel({
          message,
          channel,
          pageVisible,
          usingChat,
          newMembers
        });
      }
      if (message.targetMessage?.userId === userId && message.rewardAmount) {
        handleUpdateMyXp();
      }
    }

    function handleUserTypeUpdate({ userId, userType, userTypeProps }) {
      onSetUserState({ userId, newState: { userType, ...userTypeProps } });
    }

    function handleUsernameChange({ userId, newUsername }) {
      onSetUserState({ userId, newState: { username: newUsername } });
    }

    function handleReceiveVocabActivity(activity) {
      const senderIsNotTheUser = activity.userId !== userId;
      if (senderIsNotTheUser) {
        onReceiveVocabActivity({
          activity,
          usingVocabSection: chatType === 'vocabulary'
        });
        onUpdateCollectorsRankings({
          id: activity.userId,
          username: activity.username,
          profilePicUrl: activity.profilePicUrl,
          numWordsCollected: activity.numWordsCollected,
          rank: activity.rank
        });
      }
    }

    function handleTopicChange({ channelId, subchannelId, subject }) {
      if (channelId === GENERAL_CHAT_ID && !subchannelId) {
        onNotifyChatSubjectChange(subject);
      }
      onChangeChatSubject({ subject, channelId, subchannelId });
    }
  });

  useEffect(() => {
    socket.emit(
      'check_online_members',
      selectedChannelId,
      ({ callData, membersOnline }) => {
        if (callData && Object.keys(membersOnCall.current).length === 0) {
          const membersHash = {};
          for (let member of Object.values(membersOnline).filter(
            (member) => !!callData.peers[member.socketId]
          )) {
            membersHash[member.id] = member.socketId;
          }
          onSetCall({
            channelId: selectedChannelId,
            isClass: channelsObj[selectedChannelId]?.isClass
          });
          onSetMembersOnCall(membersHash);
          membersOnCall.current = callData.peers;
        }
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId]);

  useEffect(() => {
    if (userId && profilePicUrl !== prevProfilePicUrl.current) {
      socket.emit('change_profile_pic', profilePicUrl);
    }
    prevProfilePicUrl.current = profilePicUrl;
  }, [profilePicUrl, userId, username]);

  useEffect(() => {
    if (
      !prevIncomingShown.current &&
      channelOnCall.incomingShown &&
      !channelOnCall.imCalling
    ) {
      for (let peerId in membersOnCall.current) {
        socket.emit('inform_peer_signal_accepted', {
          peerId,
          channelId: channelOnCall.id
        });
        socket.emit('join_call', { channelId: channelOnCall.id, userId });
        handleNewPeer({
          peerId: peerId,
          channelId: channelOnCall.id,
          initiator: true
        });
      }
    }
    prevIncomingShown.current = channelOnCall.incomingShown;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelOnCall.id, channelOnCall.incomingShown, channelOnCall.imCalling]);

  useEffect(() => {
    currentPathIdRef.current = Number(currentPathId);
  }, [currentPathId]);

  useEffect(() => {
    const { section, isSubsection } = getSectionFromPathname(pathname) || {};
    const newNotiNum =
      (pathname === '/' ? numNewPosts : 0) + numNewNotis + numUnreads;
    if (section === 'chat' && chatType === 'vocabulary') {
      document.title = `${`Vocabulary | Twinkle`}${newNotiNum > 0 ? ' *' : ''}`;
    } else if (
      !['chat', 'comments', 'subjects'].includes(section) &&
      isSubsection &&
      !!pageTitle
    ) {
      document.title = `${pageTitle}${newNotiNum > 0 ? ' *' : ''}`;
    } else {
      let currentPageTitle = 'Twinkle';
      if (section !== 'home') {
        currentPageTitle = `${capitalize(section)} | ${currentPageTitle}`;
      }
      document.title = `${currentPageTitle}${newNotiNum > 0 ? ' *' : ''}`;
    }
  }, [numNewNotis, numNewPosts, numUnreads, pathname, pageTitle, chatType]);

  useEffect(() => {
    onShowUpdateNotice(!versionMatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionMatch]);

  useEffect(() => {
    if (myStream && !prevMyStreamRef.current) {
      if (channelOnCall.imCalling) {
        socket.emit('start_new_call', channelOnCall.id);
      } else {
        for (let peerId in membersOnCall.current) {
          try {
            if (peersRef.current[peerId]) {
              peersRef.current[peerId].addStream(myStream);
            }
          } catch (error) {
            console.error(error);
          }
        }
      }
    }
    prevMyStreamRef.current = myStream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelOnCall.isClass, myStream]);

  return (
    <ErrorBoundary componentPath="App/Header/index">
      <nav
        className={`unselectable ${css`
          z-index: 99999;
          position: relative;
          font-family: 'Ubuntu', sans-serif, Arial, Helvetica;
          font-size: 1.7rem;
          background: ${Color[headerColor]()};
          display: flex;
          box-shadow: 0 3px 3px -3px ${Color.black(0.6)};
          align-items: center;
          width: 100%;
          margin-bottom: 0px;
          height: 4.5rem;
          @media (min-width: ${desktopMinWidth}) {
            top: 0;
          }
          @media (max-width: ${mobileMaxWidth}) {
            bottom: 0;
            box-shadow: none;
            height: 7rem;
            border-top: 1px solid ${Color.borderGray()};
          }
        `}`}
        style={{
          justifyContent: 'space-around',
          position: 'fixed',
          ...style
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <TwinkleLogo style={{ marginLeft: '3rem' }} />
          <MainNavs
            loggedIn={loggedIn}
            defaultSearchFilter={searchFilter}
            numChatUnreads={numUnreads}
            numNewNotis={numNewNotis}
            numNewPosts={numNewPosts}
            onMobileMenuOpen={onMobileMenuOpen}
            pathname={pathname}
            search={search}
            totalRewardAmount={
              totalRewardedTwinkles + totalRewardedTwinkleCoins
            }
          />
          <AccountMenu
            className={css`
              margin-right: 3rem;
              @media (max-width: ${mobileMaxWidth}) {
                margin-right: 0;
              }
            `}
          />
        </div>
      </nav>
    </ErrorBoundary>
  );

  function handleNewPeer({ peerId, channelId, initiator, stream }) {
    if (initiator || channelOnCall.members[userId]) {
      peersRef.current[peerId] = new Peer({
        config: {
          iceServers: [
            {
              urls: 'turn:13.230.133.153:3478',
              username: TURN_USERNAME,
              credential: TURN_PASSWORD
            },
            {
              urls: 'stun:stun.l.google.com:19302'
            }
          ]
        },
        initiator,
        stream
      });

      peersRef.current[peerId].on('signal', (signal) => {
        socket.emit('send_signal', {
          socketId: peerId,
          signal,
          channelId
        });
      });

      peersRef.current[peerId].on('stream', (stream) => {
        onShowIncoming();
        onSetPeerStreams({ peerId, stream });
      });

      peersRef.current[peerId].on('connect', () => {
        onShowOutgoing();
      });

      peersRef.current[peerId].on('close', () => {
        delete peersRef.current[peerId];
      });

      peersRef.current[peerId].on('error', (e) => {
        console.error('Peer error %s:', peerId, e);
      });
    }
  }

  async function handleUpdateMyCoins() {
    const coins = await loadCoins();
    onSetUserState({ userId, newState: { twinkleCoins: coins } });
  }

  async function handleUpdateMyXp() {
    const {
      all,
      top30s,
      allMonthly,
      top30sMonthly,
      myMonthlyRank,
      myAllTimeRank,
      myAllTimeXP,
      myMonthlyXP
    } = await loadRankings();
    onGetRanks({
      all,
      top30s,
      allMonthly,
      top30sMonthly,
      myMonthlyRank,
      myAllTimeRank,
      myAllTimeXP,
      myMonthlyXP
    });
    const { xp, rank } = await loadXP();
    onSetUserState({ userId, newState: { twinkleXP: xp, rank } });
  }
}
