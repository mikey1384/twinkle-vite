import type { BattleState } from './BattleScreen';

// The word battle in progress belongs to the app, not to the word card,
// definition or word window that opened it (Mikey 11-24: a battle opened from
// a Word Master card closed by itself when another member's card arrived).
// Its gate hands the battle to this store, one app-level host
// (WordBattleHost) shows it, and whatever happens to the opener underneath
// (a card swapped for its stand-in, a window closing, the feed reloading) the
// battle stays open until it ends or the member closes it.
//
// A gate that is still mounted when the battle ends hears about it through
// its listener (to show the definitions it guarded, or the day's limit); the
// host itself puts the unlocked definitions into Word Master's state, so they
// arrive even when no gate is left to hear.

export interface HostedBattle {
  // A new id each time a battle opens, so a reopened one starts fresh.
  id: number;
  wordId: number;
  word: string;
  // The form the member saw when it differs from the word (running for run).
  seenForm?: string;
  // A re-hunt of a word that ran away (RanAwayCard), not its first battle.
  rehunt?: boolean;
  state: BattleState;
}

export interface BattleGateListener {
  // Hears the word's re-hunt (RanAwayCard) rather than its first battle.
  rehunt?: boolean;
  onFinished?: (finished: BattleState) => void;
  // Today's battles ran out since the gate loaded.
  onDailyLimit?: () => void;
}

export function createWordBattleHostStore() {
  let current: HostedBattle | null = null;
  let nextId = 1;
  const subscribers = new Set<() => void>();
  const gates = new Map<number, Set<BattleGateListener>>();

  function emit() {
    for (const subscriber of Array.from(subscribers)) subscriber();
  }

  function gateListeners(battle: HostedBattle) {
    return Array.from(gates.get(battle.wordId) || []).filter(
      (listener) => !!listener.rehunt === !!battle.rehunt
    );
  }

  function take(id: number) {
    if (!current || current.id !== id) return null;
    const battle = current;
    current = null;
    emit();
    return battle;
  }

  return {
    getSnapshot(): HostedBattle | null {
      return current;
    },
    subscribe(subscriber: () => void) {
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
    open(battle: Omit<HostedBattle, 'id'>): number {
      current = { ...battle, id: nextId++ };
      emit();
      return current.id;
    },
    // The member closed it mid-battle: the server keeps it, and the word's
    // gate offers "Back to battle".
    close(id: number) {
      take(id);
    },
    finish(id: number, finished: BattleState) {
      const battle = take(id);
      if (!battle) return;
      for (const listener of gateListeners(battle)) {
        listener.onFinished?.(finished);
      }
    },
    dailyLimit(id: number) {
      const battle = take(id);
      if (!battle) return;
      for (const listener of gateListeners(battle)) {
        listener.onDailyLimit?.();
      }
    },
    registerGate(wordId: number, listener: BattleGateListener) {
      let set = gates.get(wordId);
      if (!set) {
        set = new Set();
        gates.set(wordId, set);
      }
      set.add(listener);
      return () => {
        const listeners = gates.get(wordId);
        if (!listeners) return;
        listeners.delete(listener);
        if (listeners.size === 0) gates.delete(wordId);
      };
    },
    // A different account signed in: the last one's battle is not theirs.
    reset() {
      if (!current) return;
      current = null;
      emit();
    }
  };
}

export type WordBattleHostStore = ReturnType<typeof createWordBattleHostStore>;

export const wordBattleHost = createWordBattleHostStore();
