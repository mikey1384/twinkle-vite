import React, { useState, useMemo } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { computeLineDiff, DiffLine } from './diffUtils';

interface CodeDiffProps {
  oldCode: string;
  newCode: string;
  maxPreviewLines?: number;
  collapsible?: boolean;
  className?: string;
}

export default function CodeDiff({
  oldCode,
  newCode,
  maxPreviewLines = 8,
  collapsible = true,
  className
}: CodeDiffProps) {
  const [expanded, setExpanded] = useState(false);

  const { lines, stats } = useMemo(
    () => computeLineDiff(oldCode, newCode),
    [oldCode, newCode]
  );

  const changedLines = useMemo(
    () => lines.filter((l) => l.type !== 'unchanged'),
    [lines]
  );

  const displayLines = expanded
    ? changedLines
    : changedLines.slice(0, maxPreviewLines);

  const hasMore = changedLines.length > maxPreviewLines;

  if (stats.added === 0 && stats.removed === 0) {
    return null;
  }

  return (
    <div
      className={`${css`
        font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
        font-size: 0.8rem;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid ${Color.borderGray()};
        background: ${Color.wellGray(0.3)};
      `} ${className || ''}`}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          background: ${Color.wellGray(0.5)};
          border-bottom: 1px solid ${Color.borderGray()};
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 600;
            font-size: 0.85rem;
          `}
        >
          <span
            className={css`
              color: ${Color.green()};
            `}
          >
            +{stats.added}
          </span>
          <span
            className={css`
              color: ${Color.rose()};
            `}
          >
            -{stats.removed}
          </span>
          <span
            className={css`
              color: ${Color.darkGray()};
              font-weight: 400;
            `}
          >
            lines changed
          </span>
        </div>
        {collapsible && hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={css`
              background: none;
              border: none;
              color: ${Color.logoBlue()};
              cursor: pointer;
              font-size: 0.8rem;
              display: flex;
              align-items: center;
              gap: 0.3rem;
              &:hover {
                text-decoration: underline;
              }
            `}
          >
            {expanded ? 'Show less' : `Show all ${changedLines.length} changes`}
            <Icon icon={expanded ? 'chevron-up' : 'chevron-down'} />
          </button>
        )}
      </div>
      <div
        className={css`
          max-height: ${expanded ? '400px' : '200px'};
          overflow-y: auto;
        `}
      >
        {displayLines.map((line, index) => (
          <DiffLineRow key={index} line={line} />
        ))}
        {!expanded && hasMore && (
          <div
            className={css`
              padding: 0.5rem 0.75rem;
              color: ${Color.darkGray()};
              font-style: italic;
              text-align: center;
              background: ${Color.wellGray(0.2)};
            `}
          >
            ... {changedLines.length - maxPreviewLines} more changes
          </div>
        )}
      </div>
    </div>
  );
}

function DiffLineRow({ line }: { line: DiffLine }) {
  const bgColor =
    line.type === 'added'
      ? Color.green(0.15)
      : line.type === 'removed'
        ? Color.rose(0.15)
        : 'transparent';

  const textColor =
    line.type === 'added'
      ? Color.green()
      : line.type === 'removed'
        ? Color.rose()
        : Color.darkGray();

  const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';

  return (
    <div
      className={css`
        display: flex;
        background: ${bgColor};
        border-left: 3px solid
          ${line.type === 'added'
            ? Color.green()
            : line.type === 'removed'
              ? Color.rose()
              : 'transparent'};
      `}
    >
      <span
        className={css`
          width: 24px;
          text-align: center;
          color: ${textColor};
          user-select: none;
          flex-shrink: 0;
          padding: 0.1rem 0;
        `}
      >
        {prefix}
      </span>
      <pre
        className={css`
          margin: 0;
          padding: 0.1rem 0.5rem 0.1rem 0;
          white-space: pre-wrap;
          word-break: break-all;
          color: ${textColor};
          flex: 1;
        `}
      >
        {line.content || ' '}
      </pre>
    </div>
  );
}

export { computeLineDiff } from './diffUtils';
