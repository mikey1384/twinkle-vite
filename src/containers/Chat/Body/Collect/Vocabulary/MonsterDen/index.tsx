import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css, cx } from '@emotion/css';
import Modal from '~/components/Modal';
import ErrorBoundary from '~/components/ErrorBoundary';
import MonsterSprite from '~/components/WordMonster/MonsterSprite';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useChatContext } from '~/contexts';
import BattleScreen, { BattleApi, BattleState } from '../WordBattle/BattleScreen';
import { resetTimeLabel } from '../WordBattle/lines';
import WordModal from '../WordModal';

const PIXEL_FONT = "'Press Start 2P', monospace";

type Section = 'waiting' | 'beaten';

interface DenItem {
  wordId: number;
  word: string;
  wordLevel: number;
  at: number;
  active?: boolean;
}

interface SectionState {
  items: DenItem[];
  nextCursor: number | null;
  loading: boolean;
  loaded: boolean;
}

const emptySection: SectionState = { items: [], nextCursor: null, loading: false, loaded: false };

// The Monster Den (Mikey 11-23): the member's captured monsters (Waiting) and
// every word they have beaten (Beaten). A waiting monster is battled with
// full loot while today's battles last; a beaten one can be rematched for
// practice (no loot, no daily battle; the server enforces it). Counts and
// battles left come from the server; nothing here is guessed.
export default function MonsterDen({ style }: { style?: React.CSSProperties }) {
  const loadWordBattleDen = useAppContext((v) => v.requestHelpers.loadWordBattleDen);
  const loadWordBattle = useAppContext((v) => v.requestHelpers.loadWordBattle);
  const startWordBattle = useAppContext((v) => v.requestHelpers.startWordBattle);
  const answerWordBattle = useAppContext((v) => v.requestHelpers.answerWordBattle);
  const loadWordBattleAudio = useAppContext((v) => v.requestHelpers.loadWordBattleAudio);
  const onUnlockWordDefinitions = useChatContext((v) => v.actions.onUnlockWordDefinitions);
  const [header, setHeader] = useState<{
    waiting: number;
    beaten: number;
    battlesLeft: number | null;
    battleLimit: number;
    resetAt?: number;
    denAvailable: boolean;
  } | null>(null);
  const [sections, setSections] = useState<Record<Section, SectionState>>({
    waiting: emptySection,
    beaten: emptySection
  });
  const [failed, setFailed] = useState(false);
  const [battle, setBattle] = useState<{ state: BattleState; practice: boolean } | null>(null);
  const [notice, setNotice] = useState<string>('');
  const [meaningWord, setMeaningWord] = useState<string | null>(null);

  const loadSection = useCallback(
    async (section: Section, cursor?: number | null) => {
      setSections((prev) => ({ ...prev, [section]: { ...prev[section], loading: true } }));
      try {
        const data = await loadWordBattleDen({ section, cursor });
        if (!cursor && data?.counts) {
          setHeader({
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
    void loadSection('waiting');
    void loadSection('beaten');
  }, [loadSection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const realApi: BattleApi = useMemo(
    () => ({
      start: (id) => startWordBattle(id),
      answer: (args) => answerWordBattle(args),
      loadAudio: (args) => loadWordBattleAudio(args)
    }),
    [answerWordBattle, loadWordBattleAudio, startWordBattle]
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
        setBattle({ state, practice: false });
      }
    } catch (error) {
      console.error(error);
      setNotice('The Den door is stuck. Try again in a moment.');
    }
  }

  function handleBeatenTap(item: DenItem) {
    setNotice('');
    setBattle({
      practice: true,
      state: { status: 'ready', wordId: item.wordId, word: item.word, wordLevel: item.wordLevel }
    });
  }

  function handleBattleClosed(finished?: BattleState) {
    const wasPractice = battle?.practice;
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
          aria-label={`${battle.practice ? 'Rematch' : 'Battle'} ${battle.state.word}`}
        >
          <BattleScreen
            initial={battle.state}
            api={battle.practice ? rematchApi : realApi}
            practice={battle.practice}
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
  resting,
  onTap,
  onMore
}: {
  title: string;
  hint: string;
  state: SectionState;
  empty: string;
  beaten?: boolean;
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
          {state.items.map((item) => (
            <button
              key={item.wordId}
              type="button"
              className={cx(tileCls, beaten && tileBeatenCls, resting && !item.active && tileRestingCls)}
              onClick={() => onTap(item)}
              aria-label={`${beaten ? 'Rematch' : 'Battle'} ${item.word}`}
            >
              <span className={tileSpriteCls}>
                <MonsterSprite
                  word={item.word}
                  level={item.wordLevel}
                  scale={2}
                  pose={resting && !item.active ? 'sleep' : 'idle'}
                  still={beaten}
                />
                {item.active && <span className={tileBadgeCls}>!</span>}
                {beaten && <span className={tileCrownCls}>★</span>}
              </span>
              <span className={tileWordCls}>{item.word}</span>
              <span className={tileStarsCls}>{'★'.repeat(item.wordLevel)}</span>
            </button>
          ))}
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
