import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext, useMissionContext } from '~/contexts';
import Button from '~/components/Button';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
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

type BuildByoProvider = 'openai' | 'anthropic' | 'google';

const BYO_PROVIDER_ORDER: BuildByoProvider[] = ['openai', 'anthropic', 'google'];
const BYO_TEXT_SCALE = 1.35;
const byoRem = (base: number) => `${(base * BYO_TEXT_SCALE).toFixed(2)}rem`;

const BYO_PROVIDER_META: Record<
  BuildByoProvider,
  {
    label: string;
    icon: string;
    accent: string;
  }
> = {
  openai: {
    label: 'OpenAI',
    icon: 'sparkles',
    accent: Color.logoBlue()
  },
  anthropic: {
    label: 'Anthropic',
    icon: 'brain',
    accent: Color.brownOrange()
  },
  google: {
    label: 'Google',
    icon: 'rocket-launch',
    accent: Color.oceanGreen()
  }
};

interface BuildByoSettingsState {
  byo: {
    enabled: boolean;
    requiredForPaidTiers: boolean;
    blockedAssignedTier: boolean;
    source?: 'override' | 'env';
  };
  providerKeys: {
    openai: boolean;
    anthropic: boolean;
    google: boolean;
  };
  verification?: {
    providers: Record<
      BuildByoProvider,
      {
        keyConfigured: boolean;
        verified: boolean;
        lastVerifiedAt: number | null;
        lastTestedAt: number | null;
        lastErrorCode: string | null;
        lastErrorMessage: string | null;
        karmaAwarded: number;
        rewardKarma: number;
      }
    >;
    verifiedProviderCount: number;
    totalKarmaAwarded: number;
    rewardKarmaPerProvider: number;
    maxRewardKarma: number;
  };
}

