import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';
import Context from './Context';
import ErrorBoundary from '~/components/ErrorBoundary';
import Container from './Container';
import { v1 as uuidv1 } from 'uuid';
import {
  returnTheme,
  returnImageFileFromUrl,
  scrollElementToCenter
} from '~/helpers';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { generateFileName } from '~/helpers/stringHelpers';
import {
  useAppContext,
  useContentContext,
  useInputContext,
  useKeyContext
} from '~/contexts';
import { Comment, Content, Subject } from '~/types';

Comments.propTypes = {
  autoFocus: PropTypes.bool,
  autoExpand: PropTypes.bool,
  comments: PropTypes.array,
  commentsHidden: PropTypes.bool,
  commentsLoadLimit: PropTypes.number,
  commentsShown: PropTypes.bool,
  className: PropTypes.string,
  disableReason: PropTypes.string,
  inputAreaInnerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  inputAtBottom: PropTypes.bool,
  inputTypeLabel: PropTypes.string.isRequired,
  isSubjectPannelComments: PropTypes.bool,
  isLoading: PropTypes.bool,
  loadMoreButton: PropTypes.bool,
  noInput: PropTypes.bool,
  numInputRows: PropTypes.number,
  numPreviews: PropTypes.number,
  onCommentSubmit: PropTypes.func,
  onDelete: PropTypes.func,
  onEditDone: PropTypes.func,
  onLikeClick: PropTypes.func,
  onLoadRepliesOfReply: PropTypes.func,
  onLoadMoreComments: PropTypes.func.isRequired,
  onLoadMoreReplies: PropTypes.func,
  onPreviewClick: PropTypes.func,
  onReplySubmit: PropTypes.func.isRequired,
  onRewardCommentEdit: PropTypes.func,
  parent: PropTypes.object.isRequired,
  rootContent: PropTypes.object,
  showSecretButtonAvailable: PropTypes.bool,
  subject: PropTypes.object,
  style: PropTypes.object,
  theme: PropTypes.string,
  userId: PropTypes.number
};
function Comments({
  autoFocus,
  autoExpand,
  comments = [],
  commentsHidden,
  commentsLoadLimit,
  commentsShown,
  className,
  disableReason,
  inputAreaInnerRef,
  inputAtBottom,
  inputTypeLabel,
  isSubjectPannelComments,
  isLoading,
  loadMoreButton,
  noInput,
  numInputRows,
  numPreviews = 0,
  onCommentSubmit,
  onDelete,
  onEditDone,
  onLikeClick,
  onLoadRepliesOfReply,
  onLoadMoreComments,
  onLoadMoreReplies,
  onPreviewClick = () => null,
  onReplySubmit,
  onRewardCommentEdit,
  parent,
  rootContent,
  showSecretButtonAvailable,
  subject,
  style,
  theme,
  userId
}: {
  autoFocus?: boolean;
  autoExpand?: boolean;
  comments?: Comment[];
  commentsHidden?: boolean;
  commentsLoadLimit?: number;
  commentsShown?: boolean;
  className?: string;
  disableReason?: string;
  inputAreaInnerRef?: any;
  inputAtBottom?: boolean;
  inputTypeLabel: string;
  isSubjectPannelComments?: boolean;
  isLoading?: boolean;
  loadMoreButton?: boolean;
  noInput?: boolean;
  numInputRows?: number;
  numPreviews?: number;
  onCommentSubmit: (v: any) => void;
  onDelete: (v: any) => void;
  onEditDone?: (v: any) => void;
  onLikeClick?: (v: any) => void;
  onLoadRepliesOfReply?: (v: any) => void;
  onLoadMoreComments: (v: any) => void;
  onLoadMoreReplies?: (v: any) => void;
  onPreviewClick?: (v: any) => void;
  onReplySubmit: (v: any) => void;
  onRewardCommentEdit?: (v: any) => void;
  parent: Content;
  rootContent?: Content;
  showSecretButtonAvailable?: boolean;
  subject?: Subject;
  style?: React.CSSProperties;
  theme?: string;
  userId?: number;
}) {
  const { banned, profileTheme } = useKeyContext((v) => v.myState);
  const checkUserChange = useKeyContext((v) => v.helpers.checkUserChange);
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const deleteContent = useAppContext((v) => v.requestHelpers.deleteContent);
  const uploadComment = useAppContext((v) => v.requestHelpers.uploadComment);
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const onClearCommentFileUploadProgress = useContentContext(
    (v) => v.actions.onClearCommentFileUploadProgress
  );
  const onUpdateCommentFileUploadProgress = useContentContext(
    (v) => v.actions.onUpdateCommentFileUploadProgress
  );
  const [deleting, setDeleting] = useState(false);
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [prevComments, setPrevComments] = useState(comments);
  const ContainerRef = useRef(null);
  const CommentInputAreaRef = useRef(null);
  const CommentRefs: Record<string, React.RefObject<any>> = {};
  const subjectId = useMemo(
    () => (parent.contentType === 'subject' ? parent.contentId : subject?.id),
    [parent.contentId, parent.contentType, subject?.id]
  );

  const handleFileUpload = useCallback(
    async ({
      attachment,
      commentContent,
      contentType,
      contentId,
      filePath,
      file,
      rootCommentId,
      subjectId,
      targetCommentId,
      isReply
    }: {
      attachment: any;
      commentContent: string;
      contentType: string;
      contentId: number;
      filePath: string;
      file: any;
      rootCommentId: number;
      subjectId: number;
      targetCommentId: number | null;
      isReply: boolean;
    }) => {
      if (banned?.posting) {
        return;
      }
      const finalContentType = targetCommentId
        ? 'comment'
        : subjectId
        ? 'subject'
        : contentType;
      const finalContentId = targetCommentId || subjectId || contentId;
      const appliedFileName = generateFileName(file.name);
      try {
        setCommentSubmitted(true);
        const promises = [];
        promises.push(
          uploadFile({
            filePath,
            file,
            fileName: appliedFileName,
            onUploadProgress: handleUploadProgress
          })
        );
        let thumbUrl = '';
        if (attachment.thumbnail) {
          promises.push(
            (async () => {
              const file = returnImageFileFromUrl({
                imageUrl: attachment.thumbnail
              });
              const thumbUrl = await uploadThumb({
                file,
                path: uuidv1()
              });
              return Promise.resolve(thumbUrl);
            })()
          );
        }
        const result = await Promise.all(promises);
        const userChanged = checkUserChange(userId);
        if (userChanged) {
          return;
        }
        if (attachment.thumbnail) {
          thumbUrl = result[result.length - 1];
        }
        const { comment } = await uploadComment({
          content: commentContent,
          parent,
          rootCommentId,
          subjectId,
          targetCommentId,
          attachment,
          filePath,
          fileName: appliedFileName,
          fileSize: file.size,
          thumbUrl
        });
        if (isReply) {
          onReplySubmit({
            ...comment,
            contentId: parent.contentId,
            contentType: parent.contentType
          });
        } else {
          onCommentSubmit({
            ...comment,
            contentId: targetCommentId || parent.contentId,
            contentType: targetCommentId ? 'comment' : parent.contentType
          });
        }
        onClearCommentFileUploadProgress({
          contentType: finalContentType,
          contentId: finalContentId
        });
        onEnterComment({
          contentType: finalContentType,
          contentId: finalContentId,
          text: ''
        });
        return Promise.resolve();
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
          contentType: finalContentType,
          contentId: finalContentId,
          progress: loaded / total
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [banned?.posting, onCommentSubmit, onReplySubmit, parent]
  );

  const handleSubmitReply = useCallback(
    async ({
      content,
      rootCommentId,
      targetCommentId
    }: {
      content: string;
      rootCommentId: number | null;
      targetCommentId: number | null;
    }) => {
      if (banned?.posting) {
        return;
      }
      setCommentSubmitted(true);
      try {
        const { comment } = await uploadComment({
          content,
          parent,
          rootCommentId,
          targetCommentId
        });
        onReplySubmit({
          ...comment,
          contentId: parent.contentId,
          contentType: parent.contentType
        });
        setCommentSubmitted(false);
      } catch (error) {
        console.error('Error submitting reply:', error);
        setCommentSubmitted(false);
        return Promise.reject(error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [banned?.posting, onReplySubmit, parent]
  );

  const handleDeleteComment = useCallback(
    async (commentId: number) => {
      setDeleting(true);
      await deleteContent({ id: commentId, contentType: 'comment' });
      onDelete(commentId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onDelete]
  );

  useEffect(() => {
    if (comments.length < prevComments.length && deleting) {
      setDeleting(false);
      if (comments.length === 0) {
        scrollElementToCenter(ContainerRef.current);
      } else if (
        comments[comments.length - 1].id !==
        prevComments[prevComments.length - 1].id
      ) {
        scrollElementToCenter(CommentRefs[comments[comments.length - 1].id]);
      }
    }
    if (
      inputAtBottom &&
      commentSubmitted &&
      comments.length > prevComments.length &&
      (prevComments.length === 0 ||
        comments[comments.length - 1].id >
          prevComments[prevComments.length - 1].id)
    ) {
      setCommentSubmitted(false);
      scrollElementToCenter(CommentRefs[comments[comments.length - 1].id]);
    }
    if (
      !inputAtBottom &&
      commentSubmitted &&
      comments.length > prevComments.length &&
      (prevComments.length === 0 || comments[0].id > prevComments[0].id)
    ) {
      setCommentSubmitted(false);
      scrollElementToCenter(CommentRefs[comments[0].id]);
    }
    setPrevComments(comments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments]);

  useEffect(() => {
    if (!autoExpand && !commentSubmitted && autoFocus && commentsShown) {
      scrollElementToCenter(CommentInputAreaRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentsShown]);
  const previewComments = useMemo(
    () =>
      numPreviews > 0 && !commentsShown
        ? comments.filter((comment, index) => index < numPreviews)
        : [],
    [comments, commentsShown, numPreviews]
  );
  const isPreview = useMemo(
    () => previewComments.length > 0,
    [previewComments.length]
  );

  return (
    <ErrorBoundary componentPath="Comments">
      <Context.Provider
        value={{
          onDelete: handleDeleteComment,
          onEditDone,
          onLikeClick,
          onLoadMoreReplies,
          onRewardCommentEdit,
          onReplySubmit: handleSubmitReply,
          onLoadRepliesOfReply,
          onSubmitWithAttachment: handleFileUpload
        }}
      >
        <div
          className={`${
            isPreview && !(commentsShown || autoExpand)
              ? css`
                  border-bottom-left-radius: ${borderRadius};
                  border-bottom-right-radius: ${borderRadius};
                  &:hover {
                    background: ${Color.highlightGray()};
                  }
                  @media (max-width: ${mobileMaxWidth}) {
                    &:hover {
                      background: #fff;
                    }
                  }
                `
              : ''
          } ${className}`}
          style={style}
          ref={ContainerRef}
          onClick={isPreview ? onPreviewClick : () => null}
        >
          <Container
            autoFocus={autoFocus}
            autoExpand={autoExpand}
            banned={banned}
            comments={comments}
            commentsShown={commentsShown}
            commentsHidden={commentsHidden}
            commentsLoadLimit={commentsLoadLimit}
            CommentRefs={CommentRefs}
            CommentInputAreaRef={CommentInputAreaRef}
            disableReason={disableReason}
            inputAreaInnerRef={inputAreaInnerRef}
            inputAtBottom={inputAtBottom}
            inputTypeLabel={inputTypeLabel}
            isLoading={isLoading}
            isPreview={isPreview}
            isSubjectPannelComments={isSubjectPannelComments}
            loadMoreShown={loadMoreButton}
            loadMoreButtonColor={loadMoreButtonColor}
            noInput={noInput}
            numInputRows={numInputRows}
            numPreviews={numPreviews}
            onCommentSubmit={onCommentSubmit}
            onLoadMoreComments={onLoadMoreComments}
            onSetCommentSubmitted={setCommentSubmitted}
            parent={parent}
            previewComments={previewComments}
            showSecretButtonAvailable={showSecretButtonAvailable}
            subject={subject}
            subjectId={subjectId}
            theme={theme}
            uploadComment={uploadComment}
            rootContent={rootContent}
          />
        </div>
      </Context.Provider>
    </ErrorBoundary>
  );
}

export default memo(Comments);
