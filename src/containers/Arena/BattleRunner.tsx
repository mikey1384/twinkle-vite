import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { mobileMaxWidth } from '~/constants/css';
import { ARENA } from './theme';
import ArenaButton from './ArenaButton';
import { arenaMediaURL } from './media';
import ListeningConsole, { type ListeningTrack } from './ListeningConsole';
import PaperVisual, { tableMarksChoices, type Visual } from './PaperVisual';
import type { ArenaBattle, ArenaItem } from './types';

// One sitting of a real exam (Mikey 2026-10-24): the paper looks like the
// real paper (two serif columns, ①-⑤, [3점], <보기>), answers are marked on
// an OMR sheet, the clock is the real time limit and runs out on its own.
// Untimed retakes (Train) have no clock. After submitting, the same paper
// shows the keys and why each answer is right or wrong.

const CIRCLED = ['①', '②', '③', '④', '⑤'];
const BODY_FIRST_TYPES = new Set(['eng.order', 'eng.insert']);

// what the listening broadcast plays, in order: each recording once (a
// shared set's recording once for the set)
function listeningTracks(data: ArenaBattle): ListeningTrack[] {
  const seen = new Set<number>();
  const tracks: ListeningTrack[] = [];
  for (const item of data.items) {
    if (item.section !== 'listening' || item.passageId == null) continue;
    if (seen.has(item.passageId)) continue;
    seen.add(item.passageId);
    const audioPath = data.passages[String(item.passageId)]?.audioPath;
    if (!audioPath) continue;
    tracks.push({
      label: item.set ? `${item.set.replace('-', '~')}번` : `${item.no}번`,
      src: arenaMediaURL(audioPath),
      plays: item.plays || 1
    });
  }
  return tracks;
}

