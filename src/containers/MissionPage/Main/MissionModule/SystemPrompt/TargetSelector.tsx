import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

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

  return (
    <section
      className={`${cardClass} ${css`
        display: flex;
        flex-direction: column;
        gap: 1rem;
      `}`}
      style={style}
    >
      <div className={sectionHeaderClass}>
        <div className={labelClass}>Use with Zero or Ciel</div>
        <small
          style={{
            color: Color.darkerGray()
          }}
        >
          {progress?.pendingPromptForChat?.target
            ? `Exported to ${progress.pendingPromptForChat.target.toUpperCase()} chat (topic ${
                progress.pendingPromptForChat.topicId || ''
              })`
            : 'Apply this prompt directly to an AI chat'}
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
        We’ll tag the AI topic with this prompt so mission progress only counts
        when you chat in that topic.
      </small>
    </section>
  );
}
