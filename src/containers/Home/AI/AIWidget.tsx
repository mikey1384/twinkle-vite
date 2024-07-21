import React, { useState } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';

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
    setLoading(true);
    try {
      const result = await sendPromptToAI(widgetId, input);
      setOutput(result.output);
      setInput('');
    } catch (error) {
      console.error(error);
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
          border: 1px solid gray;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `}
      >
        <h2
          className={css`
            font-size: 1.5rem;
            font-weight: bold;
          `}
        >
          {name}
        </h2>
        <div
          className={css`
            font-size: 1rem;
            color: #666;
            margin: 16px 0;
          `}
        >
          {output}
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
              border: 1px solid #ccc;
              border-radius: 4px;
            `}
            placeholder="Enter your prompt..."
          />
          <button
            onClick={handleSendPrompt}
            disabled={loading}
            className={css`
              background: ${Color.blue()};
              color: white;
              border: none;
              border-radius: 4px;
              padding: 8px 16px;
              margin-left: 8px;
              cursor: pointer;
              font-size: 1rem;
              ${loading ? '' : '&:hover { filter: brightness(110%); }'}
              display: flex;
              align-items: center;
              justify-content: center;
            `}
          >
            <Icon icon="paper-plane" />
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}
