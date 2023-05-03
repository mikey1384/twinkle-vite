import React from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Main from './Main';
import SearchPosterInput from './SearchPosterInput';
import Searched from './Searched';
import { useContentState } from '~/helpers/hooks';
import { useContentContext } from '~/contexts';
import { Comment, Content, Subject } from '~/types';

Container.propTypes = {
  autoExpand: PropTypes.bool,
  autoFocus: PropTypes.bool,
  banned: PropTypes.object,
  CommentInputAreaRef: PropTypes.object,
  CommentRefs: PropTypes.object.isRequired,
  comments: PropTypes.array.isRequired,
  commentsHidden: PropTypes.bool,
  commentsShown: PropTypes.bool,
  commentsLoadLimit: PropTypes.number,
  disableReason: PropTypes.string,
  inputAtBottom: PropTypes.bool,
  inputAreaInnerRef: PropTypes.object,
  inputTypeLabel: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
  isPreview: PropTypes.bool,
  isSubjectPannelComments: PropTypes.bool,
  loadMoreShown: PropTypes.bool,
  loadMoreButtonColor: PropTypes.string.isRequired,
  noInput: PropTypes.bool,
  numInputRows: PropTypes.number,
  numPreviews: PropTypes.number,
  onCommentSubmit: PropTypes.func.isRequired,
  onLoadMoreComments: PropTypes.func.isRequired,
  onSetCommentSubmitted: PropTypes.func.isRequired,
  parent: PropTypes.object.isRequired,
  previewComments: PropTypes.array,
  showSecretButtonAvailable: PropTypes.bool,
  subject: PropTypes.object,
  subjectId: PropTypes.number,
  theme: PropTypes.string,
  uploadComment: PropTypes.func.isRequired,
  rootContent: PropTypes.object
};
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
          rootContent={rootContent}
        />
      )}
    </ErrorBoundary>
  );
}
