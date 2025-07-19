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
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import DailyBonusButton from '~/components/Buttons/DailyBonusButton';
import CollectRewardsButton from '~/components/Buttons/CollectRewardsButton';
import Icon from '~/components/Icon';
import TopButton from './TopButton';

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
  const [loadingChess, setLoadingChess] = useState(false);
  const username = useKeyContext((v) => v.myState.username);
  const userId = useKeyContext((v) => v.myState.userId);
  const isMountedRef = useRef(true);
  const [loadingWordle, setLoadingWordle] = useState(false);
  const wordleModalShown = useChatContext((v) => v.state.wordleModalShown);

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

  useEffect(() => {
    if (loadingWordle && wordleModalShown) {
      setLoadingWordle(false);
    }
  }, [loadingWordle, wordleModalShown]);

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
            {todayStats.unansweredChessMsgChannelId ? (
              <ErrorBoundary componentPath="Home/Stories/TopMenu/ChessButton">
                <TopButton
                  key="chessButton"
                  loading={loadingChess}
                  colorLeft={Color.darkPurple()}
                  colorMiddle={Color.lightPurple()}
                  colorRight={Color.darkPurple()}
                  style={{
                    paddingLeft: '1.3rem',
                    paddingRight: '1.3rem'
                  }}
                  onClick={handleChessButtonClick}
                >
                  <Icon icon="chess" />
                </TopButton>
              </ErrorBoundary>
            ) : null}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleWordleButtonClick({ isRetry = false } = {}) {
    if (!isRetry && loadingWordle) return;
    setLoadingWordle(true);

    if (!chatLoadedRef.current) {
      timerIdRef.current = setTimeout(
        () => handleWordleButtonClick({ isRetry: true }),
        500
      );
      return;
    }

    onUpdateSelectedChannelId(GENERAL_CHAT_ID);
    onSetWordleModalShown(true);
    navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
  }

  function handleChessButtonClick(): any {
    if (!isMountedRef.current) return;
    setLoadingChess(true);
    if (!chatLoadedRef.current) {
      timerIdRef.current = setTimeout(() => handleChessButtonClick(), 500);
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
}
