import { Dispatch } from '~/types';

export default function ChatActions(dispatch: Dispatch) {
  return {
    onAddBookmarkedMessage({
      topicId,
      channelId,
      message
    }: {
      topicId: number;
      channelId: number;
      message: any;
    }) {
      return dispatch({
        type: 'ADD_BOOKMARKED_MESSAGE',
        topicId,
        channelId,
        message
      });
    },
    onRemoveBookmarkedMessage({
      topicId,
      channelId,
      messageId
    }: {
      channelId: number;
      topicId: number;
      messageId: number;
    }) {
      return dispatch({
        type: 'REMOVE_BOOKMARKED_MESSAGE',
        topicId,
        channelId,
        messageId
      });
    },
    onAddReactionToMessage({
      channelId,
      messageId,
      reaction,
      subchannelId,
      userId
    }: {
      channelId: number;
      messageId: number;
      reaction: string;
      subchannelId: number;
      userId: number;
    }) {
      dispatch({
        type: 'ADD_REACTION_TO_MESSAGE',
        channelId,
        messageId,
        reaction,
        subchannelId,
        userId
      });
    },
    onAICardOfferWithdrawal(feedId: number) {
      return dispatch({
        type: 'AI_CARD_OFFER_WITHDRAWAL',
        feedId
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
      isOnline
    }: {
      userId: number;
      member?: object;
      isOnline: boolean;
    }) {
      return dispatch({
        type: 'CHANGE_ONLINE_STATUS',
        userId,
        member,
        isOnline
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
      message,
      newOwner
    }: {
      channelId: number;
      message: string;
      newOwner: number;
    }) {
      return dispatch({
        type: 'CHANGE_CHANNEL_OWNER',
        channelId,
        message,
        newOwner
      });
    },
    onChangeTopicSettings({
      channelId,
      topicId,
      topicTitle,
      isOwnerPostingOnly
    }: {
      channelId: number;
      topicId: number;
      topicTitle: string;
      isOwnerPostingOnly: boolean;
    }) {
      return dispatch({
        type: 'CHANGE_TOPIC_SETTINGS',
        channelId,
        topicId,
        topicTitle,
        isOwnerPostingOnly
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
      thumbPath
    }: {
      canChangeSubject: boolean;
      channelId: number;
      channelName: string;
      description: string;
      isClosed: boolean;
      isPublic: boolean;
      isOwnerPostingOnly: boolean;
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
    onClearNumUnreads() {
      return dispatch({
        type: 'CLEAR_NUM_UNREADS'
      });
    },
    onClearRecentChessMessage(channelId: number) {
      return dispatch({
        type: 'CLEAR_RECENT_CHESS_MESSAGE',
        channelId
      });
    },
    onClearSubchannelUnreads({
      channelId,
      subchannelId
    }: {
      channelId: number;
      subchannelId: number;
    }) {
      return dispatch({
        type: 'CLEAR_SUBCHANNEL_UNREADS',
        channelId,
        subchannelId
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
    onCreateNewChannel(data: object) {
      return dispatch({
        type: 'CREATE_NEW_CHANNEL',
        data
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
        topicId
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
      subchannelId,
      subjectChanged
    }: {
      editedMessage: string;
      channelId: number;
      messageId: number;
      isSubject: boolean;
      subchannelId: number;
      subjectChanged: boolean;
    }) {
      return dispatch({
        type: 'EDIT_MESSAGE',
        channelId,
        editedMessage,
        messageId,
        isSubject,
        subchannelId,
        subjectChanged
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
    onEnableTheme({ channelId, theme }: { channelId: number; theme: string }) {
      return dispatch({
        type: 'ENABLE_THEME',
        channelId,
        theme
      });
    },
    onEnterChannelWithId(data: object) {
      return dispatch({
        type: 'ENTER_CHANNEL',
        data
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
    onHideChat(channelId: number) {
      return dispatch({
        type: 'HIDE_CHAT',
        channelId
      });
    },
    onInitChat({ data, userId }: { data: object; userId: number }) {
      return dispatch({
        type: 'INIT_CHAT',
        data,
        userId
      });
    },
    onInviteUsersToChannel(data: object) {
      return dispatch({
        type: 'INVITE_USERS_TO_CHANNEL',
        data
      });
    },
    onLeaveChannel({
      channelId,
      userId
    }: {
      channelId: number;
      userId: number;
    }) {
      return dispatch({
        type: 'LEAVE_CHANNEL',
        channelId,
        userId
      });
    },
    onDelistAICard(cardId: number) {
      return dispatch({
        type: 'DELIST_AI_CARD',
        cardId
      });
    },
    onListAICard({ card, price }: { card: object; price: number }) {
      return dispatch({
        type: 'LIST_AI_CARD',
        card,
        price
      });
    },
    onLoadTopicMessages({
      channelId,
      topicId,
      messages,
      topicObj,
      loadMoreShown
    }: {
      channelId: number;
      topicId: number;
      messages: object[];
      topicObj: object;
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_TOPIC_MESSAGES',
        channelId,
        topicId,
        messages,
        topicObj,
        loadMoreShown
      });
    },
    onLoadMoreTopicMessages({
      channelId,
      topicId,
      messages,
      topicObj,
      loadMoreShown
    }: {
      channelId: number;
      topicId: number;
      messages: object[];
      topicObj: object;
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_TOPIC_MESSAGES',
        channelId,
        topicId,
        messages,
        topicObj,
        loadMoreShown
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
        card
      });
    },
    onAddMyAICard(card: object) {
      return dispatch({
        type: 'ADD_MY_AI_CARD',
        card
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
      loadMoreShown
    }: {
      channelId: number;
      topicId: number;
      bookmarks: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_BOOKMARKS',
        channelId,
        topicId,
        bookmarks,
        loadMoreShown
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
      vocabActivities,
      wordsObj,
      wordCollectors
    }: {
      vocabActivities: object[];
      wordsObj: object;
      wordCollectors: object;
    }) {
      return dispatch({
        type: 'LOAD_VOCABULARY',
        vocabActivities,
        wordsObj,
        wordCollectors
      });
    },
    onLoadMoreVocabulary({
      vocabActivities,
      wordsObj
    }: {
      vocabActivities: object[];
      wordsObj: object;
    }) {
      return dispatch({
        type: 'LOAD_MORE_VOCABULARY',
        vocabActivities,
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
    onOpenNewChatTab({ user, recipient }: { user: object; recipient: object }) {
      return dispatch({
        type: 'OPEN_NEW_TAB',
        user,
        recipient
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
      currentSubchannelId
    }: {
      pageVisible: boolean;
      message: object;
      newMembers: object[];
      usingChat: boolean;
      currentSubchannelId: number;
    }) {
      return dispatch({
        type: 'RECEIVE_MESSAGE',
        currentSubchannelId,
        usingChat,
        pageVisible,
        message: {
          ...message,
          timeStamp: Math.floor(Date.now() / 1000)
        },
        newMembers
      });
    },
    onReceiveFirstMsg({
      message,
      isClass,
      isTwoPeople,
      isDuplicate,
      pageVisible,
      pathId
    }: {
      message: object;
      isClass: boolean;
      isTwoPeople: boolean;
      isDuplicate: boolean;
      pageVisible: boolean;
      pathId: number;
    }) {
      return dispatch({
        type: 'RECEIVE_FIRST_MSG',
        message,
        isDuplicate,
        isClass,
        isTwoPeople,
        pageVisible,
        pathId
      });
    },
    onReceiveMessageOnDifferentChannel({
      message,
      channel,
      pageVisible,
      usingChat,
      isMyMessage,
      newMembers = []
    }: {
      message: object;
      channel: object;
      pageVisible: boolean;
      usingChat: boolean;
      isMyMessage: boolean;
      newMembers: object[];
    }) {
      return dispatch({
        type: 'RECEIVE_MSG_ON_DIFF_CHANNEL',
        message,
        channel,
        pageVisible,
        usingChat,
        isMyMessage,
        newMembers
      });
    },
    onNewAICardSummon({ card, feed }: { card: object; feed: object }) {
      return dispatch({
        type: 'RECEIVE_AI_CARD_SUMMON',
        card,
        feed
      });
    },
    onReceiveVocabActivity({
      activity,
      usingVocabSection
    }: {
      activity: object;
      usingVocabSection: boolean;
    }) {
      return dispatch({
        type: 'RECEIVE_VOCAB_ACTIVITY',
        activity,
        usingVocabSection
      });
    },
    onRegisterWord(word: string) {
      return dispatch({
        type: 'REGISTER_WORD',
        word
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
    onRemoveReactionFromMessage({
      channelId,
      messageId,
      reaction,
      subchannelId,
      userId
    }: {
      channelId: number;
      messageId: number;
      reaction: string;
      subchannelId: number;
      userId: number;
    }) {
      return dispatch({
        type: 'REMOVE_REACTION_FROM_MESSAGE',
        channelId,
        messageId,
        reaction,
        subchannelId,
        userId
      });
    },
    onRemoveNewActivityStatus(word: string) {
      return dispatch({
        type: 'REMOVE_NEW_ACTIVITY_STATUS',
        word
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
      withoutMessage
    }: {
      channel: object;
      message: object;
      withoutMessage?: boolean;
    }) {
      return dispatch({
        type: 'CREATE_NEW_DM_CHANNEL',
        channel,
        message,
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
    onSetChessModalShown(shown: boolean) {
      return dispatch({
        type: 'SET_CHESS_MODAL_SHOWN',
        shown
      });
    },
    onSetCreatingNewDMChannel(creating: boolean) {
      return dispatch({
        type: 'SET_CREATING_NEW_DM_CHANNEL',
        creating
      });
    },
    onSetFavoriteChannel({
      channelId,
      favorited
    }: {
      channelId: number;
      favorited: boolean;
    }) {
      return dispatch({
        type: 'SET_FAVORITE_CHANNEL',
        channelId,
        favorited
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
      messageId: number;
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
    onSetOnlineUsers({
      channelId,
      onlineUsers
    }: {
      channelId: number;
      onlineUsers: object[];
    }) {
      return dispatch({
        type: 'SET_ONLINE_USERS',
        channelId,
        onlineUsers
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
    onSetIsGeneratingAICard(isGenerating: boolean) {
      return dispatch({
        type: 'SET_IS_GENERATING_AI_CARD',
        isGenerating
      });
    },
    onSetVocabErrorMessage(message: string) {
      return dispatch({
        type: 'SET_VOCAB_ERROR_MESSAGE',
        message
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
      newState,
      isInit
    }: {
      cardId: number;
      newState: object;
      isInit: boolean;
    }) {
      return dispatch({
        type: 'UPDATE_AI_CARD',
        cardId,
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
      messageId
    }: {
      channelId: number;
      messageId: number;
    }) {
      return dispatch({
        type: 'UPDATE_LAST_CHESS_MESSAGE_ID',
        channelId,
        messageId
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
    onUpdateLatestPathId(pathId: number) {
      return dispatch({
        type: 'UPDATE_LATEST_PATH_ID',
        pathId
      });
    },
    onUpdateLastSubchannelPath({
      channelId,
      path,
      currentSubchannelPath
    }: {
      channelId: number;
      path: string;
      currentSubchannelPath: string;
    }) {
      return dispatch({
        type: 'UPDATE_LAST_SUBCHANNEL_PATH',
        channelId,
        path,
        currentSubchannelPath
      });
    },
    onUpdateCollectorsRankings(data: object) {
      return dispatch({
        type: 'UPDATE_COLLECTORS_RANKINGS',
        data
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
    }
  };
}
