import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext, useMissionContext } from '~/contexts';
import Button from '~/components/Button';
import MissionStatusCard from '~/components/MissionStatusCard';
import TaskComplete from '../components/TaskComplete';
import Checklist from '../SystemPrompt/Checklist';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';

const layoutClass = css`
  display: grid;
  grid-template-columns: minmax(26rem, 30rem) 1fr;
  gap: 1.5rem;
  align-items: flex-start;
  width: 100%;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
`;

const sidebarClass = css`
  position: sticky;
  top: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    position: static;
  }
`;

const contentClass = css`
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  width: 100%;
`;

const heroCardClass = css`
  position: relative;
  padding: 2.2rem;
  border-radius: 22px;
  background: ${Color.white()};
  border: 1px solid ${Color.logoBlue(0.25)};
  box-shadow: 0 22px 48px -40px rgba(30, 110, 183, 0.55);
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.8rem;
  }
`;

const heroContentClass = css`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  z-index: 1;
`;

const badgeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: ${Color.logoBlue(0.18)};
  color: ${Color.darkOceanBlue()};
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const titleClass = css`
  font-size: 2.4rem;
  font-weight: 800;
  color: ${Color.darkBlue()};
  margin: 0;
  line-height: 1.15;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2rem;
  }
`;

const subtitleClass = css`
  font-size: 1.3rem;
  color: ${Color.darkGray()};
  margin: 0;
  max-width: 34rem;
  line-height: 1.6;
`;

const buttonRowClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

