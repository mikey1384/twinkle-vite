import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import Modal from '~/components/Modal';
import ErrorBoundary from '~/components/ErrorBoundary';
import MonsterSprite, { MonsterPose } from '~/components/WordMonster/MonsterSprite';
import { useAppContext, useChatContext } from '~/contexts';
import BattleScreen, { BattleApi, BattleState } from './BattleScreen';

const PIXEL_FONT = "'Press Start 2P', monospace";

// The monster wakes up while its questions are fetched (Mikey 11-22: "keep
// 'A wild X appears!' out until it actually wakes up"). While the server
// prepares the battle (at most about 2 s) the stages move on a timer but never
// past one cracked eye; once the battle is ready the rest plays quickly. The
// word's name is only shown once it is awake.
type WakeStage = 'sleep' | 'stir' | 'peek' | 'yawn' | 'wake' | 'awake';
// While waiting: when each stage starts (ms after the gate opens); past the
// last, a long wait (an older API) loops stir and peek.
const WAITING_STAGES: Array<[WakeStage, number]> = [
  ['sleep', 0],
  ['stir', 700],
  ['peek', 1500]
];
const LONG_WAIT_LOOP: Array<[WakeStage, number]> = [
  ['stir', 1800],
  ['peek', 1400]
];
// Once ready: the rest of the wake-up, quickly (ms each). Deep sleep shows at
// least MIN_SLEEP_MS first, so even an instant battle starts asleep.
const MIN_SLEEP_MS = 350;
const QUICK_WAKE: Array<[WakeStage, number]> = [
  ['stir', 200],
  ['peek', 260],
  ['yawn', 480],
  ['wake', 480]
];
const STAGE_ORDER: WakeStage[] = ['sleep', 'stir', 'peek', 'yawn', 'wake', 'awake'];

