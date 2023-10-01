import React, { useEffect, useMemo, useRef, useState } from 'react';
import AccountMenu from './AccountMenu';
import MainNavs from './MainNavs';
import TwinkleLogo from './TwinkleLogo';
import BalanceModal from './BalanceModal';
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
  TURN_PASSWORD,
  VOCAB_CHAT_TYPE,
  AI_CARD_CHAT_TYPE,
  ZERO_PFP_URL,
  ZERO_TWINKLE_ID,
  CIEL_PFP_URL
} from '~/constants/defaultValues';

export default function Header({
  onMobileMenuOpen,
  style = {}
}: {
  onMobileMenuOpen: any;
  style?: React.CSSProperties;
}) {
  const [balanceModalShown, setBalanceModalShown] = useState(false);
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
  const onUpdateAchievementsObj = useAppContext(
    (v) => v.user.actions.onUpdateAchievementsObj
  );
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
  const onLogout = useAppContext((v) => v.user.actions.onLogout);
  const updateChatLastRead = useAppContext(
    (v) => v.requestHelpers.updateChatLastRead
  );
  const updateSubchannelLastRead = useAppContext(
    (v) => v.requestHelpers.updateSubchannelLastRead
  );
  const {
    searchFilter,
    userId,
    username,
    loggedIn,
    profilePicUrl,
    twinkleCoins
  } = useKeyContext((v) => v.myState);
  const {
    header: { color: headerColor }
  } = useKeyContext((v) => v.theme);
  const channelOnCall = useChatContext((v) => v.state.channelOnCall);
  const chatType = useChatContext((v) => v.state.chatType);
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);
  const onSetSelectedSubchannelId = useChatContext(
    (v) => v.actions.onSetSelectedSubchannelId
  );

  const subchannelPath = useMemo(() => {
    if (!currentPathId) return null;
    const [, result] = pathname.split(currentPathId)?.[1]?.split('/') || [];
    return result;
  }, [currentPathId, pathname]);
  const currentChannel = useMemo<{
    subchannelObj: Record<string, any>;
  }>(
    () => channelsObj[selectedChannelId] || {},
    [channelsObj, selectedChannelId]
  );
  const subchannelId = useMemo(() => {
    if (!subchannelPath || !currentChannel?.subchannelObj) return null;
    for (const subchannel of Object.values(currentChannel?.subchannelObj)) {
      if (subchannel.path === subchannelPath) {
        return subchannel.id;
      }
    }
    return null;
  }, [currentChannel?.subchannelObj, subchannelPath]);

  useEffect(() => {
    onSetSelectedSubchannelId(subchannelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subchannelId]);

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
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const onSetReconnecting = useChatContext((v) => v.actions.onSetReconnecting);
  const onSubmitMessage = useChatContext((v) => v.actions.onSubmitMessage);
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
  const onDelistAICard = useChatContext((v) => v.actions.onDelistAICard);
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
  const onNewAICardSummon = useChatContext((v) => v.actions.onNewAICardSummon);
  const onReceiveVocabActivity = useChatContext(
    (v) => v.actions.onReceiveVocabActivity
  );
  const onAddMyAICard = useChatContext((v) => v.actions.onAddMyAICard);
  const onRemoveMyAICard = useChatContext((v) => v.actions.onRemoveMyAICard);
  const onRemoveReactionFromMessage = useChatContext(
    (v) => v.actions.onRemoveReactionFromMessage
  );
  const onSetCall = useChatContext((v) => v.actions.onSetCall);
  const onSetMembersOnCall = useChatContext(
    (v) => v.actions.onSetMembersOnCall
  );
  const onSetMyStream = useChatContext((v) => v.actions.onSetMyStream);
  const onSetOnlineUsers = useChatContext((v) => v.actions.onSetOnlineUsers);
  const onPostAICardFeed = useChatContext((v) => v.actions.onPostAICardFeed);
  const onSetPeerStreams = useChatContext((v) => v.actions.onSetPeerStreams);
  const onShowIncoming = useChatContext((v) => v.actions.onShowIncoming);
  const onShowOutgoing = useChatContext((v) => v.actions.onShowOutgoing);
  const onUpdateCurrentTransactionId = useChatContext(
    (v) => v.actions.onUpdateCurrentTransactionId
  );
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onMakeOutgoingOffer = useChatContext(
    (v) => v.actions.onMakeOutgoingOffer
  );
  const onAcceptTransaction = useChatContext(
    (v) => v.actions.onAcceptTransaction
  );
  const onCancelTransaction = useChatContext(
    (v) => v.actions.onCancelTransaction
  );
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const onUpdateCollectorsRankings = useChatContext(
    (v) => v.actions.onUpdateCollectorsRankings
  );
  const onAddListedAICard = useChatContext((v) => v.actions.onAddListedAICard);
  const onWithdrawOutgoingOffer = useChatContext(
    (v) => v.actions.onWithdrawOutgoingOffer
  );
  const onRemoveListedAICard = useChatContext(
    (v) => v.actions.onRemoveListedAICard
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
  const onAICardOfferWithdrawal = useChatContext(
    (v) => v.actions.onAICardOfferWithdrawal
  );
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
  const onSetChessGameState = useChatContext(
    (v) => v.actions.onSetChessGameState
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

  const onUpdateRecentChessMessage = useChatContext(
    (v) => v.actions.onUpdateRecentChessMessage
  );
  const onUpdateMissionAttempt = useMissionContext(
    (v) => v.actions.onUpdateMissionAttempt
  );

  const prevProfilePicUrl = useRef(profilePicUrl);
  const peersRef: React.MutableRefObject<any> = useRef({});
  const prevMyStreamRef = useRef(null);
  const prevIncomingShown = useRef(false);
  const membersOnCall: React.MutableRefObject<any> = useRef({});
  const receivedCallSignals = useRef([]);

  useEffect(() => {
    socket.disconnect();
    socket.connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const currentPathIdRef = useRef(Number(currentPathId));

  useEffect(() => {
    socket.on('ai_card_bought', handleAICardBought);
    socket.on('ai_card_sold', handleAICardSold);
    socket.on('ai_card_burned', handleAICardBurned);
    socket.on('ai_card_listed', handleAICardListed);
    socket.on('ai_card_delisted', handleAICardDelisted);
    socket.on('ai_card_offer_posted', handleAICardOfferPosted);
    socket.on('ai_card_offer_cancelled', handleAICardOfferCancel);
    socket.on('ai_message_done', handleAIMessageDone);
    socket.on('assets_sent', handleAssetsSent);
    socket.on('ban_status_updated', handleBanStatusUpdate);
    socket.on('signal_received', handleCallSignal);
    socket.on('online_status_changed', handleOnlineStatusChange);
    socket.on('away_status_changed', handleAwayStatusChange);
    socket.on('busy_status_changed', handleBusyStatusChange);
    socket.on('call_terminated', handleCallTerminated);
    socket.on('call_reception_confirmed', handleCallReceptionConfirm);
    socket.on('chess_rewind_requested', handleChessRewindRequest);
    socket.on('chat_invitation_received', handleChatInvitation);
    socket.on('chat_message_deleted', onDeleteMessage);
    socket.on('chat_message_edited', onEditMessage);
    socket.on('chat_reaction_added', onAddReactionToMessage);
    socket.on('chat_reaction_removed', onRemoveReactionFromMessage);
    socket.on('chat_subject_purchased', onEnableChatSubject);
    socket.on('channel_owner_changed', handleChangeChannelOwner);
    socket.on('channel_settings_changed', onChangeChannelSettings);
    socket.on('connect', handleConnect);
    socket.on('canceled_chess_rewind', handleChessRewindCanceled);
    socket.on('current_transaction_id_updated', handleTransactionIdUpdate);
    socket.on('declined_chess_rewind', handleChessRewindDeclined);
    socket.on('disconnect', handleDisconnect);
    socket.on('left_chat_from_another_tab', handleLeftChatFromAnotherTab);
    socket.on('message_attachment_hid', onHideAttachment);
    socket.on('mission_rewards_received', handleMissionRewards);
    socket.on('new_call_member', handleNewCallMember);
    socket.on('new_call_started', handleNewCall);
    socket.on('new_post_uploaded', handleNewPost);
    socket.on('new_notification_received', handleNewNotification);
    socket.on('new_message_received', handleReceiveMessage);
    socket.on('new_ai_message_received', handleReceiveAIMessage);
    socket.on('new_reward_posted', handleNewReward);
    socket.on('new_recommendation_posted', handleNewRecommendation);
    socket.on('new_ai_card_summoned', handleNewAICardSummon);
    socket.on('new_vocab_activity_received', handleReceiveVocabActivity);
    socket.on('new_wordle_attempt_received', handleNewWordleAttempt);
    socket.on('peer_accepted', handlePeerAccepted);
    socket.on('peer_hung_up', handlePeerHungUp);
    socket.on('profile_pic_changed', handleProfilePicChange);
    socket.on('rewound_chess_game', handleChessRewind);
    socket.on('subject_changed', handleTopicChange);
    socket.on('transaction_accepted', handleTransactionAccept);
    socket.on('transaction_cancelled', handleTransactionCancel);
    socket.on('user_type_updated', handleUserTypeUpdate);
    socket.on('username_changed', handleUsernameChange);

    return function cleanUp() {
      socket.removeListener('ai_card_bought', handleAICardBought);
      socket.removeListener('ai_card_sold', handleAICardSold);
      socket.removeListener('ai_card_burned', handleAICardBurned);
      socket.removeListener('ai_card_listed', handleAICardListed);
      socket.removeListener('ai_card_delisted', handleAICardDelisted);
      socket.removeListener('ai_card_offer_posted', handleAICardOfferPosted);
      socket.removeListener('ai_card_offer_cancelled', handleAICardOfferCancel);
      socket.removeListener('ai_message_done', handleAIMessageDone);
      socket.removeListener('assets_sent', handleAssetsSent);
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
      socket.removeListener('chess_rewind_requested', handleChessRewindRequest);
      socket.removeListener('connect', handleConnect);
      socket.removeListener('canceled_chess_rewind', handleChessRewindCanceled);
      socket.removeListener(
        'current_transaction_id_updated',
        handleTransactionIdUpdate
      );
      socket.removeListener('declined_chess_rewind', handleChessRewindDeclined);
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
      socket.removeListener('new_ai_message_received', handleReceiveAIMessage);
      socket.removeListener('new_reward_posted', handleNewReward);
      socket.removeListener('new_ai_card_summoned', handleNewAICardSummon);
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
      socket.removeListener('rewound_chess_game', handleChessRewind);
      socket.removeListener('subject_changed', handleTopicChange);
      socket.removeListener('transaction_accepted', handleTransactionAccept);
      socket.removeListener('transaction_cancelled', handleTransactionCancel);
      socket.removeListener('user_type_updated', handleUserTypeUpdate);
      socket.removeListener('username_changed', handleUsernameChange);
    };

    async function handleAICardBought({
      feed,
      card,
      sellerCoins,
      buyerId,
      sellerId
    }: {
      feed: any;
      card: any;
      sellerCoins: number;
      buyerId: number;
      sellerId: number;
    }) {
      onRemoveListedAICard(card.id);
      onUpdateAICard({
        cardId: card.id,
        newState: card
      });
      onPostAICardFeed({
        feed,
        card
      });
      if (buyerId === userId) {
        onAddMyAICard(card);
      }
      if (sellerId === userId) {
        onDelistAICard(card.id);
        onRemoveMyAICard(card.id);
        onSetUserState({ userId, newState: { twinkleCoins: sellerCoins } });
      }
    }

    async function handleAICardSold({
      feed,
      card,
      offerId,
      sellerId
    }: {
      feed: any;
      card: any;
      offerId: number;
      sellerId: number;
    }) {
      if (card.ownerId === userId) {
        onWithdrawOutgoingOffer(offerId);
        onAddMyAICard(card);
      }
      if (sellerId === userId) {
        onDelistAICard(card.id);
        onRemoveMyAICard(card.id);
      }
      onRemoveListedAICard(card.id);
      onUpdateAICard({
        cardId: card.id,
        newState: card
      });
      onPostAICardFeed({
        feed,
        card
      });
    }

    async function handleAICardBurned(cardId: number) {
      onUpdateAICard({ cardId, newState: { isBurning: true } });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onUpdateAICard({
        cardId,
        newState: {
          isBurned: true
        }
      });
    }

    function handleAICardListed(card: any) {
      if (card.ownerId !== userId) {
        onAddListedAICard(card);
      }
    }

    function handleAICardDelisted(cardId: number) {
      onRemoveListedAICard(cardId);
    }

    function handleAICardOfferCancel({
      cardId,
      coins,
      feedId,
      offerId,
      offererId
    }: {
      cardId: number;
      coins: number;
      feedId: number;
      offerId: number;
      offererId: number;
    }) {
      onAICardOfferWithdrawal(feedId);
      if (offererId === userId) {
        onWithdrawOutgoingOffer(offerId);
        onSetUserState({ userId, newState: { twinkleCoins: coins } });
        onUpdateAICard({ cardId, newState: { myOffer: null } });
      }
    }

    function handleAICardOfferPosted({ card, feed }: { card: any; feed: any }) {
      onPostAICardFeed({
        feed,
        card
      });
      if (feed.offer?.user?.id === userId) {
        onMakeOutgoingOffer({ ...feed.offer, card });
        onUpdateAICard({
          cardId: card.id,
          newState: { myOffer: feed.offer }
        });
      }
    }

    function handleAssetsSent({
      cards,
      coins,
      from,
      to
    }: {
      cards: any;
      coins: number;
      from: number;
      to: number;
    }) {
      if (from === userId) {
        onSetUserState({
          userId,
          newState: { twinkleCoins: twinkleCoins - coins }
        });
      }
      if (to === userId) {
        onSetUserState({
          userId,
          newState: { twinkleCoins: twinkleCoins + coins }
        });
      }
      for (const card of cards) {
        if (from === userId) {
          onDelistAICard(card.id);
          onRemoveMyAICard(card.id);
        }
        if (to === userId) {
          onAddMyAICard(card);
        }
        onUpdateAICard({ cardId: card.id, newState: { ownerId: to } });
      }
    }

    function handleAIMessageDone(channelId: number) {
      onSetChannelState({
        channelId,
        newState: { inputSubmitDisabled: false }
      });
    }

    function handleBanStatusUpdate(banStatus: any) {
      onSetUserState({ userId, newState: { banned: banStatus } });
    }

    function handleChessRewind({
      channelId,
      message
    }: {
      channelId: number;
      message: any;
    }) {
      onUpdateRecentChessMessage({ channelId, message });
      onSetChessGameState({
        channelId,
        newState: { rewindRequestId: null }
      });
      onSubmitMessage({
        message,
        messageId: message.id
      });
    }

    function handleChessRewindRequest({
      channelId,
      messageId
    }: {
      channelId: number;
      messageId: number;
    }) {
      onSetChessGameState({
        channelId,
        newState: { rewindRequestId: messageId }
      });
    }

    function handleChessRewindCanceled({
      channelId,
      messageId,
      cancelMessage,
      sender,
      timeStamp
    }: {
      channelId: number;
      messageId: number;
      cancelMessage: string;
      sender: any;
      timeStamp: number;
    }) {
      onSubmitMessage({
        message: {
          channelId,
          id: messageId,
          content: cancelMessage,
          userId: sender.userId,
          username: sender.username,
          profilePicUrl: sender.profilePicUrl,
          isNotification: true,
          timeStamp
        },
        messageId
      });
      onSetChessGameState({ channelId, newState: { rewindRequestId: null } });
    }

    function handleChessRewindDeclined({
      channelId,
      declineMessage,
      messageId,
      sender,
      timeStamp
    }: {
      channelId: number;
      declineMessage: string;
      messageId: number;
      sender: any;
      timeStamp: number;
    }) {
      onSubmitMessage({
        message: {
          channelId,
          id: messageId,
          content: declineMessage,
          userId: sender.userId,
          username: sender.username,
          profilePicUrl: sender.profilePicUrl,
          isNotification: true,
          timeStamp
        },
        messageId
      });
      onSetChessGameState({ channelId, newState: { rewindRequestId: null } });
    }

    function handleChangeChannelOwner({
      channelId,
      message,
      newOwner
    }: {
      channelId: number;
      message: any;
      newOwner: any;
    }) {
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
        handleLoadChat({ selectedChannelId });
      }

      async function handleLoadChat({
        selectedChannelId,
        retryCount = 0
      }: {
        selectedChannelId: number;
        retryCount?: number;
      }) {
        try {
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
            'check_online_users',
            selectedChannelId,
            ({
              onlineUsers
            }: {
              onlineUsers: { userId: number; username: string }[];
            }) => {
              onSetOnlineUsers({
                channelId: selectedChannelId,
                onlineUsers
              });
            }
          );
          if (!currentChannelIsAccessible) {
            onUpdateSelectedChannelId(GENERAL_CHAT_ID);
            return navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
          }
        } catch (error) {
          if (retryCount < 3) {
            setTimeout(
              () =>
                handleLoadChat({
                  selectedChannelId,
                  retryCount: retryCount + 1
                }),
              1000
            );
          } else {
            onLogout();
          }
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

    function handleTransactionIdUpdate({
      channelId,
      senderId,
      transactionId
    }: {
      channelId: number;
      senderId: number;
      transactionId: number;
    }) {
      if (senderId !== userId) {
        onUpdateCurrentTransactionId({ channelId, transactionId });
      }
    }

    function handleOnlineStatusChange({
      userId,
      member,
      isOnline
    }: {
      userId: number;
      member: any;
      isOnline: boolean;
    }) {
      onChangeOnlineStatus({ userId, member, isOnline });
    }
    function handleAwayStatusChange({
      userId,
      isAway
    }: {
      userId: number;
      isAway: boolean;
    }) {
      if (chatStatus[userId] && chatStatus[userId].isAway !== isAway) {
        onChangeAwayStatus({ userId, isAway });
      }
    }

    function handleBusyStatusChange({
      userId,
      isBusy
    }: {
      userId: number;
      isBusy: boolean;
    }) {
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

    function handleCallReceptionConfirm(channelId: number) {
      onCallReceptionConfirm(channelId);
    }

    function handleCallSignal({
      peerId,
      signal,
      to
    }: {
      peerId: string;
      signal: any;
      to: number;
    }) {
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

    function handleChatInvitation({
      message,
      members,
      isTwoPeople,
      isClass,
      pathId
    }: {
      message: any;
      members: any[];
      isTwoPeople: boolean;
      isClass: boolean;
      pathId: number;
    }) {
      let isDuplicate = false;
      if (selectedChannelId === 0) {
        if (
          members.filter((member) => member.userId !== userId)[0].userId ===
          channelsObj[selectedChannelId].members.filter(
            (member: { userId: number }) => member.userId !== userId
          )[0].userId
        ) {
          isDuplicate = true;
        }
      }
      socket.emit('join_chat_group', message.channelId);
      onReceiveFirstMsg({
        message,
        isDuplicate,
        isTwoPeople,
        isClass,
        pageVisible,
        pathId
      });
    }

    function handleDisconnect(reason: string) {
      console.log('disconnected from socket. reason: ', reason);
      onChangeSocketStatus(false);
    }

    async function handleLeftChatFromAnotherTab(channelId: number) {
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
    }: {
      includesCoinReward: boolean;
      includesXpReward: boolean;
      missionId: number;
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

    function handleNewNotification({
      type,
      achievementType,
      isAchievementUnlocked,
      likes,
      target
    }: {
      type: string;
      achievementType: string;
      isAchievementUnlocked: boolean;
      likes: any[];
      target: any;
    }) {
      if (type === 'achievement') {
        onUpdateAchievementsObj({
          achievementType,
          newState: {
            isUnlocked: isAchievementUnlocked
          }
        });
      }
      if (likes) {
        onLikeContent({
          likes,
          contentId: target.contentId,
          contentType: target.contentType
        });
      }
      onIncreaseNumNewNotis();
    }

    function handleNewPost({ comment, target }: { comment: any; target: any }) {
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
    }: {
      uploaderId: number;
      recommendations: any[];
      recommenderId: number;
      target: any;
      newlyRecommended: boolean;
    }) {
      if (
        state[target.contentType + target.contentId] ||
        (uploaderId === userId && recommenderId !== userId)
      ) {
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

    async function handleNewReward({
      target,
      reward,
      receiverId
    }: {
      target: any;
      reward: any;
      receiverId: number;
    }) {
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

    function handleNewCallMember({
      socketId,
      memberId
    }: {
      socketId: string;
      memberId: number;
    }) {
      if (!channelOnCall.members?.[memberId]) {
        onSetMembersOnCall({ [memberId]: socketId });
      }
      membersOnCall.current[socketId] = true;
    }

    function handleNewCall({
      memberId,
      channelId,
      peerId
    }: {
      memberId: number;
      channelId: number;
      peerId: string;
    }) {
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
    }: {
      channelId: number;
      channelName: string;
      user: any;
      message: any;
      pathId: string;
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

    function handlePeerAccepted({
      channelId,
      to,
      peerId
    }: {
      channelId: number;
      to: number;
      peerId: string;
    }) {
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

    function handlePeerHungUp({
      channelId,
      memberId,
      peerId
    }: {
      channelId: number;
      memberId: number;
      peerId: string;
    }) {
      if (
        Number(channelId) === Number(channelOnCall.id) &&
        membersOnCall.current[peerId]
      ) {
        delete membersOnCall.current[peerId];
        onHangUp({ peerId, memberId, iHungUp: memberId === userId });
      }
    }

    function handleProfilePicChange({
      userId,
      profilePicUrl
    }: {
      userId: number;
      profilePicUrl: string;
    }) {
      onSetUserState({ userId, newState: { profilePicUrl } });
    }

    async function handleReceiveMessage({
      message,
      channel,
      newMembers,
      isNotification
    }: {
      message: any;
      channel: any;
      newMembers: any[];
      isNotification: boolean;
    }) {
      const messageIsForCurrentChannel =
        message.channelId === selectedChannelId;
      const senderIsUser = message.userId === userId && !isNotification;
      if (senderIsUser && pageVisible) return;
      if (messageIsForCurrentChannel) {
        if (usingChat) {
          updateChatLastRead(message.channelId);
          if (message.subchannelId === subchannelId) {
            updateSubchannelLastRead(message.subchannelId);
          }
        }
        onReceiveMessage({
          message,
          pageVisible,
          usingChat,
          newMembers,
          currentSubchannelId: subchannelId
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
      if (message.transactionDetails?.id) {
        onUpdateCurrentTransactionId({
          channelId: message.channelId,
          transactionId: message.transactionDetails.id
        });
      }
      if (message.targetMessage?.userId === userId && message.rewardAmount) {
        handleUpdateMyXp();
      }
    }

    function handleReceiveAIMessage({
      message,
      channelId
    }: {
      message: any;
      channelId: number;
    }) {
      onSetChannelState({
        channelId,
        newState: {
          inputSubmitDisabled: true
        }
      });
      const messageIsForCurrentChannel = channelId === selectedChannelId;
      if (messageIsForCurrentChannel) {
        if (usingChat) {
          updateChatLastRead(channelId);
        }
        onReceiveMessage({
          message: {
            ...message,
            profilePicUrl:
              message.userId === ZERO_TWINKLE_ID ? ZERO_PFP_URL : CIEL_PFP_URL
          },
          pageVisible,
          usingChat
        });
      }
    }

    function handleUserTypeUpdate({
      userId,
      userType,
      userTypeProps
    }: {
      userId: number;
      userType: string;
      userTypeProps: any;
    }) {
      onSetUserState({ userId, newState: { userType, ...userTypeProps } });
    }

    function handleUsernameChange({
      userId,
      newUsername
    }: {
      userId: number;
      newUsername: string;
    }) {
      onSetUserState({ userId, newState: { username: newUsername } });
    }

    function handleNewAICardSummon({ feed, card }: { feed: any; card: any }) {
      const senderIsNotTheUser = card.creator.id !== userId;
      if (senderIsNotTheUser) {
        onNewAICardSummon({ card, feed });
      }
    }

    function handleReceiveVocabActivity(activity: {
      userId: number;
      username: string;
      profilePicUrl: string;
      numWordsCollected: number;
      rank: number;
    }) {
      const senderIsNotTheUser = activity.userId !== userId;
      if (senderIsNotTheUser) {
        onReceiveVocabActivity({
          activity,
          usingVocabSection: chatType === VOCAB_CHAT_TYPE
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

    function handleTopicChange({
      channelId,
      subchannelId,
      subject
    }: {
      channelId: number;
      subchannelId: number;
      subject: string;
    }) {
      if (channelId === GENERAL_CHAT_ID && !subchannelId) {
        onNotifyChatSubjectChange(subject);
      }
      onChangeChatSubject({ subject, channelId, subchannelId });
    }

    function handleTransactionAccept({
      transactionId
    }: {
      transactionId: number;
    }) {
      onAcceptTransaction({ transactionId });
    }

    function handleTransactionCancel({
      transactionId,
      cancelReason
    }: {
      transactionId: number;
      cancelReason: string;
    }) {
      onCancelTransaction({ transactionId, reason: cancelReason });
    }
  });

  useEffect(() => {
    socket.emit(
      'check_online_users',
      selectedChannelId,
      ({
        callData,
        onlineUsers
      }: {
        callData: any;
        onlineUsers: { [key: string]: any }[];
      }) => {
        if (callData && Object.keys(membersOnCall.current).length === 0) {
          const membersHash: { [key: string]: any } = {};
          for (const member of Object.values(onlineUsers).filter(
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
      localStorage.setItem('profilePicUrl', profilePicUrl);
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
      for (const peerId in membersOnCall.current) {
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
    if (section === 'chat') {
      if (chatType === VOCAB_CHAT_TYPE) {
        document.title = `${`Vocabulary | Twinkle`}${
          newNotiNum > 0 ? ' *' : ''
        }`;
      } else if (chatType === AI_CARD_CHAT_TYPE) {
        document.title = `${`AI Cards | Twinkle`}${newNotiNum > 0 ? ' *' : ''}`;
      } else {
        document.title = `${`Chat | Twinkle`}${newNotiNum > 0 ? ' *' : ''}`;
      }
    } else if (
      !['chat', 'comments', 'subjects', 'ai-cards'].includes(section) &&
      isSubsection &&
      !!pageTitle
    ) {
      document.title = `${pageTitle}${newNotiNum > 0 ? ' *' : ''}`;
    } else {
      let currentPageTitle = 'Twinkle';
      if (section !== 'home') {
        const displayedSection =
          section === 'ai-cards'
            ? 'Explore AI Cards'
            : section === 'ai-stories'
            ? 'AI Stories'
            : section;
        currentPageTitle = `${capitalize(
          displayedSection
        )} | ${currentPageTitle}`;
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
        for (const peerId in membersOnCall.current) {
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
            onSetBalanceModalShown={() => setBalanceModalShown(true)}
            totalRewardAmount={
              totalRewardedTwinkles + totalRewardedTwinkleCoins
            }
          />
          <AccountMenu
            onSetBalanceModalShown={() => setBalanceModalShown(true)}
            className={css`
              margin-right: 3rem;
              @media (max-width: ${mobileMaxWidth}) {
                margin-right: 0;
              }
            `}
          />
        </div>
      </nav>
      {balanceModalShown && (
        <BalanceModal onHide={() => setBalanceModalShown(false)} />
      )}
    </ErrorBoundary>
  );

  function handleNewPeer({
    peerId,
    channelId,
    initiator,
    stream
  }: {
    peerId: string;
    channelId: number;
    initiator?: boolean;
    stream?: MediaStream;
  }) {
    if (initiator || channelOnCall.members[userId]) {
      peersRef.current[peerId] = new Peer({
        config: {
          iceServers: [
            {
              urls: 'turn:13.230.133.153:3478',
              username: TURN_USERNAME as string,
              credential: TURN_PASSWORD as string
            },
            {
              urls: 'stun:stun.l.google.com:19302'
            }
          ]
        },
        initiator,
        stream
      });

      peersRef.current[peerId].on('signal', (signal: any) => {
        socket.emit('send_signal', {
          socketId: peerId,
          signal,
          channelId
        });
      });

      peersRef.current[peerId].on('stream', (stream: any) => {
        onShowIncoming();
        onSetPeerStreams({ peerId, stream });
      });

      peersRef.current[peerId].on('connect', () => {
        onShowOutgoing();
      });

      peersRef.current[peerId].on('close', () => {
        delete peersRef.current[peerId];
      });

      peersRef.current[peerId].on('error', (e: any) => {
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
