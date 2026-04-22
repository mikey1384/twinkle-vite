import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import Modal from '~/components/Modal';
import { Color } from '~/constants/css';
import {
  useAppContext,
  useHomeContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useRoleColor } from '~/theme/useRoleColor';
import Community from './Community';
import {
  defaultDonorData,
  defaultFundStats,
  FULL_RECHARGE_COST,
  getSectionMeta,
  isCommunityRechargeRequirement
} from './helpers';
import Leaderboard from './Leaderboard';
import Overview from './Overview';
import {
  bodyCls,
  headerIconCls,
  headerSubtitleCls,
  headerTextWrapCls,
  headerTitleCls,
  headerWrapCls,
  loadingCls,
  overviewPageCls,
  sectionNavCls
} from './styles';
import type {
  AiEnergyDashboardModalProps,
  AiUsagePolicy,
  DashboardSection,
  DonorLeaderboard,
  FundStats
} from './types';

export default function AiEnergyDashboardModal({
  onHide,
  modalLevel
}: AiEnergyDashboardModalProps) {
  const navigate = useNavigate();
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const liveAiUsagePolicy = todayStats?.aiUsagePolicy as
    | AiUsagePolicy
    | null
    | undefined;
  const myId = useKeyContext((v) => v.myState.userId);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const loadCommunityFunds = useAppContext(
    (v) => v.requestHelpers.loadCommunityFunds
  );
  const loadCommunityFundStats = useAppContext(
    (v) => v.requestHelpers.loadCommunityFundStats
  );
  const loadDonorLeaderboard = useAppContext(
    (v) => v.requestHelpers.loadDonorLeaderboard
  );
  const getAiEnergyPolicy = useAppContext(
    (v) => v.requestHelpers.getAiEnergyPolicy
  );
  const purchaseAiEnergyRecharge = useAppContext(
    (v) => v.requestHelpers.purchaseAiEnergyRecharge
  );
  const onSetChessPuzzleModalShown = useHomeContext(
    (v) => v.actions.onSetChessPuzzleModalShown
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const energyAccentRole = useRoleColor('button', {
    themeName: profileTheme,
    fallback: profileTheme || 'logoBlue'
  });

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] =
    useState<DashboardSection>('overview');
  const [userMenuShown, setUserMenuShown] = useState(false);
  const [totalFunds, setTotalFunds] = useState(0);
  const [fundStats, setFundStats] = useState<FundStats>(defaultFundStats);
  const [donorData, setDonorData] =
    useState<DonorLeaderboard>(defaultDonorData);
  const [aiUsagePolicy, setAiUsagePolicy] = useState<AiUsagePolicy | null>(
    null
  );
  const [chargeLoading, setChargeLoading] = useState(false);
  const [chargeError, setChargeError] = useState('');

  const energyAccentColor = energyAccentRole.getColor();
  const energyAccentSoft = energyAccentRole.getColor(0.1);
  const energyAccentBorder = energyAccentRole.getColor(0.18);
  const communityAccentColor = Color.rose();
  const communityAccentSoft = Color.rose(0.1);
  const leaderboardAccentColor = Color.gold();
  const leaderboardAccentSoft = Color.gold(0.15);
  const sectionMeta = getSectionMeta(activeSection);
  const rechargeCost = Math.max(
    1,
    aiUsagePolicy?.resetCost || FULL_RECHARGE_COST
  );
  const availableCoins = Math.max(0, Number(twinkleCoins || 0));
  const energyPercentValue =
    typeof aiUsagePolicy?.energyPercent === 'number'
      ? Math.max(0, Math.min(100, aiUsagePolicy.energyPercent))
      : null;
  const energySegments = Math.max(
    1,
    Number(aiUsagePolicy?.energySegments || 5)
  );
  const allRequirements =
    aiUsagePolicy?.communityFundResetEligibility?.requirements || [];
  const requirements = allRequirements.filter(isCommunityRechargeRequirement);
  const completedRequirementCount = requirements.filter(
    (requirement) => requirement.done
  ).length;
  const requirementCount = requirements.length;
  const communityRechargeCoinsRemaining = Math.max(
    0,
    Number(aiUsagePolicy?.communityFundRechargeCoinsRemaining || 0)
  );
  const communityRechargeDailyCap = Math.max(
    0,
    Number(aiUsagePolicy?.communityFundRechargeCoinsDailyCap || 0)
  );
  const communityRechargeUnlocked =
    !!aiUsagePolicy?.communityFundResetEligibility?.eligible &&
    communityRechargeCoinsRemaining >= rechargeCost;
  const energyDepleted =
    typeof aiUsagePolicy?.energyRemaining === 'number' &&
    aiUsagePolicy.energyRemaining <= 0;
  const freeChargeAvailable = energyDepleted && communityRechargeUnlocked;
  const chargeButtonVariant = freeChargeAvailable ? 'gold' : 'orange';
  const chargeButtonMeta = freeChargeAvailable
    ? 'Free via community recharge.'
    : availableCoins >= rechargeCost
      ? `${addCommasToNumber(rechargeCost)} coins`
      : `${addCommasToNumber(rechargeCost)} coins required. You have ${addCommasToNumber(availableCoins)}.`;
  const currentModeLabel = aiUsagePolicy
    ? aiUsagePolicy.currentMode === 'low_energy'
      ? 'Lite Mode'
      : 'Max Mode'
    : 'Unavailable';
  const communityStatusLabel =
    requirementCount > 0
      ? `${completedRequirementCount}/${requirementCount} complete`
      : 'Tasks unavailable';

  useEffect(() => {
    let cancelled = false;

    init();

    return () => {
      cancelled = true;
    };

    async function init() {
      try {
        const [
          fundsResponse,
          statsResponse,
          donorResponse,
          aiUsagePolicyResponse
        ] = await Promise.all([
          loadCommunityFunds().catch((error: any) => {
            console.error('Failed to load community fund balance:', error);
            return { totalFunds: 0 };
          }),
          loadCommunityFundStats().catch((error: any) => {
            console.error('Failed to load community fund stats:', error);
            return defaultFundStats;
          }),
          loadDonorLeaderboard().catch((error: any) => {
            console.error('Failed to load donor leaderboard:', error);
            return defaultDonorData;
          }),
          getAiEnergyPolicy().catch((error: any) => {
            console.error('Failed to load AI Energy policy:', error);
            return null;
          })
        ]);

        if (cancelled) return;

        setTotalFunds(Number(fundsResponse?.totalFunds || 0));
        setFundStats({
          ...defaultFundStats,
          ...(statsResponse || {})
        });
        setDonorData({
          ...defaultDonorData,
          ...(donorResponse || {})
        });
        setAiUsagePolicy(aiUsagePolicyResponse?.aiUsagePolicy || null);
      } catch (error) {
        console.error('Failed to load AI Energy dashboard data:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUserMenuShown(false);
  }, [activeSection]);

  useEffect(() => {
    if (!liveAiUsagePolicy) return;
    setAiUsagePolicy((currentPolicy) => ({
      ...liveAiUsagePolicy,
      ...(currentPolicy?.communityFundResetEligibility &&
      !liveAiUsagePolicy.communityFundResetEligibility &&
      (!liveAiUsagePolicy.dayIndex ||
        liveAiUsagePolicy.dayIndex === currentPolicy.dayIndex)
        ? {
            communityFundResetEligibility:
              currentPolicy.communityFundResetEligibility
          }
        : {})
    }));
  }, [liveAiUsagePolicy]);

  return (
    <Modal
      modalKey="AiEnergyDashboardModal"
      isOpen
      onClose={onHide}
      closeOnBackdropClick={!userMenuShown}
      modalLevel={modalLevel}
      size="lg"
      bodyPadding={0}
      header={
        <div className={headerWrapCls}>
          <div
            className={headerIconCls}
            style={{
              color:
                activeSection === 'community'
                  ? communityAccentColor
                  : activeSection === 'leaderboard'
                    ? leaderboardAccentColor
                    : energyAccentColor,
              background:
                activeSection === 'community'
                  ? communityAccentSoft
                  : activeSection === 'leaderboard'
                    ? leaderboardAccentSoft
                    : energyAccentSoft
            }}
          >
            <Icon icon={sectionMeta.icon} />
          </div>
          <div className={headerTextWrapCls}>
            <div className={headerTitleCls}>{sectionMeta.title}</div>
            <div className={headerSubtitleCls}>{sectionMeta.subtitle}</div>
          </div>
        </div>
      }
      footer={<Button variant="ghost" onClick={onHide}>Close</Button>}
    >
      {loading ? (
        <Loading className={loadingCls} />
      ) : (
        <div className={bodyCls}>
          <div className={sectionNavCls}>
            <Button
              color="logoBlue"
              variant={activeSection === 'overview' ? 'solid' : 'soft'}
              tone="flat"
              size="sm"
              shape="pill"
              uppercase={false}
              onClick={() => setActiveSection('overview')}
            >
              Overview
            </Button>
            <Button
              color="rose"
              variant={activeSection === 'community' ? 'solid' : 'soft'}
              tone="flat"
              size="sm"
              shape="pill"
              uppercase={false}
              onClick={() => setActiveSection('community')}
            >
              Community
            </Button>
            <Button
              color="orange"
              variant={activeSection === 'leaderboard' ? 'solid' : 'soft'}
              tone="flat"
              size="sm"
              shape="pill"
              uppercase={false}
              onClick={() => setActiveSection('leaderboard')}
            >
              Leaderboard
            </Button>
          </div>

          {activeSection === 'overview' && (
            <div className={overviewPageCls}>
              <Overview
                chargeButtonDisabled={
                  chargeLoading ||
                  (!freeChargeAvailable && availableCoins < rechargeCost)
                }
                chargeButtonLoading={chargeLoading}
                chargeButtonMeta={chargeButtonMeta}
                chargeButtonShiny={freeChargeAvailable}
                chargeButtonVariant={chargeButtonVariant}
                onCharge={handleCharge}
                showChargeButton={energyDepleted}
                chargeError={chargeError}
                currentModeLabel={currentModeLabel}
                energyAccentColor={energyAccentColor}
                energyAccentSoft={energyAccentSoft}
                energyBorderColor={energyAccentBorder}
                energyPercentValue={energyPercentValue || 0}
                energySegments={energySegments}
              />
              <Community
                communityAccentColor={communityAccentColor}
                communityAccentSoft={communityAccentSoft}
                communityRechargeDailyCap={communityRechargeDailyCap}
                communityRechargeCoinsRemaining={
                  communityRechargeCoinsRemaining
                }
                communityRechargeUnlocked={communityRechargeUnlocked}
                communityStatusLabel={communityStatusLabel}
                energyAccentColor={energyAccentColor}
                fundStats={fundStats}
                onOpenChessPuzzle={handleOpenChessPuzzle}
                onOpenLumineBuild={handleOpenLumineBuild}
                requirements={requirements}
                totalFunds={totalFunds}
              />
              <Leaderboard
                communityAccentColor={communityAccentColor}
                donorData={donorData}
                fundStats={fundStats}
                myId={myId}
                setUserMenuShown={setUserMenuShown}
              />
            </div>
          )}

          {activeSection === 'community' && (
            <Community
              communityAccentColor={communityAccentColor}
              communityAccentSoft={communityAccentSoft}
              communityRechargeDailyCap={communityRechargeDailyCap}
              communityRechargeCoinsRemaining={communityRechargeCoinsRemaining}
              communityRechargeUnlocked={communityRechargeUnlocked}
              communityStatusLabel={communityStatusLabel}
              energyAccentColor={energyAccentColor}
              fundStats={fundStats}
              onOpenChessPuzzle={handleOpenChessPuzzle}
              onOpenLumineBuild={handleOpenLumineBuild}
              requirements={requirements}
              totalFunds={totalFunds}
            />
          )}

          {activeSection === 'leaderboard' && (
            <Leaderboard
              communityAccentColor={communityAccentColor}
              donorData={donorData}
              fundStats={fundStats}
              myId={myId}
              setUserMenuShown={setUserMenuShown}
            />
          )}
        </div>
      )}
    </Modal>
  );

  function handleOpenChessPuzzle() {
    onHide();
    navigate('/');
    onSetChessPuzzleModalShown(true);
  }

  function handleOpenLumineBuild() {
    onHide();
    navigate('/build/new');
  }

  async function handleCharge() {
    if (!energyDepleted || chargeLoading) return;
    setChargeError('');
    setChargeLoading(true);
    try {
      const result = await purchaseAiEnergyRecharge({
        useCommunityFunds: freeChargeAvailable
      });
      const nextPolicy = result?.aiUsagePolicy || null;
      if (nextPolicy) {
        setAiUsagePolicy(nextPolicy);
        onUpdateTodayStats({
          newStats: {
            aiUsagePolicy: nextPolicy
          }
        });
      }
      if (typeof result?.newBalance === 'number') {
        onSetUserState({
          userId: myId,
          newState: { twinkleCoins: result.newBalance }
        });
      }
      if (typeof result?.communityFunds === 'number') {
        onSetUserState({
          userId: myId,
          newState: { communityFunds: result.communityFunds }
        });
        setTotalFunds(result.communityFunds);
        try {
          const statsResponse = await loadCommunityFundStats();
          setFundStats({
            ...defaultFundStats,
            ...(statsResponse || {})
          });
        } catch (error) {
          console.error('Failed to refresh community fund stats:', error);
        }
      }
    } catch (error: any) {
      console.error('Failed to recharge AI Energy:', error);
      if (error?.aiUsagePolicy) {
        setAiUsagePolicy(error.aiUsagePolicy);
        onUpdateTodayStats({
          newStats: {
            aiUsagePolicy: error.aiUsagePolicy
          }
        });
      }
      setChargeError(error?.message || 'Unable to charge AI Energy right now.');
    } finally {
      setChargeLoading(false);
    }
  }
}
