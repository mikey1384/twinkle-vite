import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Game from './Game';
import OverviewModal from './OverviewModal';
import SkipShieldModal from './SkipShieldModal';
import type { SkipShieldChecklistState } from './SkipShieldChecklist';
import LumineRescueEntry from '~/components/LumineRescueEntry';
import NextDayCountdown from '~/components/NextDayCountdown';
import FilterBar from '~/components/FilterBar';
import Streaks from './Streaks';
import Rankings from './Rankings';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import Banner from '~/components/Banner';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { MAX_GUESSES } from './constants/settings';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { buildTodayStatsPatchFromDailyTaskStatus } from '~/helpers';
import {
  normalizeSkipShieldStatus,
  shouldBlockWordleClose
} from './skipShieldStatus';
import { fetchCanonicalWordleState } from './wordleCanonicalState';

const WORDLE_MODAL_BODY_MIN_HEIGHT =
  'clamp(18rem, calc(100dvh - 16rem), 55rem)';

export default function WordleModal({
  channelId,
  channelName,
  attemptState,
  guesses = [],
  solution = '',
  wordLevel,
  wordleStats,
  onHide,
  theme
}: {
  attemptState: any;
  channelId: number;
  channelName?: string;
  guesses: string[];
  solution: string;
  wordLevel: number;
  wordleStats: any;
  onHide: () => void;
  theme: string;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const isStrictMode = useKeyContext((v) => v.myState.wordleStrictMode);
  const onApplyTodayStatsProgress = useNotiContext(
    (v) => v.actions.onApplyTodayStatsProgress
  );
  const nextDayTimeStamp = useNotiContext(
    (v) => v.state.todayStats.nextDayTimeStamp
  );
  const [activeTab, setActiveTab] = useState('game');
  const [rankingsTab, setRankingsTab] = useState('all');
  const [streaksTab, setStreaksTab] = useState(isStrictMode ? 'double' : 'win');
  const loadWordle = useAppContext((v) => v.requestHelpers.loadWordle);
  const loadWordleSkipShield = useAppContext(
    (v) => v.requestHelpers.loadWordleSkipShield
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const [isRevealing, setIsRevealing] = useState(false);
  const [wordleSubmissionPending, setWordleSubmissionPending] = useState(false);
  const [wordleSnapshotStatus, setWordleSnapshotStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading');
  const [overviewModalShown, setOverviewModalShown] = useState(false);
  const [skipShieldModalShown, setSkipShieldModalShown] = useState(false);
  const [skipShieldChecklist, setSkipShieldChecklist] =
    useState<SkipShieldChecklistState | null>(null);
  const skipShieldRequestInFlightRef = useRef(false);
  const skipShieldStatusRequestSequenceRef = useRef(0);
  const wordleStateRequestSequenceRef = useRef(0);
  const [uiScale, setUiScale] = useState(1);
  const uiScaleRef = useRef(1);
  const basePlayAreaHeightRef = useRef(0);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const filterBarRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<HTMLDivElement | null>(null);
  const playAreaRef = useRef<HTMLDivElement | null>(null);
  const isGameWon = useMemo(
    () => guesses.includes(solution),
    [guesses, solution]
  );
  const isGameLost = useMemo(
    () => !isGameWon && guesses.length === MAX_GUESSES,
    [guesses.length, isGameWon]
  );
  const isGameOver = useMemo(
    () => isGameWon || isGameLost,
    [isGameLost, isGameWon]
  );

  // This identity is shared by focus/visibility listeners and the close gate;
  // keeping it stable avoids tearing those listeners down on every render.
  const refreshSkipShieldStatus = useCallback(async () => {
    const requestSequence = ++skipShieldStatusRequestSequenceRef.current;
    const status = await loadWordleSkipShield(channelId);
    if (!status) return null;
    const normalizedStatus = normalizeSkipShieldStatus(status);
    if (!normalizedStatus) return null;
    // Focus/visibility and an explicit close can overlap. An older response is
    // not authoritative once a newer writer read has started, and must not be
    // allowed to drive the close gate even if it happens to arrive last.
    if (requestSequence !== skipShieldStatusRequestSequenceRef.current) {
      return null;
    }
    setSkipShieldChecklist(normalizedStatus.checklist);
    return normalizedStatus;
    // Context request helpers have stable identities by contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useEffect(() => {
    setStreaksTab(isStrictMode ? 'double' : 'win');
  }, [isStrictMode]);

  useEffect(() => {
    if (
      wordleSnapshotStatus !== 'ready' ||
      guesses.length === 0 ||
      isGameOver
    ) {
      skipShieldStatusRequestSequenceRef.current += 1;
      setSkipShieldChecklist(null);
      setSkipShieldModalShown(false);
      return;
    }

    void refreshSkipShieldStatus().catch(console.error);
    const handleFocus = () =>
      void refreshSkipShieldStatus().catch(console.error);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshSkipShieldStatus().catch(console.error);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    guesses.length,
    isGameOver,
    refreshSkipShieldStatus,
    wordleSnapshotStatus
  ]);

  useEffect(() => {
    // Global Today Stats and the General-channel Wordle payload are separate
    // server snapshots. A daily rollover can refresh the former while the
    // latter remains cached, so every modal open must cross the canonical
    // Wordle boundary before the board becomes interactive.
    void refreshCanonicalWordleState();
    return () => {
      wordleStateRequestSequenceRef.current += 1;
    };
    // Context request/action helpers have stable identities by contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useEffect(() => {
    if (activeTab !== 'game' || wordleSnapshotStatus !== 'ready') return;

    function computeScale() {
      const bodyEl = bodyRef.current;
      const filterEl = filterBarRef.current;
      const gameEl = gameRef.current;
      const playAreaEl = playAreaRef.current;
      if (!bodyEl || !filterEl || !gameEl || !playAreaEl) return;

      // The Modal body is already the exact space left after its footer and
      // viewport constraints, so measure that boundary directly.
      const availableHeight = Math.max(
        0,
        bodyEl.clientHeight - filterEl.offsetHeight
      );

      const currentScale = uiScaleRef.current || 1;
      const measuredGameHeight = gameEl.scrollHeight;
      const playAreaStyle = window.getComputedStyle(playAreaEl);
      const measuredPlayAreaHeight =
        playAreaEl.scrollHeight +
        (Number.parseFloat(playAreaStyle.marginTop) || 0) +
        (Number.parseFloat(playAreaStyle.marginBottom) || 0);
      const fixedHeight = Math.max(
        0,
        measuredGameHeight - measuredPlayAreaHeight
      );
      const baseCandidate = measuredPlayAreaHeight / currentScale || 1;

      if (
        !basePlayAreaHeightRef.current ||
        baseCandidate > basePlayAreaHeightRef.current + 1
      ) {
        basePlayAreaHeightRef.current = baseCandidate;
      }

      const basePlayAreaHeight = basePlayAreaHeightRef.current || baseCandidate;
      const rawScale = (availableHeight - fixedHeight) / basePlayAreaHeight;
      const nextScale = Math.max(0.5, Math.min(1, rawScale));
      if (Math.abs(nextScale - currentScale) > 0.02) {
        uiScaleRef.current = nextScale;
        setUiScale(nextScale);
      }
    }

    const ro = new ResizeObserver(() => computeScale());
    if (bodyRef.current) ro.observe(bodyRef.current);
    if (filterBarRef.current) ro.observe(filterBarRef.current);
    if (gameRef.current) ro.observe(gameRef.current);
    if (playAreaRef.current) ro.observe(playAreaRef.current);

    window.addEventListener('resize', computeScale);
    const vv = (window as any).visualViewport;
    vv?.addEventListener?.('resize', computeScale);
    window.addEventListener('orientationchange', computeScale);
    computeScale();

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', computeScale);
      vv?.removeEventListener?.('resize', computeScale);
      window.removeEventListener('orientationchange', computeScale);
    };
  }, [activeTab, wordleSnapshotStatus]);

  const readyFooter = (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.7rem'
      }}
    >
      <LumineRescueEntry
        eventType="wordle"
        active={
          (Number(wordleStats?.currentStreak || 0) === 0 &&
            Number(wordleStats?.bestStreak || 0) > 0) ||
          wordleStats?.lumineRescueEventType === 'wordle'
        }
        params={{ channelId }}
        onRedeemed={handleWordleRescueRedeemed}
        style={{ maxWidth: '36rem' }}
      />
      <LumineRescueEntry
        eventType="wordleStrict"
        active={
          (Number(wordleStats?.currentStreak || 0) > 0 &&
            Number(wordleStats?.currentStrictStreak || 0) === 0 &&
            Number(wordleStats?.bestStrictStreak || 0) > 0) ||
          wordleStats?.lumineRescueEventType === 'wordleStrict'
        }
        params={{ channelId }}
        onRedeemed={handleWordleRescueRedeemed}
        style={{ maxWidth: '36rem' }}
      />
      <div
        className={css`
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.8rem;
        `}
      >
        <Button
          variant="soft"
          color={doneColor}
          onClick={() => setOverviewModalShown(true)}
        >
          {isGameOver ? 'Overview' : 'Stats'}
        </Button>
        <div
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.45rem 1rem;
            border-radius: 999px;
            background: ${Color.logoBlue(0.08)};
            border: 1px solid ${Color.logoBlue(0.25)};
            color: ${Color.logoBlue()};
            font-weight: 700;
            font-size: 1.2rem;
            white-space: nowrap;
          `}
          title="Time until the next Wordle"
        >
          <Icon icon="clock" style={{ fontSize: '1.1rem' }} />
          <span
            className={css`
              @media (max-width: ${mobileMaxWidth}) {
                display: none;
              }
            `}
          >
            Next Wordle
          </span>
          <NextDayCountdown
            inline
            onComplete={refreshCanonicalWordleState}
            timerClassName={css`
              font-variant-numeric: tabular-nums;
            `}
          />
        </div>
        <Button
          variant="ghost"
          disabled={wordleSubmissionPending}
          onClick={handleRequestClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
  const footer =
    wordleSnapshotStatus === 'ready' ? readyFooter : (
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <Button variant="ghost" onClick={onHide}>
          Close
        </Button>
      </div>
    );

  return (
    <ErrorBoundary componentPath="Chat/Modals/WordleModal">
      <Modal
        modalKey="WordleModal"
        isOpen={true}
        onClose={handleRequestClose}
        hasHeader={false}
        closeOnBackdropClick={false}
        size="lg"
        modalLevel={0}
        footer={footer}
        bodyPadding={0}
      >
        {wordleSnapshotStatus === 'loading' ? (
          <Loading
            text="Loading today's Wordle..."
            style={{ minHeight: WORDLE_MODAL_BODY_MIN_HEIGHT }}
            theme={theme}
          />
        ) : wordleSnapshotStatus === 'error' ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              minHeight: WORDLE_MODAL_BODY_MIN_HEIGHT,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              padding: '2rem'
            }}
          >
            <Banner color="rose">Couldn't load today's Wordle.</Banner>
            <Button onClick={() => void refreshCanonicalWordleState()}>
              Try again
            </Button>
          </div>
        ) : (
          <div
            ref={bodyRef}
            style={{
              width: '100%',
              height: '100%',
              minHeight: WORDLE_MODAL_BODY_MIN_HEIGHT,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
          <div ref={filterBarRef}>
            <FilterBar
              style={{
                height: '5rem'
              }}
            >
              <nav
                className={activeTab === 'game' ? 'active' : ''}
                onClick={() => setActiveTab('game')}
              >
                Wordle
              </nav>
              <nav
                className={activeTab === 'rankings' ? 'active' : ''}
                onClick={() => setActiveTab('rankings')}
              >
                Top Scorers
              </nav>
              <nav
                className={activeTab === 'streaks' ? 'active' : ''}
                onClick={() => setActiveTab('streaks')}
              >
                Top Streaks
              </nav>
            </FilterBar>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {activeTab === 'game' ? (
              <div ref={gameRef} style={{ width: '100%' }}>
                <Game
                  attemptState={attemptState}
                  isRevealing={isRevealing}
                  onSetIsRevealing={setIsRevealing}
                  onSetSubmissionPending={setWordleSubmissionPending}
                  onRefreshCanonicalState={refreshCanonicalWordleState}
                  channelName={channelName}
                  channelId={channelId}
                  guesses={guesses}
                  isGameOver={isGameOver}
                  isGameWon={isGameWon}
                  isGameLost={isGameLost}
                  isStrictMode={!!isStrictMode}
                  nextDayTimeStamp={nextDayTimeStamp}
                  solution={solution}
                  onSetOverviewModalShown={setOverviewModalShown}
                  submissionPending={wordleSubmissionPending}
                  skipShieldChecklist={skipShieldChecklist}
                  playAreaRef={playAreaRef}
                  uiScale={uiScale}
                />
              </div>
            ) : activeTab === 'rankings' ? (
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <Rankings
                  channelId={channelId}
                  onSetRankingsTab={setRankingsTab}
                  rankingsTab={rankingsTab}
                />
              </div>
            ) : (
              <Streaks
                channelId={channelId}
                streaksTab={streaksTab}
                onSetStreaksTab={setStreaksTab}
                theme={theme}
              />
            )}
          </div>
          </div>
        )}
        {wordleSnapshotStatus === 'ready' &&
          skipShieldModalShown &&
          skipShieldChecklist && (
          <SkipShieldModal
            checklist={skipShieldChecklist}
            onKeepPlaying={() => setSkipShieldModalShown(false)}
            onCloseAnyway={() => {
              setSkipShieldModalShown(false);
              onHide();
            }}
          />
          )}
        {wordleSnapshotStatus === 'ready' && overviewModalShown && (
          <OverviewModal
            numGuesses={guesses.length}
            solution={solution}
            wordLevel={wordLevel}
            wordleStats={wordleStats}
            isGameOver={isGameOver}
            isSolved={isGameWon}
            attemptState={attemptState}
            onHide={() => setOverviewModalShown(false)}
          />
        )}
      </Modal>
    </ErrorBoundary>
  );

  async function handleRequestClose() {
    if (wordleSnapshotStatus !== 'ready') return onHide();
    if (wordleSubmissionPending) return;
    if (guesses.length === 0 || isGameOver) {
      return onHide();
    }
    if (skipShieldRequestInFlightRef.current) return;
    skipShieldRequestInFlightRef.current = true;
    // Mid-game close: the day counts as a dodge unless the skip-shield side
    // quest is done. Show the friendly checklist instead of closing silently.
    try {
      const status = await refreshSkipShieldStatus();
      // The resolver is the source of truth and may also persist a newly
      // earned cover. If it cannot confirm a result, leave the game open
      // instead of silently bypassing the warning on a network failure.
      if (!status) return;
      if (shouldBlockWordleClose(status)) {
        setSkipShieldModalShown(true);
        return;
      }
    } catch (error) {
      console.error(error);
      return;
    } finally {
      skipShieldRequestInFlightRef.current = false;
    }
    onHide();
  }

  function handleWordleRescueRedeemed(result: any) {
    if (!result?.wordleStats) return;
    onSetChannelState({
      channelId,
      newState: { wordleStats: result.wordleStats }
    });
  }

  async function refreshCanonicalWordleState() {
    const requestSequence = ++wordleStateRequestSequenceRef.current;
    setWordleSnapshotStatus('loading');
    setOverviewModalShown(false);
    setSkipShieldModalShown(false);
    skipShieldStatusRequestSequenceRef.current += 1;
    setSkipShieldChecklist(null);
    try {
      const canonicalState = await fetchCanonicalWordleState({
        channelId,
        loadWordle
      });
      if (requestSequence !== wordleStateRequestSequenceRef.current) return;
      if (canonicalState.needsReload) {
        window.location.reload();
        return;
      }
      const {
        dailyTaskStatus,
        wordleSolution,
        wordleWordLevel,
        wordleAttemptState,
        wordleGuesses,
        wordleStats: canonicalWordleStats,
        nextDayTimeStamp: newNextDayTimeStamp
      } = canonicalState;
      onSetChannelState({
        channelId,
        newState: {
          wordleAttemptState,
          wordleSolution,
          wordleWordLevel,
          wordleGuesses,
          wordleStats: canonicalWordleStats
        }
      });
      onApplyTodayStatsProgress({
        newStats: {
          ...buildTodayStatsPatchFromDailyTaskStatus(dailyTaskStatus),
          nextDayTimeStamp: newNextDayTimeStamp
        }
      });
      setWordleSnapshotStatus('ready');
    } catch (error) {
      if (requestSequence !== wordleStateRequestSequenceRef.current) return;
      console.error(error);
      setWordleSnapshotStatus('error');
    }
  }
}
