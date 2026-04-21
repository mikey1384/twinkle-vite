import React from 'react';
import { css } from '@emotion/css';
import Button from '../Button';
import { buttonStyles, mergeButtonStyles } from './styles';

interface Props {
  hasVideoFile: boolean;
  isMergingInProgress: boolean;
  subtitlesCount: number;
  onMerge: () => void;
  onSave: () => void;
}

const actionBarStyles = css`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px 20px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(238, 238, 238, 0.8);
  display: flex;
  gap: 10px;
  justify-content: center;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
`;

export default function ActionBar({
  hasVideoFile,
  isMergingInProgress,
  subtitlesCount,
  onMerge,
  onSave
}: Props) {
  if (subtitlesCount === 0) {
    return null;
  }

  return (
    <div className={actionBarStyles}>
      <Button
        onClick={onSave}
        variant="primary"
        size="lg"
        className={`${buttonStyles.base} ${buttonStyles.primary}`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: '8px' }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Save Edited SRT
      </Button>
      <Button
        onClick={onMerge}
        variant="secondary"
        size="lg"
        disabled={!hasVideoFile || subtitlesCount === 0 || isMergingInProgress}
        className={mergeButtonStyles}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: '8px' }}
        >
          <path d="M14 3v4a1 1 0 0 0 1 1h4" />
          <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
          <path d="M12 11v6" />
          <path d="M9 14l3 -3l3 3" />
        </svg>
        Merge Video with Subtitles
      </Button>
    </div>
  );
}
