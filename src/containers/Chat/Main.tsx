import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import CreateNewChat from './Modals/CreateNewChat';
import LeftMenu from './LeftMenu';
import RightMenu from './RightMenu';
import Body from './Body';
import Loading from '~/components/Loading';
import PleaseLogIn from './PleaseLogIn';
import LocalContext from './Context';
import AICardModal from '~/components/Modals/AICardModal';
import queryString from 'query-string';
import loading from './loading.jpeg';
import { parseChannelPath } from '~/helpers';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { socket } from '~/constants/sockets/api';
import { css } from '@emotion/css';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  useAppContext,
  useContentContext,
  useInputContext,
  useNotiContext,
  useViewContext,
  useChatContext,
  useKeyContext
} from '~/contexts';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID,
  AI_CARD_CHAT_TYPE,
  VOCAB_CHAT_TYPE,
  ZERO_TWINKLE_ID,
  CIEL_TWINKLE_ID
} from '~/constants/defaultValues';
import ErrorBoundary from '~/components/ErrorBoundary';

let loadingPromise: any = null;
let currentTimeoutId: any = null;

interface TimeoutPromise {
  promise: Promise<never>;
  timeoutId: any;
  cancel: () => void;
}

export default function Main({
  currentPathId = '',
  onFileUpload
}: {
  currentPathId?: number | string;
  onFileUpload: (file: File) => void;
}) {
  const {
    subchannelPath
  }: {
    subchannelPath?: string;
  } = useParams();
  const { search, pathname } = useLocation();
  const isMounted = useRef(true);
  const { lastChatPath, userId, profileTheme } = useKeyContext(
    (v) => v.myState
  );
  const navigate = useNavigate();
  const userObj = useAppContext((v) => v.user.state.userObj);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const acceptInvitation = useAppContext(
    (v) => v.requestHelpers.acceptInvitation
  );
  const changeChannelOwner = useAppContext(
    (v) => v.requestHelpers.changeChannelOwner
  );
  const checkChatAccessible = useAppContext(
    (v) => v.requestHelpers.checkChatAccessible
  );
  const createNewChat = useAppContext((v) => v.requestHelpers.createNewChat);
  const deleteChatMessage = useAppContext(
    (v) => v.requestHelpers.deleteChatMessage
  );
  const editChannelSettings = useAppContext(
    (v) => v.requestHelpers.editChannelSettings
  );
  const editChatMessage = useAppContext(
    (v) => v.requestHelpers.editChatMessage
  );
  const hideChatAttachment = useAppContext(
    (v) => v.requestHelpers.hideChatAttachment
  );
  const hideChat = useAppContext((v) => v.requestHelpers.hideChat);
  const leaveChannel = useAppContext((v) => v.requestHelpers.leaveChannel);
  const loadChatChannel = useAppContext(
    (v) => v.requestHelpers.loadChatChannel
  );
  const loadSubchannel = useAppContext((v) => v.requestHelpers.loadSubchannel);
  const loadChatSubject = useAppContext(
    (v) => v.requestHelpers.loadChatSubject
  );
  const loadMoreChatMessages = useAppContext(
    (v) => v.requestHelpers.loadMoreChatMessages
  );
  const loadRankings = useAppContext((v) => v.requestHelpers.loadRankings);
  const loadAICardFeeds = useAppContext(
    (v) => v.requestHelpers.loadAICardFeeds
  );
  const loadVocabulary = useAppContext((v) => v.requestHelpers.loadVocabulary);
  const postChatReaction = useAppContext(
    (v) => v.requestHelpers.postChatReaction
  );
  const putFavoriteChannel = useAppContext(
    (v) => v.requestHelpers.putFavoriteChannel
  );
  const removeChatReaction = useAppContext(
    (v) => v.requestHelpers.removeChatReaction
  );
  const reloadChatSubject = useAppContext(
    (v) => v.requestHelpers.reloadChatSubject
  );
  const saveChatMessage = useAppContext(
    (v) => v.requestHelpers.saveChatMessage
  );
  const searchChatSubject = useAppContext(
    (v) => v.requestHelpers.searchChatSubject
  );
  const sendInvitationMessage = useAppContext(
    (v) => v.requestHelpers.sendInvitationMessage
  );
  const setChessMoveViewTimeStamp = useAppContext(
    (v) => v.requestHelpers.setChessMoveViewTimeStamp
  );
  const startNewDMChannel = useAppContext(
    (v) => v.requestHelpers.startNewDMChannel
  );
  const updateChatLastRead = useAppContext(
    (v) => v.requestHelpers.updateChatLastRead
  );
  const updateLastChannelId = useAppContext(
    (v) => v.requestHelpers.updateLastChannelId
  );
  const updateUserXP = useAppContext((v) => v.requestHelpers.updateUserXP);
  const updateUserCoins = useAppContext(
    (v) => v.requestHelpers.updateUserCoins
  );
  const uploadChatTopic = useAppContext(
    (v) => v.requestHelpers.uploadChatTopic
  );
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const updateCollectType = useAppContext(
    (v) => v.requestHelpers.updateCollectType
  );
  const onSetCollectType = useAppContext(
    (v) => v.user.actions.onSetCollectType
  );
  const state = useInputContext((v) => v.state);
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const allFavoriteChannelIds = useChatContext(
    (v) => v.state.allFavoriteChannelIds
  );
  const chatType = useChatContext((v) => v.state.chatType);
  const chatStatus: {
    id: number;
    isOnline: boolean;
  }[] = useChatContext((v) => v.state.chatStatus);
  const chessModalShown = useChatContext((v) => v.state.chessModalShown);
  const aiCallChannelId = useChatContext((v) => v.state.aiCallChannelId);
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const channelPathIdHash = useChatContext((v) => v.state.channelPathIdHash);
  const lastSubchannelPaths = useChatContext(
    (v) => v.state.lastSubchannelPaths
  );
  const updateSubchannelLastRead = useAppContext(
    (v) => v.requestHelpers.updateSubchannelLastRead
  );
  const channelOnCall = useChatContext((v) => v.state.channelOnCall);
  const creatingNewDMChannel = useChatContext(
    (v) => v.state.creatingNewDMChannel
  );
  const filesBeingUploaded = useChatContext((v) => v.state.filesBeingUploaded);
  const homeChannelIds = useChatContext((v) => v.state.homeChannelIds);
  const loadingVocabulary = useChatContext((v) => v.state.loadingVocabulary);
  const loadingAICardChat = useChatContext((v) => v.state.loadingAICardChat);
  const loaded = useChatContext((v) => v.state.loaded);
  const reconnecting = useChatContext((v) => v.state.reconnecting);
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);
  const selectedSubchannelId = useChatContext(
    (v) => v.state.selectedSubchannelId
  );
  const subjectSearchResults = useChatContext(
    (v) => v.state.subjectSearchResults
  );
  const onSetWordleModalShown = useChatContext(
    (v) => v.actions.onSetWordleModalShown
  );
  const wordleModalShown = useChatContext((v) => v.state.wordleModalShown);
  const onAddBookmarkedMessage = useChatContext(
    (v) => v.actions.onAddBookmarkedMessage
  );
  const onAddReactionToMessage = useChatContext(
    (v) => v.actions.onAddReactionToMessage
  );
  const onClearNumUnreads = useChatContext((v) => v.actions.onClearNumUnreads);
  const onClearSubjectSearchResults = useChatContext(
    (v) => v.actions.onClearSubjectSearchResults
  );
  const onCreateNewChannel = useChatContext(
    (v) => v.actions.onCreateNewChannel
  );
  const onDeleteMessage = useChatContext((v) => v.actions.onDeleteMessage);
  const onEditChannelSettings = useChatContext(
    (v) => v.actions.onEditChannelSettings
  );
  const onEditMessage = useChatContext((v) => v.actions.onEditMessage);
  const onEnterChannelWithId = useChatContext(
    (v) => v.actions.onEnterChannelWithId
  );
  const onEnterEmptyChat = useChatContext((v) => v.actions.onEnterEmptyChat);
  const onSetIsSearchActive = useChatContext(
    (v) => v.actions.onSetIsSearchActive
  );
  const onUpdateLatestPathId = useChatContext(
    (v) => v.actions.onUpdateLatestPathId
  );
  const onHideAttachment = useChatContext((v) => v.actions.onHideAttachment);
  const onHideChat = useChatContext((v) => v.actions.onHideChat);
  const onLeaveChannel = useChatContext((v) => v.actions.onLeaveChannel);
  const onLoadChatSubject = useChatContext((v) => v.actions.onLoadChatSubject);
  const onLoadMoreMessages = useChatContext(
    (v) => v.actions.onLoadMoreMessages
  );
  const onLoadVocabulary = useChatContext((v) => v.actions.onLoadVocabulary);
  const onLoadAICardChat = useChatContext((v) => v.actions.onLoadAICardChat);
  const onNotifyThatMemberLeftChannel = useChatContext(
    (v) => v.actions.onNotifyThatMemberLeftChannel
  );
  const onReceiveMessageOnDifferentChannel = useChatContext(
    (v) => v.actions.onReceiveMessageOnDifferentChannel
  );
  const onReloadChatSubject = useChatContext(
    (v) => v.actions.onReloadChatSubject
  );
  const onRemoveReactionFromMessage = useChatContext(
    (v) => v.actions.onRemoveReactionFromMessage
  );
  const onSeachChatMessages = useChatContext(
    (v) => v.actions.onSeachChatMessages
  );
  const onSaveMessage = useChatContext((v) => v.actions.onSaveMessage);
  const onCreateNewDMChannel = useChatContext(
    (v) => v.actions.onCreateNewDMChannel
  );
  const onSetChessModalShown = useChatContext(
    (v) => v.actions.onSetChessModalShown
  );
  const onSetChessTarget = useChatContext((v) => v.actions.onSetChessTarget);
  const onSetIsRespondingToSubject = useChatContext(
    (v) => v.actions.onSetIsRespondingToSubject
  );
  const onSetLoadingVocabulary = useChatContext(
    (v) => v.actions.onSetLoadingVocabulary
  );
  const onSetLoadingAICardChat = useChatContext(
    (v) => v.actions.onSetLoadingAICardChat
  );
  const onSetMessageState = useChatContext((v) => v.actions.onSetMessageState);
  const onSetChessGameState = useChatContext(
    (v) => v.actions.onSetChessGameState
  );
  const onSetCreatingNewDMChannel = useChatContext(
    (v) => v.actions.onSetCreatingNewDMChannel
  );
  const onSetFavoriteChannel = useChatContext(
    (v) => v.actions.onSetFavoriteChannel
  );
  const onSetReplyTarget = useChatContext((v) => v.actions.onSetReplyTarget);
  const onSetSubchannel = useChatContext((v) => v.actions.onSetSubchannel);
  const onShowIncoming = useChatContext((v) => v.actions.onShowIncoming);
  const onSubmitMessage = useChatContext((v) => v.actions.onSubmitMessage);
  const onSearchChatSubject = useChatContext(
    (v) => v.actions.onSearchChatSubject
  );
  const onTrimMessages = useChatContext((v) => v.actions.onTrimMessages);
  const onTrimSubchannelMessages = useChatContext(
    (v) => v.actions.onTrimSubchannelMessages
  );
  const onUpdateChannelPathIdHash = useChatContext(
    (v) => v.actions.onUpdateChannelPathIdHash
  );
  const onClearSubchannelUnreads = useChatContext(
    (v) => v.actions.onClearSubchannelUnreads
  );
  const onUpdateChatType = useChatContext((v) => v.actions.onUpdateChatType);
  const onUpdateLastChessMessageId = useChatContext(
    (v) => v.actions.onUpdateLastChessMessageId
  );
  const onUpdateLastChessMoveViewerId = useChatContext(
    (v) => v.actions.onUpdateLastChessMoveViewerId
  );
  const onUpdateRecentChessMessage = useChatContext(
    (v) => v.actions.onUpdateRecentChessMessage
  );
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onUploadChatTopic = useChatContext((v) => v.actions.onUploadChatTopic);
  const prevUserId = useChatContext((v) => v.state.prevUserId);

  const onSetEmbeddedUrl = useContentContext((v) => v.actions.onSetEmbeddedUrl);
  const onSetActualDescription = useContentContext(
    (v) => v.actions.onSetActualDescription
  );
  const onSetActualTitle = useContentContext((v) => v.actions.onSetActualTitle);
  const onSetMediaStarted = useContentContext(
    (v) => v.actions.onSetMediaStarted
  );
  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const onSetSiteUrl = useContentContext((v) => v.actions.onSetSiteUrl);
  const onSetThumbUrl = useContentContext((v) => v.actions.onSetThumbUrl);

  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const allRanks = useNotiContext((v) => v.state.allRanks);
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const onGetRanks = useNotiContext((v) => v.actions.onGetRanks);
  const [aiCardModalCardId, setAICardModalCardId] = useState<number | null>(
    null
  );
  const [creatingChat, setCreatingChat] = useState(false);
  const [createNewChatModalShown, setCreateNewChatModalShown] = useState(false);
  const [topicSelectorModalShown, setTopicSelectorModalShown] = useState(false);
  const userIdRef = useRef(userId);
  const prevPathId: React.MutableRefObject<any> = useRef('');
  const currentPathIdRef = useRef(currentPathId);
  const currentSelectedChannelIdRef = useRef(selectedChannelId);
  const currentChannel: {
    id: number;
    pathId: number | string;
    members: any[];
    subchannelObj: {
      [key: string]: {
        path: string;
      };
    };
    theme: string;
    subchannelIds: number[];
    twoPeople: boolean;
  } = useMemo(
    () => channelsObj[selectedChannelId] || {},
    [channelsObj, selectedChannelId]
  );
  const prevSubchannelPath = useRef(subchannelPath);

  useEffect(() => {
    const { cardId } = queryString.parse(search);
    if (cardId) {
      setAICardModalCardId(Number(cardId));
    } else {
      setAICardModalCardId(null);
    }
  }, [search]);

  useEffect(() => {
    return function cleanUp() {
      onSetWordleModalShown(false);
      onSetChessModalShown(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      userId &&
      (chatType === VOCAB_CHAT_TYPE || chatType === AI_CARD_CHAT_TYPE)
    ) {
      updateCollectType(chatType);
      onSetCollectType(chatType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatType, userId]);

  useEffect(() => {
    if (selectedSubchannelId) {
      updateSubchannelLastRead(selectedSubchannelId);
      onClearSubchannelUnreads({
        channelId: selectedChannelId,
        subchannelId: selectedSubchannelId
      });
    }
    return () => {
      if (selectedSubchannelId) {
        updateSubchannelLastRead(selectedSubchannelId);
        onClearSubchannelUnreads({
          channelId: selectedChannelId,
          subchannelId: selectedSubchannelId
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId, selectedSubchannelId]);

  useEffect(() => {
    if (currentPathId && !isNaN(Number(currentPathId))) {
      const channelId = parseChannelPath(currentPathId);
      if (currentSelectedChannelIdRef.current !== channelId) {
        onUpdateSelectedChannelId(channelId);
      }
    }
    currentPathIdRef.current = currentPathId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPathId]);

  const isUsingCollect = useMemo(() => {
    return (
      currentPathId === VOCAB_CHAT_TYPE || currentPathId === AI_CARD_CHAT_TYPE
    );
  }, [currentPathId]);

  const isUsingCollectRef = useRef(isUsingCollect);

  useEffect(() => {
    isUsingCollectRef.current = !!isUsingCollect;
    if (isUsingCollect && userId) {
      prevPathId.current = currentPathId;
      prevSubchannelPath.current = '';
      if (currentPathId === VOCAB_CHAT_TYPE) {
        handleEnterVocabulary();
      } else {
        handleEnterAICardChat();
      }
    } else {
      const numberedPathId = Number(currentPathId);
      if (numberedPathId) {
        onUpdateLatestPathId(Number(currentPathId));
      }
      if (!stringIsEmpty(currentPathId as string)) {
        onUpdateChatType(null);
      }
      if (currentPathId === 'new') {
        prevPathId.current = currentPathId;
        prevSubchannelPath.current = '';
        if (homeChannelIds.includes(0)) {
          onEnterEmptyChat();
        } else {
          navigate(`/chat`, { replace: true });
        }
      } else if (
        ((currentPathId &&
          Number(currentPathId) !== Number(prevPathId.current)) ||
          (subchannelPath && subchannelPath !== prevSubchannelPath.current)) &&
        userId &&
        loaded
      ) {
        prevPathId.current = currentPathId;
        prevSubchannelPath.current = subchannelPath || '';
        handleChannelEnter({ pathId: currentPathId, subchannelPath });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isUsingCollect,
    loaded,
    subchannelPath,
    lastChatPath,
    navigate,
    userId,
    selectedSubchannelId
  ]);

  useEffect(() => {
    currentSelectedChannelIdRef.current = selectedChannelId;
  }, [selectedChannelId]);

  useEffect(() => {
    if (
      !prevPathId.current &&
      !isNaN(currentChannel.pathId as number) &&
      Number(currentChannel.pathId) !== Number(currentPathId)
    ) {
      navigate(`/chat/${currentChannel.pathId}`, { replace: true });
    }
  }, [currentPathId, currentChannel.pathId, navigate]);

  useEffect(() => {
    if (
      chatType === VOCAB_CHAT_TYPE &&
      !prevPathId.current &&
      !!currentPathId &&
      currentPathId !== VOCAB_CHAT_TYPE
    ) {
      navigate(`/chat/${VOCAB_CHAT_TYPE}`, { replace: true });
    } else if (
      chatType === AI_CARD_CHAT_TYPE &&
      !prevPathId.current &&
      !!currentPathId &&
      currentPathId !== AI_CARD_CHAT_TYPE
    ) {
      navigate(`/chat/${AI_CARD_CHAT_TYPE}`, { replace: true });
    }
  }, [chatType, currentPathId, navigate]);

  useEffect(() => {
    if (!currentPathId) {
      if (chatType === VOCAB_CHAT_TYPE) {
        prevPathId.current = VOCAB_CHAT_TYPE;
        navigate(`/chat/${VOCAB_CHAT_TYPE}`, { replace: true });
      } else if (chatType === AI_CARD_CHAT_TYPE) {
        prevPathId.current = AI_CARD_CHAT_TYPE;
        navigate(`/chat/${AI_CARD_CHAT_TYPE}`, { replace: true });
      } else if (!isNaN(currentChannel.pathId as number)) {
        prevPathId.current = currentChannel.pathId;
        navigate(`/chat/${currentChannel.pathId}`, { replace: true });
      }
    }
  }, [
    chatType,
    currentChannel.pathId,
    currentPathId,
    navigate,
    pathname,
    subchannelPath
  ]);

  useEffect(() => {
    if (userId !== prevUserId && !isUsingCollectRef.current) {
      handleChannelEnter({
        pathId: currentPathId,
        subchannelPath
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, prevUserId, currentPathId, subchannelPath]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const handleEnterVocabulary = useCallback(async () => {
    if (chatType === VOCAB_CHAT_TYPE) return;
    onUpdateChatType(VOCAB_CHAT_TYPE);
    onSetLoadingVocabulary(true);

    const maxRetries = 3;
    const retryCooldown = 1000;
    let success = false;

    await retryLoadVocabulary();

    async function retryLoadVocabulary(retryCount = 0) {
      try {
        const { vocabActivities, wordsObj, wordCollectors } =
          await loadVocabulary();
        if (currentPathIdRef.current === VOCAB_CHAT_TYPE) {
          onLoadVocabulary({ vocabActivities, wordsObj, wordCollectors });
        }
        success = true;
      } catch (error) {
        if (retryCount < maxRetries) {
          console.error(
            `Attempt ${retryCount + 1} failed, retrying in ${
              retryCooldown / 1000
            } seconds...`,
            error
          );
          await new Promise((resolve) => setTimeout(resolve, retryCooldown));
          return retryLoadVocabulary(retryCount + 1);
        } else {
          console.error('All attempts failed:', error);
        }
      } finally {
        if (success || retryCount >= maxRetries) {
          onSetLoadingVocabulary(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatType]);

  const handleEnterAICardChat = useCallback(async () => {
    if (chatType === AI_CARD_CHAT_TYPE) return;
    onUpdateChatType(AI_CARD_CHAT_TYPE);
    onSetLoadingAICardChat(true);

    const maxRetries = 3;
    const retryCooldown = 1000;
    let success = false;

    await retryLoadAICardChat();

    async function retryLoadAICardChat(retryCount = 0) {
      try {
        const {
          cardFeeds,
          cardObj,
          loadMoreShown,
          mostRecentOfferTimeStamp,
          numCardSummonedToday
        } = await loadAICardFeeds();
        if (currentPathIdRef.current === AI_CARD_CHAT_TYPE) {
          onLoadAICardChat({
            cardFeeds,
            cardObj,
            loadMoreShown,
            mostRecentOfferTimeStamp,
            numCardSummonedToday
          });
        }
        success = true;
      } catch (error) {
        if (retryCount < maxRetries) {
          console.error(
            `Attempt ${retryCount + 1} failed, retrying in ${
              retryCooldown / 1000
            } seconds...`,
            error
          );
          await new Promise((resolve) => setTimeout(resolve, retryCooldown));
          return retryLoadAICardChat(retryCount + 1);
        } else {
          console.error('All attempts failed:', error);
        }
      } finally {
        if (success || retryCount >= maxRetries) {
          onSetLoadingAICardChat(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatType]);

  useEffect(() => {
    if (userId && loaded && selectedChannelId) {
      updateChatLastRead(selectedChannelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, userId, selectedChannelId]);

  useEffect(() => {
    if (pageVisible) {
      onClearNumUnreads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageVisible, socketConnected]);

  const partner = useMemo(() => {
    return currentChannel?.twoPeople
      ? currentChannel?.members?.filter(
          (member) => Number(member.id) !== userId
        )?.[0]
      : null;
  }, [currentChannel?.members, currentChannel?.twoPeople, userId]);

  const isAIChat = useMemo(() => {
    return partner?.id === ZERO_TWINKLE_ID || partner?.id === CIEL_TWINKLE_ID;
  }, [partner?.id]);

  const currentChannelName = useMemo(
    () => partner?.username || channelsObj[selectedChannelId]?.channelName,
    [partner, channelsObj, selectedChannelId]
  );

  useEffect(() => {
    socket.on('member_left', handleMemberLeft);

    async function handleMemberLeft({
      channelId,
      leaver
    }: {
      channelId: number;
      leaver: {
        userId: number;
        username: string;
        profilePicUrl: string;
      };
    }) {
      updateChatLastRead(channelId);
      const { userId, username, profilePicUrl } = leaver;
      onNotifyThatMemberLeftChannel({
        channelId,
        userId,
        username,
        profilePicUrl
      });
    }

    return function cleanUp() {
      socket.removeListener('member_left', handleMemberLeft);
    };
  });

  useEffect(() => {
    socket.emit('change_away_status', pageVisible);
    return function cleanUp() {
      if (selectedChannelId) {
        if (selectedSubchannelId) {
          onTrimSubchannelMessages({
            channelId: selectedChannelId,
            subchannelId: selectedSubchannelId
          });
        } else {
          onTrimMessages(selectedChannelId);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubchannelId, selectedChannelId]);

  const currentOnlineUsers = useMemo(() => {
    const result: any = {};
    for (const user of Object.values(chatStatus)) {
      if (user?.isOnline) {
        result[user.id] = user;
      }
    }
    return result;
  }, [chatStatus]);

  const handleCreateNewChannel = useCallback(
    async ({
      userId,
      channelName,
      isClosed
    }: {
      userId: number;
      channelName: string;
      isClosed: boolean;
    }) => {
      setCreatingChat(true);
      const { message, members, pathId } = await createNewChat({
        userId,
        channelName,
        isClosed
      });
      onCreateNewChannel({ message, isClosed, members, pathId });
      socket.emit('join_chat_group', message.channelId);
      navigate(`/chat/${pathId}`);
      setCreateNewChatModalShown(false);
      setCreatingChat(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const displayedThemeColor = useMemo(() => {
    if (currentChannel.theme) {
      return currentChannel.theme;
    }
    if (selectedChannelId === GENERAL_CHAT_ID || currentChannel?.twoPeople) {
      return profileTheme;
    }
    return 'logoBlue';
  }, [
    currentChannel.theme,
    currentChannel?.twoPeople,
    profileTheme,
    selectedChannelId
  ]);

  useEffect(() => {
    isMounted.current = true;
    return function cleanUp() {
      isMounted.current = false;
    };
  }, []);

  return (
    <LocalContext.Provider
      value={{
        actions: {
          onClearSubjectSearchResults,
          onDeleteMessage,
          onAddBookmarkedMessage,
          onAddReactionToMessage,
          onEditChannelSettings,
          onEditMessage,
          onEnterChannelWithId,
          onEnterComment,
          onGetRanks,
          onHideAttachment,
          onHideChat,
          onLeaveChannel,
          onLoadChatSubject,
          onLoadMoreMessages,
          onReceiveMessageOnDifferentChannel,
          onReloadChatSubject,
          onRemoveReactionFromMessage,
          onSaveMessage,
          onSearchChatSubject,
          onCreateNewDMChannel,
          onSeachChatMessages,
          onSetActualDescription,
          onSetActualTitle,
          onSetChessModalShown,
          onSetChessGameState,
          onSetChessTarget,
          onSetCreatingNewDMChannel,
          onSetEmbeddedUrl,
          onSetIsEditing,
          onSetIsRespondingToSubject,
          onSetIsSearchActive,
          onSetFavoriteChannel,
          onSetMediaStarted,
          onSetMessageState,
          onSetReplyTarget,
          onSetSiteUrl,
          onSetThumbUrl,
          onSetUserState,
          onSetWordleModalShown,
          onShowIncoming,
          onSubmitMessage,
          onUpdateLastChessMessageId,
          onUpdateLastChessMoveViewerId,
          onUpdateRecentChessMessage,
          onUploadChatTopic,
          onUpdateChannelPathIdHash
        },
        inputState: state,
        requests: {
          acceptInvitation,
          changeChannelOwner,
          deleteChatMessage,
          editChatMessage,
          editChannelSettings,
          hideChat,
          hideChatAttachment,
          leaveChannel,
          loadChatChannel,
          loadMoreChatMessages,
          loadChatSubject,
          loadRankings,
          parseChannelPath,
          postChatReaction,
          putFavoriteChannel,
          removeChatReaction,
          reloadChatSubject,
          saveChatMessage,
          searchChatSubject,
          sendInvitationMessage,
          setChessMoveViewTimeStamp,
          startNewDMChannel,
          updateUserCoins,
          updateUserXP,
          uploadChatTopic,
          uploadThumb
        },
        state: {
          aiCallChannelId,
          allFavoriteChannelIds,
          allRanks,
          channelOnCall,
          channelPathIdHash,
          chatType,
          chatStatus,
          chessModalShown,
          creatingNewDMChannel,
          filesBeingUploaded,
          lastSubchannelPaths,
          loadingAICardChat,
          loadingVocabulary,
          reconnecting,
          selectedChannelId,
          socketConnected,
          subjectSearchResults,
          userObj,
          wordleModalShown
        },
        onFileUpload
      }}
    >
      <ErrorBoundary componentPath="Chat/Main">
        {userId ? (
          loaded && userId === prevUserId ? (
            <div
              className={css`
                width: 100%;
                height: 100%;
                display: flex;
                font-size: 1.6rem;
                position: relative;
                @media (max-width: ${mobileMaxWidth}) {
                  width: 170vw;
                  height: CALC(100% - 7rem);
                }
              `}
            >
              {createNewChatModalShown && (
                <CreateNewChat
                  channelId={selectedChannelId}
                  creatingChat={creatingChat}
                  onHide={() => setCreateNewChatModalShown(false)}
                  onDone={handleCreateNewChannel}
                />
              )}
              <LeftMenu
                channelName={currentChannelName}
                currentPathId={currentPathId}
                currentChannel={currentChannel}
                displayedThemeColor={displayedThemeColor}
                isAIChat={isAIChat}
                loadingVocabulary={loadingVocabulary}
                loadingAICardChat={loadingAICardChat}
                onNewButtonClick={() => setCreateNewChatModalShown(true)}
                selectedChannelId={selectedChannelId}
                subchannelIds={currentChannel.subchannelIds}
                subchannelObj={currentChannel.subchannelObj}
                subchannelPath={subchannelPath}
                onSetTopicSelectorModalShown={setTopicSelectorModalShown}
              />
              <Body
                key={selectedChannelId}
                displayedThemeColor={displayedThemeColor}
                channelName={currentChannelName}
                partner={partner}
                currentChannel={currentChannel}
                currentPathId={currentPathId}
                subchannelId={selectedSubchannelId}
                subchannelPath={subchannelPath}
                topicSelectorModalShown={topicSelectorModalShown}
                onSetTopicSelectorModalShown={setTopicSelectorModalShown}
                isAICardModalShown={!!aiCardModalCardId}
                onSetAICardModalCardId={setAICardModalCardId}
              />
              <RightMenu
                channelOnCall={channelOnCall}
                channelName={currentChannelName}
                currentChannel={currentChannel}
                currentOnlineUsers={currentOnlineUsers}
                displayedThemeColor={displayedThemeColor}
                isZeroChat={partner?.id === ZERO_TWINKLE_ID}
                isCielChat={partner?.id === CIEL_TWINKLE_ID}
                selectedChannelId={selectedChannelId}
              />
            </div>
          ) : (
            <div
              className={css`
                @keyframes heartbeat {
                  0% {
                    opacity: 0.6;
                  }
                  50% {
                    opacity: 0.1;
                  }
                  100% {
                    opacity: 0.6;
                  }
                }
              `}
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <div
                className={css`
                  width: 100%;
                  height: 100%;
                  position: absolute;
                  top: 0;
                  left: 0;
                  background: url(${loading}) center center;
                  background-size: 33vw;
                  animation: heartbeat 2.5s infinite;
                  z-index: 1;
                  @media (max-width: ${mobileMaxWidth}) {
                    background-size: 60vw;
                  }
                `}
              />
              <div
                style={{
                  width: '100%',
                  height: 'CALC(100% - 5rem)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 2
                }}
              >
                <Loading
                  style={{
                    marginTop: '-10rem',
                    fontWeight: 'bold',
                    color: Color.black(),
                    textShadow: `2px 2px 4px ${Color.darkerGray(0.7)}`
                  }}
                  text={`Loading Twinkle Chat${
                    !loaded ? '...' : userId !== prevUserId ? '..!' : ''
                  }`}
                />
              </div>
            </div>
          )
        ) : (
          <PleaseLogIn />
        )}
        {aiCardModalCardId && (
          <AICardModal
            cardId={aiCardModalCardId}
            onHide={() => {
              if (search.includes('cardId')) {
                navigate('..');
              }
              setAICardModalCardId(null);
            }}
          />
        )}
      </ErrorBoundary>
    </LocalContext.Provider>
  );

  async function handleChannelEnter({
    pathId,
    subchannelPath
  }: {
    pathId: string | number;
    subchannelPath?: string;
  }) {
    if (!userIdRef.current || !pathId) {
      logForUser5('Exiting early due to missing userId or pathId');
      return;
    }

    if (loadingPromise) {
      logForUser5('Returning existing loadingPromise');
      return loadingPromise;
    }

    const MAX_ATTEMPTS = 5;
    const BASE_TIMEOUT = 5000;
    const BASE_DELAY = 2000;
    let attempts = 0;

    logForUser5(
      `Starting for pathId ${pathId}, subchannelPath ${subchannelPath}`
    );

    loadingPromise = (async () => {
      try {
        while (attempts < MAX_ATTEMPTS) {
          logForUser5(`Attempt ${attempts + 1} of ${MAX_ATTEMPTS}`);
          try {
            onUpdateChatType(null);

            if (currentTimeoutId) {
              clearTimeout(currentTimeoutId);
              currentTimeoutId = null;
              logForUser5('Cleared existing timeout');
            }

            const TIMEOUT = BASE_TIMEOUT * Math.pow(2, attempts);
            logForUser5(`Setting timeout to ${TIMEOUT}ms`);

            const timeoutPromise: TimeoutPromise =
              createTimeoutPromise(TIMEOUT);

            const channelEnterPromise = (async () => {
              logForUser5('Starting channelEnterPromise');
              const { isAccessible } = await checkChatAccessible(pathId);
              if (!isAccessible) {
                logForUser5(
                  'Chat is not accessible, redirecting to general chat'
                );
                if (currentTimeoutId) {
                  clearTimeout(currentTimeoutId);
                  currentTimeoutId = null;
                }
                onUpdateSelectedChannelId(GENERAL_CHAT_ID);
                navigate(
                  `/chat${userIdRef.current ? `/${GENERAL_CHAT_PATH_ID}` : ''}`,
                  {
                    replace: true
                  }
                );
                timeoutPromise.cancel();
                loadingPromise = null;
                return;
              }

              const channelId = parseChannelPath(pathId);
              logForUser5(
                `Parsed channelId ${channelId} from pathId ${pathId}`
              );

              if (!channelPathIdHash[pathId]) {
                onUpdateChannelPathIdHash({ channelId, pathId });
                logForUser5(`Updated channelPathIdHash for pathId ${pathId}`);
              }

              if (channelsObj[channelId]?.loaded) {
                logForUser5(`Channel ${channelId} is already loaded`);
                if (!currentSelectedChannelIdRef.current) {
                  onUpdateSelectedChannelId(channelId);
                }

                if (!subchannelPath) {
                  if (lastChatPath !== `/${pathId}`) {
                    updateLastChannelId(channelId);
                  }
                  timeoutPromise.cancel();
                  loadingPromise = null;
                  return;
                } else {
                  const subchannelLoaded =
                    channelsObj[channelId]?.subchannelObj[selectedSubchannelId]
                      ?.loaded;
                  if (subchannelLoaded) {
                    timeoutPromise.cancel();
                    loadingPromise = null;
                    return;
                  }

                  const subchannel = await loadSubchannel({
                    channelId,
                    subchannelId: selectedSubchannelId
                  });
                  if (subchannel.notFound) {
                    timeoutPromise.cancel();
                    loadingPromise = null;
                    return;
                  }
                  onSetSubchannel({ channelId, subchannel });
                  timeoutPromise.cancel();
                  loadingPromise = null;
                  return;
                }
              }

              logForUser5(`Loading chat channel for channelId ${channelId}`);
              const data = await loadChatChannel({ channelId, subchannelPath });
              logForUser5('Chat channel loaded successfully');

              const pathIdMismatch =
                !isNaN(Number(currentPathIdRef.current)) &&
                data.channel.pathId !== Number(currentPathIdRef.current);
              if (pathIdMismatch || isUsingCollectRef.current) {
                logForUser5(
                  `PathId mismatch or using collect. Mismatch: ${pathIdMismatch}, UsingCollect: ${isUsingCollectRef.current}`
                );
                timeoutPromise.cancel();
                loadingPromise = null;
                return;
              }

              onEnterChannelWithId(data);
              logForUser5('Entered channel with loaded data');

              const hasSubchannels =
                Object.keys(data?.channel?.subchannelObj || {}).length > 0;
              const isEnteringSubchannel = subchannelPath && hasSubchannels;

              if (isMounted.current) {
                navigate(
                  `/chat/${data?.channel?.pathId}${
                    isEnteringSubchannel ? `/${subchannelPath}` : ''
                  }`,
                  { replace: true }
                );
              }

              timeoutPromise.cancel();
              logForUser5('Channel enter process completed successfully');
              return;
            })();

            currentTimeoutId = timeoutPromise.timeoutId;

            await Promise.race([channelEnterPromise, timeoutPromise.promise]);
            logForUser5('Promise race completed');

            return;
          } catch (error) {
            if (userIdRef.current === 5) {
              console.error(`Attempt ${attempts + 1} failed:`, error);
            }
            attempts++;

            if (currentTimeoutId) {
              clearTimeout(currentTimeoutId);
              currentTimeoutId = null;
              logForUser5('Cleared timeout after error');
            }

            if (attempts >= MAX_ATTEMPTS) {
              if (userIdRef.current === 5) {
                console.error('Maximum retry attempts exceeded.');
              }
              loadingPromise = null;
              return;
            }

            const delay = BASE_DELAY * Math.pow(2, attempts - 1);
            logForUser5(`Retrying after ${delay}ms delay`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      } finally {
        loadingPromise = null;
        if (currentTimeoutId) {
          clearTimeout(currentTimeoutId);
          currentTimeoutId = null;
          logForUser5('Final cleanup of timeout');
        }
        logForUser5('Function completed');
      }
    })();

    return loadingPromise;

    function createTimeoutPromise(ms: number): TimeoutPromise {
      let timeoutId: any;
      const promise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          logForUser5(`Timeout of ${ms}ms reached`);
          reject(new Error('Operation timed out'));
        }, ms);
      });
      return {
        promise,
        timeoutId,
        cancel: () => {
          clearTimeout(timeoutId);
          logForUser5('Timeout cancelled');
        }
      };
    }
  }

  function logForUser5(message: string) {
    if (userIdRef.current === 5) {
      console.log(`handleChannelEnter: ${message}`);
    }
  }
}
