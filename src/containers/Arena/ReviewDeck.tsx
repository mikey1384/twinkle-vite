import React, { useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import ArenaButton from './ArenaButton';
import ArenaLoader from './ArenaLoader';
import { PaperItem } from './BattleRunner';
import { ARENA } from './theme';
import type { ArenaItem } from './types';
import { typeLabel } from './typeLabels';

// Train's missed-question deck (helpers/arena/train.ts): every Arena miss
// lands here. First the member says why they missed it (required; naming
// the cause is half the fix), then the card comes back 1, 3, 7 and 14 days
// later; four clean reviews in a row retire it.
export const MISS_TAGS: { tag: string; label: string; hint: string }[] = [
  {
    tag: 'concept',
    label: "Didn't know it",
    hint: 'A rule, fact or idea I had not learned'
  },
  {
    tag: 'misread',
    label: 'Misread it',
    hint: 'I read the question or passage wrong'
  },
  {
    tag: 'trap',
    label: 'Fell for a trap',
    hint: 'A choice that looked right but was not'
  },
  {
    tag: 'time',
    label: 'Ran out of time',
    hint: 'I rushed it or left it blank'
  },
  {
    tag: 'careless',
    label: 'Careless slip',
    hint: 'I knew it but marked or worked it wrong'
  },
  { tag: 'guess', label: 'Guessed', hint: 'I had no real idea' }
];
const TAG_LABEL = Object.fromEntries(MISS_TAGS.map((t) => [t.tag, t.label]));

interface CardSummary {
  itemId: number;
  examName: string;
  itemType: string;
  tag: string | null;
  box: number;
}

interface Deck {
  untagged: CardSummary[];
  due: CardSummary[];
  counts: { open: number; untagged: number; due: number; retired: number };
  tags: { tag: string; count: number }[];
}

interface CardView {
  card: CardSummary;
  exam: {
    key: string;
    name: string;
    language: 'en' | 'ko';
    pointTags: 'all' | null;
    optionMarkers?: 'letters' | 'circled';
  } | null;
  passage: { kind: string; body: string; audioPath: string | null } | null;
  item: {
    type: string;
    stem: string;
    body?: string;
    visual?: Record<string, unknown>;
    choices: string[];
    typed?: 'integer' | 'number' | 'text';
    missedAnswer?: number | string | null;
    key?: number | string;
    review?: ArenaItem['review'];
  };
}

export default function ReviewDeck({ onBack }: { onBack: () => void }) {
  const loadArenaDeck = useAppContext((v) => v.requestHelpers.loadArenaDeck);
  const loadArenaCard = useAppContext((v) => v.requestHelpers.loadArenaCard);
  const tagArenaCard = useAppContext((v) => v.requestHelpers.tagArenaCard);
  const answerArenaCard = useAppContext(
    (v) => v.requestHelpers.answerArenaCard
  );
  const [deck, setDeck] = useState<Deck | null>(null);
  const [card, setCard] = useState<CardView | null>(null);
  const [marked, setMarked] = useState<number | string | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    key: number | string;
    review: ArenaItem['review'];
    retired: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!deck) {
    return (
      <div className={wrapCls}>
        {error ? (
          <p className={mutedCls}>{error}</p>
        ) : (
          <ArenaLoader text="Opening your deck…" />
        )}
      </div>
    );
  }

  const tagging = !!card && !card.card.tag;
  return (
    <div className={wrapCls}>
      <header className={headCls}>
        <button type="button" className={backCls} onClick={handleBack}>
          <Icon icon="arrow-left" /> {card ? 'Deck' : 'Train'}
        </button>
        <div>
          <h2 className={titleCls}>Missed-question deck</h2>
          <p className={subCls}>
            {deck.counts.untagged} to sort · {deck.counts.due} due today ·{' '}
            {deck.counts.retired} mastered
          </p>
        </div>
      </header>

      {!card && (
        <>
          {deck.tags.length > 0 && (
            <div className={tagStatsCls}>
              <span>Your misses come from:</span>
              {deck.tags.map((t) => (
                <span key={t.tag} className={tagChipCls}>
                  {TAG_LABEL[t.tag] || t.tag} · {t.count}
                </span>
              ))}
            </div>
          )}
          {deck.untagged.length > 0 && (
            <section className={sectionCls}>
              <h3>Why did you miss these?</h3>
              <p className={mutedCls}>
                Sort each miss before it joins your review. Naming the cause is
                half of fixing it.
              </p>
              <CardList cards={deck.untagged} onOpen={openCard} />
            </section>
          )}
          <section className={sectionCls}>
            <h3>Due today</h3>
            {deck.due.length ? (
              <>
                <p className={mutedCls}>
                  Answer each one again. Right moves it further out; wrong
                  starts it over tomorrow.
                </p>
                <CardList cards={deck.due} onOpen={openCard} />
              </>
            ) : (
              <p className={mutedCls}>
                {deck.counts.open
                  ? 'Nothing due today. Cards come back 1, 3, 7 and 14 days after you sort them.'
                  : 'No misses yet. Every question you miss in the Arena lands here.'}
              </p>
            )}
          </section>
        </>
      )}

      {card && (
        <section className={cardCls}>
          <div className={cardMetaCls}>
            {card.exam?.name || card.card.examName}
            {card.card.tag && <span> · {TAG_LABEL[card.card.tag]}</span>}
            {!tagging && <span> · review {card.card.box + 1} of 4</span>}
          </div>
          <div className={paperCls}>
            <PaperItem
              item={asPaperItem(card, result)}
              passage={card.passage}
              marked={tagging ? (card.item.missedAnswer ?? null) : marked}
              finished={tagging || !!result}
              reviewLang={card.exam?.language || 'ko'}
              audioControls
              allPointTags={false}
              letters={card.exam?.optionMarkers === 'letters'}
              onMark={(value) => !result && setMarked(value)}
            />
          </div>
          {tagging && (
            <div className={tagPickCls}>
              <strong>Why did you miss it?</strong>
              <div className={tagGridCls}>
                {MISS_TAGS.map((t) => (
                  <button
                    key={t.tag}
                    type="button"
                    className={tagButtonCls}
                    disabled={busy}
                    onClick={() => handleTag(t.tag)}
                  >
                    <b>{t.label}</b>
                    <span>{t.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {!tagging && !result && (
            <div className={actionsCls}>
              <ArenaButton
                tone="ink"
                size="md"
                disabled={busy || marked == null || marked === ''}
                loading={busy}
                onClick={handleAnswer}
              >
                Check
              </ArenaButton>
            </div>
          )}
          {result && (
            <div className={actionsCls}>
              <span
                className={cx(
                  verdictCls,
                  result.correct ? verdictRightCls : verdictWrongCls
                )}
              >
                {result.retired
                  ? 'Mastered! This one leaves your deck.'
                  : result.correct
                    ? 'Right. It comes back later.'
                    : 'Not yet. It comes back tomorrow.'}
              </span>
              <ArenaButton tone="ink" size="md" onClick={handleNext}>
                Next
              </ArenaButton>
            </div>
          )}
        </section>
      )}
      {error && card && <p className={mutedCls}>{error}</p>}
    </div>
  );

  async function refresh() {
    try {
      setDeck(await loadArenaDeck());
    } catch {
      setError('Your deck could not be opened.');
    }
  }

  async function openCard(itemId: number) {
    setError('');
    setResult(null);
    setMarked(null);
    try {
      setCard(await loadArenaCard(itemId));
      window.scrollTo({ top: 0 });
    } catch {
      setError('This card could not be opened.');
    }
  }

  async function handleTag(tag: string) {
    if (!card) return;
    setBusy(true);
    try {
      await tagArenaCard({ itemId: card.card.itemId, tag });
      await handleNext();
    } catch {
      setError('That did not save. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAnswer() {
    if (!card) return;
    setBusy(true);
    try {
      const data = await answerArenaCard({
        itemId: card.card.itemId,
        answer: marked
      });
      setResult({
        correct: data.correct,
        key: data.key,
        review: data.review,
        retired: !!data.card?.retired
      });
    } catch {
      setError('That did not save. Try again.');
    } finally {
      setBusy(false);
    }
  }

  // the next card in the same pile, or back to the deck
  async function handleNext() {
    const fresh: Deck = await loadArenaDeck();
    setDeck(fresh);
    const wasTagging = tagging;
    const pile = wasTagging ? fresh.untagged : fresh.due;
    if (pile.length) {
      await openCard(pile[0].itemId);
    } else {
      setCard(null);
      setResult(null);
    }
  }

  function handleBack() {
    if (card) {
      setCard(null);
      setResult(null);
      refresh();
      return;
    }
    onBack();
  }
}

function CardList({
  cards,
  onOpen
}: {
  cards: CardSummary[];
  onOpen: (itemId: number) => void;
}) {
  return (
    <ul className={listCls}>
      {cards.map((card) => (
        <li key={card.itemId}>
          <button
            type="button"
            className={listRowCls}
            onClick={() => onOpen(card.itemId)}
          >
            <span>
              <strong>{card.examName}</strong>
              <span className={mutedCls}> · {typeLabel(card.itemType)}</span>
            </span>
            <Icon icon="chevron-right" />
          </button>
        </li>
      ))}
    </ul>
  );
}

// a card as the paper renders it: number hidden, the frozen key and review
// shown while sorting or after answering
function asPaperItem(
  view: CardView,
  result: {
    correct: boolean;
    key: number | string;
    review: ArenaItem['review'];
  } | null
): ArenaItem {
  const listening = view.item.type.includes('.l.');
  const tagging = !view.card.tag;
  return {
    no: 0,
    type: view.item.type,
    section: listening ? 'listening' : 'main',
    points: 0,
    passageId: null,
    stem: view.item.stem,
    body: view.item.body,
    visual: view.item.visual,
    choices: view.item.choices || [],
    typed: view.item.typed,
    answer: null,
    ...(tagging
      ? { key: view.item.key, correct: false, review: view.item.review }
      : result
        ? { key: result.key, correct: result.correct, review: result.review }
        : {})
  };
}

const wrapCls = css`
  width: 100%;
  max-width: 88rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  color: ${ARENA.ink};
`;

const headCls = css`
  display: flex;
  align-items: center;
  gap: 1.6rem;
`;

const backCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  border: 2px solid ${ARENA.ink};
  border-radius: 8px;
  background: #fff;
  font-weight: 800;
  cursor: pointer;
`;

const titleCls = css`
  margin: 0;
  font-size: 2.2rem;
  font-weight: 900;
`;

const subCls = css`
  margin: 0.2rem 0 0;
  color: ${ARENA.inkSoft};
  font-weight: 600;
`;

const sectionCls = css`
  padding: 1.6rem;
  border: 2px solid ${ARENA.line};
  border-radius: 10px;
  background: ${ARENA.paper};
  h3 {
    margin: 0 0 0.4rem;
    font-size: 1.7rem;
    font-weight: 900;
  }
`;

const mutedCls = css`
  color: ${ARENA.inkSoft};
  font-size: 1.4rem;
`;

const tagStatsCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
`;

const tagChipCls = css`
  padding: 0.2rem 0.8rem;
  border: 1.5px solid ${ARENA.ink};
  border-radius: 999px;
  background: #fff;
  font-size: 1.3rem;
`;

const listCls = css`
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const listRowCls = css`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border: 2px solid ${ARENA.ink};
  border-radius: 8px;
  background: #fff;
  color: ${ARENA.ink};
  font: inherit;
  font-size: 1.5rem;
  text-align: left;
  cursor: pointer;
  &:hover {
    background: ${ARENA.paper};
  }
`;

const cardCls = css`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const cardMetaCls = css`
  font-weight: 800;
  color: ${ARENA.inkSoft};
`;

const paperCls = css`
  padding: 2rem 2.4rem;
  border: 2px solid ${ARENA.line};
  border-radius: 6px;
  background: #fff;
  font-family: 'Arena Old Hangul', 'Noto Serif KR', 'Nanum Myeongjo', serif;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.4rem;
  }
`;

const tagPickCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  strong {
    font-size: 1.6rem;
  }
`;

const tagGridCls = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const tagButtonCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 1rem 1.2rem;
  border: 2px solid ${ARENA.ink};
  border-radius: 8px;
  background: #fff;
  color: ${ARENA.ink};
  font: inherit;
  text-align: left;
  cursor: pointer;
  box-shadow: 2px 2px 0 ${ARENA.ink};
  b {
    font-size: 1.5rem;
  }
  span {
    font-size: 1.25rem;
    color: ${ARENA.inkSoft};
  }
  &:hover:not(:disabled) {
    background: ${ARENA.paper};
  }
  &:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
`;

const actionsCls = css`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.2rem;
  flex-wrap: wrap;
`;

const verdictCls = css`
  font-weight: 900;
  font-size: 1.6rem;
`;

const verdictRightCls = css`
  color: ${ARENA.train};
`;

const verdictWrongCls = css`
  color: ${ARENA.coral};
`;
