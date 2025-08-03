import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import InputPanel from './InputPanel';
import {
  CHAT_ID_BASE_NUMBER,
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID
} from '~/constants/defaultValues';
import {
  useAppContext,
  useChatContext,
  useHomeContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import DailyBonusButton from '~/components/Buttons/DailyBonusButton';
import CollectRewardsButton from '~/components/Buttons/CollectRewardsButton';
import Icon from '~/components/Icon';
import TopButton from './TopButton';
import ChessOptionsModal from './ChessOptionsModal';

export default function TopMenu({
  onInputModalButtonClick,
  onPlayAIStories,
  onPlayGrammarGame,
  style
}: {
  onInputModalButtonClick: (v?: string) => void;
  onPlayAIStories: () => void;
  onPlayGrammarGame: () => void;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const timerIdRef = useRef<any>(null);
  const chatLoadedRef = useRef(false);
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const chatLoaded = useChatContext((v) => v.state.loaded);
  const [isDailyBonusButtonShown, setIsDailyBonusButtonShown] = useState(
    !!todayStats.dailyHasBonus &&
      !todayStats.dailyBonusAttempted &&
      todayStats.dailyRewardResultViewed
  );
  useEffect(() => {
    chatLoadedRef.current = chatLoaded;
  }, [chatLoaded]);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const dailyRewardModalShown = useNotiContext(
    (v) => v.state.dailyRewardModalShown
  );
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onSetChessModalShown = useChatContext(
    (v) => v.actions.onSetChessModalShown
  );
  const onSetWordleModalShown = useChatContext(
    (v) => v.actions.onSetWordleModalShown
  );
  const onSetChessPuzzleModalShown = useHomeContext(
    (v) => v.actions.onSetChessPuzzleModalShown
  );
  const [loadingChess, setLoadingChess] = useState(false);
  const [chessModalShown, setChessModalShown] = useState(false);
  const username = useKeyContext((v) => v.myState.username);
  const userId = useKeyContext((v) => v.myState.userId);
  const isMountedRef = useRef(true);
  const [loadingWordle, setLoadingWordle] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
    };
  }, []);
  useEffect(() => {
    setIsDailyBonusButtonShown(
      !!todayStats?.dailyHasBonus &&
        !dailyRewardModalShown &&
        !todayStats?.dailyBonusAttempted &&
        !!todayStats?.dailyRewardResultViewed
    );
  }, [
    dailyRewardModalShown,
    todayStats?.dailyBonusAttempted,
    todayStats?.dailyRewardResultViewed,
    todayStats?.dailyHasBonus
  ]);
  const achievedDailyGoals = todayStats.achievedDailyGoals;
  const allGoalsAchieved = useMemo(
    () => achievedDailyGoals.length === 3,
    [achievedDailyGoals.length]
  );
  const isAchieved = useCallback(
    (goal: any) => achievedDailyGoals.includes(goal),
    [achievedDailyGoals]
  );
  const checkUnansweredChess = useAppContext(
    (v) => v.requestHelpers.checkUnansweredChess
  );

  useEffect(() => {
    handleCheckUnansweredChess();

    async function handleCheckUnansweredChess() {
      try {
        const { unansweredChessMsgChannelId } = await checkUnansweredChess();
        onUpdateTodayStats({
          newStats: { unansweredChessMsgChannelId }
        });
      } catch (error) {
        console.error('Error checking unanswered chess:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <ErrorBoundary componentPath="Home/Stories/TopMenu">
      <div
        style={{ marginBottom: '1rem', ...style }}
        className={css`
          background: #fff;
          font-size: 1.7rem;
          padding: 1rem;
          border: 1px solid ${Color.borderGray()};
          border-radius: ${borderRadius};
          p {
            font-size: 2rem;
            font-weight: bold;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.7rem;
            }
          }
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            border-top: 0;
            border-left: 0;
            border-right: 0;
          }
        `}
      >
        <p
          className={css`
            color: ${Color.darkerGray()};
          `}
        >
          Hi, {username}! What do you want to do today?
        </p>
        <InputPanel onInputModalButtonClick={onInputModalButtonClick} />
        <div
          className={css`
            margin-top: 1.5rem;
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            justify-content: space-between;
          `}
        >
          <div style={{ display: 'flex', gap: '1rem' }}>
            <ErrorBoundary componentPath="Home/Stories/TopMenu/AIStoriesButton">
              <TopButton
                key="aiStoriesButton"
                isAchieved={isAchieved('A')}
                colorLeft={Color.blue()}
                colorMiddle={Color.logoBlue()}
                colorRight={Color.blue()}
                onClick={onPlayAIStories}
              >
                A{allGoalsAchieved ? '' : '.I Stories'}
              </TopButton>
            </ErrorBoundary>
            <ErrorBoundary componentPath="Home/Stories/TopMenu/GrammarGameButton">
              <TopButton
                key="grammarGameButton"
                isAchieved={isAchieved('G')}
                colorLeft={Color.passionFruit()}
                colorMiddle={Color.pastelPink()}
                colorRight={Color.passionFruit()}
                onClick={onPlayGrammarGame}
              >
                G{allGoalsAchieved ? '' : 'rammarbles'}
              </TopButton>
            </ErrorBoundary>
            <ErrorBoundary componentPath="Home/Stories/TopMenu/WordleButton">
              <TopButton
                key="wordleButton"
                isAchieved={isAchieved('W')}
                loading={loadingWordle}
                colorLeft={Color.goldOrange()}
                colorMiddle={Color.brightGold()}
                colorRight={Color.orange()}
                onClick={handleWordleButtonClick}
              >
                W{allGoalsAchieved ? '' : 'ordle'}
              </TopButton>
            </ErrorBoundary>
            {allGoalsAchieved && (
              <div
                style={{
                  marginLeft: '1rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {isDailyBonusButtonShown ? (
                  <DailyBonusButton />
                ) : (
                  <CollectRewardsButton
                    isChecked={!!todayStats?.dailyRewardResultViewed}
                  />
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <ErrorBoundary componentPath="Home/Stories/TopMenu/PostPicsButton">
              <TopButton
                key="postPicsButton"
                colorLeft={Color.fernGreen()}
                colorMiddle={Color.lightYellowGreen()}
                colorRight={Color.fernGreen()}
                style={{
                  paddingLeft: '1.3rem',
                  paddingRight: '1.3rem'
                }}
                onClick={() => onInputModalButtonClick('file')}
              >
                <Icon icon="upload" />
              </TopButton>
            </ErrorBoundary>
            <ErrorBoundary componentPath="Home/Stories/TopMenu/ChessButton">
              <button
                key="chessButton"
                disabled={loadingChess}
                style={{
                  paddingLeft: '1.3rem',
                  paddingRight: '1.3rem'
                }}
                onClick={handleChessButtonClick}
                className={css`
                  cursor: ${loadingChess ? 'default' : 'pointer'};
                  display: flex;
                  opacity: ${loadingChess ? 0.5 : 1};
                  background: #64748b;
                  border: 2px solid #475569;
                  color: white;
                  justify-content: center;
                  align-items: center;
                  text-align: center;
                  font-weight: 600;
                  font-size: 1.5rem;
                  border-radius: 6px;
                  padding: 1rem;
                  gap: 0.5rem;
                  transition: all 0.15s ease;
                  box-shadow: 0 2px 0 #334155;

                  &:hover:not(:disabled) {
                    background: #475569;
                    transform: translateY(1px);
                    box-shadow: 0 1px 0 #334155;
                  }

                  &:active:not(:disabled) {
                    background: #334155;
                    transform: translateY(2px);
                    box-shadow: none;
                  }

                  @media (max-width: ${tabletMaxWidth}) {
                    font-size: 1.2rem;
                    padding: 0.875rem;
                  }
                `}
              >
                {loadingChess && (
                  <Icon style={{ marginRight: '0.7rem' }} icon="spinner" pulse />
                )}
                <Icon icon="chess" />
              </button>
            </ErrorBoundary>
          </div>
        </div>
      </div>
      {chessModalShown && (
        <ChessOptionsModal
          onHide={() => setChessModalShown(false)}
          unansweredChessMsgChannelId={todayStats.unansweredChessMsgChannelId}
          onNavigateToChessMessage={handleNavigateToChessMessage}
          onPlayPuzzles={handlePlayPuzzles}
        />
      )}
    </ErrorBoundary>
  );

  function handleWordleButtonClick({ isRetry = false } = {}) {
    if (!isMountedRef.current) return;

    if (!isRetry && loadingWordle) return;

    if (chatLoadedRef.current) {
      onUpdateSelectedChannelId(GENERAL_CHAT_ID);
      onSetWordleModalShown(true);
      navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
    } else {
      setLoadingWordle(true);
      timerIdRef.current = setTimeout(
        () => handleWordleButtonClick({ isRetry: true }),
        500
      );
    }
  }

  function handleChessButtonClick(): any {
    if (!isMountedRef.current) return;
    setChessModalShown(true);
  }

  function handleNavigateToChessMessage(): any {
    if (!isMountedRef.current) return;
    setLoadingChess(true);
    setChessModalShown(false);
    if (!chatLoadedRef.current) {
      timerIdRef.current = setTimeout(
        () => handleNavigateToChessMessage(),
        500
      );
      return;
    }
    onUpdateSelectedChannelId(todayStats.unansweredChessMsgChannelId);
    onUpdateTodayStats({ newStats: { unansweredChessMsgChannelId: null } });
    timerIdRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      navigate(
        `/chat/${
          Number(CHAT_ID_BASE_NUMBER) +
          Number(todayStats.unansweredChessMsgChannelId)
        }`
      );
      setTimeout(() => {
        onSetChessModalShown(true);
      }, 1000);
    }, 10);
  }

  function handlePlayPuzzles() {
    setChessModalShown(false);
    onSetChessPuzzleModalShown(true);
  }
}
