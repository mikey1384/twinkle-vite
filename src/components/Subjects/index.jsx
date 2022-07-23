import { useState } from 'react';
import PropTypes from 'prop-types';
import SubjectPanel from './SubjectPanel';
import StartNewSubjectPanel from './StartNewSubjectPanel';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import LocalContext from './Context';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useKeyContext } from '~/contexts';

Subjects.propTypes = {
  className: PropTypes.string,
  contentId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  subjects: PropTypes.array,
  loadMoreButton: PropTypes.bool,
  onLoadMoreSubjects: PropTypes.func.isRequired,
  onSubjectEditDone: PropTypes.func.isRequired,
  onSubjectDelete: PropTypes.func.isRequired,
  onLoadSubjectComments: PropTypes.func.isRequired,
  rootRewardLevel: PropTypes.number,
  onSetRewardLevel: PropTypes.func.isRequired,
  style: PropTypes.object,
  contentType: PropTypes.string,
  uploadSubject: PropTypes.func.isRequired,
  commentActions: PropTypes.shape({
    editRewardComment: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onEditDone: PropTypes.func.isRequired,
    onLikeClick: PropTypes.func.isRequired,
    onLoadMoreComments: PropTypes.func.isRequired,
    onLoadMoreReplies: PropTypes.func.isRequired,
    onLoadRepliesOfReply: PropTypes.func.isRequired,
    onUploadComment: PropTypes.func.isRequired,
    onUploadReply: PropTypes.func.isRequired
  })
};

export default function Subjects({
  className,
  subjects,
  loadMoreButton,
  style = {},
  contentId,
  contentType,
  uploadSubject,
  onLoadMoreSubjects,
  onLoadSubjectComments,
  onSetRewardLevel,
  onSubjectEditDone,
  onSubjectDelete,
  rootRewardLevel,
  commentActions: {
    editRewardComment,
    onDelete,
    onEditDone,
    onLikeClick,
    onLoadMoreComments,
    onLoadMoreReplies,
    onLoadRepliesOfReply,
    onUploadComment,
    onUploadReply
  }
}) {
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const loadSubjects = useAppContext((v) => v.requestHelpers.loadSubjects);
  const [loadingMore, setLoadingMore] = useState(false);
  return (
    <LocalContext.Provider
      value={{
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
      }}
    >
      <div className={className} style={style}>
        <ErrorBoundary componentPath="Subjects/index">
          <StartNewSubjectPanel
            contentId={contentId}
            contentType={contentType}
            onUploadSubject={uploadSubject}
          />
          <div style={{ margin: '1rem 0' }}>
            {subjects &&
              subjects.map((subject) => (
                <SubjectPanel
                  key={subject.id}
                  rootRewardLevel={rootRewardLevel}
                  rootId={Number(contentId)}
                  rootType={contentType}
                  subjectId={subject.id}
                  {...subject}
                />
              ))}
            {loadMoreButton && (
              <LoadMoreButton
                style={{ width: '100%', borderRadius: 0 }}
                filled
                color={loadMoreButtonColor}
                loading={loadingMore}
                onClick={handleLoadMoreSubjects}
              />
            )}
          </div>
        </ErrorBoundary>
      </div>
    </LocalContext.Provider>
  );

  async function handleLoadMoreSubjects() {
    setLoadingMore(true);
    const data = await loadSubjects({
      contentType,
      contentId,
      lastSubjectId: subjects[subjects.length - 1].id
    });
    onLoadMoreSubjects({ ...data, contentId, contentType });
    setLoadingMore(false);
  }
}
