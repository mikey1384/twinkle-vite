import { useEffect, useMemo, useRef, useState } from 'react';

export interface ReactionPerson {
  id: number;
  username?: string;
  profilePicUrl?: string;
}

export default function useReactionPeople({
  userIds,
  viewer,
  userObj,
  loadProfile,
  onSetUserState,
  mode
}: {
  userIds: number[];
  viewer: ReactionPerson;
  userObj: Record<number, ReactionPerson>;
  loadProfile: (id: number) => Promise<ReactionPerson>;
  onSetUserState: (value: { userId: number; newState: any }) => void;
  mode: 'closed' | 'preview' | 'all';
}) {
  const ids = useMemo(() => [...new Set(userIds)], [userIds]);
  const otherIds = ids.filter((id) => id !== viewer.id);
  const requestedIds = mode === 'closed' ? [] : mode === 'all' ? otherIds : otherIds.slice(0, 2);
  const requestKey = `${viewer.id}:${mode}:${requestedIds.join(',')}`;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: '', loading: false, failed: false });
  const latest = useRef({ userObj, loadProfile, onSetUserState });
  const inFlight = useRef(new Map<number, Promise<ReactionPerson>>());
  latest.current = { userObj, loadProfile, onSetUserState };

  useEffect(() => {
    const requests = inFlight.current;
    return () => requests.clear();
  }, [viewer.id]);

  useEffect(() => {
    let cancelled = false;
    const missing = requestedIds.filter((id) => !latest.current.userObj[id]?.username);
    setResult({ key: requestKey, loading: missing.length > 0, failed: false });
    if (!missing.length) return;

    async function load(id: number) {
      let request = inFlight.current.get(id);
      try {
        if (!request) {
          // Share a preview request when its count opens the full people list.
          request = Promise.resolve().then(() => latest.current.loadProfile(id));
          inFlight.current.set(id, request);
        }
        const data = await request;
        if (typeof data?.username !== 'string' || !data.username.trim() || (data.id != null && data.id !== id)) return false;
        if (!cancelled) {
          latest.current.onSetUserState({
            userId: id,
            newState: { ...data, id, loaded: true }
          });
        }
        return true;
      } catch {
        return false;
      } finally {
        if (inFlight.current.get(id) === request) inFlight.current.delete(id);
      }
    }
    let nextIndex = 0;
    let failed = false;
    async function worker() {
      while (!cancelled && nextIndex < missing.length) {
        if (!(await load(missing[nextIndex++]))) failed = true;
      }
    }
    // Busy messages can have hundreds of people; avoid a request burst and
    // stop starting queued work when the dialog/preview closes.
    void Promise.all(Array.from({ length: Math.min(4, missing.length) }, worker)).then(() => {
      if (!cancelled) {
        setResult({ key: requestKey, loading: false, failed });
      }
    });
    return () => { cancelled = true; };
    // Cache writes must not cancel sibling requests. Each identity/mode/retry
    // gets a fresh generation; callbacks/cache are read through latest instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, attempt]);

  const people = ids.map((id) => id === viewer.id ? viewer : { ...userObj[id], id });
  people.sort((a, b) => Number(b.id === viewer.id) - Number(a.id === viewer.id));
  const current = result.key === requestKey;
  return {
    people,
    loading: mode !== 'closed' && (!current || result.loading),
    failed: mode !== 'closed' && current && result.failed,
    retry: () => setAttempt((value) => value + 1)
  };
}
