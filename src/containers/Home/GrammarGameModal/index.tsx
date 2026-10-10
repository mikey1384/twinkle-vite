import useUserActivity from '~/helpers/hooks/useUserActivity';
import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import {
  APP_SHELL_HEADER_OFFSET_STYLE,
  MOBILE_NAV_FOOTPRINT_STYLE
} from '~/constants/appShell';
import {
  AUDIO_CHOICE_EVENT,
  isQuestMuted,
  playQuestSound,
  setQuestMuted
} from './Quest/sfx';
import { setMusicEnabled } from './Quest/MarbleRun/music';
import { readGrammarblesSettings } from './Quest/audioPreferences';
import Game from './Game';
import ErrorBoundary from '~/components/ErrorBoundary';
import StartScreen from './StartScreen';
import FinishScreen from './FinishScreen';
import GameNav, { type NavLook, type NavTab } from './GameNav';
import { NavSlotContext } from './navSlot';
import Button from '~/components/Button';
import Rankings from './Rankings';
import Review from './Review';
import Loading from '~/components/Loading';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';
import ModeChooser from './ModeChooser';
import ClassicArcade from './ClassicArcade';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { GamePageContext, fixedPage } from './gamePortal';
import {
  useAppContext,
  useHomeContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { buildTodayStatsPatchFromDailyTaskStatus } from '~/helpers';
import { useAgentScreenState } from '~/helpers/websiteAgentScreenState';
import {
  countAnsweredGrammarQuestions,
  resolveGrammarCloseAction
} from './closeAction';
import {
  checkGrammarAnswerWithRetry,
  type GrammarAnswerCheck
} from './answerCheck';

// Quest (map, marble-run engine, bosses) loads only when Grammarbles opens
// in Quest mode, not with every Home page visit.
const GrammarQuest = lazyWithRetry(() => import('./Quest'));

const RESULT_SCREEN_MIN_DISPLAY_MS = 3000;

// The server graded every pick and keeps the round's result; finishing only
// names the session.
interface GrammarResultPayload {
  sessionId: number;
}

export default function Grammarbles({ onHide }: { onHide: () => void }) {
  const userId = useKeyContext((v) => v.myState.userId);
  const [gameLoading, setGameLoading] = useState(false);
  const finishGrammarSession = useAppContext(
    (v) => v.requestHelpers.finishGrammarSession
  );
  const startGrammarSession = useAppContext(
    (v) => v.requestHelpers.startGrammarSession
  );
  const checkGrammarAnswer = useAppContext(
    (v) => v.requestHelpers.checkGrammarAnswer
  );
  const cancelGrammarGame = useAppContext(
    (v) => v.requestHelpers.cancelGrammarGame
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onApplyTodayStatsProgress = useNotiContext(
    (v) => v.actions.onApplyTodayStatsProgress
  );
  // Classic and Quest are two equal games: pick one first (Mikey 10-07)
  const [mode, setMode] = useState<'choose' | 'classic' | 'quest'>('choose');
  const [activeTab, setActiveTab] = useState('game');
  const [rankingsTab, setRankingsTab] = useState('all');
  const [gameState, setGameState] = useState('notStarted');
  useUserActivity(
    activeTab === 'game' && gameState === 'started'
      ? { kind: 'game', id: 'grammarbles' }
      : null
  );
  const [questionsReady, setQuestionsReady] = useState(false);
  const [timesPlayedToday, setTimesPlayedToday] = useState(0);
  const [hasUnlockedDailyTask, setHasUnlockedDailyTask] = useState(false);
  const attemptNumberRef = useRef<number | null>(null);
  // Set only from the server's session answer, so a cancel always names an
  // attempt this round really started.
  const startedAttemptNumberRef = useRef<number | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  // Every pick gets its own id; a resend after a dropped connection reuses
  // it so the server never counts one pick twice.
  const clickIdRef = useRef(0);
  const uploadInFlightRef = useRef(false);
  const unsavedResultRef = useRef<GrammarResultPayload | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [retryingSave, setRetryingSave] = useState(false);
  const [questionIds, setQuestionIds] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [triggerEffect, setTriggerEffect] = useState(false);
  // sound and music follow the player's account (Mikey 10-07): the saved
  // choice is applied before any game screen mounts, and every switch is
  // saved back to the account
  const accountSettings = useKeyContext((v) => v.myState.settings);
  const updateGrammarblesSettings = useAppContext(
    (v) => v.requestHelpers.updateGrammarblesSettings
  );
  useState(() => {
    const saved = readGrammarblesSettings(accountSettings);
    if (typeof saved.sound === 'boolean')
      setQuestMuted(!saved.sound, { fromAccount: true });
    if (typeof saved.music === 'boolean')
      setMusicEnabled(saved.music, { fromAccount: true });
    return null;
  });
  useEffect(() => {
    async function handleChoice(e: Event) {
      const choice = (e as CustomEvent).detail || {};
      try {
        const result = await updateGrammarblesSettings(choice);
        if (result?.settings && userId) {
          onSetUserState({ userId, newState: { settings: result.settings } });
        }
      } catch {
        // kept on this device; the account catches up on the next switch
      }
    }
    window.addEventListener(AUDIO_CHOICE_EVENT, handleChoice);
    return () => window.removeEventListener(AUDIO_CHOICE_EVENT, handleChoice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  const [showConfirm, setShowConfirm] = useState(false);
  // its dialogs mount inside the page while it is fixed (gamePortal.ts)
  const [page, setPage] = useState<HTMLDivElement | null>(null);
  // the top bar's status spot, filled by the Quest map (navSlot.ts)
  const [navSlot, setNavSlot] = useState<HTMLDivElement | null>(null);
  const questionObjRef = useRef<Record<number, any>>({});
  const scoreArrayRef = useRef<string[]>([]);

  // DEV ONLY (compiled out of production): ?fitpreview=… opens a Classic or
  // Quest screen with sample data for the Fit Lab's responsive audit
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    import('./Quest/MarbleRun/lab/fitPreview').then((m) => {
      const preview = m.fitPreviewParam();
      if (preview === 'classic-game') {
        const { ids, objs } = m.previewQuestions();
        questionObjRef.current = objs;
        setQuestionIds(ids);
        setMode('classic');
        setActiveTab('game');
        setGameState('started');
      } else if (preview === 'classic-finish') {
        scoreArrayRef.current = m.PREVIEW_SCORES;
        setMode('classic');
        setActiveTab('game');
        setGameState('finished');
      } else if (preview === 'quest-result') {
        setMode('quest');
        setActiveTab('quest');
      }
    });
  }, []);
  const onUpdateGrammarLoadingStatus = useHomeContext(
    (v) => v.actions.onUpdateGrammarLoadingStatus
  );
  const onUpdateGrammarGenerationProgress = useHomeContext(
    (v) => v.actions.onUpdateGrammarGenerationProgress
  );
  const isOnStreak = useMemo(() => {
    const scoreArray = questionIds
      ?.map((id) => questionObjRef.current?.[id]?.score)
      .filter((score) => !!score);
    scoreArrayRef.current = scoreArray;
    if (!scoreArray || scoreArray.length < 2) return false;
    for (const score of scoreArray) {
      if (score !== 'S') {
        return false;
      }
    }
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIds, triggerEffect]);

  // Hands Zero and Ciel which Grammarbles screen is open and the grades of a
  // finished round; the question in play and the review list are published
  // by their own screens, and no answer key is ever included here.
  useAgentScreenState('grammarbles', {
    tab: gameState === 'started' ? 'game' : activeTab,
    gameState,
    loading: gameLoading,
    timesPlayedToday,
    onStreak: gameState === 'started' ? isOnStreak : false,
    finishedGrades:
      activeTab === 'game' && gameState === 'finished'
        ? (scoreArrayRef.current || []).slice(0, 30)
        : null
  });

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (gameState === 'started') {
        e.preventDefault();
        const message =
          'You will lose your progress if you leave. Are you sure?';
        return message;
      }
    }

    // Back during a round: this is a page now, so Back would leave it.
    // A round holds one extra history entry; Back spends it and asks first.
    function handlePopState() {
      if (gameState === 'started') {
        window.history.pushState({ grammarblesRound: true }, '');
        setShowConfirm(true);
      }
    }
    if (gameState === 'started' && !window.history.state?.grammarblesRound) {
      window.history.pushState({ grammarblesRound: true }, '');
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [gameState]);

  function handleHide() {
    if (gameState === 'started') {
      setShowConfirm(true);
    } else {
      // Loading questions starts no attempt, so there is nothing to cancel.
      onUpdateGrammarLoadingStatus('');
      onUpdateGrammarGenerationProgress(null);
      onHide();
    }
  }

  async function handleConfirmClose() {
    setShowConfirm(false);
    const closeAction = resolveGrammarCloseAction({
      uploadInFlight: uploadInFlightRef.current,
      hasUnsavedResult: !!unsavedResultRef.current,
      startedAttemptNumber: startedAttemptNumberRef.current,
      answeredCount: countAnsweredGrammarQuestions(
        questionIds,
        questionObjRef.current
      )
    });
    if (closeAction.type === 'resend' && unsavedResultRef.current) {
      // A finished round is never cancelled; one more try to save it.
      finishGrammarSession(unsavedResultRef.current).catch(() => {});
    } else if (closeAction.type === 'cancel') {
      try {
        await cancelGrammarGame({
          attemptNumber: closeAction.attemptNumber,
          answeredCount: closeAction.answeredCount
        });
      } catch {
        // ignore
      }
    }
    onUpdateGrammarLoadingStatus('');
    onUpdateGrammarGenerationProgress(null);
    onHide();
  }

  function getCloseWarning() {
    if (saveFailed) {
      return "Your result isn't saved yet. If you close now, we'll try to save it one more time.";
    }
    if (unsavedResultRef.current) {
      return "Your result is still being saved. Closing now won't stop it.";
    }
    if (!countAnsweredGrammarQuestions(questionIds, questionObjRef.current)) {
      return "You haven't answered any questions yet, so closing now won't count against you.";
    }
    return hasUnlockedDailyTask
      ? "If you close now, this level will count as failed for today and you'll miss out on 1,000 coins."
      : "If you close now, this level will count as failed for today, you'll miss out on 1,000 coins, and you might not be able to complete today's Grammarbles daily task.";
  }

  // Grammarbles is its own page (Mikey 10-07: more room than a modal).
  // A Classic round in progress takes the whole screen, as the modal did, so
  // the site's links can't pull the player out mid-level.
  const look: NavLook =
    gameState === 'started' || mode === 'classic'
      ? 'classic'
      : mode === 'quest'
        ? 'quest'
        : 'menu';
  const tabs: NavTab[] =
    mode === 'classic'
      ? [
          { key: 'game', label: 'Game' },
          { key: 'rankings', label: 'Rankings' },
          { key: 'review', label: 'Review' }
        ]
      : mode === 'quest'
        ? [
            { key: 'quest', label: 'Map' },
            { key: 'questRankings', label: 'Rankings' }
          ]
        : [];
  // Grammarbles is its own page (Mikey 10-07: more room than a modal), and
  // the page IS the game: its look fills the screen edge to edge, with a top
  // bar drawn in the same style. A Classic round in progress takes the whole
  // screen, as the modal did, so the site's links can't pull the player out
  // mid-level.
  // every screen is one screen, no page scroll (Mikey 10-07: every screen
  // fits, on every device); long lists scroll inside their own panel
  const fitScreen = gameState !== 'started';
  const body = (
    <div className={cx(pageInnerCls, fitScreen && fitInnerCls)}>
      {gameState !== 'started' && (
        <GameNav
          look={look}
          tabs={tabs}
          active={activeTab}
          onTab={(key) => pickTab(() => setActiveTab(key as any))}
          onHome={handleHide}
          onGames={
            mode !== 'choose'
              ? () => pickTab(() => setMode('choose'))
              : undefined
          }
          slot={setNavSlot}
        />
      )}
      <NavSlotContext.Provider value={navSlot}>
        <ErrorBoundary componentPath="Earn/GrammarGameModal/GameState">
          {mode === 'choose' && gameState !== 'started' && (
            <ModeChooser
              onPick={(picked) => {
                setMode(picked);
                setActiveTab(picked === 'quest' ? 'quest' : 'game');
              }}
            />
          )}
          {/* Classic's game tab (start, play, finish) sits on the neon
              arcade backdrop; only paint, the screens inside are unchanged */}
          {((mode === 'classic' && activeTab === 'game') ||
            gameState === 'started') && (
            <div className={classicBodyCls}>
              {mode === 'classic' &&
                activeTab === 'game' &&
                gameState === 'notStarted' && (
                  <StartScreen
                    loading={gameLoading}
                    timesPlayedToday={timesPlayedToday}
                    onGameStart={handleGameStart}
                    onSetTimesPlayedToday={setTimesPlayedToday}
                    onHide={handleHide}
                    readyToBegin={questionsReady}
                    onSetDailyTaskUnlocked={setHasUnlockedDailyTask}
                  />
                )}
              {gameState === 'started' && (
                <Game
                  currentIndex={currentIndex}
                  isOnStreak={isOnStreak}
                  questionIds={questionIds}
                  questionObjRef={questionObjRef}
                  onCheckAnswer={handleCheckAnswer}
                  onSessionLost={handleSessionLost}
                  onSetTriggerEffect={setTriggerEffect}
                  onSetCurrentIndex={setCurrentIndex}
                  onSetQuestionObj={(newState: Record<number, any>) => {
                    questionObjRef.current = newState;
                  }}
                  onGameFinish={handleGameFinish}
                  triggerEffect={triggerEffect}
                />
              )}
              {gameState === 'started' && saveFailed && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: '2rem',
                    fontSize: '1.7rem',
                    textAlign: 'center'
                  }}
                >
                  <b>{`Couldn't save your result`}</b>
                  <div style={{ marginTop: '0.5rem', fontSize: '1.5rem' }}>
                    Check your connection and try again.
                  </div>
                  <Button
                    style={{ marginTop: '1.5rem' }}
                    variant="soft"
                    tone="raised"
                    color="logoBlue"
                    loading={retryingSave}
                    onClick={handleRetrySave}
                  >
                    Retry
                  </Button>
                </div>
              )}
              {mode === 'classic' &&
                activeTab === 'game' &&
                gameState === 'finished' && (
                  <FinishScreen
                    timesPlayedToday={timesPlayedToday}
                    scoreArrayRef={scoreArrayRef}
                    onBackToStart={handleBackToStart}
                  />
                )}
            </div>
          )}
          {mode === 'quest' && activeTab === 'quest' && (
            <Suspense fallback={<Loading />}>
              <GrammarQuest />
            </Suspense>
          )}
          {mode === 'quest' && activeTab === 'questRankings' && (
            <div className={fillCls}>
              <Rankings
                quest
                onSetRankingsTab={setRankingsTab}
                rankingsTab={rankingsTab}
              />
            </div>
          )}
          {mode === 'classic' &&
            activeTab === 'rankings' &&
            gameState !== 'started' && (
              <div className={fillCls}>
                <Rankings
                  onSetRankingsTab={setRankingsTab}
                  rankingsTab={rankingsTab}
                />
              </div>
            )}
          {mode === 'classic' &&
            activeTab === 'review' &&
            gameState !== 'started' && (
              <div className={fillCls}>
                <Review />
              </div>
            )}
        </ErrorBoundary>
      </NavSlotContext.Provider>
      {showConfirm && (
        <ConfirmModal
          portalTarget={fixedPage(page)}
          onHide={() => setShowConfirm(false)}
          title="Warning"
          description={getCloseWarning()}
          descriptionFontSize="2rem"
          onConfirm={handleConfirmClose}
          confirmButtonColor="red"
          confirmButtonLabel="Close anyway"
          isReverseButtonOrder
        />
      )}
    </div>
  );
  return (
    <div
      className={cx(
        pageCls,
        fitScreen && fitCls,
        look === 'quest' && questBgCls,
        look === 'menu' && menuBgCls,
        gameState === 'started' && focusCls
      )}
      // an XP activity: the website agent never plays it for the member
      data-agent-no-play=""
      ref={setPage}
    >
      <GamePageContext.Provider value={page}>
        {look === 'classic' ? (
          <ClassicArcade fullBleed>{body}</ClassicArcade>
        ) : (
          body
        )}
      </GamePageContext.Provider>
    </div>
  );

  // the tabs click like the game's own buttons
  function pickTab(go: () => void) {
    if (!isQuestMuted()) playQuestSound('select');
    go();
  }

  async function handleGameStart() {
    try {
      setGameLoading(true);
      setQuestionsReady(false);
      startedAttemptNumberRef.current = null;
      sessionIdRef.current = null;
      clickIdRef.current = 0;
      unsavedResultRef.current = null;
      setSaveFailed(false);
      onUpdateGrammarGenerationProgress(null);
      onUpdateGrammarLoadingStatus('loading...');
      const {
        sessionId,
        attemptNumber,
        totalQuestions,
        question,
        maxAttemptNumberReached,
        alreadyFailedToday
      } = (await startGrammarSession()) || ({} as any);

      if (maxAttemptNumberReached || alreadyFailedToday) {
        onUpdateGrammarLoadingStatus?.(
          'daily limit reached. come back tomorrow!'
        );
        setQuestionsReady(false);
        setGameState('notStarted');
        onUpdateGrammarGenerationProgress(null);
        return;
      }
      const questionCount = Number(totalQuestions) || 0;
      if (!sessionId || !question || !questionCount) {
        onUpdateGrammarLoadingStatus('');
        onUpdateGrammarGenerationProgress(null);
        return;
      }
      sessionIdRef.current = sessionId;
      attemptNumberRef.current = attemptNumber || timesPlayedToday + 1;
      if (attemptNumber) {
        startedAttemptNumberRef.current = attemptNumber;
      }
      // One slot per question; each is filled when the server hands it out
      // (the first now, the next one with each right answer).
      const questionObj: Record<number, any> = {};
      for (let index = 0; index < questionCount; index++) {
        questionObj[index] = { selectedChoiceIndex: null };
      }
      questionObj[0] = {
        question: question.question,
        choices: question.choices,
        selectedChoiceIndex: null
      };
      questionObjRef.current = questionObj;
      setQuestionIds([...Array(questionCount).keys()]);
      setGameState('started');
      onUpdateGrammarLoadingStatus('');
      onUpdateGrammarGenerationProgress(null);
    } catch (error) {
      console.error('An error occurred:', error);
      onUpdateGrammarLoadingStatus?.('');
      onUpdateGrammarGenerationProgress?.(null);
    } finally {
      setGameLoading(false);
      setQuestionsReady(true);
    }
  }

  function handleBackToStart() {
    setQuestionsReady(false);
    setQuestionIds([]);
    setCurrentIndex(0);
    questionObjRef.current = {};
    onUpdateGrammarLoadingStatus?.('');
    setGameState('notStarted');
  }

  async function handleCheckAnswer({
    questionIndex,
    choiceIndex,
    elapsedMs
  }: Parameters<GrammarAnswerCheck>[0]) {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return { type: 'sessionClosed' as const };
    clickIdRef.current += 1;
    const clickId = clickIdRef.current;
    return checkGrammarAnswerWithRetry({
      send: () =>
        checkGrammarAnswer({
          sessionId,
          questionIndex,
          choiceIndex,
          clickId,
          elapsedMs
        })
    });
  }

  // The server closed this round (it was reopened elsewhere, or quit). Back
  // to the start screen, which shows what is still playable today.
  function handleSessionLost() {
    sessionIdRef.current = null;
    startedAttemptNumberRef.current = null;
    setQuestionsReady(false);
    setQuestionIds([]);
    setCurrentIndex(0);
    questionObjRef.current = {};
    setGameState('notStarted');
    onUpdateGrammarLoadingStatus?.('this round ended. please start again.');
  }

  async function handleGameFinish() {
    let retries = 0;
    const maxRetries = 3;
    const questionCount = questionIds.length;

    await new Promise((resolve) => setTimeout(resolve, 100));

    while (
      scoreArrayRef.current.length !== questionCount &&
      retries < maxRetries
    ) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      retries++;
    }
    if (scoreArrayRef.current.length !== questionCount) return;
    if (!sessionIdRef.current) return;
    await submitGrammarResult(
      { sessionId: sessionIdRef.current },
      // Minimum time the result screen (e.g. PERFECT) stays up before
      // advancing, so the celebration is visible without dragging. The
      // upload runs in parallel; the screen shows for max(upload, this).
      RESULT_SCREEN_MIN_DISPLAY_MS
    );
  }

  async function handleRetrySave() {
    if (!unsavedResultRef.current || uploadInFlightRef.current) return;
    setRetryingSave(true);
    await submitGrammarResult(unsavedResultRef.current, 0);
    setRetryingSave(false);
  }

  // Finishes a graded round, retrying a few times. A POST is never retried
  // by the request layer, and resending is safe: the server answers
  // isDuplicate once the round has been paid. If every try fails, the payload
  // is kept for the Retry button (or one more try on close) instead of
  // leaving the round stuck, where closing used to cancel it as a blank fail.
  async function submitGrammarResult(
    payload: GrammarResultPayload,
    minDisplayMs: number
  ) {
    const maxRetries = 3;
    const cooldown = 1000;
    uploadInFlightRef.current = true;
    unsavedResultRef.current = payload;
    const minDisplay = new Promise<void>((resolve) =>
      setTimeout(resolve, minDisplayMs)
    );
    try {
      for (let retries = 0; retries < maxRetries; retries++) {
        try {
          const { dailyTaskStatus, isDuplicate, newXp, newCoins, scoreArray } =
            await finishGrammarSession(payload);
          unsavedResultRef.current = null;
          if (
            Array.isArray(scoreArray) &&
            scoreArray.length === scoreArrayRef.current.length
          ) {
            // The server's grades are the result; they match what was shown.
            scoreArrayRef.current = scoreArray;
          }
          if (!isDuplicate) {
            const newState: { twinkleXP?: number; twinkleCoins?: number } = {
              twinkleXP: newXp
            };
            if (newCoins) {
              newState.twinkleCoins = newCoins;
            }
            onSetUserState({
              userId,
              newState
            });
            if (dailyTaskStatus) {
              onApplyTodayStatsProgress({
                newStats:
                  buildTodayStatsPatchFromDailyTaskStatus(dailyTaskStatus)
              });
            }
          }
          await minDisplay;
          setSaveFailed(false);
          setCurrentIndex(0);
          setGameState('finished');
          return;
        } catch (error) {
          console.error(
            `An error occurred: ${error}. Retry ${retries + 1} of ${maxRetries}`
          );
          if (retries + 1 < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, cooldown));
          }
        }
      }
      console.error(`Failed after maximum (${maxRetries}) retries`);
      await minDisplay;
      setSaveFailed(true);
    } finally {
      uploadInFlightRef.current = false;
    }
  }
}

