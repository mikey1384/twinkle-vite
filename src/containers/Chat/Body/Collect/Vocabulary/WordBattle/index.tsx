import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import ErrorBoundary from '~/components/ErrorBoundary';
import MonsterSprite from '~/components/WordMonster/MonsterSprite';
import { useAppContext, useChatContext } from '~/contexts';
import BattleScreen, { BattleApi, BattleState } from './BattleScreen';

const PIXEL_FONT = "'Press Start 2P', monospace";

export function wordIdOf(wordObj: any) {
  return Number(wordObj?.battle?.wordId || wordObj?.wordId || wordObj?.id) || 0;
}

export function isBattleLocked(wordObj: any) {
  return Boolean(wordObj?.battle?.locked);
}

// The gate in front of an unplayed word's definition (design §1): the word's
// monster blocks the way until the member battles it. The battle opens over
// everything, like the definition sheet it guards,
// and when it ends the definitions it guarded are handed to `onUnlocked`.
export default function WordBattleGate({
  wordObj,
  onUnlocked,
  compact
}: {
  wordObj: any;
  onUnlocked: (unlocked: Record<string, any>) => void;
  compact?: boolean;
}) {
  const loadWordBattle = useAppContext((v) => v.requestHelpers.loadWordBattle);
  const startWordBattle = useAppContext((v) => v.requestHelpers.startWordBattle);
  const answerWordBattle = useAppContext((v) => v.requestHelpers.answerWordBattle);
  const loadWordBattleAudio = useAppContext((v) => v.requestHelpers.loadWordBattleAudio);
  const onUnlockWordDefinitions = useChatContext((v) => v.actions.onUnlockWordDefinitions);
  const wordId = wordIdOf(wordObj);
  const word = String(wordObj?.content || '');
  const [state, setState] = useState<BattleState | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const onUnlockedRef = useRef(onUnlocked);
  onUnlockedRef.current = onUnlocked;

  const api: BattleApi = useMemo(
    () => ({
      start: (id) => startWordBattle(id),
      answer: (args) => answerWordBattle(args),
      loadAudio: (args) => loadWordBattleAudio(args)
    }),
    [answerWordBattle, loadWordBattleAudio, startWordBattle]
  );

  useEffect(() => {
    if (!wordId) return;
    let cancelled = false;
    let timer: number | undefined;
    let tries = 0;
    async function load() {
      try {
        const next: BattleState = await loadWordBattle(wordId);
        if (cancelled) return;
        // Already played (another tab, or earlier): straight to the meaning.
        if (next?.unlocked) return handleUnlocked(next.unlocked);
        setState(next);
        // The monster's questions are being written the first time anyone
        // opens this word: check again shortly.
        if (next?.status === 'preparing' && tries++ < 30) {
          timer = window.setTimeout(load, 3000);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) setFailed(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordId]);

  function handleUnlocked(unlocked: Record<string, any>) {
    onUnlockWordDefinitions(unlocked);
    onUnlockedRef.current(unlocked);
  }

  const level = Math.max(1, Math.min(5, Number(state?.wordLevel || wordObj?.wordLevel || wordObj?.battle?.wordLevel) || 3));
  const ready = state && (state.status === 'ready' || state.status === 'active');

  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/Vocabulary/WordBattle">
      <div className={gateCls} style={compact ? { padding: '1rem' } : undefined}>
        <div className={gateMonsterCls}>
          <MonsterSprite word={word} level={level} scale={2} />
        </div>
        <div className={gateTextCls}>
          <div className={gateTitleCls}>
            {state?.status === 'active' ? `${word.toUpperCase()} is waiting!` : `A wild ${word.toUpperCase()} appears!`}
          </div>
          <div className={gateSubCls}>
            {failed
              ? 'The monster is hiding right now. Try again soon.'
              : state?.status === 'preparing'
                ? 'It is still waking up. One moment...'
                : 'Beat it to see what it means. Two questions, two hearts.'}
          </div>
          <button
            type="button"
            className={gateButtonCls}
            disabled={!ready}
            onClick={() => setOpen(true)}
          >
            {state?.status === 'active'
              ? 'Back to battle ▶'
              : state?.status === 'preparing'
                ? 'Waking up...'
                : 'Battle! ▶'}
          </button>
        </div>
      </div>
      {open && state && (
        <Modal
          modalKey="WordBattle"
          isOpen
          size="md"
          hasHeader={false}
          bodyPadding={0}
          closeOnBackdropClick={false}
          showCloseButton={false}
          xpActivity
          onClose={() => setOpen(false)}
          aria-label={`Battle ${word}`}
        >
          <BattleScreen
            initial={state}
            api={api}
            onClose={() => setOpen(false)}
            onFinished={(finished) => {
              setOpen(false);
              if (finished.unlocked) handleUnlocked(finished.unlocked);
            }}
          />
        </Modal>
      )}
    </ErrorBoundary>
  );
}

// "Collection pride": the monster stays on the word after its battle, beaten
// (with a crown of stars) or the one that ran away.
export function BattleTrophy({ wordObj }: { wordObj: any }) {
  const status = wordObj?.battle?.status;
  if (status !== 'won' && status !== 'lost') return null;
  const word = String(wordObj?.content || '');
  const level = Math.max(1, Math.min(5, Number(wordObj?.battle?.wordLevel || wordObj?.wordLevel) || 3));
  const won = status === 'won';
  return (
    <div className={trophyCls}>
      <MonsterSprite word={word} level={level} scale={1} />
      <span className={trophyLabelCls} style={{ color: won ? '#2f8f4e' : '#8a6d2f' }}>
        {won ? 'DEFEATED' : 'RAN AWAY'}
      </span>
      <span className={trophyStarsCls}>{'★'.repeat(level)}</span>
    </div>
  );
}

export function BattleExamples({ examples }: { examples?: string[] }) {
  if (!examples?.length) return null;
  return (
    <div className={examplesCls}>
      <div className={examplesTitleCls}>In the wild</div>
      <ul>
        {examples.map((example, i) => (
          <li key={i}>{example}</li>
        ))}
      </ul>
    </div>
  );
}

const gateCls = css`
  display: flex;
  align-items: center;
  gap: 1.4rem;
  padding: 1.4rem;
  background: #0f0b1a;
  border: 3px solid #1a1426;
  box-shadow: inset 0 0 0 3px #2c2442;
  color: #ffffff;
  @media (max-width: 480px) {
    flex-direction: column;
    text-align: center;
    gap: 0.8rem;
  }
`;

const gateMonsterCls = css`
  flex-shrink: 0;
  animation: gate-bob 1.2s steps(2) infinite;
  @keyframes gate-bob {
    50% {
      transform: translateY(-3px);
    }
  }
`;

const gateTextCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-width: 0;
  @media (max-width: 480px) {
    align-items: center;
  }
`;

const gateTitleCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const gateSubCls = css`
  font-size: 1.4rem;
  color: #d8d0ea;
`;

const gateButtonCls = css`
  align-self: flex-start;
  font-family: ${PIXEL_FONT};
  font-size: 12px;
  padding: 12px 16px;
  color: #3b2200;
  background: #ffd34d;
  border: 3px solid #ffffff;
  box-shadow: 0 4px 0 #b88a00;
  cursor: pointer;
  &:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #b88a00;
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
  @media (max-width: 480px) {
    align-self: center;
  }
`;

const trophyCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.2rem 0.8rem 0.2rem 0.2rem;
  margin-bottom: 0.8rem;
  border: 2px solid #1a1426;
  background: #fffdf5;
`;

const trophyLabelCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 10px;
`;

const trophyStarsCls = css`
  font-size: 1.2rem;
  color: #d18b00;
  letter-spacing: 1px;
`;

const examplesCls = css`
  margin-top: 1.4rem;
  padding: 1rem 1.2rem;
  border-left: 4px solid #ffd34d;
  background: #fffaf0;
  ul {
    margin: 0.4rem 0 0;
    padding-left: 1.6rem;
  }
  li {
    font-size: 1.5rem;
    line-height: 1.5;
    font-style: italic;
  }
`;

const examplesTitleCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 10px;
  color: #8a6d2f;
`;
