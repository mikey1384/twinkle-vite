import React, { useState, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ContentListItem from '~/components/ContentListItem';
import SectionPanel from '~/components/SectionPanel';
import SelectFeaturedSubjects from '../Modals/SelectFeaturedSubjects';
import ReorderFeaturedSubjects from '../Modals/ReorderFeaturedSubjects';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import { useKeyContext } from '~/contexts';

const featuredLabel = localize('featuredSubjects');
const noFeaturedSubjectsLabel = localize('noFeaturedSubjects');
const reorderLabel = localize('reorder');
const selectLabel = localize('select');

export default function Featured({
  loaded,
  expanded,
  subjects,
  onExpand,
  onSubmit
}: {
  loaded: boolean;
  expanded: boolean;
  subjects: any[];
  onExpand: () => void;
  onSubmit: (arg0: any) => any;
}) {
  const { userId, canPinPlaylists } = useKeyContext((v) => v.myState);
  const [reorderModalShown, setReorderModalShown] = useState(false);
  const [selectModalShown, setSelectModalShown] = useState(false);
  const shownSubjects = useMemo(() => {
    if (expanded) {
      return subjects;
    }
    return subjects.length > 0 ? subjects.slice(0, 3) : [];
  }, [subjects, expanded]);

  return (
    <ErrorBoundary componentPath="Explore/Subjects/Featured">
      <SectionPanel
        title={featuredLabel}
        loadMoreButtonShown={!expanded && subjects.length > 3}
        onLoadMore={onExpand}
        button={
          userId && canPinPlaylists ? (
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
        loaded={loaded}
      >
        {shownSubjects.map((subject) => (
          <ContentListItem
            key={subject.id}
            style={{ marginBottom: '1rem' }}
            contentObj={subject}
          />
        ))}
      </SectionPanel>
      {selectModalShown && (
        <SelectFeaturedSubjects
          subjects={subjects}
          onHide={() => setSelectModalShown(false)}
          onSubmit={(selectedSubjects) => {
            onSubmit(selectedSubjects);
            setSelectModalShown(false);
          }}
        />
      )}
      {reorderModalShown && (
        <ReorderFeaturedSubjects
          subjectIds={subjects.map((subject) => subject.id)}
          onHide={() => setReorderModalShown(false)}
        />
      )}
    </ErrorBoundary>
  );
}
