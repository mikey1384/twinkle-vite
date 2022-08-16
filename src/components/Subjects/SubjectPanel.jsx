import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import UsernameText from '~/components/Texts/UsernameText';
import Comments from '~/components/Comments';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Textarea from '~/components/Texts/Textarea';
import LongText from '~/components/Texts/LongText';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import RewardLevelBar from '~/components/RewardLevelBar';
import Link from '~/components/Link';
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
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const commentLabel = localize('comment');
const editLabel = localize('edit');
const byLabel = localize('by');
const removeLabel = localize('remove');
const secretMessageLabel = localize('secretMessage');
const postedLabel = localize('posted');

SubjectPanel.propTypes = {
  description: PropTypes.string,
  rewardLevel: PropTypes.number,
  loadMoreCommentsButton: PropTypes.bool.isRequired,
  numComments: PropTypes.string,
  rootRewardLevel: PropTypes.number,
  secretAnswer: PropTypes.string,
  secretAttachment: PropTypes.object,
  timeStamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  title: PropTypes.string.isRequired,
  userId: PropTypes.number,
  username: PropTypes.string.isRequired,
  uploaderAuthLevel: PropTypes.number.isRequired,
  rootType: PropTypes.string.isRequired,
  rootId: PropTypes.number.isRequired,
  subjectId: PropTypes.number.isRequired
};

export default function SubjectPanel({
  rootId,
  rootType,
  description,
  title,
  rewardLevel,
  uploaderAuthLevel,
  username,
  userId,
  timeStamp,
  numComments,
  loadMoreCommentsButton,
  rootRewardLevel,
  secretAnswer,
  secretAttachment,
  subjectId
}) {
  const deleteSubject = useAppContext((v) => v.requestHelpers.deleteSubject);
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const onChangeSpoilerStatus = useContentContext(
    (v) => v.actions.onChangeSpoilerStatus
  );
  const onEditRewardComment = useContentContext(
    (v) => v.actions.onEditRewardComment
  );
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const onSetByUserStatus = useContentContext(
    (v) => v.actions.onSetByUserStatus
  );
  const {
    authLevel,
    canDelete,
    canEdit,
    canReward,
    twinkleCoins,
    userId: myId
  } = useKeyContext((v) => v.myState);
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
    fileName,
    filePath,
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
    const userHasHigherAuthLevel = authLevel > uploaderAuthLevel;
    const userCanEditThis = (canEdit || canDelete) && userHasHigherAuthLevel;
    return userIsUploader || userCanEditThis;
  }, [authLevel, canDelete, canEdit, uploaderAuthLevel, userIsUploader]);
  const secretHidden = useMemo(
    () =>
      (!!secretAnswer || !!secretAttachment) &&
      !(secretShown || userIsUploader),
    [secretAnswer, secretAttachment, secretShown, userIsUploader]
  );
  const userCanRewardThis = useMemo(
    () =>
      determineUserCanRewardThis({
        authLevel,
        canReward,
        recommendations,
        uploader: { id: userId },
        userId: myId
      }),
    [authLevel, canReward, myId, recommendations, userId]
  );
  const rewardButtonShown = useMemo(() => {
    return !onEdit && userCanRewardThis;
  }, [onEdit, userCanRewardThis]);
  const finalRewardLevel = useMemo(() => {
    return byUser ? 5 : rootRewardLevel > 0 ? 1 : 0;
  }, [byUser, rootRewardLevel]);
  const isRecommendedByUser = useMemo(() => {
    return (
      recommendations.filter((recommendation) => recommendation.userId === myId)
        .length > 0
    );
  }, [recommendations, myId]);

  useEffect(() => {
    const titleIsEmpty = stringIsEmpty(editedTitle);
    const titleChanged = editedTitle !== title;
    const descriptionChanged = editedDescription !== description;
    const secretAnswerChanged = editedSecretAnswer !== secretAnswer;
    const editDoneButtonDisabled =
      titleIsEmpty ||
      (!titleChanged && !descriptionChanged && !secretAnswerChanged);
    setEditDoneButtonDisabled(editDoneButtonDisabled);
  }, [
    editedTitle,
    editedDescription,
    editedSecretAnswer,
    title,
    description,
    secretAnswer
  ]);
  const CommentsRef = useRef(null);
  const RewardInterfaceRef = useRef(null);

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
          <LongText style={{ padding: '1rem 0' }}>{description}</LongText>
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
              onKeyUp={(event) => setEditedTitle(addEmoji(event.target.value))}
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
              onChange={(event) => {
                setEditedDescription(event.target.value);
              }}
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
                onChange={(event) => {
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
                  <Button
                    skeuomorphic
                    color={rewardColor}
                    style={{ fontSize: '2rem', marginLeft: '1rem' }}
                    disabled={determineXpButtonDisabled({
                      rewardLevel: finalRewardLevel,
                      myId,
                      xpRewardInterfaceShown,
                      rewards
                    })}
                    onClick={() =>
                      onSetXpRewardInterfaceShown({
                        contentType: 'subject',
                        contentId: subjectId,
                        shown: true
                      })
                    }
                  >
                    <Icon icon="certificate" />
                    <span style={{ marginLeft: '0.7rem' }}>
                      {determineXpButtonDisabled({
                        rewardLevel: finalRewardLevel,
                        myId,
                        xpRewardInterfaceShown,
                        rewards
                      }) || 'Reward'}
                    </span>
                  </Button>
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
                uploaderAuthLevel={uploaderAuthLevel}
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
                  authLevel: uploaderAuthLevel
                }
              }}
              rootContent={{
                contentType: rootType
              }}
              subject={{
                id: subjectId,
                rewardLevel,
                secretAnswer,
                secretAttachment,
                pinnedCommentId,
                uploader: {
                  id: userId,
                  authLevel: uploaderAuthLevel
                }
              }}
              showSecretButtonAvailable={subjectId && secretHidden}
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
      await deleteSubject({ fileName, filePath, subjectId });
      setConfirmModalShown(false);
      onSubjectDelete(subjectId);
    } catch (error) {
      return console.error(error);
    }
  }

  async function handleCommentSubmit(params) {
    onChangeSpoilerStatus({
      shown: true,
      subjectId,
      prevSecretViewerId: userId
    });
    if (secretHidden) {
      await handleExpand(true);
      return Promise.resolve();
    }
    onUploadComment({
      ...params,
      subjectId,
      contentId: rootId,
      contentType: rootType
    });
  }

  async function handleExpand(revealingSecret) {
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
      CommentsRef.current.focus();
    } catch (error) {
      console.error(error.response || error);
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

  function handleToggleByUser(byUser) {
    onSetByUserStatus({ byUser, contentId: subjectId, contentType: 'subject' });
  }

  function handleLoadMoreComments(data) {
    onLoadMoreComments({ ...data, subjectId });
  }
}
