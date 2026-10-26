import type { ArenaBattleSummary } from '~/containers/Arena/types';
import type { UserActivityIntent } from './userActivity';

export function getArenaBattleActivity(
  battle: ArenaBattleSummary | null | undefined,
  battleId: number
): UserActivityIntent | null {
  return battle?.id === battleId &&
    battle.mode === 'battle' &&
    battle.status === 'open'
    ? { kind: 'arena', id: battle.examKey }
    : null;
}

// An exam's choices, never someone else's sitting or a start command.
export function arenaExamPath(examKey: string) {
  return `/arena?${new URLSearchParams({ mode: 'arena', exam: examKey })}`;
}
