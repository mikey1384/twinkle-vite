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
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 16px;
        background-color: #f8f9fa;
      `}
    >
      {/* Chat messages */}
      <div
        className={css`
          flex: 1;
          overflow-y: auto;
          margin-bottom: 16px;
        `}
      >
        {chatMessages.map((message, index) => (
          <div
            key={index}
            className={css`
              padding: 12px;
              border-radius: 8px;
              background-color: ${message.role === 'user'
                ? '#d1e7dd'
                : '#e2e3e5'};
              align-self: ${message.role === 'user'
                ? 'flex-end'
                : 'flex-start'};
              max-width: 80%;
              color: ${message.role === 'user' ? '#0f5132' : '#495057'};
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              margin-bottom: 8px;
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
          display: flex;
          justify-content: center;
          padding: 8px;
        `}
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          className={css`
            width: 50%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-right: 8px;
          `}
        />
        <button
          type="submit"
          className={css`
            padding: 8px 16px;
            background-color: #0d6efd;
            color: #fff;
            border: none;
            border-radius: 4px;
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
