import React from 'react';
import PropTypes from 'prop-types';
import MyRank from '~/components/MyRank';
import RankingsListItem from '~/components/RankingsListItem';

BottomMenu.propTypes = {
  rank: PropTypes.number,
  allRanks: PropTypes.array.isRequired,
  twinkleXP: PropTypes.number,
  userId: PropTypes.number.isRequired
};

export default function BottomMenu({ rank, allRanks, twinkleXP, userId }) {
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
