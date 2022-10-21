import PropTypes from 'prop-types';
import FilterBar from '~/components/FilterBar';
import Attempts from './Attempts';

Main.propTypes = {
  mission: PropTypes.object.isRequired,
  missionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  missionType: PropTypes.string.isRequired,
  onSetMissionState: PropTypes.func.isRequired
};

export default function Main({
  mission,
  missionId,
  missionType,
  onSetMissionState
}) {
  const { managementTab: activeTab = 'pending' } = mission;

  return (
    <div style={{ width: '100%' }}>
      <FilterBar
        bordered
        style={{
          fontSize: '1.6rem',
          height: '5rem'
        }}
      >
        <nav
          className={activeTab === 'pending' ? 'active' : null}
          onClick={() => {
            onSetMissionState({
              missionId,
              newState: { managementTab: 'pending' }
            });
          }}
        >
          Pending
        </nav>
        <nav
          className={activeTab === 'pass' ? 'active' : null}
          onClick={() => {
            onSetMissionState({
              missionId,
              newState: { managementTab: 'pass' }
            });
          }}
        >
          Approved
        </nav>
        <nav
          className={activeTab === 'fail' ? 'active' : null}
          onClick={() =>
            onSetMissionState({
              missionId,
              newState: { managementTab: 'fail' }
            })
          }
        >
          Rejected
        </nav>
        {missionType === 'google' && (
          <nav
            className={activeTab === 'questions' ? 'active' : null}
            onClick={() =>
              onSetMissionState({
                missionId,
                newState: { managementTab: 'questions' }
              })
            }
          >
            Questions
          </nav>
        )}
      </FilterBar>
      {activeTab !== 'questions' && (
        <Attempts
          activeTab={activeTab}
          mission={mission}
          missionId={missionId}
          onSetMissionState={onSetMissionState}
        />
      )}
    </div>
  );
}
