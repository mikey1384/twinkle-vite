import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext, useMissionContext } from '~/contexts';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import MissionStatusCard from '~/components/MissionStatusCard';
import TaskComplete from '../components/TaskComplete';
import Checklist from '../SystemPrompt/Checklist';
import ErrorBoundary from '~/components/ErrorBoundary';

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
  background: linear-gradient(
    135deg,
    ${Color.logoBlue(0.12)} 0%,
    ${Color.oceanGreen(0.16)} 45%,
    ${Color.lightOceanBlue(0.18)} 100%
  );
  border: 1px solid ${Color.logoBlue(0.25)};
  overflow: hidden;
  box-shadow: 0 22px 48px -40px rgba(30, 110, 183, 0.55);
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.8rem;
  }
  &::before {
    content: '';
    position: absolute;
    top: -60%;
    right: -20%;
    width: 320px;
    height: 320px;
    background: radial-gradient(
      circle,
      ${Color.logoBlue(0.25)} 0%,
      transparent 70%
    );
    opacity: 0.7;
  }
  &::after {
    content: '';
    position: absolute;
    bottom: -50%;
    left: -10%;
    width: 280px;
    height: 280px;
    background: radial-gradient(
      circle,
      ${Color.oceanGreen(0.2)} 0%,
      transparent 72%
    );
    opacity: 0.7;
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

const gridClass = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const featureCardClass = css`
  background: ${Color.white()};
  border-radius: ${borderRadius};
  border: 1px solid ${Color.borderGray()};
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  box-shadow: 0 12px 28px -22px rgba(15, 23, 42, 0.25);
`;

const featureIconClass = css`
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${Color.logoBlue(0.12)};
  color: ${Color.logoBlue()};
  font-size: 1.4rem;
`;

const featureTitleClass = css`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: ${Color.black()};
`;

const featureBodyClass = css`
  margin: 0;
  font-size: 1.05rem;
  color: ${Color.darkGray()};
  line-height: 1.5;
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
  const missions = useKeyContext((v) => v.myState.missions);
  const userId = useKeyContext((v) => v.myState.userId);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const myAttempt = myAttempts?.[mission.id];

  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadBuilds();
    } else {
      setLoading(false);
    }

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

  const missionState = missions?.build || {};
  const promptListUsed = Boolean(missionState.promptListUsed);
  const aiChatUsed = Boolean(missionState.aiChatUsed);
  const dbUsed = Boolean(missionState.dbUsed);
  const sdkFeatureUsed = promptListUsed || aiChatUsed || dbUsed;

  const isMissionPassed = myAttempt?.status === 'pass';

  // Step 1: User has created at least one build
  const hasBuild = builds.length > 0;
  const step1Complete = isMissionPassed || hasBuild;

  // Step 2: User has generated code (any build has code)
  const hasCodeGenerated = builds.some((b) => b.hasCode);
  const step2Complete = isMissionPassed || hasCodeGenerated;

  // Step 3: User has used a Twinkle SDK feature (AI prompts or database)
  const step3Complete = isMissionPassed || sdkFeatureUsed;

  const checklistItems = [
    {
      label: 'Create a build',
      complete: step1Complete,
      detail: step1Complete
        ? `You have ${builds.length} build${builds.length !== 1 ? 's' : ''}`
        : 'Start your first project in the Build Studio'
    },
    {
      label: 'Generate code with AI',
      complete: step2Complete,
      detail: step2Complete
        ? 'Code generated and previewed'
        : 'Describe what you want and let the AI create it'
    },
    {
      label: 'Use a Twinkle SDK feature',
      complete: step3Complete,
      detail: step3Complete
        ? `Used: ${[aiChatUsed && 'AI Chat', promptListUsed && !aiChatUsed && 'AI Prompts', dbUsed && 'Database'].filter(Boolean).join(', ') || 'SDK feature'}`
        : 'Add database persistence or shared AI prompts to your app'
    }
  ];

  const missionCleared = checklistItems.every((item) => item.complete);

  // Determine current step for contextual hero content
  const currentStep = !step1Complete ? 1 : !step2Complete ? 2 : !step3Complete ? 3 : 0;
  const latestBuild = builds[0];

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
                  <h2 className={titleClass}>Build an app with AI assistance</h2>
                  <p className={subtitleClass}>
                    Create a project in the Build Studio, describe what you want, and
                    watch AI generate your app. Then level up by integrating Twinkle
                    SDK features like shared AI prompts or SQLite persistence.
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
                      Open Build Studio
                    </Button>
                  </div>
                </>
              )}
              {currentStep === 2 && latestBuild && (
                <>
                  <h2 className={titleClass}>Generate code with AI</h2>
                  <p className={subtitleClass}>
                    Open your build "{latestBuild.title}" and describe what you want
                    to create. The AI will generate the code for you.
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
              {currentStep === 3 && latestBuild && (
                <>
                  <h2 className={titleClass}>Add a Twinkle SDK feature</h2>
                  <p className={subtitleClass}>
                    Level up your app by adding AI prompts or SQLite persistence.
                    Ask the AI to help you integrate these features.
                  </p>
                  <div className={buttonRowClass}>
                    <Button
                      color="green"
                      variant="solid"
                      onClick={() => navigate(`/build/${latestBuild.id}`)}
                    >
                      Add SDK Features
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
                    You've built an app with AI assistance and integrated Twinkle SDK
                    features. Keep building and exploring new ideas!
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

          <section className={gridClass}>
            <div className={featureCardClass}>
              <div className={featureIconClass}>
                <Icon icon="brain" />
              </div>
              <h3 className={featureTitleClass}>Shared AI prompts</h3>
              <p className={featureBodyClass}>
                Pull a shared prompt and make your app respond to user input
                with Twinkle AI.
              </p>
            </div>
            <div className={featureCardClass}>
              <div
                className={featureIconClass}
                style={{ background: Color.oceanGreen(0.12), color: Color.oceanGreen() }}
              >
                <Icon icon="save" />
              </div>
              <h3 className={featureTitleClass}>SQLite persistence</h3>
              <p className={featureBodyClass}>
                Save project data with Twinkle.db so your app remembers progress
                across sessions.
              </p>
            </div>
            <div className={featureCardClass}>
              <div
                className={featureIconClass}
                style={{
                  background: Color.brownOrange(0.16),
                  color: Color.darkBrownOrange()
                }}
              >
                <Icon icon="rocket-launch" />
              </div>
              <h3 className={featureTitleClass}>Showcase a full workflow</h3>
              <p className={featureBodyClass}>
                Combine AI, data, and UI into a single experience and make it
                feel polished.
              </p>
            </div>
          </section>

          {isMissionPassed && (
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
                message="You shipped a build that blends AI and data together."
                rewards={{
                  xp: mission.xpReward,
                  coins: mission.coinReward
                }}
              />
            </div>
          )}
          <TaskComplete
            taskId={mission.id}
            allTasksComplete={missionCleared}
            style={{ marginTop: '0.5rem' }}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
