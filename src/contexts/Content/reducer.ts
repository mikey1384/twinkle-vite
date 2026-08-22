import { defaultContentState } from '~/constants/defaultValues';
import { v1 as uuidv1 } from 'uuid';
import { Comment, Reward, RewardCaps, Subject } from '~/types';
import { appendUniqueById, prependUniqueById } from './idListHelpers';
import {
  buildLiveCommentEntries,
  upsertLiveComments
} from '~/helpers/liveComments';
import { applySpoilerStatusChange } from './spoilerState';

type RewardListUpdater = (rewards: Reward[] | undefined) => Reward[];
type RewardCapsUpdater = (
  rewardCaps: RewardCaps | undefined
) => RewardCaps | undefined;

function rewardTargetMatches({
  candidateId,
  candidateType,
  contentId,
  contentType
}: {
  candidateId: unknown;
  candidateType: unknown;
  contentId: number;
  contentType: string;
}) {
  return (
    Number(candidateId) === Number(contentId) && candidateType === contentType
  );
}

function reconcileCommentRewards({
  comment,
  contentId,
  contentType,
  updateRewardCaps,
  updateRewards
}: {
  comment: any;
  contentId: number;
  contentType: string;
  updateRewardCaps?: RewardCapsUpdater;
  updateRewards?: RewardListUpdater;
}): any {
  if (!comment) return comment;
  const targetMatches = rewardTargetMatches({
    candidateId: comment.id,
    candidateType: 'comment',
    contentId,
    contentType
  });
  const rewards =
    targetMatches && updateRewards
      ? updateRewards(comment.rewards)
      : comment.rewards;
  const rewardCaps =
    targetMatches && updateRewardCaps
      ? updateRewardCaps(comment.rewardCaps)
      : comment.rewardCaps;
  const replies = reconcileCommentListRewards({
    comments: comment.replies,
    contentId,
    contentType,
    updateRewardCaps,
    updateRewards
  });
  if (
    rewards === comment.rewards &&
    rewardCaps === comment.rewardCaps &&
    replies === comment.replies
  ) {
    return comment;
  }
  return { ...comment, rewards, rewardCaps, replies };
}

function reconcileCommentListRewards({
  comments,
  contentId,
  contentType,
  updateRewardCaps,
  updateRewards
}: {
  comments: any;
  contentId: number;
  contentType: string;
  updateRewardCaps?: RewardCapsUpdater;
  updateRewards?: RewardListUpdater;
}): any {
  if (!Array.isArray(comments)) return comments;
  let changed = false;
  const nextComments = comments.map((comment) => {
    const nextComment = reconcileCommentRewards({
      comment,
      contentId,
      contentType,
      updateRewardCaps,
      updateRewards
    });
    changed ||= nextComment !== comment;
    return nextComment;
  });
  return changed ? nextComments : comments;
}

function reconcileSubjectRewards({
  subject,
  contentId,
  contentType,
  updateRewardCaps,
  updateRewards
}: {
  subject: any;
  contentId: number;
  contentType: string;
  updateRewardCaps?: RewardCapsUpdater;
  updateRewards?: RewardListUpdater;
}) {
  if (!subject) return subject;
  const targetMatches = rewardTargetMatches({
    candidateId: subject.id,
    candidateType: 'subject',
    contentId,
    contentType
  });
  const rewards =
    targetMatches && updateRewards
      ? updateRewards(subject.rewards)
      : subject.rewards;
  const rewardCaps =
    targetMatches && updateRewardCaps
      ? updateRewardCaps(subject.rewardCaps)
      : subject.rewardCaps;
  const comments = reconcileCommentListRewards({
    comments: subject.comments,
    contentId,
    contentType,
    updateRewardCaps,
    updateRewards
  });
  if (
    rewards === subject.rewards &&
    rewardCaps === subject.rewardCaps &&
    comments === subject.comments
  ) {
    return subject;
  }
  return { ...subject, rewards, rewardCaps, comments };
}

function reconcileSubjectListRewards({
  subjects,
  contentId,
  contentType,
  updateRewardCaps,
  updateRewards
}: {
  subjects: any;
  contentId: number;
  contentType: string;
  updateRewardCaps?: RewardCapsUpdater;
  updateRewards?: RewardListUpdater;
}) {
  if (!Array.isArray(subjects)) return subjects;
  let changed = false;
  const nextSubjects = subjects.map((subject) => {
    const nextSubject = reconcileSubjectRewards({
      subject,
      contentId,
      contentType,
      updateRewardCaps,
      updateRewards
    });
    changed ||= nextSubject !== subject;
    return nextSubject;
  });
  return changed ? nextSubjects : subjects;
}

function reconcileTargetRewards({
  targetObj,
  contentId,
  contentType,
  updateRewardCaps,
  updateRewards
}: {
  targetObj: any;
  contentId: number;
  contentType: string;
  updateRewardCaps?: RewardCapsUpdater;
  updateRewards?: RewardListUpdater;
}) {
  if (!targetObj) return targetObj;
  const comment = reconcileCommentRewards({
    comment: targetObj.comment,
    contentId,
    contentType,
    updateRewardCaps,
    updateRewards
  });
  const subject = reconcileSubjectRewards({
    subject: targetObj.subject,
    contentId,
    contentType,
    updateRewardCaps,
    updateRewards
  });
  if (comment === targetObj.comment && subject === targetObj.subject) {
    return targetObj;
  }
  return { ...targetObj, comment, subject };
}

function reconcileContentRewards({
  state,
  contentId,
  contentType,
  updateRewardCaps,
  updateRewards
}: {
  state: any;
  contentId: number;
  contentType: string;
  updateRewardCaps?: RewardCapsUpdater;
  updateRewards?: RewardListUpdater;
}) {
  let nextState = state;
  for (const [contentKey, contentState] of Object.entries<any>(state)) {
    const targetMatches = rewardTargetMatches({
      candidateId: contentState.contentId,
      candidateType: contentState.contentType,
      contentId,
      contentType
    });
    const rewards =
      targetMatches && updateRewards
        ? updateRewards(contentState.rewards)
        : contentState.rewards;
    const rewardCaps =
      targetMatches && updateRewardCaps
        ? updateRewardCaps(contentState.rewardCaps)
        : contentState.rewardCaps;
    const comments = reconcileCommentListRewards({
      comments: contentState.comments,
      contentId,
      contentType,
      updateRewardCaps,
      updateRewards
    });
    const subjects = reconcileSubjectListRewards({
      subjects: contentState.subjects,
      contentId,
      contentType,
      updateRewardCaps,
      updateRewards
    });
    const targetObj = reconcileTargetRewards({
      targetObj: contentState.targetObj,
      contentId,
      contentType,
      updateRewardCaps,
      updateRewards
    });
    if (
      rewards === contentState.rewards &&
      rewardCaps === contentState.rewardCaps &&
      comments === contentState.comments &&
      subjects === contentState.subjects &&
      targetObj === contentState.targetObj
    ) {
      continue;
    }
    if (nextState === state) nextState = { ...state };
    nextState[contentKey] = {
      ...contentState,
      rewards,
      rewardCaps,
      comments,
      subjects,
      targetObj
    };
  }
  return nextState;
}

