import React from 'react';
import MyRank from '~/components/MyRank';
import RankingsListItem from '~/components/RankingsListItem';
import ErrorBoundary from '~/components/ErrorBoundary';

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
      </div>
    </ErrorBoundary>
  );
}
