export default function ChatActions(dispatch) {
  return {
    onAddReactionToMessage({
      channelId,
      messageId,
      reaction,
      subchannelId,
      userId
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
    onCallReceptionConfirm(channelId) {
      return dispatch({
        type: 'CONFIRM_CALL_RECEPTION',
        channelId
      });
    },
    onChangeOnlineStatus({ userId, member = {}, isOnline }) {
      return dispatch({
        type: 'CHANGE_ONLINE_STATUS',
        userId,
        member,
        isOnline
      });
    },
    onChangeAwayStatus({ userId, isAway }) {
      return dispatch({
        type: 'CHANGE_AWAY_STATUS',
        userId,
        isAway
      });
    },
    onChangeBusyStatus({ userId, isBusy }) {
      return dispatch({
        type: 'CHANGE_BUSY_STATUS',
        userId,
        isBusy
      });
    },
    onChangeChannelOwner({ channelId, message, newOwner }) {
      return dispatch({
        type: 'CHANGE_CHANNEL_OWNER',
        channelId,
        message,
        newOwner
      });
    },
    onChangeChannelSettings({
      canChangeSubject,
      channelId,
      channelName,
      isClosed
    }) {
      return dispatch({
        type: 'CHANGE_CHANNEL_SETTINGS',
        canChangeSubject,
        channelId,
        channelName,
        isClosed
      });
    },
    onChangeChatSubject({ subject, channelId }) {
      return dispatch({
        type: 'CHANGE_SUBJECT',
        subject,
        channelId
      });
    },
    onClearNumUnreads() {
      return dispatch({
        type: 'CLEAR_NUM_UNREADS'
      });
    },
    onClearRecentChessMessage(channelId) {
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
    onCreateNewChannel(data) {
      return dispatch({
        type: 'CREATE_NEW_CHANNEL',
        data
      });
    },
    onDeleteMessage({ messageId, channelId, subchannelId }) {
      return dispatch({
        type: 'DELETE_MESSAGE',
        channelId,
        messageId,
        subchannelId
      });
    },
    onDisplayAttachedFile({
      id,
      channelId,
      filePath,
      fileSize,
      userId,
      username,
      profilePicUrl,
      subchannelId,
      uploaderAuthLevel,
      thumbUrl
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
          profilePicUrl,
          uploaderAuthLevel,
          fileSize,
          thumbUrl
        }
      });
    },
    onEditChannelSettings({
      channelName,
      isClosed,
      channelId,
      canChangeSubject,
      theme
    }) {
      return dispatch({
        type: 'EDIT_CHANNEL_SETTINGS',
        canChangeSubject,
        channelName,
        isClosed,
        channelId,
        theme
      });
    },
    onEditMessage({
      editedMessage,
      channelId,
      messageId,
      isSubject,
      subchannelId,
      subjectChanged
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
    onEditWord({ deletedDefIds, partOfSpeeches, editedDefinitionOrder, word }) {
      return dispatch({
        type: 'EDIT_WORD',
        deletedDefIds,
        partOfSpeeches,
        editedDefinitionOrder,
        word
      });
    },
    onEnableChatSubject(channelId) {
      return dispatch({
        type: 'ENABLE_CHAT_SUBJECT',
        channelId
      });
    },
    onEnableTheme({ channelId, theme }) {
      return dispatch({
        type: 'ENABLE_THEME',
        channelId,
        theme
      });
    },
    onEnterChannelWithId({ data, showOnTop }) {
      return dispatch({
        type: 'ENTER_CHANNEL',
        data,
        showOnTop
      });
    },
    onEnterEmptyChat() {
      return dispatch({
        type: 'ENTER_EMPTY_CHAT'
      });
    },
    onGetNumberOfUnreadMessages(numUnreads) {
      return dispatch({
        type: 'GET_NUM_UNREAD_MSGS',
        numUnreads
      });
    },
    onHangUp({ iHungUp, memberId, peerId }) {
      return dispatch({
        type: 'HANG_UP',
        memberId,
        iHungUp,
        peerId
      });
    },
    onHideAttachment({ messageId, channelId, subchannelId }) {
      return dispatch({
        type: 'HIDE_ATTACHMENT',
        channelId,
        messageId,
        subchannelId
      });
    },
    onHideChat(channelId) {
      return dispatch({
        type: 'HIDE_CHAT',
        channelId
      });
    },
    onInitChat(data) {
      return dispatch({
        type: 'INIT_CHAT',
        data
      });
    },
    onInviteUsersToChannel(data) {
      return dispatch({
        type: 'INVITE_USERS_TO_CHANNEL',
        data
      });
    },
    onLeaveChannel({ channelId, userId }) {
      return dispatch({
        type: 'LEAVE_CHANNEL',
        channelId,
        userId
      });
    },
    onLoadChatSubject(data) {
      return dispatch({
        type: 'LOAD_SUBJECT',
        data
      });
    },
    onLoadMoreChannels({ type, channels }) {
      return dispatch({
        type: 'LOAD_MORE_CHANNELS',
        channelType: type,
        channels
      });
    },
    onLoadMoreMessages({ messageIds, messagesObj, loadedChannelId }) {
      return dispatch({
        type: 'LOAD_MORE_MESSAGES',
        messageIds,
        messagesObj,
        loadedChannelId
      });
    },
    onLoadVocabulary({ vocabActivities, wordsObj, wordCollectors }) {
      return dispatch({
        type: 'LOAD_VOCABULARY',
        vocabActivities,
        wordsObj,
        wordCollectors
      });
    },
    onLoadMoreVocabulary({ vocabActivities, wordsObj }) {
      return dispatch({
        type: 'LOAD_MORE_VOCABULARY',
        vocabActivities,
        wordsObj
      });
    },
    onNotifyThatMemberLeftChannel(data) {
      return dispatch({
        type: 'NOTIFY_MEMBER_LEFT',
        data
      });
    },
    onOpenNewChatTab({ user, recepient }) {
      return dispatch({
        type: 'OPEN_NEW_TAB',
        user,
        recepient
      });
    },
    onPostFileUploadStatus({
      channelId,
      content,
      fileName,
      filePath,
      fileToUpload,
      subchannelId
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
      result
    }) {
      return dispatch({
        type: 'POST_UPLOAD_COMPLETE',
        tempMessageId,
        subchannelId,
        channelId,
        messageId,
        path,
        result
      });
    },
    onReceiveMessage({ pageVisible, message, newMembers = [], usingChat }) {
      return dispatch({
        type: 'RECEIVE_MESSAGE',
        usingChat,
        pageVisible,
        message: {
          ...message,
          timeStamp: Math.floor(Date.now() / 1000)
        },
        newMembers
      });
    },
    onReceiveFirstMsg({ message, isClass, duplicate, pageVisible, pathId }) {
      return dispatch({
        type: 'RECEIVE_FIRST_MSG',
        message,
        duplicate,
        isClass,
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
    onReceiveVocabActivity({ activity, usingVocabSection }) {
      return dispatch({
        type: 'RECEIVE_VOCAB_ACTIVITY',
        activity,
        usingVocabSection
      });
    },
    onRegisterWord(word) {
      return dispatch({
        type: 'REGISTER_WORD',
        word
      });
    },
    onReloadChatSubject({ channelId, subject, message }) {
      return dispatch({
        type: 'RELOAD_SUBJECT',
        channelId,
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
    onRemoveNewActivityStatus(word) {
      return dispatch({
        type: 'REMOVE_NEW_ACTIVITY_STATUS',
        word
      });
    },
    onResetChat() {
      return dispatch({
        type: 'RESET_CHAT'
      });
    },
    onSaveMessage({
      index,
      messageId,
      channelId,
      subchannelId,
      tempMessageId
    }) {
      return dispatch({
        type: 'ADD_ID_TO_NEW_MESSAGE',
        channelId,
        messageIndex: index,
        messageId,
        subchannelId,
        tempMessageId
      });
    },
    onSearchChat(data) {
      return dispatch({
        type: 'SEARCH',
        data
      });
    },
    onSearchChatSubject(data) {
      return dispatch({
        type: 'SEARCH_SUBJECT',
        data
      });
    },
    onSearchUserToInvite(data) {
      return dispatch({
        type: 'SEARCH_USERS_FOR_CHANNEL',
        data
      });
    },
    onSelectChatTab(selectedChatTab) {
      return dispatch({
        type: 'SELECT_CHAT_TAB',
        selectedChatTab
      });
    },
    onSendFirstDirectMessage({ channel, message }) {
      return dispatch({
        type: 'CREATE_NEW_DM_CHANNEL',
        channel,
        message
      });
    },
    onSetCall({ channelId, imCalling }) {
      return dispatch({
        type: 'SET_CALL',
        channelId,
        imCalling
      });
    },
    onSetChannelState({ channelId, newState }) {
      return dispatch({
        type: 'SET_CHANNEL_STATE',
        channelId,
        newState
      });
    },
    onSetChatInvitationDetail({ messageId, channelId, channel }) {
      return dispatch({
        type: 'SET_CHAT_INVITATION_DETAIL',
        messageId,
        channelId,
        channel
      });
    },
    onSetChessModalShown(shown) {
      return dispatch({
        type: 'SET_CHESS_MODAL_SHOWN',
        shown
      });
    },
    onSetCreatingNewDMChannel(creating) {
      return dispatch({
        type: 'SET_CREATING_NEW_DM_CHANNEL',
        creating
      });
    },
    onSetCurrentChannelName(channelName) {
      return dispatch({
        type: 'SET_CURRENT_CHANNEL_NAME',
        channelName
      });
    },
    onSetFavoriteChannel({ channelId, favorited }) {
      return dispatch({
        type: 'SET_FAVORITE_CHANNEL',
        channelId,
        favorited
      });
    },
    onSetIsRespondingToSubject({ channelId, isResponding }) {
      return dispatch({
        type: 'SET_IS_RESPONDING_TO_SUBJECT',
        channelId,
        isResponding
      });
    },
    onSetLoadingVocabulary(loading) {
      return dispatch({
        type: 'SET_LOADING_VOCABULARY',
        loading
      });
    },
    onSetMembersOnCall(members) {
      return dispatch({
        type: 'SET_MEMBERS_ON_CALL',
        members
      });
    },
    onSetMessageState({ channelId, messageId, newState }) {
      return dispatch({
        type: 'SET_MESSAGE_STATE',
        channelId,
        messageId,
        newState
      });
    },
    onSetMyStream(stream) {
      return dispatch({
        type: 'SET_MY_STREAM',
        stream
      });
    },
    onSetPeerStreams({ peerId, stream }) {
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
    onSetReplyTarget({ channelId, target }) {
      return dispatch({
        type: 'SET_REPLY_TARGET',
        channelId,
        target
      });
    },
    onSetOnlineMembers(onlineMemberIds) {
      return dispatch({
        type: 'SET_ONLINE_MEMBERS',
        onlineMemberIds
      });
    },
    onSetOnlineUserData(profile) {
      return dispatch({
        type: 'SET_ONLINE_USER_DATA',
        profile
      });
    },
    onSetVocabErrorMessage(message) {
      return dispatch({
        type: 'SET_VOCAB_ERROR_MESSAGE',
        message
      });
    },
    onSetWordleGuesses({ channelId, guesses }) {
      return dispatch({
        type: 'SET_WORDLE_GUESSES',
        channelId,
        guesses
      });
    },
    onSetWordsObj(wordObj) {
      return dispatch({
        type: 'SET_WORDS_OBJECT',
        wordObj
      });
    },
    onSetWordRegisterStatus(status) {
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
      subchannelId
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
        subchannelId,
        replyTarget
      });
    },
    onTrimMessages(channelId) {
      return dispatch({
        type: 'TRIM_MESSAGES',
        channelId
      });
    },
    onUpdateChannelPathIdHash({ channelId, pathId }) {
      return dispatch({
        type: 'UPDATE_CHANNEL_PATH_ID_HASH',
        channelId,
        pathId
      });
    },
    onUpdateLastChessMessageId({ channelId, messageId }) {
      return dispatch({
        type: 'UPDATE_LAST_CHESS_MESSAGE_ID',
        channelId,
        messageId
      });
    },
    onUpdateLastChessMoveViewerId({ channelId, viewerId }) {
      return dispatch({
        type: 'UPDATE_LAST_CHESS_MOVE_VIEWER_ID',
        channelId,
        viewerId
      });
    },
    onUpdateCollectorsRankings(data) {
      return dispatch({
        type: 'UPDATE_COLLECTORS_RANKINGS',
        data
      });
    },
    onUpdateChatType(chatType) {
      return dispatch({
        type: 'UPDATE_CHAT_TYPE',
        chatType
      });
    },
    onUpdateChatUploadProgress({ progress, channelId, subchannelId, path }) {
      return dispatch({
        type: 'UPDATE_UPLOAD_PROGRESS',
        progress,
        channelId,
        subchannelId,
        path
      });
    },
    onUpdateRecentChessMessage({ channelId, message }) {
      return dispatch({
        type: 'UPDATE_RECENT_CHESS_MESSAGE',
        channelId,
        message
      });
    },
    onUpdateSelectedChannelId(channelId) {
      return dispatch({
        type: 'UPDATE_SELECTED_CHANNEL_ID',
        channelId
      });
    },
    onUploadChatSubject({ subjectId, subject, channelId }) {
      return dispatch({
        type: 'NEW_SUBJECT',
        subjectId,
        subject,
        channelId
      });
    }
  };
}
