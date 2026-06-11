import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { mobileMaxWidth } from '~/constants/css';
import { CURRENT_THREE_VENDOR_VERSION_LABEL } from './helpers/threeVendorUpgrade';

const noticeClass = css`
  border: 2px solid #4f46e5;
  border-radius: 8px;
  background: color-mix(in srgb, #6366f1 10%, #ffffff);
  color: #312e81;
  padding: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  box-shadow: 0 2px 0 rgba(67, 56, 202, 0.16);
  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const copyClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  strong {
    font-size: 1.1rem;
    font-weight: 900;
  }
  span {
    color: #4b5563;
    font-size: 1.1rem;
    font-weight: 800;
    line-height: 1.35;
  }
`;

const actionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const dismissClass = css`
  border: 0;
  background: transparent;
  color: #4338ca;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  &:hover,
  &:focus-visible {
    background: rgba(99, 102, 241, 0.12);
  }
`;

export interface ThreeVendorUpgradeNoticeProps {
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onUpgrade: () => Promise<boolean | void> | boolean | void;
  onDismiss: () => void;
}

export default function ThreeVendorUpgradeNotice({
  className,
  disabled = false,
  loading = false,
  onUpgrade,
  onDismiss
}: ThreeVendorUpgradeNoticeProps) {
  return (
    <div
      className={[noticeClass, className].filter(Boolean).join(' ')}
      aria-live="polite"
    >
      <div className={copyClass}>
        <strong>New Three.js available</strong>
        <span>
          This project uses an older Three.js. Lumine can upgrade it to{' '}
          {CURRENT_THREE_VENDOR_VERSION_LABEL} and check that everything still
          works.
        </span>
      </div>
      <div className={actionsClass}>
        <GameCTAButton
          variant="purple"
          size="sm"
          icon="wand-magic-sparkles"
          shiny
          loading={loading}
          disabled={loading || disabled}
          onClick={handleUpgradeClick}
        >
          Upgrade with Lumine
        </GameCTAButton>
        <button
          type="button"
          className={dismissClass}
          onClick={onDismiss}
          aria-label="Dismiss Three.js upgrade notice"
        >
          Later
        </button>
      </div>
    </div>
  );

  function handleUpgradeClick() {
    void onUpgrade();
  }
}
