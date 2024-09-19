import React, { useState } from 'react';
import { css } from '@emotion/css';
import { useBuildContext } from '~/contexts';

interface ChatSectionProps {
  chatMessages: Array<{ role: string; content: string }>;
}

export default function ChatSection({ chatMessages }: ChatSectionProps) {
  const onAddChatMessage = useBuildContext((v) => v.actions.onAddChatMessage);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onAddChatMessage({ message: { role: 'user', content: inputMessage } });
      setInputMessage('');
    }
  };

  return (
    <div
      className={css`
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: #f8f9fa;
        border-right: 1px solid #dee2e6;
        overflow-x: hidden;
      `}
    >
      {/* Chat messages */}
      <div
        className={css`
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        `}
      >
        {chatMessages.map((message, index) => (
          <div
            key={index}
            className={css`
              padding: 12px 16px;
              border-radius: 20px;
              background-color: ${message.role === 'user'
                ? '#d1e7dd'
                : '#e2e3e5'};
              align-self: ${message.role === 'user'
                ? 'flex-end'
                : 'flex-start'};
              max-width: 75%;
              color: ${message.role === 'user' ? '#0f5132' : '#495057'};
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              margin-bottom: 10px;
              word-wrap: break-word;
            `}
          >
            {message.content}
          </div>
        ))}
      </div>
      {/* Input form */}
      <form
        onSubmit={handleSendMessage}
        className={css`
          padding: 16px;
          background-color: #fff;
          border-top: 1px solid #dee2e6;
          display: flex;
        `}
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          className={css`
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #ced4da;
            border-radius: 20px;
            font-size: 1rem;
            outline: none;
            transition: border-color 0.2s;

            &:focus {
              border-color: #80bdff;
            }
          `}
        />
        <button
          type="submit"
          className={css`
            margin-left: 12px;
            padding: 0 20px;
            background-color: #0d6efd;
            color: #fff;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-size: 1rem;
            transition: background-color 0.3s;

            &:hover {
              background-color: #0b5ed7;
            }
          `}
        >
          Send
        </button>
      </form>
    </div>
  );
}
