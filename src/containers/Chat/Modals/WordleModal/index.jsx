import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Game from './Game';
import OverviewModal from './OverviewModal';
import Countdown from 'react-countdown';
import FilterBar from '~/components/FilterBar';
import Streaks from './Streaks';
import Rankings from './Rankings';
import { css } from '@emotion/css';
import { MAX_GUESSES } from './constants/settings';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

WordleModal.propTypes = {
  attemptState: PropTypes.object,
  channelId: PropTypes.number,
  channelName: PropTypes.string,
  guesses: PropTypes.array,
  nextDayTimeStamp: PropTypes.number,
  solution: PropTypes.string,
  wordLevel: PropTypes.number,
  wordleStats: PropTypes.object,
  onHide: PropTypes.func.isRequired,
  socketConnected: PropTypes.bool,
  theme: PropTypes.string
};

export default function WordleModal({
  channelId,
  channelName,
  attemptState,
  nextDayTimeStamp,
  guesses = [],
  solution = '',
  wordLevel,
  wordleStats,
  onHide,
  socketConnected,
  theme
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [activeTab, setActiveTab] = useState('game');
  const [rankingsTab, setRankingsTab] = useState('all');
  const [streaksTab, setStreaksTab] = useState('win');
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
    init();
    async function init() {
      const currentNextDayTimeStamp = await getCurrentNextDayTimeStamp();
      if (nextDayTimeStamp && nextDayTimeStamp !== currentNextDayTimeStamp) {
        handleCountdownComplete();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal closeWhenClickedOutside={false} onHide={onHide}>
      <header style={{ padding: 0 }}>
        <FilterBar
          style={{
            marginTop: '3rem',
            height: '5rem'
          }}
        >
          <nav
            className={activeTab === 'game' ? 'active' : null}
            onClick={() => setActiveTab('game')}
          >
            Wordle
          </nav>
          <nav
            className={activeTab === 'rankings' ? 'active' : null}
            onClick={() => setActiveTab('rankings')}
          >
            Top Scorers
          </nav>
          <nav
            className={activeTab === 'streaks' ? 'active' : null}
            onClick={() => setActiveTab('streaks')}
          >
            Top Streaks
          </nav>
        </FilterBar>
      </header>
      <main
        style={{
          padding: 0,
          marginTop: 0
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
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <Button
              color={doneColor}
              onClick={() => setOverviewModalShown(true)}
              isGameWon={isGameWon}
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
              daysInHours={true}
              onComplete={handleCountdownComplete}
            />
          </div>
          <div
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <Button transparent onClick={onHide}>
              Close
            </Button>
          </div>
        </div>
      </footer>
    </Modal>
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
        nextDayTimeStamp: newNextDayTimeStamp,
        wordleGuesses: []
      }
    });
  }
}
