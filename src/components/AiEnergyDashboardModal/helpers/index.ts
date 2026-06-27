import { addCommasToNumber } from '~/helpers/stringHelpers';
import type {
  CommunityFundRequirement,
  DashboardSection,
  DonorLeaderboard,
  FundStats,
  SectionMeta
} from '../types';

export const FULL_RECHARGE_COST = 500000;

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
    case 'usage':
      return {
        icon: 'clock-rotate-left',
        title: "Today's Usage",
        subtitle: 'How much energy each request used today.'
      };
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

// Maps the ai_usage_events `aiUsername` (the AI Energy surface) to a friendly
// label. Values are already display-grade (Zero, Ciel, Lumine, AI Card, ...);
// the chat characters get a clearer label.
const AI_USAGE_SURFACE_LABELS: Record<string, string> = {
  Zero: 'Chat with Zero',
  Ciel: 'Chat with Ciel',
  Lumine: 'Build (Lumine)'
};

export function getAiUsageSurfaceLabel(aiUsername: string) {
  const normalized = (aiUsername || '').trim();
  if (!normalized) return 'AI Usage';
  return AI_USAGE_SURFACE_LABELS[normalized] || normalized;
}

// Prettifies the ai_usage_events `targetType` for a small context line.
const AI_USAGE_TARGET_LABELS: Record<string, string> = {
  voice_call: 'voice call',
  message_tts: 'text-to-speech',
  build_generation: 'build generation',
  build_ai_chat: 'build chat',
  build_tag_refresh: 'tag refresh',
  ai_card_generation: 'card summon',
  ai_card_image_reveal: 'card reveal',
  ai_story_image_generation: 'story image',
  ai_image_generation: 'image',
  ai_image_followup: 'image edit',
  daily_reflection_share: 'reflection',
  chat_topic: 'topic'
};

export function getAiUsageTargetLabel(targetType: string) {
  const normalized = (targetType || '').trim();
  if (!normalized) return '';
  return (
    AI_USAGE_TARGET_LABELS[normalized] || normalized.split('_').join(' ')
  );
}

// Converts raw energy units into the battery scale where 100 = a full battery
// and 1 = one unit of the battery (no percent sign). `fullBatteryUnits` is the
// raw unit count for a full battery, returned alongside the usage history.
export function formatBatteryUnits(rawUnits: number, fullBatteryUnits: number) {
  const rawPerDisplayUnit = Math.max(1, (fullBatteryUnits || 0) / 100);
  const value = Math.max(0, Number(rawUnits) || 0) / rawPerDisplayUnit;
  if (value <= 0) return '0';
  if (value < 0.1) return '<0.1';
  if (value < 10) return value.toFixed(1);
  return addCommasToNumber(Math.round(value));
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
