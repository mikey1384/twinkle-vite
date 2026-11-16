import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { COLLECTION_STARTERS, type CollectionStarter } from './collectionStarters';

// Example chips above the start form: what a collection can teach. Picking
// one fills in a name and the job new pictures start with.
export default function CollectionStarterChips({
  selectedKey,
  themeColor = 'logoBlue',
  disabled,
  onSelect
}: {
  selectedKey: string | null;
  themeColor?: string;
  disabled?: boolean;
  onSelect: (starter: CollectionStarter) => void;
}) {
  const themeRole = useRoleColor('button', {
    themeName: themeColor,
    fallback: themeColor
  });
  return (
    <div
      className={chipsCls}
      role="group"
      aria-label="What do you want the AI to keep the same?"
      style={
        {
          '--starter-accent': themeRole.getColor(),
          '--starter-soft': themeRole.getColor(0.1)
        } as React.CSSProperties
      }
    >
      {COLLECTION_STARTERS.map((starter) => {
        const selected = starter.key === selectedKey;
        return (
          <button
            key={starter.key}
            type="button"
            className={chipCls}
            data-selected={selected}
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onSelect(starter)}
          >
            <Icon icon={starter.icon} />
            <span>{starter.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const chipsCls = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 6px;
  }
`;

const chipCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 38px;
  padding: 0 1.1rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: #fff;
  color: #334155;
  font: inherit;
  font-size: 1.4rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
  svg {
    color: var(--starter-accent);
  }
  &:hover:not(:disabled) {
    background: var(--starter-soft);
    border-color: var(--starter-accent);
  }
  &:active:not(:disabled) {
    transform: scale(0.97);
  }
  &[data-selected='true'] {
    background: var(--starter-accent);
    border-color: var(--starter-accent);
    color: #fff;
    svg {
      color: #fff;
    }
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
