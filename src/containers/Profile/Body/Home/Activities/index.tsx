import React, { useEffect, useMemo, useState } from 'react';
import XPAnalysis from './XPAnalysis';
import ErrorBoundary from '~/components/ErrorBoundary';
import NotableActivities from './NotableActivities';
import MissionProgress from './MissionProgress';
import FeaturedSubjects from './FeaturedSubjects';
import { useAppContext, useKeyContext, useProfileContext } from '~/contexts';
import { useProfileState } from '~/helpers/hooks';

export default function Activities({
  profile,
  profile: { id, username, selectedMissionListTab, missions, missionsLoaded },
  selectedTheme
}: {
  profile: any;
  selectedTheme: string;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const checkUserChange = useKeyContext((v) => v.helpers.checkUserChange);
  const [isNotablesLoading, setIsNotablesLoading] = useState(false);
  const loadNotableContent = useAppContext(
    (v) => v.requestHelpers.loadNotableContent
  );
  const loadProfileFeaturedItems = useAppContext(
    (v) => v.requestHelpers.loadProfileFeaturedItems
  );
  const onLoadNotables = useProfileContext((v) => v.actions.onLoadNotables);
  const onLoadFeaturedSubjects = useProfileContext(
    (v) => v.actions.onLoadFeaturedSubjects
  );
  const {
    notables: {
      feeds: notables,
      loaded: isNotablesLoaded,
      loadMoreButton: isNotablesLoadMoreButtonShown
    },
    subjects: { posts: featuredSubjects, loaded: isSubjectsLoaded }
  } = useProfileState(username);
  useEffect(() => {
    const requestUserId = userId;
    if (!isNotablesLoaded) {
      initNotables();
    }
    if (!isSubjectsLoaded) {
      initSubjects();
    }
    async function initNotables() {
      setIsNotablesLoading(true);
      try {
        const { results, loadMoreButton } = await loadNotableContent({
          userId: id
        });
        if (checkUserChange(requestUserId)) return;
        onLoadNotables({ username, feeds: results, loadMoreButton });
      } catch (error) {
        console.error(error);
      } finally {
        setIsNotablesLoading(false);
      }
    }
    async function initSubjects() {
      try {
        const items = await loadProfileFeaturedItems(id);
        if (checkUserChange(requestUserId)) return;
        onLoadFeaturedSubjects({ username, subjects: items });
      } catch (error) {
        console.error(error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNotablesLoaded, isSubjectsLoaded, username, userId]);

  // Featured holds subjects and comments; once the list has loaded it
  // decides, and until then the subject mirror on the profile is the hint.
  const isSubjectSectionShown = useMemo(() => {
    if (profile.id === userId) {
      return true;
    }
    if (isSubjectsLoaded) return featuredSubjects.length > 0;
    return profile?.state?.profile?.subjects?.length > 0;
  }, [
    featuredSubjects.length,
    isSubjectsLoaded,
    profile.id,
    profile?.state?.profile?.subjects?.length,
    userId
  ]);

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Activities/index">
      {isSubjectSectionShown && (
        <FeaturedSubjects
          userId={id}
          username={username}
          items={featuredSubjects}
          selectedTheme={selectedTheme}
          loaded={isSubjectsLoaded}
        />
      )}
      <NotableActivities
        loading={isNotablesLoading}
        loadMoreButtonShown={isNotablesLoadMoreButtonShown}
        posts={notables}
        username={username}
        profile={profile}
        selectedTheme={selectedTheme}
      />
      <XPAnalysis userId={id} selectedTheme={selectedTheme} />
      <MissionProgress
        missionsLoaded={missionsLoaded}
        missions={missions || []}
        userId={id}
        username={username}
        selectedTheme={selectedTheme}
        selectedMissionListTab={selectedMissionListTab}
      />
    </ErrorBoundary>
  );
}
