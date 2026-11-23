import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css, cx } from '@emotion/css';
import Modal from '~/components/Modal';
import ErrorBoundary from '~/components/ErrorBoundary';
import MonsterSprite from '~/components/WordMonster/MonsterSprite';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useChatContext } from '~/contexts';
import BattleScreen, { BattleApi, BattleState } from '../WordBattle/BattleScreen';
import { backInLabel, resetTimeLabel } from '../WordBattle/lines';
import WordModal from '../WordModal';

const PIXEL_FONT = "'Press Start 2P', monospace";

type Section = 'escaped' | 'waiting' | 'beaten';
type BattleMode = 'battle' | 'practice' | 'rehunt';

interface DenItem {
  wordId: number;
  word: string;
  wordLevel: number;
  at: number;
  active?: boolean;
  // Escaped only: when its re-hunt opens (ms) and whether it is open now.
  readyAt?: number;
  ready?: boolean;
}

interface SectionState {
  items: DenItem[];
  nextCursor: number | null;
  loading: boolean;
  loaded: boolean;
}

const emptySection: SectionState = { items: [], nextCursor: null, loading: false, loaded: false };

// The Monster Den (Mikey 11-23): the monsters that ran away (Escaped, first:
// they matter most for review), the member's captured monsters (Waiting) and
// every word they have beaten (Beaten). An escaped monster can be re-hunted a
// day after it ran away, for full loot on a catch (once per word); before
// then a tap opens its meaning to study. A waiting monster is battled with
// full loot while today's battles last; a beaten one can be rematched for
// practice (no loot, no daily battle; the server enforces it). Counts and
// battles left come from the server; nothing here is guessed.
export default function MonsterDen({ style }: { style?: React.CSSProperties }) {
  const loadWordBattleDen = useAppContext((v) => v.requestHelpers.loadWordBattleDen);
  const loadWordBattle = useAppContext((v) => v.requestHelpers.loadWordBattle);
  const startWordBattle = useAppContext((v) => v.requestHelpers.startWordBattle);
  const startWordRehunt = useAppContext((v) => v.requestHelpers.startWordRehunt);
  const answerWordBattle = useAppContext((v) => v.requestHelpers.answerWordBattle);
  const loadWordBattleAudio = useAppContext((v) => v.requestHelpers.loadWordBattleAudio);
  const onUnlockWordDefinitions = useChatContext((v) => v.actions.onUnlockWordDefinitions);
  const [header, setHeader] = useState<{
    escaped: number;
    escapedReady: number;
    rehuntAvailable: boolean;
    waiting: number;
    beaten: number;
    battlesLeft: number | null;
    battleLimit: number;
    resetAt?: number;
    denAvailable: boolean;
  } | null>(null);
  const [sections, setSections] = useState<Record<Section, SectionState>>({
    escaped: emptySection,
    waiting: emptySection,
    beaten: emptySection
  });
  const [failed, setFailed] = useState(false);
  const [battle, setBattle] = useState<{ state: BattleState; mode: BattleMode } | null>(null);
  const [notice, setNotice] = useState<string>('');
  const [meaningWord, setMeaningWord] = useState<string | null>(null);

  const loadSection = useCallback(
    async (section: Section, cursor?: number | null) => {
      setSections((prev) => ({ ...prev, [section]: { ...prev[section], loading: true } }));
      try {
        const data = await loadWordBattleDen({ section, cursor });
        if (!cursor && data?.counts) {
          setHeader({
            escaped: 0,
            escapedReady: 0,
            rehuntAvailable: false,
            ...data.counts,
            battlesLeft: data.battlesLeft ?? null,
            battleLimit: data.battleLimit,
            resetAt: data.resetAt
          });
        }
        setSections((prev) => ({
          ...prev,
          [section]: {
            items: cursor ? [...prev[section].items, ...(data?.items || [])] : data?.items || [],
            nextCursor: data?.nextCursor ?? null,
            loading: false,
            loaded: true
          }
        }));
      } catch (error) {
        console.error(error);
        setFailed(true);
        setSections((prev) => ({ ...prev, [section]: { ...prev[section], loading: false } }));
      }
    },
    [loadWordBattleDen]
  );

  const refresh = useCallback(() => {
    void loadSection('escaped');
    void loadSection('waiting');
    void loadSection('beaten');
  }, [loadSection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const realApi: BattleApi = useMemo(
    () => ({
      start: async (id) => {
        try {
          return await startWordBattle(id);
        } catch (error: any) {
          // Today's battles ran out since the Den loaded (handleError
          // rejects with the server's code as `message`).
          if (error?.message === 'daily_limit') {
            setBattle(null);
            setHeader((prev) => (prev ? { ...prev, battlesLeft: 0 } : prev));
            setNotice("Today's battles are used up. Your monsters are back tomorrow.");
          }
          throw error;
        }
      },
      answer: (args) => answerWordBattle(args),
      loadAudio: (args) => loadWordBattleAudio(args)
    }),
    [answerWordBattle, loadWordBattleAudio, startWordBattle]
  );
  const rehuntApi: BattleApi = useMemo(
    () => ({
      start: async (id) => {
        try {
          return await startWordRehunt(id);
        } catch (error: any) {
          if (error?.message === 'daily_limit') {
            setBattle(null);
            setHeader((prev) => (prev ? { ...prev, battlesLeft: 0 } : prev));
            setNotice("Today's battles are used up. The hunt goes on tomorrow.");
          }
          throw error;
        }
      },
      answer: (args) => answerWordBattle({ ...args, rehunt: true }),
      loadAudio: (args) => loadWordBattleAudio({ ...args, rehunt: true })
    }),
    [answerWordBattle, loadWordBattleAudio, startWordRehunt]
  );
  const rematchApi: BattleApi = useMemo(
    () => ({
      start: (id) => startWordBattle(id, undefined, true),
      answer: (args) => answerWordBattle({ ...args, practice: true }),
      loadAudio: (args) => loadWordBattleAudio(args)
    }),
    [answerWordBattle, loadWordBattleAudio, startWordBattle]
  );

  const outOfBattles = header?.battlesLeft === 0;

  async function handleWaitingTap(item: DenItem) {
    if (outOfBattles && !item.active) {
      setNotice(
        `${item.word.toUpperCase()} is resting. Back tomorrow: battles reset at ${resetTimeLabel(header?.resetAt)}.`
      );
      return;
    }
    setNotice('');
    try {
      const state: BattleState = await loadWordBattle(item.wordId);
      if (state?.unlocked) {
        // Already played elsewhere: show its meaning and tidy the Den.
        onUnlockWordDefinitions(state.unlocked);
        setMeaningWord(String(state.unlocked.content || item.word));
        refresh();
        return;
      }
      if (state?.status === 'ready' && state.battlesLeft === 0) {
        setHeader((prev) => (prev ? { ...prev, battlesLeft: 0 } : prev));
        setNotice(
          `${item.word.toUpperCase()} is resting. Back tomorrow: battles reset at ${resetTimeLabel(state.resetAt)}.`
        );
        return;
      }
      if (state?.status === 'ready' || state?.status === 'active') {
        setBattle({ state, mode: 'battle' });
      }
    } catch (error) {
      console.error(error);
      setNotice('The Den door is stuck. Try again in a moment.');
    }
  }

  // An escaped monster: re-hunt it once it is back (a daily battle); before
  // then, or past today's battles, its meaning opens to study.
  async function handleEscapedTap(item: DenItem) {
    setNotice('');
    const open = item.active || item.ready;
    if (open && (item.active || !outOfBattles)) {
      setBattle({
        mode: 'rehunt',
        state: { status: 'ready', wordId: item.wordId, word: item.word, wordLevel: item.wordLevel }
      });
      return;
    }
    if (open) {
      setNotice(
        `Today's battles are used up! ${item.word.toUpperCase()} can be re-hunted after ${resetTimeLabel(header?.resetAt)}.`
      );
    }
    try {
      // Its meaning (already shown when it ran away), with the RAN AWAY card.
      const state: BattleState = await loadWordBattle(item.wordId);
      if (state?.unlocked) {
        onUnlockWordDefinitions(state.unlocked);
        setMeaningWord(String(state.unlocked.content || item.word));
      }
    } catch (error) {
      console.error(error);
      setNotice('The Den door is stuck. Try again in a moment.');
    }
  }

  function handleBeatenTap(item: DenItem) {
    setNotice('');
    setBattle({
      mode: 'practice',
      state: { status: 'ready', wordId: item.wordId, word: item.word, wordLevel: item.wordLevel }
    });
  }

  function handleBattleClosed(finished?: BattleState) {
    const wasPractice = battle?.mode === 'practice';
    setBattle(null);
    if (!wasPractice && finished?.unlocked) {
      onUnlockWordDefinitions(finished.unlocked);
      setMeaningWord(String(finished.unlocked.content || finished.word));
    }
    if (!wasPractice) refresh();
  }

  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/Vocabulary/MonsterDen">
      <div className={rootCls} style={style} data-testid="monster-den">
        <div className={headerCls}>
          <div className={titleCls}>MONSTER DEN</div>
          <div className={statsCls} aria-live="polite">
            {header ? (
              <>
                <span>
                  <b>{header.escaped.toLocaleString()}</b> escaped
                </span>
                <span className={dotCls}>·</span>
                <span>
                  <b>{header.waiting.toLocaleString()}</b> waiting
                </span>
                <span className={dotCls}>·</span>
                <span>
                  <b>{header.beaten.toLocaleString()}</b> beaten
                </span>
                {header.battlesLeft !== null && (
                  <>
                    <span className={dotCls}>·</span>
                    <span className={cx(outOfBattles && outCls)}>
                      <b>
                        {header.battlesLeft}/{header.battleLimit}
                      </b>{' '}
                      battles left today
                    </span>
                  </>
                )}
              </>
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
        </div>
        {notice && (
          <div className={noticeCls} role="status">
            {notice}
          </div>
        )}
        {failed && !header && (
          <div className={emptyCls}>The Den door is stuck. Try again in a moment.</div>
        )}

        <DenSection
          title="ESCAPED"
          hint={
            header?.rehuntAvailable === false
              ? 'They ran away. Tap one to study its meaning.'
              : header?.escapedReady
                ? `${header.escapedReady.toLocaleString()} back for a re-hunt: catch one for full loot.`
                : 'They ran away. A day later each one is back for a re-hunt with full loot.'
          }
          state={sections.escaped}
          empty="No escapes. A monster that beats you hides here until you re-hunt it."
          escaped
          resting={outOfBattles}
          onTap={handleEscapedTap}
          onMore={() => loadSection('escaped', sections.escaped.nextCursor)}
        />
        <DenSection
          title="WAITING"
          hint={
            outOfBattles
              ? `Back tomorrow: battles reset at ${resetTimeLabel(header?.resetAt)}.`
              : 'Tap one to battle it for full loot.'
          }
          state={sections.waiting}
          empty={
            header && !header.denAvailable
              ? 'The Den opens soon.'
              : 'No monsters waiting. Tap Capture on any locked word to keep it here for later.'
          }
          resting={outOfBattles}
          onTap={handleWaitingTap}
          onMore={() => loadSection('waiting', sections.waiting.nextCursor)}
        />
        <DenSection
          title="BEATEN"
          hint="Tap one for a rematch: practice only, no loot."
          state={sections.beaten}
          empty="Nothing beaten yet. Win a word battle and its monster moves in here."
          beaten
          onTap={handleBeatenTap}
          onMore={() => loadSection('beaten', sections.beaten.nextCursor)}
        />
      </div>

      {battle && (
        <Modal
          modalKey="WordBattle"
          isOpen
          size="md"
          hasHeader={false}
          bodyPadding={0}
          closeOnBackdropClick={false}
          showCloseButton={false}
          xpActivity
          onClose={() => handleBattleClosed()}
          aria-label={`${
            battle.mode === 'practice' ? 'Rematch' : battle.mode === 'rehunt' ? 'Re-hunt' : 'Battle'
          } ${battle.state.word}`}
        >
          <BattleScreen
            initial={battle.state}
            api={
              battle.mode === 'practice' ? rematchApi : battle.mode === 'rehunt' ? rehuntApi : realApi
            }
            practice={battle.mode === 'practice'}
            rehunt={battle.mode === 'rehunt'}
            onClose={() => handleBattleClosed()}
            onFinished={(finished) => handleBattleClosed(finished)}
          />
        </Modal>
      )}
      {meaningWord && <WordModal word={meaningWord} onHide={() => setMeaningWord(null)} />}
    </ErrorBoundary>
  );
}

function DenSection({
  title,
  hint,
  state,
  empty,
  beaten,
  escaped,
  resting,
  onTap,
  onMore
}: {
  title: string;
  hint: string;
  state: SectionState;
  empty: string;
  beaten?: boolean;
  escaped?: boolean;
  resting?: boolean;
  onTap: (item: DenItem) => void;
  onMore: () => void;
}) {
  return (
    <section className={sectionCls}>
      <div className={sectionHeadCls}>
        <h3 className={sectionTitleCls}>{title}</h3>
        <span className={sectionHintCls}>{hint}</span>
      </div>
      {state.loaded && state.items.length === 0 ? (
        <div className={emptyCls}>{empty}</div>
      ) : (
        <div className={gridCls}>
          {state.items.map((item) => {
            // Escaped tiles are drawn once (no timers): ready ones awake,
            // the rest peeking out of hiding with when they're back.
            const huntOpen = escaped && (item.active || item.ready);
            const escapedLine = !escaped
              ? null
              : item.active
                ? 'BACK TO IT ▶'
                : item.ready
                  ? resting
                    ? 'TOMORROW'
                    : 'RE-HUNT ▶'
                  : item.readyAt
                    ? `Back in ${backInLabel(item.readyAt)}`
                    : 'ESCAPED';
            return (
              <button
                key={item.wordId}
                type="button"
                className={cx(
                  tileCls,
                  beaten && tileBeatenCls,
                  escaped && tileEscapedCls,
                  huntOpen && !(resting && !item.active) && tileHuntCls,
                  !escaped && resting && !item.active && tileRestingCls
                )}
                onClick={() => onTap(item)}
                aria-label={`${
                  beaten ? 'Rematch' : escaped ? (huntOpen ? 'Re-hunt' : 'Study') : 'Battle'
                } ${item.word}`}
              >
                <span className={tileSpriteCls}>
                  <MonsterSprite
                    word={item.word}
                    level={item.wordLevel}
                    scale={2}
                    pose={
                      escaped
                        ? huntOpen
                          ? 'idle'
                          : 'peek'
                        : resting && !item.active
                          ? 'sleep'
                          : 'idle'
                    }
                    still={beaten || escaped}
                  />
                  {item.active && <span className={tileBadgeCls}>!</span>}
                  {beaten && <span className={tileCrownCls}>★</span>}
                </span>
                <span className={tileWordCls}>{item.word}</span>
                <span className={tileStarsCls}>{'★'.repeat(item.wordLevel)}</span>
                {escapedLine && (
                  <span className={cx(tileHuntLineCls, huntOpen && tileHuntLineOpenCls)}>
                    {escapedLine}
                  </span>
                )}
              </button>
            );
          })}
          {!state.loaded &&
            Array.from({ length: 6 }).map((_, i) => <div key={i} className={tileGhostCls} />)}
        </div>
      )}
      {state.nextCursor && (
        <div className={moreRowCls}>
          <button type="button" className={moreCls} disabled={state.loading} onClick={onMore}>
            {state.loading ? 'Loading...' : 'Show more ▼'}
          </button>
        </div>
      )}
    </section>
  );
}

const rootCls = css`
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  background: #0f0b1a;
  color: #ffffff;
  padding: 1.2rem 1.4rem 3rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1rem 1rem 3rem;
  }
`;

const headerCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.2rem 1.4rem;
  border: 3px solid #ffffff;
  box-shadow: inset 0 0 0 3px #2c2442;
  background: #1a1426;
`;

const titleCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 14px;
  color: #ffd34d;
  letter-spacing: 1px;
`;

const statsCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.6rem;
  font-size: 1.5rem;
  color: #d8d0ea;
  b {
    font-family: ${PIXEL_FONT};
    font-size: 11px;
    color: #ffffff;
  }
`;

const dotCls = css`
  color: #6f6590;
`;

const outCls = css`
  b {
    color: #ff8a8a;
  }
`;

const noticeCls = css`
  margin-top: 1rem;
  padding: 1rem 1.2rem;
  border: 3px solid #ffd34d;
  background: #2c2442;
  font-size: 1.4rem;
  line-height: 1.5;
`;

const sectionCls = css`
  margin-top: 1.6rem;
`;

const sectionHeadCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem 1rem;
  margin-bottom: 1rem;
`;

const sectionTitleCls = css`
  margin: 0;
  font-family: ${PIXEL_FONT};
  font-size: 12px;
  color: #ffffff;
`;

const sectionHintCls = css`
  font-size: 1.3rem;
  color: #a99fc4;
`;

const gridCls = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(144px, 1fr));
  gap: 0.8rem;
  @media (max-width: 480px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.6rem;
  }
`;

const tileCls = css`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.8rem 0.4rem 0.6rem;
  color: #ffffff;
  background: #1a1426;
  border: 3px solid #2c2442;
  box-shadow: 0 3px 0 #07050d;
  cursor: pointer;
  &:hover {
    border-color: #ffd34d;
  }
  &:focus-visible {
    outline: 3px solid #ffd34d;
    outline-offset: 2px;
  }
  &:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 #07050d;
  }
`;

const tileBeatenCls = css`
  background: #15201a;
  border-color: #24402e;
  &:hover {
    border-color: #7bd88f;
  }
`;

const tileEscapedCls = css`
  background: #241a14;
  border-color: #4a3424;
  &:hover {
    border-color: #ffb36b;
  }
`;

const tileHuntCls = css`
  border-color: #ffd34d;
`;

const tileHuntLineCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 8px;
  line-height: 1.4;
  color: #c9a98c;
  white-space: nowrap;
`;

const tileHuntLineOpenCls = css`
  color: #ffd34d;
`;

const tileRestingCls = css`
  opacity: 0.7;
`;

const tileSpriteCls = css`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 128px;
  @media (max-width: 480px) {
    height: 96px;
    /* 1.5x of the 64-pixel art: three device pixels per art pixel on a 2x
       phone screen, so it stays crisp in three columns. */
    canvas {
      width: 96px !important;
      height: 96px !important;
    }
  }
`;

const tileBadgeCls = css`
  position: absolute;
  top: -4px;
  right: -10px;
  font-family: ${PIXEL_FONT};
  font-size: 10px;
  color: #3b2200;
  background: #ffd34d;
  border: 2px solid #ffffff;
  padding: 2px 4px;
`;

const tileCrownCls = css`
  position: absolute;
  top: -6px;
  right: -8px;
  font-size: 1.4rem;
  color: #ffd34d;
`;

const tileWordCls = css`
  max-width: 100%;
  font-size: 1.3rem;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const tileStarsCls = css`
  font-size: 1rem;
  color: #d18b00;
  letter-spacing: 1px;
`;

const tileGhostCls = css`
  height: 180px;
  @media (max-width: 480px) {
    height: 150px;
  }
  background: #1a1426;
  border: 3px solid #2c2442;
  opacity: 0.5;
`;

const emptyCls = css`
  padding: 1.6rem 1.4rem;
  border: 3px dashed #2c2442;
  color: #d8d0ea;
  font-size: 1.4rem;
  line-height: 1.6;
  text-align: center;
`;

const moreRowCls = css`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;

const moreCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 10px;
  padding: 10px 14px;
  color: #ffffff;
  background: #2c2442;
  border: 3px solid #a99fc4;
  box-shadow: 0 3px 0 #120d1f;
  cursor: pointer;
  &:disabled {
    opacity: 0.7;
    cursor: default;
  }
`;
