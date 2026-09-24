import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import ZeroPic from '~/components/ZeroPic';
import { EnergyBattery, useDraggableWindow } from './frame';

interface WindowProps {
  initialPosition: { x: number; y: number };
  onHangUp: () => void;
  assistantName: 'Zero' | 'Ciel';
  ending: boolean;
}

function Window({
  initialPosition,
  onHangUp,
  assistantName,
  ending
}: WindowProps) {
  const { position, windowRef, handleStart, dragLayer } =
    useDraggableWindow(initialPosition);

  return (
    <>
      {dragLayer}
      <div
        ref={windowRef}
        className={css`
          position: fixed;
          top: ${position.y}px;
          left: ${position.x}px;
          background-color: #f5f7fa;
          border: 1px solid var(--ui-border);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          height: 120px;
          display: flex;
          overflow: hidden;
          z-index: 1000;
          touch-action: none;
        `}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <div
          className={`draggable-area ${css`
            flex: 1;
            display: flex;
            align-items: center;
            padding-left: 1rem;
            cursor: move;
          `}`}
        >
          <div
            className={css`
              width: 80px;
              height: 80px;
            `}
          >
            <ZeroPic assistant={assistantName} />
          </div>
        </div>

        <EnergyBattery />

        <div
          onClick={handleHangUpClick}
          role="button"
          tabIndex={0}
          aria-label={
            ending
              ? `Ending the call with ${assistantName}`
              : `Hang up the call with ${assistantName}`
          }
          aria-disabled={ending}
          onKeyDown={(event) => {
            if (!ending && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              onHangUp();
            }
          }}
          style={{ pointerEvents: 'auto' }}
          className={`hangup-button ${css`
            width: 40px;
            background-color: ${Color.rose(0.9)};
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: background-color 0.3s ease;
            &:hover {
              background-color: ${Color.rose(1)};
            }
          `}`}
        >
          <span
            className={css`
              transform: rotate(-270deg);
              white-space: nowrap;
              color: white;
              font-family: 'Inter', sans-serif;
              font-size: 16px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 1px;
            `}
          >
            <Icon icon={ending ? 'spinner' : 'phone-volume'} spin={ending} />
            <span style={{ marginLeft: '0.7rem' }}>
              {ending ? 'Ending...' : 'Hang Up'}
            </span>
          </span>
        </div>
      </div>
    </>
  );

  function handleHangUpClick(e: React.MouseEvent) {
    e.stopPropagation();
    onHangUp();
  }
}

export default React.memo(Window);
