import React, { useMemo } from 'react';
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
  const { onSetVocabLeaderboardTab, onSetVocabLeaderboardAllSelected } =
    useChatContext((v) => v.actions);
  const { vocabLeaderboardTab, vocabLeaderboardAllSelected } = useChatContext(
    (v) => v.state
  );
  const { all: allMonthly, top30s: top30Monthly } = useChatContext(
    (v) => v.state.monthlyVocabRankings
  );
  const { all: allYearly, top30s: top30Yearly } = useChatContext(
    (v) => v.state.yearlyVocabRankings
  );

  const allUsers = useMemo(() => {
    return vocabLeaderboardTab === 'month' ? allMonthly : allYearly;
  }, [vocabLeaderboardTab, allMonthly, allYearly]);

  const top30Users = useMemo(() => {
    return vocabLeaderboardTab === 'month' ? top30Monthly : top30Yearly;
  }, [vocabLeaderboardTab, top30Monthly, top30Yearly]);

  return (
    <div>
      <FilterBar
        style={{ fontSize: '1.5rem', height: '4rem', marginBottom: 0 }}
      >
        <nav
          onClick={() => onSetVocabLeaderboardTab('month')}
          className={vocabLeaderboardTab === 'month' ? 'active' : ''}
        >
          {currentMonth ? months[currentMonth - 1] : ''}
        </nav>
        <nav
          onClick={() => onSetVocabLeaderboardTab('year')}
          className={vocabLeaderboardTab === 'year' ? 'active' : ''}
        >
          {currentYear}
        </nav>
      </FilterBar>
      <VocabSectionRankingList
        allUsers={allUsers || []}
        top30Users={top30Users || []}
        allSelected={vocabLeaderboardAllSelected[vocabLeaderboardTab]}
        onSetAllSelected={(isSelected) =>
          onSetVocabLeaderboardAllSelected({
            tab: vocabLeaderboardTab,
            selected: isSelected
          })
        }
        target="totalPoints"
      />
    </div>
  );
}
