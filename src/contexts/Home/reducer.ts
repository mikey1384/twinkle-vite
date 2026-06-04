export default function HomeReducer(
  state: any,
  action: {
    type: string;
    [key: string]: any;
  }
) {
  const contentKey =
    action.contentType && action.contentId
      ? action.contentType + action.contentId
      : 'temp';
  switch (action.type) {
    case 'UPDATE_GRAMMAR_LOADING_STATUS':
      return {
        ...state,
        grammarLoadingStatus: action.status
      };
    case 'UPDATE_GRAMMAR_GENERATION_PROGRESS':
      return {
        ...state,
        grammarGenerationProgress: action.progress
      };
    case 'CHANGE_CATEGORY':
      return {
        ...state,
        category: action.category
      };
    case 'CHANGE_SUB_FILTER':
      return {
        ...state,
        subFilter: action.subFilter
      };
    case 'CLEAR_FILE_UPLOAD_PROGRESS':
      return {
        ...state,
        fileUploadProgress: null,
        secretAttachmentUploadProgress: null
      };
    case 'DELETE_FEED':
      return {
        ...state,
        feeds: state.feeds.filter(
          (feed: { contentType: string; contentId: number }) =>
            feed.contentType + feed.contentId !== contentKey
        )
      };
    case 'DELETE_COMMENT': {
      const commentId = Number(action.commentId || 0);
      if (!commentId) return state;
      return {
        ...state,
        feeds: state.feeds
          .map((feed: any) => removeDeletedCommentFromHomeFeed(feed, commentId))
          .filter(Boolean)
      };
    }
    case 'SET_CURRENT_FEATURED_INDEX':
      return {
        ...state,
        currentFeaturedIndex: action.index
      };
    case 'SET_FEATURED_SUBJECTS_LOADED':
      return {
        ...state,
        featuredSubjectsLoaded: action.loaded
      };
    case 'LOAD_FEEDS':
      return {
        ...state,
        feedsOutdated: false,
        displayOrder: 'desc',
        feeds: action.feeds,
        loadMoreButton: action.loadMoreButton,
        loaded: true
      };
    case 'LOAD_MONTHLY_LEADERBOARDS':
      return {
        ...state,
        leaderboardsObj: {
          ...state.leaderboardsObj,
          [action.year]: {
            ...state.leaderboardsObj[action.year],
            loaded: true,
            expanded: false,
            leaderboards: action.leaderboards
          }
        }
      };
    case 'LOAD_MORE_FEEDS':
      return {
        ...state,
        feeds: [
          ...state.feeds,
          ...action.feeds.filter(
            (newFeed: any) =>
              !state.feeds.some(
                (existingFeed: any) => existingFeed.feedId === newFeed.feedId
              )
          )
        ],
        loadMoreButton: action.loadMoreButton
      };
    case 'RESET_FEEDS':
      return {
        ...state,
        category: 'recommended',
        currentFeaturedIndex: 0,
        displayOrder: 'desc',
        feeds: [],
        feedsOutdated: false,
        featuredSubjectsLoaded: false,
        loaded: false,
        loadMoreButton: false,
        subFilter: 'all'
      };
    case 'LOAD_NEW_FEEDS':
      return {
        ...state,
        feedsOutdated: false,
        feeds: action.data.concat(state.feeds)
      };
    case 'SET_DISPLAY_ORDER':
      return {
        ...state,
        displayOrder: action.order
      };
    case 'SET_INPUT_MODAL_SHOWN':
      return {
        ...state,
        inputModalShown: action.shown,
        inputModalType: action.shown ? action.modalType : null
      };
    case 'SET_TOP_MENU_SECTION':
      return {
        ...state,
        topMenuSection: action.section
      };
    case 'SET_FEEDS_OUTDATED':
      return {
        ...state,
        feedsOutdated: action.outdated
      };
    case 'SET_AI_STORIES_MODAL_SHOWN':
      return {
        ...state,
        aiStoriesModalShown: action.shown
      };
    case 'SET_DAILY_QUESTION_MODAL_SHOWN':
      return {
        ...state,
        dailyQuestionModalShown: action.shown
      };
    case 'LOAD_GROUPS':
      return {
        ...state,
        groupIds: action.groupIds,
        groupsObj: action.groupsObj,
        isGroupsLoaded: true,
        loadMoreGroupsShown: action.loadMoreShown
      };
    case 'LOAD_MORE_GROUPS':
      return {
        ...state,
        groupIds: [...state.groupIds, ...action.groupIds],
        groupsObj: {
          ...state.groupsObj,
          ...action.groupsObj
        },
        isGroupsLoaded: true,
        loadMoreGroupsShown: action.loadMoreShown
      };
    case 'RESET_GROUPS':
      return {
        ...state,
        groupIds: [],
        isGroupsLoaded: false,
        loadMoreGroupsShown: false
      };
    case 'CLEAR_SEARCHED_GROUPS':
      return {
        ...state,
        searchedGroupIds: []
      };
    case 'SEARCH_GROUPS':
      return {
        ...state,
        searchedGroupIds: action.groupIds,
        groupsObj: {
          ...state.groupsObj,
          ...action.groupsObj
        }
      };
    case 'SET_GROUP_STATE':
      return {
        ...state,
        groupsObj: {
          ...state.groupsObj,
          [action.groupId]: {
            ...state.groupsObj[action.groupId],
            ...action.newState
          }
        }
      };
    case 'SET_GROUPS_PREVIEW':
      return {
        ...state,
        previewGroups: action.groups
      };
    case 'SET_GRAMMAR_GAME_MODAL_SHOWN':
      return {
        ...state,
        grammarGameModalShown: action.shown
      };
    case 'SET_CHESS_PUZZLE_MODAL_SHOWN':
      return {
        ...state,
        chessPuzzleModalShown: action.shown
      };
    case 'SET_CHESS_OPTIONS_TARGET_USER':
      return {
        ...state,
        chessOptionsTargetUser: action.targetUser
      };
    case 'SET_LEADERBOARDS_EXPANDED':
      return {
        ...state,
        leaderboardsObj: {
          ...state.leaderboardsObj,
          [action.year]: {
            ...state.leaderboardsObj?.[action.year],
            expanded: action.expanded
          }
        }
      };
    case 'SET_GROUP_MEMBER_STATE':
      return {
        ...state,
        groupsObj: {
          ...state.groupsObj,
          [action.groupId]: {
            ...state.groupsObj[action.groupId],
            allMemberIds:
              action.action === 'add'
                ? [
                    ...(state.groupsObj[action.groupId]?.allMemberIds || []),
                    action.memberId
                  ]
                : (state.groupsObj[action.groupId]?.allMemberIds || []).filter(
                    (id: number) => id !== action.memberId
                  )
          }
        }
      };
    case 'SET_SUBMITTING_SUBJECT':
      return {
        ...state,
        submittingSubject: action.submitting
      };
    case 'SET_UPLOADING_FILE':
      return {
        ...state,
        uploadingFile: action.uploading
      };
    case 'UPDATE_FILE_UPLOAD_PROGRESS':
      return {
        ...state,
        fileUploadProgress: action.progress
      };
    case 'UPDATE_SECRET_ATTACHMENT_UPLOAD_PROGRESS':
      return {
        ...state,
        secretAttachmentUploadProgress: action.progress
      };
    default:
      return state;
  }
}

