import React from 'react';
import MyRank from '~/components/MyRank';
import RankingsListItem from '~/components/RankingsListItem';
import ErrorBoundary from '~/components/ErrorBoundary';
import LeaderboardList from '~/components/LeaderboardList';

export default function XPRankings({
  userId,
  rank,
  twinkleXP,
  allRanks
}: {
  userId: number;
  rank: number;
  twinkleXP: number;
  allRanks: any[];
}) {
  return (
    <ErrorBoundary componentPath="Chat/RightMenu/VocabInfo/BottomMenu/XPRankings">
      <div style={{ marginTop: '0.5rem' }}>
        <MyRank
          noBorderRadius
          myId={userId}
          rank={rank}
          twinkleXP={twinkleXP}
          style={{ marginTop: 0 }}
        />
        <LeaderboardList
          scrollable={false}
          padding="1rem 0 0"
          mobilePadding="1rem 0 0"
          bottomPadding="0"
          gap="0.75rem"
        >
          {allRanks.map((user) => (
            <RankingsListItem
              key={user.id}
              small
              style={{
                padding: '1rem'
              }}
              myId={userId}
              user={user}
            />
          ))}
        </LeaderboardList>
      </div>
    </ErrorBoundary>
  );
}
