import React, { useState } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';

export default function AIWidget({
  widgetId,
  name,
  latestOutput
}: {
  widgetId: number;
  name: string;
  latestOutput: string;
}) {
  const [output, setOutput] = useState(latestOutput);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sendPromptToAI = useAppContext((v) => v.requestHelpers.sendPromptToAI);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSendPrompt = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const result = await sendPromptToAI(widgetId, input);
      setOutput(result.output);
      setInput('');
    } catch (error) {
      console.error(error);
      setOutput('An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary componentPath="Home/AI/AIWidget">
      <div
        className={css`
          display: flex;
          flex-direction: column;
          background: #fff;
          padding: 16px;
          margin: 16px 0;
          border: 1px solid ${Color.borderGray()};
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `}
      >
        <h3
          className={css`
            font-size: 1.3rem;
            font-weight: bold;
            margin-bottom: 12px;
          `}
        >
          {name}
        </h3>
        <div
          className={css`
            font-size: 1rem;
            color: ${Color.darkerGray()};
            margin: 12px 0;
            min-height: 60px;
            background: ${Color.highlightGray()};
            padding: 10px;
            border-radius: 4px;
          `}
        >
          {loading ? <Loading text="Processing..." /> : output}
        </div>
        <div
          className={css`
            display: flex;
            align-items: center;
          `}
        >
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            className={css`
              flex: 1;
              padding: 8px;
              font-size: 1rem;
              border: 1px solid ${Color.borderGray()};
              border-radius: 4px;
              &:focus {
                outline: none;
                border-color: ${Color.blue()};
              }
            `}
            placeholder="Enter your prompt..."
          />
          <button
            onClick={handleSendPrompt}
            disabled={loading || !input.trim()}
            className={css`
              background: ${Color.blue()};
              color: white;
              border: none;
              border-radius: 4px;
              padding: 8px 16px;
              margin-left: 8px;
              cursor: pointer;
              font-size: 1rem;
              opacity: ${loading || !input.trim() ? 0.5 : 1};
              ${loading || !input.trim()
                ? ''
                : '&:hover { filter: brightness(110%); }'}
              display: flex;
              align-items: center;
              justify-content: center;
              transition: opacity 0.2s, filter 0.2s;
            `}
          >
            <Icon icon="paper-plane" style={{ marginRight: '5px' }} />
            Send
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}
