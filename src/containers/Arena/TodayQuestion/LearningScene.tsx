import React from 'react';
import { css } from '@emotion/css';
import MathText from '../MathText';
import type { Scene } from './types';

// Authored actions change these scenes; the renderer never runs authored code.
export default function LearningScene({ scene }: { scene?: Scene }) {
  if (!scene) return null;
  const max = Math.max(1, ...scene.parts.map(p => p.value || 0));
  return (
    <figure className={sceneCls}>
      <figcaption><MathText text={scene.caption} /></figcaption>
      <div className={scene.kind === 'cards' ? cardsCls : undefined}>
        {scene.parts.map((part, index) => (
          <div key={index} className={partCls} data-emphasis={!!part.emphasis}>
            <MathText text={part.text} />
            {scene.kind === 'bars' && (
              <div className={barTrackCls}>
                <div className={barCls} style={{ width: `${(part.value || 0) / max * 100}%` }} />
                <span>{part.value}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </figure>
  );
}

const sceneCls = css`
  margin: 1.2rem 0; padding: 1.2rem; border-radius: 10px; background: #f2f5f7;
  figcaption { font-weight: 700; margin-bottom: 0.8rem; }
`;
const cardsCls = css`display: flex; gap: 0.7rem; flex-wrap: wrap; > div { flex: 1 1 9rem; }`;
const partCls = css`
  padding: 0.6rem; white-space: pre-wrap; border: 2px solid transparent;
  &[data-emphasis='true'] { border-color: #a58522; background: #fff1bb; border-radius: 5px; font-weight: 700; }
`;
const barTrackCls = css`
  position: relative; min-height: 2rem; margin-top: 0.3rem; background: #e0e5e9;
  span { position: relative; padding-left: 0.5rem; color: #192527; font-weight: 700; }
`;
const barCls = css`position: absolute; inset: 0 auto 0 0; background: #99d1b3; transition: width 180ms ease; @media (prefers-reduced-motion: reduce) { transition: none; }`;
