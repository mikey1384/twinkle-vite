import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import AiEnergyCard from '~/components/AiEnergyCard';
import { mobileMaxWidth } from '~/constants/css';
import { isCommunityFundRechargeAvailable } from '~/helpers/aiEnergy';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import PreviewPanel from './PreviewPanel';
import type { BuildCapabilitySnapshot } from './capabilityTypes';

interface RuntimeBuild {
  id: number;
  userId: number;
  username: string;
  title: string;
  description: string | null;
  code: string | null;
  primaryArtifactId?: number | null;
  isPublic: boolean;
  collaborationMode?: 'private' | 'contribution' | 'open_source';
  contributionAccess?: 'anyone' | 'invite_only';
  capabilitySnapshot?: BuildCapabilitySnapshot | null;
  projectFiles?: Array<{
    id?: number;
    path: string;
    content?: string;
    sizeBytes?: number;
    contentHash?: string;
    createdAt?: number;
    updatedAt?: number;
  }>;
}

interface AiUsagePolicy {
  energyPercent?: number;
  energyRemaining?: number;
  energySegments?: number;
  currentMode?: 'full_quality' | 'low_energy';
  lastUsageOverflowed?: boolean;
  resetCost?: number;
  resetPurchasesToday?: number;
  dayIndex?: number | string;
  communityFundRechargeCoinsRemaining?: number | null;
  communityFundResetEligibility?: {
    eligible?: boolean | null;
  } | null;
}

const shellClass = css`
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  background: #fff;
  @supports (height: 100dvh) {
    height: 100dvh;
    min-height: 100dvh;
  }
`;

const headerClass = css`
  position: relative;
  border-bottom: 1px solid var(--ui-border);
  background: #fff;
  padding: 1.1rem 1.3rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: calc(env(safe-area-inset-top, 0px) + 0.8rem) 0.95rem 0.75rem;
    gap: 0.3rem;
  }
`;

const headerTopRowClass = css`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
  flex-wrap: wrap;
`;

const headerButtonGroupClass = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
  flex-wrap: wrap;
`;

const headerEnergySlotClass = css`
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(36rem, 38vw);
  min-width: 18rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  @media (max-width: 900px) {
    position: static;
    width: min(100%, 36rem);
    min-width: 0;
    margin: 0.1rem auto 0.2rem;
    transform: none;
  }
`;

const runtimeEnergyCardClass = css`
  width: 100%;
`;

const titleRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  flex: 1;
  color: var(--chat-text);
`;

const titleClass = css`
  margin: 0;
  font-size: 1.55rem;
  font-weight: 900;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.05rem;
  }
`;

const metaClass = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--chat-text);
  opacity: 0.72;
  flex-wrap: wrap;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.82rem;
    gap: 0.35rem;
  }
`;

const metaDescriptionClass = css`
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;

const backButtonClass = css`
  border: 1px solid var(--ui-border);
  background: rgba(65, 140, 235, 0.08);
  color: var(--chat-text);
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
  &:hover {
    background: rgba(65, 140, 235, 0.14);
    border-color: rgba(65, 140, 235, 0.24);
    transform: translateY(-1px);
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.48rem 0.72rem;
    font-size: 0.8rem;
    max-width: 46vw;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const contributionCtaRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
`;

const contributionButtonClass = css`
  border: 1px solid rgba(34, 197, 94, 0.36);
  background: rgba(34, 197, 94, 0.12);
  color: #166534;
  border-radius: 8px;
  padding: 0.58rem 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.92rem;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
  &:hover:not(:disabled) {
    background: rgba(34, 197, 94, 0.18);
    border-color: rgba(34, 197, 94, 0.5);
    transform: translateY(-1px);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const contributionErrorClass = css`
  color: #be123c;
  font-weight: 800;
  font-size: 0.86rem;
`;

const panelWrapClass = css`
  min-height: 0;
  overflow: hidden;
  padding: 0;
`;

const previewShellClass = css`
  height: 100%;
  min-height: 0;
  display: grid;
  overflow: hidden;
  background: #fff;
