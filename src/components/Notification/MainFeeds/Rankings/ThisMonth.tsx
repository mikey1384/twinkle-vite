import React, { useMemo, useState } from 'react';
import RankingsListItem from '~/components/RankingsListItem';
import localize from '~/constants/localize';
import FilterBar from '~/components/FilterBar';
import MyRank from '~/components/MyRank';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { notiFilterBar } from '../../Styles';
import ScopedTheme from '~/theme/ScopedTheme';
import { themedCardBase } from '~/theme/themedCard';
import { useThemedCardVars } from '~/theme/useThemedCardVars';
import LeaderboardList from '~/components/LeaderboardList';

const myRankingLabel = localize('myRanking');
const top30Label = localize('top30');

export default function ThisMonth({
  allMonthly,
  loading,
  top30sMonthly,
  myId,
  myMonthlyRank,
  myMonthlyXP
}: {
  allMonthly: any[];
  loading: boolean;
  top30sMonthly: any[];
  myId: number;
  myMonthlyRank: number;
  myMonthlyXP: number;
}) {
  const [allSelected, setAllSelected] = useState(!!myId);
  const { accentColor, cardVars, themeName } = useThemedCardVars({
    role: 'sectionPanel',
    blendWeight: 0.9
  });
  const emptyStateVars = useMemo(
    () =>
      ({
        ...cardVars,
        ['--rankings-empty-accent' as const]: accentColor
      } as React.CSSProperties),
    [accentColor, cardVars]
  );
  const emptyStateClass = useMemo(
    () =>
      css`
        ${themedCardBase};
        padding: 1.6rem 2rem;
        background: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: ${Color.darkerGray()};
        font-size: 1.5rem;
        line-height: 1.6;
        text-align: center;
        gap: 0.8rem;
        strong {
          color: var(--rankings-empty-accent, ${accentColor});
        }
      `,
    [accentColor]
  );
  const users = useMemo(() => {
    if (allSelected) {
      return allMonthly || [];
    }
    return top30sMonthly || [];
  }, [allMonthly, allSelected, top30sMonthly]);
  const loggedIn = !!myId;
  return (
    <ErrorBoundary componentPath="Notification/MainFeeds/Rankings/ThisMonth">
      {loggedIn && (
        <FilterBar
          className={notiFilterBar}
          style={{
            height: '4.5rem',
            fontSize: '1.6rem'
          }}
        >
          <nav
            className={allSelected ? 'active' : ''}
            onClick={() => {
              setAllSelected(true);
            }}
          >
            {myRankingLabel}
          </nav>
          <nav
            className={allSelected ? '' : 'active'}
            onClick={() => {
              setAllSelected(false);
            }}
          >
            {top30Label}
          </nav>
        </FilterBar>
      )}
      {loggedIn && allSelected && !!myMonthlyXP && (
        <MyRank myId={myId} rank={myMonthlyRank} twinkleXP={myMonthlyXP} />
      )}
      {!myId ? (
        loading ? (
          <Loading />
        ) : null
      ) : users?.length === 0 || (allSelected && myMonthlyXP === 0) ? (
        <ScopedTheme
          theme={themeName}
          roles={['sectionPanel', 'sectionPanelText']}
          style={emptyStateVars}
        >
          <div className={emptyStateClass}>
            {myMonthlyXP === 0 ? (
              <>
                Earn XP by completing missions, watching XP videos, or leaving
                comments to join this month's leaderboard.
              </>
            ) : (
              <>Be the first to join this month's leaderboard by earning XP.</>
            )}
          </div>
        </ScopedTheme>
      ) : (
        <LeaderboardList
          scrollable={false}
          padding="0"
          mobilePadding="0"
          bottomPadding="0"
        >
          {users?.map((user) => (
            <RankingsListItem
              key={user.id}
              user={user}
              myId={myId}
              activityContext="monthlyXP"
            />
          ))}
        </LeaderboardList>
      )}
    </ErrorBoundary>
  );
}
