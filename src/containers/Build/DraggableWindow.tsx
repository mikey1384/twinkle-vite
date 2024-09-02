import React, { useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';

interface DraggableWindowProps {
  initialPosition: { x: number; y: number };
}

export default function DraggableWindow({
  initialPosition
}: DraggableWindowProps): React.ReactElement {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    },
    [isDragging, dragOffset]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={css`
        position: fixed;
        top: 0;
        left: 0;
        width: 300px;
        height: 400px;
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        transform: translate(${position.x}px, ${position.y}px);
        transition: transform 0.1s ease-out;
      `}
      onMouseDown={handleMouseDown}
    >
      <div
        className={css`
          padding: 8px;
          background-color: #e0e0e0;
          cursor: move;
          user-select: none;
        `}
      >
        Draggable Window
      </div>
      <div
        className={css`
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        `}
      >
        {/* Add your chat window content here */}
        <p>
          {`This is a draggable window similar to Cursor IDE's compose chat
          window.`}
        </p>
      </div>
    </div>
  );
}
