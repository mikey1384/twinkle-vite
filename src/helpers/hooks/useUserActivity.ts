import { useEffect } from 'react';
import { useKeyContext } from '~/contexts';
import {
  createUserActivityRegistry,
  type UserActivityIntent
} from '../userActivity';

export const userActivityRegistry = createUserActivityRegistry();

export default function useUserActivity(
  activity: UserActivityIntent | null,
  { active = true, priority = 10 }: { active?: boolean; priority?: number } = {}
) {
  const userId = useKeyContext((v) => v.myState.userId);
  const kind = activity?.kind;
  const id = activity?.id;
  useEffect(() => {
    if (!userId || !active) return;
    const key = {};
    userActivityRegistry.set(
      key,
      userId,
      kind && id ? ({ kind, id } as UserActivityIntent) : null,
      priority
    );
    return () => userActivityRegistry.remove(key);
  }, [active, id, kind, priority, userId]);
}
