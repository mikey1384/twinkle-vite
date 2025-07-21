import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

interface FollowUpInputProps {
  followUpPrompt: string;
  onFollowUpPromptChange: (value: string) => void;
  onFollowUpGenerate: () => void;
  isGenerating: boolean;
  isFollowUpGenerating: boolean;
}

export default function FollowUpInput({
  followUpPrompt,
  onFollowUpPromptChange,
  onFollowUpGenerate,
  isGenerating,
  isFollowUpGenerating
}: FollowUpInputProps) {
  return (
    <div
      className={css`
        border-top: 1px solid ${Color.borderGray()};
        padding-top: 1.5rem;
        margin-bottom: -0.5rem;
      `}
    >
      <label
        className={css`
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: ${Color.black()};
          margin-bottom: 0.75rem;
        `}
      >
        Modify this image
      </label>
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
            border: 2px solid ${Color.borderGray()};
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
        <button
          onClick={onFollowUpGenerate}
          disabled={
            !followUpPrompt.trim() || isGenerating || isFollowUpGenerating
          }
          className={css`
            padding: 0.875rem 1.5rem;
            background: ${!followUpPrompt.trim() ||
            isGenerating ||
            isFollowUpGenerating
              ? Color.darkerGray()
              : Color.orange()};
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: ${!followUpPrompt.trim() ||
            isGenerating ||
            isFollowUpGenerating
              ? 'not-allowed'
              : 'pointer'};
            transition: all 0.2s ease;
            min-width: ${deviceIsMobile ? '100%' : '120px'};
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

            &:hover:not(:disabled) {
              transform: translateY(-1px);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }
          `}
        >
          {isGenerating || isFollowUpGenerating ? 'Modifying...' : 'Modify'}
        </button>
      </div>
    </div>
  );
}
