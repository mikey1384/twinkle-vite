import React, { Suspense, useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import { buildTodayStatsPatchFromDailyTaskStatus } from '~/helpers';
import WorldMap from './WorldMap';
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
export default function GrammarQuest() {
  const loadState = useAppContext(
    (v) => v.requestHelpers.loadGrammarQuestState
  );
  const startRun = useAppContext((v) => v.requestHelpers.startGrammarQuestRun);
  const loadRun = useAppContext((v) => v.requestHelpers.loadGrammarQuestRun);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onApplyTodayStatsProgress = useNotiContext(
    (v) => v.actions.onApplyTodayStatsProgress
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const [state, setState] = useState<QuestState | null>(null);
  const [worldId, setWorldId] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [run, setRun] = useState<QuestRun | null>(null);
  const [result, setResult] = useState<QuestResult | null>(null);
  const [resultAnswers, setResultAnswers] = useState<QuestAnswer[]>([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    refresh(true);
    // fetch the engine while the map is up, so a run starts at once
    loadMarbleRun().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <button className={resumeCls} onClick={handleResume}>
                <PixelIcon name="flag" scale={2} />
                You have an unfinished run. Continue it →
              </button>
            )}
            <WorldMap
              state={state}
              world={world}
              selectedNodeId={selectedNodeId}
              onSelectWorld={(id) => {
                setWorldId(id);
                setSelectedNodeId(null);
              }}
              onSelectNode={(id) => {
                playQuestSound('select');
                setSelectedNodeId(id);
              }}
              onPlayNode={(node: QuestNode) => handleStart({ nodeId: node.id })}
              onPlayNemesis={() => {
                playQuestSound('nemesis');
                handleStart({ nemesis: true });
              }}
              starting={starting}
            />
            <div className={footnoteCls}>
              Marbles come only from first-try answers: clear, shiny, then gold
              when mastered on different days. {state.rewardedRunsLeft} runs
              with XP and Coins left today
              {state.replaysPay
                ? '.'
                : '; replays of cleared stops and bosses pay half XP and no Coins until you beat the Logic Tower castle.'}
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );

  async function refresh(first = false) {
    try {
      setState(await loadState());
    } catch {
      if (first)
        setError('Grammar Quest could not open. Try again in a moment.');
    }
  }

  async function handleStart(target: { nodeId: string } | { nemesis: true }) {
    setStarting(true);
    setError('');
    try {
      const started = await startRun(target);
      setResult(null);
      setRun(started);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not start this run.');
    } finally {
      setStarting(false);
    }
  }

  async function handleResume() {
    if (!state?.openRun) return;
    try {
      const reopened = await loadRun(state.openRun.runId);
      setRun(reopened);
    } catch {
      setError('Could not reopen that run.');
    }
  }

  function handleFinished(finished: QuestResult, answers: QuestAnswer[]) {
    setResult(finished);
    setResultAnswers(answers);
    // the marble run already played its flag or boss-down sound
    if (run?.kind === 'nemesis') playQuestSound('clear');
    if (
      typeof finished.newXp === 'number' ||
      typeof finished.newCoins === 'number'
    ) {
      onSetUserState({
        userId,
        newState: {
          ...(typeof finished.newXp === 'number'
            ? { twinkleXP: finished.newXp }
            : {}),
          ...(typeof finished.newCoins === 'number'
            ? { twinkleCoins: finished.newCoins }
            : {})
        }
      });
    }
    if (finished.dailyTaskStatus) {
      onApplyTodayStatsProgress({
        newStats: buildTodayStatsPatchFromDailyTaskStatus(
          finished.dailyTaskStatus
        )
      });
    }
    refresh();
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
`;
const footnoteCls = css`
  ${frame(PARCHMENT, 2)}
  flex: none;
  margin-top: 1rem;
  /* phones: one screen has no room; the stop panel and results say it */
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
  padding: 0.4rem 0.8rem;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.5;
  color: #5b4026;
`;
