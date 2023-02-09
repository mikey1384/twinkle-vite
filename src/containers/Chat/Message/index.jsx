import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import Chess from '../Chess';
import GameOverMessage from './GameOverMessage';
import TextMessage from './TextMessage';
import Icon from '~/components/Icon';
import DropdownButton from '~/components/Buttons/DropdownButton';
import TargetMessage from './TargetMessage';
import TargetSubject from './TargetSubject';
import RewardMessage from './RewardMessage';
import Invitation from './Invitation';
import DrawOffer from './DrawOffer';
import WordleResult from './WordleResult';
import MessageRewardModal from '../Modals/MessageRewardModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import LocalContext from '../Context';
import ReactionButton from './ReactionButton';
import Reactions from './Reactions';
import localize from '~/constants/localize';
import moment from 'moment';
import FileAttachment from './FileAttachment';
import TargetChessPosition from './TargetChessPosition';
import TransferMessage from './TransferMessage';
import { useInView } from 'react-intersection-observer';
import { socket } from '~/constants/io';
import { MessageStyle } from '../Styles';
import { fetchURLFromText } from '~/helpers/stringHelpers';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);
const replyLabel = localize('reply2');
const rewardLabel = localize('reward');
const removeLabel = localize('remove');
const editLabel = localize('edit');

Message.propTypes = {
  chessCountdownNumber: PropTypes.number,
  partner: PropTypes.object,
  channelId: PropTypes.number,
  currentChannel: PropTypes.object,
  displayedThemeColor: PropTypes.string,
  forceRefreshForMobile: PropTypes.func,
  message: PropTypes.object,
  onDelete: PropTypes.func,
  index: PropTypes.number,
  isBanned: PropTypes.bool,
  isLastMsg: PropTypes.bool,
  isNotification: PropTypes.bool,
  isRestricted: PropTypes.bool,
  loading: PropTypes.bool,
  onAcceptGroupInvitation: PropTypes.func.isRequired,
  onChessBoardClick: PropTypes.func,
  onChessSpoilerClick: PropTypes.func,
  onCancelRewindRequest: PropTypes.func,
  onAcceptRewind: PropTypes.func,
  onDeclineRewind: PropTypes.func,
  onReceiveNewMessage: PropTypes.func,
  onReplyClick: PropTypes.func,
  onRequestRewind: PropTypes.func,
  onSetAICardModalCardId: PropTypes.func,
  onSetChessTarget: PropTypes.func,
  onRewardMessageSubmit: PropTypes.func.isRequired,
  onScrollToBottom: PropTypes.func.isRequired,
  onShowSubjectMsgsModal: PropTypes.func,
  zIndex: PropTypes.number
};

