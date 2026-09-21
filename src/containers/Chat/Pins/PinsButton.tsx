import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useChatPins } from './context';

export default function PinsButton() {
  const pins = useChatPins();
  if (!pins) return null;
  const total = pins.snapshot?.total || 0;
  return (
    <Button
      variant="ghost"
      aria-label={`Pinned messages${total ? ` (${total})` : ''}`}
      aria-expanded={pins.dialogShown}
      onClick={pins.showDialog}
      className={css`
        position: relative;
        flex: 0 0 4rem;
        width: 4rem;
        min-height: 4rem;
        margin-right: 0.4rem;
        color: var(--chat-text, #273449);
      `}
    >
      <Icon icon={total ? 'thumbtack' : ['far', 'thumbtack']} />
    </Button>
  );
}
