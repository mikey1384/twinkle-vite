import React from 'react';
import AICardPreview from '~/components/AICardPreview';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import {
  cardLevelHash,
  cloudFrontURL,
  qualityProps,
  returnCardBurnXP
} from '~/constants/defaultValues';
import { getAICardDisplayWord } from '~/helpers/aiCardDisplay';
import MysteryCardArt from '~/components/AICard/MysteryCardArt';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { isTotalMysteryQuality } from '~/components/AICard/totalMysteryGlow';
import { Card } from '~/types';
import { css } from '@emotion/css';

export function CompactThumb({
  card,
  onClick
}: {
  card: Partial<Card>;
  onClick?: () => void;
}) {
  const cardColor = getCardColor(card);
  const qualityColor = getQualityColor(card) || cardColor;
  const imageSrc = getCardImageSrc(card);
  const xpNumberColor = useKeyContext((v) => v.theme.xpNumber.color);
  const burnXP = isTotalMysteryQuality(card.quality)
    ? '???'
    : returnCardBurnXP({
        cardLevel: Number(card.level || 1),
        cardQuality: card.quality || 'common'
      });
  const ownerName = card.owner?.username;
  const content =
    imageSrc && !card.isBurned ? (
      <img
        src={imageSrc}
        alt={getAICardDisplayWord(card) || `AI card ${card.id}`}
      />
    ) : !card.isBurned ? (
      <MysteryCardArt level={card.level} />
    ) : (
      <div className="compact-ai-card-thumb__burned">
        {ownerName ? (
          <strong className="compact-ai-card-thumb__burned-owner">
            {ownerName}
          </strong>
        ) : null}
        <span>burned this card and earned</span>
        <b>
          {addCommasToNumber(burnXP)} <span>XP</span>
        </b>
      </div>
    );

  if (!onClick) {
    return (
      <div
        className={`${compactThumbClass} compact-ai-card-thumb compact-ai-card-thumb--static${
          card.isBurned ? ' compact-ai-card-thumb--burned' : ''
        }`}
        style={
          {
            '--compact-ai-card-accent': cardColor,
            '--compact-ai-card-quality': qualityColor,
            '--compact-ai-card-xp-number': Color[xpNumberColor]()
          } as React.CSSProperties
        }
      >
        <div className="compact-ai-card-thumb__art">{content}</div>
        <div className="compact-ai-card-thumb__footer">#{card.id || '?'}</div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${compactThumbClass} compact-ai-card-thumb${
        card.isBurned ? ' compact-ai-card-thumb--burned' : ''
      }`}
      style={
        {
          '--compact-ai-card-accent': cardColor,
          '--compact-ai-card-quality': qualityColor,
          '--compact-ai-card-xp-number': Color[xpNumberColor]()
        } as React.CSSProperties
      }
      onClick={handleClick}
    >
      <div className="compact-ai-card-thumb__art">{content}</div>
      <div className="compact-ai-card-thumb__footer">#{card.id || '?'}</div>
    </button>
  );

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onClick?.();
  }
}

export default function CompactPreview({
  card,
  onClick
}: {
  card: Partial<Card>;
  onClick?: () => void;
}) {
  const cardColor = getCardColor(card);
  const qualityColor = getQualityColor(card);
  return (
    <AICardPreview
      card={card}
      artwork={<CompactThumb card={card} />}
      onClick={onClick}
      style={
        {
          '--compact-ai-card-accent': cardColor,
          '--compact-ai-card-quality': qualityColor || cardColor
        } as React.CSSProperties
      }
    />
  );
}

function getCardColor(card: Partial<Card>) {
  const colorKey = cardLevelHash[Number(card.level || 0)]?.color;
  const colorGetter = colorKey ? (Color as any)[colorKey] : null;
  return typeof colorGetter === 'function' ? colorGetter() : Color.logoBlue();
}

function getQualityColor(card: Partial<Card>) {
  const quality = String(card.quality || '');
  if (quality === 'common') {
    return '';
  }
  return (qualityProps as any)[quality]?.color || '';
}

function getCardImageSrc(card: Partial<Card>) {
  const imagePath = card.imagePath || (card as any).imageGenerationPreviewUrl;
  if (!imagePath) return '';
  if (
    typeof imagePath === 'string' &&
    (imagePath.startsWith('data:') || imagePath.startsWith('http'))
  ) {
    return imagePath;
  }
  return `${cloudFrontURL}${imagePath}`;
}

const compactThumbClass = css`
  appearance: none;
  position: relative;
  box-sizing: border-box;
  display: flex;
  width: 4.7rem;
  height: 6.45rem;
  flex-shrink: 0;
  flex-direction: column;
  overflow: hidden;
  padding: 0.18rem;
  border: 2px solid var(--compact-ai-card-quality);
  border-radius: 0.45rem;
  background: var(--compact-ai-card-accent);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.16);
  container-type: inline-size;
  cursor: pointer;
  .compact-ai-card-thumb__art {
    display: flex;
    min-height: 0;
    flex: 1;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 0.24rem 0.24rem 0.1rem 0.1rem;
    background: #fff;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .compact-ai-card-thumb__footer {
    display: flex;
    height: 1.3rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 0.12rem;
    background: ${Color.black(0.88)};
    color: #fff;
    font-size: 1rem;
    font-weight: 900;
    line-height: 1;
  }
  &.compact-ai-card-thumb--static {
    cursor: default;
  }
  &.compact-ai-card-thumb--burned .compact-ai-card-thumb__art {
    background: transparent;
  }
  .compact-ai-card-thumb__burned {
    box-sizing: border-box;
    display: flex;
    width: 100%;
    height: auto;
    min-width: 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.34em;
    padding: 0.55rem 0.42rem;
    background: #fff;
    color: ${Color.darkerGray()};
    font-size: clamp(0.76rem, 10.6cqw, 1.14rem);
    font-weight: 800;
    line-height: 1.15;
    text-align: center;
  }
  .compact-ai-card-thumb__burned-owner {
    overflow: hidden;
    max-width: 100%;
    color: ${Color.logoBlue()};
    font-size: 1.12em;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .compact-ai-card-thumb__burned b {
    color: var(--compact-ai-card-xp-number);
    font-size: 1.34em;
    font-weight: 900;
  }
  .compact-ai-card-thumb__burned b span {
    color: ${Color.gold()};
  }
`;