// A comment entry this store creates itself still has to be a full content
// entry: EDIT_COMMENT and friends walk `comments` on every key unguarded.
function createLiveCommentEntry(contentId: number) {
  return {
    ...defaultContentState,
    contentId,
    contentType: 'comment'
  };
}

function syncLiveComments(state: any, comments: any, observedAt: number) {
  return upsertLiveComments({
    state,
    entries: buildLiveCommentEntries(comments),
    observedAt,
    createEntry: createLiveCommentEntry
  });
}

function buildObjectMatches(build: any, buildId: number) {
  if (!build || (build.contentType && build.contentType !== 'build')) {
    return false;
  }
  return (
    Number(build.contentId || 0) === buildId ||
    Number(build.id || 0) === buildId
  );
}

function patchBuildFavoriteObject(
  build: any,
  buildId: number,
  favoriteState: any
) {
  return buildObjectMatches(build, buildId)
    ? { ...build, ...favoriteState }
    : build;
}

function patchBuildFavoriteTargetObj(
  targetObj: any,
  buildId: number,
  favoriteState: any
) {
  if (!targetObj) return undefined;
  const nextTargetObj = patchBuildFavoriteObject(
    targetObj,
    buildId,
    favoriteState
  );
  const patchedTargetObj =
    nextTargetObj === targetObj ? { ...targetObj } : nextTargetObj;
  Object.keys(targetObj).forEach((key) => {
    const value = targetObj[key];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (key === 'build' || value.contentType === 'build')
    ) {
      patchedTargetObj[key] = patchBuildFavoriteObject(
        value,
        buildId,
        favoriteState
      );
    }
  });
  return patchedTargetObj;
}