function Message({
  channelId,
  chessCountdownNumber,
  partner,
  currentChannel,
  displayedThemeColor,
  forceRefreshForMobile,
  index,
  isLastMsg,
  isNotification,
  isRestricted,
  isBanned,
  loading,
  message,
  message: {
    id: messageId,
    attachmentHidden,
    chessState,
    content,
    fileToUpload,
    fileName,
    filePath,
    fileSize,
    gameWinnerId,
    invitePath,
    invitationChannelId,
    isChessMsg,
    isAbort,
    isDraw,
    isDrawOffer,
    isNewMessage,
    isReloadedSubject,
    isSubject,
    linkDescription,
    linkTitle,
    linkUrl,
    moveViewTimeStamp,
    numMsgs,
    rewardAmount,
    rewardReason,
    subchannelId,
    subjectId,
    thumbUrl,
    timeStamp,
    uploaderAuthLevel,
    userId,
    transferDetails,
    transactionDetails,
    wordleResult,
    isResign
  },
  onAcceptGroupInvitation,
  onChessBoardClick,
  onCancelRewindRequest,
  onAcceptRewind,
  onDeclineRewind,
  onDelete,
  onChessSpoilerClick,
  onReceiveNewMessage,
  onReplyClick,
  onRequestRewind,
  onRewardMessageSubmit,
  onSetAICardModalCardId,
  onSetChessTarget,
  onScrollToBottom,
  onShowSubjectMsgsModal,
  zIndex
}) {
  const {
    reward: { color: rewardColor }
  } = useKeyContext((v) => v.theme);
  const spoilerClickedRef = useRef(false);
  const [highlighted, setHighlighted] = useState(false);
  const [reactionsMenuShown, setReactionsMenuShown] = useState(false);
  const {
    actions: {
      onAddReactionToMessage,
      onEditMessage,
      onRemoveReactionFromMessage,
      onSaveMessage,
      onSetEmbeddedUrl,
      onSetActualDescription,
      onSetActualTitle,
      onSetIsEditing,
      onSetSiteUrl,
      onSetThumbUrl,
      onSetReplyTarget,
      onUpdateLastChessMessageId,
      onUpdateLastChessMoveViewerId,
      onUpdateRecentChessMessage
    },
    requests: {
      editChatMessage,
      saveChatMessage,
      setChessMoveViewTimeStamp,
      postChatReaction,
      removeChatReaction
    },
    state: { filesBeingUploaded, socketConnected }
  } = useContext(LocalContext);
  const {
    authLevel,
    canDelete,
    canEdit,
    canReward,
    isCreator,
    userId: myId,
    username: myUsername,
    profilePicUrl: myProfilePicUrl
  } = useKeyContext((v) => v.myState);
  const {
    thumbUrl: recentThumbUrl,
    isEditing,
    started
  } = useContentState({
    contentType: 'chat',
    contentId: messageId
  });
  const [ComponentRef, inView] = useInView({
    threshold: 0
  });
  const PanelRef = useRef(null);
  const DropdownButtonRef = useRef(null);
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const [visible, setVisible] = useState(true);
  useLazyLoad({
    PanelRef,
    inView,
    onSetPlaceholderHeight: setPlaceholderHeight,
    onSetVisible: setVisible,
    delay: 1000
  });
  const userIsUploader = useMemo(() => myId === userId, [myId, userId]);
  useEffect(() => {
    if (isLastMsg && userIsUploader) {
      onScrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastMsg, userIsUploader]);
  useEffect(() => {
    if (isLastMsg && isNewMessage && !userIsUploader) {
      onReceiveNewMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastMsg, isNewMessage, userIsUploader]);
  const userCanEditThis = useMemo(
    () =>
      !invitePath &&
      !isDrawOffer &&
      (((canEdit || canDelete) && authLevel > uploaderAuthLevel) ||
        userIsUploader),
    [
      authLevel,
      canDelete,
      canEdit,
      invitePath,
      isDrawOffer,
      uploaderAuthLevel,
      userIsUploader
    ]
  );
  const userCanRewardThis = useMemo(
    () => canReward && authLevel > uploaderAuthLevel && myId !== userId,
    [authLevel, canReward, uploaderAuthLevel, userId, myId]
  );
  const [uploadStatus = {}] = useMemo(
    () =>
      filesBeingUploaded[
        channelId + (subchannelId ? `/${subchannelId}` : '')
      ]?.filter(({ filePath: path }) => path === filePath) || [],
    [channelId, filePath, filesBeingUploaded, subchannelId]
  );
  let {
    username,
    profilePicUrl,
    targetMessage,
    targetSubject,
    isCallNotification,
    tempMessageId,
    ...post
  } = message;
  const [messageRewardModalShown, setMessageRewardModalShown] = useState(false);
  const [extractedUrl, setExtractedUrl] = useState(fetchURLFromText(content));

  if (fileToUpload && !userId) {
    userId = myId;
    username = myUsername;
    profilePicUrl = myProfilePicUrl;
  }
  useEffect(() => {
    if (isChessMsg && typeof messageId === 'number') {
      onUpdateLastChessMessageId({ channelId, messageId });
    } else if (gameWinnerId || isDraw) {
      onUpdateLastChessMessageId({
        channelId,
        messageId: currentChannel.lastChessMessageId + 1
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, isChessMsg, messageId]);

  useEffect(() => {
    if (!message.id && message.isChessMsg) {
      onUpdateRecentChessMessage({ channelId, message });
    }
    if (
      userIsUploader &&
      !message.id &&
      !message.fileToUpload &&
      !message.isSubject &&
      (!(message.isNotification && !message.chessState) || isCallNotification)
    ) {
      handleSaveMessage();
    }
    async function handleSaveMessage() {
      const { messageId, timeStamp } = await saveChatMessage({
        message: post,
        targetMessageId: targetMessage?.id,
        targetSubject
      });
      onSaveMessage({
        messageId,
        subchannelId,
        index,
        channelId,
        timeStamp,
        tempMessageId
      });
      const messageToSendOverSocket = {
        ...message,
        uploaderAuthLevel: authLevel,
        isNewMessage: true,
        id: messageId
      };
      delete messageToSendOverSocket.tempMessageId;
      const channelData = {
        id: currentChannel.id,
        channelName: currentChannel.channelName,
        members: currentChannel.members,
        twoPeople: currentChannel.twoPeople,
        pathId: currentChannel.pathId
      };
      socket.emit('new_chat_message', {
        message: messageToSendOverSocket,
        channel: channelData
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spoilerOff = useMemo(() => {
    if (typeof chessCountdownNumber === 'number') {
      return true;
    }
    const userMadeThisMove = chessState?.move?.by === myId;
    const userIsTheLastMoveViewer =
      currentChannel.lastChessMoveViewerId === myId;
    if (
      userMadeThisMove ||
      userIsTheLastMoveViewer ||
      moveViewTimeStamp ||
      messageId < currentChannel.lastChessMessageId
    ) {
      return true;
    }
    return false;
  }, [
    chessCountdownNumber,
    chessState?.move?.by,
    currentChannel.lastChessMessageId,
    currentChannel.lastChessMoveViewerId,
    messageId,
    moveViewTimeStamp,
    myId
  ]);

  useEffect(() => {
    const url = fetchURLFromText(content);
    if (url) {
      setExtractedUrl(url);
      onSetEmbeddedUrl({ contentId: messageId, contentType: 'chat', url });
      if (linkDescription) {
        onSetActualDescription({
          contentId: messageId,
          contentType: 'chat',
          description: linkDescription
        });
      }
      if (linkTitle) {
        onSetActualTitle({
          contentId: messageId,
          contentType: 'chat',
          title: linkTitle
        });
      }
      if (linkUrl) {
        onSetSiteUrl({
          contentId: messageId,
          contentType: 'chat',
          siteUrl: linkUrl
        });
      }
      if (thumbUrl) {
        onSetThumbUrl({
          contentId: messageId,
          contentType: 'chat',
          thumbUrl
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const contentShown = useMemo(
    () => inView || isLastMsg || started || visible || !placeholderHeight,
    [inView, isLastMsg, placeholderHeight, started, visible]
  );

  const dropdownMenuItems = useMemo(() => {
    const result = [];
    if (isBanned) return result;
    if (!isRestricted) {
      result.push({
        label: (
          <>
            <Icon icon="reply" />
            <span style={{ marginLeft: '1rem' }}>{replyLabel}</span>
          </>
        ),
        onClick: () => {
          onSetReplyTarget({
            channelId: currentChannel.id,
            subchannelId,
            target: rewardAmount
              ? targetMessage
              : {
                  ...message,
                  thumbUrl: thumbUrl || recentThumbUrl,
                  timeStamp
                }
          });
          onReplyClick();
        }
      });
    }
    if (userCanEditThis && !rewardAmount) {
      result.push({
        label: (
          <>
            <Icon icon="pencil-alt"></Icon>
            <span style={{ marginLeft: '1rem' }}>{editLabel}</span>
          </>
        ),
        onClick: () => {
          onSetIsEditing({
            contentId: messageId,
            contentType: 'chat',
            isEditing: true
          });
        }
      });
    }
    if ((userIsUploader || canDelete) && !isDrawOffer) {
      result.push({
        label: (
          <>
            <Icon icon="trash-alt"></Icon>
            <span style={{ marginLeft: '1rem' }}>{removeLabel}</span>
          </>
        ),
        onClick: () => {
          onDelete({ messageId });
        }
      });
    }
    if (
      ((userCanRewardThis && channelId === 2) ||
        (isCreator && !userIsUploader)) &&
      !rewardAmount
    ) {
      result.push({
        label: (
          <>
            <Icon icon="star" />
            <span style={{ marginLeft: '1rem' }}>{rewardLabel}</span>
          </>
        ),
        style: { color: '#fff', background: Color[rewardColor]() },
        className: css`
          opacity: 0.9;
          &:hover {
            opacity: 1 !important;
          }
        `,
        onClick: () => setMessageRewardModalShown(true)
      });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canDelete,
    channelId,
    isBanned,
    isCreator,
    isDrawOffer,
    message,
    messageId,
    recentThumbUrl,
    rewardAmount,
    targetMessage,
    thumbUrl,
    userCanEditThis,
    userCanRewardThis,
    userIsUploader
  ]);

  const displayedTimeStamp = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  const dropdownButtonShown = useMemo(
    () => dropdownMenuItems?.length > 0,
    [dropdownMenuItems?.length]
  );

  const menuButtonsShown = useMemo(
    () =>
      !!messageId &&
      !isNotification &&
      !isChessMsg &&
      !isEditing &&
      !fileToUpload,
    [fileToUpload, isChessMsg, isEditing, isNotification, messageId]
  );

  const isChessDiscussion = useMemo(() => {
    return !!chessState?.isDiscussion;
  }, [chessState?.isDiscussion]);

  const handleChessSpoilerClick = useCallback(async () => {
    if (spoilerClickedRef.current) return;
    spoilerClickedRef.current = true;
    onSetReplyTarget({ channelId: currentChannel.id, target: null });
    try {
      await setChessMoveViewTimeStamp({ channelId, message });
      onUpdateLastChessMoveViewerId({ channelId, viewerId: myId });
      onChessSpoilerClick(userId);
      spoilerClickedRef.current = false;
    } catch (error) {
      console.error(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChessSpoilerClick, channelId, message, userId]);

  const handleRewardMessageSubmit = useCallback(
    ({ reasonId, amount }) => {
      onRewardMessageSubmit({ amount, reasonId, message });
    },
    [message, onRewardMessageSubmit]
  );

  const handleEditCancel = useCallback(() => {
    onSetIsEditing({
      contentId: messageId,
      contentType: 'chat',
      isEditing: false
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  const handleEditDone = useCallback(
    async (editedMessage) => {
      const messageIsSubject = !!isSubject || !!isReloadedSubject;
      try {
        const subjectChanged = await editChatMessage({
          editedMessage,
          messageId,
          isSubject: messageIsSubject,
          subjectId
        });
        onEditMessage({
          editedMessage,
          channelId,
          messageId,
          isSubject: messageIsSubject,
          subchannelId,
          subjectChanged
        });
        socket.emit('edit_chat_message', {
          channelId,
          editedMessage,
          subchannelId,
          messageId,
          isSubject: messageIsSubject
        });
        onSetIsEditing({
          contentId: messageId,
          contentType: 'chat',
          isEditing: false
        });
        Promise.resolve();
      } catch (error) {
        console.error(error);
        return Promise.reject(error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId, isReloadedSubject, isSubject, messageId, subjectId]
  );

  const handleAddReaction = useCallback(
    async (reaction) => {
      if (message.reactions) {
        for (const reactionObj of message.reactions) {
          if (reactionObj.type === reaction && reactionObj.userId === myId) {
            return;
          }
        }
      }
      onAddReactionToMessage({
        channelId,
        messageId,
        subchannelId,
        reaction,
        userId: myId
      });
      postChatReaction({ messageId, reaction });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId, message?.reactions, messageId, myId]
  );

  const handleRemoveReaction = useCallback(
    async (reaction) => {
      onRemoveReactionFromMessage({
        channelId,
        messageId,
        reaction,
        subchannelId,
        userId: myId
      });
      removeChatReaction({ messageId, reaction });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId, messageId, myId]
  );

  if (transferDetails) {
    return (
      <TransferMessage
        myId={myId}
        myUsername={myUsername}
        partner={partner}
        transferDetails={transferDetails}
        onSetAICardModalCardId={onSetAICardModalCardId}
      />
    );
  }

  if (transactionDetails) {
    return (
      <div>
        this is for transaction
        {(transactionDetails?.id, transactionDetails.offer.coins)}
      </div>
    );
  }

  if (!chessState && (gameWinnerId || isDraw || isAbort)) {
    return (
      <GameOverMessage
        winnerId={gameWinnerId}
        opponentName={partner?.username}
        myId={myId}
        isAbort={!!isAbort}
        isResign={!!isResign}
        isDraw={!!isDraw}
      />
    );
  }

  if (wordleResult) {
    return (
      <WordleResult
        myId={myId}
        messageId={message.id}
        userId={userId}
        username={username}
        wordleResult={wordleResult}
        onReplyClick={onReplyClick}
        channelId={currentChannel.id}
        timeStamp={timeStamp}
      />
    );
  }

  return (
    <ErrorBoundary componentPath="Chat/Message/index">
      <div
        ref={ComponentRef}
        className={css`
          ${highlighted ? `background-color: ${Color.whiteGray()};` : ''}
          .menu-button {
            display: ${highlighted ? 'block' : 'none'};
          }
          &:hover {
            ${menuButtonsShown ? `background-color: ${Color.whiteGray()};` : ''}
            .menu-button {
              display: block;
            }
          }
          @media (max-width: ${mobileMaxWidth}) {
            background-color: #fff;
            .menu-button {
              display: block;
            }
            &:hover {
              background-color: #fff;
            }
          }
        `}
        style={{
          width: '100%',
          display: 'block',
          zIndex
        }}
      >
        {contentShown ? (
          <div ref={PanelRef} className={MessageStyle.container}>
            <div className={MessageStyle.profilePic}>
              <ProfilePic
                style={{ width: '100%' }}
                userId={userId}
                profilePicUrl={profilePicUrl}
              />
            </div>
            <div
              className={css`
                width: CALC(100% - 5vw - 3rem);
                display: flex;
                flex-direction: column;
                margin-left: 2rem;
                position: relative;
                white-space: pre-wrap;
                overflow-wrap: break-word;
                word-break: break-word;
                @media (max-width: ${mobileMaxWidth}) {
                  margin-left: 1rem;
                }
              `}
            >
              <div>
                <UsernameText
                  className={css`
                    font-size: 1.8rem;
                    line-height: 1;
                    @media (max-width: ${mobileMaxWidth}) {
                      font-size: 1.6rem;
                    }
                  `}
                  user={{
                    id: userId,
                    username
                  }}
                />{' '}
                <span className={MessageStyle.timeStamp}>
                  {displayedTimeStamp}
                </span>
              </div>
              <div>
                {invitePath ? (
                  <Invitation
                    sender={{ id: userId, username }}
                    channelId={channelId}
                    invitationChannelId={invitationChannelId}
                    invitePath={invitePath}
                    messageId={messageId}
                    onAcceptGroupInvitation={onAcceptGroupInvitation}
                  />
                ) : isDrawOffer ? (
                  <DrawOffer
                    myId={myId}
                    userId={userId}
                    username={username}
                    onClick={onChessBoardClick}
                  />
                ) : isChessMsg ? (
                  <Chess
                    loaded
                    moveViewed={!!moveViewTimeStamp}
                    channelId={channelId}
                    countdownNumber={chessCountdownNumber}
                    gameWinnerId={gameWinnerId}
                    spoilerOff={spoilerOff}
                    messageId={messageId}
                    myId={myId}
                    initialState={chessState}
                    lastChessMessageId={currentChannel.lastChessMessageId}
                    onBoardClick={onChessBoardClick}
                    onRewindClick={() =>
                      onRequestRewind({
                        ...(chessState.previousState || chessState),
                        isDiscussion: true,
                        isRewindRequest: true
                      })
                    }
                    onDiscussClick={() =>
                      onSetChessTarget({ chessState, messageId, channelId })
                    }
                    onSpoilerClick={handleChessSpoilerClick}
                    opponentId={partner?.id}
                    opponentName={partner?.username}
                    senderId={userId}
                    style={{ marginTop: '1rem', width: '100%' }}
                  />
                ) : fileToUpload && !loading ? (
                  <FileUploadStatusIndicator
                    key={channelId}
                    theme={displayedThemeColor}
                    fileName={fileToUpload.name}
                    uploadProgress={uploadStatus.uploadProgress}
                  />
                ) : (
                  <>
                    {isChessDiscussion && (
                      <TargetChessPosition
                        chessState={chessState}
                        channelId={channelId}
                        messageId={messageId}
                        myId={myId}
                        userId={userId}
                        username={username}
                        gameState={currentChannel?.gameState?.chess || {}}
                        lastChessMessageId={currentChannel.lastChessMessageId}
                        onCancelRewindRequest={onCancelRewindRequest}
                        onAcceptRewind={onAcceptRewind}
                        onDeclineRewind={onDeclineRewind}
                        onRequestRewind={onRequestRewind}
                      />
                    )}
                    {targetSubject && <TargetSubject subject={targetSubject} />}
                    {targetMessage && <TargetMessage message={targetMessage} />}
                    {filePath && fileName && (
                      <FileAttachment
                        fileName={fileName}
                        filePath={filePath}
                        fileSize={fileSize}
                        messageId={messageId}
                        theme={displayedThemeColor}
                        thumbUrl={thumbUrl || recentThumbUrl}
                      />
                    )}
                    {rewardAmount ? (
                      <RewardMessage
                        rewardAmount={rewardAmount}
                        rewardReason={rewardReason}
                      />
                    ) : (
                      <TextMessage
                        attachmentHidden={!!attachmentHidden}
                        channelId={channelId}
                        content={content}
                        displayedThemeColor={displayedThemeColor}
                        extractedUrl={extractedUrl}
                        forceRefreshForMobile={forceRefreshForMobile}
                        myId={myId}
                        messageId={messageId}
                        numMsgs={numMsgs}
                        isNotification={isNotification}
                        isSubject={!!isSubject}
                        isReloadedSubject={!!isReloadedSubject}
                        MessageStyle={MessageStyle}
                        isEditing={isEditing}
                        onEditCancel={handleEditCancel}
                        onEditDone={handleEditDone}
                        onShowSubjectMsgsModal={onShowSubjectMsgsModal}
                        socketConnected={socketConnected}
                        subchannelId={subchannelId}
                        subjectId={subjectId}
                        thumbUrl={thumbUrl}
                        targetMessage={targetMessage}
                        userCanEditThis={userCanEditThis}
                      />
                    )}
                    {!isEditing && !isNotification && (
                      <div style={{ marginTop: '1rem', height: '2.5rem' }}>
                        {menuButtonsShown && (
                          <Reactions
                            reactions={message.reactions}
                            reactionsMenuShown={reactionsMenuShown}
                            onRemoveReaction={handleRemoveReaction}
                            onAddReaction={handleAddReaction}
                            theme={displayedThemeColor}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              {menuButtonsShown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    display: 'flex'
                  }}
                >
                  {!invitePath && !isDrawOffer && !isChessMsg && !isBanned && (
                    <ReactionButton
                      onReactionClick={handleAddReaction}
                      reactionsMenuShown={reactionsMenuShown}
                      onSetReactionsMenuShown={setReactionsMenuShown}
                      style={{
                        marginRight: dropdownButtonShown ? '0.5rem' : 0
                      }}
                    />
                  )}
                  {dropdownButtonShown && (
                    <DropdownButton
                      skeuomorphic
                      buttonStyle={{
                        fontSize: '1rem',
                        lineHeight: 1
                      }}
                      className="menu-button"
                      innerRef={DropdownButtonRef}
                      color="darkerGray"
                      icon={deviceIsMobile ? 'chevron-down' : 'ellipsis-h'}
                      opacity={0.5}
                      menuProps={dropdownMenuItems}
                      onDropdownShown={setHighlighted}
                    />
                  )}
                </div>
              )}
            </div>
            {messageRewardModalShown && (
              <MessageRewardModal
                userToReward={{
                  username,
                  id: userId
                }}
                onSubmit={handleRewardMessageSubmit}
                onHide={() => setMessageRewardModalShown(false)}
              />
            )}
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              height: placeholderHeight
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(Message);
