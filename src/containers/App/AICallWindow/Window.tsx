import React, { useState, useCallback, useRef } from 'react';
import { css } from '@emotion/css';

interface WindowProps {
  initialPosition: { x: number; y: number };
  children: React.ReactNode;
}

function Window({ initialPosition, children }: WindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (
      e.button !== 0 ||
      (e.target instanceof HTMLElement &&
        ['INPUT', 'BUTTON', 'TEXTAREA'].includes(e.target.tagName))
    ) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
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
            z-index: 9999;
            background: transparent;
          `}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      )}
      <div
        ref={windowRef}
        className={css`
          position: fixed;
          top: ${position.y}px;
          left: ${position.x}px;
          background-color: #fff;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          width: 500px;
          height: 500px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1000;
        `}
        onMouseDown={handleMouseDown}
      >
        <div
          className={css`
            padding: 12px;
            background-color: #343a40;
            color: #fff;
            cursor: move;
            user-select: none;
            font-weight: bold;
            font-size: 1.2rem;
          `}
        >
          AI Call
        </div>
        <div
          className={css`
            flex: 1;
            overflow-y: auto;
          `}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export default React.memo(Window);
