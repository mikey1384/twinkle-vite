import { Dispatch } from '~/types';
import { getConfirmedAICardListingState } from '~/helpers/aiCardCanonicalUpdates';
import type {
  CanonicalChatChannelUnreadState,
  CanonicalChatFavoriteState,
  CanonicalChatReactionUpdate,
  CanonicalChatSidebarState,
  ChatNotificationSettings,
  ChatQuickAccessState
} from '~/types/chat';

let nextConfirmedChatEventSequence = 0;

function getNextConfirmedChatEventSequence() {
  nextConfirmedChatEventSequence += 1;
  return nextConfirmedChatEventSequence;
}

export default function ChatActions(dispatch: Dispatch) {
  return {
    onBumpChessThemeVersion() {
      return dispatch({ type: 'BUMP_CHESS_THEME_VERSION' });
    },
    onAddBookmarkedMessage({
      topicId,
      channelId,
      bookmark,
      view
    }: {
      topicId: number;
      channelId: number;
      bookmark: any;
      view: 'ai' | 'me';
    }) {
      return dispatch({
        type: 'ADD_BOOKMARKED_MESSAGE',
        topicId,
        channelId,
        bookmark,
        view
      });
    },
    onApplyAIGeneratedDefinitions({
      word,
      partOfSpeechOrder,
      partOfSpeeches
    }: {
      word: string;
      partOfSpeechOrder: string[];
      partOfSpeeches: string[];
    }) {
      return dispatch({
        type: 'APPLY_AI_GENERATED_DEFINITIONS',
        word,
        partOfSpeechOrder,
        partOfSpeeches
      });
    },
    onChangeAIThinkingStatus({
      channelId,
      status,
      messageId
    }: {
      channelId: number;
      status: string;
      messageId: number;
    }) {
      return dispatch({
        type: 'UPDATE_AI_THINKING_STATUS',
        channelId,
        status,
        messageId
      });
    },
    onUpdateAIThoughtStream({
      channelId,
      messageId,
      thoughtContent,
      isComplete,
      isThinkingHard,
      isDelta
    }: {
      channelId: number;
      messageId: number;
      thoughtContent: string;
      isComplete: boolean;
      isThinkingHard?: boolean;
      isDelta?: boolean;
    }) {
      return dispatch({
        type: 'UPDATE_AI_THOUGHT_STREAM',
        channelId,
        messageId,
        thoughtContent,
        isComplete,
        isThinkingHard,
        isDelta
      });
    },
    onUpdateAIGeneratedFile({
      channelId,
      messageId,
      fileName,
      filePath,
      fileSize
    }: {
      channelId: number;
      messageId: number;
      fileName: string;
      filePath: string;
      fileSize: number;
    }) {
      return dispatch({
        type: 'UPDATE_AI_GENERATED_FILE',
        channelId,
        messageId,
        fileName,
        filePath,
        fileSize
      });
    },
    onUpdateBuildCollaborationState({
      invite,
      inviteId,
      inviteStatus,
      request,
      requestId,
      requestStatus,
      eventTimeMs,
      timeStamp
    }: {
      invite?: Record<string, any> | null;
      inviteId?: number;
      inviteStatus?: 'pending' | 'accepted' | 'declined' | 'revoked' | 'left';
      request?: Record<string, any> | null;
      requestId?: number;
      requestStatus?:
        'pending' | 'invited' | 'accepted' | 'rejected' | 'canceled';
      eventTimeMs?: number;
      timeStamp?: number;
    }) {
      return dispatch({
        type: 'UPDATE_BUILD_COLLABORATION_STATE',
        invite,
        inviteId,
        inviteStatus,
        request,
        requestId,
        requestStatus,
        eventTimeMs,
        timeStamp
      });
    },
    onUpdateBuildContributionMembership({
      active,
      buildId,
      eventTimeMs,
      membership,
      timeStamp,
      userId
    }: {
      active?: boolean;
      buildId: number;
      eventTimeMs?: number;
      membership?: Record<string, any> | null;
      timeStamp?: number;
      userId: number;
    }) {
      return dispatch({
        type: 'UPDATE_BUILD_CONTRIBUTION_MEMBERSHIP',
        active,
        buildId,
        eventTimeMs,
        membership,
        timeStamp,
        userId
      });
    },
    onUpdateBuildThumbnailSuggestionState({
      rootBuildId,
      build,
      adoptedFromThumbnailUrl,
      eventTimeMs
    }: {
      rootBuildId: number;
      build: Record<string, any>;
      adoptedFromThumbnailUrl?: string;
      eventTimeMs?: number;
    }) {
      return dispatch({
        type: 'UPDATE_BUILD_THUMBNAIL_SUGGESTION_STATE',
        rootBuildId,
        build,
        adoptedFromThumbnailUrl,
        eventTimeMs
      });
    },
    onUpdateBuildContributionSubmissionState({
      branchBuildId,
      rootBuildId,
      build,
      contribution,
      lumineFix,
      eventTimeMs
    }: {
      branchBuildId: number;
      rootBuildId: number;
      build?: Record<string, any> | null;
      contribution?: Record<string, any> | null;
      lumineFix?: Record<string, any> | null;
      eventTimeMs: number;
    }) {
      return dispatch({
        type: 'UPDATE_BUILD_CONTRIBUTION_SUBMISSION_STATE',
        branchBuildId,
        rootBuildId,
        build,
        contribution,
        lumineFix,
        eventTimeMs
      });
    },
    onDeleteAIChatFile({
      channelId,
      topicId,
      fileId
    }: {
      channelId: number;
      topicId: number;
      fileId: number;
    }) {
      return dispatch({
        type: 'DELETE_AI_CHAT_FILE',
        channelId,
        topicId,
        fileId
      });
    },
    onLoadMoreAIChatFiles({
      channelId,
      topicId,
      files,
      fileDataObj
    }: {
      channelId: number;
      topicId: number;
      files: any[];
      fileDataObj: any;
    }) {
      return dispatch({
        type: 'LOAD_MORE_AI_CHAT_FILES',
        channelId,
        topicId,
        files,
        fileDataObj
      });
    },
    onUpdateLastUsedFiles({
      channelId,
      topicId,
      files
    }: {
      channelId: number;
      topicId: number;
      files: any[];
    }) {
      return dispatch({
        type: 'UPDATE_LAST_USED_FILES',
        channelId,
        topicId,
        files
      });
    },
    onRemoveBookmarkedMessage({
      topicId,
      channelId,
      messageId,
      view
    }: {
      channelId: number;
      topicId: number;
      messageId: number;
      view: 'ai' | 'me';
    }) {
      return dispatch({
        type: 'REMOVE_BOOKMARKED_MESSAGE',
        topicId,
        channelId,
        messageId,
        view
      });
    },
    onApplyCanonicalChatReaction({
      update,
      ownerUserId,
      pageVisible = false,
      usingChat = false,
      shouldTrackUnreadActivity = false
    }: {
      update: CanonicalChatReactionUpdate;
      // The account that issued the request or owns the socket session. This
      // is deliberately separate from update.userId, which is the reactor.
      ownerUserId: number;
      pageVisible?: boolean;
      usingChat?: boolean;
      shouldTrackUnreadActivity?: boolean;
    }) {
      return dispatch({
        type: 'APPLY_CANONICAL_CHAT_REACTION',
        update,
        ownerUserId,
        pageVisible,
        usingChat,
        shouldTrackUnreadActivity,
        eventSequence: getNextConfirmedChatEventSequence()
      });
    },
    onApplyCanonicalChannelUnreadState({
      unreadState,
      userId
    }: {
      unreadState: CanonicalChatChannelUnreadState;
      // The account that issued the request or owns the socket session,
      // captured at request start. The reducer rejects snapshots owned by an
      // account other than the one the provider currently hosts.
      userId: number;
    }) {
      return dispatch({
        type: 'APPLY_CANONICAL_CHANNEL_UNREAD_STATE',
        unreadState,
        userId,
        eventSequence: getNextConfirmedChatEventSequence()
      });
    },
    onAICardOfferWithdrawal(feedId: number) {
      return dispatch({
        type: 'AI_CARD_OFFER_WITHDRAWAL',
        feedId
      });
    },
    onUpdateAICardOfferNoticeStatus({
      offerId,
      status
    }: {
      offerId: number;
      status: 'accepted' | 'withdrawn';
    }) {
      return dispatch({
        type: 'UPDATE_AI_CARD_OFFER_NOTICE_STATUS',
        offerId,
        status
      });
    },
    onCallReceptionConfirm(channelId: number) {
      return dispatch({
        type: 'CONFIRM_CALL_RECEPTION',
        channelId
      });
    },
    onChangeOnlineStatus({
      userId,
      member = {},
      isOnline,
      lastActive
    }: {
      userId: number;
      member?: object;
      isOnline: boolean;
      lastActive?: number;
    }) {
      return dispatch({
        type: 'CHANGE_ONLINE_STATUS',
        userId,
        member,
        isOnline,
        lastActive
      });
    },
    onChangeAwayStatus({
      userId,
      isAway
    }: {
      userId: number;
      isAway: boolean;
    }) {
      return dispatch({
        type: 'CHANGE_AWAY_STATUS',
        userId,
        isAway
      });
    },
    onChangeBusyStatus({
      userId,
      isBusy
    }: {
      userId: number;
      isBusy: boolean;
    }) {
      return dispatch({
        type: 'CHANGE_BUSY_STATUS',
        userId,
        isBusy
      });
    },
    onChangeChannelOwner({
      channelId,
      creatorId,
      message,
      newOwner
    }: {
      channelId: number;
      creatorId: number;
      message?: any;
      newOwner: any;
    }) {
      return dispatch({
        type: 'CHANGE_CHANNEL_OWNER',
        channelId,
        creatorId,
        message: message
          ? {
              ...message,
              notificationType: 'owner_change',
              newOwner
            }
          : null,
        newOwner
      });
    },
    onChangeTopicSettings({
      channelId,
      topicId,
      topicTitle,
      isOwnerPostingOnly,
      customInstructions
    }: {
      channelId: number;
      topicId: number;
      topicTitle: string;
      isOwnerPostingOnly: boolean;
      customInstructions?: string;
    }) {
      return dispatch({
        type: 'CHANGE_TOPIC_SETTINGS',
        channelId,
        topicId,
        topicTitle,
        isOwnerPostingOnly,
        customInstructions
      });
    },
    onChangeChannelSettings({
      canChangeSubject,
      channelId,
      channelName,
      description,
      isClosed,
      isOwnerPostingOnly,
      isPublic,
      theme,
      thumbPath
    }: {
      canChangeSubject: boolean;
      channelId: number;
      channelName: string;
      description: string;
      isClosed: boolean;
      isPublic: boolean;
      isOwnerPostingOnly: boolean;
      theme?: string | null;
      thumbPath: string;
    }) {
      return dispatch({
        type: 'CHANGE_CHANNEL_SETTINGS',
        canChangeSubject,
        channelId,
        channelName,
        description,
        isClosed,
        isPublic,
        isOwnerPostingOnly,
        theme,
        thumbPath
      });
    },
    onChangeChatSubject({
      subject,
      topicObj,
      channelId,
      subchannelId,
      isFeatured
    }: {
      subject: object;
      topicObj: object;
      channelId: number;
      subchannelId: number;
      isFeatured: boolean;
    }) {
      return dispatch({
        type: 'CHANGE_SUBJECT',
        topicObj,
        subject,
        channelId,
        subchannelId,
        isFeatured
      });
    },
    onClearRecentChessMessage(channelId: number) {
      return dispatch({
        type: 'CLEAR_RECENT_CHESS_MESSAGE',
        channelId
      });
    },
    onClearChatSearchResults() {
      return dispatch({
        type: 'CLEAR_CHAT_SEARCH_RESULTS'
      });
    },
    onClearSubjectSearchResults() {
      return dispatch({
        type: 'CLEAR_SUBJECT_SEARCH_RESULTS'
      });
    },
    onClearUserSearchResults() {
      return dispatch({
        type: 'CLEAR_USER_SEARCH_RESULTS'
      });
    },
    onCreateNewChannel({
      userId,
      ...data
    }: {
      userId: number;
      [key: string]: any;
    }) {
      return dispatch({
        type: 'CREATE_NEW_CHANNEL',
        data,
        userId
      });
    },
    onDeleteMessage({
      messageId,
      channelId,
      subchannelId,
      topicId
    }: {
      messageId: number;
      channelId: number;
      subchannelId: number;
      topicId: number;
    }) {
      return dispatch({
        type: 'DELETE_MESSAGE',
        channelId,
        messageId,
        subchannelId,
        topicId,
        eventSequence: getNextConfirmedChatEventSequence()
      });
    },
    onDisplayAttachedFile({
      id,
      channelId,
      chessState,
      filePath,
      fileSize,
      userId,
      username,
      profilePicUrl,
      subchannelId,
      uploaderLevel,
      thumbUrl
    }: {
      id: number;
      channelId: number;
      chessState: object;
      filePath: string;
      fileSize: number;
      userId: number;
      username: string;
      profilePicUrl: string;
      subchannelId: number;
      uploaderLevel: number;
      thumbUrl: string;
    }) {
      return dispatch({
        type: 'DISPLAY_ATTACHED_FILE',
        messageId: id,
        channelId,
        subchannelId,
        filePath,
        fileInfo: {
          userId,
          username,
          chessState,
          profilePicUrl,
          uploaderLevel,
          fileSize,
          thumbUrl
        }
      });
    },
    onSetChatAttachmentThumbUrl({
      channelId,
      subchannelId,
      messageId,
      thumbUrl
    }: {
      channelId: number;
      subchannelId: number;
      messageId: number;
      thumbUrl: string;
    }) {
      return dispatch({
        type: 'SET_CHAT_ATTACHMENT_THUMB_URL',
        channelId,
        subchannelId,
        messageId,
        thumbUrl
      });
    },
    onEditChannelSettings({
      channelName,
      description,
      isClosed,
      isPublic,
      isOwnerPostingOnly,
      channelId,
      canChangeSubject,
      theme,
      newThumbPath
    }: {
      channelName: string;
      description: string;
      isClosed: boolean;
      isPublic: boolean;
      isOwnerPostingOnly: boolean;
      channelId: number;
      canChangeSubject: boolean;
      theme: string;
      newThumbPath: string;
    }) {
      return dispatch({
        type: 'EDIT_CHANNEL_SETTINGS',
        canChangeSubject,
        channelName,
        description,
        isClosed,
        isOwnerPostingOnly,
        isPublic,
        channelId,
        theme,
        thumbPath: newThumbPath
      });
    },
    onEditMessage({
      editedMessage,
      channelId,
      messageId,
      isSubject,
      isAIEdited,
      subchannelId,
      subjectChanged
    }: {
      editedMessage: string;
      channelId: number;
      messageId: number;
      isSubject: boolean;
      isAIEdited?: boolean;
      subchannelId: number;
      subjectChanged: boolean;
    }) {
      return dispatch({
        type: 'EDIT_MESSAGE',
        channelId,
        editedMessage,
        messageId,
        isSubject,
        isAIEdited,
        subchannelId,
        subjectChanged
      });
    },
    onAppendAIMessageDelta({
      channelId,
      messageId,
      delta
    }: {
      channelId: number;
      messageId: number;
      delta: string;
    }) {
      return dispatch({
        type: 'APPEND_AI_MESSAGE_DELTA',
        channelId,
        messageId,
        delta
      });
    },
    onApplyCanonicalAIMessageFailure({
      channelId,
      messageId,
      settings
    }: {
      channelId: number;
      messageId: number;
      settings: Record<string, unknown>;
    }) {
      return dispatch({
        type: 'APPLY_CANONICAL_AI_MESSAGE_FAILURE',
        channelId,
        messageId,
        settings
      });
    },
    onEditWord({
      deletedDefIds,
      partOfSpeeches,
      editedDefinitionOrder,
      word
    }: {
      deletedDefIds: number[];
      partOfSpeeches: string[];
      editedDefinitionOrder: number[];
      word: string;
    }) {
      return dispatch({
        type: 'EDIT_WORD',
        deletedDefIds,
        partOfSpeeches,
        editedDefinitionOrder,
        word
      });
    },
    onEnableChatSubject({
      channelId,
      topic
    }: {
      channelId: number;
      topic: object;
    }) {
      return dispatch({
        type: 'ENABLE_CHAT_SUBJECT',
        channelId,
        topic
      });
    },
    onEnterChannelWithId({ data, userId }: { data: object; userId: number }) {
      return dispatch({
        type: 'ENTER_CHANNEL',
        data,
        userId
      });
    },
    onEnterTopic({
      channelId,
      topicId,
      direction
    }: {
      channelId: number;
      topicId: number;
      direction: string;
    }) {
      return dispatch({
        type: 'ENTER_TOPIC',
        channelId,
        topicId,
        direction
      });
    },
    onEnterEmptyChat() {
      return dispatch({
        type: 'ENTER_EMPTY_CHAT'
      });
    },
    onFeatureTopic({ channelId, topic }: { channelId: number; topic: object }) {
      return dispatch({
        type: 'FEATURE_TOPIC',
        channelId,
        topic
      });
    },
    onLoadAICardFeed({ feed }: { feed: object; card: object }) {
      return dispatch({
        type: 'LOAD_AI_CARD_FEED',
        feed
      });
    },
    onPinTopic({
      channelId,
      topicId,
      pinnedTopicIds
    }: {
      channelId: number;
      topicId: number;
      pinnedTopicIds: number[];
    }) {
      return dispatch({
        type: 'PIN_TOPIC',
        channelId,
        topicId,
        pinnedTopicIds
      });
    },
    onGetNumberOfUnreadMessages(numUnreads: number) {
      return dispatch({
        type: 'GET_NUM_UNREAD_MSGS',
        numUnreads
      });
    },
    onHangUp({
      iHungUp,
      memberId,
      peerId
    }: {
      iHungUp: boolean;
      memberId: number;
      peerId: string;
    }) {
      return dispatch({
        type: 'HANG_UP',
        memberId,
        iHungUp,
        peerId
      });
    },
    onHideAttachment({
      messageId,
      channelId,
      subchannelId
    }: {
      messageId: number;
      channelId: number;
      subchannelId: number;
    }) {
      return dispatch({
        type: 'HIDE_ATTACHMENT',
        channelId,
        messageId,
        subchannelId
      });
    },
    onInitChat({
      data,
      userId,
      bootstrapId,
      preserveSelectedProjection = false
    }: {
      data: object;
      userId: number;
      bootstrapId?: string;
      preserveSelectedProjection?: boolean;
    }) {
      return dispatch({
        type: 'INIT_CHAT',
        data,
        userId,
        bootstrapId,
        preserveSelectedProjection
      });
    },
    onRecoverSelectedChannel({
      channelData,
      subjectData,
      topicData,
      userId
    }: {
      channelData: object;
      subjectData?: object | null;
      topicData?: {
        channelId: number;
        topicId: number;
        messages: object[];
        messagesHydrated?: boolean;
        topicObj: object;
        loadMoreShown: boolean;
        loadMoreShownAtBottom: boolean;
      } | null;
      userId: number;
    }) {
      return dispatch({
        type: 'RECOVER_SELECTED_CHANNEL',
        channelData,
        subjectData,
        topicData,
        userId
      });
    },
    onStartChatBootstrap({
      bootstrapId,
      userId,
      startedAt
    }: {
      bootstrapId: string;
      userId: number;
      startedAt: number;
    }) {
      return dispatch({
        type: 'START_CHAT_BOOTSTRAP',
        bootstrapId,
        userId,
        startedAt
      });
    },
    onFinishChatBootstrap(bootstrapId: string) {
      return dispatch({ type: 'FINISH_CHAT_BOOTSTRAP', bootstrapId });
    },
    onInviteUsersToChannel(data: object) {
      return dispatch({
        type: 'INVITE_USERS_TO_CHANNEL',
        data
      });
    },
    onLeaveChannel({
      channelId,
      userId,
      favoriteState
    }: {
      channelId: number;
      userId: number;
      favoriteState?: CanonicalChatFavoriteState;
    }) {
      return dispatch({
        type: 'LEAVE_CHANNEL',
        channelId,
        userId,
        favoriteState
      });
    },
    onRemoveMemberFromChannel({
      channelId,
      memberId
    }: {
      channelId: number;
      memberId: number;
    }) {
      return dispatch({
        type: 'REMOVE_MEMBER_FROM_CHANNEL',
        channelId,
        memberId
      });
    },
    onDelistAICard(cardId: number) {
      return dispatch({
        type: 'DELIST_AI_CARD',
        cardId
      });
    },
    onListAICard({ card }: { card: object }) {
      return dispatch({
        type: 'LIST_AI_CARD',
        card,
        newState: getConfirmedAICardListingState(card)
      });
    },
    onLoadTopicMessages({
      channelId,
      topicId,
      messages,
      messagesHydrated,
      topicObj,
      loadMoreShown,
      loadMoreShownAtBottom
    }: {
      channelId: number;
      topicId: number;
      messages: object[];
      messagesHydrated?: boolean;
      topicObj: object;
      loadMoreShown: boolean;
      loadMoreShownAtBottom: boolean;
    }) {
      return dispatch({
        type: 'LOAD_TOPIC_MESSAGES',
        channelId,
        topicId,
        messages,
        messagesHydrated,
        topicObj,
        loadMoreShown,
        loadMoreShownAtBottom
      });
    },
    onLoadMoreTopicMessages({
      channelId,
      topicId,
      messages,
      messagesHydrated,
      topicObj,
      loadMoreShown
    }: {
      channelId: number;
      topicId: number;
      messages: object[];
      messagesHydrated?: boolean;
      topicObj: object;
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_TOPIC_MESSAGES',
        channelId,
        topicId,
        messages,
        messagesHydrated,
        topicObj,
        loadMoreShown
      });
    },
    onLoadMoreRecentTopicMessages({
      channelId,
      messages,
      topicId,
      loadMoreShownAtBottom
    }: {
      channelId: number;
      messages: object[];
      topicId: number;
      loadMoreShownAtBottom: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_RECENT_TOPIC_MESSAGES',
        channelId,
        topicId,
        messages,
        loadMoreShownAtBottom
      });
    },
    onLoadMoreChannelMembers({
      channelId,
      members,
      loadMoreShown
    }: {
      channelId: number;
      members: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_CHANNEL_MEMBERS',
        channelId,
        members,
        loadMoreShown
      });
    },
    onAddListedAICard(card: object) {
      return dispatch({
        type: 'ADD_LISTED_AI_CARD',
        card,
        newState: getConfirmedAICardListingState(card)
      });
    },
    onAddMyAICard(card: object) {
      return dispatch({
        type: 'ADD_MY_AI_CARD',
        card
      });
    },
    onApplyAICardDirectTransfer({
      card,
      newState,
      userId
    }: {
      card: object;
      newState: object;
      userId: number | string | null;
    }) {
      return dispatch({
        type: 'APPLY_AI_CARD_DIRECT_TRANSFER',
        card,
        newState,
        userId
      });
    },
    onRemoveListedAICard(cardId: number) {
      return dispatch({
        type: 'REMOVE_LISTED_AI_CARD',
        cardId
      });
    },
    onRemoveMyAICard(cardId: number) {
      return dispatch({
        type: 'REMOVE_MY_AI_CARD',
        cardId
      });
    },
    onLoadChatSubject(data: object) {
      return dispatch({
        type: 'LOAD_SUBJECT',
        data
      });
    },
    onLoadMoreBookmarks({
      channelId,
      topicId,
      bookmarks,
      loadMoreShown,
      view
    }: {
      channelId: number;
      topicId: number;
      bookmarks: object[];
      loadMoreShown: boolean;
      view: 'ai' | 'me';
    }) {
      return dispatch({
        type: 'LOAD_MORE_BOOKMARKS',
        channelId,
        topicId,
        bookmarks,
        loadMoreShown,
        view
      });
    },
    onLoadTopicBookmarks({
      channelId,
      topicId,
      bookmarkedMessages,
      loadMoreBookmarksShown
    }: {
      channelId: number;
      topicId: number;
      bookmarkedMessages: { ai: object[]; me: object[] };
      loadMoreBookmarksShown: { ai: boolean; me: boolean };
    }) {
      return dispatch({
        type: 'LOAD_TOPIC_BOOKMARKS',
        channelId,
        topicId,
        bookmarkedMessages,
        loadMoreBookmarksShown
      });
    },
    onLoadMoreChannels({
      type,
      channels
    }: {
      type: string;
      channels: object[];
    }) {
      return dispatch({
        type: 'LOAD_MORE_CHANNELS',
        channelType: type,
        channels
      });
    },
    onLoadMoreMessages({
      messageIds,
      messagesObj,
      loadedChannelId,
      loadedSubchannelId
    }: {
      messageIds: number[];
      messagesObj: object;
      loadedChannelId: number;
      loadedSubchannelId: number;
    }) {
      return dispatch({
        type: 'LOAD_MORE_MESSAGES',
        messageIds,
        messagesObj,
        loadedChannelId,
        loadedSubchannelId
      });
    },
    onLoadAICardChat({
      cardFeeds,
      cardObj,
      loadMoreShown,
      mostRecentOfferTimeStamp,
      numCardSummonedToday
    }: {
      cardFeeds: object[];
      cardObj: object;
      loadMoreShown: boolean;
      mostRecentOfferTimeStamp: number;
      numCardSummonedToday: number;
    }) {
      return dispatch({
        type: 'LOAD_AI_CARD_CHAT',
        cardFeeds,
        cardObj,
        loadMoreShown,
        mostRecentOfferTimeStamp,
        numCardSummonedToday
      });
    },
    onLoadMoreAICards({
      cardFeeds,
      cardObj,
      loadMoreShown
    }: {
      cardFeeds: object[];
      cardObj: object;
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_AI_CARDS',
        cardFeeds,
        cardObj,
        loadMoreShown
      });
    },
    onLoadVocabRankings({
      collectorRankings,
      monthlyVocabRankings,
      yearlyVocabRankings
    }: {
      collectorRankings: object[];
      monthlyVocabRankings: object;
      yearlyVocabRankings: object;
    }) {
      return dispatch({
        type: 'LOAD_VOCAB_RANKINGS',
        collectorRankings,
        monthlyVocabRankings,
        yearlyVocabRankings
      });
    },
    onLoadIncomingOffers({
      offers,
      loadMoreShown
    }: {
      offers: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_INCOMING_OFFERS',
        offers,
        loadMoreShown
      });
    },
    onLoadOutgoingOffers({
      offers,
      loadMoreShown
    }: {
      offers: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_OUTGOING_OFFERS',
        offers,
        loadMoreShown
      });
    },
    onLoadMoreIncomingOffers({
      offers,
      loadMoreShown
    }: {
      offers: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_INCOMING_OFFERS',
        offers,
        loadMoreShown
      });
    },
    onLoadMoreOutgoingOffers({
      offers,
      loadMoreShown
    }: {
      offers: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_OUTGOING_OFFERS',
        offers,
        loadMoreShown
      });
    },
    onLoadListedAICards({
      cards,
      loadMoreShown
    }: {
      cards: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_LISTED_AI_CARDS',
        cards,
        loadMoreShown
      });
    },
    onLoadMoreListedAICards({
      cards,
      loadMoreShown
    }: {
      cards: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_LISTED_AI_CARDS',
        cards,
        loadMoreShown
      });
    },
    onLoadMyAICards({
      cards,
      loadMoreShown
    }: {
      cards: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MY_AI_CARDS',
        cards,
        loadMoreShown
      });
    },
    onLoadMoreMyAICards({
      cards,
      loadMoreShown
    }: {
      cards: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_MY_AI_CARDS',
        cards,
        loadMoreShown
      });
    },
    onLoadMyListedAICards({
      cards,
      loadMoreShown
    }: {
      cards: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MY_LISTED_AI_CARDS',
        cards,
        loadMoreShown
      });
    },
    onLoadMoreMyListedAICards({
      cards,
      loadMoreShown
    }: {
      cards: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_MY_LISTED_AI_CARDS',
        cards,
        loadMoreShown
      });
    },
    onPostAICardFeed({
      feed,
      isSummon,
      card
    }: {
      feed: object;
      isSummon: boolean;
      card: object;
    }) {
      return dispatch({
        type: 'POST_AI_CARD_FEED',
        isSummon,
        feed,
        card
      });
    },
    onLoadVocabulary({
      vocabFeeds,
      wordsObj,
      collectorRankings,
      monthlyVocabRankings,
      yearlyVocabRankings,
      currentYear,
      currentMonth
    }: {
      vocabFeeds: object[];
      wordsObj: object;
      collectorRankings: object;
      monthlyVocabRankings: object;
      yearlyVocabRankings: object;
      currentYear: number;
      currentMonth: number;
    }) {
      return dispatch({
        type: 'LOAD_VOCABULARY',
        vocabFeeds,
        wordsObj,
        collectorRankings,
        monthlyVocabRankings,
        yearlyVocabRankings,
        currentYear,
        currentMonth
      });
    },
    onLoadMoreVocabulary({
      vocabFeeds,
      wordsObj
    }: {
      vocabFeeds: object[];
      wordsObj: object;
    }) {
      return dispatch({
        type: 'LOAD_MORE_VOCABULARY',
        vocabFeeds,
        wordsObj
      });
    },
    onNotifyThatMemberLeftChannel({
      channelId,
      userId,
      username,
      profilePicUrl
    }: {
      channelId: number;
      userId: number;
      username: string;
      profilePicUrl: string;
    }) {
      return dispatch({
        type: 'NOTIFY_MEMBER_LEFT',
        channelId,
        userId,
        username,
        profilePicUrl
      });
    },
    onApplyCanonicalGroupMemberJoin({
      channelId,
      member
    }: {
      channelId: number;
      member: any;
    }) {
      return dispatch({
        type: 'APPLY_CANONICAL_GROUP_MEMBER_JOIN',
        channelId,
        member
      });
    },
    onOpenNewChatTab({ user, recipient }: { user: object; recipient: object }) {
      return dispatch({
        type: 'OPEN_NEW_TAB',
        user,
        recipient
      });
    },
    onRemoveFileUploadStatus({
      channelId,
      subchannelId,
      filePath
    }: {
      channelId: number;
      subchannelId: number;
      filePath: string;
    }) {
      return dispatch({
        type: 'REMOVE_FILE_UPLOAD_STATUS',
        channelId,
        subchannelId,
        filePath
      });
    },
    onRemoveTempMessage({
      channelId,
      subchannelId,
      tempMessageId,
      topicId
    }: {
      channelId: number;
      subchannelId?: number;
      tempMessageId: number | string;
      topicId?: number;
    }) {
      return dispatch({
        type: 'REMOVE_TEMP_MESSAGE',
        channelId,
        subchannelId,
        tempMessageId,
        topicId
      });
    },
    onPostFileUploadStatus({
      channelId,
      content,
      fileName,
      filePath,
      fileToUpload,
      subchannelId
    }: {
      channelId: number;
      content: string;
      fileName: string;
      filePath: string;
      fileToUpload: object;
      subchannelId: number;
    }) {
      return dispatch({
        type: 'POST_FILE_UPLOAD_STATUS',
        channelId,
        subchannelId,
        file: {
          content,
          fileName,
          filePath,
          fileToUpload
        }
      });
    },
    onPostUploadComplete({
      channelId,
      subchannelId,
      tempMessageId,
      messageId,
      path,
      result,
      topicId
    }: {
      channelId: number;
      subchannelId: number;
      tempMessageId: number;
      messageId: number;
      path: string;
      result: object;
      topicId: number;
    }) {
      return dispatch({
        type: 'POST_UPLOAD_COMPLETE',
        tempMessageId,
        subchannelId,
        channelId,
        messageId,
        path,
        result,
        topicId
      });
    },
    onReceiveMessage({
      pageVisible,
      message,
      newMembers = [],
      usingChat,
      currentSubchannelId = 0,
      isMyMessage = false
    }: {
      pageVisible: boolean;
      message: object;
      newMembers: object[];
      usingChat: boolean;
      currentSubchannelId?: number;
      isMyMessage?: boolean;
    }) {
      return dispatch({
        type: 'RECEIVE_MESSAGE',
        currentSubchannelId,
        usingChat,
        pageVisible,
        message,
        isMyMessage,
        eventSequence: getNextConfirmedChatEventSequence(),
        newMembers
      });
    },
    onReceiveFirstMsg({
      message,
      members,
      isClass,
      isTwoPeople,
      isDuplicate,
      pageVisible,
      pathId,
      quickAccess,
      userId
    }: {
      message: object;
      members: object[];
      isClass: boolean;
      isTwoPeople: boolean;
      isDuplicate: boolean;
      pageVisible: boolean;
      pathId: number;
      quickAccess?: ChatQuickAccessState;
      userId: number;
    }) {
      return dispatch({
        type: 'RECEIVE_FIRST_MSG',
        message,
        members,
        isDuplicate,
        isClass,
        isTwoPeople,
        pageVisible,
        pathId,
        quickAccess,
        userId,
        eventSequence: getNextConfirmedChatEventSequence()
      });
    },
    onReceiveMessageOnDifferentChannel({
      message,
      channel,
      pageVisible,
      usingChat,
      isMyMessage = false,
      newMembers = []
    }: {
      message: object;
      channel: object;
      pageVisible: boolean;
      usingChat: boolean;
      isMyMessage?: boolean;
      newMembers: object[];
    }) {
      return dispatch({
        type: 'RECEIVE_MSG_ON_DIFF_CHANNEL',
        message,
        channel,
        pageVisible,
        usingChat,
        isMyMessage,
        newMembers,
        eventSequence: getNextConfirmedChatEventSequence()
      });
    },
    onNewAICardSummon({ card, feed }: { card: object; feed: object }) {
      return dispatch({
        type: 'RECEIVE_AI_CARD_SUMMON',
        card,
        feed
      });
    },
    onPostVocabFeed({
      feed,
      isMyFeed,
      currentYear,
      currentMonth
    }: {
      feed: object;
      isMyFeed: boolean;
      currentYear: number;
      currentMonth: number;
    }) {
      return dispatch({
        type: 'POST_VOCAB_FEED',
        feed,
        isMyFeed,
        currentYear,
        currentMonth
      });
    },
    onReloadChatSubject({
      channelId,
      subchannelId,
      subject,
      message
    }: {
      channelId: number;
      subchannelId: number;
      subject: string;
      message: object;
    }) {
      return dispatch({
        type: 'RELOAD_SUBJECT',
        channelId,
        subchannelId,
        subject,
        message
      });
    },
    onRemoveNewLogState(logId: string) {
      return dispatch({
        type: 'REMOVE_NEW_LOG_STATE',
        logId
      });
    },
    onResetChat(userId: number) {
      return dispatch({
        type: 'RESET_CHAT',
        userId
      });
    },
    onSaveMessage({
      index,
      messageId,
      channelId,
      subchannelId,
      timeStamp,
      topicId,
      tempMessageId
    }: {
      index: number;
      messageId: number;
      channelId: number;
      subchannelId: number;
      timeStamp: number;
      topicId: number;
      tempMessageId: string;
    }) {
      return dispatch({
        type: 'ADD_ID_TO_NEW_MESSAGE',
        channelId,
        messageIndex: index,
        messageId,
        subchannelId,
        topicId,
        timeStamp,
        tempMessageId
      });
    },
    onSearchChat(data: object) {
      return dispatch({
        type: 'SEARCH',
        data
      });
    },
    onSeachChatMessages({
      channelId,
      topicId,
      messageIds,
      messagesObj,
      loadMoreShown
    }: {
      channelId: number;
      topicId: number;
      messageIds: number[];
      messagesObj: object;
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'SEARCH_MESSAGES',
        channelId,
        topicId,
        messageIds,
        messagesObj,
        loadMoreShown
      });
    },
    onLoadMoreSearchedMessages({
      channelId,
      topicId,
      messageIds,
      messagesObj,
      loadMoreShown
    }: {
      channelId: number;
      topicId: number;
      messageIds: number[];
      messagesObj: object;
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_SEARCHED_MESSAGES',
        channelId,
        topicId,
        messageIds,
        messagesObj,
        loadMoreShown
      });
    },
    onSearchChatSubject(data: object) {
      return dispatch({
        type: 'SEARCH_SUBJECTS',
        data
      });
    },
    onSearchUserToInvite(data: object) {
      return dispatch({
        type: 'SEARCH_USERS_FOR_CHANNEL',
        data
      });
    },
    onSelectChatTab(selectedChatTab: string) {
      return dispatch({
        type: 'SELECT_CHAT_TAB',
        selectedChatTab
      });
    },
    onSetIsSearchActive({
      channelId,
      isActive,
      isToggle
    }: {
      channelId: number;
      isActive?: boolean;
      isToggle?: boolean;
    }) {
      return dispatch({
        type: 'SET_IS_SEARCH_ACTIVE',
        channelId,
        isActive,
        isToggle
      });
    },
    onCreateNewDMChannel({
      channel,
      message,
      quickAccess,
      userId,
      withoutMessage
    }: {
      channel: object;
      message: object;
      quickAccess?: ChatQuickAccessState;
      userId: number;
      withoutMessage?: boolean;
    }) {
      return dispatch({
        type: 'CREATE_NEW_DM_CHANNEL',
        channel,
        message,
        quickAccess,
        userId,
        withoutMessage
      });
    },
    onSetCall({
      channelId,
      imCalling
    }: {
      channelId: number;
      imCalling: boolean;
    }) {
      return dispatch({
        type: 'SET_CALL',
        channelId,
        imCalling
      });
    },
    onSetAICall(channelId: number) {
      return dispatch({
        type: 'SET_AI_CALL',
        channelId
      });
    },
    onSetAICallEnding(isEnding: boolean) {
      return dispatch({
        type: 'SET_AI_CALL_ENDING',
        isEnding
      });
    },
    onSetTopicSettingsJSON({
      channelId,
      topicId,
      newSettings
    }: {
      channelId: number;
      topicId: number;
      newSettings: object;
    }) {
      return dispatch({
        type: 'SET_TOPIC_SETTINGS_JSON',
        channelId,
        topicId,
        newSettings
      });
    },
    onSetChannelSettingsJSON({
      channelId,
      newSettings
    }: {
      channelId: number;
      newSettings: object;
    }) {
      return dispatch({
        type: 'SET_CHANNEL_SETTINGS_JSON',
        channelId,
        newSettings
      });
    },
    onSetChannelState({
      channelId,
      newState
    }: {
      channelId: number;
      newState: object;
    }) {
      return dispatch({
        type: 'SET_CHANNEL_STATE',
        channelId,
        newState
      });
    },
    onSetChessGameState({
      channelId,
      newState
    }: {
      channelId: number;
      newState: object;
    }) {
      return dispatch({
        type: 'SET_CHESS_GAME_STATE',
        channelId,
        newState
      });
    },
    onSetChatInvitationDetail({
      messageId,
      channelId,
      channel
    }: {
      messageId: number;
      channelId: number;
      channel: object;
    }) {
      return dispatch({
        type: 'SET_CHAT_INVITATION_DETAIL',
        messageId,
        channelId,
        channel
      });
    },
    onSetChatNotificationSettings(settings: ChatNotificationSettings | null) {
      return dispatch({
        type: 'SET_CHAT_NOTIFICATION_SETTINGS',
        settings
      });
    },
    onSetChessModalShown(shown: boolean) {
      return dispatch({
        type: 'SET_CHESS_MODAL_SHOWN',
        shown
      });
    },
    onSetPendingChessModalChannelId(channelId: number | null) {
      return dispatch({
        type: 'SET_PENDING_CHESS_MODAL_CHANNEL_ID',
        channelId
      });
    },
    onSetOmokModalShown(shown: boolean) {
      return dispatch({
        type: 'SET_OMOK_MODAL_SHOWN',
        shown
      });
    },
    onSetChessPuzzleModalShown(shown: boolean) {
      return dispatch({
        type: 'SET_CHESS_PUZZLE_MODAL_SHOWN',
        shown
      });
    },
    onSetCreatingNewDMChannel(creating: boolean) {
      return dispatch({
        type: 'SET_CREATING_NEW_DM_CHANNEL',
        creating
      });
    },
    onApplyCanonicalChatSidebarState({
      quickAccess,
      favoriteState,
      channelVisibility,
      userId
    }: CanonicalChatSidebarState & {
      // The account that issued the request or owns the socket session,
      // captured at request start. Sidebar revisions are monotonic only
      // within one account, so the reducer rejects snapshots owned by an
      // account other than the one the provider currently hosts.
      userId: number;
    }) {
      return dispatch({
        type: 'APPLY_CANONICAL_CHAT_SIDEBAR_STATE',
        quickAccess,
        favoriteState,
        channelVisibility,
        userId
      });
    },
    onSetIsRespondingToSubject({
      channelId,
      subchannelId,
      isResponding
    }: {
      channelId: number;
      subchannelId: number;
      isResponding: boolean;
    }) {
      return dispatch({
        type: 'SET_IS_RESPONDING_TO_SUBJECT',
        channelId,
        subchannelId,
        isResponding
      });
    },
    onSetLoadingVocabulary(loading: boolean) {
      return dispatch({
        type: 'SET_LOADING_VOCABULARY',
        loading
      });
    },
    onSetLoadingAICardChat(loading: boolean) {
      return dispatch({
        type: 'SET_LOADING_AI_CARD_CHAT',
        loading
      });
    },
    onSetMembersOnCall(members: object[]) {
      return dispatch({
        type: 'SET_MEMBERS_ON_CALL',
        members
      });
    },
    onSetMessageState({
      channelId,
      messageId,
      newState
    }: {
      channelId: number;
      messageId: number | string;
      newState: object;
    }) {
      return dispatch({
        type: 'SET_MESSAGE_STATE',
        channelId,
        messageId,
        newState
      });
    },
    onSetMyStream(stream: object) {
      return dispatch({
        type: 'SET_MY_STREAM',
        stream
      });
    },
    onSetPeerStreams({ peerId, stream }: { peerId: string; stream: object }) {
      return dispatch({
        type: 'SET_PEER_STREAMS',
        peerId,
        stream
      });
    },
    onSetReconnecting() {
      return dispatch({
        type: 'SET_RECONNECTING'
      });
    },
    onFinishReconnecting() {
      return dispatch({
        type: 'SET_RECONNECTED'
      });
    },
    onSetChessTarget({
      channelId,
      messageId,
      target
    }: {
      channelId: number;
      messageId: number;
      target: object;
    }) {
      return dispatch({
        type: 'SET_CHESS_TARGET',
        channelId,
        messageId,
        target
      });
    },
    onSetReplyTarget({
      channelId,
      subchannelId,
      target
    }: {
      channelId: number;
      subchannelId: number;
      target: object;
    }) {
      return dispatch({
        type: 'SET_REPLY_TARGET',
        channelId,
        subchannelId,
        target
      });
    },
    // App-wide snapshot: authoritative about who is offline too, so the
    // reducer reconciles anyone it no longer lists (only when isComplete).
    // requestedAt is the client time the request was emitted; presence events
    // that landed after it outrank this snapshot.
    onSetOnlinePresenceSnapshot({
      onlineUsers,
      isComplete,
      requestedAt
    }: {
      onlineUsers: Record<number, any>;
      isComplete: boolean;
      requestedAt: number;
    }) {
      return dispatch({
        type: 'SET_ONLINE_PRESENCE_SNAPSHOT',
        onlineUsers,
        isComplete,
        requestedAt
      });
    },
    // Channel-scoped snapshot: merges into the same app-wide map, but absence
    // from it never means offline.
    onSetOnlineUsers({
      userId,
      onlineUsers,
      recentOfflineUsers,
      requestedAt
    }: {
      userId: number;
      onlineUsers: Record<number, any>;
      recentOfflineUsers?: any[];
      requestedAt: number;
    }) {
      return dispatch({
        type: 'SET_ONLINE_USERS',
        userId,
        onlineUsers,
        recentOfflineUsers,
        requestedAt
      });
    },
    onSetSubchannel({
      channelId,
      subchannel
    }: {
      channelId: number;
      subchannel: object;
    }) {
      return dispatch({
        type: 'SET_SUBCHANNEL',
        channelId,
        subchannel
      });
    },
    onSetSelectedSubchannelId(subchannelId: number) {
      return dispatch({
        type: 'SET_SELECTED_SUBCHANNEL_ID',
        subchannelId
      });
    },
    onSetAICardStatusMessage(message: string) {
      return dispatch({
        type: 'SET_AI_IMAGE_STATUS_MESSAGE',
        message
      });
    },
    onInsertBlackAICardUpdateLog(message: string) {
      return dispatch({
        type: 'INSERT_BLACK_AI_CARD_UPDATE_LOG',
        message
      });
    },
    onSetIsGeneratingAICard(isGenerating: boolean) {
      return dispatch({
        type: 'SET_IS_GENERATING_AI_CARD',
        isGenerating
      });
    },
    onSetIsZeroCallAvailable(isAvailable: boolean) {
      return dispatch({
        type: 'SET_IS_ZERO_CALL_AVAILABLE',
        isAvailable
      });
    },
    onSetZeroChannelId(channelId: number) {
      return dispatch({
        type: 'SET_ZERO_CHANNEL_ID',
        channelId
      });
    },
    onSetVocabErrorMessage(message: string) {
      return dispatch({
        type: 'SET_VOCAB_ERROR_MESSAGE',
        message
      });
    },
    onSetVocabLeaderboards({
      collectorRankings,
      monthlyVocabRankings,
      yearlyVocabRankings
    }: {
      collectorRankings: object[];
      monthlyVocabRankings: object[];
      yearlyVocabRankings: object[];
    }) {
      return dispatch({
        type: 'SET_VOCAB_LEADERBOARDS',
        collectorRankings,
        monthlyVocabRankings,
        yearlyVocabRankings
      });
    },
    onSetVocabLeaderboardTab(tab: string) {
      return dispatch({
        type: 'SET_VOCAB_LEADERBOARD_TAB',
        tab
      });
    },
    onSetVocabLeaderboardAllSelected({
      tab,
      selected
    }: {
      tab: string;
      selected: boolean;
    }) {
      return dispatch({
        type: 'SET_VOCAB_LEADERBOARD_ALL_SELECTED',
        tab,
        selected
      });
    },
    onSetWordleGuesses({
      channelId,
      guesses
    }: {
      channelId: number;
      guesses: string[];
    }) {
      return dispatch({
        type: 'SET_WORDLE_GUESSES',
        channelId,
        guesses
      });
    },
    onSetWordleModalShown(shown: boolean) {
      return dispatch({
        type: 'SET_WORDLE_MODAL_SHOWN',
        shown
      });
    },
    onSetWordsObj(wordObj: object) {
      return dispatch({
        type: 'SET_WORDS_OBJECT',
        wordObj
      });
    },
    onSetWordRegisterStatus(status: string) {
      return dispatch({
        type: 'SET_WORD_REGISTER_STATUS',
        status
      });
    },
    onShowIncoming() {
      return dispatch({
        type: 'SHOW_INCOMING'
      });
    },
    onShowOutgoing() {
      return dispatch({
        type: 'SHOW_OUTGOING'
      });
    },
    onSubmitMessage({
      isRespondingToSubject,
      message,
      messageId,
      replyTarget,
      rewardReason,
      rewardAmount,
      selectedTab,
      subchannelId,
      topicId
    }: {
      isRespondingToSubject: boolean;
      message: object;
      messageId: number;
      replyTarget: object;
      rewardReason: string;
      rewardAmount: number;
      selectedTab: string;
      topicId?: number;
      subchannelId: number;
    }) {
      return dispatch({
        type: 'SUBMIT_MESSAGE',
        isRespondingToSubject,
        messageId,
        message: {
          ...message,
          rewardReason,
          rewardAmount,
          timeStamp: Math.floor(Date.now() / 1000)
        },
        selectedTab,
        subchannelId,
        topicId,
        replyTarget
      });
    },
    onTrimMessages(channelId: number) {
      return dispatch({
        type: 'TRIM_MESSAGES',
        channelId
      });
    },
    onTrimSubchannelMessages({
      channelId,
      subchannelId
    }: {
      channelId: number;
      subchannelId: number;
    }) {
      return dispatch({
        type: 'TRIM_SUBCHANNEL_MESSAGES',
        channelId,
        subchannelId
      });
    },
    onUpdateAICard({
      cardId,
      initialState,
      newState,
      isInit
    }: {
      cardId: number;
      initialState?: object;
      newState: object;
      isInit?: boolean;
    }) {
      return dispatch({
        type: 'UPDATE_AI_CARD',
        cardId,
        initialState,
        newState,
        isInit
      });
    },
    onUpdateChannelPathIdHash({
      channelId,
      pathId
    }: {
      channelId: number;
      pathId: number;
    }) {
      return dispatch({
        type: 'UPDATE_CHANNEL_PATH_ID_HASH',
        channelId,
        pathId
      });
    },
    onUpdateCurrentTransactionId({
      channelId,
      transactionId
    }: {
      channelId: number;
      transactionId: number;
    }) {
      return dispatch({
        type: 'UPDATE_CURRENT_TRANSACTION_ID',
        channelId,
        transactionId
      });
    },
    onAcceptTransaction({ transactionId }: { transactionId: number }) {
      return dispatch({
        type: 'ACCEPT_TRANSACTION',
        transactionId
      });
    },
    onCancelTransaction({
      transactionId,
      reason
    }: {
      transactionId: number;
      reason: string;
    }) {
      return dispatch({
        type: 'CANCEL_TRANSACTION',
        transactionId,
        reason
      });
    },
    onUpdateLastChessMessageId({
      channelId,
      messageId,
      terminalMessageId
    }: {
      channelId: number;
      messageId: number | null;
      terminalMessageId?: number | string | null;
    }) {
      return dispatch({
        type: 'UPDATE_LAST_CHESS_MESSAGE_ID',
        channelId,
        messageId,
        terminalMessageId
      });
    },
    onUpdateLastChessMoveViewerId({
      channelId,
      viewerId
    }: {
      channelId: number;
      viewerId: number;
    }) {
      return dispatch({
        type: 'UPDATE_LAST_CHESS_MOVE_VIEWER_ID',
        channelId,
        viewerId
      });
    },
    onUpdateLastOmokMessageId({
      channelId,
      messageId,
      terminalMessageId
    }: {
      channelId: number;
      messageId: number | null;
      terminalMessageId?: number | string | null;
    }) {
      return dispatch({
        type: 'UPDATE_LAST_OMOK_MESSAGE_ID',
        channelId,
        messageId,
        terminalMessageId
      });
    },
    onUpdateLastOmokMoveViewerId({
      channelId,
      viewerId
    }: {
      channelId: number;
      viewerId: number;
    }) {
      return dispatch({
        type: 'UPDATE_LAST_OMOK_MOVE_VIEWER_ID',
        channelId,
        viewerId
      });
    },
    onUpdateLatestPathId(pathId: number) {
      return dispatch({
        type: 'UPDATE_LATEST_PATH_ID',
        pathId
      });
    },
    onUpdateVisitedChannel(channelId: number) {
      return dispatch({
        type: 'UPDATE_VISITED_CHANNEL',
        channelId
      });
    },
    onUpdateLastSubchannelPath({
      channelId,
      path
    }: {
      channelId: number;
      path: string;
    }) {
      return dispatch({
        type: 'UPDATE_LAST_SUBCHANNEL_PATH',
        channelId,
        path
      });
    },
    onUpdateChatType(chatType: string) {
      return dispatch({
        type: 'UPDATE_CHAT_TYPE',
        chatType
      });
    },
    onUpdateChatUploadProgress({
      progress,
      channelId,
      subchannelId,
      path
    }: {
      progress: number;
      channelId: number;
      subchannelId: number;
      path: string;
    }) {
      return dispatch({
        type: 'UPDATE_UPLOAD_PROGRESS',
        progress,
        channelId,
        subchannelId,
        path
      });
    },
    onUpdateMostRecentAICardOfferTimeStamp(timeStamp: number) {
      return dispatch({
        type: 'UPDATE_MOST_RECENT_AI_CARD_OFFER_TIMESTAMP',
        timeStamp
      });
    },
    onUpdateNumSummoned(numSummoned: number) {
      return dispatch({
        type: 'UPDATE_NUM_SUMMONED',
        numSummoned
      });
    },
    onUpdateRecentChessMessage({
      channelId,
      message
    }: {
      channelId: number;
      message: object;
    }) {
      return dispatch({
        type: 'UPDATE_RECENT_CHESS_MESSAGE',
        channelId,
        message
      });
    },
    onUpdateRecentOmokMessage({
      channelId,
      message
    }: {
      channelId: number;
      message: object;
    }) {
      return dispatch({
        type: 'UPDATE_RECENT_OMOK_MESSAGE',
        channelId,
        message
      });
    },
    onUpdateSelectedChannelId(channelId: number) {
      return dispatch({
        type: 'UPDATE_SELECTED_CHANNEL_ID',
        channelId
      });
    },
    onUploadChatTopic({
      subject,
      channelId,
      subchannelId
    }: {
      subjectId: number;
      subject: object;
      channelId: number;
      subchannelId: number;
    }) {
      return dispatch({
        type: 'NEW_TOPIC',
        subject,
        channelId,
        subchannelId
      });
    },
    onMakeOutgoingOffer(offer: object) {
      return dispatch({
        type: 'MAKE_OUTGOING_OFFER',
        offer
      });
    },
    onWithdrawOutgoingOffer(offerId: number) {
      return dispatch({
        type: 'WITHDRAW_OUTGOING_OFFER',
        offerId
      });
    },
    onSetThinkHardZero(thinkHard: boolean) {
      return dispatch({
        type: 'SET_THINK_HARD',
        aiType: 'zero',
        thinkHard
      });
    },
    onSetThinkHardCiel(thinkHard: boolean) {
      return dispatch({
        type: 'SET_THINK_HARD',
        aiType: 'ciel',
        thinkHard
      });
    },
    onCancelAIMessage({
      messageId,
      channelId,
      topicId,
      shouldRemoveMessage
    }: {
      messageId: number;
      channelId: number;
      subchannelId?: number;
      topicId?: number;
      shouldRemoveMessage: boolean;
    }) {
      return dispatch({
        type: 'CANCEL_AI_MESSAGE',
        messageId,
        channelId,
        topicId,
        shouldRemoveMessage
      });
    },
    onSetThinkHardForTopic({
      aiType,
      topicId,
      thinkHard
    }: {
      aiType: 'zero' | 'ciel';
      topicId: number;
      thinkHard: boolean;
    }) {
      return dispatch({
        type: 'SET_THINK_HARD',
        aiType,
        topicId,
        thinkHard
      });
    }
  };
}
