import React from 'react';
import Button from '~/components/Button';
import { formatCell, getRowKey } from './formatters';
import {
  emptyInlineClass,
  paginationFooterClass,
  tableWrapClass
} from './styles';
import { AiCostRow, DataTableColumn } from './types';

export function DataTable({
  columns,
  rows,
  rowKey,
  activeRowKey,
  onRowClick
}: {
  columns: DataTableColumn[];
  rows: AiCostRow[];
  rowKey?: (row: AiCostRow, rowIndex: number) => string;
  activeRowKey?: string;
  onRowClick?: (row: AiCostRow) => void;
}) {
  if (rows.length === 0) {
    return <EmptyMessage />;
  }

  return (
    <div className={tableWrapClass}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} style={{ textAlign: column.align }}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const key = rowKey
              ? rowKey(row, rowIndex)
              : getRowKey(row, rowIndex);
            const isClickable = Boolean(onRowClick);
            return (
              <tr
                key={key}
                className={[
                  isClickable ? 'clickable-row' : '',
                  activeRowKey === key ? 'active-row' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={isClickable ? () => onRowClick?.(row) : undefined}
                onKeyDown={
                  isClickable
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRowClick?.(row);
                        }
                      }
                    : undefined
                }
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    style={{ textAlign: column.align }}
                    title={String(row[column.key] ?? '')}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : formatCell(row[column.key])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyMessage() {
  return <div className={emptyInlineClass}>No data for this range.</div>;
}

export function PaginationFooter({
  hasMore,
  loading,
  error,
  onLoadMore
}: {
  hasMore: boolean;
  loading: boolean;
  error: string;
  onLoadMore: () => void;
}) {
  if (!hasMore && !error) return null;
  return (
    <div className={paginationFooterClass}>
      {error ? <span>{error}</span> : null}
      {hasMore ? (
        <Button
          color="logoBlue"
          variant="outline"
          loading={loading}
          onClick={onLoadMore}
        >
          Load More
        </Button>
      ) : null}
    </div>
  );
}
