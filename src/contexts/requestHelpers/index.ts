import { getStoredItem, getTwinkleDeviceId } from '~/helpers/userDataHelpers';

type RequestHelperModuleName =
  | 'build'
  | 'chat'
  | 'chess'
  | 'community'
  | 'content'
  | 'interactive'
  | 'management'
  | 'mission'
  | 'notification'
  | 'user'
  | 'zero';

interface RequestHelperContext {
  auth: typeof auth;
  handleError: (error: unknown) => void;
  token: typeof token;
}

type RequestHelperFactory = (
  context: RequestHelperContext
) => Record<string, any>;

interface RequestHelperModule {
  default: RequestHelperFactory;
}

const token = () => getStoredItem('token');

const auth = () => ({
  headers: {
    authorization: token(),
    'x-twinkle-device-id': getTwinkleDeviceId()
  }
});

const helperModuleLoaders: Record<
  RequestHelperModuleName,
  () => Promise<RequestHelperModule>
> = {
  build: () => import('./build'),
  chat: () => import('./chat'),
  chess: () => import('./chess'),
  community: () => import('./community'),
  content: () => import('./content'),
  interactive: () => import('./interactive'),
  management: () => import('./management'),
  mission: () => import('./mission'),
  notification: () => import('./notification'),
  user: () => import('./user'),
  zero: () => import('./zero')
};

const helperMethodModules: Record<string, RequestHelperModuleName> =
  Object.create(null);

function registerMethods(
  moduleName: RequestHelperModuleName,
  methodNames: string[]
) {
  for (const methodName of methodNames) {
    helperMethodModules[methodName] = moduleName;
  }
}

