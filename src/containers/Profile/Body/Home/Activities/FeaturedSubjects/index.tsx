import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ContentListItem from '~/components/ContentListItem';
import SectionPanel from '~/components/SectionPanel';
import SelectFeaturedSubjects from './SelectFeaturedSubjects';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import { useProfileContext, useKeyContext } from '~/contexts';
import { User } from '~/types';

const noFeaturedSubjectsLabel = localize('noFeaturedSubjects');
const selectLabel = localize('select');

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
  const { userId: myId } = useKeyContext((v) => v.myState);
  const [selectModalShown, setSelectModalShown] = useState(false);
  const onSetFeaturedSubjects = useProfileContext(
    (v) => v.actions.onSetFeaturedSubjects
  );

  return (
    <ErrorBoundary componentPath="Explore/Subjects/Featured">
      <SectionPanel
        title="Featured Subjects"
        loaded={!loading}
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
            </div>
          ) : null
        }
        isEmpty={subjects.length === 0}
        emptyMessage={noFeaturedSubjectsLabel}
      >
        {subjects.map(
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
    </ErrorBoundary>
  );
}
