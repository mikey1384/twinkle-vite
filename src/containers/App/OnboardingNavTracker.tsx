import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext, useKeyContext } from '~/contexts';

// Bridge Builder beta watch (Mikey 11-21): where a friend someone brought to
// Twinkle goes in their first two weeks. Only accounts younger than 14 days
// send anything, only the route's path (no query, no content), at most once
// per route per tab session; the server records it only for friends who came
// from an invite or a tour. Renders nothing.
const ONBOARD_SECONDS = 14 * 86400;
const SESSION_KEY = 'twinkle:onboard-nav-session';
// Keep dynamic segments (usernames, invitation tokens, app URLs) in the
// browser. The API accepts only these fixed section paths.
const TRACKED_SECTIONS = new Set([
  'achievements', 'ai-cards', 'ai-stories', 'app', 'arena', 'bridge-builder',
  'build', 'chat', 'daily-reflection', 'earn', 'explore', 'friends',
  'grammarbles', 'groups', 'links', 'missions', 'my-classes', 'playlists',
  'prompts', 'settings', 'shared-prompts', 'subjects', 'users', 'videos'
]);

function sectionPath(pathname: string) {
  if (pathname === '/') return '/';
  const section = pathname.split('/')[1];
  return TRACKED_SECTIONS.has(section) ? `/${section}` : '';
}

export default function OnboardingNavTracker() {
  const location = useLocation();
  const userId = useKeyContext((v) => v.myState.userId);
  const joinDate = useKeyContext((v) => v.myState.joinDate);
  const trackOnboardingNav = useAppContext(
    (v) => v.requestHelpers.trackOnboardingNav
  );
  const sent = useRef({ userId: 0, routes: new Set<string>() });

  useEffect(() => {
    if (!userId || !joinDate) return;
    if (Math.floor(Date.now() / 1000) - Number(joinDate) > ONBOARD_SECONDS)
      return;
    const route = sectionPath(location.pathname);
    if (sent.current.userId !== userId) {
      sent.current = { userId, routes: new Set<string>() };
    }
    if (!route || sent.current.routes.has(route)) return;
    sent.current.routes.add(route);
    let sessionStart = false;
    try {
      if (!sessionStorage.getItem(`${SESSION_KEY}:${userId}`)) {
        sessionStorage.setItem(`${SESSION_KEY}:${userId}`, '1');
        sessionStart = true;
      }
    } catch (_error) {
      // storage can be blocked; the route still counts
    }
    void trackOnboardingNav({ route, sessionStart });
    // the request helper is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, userId, joinDate]);

  return null;
}
