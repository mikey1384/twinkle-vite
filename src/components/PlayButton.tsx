import React from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';

// Size used by the play-to-start overlay on an actual video PLAYER area, so it
// matches the custom player's center play button everywhere. Thumbnail badges
// pass their own (smaller) sizes instead.
export const PLAYER_PLAY_BUTTON_SIZE = '7rem';

// Twinkle's play affordance: a dark translucent circle with a white triangle,
// matching the custom video player's center play button. Replaces the old blue
// PNG (play-button-image.png) everywhere (video overlays + thumbnails).
export default function PlayButton({
  size = '6rem',
  className,
  style
}: {
  size?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cx(
        css`
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${size};
          height: ${size};
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.55);
          color: #fff;
          font-size: calc(${size} * 0.4);
          padding-left: calc(${size} * 0.08);
          transition: transform 0.15s ease, background 0.15s ease;
          &:hover {
            transform: scale(1.08);
            background: rgba(0, 0, 0, 0.72);
          }
        `,
        className
      )}
      style={style}
    >
      <Icon icon="play" />
    </div>
  );
}
