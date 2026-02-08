import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';

export default function PromptStatsRow({
  topicId,
  cloneCount,
  messageCount,
  numComments,
  copiedId,
  onCopyEmbed
}: {
  topicId: number;
  cloneCount?: number;
  messageCount?: number;
  numComments?: number;
  copiedId: number | null;
  onCopyEmbed: (topicId: number) => void;
}) {
  return (
    <div className={statsRowClass}>
      <div className={statPillClass}>
        <span className={boldClass}>{cloneCount || 0}</span>
        {Number(cloneCount) === 1 ? 'clone' : 'clones'}
      </div>
      <div className={statPillClass}>
        <span className={boldClass}>{messageCount || 0}</span>
        {Number(messageCount) === 1 ? 'message' : 'messages'}
      </div>
      <div className={statPillClass}>
        <Icon icon="comment" />
        <span className={boldClass}>{numComments || 0}</span>
        {Number(numComments) === 1 ? 'comment' : 'comments'}
      </div>
      <div
        className={`${statPillClass} ${copyPillClass}`}
        onClick={handleCopyClick}
      >
        <Icon icon={copiedId === topicId ? 'check' : 'copy'} />
      </div>
    </div>
  );

  function handleCopyClick(e: React.MouseEvent) {
    e.stopPropagation();
    onCopyEmbed(topicId);
  }
}

const statsRowClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 1.1rem;
  color: ${Color.darkerGray()};
  margin-top: 0.5rem;
`;

const statPillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: ${Color.highlightGray(0.2)};
  border: 1px solid var(--ui-border);
  font-size: 1.1rem;
  font-weight: 500;
`;

const copyPillClass = css`
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  &:hover {
    background: ${Color.highlightGray(0.4)};
    border-color: ${Color.darkerBorderGray()};
  }
`;

const boldClass = css`
  font-weight: 800;
`;

