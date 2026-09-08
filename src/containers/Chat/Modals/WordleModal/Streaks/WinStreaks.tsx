import React from 'react';
import { useAppContext } from '~/contexts';
import StreakLeaderboard from './StreakLeaderboard';

export default function WinStreaks(props: {
  channelId: number;
  myId: number;
  theme: string;
}) {
  const load = useAppContext((v) => v.requestHelpers.loadWordleStreaks);
  return <StreakLeaderboard {...props} load={load} label="Win Streaks" />;
}
