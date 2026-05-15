import React from 'react';
import { css } from '@emotion/css';
import ProgressBar from '~/components/ProgressBar';
import {
  formatRuntimeAssetTransferProgressLabel,
  type RuntimeAssetTransferProgressPayload
} from './helpers/runtimeAssetTransferProgress';

const progressWrapClass = css`
  width: min(28rem, 100%);
  min-width: 16rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const progressLabelClass = css`
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.25;
`;

export default function RuntimeAssetTransferProgressBar({
  progress
}: {
  progress: RuntimeAssetTransferProgressPayload | null;
}) {
  if (!progress) return null;

  const progressPercent = Math.max(
    progress.status === 'running' ? 2 : 0,
    Math.min(100, progress.progressPercent)
  );

  return (
    <div
      className={progressWrapClass}
      role="status"
      aria-live="polite"
      aria-label="Runtime asset copy progress"
    >
      <span className={progressLabelClass}>
        {formatRuntimeAssetTransferProgressLabel(progress)}
      </span>
      <ProgressBar
        compactMode
        color={progress.status === 'error' ? '#be123c' : '#2563eb'}
        progress={progressPercent}
        text={`${Math.round(progressPercent)}%`}
      />
    </div>
  );
}