registerMethods('build', [
  'createBuild',
  'loadBuild',
  'loadBuildForkHistory',
  'loadBuildForkers',
  'loadBuildTeamMembers',
  'loadBuildBranch',
  'loadBuildRuntimeUploads',
  'deleteBuildRuntimeUpload',
  'loadRuntimeBuild',
  'updateBuildMetadata',
  'loadBuildThumbnailOptions',
  'uploadBuildThumbnail',
  'captureBuildThumbnailPreview',
  'deleteBuildChatMessage',
  'routeBuildChatUpload',
  'createBuildChatAssistantNote',
  'createBuildChatUserNote',
  'createBuildChatReferenceNote',
  'cleanupBuildChatReferenceUploads',
  'loadMyBuilds',
  'loadCollaboratingBuilds',
  'loadBuildActivity',
  'updateBuildActivityViewed',
  'loadTodayTopViewedBuild',
  'loadRecentlyUsedBuilds',
  'loadFavoriteBuilds',
  'updateBuildFavorite',
  'loadMyPublicBuildsForPinning',
  'loadUserBuilds',
  'loadBuildProjectFiles',
  'updateBuildProjectFiles',
  'createBuildPreviewSession',
  'loadBuildProjectFileChangeLogs',
  'deleteBuild',
  'downloadBuildProjectArchive',
  'loadBuildAiPrompts',
  'callBuildRuntimeAiChat',
  'callBuildRuntimeAiChatStream',
  'callBuildRuntimeAiObject',
  'callBuildRuntimeCharacterChat',
  'callBuildRuntimeCharacterChatStream',
  'listBuildArtifacts',
  'listBuildArtifactVersions',
  'restoreBuildArtifactVersion',
  'publishBuild',
  'unpublishBuild',
  'purchaseBuildGenerationReset',
  'loadPublicBuilds',
  'generateBuildTags',
  'forkBuild',
  'updateBuildCollaboration',
  'updateBuildLumineChatVisibility',
  'updateBuildLumineModelPreference',
  'loadBuildLumineChatHistory',
  'loadBuildContributors',
  'loadBuildContributionMembership',
  'inviteBuildContributor',
  'revokeBuildContributor',
  'acceptBuildContributorInvite',
  'declineBuildContributorInvite',
  'loadMyBuildCollaborationRequest',
  'createBuildCollaborationRequest',
  'loadBuildCollaborationRequests',
  'acceptBuildCollaborationRequest',
  'rejectBuildCollaborationRequest',
  'hideBuildCollaborationRequest',
  'cancelBuildCollaborationRequest',
  'createBuildContributionFork',
  'ensureDefaultBuildContributionBranch',
  'loadBuildContributions',
  'loadBuildContribution',
  'resetBuildContributionToMain',
  'updateBuildContributionFromMain',
  'loadBuildContributionMergeIntoMyBranch',
  'mergeBuildContributionIntoMyBranch',
  'mergeBuildContribution',
  'replaceMainWithBuildContribution',
  'replaceBuildContributionIntoMyBranch',
  'completeBuildContributionMerge',
  'loadBuildContributionForumThreads',
  'createBuildContributionForumThread',
  'loadBuildContributionForumThread',
  'createBuildContributionForumReply',
  'deleteBuildContributionForumThread',
  'deleteBuildContributionForumReply',
  'queryViewerDb',
  'execViewerDb',
  'getBuildApiToken',
  'uploadBuildRuntimeFiles',
  'listBuildRuntimeFiles',
  'deleteBuildRuntimeFile',
  'getBuildApiUser',
  'getBuildApiUsers',
  'getBuildDailyReflections',
  'getBuildMySubjects',
  'searchBuildSubjects',
  'listBuildAiCards',
  'searchBuildAiCards',
  'getBuildAiCard',
  'listBuildAiStories',
  'listBuildAiStoryChapters',
  'searchBuildAiStories',
  'getBuildAiStory',
  'listBuildGrammarblesQuestions',
  'getBuildGrammarblesHistory',
  'getBuildSubject',
  'getBuildSubjectComments',
  'listBuildSubjectComments',
  'getBuildProfileComments',
  'getBuildProfileCommentIds',
  'getBuildProfileCommentsByIds',
  'getBuildProfileCommentCounts',
  'getSharedDbTopics',
  'createSharedDbTopic',
  'getSharedDbEntries',
  'addSharedDbEntry',
  'updateSharedDbEntry',
  'deleteSharedDbEntry',
  'claimSharedDbEntry',
  'getSharedDbKvItem',
  'listSharedDbKvItems',
  'setSharedDbKvItems',
  'deleteSharedDbKvItem',
  'getBuildLeaderboard',
  'submitBuildLeaderboardScore',
  'listBuildChatRooms',
  'createBuildChatRoom',
  'listBuildChatMessages',
  'sendBuildChatMessage',
  'deleteBuildRuntimeChatMessage',
  'getPrivateDbItem',
  'listPrivateDbItems',
  'setPrivateDbItem',
  'deletePrivateDbItem',
  'listBuildReminders',
  'createBuildReminder',
  'updateBuildReminder',
  'deleteBuildReminder',
  'getDueBuildReminders',
  'getBuildSubjectUpdateSubscription',
  'getBuildNotificationSubscription',
  'subscribeToBuildNotifications',
  'unsubscribeFromBuildNotifications',
  'subscribeToBuildNotificationsBatch',
  'unsubscribeFromBuildNotificationsBatch',
  'notifyBuildSubscribers',
  'subscribeToBuildSubjectUpdates',
  'unsubscribeFromBuildSubjectUpdates'
]);

registerMethods('community', [
  'loadCommunityFunds',
  'loadCommunityFundStats',
  'loadDonorLeaderboard'
]);

