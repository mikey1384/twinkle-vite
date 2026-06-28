import React from 'react';
import { Color } from '~/constants/css';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import type { CohortAnalytics } from './index';

export default function ActiveUsersChart({
  data
}: {
  data: CohortAnalytics['activeOverTime'];
}) {
  return (
    <TimeSeriesChart
      title="Active notable users over time"
      data={data}
      height="28rem"
      series={[
        { key: 'activeUsers', name: 'Active', color: Color.logoBlue() },
        { key: 'buildActiveUsers', name: 'Build', color: Color.magenta() },
        {
          key: 'dailyTaskActiveUsers',
          name: 'Daily tasks',
          color: Color.green()
        }
      ]}
    />
  );
}
