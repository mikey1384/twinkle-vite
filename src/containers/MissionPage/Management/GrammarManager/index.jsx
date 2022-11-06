import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import GrammarQuestionGenerator from './GrammarQuestionGenerator';
import SideMenu from '~/components/SideMenu';
import Icon from '~/components/Icon';
import GrammarCategories from './GrammarCategories';

GrammarManager.propTypes = {
  mission: PropTypes.object.isRequired,
  onSetMissionState: PropTypes.func.isRequired
};

export default function GrammarManager({ mission, onSetMissionState }) {
  const { managementTab: activeTab = 'pending' } = mission;
  return (
    <ErrorBoundary componentPath="MissionPage/Management/GrammarManager">
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          position: 'relative'
        }}
      >
        <SideMenu style={{ left: 0 }}>
          <nav
            className={activeTab !== 'categories' ? 'active' : ''}
            onClick={() =>
              onSetMissionState({
                missionId: mission.id,
                newState: { managementTab: 'pending' }
              })
            }
          >
            <Icon icon="bolt" />
            <span style={{ marginLeft: '1.1rem' }}>Questions</span>
          </nav>
          <nav
            className={activeTab === 'categories' ? 'active' : ''}
            onClick={() =>
              onSetMissionState({
                missionId: mission.id,
                newState: { managementTab: 'categories' }
              })
            }
          >
            <Icon icon="film" />
            <span style={{ marginLeft: '1.1rem' }}>Categories</span>
          </nav>
        </SideMenu>
        <div style={{ width: 'CALC(100% - 20rem)' }}>
          {activeTab !== 'categories' ? (
            <GrammarQuestionGenerator
              style={{ width: '100%' }}
              mission={mission}
              onSetMissionState={onSetMissionState}
            />
          ) : (
            <GrammarCategories style={{ width: '100%' }} />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
