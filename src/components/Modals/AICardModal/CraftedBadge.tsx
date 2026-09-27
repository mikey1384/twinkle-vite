import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';

// A card crafted in an app (Twinkle.cardCraft) says so on its page. The app
// name and link show only while the app is public; a deleted app frees the
// card, so its badge simply disappears.

export interface CardCraftBadge {
  cardId: number;
  buildId: number | null;
  appTitle: string | null;
  kind: string;
  name: string;
  craftedAt: number;
}

export function useCardCraftBadge(cardId: number) {
  const loadCardCraftBadges = useAppContext(
    (v) => v.requestHelpers.loadCardCraftBadges
  );
  const [badge, setBadge] = useState<CardCraftBadge | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBadge(null);
    if (!cardId) return;
    load();
    async function load() {
      try {
        const badges: CardCraftBadge[] = await loadCardCraftBadges([cardId]);
        if (!cancelled) {
          setBadge(
            badges.find((entry) => Number(entry.cardId) === cardId) || null
          );
        }
      } catch {
        // Optional decoration; the server still enforces once per card.
      }
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  return badge;
}

export function craftedAssetPlace(badge: CardCraftBadge) {
  return badge.appTitle ? badge.appTitle : 'the app it was crafted in';
}

export default function CraftedBadge({
  badge,
  isBurned,
  onNavigate
}: {
  badge: CardCraftBadge;
  isBurned: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className={badgeClass}>
      <Icon className="icon" icon="wand-magic-sparkles" />
      <span>
        {isBurned ? 'Was crafted into ' : 'Crafted into '}
        <b>{badge.name}</b>
        {badge.buildId && badge.appTitle ? (
          <>
            {' in '}
            <Link to={`/app/${badge.buildId}`} onClick={onNavigate}>
              {badge.appTitle}
            </Link>
          </>
        ) : null}
      </span>
    </div>
  );
}

const badgeClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  margin-top: 1.2rem;
  padding: 0.8rem 1.1rem;
  border: 1px solid ${Color.gold(0.6)};
  border-radius: ${borderRadius};
  background: ${Color.ivory()};
  color: ${Color.darkerGray()};
  font-size: 1.3rem;
  line-height: 1.45;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  .icon {
    margin-top: 0.25rem;
    color: ${Color.gold()};
  }
  b {
    color: ${Color.black()};
  }
  a {
    font-weight: bold;
    color: ${Color.logoBlue()};
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.1rem;
    padding: 0.6rem 0.8rem;
  }
`;
