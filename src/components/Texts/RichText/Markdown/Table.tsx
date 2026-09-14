import React from 'react';
import { css } from '@emotion/css';

// Both top-level and nested Markdown tables need their own scroll surface.
// Centering an oversized table makes its leading columns unreachable.
export default function MarkdownTable({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={tableScrollClass} data-rich-text-table>
      <table className={tableClass}>{children}</table>
    </div>
  );
}

const tableScrollClass = css`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
`;

const tableClass = css`
  border-collapse: collapse;
  margin-top: 1.5rem;
  margin-inline: auto;
  min-width: 25vw;
  width: 85%;
  max-width: 100%;
  tr {
    display: table-row;
    width: 100%;
  }
  th,
  td {
    text-align: center;
    width: 33%;
    border: 1px solid var(--ui-border);
    padding: 0.5rem;
    white-space: nowrap;
    &:first-child {
      width: 2%;
    }
  }
  td img {
    width: 100%;
    height: auto;
  }
`;
