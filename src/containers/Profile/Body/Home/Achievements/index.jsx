import PropTypes from 'prop-types';
import XPAnalysis from './XPAnalysis';
import ErrorBoundary from '~/components/ErrorBoundary';
import NotableActivities from './NotableActivities';
import MissionProgress from './MissionProgress';

Achievements.propTypes = {
  profile: PropTypes.object.isRequired,
  selectedTheme: PropTypes.string
};

export default function Achievements({
  profile,
  profile: { id, username, selectedMissionListTab, missions, missionsLoaded },
  selectedTheme
}) {
  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Achievements/index">
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
