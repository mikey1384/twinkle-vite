import 'regenerator-runtime/runtime'; // for async await
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Chat from '~/containers/Chat';
import ContentPage from '~/containers/ContentPage';
import Explore from '~/containers/Explore';
import Header from './Header';
import Home from '~/containers/Home';
import Button from '~/components/Button';
import LinkPage from '~/containers/LinkPage';
import PlaylistPage from '~/containers/PlaylistPage';
import Privacy from '~/containers/Privacy';
import Redirect from '~/containers/Redirect';
import MissionPage from '~/containers/MissionPage';
import Mission from '~/containers/Mission';
import SigninModal from '~/containers/Signin';
import Management from '~/containers/Management';
import MobileMenu from './MobileMenu';
import Profile from '~/containers/Profile';
import ResetPassword from '~/containers/ResetPassword';
import Verify from '~/containers/Verify';
import VideoPage from '~/containers/VideoPage';
import Incoming from '~/components/Stream/Incoming';
import Outgoing from '~/components/Stream/Outgoing';
import InvalidPage from '~/components/InvalidPage';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useLocation, Routes, Route } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { Global } from '@emotion/react';
import { socket } from '~/constants/io';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { finalizeEmoji } from '~/helpers/stringHelpers';
import { useMyState, useTheme, useScrollPosition } from '~/helpers/hooks';
import {
  isMobile,
  getSectionFromPathname,
  returnImageFileFromUrl
} from '~/helpers';
import { v1 as uuidv1 } from 'uuid';
import {
  useAppContext,
  useHomeContext,
  useInputContext,
  useViewContext,
  useNotiContext,
  useChatContext,
  KeyContext
} from '~/contexts';

const deviceIsMobile = isMobile(navigator);
const userIsUsingIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

