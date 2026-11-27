import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { WEBSITE_AGENT_UI_ATTRIBUTE } from '~/helpers/websiteAgentPage';
import {
  hasFiniteRemainingEnergyPercent,
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
  const remainingEnergyPercent = hasFiniteRemainingEnergyPercent(
    preview.remainingEnergyPercent
  )
    ? preview.remainingEnergyPercent
    : null;
  const waitingBehindOwnRun = Boolean(resultData?.waitingBehindOwnRun);
  const instructionRef = useRef<HTMLParagraphElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [preview.instruction]);

  useEffect(() => {
    const element = instructionRef.current;
    if (!element || expanded) return;
    const measure = () => {
      setIsTruncated(element.scrollHeight > element.clientHeight + 1);
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [preview.instruction, expanded]);

  return (
    <div className={previewClass} {...{ [WEBSITE_AGENT_UI_ATTRIBUTE]: '' }}>
      <div className={headingClass}>
        <Icon icon="bolt" className={headingIconClass} />
        <span className={headingTitleClass}>
          Lumine run · {preview.appTitle}
        </span>
      </div>
      <p className={metaClass}>
        {preview.modeLabel ? `${preview.modeLabel} mode · ` : ''}
        About {Math.max(1, Math.round(Number(preview.estimatedEnergyPercent)))}%
        Energy
        {remainingEnergyPercent !== null
          ? ` (${Math.max(0, Math.round(remainingEnergyPercent))}% left)`
          : ''}
      </p>
      <div className={instructionBoxClass}>
        <p
          ref={instructionRef}
          className={
            expanded
              ? instructionTextExpandedClass
              : instructionTextClampedClass
          }
        >
          {preview.instruction}
        </p>
        {(isTruncated || expanded) && (
          <button
            type="button"
            className={toggleInstructionButtonClass}
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'Show less' : 'Show full instruction'}
          </button>
        )}
      </div>
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
  align-items: flex-start;
  gap: 0.6rem;
  font-weight: 700;
  min-width: 0;
`;

const headingIconClass = css`
  flex-shrink: 0;
  margin-top: 0.25rem;
`;

const headingTitleClass = css`
  min-width: 0;
  overflow-wrap: anywhere;
`;

const metaClass = css`
  margin: 0.3rem 0 0;
  color: #4c5767;
  font-size: 1.15rem;
`;

const instructionBoxClass = css`
  margin: 0.55rem 0 0;
  padding: 0.55rem 0.75rem;
  border-radius: 0.7rem;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: #1e293b;
  min-width: 0;
`;

const instructionTextClampedClass = css`
  margin: 0;
  padding: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const instructionTextExpandedClass = css`
  margin: 0;
  padding: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const toggleInstructionButtonClass = css`
  margin-top: 0.35rem;
  padding: 0.45rem 0;
  min-height: 3.6rem;
  border: 0;
  background: transparent;
  color: ${Color.logoBlue()};
  font-size: 1.15rem;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
  @media (max-width: 767px) {
    min-height: 4.5rem;
  }
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
  min-height: 3.8rem;
  padding: 0.75rem 1.25rem;
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
  @media (max-width: 767px) {
    min-height: 5rem;
  }
`;

const fallbackLinkClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 3.8rem;
  padding: 0.75rem 0.9rem;
  margin-left: -0.9rem;
  border-radius: 0.6rem;
  color: ${Color.logoBlue()};
  font-size: 1.2rem;
  font-weight: 700;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
  @media (max-width: 767px) {
    min-height: 5rem;
  }
`;
