import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Main from './Main';
import SearchPosterInput from './SearchPosterInput';
import Searched from './Searched';
import { useContentState } from '~/helpers/hooks';
import { useContentContext } from '~/contexts';

Container.propTypes = {
  autoFocus: PropTypes.bool,
  autoExpand: PropTypes.bool,
  banned: PropTypes.object,
  CommentRefs: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  comments: PropTypes.arrayOf(PropTypes.object),
  commentsHidden: PropTypes.bool,
  CommentInputAreaRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  commentsShown: PropTypes.bool,
  commentsLoadLimit: PropTypes.number,
  inputAtBottom: PropTypes.bool,
  inputAreaInnerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  inputTypeLabel: PropTypes.string,
  isLoading: PropTypes.bool,
  isPreview: PropTypes.bool,
  isSubjectPannelComments: PropTypes.bool,
  loadMoreShown: PropTypes.bool,
  loadMoreButtonColor: PropTypes.string,
  noInput: PropTypes.bool,
  numInputRows: PropTypes.number,
  numPreviews: PropTypes.number,
  onLoadMoreComments: PropTypes.func,
  onCommentSubmit: PropTypes.func,
  onSetCommentSubmitted: PropTypes.func,
  parent: PropTypes.object,
  previewComments: PropTypes.arrayOf(PropTypes.object),
  showSecretButtonAvailable: PropTypes.bool,
  subject: PropTypes.object,
  subjectId: PropTypes.number,
  theme: PropTypes.string,
  uploadComment: PropTypes.func,
  userId: PropTypes.number,
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
          contentId={parent.contentId}
          contentType={parent.contentType}
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
