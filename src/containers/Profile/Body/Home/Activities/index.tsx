import React from 'react';
import PropTypes from 'prop-types';
import XPAnalysis from './XPAnalysis';
import ErrorBoundary from '~/components/ErrorBoundary';
import NotableActivities from './NotableActivities';
import MissionProgress from './MissionProgress';
import FeaturedSubjects from './FeaturedSubjects';

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
  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Achievements/index">
      <FeaturedSubjects userId={id} username={username} />
      <NotableActivities
        userId={id}
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
