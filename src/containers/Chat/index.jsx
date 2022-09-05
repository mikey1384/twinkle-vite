import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import CreateNewChat from './Modals/CreateNewChat';
import LeftMenu from './LeftMenu';
import RightMenu from './RightMenu';
import Body from './Body';
import Loading from '~/components/Loading';
import PleaseLogIn from './PleaseLogIn';
import LocalContext from './Context';
import { parseChannelPath } from '~/helpers';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { mobileMaxWidth } from '~/constants/css';
import { socket } from '~/constants/io';
import { css } from '@emotion/css';
import {
  Route,
  Routes,
  useLocation,
  useParams,
  useNavigate
} from 'react-router-dom';
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
  GENERAL_CHAT_PATH_ID
} from '~/constants/defaultValues';
import ErrorBoundary from '~/components/ErrorBoundary';

Chat.propTypes = {
  onFileUpload: PropTypes.func
};

function Chat({ onFileUpload }) {
  const { pathname } = useLocation();
  const { lastChatPath, userId, profileTheme } = useKeyContext(
    (v) => v.myState
  );
  const { currentPathId } = useParams();
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
  const state = useInputContext((v) => v.state);
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const allFavoriteChannelIds = useChatContext(
    (v) => v.state.allFavoriteChannelIds
  );
  const chatType = useChatContext((v) => v.state.chatType);
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const chessModalShown = useChatContext((v) => v.state.chessModalShown);
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const channelPathIdHash = useChatContext((v) => v.state.channelPathIdHash);
  const lastSubchannelPaths = useChatContext(
    (v) => v.state.lastSubchannelPaths
  );
  const channelOnCall = useChatContext((v) => v.state.channelOnCall);
  const creatingNewDMChannel = useChatContext(
    (v) => v.state.creatingNewDMChannel
  );
  const currentChannelName = useChatContext((v) => v.state.currentChannelName);
  const filesBeingUploaded = useChatContext((v) => v.state.filesBeingUploaded);
  const homeChannelIds = useChatContext((v) => v.state.homeChannelIds);
  const isRespondingToSubject = useChatContext(
    (v) => v.state.isRespondingToSubject
  );
  const loadingVocabulary = useChatContext((v) => v.state.loadingVocabulary);
  const loaded = useChatContext((v) => v.state.loaded);
  const recepientId = useChatContext((v) => v.state.recepientId);
  const reconnecting = useChatContext((v) => v.state.reconnecting);
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);
  const subjectObj = useChatContext((v) => v.state.subjectObj);
  const subjectSearchResults = useChatContext(
    (v) => v.state.subjectSearchResults
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
  const onSetCurrentChannelName = useChatContext(
    (v) => v.actions.onSetCurrentChannelName
  );
  const onSetIsRespondingToSubject = useChatContext(
    (v) => v.actions.onSetIsRespondingToSubject
  );
  const onSetLoadingVocabulary = useChatContext(
    (v) => v.actions.onSetLoadingVocabulary
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
  const onUpdateLastSubchannelPath = useChatContext(
    (v) => v.actions.onUpdateLastSubchannelPath
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
  const [creatingChat, setCreatingChat] = useState(false);
  const [createNewChatModalShown, setCreateNewChatModalShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const prevPathId = useRef('');
  const prevUserId = useRef(null);
  const currentPathIdRef = useRef(currentPathId);
  const currentChannel = useMemo(
    () => channelsObj[selectedChannelId] || {},
    [channelsObj, selectedChannelId]
  );
  const subchannelPath = useMemo(() => {
    if (!currentPathId) return '';
    const [, result] = pathname.split(currentPathId)?.[1]?.split('/') || [];
    return result || '';
  }, [currentPathId, pathname]);
  const prevSubchannelPath = useRef(subchannelPath);
  const subchannelId = useMemo(() => {
    if (!subchannelPath || !currentChannel?.subchannelObj) return null;
    for (let subchannel of Object.values(currentChannel.subchannelObj)) {
      if (subchannel.path === subchannelPath) {
        return subchannel.id;
      }
    }
    return null;
  }, [currentChannel.subchannelObj, subchannelPath]);

  useEffect(() => {
    let subchannelPathExistsAndIsInvalid = true;
    if (
      !stringIsEmpty(subchannelPath) &&
      currentChannel?.subchannelObj &&
      selectedChannelId === parseChannelPath(currentPathId)
    ) {
      for (let subchannel of Object.values(currentChannel?.subchannelObj)) {
        if (subchannel.path === subchannelPath) {
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
    currentChannel?.subchannelObj,
    navigate,
    subchannelPath,
    selectedChannelId,
    currentPathId
  ]);

  useEffect(() => {
    currentPathIdRef.current = currentPathId;
  }, [currentPathId]);

  useEffect(() => {
    if (currentPathId === 'vocabulary') {
      prevPathId.current = 'vocabulary';
      prevSubchannelPath.current = '';
      handleEnterVocabulary();
    } else {
      if (!stringIsEmpty(currentPathId)) {
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

    async function handleChannelEnter({ pathId, subchannelPath }) {
      loadingRef.current = true;
      onUpdateChatType('default');
      const { isAccessible } = await checkChatAccessible(pathId);
      if (!isAccessible) {
        return navigate(`/chat/${GENERAL_CHAT_PATH_ID}`, { replace: true });
      }
      const channelId = channelPathIdHash[pathId] || parseChannelPath(pathId);
      if (!channelPathIdHash[pathId]) {
        onUpdateChannelPathIdHash({ channelId, pathId });
      }
      if (channelsObj[channelId]?.loaded) {
        onUpdateSelectedChannelId(channelId);
        if (!subchannelPath) {
          if (lastChatPath !== `/${pathId}`) {
            updateLastChannelId(channelId);
          }
          return;
        } else {
          onUpdateLastSubchannelPath({
            channelId,
            path: subchannelPath
          });
          if (channelsObj[channelId]?.subchannelObj[subchannelId]?.loaded) {
            return;
          }
          const subchannel = await loadSubchannel({
            channelId,
            subchannelId
          });
          return onSetSubchannel({ channelId, subchannel });
        }
      }
      setLoading(true);
      const data = await loadChatChannel({ channelId, subchannelPath });
      if (
        (!isNaN(Number(currentPathIdRef.current)) &&
          data.channel.pathId !== Number(currentPathIdRef.current)) ||
        currentPathIdRef.current === 'vocabulary'
      ) {
        setLoading(false);
        loadingRef.current = false;
        return;
      }
      onEnterChannelWithId(data);
      setLoading(false);
      loadingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPathId, subchannelPath, currentChannel?.subchannelObj]);

  useEffect(() => {
    if (
      !prevPathId.current &&
      !isNaN(currentChannel.pathId) &&
      Number(currentChannel.pathId) !== Number(currentPathId)
    ) {
      navigate(`/chat/${currentChannel.pathId}`, { replace: true });
    }
  }, [currentPathId, currentChannel.pathId, navigate]);

  useEffect(() => {
    if (
      chatType === 'vocabulary' &&
      !prevPathId.current &&
      !!currentPathId &&
      currentPathId !== 'vocabulary'
    ) {
      navigate(`/chat/vocabulary`, { replace: true });
    }
  }, [chatType, currentPathId, navigate]);

  useEffect(() => {
    if (!currentPathId) {
      if (chatType === 'vocabulary') {
        prevPathId.current = 'vocabulary';
        navigate(`/chat/vocabulary`, { replace: true });
      } else if (!isNaN(currentChannel.pathId)) {
        prevPathId.current = currentChannel.pathId;
        navigate(`/chat/${currentChannel.pathId}`, { replace: true });
      }
    }
  }, [chatType, currentChannel.pathId, currentPathId, navigate]);

  useEffect(() => {
    if (!prevUserId.current) {
      prevUserId.current = userId;
    } else {
      navigate(`/chat`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleEnterVocabulary = useCallback(async () => {
    if (chatType === 'vocabulary') return;
    onSetLoadingVocabulary(true);
    const { vocabActivities, wordsObj, wordCollectors } =
      await loadVocabulary();
    if (currentPathIdRef.current === 'vocabulary') {
      onLoadVocabulary({ vocabActivities, wordsObj, wordCollectors });
    }
    onSetLoadingVocabulary(false);
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

    async function handleMemberLeft({ channelId, leaver }) {
      updateChatLastRead(channelId);
      const { userId, username, profilePicUrl } = leaver;
      onNotifyThatMemberLeftChannel({
        channelId,
        userId,
        username,
        profilePicUrl
      });
    }

    function onNotifiedMoveMade({ channelId }) {
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

  const currentChannelOnlineMembers = useMemo(() => {
    if (currentChannel.id === GENERAL_CHAT_ID) {
      const result = {};
      for (let member of Object.values(chatStatus)) {
        if (member?.isOnline) {
          result[member.id] = member;
        }
      }
      return result;
    }
    const onlineMembersArray = (currentChannel?.members || []).filter(
      (member) => !!chatStatus[member.id]?.isOnline
    );
    const result = {};
    for (let member of onlineMembersArray) {
      result[member.id] = member;
    }
    return result;
  }, [chatStatus, currentChannel.id, currentChannel?.members]);

  const handleCreateNewChannel = useCallback(
    async ({ userId, channelName, isClosed }) => {
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
    ({ message, channelId, pathId, channelName }) => {
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
          onSetCreatingNewDMChannel,
          onSetEmbeddedUrl,
          onSetIsEditing,
          onSetIsRespondingToSubject,
          onSetFavoriteChannel,
          onSetMediaStarted,
          onSetReplyTarget,
          onSetSiteUrl,
          onSetThumbUrl,
          onSetUserState,
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
          isRespondingToSubject,
          lastSubchannelPaths,
          loadingVocabulary,
          recepientId,
          reconnecting,
          selectedChannelId,
          socketConnected,
          subjectObj,
          subjectSearchResults,
          userObj,
          wordleModalShown
        },
        onFileUpload
      }}
    >
      <ErrorBoundary componentPath="Chat/index">
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
                  creatingChat={creatingChat}
                  onHide={() => setCreateNewChatModalShown(false)}
                  onDone={handleCreateNewChannel}
                />
              )}
              <Routes>
                <Route
                  path="/:subChannelPath"
                  element={
                    <LeftMenu
                      currentPathId={currentPathId}
                      displayedThemeColor={displayedThemeColor}
                      onNewButtonClick={() => setCreateNewChatModalShown(true)}
                      subchannelIds={currentChannel.subchannelIds}
                      subchannelObj={currentChannel.subchannelObj}
                    />
                  }
                />
                <Route
                  path="/"
                  element={
                    <LeftMenu
                      currentPathId={currentPathId}
                      displayedThemeColor={displayedThemeColor}
                      onNewButtonClick={() => setCreateNewChatModalShown(true)}
                      subchannelIds={currentChannel.subchannelIds}
                      subchannelObj={currentChannel.subchannelObj}
                    />
                  }
                />
              </Routes>
              <Routes>
                <Route
                  path="/:subChannelPath"
                  element={
                    <Body
                      displayedThemeColor={displayedThemeColor}
                      loading={loading}
                      channelName={currentChannelName}
                      chessOpponent={partner}
                      currentChannel={currentChannel}
                      subchannelPath={subchannelPath}
                    />
                  }
                />
                <Route
                  path="/"
                  element={
                    <Body
                      displayedThemeColor={displayedThemeColor}
                      loading={loading}
                      channelName={currentChannelName}
                      chessOpponent={partner}
                      currentChannel={currentChannel}
                    />
                  }
                />
              </Routes>
              <RightMenu
                channelOnCall={channelOnCall}
                channelName={currentChannelName}
                currentChannel={currentChannel}
                currentChannelOnlineMembers={currentChannelOnlineMembers}
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
      </ErrorBoundary>
    </LocalContext.Provider>
  );
}

export default memo(Chat);
