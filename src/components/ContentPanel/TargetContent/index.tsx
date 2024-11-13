import React, { useEffect, useMemo, useRef, useContext, useState } from 'react';
import LocalContext from '../Context';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import LikeButton from '~/components/Buttons/LikeButton';
import Likers from '~/components/Likers';
import UserListModal from '~/components/Modals/UserListModal';
import InputForm from '~/components/Forms/InputForm';
import Comment from './Comment';
import RichText from '~/components/Texts/RichText';
import ContentLink from '~/components/ContentLink';
import RecommendationStatus from '~/components/RecommendationStatus';
import RecommendationInterface from '~/components/RecommendationInterface';
import RewardStatus from '~/components/RewardStatus';
import XPRewardInterface from '~/components/XPRewardInterface';
import ErrorBoundary from '~/components/ErrorBoundary';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import ContentFileViewer from '~/components/ContentFileViewer';
import SecretComment from '~/components/SecretComment';
import Icon from '~/components/Icon';
import LoginToViewContent from '~/components/LoginToViewContent';
import RewardButton from '~/components/Buttons/RewardButton';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import {
  determineUserCanRewardThis,
  determineXpButtonDisabled,
  isMobile,
  returnTheme
} from '~/helpers';
import {
  getFileInfoFromFileName,
  generateFileName
} from '~/helpers/stringHelpers';
import { useContentState, useMyLevel } from '~/helpers/hooks';
import {
  useAppContext,
  useContentContext,
  useInputContext,
  useKeyContext
} from '~/contexts';
import { useNavigate } from 'react-router-dom';
import {
  SELECTED_LANGUAGE,
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID
} from '~/constants/defaultValues';
import { v1 as uuidv1 } from 'uuid';
import localize from '~/constants/localize';
import { Comment as CommentType, Subject } from '~/types';

const commentRemovedLabel = localize('commentRemoved');
const replyLabel = localize('reply');
const deviceIsMobile = isMobile(navigator);

const targetContentCSS = css`
  font-size: 1.6rem;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  border-radius: ${borderRadius};
  border: 1px solid ${Color.darkerBorderGray()};
  padding: 2rem 0 0.5rem 0;
  background: ${Color.whiteGray()};
  margin-top: -1rem;
  transition: background 0.5s;
  .left {
    margin-top: 2rem;
    display: flex;
    width: 100%;
    justify-content: space-between;
    @media (max-width: ${mobileMaxWidth}) {
      button,
      span {
        font-size: 1rem;
      }
    }
  }
  .right {
    @media (max-width: ${mobileMaxWidth}) {
      button,
      span {
        font-size: 1rem;
      }
    }
  }
  .detail-block {
    display: flex;
    justify-content: space-between;
  }
  .timestamp {
    color: ${Color.gray()};
    font-size: 1.2rem;
  }
  &:hover {
    background: #fff;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.7rem;
    border-left: 0;
    border-right: 0;
  }
`;

