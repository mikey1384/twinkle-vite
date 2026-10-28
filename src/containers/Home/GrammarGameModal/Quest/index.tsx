import Icon from '~/components/Icon';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import usePendingAction from '~/helpers/hooks/usePendingAction';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import { buildTodayStatsPatchFromDailyTaskStatus } from '~/helpers';
import WorldMap from './WorldMap';
import MusicChoice from './MusicChoice';
import { readGrammarblesSettings } from './audioPreferences';
import Run from './Run';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';
import Result from './Result';
import { playQuestSound } from './sfx';
import PixelIcon from './PixelIcon';
import { BLUE, PARCHMENT, ROSE, button, frame } from './pixelUi';
import type {
  QuestAnswer,
  QuestNode,
  QuestResult,
  QuestRun,
  QuestState
} from './types';

// The marble-run engine (levels, enemies, 35 bosses and their sprites) loads
// only when Quest opens, not with every Home page visit.
const loadMarbleRun = () => import('./MarbleRunScreen');
const MarbleRunScreen = lazyWithRetry(loadMarbleRun);

// Grammar Quest (10-06): a painted world map over the tagged grammar bank.
// Stops and bosses play as the marble run (10-07); the nemesis house keeps
// the plain question list. Classic Grammarbles stays as it is.
export default function GrammarQuest({
  selection,
  onSelect
}: {
  selection?: { worldId: number | null; nodeId: string | null };
  onSelect?: (selection: { worldId: number | null; nodeId: string | null }) => void;
} = {}) {
  const { pendingAction, runAction } = usePendingAction();
  const loadState = useAppContext(
    (v) => v.requestHelpers.loadGrammarQuestState
  );
  const startRun = useAppContext((v) => v.requestHelpers.startGrammarQuestRun);
  const loadRun = useAppContext((v) => v.requestHelpers.loadGrammarQuestRun);
  const collectMastery = useAppContext((v) => v.requestHelpers.claimGrammarQuestWorldMastery);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onApplyTodayStatsProgress = useNotiContext(
    (v) => v.actions.onApplyTodayStatsProgress
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const accountSettings = useKeyContext((v) => v.myState.settings);
  const [state, setState] = useState<QuestState | null>(null);
  const [worldId, setWorldId] = useState<number | null>(selection?.worldId ?? null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    selection?.nodeId ?? null
  );
  const [run, setRun] = useState<QuestRun | null>(null);
  const [result, setResult] = useState<QuestResult | null>(null);
  const [resultAnswers, setResultAnswers] = useState<QuestAnswer[]>([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const refreshVersion = useRef(0);

  // DEV ONLY (compiled out of production): the Fit Lab's sample result
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    import('./MarbleRun/lab/fitPreview').then((m) => {
      if (m.fitPreviewParam() !== 'quest-result') return;
      setRun(m.PREVIEW_QUEST_RUN as any);
      setResult(m.PREVIEW_QUEST_RESULT as any);
      setResultAnswers(m.PREVIEW_QUEST_ANSWERS as any);
    });
  }, []);

  useEffect(() => {
    refresh(true);
    // fetch the engine while the map is up, so a run starts at once
    loadMarbleRun().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (typeof readGrammarblesSettings(accountSettings).music !== 'boolean') {
    return <MusicChoice />;
  }

  if (!state) {
    return (
      <div className={centerCls}>
        {error ? error : <Loading text="Opening the map…" />}
      </div>
    );
  }
  const unlocked = state.worlds.filter((w) => w.unlocked);
  const world =
    state.worlds.find((w) => w.id === worldId) ||
    unlocked[unlocked.length - 1] ||
    state.worlds[0];

  return (
    <ErrorBoundary componentPath="Earn/GrammarGameModal/Quest">
      <div className={wrapCls}>
        {error && (
          <div className={errorCls}>
            <PixelIcon name="ghost" scale={2} />
            {error}
          </div>
        )}
        {result && run ? (
          <Result
            result={result}
            answers={resultAnswers}
            kind={run.kind}
            runId={run.runId}
            onBackToMap={handleBackToMap}
          />
        ) : run && run.rules?.mode !== 'nemesis' ? (
          <Suspense fallback={<Loading />}>
            <MarbleRunScreen
              run={run}
              onFinished={handleFinished}
              onQuit={handleBackToMap}
            />
          </Suspense>
        ) : run ? (
          <Run run={run} onFinished={handleFinished} onQuit={handleBackToMap} />
        ) : (
          <>
            {state.openRun && (
              <button className={resumeCls} disabled={starting || pendingAction !== null}
                aria-busy={pendingAction === 'resume'} onClick={handleResume}>
                <PixelIcon name="flag" scale={2} />
                You have an unfinished run. Continue it →
                {pendingAction === 'resume' && <Icon icon="spinner" pulse />}
              </button>
            )}
            <WorldMap
              state={state}
              world={world}
              selectedNodeId={selectedNodeId}
              onSelectWorld={(id) => {
                setWorldId(id);
                setSelectedNodeId(null);
                onSelect?.({ worldId: id, nodeId: null });
              }}
              onSelectNode={(id) => {
                playQuestSound('select');
                setSelectedNodeId(id);
                onSelect?.({ worldId: world.id, nodeId: id });
              }}
              onPlayNode={(node: QuestNode) => handleStart({ nodeId: node.id })}
              onPlayNemesis={() => {
                playQuestSound('nemesis');
                handleStart({ nemesis: true });
              }}
              starting={starting || pendingAction !== null}
              startingNodeId={pendingAction?.startsWith('node:') ? pendingAction.slice(5) : null}
              startingNemesis={pendingAction === 'nemesis'}
              collectingMastery={pendingAction === `mastery:${world.id}`}
              onCollectMastery={() => handleCollectMastery(world.id)}
            />
            <div className={footnoteCls}>
              {/* the real rules in plain words, one idea each (Mikey 10-07:
                  the percentages and cutoffs were hard to follow) */}
              <div>
                <b>Grades:</b> each stop and boss keeps your best grade, even
                when you replay. Stops have no timer: fewer misses, better grade
                (no misses = S). Bosses: faster answers, better grade.
              </div>
              <div>
                <b>Today:</b> {state.rewardedRunsLeft} more runs earn XP and
                Coins. All-S world bonuses are separate and can be earned once per world.
                {state.replaysPay
                  ? ''
                  : ' Playing a cleared stop or boss again earns half XP and no Coins.'}
              </div>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );

  async function refresh(first = false) {
    const version = ++refreshVersion.current;
    try {
      const loaded = await loadState();
      if (version === refreshVersion.current) setState(loaded);
    } catch {
      if (first && version === refreshVersion.current)
        setError('Grammar Quest could not open. Try again in a moment.');
    }
  }

  function handleStart(...args: Parameters<typeof handleStartRequest>) {
    return runAction('nodeId' in args[0] ? 'node:' + args[0].nodeId : 'nemesis', () =>
      handleStartRequest(...args)
    );
  }

  async function handleStartRequest(target: { nodeId: string } | { nemesis: true }) {
    setStarting(true);
    setError('');
    try {
      const started = await startRun(target);
      setResult(null);
      setRun(started);
      rememberRunSelection(started);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not start this run.');
    } finally {
      setStarting(false);
    }
  }

  function handleResume(...args: Parameters<typeof handleResumeRequest>) {
    return runAction('resume', () => handleResumeRequest(...args));
  }

  async function handleResumeRequest() {
    if (!state?.openRun) return;
    try {
      const reopened = await loadRun(state.openRun.runId);
      setRun(reopened);
      rememberRunSelection(reopened);
    } catch {
      setError('Could not reopen that run.');
    }
  }

  function handleFinished(finished: QuestResult, answers: QuestAnswer[]) {
    setResult(finished);
    setResultAnswers(answers);
    if (finished.cleared && run && run.kind !== 'nemesis') {
      // Stay in this world while improving best grades. A newly cleared stop
      // may select the next stop within it; a replay keeps the chosen stop.
      const replay = state?.worlds.find((w) => w.id === run.worldId)?.nodes.find((n) => n.id === run.nodeId)?.cleared;
      const nodeId = replay ? run.nodeId : null;
      setWorldId(run.worldId);
      setSelectedNodeId(nodeId);
      onSelect?.({ worldId: run.worldId, nodeId });
    }
    // the marble run already played its flag or boss-down sound
    if (run?.kind === 'nemesis') playQuestSound('clear');
    applyBalances(finished);
    if (finished.dailyTaskStatus) {
      onApplyTodayStatsProgress({
        newStats: buildTodayStatsPatchFromDailyTaskStatus(
          finished.dailyTaskStatus
        )
      });
    }
    refresh();
  }

  function rememberRunSelection(selectedRun: QuestRun) {
    if (selectedRun.kind === 'nemesis') return;
    setWorldId(selectedRun.worldId);
    setSelectedNodeId(selectedRun.nodeId);
    onSelect?.({ worldId: selectedRun.worldId, nodeId: selectedRun.nodeId });
  }

  function handleCollectMastery(id: number) {
    return runAction(`mastery:${id}`, async () => {
      setError('');
      // An earlier map read cannot overwrite the canonical claim response.
      ++refreshVersion.current;
      try {
        const collected = await collectMastery(id);
        applyBalances(collected);
        setState((current) => current && ({
          ...current,
          worlds: current.worlds.map((w) => w.id === collected.worldId ? { ...w, mastery: collected.mastery } : w)
        }));
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Could not collect the bonus. Try again.');
      }
    });
  }

  function applyBalances(balances: { newXp?: number; newCoins?: number }) {
    if (typeof balances.newXp === 'number' || typeof balances.newCoins === 'number') {
      onSetUserState({
        userId,
        newState: {
          ...(typeof balances.newXp === 'number'
            ? { twinkleXP: balances.newXp }
            : {}),
          ...(typeof balances.newCoins === 'number'
            ? { twinkleCoins: balances.newCoins }
            : {})
        }
      });
    }
  }

  function handleBackToMap() {
    setRun(null);
    setResult(null);
    refresh();
  }
}

// a soft painted sky behind the map, the run and the result (Quest only)
const wrapCls = css`
  /* the Grammarbles page paints the sky edge to edge, and the map fills
     the screen; a result or a nemesis run scrolls inside it */
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 0 0 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 0.8rem 0.6rem;
  }
`;
const centerCls = css`
  display: flex;
  justify-content: center;
  padding: 4rem 0;
  font-size: 1.5rem;
`;
const errorCls = css`
  ${frame(ROSE, 2)}
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
  padding: 0.4rem 0.8rem;
  color: #a8233c;
  font-size: 1.3rem;
  font-weight: 800;
`;
const resumeCls = css`
  ${button(BLUE, '#1d3f7a', '#ffffff')}
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  width: 100%;
  min-height: 4.8rem;
  margin-bottom: 1.2rem;
  padding: 0.4rem 1rem;
  font-family: inherit;
  font-size: 1.4rem;
  font-weight: 800;
  text-shadow: 1px 1px 0 #1a1426;
  /* px on phones, whose rem is 8px: 44 held upright, 40 on its side */
  @media (max-width: ${mobileMaxWidth}) {
    min-height: 44px;
  }
  @media (max-height: 520px) and (orientation: landscape) {
    flex: none;
    min-height: 40px;
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
  }
`;
const footnoteCls = css`
  ${frame(PARCHMENT, 2)}
  flex: none;
  margin-top: 1rem;
  /* phones: one screen has no room; the stop panel and results say it */
  @media (max-width: ${mobileMaxWidth}),
    (max-height: 520px) and (orientation: landscape) {
    display: none;
  }
  padding: 0.4rem 0.8rem;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.5;
  color: #5b4026;
`;
