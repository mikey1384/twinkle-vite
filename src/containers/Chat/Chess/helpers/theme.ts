export type ChatChessTheme =
  | 'DEFAULT'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT'
  | 'LEGENDARY'
  | 'GENIUS'
  | 'LEVEL_42';

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
  try {
    return localStorage.getItem(`tw-chat-chess-theme-${userId}`);
  } catch {
    return null;
  }
}

export function getUserChatSquareColors(
  userId?: number | null
): { light?: string; dark?: string } | undefined {
  return mapThemeToColors(getUserChatTheme(userId));
}
