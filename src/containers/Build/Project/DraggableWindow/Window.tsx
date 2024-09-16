import React, { useState, useCallback, useRef, useEffect } from 'react';
import { css } from '@emotion/css';

interface WindowProps {
  initialPosition: { x: number; y: number };
  onSendMessage: (message: string) => void;
  children: React.ReactNode;
}

function Window({ initialPosition, onSendMessage, children }: WindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [inputMessage, setInputMessage] = useState('');
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    e.stopPropagation();
    requestAnimationFrame(() => {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mouseleave', handleMouseUp);
    document.body.style.userSelect = '';
    document.body.style.pointerEvents = '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  return (
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

export default React.memo(Window);
