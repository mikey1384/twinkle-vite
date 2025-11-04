import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import NewModal from '~/components/NewModal';
import Button from '~/components/Button';
import Game from './Game';
import OverviewModal from './OverviewModal';
import Countdown from 'react-countdown';
import FilterBar from '~/components/FilterBar';
import Streaks from './Streaks';
import Rankings from './Rankings';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { MAX_GUESSES } from './constants/settings';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';

export default function WordleModal({
  channelId,
  channelName,
  attemptState,
  guesses = [],
  solution = '',
  wordLevel,
  wordleStats,
  onHide,
  socketConnected,
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
  socketConnected: boolean;
  theme: string;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const isStrictMode = useKeyContext((v) => v.myState.wordleStrictMode);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const nextDayTimeStamp = useNotiContext(
    (v) => v.state.todayStats.nextDayTimeStamp
  );
  const timeDifference = useNotiContext(
    (v) => v.state.todayStats.timeDifference
  );
  const [activeTab, setActiveTab] = useState('game');
  const [rankingsTab, setRankingsTab] = useState('all');
  const [streaksTab, setStreaksTab] = useState(isStrictMode ? 'double' : 'win');
  const loadWordle = useAppContext((v) => v.requestHelpers.loadWordle);
  const getCurrentNextDayTimeStamp = useAppContext(
    (v) => v.requestHelpers.getCurrentNextDayTimeStamp
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const [isRevealing, setIsRevealing] = useState(false);
  const [overviewModalShown, setOverviewModalShown] = useState(false);
  const [uiScale, setUiScale] = useState(1);
  const uiScaleRef = useRef(1);
  const baseGameHeightRef = useRef(0);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const filterBarRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    setStreaksTab(isStrictMode ? 'double' : 'win');
  }, [isStrictMode]);

  useEffect(() => {
    init();
    async function init() {
      const currentNextDayTimeStamp = await getCurrentNextDayTimeStamp();
      if (nextDayTimeStamp && nextDayTimeStamp !== currentNextDayTimeStamp) {
        handleCountdownComplete();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextDayTimeStamp]);

  const now = useCallback(() => {
    return Date.now() + timeDifference;
  }, [timeDifference]);

  useEffect(() => {
    if (activeTab !== 'game') return;

    function computeScale() {
      const bodyEl = bodyRef.current;
      const filterEl = filterBarRef.current;
      const gameEl = gameRef.current;
      if (!bodyEl || !filterEl || !gameEl) return;

      // Derive available vertical space using viewport height (accounts for orientation & keyboards)
      const visualViewport = (window as any).visualViewport;
      const viewportHeight = visualViewport?.height || window.innerHeight;
      const estimatedModalMax = Math.floor(viewportHeight * 0.95);
      // Small fudge margin for modal inner chrome
      const chromeMargin = 24;
      const availableHeight = Math.max(
        0,
        estimatedModalMax - filterEl.offsetHeight - chromeMargin
      );

      const currentScale = uiScaleRef.current || 1;
      const measuredGameHeight = gameEl.scrollHeight; // current scaled height
      const baseCandidate = measuredGameHeight / currentScale || 1;

      // Track max base to allow scaling back up cleanly
      if (
        !baseGameHeightRef.current ||
        baseCandidate > baseGameHeightRef.current + 1
      ) {
        baseGameHeightRef.current = baseCandidate;
      }

      const baseGameHeight = baseGameHeightRef.current || baseCandidate;
      const rawScale = availableHeight / baseGameHeight;
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
  }, [activeTab]);

  const footer = (
    <div
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr'
      }}
    >
      <div
        style={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Button color={doneColor} onClick={() => setOverviewModalShown(true)}>
          Show {isGameOver ? 'Overview' : 'Stats'}
        </Button>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        <p style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>Next Wordle</p>
        <Countdown
          key={nextDayTimeStamp}
          className={css`
            font-size: 1.3rem;
          `}
          date={nextDayTimeStamp}
          now={now}
          daysInHours={true}
          onComplete={handleCountdownComplete}
        />
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Button variant="ghost" onClick={onHide}>
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary componentPath="Chat/Modals/WordleModal">
      <NewModal
        isOpen={true}
        onClose={onHide}
        hasHeader={false}
        closeOnBackdropClick={false}
        size="lg"
        modalLevel={0}
        footer={footer}
        bodyPadding={0}
      >
        <div
          ref={bodyRef}
          style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
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
                  isRevealing={isRevealing}
                  onSetIsRevealing={setIsRevealing}
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
                  socketConnected={socketConnected}
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
        {overviewModalShown && (
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
      </NewModal>
    </ErrorBoundary>
  );

  async function handleCountdownComplete() {
    const {
      wordleSolution,
      wordleWordLevel,
      nextDayTimeStamp: newNextDayTimeStamp
    } = await loadWordle(channelId);
    onSetChannelState({
      channelId,
      newState: {
        attemptState: {
          isStrict: false,
          xpRewardAmount: null
        },
        wordleSolution,
        wordleWordLevel,
        wordleGuesses: []
      }
    });
    onUpdateTodayStats({
      newStats: {
        nextDayTimeStamp: newNextDayTimeStamp
      }
    });
  }
}
