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
import { Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import { checkMicrophoneAccess } from '~/helpers';
import MicrophoneAccessModal from '~/components/Modals/MicrophoneAccessModal';
import { MAX_AI_CALL_DURATION } from '~/constants/defaultValues';
import Countdown from 'react-countdown';
import { useRoleColor } from '~/theme/useRoleColor';

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseColorString(input: string): RGBA | null {
  const match = input
    .replace(/\s+/g, '')
    .match(/rgba?\(([\d.]+),([\d.]+),([\d.]+)(?:,([\d.]+))?\)/i);
  if (!match) return null;
  const [, r, g, b, a] = match;
  return {
    r: clamp(Number(r), 0, 255),
    g: clamp(Number(g), 0, 255),
    b: clamp(Number(b), 0, 255),
    a: a !== undefined ? clamp(Number(a), 0, 1) : 1
  };
}

function toRgbaString({ r, g, b, a }: RGBA) {
  const alpha = Number.isFinite(a) ? Number(a.toFixed(3)) : 1;
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
}

function mixWithColor(base: RGBA, target: RGBA, amount: number) {
  const ratio = clamp(amount, 0, 1);
  return {
    r: base.r + (target.r - base.r) * ratio,
    g: base.g + (target.g - base.g) * ratio,
    b: base.b + (target.b - base.b) * ratio,
    a: base.a
  };
}

function lightenColor(color: string, amount: number) {
  const parsed = parseColorString(color);
  if (!parsed) return color;
  return toRgbaString(
    mixWithColor(parsed, { r: 255, g: 255, b: 255, a: parsed.a }, amount)
  );
}

function darkenColor(color: string, amount: number) {
  const parsed = parseColorString(color);
  if (!parsed) return color;
  return toRgbaString(
    mixWithColor(parsed, { r: 0, g: 0, b: 0, a: parsed.a }, amount)
  );
}

function setAlpha(color: string, alpha: number) {
  const parsed = parseColorString(color);
  if (!parsed) return color;
  return toRgbaString({
    ...parsed,
    a: clamp(alpha, 0, 1)
  });
}

function getReadableTextColor(color: string) {
  const parsed = parseColorString(color);
  if (!parsed) return Color.white();
  const normalize = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };
  const luminance =
    0.2126 * normalize(parsed.r) +
    0.7152 * normalize(parsed.g) +
    0.0722 * normalize(parsed.b);
  return luminance >= 0.6 ? Color.darkBlueGray() : Color.white();
}

