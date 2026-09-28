import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { coverFor, STAGE_STYLES, stageLabel } from './covers';
import type { CrewStage } from './types';

// Scatter positions for the cover's icons: [left %, top %, size rem, rotate]
const SPOTS: [number, number, number, number][] = [
  [6, 14, 2.2, -12],
  [78, 10, 1.8, 14],
  [60, 58, 2.6, -8],
  [18, 62, 1.6, 20],
  [88, 60, 1.4, -18],
  [40, 18, 1.3, 8]
];

export function StageBadge({
  stage,
  achievementTitle,
  style
}: {
  stage: CrewStage;
  achievementTitle: string;
  style?: React.CSSProperties;
}) {
  const color = STAGE_STYLES[stage]?.color || '#888';
  return (
    <span
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.9rem;
        border-radius: 999px;
        background: #fff;
        color: ${color};
        font-size: 1.15rem;
        font-weight: bold;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
        white-space: nowrap;
      `}
      style={style}
    >
      <span
        className={css`
          width: 0.7rem;
          height: 0.7rem;
          border-radius: 50%;
          background: ${color};
        `}
      />
      {stageLabel(stage, achievementTitle)}
    </span>
  );
}

export default function CrewCover({
  cover,
  height = '10rem',
  stage,
  achievementTitle = '',
  rounded = '1.2rem 1.2rem 0 0',
  children
}: {
  cover: string;
  height?: string;
  stage?: CrewStage;
  achievementTitle?: string;
  rounded?: string;
  children?: React.ReactNode;
}) {
  const preset = coverFor(cover);
  return (
    <div
      aria-hidden={!children}
      className={css`
        position: relative;
        height: ${height};
        background: ${preset.color};
        border-radius: ${rounded};
        overflow: hidden;
        flex-shrink: 0;
      `}
    >
      {SPOTS.map(([left, top, size, rotate], index) => (
        <span
          key={index}
          className={css`
            position: absolute;
            left: ${left}%;
            top: ${top}%;
            font-size: ${size}rem;
            color: rgba(255, 255, 255, ${index < 3 ? 0.5 : 0.3});
            transform: rotate(${rotate}deg);
          `}
        >
          <Icon icon={preset.icons[index % preset.icons.length]} />
        </span>
      ))}
      {stage && (
        <StageBadge
          stage={stage}
          achievementTitle={achievementTitle}
          style={{ position: 'absolute', top: '0.8rem', left: '0.8rem' }}
        />
      )}
      {children}
    </div>
  );
}
