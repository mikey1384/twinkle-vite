import React from 'react';
import { useAppContext } from '~/contexts';
import StreakLeaderboard from './StreakLeaderboard';

export default function DoubleStreaks(props: {
  channelId: number;
  myId: number;
  theme: string;
}) {
  const load = useAppContext((v) => v.requestHelpers.loadWordleDoubleStreaks);
  return (
    <StreakLeaderboard {...props} load={load} label="Double Bonus Streaks" />
  );
}
