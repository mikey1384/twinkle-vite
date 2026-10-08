import { useEffect, useRef, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import type { CrewView } from '~/containers/BridgeBuilderQuest/types';
import useMeetupRefresh from '~/containers/BridgeBuilderQuest/useMeetupRefresh';

// The sidebar and mobile card can mount together. Share only in-flight reads,
// scoped to the signed-in viewer; never retain a private view across sessions.
const reads = new Map<string, Promise<{ crew?: CrewView } | undefined>>();

// A crew's live view for the chat surfaces (members and admins only). Every
// number comes from the server; a failed or forbidden load shows nothing.
export default function useCrewView(crewId: number) {
  const loadMeetupCrew = useAppContext((v) => v.requestHelpers.loadMeetupCrew);
  const userId = useKeyContext((v) => v.myState.userId);
  const [crew, setCrew] = useState<CrewView | null>(null);
  const requestId = useRef(0);
  const active = useRef(false);
  useMeetupRefresh({ enabled: !!userId && crewId > 0, channelId: crew?.chat?.channelId, refresh: reload });
  useEffect(() => {
    active.current = true;
    setCrew(null);
    if (crewId > 0 && userId) reload();
    return () => {
      active.current = false;
      requestId.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crewId, userId]);
  return crew;

  async function reload() {
    const id = ++requestId.current;
    const key = `${userId}:${crewId}`;
    let read = reads.get(key);
    if (!read) {
      read = Promise.resolve(loadMeetupCrew(crewId)).finally(() => { reads.delete(key); });
      reads.set(key, read);
    }
    try {
      const data = await read;
      if (active.current && id === requestId.current) setCrew(data?.crew || null);
    } catch {
      if (active.current && id === requestId.current) setCrew(null);
    }
  }
}
