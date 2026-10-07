import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { NEON, PIXEL_FONT, rgba } from './theme';

// An arcade cabinet button: dark glass, neon rim, presses down on tap.
export default function NeonButton({
  children,
  icon,
  onClick
}: {
  children: React.ReactNode;
  icon?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.8rem;
        min-height: 44px;
        padding: 0.9rem 1.6rem;
        border-radius: 12px;
        cursor: pointer;
        font-family: ${PIXEL_FONT};
        font-size: 1.1rem;
        line-height: 1.4;
        letter-spacing: 0.04em;
        color: ${NEON.cyan};
        text-shadow: 0 0 6px ${rgba(NEON.cyanRgb, 0.8)};
        background: linear-gradient(
          180deg,
          rgba(28, 36, 110, 0.9) 0%,
          rgba(12, 14, 56, 0.95) 100%
        );
        border: 2px solid ${rgba(NEON.cyanRgb, 0.75)};
        box-shadow:
          0 4px 0 #050824,
          0 0 14px ${rgba(NEON.cyanRgb, 0.35)},
          inset 0 1px 0 rgba(255, 255, 255, 0.15);
        transition:
          transform 0.08s ease,
          box-shadow 0.15s ease,
          border-color 0.15s ease;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        @media (hover: hover) and (pointer: fine) {
          &:hover {
            border-color: ${NEON.cyan};
            box-shadow:
              0 4px 0 #050824,
              0 0 22px ${rgba(NEON.cyanRgb, 0.6)},
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
        }
        &:active {
          transform: translateY(3px);
          box-shadow:
            0 1px 0 #050824,
            0 0 18px ${rgba(NEON.cyanRgb, 0.5)};
        }
        &:focus-visible {
          outline: 2px solid ${NEON.gold};
          outline-offset: 3px;
        }
      `}
    >
      {icon ? <Icon icon={icon} /> : null}
      <span>{children}</span>
    </button>
  );
}
