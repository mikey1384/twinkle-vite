import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function Table({
  color = 'logoBlue',
  headerFontSize,
  columns,
  children,
  style
}: {
  color?: string;
  headerFontSize?: string;
  columns?: string;
  children: React.ReactNode;
  scrollable?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <table
      style={style}
      className={css`
        width: 100%;
        overflow-x: scroll;
        flex: 1;
        display: grid;
        border-collapse: collapse;
        grid-template-columns: ${columns};
        thead {
          display: contents;
        }
        tbody {
          display: contents;
        }
        tr {
          display: contents;
        }
        th {
          font-size: ${headerFontSize || '1.7rem'};
          font-weight: normal;
          text-align: left;
          padding: 1.3rem 2rem 1.3rem 2rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          position: sticky;
          top: 0;
          background: ${Color[color](0.9)};
          color: white;
          position: relative;
        }
        th:last-child {
          border: 0;
        }
        td {
          font-size: 1.5rem;
          padding: 2rem;
          color: ${Color.darkGray()};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          a {
            cursor: pointer;
            color: ${Color.lighterGray()};
          }
        }
        tr:hover td {
          background: ${Color.whitePurple()};
          a {
            font-weight: bold;
            color: ${Color.logoBlue()};
          }
        }
      `}
    >
      {children}
    </table>
  );
}
