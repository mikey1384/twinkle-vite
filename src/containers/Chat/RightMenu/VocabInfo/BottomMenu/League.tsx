import React, { useMemo, useState } from 'react';
import FilterBar from '~/components/FilterBar';
import VocabSectionRankingList from '../VocabSectionRankingList';
import { useChatContext } from '~/contexts';
import { months } from '~/constants/defaultValues';

export default function League({
  currentMonth,
  currentYear
}: {
  currentMonth: number;
  currentYear: number;
}) {
  const [selected, setSelected] = useState('month');
  const [allSelected, setAllSelected] = useState(false);
  const { all: allMonthly, top30s: top30Monthly } = useChatContext(
    (v) => v.state.monthlyVocabRankings
  );
  const { all: allYearly, top30s: top30Yearly } = useChatContext(
    (v) => v.state.yearlyVocabRankings
  );

  const allUsers = useMemo(() => {
    return selected === 'month' ? allMonthly : allYearly;
  }, [selected, allMonthly, allYearly]);

  const top30Users = useMemo(() => {
    return selected === 'month' ? top30Monthly : top30Yearly;
  }, [selected, top30Monthly, top30Yearly]);

  return (
    <div>
      <FilterBar
        style={{ fontSize: '1.5rem', height: '4rem', marginBottom: 0 }}
      >
        <nav
          onClick={() => setSelected('month')}
          className={selected === 'month' ? 'active' : ''}
        >
          {currentMonth ? months[currentMonth - 1] : ''}
        </nav>
        <nav
          onClick={() => setSelected('year')}
          className={selected === 'year' ? 'active' : ''}
        >
          {currentYear}
        </nav>
      </FilterBar>
      <VocabSectionRankingList
        allUsers={allUsers || []}
        top30Users={top30Users || []}
        allSelected={allSelected}
        onSetAllSelected={setAllSelected}
        target="totalPoints"
      />
    </div>
  );
}