registerMethods('content', [
  'replaceSubjectAttachment',
  'replaceCommentAttachment',
  'addVideoToPlaylists',
  'checkDrafts',
  'saveFileData',
  'saveDraft',
  'deleteDraft',
  'addVideoView',
  'checkContentUrl',
  'checkIfHomeOutdated',
  'checkIfUserResponded',
  'checkNumGrammarGamesPlayedToday',
  'closeContent',
  'deleteContent',
  'deletePlaylist',
  'editContent',
  'editPlaylistTitle',
  'editPlaylistVideos',
  'fetchPlaylistsContaining',
  'fetchUrlEmbedData',
  'finishWatchingVideo',
  'likeContent',
  'batchSellAICards',
  'loadAICards',
  'loadFilteredAICards',
  'loadComments',
  'loadCommentsByPoster',
  'loadContent',
  'loadContinueWatching',
  'loadFeaturedPlaylists',
  'loadFeaturedSubjects',
  'loadFeeds',
  'recordContentView',
  'recordHomeFeedPerformance',
  'loadAIStoryTopic',
  'loadAIStoryClear',
  'loadAIStory',
  'loadAIStoryListeningAudio',
  'loadAIStoryListeningImage',
  'loadAIStoryQuestions',
  'loadAIStoryVocabSummary',
  'loadAIStoryVocabQuiz',
  'submitAIStoryVocabQuizAnswer',
  'uploadAIStoryAttempt',
  'loadAIStoryRankings',
  'generateAIStoryImage',
  'loadGrammarGame',
  'cancelGrammarGame',
  'startGrammarAttempt',
  'loadGrammarRankings',
  'loadGrammarReview',
  'challengeGrammarQuestion',
  'loadLikedFeeds',
  'loadFeedsByUser',
  'loadPostsToReward',
  'loadPostsToRecommend',
  'loadHighXPSubjects',
  'markPostAsSkipped',
  'loadMorePlaylistList',
  'loadMoreNotableContents',
  'loadNotableContent',
  'loadNewFeeds',
  'countNewFeeds',
  'loadPlaylistList',
  'loadPlaylists',
  'loadPlaylistVideos',
  'loadReplies',
  'loadRightMenuVideos',
  'loadSubjects',
  'loadByUserUploads',
  'loadRecommendedUploads',
  'loadUploads',
  'makeThumbnailSecure',
  'loadVideoCurrentTime',
  'loadVideoWatchPercentage',
  'recommendContent',
  'reorderPlaylistVideos',
  'searchContent',
  'getHigherAICardBids',
  'searchAICardIds',
  'searchAICardStyles',
  'searchAICardWords',
  'setByUser',
  'updateCommentPinStatus',
  'updateRewardLevel',
  'checkCurrentlyWatchingAnotherVideo',
  'updateTotalViewDuration',
  'uploadComment',
  'sponsorAiEnergyCommentReply',
  'loadAiEnergyCommentReplySponsorStatus',
  'uploadContent',
  'uploadFeaturedPlaylists',
  'uploadFeaturedSubjects',
  'uploadGrammarGameResult',
  'uploadQuestions',
  'uploadFile',
  'uploadPlaylist',
  'uploadSubject',
  'uploadThumb',
  'generateAIImage',
  'getDailyQuestion',
  'submitDailyQuestionResponse',
  'recoverDailyQuestionSubmission',
  'shareDailyQuestionResponse',
  'shareDailyQuestionWithAI',
  'refineDailyQuestionResponse',
  'simplifyDailyQuestion',
  'purchaseDailyQuestionRepair',
  'setDailyQuestionNextCategory',
  'setDailyQuestionCurrentFocus',
  'getDailyQuestionHistory'
]);

registerMethods('chess', [
  'loadChessStats',
  'loadChessLevels',
  'updateChessCurrentLevel',
  'loadChessPuzzle',
  'submitChessAttempt',
  'recordChessAttemptResult',
  'loadChessDailyStats',
  'startTimeAttackPromotion',
  'submitTimeAttackAttempt',
  'completePromotion',
  'unlockPromotion',
  'loadChessRankings'
]);

registerMethods('interactive', [
  'appendInteractiveSlide',
  'checkInteractiveNumUpdates',
  'deleteInteractiveSlide',
  'insertArchivedSlide',
  'insertInteractiveSlide',
  'undeleteInteractiveSlide',
  'loadInteractive',
  'editInteractiveSlide',
  'moveInteractiveSlide',
  'publishInteractive',
  'publishInteractiveSlide',
  'recoverArchivedSlide',
  'unPublishInteractiveSlide',
  'updateEmbedData',
  'uploadThumbForInteractiveSlide'
]);

registerMethods('notification', [
  'checkVersion',
  'fetchNotifications',
  'getBuildAppNotificationPreferences',
  'updateBuildAppNotificationPreferences',
  'loadBuildAppNotificationLaunchTarget',
  'fetchTodayStats',
  'checkUnansweredChess',
  'checkUnansweredOmok',
  'loadMoreNotifications',
  'loadMoreRewards',
  'loadRewards',
  'unlockDailyReward',
  'purchaseDailyTaskRepair',
  'clearUnavailableAIStoryDailyTask',
  'clearUnavailableDailyQuestion',
  'setDailyTaskRepairNoticeHidden',
  'setDailyTaskBoostStripCompact',
  'updateDailyRewardViewStatus',
  'loadDailyBonus',
  'postDailyBonus',
  'purchaseDailyTaskStreakRepair'
]);

