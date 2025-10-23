import React, { useEffect, useState } from 'react';
import NewModal from '~/components/NewModal';
import Button from '~/components/Button';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import SubjectItem from './SubjectItem';
import Loading from '~/components/Loading';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';

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
  const [mySubjects, setMySubjects] = useState({
    subjects: [],
    loadMoreButton: false,
    loading: false
  });
  const [allSubjects, setAllSubjects] = useState({
    subjects: [],
    loadMoreButton: false,
    loading: false
  });

  useEffect(() => {
    handleLoadSubjects();
    async function handleLoadSubjects() {
      try {
        const { mySubjects, allSubjects } = await loadChatSubjects({
          channelId
        });
        setMySubjects(mySubjects);
        setAllSubjects(allSubjects);
        setLoaded(true);
      } catch (error: any) {
        console.error(error.response || error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NewModal
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
      <div style={{ width: '100%' }}>
        {!loaded && <Loading />}
        {mySubjects.subjects.length > 0 && (
          <div style={{ width: '100%' }}>
            <h3
              style={{
                color: Color[displayedThemeColor](),
                marginBottom: '1rem'
              }}
            >
              My Topics
            </h3>
            {mySubjects.subjects.map(
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
            {mySubjects.loadMoreButton && (
              <LoadMoreButton
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
            <h3
              style={{
                color: Color[displayedThemeColor]()
              }}
            >
              All Topics
            </h3>
          </div>
        )}
        {loaded && allSubjects.subjects.length === 0 && (
          <div>{`There aren't any subjects here, yet`}</div>
        )}
        {allSubjects.subjects.map(
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
        {allSubjects.loadMoreButton && (
          <LoadMoreButton
            filled
            style={{ marginBottom: '1rem' }}
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
    </NewModal>
  );

  async function handleDeleteSubject(subjectId: number) {
    await deleteChatSubject(subjectId);
    setMySubjects({
      ...mySubjects,
      subjects: mySubjects.subjects.filter(
        (subject: { id: number }) => subject.id !== subjectId
      )
    });
    setAllSubjects({
      ...allSubjects,
      subjects: allSubjects.subjects.filter(
        (subject: { id: number }) => subject.id !== subjectId
      )
    });
    setDeleteTarget(0);
  }

  async function handleLoadMoreSubjects(mineOnly: boolean) {
    if (mineOnly) {
      setMySubjects({ ...mySubjects, loading: true });
    } else {
      setAllSubjects({ ...allSubjects, loading: true });
    }
    const targetSubjects = mineOnly
      ? mySubjects.subjects
      : allSubjects.subjects;
    const lastSubject = targetSubjects[targetSubjects.length - 1];
    const { subjects, loadMoreButton } = await loadMoreChatSubjects({
      channelId,
      mineOnly,
      lastSubject
    });
    if (mineOnly) {
      setMySubjects({
        ...mySubjects,
        subjects: mySubjects.subjects.concat(subjects),
        loadMoreButton,
        loading: false
      });
    } else {
      setAllSubjects({
        ...allSubjects,
        subjects: allSubjects.subjects.concat(subjects),
        loadMoreButton,
        loading: false
      });
    }
  }
}
