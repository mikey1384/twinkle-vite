import React from 'react';
import CardThumb from '~/components/CardThumb';
import { useChatContext } from '~/contexts';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function CardStrip({
  cardIds,
  onSelect
}: {
  cardIds: number[];
  onSelect: (cardId: number) => void;
}) {
  return (
    <div
      className={`${cardStripClass} compact-ai-card-multi__preview`}
      onClick={handleClick}
    >
      {cardIds.map((cardId) => (
        <PreviewCard key={cardId} cardId={cardId} onSelect={onSelect} />
      ))}
    </div>
  );

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }
}

function PreviewCard({
  cardId,
  onSelect
}: {
  cardId: number;
  onSelect: (cardId: number) => void;
}) {
  const card = useChatContext((v) => v.state.cardObj[cardId]);

  return (
    <button
      className="compact-ai-card-multi__card"
      type="button"
      aria-label={`View AI card #${cardId}${card?.word ? `: ${card.word}` : ''}`}
      onClick={handleClick}
    >
      <CardThumb detailed card={card || { id: cardId }} />
    </button>
  );

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onSelect(cardId);
  }
}

const cardStripClass = css`
  --card-thumb-width: max(8rem, 72px);
  --card-thumb-height: max(12rem, 108px);
  --card-thumb-font-size: max(1.3rem, 13px);
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  padding: max(0.4rem, 4px) max(0.4rem, 4px) 0.7rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scroll-padding-inline: max(0.4rem, 4px);
  scrollbar-width: thin;
  scrollbar-color: ${Color.borderGray()} transparent;

  .compact-ai-card-multi__card {
    appearance: none;
    display: block;
    flex: 0 0 auto;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0.4rem;
    background: transparent;
    color: ${Color.darkerGray()};
    font: inherit;
    font-size: var(--card-thumb-font-size);
    line-height: 1.3;
    text-align: center;
    cursor: pointer;
    scroll-snap-align: start;
  }
  .compact-ai-card-multi__card:focus-visible {
    outline: 2px solid ${Color.logoBlue()};
    outline-offset: 2px;
  }
`;
