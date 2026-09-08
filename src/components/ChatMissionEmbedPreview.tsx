import React from 'react';
import { css, cx } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { returnMissionThumb } from '~/constants/defaultValues';

// Chat has room for readable attachment copy; feed preview slots keep their
// existing compact component and sizing.
export default function ChatMissionEmbedPreview({
  mission,
  missionLink,
  isPreview = false
}: {
  mission: any;
  missionLink: string;
  isPreview?: boolean;
}) {
  const navigate = useNavigate();
  const xp = Number(mission.xpReward || (isPreview && mission.repeatXpReward) || 0);
  const coins = Number(mission.coinReward || (isPreview && mission.repeatCoinReward) || 0);
  const rewards = [
    xp ? `${xp.toLocaleString()} XP` : '',
    coins ? `${coins.toLocaleString()} coins` : ''
  ].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      className={cx(missionEmbedClass, isPreview && 'compact')}
      onClick={(event) => {
        event.stopPropagation();
        navigate(missionLink);
      }}
    >
      <span className="chat-mission-embed__label">Mission</span>
      <img src={returnMissionThumb(mission.missionType)} alt="" loading="lazy" />
      <strong className="chat-mission-embed__title">{mission.title || 'Mission'}</strong>
      {mission.subtitle ? (
        <span className="chat-mission-embed__summary">{mission.subtitle}</span>
      ) : null}
      {rewards ? <span className="chat-mission-embed__rewards">{rewards}</span> : null}
    </button>
  );
}

const missionEmbedClass = css`
  appearance: none;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  grid-template-areas: 'label label' 'image title' 'summary summary' 'rewards rewards';
  align-items: center;
  gap: 10px 12px;
  width: 100%;
  min-width: 0;
  padding: 14px;
  border: 1px solid #e6d5a3;
  border-radius: 14px;
  background: #fffefa;
  color: #273449;
  font: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;

  img {
    grid-area: image;
    width: 64px;
    height: 48px;
    object-fit: cover;
    border-radius: 8px;
    background: #f1f5f9;
  }
  .chat-mission-embed__label {
    grid-area: label;
    justify-self: start;
    padding: 3px 8px;
    border-radius: 6px;
    background: #fff1c2;
    color: #72520d;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.4;
  }
  .chat-mission-embed__title {
    grid-area: title;
    min-width: 0;
    color: #273449;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .chat-mission-embed__summary {
    grid-area: summary;
    color: #526176;
    font-size: 15px;
    font-weight: 400;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .chat-mission-embed__rewards {
    grid-area: rewards;
    color: #72520d;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  &.compact {
    padding: 12px;
    gap: 8px 10px;
    .chat-mission-embed__title { font-size: 16px; }
    .chat-mission-embed__summary {
      font-size: 14px;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }
  }
  &:focus-visible {
    outline: 2px solid #334155;
    outline-offset: 3px;
    box-shadow: 0 0 0 3px #fff;
  }
  @media (hover: hover) and (pointer: fine) {
    &:hover { border-color: #b58a35; background: #fffaf0; }
  }
`;
