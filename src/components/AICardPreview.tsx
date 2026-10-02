import React from 'react';
import { css } from '@emotion/css';
import AICardDetails from '~/components/AICardDetails';
import AICardMarketDetails from '~/components/AICardMarketDetails';
import { Color, mobileMaxWidth } from '~/constants/css';
import { Card, User } from '~/types';

export default function AICardPreview({
  card,
  artwork,
  summoner,
  density = 'preview',
  framed = true,
  style,
  onClick
}: {
  card: Partial<Card>;
  artwork: React.ReactNode;
  summoner?: User;
  density?: 'preview' | 'target';
  framed?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View card #${card.id}` : undefined}
      className={`${compactPreviewClass} compact-ai-card-preview${density === 'target' ? ' compact-ai-card-preview--target' : ''}`}
      style={{
        ...style,
        border: framed ? undefined : 0,
        cursor: onClick ? 'pointer' : undefined
      }}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      <div className="compact-ai-card-preview__card-stage">{artwork}</div>
      <AICardDetails
        className="compact-ai-card-preview__details"
        card={card}
        density={density}
        showIdentity
      />
      <AICardMarketDetails card={card} summoner={summoner} />
    </div>
  );

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    // Owner menus render in a portal, outside this preview's DOM subtree.
    if (!event.currentTarget.contains(event.target as Node)) return;
    event.stopPropagation();
    onClick?.();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (
      event.target === event.currentTarget &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      event.stopPropagation();
      onClick?.();
    }
  }
}

const compactPreviewClass = css`
  appearance: none;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(10rem, 0.82fr) minmax(0, 1.42fr) minmax(
      8.8rem,
      0.58fr
    );
  align-items: stretch;
  gap: 1.35rem;
  width: 100%;
  height: 100%;
  min-height: 16.5rem;
  padding: 1.15rem 1.35rem;
  --ai-card-preview-art-width: clamp(9rem, 12vw, 10.6rem);
  --ai-card-preview-art-height: clamp(12.8rem, 16.9vw, 14.8rem);
  overflow: hidden;
  border: 1px solid ${Color.borderGray()};
  border-radius: 0.9rem;
  background: #fff;
  color: ${Color.darkerGray()};
  font: inherit;
  text-align: left;
  cursor: inherit;

  .compact-ai-card-thumb--static {
    cursor: pointer;
  }

  .compact-ai-card-preview__card-stage {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    border-radius: 0.7rem;
    background: #fff;
  }

  .compact-ai-card-preview__card-stage .compact-ai-card-thumb--static {
    width: var(--ai-card-preview-art-width);
    height: var(--ai-card-preview-art-height);
    box-shadow:
      0 0 0.55rem var(--compact-ai-card-quality),
      0 0.75rem 1.15rem -0.75rem rgba(15, 23, 42, 0.5);
  }

  .compact-ai-card-preview__card-stage
    .compact-ai-card-thumb--static
    .compact-ai-card-thumb__art {
    border-radius: 0.22rem;
    background: transparent;
  }
  .compact-ai-card-preview__card-stage
    .compact-ai-card-thumb--static.compact-ai-card-thumb--burned
    .compact-ai-card-thumb__art {
    background: transparent;
  }

  .compact-ai-card-preview__card-stage .compact-ai-card-thumb--static img {
    width: 100%;
    height: 58.5%;
    object-fit: cover;
  }

  .compact-ai-card-preview__card-stage
    .compact-ai-card-thumb--static
    .compact-ai-card-thumb__footer {
    display: none;
  }

  .compact-ai-card-preview__market {
    height: 100%;
    padding-inline: 1rem;
    border-left: 1px solid ${Color.borderGray()};
  }

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: minmax(9.4rem, 0.78fr) minmax(0, 1.28fr) minmax(
        6.3rem,
        0.54fr
      );
    gap: 0.36rem;
    min-height: 0;
    padding: 0.45rem;
    --ai-card-preview-art-width: clamp(9.2rem, 22vw, 13rem);
    --ai-card-preview-art-height: clamp(12.6rem, 30.2vw, 17.8rem);

    .compact-ai-card-preview__card-stage .compact-ai-card-thumb--static {
      width: var(--ai-card-preview-art-width) !important;
      height: var(--ai-card-preview-art-height) !important;
      max-width: 100%;
      max-height: 100%;
    }

    .compact-ai-card-preview__market {
      gap: 0.36rem;
      padding-inline: 0.38rem;
    }
  }

  &.compact-ai-card-preview--target {
    height: auto;
    min-height: calc(max(14rem, 140px) - 2px);
    padding-block: 0.5rem;
    --ai-card-preview-art-width: 7.5rem;
    --ai-card-preview-art-height: 10.5rem;
    --ai-card-market-gap: 0.5rem;
    --ai-card-value-gap: 0.2rem;

    @media (max-width: ${mobileMaxWidth}) {
      min-height: calc(max(12rem, 120px) - 2px);
    }
  }
`;