registerMethods('management', [
  'addAccountType',
  'changeAccountType',
  'loadModerators',
  'loadModeratorsCSV',
  'loadWealthData',
  'loadWealthDataCSV',
  'loadAiCostReport',
  'loadAiCostEvents',
  'loadAiCostReportCSV',
  'loadTwinkleAiCostsPaymentOverview',
  'setTwinkleAiCostsPaymentActive',
  'createTwinkleAiCostsPortalSession',
  'loadAiCostRiskGroup',
  'loadAiCostRiskGroupEvents',
  'loadAiEnergyManualIdentityBuckets',
  'createAiEnergyManualIdentityBucket',
  'updateAiEnergyManualIdentityBucket',
  'saveAiEnergyManualIdentityRule',
  'disableAiEnergyManualIdentityRule',
  'addAiEnergyManualIdentityAccount',
  'addAiEnergyManualIdentityIpSignal',
  'setAiEnergyManualIdentityBucketBan',
  'migrateLegacyBansIntoBucket',
  'mergeAiEnergyManualIdentityBuckets',
  'loadHomeFeedPerformanceReport',
  'loadEffortLevelPerformanceReport',
  'loadGrammarPerformanceReport',
  'loadHomeFeedPerformanceExport',
  'loadPerformanceExport',
  'loadNotableUsers',
  'loadNotableUsersCSV',
  'addNotableUser',
  'clearHomeFeedPerformanceData',
  'addModerators',
  'addSupermods',
  'approveRequest',
  'changeSupermodRole',
  'checkDobApprovalSubmission',
  'checkMeetupApprovalSubmission',
  'convertUser',
  'deleteMessagePermanently',
  'deletePostPermanently',
  'grantAchievements',
  'loadAccountTypes',
  'deleteAccountType',
  'editAccountType',
  'loadAllAchievements',
  'loadApprovalItemById',
  'loadApprovalItems',
  'loadBannedUsers',
  'loadDeletedContent',
  'loadDeletedMessage',
  'loadDeletedPosts',
  'loadModificationItem',
  'loadSupermods',
  'retryDobApproval',
  'retryMeetupApproval',
  'revertApproval',
  'submitDobForApproval',
  'submitMeetupForApproval',
  'updateBanStatus'
]);

registerMethods('mission', [
  'approveGrammarQuestion',
  'deleteGrammarQuestion',
  'attachMissionTutorial',
  'checkMissionStatus',
  'editGrammarQuestion',
  'formatCode',
  'lintCode',
  'processAst',
  'loadGitHubData',
  'loadGrammarAttempts',
  'loadMoreGrammarAttempts',
  'loadGrammarCategories',
  'deleteGrammarCategory',
  'loadGrammarCategoryQuestions',
  'editGrammarCategory',
  'uploadGrammarCategory',
  'loadGrammarQuestions',
  'updateGrammarQuestionCategory',
  'loadMission',
  'updateMissionData',
  'loadMissionRankings',
  'loadMissionAttempts',
  'loadMissionAttemptsForPage',
  'loadMissionList',
  'loadMissionTypeIdHash',
  'loadGoogleMissionQuestions',
  'updateCurrentMission',
  'updateMissionStatus',
  'updateTutorialPrompt',
  'uploadGoogleQuestion',
  'approveGoogleQuestion',
  'disapproveGoogleQuestion',
  'deleteGoogleQuestion',
  'uploadGrammarQuestion',
  'uploadGrammarAttempt',
  'runSystemPromptPreview',
  'applySystemPromptToAIChat',
  'cloneSharedSystemPrompt',
  'loadSystemPromptProgress',
  'uploadMissionAttempt',
  'uploadMissionFeedback'
]);

