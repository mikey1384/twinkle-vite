import { getBasePageTitle } from '~/helpers/pageTitles';
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
  | 'build_view'
  // Lumine Build
  | 'build_create'
  | 'build_fork'
  | 'build_publish'
  | 'build_reward_review_request'
  | 'lumine_request_send'
  // Daily habits
  | 'daily_reflection_submit'
  | 'daily_reflection_share'
  | 'wordle_complete'
  | 'grammarbles_complete'
  | 'chess_puzzle_complete'
  // Economy (GA4 standard name) and the AI Card market
  | 'spend_virtual_currency'
  | 'ai_card_buy'
  | 'ai_card_list'
  | 'ai_card_offer'
  | 'ai_card_sell'
  // Sign-up funnel
  | 'sign_in_open'
  | 'sign_up_email_verify'
  | 'guardian_consent_request'
  | 'guardian_consent_decision'
  // Where people click through from
  | 'featured_click'
  | 'feed_item_open'
  | 'notification_open'
  | 'earn_app_open'
  // Zero/Ciel voice
  | 'voice_call_start'
  // Reliability (GA4 standard name)
  | 'exception';

type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

function gtagAvailable() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

let analyticsCommandGate: ReturnType<typeof createAnalyticsCommandGate> | null =
  null;

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
  const pageLocation = sanitizeAnalyticsUrl(path);
  const rawReferrer = referrerPath || document.referrer;
  const pageReferrer = rawReferrer ? sanitizeAnalyticsUrl(rawReferrer) : '';
  const pageTitle = getBasePageTitle(pathname);
  // Later events inherit the same stable title and cleaned URL, rather than
  // a content-specific tab title or its unread-notification marker.
  send('set', {
    page_location: pageLocation,
    page_title: pageTitle,
    ...(pageReferrer ? { page_referrer: pageReferrer } : {})
  });
  send('event', 'page_view', {
    page_location: pageLocation,
    page_path: new URL(pageLocation).pathname,
    ...(pageReferrer ? { page_referrer: pageReferrer } : {}),
    page_title: pageTitle
  });
}

// The cleaner lives in index.html (window.twinkleAnalyticsUrl) so the very
// first gtag config uses it too. Without it, send nothing identifying: the
// site origin alone.
export function sanitizeAnalyticsUrl(input: string) {
  if (typeof window.twinkleAnalyticsUrl === 'function') {
    return window.twinkleAnalyticsUrl(input);
  }
  return `${window.location.origin}/`;
}

// Coins spent on something, in GA4's standard virtual-currency shape. Pass
// value only when the server's response states the amount.
export function trackCoinSpend(itemName: string, value?: number | null) {
  trackEvent('spend_virtual_currency', {
    virtual_currency_name: 'Twinkle Coins',
    item_name: itemName,
    value: typeof value === 'number' && value > 0 ? value : undefined
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
