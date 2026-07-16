import React from 'react';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import QuickAccessAvatar from './Avatar';
import type { ChatQuickAccessPartner } from './types';
import useQuickAccessPartnerIdentity from './usePartnerIdentity';

export default function QuickAccessPortrait({
  disabled,
  loading,
  partner,
  selected,
  onClick
}: {
  disabled?: boolean;
  loading: boolean;
  partner: ChatQuickAccessPartner;
  selected: boolean;
  onClick: (partner: ChatQuickAccessPartner) => void;
}) {
  const isDisabled = loading || disabled;
  const displayedPartner = useQuickAccessPartnerIdentity(partner);

  return (
    <button
      type="button"
      aria-label={`Open chat with ${displayedPartner.username}`}
      title={displayedPartner.username}
      disabled={isDisabled}
      onClick={() => onClick(displayedPartner)}
      className={css`
        position: relative;
        flex: 0 0 auto;
        width: 3.75rem;
        height: 3.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.125rem;
        border-radius: 50%;
        border: 2px solid ${selected ? Color.logoBlue() : 'transparent'};
        background: #fff;
        cursor: ${isDisabled ? 'default' : 'pointer'};
        opacity: ${isDisabled ? 0.5 : 1};
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          border-color 0.18s ease;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }
      `}
    >
      <QuickAccessAvatar partner={displayedPartner} size="3.25rem" />
      {loading ? (
        <span
          className={css`
            position: absolute;
            inset: 0.125rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.78);
            color: ${Color.black()};
          `}
        >
          <Icon icon="spinner" pulse />
        </span>
      ) : null}
    </button>
  );
}