function isArtBrief(body: string) {
  return /^\s*\[(Picture|Chart|Table|Graph|Map|Photo)\b/i.test(body);
}

// the point tag comes from the blueprint, never from authored stem text
function stemText(stem: string) {
  return String(stem || '')
    .replace(/\s*\[\d점\]\s*/g, ' ')
    .trim();
}

export default function BattleRunner({
  battleId,
  onExit
}: {
  battleId: number;
  onExit: () => void;
}) {
  const loadArenaBattle = useAppContext(
    (v) => v.requestHelpers.loadArenaBattle
  );
  const saveArenaAnswer = useAppContext(
    (v) => v.requestHelpers.saveArenaAnswer
  );
  const submitArenaBattle = useAppContext(
    (v) => v.requestHelpers.submitArenaBattle
  );
  const [data, setData] = useState<ArenaBattle | null>(null);
  // the review's language: the exam's own unless the member switches
  const [reviewLang, setReviewLang] = useState<'en' | 'ko'>('en');
  useEffect(() => {
    if (data?.battle.exam.language) setReviewLang(data.battle.exam.language);
  }, [data?.battle.exam.language]);
  const hasKoreanReview =
    data?.battle.exam.language === 'en' &&
    !!data?.items.some((i) => i.review?.ko);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmShown, setConfirmShown] = useState(false);
  const [omrOpen, setOmrOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const clockOffsetRef = useRef(0);
  const lastMarkRef = useRef(Date.now());
  const submittedRef = useRef(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleId]);

  const finished = data?.battle.status === 'finished';
  const timed = !!data?.battle.deadlineAt && !finished;

  useEffect(() => {
    if (!timed || !data?.battle.deadlineAt) return;
    const deadline = data.battle.deadlineAt;
    const tick = () => {
      const serverNow = Math.floor(Date.now() / 1000) + clockOffsetRef.current;
      const left = Math.max(0, deadline - serverNow);
      setRemaining(left);
      if (left === 0 && !submittedRef.current) void handleSubmit();
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, data?.battle.deadlineAt]);

  // the ghost (Rising, Mikey 10-24): in an untimed retake, how many you had
  // answered by this point last time
  const [ghostCount, setGhostCount] = useState<number | null>(null);
  useEffect(() => {
    const ghost = data?.ghost;
    if (!ghost?.length || finished || !data) return;
    const startedAt = data.battle.startedAt;
    const tick = () => {
      const elapsed =
        Math.floor(Date.now() / 1000) + clockOffsetRef.current - startedAt;
      setGhostCount(ghost.filter((g) => g.at <= elapsed).length);
    };
    tick();
    const timer = window.setInterval(tick, 5000);
    return () => window.clearInterval(timer);
  }, [data, finished]);

  const sections = useMemo(() => {
    if (!data) return [];
    const out: { section: string; items: ArenaItem[] }[] = [];
    for (const item of data.items) {
      const last = out[out.length - 1];
      if (last && last.section === item.section) last.items.push(item);
      else out.push({ section: item.section, items: [item] });
    }
    return out;
  }, [data]);

  if (loadError) {
    return (
      <div className={centerCls}>
        <p>{loadError}</p>
        <button type="button" className={plainButtonCls} onClick={onExit}>
          Back
        </button>
      </div>
    );
  }
  if (!data) return <div className={centerCls}>Opening the exam…</div>;

  const answeredCount = data.items.filter(
    (item) => answers[item.no] != null
  ).length;
  const shownPassages = new Set<number>();

  return (
    <div className={shellCls}>
      <header className={barCls}>
        <button type="button" className={plainButtonCls} onClick={handleLeave}>
          <Icon icon="arrow-left" /> {finished ? 'Done' : 'Leave'}
        </button>
        <div className={titleCls}>
          <strong>{data.battle.exam.name}</strong>
          <span>
            {data.battle.mode === 'untimed'
              ? 'Untimed retake'
              : `${lengthLabel(data.battle.length)}${
                  data.battle.difficulty !== 'normal'
                    ? ` · ${data.battle.difficulty === 'hard' ? 'Hard' : 'Easy'}`
                    : ''
                } · ${data.battle.minutes} min`}
          </span>
        </div>
        {timed && remaining != null ? (
          <div className={cx(clockCls, remaining <= 300 && clockLowCls)}>
            <Icon icon="clock" /> {formatClock(remaining)}
          </div>
        ) : (
          <div />
        )}
        {!finished && (
          <button
            type="button"
            className={submitCls}
            disabled={submitting}
            onClick={() => setConfirmShown(true)}
          >
            {submitting ? 'Grading…' : 'Submit'}
          </button>
        )}
      </header>

      {finished && <Result data={data} />}
      {/* reviews in both languages, the exam's own first (Mikey 10-24) */}
      {finished && hasKoreanReview && (
        <div className={langBarCls}>
          <span>해설</span>
          {(['en', 'ko'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              className={cx(langCls, reviewLang === lang && langOnCls)}
              onClick={() => setReviewLang(lang)}
            >
              {lang === 'en' ? 'English' : '한국어'}
            </button>
          ))}
        </div>
      )}

      <div className={bodyCls}>
        <main className={paperCls}>
          <div className={paperHeadCls}>
            <span>{data.battle.exam.name.replace(/^수능 /, '')} 영역</span>
          </div>
          {sections.map(({ section, items }) => (
            <section key={section} className={columnsCls}>
              {section === 'listening' && (
                <p className={sectionNoteCls}>
                  1번부터 17번까지는 듣고 답하는 문제입니다.
                </p>
              )}
              {section === 'listening' &&
                data.battle.mode === 'battle' &&
                !finished && (
                  <ListeningConsole
                    battleId={data.battle.id}
                    examKey={data.battle.exam.key}
                    tracks={listeningTracks(data)}
                  />
                )}
              {items.map((item) => {
                const passage =
                  item.passageId != null && !shownPassages.has(item.passageId)
                    ? data.passages[String(item.passageId)]
                    : null;
                if (item.passageId != null) shownPassages.add(item.passageId);
                return (
                  <PaperItem
                    key={item.no}
                    item={item}
                    passage={passage}
                    marked={answers[item.no] ?? null}
                    finished={finished}
                    reviewLang={reviewLang}
                    // replay controls only where replays are allowed: Train's
                    // untimed retake and the review after a battle
                    audioControls={finished || data.battle.mode === 'untimed'}
                    onMark={(choice) => handleMark(item.no, choice)}
                  />
                );
              })}
            </section>
          ))}
        </main>

        <aside className={cx(omrCls, omrOpen && omrOpenCls)}>
          <button
            type="button"
            className={omrToggleCls}
            onClick={() => setOmrOpen((open) => !open)}
          >
            OMR 답안지 · {answeredCount}/{data.items.length}
            {ghostCount != null && (
              <span className={ghostCls}>
                Last time: {ghostCount} answered by now
              </span>
            )}
            <Icon icon={omrOpen ? 'chevron-down' : 'chevron-up'} />
          </button>
          <div className={omrGridCls}>
            {data.items.map((item) => (
              <div key={item.no} className={omrRowCls}>
                <span className={omrNoCls}>{item.no}</span>
                {CIRCLED.slice(0, item.choices.length || 5).map(
                  (label, choice) => {
                    const filled = answers[item.no] === choice;
                    const isKey = finished && item.key === choice;
                    return (
                      <button
                        key={choice}
                        type="button"
                        disabled={finished}
                        aria-label={`${item.no}번 ${choice + 1}`}
                        className={cx(
                          bubbleCls,
                          filled && bubbleFilledCls,
                          isKey && bubbleKeyCls
                        )}
                        onClick={() =>
                          handleMark(item.no, filled ? null : choice)
                        }
                      >
                        {filled ? '' : choice + 1}
                      </button>
                    );
                  }
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {confirmShown && (
        // drawn inside the battle screen: a site modal would open beneath it
        <div className={confirmBackdropCls} role="dialog" aria-modal="true">
          <div className={confirmCls}>
            <strong>Submit your answers?</strong>
            <p>
              {answeredCount < data.items.length
                ? `${data.items.length - answeredCount} questions are still blank. Blank answers are wrong.`
                : 'Your answers will be graded now.'}
            </p>
            <div className={confirmButtonsCls}>
              <button
                type="button"
                className={plainButtonCls}
                onClick={() => setConfirmShown(false)}
              >
                Keep working
              </button>
              <button
                type="button"
                className={submitCls}
                onClick={() => {
                  setConfirmShown(false);
                  void handleSubmit();
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function load() {
    try {
      const battle: ArenaBattle = await loadArenaBattle(battleId);
      clockOffsetRef.current =
        battle.battle.serverNow - Math.floor(Date.now() / 1000);
      setData(battle);
      setAnswers(
        Object.fromEntries(battle.items.map((item) => [item.no, item.answer]))
      );
      if (battle.battle.status === 'grading') {
        window.setTimeout(load, 1500);
      }
    } catch {
      setLoadError('This exam could not be opened.');
    }
  }

  function handleMark(no: number, choice: number | null) {
    if (finished || submittedRef.current) return;
    const elapsed = Date.now() - lastMarkRef.current;
    lastMarkRef.current = Date.now();
    setAnswers((prev) => ({ ...prev, [no]: choice }));
    saveArenaAnswer({
      battleId,
      no,
      answer: choice,
      responseMs: elapsed
    }).catch(() => null);
  }

  async function handleSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const result: ArenaBattle = await submitArenaBattle(battleId);
      setData(result);
      if (result.battle.status === 'grading') window.setTimeout(load, 1500);
    } catch {
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  function handleLeave() {
    onExit();
  }
}

function PaperItem({
  item,
  passage,
  marked,
  finished,
  reviewLang,
  audioControls,
  onMark
}: {
  item: ArenaItem;
  reviewLang: 'en' | 'ko';
  passage: { kind: string; body: string; audioPath: string | null } | null;
  marked: number | null;
  finished: boolean;
  audioControls: boolean;
  onMark: (choice: number | null) => void;
}) {
  const listening = item.section === 'listening';
  const ko = reviewLang === 'ko';
  const review =
    item.review && ko && item.review.ko
      ? { ...item.review, ...item.review.ko }
      : item.review;
  // the given text of an order or insertion item comes before the passage,
  // as on the real paper; a summary or <보기> box comes after it
  const bodyFirst = BODY_FIRST_TYPES.has(item.type);
  return (
    <article className={itemCls}>
      {passage && listening && audioControls && (
        <div className={audioCls}>
          {passage.audioPath ? (
            <audio
              controls
              src={arenaMediaURL(passage.audioPath)}
              preload="none"
            />
          ) : (
            <span>(Audio for this question is being prepared.)</span>
          )}
        </div>
      )}
      <p className={stemCls}>
        <b>{item.no}.</b> {stemText(item.stem)}
        {item.points === 3 && <span className={pointsCls}> [3점]</span>}
      </p>
      {item.body && bodyFirst && (
        <div className={boxCls}>
          <PaperText text={item.body} />
        </div>
      )}
      {item.visual ? (
        <PaperVisual
          visual={item.visual as unknown as Visual}
          marked={marked}
          onMark={finished ? undefined : onMark}
        />
      ) : (
        item.body &&
        isArtBrief(item.body) && (
          // a picture or chart item's body is the art brief, never shown
          <div className={artPendingCls}>(그림 / 도표)</div>
        )
      )}
      {passage && !listening && (
        <div className={passageCls}>
          <PaperText text={passage.body} />
        </div>
      )}
      {item.body && !bodyFirst && !isArtBrief(item.body) && (
        <div className={boxCls}>
          <PaperText text={item.body} />
        </div>
      )}
      {!(
        item.visual && tableMarksChoices(item.visual as unknown as Visual)
      ) && (
        <ol
          className={cx(
            choicesCls,
            item.choices.every((choice, i) => choice.trim() === CIRCLED[i]) &&
              markerRowCls
          )}
        >
          {item.choices.map((choice, index) => {
            const chosen = marked === index;
            const isKey = finished && item.key === index;
            const wrongPick = finished && chosen && item.key !== index;
            return (
              <li key={index}>
                <button
                  type="button"
                  disabled={finished}
                  className={cx(
                    choiceCls,
                    chosen && choiceChosenCls,
                    isKey && choiceKeyCls,
                    wrongPick && choiceWrongCls
                  )}
                  onClick={() => onMark(chosen ? null : index)}
                >
                  <span className={circledCls}>{CIRCLED[index]}</span>
                  {/* a marker choice (the underlined ① of a grammar item) is
                    printed once, as the paper does */}
                  {choice.trim() === CIRCLED[index] ? '' : ` ${choice}`}
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {finished && item.review && (
        <div
          className={cx(
            reviewCls,
            item.correct ? reviewRightCls : reviewWrongCls
          )}
        >
          <b>
            {item.correct ? (
              ko ? (
                '정답'
              ) : (
                'Correct'
              )
            ) : (
              <>
                {ko ? '정답:' : 'Answer:'}{' '}
                <span className={glyphCls}>{CIRCLED[item.key ?? 0]}</span>
              </>
            )}
          </b>
          {review!.evidence && (
            <p className={evidenceCls}>“{review!.evidence}”</p>
          )}
          <p>{review!.explanation}</p>
          {marked != null && !item.correct && review!.why?.[marked] && (
            <p>
              {ko ? (
                <>
                  <span className={glyphCls}>{CIRCLED[marked]}</span> 오답
                  이유:{' '}
                </>
              ) : (
                <>
                  Why <span className={glyphCls}>{CIRCLED[marked]}</span> is
                  wrong:{' '}
                </>
              )}
              {review!.why[marked]}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

// The paper's text: <u>…</u> underlines (grammar, vocabulary, referents)
// and '* word: 뜻' glosses set small and right-aligned below the passage,
// as the real booklet prints them. Built as elements; never raw HTML.
function PaperText({ text }: { text: string }) {
  const lines = String(text || '').split('\n');
  const body = lines.filter((line) => !line.startsWith('* '));
  const glosses = lines.filter((line) => line.startsWith('* '));
  return (
    <>
      {body
        .join('\n')
        .split(/(<u>[\s\S]*?<\/u>)/g)
        .map((part, i) =>
          part.startsWith('<u>') && part.endsWith('</u>') ? (
            <u key={i}>{part.slice(3, -4)}</u>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          )
        )}
      {glosses.length > 0 && (
        <span className={glossesCls}>
          {glosses.map((gloss, i) => (
            <span key={i}>{gloss}</span>
          ))}
        </span>
      )}
    </>
  );
}

function Result({ data }: { data: ArenaBattle }) {
  const { battle } = data;
  const estimate = battle.estimate?.grade;
  const navigate = useNavigate();
  const shareArenaBattle = useAppContext(
    (v) => v.requestHelpers.shareArenaBattle
  );
  const [sharing, setSharing] = useState(false);
  const [sharedId, setSharedId] = useState(0);
  const shareArenaBattleWithAI = useAppContext(
    (v) => v.requestHelpers.shareArenaBattleWithAI
  );
  const [agentSharing, setAgentSharing] = useState<'zero' | 'ciel' | null>(
    null
  );
  const [agentShared, setAgentShared] = useState<Record<string, boolean>>({});
  const [agentError, setAgentError] = useState('');
  return (
    <div className={resultCls}>
      <div>
        <span className={resultLabelCls}>
          {/* an Easy or Hard score is that mode's, never a real 등급 */}
          {battle.difficulty === 'hard'
            ? 'Score on Hard'
            : battle.difficulty === 'easy'
              ? 'Score on Easy'
              : 'Score'}
        </span>
        <strong>
          {battle.rawPoints} / {battle.maxPoints}
        </strong>
      </div>
      {battle.grade != null && (
        <div>
          <span className={resultLabelCls}>Grade on this paper</span>
          <strong>{gradeText(battle.exam.gradeLabels, battle.grade)}</strong>
        </div>
      )}
      <div>
        <span className={resultLabelCls}>Hunter Rank</span>
        <strong>
          {estimate
            ? `about ${gradeText(battle.exam.gradeLabels, estimate.grade)} (likely ${gradeText(battle.exam.gradeLabels, estimate.low)}–${gradeText(battle.exam.gradeLabels, estimate.high)})`
            : 'Still tracking'}
        </strong>
      </div>
      {/* a timed battle can be shared as a challenge (Mikey 10-24): a Home
          card where others take the exact same paper */}
      {battle.mode === 'battle' && (
        <div className={shareCls}>
          {!battle.won ? (
            battle.winAt != null && (
              <span className={winHintCls}>
                {battle.winAt}+ is a win you can share
              </span>
            )
          ) : sharedId ? (
            <ArenaButton
              tone="paper"
              size="md"
              onClick={() =>
                navigate(`/arena?mode=arena&challenge=${sharedId}`)
              }
            >
              <Icon icon="check" /> Shared to Home · See challenge
            </ArenaButton>
          ) : (
            <ArenaButton
              tone="red"
              size="md"
              loading={sharing}
              onClick={handleShare}
            >
              Share as a challenge
            </ArenaButton>
          )}
          {/* private coaching (Mikey 10-24, Daily Reflection's way): the
              result and every miss go to Zero or Ciel's chat */}
          {(['zero', 'ciel'] as const).map((target) => (
            <ArenaButton
              key={target}
              tone="paper"
              size="md"
              loading={agentSharing === target}
              disabled={!!agentShared[target]}
              onClick={() => handleShareWithAgent(target)}
            >
              {agentShared[target]
                ? `Sent to ${target === 'zero' ? 'Zero' : 'Ciel'} ✓`
                : `Ask ${target === 'zero' ? 'Zero' : 'Ciel'} to coach me`}
            </ArenaButton>
          ))}
          {agentError && <span className={agentErrorCls}>{agentError}</span>}
        </div>
      )}
    </div>
  );

  async function handleShareWithAgent(target: 'zero' | 'ciel') {
    setAgentSharing(target);
    setAgentError('');
    try {
      const result = await shareArenaBattleWithAI(battle.id, target);
      if (result?.channelId) socket.emit('join_chat_group', result.channelId);
      setAgentShared((prev) => ({ ...prev, [target]: true }));
    } catch (error: any) {
      setAgentError(
        error?.code === 'ARENA_ALREADY_SHARED'
          ? 'Already sent.'
          : error?.message || 'Could not send it. Please try again.'
      );
    } finally {
      setAgentSharing(null);
    }
  }

  async function handleShare() {
    setSharing(true);
    try {
      const { challengeId } = await shareArenaBattle(battle.id);
      setSharedId(challengeId);
    } finally {
      setSharing(false);
    }
  }
}

// the exam's own grade name (1급, 불합격) or "N등급"
function gradeText(labels: string[] | null | undefined, grade: number) {
  return labels?.[grade - 1] || `${grade}등급`;
}

function lengthLabel(length: string) {
  return length === 'full'
    ? 'Full exam'
    : length === 'medium'
      ? 'Medium'
      : 'Short';
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// The paper's type, as the real booklet sets it: English in Times New Roman
// and Korean in a Myeongjo serif (신명조 is commercial; these are the
// closest system and free faces). The Latin face comes first so English
// letters and punctuation never fall to the Korean font, which draws ’ and
// “ ” full-width ("It’  s").
const PAPER_SERIF =
  "'Times New Roman', Tinos, 'Noto Serif KR', 'Nanum Myeongjo', AppleMyungjo, Batang, serif";

// above the site header and nav, as Grammarbles' full-screen rounds are
const shellCls = css`
  position: fixed;
  inset: 0;
  z-index: 2147481000;
  display: flex;
  flex-direction: column;
  background: #e9e5dc;
`;

const centerCls = css`
  min-height: 40vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 1.6rem;
`;

const barCls = css`
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 1.2rem;
  padding: 0.8rem 1.6rem;
  background: ${ARENA.paper};
  border-bottom: 3px solid ${ARENA.line};
`;

const titleCls = css`
  display: flex;
  flex-direction: column;
  strong {
    font-size: 1.7rem;
  }
  span {
    font-size: 1.2rem;
    color: ${ARENA.inkSoft};
  }
`;

const clockCls = css`
  font-variant-numeric: tabular-nums;
  font-size: 1.8rem;
  font-weight: 800;
  display: inline-flex;
  gap: 0.6rem;
  align-items: center;
`;

const clockLowCls = css`
  color: ${ARENA.accent};
`;

const plainButtonCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  background: none;
  font: inherit;
  font-size: 1.4rem;
  font-weight: 700;
  cursor: pointer;
  color: ${ARENA.ink};
`;

const submitCls = css`
  padding: 0.7rem 1.6rem;
  border: 3px solid ${ARENA.line};
  border-radius: 10px;
  background: ${ARENA.accent};
  color: #fff;
  font: inherit;
  font-size: 1.5rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 3px 3px 0 ${ARENA.line};
  &:disabled {
    opacity: 0.6;
  }
`;

const bodyCls = css`
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 1.6rem;
  padding: 1.6rem;
  overflow: hidden;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.6rem;
    padding-bottom: 5.6rem;
  }
`;

const paperCls = css`
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  background: #fff;
  color: #111;
  font-family: ${PAPER_SERIF};
  padding: 2.4rem 3rem 4rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.4rem 1.2rem 3rem;
  }
`;

const paperHeadCls = css`
  text-align: center;
  border-bottom: 2px solid #111;
  margin-bottom: 1.6rem;
  span {
    display: inline-block;
    font-size: 2.6rem;
    font-weight: 700;
    padding: 0.4rem 1.6rem;
  }
`;

const columnsCls = css`
  column-count: 2;
  column-gap: 3rem;
  column-rule: 1px solid #111;
  margin-bottom: 2rem;
  @media (max-width: ${mobileMaxWidth}) {
    column-count: 1;
  }
`;

const sectionNoteCls = css`
  font-size: 1.35rem;
  margin: 0 0 1.2rem;
  break-inside: avoid;
`;

const itemCls = css`
  break-inside: avoid;
  margin-bottom: 2.2rem;
  font-size: 1.45rem;
  line-height: 1.7;
`;

const stemCls = css`
  margin: 0 0 0.8rem;
  b {
    font-weight: 700;
  }
`;

const pointsCls = css`
  font-weight: 700;
`;

const passageCls = css`
  border: 1px solid #111;
  padding: 1rem 1.2rem;
  margin-bottom: 0.8rem;
  white-space: pre-wrap;
  text-align: justify;
`;

const boxCls = css`
  border: 1px solid #111;
  padding: 0.8rem 1.2rem;
  margin-bottom: 0.8rem;
  white-space: pre-wrap;
`;

const audioCls = css`
  margin-bottom: 0.6rem;
  font-size: 1.25rem;
  color: #555;
  audio {
    width: 100%;
  }
`;

const choicesCls = css`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const choiceCls = css`
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  font: inherit;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  color: inherit;
  &:hover:not(:disabled) {
    background: #f3efe6;
  }
  &:disabled {
    cursor: default;
  }
`;

const circledCls = css`
  display: inline-block;
  min-width: 1.6em;
`;

const choiceChosenCls = css`
  background: #ece6d6;
  font-weight: 700;
`;

const choiceKeyCls = css`
  background: #dff2e3;
`;

const choiceWrongCls = css`
  background: #f8dcd8;
  text-decoration: line-through;
`;

const reviewCls = css`
  margin-top: 0.8rem;
  padding: 0.8rem 1rem;
  border-radius: 6px;
  font-family: system-ui, sans-serif;
  font-size: 1.3rem;
  line-height: 1.5;
  p {
    margin: 0.4rem 0 0;
  }
`;

const reviewRightCls = css`
  background: #eef8f0;
`;

const reviewWrongCls = css`
  background: #fbefed;
`;

const evidenceCls = css`
  font-style: italic;
`;

const omrCls = css`
  width: 25rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #fbf3f3;
  border: 2px solid #c9302c;
  overflow: hidden;
  @media (max-width: ${mobileMaxWidth}) {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    max-height: 4.8rem;
    border-width: 2px 0 0;
    transition: max-height 0.2s;
  }
`;

const omrOpenCls = css`
  @media (max-width: ${mobileMaxWidth}) {
    max-height: 70vh;
  }
`;

const omrToggleCls = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  border: none;
  border-bottom: 1px solid #c9302c;
  background: #f6e2e2;
  color: #a1221f;
  font: inherit;
  font-size: 1.3rem;
  font-weight: 800;
  cursor: pointer;
`;

const omrGridCls = css`
  overflow-y: auto;
  padding: 0.8rem 1rem 1.6rem;
`;

const omrRowCls = css`
  display: grid;
  grid-template-columns: 2.6rem repeat(5, 1fr);
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0;
  &:nth-of-type(5n) {
    border-bottom: 1px solid #e3b4b2;
    padding-bottom: 0.4rem;
    margin-bottom: 0.3rem;
  }
`;

const omrNoCls = css`
  font-size: 1.15rem;
  font-weight: 800;
  color: #a1221f;
  text-align: right;
  padding-right: 0.4rem;
`;

const bubbleCls = css`
  width: 1.9rem;
  height: 2.5rem;
  justify-self: center;
  border: 1.5px solid #c9302c;
  border-radius: 50%;
  background: #fff;
  color: #c9302c;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  &:disabled {
    cursor: default;
  }
`;

const bubbleFilledCls = css`
  background: #111;
  border-color: #111;
`;

const bubbleKeyCls = css`
  box-shadow: 0 0 0 2px #2f9e5b;
`;

const langBarCls = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  background: ${ARENA.paper};
  border-bottom: 2px solid ${ARENA.line};
  font-size: 1.3rem;
  font-weight: 800;
`;

const langCls = css`
  padding: 0.2rem 0.9rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: #fff;
  font-weight: 800;
  cursor: pointer;
`;

const langOnCls = css`
  background: ${ARENA.ink};
  color: #fff;
`;

const shareCls = css`
  flex-direction: row !important;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
`;

const winHintCls = css`
  align-self: center;
  font-size: 1.25rem;
  font-weight: 800;
  opacity: 0.9;
`;

// its own line under the OMR title
const ghostCls = css`
  order: 3;
  flex-basis: 100%;
  margin-top: 0.3rem;
  text-align: left;
  font-size: 1.15rem;
  font-weight: 700;
  opacity: 0.8;
`;

const agentErrorCls = css`
  width: 100%;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 700;
`;

const resultCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  padding: 1rem;
  background: ${ARENA.train};
  color: #fff;
  border-bottom: 3px solid ${ARENA.line};
  div {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  strong {
    font-size: 2rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1.2rem;
    strong {
      font-size: 1.5rem;
    }
  }
`;

const resultLabelCls = css`
  font-size: 1.1rem;
  font-weight: 700;
  opacity: 0.85;
  text-transform: uppercase;
`;

const confirmBackdropCls = css`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  padding: 1.6rem;
`;

const confirmCls = css`
  width: 100%;
  max-width: 42rem;
  background: ${ARENA.paper};
  border: 3px solid ${ARENA.line};
  border-radius: 14px;
  box-shadow: 5px 5px 0 ${ARENA.line};
  padding: 2rem;
  strong {
    font-size: 2rem;
  }
  p {
    font-size: 1.5rem;
    color: ${ARENA.inkSoft};
  }
`;

const confirmButtonsCls = css`
  display: flex;
  justify-content: flex-end;
  gap: 1.2rem;
  margin-top: 1.6rem;
`;

// the circled numbers exist in the paper's serif, not in the UI sans
const glyphCls = css`
  font-family: ${PAPER_SERIF};
`;

const glossesCls = css`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-top: 0.6rem;
  font-size: 1.2rem;
  white-space: normal;
`;

// marker-only choices (① ② ③ ④ ⑤ of an underline item) sit in one row
const markerRowCls = css`
  display: flex;
  gap: 2.4rem;
  li button {
    width: auto;
  }
`;

const artPendingCls = css`
  border: 1px dashed #999;
  padding: 2.4rem 1rem;
  margin-bottom: 0.8rem;
  text-align: center;
  color: #888;
  font-size: 1.3rem;
`;
