import React from 'react';
import MyRank from '~/components/MyRank';
import RankingsListItem from '~/components/RankingsListItem';

export default function BottomMenu({
  rank,
  allRanks,
  twinkleXP,
  userId
}: {
  rank: number;
  allRanks: any[];
  twinkleXP: number;
  userId: number;
}) {
  return (
    <div style={{ height: '50%', overflow: 'scroll' }}>
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
  );
}
