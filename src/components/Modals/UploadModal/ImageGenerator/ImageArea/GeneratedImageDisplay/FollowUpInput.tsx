import React from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import ActionButton from '../../ActionButton';
import { useRoleColor } from '~/theme/useRoleColor';

interface FollowUpInputProps {
  followUpPrompt: string;
  onFollowUpPromptChange: (value: string) => void;
  onFollowUpGenerate: () => void;
  isGenerating: boolean;
  isFollowUpGenerating: boolean;
  canAffordFollowUp?: boolean;
  energyLoading?: boolean;
  followUpEngine?: 'gemini' | 'openai';
  onFollowUpEngineChange: (engine: 'gemini' | 'openai') => void;
  followUpQuality?: 'low' | 'medium' | 'high';
  onFollowUpQualityChange: (quality: 'low' | 'medium' | 'high') => void;
  themeColor?: string;
}

export default function FollowUpInput({
  followUpPrompt,
  onFollowUpPromptChange,
  onFollowUpGenerate,
  isGenerating,
  isFollowUpGenerating,
  canAffordFollowUp = true,
  energyLoading = false,
  followUpEngine = 'gemini',
  onFollowUpEngineChange,
  followUpQuality = 'high',
  onFollowUpQualityChange,
  themeColor
}: FollowUpInputProps) {
  const themeRole = useRoleColor('button', {
    themeName: themeColor,
    fallback: themeColor || 'logoBlue'
  });

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
            font-size: 1rem;
            font-weight: 600;
            color: ${Color.black()};
            margin-bottom: 0;
          `}
        >
          Modify this image
        </label>
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.4rem;
            flex-wrap: wrap;
          `}
        >
          <select
            value={followUpEngine}
            onChange={(e) =>
              onFollowUpEngineChange(e.target.value as 'gemini' | 'openai')
            }
            disabled={isGenerating || isFollowUpGenerating}
            className={selectClassName}
            style={{
              borderColor: themeRole.getColor(0.32),
              color: themeRole.getColor()
            }}
          >
            <option value="openai">Image 1.5</option>
            <option value="gemini">Nano Banana</option>
          </select>
          {followUpEngine === 'openai' && (
            <select
              value={followUpQuality}
              onChange={(e) =>
                onFollowUpQualityChange(
                  e.target.value as 'low' | 'medium' | 'high'
                )
              }
              disabled={isGenerating || isFollowUpGenerating}
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
      <div
        className={css`
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 1rem;
          align-items: stretch;

          @media (max-width: ${mobileMaxWidth}) {
            grid-template-columns: 1fr;
          }
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
            font-size: 1rem;
            outline: none;
            transition: all 0.2s ease;
            width: 100%;
            min-width: 0;
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
            min-width: 8.5rem;
            justify-self: end;
            border-radius: 8px;

            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
              min-width: 0;
            }
          `}
        >
          {isGenerating || isFollowUpGenerating
            ? 'Modifying...'
            : energyLoading
            ? 'Checking Energy...'
            : !canAffordFollowUp
            ? 'Recharge Energy'
            : 'Modify'}
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
`;
