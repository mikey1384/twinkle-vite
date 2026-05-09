import { getStoredItem } from '~/helpers/userDataHelpers';

export type ChatChessTheme =
  | 'DEFAULT'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT'
  | 'LEGENDARY'
  | 'GENIUS'
  | 'LEVEL_42';

const chatChessThemeUnlockOrder: ChatChessTheme[] = [
  'DEFAULT',
  'INTERMEDIATE',
  'ADVANCED',
  'EXPERT',
  'LEGENDARY',
  'GENIUS'
];

export function getAllowedChatChessThemes(
  maxLevelUnlocked: number
): ChatChessTheme[] {
  const maxTheme = getMaxUnlockedChatChessTheme(maxLevelUnlocked);
  const maxIndex = chatChessThemeUnlockOrder.indexOf(maxTheme);
  const base = chatChessThemeUnlockOrder.slice(0, maxIndex + 1);
  return maxLevelUnlocked >= 42 ? [...base, 'LEVEL_42'] : base;
}

function getMaxUnlockedChatChessTheme(level: number): ChatChessTheme {
  if (level >= 37) return 'GENIUS';
  if (level >= 31) return 'LEGENDARY';
  if (level >= 25) return 'EXPERT';
  if (level >= 20) return 'ADVANCED';
  if (level >= 15) return 'INTERMEDIATE';
  return 'DEFAULT';
}

export function mapThemeToColors(
  theme?: string | null
): { light?: string; dark?: string } | undefined {
  switch (theme) {
    case 'INTERMEDIATE':
      return { light: '#dbeafe', dark: '#93c5fd' };
    case 'ADVANCED':
      return { light: '#e2e8f0', dark: '#94a3b8' };
    case 'EXPERT':
      return { light: '#ede9fe', dark: '#c4b5fd' };
    case 'LEGENDARY':
      return { light: '#fee2e2', dark: '#fca5a5' };
    case 'GENIUS':
      return { light: '#fef3c7', dark: '#fbbf24' };
    case 'LEVEL_42':
      return { light: '#e0e7ff', dark: '#556377' };
    case 'DEFAULT':
    default:
      return undefined;
  }
}

export function getUserChatTheme(userId?: number | null): string | null {
  if (!userId) return null;
  return getStoredItem(`tw-chat-chess-theme-${userId}`) || null;
}

export function getUserChatSquareColors(
  userId?: number | null
): { light?: string; dark?: string } | undefined {
  return mapThemeToColors(getUserChatTheme(userId));
}
