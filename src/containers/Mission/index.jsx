import React, { useEffect, useState } from 'react';
import Cover from './Cover';
import ErrorBoundary from '~/components/ErrorBoundary';
import Main from './Main';
import RightMenu from './RightMenu';
import Management from './Management';
import { useAppContext, useMissionContext, useKeyContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import FilterBar from '~/components/FilterBar';

export default function Mission() {
  const [loading, setLoading] = useState(false);
  const { currentMissionId, userId, isCreator } = useKeyContext(
    (v) => v.myState
  );
  const loadMissionList = useAppContext(
    (v) => v.requestHelpers.loadMissionList
  );
  const attemptObj = useMissionContext((v) => v.state.attemptObj);
  const managementObj = useMissionContext((v) => v.state.managementObj);
  const missions = useMissionContext((v) => v.state.missions);
  const missionObj = useMissionContext((v) => v.state.missionObj);
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const selectedManagementTab = useMissionContext(
    (v) => v.state.selectedManagementTab
  );
  const selectedMissionsTab = useMissionContext(
    (v) => v.state.selectedMissionsTab
  );
  const onLoadMissionList = useMissionContext(
    (v) => v.actions.onLoadMissionList
  );
  const onSetAttemptObj = useMissionContext((v) => v.actions.onSetAttemptObj);
  const onSetManagementObj = useMissionContext(
    (v) => v.actions.onSetManagementObj
  );
  const onSetSelectedManagementTab = useMissionContext(
    (v) => v.actions.onSetSelectedManagementTab
  );
  const onSetSelectedMissionsTab = useMissionContext(
    (v) => v.actions.onSetSelectedMissionsTab
  );

  useEffect(() => {
    init();

    async function init() {
      setLoading(true);
      const { missions, myAttempts, loadMoreButton } = await loadMissionList();
      let displayedMissions = missions;
      if (!isCreator) {
        displayedMissions = missions.filter((mission) => !mission.isHidden);
        onSetSelectedMissionsTab('missions');
      }
      setLoading(false);
      onLoadMissionList({
        missions: displayedMissions,
        myAttempts,
        loadMoreButton,
        prevUserId: userId
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isCreator]);

  return (
    <ErrorBoundary componentPath="Mission/index">
      <div style={{ width: '100%' }}>
        {userId && (
          <Cover
            missionIds={missions}
            missionObj={missionObj}
            myAttempts={myAttempts}
          />
        )}
        <div style={{ width: '100%', display: 'flex' }}>
          <div
            className={css`
              width: ${isCreator ? 'CALC(100% - 15rem)' : '100%'};
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
              }
            `}
          >
            {isCreator && (
              <FilterBar
                className="mobile"
                style={{
                  fontSize: '1.6rem',
                  height: '5rem'
                }}
              >
                <nav
                  className={selectedMissionsTab === 'missions' ? 'active' : ''}
                  onClick={() => onSetSelectedMissionsTab('missions')}
                >
                  Missions
                </nav>
                <nav
                  className={
                    selectedMissionsTab === 'management' ? 'active' : ''
                  }
                  onClick={() => onSetSelectedMissionsTab('management')}
                >
                  Manage
                </nav>
              </FilterBar>
            )}
            {selectedMissionsTab === 'missions' && (
              <Main
                className={css`
                  padding-top: 3rem;
                  padding-bottom: 3rem;
                  display: flex;
                  width: 100%;
                  @media (max-width: ${mobileMaxWidth}) {
                    padding-top: 0;
                    padding-bottom: 2rem;
                  }
                `}
                isCreator={isCreator}
                loading={loading}
                userId={userId}
                currentMissionId={currentMissionId}
                missions={missions}
                missionObj={missionObj}
                myAttempts={myAttempts}
              />
            )}
            {selectedMissionsTab === 'management' && (
              <Management
                attemptObj={attemptObj}
                managementObj={managementObj}
                onSetAttemptObj={onSetAttemptObj}
                onSetManagementObj={onSetManagementObj}
                selectedTab={selectedManagementTab}
                onSelectTab={onSetSelectedManagementTab}
              />
            )}
          </div>
          {isCreator && (
            <RightMenu
              className="desktop"
              style={{ marginTop: '3rem', width: '12rem', marginRight: '3rem' }}
              selectedTab={selectedMissionsTab}
              onSelectTab={onSetSelectedMissionsTab}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
