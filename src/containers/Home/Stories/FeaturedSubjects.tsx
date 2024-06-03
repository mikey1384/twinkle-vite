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
  const currentFeaturedIndex = useHomeContext(
    (v) => v.state.currentFeaturedIndex
  );
  const onSetCurrentFeaturedIndex = useHomeContext(
    (v) => v.actions.onSetCurrentFeaturedIndex
  );

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

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (featureds.length === 0) {
        onSetCurrentFeaturedIndex(0);
      } else {
        onSetCurrentFeaturedIndex(
          (currentFeaturedIndex + 1) % featureds.length
        );
      }
    }, 5000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFeaturedIndex, featureds.length]);

  useEffect(() => {
    if (currentFeaturedIndex >= featureds.length) {
      onSetCurrentFeaturedIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureds.length, currentFeaturedIndex]);

  const subject = useMemo(
    () => featureds[currentFeaturedIndex] as Content,
    [featureds, currentFeaturedIndex]
  );

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
