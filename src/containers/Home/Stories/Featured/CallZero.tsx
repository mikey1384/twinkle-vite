import React, { useMemo, useState, useCallback } from 'react';
import ZeroPic from '~/components/ZeroPic';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import { useChatContext } from '~/contexts';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import { checkMicrophoneAccess } from '~/helpers';
import MicrophoneAccessModal from '~/components/Modals/MicrophoneAccessModal';

export default function CallZero({
  callButtonHovered,
  setCallButtonHovered,
  zeroChannelId,
  aiCallOngoing
}: {
  callButtonHovered: boolean;
  setCallButtonHovered: (value: boolean) => void;
  zeroChannelId: number | null;
  aiCallOngoing: boolean;
}) {
  const [microphoneModalShown, setMicrophoneModalShown] = useState(false);
  const onSetAICall = useChatContext((v) => v.actions.onSetAICall);
  const initiateCall = useCallback(() => {
    onSetAICall(zeroChannelId);
    socket.emit('ai_start_ai_voice_conversation', {
      channelId: zeroChannelId
    });
  }, [onSetAICall, zeroChannelId]);
  const handleCallButtonClick = useCallback(async () => {
    if (aiCallOngoing) {
      onSetAICall(null);
      socket.emit('ai_end_ai_voice_conversation');
      return;
    }

    const hasAccess = await checkMicrophoneAccess();
    if (hasAccess) {
      initiateCall();
    } else {
      setMicrophoneModalShown(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiCallOngoing, initiateCall]);
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
      onMouseLeave={() => !aiCallOngoing && setCallButtonHovered(false)}
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
          opacity: ${callButtonHovered || aiCallOngoing ? 1 : 0};
          transition: opacity 0.3s ease-in-out;
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
        onClick={handleCallButtonClick}
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
      <MicrophoneAccessModal
        isShown={microphoneModalShown}
        onHide={() => setMicrophoneModalShown(false)}
        onSuccess={() => {
          setMicrophoneModalShown(false);
          initiateCall();
        }}
      />
    </div>
  );
}
