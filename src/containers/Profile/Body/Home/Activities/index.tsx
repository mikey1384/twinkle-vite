import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import XPAnalysis from './XPAnalysis';
import ErrorBoundary from '~/components/ErrorBoundary';
import NotableActivities from './NotableActivities';
import MissionProgress from './MissionProgress';
import FeaturedSubjects from './FeaturedSubjects';
import { useAppContext, useKeyContext, useProfileContext } from '~/contexts';
import { useProfileState } from '~/helpers/hooks';

Activities.propTypes = {
  profile: PropTypes.object.isRequired,
  selectedTheme: PropTypes.string
};

export default function Activities({
  profile,
  profile: { id, username, selectedMissionListTab, missions, missionsLoaded },
  selectedTheme
}: {
  profile: any;
  selectedTheme: string;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const [isNotablesLoading, setIsNotablesLoading] = useState(false);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const loadNotableContent = useAppContext(
    (v) => v.requestHelpers.loadNotableContent
  );
  const loadFeaturedSubjectsOnProfile = useAppContext(
    (v) => v.requestHelpers.loadFeaturedSubjectsOnProfile
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
        onLoadNotables({ username, feeds: results, loadMoreButton });
      } catch (error) {
        console.error(error);
      } finally {
        setIsNotablesLoading(false);
      }
    }
    async function initSubjects() {
      setIsSubjectsLoading(true);
      try {
        const subjects = await loadFeaturedSubjectsOnProfile(id);
        onLoadFeaturedSubjects({ username, subjects });
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubjectsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNotablesLoaded, isSubjectsLoaded, username]);

  const isSubjectSectionShown = useMemo(() => {
    if (profile.id === userId) {
      return true;
    }
    return profile?.state?.profile?.subjects?.length > 0;
  }, [profile.id, profile?.state?.profile?.subjects?.length, userId]);

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Achievements/index">
      {isSubjectSectionShown && (
        <FeaturedSubjects
          userId={id}
          username={username}
          subjects={featuredSubjects}
          selectedTheme={selectedTheme}
          loading={isSubjectsLoading}
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
