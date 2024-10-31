import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext, useKeyContext, useMissionContext } from '~/contexts';
import MissionItem from '~/components/MissionItem';
import Loading from '~/components/Loading';
import InvalidContent from '../InvalidContent';
import LoginToViewContent from '~/components/LoginToViewContent';
import { isMobile } from '~/helpers';

const displayIsMobile = isMobile(navigator);

export default function MissionComponent({ src }: { src: string }) {
  const { userId } = useKeyContext((v) => v.myState);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const missionTypeIdHash = useMissionContext((v) => v.state.missionTypeIdHash);
  const loadMissionTypeIdHash = useAppContext(
    (v) => v.requestHelpers.loadMissionTypeIdHash
  );
  const loadMission = useAppContext((v) => v.requestHelpers.loadMission);
  const onLoadMission = useMissionContext((v) => v.actions.onLoadMission);
  const prevUserId = useMissionContext((v) => v.state.prevUserId);
  const missionObj = useMissionContext((v) => v.state.missionObj);
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

  const mission = useMemo(
    () => missionObj[missionId] || {},
    [missionId, missionObj]
  );

  const isTask = useMemo(() => {
    const srcParts = src.split('/');
    return !!srcParts[3];
  }, [src]);

  useEffect(() => {
    if (userId) {
      setHasError(false);
      if (!missionId) {
        setLoading(true);
        getMissionId();
      } else if (!mission.loaded || (userId && prevUserId !== userId)) {
        init();
      }
    }

    async function getMissionId() {
      try {
        const data = await loadMissionTypeIdHash();
        onLoadMissionTypeIdHash(data);
      } catch (error) {
        setHasError(true);
      }
    }

    async function init() {
      setLoading(true);
      try {
        const { page } = await loadMission({ missionId, isTask });
        if (page) {
          onLoadMission({ mission: page, prevUserId: userId });
        } else {
          setHasError(true);
        }
      } catch (error) {
        setHasError(true);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, missionId, missionTypeIdHash]);

  if (!userId) {
    return <LoginToViewContent />;
  }
  if (loading) {
    return <Loading />;
  }
  if (!missionId || hasError) {
    return <InvalidContent />;
  }

  return (
    <MissionItem
      showStatus={false}
      style={{ marginTop: '1rem', minWidth: displayIsMobile ? '100%' : '80%' }}
      mission={mission}
      missionLink={src}
    />
  );
}
