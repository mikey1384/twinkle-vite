import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';

interface GuestRestrictionBannerProps {
  visible: boolean;
  userId: number | null;
  message: string;
  onOpenSigninModal: () => void;
  onDismiss: () => void;
}

const guestRestrictionBannerClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-top: 1px solid rgba(120, 77, 0, 0.18);
  background: linear-gradient(180deg, #fff8dc 0%, #fff1b8 100%);
  color: #4f3a00;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const guestRestrictionBannerTextClass = css`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.5;
`;

const guestRestrictionBannerActionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
`;

const guestRestrictionBannerDismissClass = css`
  border: none;
  background: transparent;
  color: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  &:hover {
    text-decoration: underline;
  }
`;

export default function GuestRestrictionBanner({
  visible,
  userId,
  message,
  onOpenSigninModal,
  onDismiss
}: GuestRestrictionBannerProps) {
  if (!visible || userId) {
    return null;
  }

  return (
    <div className={guestRestrictionBannerClass}>
      <div className={guestRestrictionBannerTextClass}>
        <Icon icon="lock" />
        <span>{message}</span>
      </div>
      <div className={guestRestrictionBannerActionsClass}>
        <GameCTAButton variant="success" size="sm" onClick={onOpenSigninModal}>
          Log In
        </GameCTAButton>
        <button
          type="button"
          className={guestRestrictionBannerDismissClass}
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
