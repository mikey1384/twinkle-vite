import React, { useMemo, useState, useCallback } from 'react';
import ZeroPic from '~/components/ZeroPic';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import { useChatContext, useNotiContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import { checkMicrophoneAccess } from '~/helpers';
import MicrophoneAccessModal from '~/components/Modals/MicrophoneAccessModal';
import { MAX_AI_CALL_DURATION } from '~/constants/defaultValues';

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
  const { isAdmin } = useKeyContext((v) => v.myState);
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const aiCallDuration = useMemo(() => {
    if (!todayStats) return 0;
    return todayStats.aiCallDuration;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStats?.aiCallDuration]);

  const batteryLevel = useMemo(() => {
    if (isAdmin) return 100;
    return Math.round(
      ((MAX_AI_CALL_DURATION - aiCallDuration) / MAX_AI_CALL_DURATION) * 100
    );
  }, [aiCallDuration, isAdmin]);

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
          justify-content: ${aiCallOngoing ? 'flex-end' : 'center'};
          opacity: ${callButtonHovered || aiCallOngoing ? 1 : 0};
          transition: opacity 0.3s ease-in-out;
          padding-bottom: ${aiCallOngoing ? '2rem' : 0};
        `}
      >
        {aiCallOngoing && (
          <div
            className={css`
              margin-bottom: 1rem;
              display: flex;
              width: 100%;
              justify-content: center;
            `}
          >
            <div
              className={css`
                width: 200px;
                height: 30px;
                background-color: #e0e0e0;
                border-radius: 20px;
                padding: 5px;
                position: relative;
              `}
            >
              <div
                className={css`
                  height: 100%;
                  width: ${batteryLevel}%;
                  background-color: #4caf50;
                  border-radius: 15px;
                  transition: width 0.3s ease-in-out;
                `}
              />
              <div
                className={css`
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: ${batteryLevel < 30 ? '#333' : '#fff'};
                  font-weight: 600;
                  font-size: 0.85rem;
                `}
              >
                AI Power: {batteryLevel}%
              </div>
            </div>
          </div>
        )}
        {!aiCallOngoing && (
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
        )}
        <p
          className={css`
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: 1rem;
          `}
        >
          {`Zero is your personal guide to Twinkle, ready to help you navigate and understand all the features of the website.`}
        </p>
        <p
          className={css`
            font-size: 1rem;
            line-height: 1.6;
          `}
        >
          {`But that's not all—Zero is also great for language practice (he can speak 100+ languages!) and he can even see what's on your screen and answer questions about it!`}
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
