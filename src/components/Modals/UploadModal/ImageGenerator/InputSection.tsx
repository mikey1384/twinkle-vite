import React from 'react';
import { css } from '@emotion/css';
import ActionButton from './ActionButton';

interface InputSectionProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  isGenerating: boolean;
}

export default function InputSection({
  prompt,
  onPromptChange,
  onGenerate,
  onKeyDown,
  isGenerating
}: InputSectionProps) {
  return (
    <div
      className={css`
        background: #ffffff;
        border-radius: 16px;
        padding: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border: 1px solid #e0e0e0;

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
              font-size: 0.85rem;
              font-weight: 600;
              color: #333333;
              margin-bottom: 0.5rem;

              @media (min-width: 768px) {
                font-size: 0.9rem;
              }
            `}
          >
            Prompt
            <span
              className={css`
                font-weight: 400;
                color: #888888;
                font-size: 0.75rem;
                margin-left: 0.5rem;

                @media (min-width: 768px) {
                  font-size: 0.8rem;
                }
              `}
            >
              (Ctrl+Enter to generate)
            </span>
          </label>
          <textarea
            placeholder="A serene mountain landscape at sunset with a crystal-clear lake reflecting the orange and pink hues of the sky, surrounded by snow-capped peaks and tall pine trees..."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isGenerating}
            rows={3}
            className={css`
              width: 100%;
              padding: 0.875rem 1rem;
              border: 2px solid #e0e0e0;
              border-radius: 12px;
              font-size: 0.95rem;
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
                font-size: 1rem;
              }
            `}
          />
        </div>
        <ActionButton
          onClick={onGenerate}
          disabled={!prompt.trim() || isGenerating}
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
          {isGenerating ? 'Generating...' : 'Generate'}
        </ActionButton>
      </div>
    </div>
  );
}