const callButtonClass = css`
  position: absolute;
  top: 50%;
  right: 1.6rem;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.4rem;
  padding: 1.9rem 1.2rem;
  width: 5.2rem;
  min-height: 20rem;
  border-radius: 12px;
  border: 1px solid var(--call-button-border, transparent);
  background: var(--call-button-bg);
  color: var(--call-button-text, ${Color.white()});
  box-shadow: var(--call-button-shadow);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease,
    border-color 0.25s ease, filter 0.25s ease;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.02em;
  z-index: 3;
  backdrop-filter: blur(4px);
  isolation: isolate;
  overflow: hidden;

  .call-button__icon {
    width: 3.4rem;
    height: 3.4rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--call-button-icon-bg, rgba(255, 255, 255, 0.25));
    color: var(--call-button-text, ${Color.white()});
    font-size: 1.7rem;
    box-shadow: var(--call-button-icon-shadow, none);
  }

  .call-button__label {
    font-weight: 700;
    font-size: 1.3rem;
    color: inherit;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    letter-spacing: 0.12em;
    white-space: nowrap;
    text-transform: uppercase;
  }

  &:hover:not(:disabled),
  &:focus-visible {
    background: var(--call-button-bg-hover, var(--call-button-bg));
    border-color: var(--call-button-border-hover, var(--call-button-border));
    box-shadow: var(--call-button-shadow-hover, var(--call-button-shadow));
    transform: translateY(calc(-50% - 4px));
  }

  &:focus-visible {
    outline: 3px solid var(--call-button-outline, ${Color.logoBlue(0.5)});
    outline-offset: 3px;
  }

  &:disabled {
    cursor: not-allowed;
    background: linear-gradient(
      135deg,
      ${Color.borderGray(0.4)} 0%,
      ${Color.borderGray()} 100%
    );
    border-color: var(--ui-border);
    box-shadow: none;
    color: ${Color.gray()};
    transform: translateY(-50%);
  }

  &:disabled .call-button__icon {
    background: rgba(255, 255, 255, 0.35);
    color: ${Color.gray()};
    box-shadow: none;
  }

  /* Mobile uses the same design as desktop */
`;

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
  const actionRole = useRoleColor('action', { fallback: 'green' });

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

  const getCallQuotaMessage = useMemo(() => {
    if (!isCallButtonDisabled) return '';
    return "You've reached your daily AI call limit. Come back tomorrow for more conversations with Zero!";
  }, [isCallButtonDisabled]);

  const accentBaseColor = useMemo(() => {
    if (aiCallOngoing) return Color.rose();
    return actionRole.getColor() || Color.green();
  }, [actionRole, aiCallOngoing]);

  const gradientStart = useMemo(
    () => lightenColor(accentBaseColor, 0.25),
    [accentBaseColor]
  );
  const gradientEnd = useMemo(
    () => darkenColor(accentBaseColor, 0.04),
    [accentBaseColor]
  );
  const gradientHoverStart = useMemo(
    () => lightenColor(accentBaseColor, 0.15),
    [accentBaseColor]
  );
  const gradientHoverEnd = useMemo(
    () => darkenColor(accentBaseColor, 0.12),
    [accentBaseColor]
  );

  const callButtonGradient = useMemo(
    () => `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
    [gradientEnd, gradientStart]
  );
  const callButtonHoverGradient = useMemo(
    () =>
      `linear-gradient(135deg, ${gradientHoverStart} 0%, ${gradientHoverEnd} 100%)`,
    [gradientHoverEnd, gradientHoverStart]
  );
  const callButtonBorderColor = useMemo(
    () => setAlpha(darkenColor(accentBaseColor, 0.06), 0.9),
    [accentBaseColor]
  );
  const callButtonHoverBorderColor = useMemo(
    () => setAlpha(darkenColor(accentBaseColor, 0.12), 0.95),
    [accentBaseColor]
  );
  const callButtonShadow = useMemo(
    () => `0 18px 34px -16px ${setAlpha(accentBaseColor, 0.45)}`,
    [accentBaseColor]
  );
  const callButtonShadowHover = useMemo(
    () => `0 20px 40px -15px ${setAlpha(accentBaseColor, 0.6)}`,
    [accentBaseColor]
  );
  const callButtonTextColor = useMemo(
    () => getReadableTextColor(accentBaseColor),
    [accentBaseColor]
  );
  const callButtonOutlineColor = useMemo(
    () => setAlpha(accentBaseColor, 0.45),
    [accentBaseColor]
  );
  const iconBackgroundColor = useMemo(
    () => setAlpha(lightenColor(accentBaseColor, 0.4), 0.35),
    [accentBaseColor]
  );
  const iconShadow = useMemo(
    () => `0 12px 18px -14px ${setAlpha(accentBaseColor, 0.55)}`,
    [accentBaseColor]
  );

  const callButtonStyle = useMemo<React.CSSProperties>(
    () => ({
      ['--call-button-bg' as any]: callButtonGradient,
      ['--call-button-bg-hover' as any]: callButtonHoverGradient,
      ['--call-button-border' as any]: callButtonBorderColor,
      ['--call-button-border-hover' as any]: callButtonHoverBorderColor,
      ['--call-button-shadow' as any]: callButtonShadow,
      ['--call-button-shadow-hover' as any]: callButtonShadowHover,
      ['--call-button-text' as any]: callButtonTextColor,
      ['--call-button-outline' as any]: callButtonOutlineColor,
      ['--call-button-icon-bg' as any]: iconBackgroundColor,
      ['--call-button-icon-shadow' as any]: iconShadow
    }),
    [
      callButtonBorderColor,
      callButtonGradient,
      callButtonHoverBorderColor,
      callButtonHoverGradient,
      callButtonOutlineColor,
      callButtonShadow,
      callButtonShadowHover,
      callButtonTextColor,
      iconBackgroundColor,
      iconShadow
    ]
  );

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
  }, [aiCallOngoing, userId, initiateCall]);

  const callButtonLabel = useMemo(() => {
    if (aiCallOngoing) {
      return 'Hang Up';
    }
    if (isCallButtonDisabled) {
      return 'Call Locked';
    }
    return 'Call Zero';
  }, [aiCallOngoing, isCallButtonDisabled]);
  const callButtonIcon = useMemo(
    () => (aiCallOngoing ? 'phone-slash' : 'phone-volume'),
    [aiCallOngoing]
  );
  const callButtonAriaLabel = useMemo(() => {
    if (aiCallOngoing) return 'Hang up the call with Zero';
    if (isCallButtonDisabled)
      return 'AI call limit reached. Zero will be available again tomorrow.';
    return 'Call Zero for voice assistance';
  }, [aiCallOngoing, isCallButtonDisabled]);

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
            right: 0;
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
      <button
        type="button"
        className={callButtonClass}
        style={callButtonStyle}
        aria-disabled={isCallButtonDisabled}
        onClick={handleCallButtonClick}
        onMouseEnter={() => onSetCallButtonHovered(true)}
        onMouseLeave={() => onSetCallButtonHovered(false)}
        onFocus={() => onSetCallButtonHovered(true)}
        onBlur={() => onSetCallButtonHovered(false)}
        aria-label={callButtonAriaLabel}
        title={callButtonAriaLabel}
      >
        <span className="call-button__icon">
          <Icon icon={callButtonIcon} />
        </span>
        <span className="call-button__label">{callButtonLabel}</span>
      </button>
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
