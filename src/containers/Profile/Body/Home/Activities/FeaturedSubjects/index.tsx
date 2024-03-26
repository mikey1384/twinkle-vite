import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ContentListItem from '~/components/ContentListItem';
import SectionPanel from '~/components/SectionPanel';
import SelectFeaturedSubjects from './SelectFeaturedSubjects';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import { useKeyContext } from '~/contexts';
import { useProfileState } from '~/helpers/hooks';
import { User } from '~/types';

const noFeaturedSubjectsLabel = localize('noFeaturedSubjects');
const selectLabel = localize('select');

export default function FeaturedSubjects({ username }: { username: string }) {
  const { userId, canPinPlaylists } = useKeyContext((v) => v.myState);
  const [selectModalShown, setSelectModalShown] = useState(false);
  const { featuredSubjects } = useProfileState(username);

  return (
    <ErrorBoundary componentPath="Explore/Subjects/Featured">
      <SectionPanel
        title="Featured Subjects"
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
            </div>
          ) : null
        }
        isEmpty={featuredSubjects.length === 0}
        emptyMessage={noFeaturedSubjectsLabel}
        loaded={true}
      >
        {featuredSubjects.map(
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
          subjects={featuredSubjects}
          onHide={() => setSelectModalShown(false)}
          onSubmit={() => {
            setSelectModalShown(false);
          }}
        />
      )}
    </ErrorBoundary>
  );
}
