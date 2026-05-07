import React from 'react';
import { useNotiContext } from '~/contexts';
import moment from 'moment';
import MonthItem from './MonthItem';
import useEnsureRankingsLoaded from '~/helpers/hooks/useEnsureRankingsLoaded';

const monthLabel = moment().utc().format('MMMM');
const yearLabel = moment().utc().format('YYYY');

export default function CurrentMonth() {
  useEnsureRankingsLoaded();
  const top30sMonthly = useNotiContext((v) => v.state.top30sMonthly);

  return (
    <MonthItem
      monthLabel={monthLabel}
      yearLabel={yearLabel}
      top30={top30sMonthly}
    />
  );
}
