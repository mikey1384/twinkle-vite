import React from 'react';
import { css } from '@emotion/css';
import ProgressBar from '~/components/ProgressBar';

export default function UploadProgress({ progress }: { progress: number | null }) {
  const percentage = Math.floor(Math.max(0, Math.min(1, progress ?? 0)) * 100);
  const status =
    progress === null
      ? 'Preparing…'
      : percentage === 100
      ? 'Finishing…'
      : undefined;

  return (
    <div
      role="progressbar"
      aria-label="File upload"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress === null ? undefined : percentage}
      aria-valuetext={status || `${percentage}% uploaded`}
      style={{ width: '100%' }}
    >
      <ProgressBar
        progress={percentage}
        text={status}
        className={css`
          height: 18px;
          > span {
            font-size: 12px;
          }
        `}
      />
    </div>
  );
}
