import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import DonorListItem from '~/components/DonorListItem';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import Modal from '~/components/Modal';
import RankBadge from '~/components/RankBadge';
import RoundList from '~/components/RoundList';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useRoleColor } from '~/theme/useRoleColor';

const FULL_RECHARGE_COST = 1000000;

const defaultFundStats: FundStats = {
  sponsoredMessagesToday: 0,
  totalSpentToday: 0,
  totalDonors: 0,
  totalDonationsAllTime: 0
};

const defaultDonorData: DonorLeaderboard = {
  donors: [],
  myDonationRank: null,
  myTotalDonated: 0
};

type DashboardSection = 'overview' | 'spend' | 'xp' | 'community';

interface AiEnergyDashboardModalProps {
  onHide: () => void;
  modalLevel?: number;
}

interface FundStats {
  sponsoredMessagesToday: number;
  totalSpentToday: number;
  totalDonors: number;
  totalDonationsAllTime: number;
}

interface DonorLeaderboard {
  donors: Array<{
    id: number;
    username: string;
    realName: string;
    profileFirstRow: string;
    profileTheme: string;
    profilePicUrl: string;
    totalDonated: number;
    rank: number;
  }>;
  myDonationRank: number | null;
  myTotalDonated: number;
}

interface CommunityFundRequirement {
  key: string;
  label: string;
  done: boolean;
  current?: number;
  required?: number;
}

interface AiUsagePolicy {
  energyRemaining?: number;
  energyPercent?: number;
  currentMode?: 'full_quality' | 'low_energy';
  resetCost?: number;
  resetPurchasesToday?: number;
  communityFundRechargeCoinsToday?: number;
  communityFundRechargeCoinsRemaining?: number;
  communityFundRechargeCoinsDailyCap?: number;
  communityFundResetEligibility?: {
    eligible: boolean;
    requirements: CommunityFundRequirement[];
  };
}

interface SectionMeta {
  icon: string;
  title: string;
  subtitle: string;
}

function DashboardEntryCard({
  accentColor,
  detail,
  icon,
  onClick,
  status,
  title,
  value
}: {
  accentColor: string;
  detail: string;
  icon: string;
  onClick: () => void;
  status: string;
  title: string;
  value: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={entryCardCls}
      onClick={onClick}
      style={{
        borderColor: accentColor,
        boxShadow: `0 14px 32px ${withAlpha(accentColor, 0.08)}`
      }}
    >
      <div className={entryCardTopRowCls}>
        <div
          className={entryCardIconCls}
          style={{
            color: accentColor,
            background: withAlpha(accentColor, 0.11)
          }}
        >
          <Icon icon={icon} />
        </div>
        <div
          className={entryCardStatusCls}
          style={{
            color: accentColor,
            background: withAlpha(accentColor, 0.1)
          }}
        >
          {status}
        </div>
      </div>
      <div className={entryCardTitleCls}>{title}</div>
      <div className={entryCardValueCls}>{value}</div>
      <div className={entryCardDetailCls}>{detail}</div>
    </button>
  );
}

function MetricTile({
  accentColor,
  icon,
  label,
  value
}: {
  accentColor: string;
  icon: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className={metricTileCls}
      style={{
        borderColor: withAlpha(accentColor, 0.18)
      }}
    >
      <div className={metricTileLabelRowCls}>
        <span
          className={metricTileIconCls}
          style={{
            color: accentColor
          }}
        >
          <Icon icon={icon} />
        </span>
        <span>{label}</span>
      </div>
      <div className={metricTileValueCls}>{value}</div>
    </div>
  );
}

