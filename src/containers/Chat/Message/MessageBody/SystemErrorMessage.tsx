import React from 'react';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function SystemErrorMessage({
  error: _error,
  errorType,
  canDelete = false,
  onDelete,
  aiName = 'the AI assistant'
}: {
  error?: string;
  errorType?: 'moderation' | 'general' | 'declined' | 'output_limit';
  canDelete?: boolean;
  onDelete?: () => void;
  aiName?: string;
} = {}) {
  if (errorType === 'declined') {
    return (
      <DeclinedNotice
        aiName={aiName}
        onDelete={canDelete ? onDelete : undefined}
      />
    );
  }
  const isModeration = errorType === 'moderation';
  // Every attempt used its whole reply allowance thinking and wrote nothing:
  // the request was too long or complex for one reply.
  const isOutputLimit = errorType === 'output_limit';
  const getColors = () => {
    // Moderation errors use neutral gray - not associated with any AI
    if (isModeration) {
      return {
        background: Color.darkerGray(0.08),
        border: Color.darkerGray(0.3),
        icon: Color.darkerGray(),
        text: Color.darkerGray()
      };
    }
    if (aiName === 'Ciel') {
      return {
        background: Color.pink(0.08),
        border: Color.pink(0.3),
        icon: Color.pink(),
        text: Color.pink()
      };
    } else if (aiName === 'Zero') {
      return {
        background: Color.logoBlue(0.08),
        border: Color.logoBlue(0.3),
        icon: Color.logoBlue(),
        text: Color.logoBlue()
      };
    } else {
      return {
        background: Color.orange(0.08),
        border: Color.orange(0.3),
        icon: Color.orange(),
        text: Color.orange()
      };
    }
  };

  const colors = getColors();

  return (
    <div
      style={{
        margin: '1rem 0',
        padding: '1.5rem',
        backgroundColor: colors.background,
        borderTop: `1px solid ${colors.border}`,
        borderBottom: `1px solid ${colors.border}`,
        textAlign: 'center',
        fontFamily: "'Comic Sans MS', sans-serif",
        position: 'relative'
      }}
    >
      {canDelete && onDelete && (
        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
          <Button
            variant="ghost"
            onClick={onDelete}
            style={{
              fontSize: '1.2rem',
              padding: '0.3rem',
              color: Color.darkerGray(),
              opacity: 0.7
            }}
          >
            <Icon icon="times" />
          </Button>
        </div>
      )}
      <div style={{ marginBottom: '0.5rem' }}>
        <Icon
          icon={isModeration ? 'shield-alt' : 'robot'}
          style={{
            color: colors.icon,
            fontSize: '2rem',
            opacity: 0.7
          }}
        />
      </div>
      <div
        style={{
          fontWeight: 'bold',
          color: colors.text,
          fontSize: '1.4rem',
          marginBottom: '0.5rem'
        }}
      >
        {isModeration
          ? "This message couldn't be processed"
          : isOutputLimit
            ? `This request was too long for ${aiName} to finish in one reply`
            : `Oops, there seems to have been an error while talking with ${aiName}`}
      </div>
      <div
        style={{
          color: Color.darkerGray(),
          fontSize: '1.1rem',
          lineHeight: 1.4
        }}
      >
        {isModeration
          ? 'Please try rephrasing your question differently'
          : isOutputLimit
            ? 'Try sending it in smaller parts'
            : `Try sending ${aiName === 'Zero' ? 'him' : aiName === 'Ciel' ? 'her' : 'them'} another message and if this keeps happening tell mikey`}
      </div>
    </div>
  );
}

// Every model declined the reply, the final backup included. A small system
// note in the site's voice, never words from Zero or Ciel.
function DeclinedNotice({
  aiName,
  onDelete
}: {
  aiName: string;
  onDelete?: () => void;
}) {
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        margin: 0.6rem 0;
        padding: 0 1rem;
        color: var(--chat-muted-text, #64748b);
        font-size: 1.25rem;
        line-height: 1.4;
        text-align: center;
      `}
      role="note"
    >
      <Icon icon="info-circle" style={{ opacity: 0.7, flexShrink: 0 }} />
      <span>
        {aiName} couldn&rsquo;t answer this one. Try asking another way.
      </span>
      {onDelete && (
        <Button
          variant="ghost"
          onClick={onDelete}
          aria-label="Remove this note"
          style={{
            fontSize: '1.1rem',
            padding: '0.2rem 0.4rem',
            color: 'var(--chat-muted-text, #64748b)',
            opacity: 0.7
          }}
        >
          <Icon icon="times" />
        </Button>
      )}
    </div>
  );
}
