import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
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
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const { wordleStrictMode: isStrictMode } = useKeyContext((v) => v.myState);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const { nextDayTimeStamp, timeDifference } = useNotiContext(
    (v) => v.state.todayStats
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

  return (
    <ErrorBoundary componentPath="Chat/Modals/WordleModal">
      <Modal closeWhenClickedOutside={false} onHide={onHide}>
        <header style={{ padding: 0 }}>
          <FilterBar
            style={{
              marginTop: '3rem',
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
        </header>
        <main
          style={{
            padding: 0,
            marginTop: 0,
            justifyContent: 'flex-start'
          }}
        >
          {activeTab === 'game' ? (
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
            />
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
        </main>
        <footer>
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
              <Button
                color={doneColor}
                onClick={() => setOverviewModalShown(true)}
              >
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
              <p style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                Next Wordle
              </p>
              <Countdown
                key={nextDayTimeStamp}
                className={css`
                  font-size: 1.3rem;
                `}
                date={nextDayTimeStamp}
                now={() => {
                  const now = Date.now() + timeDifference;
                  return now;
                }}
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
              <Button transparent onClick={onHide}>
                Close
              </Button>
            </div>
          </div>
        </footer>
      </Modal>
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
