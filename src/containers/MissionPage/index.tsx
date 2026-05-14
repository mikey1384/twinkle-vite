import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Loading from '~/components/Loading';
import InvalidPage from '~/components/InvalidPage';
import GoBack from '~/components/GoBack';
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
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';
import { useScrollAnchorRestoration } from '~/helpers/hooks/useScrollAnchorRestoration';

const Main = lazyWithRetry(() => import('./Main'));
const RightMenu = lazyWithRetry(() => import('./RightMenu'));
const SystemPromptMenu = lazyWithRetry(() => import('./SystemPromptMenu'));
const SystemPromptShared = lazyWithRetry(() => import('./SystemPromptShared'));
const WorkshopPage = lazyWithRetry(() => import('./WorkshopPage'));
const Management = lazyWithRetry(() => import('./Management'));

export default function MissionPage() {
  const [loading, setLoading] = useState(false);
  const { missionType = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const missionPageRef = useRef<HTMLDivElement | null>(null);
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

  const isManagementPage =
    location.pathname === `/missions/${missionType}/manage`;
  const isWorkshopPage =
    location.pathname === `/missions/${missionType}/workshop`;
  const isSharedPage = location.pathname === `/missions/${missionType}/shared`;
  const isSystemPromptMission = missionType === 'system-prompt';
  const allowManage = isAdmin && !isSystemPromptMission;
  const hasSideMenu = isAdmin || isSystemPromptMission;
  const missionRouteSection = isManagementPage
    ? 'manage'
    : isWorkshopPage
    ? 'workshop'
    : isSharedPage
    ? 'shared'
    : 'mission';

  useScrollAnchorRestoration({
    anchorKey: `mission-page:${location.pathname}`,
    containerRef: missionPageRef,
    initialScroll: { type: 'top' },
    itemsReady: Boolean(userId && mission.loaded && !loading)
  });

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

  return userId ? (
    mission.loaded ? (
      <ErrorBoundary
        componentPath="MissionPage/index"
        style={{ width: '100%', paddingBottom: '10rem' }}
      >
        <div
          className={css`
            display: flex;
            justify-content: center;
            width: 100%;
            padding-right: ${hasSideMenu ? '23rem' : 0};
            @media (max-width: ${mobileMaxWidth}) {
              padding-right: 0;
            }
          `}
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1rem;
              width: ${hasSideMenu ? '85%' : '75%'};
              margin: 1rem 1.5rem 0 1.5rem;
              @media (max-width: ${tabletMaxWidth}) {
                width: 100%;
                margin: 1rem 1rem 0 1rem;
              }
              @media (max-width: ${mobileMaxWidth}) {
                margin: 0 0 1.5rem 0;
                width: 100%;
              }
            `}
          >
            <GoBack
              isAtTop
              bordered
              balancedPadding
              to="/missions"
              text="Missions"
            />
          </div>
        </div>
        <div
          className={css`
            display: flex;
            justify-content: center;
            width: 100%;
            padding-right: ${hasSideMenu ? '23rem' : 0};
            @media (max-width: ${mobileMaxWidth}) {
              padding-right: 0;
            }
          `}
        >
          <div
            ref={missionPageRef}
            data-scroll-anchor-id={`mission-page:${missionType}:${missionRouteSection}`}
            data-scroll-anchor-content-key={`mission:${missionType}:${missionRouteSection}`}
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1rem;
              width: ${hasSideMenu ? '70%' : '60%'};
              margin-left: ${hasSideMenu ? '1rem' : 0};
              @media (max-width: ${tabletMaxWidth}) {
                width: 100%;
                margin-left: 1rem;
              }
              @media (max-width: ${mobileMaxWidth}) {
                margin-left: 0;
                width: 100%;
              }
            `}
          >
            {(isAdmin || isSystemPromptMission) && (
              <FilterBar
                bordered
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
                    onClick={() =>
                      navigate(`/missions/${missionType}/workshop`)
                    }
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
          </div>
        </div>
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
            <Suspense fallback={<Loading />}>
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
                  <Route path="/shared" element={<SystemPromptShared />} />
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
            </Suspense>
          </div>
          {isSystemPromptMission ? (
            <Suspense fallback={null}>
              <SystemPromptMenu
                className="desktop"
                missionType={missionType}
                missionCleared={missionCleared}
              />
            </Suspense>
          ) : (
            isAdmin && (
              <Suspense fallback={null}>
                <RightMenu className="desktop" missionType={missionType} />
              </Suspense>
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
