import React, { useMemo, useState, useCallback } from 'react';
import ZeroPic from '~/components/ZeroPic';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import {
  useAppContext,
  useChatContext,
  useNotiContext,
  useKeyContext
} from '~/contexts';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import { checkMicrophoneAccess } from '~/helpers';
import MicrophoneAccessModal from '~/components/Modals/MicrophoneAccessModal';
import { MAX_AI_CALL_DURATION } from '~/constants/defaultValues';
import Countdown from 'react-countdown';

export default function CallZero({
  callButtonHovered,
  onSetCallButtonHovered,
  zeroChannelId,
  aiCallOngoing
}: {
  callButtonHovered: boolean;
  onSetCallButtonHovered: (value: boolean) => void;
  zeroChannelId: number | null;
  aiCallOngoing: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
  const getCurrentNextDayTimeStamp = useAppContext(
    (v) => v.requestHelpers.getCurrentNextDayTimeStamp
  );
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const { nextDayTimeStamp, timeDifference } = useNotiContext(
    (v) => v.state.todayStats
  );
  const onSetAICall = useChatContext((v) => v.actions.onSetAICall);

  const [microphoneModalShown, setMicrophoneModalShown] = useState(false);

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

  const isCallButtonDisabled = useMemo(() => {
    if (userId && !zeroChannelId) return true;
    if (aiCallOngoing) return false;
    if (isAdmin) return false;
    return batteryLevel <= 0;
  }, [aiCallOngoing, batteryLevel, isAdmin, userId, zeroChannelId]);

  const buttonColor = useMemo(
    () => (aiCallOngoing ? Color.rose(0.9) : Color.darkBlue(0.9)),
    [aiCallOngoing]
  );

  const buttonHoverColor = useMemo(
    () => (aiCallOngoing ? Color.rose(1) : Color.darkBlue(1)),
    [aiCallOngoing]
  );

  const getCallQuotaMessage = useMemo(() => {
    if (!isCallButtonDisabled) return '';
    return "You've reached your daily AI call limit. Come back tomorrow for more conversations with Zero!";
  }, [isCallButtonDisabled]);

  const initiateCall = useCallback(() => {
    onSetAICall(zeroChannelId);
    socket.emit('ai_start_ai_voice_conversation', {
      channelId: zeroChannelId
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zeroChannelId]);

  const handleCallButtonClick = useCallback(async () => {
    if (aiCallOngoing) {
      onSetAICall(null);
      return;
    }

    if (!userId) {
      onOpenSigninModal();
      return;
    }
    const hasAccess = await checkMicrophoneAccess();
    if (hasAccess) {
      initiateCall();
    } else {
      setMicrophoneModalShown(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiCallOngoing, userId, onSetCallButtonHovered, initiateCall]);

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
        ${aiCallOngoing ? 'opacity: 0.8;' : ''}
      `}
      onMouseLeave={() => onSetCallButtonHovered(false)}
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
        {batteryLevel <= 0 && callButtonHovered ? (
          <>
            <h2
              className={css`
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: ${Color.rose()};
              `}
            >
              Daily Limit Reached
            </h2>
            <p
              className={css`
                font-size: 1.1rem;
                line-height: 1.6;
              `}
            >
              {getCallQuotaMessage}
            </p>
            <div
              className={css`
                margin-top: 1rem;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
              `}
            >
              <p
                className={css`
                  font-size: 1.1rem;
                  font-weight: 600;
                  margin-bottom: 0.5rem;
                  color: ${Color.darkBlue()};
                `}
              >
                Time until reset:
              </p>
              <Countdown
                key={nextDayTimeStamp}
                className={css`
                  font-size: 1.3rem;
                  color: ${Color.darkBlue()};
                  font-weight: 600;
                `}
                date={nextDayTimeStamp}
                now={() => {
                  const now = Date.now() + timeDifference;
                  return now;
                }}
                daysInHours={true}
                onComplete={handleCountdownComplete}
              />
            </div>
          </>
        ) : (
          <>
            <h2
              className={css`
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: #2c3e50;
              `}
            >
              Zero: Your AI Friend on Twinkle
            </h2>
            <p
              className={css`
                font-size: 1rem;
                line-height: 1.6;
                margin-bottom: 1rem;
              `}
            >
              {`Meet Zero—your personal guide to Twinkle. He's here to help you navigate and understand all the features of the website.`}
            </p>
            <p
              className={css`
                font-size: 1rem;
                line-height: 1.6;
              `}
            >
              {`But that's not all! Zero is also great for language practice (he can speak 100+ languages) and he can even see what's on your screen and answer questions about it!`}
            </p>
          </>
        )}
      </div>
      <div
        className={css`
          width: 100%;
          margin-right: 2rem;
        `}
      >
        <ZeroPic />
      </div>
      {aiCallOngoing && (
        <div
          className={css`
            position: absolute;
            top: 0;
            left: 0;
            right: 40px;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(0, 0, 0, 0.1);
            z-index: 1;
            pointer-events: none;
          `}
        >
          <div
            className={css`
              width: 300px;
              height: 40px;
              background-color: #e0e0e0;
              border-radius: 20px;
              padding: 5px;
              position: relative;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
                font-size: 1rem;
              `}
            >
              AI Power: {batteryLevel}%
            </div>
          </div>
        </div>
      )}
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
          cursor: ${isCallButtonDisabled ? 'not-allowed' : 'pointer'};
          transition: background-color 0.3s ease;

          &:hover {
            background-color: ${isCallButtonDisabled
              ? Color.gray(0.6)
              : buttonHoverColor};
          }
        `}
        onClick={isCallButtonDisabled ? undefined : handleCallButtonClick}
        onMouseEnter={() => onSetCallButtonHovered(true)}
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
            opacity: ${isCallButtonDisabled ? 0.7 : 1};
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

  async function handleCountdownComplete() {
    const newNextDayTimeStamp = await getCurrentNextDayTimeStamp();
    onUpdateTodayStats({
      newStats: {
        aiCallDuration: 0,
        xpEarned: 0,
        coinsEarned: 0,
        achievedDailyGoals: [],
        dailyHasBonus: false,
        dailyBonusAttempted: false,
        dailyRewardResultViewed: false,
        nextDayTimeStamp: newNextDayTimeStamp
      }
    });
  }
}
