import { useRef } from 'react';
import { useAppContext } from '~/contexts';
import type { PreviewHostBridgeRequestRefs } from '../helpers/previewBridgeRequestRefs';

export default function useAppRequests() {
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
  const callBuildRuntimeAiChatStream = useAppContext(
    (v) => v.requestHelpers.callBuildRuntimeAiChatStream
  );
  const callBuildRuntimeAiObject = useAppContext(
    (v) => v.requestHelpers.callBuildRuntimeAiObject
  );
  const callBuildRuntimeCharacterChat = useAppContext(
    (v) => v.requestHelpers.callBuildRuntimeCharacterChat
  );
  const callBuildRuntimeCharacterChatStream = useAppContext(
    (v) => v.requestHelpers.callBuildRuntimeCharacterChatStream
  );
  const generateAIImage = useAppContext(
    (v) => v.requestHelpers.generateAIImage
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
  const addSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.addSharedDbEntry
  );
  const updateSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.updateSharedDbEntry
  );
  const deleteSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.deleteSharedDbEntry
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
  const callBuildRuntimeAiChatRef = useRef(callBuildRuntimeAiChat);
  const callBuildRuntimeAiChatStreamRef = useRef(callBuildRuntimeAiChatStream);
  const callBuildRuntimeAiObjectRef = useRef(callBuildRuntimeAiObject);
  const callBuildRuntimeCharacterChatRef = useRef(
    callBuildRuntimeCharacterChat
  );
  const callBuildRuntimeCharacterChatStreamRef = useRef(
    callBuildRuntimeCharacterChatStream
  );
  const generateAiImageRef = useRef(generateAIImage);
  const listBuildArtifactsRef = useRef(listBuildArtifacts);
  const listBuildArtifactVersionsRef = useRef(listBuildArtifactVersions);
  const restoreBuildArtifactVersionRef = useRef(restoreBuildArtifactVersion);
  const queryViewerDbRef = useRef(queryViewerDb);
  const execViewerDbRef = useRef(execViewerDb);
  const getBuildApiTokenRef = useRef(getBuildApiToken);
  const getBuildApiUserRef = useRef(getBuildApiUser);
  const getBuildApiUsersRef = useRef(getBuildApiUsers);
  const getBuildDailyReflectionsRef = useRef(getBuildDailyReflections);
  const listBuildRuntimeFilesRef = useRef(listBuildRuntimeFiles);
  const deleteBuildRuntimeFileRef = useRef(deleteBuildRuntimeFile);
  const uploadBuildRuntimeFilesRef = useRef(uploadBuildRuntimeFiles);
  const getBuildMySubjectsRef = useRef(getBuildMySubjects);
  const searchBuildSubjectsRef = useRef(searchBuildSubjects);
  const listBuildAiCardsRef = useRef(listBuildAiCards);
  const searchBuildAiCardsRef = useRef(searchBuildAiCards);
  const getBuildAiCardRef = useRef(getBuildAiCard);
  const listBuildAiStoriesRef = useRef(listBuildAiStories);
  const searchBuildAiStoriesRef = useRef(searchBuildAiStories);
  const getBuildAiStoryRef = useRef(getBuildAiStory);
  const listBuildGrammarblesQuestionsRef = useRef(
    listBuildGrammarblesQuestions
  );
  const getBuildGrammarblesHistoryRef = useRef(getBuildGrammarblesHistory);
  const getBuildSubjectRef = useRef(getBuildSubject);
  const getBuildSubjectCommentsRef = useRef(getBuildSubjectComments);
  const listBuildSubjectCommentsRef = useRef(listBuildSubjectComments);
  const getBuildProfileCommentsRef = useRef(getBuildProfileComments);
  const getBuildProfileCommentIdsRef = useRef(getBuildProfileCommentIds);
  const getBuildProfileCommentsByIdsRef = useRef(getBuildProfileCommentsByIds);
  const getBuildProfileCommentCountsRef = useRef(getBuildProfileCommentCounts);
  const getSharedDbTopicsRef = useRef(getSharedDbTopics);
  const createSharedDbTopicRef = useRef(createSharedDbTopic);
  const getSharedDbEntriesRef = useRef(getSharedDbEntries);
  const addSharedDbEntryRef = useRef(addSharedDbEntry);
  const updateSharedDbEntryRef = useRef(updateSharedDbEntry);
  const deleteSharedDbEntryRef = useRef(deleteSharedDbEntry);
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
    loadBuildAiPromptsRef,
    callBuildRuntimeAiChatRef,
    callBuildRuntimeAiChatStreamRef,
    callBuildRuntimeAiObjectRef,
    callBuildRuntimeCharacterChatRef,
    callBuildRuntimeCharacterChatStreamRef,
    generateAiImageRef,
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
    searchBuildAiStoriesRef,
    getBuildAiStoryRef,
    listBuildGrammarblesQuestionsRef,
    getBuildGrammarblesHistoryRef,
    getBuildSubjectRef,
    getBuildSubjectCommentsRef,
    listBuildSubjectCommentsRef,
    getBuildProfileCommentsRef,
    getBuildProfileCommentIdsRef,
    getBuildProfileCommentsByIdsRef,
    getBuildProfileCommentCountsRef,
    getSharedDbTopicsRef,
    createSharedDbTopicRef,
    getSharedDbEntriesRef,
    addSharedDbEntryRef,
    updateSharedDbEntryRef,
    deleteSharedDbEntryRef,
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
