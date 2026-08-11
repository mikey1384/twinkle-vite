import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { parseMessageSettings } from './messageSettings';

export interface BuildCardTargetSummaryData {
  icon: string;
  label: string;
  detail?: string;
  thumbUrl?: string;
}

// The compact stand-in for a build card when it is quoted as a reply target.
// The full cards (BuildContributionSubmission, BuildThumbnailSuggestion) carry
// their meaning in `settings`, not `content`, so quoting them by content alone
// produces an empty gray box.
export function getBuildCardTargetSummary(
  message: any
): BuildCardTargetSummaryData | null {
  if (!message || !Number(message.rootId || 0)) return null;
  const rootType = String(message.rootType || '');
  if (rootType === 'buildThumbnailSuggestion') {
    const suggestion =
      parseMessageSettings(message.settings)?.buildThumbnailSuggestion || {};
    const rootBuildId = Math.floor(Number(suggestion?.rootBuildId) || 0);
    const branchBuildId = Math.floor(Number(suggestion?.branchBuildId) || 0);
    const thumbUrl = String(suggestion?.suggestedThumbnailUrl || '').trim();
    // Match the full card's validity boundary. Older or malformed messages
    // should keep showing their original content instead of acquiring a
    // plausible-looking summary for a card the UI itself cannot render.
    if (!rootBuildId || !branchBuildId || !thumbUrl) return null;
    const branchNumber = Math.floor(Number(suggestion?.branchNumber) || 0);
    return {
      icon: 'image',
      label: `Suggested a thumbnail for ${String(
        suggestion?.title || 'a project'
      )}`,
      detail: branchNumber > 0 ? `Branch #${branchNumber}` : '',
      thumbUrl
    };
  }
  if (rootType === 'buildContributionSubmission') {
    const submission =
      parseMessageSettings(message.settings)?.buildContributionSubmission || {};
    const rootBuildId = Math.floor(Number(submission?.rootBuildId) || 0);
    const branchBuildId = Math.floor(Number(submission?.branchBuildId) || 0);
    if (!rootBuildId || !branchBuildId) return null;
    return {
      icon: 'code-branch',
      label: `Made updates to ${String(submission?.title || 'a project')}`,
      detail: String(submission?.branchLabel || '')
    };
  }
  return null;
}

export default function BuildCardTargetSummary({
  summary,
  children,
  style
}: {
  summary: BuildCardTargetSummaryData;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style} className={containerClass}>
      <div className={textBlockClass}>
        <div className={labelClass}>
          <Icon icon={summary.icon} />
          <span>{summary.label}</span>
        </div>
        {summary.detail ? (
          <div className={detailClass}>{summary.detail}</div>
        ) : null}
        {children}
      </div>
      {summary.thumbUrl ? (
        <img
          className={thumbClass}
          src={summary.thumbUrl}
          alt="Suggested thumbnail"
          loading="lazy"
        />
      ) : null}
    </div>
  );
}

const containerClass = css`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const textBlockClass = css`
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const labelClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: ${Color.darkerGray()};
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.4;
  > svg {
    margin-top: 0.25rem;
    flex-shrink: 0;
  }
`;

const detailClass = css`
  color: ${Color.darkGray()};
  font-size: 1.1rem;
  font-weight: 700;
`;

const thumbClass = css`
  flex: 0 0 auto;
  width: 10rem;
  max-width: 35%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid ${Color.borderGray()};
  background: ${Color.wellGray()};
`;
