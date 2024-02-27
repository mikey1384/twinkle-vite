import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Main from './Main';
import SearchPosterInput from './SearchPosterInput';
import Searched from './Searched';
import { useContentState } from '~/helpers/hooks';
import { useContentContext } from '~/contexts';
import { Comment, Content, Subject } from '~/types';

export default function Container({
  autoExpand,
  autoFocus,
  banned,
  CommentInputAreaRef,
  CommentRefs,
  comments,
  commentsHidden,
  commentsShown,
  commentsLoadLimit,
  disableReason,
  inputAtBottom,
  inputAreaInnerRef,
  inputTypeLabel,
  isLoading,
  isPreview,
  isSubjectPannelComments,
  loadMoreShown,
  loadMoreButtonColor,
  noInput,
  numInputRows,
  numPreviews,
  onCommentSubmit,
  onLoadMoreComments,
  onSetCommentSubmitted,
  parent,
  previewComments,
  showSecretButtonAvailable,
  subject,
  subjectId,
  theme,
  uploadComment,
  rootContent
}: {
  autoExpand?: boolean;
  autoFocus?: boolean;
  banned?: object;
  CommentInputAreaRef?: React.RefObject<any>;
  CommentRefs: Record<string, React.RefObject<any>>;
  comments: Comment[];
  commentsHidden?: boolean;
  commentsShown?: boolean;
  commentsLoadLimit?: number;
  disableReason?: string;
  inputAtBottom?: boolean;
  inputAreaInnerRef?: React.RefObject<any>;
  inputTypeLabel: string;
  isLoading?: boolean;
  isPreview?: boolean;
  isSubjectPannelComments?: boolean;
  loadMoreShown?: boolean;
  loadMoreButtonColor: string;
  noInput?: boolean;
  numInputRows?: number;
  numPreviews?: number;
  onCommentSubmit: (comment: any) => void;
  onLoadMoreComments: (v: any) => void;
  onSetCommentSubmitted: (comment: any) => void;
  parent: Content;
  previewComments?: Comment[];
  showSecretButtonAvailable?: boolean;
  subject?: Subject;
  subjectId?: number;
  theme?: any;
  uploadComment: (comment: any) => void;
  rootContent?: Content;
}) {
  const { searchedPoster } = useContentState({
    contentType: parent.contentType,
    contentId: parent.contentId
  });
  const onSetSearchedPoster = useContentContext(
    (v) => v.actions.onSetSearchedPoster
  );
  const rootContentState = useContentState({
    contentType: rootContent?.contentType || '',
    contentId: rootContent?.id || 0
  });
  const pinnedCommentId = useMemo(() => {
    if (isSubjectPannelComments) {
      return subject?.pinnedCommentId;
    }
    if (parent.contentType === 'comment') {
      return rootContentState?.pinnedCommentId;
    }
    return parent.pinnedCommentId;
  }, [
    isSubjectPannelComments,
    parent.contentType,
    parent.pinnedCommentId,
    rootContentState?.pinnedCommentId,
    subject?.pinnedCommentId
  ]);

  return (
    <ErrorBoundary componentPath="Comments/Container">
      {!isPreview && (loadMoreShown || !!searchedPoster) ? (
        <SearchPosterInput
          selectedUser={searchedPoster}
          onSetSelectedUser={(poster) =>
            onSetSearchedPoster({
              contentId: parent.contentId,
              contentType: parent.contentType,
              poster
            })
          }
        />
      ) : null}
      {searchedPoster ? (
        <Searched
          isSubjectPannelComments={isSubjectPannelComments}
          parent={parent}
          pinnedCommentId={pinnedCommentId}
          rootContent={rootContent}
          poster={searchedPoster}
          loadMoreButtonColor={loadMoreButtonColor}
          subject={subject}
          theme={theme}
        />
      ) : (
        <Main
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
          loadMoreShown={loadMoreShown}
          loadMoreButtonColor={loadMoreButtonColor}
          noInput={noInput}
          numInputRows={numInputRows}
          numPreviews={numPreviews}
          onCommentSubmit={onCommentSubmit}
          onLoadMoreComments={onLoadMoreComments}
          onSetCommentSubmitted={onSetCommentSubmitted}
          parent={parent}
          pinnedCommentId={pinnedCommentId}
          previewComments={previewComments}
          showSecretButtonAvailable={showSecretButtonAvailable}
          subject={subject}
          subjectId={subjectId}
          theme={theme}
          uploadComment={uploadComment}
          rootContent={rootContent}
        />
      )}
    </ErrorBoundary>
  );
}
