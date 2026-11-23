import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

// The suggestion chips above Zero and Ciel's boxes (Quick Ask, the Home box):
// about the page the member is on and what they really did lately (Mikey
// 11-23: "quick ask suggestion badges dont seem any related to the page im
// looking at or what i am doing"). A chip that is about something carries it
// as an Ask context, the same one Ask buttons send, so the server re-reads
// the real thing. Built from the route and client state plus one cached
// read of the member's own recent activity; no AI call and no polling. A
// chip never names something they don't have, never spoils today's Wordle
// (its word comes only after they finished) and never says anything about
// another member.

export {
  buildAskSuggestions,
  type AskActivity,
  type AskSuggestion
} from './askSuggestionRules';
import { buildAskSuggestions, type AskActivity } from './askSuggestionRules';

// The Home box, Quick Ask and the chat share one read per minute.
const STARTERS_TTL_MS = 60_000;
let cached: {
  userId: number;
  at: number;
  promise: Promise<{ ideas: string[]; activity: AskActivity }>;
} | null = null;

export function loadAskStarters(
  load: () => Promise<any>,
  userId: number
): Promise<{ ideas: string[]; activity: AskActivity }> {
  if (cached && cached.userId === userId && Date.now() - cached.at < STARTERS_TTL_MS) {
    return cached.promise;
  }
  const promise = Promise.resolve(load()).then((result: any) => ({
    ideas: Array.isArray(result?.ideas) ? result.ideas : [],
    activity:
      result?.activity && typeof result.activity === 'object' ? result.activity : {}
  }));
  cached = { userId, at: Date.now(), promise };
  promise.catch(() => {
    if (cached?.promise === promise) cached = null;
  });
  return promise;
}

export function useAskStarters() {
  const userId = useKeyContext((v) => Number(v.myState.userId || 0));
  const loadWebsiteAgentStarters = useAppContext(
    (v) => v.requestHelpers.loadWebsiteAgentStarters
  );
  const [data, setData] = useState<{
    ideas: string[];
    activity: AskActivity;
    loaded: boolean;
  }>({ ideas: [], activity: {}, loaded: false });
  useEffect(() => {
    if (!userId || !loadWebsiteAgentStarters) return;
    let cancelled = false;
    loadAskStarters(loadWebsiteAgentStarters, userId)
      .then((result) => {
        if (!cancelled) setData({ ...result, loaded: true });
      })
      .catch(() => {
        if (!cancelled) setData((current) => ({ ...current, loaded: true }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  return data;
}

// The chips for the page the member is on now.
export function useAskSuggestions({
  activity,
  fallback
}: {
  activity: AskActivity;
  fallback: string[];
}) {
  const { pathname, search } = useLocation();
  const chatType = useChatContext((v) => v.state.chatType);
  const lastChatMessage = useChatContext((v) => {
    if (!pathname.startsWith('/chat')) return '';
    const channel = v.state.channelsObj?.[Number(v.state.selectedChannelId || 0)];
    // a Bridge Builder crew's talk is other children's, never sent along
    if (Number(channel?.settings?.meetupCrewId) > 0) return '';
    const lastId = channel?.messageIds?.[0];
    const message = lastId ? channel?.messagesObj?.[lastId] : null;
    return typeof message?.content === 'string' ? message.content : '';
  });
  const myUsername = useKeyContext((v) => v.myState.username || '');
  return useMemo(
    () =>
      buildAskSuggestions({
        pathname,
        search,
        activity,
        chatType,
        lastChatMessage,
        myUsername,
        fallback
      }),
    [pathname, search, activity, chatType, lastChatMessage, myUsername, fallback]
  );
}
