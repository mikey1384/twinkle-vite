import React from 'react';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { Color } from '~/constants/css';

export default function SystemErrorMessage({
  error: _error,
  canDelete = false,
  onDelete,
  aiName = 'the AI assistant'
}: {
  error?: string;
  canDelete?: boolean;
  onDelete?: () => void;
  aiName?: string;
} = {}) {
  const getColors = () => {
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
        fontFamily: "'Comic Sans MS', cursive, sans-serif",
        position: 'relative'
      }}
    >
      {canDelete && onDelete && (
        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
          <Button
            transparent
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
          icon="robot"
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
        Oops, there seems to have been an error while talking with {aiName}
      </div>
      <div
        style={{
          color: Color.darkerGray(),
          fontSize: '1.1rem',
          lineHeight: 1.4
        }}
      >
        Try sending{' '}
        {aiName === 'Zero' ? 'him' : aiName === 'Ciel' ? 'her' : 'them'} another
        message and if this keeps happening tell mikey
      </div>
    </div>
  );
}
