import React, { useState, useMemo } from 'react';
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

const bottomInterfaceCSS = css`
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
`;

export default function BottomInterface({
  userLevel,
  autoExpand,
  canDelete,
  canEdit,
  canReward,
  commentsShown,
  CommentInputAreaRef,
  contentObj,
  finalRewardLevel,
  onExpandComments,
  isEditing,
  isRecommendedByUser,
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
  secretHidden,
  subjectUploaderId,
  theme,
  userCanRewardThis,
  userId,
  xpRewardInterfaceShown
}: {
  userLevel: number;
  autoExpand: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canReward: boolean;
  commentsShown: boolean;
  CommentInputAreaRef: any;
  contentObj: any;
  finalRewardLevel: number;
  isEditing: boolean;
  isRecommendedByUser: boolean;
  onByUserStatusChange: (state: object) => void;
  onExpandComments: () => void;
  onSetCloseConfirmModalShown: (status: boolean) => void;
  onSetDeleteConfirmModalShown: (status: boolean) => void;
  onSetIsEditing: (state: object) => void;
  onSetRecommendationInterfaceShown: (status: boolean) => void;
  onSetRewardLevel: (level: number) => void;
  onSetUserListModalShown: (arg: boolean) => void;
  onSetXpRewardInterfaceShown: (state: object) => void;
  recommendationInterfaceShown: boolean;
  rewardColor: string;
  secretHidden: boolean;
  subjectUploaderId: number;
  theme: string;
  userCanRewardThis: boolean;
  userId: number;
  xpRewardInterfaceShown: boolean;
}) {
  const {
    contentId,
    contentType,
    filePath,
    isNotification,
    likes,
    numComments,
    numReplies,
    rewards,
    rewardLevel,
    targetObj,
    uploader = {},
    views
  } = contentObj;
  const [copiedShown, setCopiedShown] = useState(false);
  const isRewardedByUser = useMemo(() => {
    return (
      rewards.filter(
        (reward: { rewarderId: number }) => reward.rewarderId === userId
      ).length > 0
    );
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
    if (contentType === 'aiStory') return false;
    if (userId === uploader.id) return true;
    return (canDelete || canEdit) && userLevel > uploader.level;
  }, [
    contentType,
    userId,
    uploader.id,
    uploader.level,
    canDelete,
    canEdit,
    userLevel
  ]);

  const userCanCloseThis = useMemo(() => {
    if (contentType !== 'subject') return false;
    if (
      contentObj?.isClosedBy &&
      ((contentObj?.isClosedBy.id === uploader.id &&
        contentObj?.isClosedBy.id !== userId) ||
        contentObj?.isClosedBy.level > userLevel)
    ) {
      return false;
    }
    if (userId === uploader.id) return true;
    if (!canDelete) return false;
    return userLevel > uploader.level;
  }, [
    contentType,
    contentObj?.isClosedBy,
    uploader.id,
    userId,
    userLevel,
    canDelete,
    uploader.level
  ]);

  const userCanEditThis = useMemo(() => {
    if (contentType === 'aiStory') return false;
    if (userId === uploader.id || (canEdit && userLevel > uploader.level)) {
      return (
        !isCommentForSecretSubject ||
        (subjectUploaderId &&
          subjectUploaderId === userId &&
          userId === uploader.id)
      );
    }
    return false;
  }, [
    contentType,
    userId,
    uploader.id,
    uploader.level,
    canEdit,
    userLevel,
    isCommentForSecretSubject,
    subjectUploaderId
  ]);

  const editMenuItems = useMemo(() => {
    const items = [];
    if (userCanEditThis) {
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

  const marginBottom = useMemo(() => {
    return likes.length > 0 &&
      !(rewards.length > 0) &&
      !commentsShown &&
      !xpRewardInterfaceShown
      ? '0.5rem'
      : '';
  }, [likes?.length, rewards?.length, commentsShown, xpRewardInterfaceShown]);

  if (isEditing || isNotification) {
    return null;
  }

  return (
    <div
      className="bottom-interface"
      style={{
        marginBottom
      }}
    >
      <div
        style={{ marginTop: secretHidden ? '0.5rem' : '1.5rem' }}
        className={bottomInterfaceCSS}
      >
        {contentType !== 'pass' && contentType !== 'xpChange' && (
          <div className="left">
            {!secretHidden && (
              <LikeButton
                contentType={contentType}
                contentId={contentId}
                likes={likes}
                key="likeButton"
                onClick={handleLikeClick}
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
                  <span
                    className={css`
                      margin-left: 0.5rem;
                    `}
                  >
                    ({numComments || numReplies})
                  </span>
                ) : null}
              </Button>
            )}
            {userCanRewardThis &&
              !secretHidden &&
              contentType !== 'aiStory' && (
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
                  className={css`
                    z-index: 300;
                    display: ${copiedShown ? 'block' : 'none'};
                    margin-top: 0.2rem;
                    position: absolute;
                    background: #fff;
                    font-size: 1.2rem;
                    padding: 1rem;
                    word-break: keep-all;
                    border: 1px solid ${Color.borderGray()};
                  `}
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
                menuProps={editMenuItems}
              />
            ) : null}
          </div>
        )}
        {!secretHidden && (
          <div
            className={`right ${css`
              position: relative;
              margin-right: 0;
            `}`}
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
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        `}
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
            className={css`
              font-weight: bold;
              font-size: 1.7rem;
            `}
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

  async function handleLikeClick({ isUnlike }: { isUnlike: boolean }) {
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
      contentType === 'aiStory'
        ? 'ai-storie'
        : contentType === 'url'
        ? 'link'
        : contentType
    }s/${contentId}`;
    try {
      await navigator.clipboard.writeText(contentUrl);
    } catch (err) {
      console.error(err);
    }
  }

  function handleToggleByUser(byUser: boolean) {
    onByUserStatusChange({ byUser, contentId, contentType });
  }
}
