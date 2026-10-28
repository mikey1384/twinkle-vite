import React from 'react';
import { css, keyframes } from '@emotion/css';
import Icon from '~/components/Icon';
import {
  PAPER,
  paperPrimaryButtonCls,
  paperSecondaryButtonCls,
  paperWorkingDotsCls
} from '../paperTheme';
import type { DailyPictureJob } from '~/helpers/dailyPictureJobs';

export default function PictureDayProgress({
  job,
  onClose,
  onCheck,
  onReturnToEditor
}: {
  job: DailyPictureJob;
  onClose: () => void;
  onCheck: () => void;
  onReturnToEditor: () => void;
}) {
  const uncertain = job.status === 'unconfirmed';
  return (
    <div className={wrapCls}>
      <div className={artCls} aria-hidden="true">
        {!uncertain && <div className={ringCls} />}
        <Icon icon={uncertain ? 'image' : 'palette'} />
      </div>
      <div role="status" aria-live="polite" className={statusCls}>
        <h2>
          {uncertain
            ? 'Let’s check on your picture'
            : job.status === 'checking'
              ? 'Checking on your picture'
              : 'Painting your picture'}
        </h2>
        <p>
          {uncertain
            ? 'We couldn’t confirm the result yet. You can check again or return to the editor. Your original picture may still arrive.'
            : 'This can take a few minutes.'}
        </p>
      </div>
      {!uncertain && (
        <span className={paperWorkingDotsCls} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      )}
      <p className={noticeCls}>
        You can close this screen and keep using Twinkle. We’ll let you know
        here when your picture is ready.
      </p>
      {uncertain && (
        <>
          <button
            type="button"
            className={paperPrimaryButtonCls}
            onClick={onCheck}
          >
            Check again
          </button>
          <button
            type="button"
            className={paperSecondaryButtonCls}
            onClick={onReturnToEditor}
          >
            Return to editor
          </button>
        </>
      )}
      <button
        type="button"
        className={uncertain ? paperSecondaryButtonCls : paperPrimaryButtonCls}
        onClick={onClose}
      >
        Continue browsing <Icon icon="arrow-right" />
      </button>
      <details className={descriptionCls}>
        <summary>Your description</summary>
        <p>{job.prompt}</p>
        {job.style && <p>Style: {job.style}</p>}
      </details>
    </div>
  );
}

const turn = keyframes`to { transform: rotate(360deg); }`;
const wrapCls = css`
  width: 100%;
  max-width: 46rem;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2.4rem 0.8rem 1.6rem;
  text-align: center;
  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
    }
  }
`;
const artCls = css`
  position: relative;
  display: grid;
  place-items: center;
  width: 9.6rem;
  height: 9.6rem;
  border-radius: 50%;
  background: ${PAPER.paperDeep};
  color: ${PAPER.accent};
  > svg {
    font-size: 3.8rem;
  }
`;
const ringCls = css`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid ${PAPER.line};
  border-top-color: ${PAPER.accent};
  animation: ${turn} 1.8s linear infinite;
`;
const statusCls = css`
  h2 {
    margin: 0 0 0.8rem;
    font-family: ${PAPER.serif};
    font-size: 2.6rem;
    font-weight: 500;
    line-height: 1.2;
    color: ${PAPER.ink};
  }
  p {
    margin: 0;
    font-size: 1.5rem;
    line-height: 1.5;
    color: ${PAPER.inkSoft};
  }
`;
const noticeCls = css`
  max-width: 34rem;
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  line-height: 1.6;
  color: ${PAPER.inkSoft};
`;
const descriptionCls = css`
  margin-top: 0.8rem;
  width: 100%;
  font-size: 1.3rem;
  color: ${PAPER.inkSoft};
  summary {
    cursor: pointer;
    padding: 0.6rem;
  }
  p {
    text-align: left;
    line-height: 1.6;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
`;
