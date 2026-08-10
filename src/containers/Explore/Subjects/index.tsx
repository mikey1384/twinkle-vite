import React, { useEffect } from 'react';
import Featured from './Featured';
import Recommended from './Recommended';
import MadeByUsers from './MadeByUsers';
import ErrorBoundary from '~/components/ErrorBoundary';
import {
  useAppContext,
  useExploreContext,
  useHomeContext,
  useKeyContext
} from '~/contexts';
import { loadLatestCanonicalFeaturedSubjects } from '~/helpers/featuredSubjects';

export default function Subjects() {
  const canPinPlaylists = useKeyContext((v) => v.myState.canPinPlaylists);
  const userId = useKeyContext((v) => v.myState.userId);
  const checkUserChange = useKeyContext((v) => v.helpers.checkUserChange);
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
  const onSetFeaturedSubjectsLoaded = useHomeContext(
    (v) => v.actions.onSetFeaturedSubjectsLoaded
  );

  useEffect(() => {
    const requestUserId = userId;
    init();

    async function init() {
      if (!loaded || userId !== prevUserId) {
        const results = await Promise.allSettled([
          handleLoadFeaturedSubjects(),
          handleLoadByUserSubjects(),
          handleLoadRecommendedSubjects()
        ]);
        if (checkUserChange(requestUserId)) return;
        for (const result of results) {
          if (result.status === 'rejected') {
            console.error('Failed to load Explore subjects:', result.reason);
          }
        }
        const allCanonicalResponsesApplied = results.every(
          (result) => result.status === 'fulfilled' && result.value === true
        );
        if (allCanonicalResponsesApplied) {
          onSetSubjectsLoaded(true);
        }
      }
    }

    async function handleLoadFeaturedSubjects() {
      const subjects = await loadLatestCanonicalFeaturedSubjects({
        load: loadFeaturedSubjects,
        isCurrentOwner: () => !checkUserChange(requestUserId)
      });
      if (!subjects) return false;
      onLoadFeaturedSubjects(subjects);
      onSetFeaturedSubjectsLoaded(true);
      return true;
    }

    async function handleLoadByUserSubjects() {
      const { results, loadMoreButton } = await loadByUserUploads({
        contentType: 'subject',
        limit: 5
      });
      if (checkUserChange(requestUserId)) return;
      onLoadByUserSubjects({
        subjects: results,
        loadMoreButton
      });
      return true;
    }

    async function handleLoadRecommendedSubjects() {
      const { results, loadMoreButton: loadMoreRecommendsButton } =
        await loadRecommendedUploads({
          contentType: 'subject',
          limit: 5
        });
      if (checkUserChange(requestUserId)) return;
      onLoadRecommendedSubjects({
        subjects: results,
        loadMoreButton: loadMoreRecommendsButton
      });
      return true;
    }
    // checkUserChange/loadFeaturedSubjects/loadByUserUploads/loadRecommendedUploads and context actions are stable helpers.
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