export default function TargetContent({
  className,
  contentId,
  contentType,
  rootObj,
  rootType,
  onShowTCReplyInput,
  style,
  theme,
  targetObj: { comment, replyInputShown, subject, contentType: type }
}: {
  className?: string;
  contentId: number;
  contentType: string;
  rootObj: any;
  rootType: string;
  onShowTCReplyInput: (arg0: any) => void;
  style?: React.CSSProperties;
  theme: string;
  targetObj: {
    comment: CommentType;
    replyInputShown: boolean;
    subject: Subject;
    contentType: string;
  };
}) {
  const comments = comment?.comments || [];
  const navigate = useNavigate();
  const uploadComment = useAppContext((v) => v.requestHelpers.uploadComment);
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const saveFileData = useAppContext((v) => v.requestHelpers.saveFileData);
  const checkUserChange = useKeyContext((v) => v.helpers.checkUserChange);
  const { level, profileTheme, profilePicUrl, userId, twinkleCoins, username } =
    useKeyContext((v) => v.myState);
  const { canReward } = useMyLevel();

  const {
    link: { color: linkColor },
    content: { color: contentColor },
    reward: { color: rewardColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const onClearCommentFileUploadProgress = useContentContext(
    (v) => v.actions.onClearCommentFileUploadProgress
  );
  const onUpdateCommentFileUploadProgress = useContentContext(
    (v) => v.actions.onUpdateCommentFileUploadProgress
  );

  const {
    onDeleteComment,
    onEditComment,
    onEditRewardComment,
    onUploadTargetComment
  } = useContext<{ [key: string]: any }>(LocalContext);
  const { xpRewardInterfaceShown, fileUploadProgress, uploadingFile } =
    useContentState({
      contentType: 'comment',
      contentId: comment.id
    });
  const subjectState = useContentState({
    contentType: 'subject',
    contentId: subject?.id
  });
  const state = useInputContext((v) => v.state);
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const onSetCommentAttachment = useInputContext(
    (v) => v.actions.onSetCommentAttachment
  );
  const onSetUploadingFile = useContentContext(
    (v) => v.actions.onSetUploadingFile
  );
  const attachment = state['comment' + comment.id]?.attachment;
  const { fileType } = comment?.fileName
    ? getFileInfoFromFileName(comment?.fileName)
    : { fileType: '' };
  const [recommendationInterfaceShown, setRecommendationInterfaceShown] =
    useState(false);
  const [userListModalShown, setUserListModalShown] = useState(false);
  const InputFormRef: React.RefObject<any> = useRef(null);
  const RewardInterfaceRef = useRef(null);
  const userCanRewardThis = useMemo(() => {
    let canRewardThis;
    if (comment && !comment.notFound) {
      canRewardThis = determineUserCanRewardThis({
        canReward,
        userLevel: level,
        recommendations: comment.recommendations,
        uploader: comment.uploader,
        userId
      });
    }
    return canRewardThis;
  }, [level, canReward, comment, userId]);
  const subjectUploaderId = useMemo(
    () => subject?.uploader?.id || subject?.userId,
    [subject]
  );
  const finalRewardLevel = useMemo(() => {
    const rootRewardLevel =
      rootType === 'video' || rootType === 'url'
        ? rootObj.rewardLevel > 0
          ? 1
          : 0
        : rootObj.rewardLevel;
    return subject?.rewardLevel || rootRewardLevel;
  }, [rootObj.rewardLevel, rootType, subject]);

  const isRecommendedByUser = useMemo(() => {
    return comment
      ? comment.recommendations?.filter(
          (recommendation: { userId: number }) =>
            recommendation.userId === userId
        ).length > 0
      : false;
  }, [comment, userId]);

  const isRewardedByUser = useMemo(() => {
    return comment
      ? comment.rewards?.filter(
          (reward: { rewarderId: number }) => reward.rewarderId === userId
        ).length > 0
      : false;
  }, [comment, userId]);

  const xpButtonDisabled = useMemo(
    () =>
      determineXpButtonDisabled({
        rewardLevel: finalRewardLevel,
        rewards: comment?.rewards || [],
        myId: userId,
        xpRewardInterfaceShown
      }),
    [comment, finalRewardLevel, userId, xpRewardInterfaceShown]
  );

  const DetailText = useMemo(() => {
    const commentLinkColor = Color[contentColor]();
    return (
      <div>
        {SELECTED_LANGUAGE === 'kr' ? renderKoreanText() : renderEnglishText()}
      </div>
    );

    function renderEnglishText() {
      return (
        <>
          <UsernameText user={comment.uploader} color={Color[linkColor]()} />{' '}
          <ContentLink
            content={{
              id: comment.id
            }}
            contentType="comment"
            style={{ color: commentLinkColor }}
            label={`${
              type === 'reply'
                ? 'replied'
                : type === 'comment'
                ? rootType === 'user'
                  ? 'posted a profile message'
                  : 'commented'
                : 'responded'
            }:`}
          />
        </>
      );
    }
    function renderKoreanText() {
      return (
        <>
          <UsernameText user={comment.uploader} color={Color[linkColor]()} />
          님이{' '}
          <ContentLink
            content={{
              id: comment.id
            }}
            contentType="comment"
            style={{ color: commentLinkColor }}
            label={`${
              type === 'reply'
                ? '답글을 남겼습니다'
                : type === 'comment'
                ? rootType === 'user'
                  ? '메시지를 남겼습니다'
                  : '댓글을 남겼습니다'
                : '댓글을 남겼습니다'
            }`}
          />
          :
        </>
      );
    }
  }, [comment.id, comment.uploader, contentColor, linkColor, rootType, type]);

  useEffect(() => {
    onSetXpRewardInterfaceShown({
      contentType: 'comment',
      contentId: comment.id,
      shown: xpRewardInterfaceShown && userCanRewardThis
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const contentHidden = useMemo(() => {
    const hasSecretAnswer = subject?.secretAnswer;
    const secretShown =
      subjectState.secretShown || subjectUploaderId === userId;
    return hasSecretAnswer && !secretShown;
  }, [
    subject?.secretAnswer,
    subjectState.secretShown,
    subjectUploaderId,
    userId
  ]);

  const timeSinceLabel = useMemo(() => {
    return timeSince(comment.timeStamp);
  }, [comment?.timeStamp]);

  return (
    <ErrorBoundary
      componentPath="ContentPanel/TargetContent"
      className={`${className} ${targetContentCSS}`}
      style={style}
    >
      <div>
        {comment &&
          (!!comment.notFound || !!comment.isDeleted ? (
            <div
              className={css`
                text-align: center;
                padding: 2rem 0;
              `}
            >
              <span>{commentRemovedLabel}</span>
            </div>
          ) : (
            <div
              className={css`
                margin-top: 0;
              `}
            >
              <div
                className={css`
                  padding: 0 1rem;
                `}
              >
                <div
                  className={css`
                    display: flex;
                    flex-direction: column;
                  `}
                >
                  <div className="detail-block">
                    {DetailText}
                    <div>
                      <span
                        className={`timestamp ${css`
                          cursor: pointer;
                          &:hover {
                            text-decoration: underline;
                          }
                        `}`}
                        onClick={() => navigate(`/comments/${comment.id}`)}
                      >
                        ({timeSinceLabel})
                      </span>
                    </div>
                  </div>
                  <div
                    className={css`
                      margin-top: 1rem;
                    `}
                  >
                    {comment &&
                      comment.filePath &&
                      !contentHidden &&
                      (userId ? (
                        <ContentFileViewer
                          theme={theme}
                          contentId={comment.id}
                          contentType="comment"
                          fileName={comment.fileName}
                          filePath={comment.filePath}
                          fileSize={comment.fileSize}
                          thumbUrl={comment.thumbUrl}
                          videoHeight="100%"
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: '1rem',
                            marginBottom: comment.content ? '2.5rem' : 0,
                            ...(fileType === 'audio'
                              ? {
                                  padding: '1rem'
                                }
                              : {})
                          }}
                        />
                      ) : (
                        <LoginToViewContent />
                      ))}
                    {contentHidden ? (
                      <SecretComment
                        style={{ marginBottom: '1rem' }}
                        onClick={() => navigate(`/subjects/${subject.id}`)}
                      />
                    ) : (
                      <RichText
                        theme={theme}
                        isAIMessage={
                          comment.uploader.id === Number(ZERO_TWINKLE_ID) ||
                          comment.uploader.id === Number(CIEL_TWINKLE_ID)
                        }
                        voice={
                          comment.uploader.id === Number(CIEL_TWINKLE_ID)
                            ? 'nova'
                            : ''
                        }
                        contentId={contentId}
                        contentType={contentType}
                        section="target"
                      >
                        {comment.content}
                      </RichText>
                    )}
                  </div>
                </div>
                {!contentHidden && (
                  <ErrorBoundary
                    componentPath="ContentPanel/TargetContent/index/bottom-menu"
                    className={css`
                      display: flex;
                      justify-content: space-between;
                      margin-top: 1.5rem;
                      padding-top: 1rem;
                    `}
                  >
                    <div
                      className={`left ${css`
                        display: flex;
                        flex-direction: column;
                        padding-bottom: ${comment.likes.length === 0
                          ? '1rem'
                          : ''};
                      `}`}
                    >
                      <div
                        className={css`
                          display: flex;
                        `}
                      >
                        <LikeButton
                          theme={theme}
                          contentType="comment"
                          contentId={comment.id}
                          onClick={handleLikeClick}
                          likes={comment.likes}
                        />
                        <Button
                          style={{ marginLeft: '1rem' }}
                          transparent
                          onClick={handleReplyClick}
                        >
                          <Icon icon="comment-alt" />
                          <span
                            className={css`
                              margin-left: 0.7rem;
                            `}
                          >
                            {replyLabel}
                          </span>
                        </Button>
                        {userCanRewardThis && (
                          <RewardButton
                            style={{ marginLeft: '1rem' }}
                            contentId={comment.id}
                            contentType="comment"
                            disableReason={xpButtonDisabled}
                            theme={theme}
                          />
                        )}
                      </div>
                      <Likers
                        theme={theme}
                        className={css`
                          font-weight: bold;
                          color: ${Color.darkerGray()};
                          font-size: 1.2rem;
                          line-height: 2;
                        `}
                        userId={userId}
                        likes={comment.likes}
                        onLinkClick={() => setUserListModalShown(true)}
                      />
                    </div>
                    <div
                      className={`right ${css`
                        display: flex;
                        align-items: center;
                      `}`}
                    >
                      <Button
                        color={rewardColor}
                        filled={isRecommendedByUser}
                        disabled={recommendationInterfaceShown}
                        onClick={() => setRecommendationInterfaceShown(true)}
                      >
                        <Icon icon="heart" />
                      </Button>
                    </div>
                  </ErrorBoundary>
                )}
              </div>
              {comment && (
                <RecommendationStatus
                  style={{
                    marginTop: 0,
                    marginBottom: '1rem'
                  }}
                  contentType="comment"
                  recommendations={comment.recommendations}
                  theme={theme}
                />
              )}
              {recommendationInterfaceShown && (
                <RecommendationInterface
                  style={{
                    marginTop: '0.5rem'
                  }}
                  contentId={comment.id}
                  contentType="comment"
                  onHide={() => setRecommendationInterfaceShown(false)}
                  recommendations={comment.recommendations}
                  rewardLevel={finalRewardLevel}
                  content={comment.content}
                  theme={theme}
                  uploaderId={comment.uploader.id}
                />
              )}
              {xpRewardInterfaceShown && (
                <XPRewardInterface
                  innerRef={RewardInterfaceRef}
                  contentType={'comment'}
                  contentId={comment.id}
                  rewardLevel={finalRewardLevel}
                  uploaderLevel={comment.uploader.level || 1}
                  uploaderId={comment.uploader.id}
                  onReward={() =>
                    setRecommendationInterfaceShown(
                      !isRecommendedByUser && twinkleCoins > 0
                    )
                  }
                  rewards={comment.rewards}
                />
              )}
              <RewardStatus
                contentType="comment"
                contentId={comment.id}
                theme={theme}
                className={css`
                  margin-left: -1px;
                  margin-right: -1px;
                  @media (max-width: ${mobileMaxWidth}) {
                    margin-left: 0px;
                    margin-right: 0px;
                  }
                `}
                style={{
                  marginTop: 0
                }}
                rewardLevel={finalRewardLevel}
                onCommentEdit={onEditRewardComment}
                rewards={comment.rewards}
              />
              {replyInputShown && !contentHidden && !uploadingFile && (
                <InputForm
                  innerRef={InputFormRef}
                  style={{
                    padding: '0 1rem'
                  }}
                  onSubmit={handleSubmit}
                  parent={{ contentType: 'comment', contentId: comment.id }}
                  rows={4}
                  placeholder={`Write a reply...`}
                />
              )}
              {uploadingFile && (
                <FileUploadStatusIndicator
                  theme={theme}
                  style={{
                    fontSize: '1.7rem',
                    fontWeight: 'bold',
                    marginTop: 0,
                    marginLeft: '1rem',
                    marginRight: '1rem'
                  }}
                  fileName={attachment?.file?.name}
                  uploadProgress={fileUploadProgress}
                />
              )}
              {comments.length > 0 && (
                <div>
                  {comments
                    .filter(
                      (comment: { isDeleted: boolean }) => !comment.isDeleted
                    )
                    .map((comment: CommentType) => (
                      <Comment
                        key={comment.id}
                        comment={comment}
                        username={username}
                        userId={userId}
                        profilePicUrl={profilePicUrl}
                        onDelete={onDeleteComment}
                        onEditDone={onEditComment}
                        theme={theme}
                      />
                    ))}
                </div>
              )}
              {userListModalShown && (
                <UserListModal
                  onHide={() => setUserListModalShown(false)}
                  title="People who liked this comment"
                  users={comment.likes}
                />
              )}
            </div>
          ))}
      </div>
    </ErrorBoundary>
  );

  function handleLikeClick({ isUnlike }: { isUnlike: boolean }) {
    if (!xpButtonDisabled && userCanRewardThis && !isRewardedByUser) {
      onSetXpRewardInterfaceShown({
        contentType: 'comment',
        contentId: comment.id,
        shown: !isUnlike
      });
    } else {
      if (!isRecommendedByUser && !canReward) {
        setRecommendationInterfaceShown(!isUnlike);
      }
    }
    if (comments.length === 0) {
      onShowTCReplyInput({ contentId, contentType });
    }
  }

  function handleReplyClick() {
    if (!replyInputShown) onShowTCReplyInput({ contentId, contentType });
    if (!deviceIsMobile) {
      setTimeout(() => InputFormRef.current.focus(), 0);
    }
  }

  async function handleSubmit(text: string) {
    try {
      if (attachment) {
        onSetUploadingFile({
          contentId: comment.id,
          contentType: 'comment',
          isUploading: true
        });
        const filePath = uuidv1();
        const appliedFileName = generateFileName(attachment.file.name);
        await uploadFile({
          filePath,
          file: attachment.file,
          fileName: appliedFileName,
          onUploadProgress: handleUploadProgress
        });
        await saveFileData({
          fileName: appliedFileName,
          filePath,
          actualFileName: attachment.file.name,
          rootType: 'comment'
        });
        const userChanged = checkUserChange(userId);
        if (userChanged) {
          onClearCommentFileUploadProgress({
            contentType: 'comment',
            contentId: comment.id
          });
          onSetUploadingFile({
            contentId: comment.id,
            contentType: 'comment',
            isUploading: false
          });
          return;
        }
        const data = await uploadComment({
          content: text,
          parent: {
            contentType: rootType,
            contentId: rootObj.id
          },
          rootCommentId: comment.commentId || null,
          targetCommentId: comment.id || null,
          attachment,
          filePath,
          fileName: appliedFileName,
          fileSize: attachment.file.size
        });
        onSetUploadingFile({
          contentId: comment.id,
          contentType: 'comment',
          isUploading: false
        });
        onUploadTargetComment({ ...data.comment, contentId, contentType });
        onClearCommentFileUploadProgress({
          contentType: 'comment',
          contentId: comment.id
        });
        onEnterComment({
          contentType: 'comment',
          contentId: comment.id,
          text: ''
        });
        onSetCommentAttachment({
          attachment: undefined,
          contentType: 'comment',
          contentId: comment.id
        });
      } else {
        const data = await uploadComment({
          content: text,
          parent: {
            contentType: rootType,
            contentId: rootObj.id
          },
          rootCommentId: comment.commentId || null,
          targetCommentId: comment.id || null
        });
        onUploadTargetComment({ ...data.comment, contentId, contentType });
      }
    } catch (error) {
      console.error(error);
    }

    function handleUploadProgress({
      loaded,
      total
    }: {
      loaded: number;
      total: number;
    }) {
      const userChanged = checkUserChange(userId);
      if (userChanged) {
        return;
      }
      onUpdateCommentFileUploadProgress({
        contentType: 'comment',
        contentId: comment.id,
        progress: loaded / total
      });
    }
  }
}
