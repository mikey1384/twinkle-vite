import { useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import { trackEvent } from '~/helpers/analytics';
import {
  socialJoinableStore,
  socialWalkupStore,
  type JoinIntent,
  type Joinable,
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

/**
 * Walk up to a member in an app, then open the app aimed at them. Whatever
 * the server answers, the member ends up in the app: next in line, watching,
 * or simply playing on their own.
 */
export function useWalkUp() {
  const navigate = useNavigate();
  const walkUpToMember = useAppContext((v) => v.requestHelpers.walkUpToMember);
  return async function walkUp({
    buildId,
    host,
    joinable,
    intent,
    source
  }: {
    buildId: number;
    host: SocialPerson;
    joinable: Joinable | null;
    intent: JoinIntent;
    source: 'live_now' | 'profile' | 'card';
  }) {
    let visit: SocialVisit = {
      host,
      status: 'watch',
      walkupId: null,
      joinable
    };
    if (intent !== 'watch') {
      const outcome = await walkUpToMember({ buildId, hostUserId: host.id });
      visit =
        outcome?.status === 'waiting'
          ? {
              host: outcome.host || host,
              status: 'waiting',
              walkupId: String(outcome.walkup?.id || ''),
              joinable: outcome.joinable || joinable
            }
          : outcome?.status === 'later'
            ? {
                host: outcome.host || host,
                status: 'later',
                walkupId: null,
                joinable: outcome.joinable || joinable
              }
            : { host, status: 'unavailable', walkupId: null, joinable: null };
    }
    socialWalkupStore.setVisit(buildId, visit);
    trackEvent('social_walkup', {
      app_id: buildId,
      intent,
      outcome: visit.status,
      source
    });
    navigate(`/app/${buildId}`, {
      state: { buildLaunchTarget: socialLaunchTarget(buildId, visit) }
    });
  };
}
