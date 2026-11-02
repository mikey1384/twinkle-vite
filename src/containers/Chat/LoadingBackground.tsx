import React, { useEffect, useState } from 'react';
import { recordMemberClientTrace } from '~/helpers/clientTraceBus';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import loading from './loading.jpeg';

export default function LoadingBackground() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Member trace: the full "Loading Twinkle Chat..." screen, shown and gone
  // with how long it stayed (a recovery that blanks the whole chat).
  useEffect(() => {
    const shownAt = Date.now();
    recordMemberClientTrace('chat-loading', { e: 'shown' });
    return () =>
      recordMemberClientTrace('chat-loading', {
        e: 'gone',
        ms: Date.now() - shownAt
      });
  }, []);

  return (
    <div
      className={css`
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        opacity: ${isLoaded ? 0.5 : 0};
        transition: opacity 0.3s;
      `}
    >
      <img
        src={loading}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={css`
          width: 100%;
          height: 100%;
          object-fit: contain;
          animation: heartbeat 2.5s infinite;
          @keyframes heartbeat {
            0% {
              opacity: 0.6;
            }
            50% {
              opacity: 0.1;
            }
            100% {
              opacity: 0.6;
            }
          }
          @media (max-width: ${mobileMaxWidth}) {
            object-fit: contain;
          }
        `}
      />
    </div>
  );
}
