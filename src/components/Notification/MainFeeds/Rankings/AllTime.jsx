import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import RoundList from '~/components/RoundList';
import RankingsListItem from '~/components/RankingsListItem';
import localize from '~/constants/localize';
import FilterBar from '~/components/FilterBar';
import MyRank from '~/components/MyRank';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';

const myRankingLabel = localize('myRanking');
const top30Label = localize('top30');
const notRankedDescriptionLabel = localize('notRankedDescription');

AllTime.propTypes = {
  allRanks: PropTypes.array,
  top30s: PropTypes.array,
  myId: PropTypes.number,
  myAllTimeRank: PropTypes.number,
  myAllTimeXP: PropTypes.number
};

export default function AllTime({
  allRanks,
  myId,
  myAllTimeRank,
  myAllTimeXP,
  top30s
}) {
  const [allSelected, setAllSelected] = useState(!!myId);
  const users = useMemo(() => {
    if (allSelected) {
      return allRanks;
    }
    return top30s;
  }, [allRanks, allSelected, top30s]);
  const loggedIn = !!myId;
  return (
    <ErrorBoundary componentPath="Notification/MainFeeds/Rankings/AllTime">
      {loggedIn && (
        <FilterBar
          bordered
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
      {loggedIn && allSelected && (
        <MyRank myId={myId} rank={myAllTimeRank} twinkleXP={myAllTimeXP} />
      )}
      {users.length === 0 || (allSelected && loggedIn && myAllTimeXP === 0) ? (
        <div
          className={css`
            border-radius: ${borderRadius};
            border: 1px solid ${Color.borderGray()};
            background: #fff;
            padding: 1rem;
            @media (max-width: ${mobileMaxWidth}) {
              border-radius: 0;
              border-left: none;
              border-right: none;
            }
          `}
        >
          {notRankedDescriptionLabel}
        </div>
      ) : (
        <RoundList style={{ marginTop: 0 }}>
          {users.map((user) => (
            <RankingsListItem key={user.id} user={user} myId={myId} />
          ))}
        </RoundList>
      )}
    </ErrorBoundary>
  );
}
