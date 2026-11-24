import React, { Suspense, useEffect, useSyncExternalStore } from 'react';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';
import { wordBattleHost } from './battleHost';

const HostedWordBattle = lazyWithRetry(() => import('./HostedWordBattle'));

// Mounted once by the app, per signed-in account: shows the word battle in
// progress (battleHost.ts). The battle screen loads only when one opens.
export default function WordBattleHost() {
  const battle = useSyncExternalStore(
    wordBattleHost.subscribe,
    wordBattleHost.getSnapshot,
    wordBattleHost.getSnapshot
  );
  useEffect(() => () => wordBattleHost.reset(), []);
  if (!battle) return null;
  return (
    <Suspense fallback={null}>
      <HostedWordBattle key={battle.id} battle={battle} />
    </Suspense>
  );
}
