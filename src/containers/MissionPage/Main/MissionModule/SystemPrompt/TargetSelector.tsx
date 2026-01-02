import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ProgressBar from '~/components/ProgressBar';
import ScopedTheme from '~/theme/ScopedTheme';
import { useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { CHAT_ID_BASE_NUMBER } from '~/constants/defaultValues';
import zero from '~/assets/zero.png';
import ciel from '~/assets/ciel.png';

const cardClass = css`
  width: 100%;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  padding: 1.4rem 1.6rem;
  box-shadow: none;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.2rem;
  }
`;

interface TargetSelectorProps {
  hasPrompt: boolean;
  applyingTarget: 'zero' | 'ciel' | null;
  sending: boolean;
  improving: boolean;
  generating: boolean;
  progress: any;
  hasAiTopic: boolean;
  aiMessageCount: number;
  hasSharedTopic: boolean;
  missionType: string;
  isMissionPassed?: boolean;
  onApplyToAIChat: (target: 'zero' | 'ciel') => void;
  style?: React.CSSProperties;
}

export default function TargetSelector({
  hasPrompt,
  applyingTarget,
  sending,
  improving,
  generating,
  progress,
  hasAiTopic,
  aiMessageCount,
  hasSharedTopic,
  missionType,
  isMissionPassed,
  onApplyToAIChat,
  style
}: TargetSelectorProps) {
  const navigate = useNavigate();
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const scopedTheme = useMemo(() => profileTheme as any, [profileTheme]);

  const [exportProgress, setExportProgress] = useState<{
    [key: string]: number;
  }>({});
  const progressIntervalRef = useRef<{ [key: string]: number }>({});

  // Progress bar animation for export buttons
  useEffect(() => {
    const targets = ['zero', 'ciel'] as const;
    const currentIntervals = progressIntervalRef.current;
    for (const target of targets) {
      const isApplying = applyingTarget === target;
      if (isApplying && !currentIntervals[target]) {
        setExportProgress((prev) => ({ ...prev, [target]: 0 }));
        currentIntervals[target] = window.setInterval(() => {
          setExportProgress((prev) => {
            const current = prev[target] || 0;
            const increment = current < 50 ? 1.6 : current < 75 ? 1 : 0.5;
            return { ...prev, [target]: Math.min(current + increment, 90) };
          });
        }, 1000);
      } else if (!isApplying && currentIntervals[target]) {
        clearInterval(currentIntervals[target]);
        delete currentIntervals[target];
        setExportProgress((prev) => ({ ...prev, [target]: 0 }));
      }
    }
    return () => {
      for (const target of targets) {
        if (currentIntervals[target]) {
          clearInterval(currentIntervals[target]);
        }
      }
    };
  }, [applyingTarget]);

  const appliedTarget = progress?.pendingPromptForChat?.target;
  const appliedChannelId = progress?.pendingPromptForChat?.channelId;

  const step2Complete = hasAiTopic && aiMessageCount >= 2;

  const sharedTopicId = progress?.sharedTopic?.id;
  const sharedTopicChannelId = progress?.sharedTopic?.channelId;
  const sharedMessageCount = progress?.sharedTopic?.messageCount || 0;

  const sharedTarget =
    sharedTopicChannelId === appliedChannelId
      ? appliedTarget
      : appliedTarget === 'ciel'
      ? 'zero'
      : 'ciel';

  const messageProgress = Math.min(aiMessageCount, 2);
  const messageProgressPercent = (messageProgress / 2) * 100;

  const ownPromptButtonSection =
    !isMissionPassed && !hasSharedTopic && appliedTarget && appliedChannelId ? (
      <section
        className={`${cardClass} ${css`
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          text-align: center;
          border-color: ${appliedTarget === 'zero'
            ? Color.logoBlue()
            : Color.pink()};
          background: ${appliedTarget === 'zero'
            ? Color.logoBlue(0.03)
            : Color.pink(0.03)};
        `}`}
        style={{ marginTop: '1rem' }}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            width: 100%;
          `}
        >
          <div
            className={css`
              font-size: 1.3rem;
              font-weight: 700;
              color: ${Color.darkerGray()};
            `}
          >
            {step2Complete ? (
              <>
                <Icon
                  icon="check-circle"
                  style={{ color: Color.limeGreen(), marginRight: '0.5rem' }}
                />
                Step complete!
              </>
            ) : (
              'Success! Your prompt is ready.'
            )}
          </div>
          <div
            className={css`
              font-size: 1.1rem;
              color: ${Color.gray()};
            `}
          >
            {step2Complete
              ? `You've sent ${aiMessageCount} messages with your custom prompt.`
              : `Chat with ${
                  appliedTarget === 'zero' ? 'Zero' : 'Ciel'
                } to see your custom instructions in action.`}
          </div>
          <div
            className={css`
              width: 100%;
              max-width: 20rem;
              margin-top: 0.5rem;
            `}
          >
            <ProgressBar
              progress={messageProgressPercent}
              color={appliedTarget === 'zero' ? 'logoBlue' : 'pink'}
              text={`${messageProgress}/2 messages`}
            />
          </div>
        </div>

        {!step2Complete && (
          <Button
            color={appliedTarget === 'zero' ? 'logoBlue' : 'purple'}
            variant="solid"
            tone="raised"
            style={{
              padding: '1rem 2rem',
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              borderRadius: '15px'
            }}
            onClick={handleGoToOwnPromptChat}
          >
            <div
              className={css`
                width: 3.5rem;
                height: 3.5rem;
                border-radius: 50%;
                background: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                border: 2px solid rgba(255, 255, 255, 0.5);
              `}
            >
              <img
                src={appliedTarget === 'zero' ? zero : ciel}
                alt={appliedTarget === 'zero' ? 'Zero' : 'Ciel'}
                style={{ width: '85%', height: '85%', objectFit: 'contain' }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}
            >
              <span
                style={{
                  fontSize: '0.9rem',
                  opacity: 0.9,
                  fontWeight: 'normal'
                }}
              >
                Start chatting with
              </span>
              <span style={{ fontWeight: 'bold' }}>
                {appliedTarget === 'zero' ? 'Zero' : 'Ciel'}
              </span>
            </div>
            <Icon icon="chevron-right" style={{ marginLeft: '0.5rem' }} />
          </Button>
        )}
      </section>
    ) : null;

  const browseSharedTopicsSection =
    !isMissionPassed && step2Complete && !hasSharedTopic ? (
      <section
        className={`${cardClass} ${css`
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          border-color: ${Color.logoBlue(0.4)};
          background: ${Color.logoBlue(0.03)};
        `}`}
        style={{ marginTop: '1rem' }}
      >
        <div
          className={css`
            display: flex;
            align-items: flex-start;
            gap: 0.8rem;
          `}
        >
          <Icon
            icon="star"
            style={{
              color: Color.logoBlue(),
              fontSize: '1.8rem',
              marginTop: '0.2rem'
            }}
          />
          <div>
            <div
              className={css`
                font-size: 1.45rem;
                font-weight: 700;
                color: ${Color.darkerGray()};
                margin-bottom: 0.5rem;
              `}
            >
              Next: Browse shared prompts
            </div>
            <div
              className={css`
                font-size: 1.2rem;
                color: ${Color.darkerGray()};
                line-height: 1.6;
              `}
            >
              Great job! Now go to the <strong>Shared Prompts</strong> tab to
              explore what others have created. Clone one to your AI chat and
              send a message to complete the mission.
            </div>
          </div>
        </div>
        <Button
          color="logoBlue"
          variant="soft"
          tone="raised"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.7rem',
            justifyContent: 'center'
          }}
          onClick={() => {
            navigate(`/missions/${missionType}/shared`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Icon icon="users" />
          Browse Shared Prompts
        </Button>
      </section>
    ) : null;

  // Show "Chat with cloned prompt" button when user has cloned a shared topic
  const step3Complete = hasSharedTopic && sharedMessageCount >= 1;
  const sharedProgress = Math.min(sharedMessageCount, 1);
  const sharedProgressPercent = (sharedProgress / 1) * 100;

  const chatButtonSection =
    !isMissionPassed && hasSharedTopic && sharedTopicChannelId && sharedTopicId ? (
      <section
        className={`${cardClass} ${css`
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          text-align: center;
          border-color: ${sharedTarget === 'ciel'
            ? Color.pink()
            : Color.logoBlue()};
          background: ${sharedTarget === 'ciel'
            ? Color.pink(0.03)
            : Color.logoBlue(0.03)};
        `}`}
        style={{ marginTop: '1rem' }}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            width: 100%;
          `}
        >
          <div
            className={css`
              font-size: 1.3rem;
              font-weight: 700;
              color: ${Color.darkerGray()};
            `}
          >
            {step3Complete ? (
              <>
                <Icon
                  icon="check-circle"
                  style={{ color: Color.limeGreen(), marginRight: '0.5rem' }}
                />
                Step complete!
              </>
            ) : (
              'Cloned successfully!'
            )}
          </div>
          <div
            className={css`
              font-size: 1.1rem;
              color: ${Color.gray()};
            `}
          >
            {step3Complete
              ? `You've sent ${sharedMessageCount} message${
                  sharedMessageCount === 1 ? '' : 's'
                } with your cloned prompt.`
              : `Chat with ${
                  sharedTarget === 'ciel' ? 'Ciel' : 'Zero'
                } to see your cloned prompt in action.`}
          </div>
          <div
            className={css`
              width: 100%;
              max-width: 20rem;
              margin-top: 0.5rem;
            `}
          >
            <ProgressBar
              progress={sharedProgressPercent}
              color={sharedTarget === 'ciel' ? 'pink' : 'logoBlue'}
              text={`${sharedProgress}/1 message`}
            />
          </div>
        </div>

        <Button
          color={sharedTarget === 'ciel' ? 'purple' : 'logoBlue'}
          variant="solid"
          tone="raised"
          style={{
            padding: '1rem 2rem',
            fontSize: '1.3rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            borderRadius: '15px'
          }}
          onClick={handleGoToSharedChat}
        >
          <div
            className={css`
              width: 3.5rem;
              height: 3.5rem;
              border-radius: 50%;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              border: 2px solid rgba(255, 255, 255, 0.5);
            `}
          >
            <img
              src={sharedTarget === 'ciel' ? ciel : zero}
              alt={sharedTarget === 'ciel' ? 'Ciel' : 'Zero'}
              style={{ width: '85%', height: '85%', objectFit: 'contain' }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}
          >
            <span
              style={{
                fontSize: '0.9rem',
                opacity: 0.9,
                fontWeight: 'normal'
              }}
            >
              {step3Complete ? 'Continue chatting with' : 'Start chatting with'}
            </span>
            <span style={{ fontWeight: 'bold' }}>
              {progress?.sharedTopic?.title ||
                (sharedTarget === 'ciel' ? 'Ciel' : 'Zero')}
            </span>
          </div>
          <Icon icon="chevron-right" style={{ marginLeft: '0.5rem' }} />
        </Button>
      </section>
    ) : null;

  return (
    <div style={style}>
      {!isMissionPassed && (
        <section
          className={`${cardClass} ${css`
            display: flex;
            flex-direction: column;
            gap: 1rem;
          `}`}
        >
          <div
            className={css`
              display: flex;
              gap: 0.8rem;
              flex-wrap: wrap;
            `}
          >
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: 0.4rem;
              `}
            >
              <Button
                color="logoBlue"
                variant="solid"
                tone="raised"
                loading={applyingTarget === 'zero'}
                disabled={
                  !hasPrompt ||
                  applyingTarget === 'ciel' ||
                  sending ||
                  improving ||
                  generating
                }
                onClick={() => onApplyToAIChat('zero')}
              >
                <img
                  src={zero}
                  alt="Zero"
                  className={css`
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    margin-right: 0.5rem;
                    object-fit: contain;
                    background: #fff;
                  `}
                />
                {applyingTarget === 'zero'
                  ? 'Exporting to Zero...'
                  : 'Use with Zero'}
              </Button>
              {applyingTarget === 'zero' && (
                <ScopedTheme theme={scopedTheme} roles={['cloneProgress']}>
                  <div
                    className={css`
                      width: 100%;
                      height: 4px;
                      background: ${Color.highlightGray()};
                      border-radius: 2px;
                      overflow: hidden;
                    `}
                  >
                    <div
                      className={css`
                        height: 100%;
                        background: var(
                          --role-cloneProgress-color,
                          ${Color.logoBlue()}
                        );
                        border-radius: 2px;
                        transition: width 0.3s ease-out;
                      `}
                      style={{ width: `${exportProgress.zero || 0}%` }}
                    />
                  </div>
                </ScopedTheme>
              )}
            </div>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: 0.4rem;
              `}
            >
              <Button
                color="purple"
                variant="solid"
                tone="raised"
                disabled={
                  !hasPrompt ||
                  applyingTarget === 'zero' ||
                  sending ||
                  improving ||
                  generating
                }
                loading={applyingTarget === 'ciel'}
                onClick={() => onApplyToAIChat('ciel')}
              >
                <img
                  src={ciel}
                  alt="Ciel"
                  className={css`
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    margin-right: 0.5rem;
                    object-fit: contain;
                    background: #fff;
                  `}
                />
                {applyingTarget === 'ciel'
                  ? 'Exporting to Ciel...'
                  : 'Use with Ciel'}
              </Button>
              {applyingTarget === 'ciel' && (
                <ScopedTheme theme={scopedTheme} roles={['cloneProgress']}>
                  <div
                    className={css`
                      width: 100%;
                      height: 4px;
                      background: ${Color.highlightGray()};
                      border-radius: 2px;
                      overflow: hidden;
                    `}
                  >
                    <div
                      className={css`
                        height: 100%;
                        background: var(
                          --role-cloneProgress-color,
                          ${Color.logoBlue()}
                        );
                        border-radius: 2px;
                        transition: width 0.3s ease-out;
                      `}
                      style={{ width: `${exportProgress.ciel || 0}%` }}
                    />
                  </div>
                </ScopedTheme>
              )}
            </div>
          </div>
        </section>
      )}
      {ownPromptButtonSection}
      {browseSharedTopicsSection}
      {chatButtonSection}
    </div>
  );

  function handleGoToOwnPromptChat() {
    if (!appliedChannelId) return;
    const pathId = Number(appliedChannelId) + Number(CHAT_ID_BASE_NUMBER);
    const appliedTopicId = progress?.pendingPromptForChat?.topicId;
    if (appliedTopicId) {
      navigate(`/chat/${pathId}/topic/${appliedTopicId}`);
    } else {
      navigate(`/chat/${pathId}`);
    }
  }

  function handleGoToSharedChat() {
    if (!sharedTopicChannelId || !sharedTopicId) return;
    const pathId = Number(sharedTopicChannelId) + Number(CHAT_ID_BASE_NUMBER);
    navigate(`/chat/${pathId}/topic/${sharedTopicId}`);
  }
}
