import React, { useState, useCallback, useRef, useEffect } from 'react';
import { css } from '@emotion/css';

interface DraggableWindowProps {
  initialPosition: { x: number; y: number };
  onSendMessage: (message: string) => void;
  children: React.ReactNode;
}

function DraggableWindow({
  initialPosition,
  onSendMessage,
  children
}: DraggableWindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [inputMessage, setInputMessage] = useState('');
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      offset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    },
    [position]
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;

    requestAnimationFrame(() => {
      setPosition({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y
      });
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div
      className={css`
        position: fixed;
        transform: translate(${position.x}px, ${position.y}px);
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        width: 300px;
        height: 400px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      `}
    >
      <div
        className={css`
          padding: 8px;
          background-color: #f0f0f0;
          cursor: move;
          user-select: none;
        `}
        onMouseDown={handleMouseDown}
      >
        AI Chat
      </div>
      <div
        className={css`
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        `}
      >
        {children}
      </div>
      <form
        onSubmit={handleSendMessage}
        className={css`
          display: flex;
          padding: 8px;
          border-top: 1px solid #ccc;
        `}
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          className={css`
            flex: 1;
            padding: 4px;
            border: 1px solid #ccc;
            border-radius: 4px;
          `}
        />
        <button
          type="submit"
          className={css`
            margin-left: 8px;
            padding: 4px 8px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          `}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default React.memo(DraggableWindow);
