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
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you today?' },
    { role: 'user', content: 'Can you explain what React hooks are?' },
    {
      role: 'assistant',
      content:
        'React hooks are functions that allow you to use state and other React features in functional components. Some common hooks include useState, useEffect, and useContext.'
    }
  ]);
  const [input, setInput] = useState('');

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input.trim() }]);
      setInput('');
      // Here you would typically send the input to your AI service and handle the response
    }
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
        AI Chat Window
      </div>
      <div
        className={css`
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        `}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={css`
              margin-bottom: 8px;
              padding: 8px;
              border-radius: 4px;
              background-color: ${message.role === 'user' ? '#dcf8c6' : '#fff'};
              align-self: ${message.role === 'user'
                ? 'flex-end'
                : 'flex-start'};
              max-width: 80%;
            `}
          >
            {message.content}
          </div>
        ))}
      </div>
      <form
        onSubmit={handleSubmit}
        className={css`
          display: flex;
          padding: 8px;
          border-top: 1px solid #ccc;
        `}
      >
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className={css`
            flex: 1;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
          `}
        />
        <button
          type="submit"
          className={css`
            margin-left: 8px;
            padding: 8px 16px;
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