const pageCls = css`
  width: 100%;
  min-height: calc(100vh - ${APP_SHELL_HEADER_OFFSET_STYLE});
  display: flex;
  flex-direction: column;
  @media (max-width: ${mobileMaxWidth}) {
    padding-bottom: 6rem;
  }
`;
// Quest: the map's own sky, edge to edge
const questBgCls = css`
  background:
    radial-gradient(
      ellipse at 18% 4%,
      rgba(255, 255, 255, 0.75) 0,
      rgba(255, 255, 255, 0) 30%
    ),
    linear-gradient(180deg, #a9dcff 0%, #d9f0ff 40%, #f7ecc9 100%);
`;
// the game menu: a night arcade between the two covers
const menuBgCls = css`
  background:
    radial-gradient(
      ellipse 80% 50% at 50% 0%,
      rgba(120, 90, 255, 0.35) 0,
      rgba(0, 0, 0, 0) 70%
    ),
    linear-gradient(180deg, #120e30 0%, #1d1650 55%, #2a1557 100%);
`;
// a Classic round in progress: the whole screen, over the site's header
const focusCls = css`
  position: fixed;
  inset: 0;
  z-index: 2147481000;
  min-height: 0;
  overflow-y: auto;
  background: #070b2e;
`;
const pageInnerCls = css`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.6rem 3rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 0 2rem;
  }
`;
const fitCls = css`
  height: calc(100dvh - ${APP_SHELL_HEADER_OFFSET_STYLE});
  min-height: 0;
  overflow: hidden;
  @media (max-width: ${mobileMaxWidth}) {
    /* phones: the header sits on top, the nav bar at the bottom */
    height: calc(
      100dvh - ${APP_SHELL_HEADER_OFFSET_STYLE} - ${MOBILE_NAV_FOOTPRINT_STYLE}
    );
    padding-bottom: 0;
  }
  /* phones on their side: the whole screen, over the site's bars (Mikey
     10-07); the game's own Home button leads out */
  @media (max-height: 520px) and (orientation: landscape) {
    position: fixed;
    inset: 0;
    z-index: 2147481000;
    height: 100dvh;
  }
`;
const fitInnerCls = css`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-bottom: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding-bottom: 0.4rem;
  }
`;
// a tab's screen fills the space under the top bar
const fillCls = css`
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 0.6rem;
  }
`;
const classicBodyCls = css`
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
`;
