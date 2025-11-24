import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { isMobile } from '~/helpers';
import ActionButton from '../../ActionButton';

const deviceIsMobile = isMobile(navigator);

interface FollowUpInputProps {
  followUpPrompt: string;
  onFollowUpPromptChange: (value: string) => void;
  onFollowUpGenerate: () => void;
  isGenerating: boolean;
  isFollowUpGenerating: boolean;
  canAffordFollowUp?: boolean;
  followUpCost?: number;
  followUpEngine?: 'gemini' | 'openai';
  onFollowUpEngineChange: (engine: 'gemini' | 'openai') => void;
}

export default function FollowUpInput({
  followUpPrompt,
  onFollowUpPromptChange,
  onFollowUpGenerate,
  isGenerating,
  isFollowUpGenerating,
  canAffordFollowUp = true,
  followUpCost = 0,
  followUpEngine = 'gemini',
  onFollowUpEngineChange
}: FollowUpInputProps) {
  return (
    <div
      className={css`
        border-top: 1px solid var(--ui-border);
        padding-top: 1.5rem;
        margin-bottom: -0.5rem;
      `}
    >
      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        `}
      >
        <label
          className={css`
            display: block;
            font-size: 0.9rem;
            font-weight: 600;
            color: ${Color.black()};
            margin-bottom: 0;
          `}
        >
          Modify this image
        </label>
        <select
          value={followUpEngine}
          onChange={(e) =>
            onFollowUpEngineChange(e.target.value as 'gemini' | 'openai')
          }
          disabled={isGenerating || isFollowUpGenerating}
          className={css`
            padding: 0.2rem 0.5rem;
            border: 1px solid var(--ui-border);
            border-radius: 4px;
            font-size: 0.75rem;
            background: #fff;
            outline: none;
            color: #333;
          `}
        >
          <option value="gemini">Nano Banana Pro</option>
          <option value="openai">GPT Image-1</option>
        </select>
      </div>
      <div
        className={css`
          display: flex;
          gap: 1rem;
          align-items: flex-end;
          flex-direction: ${deviceIsMobile ? 'column' : 'row'};
        `}
      >
        <input
          placeholder="Make it more colorful, add mountains, change to winter..."
          value={followUpPrompt}
          onChange={(e) => onFollowUpPromptChange(e.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !isGenerating &&
              !isFollowUpGenerating
            ) {
              onFollowUpGenerate();
            }
          }}
          disabled={isGenerating || isFollowUpGenerating}
          className={css`
            flex: 1;
            padding: 0.875rem 1rem;
            border: 2px solid var(--ui-border);
            border-radius: 10px;
            font-size: 0.95rem;
            outline: none;
            transition: all 0.2s ease;
            width: 100%;
            box-sizing: border-box;

            &:focus {
              border-color: ${Color.orange()};
              box-shadow: 0 0 0 3px ${Color.orange(0.1)};
            }

            &::placeholder {
              color: ${Color.gray()};
            }
          `}
        />

        {/* Cost display for follow-up */}
        {followUpCost > 0 && (
          <div
            className={css`
              padding: 0.5rem 0.75rem;
              background: ${canAffordFollowUp ? '#f0f9ff' : '#fef2f2'};
              border: 1px solid ${canAffordFollowUp ? '#bae6fd' : '#fecaca'};
              border-radius: 8px;
              font-size: 0.75rem;
              text-align: center;
              min-width: ${deviceIsMobile ? '100%' : '100px'};
            `}
          >
            <div
              className={css`
                color: ${canAffordFollowUp ? '#0369a1' : '#dc2626'};
                font-weight: 600;
              `}
            >
              {followUpCost.toLocaleString()} coins
            </div>
          </div>
        )}

        <ActionButton
          onClick={onFollowUpGenerate}
          disabled={
            !followUpPrompt.trim() ||
            isGenerating ||
            isFollowUpGenerating ||
            !canAffordFollowUp
          }
          variant="secondary"
          className={css`
            min-width: ${deviceIsMobile ? '100%' : '120px'};
            border-radius: 10px;
          `}
        >
          {isGenerating || isFollowUpGenerating
            ? 'Modifying...'
            : !canAffordFollowUp
            ? 'Insufficient Coins'
            : 'Modify'}
        </ActionButton>
      </div>
    </div>
  );
}
