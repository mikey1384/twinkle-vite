import React from 'react';
import { css } from '@emotion/css';
import ActionButton from './ActionButton';

interface InputSectionProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  isGenerating: boolean;
  canAffordGeneration?: boolean;
  generationCost?: number;
  twinkleCoins?: number;
  engine: 'gemini' | 'openai';
  onEngineChange: (engine: 'gemini' | 'openai') => void;
}

export default function InputSection({
  prompt,
  onPromptChange,
  onGenerate,
  onKeyDown,
  isGenerating,
  canAffordGeneration = true,
  generationCost = 0,
  twinkleCoins = 0,
  engine,
  onEngineChange
}: InputSectionProps) {
  return (
    <div
      className={css`
        background: #ffffff;
        border-radius: 16px;
        padding: 1rem;
        border: 1px solid var(--ui-border);

        @media (min-width: 768px) {
          padding: 1.5rem;
        }
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: stretch;

          @media (min-width: 768px) {
            gap: 0.5rem;
          }
        `}
      >
        <div
          className={css`
            flex: 1;
            width: 100%;
          `}
        >
          <label
            className={css`
              display: block;
              font-size: 1rem;
              font-weight: 600;
              color: #333333;
              margin-bottom: 0.5rem;

              @media (min-width: 768px) {
                font-size: 1.1rem;
              }
            `}
          >
            Prompt
            <span
              className={css`
                font-weight: 400;
                color: #888888;
                font-size: 0.8rem;
                margin-left: 0.5rem;

                @media (min-width: 768px) {
                  font-size: 0.9rem;
                }
              `}
            >
              (Ctrl+Enter to generate)
            </span>
          </label>
          {/* Engine selector hidden - hardcoded to image-1 (openai) */}
          {false && (
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
              `}
            >
              <select
                value={engine}
                onChange={(e) =>
                  onEngineChange(e.target.value as 'gemini' | 'openai')
                }
                disabled={isGenerating}
                className={css`
                  padding: 0.25rem 0.5rem;
                  border: 1px solid var(--ui-border);
                  border-radius: 4px;
                  font-size: 0.8rem;
                  background: #fff;
                  outline: none;
                  color: #333;
                `}
              >
                <option value="gemini">Nano Banana Pro</option>
                <option value="openai">GPT Image-1</option>
              </select>
            </div>
          )}
          <textarea
            placeholder="A magical forest with glowing mushrooms and fireflies, Japanese anime style..."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isGenerating}
            rows={3}
            className={css`
              width: 100%;
              padding: 0.875rem 1rem;
              border: 2px solid var(--ui-border);
              border-radius: 12px;
              font-size: 1.1rem;
              outline: none;
              transition: all 0.2s ease;
              background: #f8fafc;
              box-sizing: border-box;
              font-family: inherit;
              resize: vertical;
              min-height: 80px;
              max-height: 180px;

              &:focus {
                border-color: #007bff;
                box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
              }

              &:disabled {
                background: #e9ecef;
                cursor: not-allowed;
                color: #888888;
                opacity: 0.6;
              }

              &::placeholder {
                color: #888888;
              }

              @media (min-width: 768px) {
                font-size: 1.2rem;
              }
            `}
          />
        </div>

        {/* Cost display */}
        {generationCost > 0 && (
          <div
            className={css`
              margin-top: 0.5rem;
              padding: 0.75rem;
              background: ${canAffordGeneration ? '#f0f9ff' : '#fef2f2'};
              border: 1px solid ${canAffordGeneration ? '#bae6fd' : '#fecaca'};
              border-radius: 8px;
              font-size: 1rem;
              text-align: center;

              @media (min-width: 768px) {
                margin-top: 0;
                margin-left: 1rem;
                flex-shrink: 0;
              }
            `}
          >
            <div
              className={css`
                color: ${canAffordGeneration ? '#0369a1' : '#dc2626'};
                font-weight: 600;
              `}
            >
              Cost: {generationCost.toLocaleString()} coins
            </div>
            <div
              className={css`
                color: ${canAffordGeneration ? '#0284c7' : '#ef4444'};
                font-size: 0.85rem;
                margin-top: 0.25rem;
              `}
            >
              Balance: {twinkleCoins.toLocaleString()} coins
            </div>
          </div>
        )}

        <ActionButton
          onClick={onGenerate}
          disabled={!prompt.trim() || isGenerating || !canAffordGeneration}
          variant="primary"
          fullWidth={true}
          className={css`
            margin-top: 0.5rem;
            align-self: stretch;

            @media (min-width: 768px) {
              width: auto;
              margin-top: 0;
              align-self: flex-end;
            }
          `}
        >
          {isGenerating
            ? 'Generating...'
            : !canAffordGeneration
            ? 'Insufficient Coins'
            : 'Generate'}
        </ActionButton>
      </div>
    </div>
  );
}
