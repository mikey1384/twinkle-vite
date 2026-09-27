import { SITE_NAME } from '~/constants/siteBrand';
import WelcomerBadge from '~/assets/brought-friends/tier1-welcomer.webp';
import GathererBadge from '~/assets/brought-friends/tier2-gatherer.webp';
import BeaconBadge from '~/assets/brought-friends/tier3-beacon.webp';
import PathfinderBadge from '~/assets/brought-friends/tier4-pathfinder.webp';
import LighthouseBadge from '~/assets/brought-friends/tier5-lighthouse.webp';
import ConstellationBadge from '~/assets/brought-friends/tier6-constellation.webp';

// "Brought N people to Twinkle" honour tiers (count of people who joined
// because of this user; twinkle-api helpers/user/referrals.ts).
export const BROUGHT_FRIENDS_ANCHOR_ID = 'profile-brought-friends';

export interface BroughtFriendsTier {
  min: number;
  name: string;
  badgeSrc: string;
  // rim colour of the painted medallion, used for the frame and accents
  color: string;
}

export const BROUGHT_FRIENDS_TIERS: BroughtFriendsTier[] = [
  { min: 1, name: 'Welcomer', badgeSrc: WelcomerBadge, color: '#d59a5c' },
  { min: 5, name: 'Gatherer', badgeSrc: GathererBadge, color: '#c9d3df' },
  { min: 10, name: 'Beacon', badgeSrc: BeaconBadge, color: '#4fd1bd' },
  {
    min: 25,
    name: 'Pathfinder',
    badgeSrc: PathfinderBadge,
    color: '#b394ff'
  },
  {
    min: 50,
    name: 'Lighthouse',
    badgeSrc: LighthouseBadge,
    color: '#f5c451'
  },
  {
    min: 100,
    name: 'Constellation',
    badgeSrc: ConstellationBadge,
    color: '#ffd9f6'
  }
];

export interface Referrals {
  count: number;
  recent: {
    userId: number;
    username: string;
    profilePicUrl: string | null;
    joinedAt: number;
    source: 'guest' | 'minecraft';
  }[];
}

export function getBroughtFriendsTier(count: number) {
  let tier: BroughtFriendsTier | null = null;
  for (const candidate of BROUGHT_FRIENDS_TIERS) {
    if (count >= candidate.min) tier = candidate;
  }
  return tier;
}

export function getNextBroughtFriendsTier(count: number) {
  return BROUGHT_FRIENDS_TIERS.find((tier) => count < tier.min) || null;
}

export function broughtFriendsHeadline(count: number) {
  return `Brought ${count.toLocaleString()} ${
    count === 1 ? 'person' : 'people'
  } to ${SITE_NAME}`;
}

/** The canonical referrals from the server, or null when not loaded. */
export function readReferrals(value: any): Referrals | null {
  if (!value || typeof value !== 'object') return null;
  const count = Number(value.count);
  if (!Number.isFinite(count) || count < 0) return null;
  return {
    count,
    recent: Array.isArray(value.recent) ? value.recent : []
  };
}
