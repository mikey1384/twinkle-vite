import React, { useMemo, useState, useCallback } from 'react';
import ZeroPic from '~/components/ZeroPic';
import CallPartnerChooser from './CallPartnerChooser';
import {
  startAiVoiceCall,
  type HomeCallAssistant
} from '~/helpers/aiVoiceCall';
import { css } from '@emotion/css';
import {
  getAiEnergyDisplay,
  type AiEnergyDisplayPolicy
} from '~/helpers/aiEnergyDisplay';
import { socket } from '~/constants/sockets/api';
import {
  useAppContext,
  useChatContext,
  useNotiContext,
  useKeyContext,
  useViewContext
} from '~/contexts';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import {
  buildTodayStatsFromResponse,
  checkMicrophoneAccess,
  toValidNextDayTimeStamp
} from '~/helpers';
import MicrophoneAccessModal from '~/components/Modals/MicrophoneAccessModal';
import NextDayCountdown from '~/components/NextDayCountdown';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

interface AiUsagePolicy extends AiEnergyDisplayPolicy {
  hasVerifiedEmail?: boolean;
  identityType?: 'verified_email' | 'separate_verified_email' | 'user';
  isLegacyUnverifiedIdentity?: boolean;
  energyPercent?: number;
  energyRemaining?: number;
  energySegments?: number;
  currentMode?: string;
}

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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 0.8rem 0.6rem;
  width: 100%;
  border-radius: 0;
  border: 0;
  background: transparent;
  color: var(--call-button-text, ${Color.white()});
  box-shadow: none;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease,
    filter 0.25s ease;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.02em;
  z-index: 3;
  backdrop-filter: blur(4px);
  isolation: isolate;
  overflow: hidden;

  .call-button__icon {
    width: 2.8rem;
    height: 2.8rem;
    flex-shrink: 0;
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
    font-size: 1.15rem;
    color: inherit;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    letter-spacing: 0.12em;
    white-space: nowrap;
    text-transform: uppercase;
  }

  &:hover:not([aria-disabled='true']) {
    background: var(--call-button-bg-hover, var(--call-button-bg));
    border-color: var(--call-button-border-hover, var(--call-button-border));
    box-shadow: var(--call-button-shadow-hover, var(--call-button-shadow));
  }

  &:focus-visible {
    outline: 3px solid var(--call-button-outline, ${Color.logoBlue(0.5)});
    outline-offset: 3px;
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
    background: linear-gradient(
      135deg,
      ${Color.borderGray(0.4)} 0%,
      ${Color.borderGray()} 100%
    );
    border-color: var(--ui-border);
    box-shadow: none;
    color: ${Color.gray()};
  }

  &[aria-disabled='true'] .call-button__icon {
    background: rgba(255, 255, 255, 0.35);
    color: ${Color.gray()};
    box-shadow: none;
  }

  /* Mobile uses the same design as desktop */
