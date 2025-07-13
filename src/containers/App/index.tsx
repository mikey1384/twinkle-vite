import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback
} from 'react';
import Chat from '~/containers/Chat';
import ContentPage from '~/containers/ContentPage';
import Explore from '~/containers/Explore';
import Header from './Header';
import Home from '~/containers/Home';
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
  MAX_AI_CALL_DURATION,
  ZERO_TWINKLE_ID,
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
  useManagementContext,
  useHomeContext,
  useInputContext,
  useViewContext,
  useNotiContext,
  useChatContext,
  KeyContext
} from '~/contexts';
import AICallWindow from './AICallWindow';
import AdminLogWindow from './AdminLogWindow';
import { extractVideoThumbnail } from '~/helpers/videoHelpers';
import UpdateNotice from './UpdateNotice';

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
  const adminLogs = useManagementContext((v) => v.state.adminLogs);
  const todayStats = useNotiContext((v) => v.state.todayStats);
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
  const loadCommunityFunds = useAppContext(
    (v) => v.requestHelpers.loadCommunityFunds
  );
  const recordUserTraffic = useAppContext(
    (v) => v.requestHelpers.recordUserTraffic
  );
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const saveFileData = useAppContext((v) => v.requestHelpers.saveFileData);
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
    isAdmin,
    userId,
    username
  } = myState;

  const prevUserId = useRef(userId);
  const zeroChannelId = useChatContext((v) => v.state.zeroChannelId);
  const thinkHardZero = useChatContext((v) => v.state.thinkHardZero);
  const thinkHardCiel = useChatContext((v) => v.state.thinkHardCiel);
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
  const onRemoveFileUploadStatus = useChatContext(
    (v) => v.actions.onRemoveFileUploadStatus
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
  const onSetCommunityFunds = useAppContext(
    (v) => v.user.actions.onSetCommunityFunds
  );
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
  const onSetIsZeroCallAvailable = useChatContext(
    (v) => v.actions.onSetIsZeroCallAvailable
  );
  const onSetZeroChannelId = useChatContext(
    (v) => v.actions.onSetZeroChannelId
  );
  const dailyBonusModalShown = useNotiContext(
    (v) => v.state.dailyBonusModalShown
  );
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const updateNoticeShown = useNotiContext((v) => v.state.updateNoticeShown);
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const onGetRanks = useNotiContext((v) => v.actions.onGetRanks);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const aiCallChannelId = useChatContext((v) => v.state.aiCallChannelId);
  const onChangePageVisibility = useViewContext(
    (v) => v.actions.onChangePageVisibility
  );
  const onResetSubjectInput = useInputContext(
    (v) => v.actions.onResetSubjectInput
  );
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [mobileMenuShown, setMobileMenuShown] = useState(false);
  const visibilityChangeRef: React.RefObject<any> = useRef(null);
  const hiddenRef: React.RefObject<any> = useRef(null);
  const authRef: React.RefObject<any> = useRef(null);

  const checkUserChange = useCallback((idToCheck: number) => {
    return idToCheck !== prevUserId.current;
  }, []);

  const aiCallDuration = useMemo(() => {
    if (!todayStats) return 0;
    return todayStats.aiCallDuration;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStats?.aiCallDuration]);

  const aiCallOngoing = useMemo(
    () => !!zeroChannelId && zeroChannelId === aiCallChannelId,
    [aiCallChannelId, zeroChannelId]
  );

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

  const maxAiCallDurationReached = useMemo(() => {
    if (isAdmin) return false;
    return aiCallDuration >= MAX_AI_CALL_DURATION;
  }, [aiCallDuration, isAdmin]);

  useEffect(() => {
    checkZeroCallAvailability();

    async function checkZeroCallAvailability() {
      if (userId && !maxAiCallDurationReached) {
        const { pathId, channelId } = await loadDMChannel({
          recipient: { id: ZERO_TWINKLE_ID },
          createIfNotExist: true
        });
        onSetIsZeroCallAvailable(!!pathId);
        onSetZeroChannelId(channelId);
      } else {
        onSetIsZeroCallAvailable(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, maxAiCallDurationReached]);

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
        if (checkUserChange(userId)) return;
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
        if (checkUserChange(userId)) return;
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
      if (checkUserChange(userId)) return;
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

  const handleVisibilityChange = useCallback(() => {
    const visible = !document[hiddenRef.current as keyof Document];
    socket.emit('change_away_status', visible);
    onChangePageVisibility(visible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const eventName = visibilityChangeRef.current;
    addEvent(document, eventName, handleVisibilityChange);
    return function cleanUp() {
      removeEvent(document, eventName, handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

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

  const keyContextValue = useMemo(
    () => ({
      myState: {
        ...myState,
        loadingRankings,
        profileTheme: myState.profileTheme || DEFAULT_PROFILE_THEME
      },
      theme,
      helpers: { checkUserChange, setMobileMenuShown }
    }),
    [myState, loadingRankings, theme, checkUserChange]
  );

  return (
    <ErrorBoundary
      componentPath="App/index"
      className={css`
        ${usingChat ? 'border-top: 1px solid transparent;' : ''}
        height: CALC(100% - 4.5rem);
        width: 100%;
        @media (max-width: ${mobileMaxWidth}) {
          height: 100%;
        }
      `}
    >
      <KeyContext.Provider value={keyContextValue}>
        {mobileMenuShown && (
          <MobileMenu onClose={() => setMobileMenuShown(false)} />
        )}
        {updateNoticeShown && <UpdateNotice updateDetail={updateDetail} />}
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
        {aiCallOngoing && (
          <AICallWindow
            initialPosition={{
              x: Math.max(0, window.innerWidth - 520),
              y: 70
            }}
          />
        )}
        {isAdmin && !!adminLogs?.length && (
          <AdminLogWindow
            initialPosition={{
              x: Math.max(0, window.innerWidth - 520),
              y: 100
            }}
          />
        )}
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

  async function handleCountdownComplete() {
    onSetDailyRewardModalShown(false);
    const newNextDayTimeStamp = await getCurrentNextDayTimeStamp();
    onUpdateTodayStats({
      newStats: {
        aiCallDuration: 0,
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

  async function handleFileUploadOnHome({
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
  }) {
    const { file, thumbnail, contentType } = attachment ?? {};
    const appliedFileName = generateFileName(attachment?.file?.name || '');
    const appliedSecretFileName = generateFileName(
      secretAttachment?.file?.name || ''
    );
    try {
      const secretAttachmentFilePath = uuidv1();
      if (contentType === 'file') {
        await handleFileUpload({
          filePath,
          file,
          fileName: appliedFileName,
          onUploadProgress: handleUploadProgress
        });
      }
      if (hasSecretAnswer && secretAttachment) {
        await handleFileUpload({
          filePath: secretAttachmentFilePath,
          file: secretAttachment.file,
          fileName: appliedSecretFileName,
          onUploadProgress: handleSecretAttachmentUploadProgress
        });
      }

      const [thumbUrl, secretThumbUrl] = await Promise.all([
        handleThumbnailUpload({
          thumbnail,
          file
        }),
        hasSecretAnswer
          ? handleThumbnailUpload({
              thumbnail: secretAttachment?.thumbnail,
              file: secretAttachment?.file
            })
          : Promise.resolve('')
      ]);

      const userChanged = checkUserChange(userId);
      if (userChanged) {
        return;
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
  }

  async function handleFileUploadOnChat({
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
  }) {
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
      fileName,
      filePath,
      fileToUpload,
      recipientId,
      subchannelId
    });

    try {
      await uploadFileOnChat({
        fileName,
        selectedFile: fileToUpload,
        onUploadProgress: handleUploadProgress,
        isAIChat: isCielChat || isZeroChat,
        path: filePath
      });
    } catch (error) {
      onRemoveFileUploadStatus({
        channelId,
        filePath
      });
      throw error;
    }

    const thumbUrl = await handleThumbnailUpload({
      thumbnail,
      file: fileToUpload
    });

    const userChanged = checkUserChange(userId);
    if (userChanged) {
      return;
    }

    const { channel, message, messageId, alreadyExists, netCoins } =
      await saveChatMessageWithFileAttachment({
        channelId,
        content,
        fileName,
        actualFileName: fileToUpload.name,
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
        thinkHard:
          (isCielChat && thinkHardCiel) || (isZeroChat && thinkHardZero)
      });

    if (typeof netCoins === 'number') {
      onSetUserState({
        userId,
        newState: { twinkleCoins: netCoins }
      });
    }

    if (alreadyExists) {
      return window.location.reload();
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
  }

  async function handleInit(attempts = 0) {
    if (!userId) {
      return;
    }
    const maxRetries = 3;
    const retryDelay = 1000;

    try {
      const data = await loadMyData(location.pathname);
      if (checkUserChange(userId)) return;
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

        // Load community funds
        try {
          const { totalFunds } = await loadCommunityFunds();
          if (checkUserChange(userId)) return;
          onSetCommunityFunds(totalFunds || 0);
        } catch (error) {
          console.error('Failed to load community funds:', error);
        }
      }
      await recordUserTraffic(location.pathname);
    } catch (error: any) {
      if (checkUserChange(userId)) return;
      if (attempts < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return handleInit(attempts + 1);
      }
      console.error('Failed to initialize after multiple attempts:', error);
    } finally {
      if (checkUserChange(userId)) return;
      onSetSessionLoaded();
    }
  }

  async function handleThumbnailUpload({
    thumbnail,
    file
  }: {
    thumbnail: string;
    file?: File;
  }) {
    if (!thumbnail) {
      if (file?.type?.startsWith('video/')) {
        try {
          const videoUrl = URL.createObjectURL(file);
          const extractedThumbnail = await extractVideoThumbnail(videoUrl);
          if (extractedThumbnail) {
            const thumbnailFile = returnImageFileFromUrl({
              imageUrl: extractedThumbnail
            });
            return await uploadThumb({
              file: thumbnailFile,
              path: uuidv1()
            });
          }
        } catch (error) {
          console.error('Video thumbnail extraction failed:', error);
        }
      }
      return '';
    }

    try {
      const file = returnImageFileFromUrl({ imageUrl: thumbnail });
      return await uploadThumb({
        file,
        path: uuidv1()
      });
    } catch (error) {
      console.error('Thumbnail upload failed:', error);
      return '';
    }
  }

  async function handleFileUpload({
    filePath,
    file,
    fileName,
    onUploadProgress
  }: {
    filePath: string;
    file: File;
    fileName: string;
    onUploadProgress: (params: { loaded: number; total: number }) => void;
  }) {
    const promises = [
      uploadFile({
        filePath,
        file,
        fileName,
        onUploadProgress
      }),
      saveFileData({
        fileName,
        filePath,
        actualFileName: file.name,
        rootType: 'subject'
      })
    ];
    return Promise.all(promises);
  }
}
