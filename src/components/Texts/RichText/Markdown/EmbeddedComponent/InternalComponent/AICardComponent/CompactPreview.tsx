import React from 'react';
import Icon from '~/components/Icon';
import SanitizedHTML from 'react-sanitized-html';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  cardLevelHash,
  cloudFrontURL,
  qualityProps,
  returnCardBurnXP
} from '~/constants/defaultValues';
import useAICard from '~/helpers/hooks/useAICard';
import { addCommasToNumber } from '~/helpers/stringHelpers';
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
  const content =
    imageSrc && !card.isBurned ? (
      <img src={imageSrc} alt={card.word || `AI card ${card.id}`} />
    ) : !card.isBurned ? (
      <span className="compact-ai-card-thumb__unknown">?</span>
    ) : (
      <span className="compact-ai-card-thumb__burned">
        {addCommasToNumber(Number((card as any).burnXP || 0))}
      </span>
    );

  if (!onClick) {
    return (
      <div
        className={`${compactThumbClass} compact-ai-card-thumb compact-ai-card-thumb--static`}
        style={
          {
            '--compact-ai-card-accent': cardColor,
            '--compact-ai-card-quality': qualityColor
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
      className={`${compactThumbClass} compact-ai-card-thumb`}
      style={
        {
          '--compact-ai-card-accent': cardColor,
          '--compact-ai-card-quality': qualityColor
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
  const levelLabel = getLevelLabel(card);
  const cardColor = getCardColor(card);
  const qualityColor = getQualityColor(card);
  const ownerName = card.owner?.username;
  const price = Number(card.askPrice || 0);
  const burnXP = returnCardBurnXP({
    cardLevel: Number(card.level || 1),
    cardQuality: card.quality || 'common'
  });
  const { promptText, engine } = useAICard(card) as {
    promptText?: string;
    engine?: string;
  };
  const detailPreview = getCardDetailPreview(card, promptText);
  const promptHtml = String(promptText || '').trim();
  const fallbackPrompt = promptHtml ? '' : detailPreview;
  const summonedDate = getSummonedDate(card);
  const styleLabel = card.imagePath ? card.style || levelLabel : '???';

  return (
    <button
      type="button"
      className={`${compactPreviewClass} compact-ai-card-preview`}
      style={
        {
          '--compact-ai-card-accent': cardColor,
          '--compact-ai-card-quality': qualityColor || cardColor
        } as React.CSSProperties
      }
      onClick={handleClick}
    >
      <div className="compact-ai-card-preview__card-stage">
        <CompactThumb card={card} />
      </div>
      <div className="compact-ai-card-preview__details">
        <div className="compact-ai-card-preview__header">
          <span className="compact-ai-card-preview__card-number">
            Card #{card.id || '?'}
          </span>
          {ownerName ? (
            <span className="compact-ai-card-preview__owner compact-ai-card-preview__owner--inline">
              owned by {ownerName}
            </span>
          ) : null}
        </div>
        <strong className="compact-ai-card-preview__word">
          {card.word || 'AI Card'}
        </strong>
        {card.quality ? (
          <div className="compact-ai-card-preview__quality-line">
            <b style={qualityColor ? { color: qualityColor } : undefined}>
              {card.quality}
            </b>{' '}
            card
          </div>
        ) : null}
        {promptHtml || fallbackPrompt ? (
          <div className="compact-ai-card-preview__prompt">
            {promptHtml ? (
              <SanitizedHTML
                allowedAttributes={{ b: ['style'] }}
                html={`"${promptHtml}"`}
              />
            ) : (
              `"${fallbackPrompt}"`
            )}
          </div>
        ) : null}
        <div className="compact-ai-card-preview__meta">
          <span>{styleLabel}</span>
          {engine ? <span>{engine}</span> : null}
        </div>
        {summonedDate ? (
          <div className="compact-ai-card-preview__summoned">
            Summoned on {summonedDate}
          </div>
        ) : null}
      </div>
      <div className="compact-ai-card-preview__market">
        {!card.isBurned ? (
          <div className="compact-ai-card-preview__stat compact-ai-card-preview__stat--burn">
            <span>Burn value</span>
            <b>
              <span className="compact-ai-card-preview__xp-number">
                {addCommasToNumber(burnXP)}
              </span>
              <span className="compact-ai-card-preview__xp-unit">XP</span>
            </b>
          </div>
        ) : null}
        {ownerName ? (
          <div className="compact-ai-card-preview__stat compact-ai-card-preview__stat--owner">
            <span>Owned by</span>
            <b>{ownerName}</b>
          </div>
        ) : null}
        {price ? (
          <div className="compact-ai-card-preview__stat compact-ai-card-preview__stat--listed">
            <span>Listed for</span>
            <b>
              <Icon style={{ color: Color.brownOrange() }} icon="coins" />
              <span className="compact-ai-card-preview__coin-price">
                {addCommasToNumber(price)}
              </span>
            </b>
          </div>
        ) : null}
      </div>
    </button>
  );

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onClick?.();
  }
}

function getCardColor(card: Partial<Card>) {
  const colorKey = cardLevelHash[Number(card.level || 0)]?.color;
  const colorGetter = colorKey ? (Color as any)[colorKey] : null;
  return typeof colorGetter === 'function' ? colorGetter() : Color.logoBlue();
}

function getLevelLabel(card: Partial<Card>) {
  return cardLevelHash[Number(card.level || 0)]?.label || '';
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

function getCardDetailPreview(card: Partial<Card>, promptText?: string) {
  const prompt = String(promptText || (card as any).prompt || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return prompt || card.style || card.engine || '';
}

function getSummonedDate(card: Partial<Card>) {
  if (!card.timeStamp) return '';
  return new Date(card.timeStamp * 1000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
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
  .compact-ai-card-thumb__unknown,
  .compact-ai-card-thumb__burned {
    color: ${Color.gold()};
    font-size: 1.8rem;
    font-weight: 900;
    line-height: 1;
  }
  .compact-ai-card-thumb__burned {
    font-size: 1rem;
  }
`;

const compactPreviewClass = css`
  appearance: none;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(10rem, 0.82fr) minmax(0, 1.42fr) minmax(
      8.8rem,
      0.58fr
    );
  align-items: center;
  gap: 1.35rem;
  width: 100%;
  height: 100%;
  min-height: 16.5rem;
  padding: 1.15rem 1.35rem;
  overflow: hidden;
  border: 1px solid ${Color.borderGray()};
  border-radius: 0.9rem;
  background: #fff;
  color: ${Color.darkerGray()};
  font: inherit;
  text-align: left;
  cursor: pointer;

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
    width: clamp(9rem, 12vw, 10.6rem);
    height: clamp(12.8rem, 16.9vw, 14.8rem);
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

  .compact-ai-card-preview__details {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    line-height: 1.18;
    text-align: center;
  }

  .compact-ai-card-preview__header {
    display: flex;
    min-width: 0;
    align-items: baseline;
    justify-content: center;
    gap: 0.5rem;
    overflow: hidden;
  }

  .compact-ai-card-preview__card-number,
  .compact-ai-card-preview__owner {
    overflow: hidden;
    font-size: 1rem;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .compact-ai-card-preview__card-number {
    color: var(--compact-ai-card-accent);
    font-weight: 900;
  }

  .compact-ai-card-preview__owner {
    color: ${Color.darkGray()};
    font-weight: 850;
  }

  .compact-ai-card-preview__owner--inline {
    display: none;
  }

  .compact-ai-card-preview__word {
    overflow: hidden;
    color: ${Color.black()};
    font-size: 1.45rem;
    font-weight: 900;
    line-height: 1.12;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .compact-ai-card-preview__quality-line {
    overflow: hidden;
    color: ${Color.darkerGray()};
    font-size: 1.18rem;
    font-weight: 850;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .compact-ai-card-preview__prompt {
    display: -webkit-box;
    margin: 0.5rem 0 0.3rem;
    max-width: 30rem;
    overflow: hidden;
    color: ${Color.black()};
    font-family: 'Lato', 'Arial', sans-serif;
    font-size: 1.23rem;
    font-weight: 700;
    line-height: 1.42;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
  }

  .compact-ai-card-preview__meta {
    display: flex;
    min-width: 0;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    gap: 0.35rem 0.65rem;
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: 1rem;
    font-weight: 800;
    line-height: 1.15;
  }

  .compact-ai-card-preview__meta span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .compact-ai-card-preview__summoned {
    margin-top: 0.45rem;
    color: ${Color.gray()};
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.15;
  }

  .compact-ai-card-preview__market {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    height: 100%;
    padding-left: 1rem;
    border-left: 1px solid ${Color.borderGray()};
    background: #fff;
    text-align: center;
  }

  .compact-ai-card-preview__stat {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.15rem;
  }

  .compact-ai-card-preview__stat > span {
    color: ${Color.darkGray()};
    font-size: 1.05rem;
    font-weight: 800;
    line-height: 1.1;
  }

  .compact-ai-card-preview__stat b {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    color: var(--compact-ai-card-accent);
    font-size: 1.22rem;
    font-weight: 900;
    line-height: 1.15;
  }

  .compact-ai-card-preview__stat--burn > span {
    color: ${Color.redOrange()};
    font-size: 1.18rem;
  }

  .compact-ai-card-preview__stat--burn b {
    font-size: 1.45rem;
  }

  .compact-ai-card-preview__xp-number {
    color: ${Color.logoGreen()};
  }

  .compact-ai-card-preview__xp-unit {
    color: ${Color.gold()};
  }

  .compact-ai-card-preview__stat--owner b {
    color: ${Color.goldOrange()};
  }

  .compact-ai-card-preview__stat--listed b {
    gap: 0.5rem;
  }

  .compact-ai-card-preview__coin-price {
    color: ${Color.darkerGray()};
  }

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: minmax(9.4rem, 0.78fr) minmax(0, 1.28fr) minmax(
        6.3rem,
        0.54fr
      );
    gap: 0.36rem;
    min-height: 0;
    padding: 0.45rem;

    .compact-ai-card-preview__card-stage .compact-ai-card-thumb--static {
      width: clamp(9.2rem, 22vw, 13rem) !important;
      height: clamp(12.6rem, 30.2vw, 17.8rem) !important;
      max-width: 100%;
      max-height: 100%;
    }

    .compact-ai-card-preview__market {
      gap: 0.36rem;
      padding-left: 0.38rem;
    }

    .compact-ai-card-preview__owner--inline {
      display: none;
    }

    .compact-ai-card-preview__word {
      font-size: max(1.35rem, 13.5px);
    }

    .compact-ai-card-preview__quality-line {
      font-size: max(1.18rem, 11.8px);
    }

    .compact-ai-card-preview__prompt {
      margin: 0.1rem 0;
      font-size: max(1.1rem, 11px);
      line-height: 1.28;
      -webkit-line-clamp: 3;
    }

    .compact-ai-card-preview__details {
      gap: 0.24rem;
    }

    .compact-ai-card-preview__header {
      gap: 0.28rem;
    }

    .compact-ai-card-preview__meta {
      gap: 0.14rem 0.34rem;
    }

    .compact-ai-card-preview__summoned {
      margin-top: 0.14rem;
    }

    .compact-ai-card-preview__stat > span {
      font-size: max(1rem, 10px);
    }

    .compact-ai-card-preview__stat b {
      gap: 0.16rem;
      font-size: max(1.1rem, 11px);
    }

    .compact-ai-card-preview__stat--burn b {
      font-size: max(1.18rem, 11.8px);
    }
  }
`;
