import React, { useState, useCallback, useRef } from 'react';
import { css } from '@emotion/css';

interface WindowProps {
  initialPosition: { x: number; y: number };
  onSendMessage: (message: string) => void;
  children: React.ReactNode;
}

function Window({ initialPosition, onSendMessage, children }: WindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [inputMessage, setInputMessage] = useState('');
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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
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
            z-index: 9999;
            /* Prevent interactions with underlying elements */
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
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          width: 300px;
          height: 400px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          will-change: transform;
          z-index: 1000;
        `}
        onMouseDown={handleMouseDown}
      >
        <div
          className={css`
            padding: 8px;
            background-color: #f0f0f0;
            cursor: move;
            user-select: none;
          `}
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
            onMouseDown={(e) => e.stopPropagation()}
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
            onMouseDown={(e) => e.stopPropagation()}
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
}

export default React.memo(Window);
