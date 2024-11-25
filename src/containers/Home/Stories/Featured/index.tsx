import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import FeaturedSubjects from './FeaturedSubjects';
import CallZero from './CallZero';
import { useChatContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function Featured() {
  const { userId } = useKeyContext((v) => v.myState);
  const isZeroCallAvailable = useChatContext(
    (v) => v.state.isZeroCallAvailable
  );
  const zeroChannelId = useChatContext((v) => v.state.zeroChannelId);
  const aiCallChannelId = useChatContext((v) => v.state.aiCallChannelId);
  const [callButtonHovered, setCallButtonHovered] = useState(false);

  const aiCallOngoing = useMemo(
    () => !!zeroChannelId && zeroChannelId === aiCallChannelId,
    [aiCallChannelId, zeroChannelId]
  );

  const isZeroInterfaceShown = useMemo(() => {
    return !!isZeroCallAvailable && !!zeroChannelId;
  }, [isZeroCallAvailable, zeroChannelId]);

  const isZeroInterfaceExpanded = useMemo(() => {
    return callButtonHovered || aiCallOngoing;
  }, [callButtonHovered, aiCallOngoing]);

  return (
    <ErrorBoundary componentPath="Home/Stories/Featured/index">
      <div
        className={css`
          position: relative;
          width: 100%;
          height: 17rem;
          margin-bottom: 1rem;
          overflow: hidden;
          ${isZeroInterfaceExpanded
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
            transform: ${isZeroInterfaceExpanded
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
              width: ${isZeroInterfaceExpanded ? '100%' : '25%'};
              transition: width 0.5s ease-in-out;
              overflow: visible;
            `}
          >
            <CallZero
              callButtonHovered={callButtonHovered}
              setCallButtonHovered={setCallButtonHovered}
              zeroChannelId={zeroChannelId}
              aiCallOngoing={aiCallOngoing}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
