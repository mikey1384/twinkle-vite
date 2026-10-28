// Keep a long-open app on its original artifact. Only a server authorization
// refusal can trigger one retry; a lost mutation response must never do so.
export function createRewardRuntimeRenewal(maxEntries = 100) {
  const entries = new Map<string, { grant: string; pending?: Promise<string> }>();
  let activeSession = '';
  return async function withRewardRuntime<T>({
    sessionKey, isCurrentSession, userId, buildId, artifactVersionId, runtimeGrant,
    send, renew, isRuntimeRequired
  }: {
    sessionKey: string;
    isCurrentSession: () => boolean;
    userId: number;
    buildId: number;
    artifactVersionId?: number | null;
    runtimeGrant: string;
    send: (grant: string) => Promise<T>;
    renew: (grant: string) => Promise<{ runtimeGrant: string; artifactVersionId: number }>;
    isRuntimeRequired: (error: unknown) => boolean;
  }): Promise<T> {
    if (sessionKey !== activeSession) { entries.clear(); activeSession = sessionKey; }
    const current = () => {
      if (activeSession !== sessionKey) return false;
      if (isCurrentSession()) return true;
      entries.clear(); activeSession = '';
      return false;
    };
    if (!current()) throw new Error('Your sign-in changed. Reopen the app.');
    const canRenew = !!sessionKey && Number.isSafeInteger(userId) && userId > 0 &&
      Number.isSafeInteger(artifactVersionId) && Number(artifactVersionId) > 0;
    const key = `${userId}:${buildId}:${artifactVersionId}:${runtimeGrant}`;
    let entry = entries.get(key);
    if (!entry) {
      entry = { grant: runtimeGrant };
      while (entries.size >= Math.max(1, maxEntries)) entries.delete(entries.keys().next().value!);
      entries.set(key, entry);
    }
    const firstGrant = entry.grant;
    try { return await send(firstGrant); }
    catch (error) {
      if (!canRenew || !current() || !isRuntimeRequired(error)) throw error;
      if (entry.grant === firstGrant && !entry.pending) {
        const original = entry;
        original.pending = renew(firstGrant).then((result) => {
          if (!current()) throw new Error('Your sign-in changed. Reopen the app.');
          if (result.artifactVersionId !== artifactVersionId || typeof result.runtimeGrant !== 'string' || !result.runtimeGrant) {
            throw new Error('This app version could not renew rewards. Reopen the published app.');
          }
          original.grant = result.runtimeGrant;
          return result.runtimeGrant;
        }).finally(() => { original.pending = undefined; });
      }
      const renewed = entry.pending ? await entry.pending : entry.grant;
      if (!current()) throw error;
      return send(renewed);
    }
  };
}
