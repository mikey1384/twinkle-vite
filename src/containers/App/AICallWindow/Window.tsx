import React, { useState, useRef, useMemo } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import ZeroPic from '~/components/ZeroPic';
import { useKeyContext, useNotiContext } from '~/contexts';

interface WindowProps {
  initialPosition: { x: number; y: number };
  onHangUp: () => void;
}

interface AiUsagePolicy {
  energyPercent?: number;
  energySegments?: number;
}

function Window({ initialPosition, onHangUp }: WindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const aiUsagePolicy = todayStats?.aiUsagePolicy as AiUsagePolicy | null;

  const batteryLevel = useMemo(() => {
    if (isAdmin) return 100;
    return Math.max(0, Math.min(100, aiUsagePolicy?.energyPercent ?? 100));
  }, [aiUsagePolicy?.energyPercent, isAdmin]);

  const energySegments = useMemo(() => {
    return Math.max(1, aiUsagePolicy?.energySegments || 5);
  }, [aiUsagePolicy?.energySegments]);

  const visualSegmentFill = useMemo(() => {
    return (batteryLevel / 100) * energySegments;
  }, [batteryLevel, energySegments]);

  return (
    <>
      {isDragging && (
        <div
          className={css`
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            cursor: move;
            z-index: 1001;
            background: transparent;
            touch-action: none;
          `}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      )}
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
            <ZeroPic />
          </div>
        </div>

        <div
          className={css`
            width: 20px;
            margin: 1rem 0.5rem;
            background-color: #e0e0e0;
            border-radius: 10px;
            padding: 3px;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            gap: 3px;
          `}
        >
          {Array.from({ length: energySegments }).map((_, index) => {
            const fillRatio = Math.max(
              0,
              Math.min(1, visualSegmentFill - (energySegments - index - 1))
            );
            return (
              <span
                key={index}
                className={css`
                  position: relative;
                  width: 100%;
                  flex: 1;
                  overflow: hidden;
                  border-radius: 6px;
                  background-color: rgba(255, 255, 255, 0.65);
                `}
              >
                {fillRatio > 0 && (
                  <span
                    className={css`
                      position: absolute;
                      right: 0;
                      bottom: 0;
                      left: 0;
                      height: ${fillRatio * 100}%;
                      border-radius: inherit;
                      background-color: #4caf50;
                      transition: height 0.3s ease-in-out;
                    `}
                  />
                )}
              </span>
            );
          })}
          <div
            className={css`
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(90deg);
              white-space: nowrap;
              color: ${batteryLevel < 30 ? '#333' : '#fff'};
              font-weight: 600;
              font-size: 0.7rem;
              width: 80px;
              text-align: center;
            `}
          >
            {batteryLevel}%
          </div>
        </div>

        <div
          onClick={handleHangUpClick}
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
            <Icon icon="phone-volume" />
            <span style={{ marginLeft: '0.7rem' }}>Hang Up</span>
          </span>
        </div>
      </div>
    </>
  );

  function handleStart(e: React.MouseEvent | React.TouchEvent) {
    if (!(e.target as HTMLElement).closest('.draggable-area')) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);

    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const clientX =
        'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY =
        'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      dragOffset.current = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }
  }

  function handleMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isDragging) return;
    e.preventDefault();

    const clientX =
      'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    setPosition({
      x: clientX - dragOffset.current.x,
      y: clientY - dragOffset.current.y
    });
  }

  function handleEnd() {
    setIsDragging(false);
  }

  function handleHangUpClick(e: React.MouseEvent) {
    e.stopPropagation();
    onHangUp();
  }
}

export default React.memo(Window);