registerMethods('chat', [
  'acceptInvitation',
  'acceptTrade',
  'burnAICard',
  'buyAICard',
  'buyChatSubject',
  'buyChatTheme',
  'cancelAIMessage',
  'closeTransaction',
  'changeChannelOwner',
  'checkTransactionPossible',
  'checkChatAccessible',
  'createNewChat',
  'cancelChessRewind',
  'declineChessRewind',
  'deleteChatSubject',
  'deleteChatMessage',
  'deleteAIChatFile',
  'deleteTopic',
  'loadDeletedTopics',
  'restoreDeletedTopic',
  'permanentlyDeleteTopic',
  'bookmarkChatMessage',
  'unbookmarkChatMessage',
  'editTopic',
  'loadMyCustomInstructionTopics',
  'loadMySharedPrompts',
  'updateTopicShareState',
  'cloneSharedTopic',
  'editCanChangeTopic',
  'editChannelSettings',
  'editChatMessage',
  'editWord',
  'fetchCurrentChessState',
  'fetchCurrentRewindRequest',
  'fetchCurrentOmokState',
  'getCustomInstructionsForTopic',
  'loadAIChatFiles',
  'improveCustomInstructions',
  'generateAICardImage',
  'getOffersForCard',
  'getOffersForCardByPrice',
  'getIncomingCardOffers',
  'getMyAICardOffers',
  'getVocabRouletteResult',
  'fetchWordMasterBreakStatus',
  'clearWordMasterBreak',
  'spinBreakPassRoulette',
  'loadWordMasterQuizQuestion',
  'submitWordMasterQuizAnswer',
  'postAICardOffer',
  'deleteAICardOffer',
  'generateAICard',
  'getCurrentNextDayTimeStamp',
  'getNumberOfUnreadMessages',
  'hideChatAttachment',
  'hideChat',
  'inviteUsersToChannel',
  'leaveChannel',
  'removeMemberFromChannel',
  'listAICard',
  'delistAICard',
  'loadChat',
  'loadChatChannel',
  'loadChatMessage',
  'loadAICardFeed',
  'loadAICardFeeds',
  'loadBookmarksForTopic',
  'loadMoreBookmarks',
  'loadMoreChannelMembers',
  'loadSubchannel',
  'loadPublicGroups',
  'loadGroupsForTrade',
  'searchGroups',
  'searchGroupsForTrade',
  'loadTopicMessages',
  'loadMoreRecentTopicMessages',
  'loadChatSubject',
  'loadDMChannel',
  'loadMoreChannels',
  'loadMoreChatMessages',
  'loadChatSubjects',
  'loadMoreChatSubjects',
  'loadOtherUserTopics',
  'loadMoreOtherUserTopics',
  'loadSharedPrompt',
  'loadListedAICards',
  'loadMyListedAICards',
  'loadMyAICardCollections',
  'loadAICard',
  'loadPendingTransaction',
  'loadVocabularyFeeds',
  'loadVocabularyLeaderboards',
  'loadWordle',
  'loadWordleRankings',
  'loadWordleStreaks',
  'loadWordleDoubleStreaks',
  'reloadChatSubject',
  'lookUpWord',
  'pinChatTopic',
  'postChatReaction',
  'postTradeRequest',
  'putFavoriteChannel',
  'removeChatReaction',
  'rewindChessMove',
  'collectVocabulary',
  'getAiEnergyPolicy',
  'purchaseAiEnergyRecharge',
  'saveChatMessage',
  'checkIfDuplicateWordleAttempt',
  'updateWordleAttempt',
  'searchChat',
  'searchChatMessages',
  'searchChatSubject',
  'searchUserToInvite',
  'searchChannelMembers',
  'sellAICard',
  'sendInvitationMessage',
  'setChessMoveViewTimeStamp',
  'startNewDMChannel',
  'setOmokMoveViewTimeStamp',
  'updateLastChannelId',
  'updateChatLastRead',
  'updateSubchannelLastRead',
  'uploadChatTopic',
  'updateFeaturedTopic',
  'updateLastTopicId',
  'checkIfAIFileSupported',
  'uploadFileOnChat',
  'saveChatMessageWithFileAttachment'
]);