`;

export default function CallZero({
  callButtonHovered,
  onSetCallButtonHovered,
  callChannelId,
  assistantName,
  onChooseAssistant,
  onSetCallSetupActive,
  onSetCallMenuShown,
  callConnecting,
  onSetCallConnecting,
  aiCallOngoing
}: {
  callButtonHovered: boolean;
  onSetCallButtonHovered: (value: boolean) => void;
  callChannelId: number | null;
  assistantName: HomeCallAssistant;
  onChooseAssistant: (assistant: HomeCallAssistant) => void;
  onSetCallSetupActive: (active: boolean) => void;
  onSetCallMenuShown: (shown: boolean) => void;
  callConnecting: boolean;
  onSetCallConnecting: (connecting: boolean) => void;
  aiCallOngoing: boolean;
}) {
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const aiFeaturesLoaded = useViewContext((v) => v.state.aiFeaturesLoaded);
  const userId = useKeyContext((v) => v.myState.userId);
  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
  const getCurrentNextDayTimeStamp = useAppContext(
    (v) => v.requestHelpers.getCurrentNextDayTimeStamp
  );
  const fetchTodayStats = useAppContext(
    (v) => v.requestHelpers.fetchTodayStats
  );
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const onHydrateTodayStats = useNotiContext(
    (v) => v.actions.onHydrateTodayStats
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const aiUsagePolicy = useNotiContext(
    (v) => v.state.todayStats?.aiUsagePolicy
  ) as AiUsagePolicy | null;
  const nextDayTimeStamp = useNotiContext(
    (v) => v.state.todayStats.nextDayTimeStamp
  );
  const onSetAICallEnding = useChatContext((v) => v.actions.onSetAICallEnding);
  const aiCallEnding = useChatContext((v) => v.state.aiCallEnding);
  const actionRole = useRoleColor('action', { fallback: 'green' });

  const [microphoneModalShown, setMicrophoneModalShown] = useState(false);
  const [callError, setCallError] = useState('');
  const [partnerMenuShown, setPartnerMenuShown] = useState(false);

  const energyDisplay = getAiEnergyDisplay(aiUsagePolicy);
  const batteryLevel = energyDisplay.percent ?? 0;

  const energySegments = useMemo(() => {
    return Math.max(1, aiUsagePolicy?.energySegments || 5);
  }, [aiUsagePolicy?.energySegments]);

  const visualSegmentFill = useMemo(() => {
    return (batteryLevel / 100) * energySegments;
  }, [batteryLevel, energySegments]);

  const isCallButtonLoading = useMemo(() => {
    if (!userId || aiCallOngoing || aiCallEnding) return false;
    if (!aiFeaturesLoaded) return true;
    if (AI_FEATURES_DISABLED) return false;
    return callConnecting || !callChannelId;
  }, [
    AI_FEATURES_DISABLED,
    aiCallEnding,
    aiCallOngoing,
    aiFeaturesLoaded,
    userId,
    callChannelId,
    callConnecting
  ]);

  const hasReachedDailyLimit = useMemo(() => {
    if (isAdmin) return false;
    if (!aiUsagePolicy) return false;
    return (
      typeof aiUsagePolicy.energyRemaining === 'number' &&
      aiUsagePolicy.energyRemaining <= 0
    );
  }, [aiUsagePolicy, isAdmin]);

  const isCallButtonUnavailable = useMemo(() => {
    if (aiCallEnding) return true;
    if (aiCallOngoing) return false;
    return (
      (aiFeaturesLoaded && AI_FEATURES_DISABLED) ||
      isCallButtonLoading ||
      aiCallEnding ||
      hasReachedDailyLimit
    );
  }, [
    AI_FEATURES_DISABLED,
    aiCallEnding,
    aiCallOngoing,
    aiFeaturesLoaded,
    hasReachedDailyLimit,
    isCallButtonLoading
  ]);

  const showCallInfoPanel = useMemo(() => {
    return (
      callButtonHovered ||
      partnerMenuShown ||
      aiCallOngoing ||
      isCallButtonLoading ||
      aiCallEnding ||
      hasReachedDailyLimit
    );
  }, [
    aiCallEnding,
    aiCallOngoing,
    callButtonHovered,
    partnerMenuShown,
    hasReachedDailyLimit,
    isCallButtonLoading
  ]);

  const getCallQuotaMessage = useMemo(() => {
    if (!hasReachedDailyLimit) return '';
    return 'Recharge AI Energy or come back tomorrow.';
  }, [hasReachedDailyLimit]);

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

  const initiateCall = useCallback(async () => {
    if (!callChannelId || callConnecting) return;
    setCallError('');
    onSetCallConnecting(true);
    try {
      await startAiVoiceCall(callChannelId);
    } catch (error) {
      setCallError(
        error instanceof Error
          ? error.message
          : 'Unable to start the call. Please try again.'
      );
    } finally {
      onSetCallConnecting(false);
    }
  }, [callChannelId, callConnecting, onSetCallConnecting]);

  const handleCallButtonClick = useCallback(async () => {
    if (aiCallEnding || (isCallButtonUnavailable && !aiCallOngoing)) {
      return;
    }

    if (aiCallOngoing) {
      onSetAICallEnding(true);
      socket.emit('ai_end_ai_voice_conversation');
      return;
    }

    if (!userId) {
      onOpenSigninModal();
      return;
    }
    onSetCallSetupActive(true);
    try {
      const hasAccess = await checkMicrophoneAccess();
      if (hasAccess) {
        await initiateCall();
        onSetCallSetupActive(false);
      } else {
        setMicrophoneModalShown(true);
      }
    } catch (error) {
      onSetCallSetupActive(false);
      setCallError(
        error instanceof Error
          ? error.message
          : 'Unable to access the microphone.'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    aiCallEnding,
    aiCallOngoing,
    isCallButtonUnavailable,
    userId,
    initiateCall
  ]);

  const callButtonLabel = useMemo(() => {
    if (aiCallEnding) return 'Ending...';
    if (aiCallOngoing) {
      return 'Hang Up';
    }
    if (isCallButtonLoading) {
      return 'Calling...';
    }
    if (aiFeaturesLoaded && AI_FEATURES_DISABLED) {
      return 'Call Unavailable';
    }
    if (hasReachedDailyLimit) {
      return 'No Energy';
    }
    return `Call ${assistantName}`;
  }, [
    AI_FEATURES_DISABLED,
    aiCallEnding,
    aiCallOngoing,
    aiFeaturesLoaded,
    hasReachedDailyLimit,
    isCallButtonLoading,
    assistantName
  ]);
  const callButtonIcon = useMemo(
    () =>
      aiCallEnding || isCallButtonLoading
        ? 'spinner'
        : aiCallOngoing
          ? 'phone-slash'
          : 'phone-volume',
    [aiCallEnding, aiCallOngoing, isCallButtonLoading]
  );
  const callButtonAriaLabel = useMemo(() => {
    if (aiCallEnding) return `Ending the call with ${assistantName}`;
    if (aiCallOngoing) return `Hang up the call with ${assistantName}`;
    if (isCallButtonLoading) return `Connecting to ${assistantName}`;
    if (aiFeaturesLoaded && AI_FEATURES_DISABLED) {
      return `${assistantName} voice calls are unavailable.`;
    }
    if (hasReachedDailyLimit) {
      return 'AI Energy is empty. Recharge or come back tomorrow.';
    }
    return `Call ${assistantName} for voice assistance`;
  }, [
    AI_FEATURES_DISABLED,
    aiCallEnding,
    aiCallOngoing,
    aiFeaturesLoaded,
    hasReachedDailyLimit,
    isCallButtonLoading,
    assistantName
  ]);

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
      onMouseLeave={() => {
        if (!partnerMenuShown) onSetCallButtonHovered(false);
      }}
      onFocusCapture={() => onSetCallButtonHovered(true)}
      onBlurCapture={(event) => {
        if (
          !partnerMenuShown &&
          !event.currentTarget.contains(event.relatedTarget as Node)
        )
          onSetCallButtonHovered(false);
      }}
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
          opacity: ${showCallInfoPanel ? 1 : 0};
          transition: opacity 0.3s ease-in-out;
        `}
      >
        {hasReachedDailyLimit ? (
          <>
            <h2
              className={css`
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: ${Color.rose()};
              `}
            >
              AI Energy Empty
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
                Energy refills in:
              </p>
              <NextDayCountdown
                inline
                nextDayTimeStamp={nextDayTimeStamp}
                onComplete={handleCountdownComplete}
                timerClassName={css`
                  font-size: 1.3rem;
                  color: ${Color.darkBlue()};
                  font-weight: 600;
                `}
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
              {assistantName}: Your AI Friend on Twinkle
            </h2>
            <p
              className={css`
                font-size: 1.1rem;
                line-height: 1.6;
                margin-bottom: 1rem;
              `}
            >
              {`${assistantName} can help you navigate Twinkle and understand the features of the website.`}
            </p>
            <p
              className={css`
                font-size: 1.1rem;
                line-height: 1.6;
              `}
            >
              {`Practice a language together, or ask ${assistantName} about what's on your Twinkle screen.`}
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
        <ZeroPic assistant={assistantName} />
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
                display: grid;
                grid-template-columns: repeat(${energySegments}, 1fr);
                gap: 4px;
              `}
            >
              {Array.from({ length: energySegments }).map((_, index) => {
                const fillRatio = Math.max(
                  0,
                  Math.min(1, visualSegmentFill - index)
                );
                return (
                  <span
                    key={index}
                    className={css`
                      position: relative;
                      height: 100%;
                      overflow: hidden;
                      border-radius: 8px;
                      background-color: rgba(255, 255, 255, 0.55);
                    `}
                  >
                    {fillRatio > 0 && (
                      <span
                        className={css`
                          position: absolute;
                          top: 0;
                          bottom: 0;
                          left: 0;
                          width: ${fillRatio * 100}%;
                          border-radius: inherit;
                          background-color: #4caf50;
                          transition: width 0.3s ease-in-out;
                        `}
                      />
                    )}
                  </span>
                );
              })}
            </div>
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
                font-size: 1.1rem;
              `}
            >
              AI Energy: {energyDisplay.label}
            </div>
          </div>
        </div>
      )}
      {callError && (
        <p
          role="alert"
          className={css`
            position: absolute;
            bottom: 0.5rem;
            left: 1rem;
            right: 8rem;
            z-index: 4;
            padding: 0.5rem;
            background: white;
            font-size: 1.1rem;
            color: ${Color.rose()};
          `}
        >
          {callError}
        </p>
      )}
      <div
        style={callButtonStyle}
        onMouseEnter={() => onSetCallButtonHovered(true)}
        className={css`
          position: absolute;
          top: 0.8rem;
          bottom: 0.8rem;
          right: 1.4rem;
          width: 5.6rem;
          z-index: 3;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--call-button-border, transparent);
          border-radius: 12px;
          overflow: hidden;
          background: var(--call-button-bg);
          color: var(--call-button-text);
          box-shadow: var(--call-button-shadow);
          transition:
            box-shadow 0.25s ease,
            background 0.25s ease;
        `}
      >
        <button
          type="button"
          className={callButtonClass}
          aria-disabled={isCallButtonUnavailable}
          onClick={handleCallButtonClick}
          aria-label={callButtonAriaLabel}
          title={callButtonAriaLabel}
        >
          <span className="call-button__icon">
            <Icon icon={callButtonIcon} spin={callButtonIcon === 'spinner'} />
          </span>
          <span className="call-button__label">{callButtonLabel}</span>
        </button>
        <CallPartnerChooser
          value={assistantName}
          disabled={aiCallOngoing || aiCallEnding || callConnecting}
          onChange={(assistant) => {
            setCallError('');
            onChooseAssistant(assistant);
          }}
          onOpenChange={(shown) => {
            setPartnerMenuShown(shown);
            onSetCallMenuShown(shown);
            onSetCallButtonHovered(shown);
          }}
        />
      </div>
      <MicrophoneAccessModal
        isShown={microphoneModalShown}
        onHide={() => {
          setMicrophoneModalShown(false);
          onSetCallSetupActive(false);
        }}
        onSuccess={() => {
          setMicrophoneModalShown(false);
          void initiateCall().finally(() => onSetCallSetupActive(false));
        }}
      />
    </div>
  );

  async function handleCountdownComplete() {
    const newNextDayTimeStamp = toValidNextDayTimeStamp(
      await getCurrentNextDayTimeStamp()
    );
    if (newNextDayTimeStamp === null) {
      console.error('Failed to resolve next day timestamp for call rollover');
      return;
    }
    // The time endpoint confirms only the next boundary, not a refill or
    // reset daily rewards. Keep the last balance until stats arrive.
    onUpdateTodayStats({ newStats: { nextDayTimeStamp: newNextDayTimeStamp } });
    if (!userId) return;
    try {
      const todayStatsFromServer = await fetchTodayStats();
      onHydrateTodayStats({
        todayStats: buildTodayStatsFromResponse(todayStatsFromServer)
      });
    } catch (error) {
      console.error('Failed to refresh today stats after rollover:', error);
    }
  }
}
