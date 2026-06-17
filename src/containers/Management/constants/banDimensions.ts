export interface BanDimension {
  key: string;
  label: string;
}

// Single source of truth for the per-user feature ban dimensions stored in
// `users.banned`. Adding a feature ban is a one-line addition here; the ban
// modals and the banned-users table all render from this list. (Enforcement is
// still per-feature on the backend via featureBanGuard / inline checks.)
export const BAN_DIMENSIONS: BanDimension[] = [
  { key: 'all', label: 'Log In' },
  { key: 'posting', label: 'Posting' },
  { key: 'chat', label: 'Chat' },
  { key: 'chess', label: 'Chess' },
  { key: 'build', label: 'Build' },
  { key: 'aiCards', label: 'AI Cards' },
  { key: 'aiChat', label: 'AI Chat' }
];

export const EMPTY_BAN_STATUS: Record<string, boolean> = BAN_DIMENSIONS.reduce(
  (acc, dimension) => ({ ...acc, [dimension.key]: false }),
  {} as Record<string, boolean>
);
