import React, { useState } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { mobileMaxWidth } from '~/constants/css';

const AIWidget = ({
  name,
  initialOutput
}: {
  name: string;
  initialOutput: string;
}) => {
  const [output, setOutput] = useState(initialOutput);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    // Simulating API call to the AI service
    setTimeout(() => {
      setOutput(`AI response to: ${input}`);
      setInput('');
      setLoading(false);
    }, 1000);
  };

  return (
    <div
      className={css`
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      `}
    >
      <h3
        className={css`
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 1.2rem;
        `}
      >
        {name}
      </h3>
      <div
        className={css`
          background: #f5f5f5;
          border: 1px solid #eee;
          border-radius: 4px;
          padding: 12px;
          min-height: 100px;
          margin-bottom: 12px;
        `}
      >
        {loading ? <Loading text="Processing..." /> : output}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your prompt"
          className={css`
            width: 100%;
            padding: 8px;
            margin-bottom: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          `}
        />
        <button
          type="submit"
          disabled={loading}
          className={css`
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            &:hover {
              background: #0056b3;
            }
            &:disabled {
              background: #ccc;
              cursor: not-allowed;
            }
          `}
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default function AI() {
  const [loading, setLoading] = useState(true);

  // Simulated AI widgets data
  const aiWidgets = [
    {
      id: 1,
      name: 'Text Summarizer',
      initialOutput: 'Ready to summarize text.'
    },
    {
      id: 2,
      name: 'Code Assistant',
      initialOutput: 'Ready to assist with coding.'
    },
    {
      id: 3,
      name: 'Creative Writer',
      initialOutput: 'Ready to generate creative content.'
    }
  ];

  React.useEffect(() => {
    // Simulating data loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <ErrorBoundary componentPath="Home/AI">
      <div
        className={css`
          display: flex;
          flex-direction: column;
          padding: 16px;
        `}
      >
        {loading ? (
          <Loading text="Loading AI Widgets..." />
        ) : (
          <>
            <h2
              className={css`
                margin-bottom: 16px;
                font-size: 1.5rem;
              `}
            >
              Your AI Widgets
            </h2>
            {aiWidgets.map((widget) => (
              <AIWidget
                key={widget.id}
                name={widget.name}
                initialOutput={widget.initialOutput}
              />
            ))}
          </>
        )}
        <div
          className={css`
            height: 7rem;
            @media (max-width: ${mobileMaxWidth}) {
              display: block;
            }
          `}
        />
      </div>
    </ErrorBoundary>
  );
}
