import React, { useEffect, useMemo } from 'react';
import { useAppContext, useExploreContext, useHomeContext } from '~/contexts';
import ContentListItem from '~/components/ContentListItem';
import { Content } from '~/types';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function FeaturedSubject() {
  const loadFeaturedSubjects = useAppContext(
    (v) => v.requestHelpers.loadFeaturedSubjects
  );
  const featuredSubjectsLoaded = useHomeContext(
    (v) => v.state.featuredSubjectsLoaded
  );
  const onLoadFeaturedSubjects = useExploreContext(
    (v) => v.actions.onLoadFeaturedSubjects
  );
  const onSetFeaturedSubjectsLoaded = useHomeContext(
    (v) => v.actions.onSetFeaturedSubjectsLoaded
  );
  const featureds = useExploreContext((v) => v.state.subjects.featureds);

  useEffect(() => {
    if (!featuredSubjectsLoaded) {
      init();
    }
    async function init() {
      await handleLoadFeaturedSubjects();
      onSetFeaturedSubjectsLoaded(true);
    }

    async function handleLoadFeaturedSubjects() {
      const subjects = await loadFeaturedSubjects();
      onLoadFeaturedSubjects(subjects);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subject = useMemo(() => featureds[0] as Content, [featureds]);

  return subject ? (
    <ErrorBoundary componentPath="Home/FeaturedSubjects">
      <ContentListItem
        key={subject.id}
        hideSideBordersOnMobile
        style={{ marginBottom: '1rem' }}
        contentObj={subject}
      />
    </ErrorBoundary>
  ) : null;
}
