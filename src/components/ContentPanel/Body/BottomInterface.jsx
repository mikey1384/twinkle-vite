import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import LikeButton from '~/components/Buttons/LikeButton';
import StarButton from '~/components/Buttons/StarButton';
import Button from '~/components/Button';
import Likers from '~/components/Likers';
import DropdownButton from '~/components/Buttons/DropdownButton';
import RewardButton from '~/components/Buttons/RewardButton';
import ZeroButton from '~/components/Buttons/ZeroButton';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber, stringIsEmpty } from '~/helpers/stringHelpers';
import {
  determineXpButtonDisabled,
  scrollElementToCenter,
  isMobile
} from '~/helpers';
import localize from '~/constants/localize';

const editLabel = localize('edit');
const removeLabel = localize('remove');
const commentLabel = localize('comment');
const copiedLabel = localize('copied');
const replyLabel = localize('reply');
const respondLabel = localize('respond');
const deviceIsMobile = isMobile(navigator);

BottomInterface.propTypes = {
  authLevel: PropTypes.number,
  autoExpand: PropTypes.bool,
  canDelete: PropTypes.bool,
  canEdit: PropTypes.bool,
  canReward: PropTypes.bool,
  commentsShown: PropTypes.bool,
  CommentInputAreaRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ]),
  contentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  contentType: PropTypes.string,
  contentObj: PropTypes.object,
  filePath: PropTypes.string,
  finalRewardLevel: PropTypes.number,
  onExpandComments: PropTypes.func,
  isEditing: PropTypes.bool,
  isNotification: PropTypes.bool,
  isRecommendedByUser: PropTypes.bool,
  likes: PropTypes.array,
  numComments: PropTypes.number,
  numReplies: PropTypes.number,
  onByUserStatusChange: PropTypes.func,
  onSetCloseConfirmModalShown: PropTypes.func,
  onSetDeleteConfirmModalShown: PropTypes.func,
  onSetIsEditing: PropTypes.func,
  onSetRecommendationInterfaceShown: PropTypes.func,
  onSetRewardLevel: PropTypes.func,
  onSetUserListModalShown: PropTypes.func,
  onSetXpRewardInterfaceShown: PropTypes.func,
  recommendationInterfaceShown: PropTypes.bool,
  rewardColor: PropTypes.string,
  rewardLevel: PropTypes.number,
  rewards: PropTypes.object,
  secretHidden: PropTypes.bool,
  subjectUploaderId: PropTypes.number,
  targetObj: PropTypes.object,
  theme: PropTypes.string,
  uploader: PropTypes.object,
  userCanRewardThis: PropTypes.bool,
  userId: PropTypes.number,
  views: PropTypes.number,
  xpRewardInterfaceShown: PropTypes.bool
};

