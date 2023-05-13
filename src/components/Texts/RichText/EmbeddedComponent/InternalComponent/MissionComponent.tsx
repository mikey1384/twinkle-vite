import React, { useEffect, useMemo } from 'react';
import { useAppContext, useMissionContext } from '~/contexts';

export default function MissionComponent({ src }: { src: string }) {
  const missionTypeIdHash = useMissionContext((v) => v.state.missionTypeIdHash);
  const loadMissionTypeIdHash = useAppContext(
    (v) => v.requestHelpers.loadMissionTypeIdHash
  );
  const onLoadMissionTypeIdHash = useMissionContext(
    (v) => v.actions.onLoadMissionTypeIdHash
  );

  const missionType = useMemo(() => {
    const srcParts = src.split('/');
    return srcParts[srcParts.length - 1] || srcParts[srcParts.length - 2];
  }, [src]);

  const missionId = useMemo(() => {
    return missionTypeIdHash?.[missionType];
  }, [missionTypeIdHash, missionType]);

  useEffect(() => {
    if (!missionId) {
      getMissionId();
    }
    async function getMissionId() {
      const data = await loadMissionTypeIdHash();
      onLoadMissionTypeIdHash(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId, missionTypeIdHash]);

  return (
    <div>
      <div>this is a mission component {missionId}</div>
    </div>
  );
}
