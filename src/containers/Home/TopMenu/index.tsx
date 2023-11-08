import React, { useEffect, useRef, useState } from 'react';
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
import localize from '~/constants/localize';
import TopButton from './TopButton';

const grammarGameLabel = localize('grammarGame');

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
  const chatLoaded = useChatContext((v) => v.state.loaded);
  useEffect(() => {
    chatLoadedRef.current = chatLoaded;
  }, [chatLoaded]);
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
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
  const { userId, username } = useKeyContext((v) => v.myState);
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

  return userId ? (
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
          `}
        >
          <TopButton
            colorLeft={Color.darkBlue()}
            colorMiddle={Color.logoBlue()}
            colorRight={Color.darkBlue()}
            onClick={onPlayAIStories}
          >
            A.I Stories
          </TopButton>
          <TopButton
            colorLeft={Color.rose()}
            colorMiddle={Color.pastelPink()}
            colorRight={Color.rose()}
            style={{ marginLeft: '1rem' }}
            onClick={onPlayGrammarGame}
          >
            {grammarGameLabel}
          </TopButton>
          <TopButton
            loading={loadingWordle}
            colorLeft={Color.orange()}
            colorMiddle={Color.gold()}
            colorRight={Color.orange()}
            style={{ marginLeft: '1rem' }}
            onClick={handleWordleButtonClick}
          >
            Wordle
          </TopButton>
          <TopButton
            colorLeft={Color.armyGreen()}
            colorMiddle={Color.logoGreen()}
            colorRight={Color.armyGreen()}
            style={{ marginLeft: '1rem' }}
            onClick={() => onInputModalButtonClick('file')}
          >
            Post Pics/Videos
          </TopButton>
          {todayStats.unansweredChessMsgChannelId ? (
            <TopButton
              loading={loadingChess}
              colorLeft={Color.purple()}
              colorMiddle={Color.pink()}
              colorRight={Color.purple()}
              style={{ marginLeft: '1rem' }}
              onClick={handleChessButtonClick}
            >
              Chess
            </TopButton>
          ) : null}
        </div>
      </div>
    </ErrorBoundary>
  ) : null;

  function handleWordleButtonClick(): any {
    if (!isMountedRef.current) return;
    setLoadingWordle(true);
    if (!chatLoadedRef.current) {
      timerIdRef.current = setTimeout(() => handleWordleButtonClick(), 500);
      return;
    }
    onUpdateSelectedChannelId(GENERAL_CHAT_ID);
    timerIdRef.current = setTimeout(() => {
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
