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
import { useChatContext, useKeyContext, useNotiContext } from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { isMobile, isTablet } from '~/helpers';
import DailyBonusButton from '~/components/Buttons/DailyBonusButton';
import CollectRewardsButton from '~/components/Buttons/CollectRewardsButton';
import Icon from '~/components/Icon';
import TopButton from './TopButton';

const deviceIsMobile = isMobile(navigator);
const deviceIsTablet = isTablet(navigator);

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
  const timerIdRef: React.MutableRefObject<any> = useRef(null);
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
  const [loadingWordle, setLoadingWordle] = useState(false);
  const [loadingChess, setLoadingChess] = useState(false);
  const { username } = useKeyContext((v) => v.myState);
  const isMountedRef = useRef(true);
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
  const isLabelTrimmed = useMemo(() => {
    return allGoalsAchieved && (deviceIsMobile || deviceIsTablet);
  }, [allGoalsAchieved]);

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
            justify-content: space-between;
          `}
        >
          <div style={{ display: 'flex' }}>
            <ErrorBoundary componentPath="Home/Stories/TopMenu/AIStoriesButton">
              <TopButton
                key="aiStoriesButton"
                isAchieved={isAchieved('A')}
                colorLeft={Color.blue()}
                colorMiddle={Color.logoBlue()}
                colorRight={Color.blue()}
                onClick={onPlayAIStories}
              >
                A{isLabelTrimmed ? '' : '.I Stories'}
              </TopButton>
            </ErrorBoundary>
            <ErrorBoundary componentPath="Home/Stories/TopMenu/GrammarGameButton">
              <TopButton
                key="grammarGameButton"
                isAchieved={isAchieved('G')}
                colorLeft={Color.passionFruit()}
                colorMiddle={Color.pastelPink()}
                colorRight={Color.passionFruit()}
                style={{ marginLeft: '1rem' }}
                onClick={onPlayGrammarGame}
              >
                G{isLabelTrimmed ? '' : 'rammarbles'}
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
                style={{ marginLeft: '1rem' }}
                onClick={handleWordleButtonClick}
              >
                W{isLabelTrimmed ? '' : 'ordle'}
              </TopButton>
            </ErrorBoundary>
            {allGoalsAchieved && (
              <div
                style={{
                  marginLeft: '1.5rem',
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
          <div style={{ display: 'flex' }}>
            <ErrorBoundary componentPath="Home/Stories/TopMenu/PostPicsButton">
              <TopButton
                key="postPicsButton"
                colorLeft={Color.fernGreen()}
                colorMiddle={Color.lightYellowGreen()}
                colorRight={Color.fernGreen()}
                style={{
                  marginLeft: '1rem',
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
                    marginLeft: '1rem',
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

  function handleWordleButtonClick() {
    if (!isMountedRef.current) return;
    setLoadingWordle(true);

    if (!chatLoadedRef.current) {
      timerIdRef.current = setTimeout(() => handleWordleButtonClick(), 500);
      return;
    }

    onUpdateSelectedChannelId(GENERAL_CHAT_ID);
    timerIdRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
      setTimeout(() => {
        onSetWordleModalShown(true);
      }, 300);
    }, 10);
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
