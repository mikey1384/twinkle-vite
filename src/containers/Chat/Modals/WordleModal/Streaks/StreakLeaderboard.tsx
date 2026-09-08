import React, { useEffect, useRef, useState } from 'react';
import Loading from '~/components/Loading';
import Button from '~/components/Button';
import LeaderboardList from '~/components/LeaderboardList';
import StreakItem from './StreakItem';

export default function StreakLeaderboard({
  channelId,
  myId,
  theme,
  load,
  label
}: {
  channelId: number;
  myId: number;
  theme: string;
  load: (channelId: number) => Promise<any>;
  label: string;
}) {
  const scope = `${myId}:${channelId}:${label}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    scope: string;
    status: 'loading' | 'error' | 'loaded';
    streaks?: number[];
    streakObj?: Record<string, any[]>;
  }>({ scope, status: 'loading' });

  useEffect(() => {
    let active = true;
    const isCurrent = () => active && currentScope.current === scope;
    setResult({ scope, status: 'loading' });
    const timer = setTimeout(() => {
      if (isCurrent()) setResult({ scope, status: 'error' });
      active = false;
    }, 20000);
    void (async () => {
      try {
        if (!Number.isSafeInteger(channelId) || channelId <= 0)
          throw Error('Invalid channel');
        const data = await load(channelId);
        if (
          !Array.isArray(data?.bestStreaks) ||
          !data.bestStreakObj ||
          typeof data.bestStreakObj !== 'object' ||
          Array.isArray(data.bestStreakObj) ||
          !data.bestStreaks.every(
            (streak: unknown) =>
              typeof streak === 'number' &&
              Number.isSafeInteger(streak) &&
              streak > 0 &&
              Array.isArray(data.bestStreakObj[streak]) &&
              data.bestStreakObj[streak].every(
                (user: any) =>
                  user &&
                  Number.isSafeInteger(user.id) &&
                  user.id > 0 &&
                  typeof user.username === 'string'
              )
          ) ||
          new Set(data.bestStreaks).size !== data.bestStreaks.length
        )
          throw Error('Invalid leaderboard');
        if (isCurrent())
          setResult({
            scope,
            status: 'loaded',
            streaks: data.bestStreaks,
            streakObj: data.bestStreakObj
          });
      } catch {
        if (isCurrent()) setResult({ scope, status: 'error' });
      } finally {
        clearTimeout(timer);
      }
    })();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [scope, channelId, load, attempt]);

  const status = result.scope === scope ? result.status : 'loading';
  if (status === 'loading')
    return <Loading style={{ height: 'calc(100% - 6rem)' }} />;
  if (status === 'error')
    return (
      <div
        style={{
          width: '100%',
          padding: '16px',
          textAlign: 'center',
          fontSize: '16px',
          lineHeight: 1.5,
          overflow: 'auto'
        }}
      >
        <p role="alert">
          Could not load {label.toLowerCase()}. Please try again.
        </p>
        <Button
          onClick={() => setAttempt((value) => value + 1)}
          style={{ minHeight: '44px', fontSize: '14px', marginTop: '12px' }}
        >
          Try again
        </Button>
      </div>
    );
  if (!result.streaks?.length)
    return (
      <p
        role="status"
        style={{
          padding: '16px',
          fontSize: '16px',
          lineHeight: 1.5,
          textAlign: 'center'
        }}
      >
        No {label.toLowerCase()} yet.
      </p>
    );
  return (
    <LeaderboardList
      height="100%"
      padding="0"
      mobilePadding="0"
      bottomPadding="0"
    >
      {result.streaks.map((streak, index) => (
        <StreakItem
          key={streak}
          rank={index + 1}
          streak={streak}
          streakObj={result.streakObj}
          theme={theme}
          myId={myId}
        />
      ))}
    </LeaderboardList>
  );
}