export default function ContentReducer(
  state: any,
  action: {
    type: string;
    [key: string]: any;
  }
) {
  const contentKey =
    action.contentType && action.contentId
      ? action.contentType +
        action.contentId +
        (action.targetKey ? `/${action.targetKey}` : '')
      : 'temp';
  const defaultState = {
    contentType: action.contentType,
    contentId: action.contentId,
    ...defaultContentState
  };
  const prevContentState = state[contentKey] || defaultState;
  switch (action.type) {
    case 'RESET_CONTENT':
      return {};
    case 'INIT_CONTENT':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          ...action.data,
          loaded: true,
          contentId: action.contentId,
          contentType: action.contentType
        }
      };
    case 'SET_CONTENT_STATE':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          ...action.newState
        }
      };
    case 'ADD_TAGS':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          tags: prevContentState.tags.concat(action.tags)
        }
      };
    case 'ADD_TAG_TO_CONTENTS': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      for (const contentKey of contentKeys) {
        const prevContentState = newState[contentKey];
        newState[contentKey] = {
          ...prevContentState,
          tags:
            prevContentState.contentType === action.contentType &&
            action.contentIds.includes(prevContentState.contentId)
              ? (prevContentState.tags || []).concat({
                  id: action.tagId,
                  title: action.tagTitle
                })
              : prevContentState.tags
        };
      }
      return newState;
    }
    case 'ATTACH_REWARD': {
      return reconcileContentRewards({
        state,
        contentId: action.contentId,
        contentType: action.contentType,
        updateRewards: (rewards) => appendUniqueById(rewards, [action.reward])
      });
    }
    case 'CLEAR_CONTENT_REWARD_CAPS':
      return reconcileContentRewards({
        state,
        contentId: action.contentId,
        contentType: action.contentType,
        updateRewardCaps: () => undefined
      });
    case 'SYNC_CONTENT_REWARDS':
      return reconcileContentRewards({
        state,
        contentId: action.contentId,
        contentType: action.contentType,
        updateRewardCaps: () => action.rewardCaps,
        updateRewards: () => action.rewards
      });
    case 'CLEAR_COMMENT_FILE_UPLOAD_PROGRESS':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          fileUploadProgress: null
        }
      };
    case 'CHANGE_SPOILER_STATUS': {
      return applySpoilerStatusChange({
        state,
        contentId: action.contentId,
        contentType: action.contentType,
        prevSecretViewerId: action.prevSecretViewerId,
        shown: action.shown,
        missingSubjectState: {
          ...defaultState,
          contentType: 'subject',
          contentId: action.contentId,
          prevSecretViewerId: action.prevSecretViewerId,
          secretShown: action.shown
        }
      });
    }
    case 'UPDATE_USER_COINS':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          twinkleCoins: action.coins
        }
      };
    case 'CLOSE_CONTENT':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          isClosedBy: action.userId
        }
      };
    case 'OPEN_CONTENT':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          isClosedBy: null
        }
      };
    case 'DELETE_COMMENT': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      for (const contentKey of contentKeys) {
        const prevContentState = newState[contentKey];
        const contentDeleteStatus: {
          isDeleted: boolean;
          isDeleteNotification: boolean;
        } = {
          isDeleted: prevContentState.isDeleted,
          isDeleteNotification: prevContentState.isDeleteNotification
        };
        if (
          prevContentState.contentId === action.commentId &&
          prevContentState.contentType === 'comment'
        ) {
          if (
            !!prevContentState?.rootObj?.secretAnswer ||
            !!prevContentState?.rootObj?.secretAttachment
          ) {
            contentDeleteStatus.isDeleted = false;
            contentDeleteStatus.isDeleteNotification = true;
          } else {
            contentDeleteStatus.isDeleted = true;
          }
        }
        newState[contentKey] = {
          ...prevContentState,
          ...contentDeleteStatus,
          comments: prevContentState.comments?.map((comment: Comment) => {
            const deleteStatus: {
              isDeleted: boolean;
              isDeleteNotification: boolean;
            } = { isDeleted: true, isDeleteNotification: false };
            if (comment.id === action.commentId) {
              if (
                !comment.commentId &&
                !comment.replyId &&
                (!!prevContentState.secretAnswer ||
                  !!prevContentState.secretAttachment)
              ) {
                deleteStatus.isDeleted = false;
                deleteStatus.isDeleteNotification = true;
              }
            }
            return comment.id === action.commentId
              ? { ...comment, ...deleteStatus }
              : {
                  ...comment,
                  replies: (comment.replies || []).map((reply) =>
                    reply.id === action.commentId
                      ? { ...reply, ...deleteStatus }
                      : reply
                  )
                };
          }),
          subjects: prevContentState.subjects?.map((subject: Subject) => ({
            ...subject,
            comments: subject.comments?.map((comment) =>
              comment.id === action.commentId
                ? { ...comment, isDeleted: true }
                : {
                    ...comment,
                    replies: (comment.replies || []).map((reply) =>
                      reply.id === action.commentId
                        ? { ...reply, isDeleted: true }
                        : reply
                    )
                  }
            )
          })),
          targetObj: prevContentState.targetObj
            ? {
                ...prevContentState.targetObj,
                comment: prevContentState.targetObj.comment
                  ? {
                      ...prevContentState.targetObj.comment,
                      isDeleted:
                        prevContentState.targetObj.comment.id ===
                        action.commentId,
                      comments:
                        prevContentState.targetObj.comment.comments?.map(
                          (comment: Comment) =>
                            comment.id === action.commentId
                              ? { ...comment, isDeleted: true }
                              : comment
                        )
                    }
                  : undefined
              }
            : undefined
        };
      }
      return newState;
    }
    case 'DELETE_CONTENT':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          isDeleted: true
        }
      };
    case 'DELETE_SUBJECT': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      for (const contentKey of contentKeys) {
        const prevContentState = newState[contentKey];
        newState[contentKey] = {
          ...prevContentState,
          subjects: prevContentState.subjects?.filter(
            (subject: Subject) => subject.id !== action.subjectId
          )
        };
      }
      return newState;
    }
    case 'EDIT_COMMENT': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      for (const contentKey of contentKeys) {
        const prevContentState = newState[contentKey];
        const editedThisEntry = prevContentState.contentId === action.commentId;
        newState[contentKey] = {
          ...prevContentState,
          // This client just wrote the edit, so its entry is the newest copy —
          // stamp it or a feed page fetched before the edit could undo it.
          ...(editedThisEntry && action.observedAt
            ? { liveObservedAt: action.observedAt }
            : {}),
          content: editedThisEntry
            ? action.editedComment
            : prevContentState.content,
          comments: prevContentState.comments.map((comment: Comment) => ({
            ...comment,
            content:
              comment.id === action.commentId
                ? action.editedComment
                : comment.content,
            replies: (comment.replies || []).map((reply) =>
              reply.id === action.commentId
                ? {
                    ...reply,
                    content: action.editedComment
                  }
                : reply
            )
          })),
          targetObj: prevContentState.targetObj
            ? {
                ...prevContentState.targetObj,
                comment: prevContentState.targetObj.comment
                  ? {
                      ...prevContentState.targetObj.comment,
                      comments:
                        prevContentState.targetObj.comment.comments?.map(
                          (comment: Comment) =>
                            comment.id === action.commentId
                              ? {
                                  ...comment,
                                  content: action.editedComment
                                }
                              : comment
                        )
                    }
                  : undefined
              }
            : undefined,
          subjects: prevContentState.subjects?.map((subject: Subject) => ({
            ...subject,
            comments: subject.comments?.map((comment) => ({
              ...comment,
              content:
                comment.id === action.commentId
                  ? action.editedComment
                  : comment.content,
              replies: (comment.replies || []).map((reply) =>
                reply.id === action.commentId
                  ? {
                      ...reply,
                      content: action.editedComment
                    }
                  : reply
              )
            }))
          }))
        };
      }
      return newState;
    }
    case 'EDIT_CONTENT': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      // Surfaces that render a content snapshot they received from a feed
      // payload (home feed previews, embedded comment previews) read the
      // canonical copy from this store, so an edit must land under the edited
      // content's own key even when nothing has loaded it yet.
      if (action.contentType && action.contentId && !newState[contentKey]) {
        newState[contentKey] = {
          ...defaultState,
          ...action.data
        };
      }
      for (const contentKey of contentKeys) {
        const prevContentState = newState[contentKey];
        const contentMatches =
          prevContentState.contentId === action.contentId &&
          prevContentState.contentType === action.contentType;
        newState[contentKey] = {
          ...prevContentState,
          ...(contentMatches ? action.data : {}),
          comments:
            action.contentType === 'comment'
              ? prevContentState.comments?.map((comment: Comment) => {
                  const commentMatches = comment.id === action.contentId;
                  return {
                    ...comment,
                    ...(commentMatches ? action.data : {}),
                    replies: (comment.replies || []).map((reply) => {
                      const replyMatches = reply.id === action.contentId;
                      return {
                        ...reply,
                        ...(replyMatches ? action.data : {})
                      };
                    })
                  };
                })
              : prevContentState.comments,
          subjects: prevContentState.subjects?.map((subject: Subject) => {
            const subjectMatches =
              subject.id === action.contentId &&
              action.contentType === 'subject';
            return {
              ...subject,
              ...(subjectMatches ? action.data : {}),
              comments:
                action.contentType === 'comment'
                  ? subject.comments.map((comment) => {
                      const commentMatches = comment.id === action.contentId;
                      return {
                        ...comment,
                        ...(commentMatches ? action.data : {}),
                        replies: (comment.replies || []).map((reply) => {
                          const replyMatches = reply.id === action.contentId;
                          return {
                            ...reply,
                            ...(replyMatches ? action.data : {})
                          };
                        })
                      };
                    })
                  : subject.comments
            };
          }),
          targetObj: prevContentState.targetObj
            ? {
                ...prevContentState.targetObj,
                comment: prevContentState.targetObj.comment
                  ? {
                      ...prevContentState.targetObj.comment,
                      ...(prevContentState.targetObj.comment.id ===
                        action.contentId && action.contentType === 'comment'
                        ? action.data
                        : {}),
                      comments:
                        action.contentType === 'comment'
                          ? prevContentState.targetObj.comment.comments?.map(
                              (comment: Comment) => ({
                                ...comment,
                                ...(comment.id === action.contentId
                                  ? action.data
                                  : {}),
                                replies: (comment.replies || []).map((reply) =>
                                  reply.id === action.contentId
                                    ? { ...reply, ...action.data }
                                    : reply
                                )
                              })
                            )
                          : prevContentState.targetObj.comment.comments
                    }
                  : undefined,
                subject: prevContentState.targetObj.subject
                  ? {
                      ...prevContentState.targetObj.subject,
                      ...(prevContentState.targetObj.subject.id ===
                        action.contentId && action.contentType === 'subject'
                        ? action.data
                        : {})
                    }
                  : undefined
              }
            : undefined
        };
      }
      return newState;
    }
    case 'EDIT_REWARD_COMMENT': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      for (const contentKey of contentKeys) {
        const prevContentState = newState[contentKey];
        newState[contentKey] = {
          ...prevContentState,
          rewards: prevContentState.rewards?.map((reward: Reward) => ({
            ...reward,
            rewardComment:
              reward.id === action.id ? action.text : reward.rewardComment
          })),
          comments: prevContentState.comments?.map((comment: Comment) => ({
            ...comment,
            rewards: comment.rewards?.map((reward) => ({
              ...reward,
              rewardComment:
                reward.id === action.id ? action.text : reward.rewardComment
            })),
            replies: (comment.replies || []).map((reply) => ({
              ...reply,
              rewards: reply.rewards?.map((reward) => ({
                ...reward,
                rewardComment:
                  reward.id === action.id ? action.text : reward.rewardComment
              }))
            }))
          })),
          subjects: prevContentState.subjects?.map((subject: Subject) => ({
            ...subject,
            comments: subject.comments.map((comment) => ({
              ...comment,
              rewards: comment.rewards
                ? comment.rewards.map((reward) => ({
                    ...reward,
                    rewardComment:
                      reward.id === action.id
                        ? action.text
                        : reward.rewardComment
                  }))
                : [],
              replies: (comment.replies || []).map((reply) => ({
                ...reply,
                rewards: reply.rewards
                  ? reply.rewards.map((reward) => ({
                      ...reward,
                      rewardComment:
                        reward.id === action.id
                          ? action.text
                          : reward.rewardComment
                    }))
                  : []
              }))
            }))
          })),
          targetObj: prevContentState.targetObj
            ? {
                ...prevContentState.targetObj,
                comment: prevContentState.targetObj.comment
                  ? {
                      ...prevContentState.targetObj.comment,
                      rewards: prevContentState.targetObj.comment.rewards?.map(
                        (reward: Reward) => ({
                          ...reward,
                          rewardComment:
                            reward.id === action.id
                              ? action.text
                              : reward.rewardComment
                        })
                      )
                    }
                  : undefined
              }
            : undefined
        };
      }
      return newState;
    }
    case 'EDIT_SUBJECT': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      for (const contentKey of contentKeys) {
        const prevContentState = newState[contentKey];
        const contentMatches =
          prevContentState.contentId === action.subjectId &&
          prevContentState.contentType === 'subject';
        newState[contentKey] = {
          ...prevContentState,
          ...(contentMatches ? action.editedSubject : {}),
          subjects: prevContentState.subjects?.map((subject: Subject) =>
            subject.id === action.subjectId
              ? {
                  ...subject,
                  ...action.editedSubject
                }
              : subject
          )
        };
      }
      return newState;
    }
    case 'INCREASE_NUM_COINS_EARNED':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          numCoinsEarned: (prevContentState.numCoinsEarned || 0) + action.amount
        }
      };
    case 'INCREASE_NUM_XP_EARNED':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          numXpEarned: (prevContentState.numXpEarned || 0) + action.amount
        }
      };
    case 'LIKE_COMMENT': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      for (const contentKey of contentKeys) {
        const prevContentState = newState[contentKey];
        newState[contentKey] = {
          ...prevContentState,
          comments: prevContentState.comments.map((comment: Comment) => {
            return {
              ...comment,
              likes:
                comment.id === action.commentId ? action.likes : comment.likes,
              replies: (comment.replies || []).map((reply) => {
                return {
                  ...reply,
                  likes:
                    reply.id === action.commentId ? action.likes : reply.likes
                };
              })
            };
          }),
          subjects: prevContentState.subjects?.map(
            (subject: { id: number; comments: Comment[] }) => {
              return {
                ...subject,
                comments: subject.comments.map((comment) => {
                  return {
                    ...comment,
                    likes:
                      comment.id === action.commentId
                        ? action.likes
                        : comment.likes,
                    replies: (comment.replies || []).map((reply) => {
                      return {
                        ...reply,
                        likes:
                          reply.id === action.commentId
                            ? action.likes
                            : reply.likes
                      };
                    })
                  };
                })
              };
            }
          )
        };
      }
      return newState;
    }
    case 'UPDATE_BUILD_FAVORITE': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      const favoriteState = {
        isFavorited: action.isFavorited,
        favoritedAt: action.isFavorited ? action.favoritedAt : null
      };
      for (const contentKey of contentKeys) {
        const prevContentState = newState[contentKey];
        const contentMatches = buildObjectMatches(
          prevContentState,
          action.buildId
        );
        const rootBuildMatches =
          (prevContentState.rootType === 'build' &&
            Number(prevContentState.rootId || 0) === action.buildId) ||
          buildObjectMatches(prevContentState.rootObj, action.buildId);
        newState[contentKey] = {
          ...prevContentState,
          ...(contentMatches ? favoriteState : {}),
          build: prevContentState.build
            ? patchBuildFavoriteObject(
                prevContentState.build,
                action.buildId,
                favoriteState
              )
            : prevContentState.build,
          rootObj: prevContentState.rootObj
            ? patchBuildFavoriteObject(
                {
                  ...prevContentState.rootObj,
                  ...(rootBuildMatches ? favoriteState : {})
                },
                action.buildId,
                favoriteState
              )
            : undefined,
          targetObj: patchBuildFavoriteTargetObj(
            prevContentState.targetObj,
            action.buildId,
            favoriteState
          )
        };
      }
      return newState;
    }
    case 'LIKE_CONTENT': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      for (const contentKey of contentKeys) {
        const prevContentState = newState[contentKey];
        newState[contentKey] = {
          ...prevContentState,
          likes:
            prevContentState.contentId === action.contentId &&
            prevContentState.contentType === action.contentType
              ? action.likes
              : prevContentState.likes,
          comments:
            action.contentType === 'comment'
              ? prevContentState.comments?.map((comment: Comment) => ({
                  ...comment,
                  likes:
                    comment.id === action.contentId
                      ? action.likes
                      : comment.likes,
                  replies: (comment.replies || []).map((reply) => ({
                    ...reply,
                    likes:
                      reply.id === action.contentId
                        ? action.likes
                        : reply.likes,
                    replies: (reply.replies || []).map((reply) => ({
                      ...reply,
                      likes:
                        reply.id === action.contentId
                          ? action.likes
                          : reply.likes
                    }))
                  }))
                }))
              : prevContentState.comments,
          rootObj: prevContentState.rootObj
            ? {
                ...prevContentState.rootObj,
                likes:
                  prevContentState.rootId === action.contentId &&
                  prevContentState.rootType === action.contentType
                    ? action.likes
                    : prevContentState.rootObj.likes
              }
            : undefined,
          targetObj: prevContentState.targetObj
            ? {
                ...prevContentState.targetObj,
                [action.contentType]: prevContentState.targetObj[
                  action.contentType
                ]
                  ? {
                      ...prevContentState.targetObj[action.contentType],
                      likes:
                        prevContentState.targetObj[action.contentType].id ===
                        action.contentId
                          ? action.likes
                          : prevContentState.targetObj[action.contentType].likes
                    }
                  : undefined
              }
            : undefined
        };
      }
      return newState;
    }
    case 'LOAD_COMMENTS': {
      // The loaded thread is a server response like any other, so its copies
      // update `comment<id>` too. Without this a feed page could overwrite the
      // canonical entry with an older snapshot of a comment this client had
      // just re-read.
      const stateWithLiveComments = syncLiveComments(
        state,
        action.comments,
        action.observedAt
      );
      return {
        ...stateWithLiveComments,
        [contentKey]: {
          ...prevContentState,
          commentsLoaded: !action.isPreview,
          previewLoaded: true,
          comments: action.comments,
          commentsLoadMoreButton: action.loadMoreButton
        }
      };
    }
    case 'SYNC_SERVER_COMMENTS':
      return upsertLiveComments({
        state,
        entries: action.entries,
        observedAt: action.observedAt,
        createEntry: createLiveCommentEntry
      });
    case 'LOAD_MORE_COMMENTS': {
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          comments:
            prevContentState.contentType === 'comment' &&
            !action.isRepliesOfReply
              ? (action.comments || []).concat(prevContentState.comments)
              : (prevContentState.comments || []).concat(action.comments),
          commentsLoadMoreButton: action.loadMoreButton
        }
      };
    }
    case 'LOAD_MORE_REPLIES':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          comments: prevContentState.comments.map((comment: Comment) => ({
            ...comment,
            replies:
              comment.id === action.commentId
                ? (action.replies || []).concat(comment.replies)
                : comment.replies,
            loadMoreButton:
              comment.id === action.commentId
                ? action.loadMoreButton
                : comment.loadMoreButton
          }))
        }
      };
    case 'LOAD_MORE_SUBJECT_COMMENTS':
      return {
        ...state,
        ['subject' + action.subjectId]: {
          ...state['subject' + action.subjectId],
          comments: state['subject' + action.subjectId].comments.concat(
            action.comments
          )
        },
        [contentKey]: {
          ...prevContentState,
          subjects: prevContentState.subjects?.map((subject: Subject) => {
            if (subject.id === action.subjectId) {
              return {
                ...subject,
                comments: subject.comments.concat(action.comments),
                loadMoreCommentsButton: action.loadMoreButton
              };
            }
            return subject;
          })
        }
      };
    case 'LOAD_MORE_SUBJECT_REPLIES':
      return {
        ...state,
        ['subject' + action.subjectId]: {
          ...state['subject' + action.subjectId],
          comments: state['subject' + action.subjectId].comments.map(
            (comment: Comment) => {
              return {
                ...comment,
                replies:
                  comment.id === action.commentId
                    ? action.replies.concat(comment.replies)
                    : comment.replies,
                loadMoreButton:
                  comment.id === action.commentId
                    ? action.loadMoreButton
                    : comment.loadMoreButton
              };
            }
          )
        },
        [contentKey]: {
          ...prevContentState,
          subjects: prevContentState.subjects?.map((subject: Subject) => {
            return {
              ...subject,
              comments: subject.comments.map((comment) => {
                return {
                  ...comment,
                  replies:
                    comment.id === action.commentId
                      ? action.replies.concat(comment.replies)
                      : comment.replies,
                  loadMoreButton:
                    comment.id === action.commentId
                      ? action.loadMoreButton
                      : comment.loadMoreButton
                };
              })
            };
          })
        }
      };
    case 'LOAD_MORE_SUBJECTS': {
      const subjectStates: { [key: string]: any } = {};
      for (const subject of action.results) {
        subjectStates['subject' + subject.id] = subject;
      }
      return {
        ...state,
        ...subjectStates,
        [contentKey]: {
          ...prevContentState,
          subjects: (prevContentState.subjects || []).concat(action.results),
          subjectsLoadMoreButton: action.loadMoreButton
        }
      };
    }
    case 'LOAD_REPLIES':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          comments: prevContentState.comments.map((comment: Comment) => {
            if (comment.id === action.commentId) {
              return {
                ...comment,
                numReplies: 0,
                replies: action.replies,
                loadMoreButton: action.loadMoreButton
              };
            }
            return comment;
          })
        }
      };
    case 'LOAD_PLAYLIST_VIDEOS':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          videos: action.videos,
          loadMoreShown: action.loadMoreShown,
          loaded: true
        }
      };
    case 'LOAD_MORE_PLAYLIST_VIDEOS':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          videos: prevContentState.videos.concat(action.videos),
          loadMoreShown: action.loadMoreShown
        }
      };
    case 'LOAD_REPLIES_OF_REPLY':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          comments: prevContentState.comments.map((comment: Comment) => {
            if (comment.id === action.commentId) {
              const replies = comment.replies || [];
              const replyIds = replies.map((reply) => reply.id);
              const loadedReplies = action.replies.filter(
                (reply: Comment) => !replyIds.includes(reply.id)
              );
              const targetReplyIndex = replies
                .map((reply) => reply.id)
                .indexOf(action.loadMoreButtonId || action.replyId);
              return {
                ...comment,
                replies: [
                  ...replies
                    .filter(
                      (reply, index) =>
                        index <= targetReplyIndex &&
                        reply.id !== action.loadMoreButtonId
                    )
                    .map((reply) =>
                      reply.id ===
                      (action.rootReplyId ? action.rootReplyId : action.replyId)
                        ? {
                            ...reply,
                            isExpanded: true
                          }
                        : reply
                    ),
                  ...loadedReplies,
                  ...(action.loadMoreButton
                    ? [
                        {
                          id: uuidv1(),
                          userId: uuidv1(),
                          commentId: action.commentId,
                          rootReplyId: action.rootReplyId || action.replyId,
                          lastReplyId:
                            action.replies[action.replies.length - 1].id,
                          isLoadMoreButton: true
                        }
                      ]
                    : []),
                  ...replies.filter(
                    (reply, index) =>
                      index > targetReplyIndex &&
                      reply.id !== action.loadMoreButtonId
                  )
                ]
              };
            }
            let containsRootReply = false;
            for (const reply of comment.replies || []) {
              if (reply.id === action.replyId) {
                containsRootReply = true;
                break;
              }
            }
            if (containsRootReply) {
              const targetReplyIndex = (comment.replies || [])
                .map((reply) => reply.id)
                .indexOf(action.replyId);
              const replies = (comment.replies || []).filter(
                (reply, index) => index <= targetReplyIndex
              );
              const replyIds = (comment.replies || []).map((reply) => reply.id);
              const loadedReplies = action.replies.filter(
                (reply: Comment) => !replyIds.includes(reply.id)
              );
              replies[replies.length - 1] = {
                ...replies[replies.length - 1],
                isExpanded: true
              };
              return {
                ...comment,
                replies: [
                  ...replies.map((reply) =>
                    reply.id === action.replyId
                      ? {
                          ...reply,
                          isExpanded: true
                        }
                      : reply
                  ),
                  ...loadedReplies,
                  ...(comment.replies || []).filter(
                    (reply, index) => index > targetReplyIndex
                  )
                ]
              };
            }
            return comment;
          })
        }
      };
    case 'LOAD_SUBJECT_REPLIES_OF_REPLY':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          comments: prevContentState.comments.map((comment: Comment) => {
            const replyIds = (comment.replies || []).map((reply) => reply.id);
            const loadedReplies = action.replies.filter(
              (reply: Comment) => !replyIds.includes(reply.id)
            );
            if (comment.id === action.commentId) {
              return {
                ...comment,
                replies: [
                  ...(comment.replies || [])
                    .filter((reply) => reply.id <= action.replyId)
                    .map((reply) =>
                      reply.id === action.replyId
                        ? {
                            ...reply,
                            isExpanded: true
                          }
                        : reply
                    ),
                  ...loadedReplies,
                  ...(comment.replies || []).filter(
                    (reply) => reply.id > action.replyId
                  )
                ]
              };
            }
            let containsRootReply = false;
            for (const reply of comment.replies || []) {
              if (reply.id === action.replyId) {
                containsRootReply = true;
                break;
              }
            }
            if (containsRootReply) {
              const replies = (comment.replies || []).filter(
                (reply) => reply.id <= action.replyId
              );
              replies[replies.length - 1] = {
                ...replies[replies.length - 1],
                isExpanded: true
              };
              const replyIds = (comment.replies || []).map((reply) => reply.id);
              const loadedReplies = action.replies.filter(
                (reply: Comment) => !replyIds.includes(reply.id)
              );
              return {
                ...comment,
                replies: [
                  ...replies.map((reply) =>
                    reply.id === action.replyId
                      ? {
                          ...reply,
                          isExpanded: true
                        }
                      : reply
                  ),
                  ...loadedReplies,
                  ...(comment.replies || []).filter(
                    (reply) => reply.id > action.replyId
                  )
                ]
              };
            }
            return comment;
          })
        }
      };
    case 'LOAD_SUBJECTS': {
      if (!action.subjects) return state;
      const subjectStates: { [key: string]: any } = {};
      for (const subject of action.subjects) {
        subjectStates['subject' + subject.id] = subject;
      }
      return {
        ...state,
        ...subjectStates,
        [contentKey]: {
          ...prevContentState,
          subjectsLoaded: true,
          subjects: action.subjects,
          subjectsLoadMoreButton: action.loadMoreButton
        }
      };
    }
    case 'LOAD_SUBJECT_COMMENTS':
      return {
        ...state,
        ['subject' + action.subjectId]: {
          ...state['subject' + action.subjectId],
          comments: action.comments,
          loadMoreCommentsButton: action.loadMoreButton
        },
        [contentKey]: {
          ...prevContentState,
          subjects: prevContentState.subjects?.map((subject: Subject) => {
            if (subject.id === action.subjectId) {
              return {
                ...subject,
                comments: action.comments,
                loadMoreCommentsButton: action.loadMoreButton
              };
            }
            return subject;
          })
        }
      };
    case 'LOAD_TAGS':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          tags: action.tags
        }
      };
    case 'RECOMMEND_CONTENT': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      for (const contentKey of contentKeys) {
        const prevContentState = newState[contentKey];
        newState[contentKey] = {
          ...prevContentState,
          recommendations:
            prevContentState.contentId === action.contentId &&
            prevContentState.contentType === action.contentType
              ? action.recommendations
              : prevContentState.recommendations,
          comments:
            action.contentType === 'comment'
              ? (prevContentState.comments || []).map((comment: Comment) => ({
                  ...comment,
                  recommendations:
                    comment.id === action.contentId
                      ? action.recommendations
                      : comment.recommendations,
                  replies: (comment.replies || []).map((reply) => ({
                    ...reply,
                    recommendations:
                      reply.id === action.contentId
                        ? action.recommendations
                        : reply.recommendations,
                    replies: (reply.replies || []).map((reply) => ({
                      ...reply,
                      recommendations:
                        reply.id === action.contentId
                          ? action.recommendations
                          : reply.recommendations
                    }))
                  }))
                }))
              : prevContentState.comments,
          rootObj: prevContentState.rootObj
            ? {
                ...prevContentState.rootObj,
                recommendations:
                  prevContentState.rootId === action.contentId &&
                  prevContentState.rootType === action.contentType
                    ? action.recommendations
                    : prevContentState.rootObj.recommendations
              }
            : undefined,
          targetObj: prevContentState.targetObj
            ? {
                ...prevContentState.targetObj,
                [action.contentType]: prevContentState.targetObj[
                  action.contentType
                ]
                  ? {
                      ...prevContentState.targetObj[action.contentType],
                      recommendations:
                        prevContentState.targetObj[action.contentType].id ===
                        action.contentId
                          ? action.recommendations
                          : prevContentState.targetObj[action.contentType]
                              .recommendations
                    }
                  : undefined
              }
            : undefined
        };
      }
      return newState;
    }
    case 'RECOMMEND_SUBJECT': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      for (const contentKey of contentKeys) {
        const prevContentState = newState[contentKey];
        newState[contentKey] = {
          ...prevContentState,
          subjects: prevContentState.subjects?.map((subject: Subject) =>
            subject.id === action.subjectId
              ? {
                  ...subject,
                  recommendations: action.recommendations
                }
              : subject
          )
        };
      }
      return newState;
    }
    case 'RELOAD_CONTENT':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          commentsLoaded: false,
          loaded: false
        }
      };
    case 'REVOKE_REWARD': {
      return reconcileContentRewards({
        state,
        contentId: action.contentId,
        contentType: action.contentType,
        updateRewards: (rewards) =>
          (rewards || []).filter(
            (reward: Reward) => reward.id !== action.rewardId
          )
      });
    }
    case 'SET_ACTUAL_URL_DESCRIPTION':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          [action.contentType === 'url'
            ? 'actualDescription'
            : 'linkDescription']: action.description
        }
      };
    case 'SET_ACTUAL_URL_TITLE':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          [action.contentType === 'url' ? 'actualTitle' : 'linkTitle']:
            action.title
        }
      };
    case 'SET_BY_USER_STATUS':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          byUser: action.byUser,
          rootObj: prevContentState.rootObj
            ? { ...prevContentState.rootObj, byUser: action.byUser }
            : undefined
        }
      };
    case 'SET_SEARCHED_POSTER':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          searchedPoster: action.poster
        }
      };
    case 'SET_COMMENTS_SHOWN':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          commentsShown: true
        }
      };
    case 'SET_COMMENT_UPLOADING_FILE':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          uploadingFile: action.uploading
        }
      };
    case 'SET_DISPLAYED_CARD_IDS':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          cardIds: action.cardIds
        }
      };
    case 'SET_EMBEDDED_URL':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          embeddedUrl: action.url
        }
      };
    case 'SET_EXISTING_CONTENT':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          existingContent: action.content
        }
      };
    case 'SET_IS_EDITING':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          isEditing: action.isEditing
        }
      };
    case 'SET_PREV_URL':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          prevUrl: action.prevUrl
        }
      };
    case 'SET_REWARD_LEVEL': {
      const newState = { ...state };
      if (
        action.contentType === 'subject' &&
        action.contentId &&
        !newState[contentKey]
      ) {
        newState[contentKey] = {
          ...defaultState,
          contentId: action.contentId,
          contentType: action.contentType,
          rewardLevel: action.rewardLevel,
          rewardLevelRevision: action.rewardLevelRevision
        };
      }
      const contentKeys = Object.keys(newState);
      for (const contentKey of contentKeys) {
        const prevContentState = newState[contentKey];
        const contentMatches =
          prevContentState.contentId === action.contentId &&
          prevContentState.contentType === action.contentType;
        const rootMatches =
          prevContentState.rootId === action.contentId &&
          prevContentState.rootType === action.contentType;
        newState[contentKey] = {
          ...prevContentState,
          rewardLevel: contentMatches
            ? action.rewardLevel
            : prevContentState.rewardLevel,
          rewardLevelRevision: contentMatches
            ? action.rewardLevelRevision
            : prevContentState.rewardLevelRevision,
          subjects: prevContentState.subjects?.map((subject: Subject) => {
            const subjectMatches =
              subject.id === action.contentId &&
              action.contentType === 'subject';
            return {
              ...subject,
              rewardLevel: subjectMatches
                ? action.rewardLevel
                : subject.rewardLevel,
              rewardLevelRevision: subjectMatches
                ? action.rewardLevelRevision
                : subject.rewardLevelRevision
            };
          }),
          rootObj: prevContentState.rootObj
            ? {
                ...prevContentState.rootObj,
                rewardLevel: rootMatches
                  ? action.rewardLevel
                  : prevContentState.rootObj.rewardLevel,
                rewardLevelRevision: rootMatches
                  ? action.rewardLevelRevision
                  : prevContentState.rootObj.rewardLevelRevision
              }
            : undefined,
          targetObj: prevContentState.targetObj
            ? {
                ...prevContentState.targetObj,
                subject: prevContentState.targetObj.subject
                  ? {
                      ...prevContentState.targetObj.subject,
                      rewardLevel:
                        prevContentState.targetObj.subject.id ===
                          action.contentId && action.contentType === 'subject'
                          ? action.rewardLevel
                          : prevContentState.targetObj.subject.rewardLevel,
                      rewardLevelRevision:
                        prevContentState.targetObj.subject.id ===
                          action.contentId && action.contentType === 'subject'
                          ? action.rewardLevelRevision
                          : prevContentState.targetObj.subject
                              .rewardLevelRevision
                    }
                  : undefined
              }
            : undefined
        };
      }
      return newState;
    }
    case 'SET_SITE_URL':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          [action.contentType === 'url' ? 'siteUrl' : 'linkUrl']: action.siteUrl
        }
      };
    case 'SET_SUBJECT_FORM_SHOWN':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          subjectFormShown: action.shown
        }
      };
    case 'SET_SUBJECT_REWARD_LEVEL':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          subjects: prevContentState.subjects?.map((subject: Subject) => {
            return subject.id === action.contentId
              ? {
                  ...subject,
                  rewardLevel: action.rewardLevel,
                  rewardLevelRevision: action.rewardLevelRevision
                }
              : subject;
          })
        }
      };
    case 'SET_THUMB_URL':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          ...(action.isSecretAttachment
            ? {
                secretAttachment: {
                  ...prevContentState.secretAttachment,
                  thumbUrl: action.thumbUrl
                }
              }
            : { thumbUrl: action.thumbUrl })
        }
      };
    case 'SET_VIDEO_CURRENT_TIME':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          ...(action.secretAttachmentCurrentTime
            ? {
                secretAttachmentCurrentTime: action.secretAttachmentCurrentTime
              }
            : { currentTime: action.currentTime })
        }
      };
    case 'SET_VIDEO_QUESTIONS':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          questions: action.questions
        }
      };
    case 'SET_MEDIA_STARTED':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          started: action.started
        }
      };
    case 'SET_UPLOADING_FILE':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          uploadingFile: action.isUploading
        }
      };
    case 'SET_VIDEO_PROGRESS':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          videoProgress: action.progress
        }
      };
    case 'SET_VIDEO_TIME_WATCHED':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          timeWatched: action.timeWatched
        }
      };
    case 'SET_COMMENT_VISIBLE':
      return {
        ...state,
        ['comment' + action.commentId]: {
          ...(state['comment' + action.commentId] || defaultContentState),
          commentVisible: action.visible
        }
      };
    case 'SET_XP_REWARD_INTERFACE_SHOWN':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          xpRewardInterfaceShown: action.shown
        }
      };
    case 'SHOW_TC_REPLY_INPUT':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          targetObj: { ...prevContentState.targetObj, replyInputShown: true }
        }
      };
    case 'UPDATE_SECRET_FILE_UPLOAD_PROGRESS':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          fileUploadProgress: action.progress
        }
      };
    case 'UPDATE_COMMENT_FILE_UPLOAD_PROGRESS':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          fileUploadProgress: action.progress
        }
      };
    case 'UPDATE_COMMENT_PIN_STATUS':
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          pinnedCommentId: action.commentId
        }
      };
    case 'UPLOAD_COMMENT': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      if (action.data.commentId || action.data.replyId) {
        for (const contentKey of contentKeys) {
          const prevContentState = newState[contentKey];
          newState[contentKey] = {
            ...prevContentState,
            comments: (prevContentState.comments || []).map(
              (comment: Comment) => {
                if (
                  comment.id === action.data.commentId ||
                  comment.id === action.data.replyId
                ) {
                  return {
                    ...comment,
                    replies: appendUniqueById(comment.replies, [action.data])
                  };
                }
                return comment;
              }
            )
          };
        }
      }
      const subjectState =
        action.data.subjectId &&
        !action.data.commentId &&
        state['subject' + action.data.subjectId]
          ? {
              ['subject' + action.data.subjectId]: {
                ...state['subject' + action.data.subjectId],
                comments: prependUniqueById(
                  [action.data],
                  state['subject' + action.data.subjectId].comments
                )
              }
            }
          : {};
      return {
        ...newState,
        ...subjectState,
        [contentKey]: {
          ...prevContentState,
          comments:
            prevContentState.contentType === 'comment'
              ? appendUniqueById(prevContentState.comments, [action.data])
              : prependUniqueById([action.data], prevContentState.comments),
          subjects: prevContentState.subjects?.map((subject: Subject) =>
            subject.id === action.data.subjectId
              ? {
                  ...subject,
                  comments: prependUniqueById([action.data], subject.comments)
                }
              : subject
          )
        }
      };
    }

    case 'UPLOAD_REPLY': {
      const newState = { ...state };
      const contentKeys = Object.keys(newState);
      const uploadItems = [action.data].concat(action.data.replies || []);
      if (action.data.commentId || action.data.replyId) {
        for (const contentKey of contentKeys) {
          const prevContentState = newState[contentKey];
          newState[contentKey] = {
            ...prevContentState,
            comments: (prevContentState.comments || []).map(
              (comment: Comment) => {
                if (
                  comment.id === action.data.commentId ||
                  comment.id === action.data.replyId
                ) {
                  return {
                    ...comment,
                    replies: appendUniqueById(comment.replies, uploadItems)
                  };
                }
                return comment;
              }
            )
          };
        }
      }
      let subjectState = {};
      if (action.data.subjectId && state['subject' + action.data.subjectId]) {
        subjectState = {
          ['subject' + action.data.subjectId]: {
            ...state['subject' + action.data.subjectId],
            comments: state['subject' + action.data.subjectId].comments.map(
              (comment: Comment) =>
                comment.id === action.data.commentId ||
                comment.id === action.data.replyId
                  ? {
                      ...comment,
                      replies: appendUniqueById(comment.replies, uploadItems)
                    }
                  : comment
            )
          }
        };
      }
      const commentId = action.data.replyId || action.data.commentId;
      let newComments = [...(prevContentState.comments || [])];
      if (
        prevContentState.contentType === 'comment' &&
        prevContentState.contentId === commentId
      ) {
        newComments = appendUniqueById(newComments, uploadItems);
      }
      return {
        ...newState,
        ...subjectState,
        ...((prevContentState.contentType !== 'comment' ||
          prevContentState.contentId !== commentId) &&
        state['comment' + commentId]
          ? {
              ['comment' + commentId]: {
                ...state['comment' + commentId],
                comments: appendUniqueById(
                  state['comment' + commentId].comments,
                  uploadItems
                )
              }
            }
          : {}),
        [contentKey]: {
          ...prevContentState,
          comments: newComments.map((comment) => {
            let match = false;
            if (comment.id === commentId) {
              match = true;
            } else {
              for (const reply of comment.replies || []) {
                if (reply.id === commentId) {
                  match = true;
                  break;
                }
              }
            }
            return {
              ...comment,
              replies: match
                ? appendUniqueById(comment.replies, uploadItems)
                : comment.replies
            };
          }),
          subjects: prevContentState.subjects?.map((subject: Subject) => {
            return {
              ...subject,
              comments: subject.comments.map((comment) =>
                comment.id === action.data.commentId ||
                comment.id === action.data.replyId
                  ? {
                      ...comment,
                      replies: appendUniqueById(comment.replies, uploadItems)
                    }
                  : comment
              )
            };
          })
        }
      };
    }
    case 'UPLOAD_SUBJECT':
      return {
        ...state,
        ['subject' + action.subject.id]: {
          contentId: action.subject.id,
          contentType: 'subject',
          comments: [],
          recommendations: [],
          rewards: []
        },
        [contentKey]: {
          ...prevContentState,
          subjects: [action.subject].concat(prevContentState.subjects)
        }
      };
    case 'UPLOAD_TARGET_COMMENT': {
      const uploadItems = [action.data].concat(action.data.replies || []);
      return {
        ...state,
        [contentKey]: {
          ...prevContentState,
          targetObj: {
            ...prevContentState.targetObj,
            comment: {
              ...prevContentState.targetObj.comment,
              comments: prependUniqueById(
                uploadItems,
                prevContentState.targetObj?.comment?.comments
              )
            }
          }
        }
      };
    }
    default:
      return state;
  }
}