registerMethods('user', [
  'checkIfPasswordMatches',
  'checkIfUsernameExists',
  'changePassword',
  'changePasswordFromStore',
  'changeUsername',
  'updateImageGenerationSettings',
  'updateImageEditorSettings',
  'confirmPassword',
  'deletePreviousUsername',
  'deleteProfilePictures',
  'deleteArchivedPicture',
  'editRewardComment',
  'loadFeaturedSubjectsOnProfile',
  'featureSubjectsOnProfile',
  'loadPinnedAICardsOnProfile',
  'loadPinnedBuildsOnProfile',
  'pinAICardsOnProfile',
  'pinBuildsOnProfile',
  'updateProfileSectionOrder',
  'revokeReward',
  'recordUserTraffic',
  'loadMyAchievements',
  'loadAchievementsByUserId',
  'loadUsersByAchievementId',
  'loadCoinHistory',
  'loadMyData',
  'loadUsernameHistory',
  'loadUserPictures',
  'loadUserTitles',
  'updateUserTitle',
  'loadKarmaPoints',
  'loadMonthlyLeaderboards',
  'loadMonthlyXp',
  'loadProfile',
  'loadProfileViaUsername',
  'loadRankings',
  'loadTodayRankings',
  'loadAllTodayRankings',
  'loadTop30TodayRankings',
  'loadUsers',
  'loadCoins',
  'loadXP',
  'loadMissionProgress',
  'loadXpAcquisition',
  'login',
  'recordLogout',
  'reorderProfilePictures',
  'reportError',
  'rewardUser',
  'searchUsers',
  'searchUsersWithAchievements',
  'sendVerificationEmail',
  'sendVerificationOTPEmail',
  'sendVerificationOTPEmailForSignup',
  'setDefaultSearchFilter',
  'setBuildQuickAccessMode',
  'updateBuildStudioState',
  'setTheme',
  'signup',
  'createDevAccount',
  'toggleHideWatched',
  'toggleWordleStrictMode',
  'updateCollectType',
  'updateCurrentlyWatching',
  'collectRewardedCoins',
  'updateUserCoins',
  'updateUserXP',
  'uploadBio',
  'uploadGreeting',
  'uploadProfileInfo',
  'unlockAICardGeneration',
  'unlockUsernameChange',
  'unlockDonorLicense',
  'makeDonation',
  'uploadUserPic',
  'updateUserPictureCaption',
  'updateUserPictures',
  'upgradeFileUploadSize',
  'upgradeNumPics',
  'upgradeRewardBoost',
  'verifyEmailViaOTP',
  'verifyEmailViaOTPForSignup',
  'verifyEmail',
  'verifyPassphrase'
]);

registerMethods('zero', [
  'checkWorkshopAvailability',
  'generateVideoSubtitles',
  'splitSubtitles',
  'mergeSubtitles',
  'mergeVideoWithSubtitles',
  'textToSpeech'
]);

export default function requestHelpers(handleError: (error: unknown) => void) {
  const loadedModules: Partial<
    Record<RequestHelperModuleName, Promise<Record<string, any>>>
  > = {};
  const methodCache = new Map<string, (...args: any[]) => Promise<any>>();
  const baseHelpers: Record<string, any> = { auth };

  function loadHelperModule(moduleName: RequestHelperModuleName) {
    if (!loadedModules[moduleName]) {
      loadedModules[moduleName] = helperModuleLoaders[moduleName]().then(
        ({ default: factory }) =>
          factory({
            auth,
            handleError,
            token
          })
      );
    }
    return loadedModules[moduleName]!;
  }

  function getLazyHelper(methodName: string) {
    const cached = methodCache.get(methodName);
    if (cached) return cached;

    const moduleName = helperMethodModules[methodName];
    if (!moduleName) return undefined;

    const helper = async (...args: any[]) => {
      const helpers = await loadHelperModule(moduleName);
      const method = helpers[methodName];
      if (typeof method !== 'function') {
        throw new Error(`Request helper "${methodName}" is not available.`);
      }
      return method(...args);
    };
    methodCache.set(methodName, helper);
    return helper;
  }

  return new Proxy(baseHelpers, {
    get(target, prop) {
      if (typeof prop !== 'string') {
        return Reflect.get(target, prop);
      }
      if (prop === 'then') return undefined;
      if (Object.prototype.hasOwnProperty.call(target, prop)) {
        return target[prop as keyof typeof target];
      }
      return getLazyHelper(prop);
    },
    has(target, prop) {
      return (
        Object.prototype.hasOwnProperty.call(target, prop) ||
        (typeof prop === 'string' && prop in helperMethodModules)
      );
    },
    ownKeys(target) {
      return [...Reflect.ownKeys(target), ...Object.keys(helperMethodModules)];
    },
    getOwnPropertyDescriptor(target, prop) {
      if (Object.prototype.hasOwnProperty.call(target, prop)) {
        return Object.getOwnPropertyDescriptor(target, prop);
      }
      if (typeof prop === 'string' && prop in helperMethodModules) {
        return {
          configurable: true,
          enumerable: true
        };
      }
      return undefined;
    }
  });
}
