import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import SubjectItem from './SubjectItem';
import Loading from '~/components/Loading';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useAppContext } from '~/contexts';
import TopicRequestStatus from '../TopicRequestStatus';
import { chatTopicActionStyle, chatTopicModalClass, chatTopicSectionClass, chatTopicThemeStyle } from '../topicStyles';

export default function SubjectsModal({
  channelId,
  currentSubjectId,
  displayedThemeColor,
  onHide,
  onSelectSubject,
  userIsOwner
}: {
  channelId: number;
  currentSubjectId: number;
  displayedThemeColor: string;
  onHide: () => void;
  onSelectSubject: (v: number) => void;
  userIsOwner: boolean;
}) {
  const deleteChatSubject = useAppContext(
    (v) => v.requestHelpers.deleteChatSubject
  );
  const loadChatSubjects = useAppContext(
    (v) => v.requestHelpers.loadChatSubjects
  );
  const loadMoreChatSubjects = useAppContext(
    (v) => v.requestHelpers.loadMoreChatSubjects
  );
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const pagingRef = useRef({ my: false, all: false });
  const [mySubjects, setMySubjects] = useState({
    subjects: [],
    loadMoreButton: false,
    loading: false,
    error: ''
  });
  const [allSubjects, setAllSubjects] = useState({
    subjects: [],
    loadMoreButton: false,
    loading: false,
    error: ''
  });

  useEffect(() => {
    let ignore = false;
    setLoaded(false);
    setLoadError(false);
    handleLoadSubjects();
    async function handleLoadSubjects() {
      try {
        const { mySubjects, allSubjects } = await loadChatSubjects({
          channelId
        });
        if (ignore) return;
        setMySubjects({ ...mySubjects, loading: false, error: '' });
        setAllSubjects({ ...allSubjects, loading: false, error: '' });
        setLoaded(true);
      } catch (error: any) {
        if (ignore) return;
        setLoadError(true);
        console.error(error.response || error);
      }
    }
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, retryCount]);

  return (
    <Modal
      modalKey="SubjectsModal"
      aria-label="View Topics"
      className={chatTopicModalClass}
      isOpen
      onClose={onHide}
      title="View Topics"
      size="md"
      footer={
        <Button variant="ghost" onClick={onHide}>
          Close
        </Button>
      }
    >
      <div style={{ width: '100%', fontSize: '16px', ...chatTopicThemeStyle(displayedThemeColor) }}>
        {loadError && <TopicRequestStatus message="Couldn't load topics. Please try again." onRetry={() => setRetryCount(count => count + 1)} />}
        {!loaded && !loadError && <Loading text="Loading topics" innerStyle={{ fontSize: '14px' }} />}
        {loaded && mySubjects.subjects.length > 0 && (
          <div style={{ width: '100%' }}>
            <h3 className={chatTopicSectionClass}>
              My Topics
            </h3>
            {(mySubjects.subjects || []).map(
              (subject: {
                id: number;
                content: string;
                userId: number;
                username: string;
                timeStamp: number;
                userIsOwner?: boolean;
              }) => (
                <SubjectItem
                  key={subject.id}
                  currentSubjectId={currentSubjectId}
                  displayedThemeColor={displayedThemeColor}
                  onDeleteSubject={() => setDeleteTarget(subject.id)}
                  onSelectSubject={() => onSelectSubject(subject.id)}
                  {...subject}
                />
              )
            )}
            {mySubjects.error && <TopicRequestStatus message={mySubjects.error} onRetry={() => handleLoadMoreSubjects(true)} />}
            {mySubjects.loadMoreButton && !mySubjects.error && (
              <LoadMoreButton
                style={chatTopicActionStyle}
                filled
                loading={mySubjects.loading}
                onClick={() => handleLoadMoreSubjects(true)}
              />
            )}
          </div>
        )}
        {loaded && allSubjects.subjects.length > 0 && (
          <div
            style={{
              margin: '1rem 0',
              marginTop: mySubjects.subjects.length > 0 ? '3rem' : '1rem',
              width: '100%'
            }}
          >
            <h3 className={chatTopicSectionClass}>
              All Topics
            </h3>
          </div>
        )}
        {loaded && allSubjects.subjects.length === 0 && (
          <p role="status" style={{ padding: '24px 0', textAlign: 'center' }}>No topics have been posted yet.</p>
        )}
        {loaded && (allSubjects.subjects || []).map(
          (subject: {
            id: number;
            content: string;
            userId: number;
            username: string;
            timeStamp: number;
            userIsOwner?: boolean;
          }) => (
            <SubjectItem
              key={subject.id}
              currentSubjectId={currentSubjectId}
              displayedThemeColor={displayedThemeColor}
              onDeleteSubject={() => setDeleteTarget(subject.id)}
              onSelectSubject={() => onSelectSubject(subject.id)}
              userIsOwner={userIsOwner}
              {...subject}
            />
          )
        )}
        {loaded && allSubjects.error && <TopicRequestStatus message={allSubjects.error} onRetry={() => handleLoadMoreSubjects(false)} />}
        {loaded && allSubjects.loadMoreButton && !allSubjects.error && (
          <LoadMoreButton
            filled
            style={{ ...chatTopicActionStyle, marginBottom: '1rem' }}
            loading={allSubjects.loading}
            onClick={() => handleLoadMoreSubjects(false)}
          />
        )}
      </div>
      {deleteTarget && (
        <ConfirmModal
          modalOverModal
          onHide={() => setDeleteTarget(null)}
          onConfirm={() => handleDeleteSubject(deleteTarget)}
          title="Remove Subject"
        />
      )}
    </Modal>
  );

  async function handleDeleteSubject(subjectId: number) {
    await deleteChatSubject(subjectId);
    setMySubjects(prev => ({
      ...prev,
      subjects: prev.subjects.filter(
        (subject: { id: number }) => subject.id !== subjectId
      )
    }));
    setAllSubjects(prev => ({
      ...prev,
      subjects: prev.subjects.filter(
        (subject: { id: number }) => subject.id !== subjectId
      )
    }));
    setDeleteTarget(0);
  }

  async function handleLoadMoreSubjects(mineOnly: boolean) {
    const key = mineOnly ? 'my' : 'all';
    const target = mineOnly ? mySubjects : allSubjects;
    const setTarget = mineOnly ? setMySubjects : setAllSubjects;
    if (pagingRef.current[key] || target.loading || !target.subjects.length) return;
    pagingRef.current[key] = true;
    setTarget(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const { subjects, loadMoreButton } = await loadMoreChatSubjects({
        channelId, mineOnly, lastSubject: target.subjects[target.subjects.length - 1]
      });
      setTarget(prev => ({
        ...prev,
        subjects: prev.subjects.concat(subjects.filter((subject: { id: number }) =>
          !prev.subjects.some((existing: { id: number }) => existing.id === subject.id)
        )),
        loadMoreButton,
        error: ''
      }));
    } catch (error) {
      console.error(error);
      setTarget(prev => ({ ...prev, error: "Couldn't load more topics. Please try again." }));
    } finally {
      pagingRef.current[key] = false;
      setTarget(prev => ({ ...prev, loading: false }));
    }
  }
}
