import { useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import { useToast } from '~/contexts/Toast';
import { trackEvent } from '~/helpers/analytics';
import {
  isSocialRoomKey,
  joinNotice,
  socialLaunchTarget,
  socialJoinableStore,
  socialWalkupStore,
  type JoinIntent,
  type SocialPerson,
  type SocialVisit
} from '~/helpers/socialWalkups';

/** This page's walk-up state for one app (host queue and own visit). */
export function useSocialBuildState(buildId: number) {
  return useSyncExternalStore(socialWalkupStore.subscribe, () =>
    socialWalkupStore.get(buildId)
  );
}

/** What this page's app last asked for with Twinkle.social.setJoinable. */
export function useOwnJoinable(buildId: number) {
  return useSyncExternalStore(socialJoinableStore.subscribe, () =>
    socialJoinableStore.get(buildId)
  );
}

// A drop-in (the host is in an open room): the visitor's app joins roomKey.
export function dropInLaunchTarget(
  buildId: number,
  outcome: {
    host: SocialPerson;
    joinable: any;
    matchKey: string;
    roomKey: string;
  }
) {
  return {
    source: 'social',
    buildId,
    target: {
      kind: 'social',
      hostUserId: outcome.host.id,
      hostUsername: outcome.host.username,
      status: 'drop-in',
      hostJoinable: outcome.joinable,
      roomKey: outcome.roomKey,
      matchKey: outcome.matchKey
    }
  };
}

/**
 * Walk up to a member in an app, then open the app aimed at them: next in
 * line, watching, dropped into their room, or (after a neutral refusal)
 * simply playing on their own. Two answers do not open the app
 * (INCIDENT 2026-11-22): 'retry' (Twinkle could not check or join just now)
 * and 'gone' (the host is not in the app any more). The member is told so,
 * with a tap to try again or to open the app anyway.
 */
export function useWalkUp() {
  const navigate = useNavigate();
  const showToast = useToast();
  const walkUpToMember = useAppContext((v) => v.requestHelpers.walkUpToMember);
  const walkAwayFromMember = useAppContext((v) => v.requestHelpers.walkAwayFromMember);
  return async function walkUp(args: {
    buildId: number;
    host: SocialPerson;
    intent: JoinIntent;
    source: 'live_now' | 'profile' | 'card';
  }): Promise<void> {
    const { buildId, host, intent, source } = args;
    const outcome = await walkUpToMember({
      buildId,
      hostUserId: host.id,
      intent,
      // this page can take a drop-in (the host is in an open room)
      dropIn: true
    });
    const notice = joinNotice(outcome?.status, host.username);
    if (notice) {
      trackEvent('social_walkup', {
        app_id: buildId,
        intent,
        outcome: notice.kind,
        source
      });
      showToast({
        message: notice.message,
        duration: 8000,
        onClick:
          notice.kind === 'retry'
            ? () => void walkUp(args)
            : () => navigate(`/app/${buildId}`)
      });
      return;
    }
    return land({ buildId, host, intent, source, outcome });
  };

  function land({
    buildId,
    host,
    intent,
    source,
    outcome
  }: {
    buildId: number;
    host: SocialPerson;
    intent: JoinIntent;
    source: 'live_now' | 'profile' | 'card';
    outcome: any;
  }) {
    if (
      outcome?.status === 'drop-in' &&
      outcome.host?.id === host.id &&
      typeof outcome.matchKey === 'string' &&
      typeof outcome.roomKey === 'string'
    ) {
      // One tap and they're in: no queue, no note over the app. The app
      // gets the match through onMatchReady and the launch target.
      const previous = socialWalkupStore.get(buildId).visit;
      if (previous?.status === 'waiting' && previous.walkupId) {
        void walkAwayFromMember({ buildId, walkupId: previous.walkupId });
      }
      socialWalkupStore.setVisit(buildId, null);
      socialWalkupStore.deliver({
        type: 'matchReady',
        buildId,
        matchKey: outcome.matchKey,
        mode: outcome.mode || 'room',
        host: outcome.host,
        dropIn: true,
        roomKey: outcome.roomKey
      });
      trackEvent('social_walkup', {
        app_id: buildId,
        intent,
        outcome: 'drop-in',
        source
      });
      navigate(`/app/${buildId}`, {
        state: { buildLaunchTarget: dropInLaunchTarget(buildId, outcome) }
      });
      return;
    }
    const hasVisit =
      (outcome?.status === 'waiting' ||
        outcome?.status === 'later' ||
        outcome?.status === 'watch') &&
      outcome.host?.id === host.id;
    const canTarget =
      hasVisit &&
      (outcome.status !== 'later' || outcome.joinable?.state === 'busy-watchable');
    const visit: SocialVisit = hasVisit
      ? {
          host: outcome.host,
          status: outcome.status,
          walkupId: outcome.walkup?.id || null,
          expiresAt: outcome.walkup?.expiresAt,
          joinable: outcome.joinable,
          ...(outcome.status === 'watch' && isSocialRoomKey(outcome.roomKey)
            ? { roomKey: outcome.roomKey }
            : {})
        }
      : { host, status: 'unavailable', walkupId: null, joinable: null };
    const previous = socialWalkupStore.get(buildId).visit;
    if (intent === 'watch' && previous?.status === 'waiting' && previous.walkupId) {
      void walkAwayFromMember({ buildId, walkupId: previous.walkupId });
    }
    socialWalkupStore.setVisit(
      buildId,
      hasVisit || source === 'card' ? visit : null
    );
    trackEvent('social_walkup', {
      app_id: buildId,
      intent,
      outcome: visit.status,
      source
    });
    navigate(`/app/${buildId}`, {
      state: canTarget ? { buildLaunchTarget: socialLaunchTarget(buildId, visit) } : null
    });
  }
}
