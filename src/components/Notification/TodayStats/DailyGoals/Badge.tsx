import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useChatContext, useHomeContext } from '~/contexts';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID
} from '~/constants/defaultValues';

const gradientMap: {
  [key: string]: {
    achieved: string;
    notAchieved?: string;
  };
} = {
  W: {
    achieved: `linear-gradient(135deg, #ff8c00 0%, #ffc040 100%)`,
    notAchieved: `linear-gradient(135deg, rgba(255, 140, 0, 0.3) 0%, rgba(255, 192, 64, 0.3) 100%)`
  },
  G: {
    achieved: `linear-gradient(135deg, #db0076 0%, #ff4088 100%)`,
    notAchieved: `linear-gradient(135deg, rgba(219, 0, 118, 0.3) 0%, rgba(255, 64, 136, 0.3) 100%)`
  },
  A: {
    achieved: `linear-gradient(135deg, #0047ab 0%, #408cff 100%)`,
    notAchieved: `linear-gradient(135deg, rgba(0, 71, 171, 0.3) 0%, rgba(64, 140, 255, 0.3) 100%)`
  }
};

export default function Badge({
  children,
  isAchieved
}: {
  children: string;
  isAchieved: boolean;
}) {
  const navigate = useNavigate();
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onSetGrammarGameModalShown = useHomeContext(
    (v) => v.actions.onSetGrammarGameModalShown
  );
  const onSetAIStoriesModalShown = useHomeContext(
    (v) => v.actions.onSetAIStoriesModalShown
  );
  const onSetWordleModalShown = useChatContext(
    (v) => v.actions.onSetWordleModalShown
  );
  const isMountedRef = useRef(true);
  const chatLoadedRef = useRef(false);
  const chatLoaded = useChatContext((v) => v.state.loaded);
  const timerIdRef = useRef<any>(null);
  const [loadingWordle, setLoadingWordle] = useState(false);

  const background = useMemo(
    () =>
      isAchieved && !loadingWordle
        ? gradientMap[children]?.achieved
        : gradientMap[children]?.notAchieved || 'var(--color-not-achieved)',
    [children, isAchieved, loadingWordle]
  );

  useEffect(() => {
    chatLoadedRef.current = chatLoaded;
  }, [chatLoaded]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
    };
  }, []);

  return (
    <div
      onClick={handleBadgeClick}
      className={css`
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        height: 40px;
        margin: 0.5rem;
        border-radius: 50%;
        color: white;
        font-weight: bold;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        cursor: ${loadingWordle ? 'default' : 'pointer'};
        transition: background-color 0.3s ease, transform 0.3s ease;
        background: ${background};

        &:hover {
          transform: scale(1.1);
          background: ${isAchieved ? '' : gradientMap[children]?.notAchieved};
        }
      `}
    >
      {children}
    </div>
  );

  function handleBadgeClick() {
    switch (children) {
      case 'W':
        // Example action for 'W' badge
        handleWordleButtonClick();
        break;
      case 'G':
        // Example action for 'G' badge
        onSetGrammarGameModalShown(true);
        break;
      case 'A':
        // Example action for 'A' badge
        onSetAIStoriesModalShown(true);
        break;
      default:
        // Default action or no action
        break;
    }
  }

  function handleWordleButtonClick(): any {
    if (!isMountedRef.current || loadingWordle) return;
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
}
