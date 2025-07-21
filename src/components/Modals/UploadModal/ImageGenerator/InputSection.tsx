import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

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
        background: ${Color.white()};
        border-radius: 20px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border: 1px solid ${Color.borderGray()};
      `}
    >
      <div
        className={css`
          display: flex;
          gap: 1rem;
          align-items: flex-end;
          flex-direction: ${deviceIsMobile ? 'column' : 'row'};
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
              font-size: 0.9rem;
              font-weight: 600;
              color: ${Color.black()};
              margin-bottom: 0.5rem;
            `}
          >
            Prompt
            <span
              className={css`
                font-weight: 400;
                color: ${Color.gray()};
                font-size: 0.8rem;
                margin-left: 0.5rem;
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
              padding: 1rem 1.25rem;
              border: 2px solid ${Color.borderGray()};
              border-radius: 16px;
              font-size: 1rem;
              outline: none;
              transition: all 0.2s ease;
              background: ${Color.whiteGray()};
              box-sizing: border-box;
              font-family: inherit;
              resize: vertical;
              min-height: 80px;
              max-height: 200px;

              &:focus {
                border-color: ${Color.logoBlue()};
                box-shadow: 0 0 0 3px ${Color.lightBlue(0.1)};
              }

              &:disabled {
                background: ${Color.highlightGray()};
                cursor: not-allowed;
                color: ${Color.gray()};
              }

              &::placeholder {
                color: ${Color.gray()};
              }
            `}
          />
        </div>
        <button
          onClick={onGenerate}
          disabled={!prompt.trim() || isGenerating}
          className={css`
            padding: 1rem 2rem;
            background: ${!prompt.trim() || isGenerating
              ? Color.darkerGray()
              : Color.logoBlue()};
            color: white;
            border: none;
            border-radius: 16px;
            font-size: 1rem;
            font-weight: 600;
            cursor: ${!prompt.trim() || isGenerating
              ? 'not-allowed'
              : 'pointer'};
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            min-width: ${deviceIsMobile ? '100%' : '140px'};
            white-space: nowrap;

            &:hover:not(:disabled) {
              transform: translateY(-1px);
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }

            &:active:not(:disabled) {
              transform: translateY(0);
            }
          `}
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>
    </div>
  );
}