function useWakeStage(ready: boolean, skip: boolean) {
  const [stage, setStage] = useState<WakeStage>(skip ? 'awake' : 'sleep');
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const openedAt = useRef(Date.now());

  // Waiting: sleep, stir, one eye; then stir and peek in turn.
  useEffect(() => {
    if (ready || skip) return;
    const timers: number[] = [];
    for (const [next, at] of WAITING_STAGES) {
      if (at > 0) timers.push(window.setTimeout(() => setStage(next), at));
    }
    let loopAt = WAITING_STAGES[WAITING_STAGES.length - 1][1];
    for (let round = 0; round < 40; round++) {
      for (const [next, length] of LONG_WAIT_LOOP) {
        loopAt += length;
        timers.push(window.setTimeout(() => setStage(next), loopAt));
      }
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [ready, skip]);

  // Ready: play what is left of the wake-up, quickly.
  useEffect(() => {
    if (skip) {
      setStage('awake');
      return;
    }
    if (!ready) return;
    const timers: number[] = [];
    const from = STAGE_ORDER.indexOf(stageRef.current);
    let at = Math.max(0, MIN_SLEEP_MS - (Date.now() - openedAt.current));
    for (const [next, length] of QUICK_WAKE) {
      if (STAGE_ORDER.indexOf(next) <= from && next !== 'yawn' && next !== 'wake') continue;
      timers.push(window.setTimeout(() => setStage(next), at));
      at += length;
    }
    timers.push(window.setTimeout(() => setStage('awake'), at));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [ready, skip]);

  return [stage, setStage] as const;
}

const POSE_FOR: Record<WakeStage, MonsterPose> = {
  sleep: 'sleep',
  stir: 'stir',
  peek: 'peek',
  yawn: 'yawn',
  wake: 'wake',
  awake: 'idle'
};

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
  // A form-of word (running) battles its lemma (run), as it collects.
  const typed = String(wordObj?.content || '');
  const word = String(wordObj?.battle?.word || typed);
  const seenForm = typed && typed !== word ? typed : undefined;
  const [state, setState] = useState<BattleState | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const onUnlockedRef = useRef(onUnlocked);
  onUnlockedRef.current = onUnlocked;

  const api: BattleApi = useMemo(
    () => ({
      start: (id) => startWordBattle(id, seenForm),
      answer: (args) => answerWordBattle(args),
      loadAudio: (args) => loadWordBattleAudio(args)
    }),
    [answerWordBattle, loadWordBattleAudio, startWordBattle, seenForm]
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
        // An older API answers 'preparing' while it writes the questions.
        if (next?.status === 'preparing' && tries++ < 60) {
          timer = window.setTimeout(load, 1500);
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
  const ready = !!state && (state.status === 'ready' || state.status === 'active');
  // A battle already under way skips the wake-up: it is awake and waiting.
  const [stage, setStage] = useWakeStage(ready, state?.status === 'active');
  const awake = stage === 'wake' || stage === 'awake';
  const asleep = stage === 'sleep' || stage === 'stir';

  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/Vocabulary/WordBattle">
      <div className={gateCls} style={compact ? { padding: '1rem' } : undefined}>
        <div className={cx(gateMonsterCls, awake && gateMonsterAwakeCls)}>
          <MonsterSprite
            word={word}
            level={level}
            scale={2}
            pose={POSE_FOR[stage]}
            label={awake ? undefined : 'A sleeping word monster'}
          />
          {asleep && (
            <div className={cx(zzzCls, stage === 'stir' && zzzPopCls)} aria-hidden="true">
              <span>z</span>
              <span>z</span>
              <span>z</span>
            </div>
          )}
        </div>
        <div className={gateTextCls} aria-live="polite">
          <div className={gateTitleCls}>
            {state?.status === 'active'
              ? `${word.toUpperCase()} is waiting!`
              : awake
                ? `A wild ${word.toUpperCase()} appears!`
                : stage === 'sleep'
                  ? 'Shh... a wild word is dozing.'
                  : stage === 'stir'
                    ? 'Something stirs...'
                    : stage === 'peek'
                      ? 'One eye cracks open...'
                      : '*Yaaawn*'}
          </div>
          <div className={gateSubCls}>
            {failed
              ? 'It is fast asleep right now. Try again soon.'
              : awake
                ? 'Beat it to see what it means. Two questions, two hearts.'
                : 'Something is sleeping here...'}
          </div>
          <button
            type="button"
            className={gateButtonCls}
            disabled={!ready}
            onClick={() => {
              // Ready while still waking: a tap skips the rest of it.
              setStage('awake');
              setOpen(true);
            }}
          >
            {state?.status === 'active' ? 'Back to battle ▶' : awake ? 'Battle! ▶' : ready ? 'Wake it! ▶' : 'Shh...'}
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
  const word = String(wordObj?.battle?.word || wordObj?.content || '');
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
  justify-content: center;
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
  position: relative;
  flex-shrink: 0;
`;

const gateMonsterAwakeCls = css`
  animation: gate-bob 1.2s steps(2) infinite;
  @keyframes gate-bob {
    50% {
      transform: translateY(-3px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// "z z z" drifting up from the sleeping monster; a stir pops them.
const zzzCls = css`
  position: absolute;
  top: 6px;
  right: -6px;
  width: 44px;
  height: 64px;
  pointer-events: none;
  font-family: ${PIXEL_FONT};
  color: #cfe3ff;
  span {
    position: absolute;
    left: 0;
    bottom: 0;
    opacity: 0;
    animation: gate-zzz 2.4s steps(6) infinite;
  }
  span:nth-of-type(1) {
    font-size: 9px;
  }
  span:nth-of-type(2) {
    font-size: 12px;
    animation-delay: -1.6s;
  }
  span:nth-of-type(3) {
    font-size: 15px;
    animation-delay: -0.8s;
  }
  @keyframes gate-zzz {
    0% {
      opacity: 0;
      transform: translate(0, 0);
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(18px, -44px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    span {
      animation: none;
      opacity: 1;
    }
    span:nth-of-type(1) {
      transform: translate(2px, -6px);
    }
    span:nth-of-type(2) {
      transform: translate(10px, -22px);
    }
    span:nth-of-type(3) {
      transform: translate(20px, -40px);
    }
  }
`;

const zzzPopCls = css`
  span {
    animation: gate-zzz-pop 0.6s steps(4) 1 forwards;
    animation-delay: 0s;
  }
  span:nth-of-type(2) {
    animation-delay: 0.05s;
  }
  span:nth-of-type(3) {
    animation-delay: 0.1s;
  }
  @keyframes gate-zzz-pop {
    0% {
      opacity: 1;
      transform: translate(8px, -20px) scale(1);
    }
    60% {
      opacity: 1;
      transform: translate(14px, -30px) scale(1.6);
    }
    100% {
      opacity: 0;
      transform: translate(16px, -34px) scale(0.4);
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
