import React, { useState } from 'react';
import SubjectPanel from './SubjectPanel';
import StartNewSubjectPanel from './StartNewSubjectPanel';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import LocalContext from './Context';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext } from '~/contexts';

interface Props {
  className?: string;
  subjects: any[];
  loadMoreButton?: boolean;
  style?: any;
  contentId: number;
  contentType: string;
  uploadSubject: any;
  onLoadMoreSubjects: any;
  onLoadSubjectComments: any;
  onSetRewardLevel: any;
  onSubjectEditDone: any;
  onSubjectDelete: any;
  rootRewardLevel?: number;
  commentActions: {
    editRewardComment: any;
    onDelete: any;
    onEditDone: any;
    onLikeClick: any;
    onLoadMoreComments: any;
    onLoadMoreReplies: any;
    onLoadRepliesOfReply: any;
    onUploadComment: any;
    onUploadReply: any;
  };
}
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
}: Props) {
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
