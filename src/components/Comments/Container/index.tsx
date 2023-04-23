import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Main from './Main';
import SearchPosterInput from './SearchPosterInput';
import Searched from './Searched';
import { useContentState } from '~/helpers/hooks';
import { useContentContext } from '~/contexts';

interface Props {
  autoExpand?: boolean;
  autoFocus?: boolean;
  banned?: any;
  CommentInputAreaRef?: React.RefObject<any>;
  CommentRefs?: any;
  comments: any[];
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
  parent: any;
  previewComments?: any[];
  showSecretButtonAvailable?: boolean;
  subject?: any;
  subjectId?: number;
  theme?: any;
  uploadComment: (comment: any) => void;
  userId?: number;
  rootContent?: any;
}
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
  userId,
  rootContent
}: Props) {
  const { searchedPoster } = useContentState({
    contentType: parent.contentType,
    contentId: parent.contentId
  });
  const onSetSearchedPoster = useContentContext(
    (v) => v.actions.onSetSearchedPoster
  );

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
          parent={parent}
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
          previewComments={previewComments}
          showSecretButtonAvailable={showSecretButtonAvailable}
          subject={subject}
          subjectId={subjectId}
          theme={theme}
          uploadComment={uploadComment}
          userId={userId}
          rootContent={rootContent}
        />
      )}
    </ErrorBoundary>
  );
}
