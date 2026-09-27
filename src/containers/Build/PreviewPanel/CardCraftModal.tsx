import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import CardThumb from '~/components/CardThumb';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { cardLevelHash } from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';
import type { BuildCardCraftSelectionRequest } from './types/previewHostBridgeTypes';

// Twinkle's own confirmation for Twinkle.cardCraft.craft: the app can never
// craft a card by itself. The player picks one of their own cards (or checks
// the one the app suggested) and confirms that it can only be crafted once.

const PAGE_SIZE = 30;
const PAGES_PER_FILL = 4;
const TARGET_ELIGIBLE = 12;

interface CraftBadge {
  cardId: number;
  buildId: number | null;
  appTitle: string | null;
  name: string;
}

const noSelect = css`
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
`;

function colourName(level: number) {
  return cardLevelHash[level]?.label || 'these';
}

function isRevealed(card: any) {
  const path = String(card?.imagePath || '');
  return Boolean(path) && path !== 'generating';
}

export default function CardCraftModal({
  request,
  onDone
}: {
  request: BuildCardCraftSelectionRequest;
  onDone: (cardId: number | null) => void;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const loadFilteredAICards = useAppContext(
    (v) => v.requestHelpers.loadFilteredAICards
  );
  const loadAICard = useAppContext((v) => v.requestHelpers.loadAICard);
  const loadCardCraftBadges = useAppContext(
    (v) => v.requestHelpers.loadCardCraftBadges
  );
  const [cards, setCards] = useState<any[]>([]);
  const [crafted, setCrafted] = useState<Record<number, CraftBadge>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<{
    lastInteraction: number;
    lastId: number;
  } | null>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [loadError, setLoadError] = useState('');
  const loadingRef = useRef(false);
  const pickedFromList = request.cardId === null;
  const acceptsEveryColour = request.acceptedLevels.length >= 6;
  const acceptedColours = useMemo(
    () => request.acceptedLevels.map(colourName).join(', '),
    [request.acceptedLevels]
  );
  const eligibleCards = useMemo(
    () => cards.filter((card) => getIneligibleReason(card) === ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards, crafted, request.acceptedLevels, userId]
  );
  const selectedProblem = selectedCard ? getIneligibleReason(selectedCard) : '';
  const isPreview = request.mode === 'preview';

  useEffect(() => {
    if (request.cardId) {
      loadSuggestedCard(request.cardId);
    } else {
      fillPicker(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      modalKey="BuildCardCraftModal"
      isOpen
      onClose={() => onDone(null)}
      size={selectedCard ? 'md' : 'lg'}
      modalLevel={2}
      priority
      title={isPreview ? 'Preview crafting (draft)' : 'Craft an AI Card'}
      footer={
        <>
          {selectedCard && pickedFromList ? (
            <Button
              variant="ghost"
              style={{ marginRight: '0.7rem' }}
              onClick={() => setSelectedCard(null)}
            >
              <Icon icon="chevron-left" />
              <span style={{ marginLeft: '0.7rem' }}>Back</span>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            style={{ marginRight: '0.7rem' }}
            onClick={() => onDone(null)}
          >
            Cancel
          </Button>
          {selectedCard && !selectedProblem ? (
            <Button
              color={doneColor}
              variant="solid"
              onClick={() => onDone(Number(selectedCard.id))}
            >
              <Icon icon="wand-magic-sparkles" />
              <span style={{ marginLeft: '0.7rem' }}>
                {isPreview ? 'Preview craft' : 'Craft this card'}
              </span>
            </Button>
          ) : null}
        </>
      }
    >
      <div className={`${noSelect} ${bodyClass}`}>
        {loading ? (
          <Loading />
        ) : loadError ? (
          <p className={messageClass}>{loadError}</p>
        ) : selectedCard ? (
          <div className={confirmClass}>
            <div className="card">
              <CardThumb card={selectedCard} detailed />
            </div>
            <div className="text">
              <h3>
                {selectedProblem
                  ? "This card can't be crafted here"
                  : isPreview
                    ? 'Try crafting this card?'
                    : 'Craft this card? It can only ever be crafted once.'}
              </h3>
              {selectedProblem ? (
                <p className="problem">{selectedProblem}</p>
              ) : isPreview ? (
                <p>
                  This is a draft preview. <b>{request.appTitle}</b> shows
                  what your {colourName(selectedCard.level)} card{' '}
                  <b>{selectedCard.word}</b> would become. Nothing is saved,
                  and the card can still be crafted later.
                </p>
              ) : (
                <>
                  <p>
                    <b>{request.appTitle}</b> will turn your{' '}
                    {colourName(selectedCard.level)} card{' '}
                    <b>{selectedCard.word}</b> into something new in the game.
                  </p>
                  <p>
                    The card stays yours and still works in the market.
                    Whoever owns the card owns what it becomes, so selling
                    the card hands it over. Burning the card removes it.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className={messageClass}>
              Pick one of your cards for <b>{request.appTitle}</b>. Each card
              can only ever be crafted once.
              {acceptsEveryColour ? (
                ' Cards of every colour work here.'
              ) : acceptedColours ? (
                <>
                  {' '}
                  This app takes <b>{acceptedColours}</b> cards.
                </>
              ) : null}
            </p>
            {eligibleCards.length ? (
              <div className={gridClass}>
                {eligibleCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className="item"
                    onClick={() => setSelectedCard(card)}
                  >
                    <CardThumb card={card} detailed />
                  </button>
                ))}
              </div>
            ) : (
              <p className={emptyClass}>
                {cursor
                  ? 'No cards that can be crafted here yet. Look further below.'
                  : "None of your cards can be crafted here. Cards need their picture, a colour this app takes, and can't already be crafted."}
              </p>
            )}
            {cursor ? (
              <LoadMoreButton
                style={{ marginTop: '1.5rem' }}
                loading={loadingMore}
                filled
                onClick={() => fillPicker(cursor)}
              />
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );

  function getIneligibleReason(card: any) {
    if (!card) return 'This card could not be found.';
    if (Number(card.ownerId) !== Number(userId)) return 'This card is not yours.';
    if (card.isBurned) return 'This card was burned.';
    if (!isRevealed(card)) return 'Reveal this card (give it its picture) first.';
    if (!request.acceptedLevels.includes(Number(card.level)))
      return `This app does not take ${colourName(Number(card.level))} cards.`;
    const badge = crafted[Number(card.id)];
    if (badge) return `This card was already crafted into ${badge.name}.`;
    return '';
  }

  async function loadBadges(cardIds: number[]) {
    try {
      const badges: CraftBadge[] = await loadCardCraftBadges(cardIds);
      if (!badges.length) return;
      setCrafted((current) => {
        const next = { ...current };
        for (const badge of badges) next[Number(badge.cardId)] = badge;
        return next;
      });
    } catch {
      // The server still refuses a second craft; the list just can't hide it.
    }
  }

  async function loadSuggestedCard(cardId: number) {
    try {
      const { card } = await loadAICard(cardId);
      await loadBadges([cardId]);
      setSelectedCard(card || null);
      if (!card) setLoadError('This card could not be found.');
    } catch {
      setLoadError('Could not load this card. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function fillPicker(
    start: { lastInteraction: number; lastId: number } | null
  ) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (start) setLoadingMore(true);
    let next = start;
    let found = 0;
    try {
      for (let page = 0; page < PAGES_PER_FILL; page++) {
        const { cards: pageCards = [], loadMoreShown } =
          await loadFilteredAICards({
            filters: {
              owner: username,
              ...(request.acceptedLevels.length === 1
                ? { color: colourName(request.acceptedLevels[0]) }
                : {})
            },
            limit: PAGE_SIZE,
            ...(next ? next : {})
          });
        const ids = pageCards.map((card: any) => Number(card.id));
        if (ids.length) await loadBadges(ids.slice(0, 50));
        setCards((current) => {
          const known = new Set(current.map((card) => card.id));
          return [
            ...current,
            ...pageCards.filter((card: any) => !known.has(card.id))
          ];
        });
        found += pageCards.filter(
          (card: any) =>
            isRevealed(card) &&
            request.acceptedLevels.includes(Number(card.level))
        ).length;
        const last = pageCards[pageCards.length - 1];
        next =
          loadMoreShown && last?.lastInteraction && last?.id
            ? { lastInteraction: last.lastInteraction, lastId: last.id }
            : null;
        if (!next || found >= TARGET_ELIGIBLE) break;
      }
      setCursor(next);
    } catch {
      setLoadError('Could not load your cards. Please try again.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }
}

const bodyClass = css`
  width: 100%;
  font-size: 1.5rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.3rem;
  }
`;

const messageClass = css`
  width: 100%;
  margin: 0 0 1.5rem;
  line-height: 1.5;
  color: ${Color.darkerGray()};
`;

const emptyClass = css`
  width: 100%;
  padding: 3rem 1rem;
  text-align: center;
  font-weight: bold;
  color: ${Color.darkGray()};
`;

const gridClass = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  gap: 1rem;
  width: 100%;
  .item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 1rem 0.5rem;
    border: 1px solid ${Color.borderGray()};
    border-radius: ${borderRadius};
    background: #fff;
    cursor: pointer;
    font: inherit;
    color: inherit;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }
  .item:hover,
  .item:focus-visible {
    border-color: ${Color.logoBlue()};
    box-shadow: 0 0 0 2px ${Color.logoBlue(0.25)};
  }
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
    gap: 0.7rem;
  }
`;

const confirmClass = css`
  display: flex;
  align-items: center;
  gap: 2rem;
  width: 100%;
  .card {
    flex-shrink: 0;
  }
  .text {
    flex: 1;
    min-width: 0;
    line-height: 1.5;
  }
  h3 {
    margin: 0 0 1rem;
    font-size: 1.8rem;
    font-weight: bold;
  }
  p {
    margin: 0 0 0.8rem;
  }
  .problem {
    color: ${Color.rose()};
    font-weight: bold;
  }
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    gap: 1.2rem;
    text-align: center;
    h3 {
      font-size: 1.5rem;
    }
  }
`;
