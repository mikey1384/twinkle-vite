import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import Button from '~/components/Button';
import UsernameText from '~/components/Texts/UsernameText';
import Comments from '~/components/Comments';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Textarea from '~/components/Texts/Textarea';
import RichText from '~/components/Texts/RichText';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import RewardLevelBar from '~/components/RewardLevelBar';
import Link from '~/components/Link';
import RewardButton from '~/components/Buttons/RewardButton';
import SecretAnswer from '~/components/SecretAnswer';
import StarButton from '~/components/Buttons/StarButton';
import LocalContext from './Context';
import RewardStatus from '~/components/RewardStatus';
import XPRewardInterface from '~/components/XPRewardInterface';
import RecommendationStatus from '~/components/RecommendationStatus';
import RecommendationInterface from '~/components/RecommendationInterface';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  stringIsEmpty,
  addEmoji,
  finalizeEmoji
} from '~/helpers/stringHelpers';
import {
  determineUserCanRewardThis,
  determineXpButtonDisabled
} from '~/helpers';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useContentState, useMyLevel } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE, charLimit } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const commentLabel = localize('comment');
const editLabel = localize('edit');
const byLabel = localize('by');
const removeLabel = localize('remove');
const secretMessageLabel = localize('secretMessage');
const postedLabel = localize('posted');

