import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import GrammarQuestionGenerator from './GrammarQuestionGenerator';
import SideMenu from '~/components/SideMenu';
import Icon from '~/components/Icon';
import GrammarCategories from './GrammarCategories';
import FilterBar from '~/components/FilterBar';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function GrammarManager({
  mission,
  onSetMissionState
}: {
  mission: any;
  onSetMissionState: (arg0: any) => void;
}) {
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
          className="mobile"
          style={{
            height: '5rem'
          }}
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
            Questions
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
            Categories
          </nav>
        </FilterBar>
        <SideMenu
          variant="card"
          placement="left"
          positionMode="fixed"
          topOffset="CALC(50vh - 8rem)"
          leftOffset="2rem"
        >
          <nav
            className={activeTab !== 'categories' ? 'active' : ''}
            onClick={() =>
              onSetMissionState({
                missionId: mission.id,
                newState: { managementTab: 'pending' }
              })
            }
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              textAlign: 'left',
              width: '100%'
            }}
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
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              textAlign: 'left',
              width: '100%'
            }}
          >
            <Icon icon="list" />
            <span style={{ marginLeft: '1.1rem' }}>Categories</span>
          </nav>
        </SideMenu>
        <div
          className={css`
            width: CALC(100% - 21rem);
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
