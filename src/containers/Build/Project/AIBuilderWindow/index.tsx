import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Window from './Window';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useBuildContext } from '~/contexts';

interface AIBuilderWindowProps {
  initialPosition: { x: number; y: number };
  chatMessages: Array<{ role: string; content: string }>;
}

export default function AIBuilderWindow({
  initialPosition,
  chatMessages
}: AIBuilderWindowProps) {
  const onAddChatMessage = useBuildContext((v) => v.actions.onAddChatMessage);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onAddChatMessage({ message: { role: 'user', content: inputMessage } });
      setInputMessage('');
    }
  };

  const handleRunButtonClick = () => {
    // Implement the logic to run the code
  };

  return ReactDOM.createPortal(
    <Window initialPosition={initialPosition}>
      <div
        className={css`
          display: flex;
          height: 100%;
        `}
      >
        <div
          className={css`
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 16px;
            background-color: #f8f9fa;
          `}
        >
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
        <div
          className={css`
            flex: 1;
            border-left: 1px solid #dee2e6;
            padding: 16px;
            display: flex;
            flex-direction: column;
            background-color: #ffffff;
          `}
        >
          <div
            className={css`
              flex: 1;
              overflow-y: auto;
            `}
          >
            <h3
              className={css`
                margin-top: 0;
                color: #343a40;
              `}
            >
              Changes Since Last Run
            </h3>
            <p
              className={css`
                color: #495057;
              `}
            >
              List of changes goes here...
            </p>
          </div>
          <div
            className={css`
              width: 100%;
              margin-top: 16px;
            `}
          >
            <button
              onClick={handleRunButtonClick}
              disabled={false}
              className={css`
                width: 100%;
                padding: 12px 0;
                background-color: #198754;
                color: #fff;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1.1rem;
                transition: background-color 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;

                &:disabled {
                  background-color: #6c757d;
                  cursor: not-allowed;
                }

                &:hover:enabled {
                  background-color: #157347;
                }
              `}
            >
              <Icon icon="play" />
              <span
                className={css`
                  margin-left: 0.5rem;
                `}
              >
                Run
              </span>
            </button>
          </div>
        </div>
      </div>
    </Window>,
    document.body
  );
}
