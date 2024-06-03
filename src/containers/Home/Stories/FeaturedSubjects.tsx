import React, { useEffect, useMemo, useState } from 'react';
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

  const [currentIndex, setCurrentIndex] = useState(0);

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
      setCurrentIndex((prevIndex) => (prevIndex + 1) % featureds.length);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [featureds]);

  const subject = useMemo(
    () => featureds[currentIndex] as Content,
    [featureds, currentIndex]
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
