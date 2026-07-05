import { getSectionFromPathname } from '~/helpers';
import { capitalize } from '~/helpers/stringHelpers';

// GA4 event names sent by the app. Standard GA4 names (sign_up, login,
// search) are used where they exist so GA's built-in reports pick them up.
export type AnalyticsEventName =
  | 'sign_up'
  | 'login'
  | 'logout'
  | 'chat_message_send'
  | 'vocab_word_collect'
  | 'ai_card_summon'
  | 'content_post'
  | 'content_like'
  | 'content_recommend'
  | 'video_play'
  | 'search'
  | 'ai_story_start'
  | 'ai_story_complete'
  | 'mission_complete'
  | 'daily_reward_collect'
  | 'build_view';

type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export const contentSubsectionTitles: Record<string, string> = {
  comments: 'Comment',
  links: 'Link',
  missions: 'Mission',
  playlists: 'Playlist',
  subjects: 'Subject',
  videos: 'Video',
  'ai-cards': 'AI Card',
  'ai-stories': 'AI Story',
  'daily-reflections': 'Daily Reflection',
  'mission-passes': 'Mission Pass',
  'achievement-unlocks': 'Achievement',
  'daily-rewards': 'Daily Goal',
  'shared-prompts': 'Shared Prompt'
};

const sectionTitleOverrides: Record<string, string> = {
  app: 'Build App',
  'app-capture': 'Build App',
  build: 'Build',
  chat: 'Chat',
  'ai-cards': 'Explore AI Cards',
  'ai-stories': 'AI Stories'
};

// Deterministic, synchronous title for a pathname. This is what page_view
// reports under "page title" — pages with richer async titles (content
// pages, build apps) additionally send identity via events/document.title
// once their data loads.
export function getBasePageTitle(pathname: string): string {
  const { section, isSubsection } = getSectionFromPathname(pathname) || {};
  if (!section || section === 'home') return 'Twinkle';
  const subsectionTitle = isSubsection ? contentSubsectionTitles[section] : '';
  const displayedSection =
    subsectionTitle || sectionTitleOverrides[section] || section;
  return `${
    subsectionTitle ? displayedSection : capitalize(displayedSection)
  } | Twinkle`;
}

function gtagAvailable() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

function send(command: string, ...args: any[]) {
  if (!import.meta.env.PROD) {
    // Dev traffic must not pollute production analytics; log for E2E checks.
    console.debug('[analytics]', command, ...args);
    return;
  }
  if (!gtagAvailable()) return;
  window.gtag(command, ...args);
}

export function trackPageView({ path }: { path: string }) {
  const pathname = path.split('?')[0].split('#')[0];
  // /app-capture is only ever visited by the server's headless thumbnail
  // capture browser — never count it as traffic.
  if (pathname.startsWith('/app-capture')) return;
  send('event', 'page_view', {
    page_location: `${window.location.origin}${path}`,
    page_path: pathname,
    page_title: getBasePageTitle(pathname)
  });
}

export function trackEvent(name: AnalyticsEventName, params?: AnalyticsParams) {
  const cleaned: AnalyticsParams = {};
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null) cleaned[key] = value;
  }
  send('event', name, cleaned);
}

// Call with the server-canonical user payload (login/signup response or
// /user/session init). Never derive these from cached/local state.
export function setAnalyticsUser(user: {
  id: number;
  userType?: string;
  level?: number;
  achievementPoints?: number;
  joinDate?: number | string;
}) {
  if (!user?.id) return;
  send('set', { user_id: String(user.id) });
  send('set', 'user_properties', {
    user_type: user.userType || 'student',
    user_level: typeof user.level === 'number' ? String(user.level) : undefined,
    achievement_points:
      typeof user.achievementPoints === 'number'
        ? String(user.achievementPoints)
        : undefined,
    join_year: user.joinDate
      ? String(new Date(Number(user.joinDate) * 1000).getFullYear())
      : undefined
  });
}

export function clearAnalyticsUser() {
  send('set', { user_id: null });
  send('set', 'user_properties', {
    user_type: null,
    user_level: null,
    achievement_points: null,
    join_year: null
  });
}
