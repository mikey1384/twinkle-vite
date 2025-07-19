import React, { useState, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ContentListItem from '~/components/ContentListItem';
import SectionPanel from '~/components/SectionPanel';
import SelectFeaturedSubjects from './SelectFeaturedSubjects';
import ReorderFeaturedSubjects from './ReorderFeaturedSubjects';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import { useProfileContext, useKeyContext } from '~/contexts';
import { User } from '~/types';

const noFeaturedSubjectsLabel = localize('noFeaturedSubjects');
const selectLabel = localize('select');
const reorderLabel = localize('reorder');

export default function FeaturedSubjects({
  loading,
  selectedTheme,
  subjects,
  username,
  userId
}: {
  loading: boolean;
  selectedTheme: string;
  subjects: any[];
  username: string;
  userId: number;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const [reorderModalShown, setReorderModalShown] = useState(false);
  const [selectModalShown, setSelectModalShown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const onSetFeaturedSubjects = useProfileContext(
    (v) => v.actions.onSetFeaturedSubjects
  );
  const shownSubjects = useMemo(() => {
    if (isExpanded) {
      return subjects;
    }
    return subjects.length > 0 ? subjects.slice(0, 3) : [];
  }, [subjects, isExpanded]);

  return (
    <ErrorBoundary componentPath="Explore/Subjects/Featured">
      <SectionPanel
        title="Featured Subjects"
        loaded={!loading}
        loadMoreButtonShown={!isExpanded && subjects.length > 3}
        onLoadMore={() => setIsExpanded(true)}
        customColorTheme={selectedTheme}
        button={
          myId === userId ? (
            <div style={{ display: 'flex' }}>
              <Button
                skeuomorphic
                color="darkerGray"
                style={{ marginLeft: 'auto' }}
                onClick={() => setSelectModalShown(true)}
              >
                {selectLabel}
              </Button>
              <Button
                skeuomorphic
                color="darkerGray"
                style={{ marginLeft: '1rem' }}
                onClick={() => setReorderModalShown(true)}
              >
                {reorderLabel}
              </Button>
            </div>
          ) : null
        }
        isEmpty={subjects.length === 0}
        emptyMessage={noFeaturedSubjectsLabel}
      >
        {shownSubjects.map(
          (subject: { id: number; contentType: string; uploader: User }) => (
            <ContentListItem
              key={subject.id}
              style={{ marginBottom: '1rem' }}
              contentObj={subject}
            />
          )
        )}
      </SectionPanel>
      {selectModalShown && (
        <SelectFeaturedSubjects
          subjects={subjects}
          onHide={() => setSelectModalShown(false)}
          onSubmit={(subjects) => {
            onSetFeaturedSubjects({
              username,
              subjects
            });
            setSelectModalShown(false);
          }}
        />
      )}
      {reorderModalShown && (
        <ReorderFeaturedSubjects
          subjects={subjects}
          subjectIds={subjects.map((subject) => subject.id)}
          username={username}
          onHide={() => setReorderModalShown(false)}
        />
      )}
    </ErrorBoundary>
  );
}