export default function SubjectPanel({
  rootId,
  rootType,
  description,
  title,
  rewardLevel,
  uploaderLevel,
  username,
  userId,
  timeStamp,
  numComments,
  loadMoreCommentsButton,
  rootRewardLevel,
  secretAnswer,
  secretAttachment,
  subjectId
}: {
  rootId: number;
  rootType: string;
  description: string;
  title: string;
  rewardLevel: number;
  uploaderLevel: number;
  username: string;
  userId: number;
  timeStamp: number;
  numComments: number;
  loadMoreCommentsButton: boolean;
  rootRewardLevel: number;
  secretAnswer: string;
  secretAttachment: any;
  subjectId: number;
}) {
  const titleMaxChar = charLimit.subject.title;
  const descriptionMaxChar = charLimit.subject.description;
  const deleteContent = useAppContext((v) => v.requestHelpers.deleteContent);
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const onChangeSpoilerStatus = useContentContext(
    (v) => v.actions.onChangeSpoilerStatus
  );
  const onEditRewardComment = useContentContext(
    (v) => v.actions.onEditRewardComment
  );
  const onSetByUserStatus = useContentContext(
    (v) => v.actions.onSetByUserStatus
  );
  const level = useKeyContext((v) => v.myState.level);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const myId = useKeyContext((v) => v.myState.userId);
  const { canDelete, canEdit, canReward } = useMyLevel();
  const {
    done: { color: doneColor },
    content: { color: contentColor },
    reward: { color: rewardColor }
  } = useKeyContext((v) => v.theme);

  const {
    editRewardComment,
    onDelete,
    onEditDone,
    onLikeClick,
    onLoadMoreComments,
    onLoadMoreReplies,
    onLoadRepliesOfReply,
    onSubjectEditDone,
    onSubjectDelete,
    onLoadSubjectComments,
    onSetRewardLevel,
    onUploadComment,
    onUploadReply
  } = useContext(LocalContext);

  const {
    byUser,
    comments,
    isDeleted,
    secretShown,
    pinnedCommentId,
    recommendations,
    rewards,
    xpRewardInterfaceShown
  } = useContentState({
    contentType: 'subject',
    contentId: subjectId
  });

  const [expanded, setExpanded] = useState(false);
  const [onEdit, setOnEdit] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedDescription, setEditedDescription] = useState(description || '');
  const [editedSecretAnswer, setEditedSecretAnswer] = useState(
    secretAnswer || ''
  );
  const [editDoneButtonDisabled, setEditDoneButtonDisabled] = useState(true);
  const [recommendationInterfaceShown, setRecommendationInterfaceShown] =
    useState(false);
  const userIsUploader = useMemo(() => myId === userId, [myId, userId]);
  const editButtonShown = useMemo(() => {
    const userHasHigherLevel = level > uploaderLevel;
    const userCanEditThis = (canEdit || canDelete) && userHasHigherLevel;
    return userIsUploader || userCanEditThis;
  }, [level, canDelete, canEdit, uploaderLevel, userIsUploader]);
  const secretHidden = useMemo(
    () =>
      (!!secretAnswer || !!secretAttachment) &&
      !(secretShown || userIsUploader),
    [secretAnswer, secretAttachment, secretShown, userIsUploader]
  );
  const userCanRewardThis = useMemo(
    () =>
      determineUserCanRewardThis({
        userLevel: level,
        canReward,
        recommendations,
        uploader: { id: userId },
        userId: myId
      }),
    [level, canReward, myId, recommendations, userId]
  );
  const rewardButtonShown = useMemo(() => {
    return !onEdit && userCanRewardThis;
  }, [onEdit, userCanRewardThis]);
  const finalRewardLevel = useMemo(() => {
    return byUser ? 5 : rootRewardLevel > 0 ? 1 : 0;
  }, [byUser, rootRewardLevel]);
  const isRecommendedByUser = useMemo(() => {
    return (
      recommendations.filter(
        (recommendation: { userId: number }) => recommendation.userId === myId
      ).length > 0
    );
  }, [recommendations, myId]);

  useEffect(() => {
    const titleIsEmpty = stringIsEmpty(editedTitle);
    const titleChanged = editedTitle !== title;
    const titleExceedsCharLimit = editedTitle.length > titleMaxChar;
    const descriptionExceedsCharLimit =
      editedDescription.length > descriptionMaxChar;
    const secretAnswerExceedsCharLimit =
      editedSecretAnswer.length > descriptionMaxChar;
    const descriptionChanged = editedDescription !== description;
    const secretAnswerChanged = editedSecretAnswer !== secretAnswer;
    const editDoneButtonDisabled =
      titleExceedsCharLimit ||
      descriptionExceedsCharLimit ||
      secretAnswerExceedsCharLimit ||
      titleIsEmpty ||
      (!titleChanged && !descriptionChanged && !secretAnswerChanged);
    setEditDoneButtonDisabled(editDoneButtonDisabled);
  }, [
    editedTitle,
    editedDescription,
    editedSecretAnswer,
    title,
    description,
    secretAnswer,
    titleMaxChar,
    descriptionMaxChar
  ]);
  const CommentsRef: React.RefObject<any> = useRef(null);
  const RewardInterfaceRef: React.RefObject<any> = useRef(null);

  return !isDeleted ? (
    <div
      className={css`
        background: #fff;
        border: 1px solid ${Color.borderGray()};
        margin-top: 1rem;
        font-size: 1.5rem;
        @media (max-width: ${mobileMaxWidth}) {
          border-left: 0;
          border-right: 0;
        }
      `}
    >
      {rewardLevel > 0 && <RewardLevelBar rewardLevel={rewardLevel} />}
      <div style={{ padding: '1rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {!onEdit && (
            <Link
              to={`/subjects/${subjectId}`}
              style={{
                fontSize: '2.5rem',
                color: Color[contentColor](),
                fontWeight: 'bold'
              }}
            >
              {title}
            </Link>
          )}
          <div style={{ display: 'flex', position: 'relative' }}>
            {!onEdit && (
              <StarButton
                contentId={subjectId}
                contentType="subject"
                defaultDescription={description}
                rewardLevel={rewardLevel}
                onSetRewardLevel={onSetRewardLevel}
                onToggleByUser={handleToggleByUser}
                byUser={!!byUser}
                uploader={{ id: userId, username }}
              />
            )}
            <div>
              {editButtonShown && !onEdit && (
                <DropdownButton
                  skeuomorphic
                  icon="chevron-down"
                  style={{ marginLeft: '1rem' }}
                  color="darkerGray"
                  menuProps={[
                    {
                      label: (
                        <>
                          <Icon icon="pencil-alt" />
                          <span style={{ marginLeft: '1rem' }}>
                            {editLabel}
                          </span>
                        </>
                      ),
                      onClick: () => setOnEdit(true)
                    },
                    {
                      label: (
                        <>
                          <Icon icon="trash-alt" />
                          <span style={{ marginLeft: '1rem' }}>
                            {removeLabel}
                          </span>
                        </>
                      ),
                      onClick: () => setConfirmModalShown(true)
                    }
                  ]}
                />
              )}
            </div>
          </div>
        </div>
        {!onEdit && !!description && (
          <RichText style={{ padding: '1rem 0' }}>{description}</RichText>
        )}
        {(secretAnswer || secretAttachment) && !onEdit && (
          <SecretAnswer
            style={{ marginTop: '1rem' }}
            answer={secretAnswer}
            attachment={secretAttachment}
            subjectId={subjectId}
            onClick={handleExpand}
            uploaderId={userId}
          />
        )}
        {onEdit && (
          <form onSubmit={(event) => event.preventDefault()}>
            <Input
              autoFocus
              placeholder="Enter Title..."
              value={editedTitle}
              onChange={(text) => {
                setEditedTitle(text);
              }}
              onKeyUp={(event: any) =>
                setEditedTitle(addEmoji(event.target.value))
              }
              hasError={editedTitle.length > titleMaxChar}
            />
          </form>
        )}
        {onEdit && (
          <div>
            <Textarea
              placeholder="Enter Description (Optional)"
              style={{ marginTop: '1rem' }}
              minRows={5}
              value={editedDescription}
              onChange={(event: any) => {
                setEditedDescription(event.target.value);
              }}
              hasError={editedDescription.length > descriptionMaxChar}
            />
            <div style={{ marginTop: '1rem' }}>
              <span style={{ fontSize: '1.7rem', fontWeight: 'bold' }}>
                {secretMessageLabel}
              </span>
              <Textarea
                style={{ marginTop: '0.7rem' }}
                placeholder="Enter Secret Message (Optional)"
                minRows={5}
                value={editedSecretAnswer}
                hasError={editedSecretAnswer.length > descriptionMaxChar}
                onChange={(event: any) => {
                  setEditedSecretAnswer(event.target.value);
                }}
              />
            </div>
            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Button
                transparent
                style={{
                  fontSize: '1.7rem',
                  marginRight: '1rem'
                }}
                onClick={() => {
                  setOnEdit(false);
                  setEditedTitle(title);
                  setEditedDescription(description);
                  setEditedSecretAnswer(secretAnswer);
                }}
              >
                Cancel
              </Button>
              <Button
                color={doneColor}
                style={{
                  fontSize: '1.8rem'
                }}
                onClick={handleEditDone}
                disabled={editDoneButtonDisabled}
              >
                Done
              </Button>
            </div>
          </div>
        )}
        {!onEdit && (
          <div style={{ marginTop: '1rem' }}>
            {!secretHidden && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '8rem'
                }}
              >
                <Button
                  skeuomorphic
                  color="black"
                  style={{ fontSize: '2rem' }}
                  onClick={handleExpand}
                >
                  <Icon icon="comment-alt" />
                  <span style={{ marginLeft: '1rem' }}>
                    {commentLabel}
                    {!expanded && SELECTED_LANGUAGE === 'en' && numComments > 1
                      ? 's'
                      : ''}
                    {!expanded &&
                    numComments &&
                    numComments > 0 &&
                    comments.length === 0
                      ? ` (${numComments})`
                      : ''}
                  </span>
                </Button>
                {rewardButtonShown && (
                  <RewardButton
                    skeuomorphic
                    contentId={subjectId}
                    contentType="subject"
                    disableReason={determineXpButtonDisabled({
                      rewardLevel: finalRewardLevel,
                      myId,
                      xpRewardInterfaceShown,
                      rewards
                    })}
                    style={{ fontSize: '2rem', marginLeft: '1rem' }}
                  />
                )}
                <Button
                  color={rewardColor}
                  style={{ fontSize: '2rem', marginLeft: '1rem' }}
                  skeuomorphic
                  filled={isRecommendedByUser}
                  disabled={recommendationInterfaceShown}
                  onClick={() => setRecommendationInterfaceShown(true)}
                >
                  <Icon icon="heart" />
                </Button>
              </div>
            )}
            <RecommendationStatus
              style={{
                marginBottom: '1rem',
                marginLeft: '-1rem',
                marginRight: '-1rem'
              }}
              contentType="subject"
              recommendations={recommendations}
            />
            {recommendationInterfaceShown && (
              <RecommendationInterface
                contentId={subjectId}
                contentType="subject"
                style={{
                  marginLeft: '-1rem',
                  marginRight: '-1rem',
                  fontSize: '1.7rem'
                }}
                onHide={() => setRecommendationInterfaceShown(false)}
                recommendations={recommendations}
                rewardLevel={finalRewardLevel}
                content={description}
                uploaderId={userId}
              />
            )}
            {xpRewardInterfaceShown && (
              <XPRewardInterface
                innerRef={RewardInterfaceRef}
                contentType="subject"
                contentId={subjectId}
                onReward={() =>
                  setRecommendationInterfaceShown(
                    !isRecommendedByUser && twinkleCoins > 0
                  )
                }
                rewardLevel={finalRewardLevel}
                uploaderLevel={uploaderLevel}
                uploaderId={userId}
                rewards={rewards}
              />
            )}
            <RewardStatus
              contentType="subject"
              contentId={subjectId}
              rewardLevel={finalRewardLevel}
              onCommentEdit={onEditRewardComment}
              rewards={rewards}
              className={css`
                margin-left: CALC(-1rem - 1px);
                margin-right: CALC(-1rem - 1px);
                @media (max-width: ${mobileMaxWidth}) {
                  margin-left: 0px;
                  margin-right: 0px;
                }
              `}
            />
            <Comments
              isSubjectPannelComments
              inputAreaInnerRef={CommentsRef}
              isLoading={loadingComments}
              numInputRows={3}
              commentsLoadLimit={5}
              commentsHidden={secretHidden}
              commentsShown
              inputTypeLabel="comment"
              comments={comments}
              loadMoreButton={loadMoreCommentsButton}
              userId={myId}
              onCommentSubmit={handleCommentSubmit}
              onDelete={onDelete}
              onEditDone={onEditDone}
              onLikeClick={onLikeClick}
              onLoadMoreComments={handleLoadMoreComments}
              onLoadMoreReplies={(data) =>
                onLoadMoreReplies({ ...data, subjectId })
              }
              onLoadRepliesOfReply={({
                replies,
                commentId,
                replyId,
                loadMoreButton
              }) =>
                onLoadRepliesOfReply({
                  replies,
                  commentId,
                  replyId,
                  subjectId,
                  loadMoreButton
                })
              }
              onReplySubmit={onUploadReply}
              onRewardCommentEdit={editRewardComment}
              parent={{
                contentId: rootId,
                contentType: rootType,
                rewardLevel: rootRewardLevel,
                secretAnswer,
                secretAttachment,
                uploader: {
                  id: userId,
                  username,
                  level: uploaderLevel
                }
              }}
              rootContent={{
                contentId: rootId,
                contentType: rootType
              }}
              subject={{
                id: subjectId,
                comments,
                rewardLevel,
                secretAnswer,
                secretAttachment,
                title,
                pinnedCommentId,
                uploader: {
                  id: userId,
                  username,
                  level: uploaderLevel
                }
              }}
              showSecretButtonAvailable={!!(subjectId && secretHidden)}
            />
          </div>
        )}
        <div style={{ marginTop: '1rem' }}>
          {byLabel}{' '}
          <b>
            <UsernameText
              user={{
                username,
                id: userId
              }}
            />
          </b>{' '}
          &nbsp;|&nbsp; {postedLabel} {timeSince(timeStamp)}
        </div>
      </div>
      {confirmModalShown && (
        <ConfirmModal
          onHide={() => setConfirmModalShown(false)}
          title="Remove Subject"
          onConfirm={deleteThis}
        />
      )}
    </div>
  ) : null;

  async function deleteThis() {
    try {
      await deleteContent({ contentType: 'subject', id: subjectId });
      setConfirmModalShown(false);
      onSubjectDelete(subjectId);
    } catch (error) {
      return console.error(error);
    }
  }

  async function handleCommentSubmit(params: any) {
    try {
      onChangeSpoilerStatus({
        shown: true,
        subjectId,
        prevSecretViewerId: userId
      });
      if (secretHidden) {
        await handleExpand(true);
      } else {
        onUploadComment({
          ...params,
          subjectId,
          contentId: rootId,
          contentType: rootType
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleExpand(revealingSecret: boolean) {
    setExpanded(true);
    try {
      setLoadingComments(true);
      if (!secretHidden || revealingSecret) {
        const data = await loadComments({
          contentType: 'subject',
          contentId: subjectId,
          limit: 10
        });
        onLoadSubjectComments({
          ...data,
          subjectId,
          contentType: rootType,
          contentId: rootId
        });
      }
      setLoadingComments(false);
      if (CommentsRef.current) {
        CommentsRef.current.focus();
      }
    } catch (error: any) {
      console.error(error?.response || error);
    }
  }

  async function handleEditDone() {
    const editedSubject = await editContent({
      contentId: subjectId,
      contentType: 'subject',
      editedTitle: finalizeEmoji(editedTitle),
      editedDescription: finalizeEmoji(editedDescription),
      editedSecretAnswer: finalizeEmoji(editedSecretAnswer)
    });
    onSubjectEditDone({ editedSubject, subjectId });
    setOnEdit(false);
    setEditDoneButtonDisabled(true);
  }

  function handleToggleByUser(byUser: boolean) {
    onSetByUserStatus({ byUser, contentId: subjectId, contentType: 'subject' });
  }

  function handleLoadMoreComments(data: any) {
    onLoadMoreComments({ ...data, subjectId });
  }
}
