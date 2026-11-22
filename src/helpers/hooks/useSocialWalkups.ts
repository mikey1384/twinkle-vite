import { useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import { trackEvent } from '~/helpers/analytics';
import {
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

// What the app receives through Twinkle.notifications.getLaunchTarget().
export function socialLaunchTarget(buildId: number, visit: SocialVisit) {
  return {
    source: 'social',
    buildId,
    target: {
      kind: 'social',
      hostUserId: visit.host.id,
      hostUsername: visit.host.username,
      // waiting | later | watch | unavailable
      status: visit.status,
      hostJoinable: visit.joinable
    }
  };
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
 * Walk up to a member in an app, then open the app aimed at them. Whatever
 * the server answers, the member ends up in the app: next in line, watching,
 * or simply playing on their own.
 */
export function useWalkUp() {
  const navigate = useNavigate();
  const walkUpToMember = useAppContext((v) => v.requestHelpers.walkUpToMember);
  const walkAwayFromMember = useAppContext((v) => v.requestHelpers.walkAwayFromMember);
  return async function walkUp({
    buildId,
    host,
    intent,
    source
  }: {
    buildId: number;
    host: SocialPerson;
    intent: JoinIntent;
    source: 'live_now' | 'profile' | 'card';
  }) {
    const outcome = await walkUpToMember({
      buildId,
      hostUserId: host.id,
      intent,
      // this page can take a drop-in (the host is in an open room)
      dropIn: true
    });
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
          joinable: outcome.joinable
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
  };
}
