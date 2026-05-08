import React from 'react';
import { css } from '@emotion/css';
import type { BuildContributionStatus, BuildLike } from './types';

const splitClass = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
`;

const rowClass = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
`;

const mutedTextClass = css`
  color: var(--chat-text);
  opacity: 0.68;
  font-size: 1.1rem;
  font-weight: 700;
`;

const listClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const contributionButtonClass = css`
  border: 1px solid var(--ui-border);
  background: #fff;
  color: var(--chat-text);
  border-radius: 8px;
  padding: 0.7rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  cursor: pointer;
  text-align: left;
  &:hover,
  &.selected {
    border-color: rgba(65, 140, 235, 0.42);
    background: rgba(65, 140, 235, 0.08);
  }
`;

const contributionTitleClass = css`
  font-weight: 900;
  font-size: 1.1rem;
`;

function normalizeContributionStatus(value: unknown): BuildContributionStatus {
  const normalized = String(value || '').trim();
  if (
    normalized === 'draft' ||
    normalized === 'merging' ||
    normalized === 'merged'
  ) {
    return normalized;
  }
  return 'none';
}

export default function OwnerContributionsPanel({
  emptyFallback,
  loading,
  reviewContributions,
  selectedContribution,
  selectedContributionId,
  selectedContributionDetail,
  onSelectContribution
}: {
  emptyFallback: React.ReactNode;
  loading: boolean;
  reviewContributions: BuildLike[];
  selectedContribution: BuildLike | null;
  selectedContributionId: number;
  selectedContributionDetail: React.ReactNode;
  onSelectContribution: (contributionBuildId: number) => void;
}) {
  if (
    !loading &&
    reviewContributions.length === 0 &&
    !selectedContribution
  ) {
    return emptyFallback;
  }
  return (
    <div className={splitClass}>
      <div className={listClass}>
        <div className={rowClass}>
          <strong>Branches</strong>
          {loading ? <span className={mutedTextClass}>Loading...</span> : null}
        </div>
        {reviewContributions.length === 0 ? (
          <span className={mutedTextClass}>No branches yet.</span>
        ) : (
          reviewContributions.map((contribution) => {
            const contributionStatus = normalizeContributionStatus(
              contribution.contributionStatus
            );
            return (
              <button
                key={contribution.id}
                type="button"
                className={`${contributionButtonClass}${
                  selectedContributionId === contribution.id ? ' selected' : ''
                }`}
                onClick={() => onSelectContribution(contribution.id)}
              >
                <span className={contributionTitleClass}>
                  {contribution.username || 'Contributor'}
                </span>
                {contributionStatus !== 'draft' ? (
                  <span className={mutedTextClass}>{contributionStatus}</span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
      {selectedContribution ? selectedContributionDetail : emptyFallback}
    </div>
  );
}
