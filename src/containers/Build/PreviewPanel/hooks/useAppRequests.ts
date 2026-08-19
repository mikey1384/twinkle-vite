import { useRef } from 'react';
import { useAppContext } from '~/contexts';
import type { PreviewHostBridgeRequestRefs } from '../helpers/previewBridgeRequestRefs';

export default function useAppRequests() {
  const getAiEnergyPolicy = useAppContext(
    (v) => v.requestHelpers.getAiEnergyPolicy
  );
  const connectBuildAppMcpRuntime = useAppContext(
    (v) => v.requestHelpers.connectBuildAppMcpRuntime
  );
  const pollBuildAppMcpCall = useAppContext(
    (v) => v.requestHelpers.pollBuildAppMcpCall
  );
  const completeBuildAppMcpCall = useAppContext(
    (v) => v.requestHelpers.completeBuildAppMcpCall
  );
  const captureBuildThumbnailPreview = useAppContext(
    (v) => v.requestHelpers.captureBuildThumbnailPreview
  );
  const downloadBuildProjectArchive = useAppContext(
    (v) => v.requestHelpers.downloadBuildProjectArchive
  );
  const loadBuildAiPrompts = useAppContext(
    (v) => v.requestHelpers.loadBuildAiPrompts
  );
  const callBuildRuntimeAiChat = useAppContext(
    (v) => v.requestHelpers.callBuildRuntimeAiChat
  );
  const callBuildRuntimeAiImage = useAppContext(
    (v) => v.requestHelpers.callBuildRuntimeAiImage
  );
  const loadBuildRuntimeAiImageStatus = useAppContext(
    (v) => v.requestHelpers.loadBuildRuntimeAiImageStatus
  );
  const loadAIImageResult = useAppContext(
    (v) => v.requestHelpers.loadAIImageResult
  );
  const callBuildRuntimeAiChatStream = useAppContext(
    (v) => v.requestHelpers.callBuildRuntimeAiChatStream
  );
  const callBuildRuntimeAiObject = useAppContext(
    (v) => v.requestHelpers.callBuildRuntimeAiObject
  );
  const getBuildTwinkleNews = useAppContext(
    (v) => v.requestHelpers.getBuildTwinkleNews
  );
  const listBuildTwinkleNewsEditions = useAppContext(
    (v) => v.requestHelpers.listBuildTwinkleNewsEditions
  );
  const getBuildTwinkleNewsEdition = useAppContext(
    (v) => v.requestHelpers.getBuildTwinkleNewsEdition
  );
  const generateBuildTwinkleNews = useAppContext(
    (v) => v.requestHelpers.generateBuildTwinkleNews
  );
  const callBuildRuntimeCharacterChat = useAppContext(
    (v) => v.requestHelpers.callBuildRuntimeCharacterChat
  );
  const callBuildRuntimeCharacterChatStream = useAppContext(
    (v) => v.requestHelpers.callBuildRuntimeCharacterChatStream
  );
  const listBuildArtifacts = useAppContext(
    (v) => v.requestHelpers.listBuildArtifacts
  );
  const listBuildArtifactVersions = useAppContext(
    (v) => v.requestHelpers.listBuildArtifactVersions
  );
  const restoreBuildArtifactVersion = useAppContext(
    (v) => v.requestHelpers.restoreBuildArtifactVersion
  );
  const queryViewerDb = useAppContext((v) => v.requestHelpers.queryViewerDb);
  const execViewerDb = useAppContext((v) => v.requestHelpers.execViewerDb);
  const getBuildApiToken = useAppContext(
    (v) => v.requestHelpers.getBuildApiToken
  );
  const getBuildApiUser = useAppContext(
    (v) => v.requestHelpers.getBuildApiUser
  );
  const getBuildApiUsers = useAppContext(
    (v) => v.requestHelpers.getBuildApiUsers
  );
  const getBuildDailyReflections = useAppContext(
    (v) => v.requestHelpers.getBuildDailyReflections
  );
  const listBuildRuntimeFiles = useAppContext(
    (v) => v.requestHelpers.listBuildRuntimeFiles
  );
  const deleteBuildRuntimeFile = useAppContext(
    (v) => v.requestHelpers.deleteBuildRuntimeFile
  );
  const uploadBuildRuntimeFiles = useAppContext(
    (v) => v.requestHelpers.uploadBuildRuntimeFiles
  );
  const getBuildMySubjects = useAppContext(
    (v) => v.requestHelpers.getBuildMySubjects
  );
  const searchBuildSubjects = useAppContext(
    (v) => v.requestHelpers.searchBuildSubjects
  );
  const listBuildAiCards = useAppContext(
    (v) => v.requestHelpers.listBuildAiCards
  );
  const searchBuildAiCards = useAppContext(
    (v) => v.requestHelpers.searchBuildAiCards
  );
  const getBuildAiCard = useAppContext(
    (v) => v.requestHelpers.getBuildAiCard
  );
  const listBuildAiStories = useAppContext(
    (v) => v.requestHelpers.listBuildAiStories
  );
  const listBuildAiStoryChapters = useAppContext(
    (v) => v.requestHelpers.listBuildAiStoryChapters
  );
  const searchBuildAiStories = useAppContext(
    (v) => v.requestHelpers.searchBuildAiStories
  );
  const getBuildAiStory = useAppContext(
    (v) => v.requestHelpers.getBuildAiStory
  );
  const listBuildGrammarblesQuestions = useAppContext(
    (v) => v.requestHelpers.listBuildGrammarblesQuestions
  );
  const getBuildGrammarblesHistory = useAppContext(
    (v) => v.requestHelpers.getBuildGrammarblesHistory
  );
  const getBuildSubject = useAppContext(
    (v) => v.requestHelpers.getBuildSubject
  );
  const getBuildSubjectComments = useAppContext(
    (v) => v.requestHelpers.getBuildSubjectComments
  );
  const listBuildSubjectComments = useAppContext(
    (v) => v.requestHelpers.listBuildSubjectComments
  );
  const getBuildContentWriteStatus = useAppContext(
    (v) => v.requestHelpers.getBuildContentWriteStatus
  );
  const createBuildContentSubject = useAppContext(
    (v) => v.requestHelpers.createBuildContentSubject
  );
  const editBuildContentSubject = useAppContext(
    (v) => v.requestHelpers.editBuildContentSubject
  );
  const createBuildContentComment = useAppContext(
    (v) => v.requestHelpers.createBuildContentComment
  );
  const editBuildContentComment = useAppContext(
    (v) => v.requestHelpers.editBuildContentComment
  );
  const getBuildProfileComments = useAppContext(
    (v) => v.requestHelpers.getBuildProfileComments
  );
  const getBuildProfileCommentIds = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentIds
  );
  const getBuildProfileCommentsByIds = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentsByIds
  );
  const getBuildProfileCommentCounts = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentCounts
  );
  const getSharedDbTopics = useAppContext(
    (v) => v.requestHelpers.getSharedDbTopics
  );
  const createSharedDbTopic = useAppContext(
    (v) => v.requestHelpers.createSharedDbTopic
  );
  const getSharedDbEntries = useAppContext(
    (v) => v.requestHelpers.getSharedDbEntries
  );
  const getSharedDbEntriesByIds = useAppContext(
    (v) => v.requestHelpers.getSharedDbEntriesByIds
  );
  const addSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.addSharedDbEntry
  );
  const addSharedDbEntries = useAppContext(
    (v) => v.requestHelpers.addSharedDbEntries
  );
  const updateSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.updateSharedDbEntry
  );
  const deleteSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.deleteSharedDbEntry
  );
  const deleteSharedDbEntries = useAppContext(
    (v) => v.requestHelpers.deleteSharedDbEntries
  );
  const claimSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.claimSharedDbEntry
  );
  const getSharedDbKvItem = useAppContext(
    (v) => v.requestHelpers.getSharedDbKvItem
  );
  const listSharedDbKvItems = useAppContext(
    (v) => v.requestHelpers.listSharedDbKvItems
  );
  const setSharedDbKvItems = useAppContext(
    (v) => v.requestHelpers.setSharedDbKvItems
  );
  const deleteSharedDbKvItem = useAppContext(
    (v) => v.requestHelpers.deleteSharedDbKvItem
  );
  const getBuildLeaderboard = useAppContext(
    (v) => v.requestHelpers.getBuildLeaderboard
  );
  const submitBuildLeaderboardScore = useAppContext(
    (v) => v.requestHelpers.submitBuildLeaderboardScore
  );
  const listBuildChatRooms = useAppContext(
    (v) => v.requestHelpers.listBuildChatRooms
  );
  const createBuildChatRoom = useAppContext(
    (v) => v.requestHelpers.createBuildChatRoom
  );
  const listBuildChatMessages = useAppContext(
    (v) => v.requestHelpers.listBuildChatMessages
  );
  const sendBuildChatMessage = useAppContext(
    (v) => v.requestHelpers.sendBuildChatMessage
  );
  const deleteBuildRuntimeChatMessage = useAppContext(
    (v) => v.requestHelpers.deleteBuildRuntimeChatMessage
  );
  const getPrivateDbItem = useAppContext(
    (v) => v.requestHelpers.getPrivateDbItem
  );
  const listPrivateDbItems = useAppContext(
    (v) => v.requestHelpers.listPrivateDbItems
  );
  const setPrivateDbItem = useAppContext(
    (v) => v.requestHelpers.setPrivateDbItem
  );
  const deletePrivateDbItem = useAppContext(
    (v) => v.requestHelpers.deletePrivateDbItem
  );
  const listBuildReminders = useAppContext(
    (v) => v.requestHelpers.listBuildReminders
  );
  const createBuildReminder = useAppContext(
    (v) => v.requestHelpers.createBuildReminder
  );
  const updateBuildReminder = useAppContext(
    (v) => v.requestHelpers.updateBuildReminder
  );
  const deleteBuildReminder = useAppContext(
    (v) => v.requestHelpers.deleteBuildReminder
  );
  const getDueBuildReminders = useAppContext(
    (v) => v.requestHelpers.getDueBuildReminders
  );
  const getBuildSubjectUpdateSubscription = useAppContext(
    (v) => v.requestHelpers.getBuildSubjectUpdateSubscription
  );
  const getBuildNotificationSubscription = useAppContext(
    (v) => v.requestHelpers.getBuildNotificationSubscription
  );
  const subscribeToBuildNotifications = useAppContext(
    (v) => v.requestHelpers.subscribeToBuildNotifications
  );
  const unsubscribeFromBuildNotifications = useAppContext(
    (v) => v.requestHelpers.unsubscribeFromBuildNotifications
  );
  const subscribeToBuildNotificationsBatch = useAppContext(
    (v) => v.requestHelpers.subscribeToBuildNotificationsBatch
  );
  const unsubscribeFromBuildNotificationsBatch = useAppContext(
    (v) => v.requestHelpers.unsubscribeFromBuildNotificationsBatch
  );
  const notifyBuildSubscribers = useAppContext(
    (v) => v.requestHelpers.notifyBuildSubscribers
  );
  const subscribeToBuildSubjectUpdates = useAppContext(
    (v) => v.requestHelpers.subscribeToBuildSubjectUpdates
  );
  const unsubscribeFromBuildSubjectUpdates = useAppContext(
    (v) => v.requestHelpers.unsubscribeFromBuildSubjectUpdates
  );
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );

  const loadBuildAiPromptsRef = useRef(loadBuildAiPrompts);
  const getAiEnergyPolicyRef = useRef(getAiEnergyPolicy);
  const callBuildRuntimeAiChatRef = useRef(callBuildRuntimeAiChat);
  const callBuildRuntimeAiImageRef = useRef(callBuildRuntimeAiImage);
  const loadBuildRuntimeAiImageStatusRef = useRef(
    loadBuildRuntimeAiImageStatus
  );
  const loadAIImageResultRef = useRef(loadAIImageResult);
  const callBuildRuntimeAiChatStreamRef = useRef(callBuildRuntimeAiChatStream);
  const callBuildRuntimeAiObjectRef = useRef(callBuildRuntimeAiObject);
  const getBuildTwinkleNewsRef = useRef(getBuildTwinkleNews);
  const listBuildTwinkleNewsEditionsRef = useRef(
    listBuildTwinkleNewsEditions
  );
  const getBuildTwinkleNewsEditionRef = useRef(getBuildTwinkleNewsEdition);
  const generateBuildTwinkleNewsRef = useRef(generateBuildTwinkleNews);
  const callBuildRuntimeCharacterChatRef = useRef(
    callBuildRuntimeCharacterChat
  );
  const callBuildRuntimeCharacterChatStreamRef = useRef(
    callBuildRuntimeCharacterChatStream
  );
  const listBuildArtifactsRef = useRef(listBuildArtifacts);
  const listBuildArtifactVersionsRef = useRef(listBuildArtifactVersions);
  const restoreBuildArtifactVersionRef = useRef(restoreBuildArtifactVersion);
  const queryViewerDbRef = useRef(queryViewerDb);
  const execViewerDbRef = useRef(execViewerDb);
  const getBuildApiTokenRef = useRef(getBuildApiToken);
  const getBuildApiUserRef = useRef(getBuildApiUser);
  const getBuildApiUsersRef = useRef(getBuildApiUsers);
  const getBuildDailyReflectionsRef = useRef(getBuildDailyReflections);
  const connectBuildAppMcpRuntimeRef = useRef(connectBuildAppMcpRuntime);
  const pollBuildAppMcpCallRef = useRef(pollBuildAppMcpCall);
  const completeBuildAppMcpCallRef = useRef(completeBuildAppMcpCall);
  const listBuildRuntimeFilesRef = useRef(listBuildRuntimeFiles);
  const deleteBuildRuntimeFileRef = useRef(deleteBuildRuntimeFile);
  const uploadBuildRuntimeFilesRef = useRef(uploadBuildRuntimeFiles);
  const getBuildMySubjectsRef = useRef(getBuildMySubjects);
  const searchBuildSubjectsRef = useRef(searchBuildSubjects);
  const listBuildAiCardsRef = useRef(listBuildAiCards);
  const searchBuildAiCardsRef = useRef(searchBuildAiCards);
  const getBuildAiCardRef = useRef(getBuildAiCard);
  const listBuildAiStoriesRef = useRef(listBuildAiStories);
  const listBuildAiStoryChaptersRef = useRef(listBuildAiStoryChapters);
  const searchBuildAiStoriesRef = useRef(searchBuildAiStories);
  const getBuildAiStoryRef = useRef(getBuildAiStory);
  const listBuildGrammarblesQuestionsRef = useRef(
    listBuildGrammarblesQuestions
  );
  const getBuildGrammarblesHistoryRef = useRef(getBuildGrammarblesHistory);
  const getBuildSubjectRef = useRef(getBuildSubject);
  const getBuildSubjectCommentsRef = useRef(getBuildSubjectComments);
  const listBuildSubjectCommentsRef = useRef(listBuildSubjectComments);
  const getBuildContentWriteStatusRef = useRef(getBuildContentWriteStatus);
  const createBuildContentSubjectRef = useRef(createBuildContentSubject);
  const editBuildContentSubjectRef = useRef(editBuildContentSubject);
  const createBuildContentCommentRef = useRef(createBuildContentComment);
  const editBuildContentCommentRef = useRef(editBuildContentComment);
  const getBuildProfileCommentsRef = useRef(getBuildProfileComments);
  const getBuildProfileCommentIdsRef = useRef(getBuildProfileCommentIds);
  const getBuildProfileCommentsByIdsRef = useRef(getBuildProfileCommentsByIds);
  const getBuildProfileCommentCountsRef = useRef(getBuildProfileCommentCounts);
  const getSharedDbTopicsRef = useRef(getSharedDbTopics);
  const createSharedDbTopicRef = useRef(createSharedDbTopic);
  const getSharedDbEntriesRef = useRef(getSharedDbEntries);
  const getSharedDbEntriesByIdsRef = useRef(getSharedDbEntriesByIds);
  const addSharedDbEntryRef = useRef(addSharedDbEntry);
  const addSharedDbEntriesRef = useRef(addSharedDbEntries);
  const updateSharedDbEntryRef = useRef(updateSharedDbEntry);
  const deleteSharedDbEntryRef = useRef(deleteSharedDbEntry);
  const deleteSharedDbEntriesRef = useRef(deleteSharedDbEntries);
  const claimSharedDbEntryRef = useRef(claimSharedDbEntry);
  const getSharedDbKvItemRef = useRef(getSharedDbKvItem);
  const listSharedDbKvItemsRef = useRef(listSharedDbKvItems);
  const setSharedDbKvItemsRef = useRef(setSharedDbKvItems);
  const deleteSharedDbKvItemRef = useRef(deleteSharedDbKvItem);
  const getBuildLeaderboardRef = useRef(getBuildLeaderboard);
  const submitBuildLeaderboardScoreRef = useRef(submitBuildLeaderboardScore);
  const listBuildChatRoomsRef = useRef(listBuildChatRooms);
  const createBuildChatRoomRef = useRef(createBuildChatRoom);
  const listBuildChatMessagesRef = useRef(listBuildChatMessages);
  const sendBuildChatMessageRef = useRef(sendBuildChatMessage);
  const deleteBuildRuntimeChatMessageRef = useRef(
    deleteBuildRuntimeChatMessage
  );
  const getPrivateDbItemRef = useRef(getPrivateDbItem);
  const listPrivateDbItemsRef = useRef(listPrivateDbItems);
  const setPrivateDbItemRef = useRef(setPrivateDbItem);
  const deletePrivateDbItemRef = useRef(deletePrivateDbItem);
  const listBuildRemindersRef = useRef(listBuildReminders);
  const createBuildReminderRef = useRef(createBuildReminder);
  const updateBuildReminderRef = useRef(updateBuildReminder);
  const deleteBuildReminderRef = useRef(deleteBuildReminder);
  const getDueBuildRemindersRef = useRef(getDueBuildReminders);
  const getBuildSubjectUpdateSubscriptionRef = useRef(
    getBuildSubjectUpdateSubscription
  );
  const getBuildNotificationSubscriptionRef = useRef(
    getBuildNotificationSubscription
  );
  const subscribeToBuildNotificationsRef = useRef(
    subscribeToBuildNotifications
  );
  const unsubscribeFromBuildNotificationsRef = useRef(
    unsubscribeFromBuildNotifications
  );
  const subscribeToBuildNotificationsBatchRef = useRef(
    subscribeToBuildNotificationsBatch
  );
  const unsubscribeFromBuildNotificationsBatchRef = useRef(
    unsubscribeFromBuildNotificationsBatch
  );
  const notifyBuildSubscribersRef = useRef(notifyBuildSubscribers);
  const subscribeToBuildSubjectUpdatesRef = useRef(
    subscribeToBuildSubjectUpdates
  );
  const unsubscribeFromBuildSubjectUpdatesRef = useRef(
    unsubscribeFromBuildSubjectUpdates
  );

  const previewRequestRefs = useRef<PreviewHostBridgeRequestRefs>({
    connectBuildAppMcpRuntimeRef,
    pollBuildAppMcpCallRef,
    completeBuildAppMcpCallRef,
    getAiEnergyPolicyRef,
    loadBuildAiPromptsRef,
    callBuildRuntimeAiChatRef,
    callBuildRuntimeAiImageRef,
    loadBuildRuntimeAiImageStatusRef,
    loadAIImageResultRef,
    callBuildRuntimeAiChatStreamRef,
    callBuildRuntimeAiObjectRef,
    getBuildTwinkleNewsRef,
    listBuildTwinkleNewsEditionsRef,
    getBuildTwinkleNewsEditionRef,
    generateBuildTwinkleNewsRef,
    callBuildRuntimeCharacterChatRef,
    callBuildRuntimeCharacterChatStreamRef,
    queryViewerDbRef,
    execViewerDbRef,
    getBuildApiUserRef,
    getBuildApiUsersRef,
    getBuildDailyReflectionsRef,
    listBuildRuntimeFilesRef,
    deleteBuildRuntimeFileRef,
    uploadBuildRuntimeFilesRef,
    getBuildMySubjectsRef,
    searchBuildSubjectsRef,
    listBuildAiCardsRef,
    searchBuildAiCardsRef,
    getBuildAiCardRef,
    listBuildAiStoriesRef,
    listBuildAiStoryChaptersRef,
    searchBuildAiStoriesRef,
    getBuildAiStoryRef,
    listBuildGrammarblesQuestionsRef,
    getBuildGrammarblesHistoryRef,
    getBuildSubjectRef,
    getBuildSubjectCommentsRef,
    listBuildSubjectCommentsRef,
    getBuildContentWriteStatusRef,
    createBuildContentSubjectRef,
    editBuildContentSubjectRef,
    createBuildContentCommentRef,
    editBuildContentCommentRef,
    getBuildProfileCommentsRef,
    getBuildProfileCommentIdsRef,
    getBuildProfileCommentsByIdsRef,
    getBuildProfileCommentCountsRef,
    getSharedDbTopicsRef,
    createSharedDbTopicRef,
    getSharedDbEntriesRef,
    getSharedDbEntriesByIdsRef,
    addSharedDbEntryRef,
    addSharedDbEntriesRef,
    updateSharedDbEntryRef,
    deleteSharedDbEntryRef,
    deleteSharedDbEntriesRef,
    claimSharedDbEntryRef,
    getSharedDbKvItemRef,
    listSharedDbKvItemsRef,
    setSharedDbKvItemsRef,
    deleteSharedDbKvItemRef,
    getBuildLeaderboardRef,
    submitBuildLeaderboardScoreRef,
    listBuildChatRoomsRef,
    createBuildChatRoomRef,
    listBuildChatMessagesRef,
    sendBuildChatMessageRef,
    deleteBuildRuntimeChatMessageRef,
    getPrivateDbItemRef,
    listPrivateDbItemsRef,
    setPrivateDbItemRef,
    deletePrivateDbItemRef,
    listBuildRemindersRef,
    createBuildReminderRef,
    updateBuildReminderRef,
    deleteBuildReminderRef,
    getDueBuildRemindersRef,
    getBuildSubjectUpdateSubscriptionRef,
    getBuildNotificationSubscriptionRef,
    subscribeToBuildNotificationsRef,
    unsubscribeFromBuildNotificationsRef,
    subscribeToBuildNotificationsBatchRef,
    unsubscribeFromBuildNotificationsBatchRef,
    notifyBuildSubscribersRef,
    subscribeToBuildSubjectUpdatesRef,
    unsubscribeFromBuildSubjectUpdatesRef
  }).current;

  return {
    captureBuildThumbnailPreview,
    deleteBuildRuntimeFileRef,
    downloadBuildProjectArchive,
    getBuildApiTokenRef,
    listBuildArtifactsRef,
    listBuildArtifactVersionsRef,
    listBuildRuntimeFilesRef,
    onOpenSigninModal,
    previewRequestRefs,
    restoreBuildArtifactVersionRef,
    uploadBuildRuntimeFilesRef
  };
}
