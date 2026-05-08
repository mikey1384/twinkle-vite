import { addCommasToNumber } from '~/helpers/stringHelpers';
import type {
  CommunityFundRequirement,
  DashboardSection,
  DonorLeaderboard,
  FundStats,
  SectionMeta
} from './types';

export const FULL_RECHARGE_COST = 1000000;

export const defaultFundStats: FundStats = {
  sponsoredMessagesToday: 0,
  totalSpentToday: 0,
  totalDonors: 0,
  totalDonationsAllTime: 0
};

export const defaultDonorData: DonorLeaderboard = {
  donors: [],
  myDonationRank: null,
  myTotalDonated: 0
};

export function isCommunityRechargeRequirement(
  requirement: CommunityFundRequirement
) {
  return (
    requirement?.key === 'chess_puzzle_xp' ||
    requirement?.key === 'lumine_build_generation' ||
    requirement?.label === 'Chess puzzle XP' ||
    requirement?.label === 'Lumine build generation'
  );
}

export function getSectionMeta(section: DashboardSection): SectionMeta {
  switch (section) {
    case 'community':
      return {
        icon: 'heart',
        title: 'Community Recharges',
        subtitle: 'Tasks and fund support for sponsored AI battery charges.'
      };
    case 'leaderboard':
      return {
        icon: 'users',
        title: 'Donor Leaderboard',
        subtitle: 'Top contributors supporting community-sponsored recharges.'
      };
    default:
      return {
        icon: 'bolt',
        title: 'AI Energy Dashboard',
        subtitle: 'Battery and community-sponsored recharges.'
      };
  }
}

export function formatRechargeCount(count: number) {
  const normalizedCount = Math.max(0, count);
  return `${addCommasToNumber(normalizedCount)} full ${
    normalizedCount === 1 ? 'recharge' : 'recharges'
  }`;
}

export function formatCoins(amount: number) {
  return `${addCommasToNumber(Math.max(0, Math.trunc(amount || 0)))} coins`;
}

export function formatEnergyUnits(amount: number) {
  return `${addCommasToNumber(Math.max(0, Math.trunc(amount || 0)))} units`;
}

export function formatSignedXp(amount: number) {
  const normalizedAmount = Math.trunc(amount || 0);
  return `${normalizedAmount > 0 ? '+' : ''}${addCommasToNumber(
    normalizedAmount
  )} XP`;
}

export function formatDuration(totalSeconds: number) {
  const normalizedSeconds = Math.max(0, Math.floor(totalSeconds || 0));

  if (normalizedSeconds < 60) {
    return `${normalizedSeconds}s`;
  }

  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);
  const seconds = normalizedSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (normalizedSeconds < 600 && seconds > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${minutes}m`;
}

export function withAlpha(color: string, alpha: number) {
  const rgbaMatch = color.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)/
  );

  if (!rgbaMatch) return color;

  return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${alpha})`;
}

export function errorHasActualCommunityFundsBalance(error?: {
  code?: string | null;
}) {
  return (
    error?.code === 'zero_ciel_ai_usage_reset_insufficient_community_funds'
  );
}
