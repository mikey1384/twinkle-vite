import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import FeaturedSubjects from './FeaturedSubjects';
import CallZero from './CallZero';
import {
  MAX_AI_CALL_DURATION,
  ZERO_TWINKLE_ID
} from '~/constants/defaultValues';
import { useAppContext, useNotiContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function Featured() {
  const { isAdmin, userId } = useKeyContext((v) => v.myState);
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const [callButtonHovered, setCallButtonHovered] = useState(false);
  const [isZeroCallAvailable, setIsZeroCallAvailable] = useState(false);
  const [zeroChannelId, setZeroChannelId] = useState<number | null>(null);
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const aiCallDuration = useMemo(() => {
    if (!todayStats) return 0;
    return todayStats.aiCallDuration;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStats?.aiCallDuration]);

  const maxAiCallDurationReached = useMemo(() => {
    if (isAdmin) return false;
    return aiCallDuration >= MAX_AI_CALL_DURATION;
  }, [aiCallDuration, isAdmin]);

  const isZeroInterfaceShown = useMemo(() => {
    return !!isZeroCallAvailable && !!zeroChannelId;
  }, [isZeroCallAvailable, zeroChannelId]);

  useEffect(() => {
    checkZeroCallAvailability();

    async function checkZeroCallAvailability() {
      if (userId && !maxAiCallDurationReached) {
        const { pathId, channelId } = await loadDMChannel({
          recipient: { id: ZERO_TWINKLE_ID }
        });
        setIsZeroCallAvailable(!!pathId);
        setZeroChannelId(channelId);
      } else {
        setIsZeroCallAvailable(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, maxAiCallDurationReached]);

  return (
    <ErrorBoundary componentPath="Home/Stories/Featured/index">
      <div
        className={css`
          position: relative;
          width: 100%;
          height: 17rem;
          margin-bottom: 1rem;
          overflow: hidden;
          ${callButtonHovered
            ? 'box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.1);'
            : 'box-shadow: none;'}

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
            width: ${isZeroInterfaceShown ? '80%' : '100%'};
            transition: transform 0.5s ease-in-out;
            transform: ${callButtonHovered
              ? 'translateX(-100%)'
              : 'translateX(0)'};
          `}
        >
          <FeaturedSubjects
            isLoggedIn={!!userId}
            isZeroInterfaceShown={isZeroInterfaceShown}
          />
        </div>
        {isZeroInterfaceShown && (
          <div
            className={css`
              position: absolute;
              top: 0;
              right: 0;
              bottom: 0;
              width: ${callButtonHovered ? '100%' : '25%'};
              transition: width 0.5s ease-in-out;
              overflow: visible;
            `}
          >
            <CallZero
              callButtonHovered={callButtonHovered}
              setCallButtonHovered={setCallButtonHovered}
              zeroChannelId={zeroChannelId}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