export default function BuildMission({
  mission,
  style
}: {
  mission: any;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const loadMyBuilds = useAppContext((v) => v.requestHelpers.loadMyBuilds);
  const userId = useKeyContext((v) => v.myState.userId);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const myAttempt = myAttempts?.[mission.id];

  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    void loadBuilds();

    async function loadBuilds() {
      try {
        const data = await loadMyBuilds();
        setBuilds(data?.builds || []);
      } catch (err) {
        console.error('Failed to load builds:', err);
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const buildMissionProgress = mission.buildMissionProgress || {};
  const requirements = buildMissionProgress.requirements || {};
  const isMissionPassed = myAttempt?.status === 'pass';
  const buildCount = Number(buildMissionProgress.buildCount || 0);
  const successfulGenerationCount = Number(
    buildMissionProgress.successfulGenerationCount || 0
  );
  const publishedBuildCount = Number(buildMissionProgress.publishedBuildCount || 0);
  const requiredBuildCount = Number(requirements.buildCount || 1);
  const requiredGenerationCount = Number(
    requirements.successfulGenerationCount || 10
  );
  const requiredPublishedBuildCount = Number(
    requirements.publishedBuildCount || 1
  );

  const step1Complete = isMissionPassed || buildCount >= requiredBuildCount;
  const step2Complete =
    isMissionPassed ||
    successfulGenerationCount >= requiredGenerationCount;
  const step3Complete =
    isMissionPassed || publishedBuildCount >= requiredPublishedBuildCount;

  const checklistItems = [
    {
      label: 'Create a build',
      complete: step1Complete,
      detail: step1Complete
        ? `${buildCount}/${requiredBuildCount} build${requiredBuildCount !== 1 ? 's' : ''} created`
        : 'Start your first project in Lumine'
    },
    {
      label: `Generate code ${requiredGenerationCount} times`,
      complete: step2Complete,
      detail: step2Complete
        ? `${successfulGenerationCount}/${requiredGenerationCount} successful generations completed`
        : `Use Lumine to generate ${requiredGenerationCount} real versions of your app`
    },
    {
      label: 'Publish one build',
      complete: step3Complete,
      detail: step3Complete
        ? `${publishedBuildCount}/${requiredPublishedBuildCount} build published`
        : 'Publish one of your builds so other people can use it'
    }
  ];

  const missionCleared = step1Complete && step2Complete && step3Complete;
  const currentStep = !step1Complete
    ? 1
    : !step2Complete
      ? 2
      : !step3Complete
        ? 3
        : 0;
  const latestBuild = builds[0];
  const latestGeneratedBuild =
    builds.find((build) => build.hasCode) || latestBuild;
  const latestPublishableBuild =
    builds.find((build) => build.hasCode && !build.isPublic) ||
    latestGeneratedBuild;

  return (
    <ErrorBoundary componentPath="MissionModule/Build">
      <div className={layoutClass} style={style}>
        <Checklist
          checklistItems={checklistItems}
          missionCleared={missionCleared}
          progressLoading={loading}
          progressError=""
          themeColor={profileTheme || 'logoBlue'}
          className={sidebarClass}
        />
        <div className={contentClass}>
          <section className={heroCardClass}>
            <div className={heroContentClass}>
              <span className={badgeClass}>
                <Icon icon="sparkles" />
                Build Mission
              </span>
              {currentStep === 1 && (
                <>
                  <h2 className={titleClass}>Build an app with Lumine</h2>
                  <p className={subtitleClass}>
                    Create a project, describe what you want, and let Lumine
                    generate the first working version of your app.
                  </p>
                  <div className={buttonRowClass}>
                    <Button
                      color="green"
                      variant="solid"
                      onClick={() => navigate('/build/new')}
                    >
                      Start a Build
                    </Button>
                    <Button
                      color="logoBlue"
                      variant="soft"
                      onClick={() => navigate('/build')}
                    >
                      Open Lumine
                    </Button>
                  </div>
                </>
              )}
              {currentStep === 2 && latestBuild && (
                <>
                  <h2 className={titleClass}>Generate a few real versions</h2>
                  <p className={subtitleClass}>
                    Keep using Lumine until you have at least{' '}
                    {requiredGenerationCount} successful code generations.
                    You are at {successfulGenerationCount}/
                    {requiredGenerationCount} right now.
                  </p>
                  <div className={buttonRowClass}>
                    <Button
                      color="green"
                      variant="solid"
                      onClick={() => navigate(`/build/${latestBuild.id}`)}
                    >
                      Continue Building
                    </Button>
                    <Button
                      color="logoBlue"
                      variant="soft"
                      onClick={() => navigate('/build')}
                    >
                      View All Builds
                    </Button>
                  </div>
                </>
              )}
              {currentStep === 3 && latestPublishableBuild && (
                <>
                  <h2 className={titleClass}>Publish one build</h2>
                  <p className={subtitleClass}>
                    Publish a build so other Twinkle users and people outside
                    the website can actually use it. You are at{' '}
                    {publishedBuildCount}/{requiredPublishedBuildCount}{' '}
                    published builds.
                  </p>
                  <div className={buttonRowClass}>
                    <Button
                      color="green"
                      variant="solid"
                      onClick={() => navigate(`/build/${latestPublishableBuild.id}`)}
                    >
                      Open Build To Publish
                    </Button>
                    <Button
                      color="logoBlue"
                      variant="soft"
                      onClick={() => navigate('/build')}
                    >
                      View All Builds
                    </Button>
                  </div>
                </>
              )}
              {currentStep === 0 && (
                <>
                  <h2 className={titleClass}>Mission Complete!</h2>
                  <p className={subtitleClass}>
                    You created a build, generated code multiple times, and
                    published it for others to use.
                  </p>
                  <div className={buttonRowClass}>
                    <Button
                      color="green"
                      variant="solid"
                      onClick={() => navigate('/build/new')}
                    >
                      Start Another Build
                    </Button>
                    <Button
                      color="logoBlue"
                      variant="soft"
                      onClick={() => navigate('/build')}
                    >
                      View All Builds
                    </Button>
                  </div>
                </>
              )}
            </div>
          </section>
          <div
            className={css`
              width: 100%;
            `}
          >
            {isMissionPassed ? (
              <div
                className={css`
                  display: flex;
                  justify-content: center;
                  width: 100%;
                `}
              >
                <MissionStatusCard
                  status="success"
                  title="Mission Accomplished"
                  message="You created, iterated on, reviewed, and published your first Lumine build."
                  rewards={{
                    xp: mission.xpReward,
                    coins: mission.coinReward
                  }}
                />
              </div>
            ) : (
              <TaskComplete taskId={mission.id} allTasksComplete={missionCleared} />
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
