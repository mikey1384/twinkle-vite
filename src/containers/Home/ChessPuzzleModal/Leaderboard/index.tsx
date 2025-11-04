import React from 'react';
import LeaderboardList from '~/components/LeaderboardList';
import Item from './Item';

export default function Leaderboard({
  users,
  myId
}: {
  users: any[];
  myId: number;
}) {
  return (
    <LeaderboardList height="100%">
      {users.map((user) => (
        <Item key={user.id} user={user} myId={myId} />
      ))}
    </LeaderboardList>
  );
}