function App() {
  const location = useLocation();
  const onCloseSigninModal = useAppContext(
    (v) => v.user.actions.onCloseSigninModal
  );
  const onInitMyState = useAppContext((v) => v.user.actions.onInitMyState);
  const onSetEarnSection = useHomeContext((v) => v.actions.onSetEarnSection);
  const onLogout = useAppContext((v) => v.user.actions.onLogout);
  const onSetSessionLoaded = useAppContext(
    (v) => v.user.actions.onSetSessionLoaded
  );
  const auth = useAppContext((v) => v.requestHelpers.auth);
  const loadMyData = useAppContext((v) => v.requestHelpers.loadMyData);
  const loadRankings = useAppContext((v) => v.requestHelpers.loadRankings);
  const recordUserTraffic = useAppContext(
    (v) => v.requestHelpers.recordUserTraffic
  );
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const uploadContent = useAppContext((v) => v.requestHelpers.uploadContent);
  const uploadFileOnChat = useAppContext(
    (v) => v.requestHelpers.uploadFileOnChat
  );
  const saveChatMessageWithFileAttachment = useAppContext(
    (v) => v.requestHelpers.saveChatMessageWithFileAttachment
  );
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const myState = useMyState();
  const theme = useTheme(myState.profileTheme);
  const {
    background: { color: backgroundColor }
  } = theme;
  const {
    authLevel,
    profilePicUrl,
    signinModalShown,
    twinkleXP,
    userId,
    username
  } = myState;

  const prevUserId = useRef(userId);
  const channelOnCall = useChatContext((v) => v.state.channelOnCall);
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const currentChannelName = useChatContext((v) => v.state.currentChannelName);
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);
  const onDisplayAttachedFile = useChatContext(
    (v) => v.actions.onDisplayAttachedFile
  );
  const onSetReplyTarget = useChatContext((v) => v.actions.onSetReplyTarget);
  const onPostFileUploadStatus = useChatContext(
    (v) => v.actions.onPostFileUploadStatus
  );
  const onPostUploadComplete = useChatContext(
    (v) => v.actions.onPostUploadComplete
  );
  const onResetChat = useChatContext((v) => v.actions.onResetChat);
  const onSendFirstDirectMessage = useChatContext(
    (v) => v.actions.onSendFirstDirectMessage
  );
  const onUpdateChannelPathIdHash = useChatContext(
    (v) => v.actions.onUpdateChannelPathIdHash
  );
  const onUpdateChatUploadProgress = useChatContext(
    (v) => v.actions.onUpdateChatUploadProgress
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onLoadNewFeeds = useHomeContext((v) => v.actions.onLoadNewFeeds);
  const onSetSubmittingSubject = useHomeContext(
    (v) => v.actions.onSetSubmittingSubject
  );
  const onUpdateFileUploadProgress = useHomeContext(
    (v) => v.actions.onUpdateFileUploadProgress
  );
  const onUpdateSecretAttachmentUploadProgress = useHomeContext(
    (v) => v.actions.onUpdateSecretAttachmentUploadProgress
  );
  const onClearFileUploadProgress = useHomeContext(
    (v) => v.actions.onClearFileUploadProgress
  );
  const onSetUploadingFile = useHomeContext(
    (v) => v.actions.onSetUploadingFile
  );
  const updateDetail = useNotiContext((v) => v.state.updateDetail);
  const updateNoticeShown = useNotiContext((v) => v.state.updateNoticeShown);
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const onGetRanks = useNotiContext((v) => v.actions.onGetRanks);
  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const scrollPositions = useViewContext((v) => v.state.scrollPositions);
  const onChangePageVisibility = useViewContext(
    (v) => v.actions.onChangePageVisibility
  );
  const onRecordScrollPosition = useViewContext(
    (v) => v.actions.onRecordScrollPosition
  );
  const onResetSubjectInput = useInputContext(
    (v) => v.actions.onResetSubjectInput
  );
  const [mobileMenuShown, setMobileMenuShown] = useState(false);
  const currentChannel = useMemo(
    () => channelsObj[selectedChannelId] || {},
    [channelsObj, selectedChannelId]
  );
  const visibilityChangeRef = useRef(null);
  const hiddenRef = useRef(null);
  const authRef = useRef(null);
  const prevTwinkleXP = useRef(twinkleXP);
  const usingChat = useMemo(
    () => getSectionFromPathname(location?.pathname)?.section === 'chat',
    [location?.pathname]
  );

  useScrollPosition({
    onRecordScrollPosition,
    pathname: location.pathname,
    scrollPositions,
    isMobile: deviceIsMobile
  });

  useEffect(() => {
    if (
      typeof twinkleXP === 'number' &&
      twinkleXP > (prevTwinkleXP.current || 0)
    ) {
      handleLoadRankings();
    }
    prevTwinkleXP.current = twinkleXP;

    async function handleLoadRankings() {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twinkleXP]);

  useEffect(() => {
    if (!auth()?.headers?.authorization && !signinModalShown) {
      onLogout();
      onResetChat();
      onSetSessionLoaded();
    } else {
      if (
        authRef.current?.headers?.authorization !==
        auth()?.headers?.authorization
      ) {
        init();
      } else {
        onSetSessionLoaded();
      }
    }
    authRef.current = auth();
    async function init() {
      await recordUserTraffic(location.pathname);
      if (authRef.current?.headers?.authorization) {
        const data = await loadMyData(location.pathname);
        onSetUserState({
          userId: data.userId,
          newState: { ...data, loaded: true }
        });
        if (data?.userId) onInitMyState(data);
      }
      onSetSessionLoaded();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, location.pathname, pageVisible, signinModalShown]);

  useEffect(() => {
    window.ga('send', 'pageview', location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (typeof document.hidden !== 'undefined') {
      hiddenRef.current = 'hidden';
      visibilityChangeRef.current = 'visibilitychange';
    } else if (typeof document.msHidden !== 'undefined') {
      hiddenRef.current = 'msHidden';
      visibilityChangeRef.current = 'msvisibilitychange';
    } else if (typeof document.webkitHidden !== 'undefined') {
      hiddenRef.current = 'webkitHidden';
      visibilityChangeRef.current = 'webkitvisibilitychange';
    }
    addEvent(document, visibilityChangeRef.current, handleVisibilityChange);
    function handleVisibilityChange() {
      const visible = !document[hiddenRef.current];
      socket.emit('change_away_status', visible);
      onChangePageVisibility(visible);
    }
    return function cleanUp() {
      removeEvent(
        document,
        visibilityChangeRef.current,
        handleVisibilityChange
      );
    };
  });

  const outgoingShown = useMemo(() => {
    return channelOnCall.imCalling || channelOnCall.outgoingShown;
  }, [channelOnCall.imCalling, channelOnCall.outgoingShown]);

  useEffect(() => {
    prevUserId.current = userId;
    onSetEarnSection('start');
    onSetSubmittingSubject(false);
    onClearFileUploadProgress();
    onSetUploadingFile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleFileUploadOnChat = useCallback(
    async ({
      channelId,
      content,
      fileName,
      filePath,
      fileToUpload,
      recepientId,
      messageId: tempMessageId,
      targetMessageId,
      subchannelId,
      subjectId,
      thumbnail
    }) => {
      if (channelId === 0 && !recepientId) {
        reportError({
          componentPath: 'App/index',
          message: `handleFileUploadOnChat: User is trying to send the first file message to someone but recepient ID is missing`
        });
        return window.location.reload();
      }
      const promises = [];
      onPostFileUploadStatus({
        channelId,
        content,
        fileName,
        filePath,
        fileToUpload,
        recepientId,
        subchannelId
      });
      promises.push(
        uploadFileOnChat({
          fileName,
          selectedFile: fileToUpload,
          onUploadProgress: handleUploadProgress,
          path: filePath
        })
      );
      if (thumbnail) {
        promises.push(
          (async () => {
            const file = returnImageFileFromUrl({ imageUrl: thumbnail });
            const thumbUrl = await uploadThumb({
              file,
              path: uuidv1()
            });
            return Promise.resolve(thumbUrl);
          })()
        );
      }
      let thumbUrl = '';
      const result = await Promise.all(promises);
      const userChanged = checkUserChange(userId);
      if (userChanged) {
        return;
      }
      if (thumbnail) {
        thumbUrl = result[result.length - 1];
      }
      const { channel, message, messageId, alreadyExists } =
        await saveChatMessageWithFileAttachment({
          channelId,
          content,
          fileName,
          fileSize: fileToUpload.size,
          path: filePath,
          recepientId,
          targetMessageId,
          thumbUrl,
          subchannelId,
          subjectId
        });
      if (alreadyExists) {
        return window.location.reload();
      }
      onPostUploadComplete({
        path: filePath,
        channelId,
        tempMessageId,
        messageId: messageId,
        subchannelId,
        result: !!messageId
      });
      const params = {
        content,
        fileName,
        filePath,
        fileSize: fileToUpload.size,
        id: messageId,
        subchannelId,
        uploaderAuthLevel: authLevel,
        channelId,
        userId,
        username,
        profilePicUrl,
        subchannelId,
        thumbUrl,
        targetMessage: currentChannel.replyTarget
      };
      onDisplayAttachedFile(params);
      if (channelId) {
        const channelData = {
          id: channelId,
          channelName: currentChannelName,
          members: currentChannel.members,
          twoPeople: currentChannel.twoPeople,
          pathId: currentChannel.pathId
        };
        socket.emit('new_chat_message', {
          message: { ...params, isNewMessage: true },
          channel: channelData
        });
      }
      onSetReplyTarget({ channelId, target: null });
      if (channel) {
        onUpdateChannelPathIdHash({
          channelId: channel.id,
          pathId: channel.pathId
        });
        onSendFirstDirectMessage({ channel, message });
        socket.emit('join_chat_group', message.channelId);
        socket.emit('send_bi_chat_invitation', {
          userId: recepientId,
          members: currentChannel.members,
          pathId: channel.pathId,
          message
        });
      }
      function handleUploadProgress({ loaded, total }) {
        const userChanged = checkUserChange(userId);
        if (userChanged) {
          return;
        }
        onUpdateChatUploadProgress({
          channelId,
          subchannelId,
          path: filePath,
          progress: loaded / total
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      authLevel,
      currentChannel,
      currentChannelName,
      profilePicUrl,
      currentChannel.replyTarget,
      userId,
      username
    ]
  );

  const handleFileUploadOnHome = useCallback(
    async ({
      attachment,
      byUser,
      description,
      filePath,
      hasSecretAnswer,
      rewardLevel,
      secretAnswer,
      secretAttachment,
      title
    }) => {
      const { file, thumbnail, contentType } = attachment ?? {};
      try {
        const promises = [];
        const secretAttachmentFilePath = uuidv1();
        if (contentType === 'file') {
          promises.push(
            uploadFile({
              filePath,
              file,
              onUploadProgress: handleUploadProgress
            })
          );
        }
        if (hasSecretAnswer && secretAttachment) {
          promises.push(
            uploadFile({
              filePath: secretAttachmentFilePath,
              file: secretAttachment?.file,
              onUploadProgress: handleSecretAttachmentUploadProgress
            })
          );
        }
        let thumbUrl = '';
        let secretThumbUrl = '';
        if (thumbnail) {
          promises.push(
            (async () => {
              const file = returnImageFileFromUrl({ imageUrl: thumbnail });
              const thumbUrl = await uploadThumb({
                file,
                path: uuidv1()
              });
              return Promise.resolve(thumbUrl);
            })()
          );
        }
        if (secretAttachment?.thumbnail) {
          promises.push(
            (async () => {
              const file = returnImageFileFromUrl({
                imageUrl: secretAttachment?.thumbnail
              });
              const thumbUrl = await uploadThumb({
                file,
                path: uuidv1()
              });
              return Promise.resolve(thumbUrl);
            })()
          );
        }
        const result = await Promise.all(promises);
        const userChanged = checkUserChange(userId);
        if (userChanged) {
          return;
        }
        if (thumbnail) {
          const numberToDeduct = secretAttachment?.thumbnail ? 2 : 1;
          thumbUrl = result[result.length - numberToDeduct];
        }
        if (secretAttachment?.thumbnail) {
          secretThumbUrl = result[result.length - 1];
        }
        const data = await uploadContent({
          title,
          byUser,
          description: finalizeEmoji(description),
          secretAnswer: hasSecretAnswer ? secretAnswer : '',
          rewardLevel,
          thumbUrl,
          secretAttachmentThumbUrl: secretThumbUrl,
          ...(hasSecretAnswer && secretAttachment
            ? {
                secretAttachmentFilePath,
                secretAttachmentFileName: secretAttachment.file.name,
                secretAttachmentFileSize: secretAttachment.file.size
              }
            : {}),
          ...(contentType === 'file'
            ? { filePath, fileName: file.name, fileSize: file.size }
            : {}),
          ...(attachment && contentType !== 'file'
            ? { rootId: attachment.id, rootType: contentType }
            : {})
        });
        if (data) {
          onLoadNewFeeds([data]);
        }
        onResetSubjectInput();
        onSetSubmittingSubject(false);
        onClearFileUploadProgress();
        onSetUploadingFile(false);
      } catch (error) {
        console.error(error);
      }
      function handleSecretAttachmentUploadProgress({ loaded, total }) {
        onUpdateSecretAttachmentUploadProgress(loaded / total);
      }
      function handleUploadProgress({ loaded, total }) {
        const userChanged = checkUserChange(userId);
        if (userChanged) {
          return;
        }
        onUpdateFileUploadProgress(loaded / total);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  function checkUserChange(userId) {
    return userId !== prevUserId.current;
  }

  return (
    <ErrorBoundary
      componentPath="App/index"
      className={css`
        height: CALC(100% - 4.5rem);
        width: 100%;
        @media (max-width: ${mobileMaxWidth}) {
          height: 100%;
        }
      `}
    >
      <KeyContext.Provider
        value={{
          myState,
          theme,
          helpers: { checkUserChange }
        }}
      >
        {mobileMenuShown && (
          <MobileMenu
            username={username}
            onClose={() => setMobileMenuShown(false)}
          />
        )}
        {updateNoticeShown && (
          <div
            className={css`
              position: fixed;
              width: 80%;
              left: 10%;
              top: 2rem;
              z-index: ${100_000};
              background: ${Color.blue()};
              color: #fff;
              padding: 1rem;
              text-align: center;
              font-size: 2rem;
              display: flex;
              flex-direction: column;
              justify-content: center;
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
                left: 0;
              }
            `}
          >
            <p>
              The website has been updated. Click the button below to apply the
              update.
            </p>
            <p style={{ fontSize: '1.3em' }}>
              {
                "Warning: Update is mandatory. Some features will not work properly if you don't update!"
              }
            </p>
            {updateDetail && (
              <p style={{ color: Color.gold() }}>{updateDetail}</p>
            )}
            <Button
              color="gold"
              filled
              style={{
                marginTop: '3rem',
                fontSize: '3rem',
                minWidth: '20%',
                alignSelf: 'center'
              }}
              onClick={() => window.location.reload()}
            >
              Update!
            </Button>
          </div>
        )}
        <Header onMobileMenuOpen={() => setMobileMenuShown(true)} />
        <div
          id="App"
          className={`${userIsUsingIOS && !usingChat ? 'ios ' : ''}${css`
            margin-top: 4.5rem;
            height: 100%;
            @media (max-width: ${mobileMaxWidth}) {
              margin-top: 0;
              padding-top: 0;
            }
          `}`}
        >
          <Routes>
            <Route path="/users/:username/*" element={<Profile />} />
            <Route path="/comments/:contentId" element={<ContentPage />} />
            <Route path="/videos/:videoId" element={<VideoPage />} />
            <Route path="/links/:linkId" element={<LinkPage />} />
            <Route path="/subjects/:contentId" element={<ContentPage />} />
            <Route path="/videos" element={<Explore category="videos" />} />
            <Route path="/links" element={<Explore category="links" />} />
            <Route path="/subjects" element={<Explore category="subjects" />} />
            <Route path="/playlists/*" element={<PlaylistPage />} />
            <Route path="/missions/:missionType/*" element={<MissionPage />} />
            <Route path="/missions" element={<Mission />} />
            <Route
              path="/chat/:currentPathId/*"
              element={<Chat onFileUpload={handleFileUploadOnChat} />}
            />
            <Route
              path="/chat"
              element={<Chat onFileUpload={handleFileUploadOnChat} />}
            />
            <Route path="/management/*" element={<Management />} />
            <Route path="/reset/*" element={<ResetPassword />} />
            <Route path="/verify/*" element={<Verify />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/users" element={<Home section="people" />} />
            <Route path="/store" element={<Home section="store" />} />
            <Route path="/earn" element={<Home section="earn" />} />
            <Route
              path="/"
              element={
                <Home section="story" onFileUpload={handleFileUploadOnHome} />
              }
            />
            <Route path="/:username/*" element={<Redirect />} />
            <Route path="*" element={<InvalidPage />} />
          </Routes>
        </div>
        {signinModalShown && <SigninModal show onHide={onCloseSigninModal} />}
        {channelOnCall.incomingShown && <Incoming />}
        {outgoingShown && <Outgoing />}
        <div
          className={css`
            opacity: 0;
            position: fixed;
            background: url('/img/emojis.png');
          `}
        />
      </KeyContext.Provider>
      <Global
        styles={{
          body: {
            background: Color[backgroundColor]()
          }
        }}
      />
    </ErrorBoundary>
  );
}

export default memo(App);
