import React, { useEffect } from 'react';
import Featured from './Featured';
import Recommended from './Recommended';
import MadeByUsers from './MadeByUsers';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useExploreContext, useKeyContext } from '~/contexts';

export default function Subjects() {
  const canPinPlaylists = useKeyContext((v) => v.myState.canPinPlaylists);
  const userId = useKeyContext((v) => v.myState.userId);
  const loadByUserUploads = useAppContext(
    (v) => v.requestHelpers.loadByUserUploads
  );
  const loadFeaturedSubjects = useAppContext(
    (v) => v.requestHelpers.loadFeaturedSubjects
  );
  const loadRecommendedUploads = useAppContext(
    (v) => v.requestHelpers.loadRecommendedUploads
  );
  const loaded = useExploreContext((v) => v.state.subjects.loaded);
  const byUsers = useExploreContext((v) => v.state.subjects.byUsers);
  const byUsersExpanded = useExploreContext(
    (v) => v.state.subjects.byUsersExpanded
  );
  const byUsersLoadMoreButton = useExploreContext(
    (v) => v.state.subjects.byUsersLoadMoreButton
  );
  const byUsersLoaded = useExploreContext(
    (v) => v.state.subjects.byUsersLoaded
  );
  const featureds = useExploreContext((v) => v.state.subjects.featureds);
  const featuredLoaded = useExploreContext(
    (v) => v.state.subjects.featuredLoaded
  );
  const featuredExpanded = useExploreContext(
    (v) => v.state.subjects.featuredExpanded
  );
  const recommendeds = useExploreContext((v) => v.state.subjects.recommendeds);
  const recommendedExpanded = useExploreContext(
    (v) => v.state.subjects.recommendedExpanded
  );
  const recommendedLoadMoreButton = useExploreContext(
    (v) => v.state.subjects.recommendedLoadMoreButton
  );
  const recommendedLoaded = useExploreContext(
    (v) => v.state.subjects.recommendedLoaded
  );
  const prevUserId = useExploreContext((v) => v.state.prevUserId);
  const onLoadFeaturedSubjects = useExploreContext(
    (v) => v.actions.onLoadFeaturedSubjects
  );
  const onSetByUserSubjectsExpanded = useExploreContext(
    (v) => v.actions.onSetByUserSubjectsExpanded
  );
  const onSetFeaturedSubjectsExpanded = useExploreContext(
    (v) => v.actions.onSetFeaturedSubjectsExpanded
  );
  const onSetRecommendedSubjectsExpanded = useExploreContext(
    (v) => v.actions.onSetRecommendedSubjectsExpanded
  );
  const onLoadByUserSubjects = useExploreContext(
    (v) => v.actions.onLoadByUserSubjects
  );
  const onLoadRecommendedSubjects = useExploreContext(
    (v) => v.actions.onLoadRecommendedSubjects
  );
  const onSetSubjectsLoaded = useExploreContext(
    (v) => v.actions.onSetSubjectsLoaded
  );

  useEffect(() => {
    init();
    async function init() {
      if (!loaded || userId !== prevUserId) {
        handleLoadFeaturedSubjects();
        handleLoadByUserSubjects();
        handleLoadRecommendedSubjects();
        onSetSubjectsLoaded(true);
      }
    }

    async function handleLoadFeaturedSubjects() {
      const subjects = await loadFeaturedSubjects();
      onLoadFeaturedSubjects(subjects);
    }

    async function handleLoadByUserSubjects() {
      const { results, loadMoreButton } = await loadByUserUploads({
        contentType: 'subject',
        limit: 5
      });
      onLoadByUserSubjects({
        subjects: results,
        loadMoreButton
      });
    }

    async function handleLoadRecommendedSubjects() {
      const { results, loadMoreButton: loadMoreRecommendsButton } =
        await loadRecommendedUploads({
          contentType: 'subject',
          limit: 5
        });
      onLoadRecommendedSubjects({
        subjects: results,
        loadMoreButton: loadMoreRecommendsButton
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, userId, prevUserId]);

  return (
    <ErrorBoundary componentPath="Explore/Subjects">
      <div>
        {((featuredLoaded && featureds.length > 0) || canPinPlaylists) && (
          <Featured
            loaded={featuredLoaded}
            expanded={featuredExpanded}
            subjects={featureds}
            onSubmit={onLoadFeaturedSubjects}
            onExpand={() => onSetFeaturedSubjectsExpanded(true)}
          />
        )}
        <MadeByUsers
          style={{ marginTop: '2.5rem' }}
          expanded={byUsersExpanded}
          subjects={byUsers}
          loadMoreButton={byUsersLoadMoreButton}
          loaded={byUsersLoaded}
          onExpand={() => onSetByUserSubjectsExpanded(true)}
        />
        <Recommended
          style={{ marginTop: '2.5rem' }}
          expanded={recommendedExpanded}
          subjects={recommendeds}
          loadMoreButton={recommendedLoadMoreButton}
          loaded={recommendedLoaded}
          onExpand={() => onSetRecommendedSubjectsExpanded(true)}
        />
      </div>
    </ErrorBoundary>
  );
}
