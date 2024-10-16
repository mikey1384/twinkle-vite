import React, { useMemo } from 'react';
import ZeroPic from '~/components/ZeroPic';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import { useChatContext } from '~/contexts';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';

export default function CallZero({
  callButtonHovered,
  setCallButtonHovered,
  zeroChannelId
}: {
  callButtonHovered: boolean;
  setCallButtonHovered: (value: boolean) => void;
  zeroChannelId: number | null;
}) {
  const aiCallChannelId = useChatContext((v) => v.state.aiCallChannelId);
  const onSetAICall = useChatContext((v) => v.actions.onSetAICall);
  const aiCallOngoing = useMemo(
    () => !!zeroChannelId && zeroChannelId === aiCallChannelId,
    [aiCallChannelId, zeroChannelId]
  );

  const buttonColor = useMemo(
    () => (aiCallOngoing ? Color.rose(0.9) : Color.darkBlue(0.9)),
    [aiCallOngoing]
  );

  const buttonHoverColor = useMemo(
    () => (aiCallOngoing ? Color.rose(1) : Color.darkBlue(1)),
    [aiCallOngoing]
  );

  return (
    <div
      className={css`
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        background-color: #f5f7fa;
        overflow: hidden;
      `}
      onMouseLeave={() => setCallButtonHovered(false)}
    >
      <div
        className={css`
          margin-left: 2rem;
          max-width: calc(100% - 20rem);
          font-family: 'Inter', sans-serif;
          color: #333333;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          opacity: ${callButtonHovered ? 1 : 0};
        `}
      >
        <h2
          className={css`
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #2c3e50;
          `}
        >
          Meet Zero: Your AI Friend on Twinkle
        </h2>
        <p
          className={css`
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: 1rem;
          `}
        >
          {`Meet Zero, your AI friend on Twinkle. From helping with missions, XP, and Twinkle Coins, to guiding you through the platform, Zero’s here to make things easy and fun.`}
        </p>
        <p
          className={css`
            font-size: 1rem;
            line-height: 1.6;
          `}
        >
          {`But that's not all—Zero is also great for language practice (he can speak 100+ languages!), breaking down tough concepts, and even assisting with coding. With his on-screen guidance, Zero's here to help you make the most of your Twinkle experience.`}
        </p>
      </div>
      <div
        className={css`
          width: 100%;
          margin-right: 2rem;
        `}
      >
        <ZeroPic />
      </div>
      <div
        className={css`
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 40px;
          background-color: ${buttonColor};
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.3s ease;

          &:hover {
            background-color: ${buttonHoverColor};
          }
        `}
        onClick={async () => {
          if (aiCallOngoing) {
            onSetAICall(null);
            socket.emit('ai_end_ai_voice_conversation');
          } else {
            onSetAICall(zeroChannelId);
            socket.emit('ai_start_ai_voice_conversation', {
              channelId: zeroChannelId
            });
          }
        }}
        onMouseEnter={() => setCallButtonHovered(true)}
      >
        <span
          className={css`
            transform: rotate(-270deg);
            white-space: nowrap;
            color: white;
            font-family: 'Inter', sans-serif;
            font-size: 16px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
          `}
        >
          <Icon icon="phone-volume" />
          <span style={{ marginLeft: '0.7rem' }}>
            {aiCallOngoing ? 'Hang Up' : 'Call'}
          </span>
        </span>
      </div>
    </div>
  );
}