`;

export default function BuildRuntime() {
  const { buildId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const loadRuntimeBuild = useAppContext(
    (v) => v.requestHelpers.loadRuntimeBuild
  );
  const createBuildContributionFork = useAppContext(
    (v) => v.requestHelpers.createBuildContributionFork
  );
  const forkBuild = useAppContext((v) => v.requestHelpers.forkBuild);
  const getAiEnergyPolicy = useAppContext(
    (v) => v.requestHelpers.getAiEnergyPolicy
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const userId = useKeyContext((v) => v.myState.userId);
  const communityFunds = useKeyContext((v) => v.myState.communityFunds);
  const communityFundsLoaded = useKeyContext(
    (v) => v.myState.communityFundsLoaded
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [build, setBuild] = useState<RuntimeBuild | null>(null);
  const [creatingContributionFork, setCreatingContributionFork] =
    useState(false);
  const [forkingBuild, setForkingBuild] = useState(false);
  const [contributionForkError, setContributionForkError] = useState('');
  const [runtimeHostVisible, setRuntimeHostVisible] = useState(true);
  const [aiUsagePolicyLoadAttempted, setAiUsagePolicyLoadAttempted] =
    useState(false);
  const getAiEnergyPolicyRef = useRef(getAiEnergyPolicy);
  const onUpdateTodayStatsRef = useRef(onUpdateTodayStats);
  const aiUsagePolicy = todayStats?.aiUsagePolicy as AiUsagePolicy | null;

  const numericBuildId = useMemo(() => {
    const id = parseInt(buildId || '', 10);
    return Number.isNaN(id) ? null : id;
  }, [buildId]);
  const canUseHistoryBack =
    typeof window !== 'undefined' &&
    Number.isFinite(Number(window.history.state?.idx)) &&
    Number(window.history.state?.idx) > 0;
  const isEmbedded = useMemo(() => {
    return new URLSearchParams(location.search).get('embedded') === '1';
  }, [location.search]);
  const backTo = useMemo(() => {
    return typeof location.state?.runtimeBackTo === 'string'
      ? location.state.runtimeBackTo
      : '/';
  }, [location.state]);
  const backLabel = useMemo(() => {
    return typeof location.state?.runtimeBackLabel === 'string'
      ? location.state.runtimeBackLabel
      : canUseHistoryBack
        ? 'Go back'
        : 'Back to Twinkle';
  }, [canUseHistoryBack, location.state]);
  const showAiEnergy = !!userId && !!aiUsagePolicy;
  const energyPercent = Math.max(
    0,
    Math.min(100, Number(aiUsagePolicy?.energyPercent ?? 0))
  );
  const energySegments = Math.max(
    1,
    Number(aiUsagePolicy?.energySegments || 5)
  );
  const energyIsEmpty =
    !!aiUsagePolicy && Number(aiUsagePolicy.energyRemaining || 0) <= 0;
  const communityChargeAvailable = isCommunityFundRechargeAvailable({
    aiUsagePolicy,
    communityFunds,
    communityFundsKnown: communityFundsLoaded
  });
  const energyChargeAttentionKey = aiUsagePolicy
    ? [
        'runtime-app',
        aiUsagePolicy.dayIndex || 'unknown',
        energyIsEmpty ? 'empty' : 'available',
        communityChargeAvailable ? 'free' : 'paid',
        aiUsagePolicy.resetCost || 0
      ].join(':')
    : '';
  const buildAcceptsContributions =
    (build?.collaborationMode === 'contribution' ||
      build?.collaborationMode === 'open_source') &&
    build?.contributionAccess === 'anyone';
  const buildAcceptsStandaloneForks = build?.collaborationMode === 'open_source';
  const showContributeButton =
    !!build &&
    !!userId &&
    Number(build.userId) !== Number(userId) &&
    buildAcceptsContributions;
  const showStandaloneForkButton =
    !!build &&
    !!userId &&
    Number(build.userId) !== Number(userId) &&
    buildAcceptsStandaloneForks;

  function handleBack() {
    if (canUseHistoryBack) {
      navigate(-1);
      return;
    }
    navigate(backTo, { replace: true });
  }

  function handleGoToBuildMenu() {
    navigate('/build');
  }

  async function handleCreateContributionFork() {
    if (!build || !userId || creatingContributionFork) return;
    setCreatingContributionFork(true);
    setContributionForkError('');
    try {
      const result = await createBuildContributionFork(build.id);
      if (result?.build?.id) {
        navigate(`/build/${result.build.id}`);
      }
    } catch (error: any) {
      console.error('Failed to create build contribution fork:', error);
      setContributionForkError(
        error?.response?.data?.error ||
          error?.message ||
          'Unable to start contribution'
      );
    } finally {
      setCreatingContributionFork(false);
    }
  }

  async function handleCreateStandaloneFork() {
    if (!build || !userId || forkingBuild) return;
    setForkingBuild(true);
    setContributionForkError('');
    try {
      const result = await forkBuild(build.id);
      if (result?.build?.id) {
        navigate(`/build/${result.build.id}`);
      }
    } catch (error: any) {
      console.error('Failed to fork open source build:', error);
      setContributionForkError(
        error?.response?.data?.error || error?.message || 'Unable to fork Build'
      );
    } finally {
      setForkingBuild(false);
    }
  }

  function applyRuntimeAiUsagePolicyUpdate(
    nextAiUsagePolicy?: Record<string, any> | null
  ) {
    if (!nextAiUsagePolicy || typeof nextAiUsagePolicy !== 'object') return;
    onUpdateTodayStatsRef.current({
      newStats: {
        aiUsagePolicy: nextAiUsagePolicy
      }
    });
  }

  function renderRuntimeUnavailable({
    title,
    text
  }: {
    title?: string;
    text: string;
  }) {
    return (
      <ErrorBoundary componentPath="Build/Runtime">
        <div
          className={shellClass}
          style={{ gridTemplateRows: isEmbedded ? '1fr' : undefined }}
        >
          {!isEmbedded && (
            <div className={headerClass}>
              <div className={headerTopRowClass}>
                <div className={headerButtonGroupClass}>
                  <button
                    type="button"
                    className={backButtonClass}
                    onClick={handleBack}
                  >
                    <Icon icon="arrow-left" />
                    <span>{backLabel}</span>
                  </button>
                  <button
                    type="button"
                    className={backButtonClass}
                    onClick={handleGoToBuildMenu}
                    title="Go to build main menu"
                  >
                    <Icon icon="rocket-launch" />
                    <span>Build Menu</span>
                  </button>
                </div>
              </div>
              <div className={titleRowClass}>
                <Icon icon="laptop-code" />
                <h1 className={titleClass}>Build App</h1>
              </div>
            </div>
          )}
          <div className={panelWrapClass}>
            <InvalidPage
              title={title}
              text={text}
              style={{ paddingTop: isEmbedded ? '6rem' : '12rem' }}
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  useEffect(() => {
    getAiEnergyPolicyRef.current = getAiEnergyPolicy;
    onUpdateTodayStatsRef.current = onUpdateTodayStats;
  });

  useEffect(() => {
    if (userId) return;
    setAiUsagePolicyLoadAttempted(false);
  }, [userId]);

  useEffect(() => {
    if (!userId || aiUsagePolicy || aiUsagePolicyLoadAttempted) return;
    let cancelled = false;
    setAiUsagePolicyLoadAttempted(true);

    async function loadAiEnergyPolicy() {
      try {
        const result = await getAiEnergyPolicyRef.current();
        if (!cancelled && result?.aiUsagePolicy) {
          onUpdateTodayStatsRef.current({
            newStats: {
              aiUsagePolicy: result.aiUsagePolicy
            }
          });
        }
      } catch {
        // AI Energy is non-critical chrome on public app pages.
      }
    }

    void loadAiEnergyPolicy();
    return () => {
      cancelled = true;
    };
  }, [userId, aiUsagePolicy, aiUsagePolicyLoadAttempted]);

  useEffect(() => {
    if (!numericBuildId) return;
    void handleLoad();

    async function handleLoad() {
      setLoading(true);
      setError('');
      try {
        const data = await loadRuntimeBuild(numericBuildId);
        if (data?.build) {
          setBuild({
            ...data.build,
            capabilitySnapshot: data.capabilitySnapshot || null,
            projectFiles: Array.isArray(data.projectFiles)
              ? data.projectFiles
              : []
          });
        } else {
          setError('Build not found');
        }
      } catch (error: any) {
        console.error('Failed to load runtime build:', error);
        setError(error?.message || 'Failed to load app');
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericBuildId, userId]);

  useEffect(() => {
    if (!isEmbedded) return;

    function handleMessage(event: MessageEvent) {
      if (event.source !== window.parent) return;
      const data = event.data;
      if (
        !data ||
        data.source !== 'twinkle-content-panel' ||
        data.type !== 'runtime-visibility:update'
      ) {
        return;
      }
      setRuntimeHostVisible(data.payload?.visible !== false);
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEmbedded]);

  if (!numericBuildId) {
    return renderRuntimeUnavailable({
      text: 'Invalid build ID'
    });
  }

  if (loading) {
    return <Loading />;
  }

  if (!build || error) {
    return renderRuntimeUnavailable({
      text: error || 'Build not found'
    });
  }

  return (
    <ErrorBoundary componentPath="Build/Runtime">
      <div
        className={shellClass}
        style={{ gridTemplateRows: isEmbedded ? '1fr' : undefined }}
      >
        {!isEmbedded && (
          <div className={headerClass}>
            <div className={headerTopRowClass}>
              <div className={headerButtonGroupClass}>
                <button
                  type="button"
                  className={backButtonClass}
                  onClick={handleBack}
                >
                  <Icon icon="arrow-left" />
                  <span>{backLabel}</span>
                </button>
                <button
                  type="button"
                  className={backButtonClass}
                  onClick={handleGoToBuildMenu}
                  title="Go to build main menu"
                >
                  <Icon icon="rocket-launch" />
                  <span>Build Menu</span>
                </button>
              </div>
            </div>
            {showAiEnergy && (
              <div className={headerEnergySlotClass}>
                <AiEnergyCard
                  variant="inline"
                  className={runtimeEnergyCardClass}
                  energyPercent={energyPercent}
                  energySegments={energySegments}
                  overflowed={aiUsagePolicy.lastUsageOverflowed}
                  resetNeeded={energyIsEmpty}
                  resetCost={aiUsagePolicy.resetCost || 0}
                  resetPurchaseNumber={
                    typeof aiUsagePolicy.resetPurchasesToday === 'number'
                      ? aiUsagePolicy.resetPurchasesToday + 1
                      : undefined
                  }
                  communityFundsEligible={communityChargeAvailable}
                  chargeCtaAttentionKey={energyChargeAttentionKey}
                />
              </div>
            )}
            <div className={titleRowClass}>
              <Icon icon="laptop-code" />
              <h1 className={titleClass}>{build.title}</h1>
            </div>
            <div className={metaClass}>
              <span>by {build.username}</span>
              {build.description?.trim() ? (
                <span className={metaDescriptionClass}>
                  {build.description.trim()}
                </span>
              ) : null}
            </div>
            {showContributeButton || showStandaloneForkButton ? (
              <div className={contributionCtaRowClass}>
                {showContributeButton ? (
                  <button
                    type="button"
                    className={contributionButtonClass}
                    onClick={handleCreateContributionFork}
                    disabled={creatingContributionFork || forkingBuild}
                  >
                    <Icon
                      icon={
                        creatingContributionFork ? 'spinner' : 'code-branch'
                      }
                      pulse={creatingContributionFork}
                    />
                    <span>
                      {creatingContributionFork
                        ? 'Starting contribution...'
                        : 'Contribute to this Build'}
                    </span>
                  </button>
                ) : null}
                {showStandaloneForkButton ? (
                  <button
                    type="button"
                    className={contributionButtonClass}
                    onClick={handleCreateStandaloneFork}
                    disabled={creatingContributionFork || forkingBuild}
                  >
                    <Icon
                      icon={forkingBuild ? 'spinner' : 'code-branch'}
                      pulse={forkingBuild}
                    />
                    <span>
                      {forkingBuild ? 'Forking...' : 'Fork this Build'}
                    </span>
                  </button>
                ) : null}
                {contributionForkError ? (
                  <span className={contributionErrorClass}>
                    {contributionForkError}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
        <div className={panelWrapClass}>
          <div className={previewShellClass}>
            <PreviewPanel
              build={build}
              code={build.code}
              projectFiles={build.projectFiles || []}
              isOwner={false}
              runtimeOnly
              runtimeHostVisible={runtimeHostVisible}
              capabilitySnapshot={build.capabilitySnapshot || null}
              onAiUsagePolicyUpdate={applyRuntimeAiUsagePolicyUpdate}
              onReplaceCode={() => {}}
              onApplyRestoredProjectFiles={() => {}}
              onSaveProjectFiles={async () => ({ success: false })}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
