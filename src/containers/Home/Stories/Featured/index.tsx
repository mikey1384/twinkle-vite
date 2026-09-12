import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import FeaturedSubjects from './Subjects';
import CallZero from './CallZero';
import useHomeCallAssistant from './useHomeCallAssistant';
import { useChatContext, useKeyContext, useNotiContext } from '~/contexts';
import { css } from '@emotion/css';
import {
  desktopMinWidth,
  mobileMaxWidth,
  tabletMaxWidth
} from '~/constants/css';

const portraitTabletMediaQuery = `(min-width: ${desktopMinWidth}) and (max-width: ${tabletMaxWidth}) and (orientation: portrait)`;

export default function Featured() {
  const userId = useKeyContext((v) => v.myState.userId);
  const zeroChannelId = useChatContext((v) => v.state.zeroChannelId);
  const cielChannelId = useChatContext((v) => v.state.cielChannelId);
  const aiCallChannelId = useChatContext((v) => v.state.aiCallChannelId);
  const aiCallAssistantName = useChatContext(
    (v) => v.state.aiCallAssistantName
  );
  const aiCallEnding = useChatContext((v) => v.state.aiCallEnding);
  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
  const aiUsagePolicy = useNotiContext(
    (v) => v.state.todayStats?.aiUsagePolicy
  );
  const [callButtonHovered, setCallButtonHovered] = useState(false);
  const [callMenuShown, setCallMenuShown] = useState(false);
  const [callConnecting, setCallConnecting] = useState(false);
  const [callSetupActive, setCallSetupActive] = useState(false);
  const { assistant: preferredAssistant, chooseAssistant } =
    useHomeCallAssistant(
      userId,
      callButtonHovered ||
        callMenuShown ||
        callConnecting ||
        callSetupActive ||
        !!aiCallChannelId ||
        aiCallEnding
    );
  const assistantName = aiCallChannelId
    ? aiCallAssistantName ||
      (aiCallChannelId === cielChannelId ? 'Ciel' : 'Zero')
    : preferredAssistant;
  const callChannelId =
    assistantName === 'Ciel' ? cielChannelId : zeroChannelId;

  const aiCallOngoing = useMemo(() => !!aiCallChannelId, [aiCallChannelId]);
  const isCallChannelLoading = useMemo(() => {
    return (
      callConnecting ||
      (!!userId && !callChannelId && !aiCallOngoing && !aiCallEnding)
    );
  }, [aiCallEnding, aiCallOngoing, callChannelId, callConnecting, userId]);
  const hasReachedDailyLimit = useMemo(() => {
    if (isAdmin) return false;
    if (!aiUsagePolicy) return false;
    return Number(aiUsagePolicy.energyRemaining || 0) <= 0;
  }, [isAdmin, aiUsagePolicy]);

  const isCallInterfaceExpanded = useMemo(() => {
    return (
      callButtonHovered ||
      callMenuShown ||
      aiCallOngoing ||
      aiCallEnding ||
      isCallChannelLoading ||
      hasReachedDailyLimit
    );
  }, [
    aiCallEnding,
    aiCallOngoing,
    callButtonHovered,
    callMenuShown,
    hasReachedDailyLimit,
    isCallChannelLoading
  ]);

  return (
    <ErrorBoundary componentPath="Home/Stories/Featured/index">
      <div
        className={css`
          position: relative;
          width: 100%;
          height: 17rem;
          margin-bottom: 1rem;
          overflow: hidden;
          ${
            isCallInterfaceExpanded
              ? 'box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.1);'
              : 'box-shadow: none;'
          }

          @media (max-width: ${mobileMaxWidth}) {
            ${userId ? 'height: 17rem;' : 'height: 18rem;'}
          }
        `}
      >
        <div
          className={css`
            z-index: 10;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            width: 80%;
            transition: transform 0.5s ease-in-out;
            transform: ${
              isCallInterfaceExpanded ? 'translateX(-100%)' : 'translateX(0)'
            };

            @media ${portraitTabletMediaQuery} {
              width: 84%;
            }
          `}
        >
          <FeaturedSubjects isLoggedIn={!!userId} />
        </div>
        <div
          className={css`
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            width: ${isCallInterfaceExpanded ? '100%' : '25%'};
            transition: width 0.5s ease-in-out;
            overflow: visible;

            @media ${portraitTabletMediaQuery} {
              width: ${isCallInterfaceExpanded ? '100%' : '20%'};
            }
          `}
        >
          <CallZero
            callButtonHovered={callButtonHovered}
            onSetCallButtonHovered={setCallButtonHovered}
            callChannelId={callChannelId}
            assistantName={assistantName}
            onChooseAssistant={chooseAssistant}
            onSetCallSetupActive={setCallSetupActive}
            onSetCallMenuShown={setCallMenuShown}
            callConnecting={callConnecting}
            onSetCallConnecting={setCallConnecting}
            aiCallOngoing={aiCallOngoing}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
