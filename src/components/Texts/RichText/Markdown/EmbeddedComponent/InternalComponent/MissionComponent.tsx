import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext, useKeyContext, useMissionContext } from '~/contexts';
import MissionItem from '~/components/MissionItem';
import Loading from '~/components/Loading';
import InvalidContent from '../InvalidContent';
import LoginToViewContent from '~/components/LoginToViewContent';
import { isMobile } from '~/helpers';
import { returnMissionThumb } from '~/constants/defaultValues';
import { Color, borderRadius } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';

const displayIsMobile = isMobile(navigator);

export default function MissionComponent({
  src,
  isPreview
}: {
  src: string;
  isPreview?: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
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
      } catch (_error) {
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
      } catch (_error) {
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

  if (isPreview) {
    return <CompactMissionEmbedPreview mission={mission} missionLink={src} />;
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

function CompactMissionEmbedPreview({
  mission,
  missionLink
}: {
  mission: any;
  missionLink: string;
}) {
  const navigate = useNavigate();
  const missionThumb = returnMissionThumb(mission.missionType);
  const rewardText = getMissionRewardText(mission);

  return (
    <button
      type="button"
      className={compactMissionPreviewClass}
      onClick={handleClick}
    >
      <img src={missionThumb} alt="" loading="lazy" />
      <div className="compact-mission-embed__copy">
        <span>Mission</span>
        <strong>{mission.title || 'Mission'}</strong>
        {mission.subtitle ? <p>{mission.subtitle}</p> : null}
        {rewardText ? (
          <div className="compact-mission-embed__reward">{rewardText}</div>
        ) : null}
      </div>
    </button>
  );

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    navigate(missionLink);
  }
}

function getMissionRewardText(mission: any) {
  const xp = Number(mission.xpReward || mission.repeatXpReward || 0);
  const coins = Number(mission.coinReward || mission.repeatCoinReward || 0);
  if (xp && coins) return `${xp.toLocaleString()} XP · ${coins.toLocaleString()} coins`;
  if (xp) return `${xp.toLocaleString()} XP`;
  if (coins) return `${coins.toLocaleString()} coins`;
  return '';
}

const compactMissionPreviewClass = css`
  display: grid;
  grid-template-columns: 7rem minmax(0, 1fr);
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  min-height: 8.2rem;
  padding: 0.75rem 0.9rem;
  overflow: hidden;
  border: 1px solid ${Color.gold(0.72)};
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  font: inherit;
  text-align: left;
  cursor: pointer;
  img {
    width: 7rem;
    height: 5rem;
    object-fit: cover;
    border-radius: 0.6rem;
    background: ${Color.whiteGray()};
  }
  .compact-mission-embed__copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.26rem;
  }
  span {
    color: ${Color.gold()};
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.1;
  }
  strong {
    overflow: hidden;
    color: ${Color.black()};
    font-size: 1.25rem;
    font-weight: 900;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  p {
    margin: 0;
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .compact-mission-embed__reward {
    color: ${Color.gold()};
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.1;
  }
`;