export default function AiEnergyDashboardModal({
  onHide,
  modalLevel
}: AiEnergyDashboardModalProps) {
  const myId = useKeyContext((v) => v.myState.userId);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
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
  const energyAccentRole = useRoleColor('button', {
    themeName: profileTheme,
    fallback: profileTheme || 'logoBlue'
  });
  const xpAccentRole = useRoleColor('xpNumber', { fallback: 'logoGreen' });

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] =
    useState<DashboardSection>('overview');
  const [userMenuShown, setUserMenuShown] = useState(false);
  const [totalFunds, setTotalFunds] = useState(0);
  const [fundStats, setFundStats] = useState(defaultFundStats);
  const [donorData, setDonorData] = useState(defaultDonorData);
  const [aiUsagePolicy, setAiUsagePolicy] = useState<AiUsagePolicy | null>(null);

  const energyAccentColor = energyAccentRole.getColor();
  const energyAccentSoft = energyAccentRole.getColor(0.1);
  const xpAccentColor = xpAccentRole.getColor();
  const communityAccentColor = Color.rose();
  const communityAccentSoft = Color.rose(0.1);
  const spendAccentColor = Color.orange();
  const spendAccentSoft = Color.orange(0.1);
  const sectionMeta = getSectionMeta(activeSection);
  const rechargeCost = Math.max(1, aiUsagePolicy?.resetCost || FULL_RECHARGE_COST);
  const energyPercent =
    typeof aiUsagePolicy?.energyPercent === 'number'
      ? Math.max(0, Math.min(100, Math.round(aiUsagePolicy.energyPercent)))
      : null;
  const requirements =
    aiUsagePolicy?.communityFundResetEligibility?.requirements || [];
  const completedRequirementCount = requirements.filter(
    (requirement) => requirement.done
  ).length;
  const communityRechargeUnlocked =
    !!aiUsagePolicy?.communityFundResetEligibility?.eligible;
  const availableSponsoredRecharges = Math.floor(totalFunds / rechargeCost);
  const remainingSponsoredRecharges =
    typeof aiUsagePolicy?.communityFundRechargeCoinsRemaining === 'number'
      ? Math.floor(aiUsagePolicy.communityFundRechargeCoinsRemaining / rechargeCost)
      : null;
  const communityRechargeCoinsToday =
    aiUsagePolicy?.communityFundRechargeCoinsToday || 0;
  const communityRechargeDailyCap =
    aiUsagePolicy?.communityFundRechargeCoinsDailyCap || rechargeCost;
  const currentModeLabel = aiUsagePolicy
    ? aiUsagePolicy.currentMode === 'low_energy'
      ? 'Lite Mode'
      : 'Max Mode'
    : 'Unavailable';
  const energyLeftTodayLabel =
    energyPercent === null ? 'Unavailable' : `${energyPercent}%`;
  const rechargeCostLabel = `${addCommasToNumber(rechargeCost)} coins`;
  const remainingRechargeLabel =
    remainingSponsoredRecharges === null
      ? 'Unavailable'
      : formatRechargeCount(remainingSponsoredRecharges);
  const communityStatusLabel = communityRechargeUnlocked
    ? 'Unlocked today'
    : requirements.length > 0
    ? `${completedRequirementCount}/${requirements.length} tasks complete`
    : 'Tasks loading';

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

  return (
    <Modal
      modalKey="AiEnergyDashboardModal"
      isOpen
      onClose={handleBackOrClose}
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
                activeSection === 'xp'
                  ? xpAccentColor
                  : activeSection === 'community'
                  ? communityAccentColor
                  : activeSection === 'spend'
                  ? spendAccentColor
                  : energyAccentColor,
              background:
                activeSection === 'xp'
                  ? xpAccentRole.getColor(0.12)
                  : activeSection === 'community'
                  ? communityAccentSoft
                  : activeSection === 'spend'
                  ? spendAccentSoft
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
      footer={
        <Button variant="ghost" onClick={handleBackOrClose}>
          {activeSection === 'overview' ? 'Close' : 'Back'}
        </Button>
      }
    >
      {loading ? (
        <Loading className={loadingCls} />
      ) : (
        <div className={bodyCls}>
          {activeSection === 'overview' && (
            <div className={sectionStackCls}>
              <section
                className={heroCardCls}
                style={{
                  borderColor: energyAccentRole.getColor(0.18),
                  boxShadow: `0 18px 42px ${energyAccentRole.getColor(0.08)}`
                }}
              >
                <div
                  className={heroEyebrowCls}
                  style={{
                    color: energyAccentColor
                  }}
                >
                  Today
                </div>
                <div className={heroTitleCls}>AI Energy overview</div>
                <p className={heroDescriptionCls}>
                  This is the main AI Energy dashboard now. Use it to check the
                  current battery picture, open the dedicated spend and XP views,
                  and manage community-sponsored recharges from one place.
                </p>
                <div className={metricGridCls}>
                  <MetricTile
                    accentColor={energyAccentColor}
                    icon="bolt"
                    label="Energy left today"
                    value={energyLeftTodayLabel}
                  />
                  <MetricTile
                    accentColor={energyAccentColor}
                    icon="star"
                    label="Current mode"
                    value={currentModeLabel}
                  />
                  <MetricTile
                    accentColor={communityAccentColor}
                    icon="coins"
                    label="Full recharge cost"
                    value={rechargeCostLabel}
                  />
                </div>
              </section>

              <div className={overviewGridCls}>
                <DashboardEntryCard
                  accentColor={spendAccentColor}
                  detail="Open the spend page. The new per-surface dashboard payload is still the next backend step."
                  icon="chart-line"
                  onClick={() => setActiveSection('spend')}
                  status="Next payload"
                  title="Today's Energy spend"
                  value="Break down usage by category / surface"
                />
                <DashboardEntryCard
                  accentColor={xpAccentColor}
                  detail="Open the XP page. The rules are taking shape, but today's live XP totals are not wired into this modal yet."
                  icon="star"
                  onClick={() => setActiveSection('xp')}
                  status="Next payload"
                  title="Energy to XP"
                  value="See how today's Energy usage becomes AI-learning XP"
                />
                <DashboardEntryCard
                  accentColor={communityAccentColor}
                  detail={`Open the community page. ${communityStatusLabel}.`}
                  icon="heart"
                  onClick={() => setActiveSection('community')}
                  status="Live now"
                  title="Sponsored recharges"
                  value={`${formatRechargeCount(availableSponsoredRecharges)} funded right now`}
                />
              </div>

              <section className={surfaceCardCls}>
                <div className={surfaceTitleRowCls}>
                  <div className={surfaceTitleCls}>Community fund is now one section</div>
                </div>
                <p className={surfaceDescriptionCls}>
                  Community support still matters, but it is secondary content
                  inside the broader AI Energy dashboard instead of the identity
                  of the whole modal.
                </p>
              </section>
            </div>
          )}

          {activeSection === 'spend' && (
            <div className={sectionStackCls}>
              <section
                className={heroCardCls}
                style={{
                  borderColor: Color.orange(0.2),
                  boxShadow: `0 18px 42px ${Color.orange(0.08)}`
                }}
              >
                <div
                  className={heroEyebrowCls}
                  style={{
                    color: spendAccentColor
                  }}
                >
                  Today
                </div>
                <div className={heroTitleCls}>AI Energy spend by surface</div>
                <p className={heroDescriptionCls}>
                  This screen is reserved for the detailed daily Energy
                  breakdown. The current frontend helpers do not yet provide the
                  new per-surface dashboard payload, so this view stays explicit
                  about what is live now versus what is still being added.
                </p>
                <div className={metricGridCls}>
                  <MetricTile
                    accentColor={spendAccentColor}
                    icon="chart-line"
                    label="Live spend breakdown"
                    value="Pending"
                  />
                  <MetricTile
                    accentColor={communityAccentColor}
                    icon="coins"
                    label="Community fund spend today"
                    value={`${addCommasToNumber(fundStats.totalSpentToday)} coins`}
                  />
                  <MetricTile
                    accentColor={communityAccentColor}
                    icon="heart"
                    label="Sponsored messages today"
                    value={fundStats.sponsoredMessagesToday}
                  />
                </div>
              </section>

              <section className={emptyStateCardCls}>
                <div
                  className={emptyStateIconCls}
                  style={{
                    color: spendAccentColor,
                    background: spendAccentSoft
                  }}
                >
                  <Icon icon="chart-line" />
                </div>
                <div className={emptyStateTitleCls}>
                  Detailed spend-by-category totals are still being wired in.
                </div>
                <div className={emptyStateTextCls}>
                  Once the dashboard payload lands, this page should show
                  today&apos;s AI Energy spend by category / surface instead of
                  donor-first community-fund stats.
                </div>
              </section>
            </div>
          )}

          {activeSection === 'xp' && (
            <div className={sectionStackCls}>
              <section
                className={heroCardCls}
                style={{
                  borderColor: xpAccentRole.getColor(0.2),
                  boxShadow: `0 18px 42px ${xpAccentRole.getColor(0.08)}`
                }}
              >
                <div
                  className={heroEyebrowCls}
                  style={{
                    color: xpAccentColor
                  }}
                >
                  Today
                </div>
                <div className={heroTitleCls}>How Energy usage translates into XP</div>
                <p className={heroDescriptionCls}>
                  The dashboard needs to show AI-learning XP, not just raw
                  Energy spend. The intended rule is that more educational or
                  productive AI usage earns more XP than lighter-weight usage.
                </p>
                <div className={metricGridCls}>
                  <MetricTile
                    accentColor={xpAccentColor}
                    icon="star"
                    label="Daily XP totals"
                    value="Pending"
                  />
                  <MetricTile
                    accentColor={xpAccentColor}
                    icon="bolt"
                    label="Weighting principle"
                    value="Educational value"
                  />
                  <MetricTile
                    accentColor={xpAccentColor}
                    icon="chart-line"
                    label="Explanation goal"
                    value="Readable and transparent"
                  />
                </div>
              </section>

              <div className={secondaryGridCls}>
                <section className={surfaceCardCls}>
                  <div className={surfaceTitleCls}>What should earn more</div>
                  <p className={surfaceDescriptionCls}>
                    Higher-value learning or build-oriented AI work should earn
                    more XP than lightweight usage. Users should be able to see
                    that distinction inside this dashboard.
                  </p>
                </section>
                <section className={surfaceCardCls}>
                  <div className={surfaceTitleCls}>What is missing right now</div>
                  <p className={surfaceDescriptionCls}>
                    Today&apos;s live XP translation payload is not available in
                    the modal yet. This screen exists now so the AI Energy
                    dashboard can grow into that dedicated XP view cleanly.
                  </p>
                </section>
              </div>
            </div>
          )}

          {activeSection === 'community' && (
            <div className={sectionStackCls}>
              <section
                className={heroCardCls}
                style={{
                  borderColor: Color.rose(0.2),
                  boxShadow: `0 18px 42px ${Color.rose(0.08)}`
                }}
              >
                <div
                  className={heroEyebrowCls}
                  style={{
                    color: communityAccentColor
                  }}
                >
                  Sponsored recharge
                </div>
                <div className={heroTitleCls}>Community support inside AI Energy</div>
                <p className={heroDescriptionCls}>
                  Completing the daily community tasks unlocks a sponsored full
                  battery recharge. One sponsored recharge spends{' '}
                  {addCommasToNumber(rechargeCost)} coins from the community
                  fund to cover one full battery refill.
                </p>
                <div className={metricGridCls}>
                  <MetricTile
                    accentColor={communityAccentColor}
                    icon="coins"
                    label="Community fund balance"
                    value={`${addCommasToNumber(totalFunds)} coins`}
                  />
                  <MetricTile
                    accentColor={energyAccentColor}
                    icon="bolt"
                    label="Funded full recharges"
                    value={formatRechargeCount(availableSponsoredRecharges)}
                  />
                  <MetricTile
                    accentColor={communityAccentColor}
                    icon="heart"
                    label="Your remaining sponsored recharge allowance today"
                    value={remainingRechargeLabel}
                  />
                </div>
              </section>

              <section className={surfaceCardCls}>
                <div className={surfaceTitleRowCls}>
                  <div className={surfaceTitleCls}>Today&apos;s recharge tasks</div>
                  <div
                    className={statusPillCls}
                    style={{
                      color: communityRechargeUnlocked
                        ? Color.green()
                        : communityAccentColor,
                      background: communityRechargeUnlocked
                        ? Color.green(0.1)
                        : communityAccentSoft
                    }}
                  >
                    {communityStatusLabel}
                  </div>
                </div>
                <p className={surfaceDescriptionCls}>
                  Finish the tasks below to unlock the sponsored recharge path.
                  The community-fund cap for one user today is{' '}
                  {addCommasToNumber(communityRechargeDailyCap)} coins, which is
                  one full battery recharge.
                </p>
                {requirements.length > 0 ? (
                  <div className={requirementsListCls}>
                    {requirements.map((requirement) => (
                      <div
                        key={requirement.key}
                        className={requirementRowCls}
                        style={{
                          borderColor: requirement.done
                            ? Color.green(0.22)
                            : 'var(--ui-border)',
                          background: requirement.done
                            ? Color.green(0.07)
                            : '#fff'
                        }}
                      >
                        <span
                          className={requirementIconCls}
                          style={{
                            color: requirement.done
                              ? Color.green()
                              : Color.darkGray()
                          }}
                        >
                          <Icon icon={requirement.done ? 'check' : 'times'} />
                        </span>
                        <span>
                          {requirement.label}
                          {typeof requirement.required === 'number'
                            ? ` (${requirement.current || 0}/${requirement.required})`
                            : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={emptyInlineStateCls}>
                    Task status is not available right now.
                  </div>
                )}
                <div className={finePrintCls}>
                  You have used{' '}
                  {addCommasToNumber(communityRechargeCoinsToday)} community
                  coins for sponsored recharges today.
                </div>
              </section>

              <div className={secondaryGridCls}>
                {donorData.myTotalDonated > 0 && (
                  <section className={surfaceCardCls}>
                    <div className={surfaceTitleCls}>Your contribution</div>
                    <div className={myContributionGridCls}>
                      <div className={myContributionCellCls}>
                        <RankBadge
                          rank={donorData.myDonationRank || undefined}
                          style={{
                            fontSize: '1.2rem',
                            minWidth: '3rem',
                            height: '2.3rem'
                          }}
                        />
                        <div className={subtleLabelCls}>Your rank</div>
                      </div>
                      <div className={myContributionCellCls}>
                        <div
                          className={myContributionValueCls}
                          style={{
                            color: communityAccentColor
                          }}
                        >
                          {addCommasToNumber(donorData.myTotalDonated)}
                        </div>
                        <div className={subtleLabelCls}>Coins donated</div>
                      </div>
                    </div>
                  </section>
                )}

                <section className={surfaceCardCls}>
                  <div className={surfaceTitleCls}>Community impact</div>
                  <div className={impactGridCls}>
                    <MetricTile
                      accentColor={communityAccentColor}
                      icon="users"
                      label="Total donors"
                      value={fundStats.totalDonors}
                    />
                    <MetricTile
                      accentColor={communityAccentColor}
                      icon="coins"
                      label="Total donated all time"
                      value={`${addCommasToNumber(fundStats.totalDonationsAllTime)} coins`}
                    />
                    <MetricTile
                      accentColor={communityAccentColor}
                      icon="heart"
                      label="Sponsored messages today"
                      value={fundStats.sponsoredMessagesToday}
                    />
                    <MetricTile
                      accentColor={communityAccentColor}
                      icon="bolt"
                      label="Community coins spent today"
                      value={`${addCommasToNumber(fundStats.totalSpentToday)} coins`}
                    />
                  </div>
                </section>
              </div>

              <section className={surfaceCardCls}>
                <div className={surfaceTitleCls}>Donor leaderboard</div>
                <p className={surfaceDescriptionCls}>
                  Leaderboard and impact stay here as secondary community
                  content inside the broader AI Energy dashboard.
                </p>
                {donorData.donors.length > 0 ? (
                  <RoundList width="100%" mobileWidth="100%">
                    {donorData.donors.map((donor) => (
                      <DonorListItem
                        key={donor.id}
                        donor={donor}
                        myId={myId}
                        onUsermenuShownChange={setUserMenuShown}
                      />
                    ))}
                  </RoundList>
                ) : (
                  <div className={emptyInlineStateCls}>
                    No donations have been made yet.
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      )}
    </Modal>
  );

  function handleBackOrClose() {
    if (activeSection === 'overview') {
      onHide();
      return;
    }
    setActiveSection('overview');
  }
}

function getSectionMeta(section: DashboardSection): SectionMeta {
  switch (section) {
    case 'spend':
      return {
        icon: 'chart-line',
        title: 'Today\'s Energy Spend',
        subtitle: 'See Energy spend by category / surface.'
      };
    case 'xp':
      return {
        icon: 'star',
        title: 'Energy To XP',
        subtitle: 'Track how AI Energy use turns into daily XP.'
      };
    case 'community':
      return {
        icon: 'heart',
        title: 'Sponsored Recharges',
        subtitle: 'Community tasks, fund balance, and donor impact.'
      };
    default:
      return {
        icon: 'bolt',
        title: 'AI Energy Dashboard',
        subtitle: 'Overview of spend, XP, and community-sponsored recharges.'
      };
  }
}

function formatRechargeCount(count: number) {
  const normalizedCount = Math.max(0, count);
  return `${addCommasToNumber(normalizedCount)} full ${
    normalizedCount === 1 ? 'recharge' : 'recharges'
  }`;
}

function withAlpha(color: string, alpha: number) {
  const rgbaMatch = color.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)/
  );

  if (!rgbaMatch) return color;

  return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${alpha})`;
}

const loadingCls = css`
  min-height: 20rem;
`;

const bodyCls = css`
  width: 100%;
  padding: 0 1.5rem 1.75rem;
`;

const headerWrapCls = css`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
`;

const headerIconCls = css`
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.1rem;
`;

const headerTextWrapCls = css`
  min-width: 0;
`;

const headerTitleCls = css`
  font-size: 1.55rem;
  font-weight: 700;
  color: ${Color.black()};
  line-height: 1.2;
`;

const headerSubtitleCls = css`
  margin-top: 0.2rem;
  font-size: 1.1rem;
  color: ${Color.darkGray()};
  line-height: 1.4;
`;

const sectionStackCls = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const heroCardCls = css`
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--ui-border);
  border-radius: 18px;
  padding: 1.35rem 1.45rem;
`;

const heroEyebrowCls = css`
  font-size: 0.92rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const heroTitleCls = css`
  margin-top: 0.5rem;
  font-size: 1.65rem;
  font-weight: 700;
  color: ${Color.black()};
  line-height: 1.2;
`;

const heroDescriptionCls = css`
  margin: 0.8rem 0 0;
  font-size: 1.1rem;
  line-height: 1.65;
  color: ${Color.darkerGray()};
`;

const metricGridCls = css`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const metricTileCls = css`
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  padding: 0.95rem 1rem;
  min-height: 5.7rem;
`;

const metricTileLabelRowCls = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.98rem;
  color: ${Color.darkGray()};
  line-height: 1.35;
`;

const metricTileIconCls = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const metricTileValueCls = css`
  margin-top: 0.55rem;
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.25;
  color: ${Color.black()};
  word-break: break-word;
`;

const overviewGridCls = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const entryCardCls = css`
  appearance: none;
  width: 100%;
  border: 1px solid var(--ui-border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  padding: 1.15rem;
  text-align: left;
  cursor: pointer;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    border-color 120ms ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const entryCardTopRowCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const entryCardIconCls = css`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
`;

const entryCardStatusCls = css`
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
`;

const entryCardTitleCls = css`
  margin-top: 1rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: ${Color.black()};
  line-height: 1.25;
`;

const entryCardValueCls = css`
  margin-top: 0.55rem;
  font-size: 1.1rem;
  line-height: 1.55;
  color: ${Color.darkerGray()};
`;

const entryCardDetailCls = css`
  margin-top: 0.85rem;
  font-size: 0.98rem;
  line-height: 1.55;
  color: ${Color.darkGray()};
`;

const surfaceCardCls = css`
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--ui-border);
  border-radius: 18px;
  padding: 1.2rem 1.3rem;
`;

const surfaceTitleRowCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

const surfaceTitleCls = css`
  font-size: 1.22rem;
  font-weight: 700;
  color: ${Color.black()};
  line-height: 1.25;
`;

const surfaceDescriptionCls = css`
  margin: 0.65rem 0 0;
  font-size: 1.05rem;
  line-height: 1.65;
  color: ${Color.darkerGray()};
`;

const emptyStateCardCls = css`
  border: 1px dashed var(--ui-border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.8);
  padding: 1.6rem 1.3rem;
  text-align: center;
`;

const emptyStateIconCls = css`
  width: 3rem;
  height: 3rem;
  margin: 0 auto;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
`;

const emptyStateTitleCls = css`
  margin-top: 0.95rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: ${Color.black()};
`;

const emptyStateTextCls = css`
  max-width: 36rem;
  margin: 0.6rem auto 0;
  font-size: 1.02rem;
  line-height: 1.65;
  color: ${Color.darkGray()};
`;

const secondaryGridCls = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const statusPillCls = css`
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
`;

const requirementsListCls = css`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const requirementRowCls = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 0.8rem 0.9rem;
  font-size: 1.02rem;
  line-height: 1.45;
  color: ${Color.darkerGray()};
`;

const requirementIconCls = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  flex-shrink: 0;
`;

const finePrintCls = css`
  margin-top: 0.85rem;
  font-size: 0.98rem;
  line-height: 1.55;
  color: ${Color.darkGray()};
`;

const emptyInlineStateCls = css`
  margin-top: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 14px;
  border: 1px dashed var(--ui-border);
  background: rgba(255, 255, 255, 0.85);
  font-size: 1rem;
  color: ${Color.darkGray()};
`;

const myContributionGridCls = css`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
`;

const myContributionCellCls = css`
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.92);
  padding: 1rem;
  min-height: 6rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.5rem;
`;

const myContributionValueCls = css`
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1.2;
`;

const subtleLabelCls = css`
  font-size: 0.98rem;
  line-height: 1.45;
  color: ${Color.darkGray()};
`;

const impactGridCls = css`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;
