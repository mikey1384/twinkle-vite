import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import UsernameText from '~/components/Texts/UsernameText';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

export default function HiddenOffersSection({
  hiddenEntries,
  onUnhideOffer,
  onUserMenuShownChange,
  userId
}: {
  hiddenEntries: {
    price: number;
    user: { id: number; username: string };
    offerId: number;
  }[];
  onUnhideOffer: (offerId: number) => Promise<void>;
  onUserMenuShownChange: (v: boolean) => void;
  userId: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [unhidingId, setUnhidingId] = useState<number | null>(null);
  const { colorKey: userLinkColorKey } = useRoleColor('userLink', {
    fallback: 'logoBlue'
  });
  const userLinkColor =
    userLinkColorKey && userLinkColorKey in Color
      ? userLinkColorKey
      : 'logoBlue';

  return (
    <ErrorBoundary componentPath="components/Modals/AICardModal/Offers/HiddenOffersSection">
      <nav
        className={css`
          padding: 0.5rem 1rem;
          display: flex;
          align-items: center;
          cursor: pointer;
          font-size: 1.3rem;
          color: ${Color.darkGray()};
          border-top: 1px solid var(--ui-border);
          border-bottom: ${expanded ? '1px solid var(--ui-border)' : '0'};
          &:hover {
            background-color: ${Color.highlightGray()};
          }
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.1rem;
          }
        `}
        onClick={() => setExpanded((v) => !v)}
      >
        <Icon icon={expanded ? 'chevron-down' : 'chevron-right'} />
        <span style={{ marginLeft: '0.7rem' }}>
          {hiddenEntries.length} hidden offer
          {hiddenEntries.length > 1 ? 's' : ''}
        </span>
      </nav>
      {expanded &&
        hiddenEntries.map((entry) => (
          <div
            key={entry.offerId}
            className={css`
              padding: 0.7rem 1rem;
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-size: 1.3rem;
              border-bottom: 1px solid var(--ui-border);
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.1rem;
              }
            `}
          >
            <div>
              <Icon style={{ color: Color.brownOrange() }} icon="coins" />
              <span style={{ marginLeft: '0.5rem' }}>
                <b style={{ color: Color.darkerGray() }}>
                  {addCommasToNumber(entry.price)}
                </b>{' '}
                from{' '}
              </span>
              <UsernameText
                onMenuShownChange={onUserMenuShownChange}
                color={Color[userLinkColor]()}
                displayedName={
                  entry.user.id === userId ? 'you' : entry.user.username
                }
                user={{
                  username: entry.user.username,
                  id: entry.user.id
                }}
              />
            </div>
            <Button
              variant="ghost"
              mobilePadding="0.5rem"
              loading={unhidingId === entry.offerId}
              onClick={() => handleUnhide(entry.offerId)}
            >
              <Icon icon="eye" />
              <span style={{ marginLeft: '0.5rem' }}>Unhide</span>
            </Button>
          </div>
        ))}
    </ErrorBoundary>
  );

  async function handleUnhide(offerId: number) {
    setUnhidingId(offerId);
    try {
      await onUnhideOffer(offerId);
    } finally {
      setUnhidingId(null);
    }
  }
}
