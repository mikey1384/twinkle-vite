import React, { useEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext, useNotiContext } from '~/contexts';
import { buildTodayStatsPatchFromDailyTaskStatus } from '~/helpers';
import { mobileMaxWidth } from '~/constants/css';
import ArenaButton from './ArenaButton';
import ArenaLoader from './ArenaLoader';
import { PaperItem } from './BattleRunner';
import { WEBSITE_AGENT_GUIDE_ONLY_ATTRIBUTE } from '~/helpers/websiteAgentPage';
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
    layout?: 'problem' | null;
  } | null;
  passage: { kind: string; body: string; audioPath: string | null } | null;
  item: {
    type: string;
    stem: string;
    body?: string;
    visual?: Record<string, unknown>;
    choices: string[];
    typed?: ArenaItem['typed'];
    missedAnswer?: number | string | null;
    key?: number | string;
    review?: ArenaItem['review'];
    partialCredit?: ArenaItem['partialCredit'];
  };
}

export default function ReviewDeck({ onBack }: { onBack: () => void }) {
  const loadArenaDeck = useAppContext((v) => v.requestHelpers.loadArenaDeck);
  const loadArenaCard = useAppContext((v) => v.requestHelpers.loadArenaCard);
  const tagArenaCard = useAppContext((v) => v.requestHelpers.tagArenaCard);
  const answerArenaCard = useAppContext(
    (v) => v.requestHelpers.answerArenaCard
  );
  const onApplyTodayStatsProgress = useNotiContext(
    (v) => v.actions.onApplyTodayStatsProgress
  );
  const [deck, setDeck] = useState<Deck | null>(null);
  const [card, setCard] = useState<CardView | null>(null);
  const [marked, setMarked] = useState<number | string | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    key: number | string;
    review: ArenaItem['review'];
    partialCredit?: ArenaItem['partialCredit'];
    retired: boolean;
  } | null>(null);
  // the tap waiting on the server ('open:<itemId>', 'tag:<tag>', 'check',
  // 'next'): its button spins, and every other deck button waits with it
  const [pending, setPending] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const requestIdRef = useRef(0);
  // a card that would not open from the list: its row says so
  const [openFailed, setOpenFailed] = useState(0);
  const busy = !!pending;
  const [error, setError] = useState('');

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!deck) {
    return (
      <div className={wrapCls}>
        {error ? (
          <>
            <p className={mutedCls} role="alert">{error}</p>
            <ArenaButton tone="ink" size="md" onClick={() => { setError(''); void refresh(); }}>
              Try again
            </ArenaButton>
          </>
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
      {/* in the deck list, anything else that failed says so up here, not
          below a long list (a card that would not open says so on its row) */}
      {error && !card && <p className={errorCls} role="alert">{error}</p>}

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
              <CardList cards={deck.untagged} pending={pending} failedId={openFailed} onOpen={(itemId) => void openCard(itemId)} />
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
                <CardList cards={deck.due} pending={pending} failedId={openFailed} onOpen={(itemId) => void openCard(itemId)} />
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
          {/* Zero and Ciel go through a card with them, but the member
              marks, sorts and checks it (the server refuses the agent's) */}
          <div className={paperCls} {...{ [WEBSITE_AGENT_GUIDE_ONLY_ATTRIBUTE]: 'arenaTrain' }}>
            <PaperItem
              item={asPaperItem(card, result)}
              passage={card.passage}
              marked={tagging ? (card.item.missedAnswer ?? null) : marked}
              finished={tagging || !!result}
              reviewLang={card.exam?.language || 'ko'}
              audioControls
              allPointTags={false}
              letters={card.exam?.optionMarkers === 'letters'}
              problemLayout={card.exam?.layout === 'problem'}
              onMark={(value) => !result && !busy && setMarked(value)}
              ask={{
                kind: 'arenaCard',
                id: card.card.itemId,
                label: 'this missed question',
                path: '/arena?mode=train&play=deck'
              }}
            />
          </div>
          {tagging && (
            <div className={tagPickCls} {...{ [WEBSITE_AGENT_GUIDE_ONLY_ATTRIBUTE]: 'arenaTrain' }}>
              <strong>Why did you miss it?</strong>
              <div className={tagGridCls}>
                {MISS_TAGS.map((t) => (
                  <button
                    key={t.tag}
                    type="button"
                    className={tagButtonCls}
                    disabled={busy}
                    aria-busy={pending === `tag:${t.tag}` || undefined}
                    onClick={() => handleTag(t.tag)}
                  >
                    {pending === `tag:${t.tag}` && (
                      <Icon className={tagSpinnerCls} icon="spinner" pulse />
                    )}
                    <b>{t.label}</b>
                    <span>{t.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {!tagging && !result && (
            <div className={actionsCls} {...{ [WEBSITE_AGENT_GUIDE_ONLY_ATTRIBUTE]: 'arenaTrain' }}>
              <ArenaButton
                tone="ink"
                size="md"
                disabled={busy || marked == null || marked === ''}
                loading={pending === 'check'}
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
              <ArenaButton
                tone="ink"
                size="md"
                disabled={busy}
                loading={pending === 'next'}
                onClick={() => void goNext('next')}
              >
                Next
              </ArenaButton>
            </div>
          )}
        </section>
      )}
      {error && card && <p className={errorCls} role="alert">{error}</p>}
    </div>
  );

  async function refresh() {
    try {
      setDeck(await loadArenaDeck());
    } catch {
      setError('Your deck could not be opened.');
    }
  }

  // one deck request at a time; a second tap while one waits does nothing.
  // Back stays usable: it drops whatever is still waiting (its late reply is
  // ignored by request id).
  function begin(key: string) {
    if (pendingRef.current) return 0;
    pendingRef.current = true;
    const id = ++requestIdRef.current;
    setPending(key);
    setError('');
    setOpenFailed(0);
    return id;
  }

  function live(id: number) {
    return id === requestIdRef.current;
  }

  function end(id: number) {
    if (!live(id)) return;
    pendingRef.current = false;
    setPending(null);
  }

  function cancelPending() {
    requestIdRef.current += 1;
    pendingRef.current = false;
    setPending(null);
    setError('');
    setOpenFailed(0);
  }

  async function openCard(itemId: number) {
    const id = begin(`open:${itemId}`);
    if (!id) return;
    try {
      await showCard(itemId, id);
    } catch {
      if (live(id)) setOpenFailed(itemId);
    } finally {
      end(id);
    }
  }

  async function showCard(itemId: number, id: number) {
    const next = await loadArenaCard(itemId);
    if (!live(id)) return;
    setResult(null);
    setMarked(null);
    setCard(next);
    window.scrollTo({ top: 0 });
  }

  async function handleTag(tag: string) {
    if (!card) return;
    const id = begin(`tag:${tag}`);
    if (!id) return;
    try {
      await tagArenaCard({ itemId: card.card.itemId, tag });
    } catch {
      if (live(id)) setError('That did not save. Try again.');
      end(id);
      return;
    }
    if (!live(id)) return;
    end(id);
    await goNext(`tag:${tag}`);
  }

  async function handleAnswer() {
    if (!card) return;
    const id = begin('check');
    if (!id) return;
    try {
      const data = await answerArenaCard({
        itemId: card.card.itemId,
        answer: marked
      });
      // an answer that meets an A-goal target brings today's goals back
      if (data.dailyTaskStatus) {
        onApplyTodayStatsProgress({
          newStats: buildTodayStatsPatchFromDailyTaskStatus(
            data.dailyTaskStatus
          )
        });
      }
      if (!live(id)) return;
      setResult({
        correct: data.correct,
        key: data.key,
        review: data.review,
        partialCredit: data.partialCredit,
        retired: !!data.card?.retired
      });
    } catch {
      if (live(id)) setError('That did not save. Try again.');
    } finally {
      end(id);
    }
  }

  // the next card in the same pile, or back to the deck; the tapped button
  // (Next, or the sorted tag) keeps spinning until it is open
  async function goNext(key: string) {
    const id = begin(key);
    if (!id) return;
    const wasTagging = tagging;
    try {
      const fresh: Deck = await loadArenaDeck();
      if (!live(id)) return;
      setDeck(fresh);
      const pile = wasTagging ? fresh.untagged : fresh.due;
      if (pile.length) {
        await showCard(pile[0].itemId, id);
      } else {
        setCard(null);
        setResult(null);
      }
    } catch {
      if (!live(id)) return;
      setError(
        wasTagging
          ? 'Saved. The next card could not be opened. Go back to the deck and try again.'
          : 'The next card could not be opened. Try again.'
      );
    } finally {
      end(id);
    }
  }

  function handleBack() {
    cancelPending();
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
  pending,
  failedId,
  onOpen
}: {
  cards: CardSummary[];
  pending: string | null;
  failedId: number;
  onOpen: (itemId: number) => void;
}) {
  return (
    <ul className={listCls}>
      {cards.map((card) => {
        const opening = pending === `open:${card.itemId}`;
        return (
        <li key={card.itemId}>
          <button
            type="button"
            className={listRowCls}
            disabled={!!pending}
            aria-busy={opening || undefined}
            onClick={() => onOpen(card.itemId)}
          >
            <span>
              <strong>{card.examName}</strong>
              <span className={mutedCls}> · {typeLabel(card.itemType)}</span>
            </span>
            {/* the spinner takes the chevron's place: nothing moves */}
            <Icon icon={opening ? 'spinner' : 'chevron-right'} pulse={opening} fixedWidth />
          </button>
          {failedId === card.itemId && (
            <p className={errorCls} role="alert" style={{ marginTop: '0.4rem' }}>
              This card could not be opened. Try again.
            </p>
          )}
        </li>
        );
      })}
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
    partialCredit?: ArenaItem['partialCredit'];
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
      ? { key: view.item.key, correct: false, review: view.item.review, partialCredit: view.item.partialCredit }
      : result
        ? { key: result.key, correct: result.correct, review: result.review, partialCredit: result.partialCredit }
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
  &:disabled {
    cursor: default;
  }
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

// in the card's corner, so the label and hint never move
const tagSpinnerCls = css`
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
`;

const errorCls = css`
  margin: 0;
  color: ${ARENA.accent};
  font-weight: 700;
`;

const tagButtonCls = css`
  position: relative;
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
