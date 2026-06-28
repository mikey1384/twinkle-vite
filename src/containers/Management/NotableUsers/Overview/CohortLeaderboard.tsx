import React from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { formatNumber } from '../../AiCosts/helpers/formatters';
import { subsectionHeaderClass } from '../../AiCosts/styles';
import Table from '../../Table';
import type { CohortAnalytics } from './index';

const leaderboardColumns = `
  minmax(14rem, 1.4fr)
  minmax(8rem, 0.8fr)
  minmax(8rem, 0.8fr)
  minmax(8rem, 0.8fr)
  minmax(9rem, 0.9fr)
  minmax(9rem, 0.9fr)
  minmax(9rem, 0.9fr)
`;

export default function CohortLeaderboard({
  rows
}: {
  rows: CohortAnalytics['leaderboard'];
}) {
  return (
    <div style={{ padding: '0 1.6rem 1.6rem' }}>
      <h3 className={subsectionHeaderClass}>Cohort leaderboard</h3>
      <div
        className={css`
          width: 100%;
          overflow-x: auto;
          @media (max-width: ${mobileMaxWidth}) {
            border-top: 1px solid var(--ui-border);
          }
        `}
      >
        <Table
          color="logoBlue"
          columns={leaderboardColumns}
          headerFontSize="1.3rem"
          style={{ minWidth: '70rem' }}
        >
          <thead>
            <tr>
              <th>User</th>
              <th>Score</th>
              <th>Active days</th>
              <th>Build saves</th>
              <th>Daily tasks</th>
              <th>Total XP</th>
              <th>Coins</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId}>
                <td style={{ fontWeight: 'bold' }}>
                  <Link to={`/management/notable-users/${row.userId}`}>
                    {row.username}
                  </Link>
                </td>
                <td>{formatNumber(Math.round(row.engagementScore))}</td>
                <td>{formatNumber(row.activeDays)}</td>
                <td>{formatNumber(row.buildSaves)}</td>
                <td>{formatNumber(row.dailyTasksCompleted)}</td>
                <td>{formatNumber(row.twinkleXP)}</td>
                <td>{formatNumber(row.twinkleCoins)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
