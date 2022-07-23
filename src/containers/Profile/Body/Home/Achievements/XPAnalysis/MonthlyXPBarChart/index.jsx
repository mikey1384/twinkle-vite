import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import CustomBar from './Bar';
import localize from '~/constants/localize';

const monthlyXpGrowthLabel = localize('monthlyXpGrowth');

MonthlyXPBarChart.propTypes = {
  data: PropTypes.array.isRequired
};

export default function MonthlyXPBarChart({ data = [] }) {
  const barData = useMemo(() => {
    const result = [];
    for (let bar of data) {
      result.push({ name: bar.label, XP: bar.value });
    }
    return result;
  }, [data]);

  return (
    <div
      style={{
        width: 'CALC(50% - 2rem)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <p
        className={css`
          font-weight: bold;
          font-size: 2rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.7rem;
          }
        `}
      >
        {monthlyXpGrowthLabel}
      </p>
      <div
        style={{
          marginTop: '2rem',
          width: '100%',
          height: '25rem',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData}>
            <XAxis dataKey="name" />
            <YAxis tickFormatter={handleYAxisTickFormatting} />
            <Tooltip
              formatter={(value) => addCommasToNumber(value)}
              wrapperStyle={{ width: 100, backgroundColor: '#ccc' }}
            />
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <Bar
              dataKey="XP"
              shape={<CustomBar totalLength={barData.length} />}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  function handleYAxisTickFormatting(value) {
    if (value > 1_000_000) {
      return value / 1_000_000 + 'M';
    }
    if (value > 1000) {
      return value / 1000 + 'k';
    }
    return addCommasToNumber(value);
  }
}
