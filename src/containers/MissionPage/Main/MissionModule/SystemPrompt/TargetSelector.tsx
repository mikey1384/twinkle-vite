import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
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
  onApplyToAIChat: (target: 'zero' | 'ciel') => void;
  style?: React.CSSProperties;
}

export default function TargetSelector({
  hasPrompt,
  applyingTarget,
  sending,
  improving,
  progress,
  onApplyToAIChat,
  style
}: TargetSelectorProps) {
  const navigate = useNavigate();
  const appliedTarget = progress?.pendingPromptForChat?.target;
  const appliedChannelId = progress?.pendingPromptForChat?.channelId;

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

  const labelClass = useMemo(
    () =>
      css`
        font-size: 1.45rem;
        font-weight: 700;
        color: ${Color.darkerGray()};
      `,
    []
  );

  const sectionHeaderClass = useMemo(
    () =>
      css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      `,
    []
  );

  const handleGoToChat = () => {
    if (!appliedChannelId) return;
    const pathId = Number(appliedChannelId) + Number(CHAT_ID_BASE_NUMBER);
    navigate(`/chat/${pathId}`);
  };

  const successSection =
    appliedTarget && appliedChannelId ? (
      <>
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
            box-shadow: 0 0 10px
              ${appliedTarget === 'zero'
                ? 'rgba(64, 152, 255, 0.15)'
                : 'rgba(255, 105, 180, 0.15)'};
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
              Success! Your prompt is ready.
            </div>
            <div
              className={css`
                font-size: 1.1rem;
                color: ${Color.gray()};
              `}
            >
              Chat with {appliedTarget === 'zero' ? 'Zero' : 'Ciel'} to see your
              custom instructions in action.
            </div>
          </div>

          <Button
            color={appliedTarget === 'zero' ? 'logoBlue' : 'purple'}
            filled
            style={{
              padding: '1rem 2rem',
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              borderRadius: '15px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
            }}
            onClick={handleGoToChat}
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
      </>
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
        <div className={sectionHeaderClass}>
          <div className={labelClass}>Use with Zero or Ciel</div>
          <small
            style={{
              color: Color.darkerGray()
            }}
          >
            Apply this prompt directly to an AI chat
          </small>
        </div>
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
            disabled={
              !hasPrompt || applyingTarget === 'ciel' || sending || improving
            }
            onClick={() => onApplyToAIChat('zero')}
          >
            {applyingTarget === 'zero' ? (
              <>
                <Icon style={{ marginRight: '0.5rem' }} icon="spinner" pulse />
                Exporting to Zero...
              </>
            ) : (
              <>
                <Icon style={{ marginRight: '0.5rem' }} icon="robot" />
                Use with Zero
              </>
            )}
          </Button>
          <Button
            color="purple"
            variant="soft"
            tone="raised"
            disabled={
              !hasPrompt || applyingTarget === 'zero' || sending || improving
            }
            onClick={() => onApplyToAIChat('ciel')}
          >
            {applyingTarget === 'ciel' ? (
              <>
                <Icon style={{ marginRight: '0.5rem' }} icon="spinner" pulse />
                Exporting to Ciel...
              </>
            ) : (
              <>
                <Icon style={{ marginRight: '0.5rem' }} icon="robot" />
                Use with Ciel
              </>
            )}
          </Button>
        </div>
        <small
          style={{
            color: Color.gray(),
            lineHeight: 1.4
          }}
        >
          We’ll tag the AI topic with this prompt so mission progress only
          counts when you chat in that topic.
        </small>
      </section>
      {successSection}
    </div>
  );
}
