import React, { useState, useCallback, useRef, useMemo } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import ZeroPic from '~/components/ZeroPic';
import { useKeyContext, useNotiContext } from '~/contexts';
import { MAX_AI_CALL_DURATION } from '~/constants/defaultValues';

interface WindowProps {
  initialPosition: { x: number; y: number };
  onHangUp: () => void;
}

function Window({ initialPosition, onHangUp }: WindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const aiCallDuration = useMemo(() => {
    if (!todayStats) return 0;
    return todayStats.aiCallDuration;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStats?.aiCallDuration]);

  const batteryLevel = useMemo(() => {
    if (isAdmin) return 100;
    return Math.round(
      ((MAX_AI_CALL_DURATION - aiCallDuration) / MAX_AI_CALL_DURATION) * 100
    );
  }, [aiCallDuration, isAdmin]);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
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
  }, []);

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
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
    },
    [isDragging]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleHangUpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHangUp();
  };

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
          border: 1px solid #ccc;
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
          `}
        >
          <div
            className={css`
              width: 100%;
              height: ${batteryLevel}%;
              background-color: #4caf50;
              border-radius: 7px;
              transition: height 0.3s ease-in-out;
            `}
          />
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
}

export default React.memo(Window);
