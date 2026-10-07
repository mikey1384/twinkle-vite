import React from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { PIXEL_FONT, useGradeColor } from '../ClassicArcade/theme';

// A glossy glass marble in its grade colour, like the ones racing on the
// Classic cover. An empty slot is dim smoky glass with a "?".
export default function GlassMarble({
  letter,
  size = 28,
  isAllS
}: {
  letter?: string;
  size?: number;
  isAllS?: boolean;
}) {
  const gradeColor = useGradeColor();
  const known = !!letter;
  const c = (alpha?: number) => gradeColor(letter, alpha);
  // phones get a slightly smaller marble so a level's ten fit on one rail
  const mobileSize = Math.round(size * 0.8);
  const shine = `radial-gradient(circle at 33% 27%, rgba(255,255,255,0.95) 0, rgba(255,255,255,0.55) 9%, rgba(255,255,255,0) 26%)`;
  const smokyShine = `radial-gradient(circle at 33% 27%, rgba(255,255,255,0.3) 0, rgba(255,255,255,0.12) 9%, rgba(255,255,255,0) 26%)`;
  const caustic = `radial-gradient(circle at 62% 84%, rgba(255,255,255,0.45) 0, rgba(255,255,255,0) 24%)`;
  const rim = `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 58%, rgba(8,4,32,0.55) 100%)`;
  const allSGlow = isAllS && letter === 'S';

  return (
    <div
      className={css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        flex-shrink: 0;
        border-radius: 50%;
        font-family: ${PIXEL_FONT};
        font-size: ${Math.max(8, Math.round(size * 0.36))}px;
        line-height: 1;
        ${
          known
            ? `
          color: #fff;
          text-shadow: 0 1px 0 rgba(10, 6, 40, 0.85), 0 0 3px rgba(10, 6, 40, 0.6);
          background-color: #160c42;
          background-image: ${shine}, ${caustic}, ${rim},
            radial-gradient(circle at 42% 38%, ${c(1)} 0%, ${c(0.92)} 45%, ${c(0.6)} 100%);
          box-shadow:
            inset 0 -2px 4px rgba(0, 0, 0, 0.35),
            0 0 ${allSGlow ? 12 : 6}px ${c(allSGlow ? 1 : 0.75)},
            0 0 ${allSGlow ? 22 : 13}px ${c(allSGlow ? 0.6 : 0.3)}
            ${allSGlow ? ', 0 0 0 1px rgba(255, 245, 200, 0.9)' : ''};
        `
            : `
          color: rgba(205, 215, 255, 0.55);
          background-color: rgba(120, 140, 220, 0.1);
          background-image: ${smokyShine}, ${rim};
          border: 1px solid rgba(160, 180, 255, 0.28);
          box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.35);
        `
        }
        @media (max-width: ${mobileMaxWidth}) {
          width: ${mobileSize}px;
          height: ${mobileSize}px;
          font-size: ${Math.max(7, Math.round(mobileSize * 0.36))}px;
        }
      `}
    >
      <span>{letter || '?'}</span>
    </div>
  );
}
