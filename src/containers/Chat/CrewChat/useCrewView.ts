import { useEffect, useState } from 'react';
import { useAppContext } from '~/contexts';
import type { CrewView } from '~/containers/BridgeBuilderQuest/types';

// A crew's live view for the chat surfaces (members and admins only). Every
// number comes from the server; a failed or forbidden load shows nothing.
export default function useCrewView(crewId: number) {
  const loadMeetupCrew = useAppContext((v) => v.requestHelpers.loadMeetupCrew);
  const [crew, setCrew] = useState<CrewView | null>(null);
  useEffect(() => {
    let active = true;
    setCrew(null);
    if (!(crewId > 0)) return;
    loadMeetupCrew(crewId)
      .then((data: { crew?: CrewView } | undefined) => {
        if (active) setCrew(data?.crew || null);
      })
      .catch(() => {
        if (active) setCrew(null);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crewId]);
  return crew;
}