export default function BottomInterface({
  authLevel,
  autoExpand,
  canDelete,
  canEdit,
  canReward,
  commentsShown,
  CommentInputAreaRef,
  contentId,
  contentType,
  contentObj,
  filePath,
  finalRewardLevel,
  onExpandComments,
  isEditing,
  isNotification,
  isRecommendedByUser,
  likes,
  numComments,
  numReplies,
  onByUserStatusChange,
  onSetCloseConfirmModalShown,
  onSetDeleteConfirmModalShown,
  onSetIsEditing,
  onSetRewardLevel,
  onSetRecommendationInterfaceShown,
  onSetUserListModalShown,
  onSetXpRewardInterfaceShown,
  recommendationInterfaceShown,
  rewardColor,
  rewardLevel,
  rewards,
  secretHidden,
  subjectUploaderId,
  targetObj,
  theme,
  uploader,
  userCanRewardThis,
  userId,
  views,
  xpRewardInterfaceShown
}) {
  const [copiedShown, setCopiedShown] = useState(false);
  const isRewardedByUser = useMemo(() => {
    return rewards.filter((reward) => reward.rewarderId === userId).length > 0;
  }, [rewards, userId]);
  const xpButtonDisabled = useMemo(
    () =>
      determineXpButtonDisabled({
        rewards,
        rewardLevel: finalRewardLevel,
        myId: userId,
        xpRewardInterfaceShown
      }),
    [finalRewardLevel, rewards, userId, xpRewardInterfaceShown]
  );

  const isCommentForSecretSubject = useMemo(() => {
    if (targetObj?.comment) {
      return false;
    }
    return (
      !!targetObj?.subject?.secretAnswer ||
      !!targetObj?.subject?.secretAttachment
    );
  }, [
    targetObj?.comment,
    targetObj?.subject?.secretAnswer,
    targetObj?.subject?.secretAttachment
  ]);

  const userCanDeleteThis = useMemo(() => {
    if (userId === uploader.id) return true;
    return canDelete && authLevel > uploader.authLevel;
  }, [authLevel, canDelete, uploader.authLevel, uploader.id, userId]);

  const userCanCloseThis = useMemo(() => {
    if (
      contentObj?.isClosedBy &&
      contentObj?.isClosedBy?.authLevel > authLevel
    ) {
      return false;
    }
    if (userId === uploader.id) return true;
    if (!canDelete || contentType !== 'subject') return false;
    return userId === uploader.id || authLevel > uploader.authLevel;
  }, [
    authLevel,
    canDelete,
    contentObj?.isClosedBy,
    contentType,
    uploader.authLevel,
    uploader.id,
    userId
  ]);

  const userCanEditThis = useMemo(() => {
    if (userId === uploader.id) return true;
    return canEdit && authLevel > uploader?.authLevel;
  }, [authLevel, canEdit, uploader.authLevel, uploader.id, userId]);

  const editMenuItems = useMemo(() => {
    const items = [];
    if (
      userCanEditThis &&
      (!isCommentForSecretSubject ||
        (subjectUploaderId &&
          subjectUploaderId === userId &&
          userId === uploader.id))
    ) {
      items.push({
        label: (
          <>
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '1rem' }}>{editLabel}</span>
          </>
        ),
        onClick: () =>
          onSetIsEditing({ contentId, contentType, isEditing: true })
      });
    }
    if (userCanDeleteThis) {
      items.push({
        label: (
          <>
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '1rem' }}>{removeLabel}</span>
          </>
        ),
        onClick: () => onSetDeleteConfirmModalShown(true)
      });
    }
    if (userCanCloseThis) {
      items.push({
        label: (
          <>
            <Icon icon={contentObj?.isClosedBy ? 'check' : 'ban'} />
            <span style={{ marginLeft: '1rem' }}>
              {contentObj?.isClosedBy ? 'Reopen' : 'Close'}
            </span>
          </>
        ),
        onClick: () => onSetCloseConfirmModalShown(true)
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    contentId,
    contentObj?.isClosedBy,
    contentType,
    isCommentForSecretSubject,
    subjectUploaderId,
    uploader.id,
    userCanCloseThis,
    userCanDeleteThis,
    userCanEditThis,
    userId
  ]);

  const editButtonShown = useMemo(() => {
    return !!editMenuItems?.length;
  }, [editMenuItems?.length]);
  const viewsLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return <>조회수 {addCommasToNumber(views)}회</>;
    }
    return (
      <>
        {addCommasToNumber(views)} view
        {`${views > 1 ? 's' : ''}`}
      </>
    );
  }, [views]);

  const numCommentsShown = useMemo(() => {
    if (commentsShown || autoExpand) {
      return false;
    }
    return Number(numComments) > 0 || Number(numReplies) > 0;
  }, [autoExpand, commentsShown, numComments, numReplies]);

  if (isEditing || isNotification) {
    return null;
  }
  return (
    <div
      className="bottom-interface"
      style={{
        marginBottom:
          likes.length > 0 &&
          !(rewards.length > 0) &&
          !commentsShown &&
          !xpRewardInterfaceShown &&
          '0.5rem'
      }}
    >
      <div
        className={css`
          margin-top: ${secretHidden ? '0.5rem' : '1.5rem'};
          display: flex;
          justify-content: space-between;
          align-items: center;
          .left {
            display: flex;
            align-items: center;
            button,
            span {
              font-size: 1.4rem;
            }
            @media (max-width: ${mobileMaxWidth}) {
              button,
              span {
                font-size: 1rem;
              }
            }
          }
          .right {
            flex-grow: 1;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            @media (max-width: ${mobileMaxWidth}) {
              button {
                font-size: 1rem;
              }
            }
          }
        `}
      >
        {contentType !== 'pass' && (
          <div className="left">
            {!secretHidden && (
              <LikeButton
                contentType={contentType}
                contentId={contentId}
                likes={likes}
                key="likeButton"
                onClick={handleLikeClick}
                small
                theme={theme}
              />
            )}
            {!secretHidden && (
              <Button
                transparent
                key="commentButton"
                className={css`
                  margin-left: 1rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    margin-left: 0.5rem;
                  }
                `}
                onClick={handleCommentButtonClick}
              >
                <Icon icon="comment-alt" />
                <span style={{ marginLeft: '0.7rem' }}>
                  {contentType === 'video' || contentType === 'url'
                    ? commentLabel
                    : contentType === 'subject'
                    ? respondLabel
                    : replyLabel}
                </span>
                {numCommentsShown ? (
                  <span style={{ marginLeft: '0.5rem' }}>
                    ({numComments || numReplies})
                  </span>
                ) : null}
              </Button>
            )}
            {userCanRewardThis && !secretHidden && (
              <RewardButton
                className={css`
                  margin-left: 1rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    margin-left: 0.5rem;
                  }
                `}
                contentId={contentId}
                contentType={contentType}
                disableReason={xpButtonDisabled}
                theme={theme}
              />
            )}
            {!secretHidden && (
              <div
                className={css`
                  margin-left: 0.5rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    margin-left: 0;
                  }
                `}
                style={{ position: 'relative' }}
              >
                <Button
                  transparent
                  onClick={() => {
                    setCopiedShown(true);
                    handleCopyToClipboard();
                    setTimeout(() => setCopiedShown(false), 700);
                  }}
                >
                  <Icon icon="copy" />
                </Button>
                <div
                  style={{
                    zIndex: 300,
                    display: copiedShown ? 'block' : 'none',
                    marginTop: '0.2rem',
                    position: 'absolute',
                    background: '#fff',
                    fontSize: '1.2rem',
                    padding: '1rem',
                    wordBreak: 'keep-all',
                    border: `1px solid ${Color.borderGray()}`
                  }}
                >
                  {copiedLabel}
                </div>
              </div>
            )}
            {editButtonShown ? (
              <DropdownButton
                transparent
                style={{
                  marginLeft: secretHidden ? 0 : '1rem',
                  display: 'inline-block'
                }}
                size={contentType !== 'subject' ? 'sm' : null}
                menuProps={editMenuItems}
              />
            ) : null}
          </div>
        )}
        {!secretHidden && (
          <div
            className="right"
            style={{ position: 'relative', marginRight: 0 }}
          >
            <Button
              color={rewardColor}
              filled={isRecommendedByUser}
              disabled={recommendationInterfaceShown}
              onClick={() => onSetRecommendationInterfaceShown(true)}
            >
              <Icon icon="heart" />
            </Button>
            {(contentType === 'subject' ||
              contentType === 'video' ||
              contentType === 'url') && (
              <StarButton
                style={{ marginLeft: '1rem' }}
                byUser={!!contentObj.byUser}
                contentId={contentObj.id}
                filePath={filePath}
                rewardLevel={rewardLevel}
                onSetRewardLevel={onSetRewardLevel}
                onToggleByUser={handleToggleByUser}
                contentType={contentType}
                uploader={uploader}
              />
            )}
            {!!userId &&
              contentType === 'comment' &&
              !stringIsEmpty(contentObj.content) && (
                <ZeroButton
                  contentId={contentId}
                  contentType={contentType}
                  style={{ marginLeft: '1rem' }}
                />
              )}
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.5rem',
          marginBottom: '0.5rem'
        }}
      >
        <Likers
          className="content-panel__likes"
          userId={userId}
          likes={likes}
          onLinkClick={() => onSetUserListModalShown(true)}
          theme={theme}
        />
        {views > 10 && contentType === 'video' && (
          <div
            style={{
              fontWeight: 'bold',
              fontSize: '1.7rem'
            }}
          >
            {viewsLabel}
          </div>
        )}
      </div>
    </div>
  );

  async function handleCommentButtonClick() {
    if (!commentsShown && !(autoExpand && !secretHidden)) {
      await onExpandComments();
    }
    if (!deviceIsMobile) {
      CommentInputAreaRef.current?.focus?.();
    }
    scrollElementToCenter(CommentInputAreaRef.current);
  }

  async function handleLikeClick({ isUnlike }) {
    if (!xpButtonDisabled && userCanRewardThis && !isRewardedByUser) {
      onSetXpRewardInterfaceShown({
        contentType,
        contentId,
        shown: !isUnlike
      });
    } else {
      if (!isRecommendedByUser && !canReward) {
        onSetRecommendationInterfaceShown(!isUnlike);
      }
    }
    if (!isUnlike && !commentsShown) {
      onExpandComments();
    }
  }

  async function handleCopyToClipboard() {
    const contentUrl = `https://www.twin-kle.com/${
      contentType === 'url' ? 'link' : contentType
    }s/${contentId}`;
    try {
      await navigator.clipboard.writeText(contentUrl);
    } catch (err) {
      console.error(err);
    }
  }

  function handleToggleByUser(byUser) {
    onByUserStatusChange({ byUser, contentId, contentType });
  }
}
