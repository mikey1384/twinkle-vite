import React from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import { returnMissionThumb } from '~/constants/defaultValues';

export default function CompactMissionEmbedPreview({
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
  if (xp && coins)
    return `${xp.toLocaleString()} XP · ${coins.toLocaleString()} coins`;
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
