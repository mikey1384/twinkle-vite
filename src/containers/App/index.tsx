import 'regenerator-runtime/runtime'; // for async await
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
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
import Incoming from './Stream/Incoming';
import Outgoing from './Stream/Outgoing';
import InvalidPage from '~/components/InvalidPage';
import DailyRewardModal from '~/components/Modals/DailyRewardModal';
import DailyBonusModal from '~/components/Modals/DailyBonusModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  localStorageKeys,
  DEFAULT_PROFILE_THEME
} from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { Global } from '@emotion/react';
import { socket } from '~/constants/sockets/api';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { finalizeEmoji, generateFileName } from '~/helpers/stringHelpers';
import { useMyState, useScrollPosition } from '~/helpers/hooks';
import {
  getSectionFromPathname,
  isMobile,
  returnTheme,
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

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const onCloseSigninModal = useAppContext(
    (v) => v.user.actions.onCloseSigninModal
  );
  const onSetAchievementsObj = useAppContext(
    (v) => v.user.actions.onSetAchievementsObj
  );
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const onInitMyState = useAppContext((v) => v.user.actions.onInitMyState);
  const onSetTopMenuSectionSection = useHomeContext(
    (v) => v.actions.onSetTopMenuSectionSection
  );
  const onLogout = useAppContext((v) => v.user.actions.onLogout);
  const onSetSessionLoaded = useAppContext(
    (v) => v.user.actions.onSetSessionLoaded
  );
  const auth = useAppContext((v) => v.requestHelpers.auth);
  const loadMyData = useAppContext((v) => v.requestHelpers.loadMyData);
  const loadAllAchievements = useAppContext(
    (v) => v.requestHelpers.loadAllAchievements
  );
  const fetchTodayStats = useAppContext(
    (v) => v.requestHelpers.fetchTodayStats
  );
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
  const theme = useMemo(
    () => returnTheme(myState.profileTheme || DEFAULT_PROFILE_THEME),
    [myState.profileTheme]
  );
  const {
    background: { color: backgroundColor }
  } = theme;
  const {
    level,
    profilePicUrl,
    signinModalShown,
    twinkleCoins,
    twinkleXP,
    userId,
    username
  } = myState;

  const prevUserId = useRef(userId);
  const channelOnCall = useChatContext((v) => v.state.channelOnCall);
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const onDisplayAttachedFile = useChatContext(
    (v) => v.actions.onDisplayAttachedFile
  );
  const onSetChessTarget = useChatContext((v) => v.actions.onSetChessTarget);
  const onSetReplyTarget = useChatContext((v) => v.actions.onSetReplyTarget);
  const onPostFileUploadStatus = useChatContext(
    (v) => v.actions.onPostFileUploadStatus
  );
  const onPostUploadComplete = useChatContext(
    (v) => v.actions.onPostUploadComplete
  );
  const onResetChat = useChatContext((v) => v.actions.onResetChat);
  const onCreateNewDMChannel = useChatContext(
    (v) => v.actions.onCreateNewDMChannel
  );
  const onUpdateChannelPathIdHash = useChatContext(
    (v) => v.actions.onUpdateChannelPathIdHash
  );
  const onUpdateChatUploadProgress = useChatContext(
    (v) => v.actions.onUpdateChatUploadProgress
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onLoadNewFeeds = useHomeContext((v) => v.actions.onLoadNewFeeds);
  const onSetInputModalShown = useHomeContext(
    (v) => v.actions.onSetInputModalShown
  );
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
  const getCurrentNextDayTimeStamp = useAppContext(
    (v) => v.requestHelpers.getCurrentNextDayTimeStamp
  );
  const onSetDailyRewardModalShown = useNotiContext(
    (v) => v.actions.onSetDailyRewardModalShown
  );
  const dailyRewardModalShown = useNotiContext(
    (v) => v.state.dailyRewardModalShown
  );
  const onSetDailyBonusModalShown = useNotiContext(
    (v) => v.actions.onSetDailyBonusModalShown
  );
  const dailyBonusModalShown = useNotiContext(
    (v) => v.state.dailyBonusModalShown
  );
  const updateNoticeShown = useNotiContext((v) => v.state.updateNoticeShown);
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const onGetRanks = useNotiContext((v) => v.actions.onGetRanks);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const onChangePageVisibility = useViewContext(
    (v) => v.actions.onChangePageVisibility
  );
  const onResetSubjectInput = useInputContext(
    (v) => v.actions.onResetSubjectInput
  );
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [mobileMenuShown, setMobileMenuShown] = useState(false);
  const visibilityChangeRef: React.MutableRefObject<any> = useRef(null);
  const hiddenRef: React.MutableRefObject<any> = useRef(null);
  const authRef: React.MutableRefObject<any> = useRef(null);
  const usingChat = useMemo(
    () => getSectionFromPathname(location?.pathname)?.section === 'chat',
    [location?.pathname]
  );

  useScrollPosition({
    pathname: location.pathname,
    isMobile: deviceIsMobile
  });

  useEffect(() => {
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search + location.hash,
      page_search: location.search,
      page_hash: location.hash
    });
  }, [location]);

  useEffect(() => {
    handleLoadRankings();
    async function handleLoadRankings() {
      setLoadingRankings(true);
      try {
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
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingRankings(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twinkleXP]);

  useEffect(() => {
    if (userId) {
      handleLoadTodayStats();
    }
    async function handleLoadTodayStats() {
      const {
        achievedDailyGoals,
        aiCallDuration,
        dailyHasBonus,
        dailyBonusAttempted,
        dailyRewardResultViewed,
        xpEarned,
        coinsEarned,
        nextMission,
        standardTimeStamp,
        nextDayTimeStamp
      } = await fetchTodayStats();
      let timeDifference = 0;
      if (standardTimeStamp) {
        timeDifference = new Date(standardTimeStamp).getTime() - Date.now();
      }
      onUpdateTodayStats({
        newStats: {
          achievedDailyGoals,
          aiCallDuration,
          dailyHasBonus,
          dailyBonusAttempted,
          dailyRewardResultViewed,
          xpEarned,
          coinsEarned,
          nextDayTimeStamp,
          nextMission,
          standardTimeStamp,
          timeDifference
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twinkleXP, twinkleCoins, userId]);

  useEffect(() => {
    if (!achievementsObj || Object.keys(achievementsObj).length === 0) {
      initAchievements();
    }
    if (!auth()?.headers?.authorization && !signinModalShown) {
      onLogout();
      socket.emit('ai_end_ai_voice_conversation');
      onResetChat(userId);
      onSetSessionLoaded();
    } else {
      if (
        auth()?.headers?.authorization ===
        authRef.current?.headers?.authorization
      ) {
        onSetSessionLoaded();
      } else if (authRef.current?.headers?.authorization) {
        handleInit();
      }
      authRef.current = auth();
    }
    async function initAchievements() {
      const data = await loadAllAchievements();
      onSetAchievementsObj(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, location.pathname, pageVisible, signinModalShown, userId]);

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
      const visible = !document[hiddenRef.current as keyof Document];
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
    onSetTopMenuSectionSection('start');
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
      recipientId,
      recipientUsername,
      messageId: tempMessageId,
      targetMessageId,
      subchannelId,
      topicId,
      thumbnail,
      isCielChat,
      isZeroChat
    }: {
      channelId: number;
      content: string;
      fileName: string;
      filePath: string;
      fileToUpload: File;
      recipientId: number;
      recipientUsername?: string;
      messageId: number;
      targetMessageId: number;
      subchannelId: number;
      topicId: number;
      thumbnail: string;
      isCielChat: boolean;
      isZeroChat: boolean;
    }) => {
      const appliedFileName = generateFileName(fileName);
      const currentChannel = channelsObj[channelId];
      if (channelId === 0 && !recipientId) {
        reportError({
          componentPath: 'App/index',
          message: `handleFileUploadOnChat: User is trying to send the first file message to someone but recipient ID is missing`
        });
        return window.location.reload();
      }
      onSetChessTarget({ channelId, target: null });
      onSetReplyTarget({ channelId, subchannelId, target: null });

      onPostFileUploadStatus({
        channelId,
        content,
        fileName: appliedFileName,
        filePath,
        fileToUpload,
        recipientId,
        subchannelId
      });

      await uploadFileOnChat({
        fileName: appliedFileName,
        selectedFile: fileToUpload,
        onUploadProgress: handleUploadProgress,
        path: filePath
      });

      let thumbUrl = '';
      if (thumbnail) {
        try {
          const file = returnImageFileFromUrl({ imageUrl: thumbnail });
          thumbUrl = await uploadThumb({
            file,
            path: uuidv1()
          });
        } catch (error) {
          console.error('Thumbnail upload failed:', error);
        }
      }

      const userChanged = checkUserChange(userId);
      if (userChanged) {
        return;
      }

      const { channel, message, messageId, alreadyExists, netCoins } =
        await saveChatMessageWithFileAttachment({
          channelId,
          content,
          fileName,
          fileSize: fileToUpload.size,
          path: filePath,
          recipientId,
          targetMessageId,
          chessState: currentChannel.chessTarget,
          thumbUrl,
          subchannelId,
          topicId,
          isCielChat,
          isZeroChat,
          aiThinkingLevel: currentChannel.aiThinkingLevel
        });
      if (alreadyExists) {
        return window.location.reload();
      }
      if (currentChannel.aiThinkingLevel > 0) {
        onSetUserState({
          userId,
          newState: { twinkleCoins: netCoins }
        });
      }
      onPostUploadComplete({
        path: filePath,
        channelId,
        tempMessageId,
        messageId: messageId,
        subchannelId,
        result: !!messageId,
        topicId
      });
      const params = {
        content,
        fileName,
        filePath,
        fileSize: fileToUpload.size,
        id: messageId,
        uploaderLevel: level,
        channelId,
        userId,
        username,
        profilePicUrl,
        subjectId: topicId,
        subchannelId,
        thumbUrl,
        chessState: currentChannel.chessTarget,
        targetMessage: currentChannel.replyTarget,
        ...(topicId ? { targetSubject: currentChannel.topicObj[topicId] } : {})
      };
      onDisplayAttachedFile(params);
      if (channelId) {
        const channelData = {
          id: channelId,
          channelName: recipientUsername || currentChannel.channelName,
          members: currentChannel.members,
          twoPeople: currentChannel.twoPeople,
          pathId: currentChannel.pathId
        };
        socket.emit('new_chat_message', {
          message: { ...params, isNewMessage: true },
          channel: channelData
        });
      }
      if (channel) {
        onUpdateChannelPathIdHash({
          channelId: channel.id,
          pathId: channel.pathId
        });
        onCreateNewDMChannel({ channel, message });
        socket.emit('join_chat_group', message.channelId);
        socket.emit('send_bi_chat_invitation', {
          userId: recipientId,
          members: currentChannel.members,
          pathId: channel.pathId,
          message
        });
        navigate(`/chat/${channel.pathId}`, { replace: true });
      }
      function handleUploadProgress({
        loaded,
        total
      }: {
        loaded: number;
        total: number;
      }) {
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
    [channelsObj, userId, level, username, profilePicUrl, navigate]
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
    }: {
      attachment: any;
      byUser: any;
      description: string;
      filePath: string;
      hasSecretAnswer: boolean;
      rewardLevel: number;
      secretAnswer: string;
      secretAttachment: any;
      title: string;
    }) => {
      const { file, thumbnail, contentType } = attachment ?? {};
      const appliedFileName = generateFileName(attachment?.file?.name || '');
      const appliedSecretFileName = generateFileName(
        secretAttachment?.file?.name || ''
      );
      try {
        const promises = [];
        const secretAttachmentFilePath = uuidv1();
        if (contentType === 'file') {
          promises.push(
            uploadFile({
              filePath,
              file,
              fileName: appliedFileName,
              onUploadProgress: handleUploadProgress
            })
          );
        }
        if (hasSecretAnswer && secretAttachment) {
          promises.push(
            uploadFile({
              filePath: secretAttachmentFilePath,
              file: secretAttachment?.file,
              fileName: appliedSecretFileName,
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
                secretAttachmentFileName: appliedSecretFileName,
                secretAttachmentFileSize: secretAttachment.file.size
              }
            : {}),
          ...(contentType === 'file'
            ? { filePath, fileName: appliedFileName, fileSize: file.size }
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
        onSetInputModalShown({ shown: false });
        onSetUploadingFile(false);
      } catch (error) {
        console.error(error);
      }
      function handleSecretAttachmentUploadProgress({
        loaded,
        total
      }: {
        loaded: number;
        total: number;
      }) {
        onUpdateSecretAttachmentUploadProgress(loaded / total);
      }
      function handleUploadProgress({
        loaded,
        total
      }: {
        loaded: number;
        total: number;
      }) {
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

  function checkUserChange(userId: number) {
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
          myState: {
            ...myState,
            loadingRankings,
            profileTheme: myState.profileTheme || DEFAULT_PROFILE_THEME
          },
          theme,
          helpers: { checkUserChange, setMobileMenuShown }
        }}
      >
        {mobileMenuShown && (
          <MobileMenu onClose={() => setMobileMenuShown(false)} />
        )}
        {updateNoticeShown && (
          <div
            style={{
              fontSize: '17px',
              top: '20px',
              zIndex: 100_000,
              background: Color.blue(),
              color: '#fff',
              padding: '10px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'fixed'
            }}
            className={css`
              width: 80%;
              left: 10%;
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
            <Button
              color="gold"
              filled
              style={{
                marginTop: '10px',
                fontSize: '30px',
                minWidth: '20%',
                alignSelf: 'center'
              }}
              onClick={() => window.location.reload()}
            >
              Update!
            </Button>
            <p style={{ fontSize: '13px', marginTop: '10px' }}>
              {
                "Warning: Update is mandatory. Some features will not work properly if you don't update!"
              }
            </p>
            {updateDetail && (
              <p style={{ color: Color.gold() }}>{updateDetail}</p>
            )}
          </div>
        )}
        <Header
          onInit={handleInit}
          onMobileMenuOpen={() => setMobileMenuShown(true)}
        />
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
            <Route path="/ai-stories/:contentId" element={<ContentPage />} />
            <Route path="/comments/:contentId" element={<ContentPage />} />
            <Route path="/videos/:videoId" element={<VideoPage />} />
            <Route path="/videos/:videoId/*" element={<VideoPage />} />
            <Route path="/links/:linkId" element={<LinkPage />} />
            <Route path="/subjects/:contentId" element={<ContentPage />} />
            <Route path="/ai-cards" element={<Explore category="ai-cards" />} />
            <Route path="/videos" element={<Explore category="videos" />} />
            <Route path="/links" element={<Explore category="links" />} />
            <Route path="/subjects" element={<Explore category="subjects" />} />
            <Route path="/playlists/*" element={<PlaylistPage />} />
            <Route path="/missions/:missionType/*" element={<MissionPage />} />
            <Route path="/missions" element={<Mission />} />
            <Route
              path="/chat/*"
              element={<Chat onFileUpload={handleFileUploadOnChat} />}
            />
            <Route path="/management/*" element={<Management />} />
            <Route path="/reset/*" element={<ResetPassword />} />
            <Route path="/verify/*" element={<Verify />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/users" element={<Home section="people" />} />
            <Route path="/groups" element={<Home section="group" />} />
            <Route
              path="/achievements"
              element={<Home section="achievement" />}
            />
            <Route path="/settings" element={<Home section="store" />} />
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
        {dailyRewardModalShown && (
          <DailyRewardModal
            onSetHasBonus={(hasBonus: boolean) => {
              onUpdateTodayStats({
                newStats: {
                  dailyHasBonus: hasBonus,
                  dailyRewardResultViewed: true
                }
              });
            }}
            onSetIsDailyRewardChecked={() => {
              onUpdateTodayStats({
                newStats: {
                  dailyRewardResultViewed: true
                }
              });
            }}
            onCountdownComplete={handleCountdownComplete}
            onHide={() => onSetDailyRewardModalShown(false)}
          />
        )}
        {dailyBonusModalShown && (
          <DailyBonusModal
            onHide={() => onSetDailyBonusModalShown(false)}
            onSetDailyBonusAttempted={handleSetDailyBonusAttempted}
          />
        )}
        {signinModalShown && <SigninModal onHide={onCloseSigninModal} />}
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

  function handleSetDailyBonusAttempted() {
    onUpdateTodayStats({
      newStats: {
        dailyBonusAttempted: true
      }
    });
  }

  async function handleCountdownComplete(newNextDayTimeStamp?: number) {
    onSetDailyRewardModalShown(false);
    if (!newNextDayTimeStamp) {
      newNextDayTimeStamp = await getCurrentNextDayTimeStamp();
    }
    onUpdateTodayStats({
      newStats: {
        xpEarned: 0,
        coinsEarned: 0,
        achievedDailyGoals: [],
        dailyHasBonus: false,
        dailyBonusAttempted: false,
        dailyRewardResultViewed: false,
        nextDayTimeStamp: newNextDayTimeStamp
      }
    });
  }

  async function handleInit(attempts = 0) {
    if (!userId) {
      return;
    }
    const maxRetries = 3;
    const retryDelay = 1000;

    try {
      const data = await loadMyData(location.pathname);
      if (data?.id) {
        Object.keys(localStorageKeys).forEach((key) => {
          const value = data[key] || localStorageKeys[key];
          localStorage.setItem(key, value);
        });
        onSetUserState({
          userId: data?.id,
          newState: data
        });
        onInitMyState(data);
      }
      await recordUserTraffic(location.pathname);
    } catch (error) {
      if (attempts < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return handleInit(attempts + 1);
      }
    } finally {
      onSetSessionLoaded();
    }
  }
}
