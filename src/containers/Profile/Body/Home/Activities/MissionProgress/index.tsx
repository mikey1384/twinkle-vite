import React, { useEffect, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import FilterBar from '~/components/FilterBar';
import SectionPanel from '~/components/SectionPanel';
import EmptyStateMessage from '~/components/EmptyStateMessage';
import localize from '~/constants/localize';
import MissionItem from './MissionItem';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';

const missionProgressLabel = localize('missionProgress');
const completeLabel = localize('complete');
const incompleteLabel = localize('incomplete');

export default function MissionProgress({
  missionsLoaded,
  missions,
  selectedMissionListTab,
  selectedTheme,
  style,
  userId,
  username
}: {
  missionsLoaded: boolean;
  missions: any[];
  selectedMissionListTab: string;
  selectedTheme: string;
  style?: React.CSSProperties;
  userId: number;
  username: string;
}) {
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const loadMissionProgress = useAppContext(
    (v) => v.requestHelpers.loadMissionProgress
  );
  const allMissionsCompleteLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `${username}님은 모든 미션을 완료했습니다`;
    }
    return `${username} has completed all available missions`;
  }, [username]);
  const noMissionsCompleteLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `${username}님은 아직 어떤 미션도 완료하지 못했습니다`;
    }
    return `${username} has not completed any missions yet`;
  }, [username]);

  const completedMissions = useMemo(() => {
    return missions.filter((mission) => mission.status === 'pass');
  }, [missions]);

  const incompleteMissions = useMemo(() => {
    return missions.filter((mission) => mission.status !== 'pass');
  }, [missions]);

  const filteredMissions = useMemo(() => {
    return selectedMissionListTab === 'complete'
      ? completedMissions
      : incompleteMissions;
  }, [completedMissions, incompleteMissions, selectedMissionListTab]);

  useEffect(() => {
    if (userId) {
      handleLoadMissionProgress(userId);
    }

    async function handleLoadMissionProgress(userId: number) {
      const missions = await loadMissionProgress(userId);
      const passedMissions = [];
      for (const mission of missions) {
        if (mission.status === 'pass') {
          passedMissions.push(mission);
        }
      }
      if (!missionsLoaded) {
        onSetUserState({
          userId,
          newState: {
            selectedMissionListTab:
              passedMissions.length > 0 ? 'complete' : 'ongoing'
          }
        });
      }
      onSetUserState({
        userId,
        newState: {
          missions,
          missionsLoaded: true
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Achievements/MissionProgress/index">
      <SectionPanel
        elevated
        customColorTheme={selectedTheme}
        title={missionProgressLabel}
        loaded={missionsLoaded}
        style={style}
      >
        <FilterBar
          color={selectedTheme}
          bordered
          style={{ fontSize: '1.5rem', height: '5rem' }}
        >
          <nav
            className={selectedMissionListTab === 'complete' ? 'active' : ''}
            onClick={() =>
              onSetUserState({
                userId,
                newState: { selectedMissionListTab: 'complete' }
              })
            }
          >
            {`${completedMissions.length}/${missions.length}`} {completeLabel}
          </nav>
          <nav
            className={selectedMissionListTab === 'ongoing' ? 'active' : ''}
            onClick={() =>
              onSetUserState({
                userId,
                newState: { selectedMissionListTab: 'ongoing' }
              })
            }
          >
            {incompleteLabel}
          </nav>
        </FilterBar>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            padding: '2rem 0'
          }}
        >
          <div
            className={css`
              display: flex;
              height: auto;
              flex-wrap: wrap;
              justify-content: center;
              margin-bottom: ${missions.length > 0 ? '-1rem' : 0};
            `}
          >
            {filteredMissions.length > 0 ? (
              <>
                {filteredMissions.map((mission) => (
                  <MissionItem
                    key={mission.key}
                    style={{ marginRight: '1rem', marginBottom: '1rem' }}
                    completed={selectedMissionListTab === 'complete'}
                    taskProgress={mission.taskProgress}
                    missionName={mission.name}
                    missionType={mission.key}
                  />
                ))}
              </>
            ) : (
              <EmptyStateMessage
                theme={selectedTheme}
                style={{
                  width: '100%',
                  marginTop: '3rem'
                }}
              >
                {selectedMissionListTab === 'complete'
                  ? noMissionsCompleteLabel
                  : allMissionsCompleteLabel}
              </EmptyStateMessage>
            )}
          </div>
        </div>
      </SectionPanel>
    </ErrorBoundary>
  );
}
