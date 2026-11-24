import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { css } from '@emotion/css';
import MonsterSprite from '~/components/WordMonster/MonsterSprite';
import { useAppContext } from '~/contexts';
import { BattleState, RehuntEscape } from './BattleScreen';
import { wordBattleHost } from './battleHost';
import { backInLabel, resetTimeLabel } from './lines';

const PIXEL_FONT = "'Press Start 2P', monospace";

// The RAN AWAY card on a word whose battle was lost (Mikey 11-23: the ones
// that ran away matter most for review). A full day after the escape it
// offers a re-hunt: a real battle with full loot on a catch, once per word.
// Before then it says when ("Re-hunt in 5h", worked out once per render, no
// ticking timer). Once it is back (and while the re-hunt is open) the parent
// hides the definitions (onHuntingChange): the battle tests what the member
// kept, so the meaning isn't sitting next to the button. Peeking stays the
// member's choice ("Peek at the meaning"). The re-hunt battle is hosted by
// the app (battleHost.ts), so this card unmounting never closes it.
export default function RanAwayCard({
  wordId,
  word,
  level,
  onHuntingChange,
  onUnlocked
}: {
  wordId: number;
  word: string;
  level: number;
  onHuntingChange?: (hunting: boolean) => void;
  onUnlocked?: (unlocked: Record<string, any>) => void;
}) {
  const loadWordBattle = useAppContext((v) => v.requestHelpers.loadWordBattle);
  const [escape, setEscape] = useState<RehuntEscape | null>(null);
  const [caught, setCaught] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const hosted = useSyncExternalStore(
    wordBattleHost.subscribe,
    wordBattleHost.getSnapshot,
    wordBattleHost.getSnapshot
  );
  const open = !!hosted?.rehunt && hosted.wordId === wordId;
  const onUnlockedRef = useRef(onUnlocked);
  onUnlockedRef.current = onUnlocked;

  useEffect(() => {
    if (!wordId) return;
    let cancelled = false;
    (async () => {
      try {
        const state: BattleState = await loadWordBattle(wordId);
        if (cancelled) return;
        if (state?.status === 'won') setCaught(true);
        setEscape(state?.escape || null);
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadWordBattle, wordId]);

  const pastLimit = !!escape && !escape.active && escape.ready && escape.battlesLeft === 0;
  const huntOpen = !caught && !!escape && (escape.active || (escape.ready && !pastLimit));
  const concealed = open || (huntOpen && !peeked);
  useEffect(() => {
    onHuntingChange?.(concealed);
    // A catch turns this card into the DEFEATED trophy (unmounting it) in
    // the same render that closes the battle: the definitions come back.
    return () => {
      if (concealed) onHuntingChange?.(false);
    };
  }, [onHuntingChange, concealed]);

  // The hosted re-hunt reports back while this card is mounted (the host
  // has already put any unlocked definitions into Word Master's state).
  useEffect(() => {
    if (!wordId) return;
    return wordBattleHost.registerGate(wordId, {
      rehunt: true,
      onFinished: (finished: BattleState) => {
        if (finished.status === 'won') {
          setCaught(true);
          setEscape(null);
        } else if (finished.status === 'lost' && finished.rehuntReadyAt) {
          const readyAt = finished.rehuntReadyAt;
          setEscape((prev) =>
            prev ? { ...prev, active: false, ready: false, readyAt } : prev
          );
        }
        if (finished.unlocked) onUnlockedRef.current?.(finished.unlocked);
      },
      // Today's battles ran out since the card loaded: the card says so.
      onDailyLimit: () => {
        setEscape((prev) => (prev ? { ...prev, battlesLeft: 0 } : prev));
      }
    });
  }, [wordId]);

  function openRehunt() {
    wordBattleHost.open({
      wordId,
      word,
      rehunt: true,
      state: { status: 'ready', wordId, word, wordLevel: level }
    });
  }

  let action: React.ReactNode = null;
  if (!caught && escape) {
    if (huntOpen) {
      action = (
        <span className={huntRowCls}>
          <button type="button" className={huntButtonCls} onClick={openRehunt}>
            {escape.active ? 'Back to the hunt ▶' : 'Re-hunt ▶'}
          </button>
          {!peeked && !escape.active && (
            <button type="button" className={peekCls} onClick={() => setPeeked(true)}>
              Peek at the meaning
            </button>
          )}
        </span>
      );
    } else if (pastLimit) {
      action = (
        <span className={waitCls}>
          Today&apos;s battles are used up! Back at {resetTimeLabel(escape.resetAt)}.
        </span>
      );
    } else {
      action = <span className={waitCls}>Re-hunt in {backInLabel(escape.readyAt)}</span>;
    }
  }

  return (
    <>
      <div className={cardCls} data-testid="ran-away-card">
        <MonsterSprite word={word} level={level} scale={1} />
        <span className={bodyCls}>
          <span className={titleRowCls}>
            <span className={labelCls} style={{ color: caught ? '#2f8f4e' : '#8a6d2f' }}>
              {caught ? 'CAUGHT' : 'RAN AWAY'}
            </span>
            <span className={starsCls}>{'★'.repeat(level)}</span>
          </span>
          {action}
        </span>
      </div>
    </>
  );
}

// Sprite on the left; the label over the re-hunt line, so the card stays
// narrow (clear of the Edit button beside it).
const cardCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.2rem 0.8rem 0.2rem 0.2rem;
  margin-bottom: 0.8rem;
  border: 2px solid #1a1426;
  background: #fffdf5;
  max-width: 100%;
`;

const bodyCls = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
  max-width: 22rem;
  padding: 0.4rem 0;
`;

const titleRowCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
`;

const labelCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 10px;
`;

const starsCls = css`
  font-size: 1.2rem;
  color: #d18b00;
  letter-spacing: 1px;
`;

const huntButtonCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 10px;
  padding: 8px 10px;
  color: #3b2200;
  background: #ffd34d;
  border: 2px solid #1a1426;
  box-shadow: 0 3px 0 #b88a00;
  cursor: pointer;
  &:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 #b88a00;
  }
  &:focus-visible {
    outline: 3px solid #1a1426;
    outline-offset: 2px;
  }
`;

const huntRowCls = css`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem 0.8rem;
`;

const peekCls = css`
  padding: 0;
  border: 0;
  background: none;
  font-size: 1.2rem;
  color: #6f6590;
  text-decoration: underline;
  cursor: pointer;
`;

const waitCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 9px;
  line-height: 1.6;
  color: #6f6590;
`;
