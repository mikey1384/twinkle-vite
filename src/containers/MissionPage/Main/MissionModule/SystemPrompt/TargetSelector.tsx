import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ProgressBar from '~/components/ProgressBar';
import { useNavigate } from 'react-router-dom';
import { CHAT_ID_BASE_NUMBER } from '~/constants/defaultValues';
import zero from '~/assets/zero.png';
import ciel from '~/assets/ciel.png';

interface TargetSelectorProps {
  hasPrompt: boolean;
  applyingTarget: 'zero' | 'ciel' | null;
  sending: boolean;
  improving: boolean;
  progress: any;
  hasAiTopic: boolean;
  aiMessageCount: number;
  hasSharedTopic: boolean;
  missionType: string;
  onApplyToAIChat: (target: 'zero' | 'ciel') => void;
  style?: React.CSSProperties;
}

export default function TargetSelector({
  hasPrompt,
  applyingTarget,
  sending,
  improving,
  progress,
  hasAiTopic,
  aiMessageCount,
  hasSharedTopic,
  missionType,
  onApplyToAIChat,
  style
}: TargetSelectorProps) {
  const navigate = useNavigate();
  const appliedTarget = progress?.pendingPromptForChat?.target;
  const appliedChannelId = progress?.pendingPromptForChat?.channelId;

  // Step 2 complete: User has applied prompt and sent 2+ messages
  const step2Complete = hasAiTopic && aiMessageCount >= 2;

  // Shared topic info for navigation
  const sharedTopicId = progress?.sharedTopic?.id;
  const sharedTopicChannelId = progress?.sharedTopic?.channelId;

  // Determine which AI the shared prompt was cloned to
  // If channelIds match, same AI. If different, it's the other AI.
  const sharedTarget =
    sharedTopicChannelId === appliedChannelId
      ? appliedTarget
      : appliedTarget === 'ciel'
      ? 'zero'
      : 'ciel';

  const cardClass = useMemo(
    () =>
      css`
        width: 100%;
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        padding: 1.4rem 1.6rem;
        box-shadow: none;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1.2rem;
        }
      `,
    []
  );

  const handleGoToOwnPromptChat = () => {
    if (!appliedChannelId) return;
    const pathId = Number(appliedChannelId) + Number(CHAT_ID_BASE_NUMBER);
    const appliedTopicId = progress?.pendingPromptForChat?.topicId;
    if (appliedTopicId) {
      navigate(`/chat/${pathId}/topic/${appliedTopicId}`);
    } else {
      navigate(`/chat/${pathId}`);
    }
  };

  const handleGoToSharedChat = () => {
    if (!sharedTopicChannelId || !sharedTopicId) return;
    const pathId = Number(sharedTopicChannelId) + Number(CHAT_ID_BASE_NUMBER);
    navigate(`/chat/${pathId}/topic/${sharedTopicId}`);
  };

  // Calculate message progress for the progress bar
  const messageProgress = Math.min(aiMessageCount, 2);
  const messageProgressPercent = (messageProgress / 2) * 100;

  // Show button to user's own prompt chat (before they clone a shared topic)
  const ownPromptButtonSection =
    !hasSharedTopic && appliedTarget && appliedChannelId ? (
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
              : `Chat with ${appliedTarget === 'zero' ? 'Zero' : 'Ciel'} to see your custom instructions in action.`}
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
      </section>
    ) : null;

  // Show "Browse shared topics" guidance when step 2 complete but shared topic not cloned yet
  const browseSharedTopicsSection =
    step2Complete && !hasSharedTopic ? (
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
  const chatButtonSection =
    hasSharedTopic && sharedTopicChannelId && sharedTopicId ? (
      <section
        className={`${cardClass} ${css`
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          text-align: center;
          border-color: ${Color.logoBlue()};
          background: ${Color.logoBlue(0.03)};
        `}`}
        style={{ marginTop: '1rem' }}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
          `}
        >
          <div
            className={css`
              font-size: 1.3rem;
              font-weight: 700;
              color: ${Color.darkerGray()};
            `}
          >
            Cloned successfully!
          </div>
          <div
            className={css`
              font-size: 1.1rem;
              color: ${Color.gray()};
            `}
          >
            Now chat with your cloned prompt and send a message to complete the
            mission.
          </div>
        </div>

        <Button
          color="logoBlue"
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
              Go to chat
            </span>
            <span style={{ fontWeight: 'bold' }}>
              {progress?.sharedTopic?.title || 'Cloned Topic'}
            </span>
          </div>
          <Icon icon="chevron-right" style={{ marginLeft: '0.5rem' }} />
        </Button>
      </section>
    ) : null;

  return (
    <div style={style}>
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
          <Button
            color="logoBlue"
            variant="soft"
            tone="raised"
            loading={applyingTarget === 'zero'}
            disabled={
              !hasPrompt || applyingTarget === 'ciel' || sending || improving
            }
            onClick={() => onApplyToAIChat('zero')}
          >
            <Icon style={{ marginRight: '0.5rem' }} icon="robot" />
            {applyingTarget === 'zero'
              ? 'Exporting to Zero...'
              : 'Use with Zero'}
          </Button>
          <Button
            color="purple"
            variant="soft"
            tone="raised"
            disabled={
              !hasPrompt || applyingTarget === 'zero' || sending || improving
            }
            loading={applyingTarget === 'ciel'}
            onClick={() => onApplyToAIChat('ciel')}
          >
            <Icon style={{ marginRight: '0.5rem' }} icon="robot" />
            {applyingTarget === 'ciel'
              ? 'Exporting to Ciel...'
              : 'Use with Ciel'}
          </Button>
        </div>
      </section>
      {ownPromptButtonSection}
      {browseSharedTopicsSection}
      {chatButtonSection}
    </div>
  );
}
