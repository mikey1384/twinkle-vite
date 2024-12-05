import React, { useState, useCallback, useRef } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useManagementContext } from '~/contexts';

export default function Window({
  initialPosition
}: {
  initialPosition: { x: number; y: number };
}) {
  const adminLogs = useManagementContext((v) => v.state.adminLogs);
  const onClearAdminLogs = useManagementContext(
    (v) => v.actions.onClearAdminLogs
  );
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (
      !(e.target as HTMLElement).closest('.draggable-area') ||
      (e.target as HTMLElement).closest('.close-button')
    ) {
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
        className={`draggable-area ${css`
          position: fixed;
          top: ${position.y}px;
          left: ${position.x}px;
          background: ${Color.white()};
          border: 1px solid ${Color.borderGray()};
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
          width: 400px;
          z-index: 1000;
          touch-action: none;
          cursor: move;
        `}`}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <div
          className={css`
            padding: 1rem;
            background: ${Color.logoBlue()};
            color: white;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          `}
        >
          <span>Admin Logs</span>
          <button
            className={`close-button ${css`
              background: none;
              border: none;
              color: white;
              cursor: pointer;
              font-size: 1.2rem;
              padding: 0;
              &:hover {
                opacity: 0.8;
              }
            `}`}
            onClick={() => {
              onClearAdminLogs();
            }}
          >
            ×
          </button>
        </div>
        <div
          className={css`
            padding: 1rem;
            max-height: 400px;
            overflow-y: auto;
          `}
        >
          <div>
            {adminLogs.map((adminLog: string, index: number) => (
              <div key={index}>{adminLog}</div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
