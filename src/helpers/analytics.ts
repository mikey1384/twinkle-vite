import { getSectionFromPathname } from '~/helpers';
import { capitalize } from '~/helpers/stringHelpers';
import {
  createAnalyticsCommandGate,
  type AnalyticsCommand
} from '~/helpers/analyticsCommandGate';

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

let analyticsCommandGate: ReturnType<
  typeof createAnalyticsCommandGate
> | null = null;

function analyticsAvailable() {
  if (!import.meta.env.PROD) {
    // Dev traffic must not pollute production analytics.
    return false;
  }
  return window.twinkleAnalyticsEnabled === true && gtagAvailable();
}

function getAnalyticsCommandGate() {
  if (!analyticsCommandGate) {
    analyticsCommandGate = createAnalyticsCommandGate(
      window.twinkleAnalyticsIdentityReady === true
    );
  }
  return analyticsCommandGate;
}

function dispatchCommand([command, ...args]: AnalyticsCommand) {
  if (!analyticsAvailable()) return;
  window.gtag(command, ...args);
}

function send(command: string, ...args: any[]) {
  if (!analyticsAvailable()) return;
  getAnalyticsCommandGate().enqueue([command, ...args], dispatchCommand);
}

function sendImmediately(command: string, ...args: any[]) {
  dispatchCommand([command, ...args]);
}

function resolveAnalyticsIdentity() {
  if (!analyticsAvailable()) return;
  const commandGate = getAnalyticsCommandGate();
  window.twinkleAnalyticsIdentityReady = true;
  window.twinkleConfigureAnalytics();
  commandGate.resolve(dispatchCommand);
}

export function trackPageView({
  path,
  referrerPath
}: {
  path: string;
  referrerPath?: string | null;
}) {
  const pathname = path.split('?')[0].split('#')[0];
  // /app-capture is only ever visited by the server's headless thumbnail
  // capture browser — never count it as traffic.
  if (pathname.startsWith('/app-capture')) return;
  const pageReferrer = referrerPath
    ? `${window.location.origin}${referrerPath}`
    : document.referrer;
  send('event', 'page_view', {
    page_location: `${window.location.origin}${path}`,
    page_path: pathname,
    ...(pageReferrer ? { page_referrer: pageReferrer } : {}),
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
  sendImmediately('set', { user_id: String(user.id) });
  sendImmediately('set', 'user_properties', {
    user_type: user.userType || undefined,
    user_level: typeof user.level === 'number' ? String(user.level) : undefined,
    achievement_points:
      typeof user.achievementPoints === 'number'
        ? String(user.achievementPoints)
        : undefined,
    join_year: user.joinDate
      ? String(new Date(Number(user.joinDate) * 1000).getFullYear())
      : undefined
  });
  resolveAnalyticsIdentity();
}

export function clearAnalyticsUser() {
  sendImmediately('set', { user_id: null });
  sendImmediately('set', 'user_properties', {
    user_type: null,
    user_level: null,
    achievement_points: null,
    join_year: null
  });
  resolveAnalyticsIdentity();
}
