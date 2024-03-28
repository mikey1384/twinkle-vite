import { Dispatch } from '~/types';

export default function ContentActions(dispatch: Dispatch) {
  return {
    onAddTags({
      tags,
      contentType,
      contentId
    }: {
      tags: string[];
      contentType: string;
      contentId: number;
    }) {
      return dispatch({
        type: 'ADD_TAGS',
        tags,
        contentType,
        contentId: Number(contentId)
      });
    },
    onAddTagToContents({
      contentIds,
      contentType,
      tagId,
      tagTitle
    }: {
      contentIds: number[];
      contentType: string;
      tagId: number;
      tagTitle: string;
    }) {
      return dispatch({
        type: 'ADD_TAG_TO_CONTENTS',
        contentIds,
        contentType,
        tagId,
        tagTitle
      });
    },
    onAttachReward({
      reward,
      contentId,
      contentType
    }: {
      reward: object;
      contentId: number;
      contentType: string;
    }) {
      return dispatch({
        type: 'ATTACH_REWARD',
        reward,
        contentId,
        contentType
      });
    },
    onClearCommentFileUploadProgress({
      contentId,
      contentType,
      filePath
    }: {
      contentId: number;
      contentType: string;
      filePath: string;
    }) {
      return dispatch({
        type: 'CLEAR_COMMENT_FILE_UPLOAD_PROGRESS',
        filePath,
        contentId,
        contentType
      });
    },
    onChangeSpoilerStatus({
      prevSecretViewerId,
      shown,
      subjectId
    }: {
      prevSecretViewerId: number;
      shown: boolean;
      subjectId: number;
    }) {
      return dispatch({
        type: 'CHANGE_SPOILER_STATUS',
        shown,
        prevSecretViewerId,
        contentId: subjectId,
        contentType: 'subject'
      });
    },
    onCloseContent({
      contentId,
      contentType,
      userId
    }: {
      contentId: number;
      contentType: string;
      userId: number;
    }) {
      return dispatch({
        type: 'CLOSE_CONTENT',
        contentId,
        contentType,
        userId
      });
    },
    onOpenContent({
      contentId,
      contentType
    }: {
      contentId: number;
      contentType: string;
    }) {
      return dispatch({
        type: 'OPEN_CONTENT',
        contentId,
        contentType
      });
    },
    onDeleteComment(commentId: number) {
      return dispatch({
        type: 'DELETE_COMMENT',
        commentId
      });
    },
    onDeleteContent({
      contentType,
      contentId
    }: {
      contentType: string;
      contentId: number;
    }) {
      return dispatch({
        type: 'DELETE_CONTENT',
        contentType,
        contentId
      });
    },
    onEditComment({
      commentId,
      editedComment
    }: {
      commentId: number;
      editedComment: string;
    }) {
      return dispatch({
        type: 'EDIT_COMMENT',
        commentId,
        editedComment
      });
    },
    onEditContent({
      data,
      contentType,
      contentId
    }: {
      data: object;
      contentType: string;
      contentId: number;
    }) {
      return dispatch({
        type: 'EDIT_CONTENT',
        contentType,
        contentId,
        data
      });
    },
    onEditRewardComment({ id, text }: { id: number; text: string }) {
      return dispatch({
        type: 'EDIT_REWARD_COMMENT',
        id,
        text
      });
    },
    onEditSubject({
      editedSubject,
      subjectId
    }: {
      editedSubject: string;
      subjectId: number;
    }) {
      return dispatch({
        type: 'EDIT_SUBJECT',
        editedSubject,
        subjectId
      });
    },
    onIncreaseNumCoinsEarned({
      videoId,
      amount
    }: {
      videoId: number;
      amount: number;
    }) {
      return dispatch({
        type: 'INCREASE_NUM_COINS_EARNED',
        amount,
        contentType: 'video',
        contentId: videoId
      });
    },
    onIncreaseNumXpEarned({
      videoId,
      amount
    }: {
      videoId: number;
      amount: number;
    }) {
      return dispatch({
        type: 'INCREASE_NUM_XP_EARNED',
        amount,
        contentType: 'video',
        contentId: videoId
      });
    },
    onInitContent({
      contentId,
      contentType,
      ...data
    }: {
      contentId: number;
      contentType: string;
    }) {
      return dispatch({
        type: 'INIT_CONTENT',
        contentId: Number(contentId),
        contentType,
        data
      });
    },
    onSetContentState({
      contentId,
      contentType,
      newState
    }: {
      contentId: number;
      contentType: string;
      newState: object;
    }) {
      return dispatch({
        type: 'SET_CONTENT_STATE',
        contentId,
        contentType,
        newState
      });
    },
    onLikeComment({
      commentId,
      likes
    }: {
      commentId: number;
      likes: object[];
    }) {
      return dispatch({
        type: 'LIKE_COMMENT',
        commentId,
        likes
      });
    },
    onLikeContent({
      likes,
      contentType,
      contentId
    }: {
      likes: object[];
      contentType: string;
      contentId: number;
    }) {
      return dispatch({
        type: 'LIKE_CONTENT',
        likes,
        contentType,
        contentId: Number(contentId)
      });
    },
    onLoadComments({
      comments,
      contentId,
      contentType,
      isPreview,
      loadMoreButton
    }: {
      comments: object[];
      contentId: number;
      contentType: string;
      isPreview: boolean;
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_COMMENTS',
        comments,
        contentId,
        contentType,
        isPreview,
        loadMoreButton
      });
    },
    onLoadMoreComments({
      comments,
      loadMoreButton,
      isRepliesOfReply,
      contentId,
      contentType
    }: {
      comments: object[];
      loadMoreButton: boolean;
      isRepliesOfReply: boolean;
      contentId: number;
      contentType: string;
    }) {
      return dispatch({
        type: 'LOAD_MORE_COMMENTS',
        comments,
        loadMoreButton,
        isRepliesOfReply,
        contentId,
        contentType
      });
    },
    onLoadMoreReplies({
      commentId,
      replies,
      loadMoreButton,
      contentType,
      contentId
    }: {
      commentId: number;
      replies: object[];
      loadMoreButton: boolean;
      contentType: string;
      contentId: number;
    }) {
      return dispatch({
        type: 'LOAD_MORE_REPLIES',
        commentId,
        replies,
        loadMoreButton,
        contentType,
        contentId
      });
    },
    onLoadMoreSubjectComments({
      comments,
      loadMoreButton,
      contentId,
      contentType,
      subjectId
    }: {
      comments: object[];
      loadMoreButton: boolean;
      contentId: number;
      contentType: string;
      subjectId: number;
    }) {
      return dispatch({
        type: 'LOAD_MORE_SUBJECT_COMMENTS',
        comments,
        loadMoreButton,
        subjectId,
        contentId,
        contentType
      });
    },
    onLoadMoreSubjectReplies({
      commentId,
      loadMoreButton,
      replies,
      contentId,
      contentType,
      subjectId
    }: {
      commentId: number;
      loadMoreButton: boolean;
      replies: object[];
      contentId: number;
      contentType: string;
      subjectId: number;
    }) {
      return dispatch({
        type: 'LOAD_MORE_SUBJECT_REPLIES',
        commentId,
        loadMoreButton,
        replies,
        contentId,
        contentType,
        subjectId
      });
    },
    onLoadMoreSubjects({
      results,
      loadMoreButton,
      contentId,
      contentType
    }: {
      results: object[];
      loadMoreButton: boolean;
      contentId: number;
      contentType: string;
    }) {
      return dispatch({
        type: 'LOAD_MORE_SUBJECTS',
        results,
        loadMoreButton,
        contentId,
        contentType
      });
    },
    onLoadPlaylistVideos({
      playlistId,
      videos,
      loadMoreShown
    }: {
      playlistId: number;
      videos: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_PLAYLIST_VIDEOS',
        contentId: playlistId,
        contentType: 'playlist',
        videos,
        loadMoreShown
      });
    },
    onLoadMorePlaylistVideos({
      playlistId,
      videos,
      loadMoreShown
    }: {
      playlistId: number;
      videos: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_PLAYLIST_VIDEOS',
        contentId: playlistId,
        contentType: 'playlist',
        videos,
        loadMoreShown
      });
    },
    onLoadReplies({
      commentId,
      loadMoreButton,
      replies,
      contentType,
      contentId
    }: {
      commentId: number;
      loadMoreButton: boolean;
      replies: object[];
      contentType: string;
      contentId: number;
    }) {
      return dispatch({
        type: 'LOAD_REPLIES',
        replies,
        commentId,
        loadMoreButton,
        contentType,
        contentId
      });
    },
    onLoadRepliesOfReply({
      replies,
      commentId,
      replyId,
      rootReplyId,
      contentType,
      contentId,
      loadMoreButton,
      loadMoreButtonId
    }: {
      replies: object[];
      commentId: number;
      replyId: number;
      rootReplyId: number;
      contentType: string;
      contentId: number;
      loadMoreButton: boolean;
      loadMoreButtonId: number;
    }) {
      return dispatch({
        type: 'LOAD_REPLIES_OF_REPLY',
        replies,
        commentId,
        replyId,
        rootReplyId,
        contentType,
        contentId,
        loadMoreButton,
        loadMoreButtonId
      });
    },
    onLoadSubjectRepliesOfReply({
      replies,
      commentId,
      loadMoreButton,
      replyId,
      subjectId
    }: {
      replies: object[];
      commentId: number;
      loadMoreButton: boolean;
      replyId: number;
      subjectId: number;
    }) {
      return dispatch({
        type: 'LOAD_SUBJECT_REPLIES_OF_REPLY',
        replies,
        commentId,
        replyId,
        contentId: subjectId,
        contentType: 'subject',
        loadMoreButton
      });
    },
    onLoadSubjects({
      contentId,
      contentType,
      subjects,
      loadMoreButton
    }: {
      contentId: number;
      contentType: string;
      subjects: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_SUBJECTS',
        contentId,
        contentType,
        subjects,
        loadMoreButton
      });
    },
    onLoadSubjectComments({
      comments,
      loadMoreButton,
      subjectId,
      contentType,
      contentId
    }: {
      comments: object[];
      loadMoreButton: boolean;
      subjectId: number;
      contentType: string;
      contentId: number;
    }) {
      return dispatch({
        type: 'LOAD_SUBJECT_COMMENTS',
        comments,
        loadMoreButton,
        subjectId,
        contentType,
        contentId
      });
    },
    onLoadTags({
      contentType,
      contentId,
      tags
    }: {
      contentType: string;
      contentId: number;
      tags: object[];
    }) {
      return dispatch({
        type: 'LOAD_TAGS',
        contentId,
        contentType,
        tags
      });
    },
    onRecommendContent({
      recommendations,
      contentType,
      contentId
    }: {
      recommendations: object[];
      contentType: string;
      contentId: number;
    }) {
      return dispatch({
        type: 'RECOMMEND_CONTENT',
        recommendations,
        contentType,
        contentId: Number(contentId)
      });
    },
    onReloadContent({
      contentId,
      contentType
    }: {
      contentId: number;
      contentType: string;
    }) {
      return dispatch({
        type: 'RELOAD_CONTENT',
        contentId,
        contentType
      });
    },
    onReloadComments({
      contentId,
      contentType
    }: {
      contentId: number;
      contentType: string;
    }) {
      return dispatch({
        type: 'RELOAD_COMMENTS',
        contentId,
        contentType
      });
    },
    onRevokeReward({
      contentType,
      contentId,
      rewardId
    }: {
      contentType: string;
      contentId: number;
      rewardId: number;
    }) {
      return dispatch({
        type: 'REVOKE_REWARD',
        contentId,
        contentType,
        rewardId
      });
    },
    onSetActualDescription({
      contentId,
      contentType,
      description
    }: {
      contentId: number;
      contentType: string;
      description: string;
    }) {
      return dispatch({
        type: 'SET_ACTUAL_URL_DESCRIPTION',
        contentId,
        contentType,
        description
      });
    },
    onSetActualTitle({
      contentId,
      contentType,
      title
    }: {
      contentId: number;
      contentType: string;
      title: string;
    }) {
      return dispatch({
        type: 'SET_ACTUAL_URL_TITLE',
        contentId,
        contentType,
        title
      });
    },
    onSetByUserStatus({
      byUser,
      contentId,
      contentType
    }: {
      byUser: boolean;
      contentId: number;
      contentType: string;
    }) {
      return dispatch({
        type: 'SET_BY_USER_STATUS',
        byUser,
        contentId,
        contentType
      });
    },
    onSetCommentsShown({
      contentId,
      contentType
    }: {
      contentId: number;
      contentType: string;
    }) {
      return dispatch({
        type: 'SET_COMMENTS_SHOWN',
        contentId,
        contentType
      });
    },
    onSetCommentUploadingFile({
      contentId,
      contentType,
      uploading
    }: {
      contentId: number;
      contentType: string;
      uploading: boolean;
    }) {
      return dispatch({
        type: 'SET_COMMENT_UPLOADING_FILE',
        contentId,
        contentType,
        uploading
      });
    },
    onSetDisplayedCardIds({
      contentType,
      contentId,
      targetKey,
      cardIds
    }: {
      contentType: string;
      contentId: number;
      targetKey: string;
      cardIds: number[];
    }) {
      return dispatch({
        type: 'SET_DISPLAYED_CARD_IDS',
        contentType,
        contentId,
        targetKey,
        cardIds
      });
    },
    onSetEmbeddedUrl({
      contentId,
      contentType,
      url
    }: {
      contentId: number;
      contentType: string;
      url: string;
    }) {
      return dispatch({
        type: 'SET_EMBEDDED_URL',
        contentId,
        contentType,
        url
      });
    },
    onSetExistingContent({
      contentId,
      contentType,
      content
    }: {
      contentId: number;
      contentType: string;
      content: object;
    }) {
      return dispatch({
        type: 'SET_EXISTING_CONTENT',
        contentId,
        contentType,
        content
      });
    },
    onSetFullTextState({
      contentId,
      contentType,
      section,
      fullTextShown,
      textLength
    }: {
      contentId: number;
      contentType: string;
      section: string;
      fullTextShown: boolean;
      textLength: number;
    }) {
      return dispatch({
        type: 'SET_FULL_TEXT_STATE',
        contentId,
        contentType,
        section,
        fullTextShown,
        textLength
      });
    },
    onSetIsEditing({
      contentId,
      contentType,
      isEditing
    }: {
      contentId: number;
      contentType: string;
      isEditing: boolean;
    }) {
      return dispatch({
        type: 'SET_IS_EDITING',
        contentId,
        contentType,
        isEditing
      });
    },
    onSetPrevUrl({
      contentId,
      contentType,
      prevUrl
    }: {
      contentId: number;
      contentType: string;
      prevUrl: string;
    }) {
      return dispatch({
        type: 'SET_PREV_URL',
        contentId,
        contentType,
        prevUrl
      });
    },
    onSetRewardLevel({
      rewardLevel,
      contentType,
      contentId
    }: {
      rewardLevel: number;
      contentType: string;
      contentId: number;
    }) {
      return dispatch({
        type: 'SET_REWARD_LEVEL',
        rewardLevel,
        contentType,
        contentId
      });
    },
    onSetSiteUrl({
      contentId,
      contentType,
      siteUrl
    }: {
      contentId: number;
      contentType: string;
      siteUrl: string;
    }) {
      return dispatch({
        type: 'SET_SITE_URL',
        contentId,
        contentType,
        siteUrl
      });
    },
    onSetSubjectFormShown({
      contentId,
      contentType,
      shown
    }: {
      contentId: number;
      contentType: string;
      shown: boolean;
    }) {
      return dispatch({
        type: 'SET_SUBJECT_FORM_SHOWN',
        contentId,
        contentType,
        shown
      });
    },
    onSetSubjectRewardLevel({
      contentId,
      contentType,
      rewardLevel
    }: {
      contentId: number;
      contentType: string;
      rewardLevel: number;
    }) {
      return dispatch({
        type: 'SET_SUBJECT_REWARD_LEVEL',
        rewardLevel,
        contentId: Number(contentId),
        contentType
      });
    },
    onSetThumbUrl({
      contentId,
      contentType,
      thumbUrl,
      isSecretAttachment
    }: {
      contentId: number;
      contentType: string;
      thumbUrl: string;
      isSecretAttachment: boolean;
    }) {
      return dispatch({
        type: 'SET_THUMB_URL',
        contentId,
        contentType,
        thumbUrl,
        isSecretAttachment
      });
    },
    onSetUploadingFile({
      contentId,
      contentType,
      isUploading
    }: {
      contentId: number;
      contentType: string;
      isUploading: boolean;
    }) {
      return dispatch({
        type: 'SET_UPLOADING_FILE',
        contentId,
        contentType,
        isUploading
      });
    },
    onSetVideoProgress({
      videoId,
      progress
    }: {
      videoId: number;
      progress: number;
    }) {
      return dispatch({
        type: 'SET_VIDEO_PROGRESS',
        contentType: 'video',
        contentId: videoId,
        progress
      });
    },
    onSetVideoQuestions({
      questions,
      contentType,
      contentId
    }: {
      questions: object[];
      contentType: string;
      contentId: number;
    }) {
      return dispatch({
        type: 'SET_VIDEO_QUESTIONS',
        questions,
        contentType,
        contentId
      });
    },
    onSetMediaStarted({
      contentType,
      contentId,
      targetKey,
      started
    }: {
      contentType: string;
      contentId: number;
      targetKey?: string | number;
      started: boolean;
    }) {
      return dispatch({
        type: 'SET_MEDIA_STARTED',
        contentType,
        contentId,
        targetKey,
        started
      });
    },
    onSetTimeWatched({
      videoId,
      timeWatched
    }: {
      videoId: number;
      timeWatched: number;
    }) {
      return dispatch({
        type: 'SET_VIDEO_TIME_WATCHED',
        contentType: 'video',
        contentId: videoId,
        timeWatched
      });
    },
    onSetCommentVisible({
      visible,
      commentId
    }: {
      visible: boolean;
      commentId: number;
    }) {
      return dispatch({
        type: 'SET_COMMENT_VISIBLE',
        commentId,
        visible
      });
    },
    onSetSearchedPoster({
      contentId,
      contentType,
      poster
    }: {
      contentId: number;
      contentType: string;
      poster: object;
    }) {
      return dispatch({
        type: 'SET_SEARCHED_POSTER',
        contentId,
        contentType,
        poster
      });
    },
    onSetVideoCurrentTime({
      contentType,
      contentId,
      targetKey,
      currentTime,
      secretAttachmentCurrentTime
    }: {
      contentType: string;
      contentId: number;
      targetKey?: string | number;
      currentTime: number;
      secretAttachmentCurrentTime: number;
    }) {
      return dispatch({
        type: 'SET_VIDEO_CURRENT_TIME',
        contentType,
        contentId,
        targetKey,
        currentTime,
        secretAttachmentCurrentTime
      });
    },
    onSetXpRewardInterfaceShown({
      contentId,
      contentType,
      shown
    }: {
      contentId: number;
      contentType: string;
      shown: boolean;
    }) {
      return dispatch({
        type: 'SET_XP_REWARD_INTERFACE_SHOWN',
        contentId,
        contentType,
        shown
      });
    },
    onShowTCReplyInput({
      contentId,
      contentType
    }: {
      contentId: number;
      contentType: string;
    }) {
      return dispatch({
        type: 'SHOW_TC_REPLY_INPUT',
        contentId,
        contentType
      });
    },
    onUpdateSecretFileUploadProgress({
      contentId,
      contentType,
      progress
    }: {
      contentId: number;
      contentType: string;
      progress: number;
    }) {
      return dispatch({
        type: 'UPDATE_SECRET_FILE_UPLOAD_PROGRESS',
        contentId,
        contentType,
        progress
      });
    },
    onUpdateCommentFileUploadProgress({
      contentId,
      contentType,
      progress
    }: {
      contentId: number;
      contentType: string;
      progress: number;
    }) {
      return dispatch({
        type: 'UPDATE_COMMENT_FILE_UPLOAD_PROGRESS',
        progress,
        contentType,
        contentId
      });
    },
    onUpdateCommentPinStatus({
      contentType,
      contentId,
      commentId
    }: {
      contentType: string;
      contentId: number;
      commentId: number;
    }) {
      return dispatch({
        type: 'UPDATE_COMMENT_PIN_STATUS',
        contentType,
        contentId,
        commentId
      });
    },
    onUploadComment({
      contentId,
      contentType,
      ...data
    }: {
      contentId: number;
      contentType: string;
      data: object;
    }) {
      return dispatch({
        type: 'UPLOAD_COMMENT',
        data,
        contentId,
        contentType
      });
    },
    onUploadReply({
      contentId,
      contentType,
      ...data
    }: {
      contentId: number;
      contentType: string;
      data: object;
    }) {
      return dispatch({
        type: 'UPLOAD_REPLY',
        data,
        contentId,
        contentType
      });
    },
    onUploadSubject({
      contentType,
      contentId,
      ...subject
    }: {
      contentType: string;
      contentId: number;
      subject: object;
    }) {
      return dispatch({
        type: 'UPLOAD_SUBJECT',
        subject,
        contentId,
        contentType
      });
    },
    onUploadTargetComment({
      contentType,
      contentId,
      ...data
    }: {
      contentType: string;
      contentId: number;
      data: object;
    }) {
      return dispatch({
        type: 'UPLOAD_TARGET_COMMENT',
        data,
        contentType,
        contentId
      });
    }
  };
}
