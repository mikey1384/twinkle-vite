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
import { parseChannelPath } from '~/helpers';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { mobileMaxWidth } from '~/constants/css';
import { socket } from '~/constants/io';
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
  VOCAB_CHAT_TYPE
} from '~/constants/defaultValues';
import ErrorBoundary from '~/components/ErrorBoundary';

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
  const { search } = useLocation();
  const { pathname } = useLocation();
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
  const uploadChatSubject = useAppContext(
    (v) => v.requestHelpers.uploadChatSubject
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
  const currentChannelName = useChatContext((v) => v.state.currentChannelName);
  const filesBeingUploaded = useChatContext((v) => v.state.filesBeingUploaded);
  const homeChannelIds = useChatContext((v) => v.state.homeChannelIds);
  const loadingVocabulary = useChatContext((v) => v.state.loadingVocabulary);
  const loadingAICardChat = useChatContext((v) => v.state.loadingAICardChat);
  const loaded = useChatContext((v) => v.state.loaded);
  const recipientId = useChatContext((v) => v.state.recipientId);
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
  const onReceiveMessage = useChatContext((v) => v.actions.onReceiveMessage);
  const onReceiveMessageOnDifferentChannel = useChatContext(
    (v) => v.actions.onReceiveMessageOnDifferentChannel
  );
  const onReloadChatSubject = useChatContext(
    (v) => v.actions.onReloadChatSubject
  );
  const onRemoveReactionFromMessage = useChatContext(
    (v) => v.actions.onRemoveReactionFromMessage
  );
  const onSaveMessage = useChatContext((v) => v.actions.onSaveMessage);
  const onSendFirstDirectMessage = useChatContext(
    (v) => v.actions.onSendFirstDirectMessage
  );
  const onSetChessModalShown = useChatContext(
    (v) => v.actions.onSetChessModalShown
  );
  const onSetChessTarget = useChatContext((v) => v.actions.onSetChessTarget);
  const onSetCurrentChannelName = useChatContext(
    (v) => v.actions.onSetCurrentChannelName
  );
  const onSetIsRespondingToSubject = useChatContext(
    (v) => v.actions.onSetIsRespondingToSubject
  );
  const onSetLoadingVocabulary = useChatContext(
    (v) => v.actions.onSetLoadingVocabulary
  );
  const onSetLoadingAIImageChat = useChatContext(
    (v) => v.actions.onSetLoadingAIImageChat
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
  const onUploadChatSubject = useChatContext(
    (v) => v.actions.onUploadChatSubject
  );

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
  const loadingRef = useRef(false);
  const prevPathId: React.MutableRefObject<any> = useRef('');
  const prevUserId = useRef(null);
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
    if (chatType === VOCAB_CHAT_TYPE || chatType === AI_CARD_CHAT_TYPE) {
      updateCollectType(chatType);
      onSetCollectType(chatType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatType]);

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
    let subchannelPathExistsAndIsInvalid = !!currentChannel?.id;
    if (
      !stringIsEmpty(subchannelPath) &&
      currentChannel?.subchannelObj &&
      selectedChannelId === parseChannelPath(currentPathId)
    ) {
      for (let subchannel of Object.values(currentChannel?.subchannelObj)) {
        if (subchannel?.path === subchannelPath) {
          subchannelPathExistsAndIsInvalid = false;
        }
      }
    } else {
      subchannelPathExistsAndIsInvalid = false;
    }
    if (subchannelPathExistsAndIsInvalid) {
      navigate('/chat', { replace: true });
    }
  }, [
    currentChannel?.id,
    currentChannel?.subchannelObj,
    navigate,
    subchannelPath,
    selectedChannelId,
    currentPathId
  ]);

  useEffect(() => {
    if (!isNaN(Number(currentPathId))) {
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
    if (isUsingCollect) {
      prevPathId.current = currentPathId;
      prevSubchannelPath.current = '';
      if (currentPathId === VOCAB_CHAT_TYPE) {
        handleEnterVocabulary();
      } else {
        handleEnterAICardChat();
      }
    } else {
      if (!stringIsEmpty(currentPathId as string)) {
        onUpdateChatType('default');
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
        userId
      ) {
        prevPathId.current = currentPathId;
        prevSubchannelPath.current = subchannelPath || '';
        handleChannelEnter({ pathId: currentPathId, subchannelPath });
      }
    }

    async function handleChannelEnter({
      pathId,
      subchannelPath
    }: {
      pathId: string | number;
      subchannelPath?: string;
    }) {
      loadingRef.current = true;
      onUpdateChatType('default');
      const { isAccessible } = await checkChatAccessible(pathId);
      if (!isAccessible) {
        onUpdateSelectedChannelId(GENERAL_CHAT_ID);
        return navigate(`/chat/${GENERAL_CHAT_PATH_ID}`, { replace: true });
      }
      const channelId = parseChannelPath(pathId);
      if (!channelPathIdHash[pathId]) {
        onUpdateChannelPathIdHash({ channelId, pathId });
      }
      if (channelsObj[channelId]?.loaded) {
        if (!currentSelectedChannelIdRef.current) {
          onUpdateSelectedChannelId(channelId);
        }
        if (!subchannelPath) {
          if (lastChatPath !== `/${pathId}`) {
            updateLastChannelId(channelId);
          }
          return;
        } else {
          if (
            channelsObj[channelId]?.subchannelObj[selectedSubchannelId]?.loaded
          ) {
            return;
          }
          const subchannel = await loadSubchannel({
            channelId,
            subchannelId: selectedSubchannelId
          });
          if (subchannel.notFound) return;
          return onSetSubchannel({ channelId, subchannel });
        }
      }
      const data = await loadChatChannel({ channelId, subchannelPath });
      if (
        (!isNaN(Number(currentPathIdRef.current)) &&
          data.channel.pathId !== Number(currentPathIdRef.current)) ||
        isUsingCollectRef.current
      ) {
        loadingRef.current = false;
        return;
      }
      onEnterChannelWithId(data);
      loadingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isUsingCollect,
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
    if (!prevUserId.current) {
      prevUserId.current = userId;
    } else {
      navigate(`/chat`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleEnterVocabulary = useCallback(async () => {
    if (chatType === VOCAB_CHAT_TYPE) return;
    onUpdateChatType(VOCAB_CHAT_TYPE);
    onSetLoadingVocabulary(true);
    const { vocabActivities, wordsObj, wordCollectors } =
      await loadVocabulary();
    if (currentPathIdRef.current === VOCAB_CHAT_TYPE) {
      onLoadVocabulary({ vocabActivities, wordsObj, wordCollectors });
    }
    onSetLoadingVocabulary(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatType]);

  const handleEnterAICardChat = useCallback(async () => {
    if (chatType === AI_CARD_CHAT_TYPE) return;
    onUpdateChatType(AI_CARD_CHAT_TYPE);
    onSetLoadingAIImageChat(true);
    const { cardFeeds, cardObj, loadMoreShown, numCardSummonedToday } =
      await loadAICardFeeds();
    if (currentPathIdRef.current === AI_CARD_CHAT_TYPE) {
      onLoadAICardChat({
        cardFeeds,
        cardObj,
        loadMoreShown,
        numCardSummonedToday
      });
    }
    onSetLoadingAIImageChat(false);
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

  useEffect(() => {
    onSetCurrentChannelName(
      partner?.username || channelsObj[currentChannel?.id]?.channelName
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner, channelsObj, currentChannel]);

  useEffect(() => {
    socket.on('chess_move_made', onNotifiedMoveMade);
    socket.on('subject_changed', handleTopicChange);
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

    function onNotifiedMoveMade({ channelId }: { channelId: number }) {
      if (channelId === selectedChannelId) {
        onSetChessModalShown(false);
      }
    }

    return function cleanUp() {
      socket.removeListener('chess_move_made', onNotifiedMoveMade);
      socket.removeListener('subject_changed', handleTopicChange);
      socket.removeListener('member_left', handleMemberLeft);
    };
  });

  useEffect(() => {
    socket.emit('change_away_status', pageVisible);
    return function cleanUp() {
      onClearNumUnreads();
      if (selectedChannelId) {
        onTrimMessages(selectedChannelId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId]);

  const currentOnlineUsers = useMemo(() => {
    const result: any = {};
    for (let user of Object.values(chatStatus)) {
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

  const handleTopicChange = useCallback(
    ({
      message,
      channelId,
      pathId,
      channelName
    }: {
      message: any;
      channelId: number;
      pathId: number | string;
      channelName: string;
    }) => {
      let messageIsForCurrentChannel = message.channelId === selectedChannelId;
      let senderIsUser = message.userId === userId;
      if (senderIsUser) return;
      if (messageIsForCurrentChannel) {
        onReceiveMessage({ message, pageVisible });
      }
      if (!messageIsForCurrentChannel) {
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageVisible, selectedChannelId, userId]
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

  return (
    <LocalContext.Provider
      value={{
        actions: {
          onClearSubjectSearchResults,
          onDeleteMessage,
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
          onSendFirstDirectMessage,
          onSetActualDescription,
          onSetActualTitle,
          onSetChessModalShown,
          onSetChessGameState,
          onSetChessTarget,
          onSetCreatingNewDMChannel,
          onSetEmbeddedUrl,
          onSetIsEditing,
          onSetIsRespondingToSubject,
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
          onUploadChatSubject,
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
          updateUserXP,
          uploadChatSubject,
          uploadThumb
        },
        state: {
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
          recipientId,
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
          loaded ? (
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
                currentPathId={currentPathId}
                currentChannel={currentChannel}
                displayedThemeColor={displayedThemeColor}
                loadingVocabulary={loadingVocabulary}
                loadingAICardChat={loadingAICardChat}
                onNewButtonClick={() => setCreateNewChatModalShown(true)}
                selectedChannelId={selectedChannelId}
                subchannelIds={currentChannel.subchannelIds}
                subchannelObj={currentChannel.subchannelObj}
                subchannelPath={subchannelPath}
              />
              <Body
                displayedThemeColor={displayedThemeColor}
                channelName={currentChannelName}
                partner={partner}
                currentChannel={currentChannel}
                currentPathId={currentPathId}
                subchannelId={selectedSubchannelId}
                subchannelPath={subchannelPath}
                isAICardModalShown={!!aiCardModalCardId}
                onSetAICardModalCardId={setAICardModalCardId}
              />
              <RightMenu
                channelOnCall={channelOnCall}
                channelName={currentChannelName}
                currentChannel={currentChannel}
                currentOnlineUsers={currentOnlineUsers}
                displayedThemeColor={displayedThemeColor}
                selectedChannelId={selectedChannelId}
              />
            </div>
          ) : (
            <Loading text="Loading Twinkle Chat" />
          )
        ) : (
          <PleaseLogIn />
        )}
        {aiCardModalCardId && (
          <AICardModal
            cardId={aiCardModalCardId}
            onHide={() => {
              navigate('..');
              setAICardModalCardId(null);
            }}
          />
        )}
      </ErrorBoundary>
    </LocalContext.Provider>
  );
}
