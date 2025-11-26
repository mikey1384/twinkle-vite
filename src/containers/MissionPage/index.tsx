import React, { useEffect, useMemo, useState } from 'react';
import Loading from '~/components/Loading';
import Main from './Main';
import RightMenu from './RightMenu';
import SystemPromptMenu from './SystemPromptMenu';
import SystemPromptShared from './SystemPromptShared';
import WorkshopPage from './WorkshopPage';
import InvalidPage from '~/components/InvalidPage';
import Management from './Management';
import FilterBar from '~/components/FilterBar';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams
} from 'react-router-dom';
import { useAppContext, useMissionContext, useKeyContext } from '~/contexts';

export default function MissionPage() {
  const [loading, setLoading] = useState(false);
  const { missionType = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useKeyContext((v) => v.myState.userId);
  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
  const loadMission = useAppContext((v) => v.requestHelpers.loadMission);
  const loadMissionTypeIdHash = useAppContext(
    (v) => v.requestHelpers.loadMissionTypeIdHash
  );
  const updateCurrentMission = useAppContext(
    (v) => v.requestHelpers.updateCurrentMission
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onLoadMission = useMissionContext((v) => v.actions.onLoadMission);
  const onLoadMissionTypeIdHash = useMissionContext(
    (v) => v.actions.onLoadMissionTypeIdHash
  );
  const onSetMissionState = useMissionContext(
    (v) => v.actions.onSetMissionState
  );
  const onSetMyMissionAttempts = useMissionContext(
    (v) => v.actions.onSetMyMissionAttempts
  );
  const missionObj = useMissionContext((v) => v.state.missionObj);
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const prevUserId = useMissionContext((v) => v.state.prevUserId);
  const missionTypeIdHash = useMissionContext((v) => v.state.missionTypeIdHash);

  const missionId = useMemo(() => {
    return missionTypeIdHash?.[missionType];
  }, [missionTypeIdHash, missionType]);

  useEffect(() => {
    if (missionId && userId) {
      handleUpdateCurrentMission();
    }

    async function handleUpdateCurrentMission() {
      await updateCurrentMission(missionId);
      onSetUserState({ userId, newState: { currentMissionId: missionId } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId, userId]);

  const mission = useMemo(
    () => missionObj[missionId] || {},
    [missionId, missionObj]
  );

  const missionCleared = useMemo(
    () => myAttempts?.[missionId]?.status === 'pass',
    [myAttempts, missionId]
  );

  useEffect(() => {
    if (!missionId) {
      getMissionId();
    } else if (!mission.loaded || (userId && prevUserId !== userId)) {
      init();
    }

    async function getMissionId() {
      const data = await loadMissionTypeIdHash();
      onLoadMissionTypeIdHash(data);
    }

    async function init() {
      setLoading(true);
      try {
        if (userId) {
          const { page, myAttempts } = await loadMission({ missionId });
          onLoadMission({ mission: page, prevUserId: userId });
          onSetMyMissionAttempts(myAttempts);
        } else if (missionId) {
          onLoadMission({
            mission: { id: missionId },
            prevUserId: userId
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, prevUserId, missionId, mission.loaded]);

  if (loading) {
    return <Loading />;
  }

  if (
    mission.notFound ||
    (userId &&
      missionType &&
      missionTypeIdHash &&
      !missionTypeIdHash[missionType])
  ) {
    return <InvalidPage />;
  }

  const isManagementPage =
    location.pathname === `/missions/${missionType}/manage`;
  const isWorkshopPage =
    location.pathname === `/missions/${missionType}/workshop`;
  const isSharedPage = location.pathname === `/missions/${missionType}/shared`;
  const isSystemPromptMission = missionType === 'system-prompt';
  const allowManage = isAdmin && !isSystemPromptMission;
  const hasSideMenu = isAdmin || isSystemPromptMission;

  return userId ? (
    mission.loaded ? (
      <ErrorBoundary
        componentPath="MissionPage/index"
        style={{ width: '100%', paddingBottom: '10rem' }}
      >
        {(isAdmin || isSystemPromptMission) && (
          <FilterBar
            className="mobile"
            style={{
              fontSize: '1.6rem',
              height: '5rem'
            }}
          >
            <nav
              className={
                !isManagementPage && !isSharedPage && !isWorkshopPage
                  ? 'active'
                  : ''
              }
              onClick={() => navigate(`/missions/${missionType}`)}
            >
              Mission
            </nav>
            {isSystemPromptMission && missionCleared && (
              <nav
                className={isWorkshopPage ? 'active' : ''}
                onClick={() => navigate(`/missions/${missionType}/workshop`)}
              >
                Workshop
              </nav>
            )}
            {isSystemPromptMission && (
              <nav
                className={isSharedPage ? 'active' : ''}
                onClick={() => navigate(`/missions/${missionType}/shared`)}
              >
                Shared Prompts
              </nav>
            )}
            {allowManage && (
              <nav
                className={isManagementPage ? 'active' : ''}
                onClick={() => navigate(`/missions/${missionType}/manage`)}
              >
                Manage
              </nav>
            )}
          </FilterBar>
        )}
        <div
          className={css`
            padding-top: 1rem;
            padding-right: ${hasSideMenu ? '23rem' : 0};
            @media (max-width: ${mobileMaxWidth}) {
              padding-top: ${hasSideMenu ? '0.5rem' : 0};
              padding-right: 0;
            }
          `}
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%'
          }}
        >
          <div
            className={css`
              display: flex;
              width: ${hasSideMenu ? '70%' : '60%'};
              margin-left: ${hasSideMenu ? '1rem' : 0};
              flex-grow: ${hasSideMenu ? 1 : 0};
              justify-content: center;
              flex-direction: column;
              @media (max-width: ${tabletMaxWidth}) {
                flex-grow: 1;
                margin-left: 1rem;
              }
              @media (max-width: ${mobileMaxWidth}) {
                margin-left: 0;
                width: 100%;
              }
            `}
          >
            <Routes>
              {allowManage && (
                <Route
                  path={`/manage`}
                  element={
                    <Management
                      missionId={missionId}
                      mission={mission}
                      onSetMissionState={onSetMissionState}
                    />
                  }
                />
              )}
              {isSystemPromptMission && missionCleared && (
                <Route
                  path="/workshop"
                  element={
                    <WorkshopPage
                      mission={mission}
                      onSetMissionState={onSetMissionState}
                    />
                  }
                />
              )}
              {isSystemPromptMission && (
                <Route
                  path="/shared"
                  element={
                    <SystemPromptShared missionCleared={missionCleared} />
                  }
                />
              )}
              <Route
                path="*"
                element={
                  <Main
                    onSetMissionState={onSetMissionState}
                    mission={mission}
                  />
                }
              />
            </Routes>
          </div>
          {isSystemPromptMission ? (
            <SystemPromptMenu
              className="desktop"
              missionType={missionType}
              missionCleared={missionCleared}
            />
          ) : (
            isAdmin && (
              <RightMenu className="desktop" missionType={missionType} />
            )
          )}
        </div>
      </ErrorBoundary>
    ) : (
      <Loading />
    )
  ) : (
    <InvalidPage
      title="For Registered Users Only"
      text="Please Log In or Sign Up"
    />
  );
}
