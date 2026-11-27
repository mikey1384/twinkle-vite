import React from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { WEBSITE_AGENT_UI_ATTRIBUTE } from '~/helpers/websiteAgentPage';
import {
  resolveLumineRunBuildPath,
  type LumineRunPreviewData
} from '~/helpers/lumineRunCard';

export default function LumineRunPreview({
  preview,
  status,
  resultData
}: {
  preview: LumineRunPreviewData;
  status?: string;
  resultData?: any;
}) {
  const buildPath = resolveLumineRunBuildPath(preview, resultData);
  const started = status === 'approved';
  const failed = status === 'failed';
  const hasRemaining = Number.isFinite(Number(preview.remainingEnergyPercent));
  const waitingBehindOwnRun = Boolean(resultData?.waitingBehindOwnRun);

  return (
    <div className={previewClass} {...{ [WEBSITE_AGENT_UI_ATTRIBUTE]: '' }}>
      <div className={headingClass}>
        <Icon icon="bolt" />
        <span>Lumine run · {preview.appTitle}</span>
      </div>
      <p className={metaClass}>
        {preview.modeLabel ? `${preview.modeLabel} mode · ` : ''}
        About {Math.max(1, Math.round(Number(preview.estimatedEnergyPercent)))}%
        Energy
        {hasRemaining
          ? ` (${Math.max(0, Math.round(Number(preview.remainingEnergyPercent)))}% left)`
          : ''}
      </p>
      <p className={instructionClass}>{preview.instruction}</p>
      {started && (
        <div className={actionsClass}>
          <Link to={buildPath} className={openBuildButtonClass}>
            {waitingBehindOwnRun ? 'Open in Build' : 'Watch Lumine in Build'}
            <Icon icon="arrow-right" />
          </Link>
        </div>
      )}
      {failed && (
        <div className={actionsClass}>
          <Link to={buildPath} className={fallbackLinkClass}>
            Open Build page
            <Icon icon="arrow-right" />
          </Link>
        </div>
      )}
    </div>
  );
}

const previewClass = css`
  width: 100%;
  min-width: 0;
  padding: 0.9rem 1.1rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 1rem;
  background: #fff;
  color: #2f3747;
  font-size: 1.2rem;
`;

const headingClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
`;

const metaClass = css`
  margin: 0.3rem 0 0;
  color: #4c5767;
  font-size: 1.15rem;
`;

const instructionClass = css`
  margin: 0.55rem 0 0;
  padding: 0.55rem 0.75rem;
  border-radius: 0.7rem;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: #1e293b;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const actionsClass = css`
  margin-top: 0.7rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const openBuildButtonClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 1.15rem;
  border-radius: 999px;
  background: ${Color.logoBlue()};
  color: #fff;
  font-size: 1.25rem;
  font-weight: 700;
  text-decoration: none;
  &:hover {
    background: ${Color.logoBlue(0.88)};
    color: #fff;
  }
`;

const fallbackLinkClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: ${Color.logoBlue()};
  font-size: 1.2rem;
  font-weight: 700;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;
