import React from 'react';
import { css } from '@emotion/css';
import {
  COMPACT_NAVIGATION_WIDTH,
  MIN_WIDTHS,
  RESIZE_HANDLE_WIDTH,
  type NavigationPanel
} from './helpers/navigationSizing';

export default function ResizeHandle({
  panel, width, maximum, active, betweenColumns, onPointerDown, onKeyDown, onReset
}: {
  panel: NavigationPanel;
  width: number;
  maximum: number;
  active: boolean;
  betweenColumns?: boolean;
  onPointerDown: (panel: NavigationPanel, event: React.PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (panel: NavigationPanel, event: React.KeyboardEvent<HTMLButtonElement>) => void;
  onReset: (panel: NavigationPanel) => void;
}) {
  const label = panel === 'channels' ? 'channels' : 'subchannels and topics';
  return (
    <button
      type="button"
      role="separator"
      aria-label={`Resize ${label}`}
      aria-orientation="vertical"
      aria-valuemin={MIN_WIDTHS[panel]}
      aria-valuemax={maximum}
      aria-valuenow={width}
      aria-valuetext={`${width} pixels${width <= COMPACT_NAVIGATION_WIDTH ? ', compact layout' : ''}`}
      title={`Drag to resize ${label}. Use arrow keys to adjust; double-click or press Enter to reset.`}
      data-resizing={active}
      onPointerDown={(event) => onPointerDown(panel, event)}
      onKeyDown={(event) => onKeyDown(panel, event)}
      onDoubleClick={() => onReset(panel)}
      className={css`
        position: absolute;
        top: 0;
        bottom: 0;
        ${betweenColumns
          ? 'left: var(--chat-channel-width);'
          : `right: -${RESIZE_HANDLE_WIDTH + 1}px;`}
        width: ${RESIZE_HANDLE_WIDTH}px;
        z-index: 6;
        padding: 0;
        border: 0;
        background: transparent;
        cursor: col-resize;
        touch-action: none;
        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 3px;
          height: 32px;
          border-radius: 3px;
          background: #cbd5e1;
          transform: translate(-50%, -50%);
        }
        &:hover::before, &:focus-visible::before, &[data-resizing='true']::before {
          background: #64748b;
        }
        &:focus-visible {
          outline: 2px solid #64748b;
          outline-offset: -2px;
        }
        @media (pointer: coarse) {
          &::after {
            content: '';
            position: absolute;
            inset: 0 -6px;
          }
        }
      `}
    />
  );
}
