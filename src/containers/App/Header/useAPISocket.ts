import React, { useEffect, useMemo, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { useNavigate } from 'react-router-dom';
import Peer from 'simple-peer';
import { parseChannelPath, getSectionFromPathname } from '~/helpers';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID,
  VOCAB_CHAT_TYPE,
  ZERO_PFP_URL,
  ZERO_TWINKLE_ID,
  CIEL_PFP_URL,
  TURN_USERNAME,
  TURN_PASSWORD
} from '~/constants/defaultValues';
import { User } from '~/types';
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

const MAX_RETRY_COUNT = 7;
let loadingPromise: Promise<void> | null = null;

export default function useAPISocket({
  chatType,
  channelsObj,
  currentPathId,
  isAIChat,
  onInit,
  pathname,
  selectedChannelId,
  subchannelId,
  subchannelPath
}: {
  chatType: string;
  channelsObj: any;
  currentPathId: string;
  isAIChat: boolean;
  onInit: () => void;
  pathname: string;
  selectedChannelId: number;
  subchannelId: number;
  subchannelPath: string | null;
}) {
  const navigate = useNavigate();

  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const loadRankings = useAppContext((v) => v.requestHelpers.loadRankings);
  const loadCoins = useAppContext((v) => v.requestHelpers.loadCoins);
  const loadXP = useAppContext((v) => v.requestHelpers.loadXP);
  const onUpdateAchievementUnlockStatus = useAppContext(
    (v) => v.user.actions.onUpdateAchievementUnlockStatus
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
  const loadChatChannel = useAppContext(
    (v) => v.requestHelpers.loadChatChannel
  );
  const fetchNotifications = useAppContext(
    (v) => v.requestHelpers.fetchNotifications
  );
  const loadRewards = useAppContext((v) => v.requestHelpers.loadRewards);
  const getNumberOfUnreadMessages = useAppContext(
    (v) => v.requestHelpers.getNumberOfUnreadMessages
  );
  const loadChat = useAppContext((v) => v.requestHelpers.loadChat);
  const updateChatLastRead = useAppContext(
    (v) => v.requestHelpers.updateChatLastRead
  );
  const updateSubchannelLastRead = useAppContext(
    (v) => v.requestHelpers.updateSubchannelLastRead
  );

  const { userId, username, profilePicUrl, twinkleCoins } = useKeyContext(
    (v) => v.myState
  );

  const latestPathId = useChatContext((v) => v.state.latestPathId);
  const channelOnCall = useChatContext((v) => v.state.channelOnCall);
  const myStream = useChatContext((v) => v.state.myStream);
  const channelPathIdHash = useChatContext((v) => v.state.channelPathIdHash);
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const onSetChessModalShown = useChatContext(
    (v) => v.actions.onSetChessModalShown
  );
  const onUpdateMostRecentAICardOfferTimeStamp = useChatContext(
    (v) => v.actions.onUpdateMostRecentAICardOfferTimeStamp
  );
  const onAddReactionToMessage = useChatContext(
    (v) => v.actions.onAddReactionToMessage
  );
  const onSetSelectedSubchannelId = useChatContext(
    (v) => v.actions.onSetSelectedSubchannelId
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
  const onSetPeerStreams = useChatContext((v) => v.actions.onSetPeerStreams);
  const onShowIncoming = useChatContext((v) => v.actions.onShowIncoming);
  const onShowOutgoing = useChatContext((v) => v.actions.onShowOutgoing);
  const onChangeChannelSettings = useChatContext(
    (v) => v.actions.onChangeChannelSettings
  );
  const onSetTopicSettingsJSON = useChatContext(
    (v) => v.actions.onSetTopicSettingsJSON
  );
  const onSetChannelSettingsJSON = useChatContext(
    (v) => v.actions.onSetChannelSettingsJSON
  );
  const onChangeTopicSettings = useChatContext(
    (v) => v.actions.onChangeTopicSettings
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
  const onFeatureTopic = useChatContext((v) => v.actions.onFeatureTopic);
  const onSetCall = useChatContext((v) => v.actions.onSetCall);
  const onSetMyStream = useChatContext((v) => v.actions.onSetMyStream);
  const onSetOnlineUsers = useChatContext((v) => v.actions.onSetOnlineUsers);
  const onPostAICardFeed = useChatContext((v) => v.actions.onPostAICardFeed);
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
  const onUpdateChannelPathIdHash = useChatContext(
    (v) => v.actions.onUpdateChannelPathIdHash
  );
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
  const onGetNumberOfUnreadMessages = useChatContext(
    (v) => v.actions.onGetNumberOfUnreadMessages
  );
  const onSetMembersOnCall = useChatContext(
    (v) => v.actions.onSetMembersOnCall
  );
  const onAICardOfferWithdrawal = useChatContext(
    (v) => v.actions.onAICardOfferWithdrawal
  );
  const onSetChessGameState = useChatContext(
    (v) => v.actions.onSetChessGameState
  );
  const onUpdateRecentChessMessage = useChatContext(
    (v) => v.actions.onUpdateRecentChessMessage
  );
  const onEnterChannelWithId = useChatContext(
    (v) => v.actions.onEnterChannelWithId
  );
  const onUpdateChatType = useChatContext((v) => v.actions.onUpdateChatType);

  const category = useHomeContext((v) => v.state.category);
  const feeds = useHomeContext((v) => v.state.feeds);
  const subFilter = useHomeContext((v) => v.state.subFilter);
  const onSetFeedsOutdated = useHomeContext(
    (v) => v.actions.onSetFeedsOutdated
  );

  const onGetRanks = useNotiContext((v) => v.actions.onGetRanks);
  const onSetRewardsTimeoutExecuted = useNotiContext(
    (v) => v.actions.onSetRewardsTimeoutExecuted
  );
  const onChangeSocketStatus = useNotiContext(
    (v) => v.actions.onChangeSocketStatus
  );
  const onCheckVersion = useNotiContext((v) => v.actions.onCheckVersion);
  const onLoadNotifications = useNotiContext(
    (v) => v.actions.onLoadNotifications
  );
  const onLoadRewards = useNotiContext((v) => v.actions.onLoadRewards);
  const onIncreaseNumNewPosts = useNotiContext(
    (v) => v.actions.onIncreaseNumNewPosts
  );
  const onIncreaseNumNewNotis = useNotiContext(
    (v) => v.actions.onIncreaseNumNewNotis
  );
  const onNotifyChatSubjectChange = useNotiContext(
    (v) => v.actions.onNotifyChatSubjectChange
  );

  const onEditContent = useContentContext((v) => v.actions.onEditContent);
  const onAttachReward = useContentContext((v) => v.actions.onAttachReward);
  const onCloseContent = useContentContext((v) => v.actions.onCloseContent);
  const onOpenContent = useContentContext((v) => v.actions.onOpenContent);
  const onLikeContent = useContentContext((v) => v.actions.onLikeContent);
  const onRecommendContent = useContentContext(
    (v) => v.actions.onRecommendContent
  );
  const onUploadComment = useContentContext((v) => v.actions.onUploadComment);
  const onUploadReply = useContentContext((v) => v.actions.onUploadReply);
  const state = useContentContext((v) => v.state);

  const pageVisible = useViewContext((v) => v.state.pageVisible);

  const onUpdateMissionAttempt = useMissionContext(
    (v) => v.actions.onUpdateMissionAttempt
  );

  const usingChat = useMemo(
    () => getSectionFromPathname(pathname)?.section === 'chat',
    [pathname]
  );

  const prevIncomingShown = useRef(false);
  const prevProfilePicUrl = useRef(profilePicUrl);
  const latestPathIdRef = useRef(latestPathId);
  const latestChatTypeRef = useRef(chatType);
  const usingChatRef = useRef(usingChat);
  const membersOnCall: React.MutableRefObject<any> = useRef({});
  const receivedCallSignals = useRef([]);
  const peersRef: React.MutableRefObject<any> = useRef({});
  const prevMyStreamRef = useRef(null);
  const currentPathIdRef = useRef(Number(currentPathId));

  useEffect(() => {
    onSetSelectedSubchannelId(subchannelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subchannelId]);

  useEffect(() => {
    latestPathIdRef.current = latestPathId;
  }, [latestPathId]);

  useEffect(() => {
    latestChatTypeRef.current = chatType;
  }, [chatType]);

  useEffect(() => {
    socket.disconnect();
    socket.connect();
  }, [userId]);

  useEffect(() => {
    currentPathIdRef.current = Number(currentPathId);
  }, [currentPathId]);

  useEffect(() => {
    usingChatRef.current = usingChat && !isAIChat;
  }, [isAIChat, usingChat]);

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
    if (userId && profilePicUrl !== prevProfilePicUrl.current) {
      localStorage.setItem('profilePicUrl', profilePicUrl);
      socket.emit('change_profile_pic', profilePicUrl);
    }
    prevProfilePicUrl.current = profilePicUrl;
  }, [profilePicUrl, userId, username]);

  useEffect(() => {
    socket.on('ai_card_bought', handleAICardBought);
    socket.on('ai_card_sold', handleAICardSold);
    socket.on('ai_card_burned', handleAICardBurned);
    socket.on('ai_card_listed', handleAICardListed);
    socket.on('ai_card_delisted', handleAICardDelisted);
    socket.on('ai_card_offer_posted', handleAICardOfferPosted);
    socket.on('ai_card_offer_cancelled', handleAICardOfferCancel);
    socket.on('ai_memory_updated', handleAIMemoryUpdate);
    socket.on('ai_message_done', handleAIMessageDone);
    socket.on('approval_result_received', handleApprovalResultReceived);
    socket.on('assets_sent', handleAssetsSent);
    socket.on('ban_status_updated', handleBanStatusUpdate);
    socket.on('signal_received', handleCallSignal);
    socket.on('online_status_changed', handleOnlineStatusChange);
    socket.on('away_status_changed', handleAwayStatusChange);
    socket.on('busy_status_changed', handleBusyStatusChange);
    socket.on('call_terminated', handleCallTerminated);
    socket.on('call_reception_confirmed', handleCallReceptionConfirm);
    socket.on('chess_move_made', handleChessMoveMade);
    socket.on('chess_rewind_requested', handleChessRewindRequest);
    socket.on('chat_invitation_received', handleChatInvitation);
    socket.on('chat_message_deleted', onDeleteMessage);
    socket.on('chat_message_edited', onEditMessage);
    socket.on('chat_reaction_added', onAddReactionToMessage);
    socket.on('chat_reaction_removed', onRemoveReactionFromMessage);
    socket.on('chat_subject_purchased', onEnableChatSubject);
    socket.on('channel_owner_changed', handleChangeChannelOwner);
    socket.on('channel_settings_changed', onChangeChannelSettings);
    socket.on('topic_settings_changed', onChangeTopicSettings);
    socket.on('content_edited', handleEditContent);
    socket.on('connect', handleConnect);
    socket.on('content_closed', handleContentClose);
    socket.on('content_opened', handleContentOpen);
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
    socket.on('new_title_received', handleNewTitle);
    socket.on('new_ai_card_summoned', handleNewAICardSummon);
    socket.on('new_vocab_activity_received', handleReceiveVocabActivity);
    socket.on('new_wordle_attempt_received', handleNewWordleAttempt);
    socket.on('peer_accepted', handlePeerAccepted);
    socket.on('peer_hung_up', handlePeerHungUp);
    socket.on('profile_pic_changed', handleProfilePicChange);
    socket.on('rewound_chess_game', handleChessRewind);
    socket.on('subject_changed', handleTopicChange);
    socket.on('topic_featured', handleTopicFeatured);
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
      socket.removeListener('ai_memory_updated', handleAIMemoryUpdate);
      socket.removeListener('ai_message_done', handleAIMessageDone);
      socket.removeListener(
        'approval_result_received',
        handleApprovalResultReceived
      );
      socket.removeListener('assets_sent', handleAssetsSent);
      socket.removeListener('ban_status_updated', handleBanStatusUpdate);
      socket.removeListener('content_edited', handleEditContent);
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
      socket.removeListener('topic_settings_changed', onChangeTopicSettings);
      socket.removeListener('chess_move_made', handleChessMoveMade);
      socket.removeListener('chess_rewind_requested', handleChessRewindRequest);
      socket.removeListener('connect', handleConnect);
      socket.removeListener('content_closed', handleContentClose);
      socket.removeListener('content_opened', handleContentOpen);
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
      socket.removeListener('new_title_received', handleNewTitle);
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
      socket.removeListener('topic_featured', handleTopicFeatured);
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
      if (card.ownerId === userId) {
        onUpdateMostRecentAICardOfferTimeStamp(feed.timeStamp);
      }
      if (feed.offer?.user?.id === userId) {
        onMakeOutgoingOffer({ ...feed.offer, card });
        onUpdateAICard({
          cardId: card.id,
          newState: { myOffer: feed.offer }
        });
      }
    }

    function handleAIMemoryUpdate({
      channelId,
      topicId,
      memory
    }: {
      channelId: number;
      topicId: number;
      memory: any;
    }) {
      if (topicId) {
        onSetTopicSettingsJSON({
          channelId,
          topicId,
          newSettings: { aiMemory: memory }
        });
      } else {
        onSetChannelSettingsJSON({
          channelId,
          newSettings: { aiMemory: memory }
        });
      }
    }

    function handleApprovalResultReceived({ type }: { type: string }) {
      if (type === 'mentor') {
        onSetUserState({
          userId,
          newState: { title: 'teacher' }
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
      if (from === userId && !!coins) {
        onSetUserState({
          userId,
          newState: { twinkleCoins: twinkleCoins - coins }
        });
      }
      if (to === userId && !!coins) {
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
        onUpdateAICard({
          cardId: card.id,
          newState: { id: card.id, ownerId: to }
        });
      }
    }

    function handleAIMessageDone(channelId: number) {
      onSetChannelState({
        channelId,
        newState: { currentlyStreamingAIMsgId: null }
      });
    }

    function handleBanStatusUpdate(banStatus: any) {
      onSetUserState({ userId, newState: { banned: banStatus } });
    }

    function handleChessMoveMade({ channelId }: { channelId: number }) {
      if (channelId === selectedChannelId) {
        onSetChessModalShown(false);
      }
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
        handleLoadChat({ selectedChannelId });
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

    async function handleLoadChat({
      selectedChannelId,
      retryCount = 0
    }: {
      selectedChannelId: number;
      retryCount?: number;
    }): Promise<void> {
      if (loadingPromise) return loadingPromise;

      loadingPromise = (async (): Promise<void> => {
        try {
          if (!navigator.onLine) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            throw new Error('Network is offline');
          }

          socket.emit(
            'bind_uid_to_socket',
            { userId, username, profilePicUrl },
            () => {
              socket.emit('change_busy_status', !usingChatRef.current);
            }
          );
          socket.emit('enter_my_notification_channel', userId);

          const initialTimeout = 5000;
          const timeoutDuration =
            retryCount < 3
              ? initialTimeout
              : initialTimeout * Math.pow(2, retryCount - 2);

          const { promise: timeoutPromise, cancel: cancelTimeout } =
            createTimeoutPromise(timeoutDuration);

          const loadChatPromise = (async () => {
            try {
              onSetReconnecting(true);
              onInit();

              const pathId = Number(currentPathId);
              let currentChannelIsAccessible = true;

              if (!isNaN(pathId) && userId) {
                const { isAccessible } = await checkChatAccessible(pathId);
                currentChannelIsAccessible = isAccessible;
              }

              console.log('Loading chat...');
              const startTime = Date.now();

              const data = await loadChatWithRetry({
                channelId: !isNaN(pathId)
                  ? parseChannelPath(pathId)
                  : selectedChannelId,
                subchannelPath
              });

              const endTime = Date.now();
              const chatLoadingTime = (endTime - startTime) / 1000;
              console.log(`Chat loaded in ${chatLoadingTime} seconds`);

              cancelTimeout();

              onInitChat({ data, userId });

              if (
                latestPathIdRef.current &&
                (data.currentPathId !== latestPathIdRef.current ||
                  data.chatType)
              ) {
                const { isAccessible } = await checkChatAccessible(
                  latestPathIdRef.current
                );
                if (!isAccessible) {
                  onUpdateSelectedChannelId(GENERAL_CHAT_ID);
                  if (usingChatRef.current) {
                    navigate(`/chat/${GENERAL_CHAT_PATH_ID}`, {
                      replace: true
                    });
                    return;
                  }
                }

                const channelId = parseChannelPath(latestPathIdRef.current);
                if (channelId > 0) {
                  if (!channelPathIdHash[pathId]) {
                    onUpdateChannelPathIdHash({ channelId, pathId });
                  }
                  const channelData = await loadChatChannel({
                    channelId,
                    subchannelPath
                  });
                  onEnterChannelWithId(channelData);
                  onUpdateSelectedChannelId(channelId);
                }
              }

              if (latestChatTypeRef.current) {
                onUpdateChatType(latestChatTypeRef.current);
              }

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
                if (usingChatRef.current) {
                  navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
                }
              }
            } catch (error) {
              console.error('Error in loadChatPromise:', error);
              throw error;
            }
          })();

          try {
            await Promise.race([loadChatPromise, timeoutPromise]);
          } catch (error: unknown) {
            loadingPromise = null;
            if (retryCount < MAX_RETRY_COUNT) {
              const delay = Math.pow(2, retryCount) * 1000;
              console.warn(
                `handleLoadChat failed on attempt ${
                  retryCount + 1
                }. Retrying in ${delay / 1000}s...`,
                error
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
              if (userId === 5) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                alert(errorMessage);
              }
              await handleLoadChat({
                selectedChannelId,
                retryCount: retryCount + 1
              });
            } else {
              onSetReconnecting(false);
              console.error(
                'Failed to load chat after maximum retries:',
                error
              );
            }
          }
        } finally {
          loadingPromise = null;
        }
      })();

      return loadingPromise;

      function createTimeoutPromise(ms: number) {
        let timeoutId: any;
        const promise = new Promise((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error('Operation timed out')),
            ms
          );
        });
        return {
          promise,
          cancel: () => clearTimeout(timeoutId)
        };
      }
    }

    function handleContentClose({
      contentId,
      contentType,
      closedBy
    }: {
      contentId: number;
      contentType: string;
      closedBy: User;
    }) {
      onCloseContent({ contentId, contentType, userId: closedBy });
    }

    function handleTopicFeatured({
      channelId,
      topic
    }: {
      channelId: number;
      topic: string;
    }) {
      onFeatureTopic({
        channelId,
        topic
      });
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

    function handleContentOpen({
      contentId,
      contentType
    }: {
      contentId: number;
      contentType: string;
    }) {
      onOpenContent({ contentId, contentType });
    }

    function handleEditContent({
      contentType,
      contentId,
      newState
    }: {
      contentType: string;
      contentId: number;
      newState: any;
    }) {
      onEditContent({
        contentType,
        contentId,
        data: newState
      });
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
          members.filter((member) => member.id !== userId)[0].id ===
          channelsObj[selectedChannelId].members.filter(
            (member: { id: number }) => member.id !== userId
          )[0].id
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
        if (usingChatRef.current) {
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
        onUpdateAchievementUnlockStatus({
          userId,
          achievementType,
          isUnlocked: isAchievementUnlocked
        });
      }
      if (likes) {
        onLikeContent({
          likes,
          contentId: target.contentId,
          contentType: target.contentType
        });
      }
      if (type !== 'achievement' || isAchievementUnlocked) {
        onIncreaseNumNewNotis();
      }
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
      target
    }: {
      uploaderId: number;
      recommendations: any[];
      recommenderId: number;
      target: any;
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
        onSetRewardsTimeoutExecuted(false);
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

    function handleNewTitle(title: string) {
      onSetUserState({ userId, newState: { title } });
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
        if (usingChatRef.current) {
          updateChatLastRead(channelId);
        }
        onReceiveMessage({
          message,
          pageVisible,
          usingChat: usingChatRef.current
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
          usingChat: usingChatRef.current
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
        if (usingChatRef.current) {
          updateChatLastRead(message.channelId);
          if (message.subchannelId === subchannelId) {
            updateSubchannelLastRead(message.subchannelId);
          }
        }
        onReceiveMessage({
          message,
          pageVisible,
          usingChat: usingChatRef.current,
          newMembers,
          currentSubchannelId: subchannelId
        });
      }
      if (!messageIsForCurrentChannel) {
        onReceiveMessageOnDifferentChannel({
          message,
          channel,
          pageVisible,
          usingChat: usingChatRef.current,
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
          currentlyStreamingAIMsgId: message.id
        }
      });
      const messageIsForCurrentChannel = channelId === selectedChannelId;
      if (messageIsForCurrentChannel) {
        if (usingChatRef.current) {
          updateChatLastRead(channelId);
        }
        onReceiveMessage({
          message: {
            ...message,
            profilePicUrl:
              message.userId === ZERO_TWINKLE_ID ? ZERO_PFP_URL : CIEL_PFP_URL
          },
          pageVisible,
          usingChat: usingChatRef.current
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
      message,
      channelId,
      pathId,
      channelName,
      subchannelId,
      subject,
      topicObj,
      isFeatured
    }: {
      message: any;
      channelId: number;
      pathId: number | string;
      channelName: string;
      subchannelId: number;
      subject: string;
      topicObj: any;
      isFeatured: boolean;
    }) {
      const messageIsForCurrentChannel =
        message.channelId === selectedChannelId;
      const senderIsUser = message.userId === userId;

      if (senderIsUser) return;

      if (channelId === GENERAL_CHAT_ID && !subchannelId) {
        onNotifyChatSubjectChange(subject);
      }

      onChangeChatSubject({
        subject,
        topicObj,
        channelId,
        subchannelId,
        isFeatured
      });

      if (messageIsForCurrentChannel) {
        onReceiveMessage({ message, pageVisible });
      } else {
        onReceiveMessageOnDifferentChannel({
          pageVisible,
          message,
          channel: {
            id: channelId,
            pathId,
            channelName,
            isHidden: false,
            numUnreads: 1
          }
        });
      }
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

  async function loadChatWithRetry(
    params: any,
    retryCount = 0,
    maxRetries = 3
  ): Promise<any> {
    try {
      const data = await loadChat(params);
      return data;
    } catch (error) {
      if (!navigator.onLine) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return loadChatWithRetry(params, retryCount + 1, maxRetries);
      } else {
        throw error;
      }
    }
  }
}