function removeDeletedCommentFromHomeFeed(feed: any, commentId: number) {
  if (
    String(feed?.contentType || '') === 'comment' &&
    Number(feed?.contentId || 0) === commentId
  ) {
    return null;
  }

  let changed = false;
  const nextFeed = { ...feed };
  const nextComments = removeDeletedCommentFromCommentList(
    feed?.comments,
    commentId
  );
  if (nextComments !== feed?.comments) {
    nextFeed.comments = nextComments;
    changed = true;
  }

  const nextPreviewContent = removeDeletedCommentFromFeedObject(
    feed?.previewContent,
    commentId
  );
  if (nextPreviewContent !== feed?.previewContent) {
    nextFeed.previewContent = nextPreviewContent;
    changed = true;
  }

  const nextTargetObj = removeDeletedCommentFromTargetObj(
    feed?.targetObj,
    commentId
  );
  if (nextTargetObj !== feed?.targetObj) {
    nextFeed.targetObj = nextTargetObj;
    changed = true;
  }

  return changed ? nextFeed : feed;
}

function removeDeletedCommentFromFeedObject(value: any, commentId: number) {
  if (!value) return value;
  let changed = false;
  const nextValue = { ...value };
  const nextComments = removeDeletedCommentFromCommentList(
    value.comments,
    commentId
  );
  if (nextComments !== value.comments) {
    nextValue.comments = nextComments;
    changed = true;
  }

  const nextTargetObj = removeDeletedCommentFromTargetObj(
    value.targetObj,
    commentId
  );
  if (nextTargetObj !== value.targetObj) {
    nextValue.targetObj = nextTargetObj;
    changed = true;
  }

  return changed ? nextValue : value;
}

function removeDeletedCommentFromTargetObj(targetObj: any, commentId: number) {
  if (!targetObj) return targetObj;
  let changed = false;
  const nextTargetObj = { ...targetObj };
  const targetComment = targetObj.comment;
  if (commentMatchesDeletedComment(targetComment, commentId)) {
    nextTargetObj.comment = {
      ...targetComment,
      isDeleted: true,
      notFound: true
    };
    changed = true;
  } else if (targetComment) {
    const nextTargetCommentComments = removeDeletedCommentFromCommentList(
      targetComment.comments,
      commentId
    );
    if (nextTargetCommentComments !== targetComment.comments) {
      nextTargetObj.comment = {
        ...targetComment,
        comments: nextTargetCommentComments
      };
      changed = true;
    }
  }

  const targetSubject = targetObj.subject;
  if (targetSubject) {
    const nextSubjectComments = removeDeletedCommentFromCommentList(
      targetSubject.comments,
      commentId
    );
    if (nextSubjectComments !== targetSubject.comments) {
      nextTargetObj.subject = {
        ...targetSubject,
        comments: nextSubjectComments
      };
      changed = true;
    }
  }

  return changed ? nextTargetObj : targetObj;
}

function removeDeletedCommentFromCommentList(
  comments: any[] | undefined,
  commentId: number
): any[] | undefined {
  if (!Array.isArray(comments)) return comments;
  let changed = false;
  const nextComments = [];
  for (const comment of comments) {
    if (commentMatchesDeletedComment(comment, commentId)) {
      changed = true;
      continue;
    }
    const nextReplies: any[] | undefined = removeDeletedCommentFromCommentList(
      comment?.replies,
      commentId
    );
    if (nextReplies !== comment?.replies) {
      nextComments.push({
        ...comment,
        replies: nextReplies
      });
      changed = true;
      continue;
    }
    nextComments.push(comment);
  }
  return changed ? nextComments : comments;
}

function commentMatchesDeletedComment(comment: any, commentId: number) {
  return Number(comment?.id || 0) === commentId;
}
