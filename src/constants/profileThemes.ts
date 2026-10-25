// The profile theme ladder, cheapest first. The server enforces the same XP
// (twinkle-api helpers/user/profileThemes.ts). Platinum (Mikey 2026-10-24) is
// the final theme, and the only one whose cover can carry the member's photo.
export const PLATINUM_THEME = 'platinum';

export const PROFILE_THEME_LADDER: ReadonlyArray<{
  theme: string;
  label: string;
  xp: number;
}> = [
  { theme: 'logoBlue', label: 'Twinkle Blue', xp: 0 },
  { theme: 'green', label: 'Green', xp: 0 },
  { theme: 'orange', label: 'Orange', xp: 0 },
  { theme: 'pink', label: 'Pink', xp: 0 },
  { theme: 'black', label: 'Black', xp: 35_000 },
  { theme: 'rose', label: 'Rose', xp: 70_000 },
  { theme: 'purple', label: 'Purple', xp: 100_000 },
  { theme: 'darkBlue', label: 'Navy', xp: 500_000 },
  { theme: 'vantaBlack', label: 'Vanta Black', xp: 1_000_000 },
  { theme: 'red', label: 'Red', xp: 1_500_000 },
  { theme: 'gold', label: 'Gold', xp: 10_000_000 },
  { theme: PLATINUM_THEME, label: 'Platinum', xp: 100_000_000 }
];

export const PROFILE_THEME_XP: Readonly<Record<string, number>> =
  Object.fromEntries(PROFILE_THEME_LADDER.map((t) => [t.theme, t.xp]));

export function profileThemeLabel(theme: string) {
  return PROFILE_THEME_LADDER.find((t) => t.theme === theme)?.label || theme;
}

export function canUseProfileTheme(theme: string, twinkleXP: number) {
  return Number(twinkleXP || 0) >= (PROFILE_THEME_XP[theme] ?? Infinity);
}

// A platinum cover shows a photo only on the platinum theme.
export function platinumCoverOf(user: any, theme?: string) {
  const isPlatinum = (theme || user?.profileTheme) === PLATINUM_THEME;
  return {
    isPlatinum,
    photoUrl: isPlatinum ? user?.profileCoverUrl || null : null,
    position: user?.profileCoverPosition || '50,50',
    shine:
      user?.profileCoverShine === undefined || user?.profileCoverShine === null
        ? true
        : Boolean(Number(user.profileCoverShine))
  };
}