export default function BuildMission({
  mission,
  style
}: {
  mission: any;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const loadMyBuilds = useAppContext((v) => v.requestHelpers.loadMyBuilds);
  const loadBuildByoSettings = useAppContext(
    (v) => v.requestHelpers.loadBuildByoSettings
  );
  const updateBuildByoEnabled = useAppContext(
    (v) => v.requestHelpers.updateBuildByoEnabled
  );
  const updateBuildByoProviderKey = useAppContext(
    (v) => v.requestHelpers.updateBuildByoProviderKey
  );
  const clearBuildByoProviderKey = useAppContext(
    (v) => v.requestHelpers.clearBuildByoProviderKey
  );
  const verifyBuildByoProvider = useAppContext(
    (v) => v.requestHelpers.verifyBuildByoProvider
  );
  const missions = useKeyContext((v) => v.myState.missions);
  const userId = useKeyContext((v) => v.myState.userId);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const myAttempt = myAttempts?.[mission.id];

  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [byoSettings, setByoSettings] = useState<BuildByoSettingsState | null>(
    null
  );
  const [byoLoading, setByoLoading] = useState(true);
  const [byoSaving, setByoSaving] = useState(false);
  const [byoError, setByoError] = useState('');
  const [byoActionMessage, setByoActionMessage] = useState('');
  const [providerInputs, setProviderInputs] = useState<{
    openai: string;
    anthropic: string;
    google: string;
  }>({
    openai: '',
    anthropic: '',
    google: ''
  });
  const [selectedProvider, setSelectedProvider] =
    useState<BuildByoProvider>('openai');

  useEffect(() => {
    if (userId) {
      loadBuilds();
      loadByo();
    } else {
      setLoading(false);
      setByoLoading(false);
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

    async function loadByo() {
      try {
        const data = await loadBuildByoSettings();
        setByoSettings(data || null);
        setByoError('');
      } catch (err: any) {
        console.error('Failed to load build BYO settings:', err);
        setByoError(err?.message || 'Failed to load BYO settings');
      }
      setByoLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const missionState = missions?.build || {};
  const copilotPromptCompleted = Boolean(missionState.copilotPromptCompleted);
  const byoEnabled = Boolean(byoSettings?.byo?.enabled);
  const byoVerifiedProviderCount = Math.max(
    0,
    Number(byoSettings?.verification?.verifiedProviderCount || 0)
  );

  const isMissionPassed = myAttempt?.status === 'pass';

  // Step 1: User has created at least one build
  const hasBuild = builds.length > 0;
  const step1Complete = isMissionPassed || hasBuild;

  // Step 2: User has completed at least one successful Copilot generation.
  // Keep hasCode fallback for users who generated before this flag existed.
  const hasCodeGenerated = builds.some((b) => b.hasCode);
  const step2Complete =
    isMissionPassed || copilotPromptCompleted || hasCodeGenerated;

  const checklistItems = [
    {
      label: 'Create a build',
      complete: step1Complete,
      detail: step1Complete
        ? `You have ${builds.length} build${builds.length !== 1 ? 's' : ''}`
        : 'Start your first project in the Build Studio'
    },
    {
      label: 'Send one working Copilot prompt',
      complete: step2Complete,
      detail: step2Complete
        ? 'Copilot generated a working app response'
        : 'Try a prompt like "Build a Mario-style platformer game"'
    }
  ];

  const missionCleared = step1Complete && step2Complete;

  // Determine current step for contextual hero content
  const currentStep = !step1Complete ? 1 : !step2Complete ? 2 : 0;
  const latestBuild = builds[0];
  const totalByoKpEarned = Math.max(
    0,
    Number(byoSettings?.verification?.totalKarmaAwarded || 0)
  );
  const maxByoKp = Math.max(
    0,
    Number(byoSettings?.verification?.maxRewardKarma || 6000)
  );
  const nextProviderObjective = BYO_PROVIDER_ORDER.find((provider) => {
    const providerVerification = byoSettings?.verification?.providers?.[provider];
    return !Boolean(providerVerification?.verified);
  });
  const selectedProviderMeta = BYO_PROVIDER_META[selectedProvider];
  const selectedProviderVerification =
    byoSettings?.verification?.providers?.[selectedProvider];
  const selectedProviderConfigured = Boolean(
    byoSettings?.providerKeys?.[selectedProvider]
  );
  const selectedProviderVerified = Boolean(selectedProviderVerification?.verified);
  const selectedProviderKp = Math.max(
    0,
    Number(selectedProviderVerification?.karmaAwarded || 0)
  );
  const selectedProviderStep = !selectedProviderConfigured
    ? 1
    : !selectedProviderVerified
      ? 2
      : 3;

  async function handleToggleByo() {
    if (!byoSettings || byoSaving) return;
    setByoSaving(true);
    try {
      const data = await updateBuildByoEnabled({
        enabled: !byoSettings.byo.enabled
      });
      setByoSettings(data || null);
      setByoError('');
      setByoActionMessage(
        !byoSettings.byo.enabled ? 'BYO mode enabled.' : 'BYO mode disabled.'
      );
    } catch (error: any) {
      setByoError(error?.message || 'Failed to update BYO mode');
    }
    setByoSaving(false);
  }

  async function handleSaveProviderKey(provider: BuildByoProvider) {
    const apiKey = providerInputs[provider].trim();
    if (!apiKey || byoSaving) return;
    setByoSaving(true);
    try {
      const data = await updateBuildByoProviderKey({
        provider,
        apiKey
      });
      setByoSettings((prev) =>
        prev
          ? {
              ...prev,
              providerKeys: data?.providerKeys || prev.providerKeys
            }
          : prev
      );
      setProviderInputs((prev) => ({ ...prev, [provider]: '' }));
      setByoError('');
      setByoActionMessage(`${provider.toUpperCase()} key saved.`);
    } catch (error: any) {
      setByoError(error?.message || `Failed to save ${provider} key`);
    }
    setByoSaving(false);
  }

  async function handleClearProviderKey(provider: BuildByoProvider) {
    if (byoSaving) return;
    setByoSaving(true);
    try {
      const data = await clearBuildByoProviderKey(provider);
      setByoSettings((prev) =>
        prev
          ? {
              ...prev,
              providerKeys: data?.providerKeys || prev.providerKeys
            }
          : prev
      );
      setByoError('');
      setByoActionMessage(`${provider.toUpperCase()} key cleared.`);
    } catch (error: any) {
      setByoError(error?.message || `Failed to clear ${provider} key`);
    }
    setByoSaving(false);
  }

  async function handleVerifyProvider(provider: BuildByoProvider) {
    if (byoSaving) return;
    setByoSaving(true);
    try {
      const data = await verifyBuildByoProvider(provider);
      setByoSettings(data || null);
      const awardedKarma = Math.max(0, Number(data?.awardedKarma || 0));
      setByoError('');
      setByoActionMessage(
        awardedKarma > 0
          ? `${provider.toUpperCase()} verified. +${awardedKarma.toLocaleString()} KP awarded.`
          : `${provider.toUpperCase()} verified.`
      );
    } catch (error: any) {
      setByoError(error?.message || `Failed to verify ${provider} provider`);
    }
    setByoSaving(false);
  }

  async function handleEnableByoWithVerification(provider: BuildByoProvider) {
    if (!byoSettings || byoSaving) return;
    const keyConfigured = Boolean(byoSettings.providerKeys?.[provider]);
    if (!keyConfigured) {
      setByoError(`Save ${provider.toUpperCase()} key first.`);
      return;
    }
    setByoSaving(true);
    try {
      const verified = await verifyBuildByoProvider(provider);
      let nextSettings = verified || null;
      if (!verified?.byo?.enabled) {
        const toggled = await updateBuildByoEnabled({ enabled: true });
        nextSettings = toggled || verified || null;
      }
      setByoSettings(nextSettings);
      setByoError('');
      setByoActionMessage(`${provider.toUpperCase()} verified. BYO mode enabled.`);
    } catch (error: any) {
      setByoError(error?.message || 'Failed to enable BYO mode');
    }
    setByoSaving(false);
  }

  async function handleByoSwitchChange() {
    if (byoSaving) return;
    if (byoEnabled) {
      await handleToggleByo();
      return;
    }
    await handleEnableByoWithVerification(selectedProvider);
  }

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
                    watch AI generate your app. For this mission, one successful
                    Copilot generation is enough to pass.
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
              {currentStep === 0 && (
                <>
                  <h2 className={titleClass}>Mission Complete!</h2>
                  <p className={subtitleClass}>
                    You shipped your first Copilot-generated build. Keep iterating
                    and add advanced features when you are ready.
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
                  message="You shipped your first Copilot-generated build. Bonus task unlocked."
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

          {isMissionPassed && (
            <section
              className={css`
                background: #fff;
                border: 1px solid ${Color.logoBlue(0.18)};
                border-radius: 16px;
                padding: 1.15rem 1.2rem;
                display: flex;
                flex-direction: column;
                gap: 1rem;
              `}
            >
            <div
              className={css`
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 0.8rem;
                flex-wrap: wrap;
              `}
            >
              <div>
                <h3
                  className={css`
                    margin: 0;
                    font-size: ${byoRem(1.45)};
                    color: ${Color.black()};
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                  `}
                >
                  <Icon icon="sparkles" />
                  Bonus Task: BYO Key Hunt
                </h3>
                <p
                  className={css`
                    margin: 0.25rem 0 0;
                    color: ${Color.darkGray()};
                    font-size: ${byoRem(1.12)};
                    line-height: 1.45;
                  `}
                >
                  Clear 3 provider trials. Every clear grants +2,000 Karma Points
                  (max 6,000 KP).
                </p>
              </div>
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  align-items: flex-end;
                  gap: 0.2rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    width: 100%;
                    align-items: stretch;
                  }
                `}
              >
                <div
                  className={css`
                    font-size: ${byoRem(1.1)};
                    font-weight: 800;
                    letter-spacing: 0.03em;
                    text-transform: uppercase;
                    color: ${Color.darkGray()};
                  `}
                >
                  Trials Cleared: {byoVerifiedProviderCount} / 3
                </div>
              </div>
            </div>

            {byoLoading ? (
              <div
                className={css`
                  color: ${Color.darkGray()};
                  font-size: ${byoRem(1.1)};
                `}
              >
                Loading BYO settings...
              </div>
            ) : byoSettings ? (
              <>
                <div
                  className={css`
                    border: 1px solid ${Color.logoBlue(0.2)};
                    border-radius: 12px;
                    background: ${Color.white(0.78)};
                    padding: 0.7rem 0.75rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                  `}
                >
                  <div
                    className={css`
                      display: flex;
                      justify-content: space-between;
                      gap: 0.5rem;
                      flex-wrap: wrap;
                      color: ${Color.darkGray()};
                      font-size: ${byoRem(1.1)};
                    `}
                  >
                    <span>
                      Campaign XP:{' '}
                      <strong>{totalByoKpEarned.toLocaleString()} KP</strong>
                    </span>
                    <span>
                      Next mission:{' '}
                      <strong>
                        {nextProviderObjective
                          ? `Verify ${BYO_PROVIDER_META[nextProviderObjective].label}`
                          : 'All trials completed'}
                      </strong>
                    </span>
                  </div>
                  <div
                    className={css`
                      width: 100%;
                      height: 10px;
                      border-radius: 999px;
                      background: ${Color.logoBlue(0.14)};
                      overflow: hidden;
                    `}
                  >
                    <div
                      className={css`
                        height: 100%;
                        width: ${Math.min(
                          100,
                          Math.round(
                            (byoVerifiedProviderCount / BYO_PROVIDER_ORDER.length) * 100
                          )
                        )}%;
                        border-radius: 999px;
                        background: ${Color.logoBlue()};
                        transition: width 220ms ease;
                      `}
                    />
                  </div>
                  <div
                    className={css`
                      color: ${Color.darkGray()};
                      font-size: ${byoRem(1.16)};
                    `}
                  >
                    Reward cap: <strong>{maxByoKp.toLocaleString()} KP</strong>
                  </div>
                </div>
                <div
                  className={css`
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 0.8rem;
                    @media (max-width: ${mobileMaxWidth}) {
                      grid-template-columns: 1fr;
                    }
                  `}
                >
                  {BYO_PROVIDER_ORDER.map((provider) => {
                    const providerMeta = BYO_PROVIDER_META[provider];
                    const providerVerification =
                      byoSettings.verification?.providers?.[provider];
                    const configured = Boolean(byoSettings.providerKeys?.[provider]);
                    const verified = Boolean(providerVerification?.verified);
                    const stage = !configured ? 1 : !verified ? 2 : 3;
                    const trialCompleted = configured && verified && byoEnabled;
                    const objective = !configured
                      ? 'Enter key'
                      : !verified
                        ? 'Verify key'
                        : !byoEnabled
                          ? 'Enable BYO'
                          : 'Trial clear';
                    const progressRows = [
                      { label: 'Key connected', done: configured },
                      { label: 'Verification passed', done: verified },
                      { label: 'BYO mode enabled', done: byoEnabled }
                    ];
                    const selected = provider === selectedProvider;

                    return (
                      <div
                        key={provider}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedProvider(provider)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedProvider(provider);
                          }
                        }}
                        className={css`
                          border: 1px solid ${Color.logoBlue(0.16)};
                          border-color: ${selected
                            ? providerMeta.accent
                            : Color.logoBlue(0.16)};
                          outline: ${selected ? `2px solid ${providerMeta.accent}55` : 'none'};
                          border-radius: 14px;
                          padding: 0.9rem;
                          display: flex;
                          flex-direction: column;
                          gap: 0.8rem;
                          background: ${Color.white()};
                          box-shadow: 0 16px 24px -26px rgba(15, 23, 42, 0.56);
                          cursor: pointer;
                        `}
                      >
                        <div
                          className={css`
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            gap: 0.6rem;
                          `}
                        >
                          <div
                            className={css`
                              display: flex;
                              align-items: center;
                              gap: 0.55rem;
                            `}
                          >
                            <div
                              className={css`
                                width: 2rem;
                                height: 2rem;
                                border-radius: 10px;
                                background: ${providerMeta.accent}1A;
                                color: ${providerMeta.accent};
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                                font-size: ${byoRem(1.05)};
                              `}
                            >
                              <Icon icon={providerMeta.icon} />
                            </div>
                            <div
                              className={css`
                                display: flex;
                                flex-direction: column;
                                gap: 0.15rem;
                              `}
                            >
                              <div
                                className={css`
                                  font-weight: 800;
                                  color: ${Color.black()};
                                  font-size: ${byoRem(1.14)};
                                `}
                              >
                                {providerMeta.label} Key Trial
                              </div>
                              <div
                                className={css`
                                  color: ${Color.darkGray()};
                                  font-size: ${byoRem(1.08)};
                                `}
                              >
                                {selected
                                  ? 'Selected'
                                  : trialCompleted
                                  ? 'Completed'
                                  : stage === 2
                                    ? 'Ready to verify'
                                    : stage === 3
                                      ? 'Enable BYO'
                                    : 'Key required'}
                              </div>
                            </div>
                          </div>
                          <div
                            className={css`
                              border-radius: 999px;
                              padding: 0.2rem 0.62rem;
                              background: ${trialCompleted
                                ? Color.oceanGreen(0.16)
                                : stage === 2
                                  ? Color.orange(0.16)
                                  : Color.logoBlue(0.13)};
                              color: ${trialCompleted
                                ? Color.oceanGreen()
                                : stage === 2
                                  ? Color.orange()
                                  : Color.logoBlue()};
                              font-size: ${byoRem(1.12)};
                              font-weight: 800;
                              letter-spacing: 0.03em;
                              text-transform: uppercase;
                              white-space: nowrap;
                            `}
                          >
                            +2,000 KP
                          </div>
                        </div>

                        <div
                          className={css`
                            display: flex;
                            flex-direction: column;
                            gap: 0.52rem;
                          `}
                        >
                          <div
                            className={css`
                              color: ${Color.black()};
                              font-size: ${byoRem(1.12)};
                              line-height: 1.45;
                              font-weight: 700;
                            `}
                          >
                            Next: {objective}
                          </div>
                          <div
                            className={css`
                              display: flex;
                              gap: 0.45rem;
                              flex-wrap: wrap;
                            `}
                          >
                            {progressRows.map((step) => (
                              <div
                                key={`${provider}-${step.label}`}
                                className={css`
                                  border-radius: 999px;
                                  border: 1px solid
                                    ${step.done
                                      ? Color.oceanGreen(0.4)
                                      : Color.borderGray()};
                                  background: ${step.done
                                    ? Color.oceanGreen(0.1)
                                    : Color.white()};
                                  color: ${step.done
                                    ? Color.oceanGreen()
                                    : Color.darkGray()};
                                  padding: 0.22rem 0.58rem;
                                  font-size: ${byoRem(1.08)};
                                  font-weight: 600;
                                  display: inline-flex;
                                  align-items: center;
                                  gap: 0.35rem;
                                `}
                              >
                                <span
                                  className={css`
                                    width: 0.45rem;
                                    height: 0.45rem;
                                    border-radius: 999px;
                                    background: ${step.done
                                      ? Color.oceanGreen()
                                      : Color.borderGray()};
                                  `}
                                />
                                {step.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  className={css`
                    border: 1px solid ${Color.logoBlue(0.24)};
                    border-radius: 12px;
                    background: ${Color.white()};
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.85rem;
                  `}
                >
                  <div
                    className={css`
                      font-weight: 800;
                      font-size: ${byoRem(1.22)};
                      color: ${Color.black()};
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      gap: 0.6rem;
                      flex-wrap: wrap;
                    `}
                  >
                    <span>{selectedProviderMeta.label} Setup Quest</span>
                    <span
                      className={css`
                        color: ${Color.darkGray()};
                        font-size: ${byoRem(1.05)};
                        font-weight: 700;
                      `}
                    >
                      Step {selectedProviderStep} / 3
                    </span>
                  </div>
                  <div
                    className={css`
                      display: grid;
                      grid-template-columns: repeat(3, minmax(0, 1fr));
                      gap: 0.4rem;
                      @media (max-width: ${mobileMaxWidth}) {
                        grid-template-columns: 1fr;
                      }
                    `}
                  >
                    {[
                      {
                        title: '1. Key connected',
                        done: selectedProviderConfigured,
                        active: selectedProviderStep === 1
                      },
                      {
                        title: '2. Verification passed',
                        done: selectedProviderVerified,
                        active: selectedProviderStep === 2
                      },
                      {
                        title: '3. BYO mode enabled',
                        done: byoEnabled,
                        active: selectedProviderStep === 3
                      }
                    ].map((step) => (
                      <div
                        key={step.title}
                        className={css`
                          border-radius: 10px;
                          border: 1px solid
                            ${step.done
                              ? Color.oceanGreen(0.45)
                              : step.active
                                ? selectedProviderMeta.accent
                                : Color.borderGray()};
                          background: ${step.done
                            ? Color.oceanGreen(0.1)
                            : step.active
                              ? `${selectedProviderMeta.accent}12`
                              : Color.white()};
                          color: ${step.done
                            ? Color.oceanGreen()
                            : step.active
                              ? selectedProviderMeta.accent
                              : Color.darkGray()};
                          font-size: ${byoRem(1.02)};
                          font-weight: 700;
                          padding: 0.5rem 0.62rem;
                        `}
                      >
                        {step.title}
                      </div>
                    ))}
                  </div>
                  {selectedProviderStep === 1 && (
                    <div
                      className={css`
                        display: flex;
                        flex-direction: column;
                        gap: 0.6rem;
                      `}
                    >
                      <div
                        className={css`
                          color: ${Color.darkGray()};
                          font-size: ${byoRem(1.08)};
                          line-height: 1.45;
                        `}
                      >
                        Enter your {selectedProviderMeta.label} API key. Once saved,
                        you move to verification.
                      </div>
                      <Input
                        type="password"
                        value={providerInputs[selectedProvider]}
                        placeholder={`Paste ${selectedProviderMeta.label} API key`}
                        onChange={(value: string) =>
                          setProviderInputs((prev) => ({
                            ...prev,
                            [selectedProvider]: value
                          }))
                        }
                        style={{ padding: '1.1rem' }}
                      />
                      <div
                        className={css`
                          display: flex;
                          gap: 0.45rem;
                          flex-wrap: wrap;
                        `}
                      >
                        <Button
                          color="green"
                          variant="solid"
                          size="lg"
                          uppercase={false}
                          onClick={() => handleSaveProviderKey(selectedProvider)}
                          disabled={
                            byoSaving || !providerInputs[selectedProvider].trim()
                          }
                        >
                          Save Key
                        </Button>
                        {selectedProviderConfigured && (
                          <Button
                            color="logoBlue"
                            variant="soft"
                            size="lg"
                            uppercase={false}
                            onClick={() => handleClearProviderKey(selectedProvider)}
                            disabled={byoSaving}
                          >
                            Remove Key
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedProviderStep === 2 && (
                    <div
                      className={css`
                        display: flex;
                        flex-direction: column;
                        gap: 0.6rem;
                      `}
                    >
                      <div
                        className={css`
                          color: ${Color.darkGray()};
                          font-size: ${byoRem(1.08)};
                          line-height: 1.45;
                        `}
                      >
                        Run a tiny live API call to verify the key and billing path.
                      </div>
                      <div
                        className={css`
                          display: flex;
                          gap: 0.45rem;
                          flex-wrap: wrap;
                        `}
                      >
                        <Button
                          color="orange"
                          variant="solid"
                          size="lg"
                          uppercase={false}
                          onClick={() => handleVerifyProvider(selectedProvider)}
                          disabled={byoSaving || !selectedProviderConfigured}
                        >
                          {selectedProviderVerified
                            ? 'Re-verify Key'
                            : 'Run Verification'}
                        </Button>
                        <Button
                          color="logoBlue"
                          variant="soft"
                          size="lg"
                          uppercase={false}
                          onClick={() => handleClearProviderKey(selectedProvider)}
                          disabled={byoSaving}
                        >
                          Reset Key
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedProviderStep === 3 && (
                    <div
                      className={css`
                        display: flex;
                        flex-direction: column;
                        gap: 0.7rem;
                      `}
                    >
                      <div
                        className={css`
                          color: ${Color.darkGray()};
                          font-size: ${byoRem(1.08)};
                          line-height: 1.45;
                        `}
                      >
                        BYO mode is account-wide. Turn this on to route Twinkle AI
                        usage through your connected keys.
                      </div>
                      <SwitchButton
                        checked={byoEnabled}
                        onChange={handleByoSwitchChange}
                        disabled={
                          byoSaving ||
                          (!byoEnabled &&
                            (!selectedProviderConfigured || !selectedProviderVerified))
                        }
                        label={
                          byoEnabled
                            ? 'BYO mode enabled'
                            : 'Enable BYO mode (runs live key check)'
                        }
                        labelStyle={{
                          fontSize: byoRem(1.08),
                          fontWeight: 800,
                          color: byoEnabled ? Color.oceanGreen() : Color.darkGray()
                        }}
                        style={{ alignItems: 'center', justifyContent: 'flex-start' }}
                      />
                      <div
                        className={css`
                          display: flex;
                          gap: 0.45rem;
                          flex-wrap: wrap;
                        `}
                      >
                        <Button
                          color="logoBlue"
                          variant="soft"
                          size="lg"
                          uppercase={false}
                          onClick={() => handleClearProviderKey(selectedProvider)}
                          disabled={byoSaving}
                        >
                          Reset Key
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedProviderVerification?.lastErrorMessage && (
                    <div
                      className={css`
                        color: ${Color.red(0.9)};
                        font-size: ${byoRem(1.06)};
                        line-height: 1.4;
                        background: ${Color.red(0.06)};
                        border: 1px solid ${Color.red(0.2)};
                        border-radius: 8px;
                        padding: 0.45rem 0.55rem;
                      `}
                    >
                      Last verification failed:{' '}
                      {selectedProviderVerification.lastErrorMessage}
                    </div>
                  )}
                  {selectedProviderVerified && (
                    <div
                      className={css`
                        color: ${Color.oceanGreen()};
                        font-size: ${byoRem(1.1)};
                        font-weight: 700;
                      `}
                    >
                      Verified reward earned: +{selectedProviderKp.toLocaleString()} KP
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div
                className={css`
                  color: ${Color.red(0.9)};
                  font-size: ${byoRem(1.06)};
                `}
              >
                Failed to load BYO settings.
              </div>
            )}

            {!!byoError && (
              <div
                className={css`
                  color: ${Color.red(0.9)};
                  font-size: ${byoRem(1.06)};
                `}
              >
                {byoError}
              </div>
            )}
            {!!byoActionMessage && !byoError && (
              <div
                className={css`
                  color: ${Color.oceanGreen()};
                  font-size: ${byoRem(1.06)};
                `}
              >
                {byoActionMessage}
              </div>
            )}
            </section>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
