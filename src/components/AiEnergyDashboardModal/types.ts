export type DashboardSection = 'overview' | 'community' | 'leaderboard';

export interface AiEnergyDashboardModalProps {
  onHide: () => void;
  modalLevel?: number;
}

export interface FundStats {
  sponsoredMessagesToday: number;
  totalSpentToday: number;
  totalDonors: number;
  totalDonationsAllTime: number;
}

export interface DonorLeaderboard {
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

export interface CommunityFundRequirement {
  key: string;
  label: string;
  done: boolean;
  current?: number;
  required?: number;
}

export interface AiUsagePolicy {
  dayIndex?: number;
  dayKey?: string;
  baseEnergyUnitsPerDay?: number;
  energyLimit?: number;
  energyUsed?: number;
  energyCharged?: number;
  energyOverflow?: number;
  energyRemaining?: number;
  energyPercent?: number;
  energySegments?: number;
  energySegmentsRemaining?: number;
  energyUnitsPerSegment?: number;
  lowEnergyUsed?: number;
  currentMode?: 'full_quality' | 'low_energy';
  lastUsageOverflowed?: boolean;
  resetCost?: number;
  resetPurchasesToday?: number;
  repliesPerDay?: number;
  repliesToday?: number;
  repliesRemaining?: number;
  freeRepliesToday?: number;
  paidRepliesToday?: number;
  communityFundRechargeCoinsToday?: number;
  communityFundRechargeCoinsRemaining?: number;
  communityFundRechargeCoinsDailyCap?: number;
  communityFundResetEligibility?: {
    eligible: boolean;
    requirements: CommunityFundRequirement[];
  };
}

export interface SectionMeta {
  icon: string;
  title: string;
  subtitle: string;
}

export interface TodayStatsSummary {
  aiCallDuration?: number;
  loaded?: boolean;
  xpEarned?: number;
}
