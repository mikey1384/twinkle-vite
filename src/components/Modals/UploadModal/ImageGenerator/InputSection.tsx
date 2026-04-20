import React from 'react';
import { css } from '@emotion/css';
import ActionButton from './ActionButton';
import { useRoleColor } from '~/theme/useRoleColor';

interface InputSectionProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  isGenerating: boolean;
  canAffordGeneration?: boolean;
  energyLoading?: boolean;
  engine: 'gemini' | 'openai';
  onEngineChange: (engine: 'gemini' | 'openai') => void;
  quality: 'low' | 'medium' | 'high';
  onQualityChange: (quality: 'low' | 'medium' | 'high') => void;
  themeColor?: string;
}

export default function InputSection({
  prompt,
  onPromptChange,
  onGenerate,
  onKeyDown,
  isGenerating,
  canAffordGeneration = true,
  energyLoading = false,
  engine,
  onEngineChange,
  quality,
  onQualityChange,
  themeColor
}: InputSectionProps) {
  const themeRole = useRoleColor('button', {
    themeName: themeColor,
    fallback: themeColor || 'logoBlue'
  });

  return (
    <div
      className={css`
        background: transparent;
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          align-items: stretch;
        `}
      >
        <div
          className={css`
            flex: 1;
            width: 100%;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.8rem;
              margin-bottom: 0.55rem;
              flex-wrap: wrap;
            `}
          >
            <label
              className={css`
                display: flex;
                align-items: center;
                font-size: 1rem;
                font-weight: 800;
                color: #333333;

                @media (min-width: 768px) {
                  font-size: 1.05rem;
                }
              `}
            >
              Prompt
            </label>
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 0.45rem;
                flex-wrap: wrap;
              `}
            >
              <select
                value={engine}
                onChange={(e) =>
                  onEngineChange(e.target.value as 'gemini' | 'openai')
                }
                disabled={isGenerating}
                className={selectClassName}
                style={{
                  borderColor: themeRole.getColor(0.32),
                  color: themeRole.getColor()
                }}
              >
                <option value="openai">Image 1.5</option>
                <option value="gemini">Nano Banana</option>
              </select>
              {engine === 'openai' && (
                <select
                  value={quality}
                  onChange={(e) =>
                    onQualityChange(
                      e.target.value as 'low' | 'medium' | 'high'
                    )
                  }
                  disabled={isGenerating}
                  className={selectClassName}
                  style={{
                    borderColor: themeRole.getColor(0.32),
                    color: themeRole.getColor()
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              )}
            </div>
          </div>
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
              border: 1px solid ${themeRole.getColor(0.42)};
              border-radius: 8px;
              font-size: 1.7rem;
              line-height: 1.45;
              outline: none;
              transition: all 0.2s ease;
              background: #fff;
              box-sizing: border-box;
              font-family: inherit;
              resize: vertical;
              min-height: 92px;
              max-height: 180px;

              &:focus {
                border-color: ${themeRole.getColor(0.78)};
                box-shadow: 0 0 0 3px ${themeRole.getColor(0.1)};
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
                font-size: 1.7rem;
              }

              @media (max-width: 768px) {
                font-size: 16px;
                line-height: 1.6;
              }
            `}
          />
        </div>

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
              min-width: 12rem;
            }
          `}
        >
          {isGenerating
            ? 'Generating...'
            : energyLoading
            ? 'Checking Energy...'
            : !canAffordGeneration
            ? 'Recharge Energy'
            : 'Generate'}
        </ActionButton>
      </div>
    </div>
  );
}

const selectClassName = css`
  padding: 0.48rem 0.7rem;
  border: 1px solid;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 700;
  background: #fff;
  outline: none;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
