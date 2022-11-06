import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import GrammarQuestionGenerator from './GrammarQuestionGenerator';
import SideMenu from '~/components/SideMenu';
import Icon from '~/components/Icon';
import GrammarCategories from './GrammarCategories';
import FilterBar from '~/components/FilterBar';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

GrammarManager.propTypes = {
  mission: PropTypes.object.isRequired,
  onSetMissionState: PropTypes.func.isRequired
};

export default function GrammarManager({ mission, onSetMissionState }) {
  const { managementTab: activeTab = 'pending' } = mission;
  return (
    <ErrorBoundary componentPath="MissionPage/Management/GrammarManager">
      <div
        className={css`
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          position: relative;
        `}
      >
        <FilterBar
          bordered
          className="mobile"
          style={{
            height: '5rem'
          }}
        >
          <nav
            className={activeTab !== 'categories' ? 'active' : null}
            onClick={() =>
              onSetMissionState({
                missionId: mission.id,
                newState: { managementTab: 'pending' }
              })
            }
          >
            Questions
          </nav>
          <nav
            className={activeTab === 'categories' ? 'active' : null}
            onClick={() =>
              onSetMissionState({
                missionId: mission.id,
                newState: { managementTab: 'categories' }
              })
            }
          >
            Categories
          </nav>
        </FilterBar>
        <SideMenu
          className={css`
            left: 0;
            @media (max-width: ${mobileMaxWidth}) {
              display: none;
            }
          `}
        >
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
            <Icon icon="list" />
            <span style={{ marginLeft: '1.1rem' }}>Categories</span>
          </nav>
        </SideMenu>
        <div
          className={css`
            width: CALC(100% - 20rem);
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
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
