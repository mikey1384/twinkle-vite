import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useNotiContext } from '~/contexts';
import { buildTodayStatsPatchFromDailyTaskStatus } from '~/helpers';
import { socket } from '~/constants/sockets/api';
import { mobileMaxWidth } from '~/constants/css';
import { ARENA } from './theme';
import ArenaButton from './ArenaButton';
import { arenaMediaURL } from './media';
import ListeningConsole, { type ListeningTrack } from './ListeningConsole';
import PaperVisual, { tableMarksChoices, type Visual } from './PaperVisual';
import MathText from './MathText';
import TypedAnswer from './TypedAnswer';
import EssayAnswer from './EssayAnswer';
import SpokenAnswer from './SpokenAnswer';
import MarkReview from './MarkReview';
import PartialCreditReview from './PartialCreditReview';
import C1ScoreReview from './C1ScoreReview';
import ParentEmailOffer from './ParentEmailOffer';
import ArenaRewards from './Rewards';
import type { ArenaBattle, ArenaItem } from './types';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import type { AssistantAskContext } from '~/containers/App/AssistantDock/dockState';
import {
  WEBSITE_AGENT_NO_PLAY_ATTRIBUTE,
  WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE
} from '~/helpers/websiteAgentPage';
import { useAgentScreenState } from '~/helpers/websiteAgentScreenState';

// One sitting of a real exam (Mikey 2026-10-24): the paper looks like the
// real paper (two serif columns, ①-⑤, [3점], <보기>), answers are marked on
// an OMR sheet, the clock is the real time limit and runs out on its own.
// Untimed retakes (Train) have no clock. After submitting, the same paper
// shows the keys and why each answer is right or wrong.

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
// options heard, not printed (TOSEL): the paper shows bare letters
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// an option's printed marker: (A)-(E) on English-language exams, ①-⑤ on
// Korean papers (수능 영어 included)
function optionMarker(index: number, letters: boolean) {
  return letters ? `(${LETTERS[index]})` : CIRCLED[index];
}
// how long the result waits between looks while essays are being marked
const MARKING_POLL_MS = 4000;
const MARKING_POLL_LIMIT = 45;

// an essay or spoken answer still being marked (or not yet queued)
function markingPending(item: ArenaItem) {
  return (
    !!item.marked &&
    ['draft', 'queued', 'marking'].includes(item.marking?.status || 'queued')
  );
}
const BODY_FIRST_TYPES = new Set(['eng.order', 'eng.insert']);

// the listening section's opening line, with the numbers this paper prints
// (수능 영어 "1번부터 17번까지", TOEFL Junior "Questions L1 to L42")
function listeningNote(items: ArenaItem[], english: boolean) {
  const first = items[0]?.display || String(items[0]?.no ?? '');
  const last =
    items[items.length - 1]?.display || String(items[items.length - 1]?.no ?? '');
  return english
    ? `Questions ${first} to ${last} are listening questions.`
    : `${first}번부터 ${last}번까지는 듣고 답하는 문제입니다.`;
}

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
    // the numbers the paper prints (TOEFL Junior "L12"), a set as first~last
    const members = item.set
      ? data.items.filter((other) => other.set === item.set)
      : [item];
    const printed = (other: ArenaItem) => other.display || String(other.no);
    const label =
      members.length > 1
        ? `${printed(members[0])}~${printed(members[members.length - 1])}`
        : printed(item);
    tracks.push({
      label,
      // the number call's file name: the printed label, a set "15~16" as 15-16
      callKey: label.replace('~', '-'),
      audioPath,
      src: arenaMediaURL(audioPath),
      plays: item.plays || 1
    });
  }
  return tracks;
}

function isArtBrief(body: string) {
  // Figure: a 수학 figure note the problem can be solved without
  return /^\s*\[(Picture|Chart|Table|Graph|Map|Photo|Frame|Scene|Figure)\b/i.test(
    body
  );
}

// a picture, chart or map still to come shows a placeholder; a 자료 frame
// or a decorative scene (한국사) is a layout note only
function awaitsArt(body: string) {
  return /^\s*\[(Picture|Chart|Table|Graph|Map|Photo)\b/i.test(body);
}

// a 대화 자료 (한국사): every line "speaker: words", 2 to 6 lines
function isDialogue(text: string) {
  const lines = String(text || '')
    .split('\n')
    .filter((l) => l.trim());
  return (
    lines.length >= 2 &&
    lines.length <= 6 &&
    lines.every((l) => /^[^:\n]{1,10}:\s/.test(l))
  );
}

// 대화 자료 as the paper prints it: the speaker, then the words in a bubble
function DialogueText({ text }: { text: string }) {
  return (
    <div className={dialogueCls}>
      {String(text)
        .split('\n')
        .filter((l) => l.trim())
        .map((line, i) => {
          const at = line.indexOf(':');
          return (
            <div key={i} className={bubbleRowCls}>
              <span className={speakerCls}>{line.slice(0, at)}</span>
              <span className={dialogueBubbleCls}>
                <PaperText text={line.slice(at + 1).trim()} />
              </span>
            </div>
          );
        })}
    </div>
  );
}

// A timeline item's passage also carries its ticks as a text line ("1961
// 5·16 … | (가) | 1964 …") for blind solvers and reviews; the paper draws
// the timeline, so that line is not printed again.
function withoutDrawnTimeline(
  body: string,
  visual: Record<string, unknown> | undefined
) {
  if (visual?.kind !== 'timeline') return body;
  return String(body || '')
    .split('\n')
    .filter((line) => !/\|\s*\(가\)\s*\|/.test(line))
    .join('\n');
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
  const requestArenaMarking = useAppContext(
    (v) => v.requestHelpers.requestArenaMarking
  );
  const onApplyTodayStatsProgress = useNotiContext(
    (v) => v.actions.onApplyTodayStatsProgress
  );
  const [data, setData] = useState<ArenaBattle | null>(null);
  // the review's language: the exam's own unless the member switches
  const [reviewLang, setReviewLang] = useState<'en' | 'ko'>('en');
  useEffect(() => {
    if (data?.battle.exam.language) setReviewLang(data.battle.exam.language);
  }, [data?.battle.exam.language]);
  const hasKoreanReview =
    data?.battle.exam.language === 'en' &&
    // an essay's mark carries Korean feedback too
    !!data?.items.some((i) => i.review?.ko || i.marking?.mark?.feedbackKo);
  const [answers, setAnswers] = useState<
    Record<number, number | string | null>
  >({});
  // spoken answers recorded so far (seconds)
  const [recordings, setRecordings] = useState<Record<number, number | null>>(
    {}
  );
  const markingPollsRef = useRef(0);
  const markingTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (markingTimerRef.current) window.clearTimeout(markingTimerRef.current);
    },
    []
  );
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

  // What Zero and Ciel are told about a sitting in progress: where it
  // stands, never its questions (the paper itself is off limits to them,
  // below). A submitted battle's review is theirs to read and go through.
  useAgentScreenState(
    'arenaBattle',
    data && !finished
      ? {
          live: true,
          exam: data.battle.exam.nameEn,
          kind:
            data.battle.mode === 'untimed'
              ? 'untimed retake'
              : `${data.battle.length} ${data.battle.difficulty} battle`,
          minutesLeft:
            remaining == null ? null : Math.ceil(remaining / 60),
          answered: data.items.filter(
            (item) => answers[item.no] != null || recordings[item.no] != null
          ).length,
          questions: data.items.length,
          note: 'The paper is hidden from you while it runs: it is their own test.'
        }
      : null
  );

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
    (item) => answers[item.no] != null || recordings[item.no] != null
  ).length;
  const shownPassages = new Set<number>();

  return (
    <div className={shellCls}>
      {/* while it runs, the agent may see the bar (exam, clock) but tap
          nothing in it (Submit is theirs) */}
      <header
        className={barCls}
        {...(!finished ? { [WEBSITE_AGENT_NO_PLAY_ATTRIBUTE]: 'arenaBattle' } : {})}
      >
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

      {/* a live paper is the member's alone: Zero and Ciel never read it or
          answer on it (Mikey 10-25); the review after is theirs to share */}
      <div
        className={bodyCls}
        {...(!finished
          ? { [WEBSITE_AGENT_OFF_LIMITS_ATTRIBUTE]: 'arenaBattle' }
          : {})}
      >
        <main className={paperCls}>
          <div className={paperHeadCls}>
            {/* a Korean paper's 영역 heading; an English-language exam
                (C1, IELTS, TOEFL) prints its name only */}
            <span>
              {data.battle.exam.language === 'en' &&
              !/^수능 /.test(data.battle.exam.name)
                ? data.battle.exam.name
                : `${data.battle.exam.name.replace(/^수능 /, '')} 영역`}
            </span>
          </div>
          {sections.map(({ section, items }) => (
            <section key={section} className={columnsCls}>
              {section === 'listening' && (
                <p className={sectionNoteCls}>
                  {listeningNote(
                    items,
                    // an English-language exam (TOEFL, IELTS) speaks English
                    data.battle.exam.language === 'en' &&
                      !/^수능 /.test(data.battle.exam.name)
                  )}
                </p>
              )}
              {section === 'listening' &&
                data.battle.mode === 'battle' &&
                !finished && (
                  <ListeningConsole
                    battleId={data.battle.id}
                    examKey={data.battle.exam.key}
                    tracks={listeningTracks(data)}
                    english={
                      data.battle.exam.language === 'en' &&
                      !/^수능 /.test(data.battle.exam.name)
                    }
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
                    allPointTags={data.battle.exam.pointTags === 'all'}
                    letters={data.battle.exam.optionMarkers === 'letters'}
                    problemLayout={data.battle.exam.layout === 'problem'}
                    finished={finished}
                    reviewLang={reviewLang}
                    // replay controls only where replays are allowed: Train's
                    // untimed retake and the review after a battle
                    audioControls={finished || data.battle.mode === 'untimed'}
                    onMark={(choice) => handleMark(item.no, choice)}
                    battleId={data.battle.id}
                    untimed={data.battle.mode === 'untimed'}
                    korean={data.battle.exam.language === 'ko'}
                    onRecorded={(seconds) =>
                      setRecordings((prev) => ({ ...prev, [item.no]: seconds }))
                    }
                    onRequestMarking={handleRequestMarking}
                    ask={
                      finished
                        ? {
                            kind: 'arenaBattleItem',
                            id: data.battle.id,
                            no: item.no,
                            label: `question ${item.display || item.no}`,
                            path: `/arena?mode=train&battle=${data.battle.id}`
                          }
                        : null
                    }
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
          <div
            className={cx(
              omrGridCls,
              // printed numbers like "LFM42" need a wider number column
              data.items.some((item) => (item.display || '').length > 3) &&
                omrWideNoCls
            )}
          >
            {data.items.map((item) => (
              <div
                key={item.no}
                className={omrRowCls}
                // a matching part's 7-8 options (IELTS, A2 Key) get a bubble
                // each
                style={
                  item.choices.length > 5
                    ? {
                        gridTemplateColumns: `${
                          data.items.some(
                            (other) => (other.display || '').length > 3
                          )
                            ? '4rem'
                            : '2.6rem'
                        } repeat(${item.choices.length}, 1fr)`,
                        gap: '0.1rem'
                      }
                    : undefined
                }
              >
                <span className={omrNoCls}>{item.display || item.no}</span>
                {item.marked ? (
                  // an essay or recording: written on the paper, ticked here
                  <span className={omrMarkedCls}>
                    {item.marked === 'essay'
                      ? '서술 · Essay'
                      : '말하기 · Spoken'}{' '}
                    {(item.marked === 'essay'
                      ? answers[item.no] != null
                      : recordings[item.no] != null) && <Icon icon="check" />}
                  </span>
                ) : item.typed ? (
                  // 단답형: the answer sheet's own box, same value as the item's
                  <TypedAnswer
                    compact
                    typed={item.typed}
                    value={answers[item.no] ?? null}
                    finished={finished}
                    label={
                      data.battle.exam.optionMarkers === 'letters'
                        ? `Question ${item.display || item.no} answer`
                        : `${item.display || item.no}번 답`
                    }
                    onCommit={(value) => handleMark(item.no, value)}
                  />
                ) : (
                  CIRCLED.slice(0, item.choices.length || 5).map(
                    (label, choice) => {
                      const filled = answers[item.no] === choice;
                      const isKey = finished && item.key === choice;
                      return (
                        <button
                          key={choice}
                          type="button"
                          disabled={finished}
                          aria-label={`${item.display || item.no}번 ${
                            (item.spokenChoices ||
                              data.battle.exam.optionMarkers === 'letters') ? LETTERS[choice] : choice + 1
                          }`}
                          className={cx(
                            bubbleCls,
                            filled && bubbleFilledCls,
                            isKey && bubbleKeyCls
                          )}
                          onClick={() =>
                            handleMark(item.no, filled ? null : choice)
                          }
                        >
                          {filled
                            ? ''
                            : (item.spokenChoices ||
                              data.battle.exam.optionMarkers === 'letters')
                              ? LETTERS[choice]
                              : choice + 1}
                        </button>
                      );
                    }
                  )
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {confirmShown && (
        // drawn inside the battle screen: a site modal would open beneath it
        <div
          className={confirmBackdropCls}
          role="dialog"
          aria-modal="true"
          {...{ [WEBSITE_AGENT_NO_PLAY_ATTRIBUTE]: 'arenaBattle' }}
        >
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
      setRecordings(
        Object.fromEntries(
          battle.items
            .filter((item) => item.recording)
            .map((item) => [item.no, item.recording!.seconds])
        )
      );
      if (battle.battle.status === 'grading') {
        window.setTimeout(load, 1500);
      } else if (battle.battle.status === 'finished') {
        // essays are marked after the battle: look again until the marks are in
        scheduleMarkingPoll(battle);
      }
    } catch {
      setLoadError('This exam could not be opened.');
    }
  }

  // a choice index, or a typed answer (committed on blur or Enter)
  function handleMark(no: number, choice: number | string | null) {
    if (finished || submittedRef.current) return;
    const value = typeof choice === 'string' && !choice.trim() ? null : choice;
    if ((answers[no] ?? null) === value) return;
    const elapsed = Date.now() - lastMarkRef.current;
    lastMarkRef.current = Date.now();
    setAnswers((prev) => ({ ...prev, [no]: value }));
    saveArenaAnswer({
      battleId,
      no,
      answer: value,
      responseMs: elapsed
    }).catch(() => null);
  }

  async function handleSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const result: ArenaBattle & { dailyTaskStatus?: any } =
        await submitArenaBattle(battleId);
      setData(result);
      // a finished battle can clear today's A goal
      if (result.dailyTaskStatus) {
        onApplyTodayStatsProgress({
          newStats: buildTodayStatsPatchFromDailyTaskStatus(
            result.dailyTaskStatus
          )
        });
      }
      if (result.battle.status === 'grading') window.setTimeout(load, 1500);
      else scheduleMarkingPoll(result);
    } catch {
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  function scheduleMarkingPoll(battle: ArenaBattle) {
    if (!battle.items.some(markingPending)) return;
    if (markingPollsRef.current >= MARKING_POLL_LIMIT) return;
    markingPollsRef.current += 1;
    if (markingTimerRef.current) window.clearTimeout(markingTimerRef.current);
    markingTimerRef.current = window.setTimeout(load, MARKING_POLL_MS);
  }

  // answers that waited for AI Energy (or failed): mark them now, then look
  async function handleRequestMarking() {
    await requestArenaMarking(battleId);
    markingPollsRef.current = 0;
    await load();
  }

  function handleLeave() {
    onExit();
  }
}

// One question as the paper prints it (also Train's 오답 deck cards, which
// pass no: 0 to print no number)
export function PaperItem({
  item,
  passage,
  marked,
  finished,
  reviewLang,
  audioControls,
  allPointTags,
  letters = false,
  problemLayout = false,
  onMark,
  battleId = 0,
  untimed = false,
  korean = false,
  onRecorded,
  onRequestMarking,
  ask = null
}: {
  item: ArenaItem;
  allPointTags: boolean;
  // (A)-(E) instead of ①-⑤ (English-language exams)
  letters?: boolean;
  problemLayout?: boolean;
  reviewLang: 'en' | 'ko';
  passage: { kind: string; body: string; audioPath: string | null } | null;
  marked: number | string | null;
  finished: boolean;
  audioControls: boolean;
  onMark: (choice: number | string | null) => void;
  // essay and spoken answers (a battle only, never Train's cards)
  battleId?: number;
  untimed?: boolean;
  korean?: boolean;
  onRecorded?: (seconds: number) => void;
  onRequestMarking?: () => Promise<void>;
  // "Ask Zero/Ciel" about this question, once it is the member's to go
  // through (a submitted battle's review, a deck card, an answered drill)
  ask?: AssistantAskContext | null;
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
    // an essay or recording takes the page's full width, as the answer
    // sheet's writing space does
    <article className={cx(itemCls, item.marked && wideItemCls)}>
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
      {problemLayout && (passage || (item.body && !isArtBrief(item.body))) && (
        // 수학: the number, the setup inline, any box, then the question
        <>
          {passage && (
            <div className={problemCls}>
              {item.no > 0 && <b>{item.display || item.no}.</b>}{' '}
              <PaperText text={passage.body} />
            </div>
          )}
          {item.body && !isArtBrief(item.body) && (
            <div className={boxCls}>
              <PaperText text={item.body} />
            </div>
          )}
        </>
      )}
      <p className={stemCls}>
        {item.no > 0 && !(problemLayout && passage) && <b>{item.display || item.no}.</b>}{' '}
        <MathText text={stemText(item.stem)} />
        {(allPointTags || item.points === 3) && (
          <span className={pointsCls}> [{item.points}점]</span>
        )}
      </p>
      {item.body && bodyFirst && !problemLayout && (
        <div className={boxCls}>
          <PaperText text={item.body} />
        </div>
      )}
      {item.visual ? (
        <PaperVisual
          visual={item.visual as unknown as Visual}
          marked={typeof marked === 'number' ? marked : null}
          onMark={finished ? undefined : onMark}
        />
      ) : (
        item.body &&
        awaitsArt(item.body) && (
          // a picture or chart item's body is the art brief, never shown
          <div className={artPendingCls}>(그림 / 도표)</div>
        )
      )}
      {passage && !listening && !problemLayout && (
        <div className={passageCls}>
          {isDialogue(passage.body) ? (
            <DialogueText text={passage.body} />
          ) : (
            <PaperText text={withoutDrawnTimeline(passage.body, item.visual)} />
          )}
        </div>
      )}
      {item.body && !bodyFirst && !problemLayout && !isArtBrief(item.body) && (
        <div className={boxCls}>
          <PaperText text={item.body} />
        </div>
      )}
      {item.marked === 'essay' && (
        <EssayAnswer
          no={item.no}
          task={item.task}
          value={typeof marked === 'string' ? marked : null}
          finished={finished}
          korean={korean}
          onCommit={onMark}
        />
      )}
      {item.marked === 'spoken' && (
        <SpokenAnswer
          battleId={battleId}
          no={item.no}
          task={item.task}
          recording={item.recording ?? null}
          finished={finished}
          retakeAllowed={untimed}
          korean={korean}
          onSaved={(seconds) => onRecorded?.(seconds)}
        />
      )}
      {finished && item.marked && (
        <>
          <MarkReview
            item={item}
            ko={ko}
            onRequestMarking={onRequestMarking}
          />
          {review?.explanation && (
            <p className={strongAnswerCls}>
              <b>{ko ? '좋은 답안은: ' : 'A strong answer: '}</b>
              <MathText text={review.explanation} />
            </p>
          )}
        </>
      )}
      {item.typed && (
        <div className={typedRowCls}>
          <TypedAnswer
            typed={item.typed}
            value={marked}
            finished={finished}
            prompt={letters ? 'Answer' : '답'}
            label={
              letters
                ? `Question ${item.display || item.no} answer`
                : `${item.display || item.no}번 답`
            }
            onCommit={onMark}
          />
        </div>
      )}
      {!item.typed &&
        !item.marked &&
        !(
          item.visual && tableMarksChoices(item.visual as unknown as Visual)
        ) && (
          <ol
            className={cx(
              choicesCls,
              (item.spokenChoices ||
                item.choices.every((choice, i) => choice.trim() === CIRCLED[i])) &&
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
                    aria-pressed={chosen}
                    className={cx(
                      choiceCls,
                      chosen && choiceChosenCls,
                      isKey && choiceKeyCls,
                      wrongPick && choiceWrongCls
                    )}
                    onClick={() => onMark(chosen ? null : index)}
                  >
                    <span className={circledCls}>
                      {optionMarker(index, letters || !!item.spokenChoices)}
                    </span>
                    {/* a marker choice (the underlined ① of a grammar item) is
                    printed once, as the paper does; spoken options are only
                    heard, so the paper prints the bare letters */}
                    {item.spokenChoices || choice.trim() === CIRCLED[index] ? (
                      ''
                    ) : (
                      <>
                        {' '}
                        <MathText text={choice} displayStyle />
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      {finished && item.review && !item.marked && (
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
                {item.typed ? (
                  <span className={typedKeyCls}>{String(item.key ?? '')}</span>
                ) : (
                  <span className={glyphCls}>
                    {optionMarker(Number(item.key ?? 0), letters)}
                  </span>
                )}
              </>
            )}
          </b>
          {item.typed && (!item.correct || item.typed === 'transformation') && (
            <p>
              {ko ? '내 답: ' : 'Your answer: '}
              {marked == null || marked === ''
                ? ko
                  ? '(빈칸)'
                  : '(blank)'
                : String(marked)}
            </p>
          )}
          {item.partialCredit && <PartialCreditReview credit={item.partialCredit} ko={ko} />}
          {review!.evidence && (
            <p className={evidenceCls}>
              “<PaperText text={review!.evidence} />”
            </p>
          )}
          <p>
            <MathText text={review!.explanation} />
          </p>
          {typeof marked === 'number' &&
            !item.correct &&
            review!.why?.[marked] && (
              <p>
                {ko ? (
                  <>
                    <span className={glyphCls}>
                      {optionMarker(marked, letters)}
                    </span> 오답
                    이유:{' '}
                  </>
                ) : (
                  <>
                    Why <span className={glyphCls}>
                      {optionMarker(marked, letters)}
                    </span> is
                    wrong:{' '}
                  </>
                )}
                <MathText text={review!.why[marked]} />
              </p>
            )}
        </div>
      )}
      {ask && (
        <div className={askRowCls}>
          <AskAgentButton context={ask} />
        </div>
      )}
    </article>
  );
}

// The paper's text: <u>…</u> underlines (grammar, vocabulary, referents),
// <b>…</b> bold (GMAT boldface reasoning) and '* word: 뜻' glosses set small and right-aligned below the passage,
// as the real booklet prints them. Built as elements; never raw HTML.
function PaperText({ text }: { text: string }) {
  const lines = String(text || '').split('\n');
  const body = lines.filter((line) => !line.startsWith('* '));
  const glosses = lines.filter((line) => line.startsWith('* '));
  return (
    <>
      {body
        .join('\n')
        .split(/(<u>[\s\S]*?<\/u>|<b>[\s\S]*?<\/b>)/g)
        .map((part, i) =>
          part.startsWith('<u>') && part.endsWith('</u>') ? (
            <u key={i}>{part.slice(3, -4)}</u>
          ) : part.startsWith('<b>') && part.endsWith('</b>') ? (
            <b key={i}>{part.slice(3, -4)}</b>
          ) : (
            <MathText key={i} text={part} />
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
  // essay and spoken answers: their marks are AI estimates and may still be
  // on their way; the score says so until they are all in
  const markedItems = data.items.filter((item) => item.marked);
  const aiMarked = markedItems.length > 0;
  const waiting = markedItems.filter(
    (item) => item.marking?.status !== 'marked'
  );
  const waitingPoints = waiting.reduce((sum, item) => sum + item.points, 0);
  const needsEnergy = waiting.some((item) =>
    ['awaiting', 'failed'].includes(item.marking?.status || '')
  );
  // marks already in count now; the server adds them to the battle's score
  // once every mark is in (settled)
  const shownPoints =
    battle.rawPoints == null
      ? null
      : battle.rawPoints +
        (battle.marking && !battle.marking.settled
          ? battle.marking.markedPoints || 0
          : 0);
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
          {shownPoints} / {battle.maxPoints}
        </strong>
        {aiMarked && (
          <span className={resultNoteCls}>
            {waiting.length
              ? needsEnergy
                ? `Includes AI estimates · up to ${waitingPoints} points wait for marking (below)`
                : `Includes AI estimates · marking ${waiting.length === 1 ? 'one more answer' : `${waiting.length} more answers`} (up to ${waitingPoints} points)…`
              : 'Includes AI-estimated marks'}
          </span>
        )}
      </div>
      {battle.grade != null && (
        <div>
          <span className={resultLabelCls}>
            {aiMarked
              ? 'Grade on this paper · AI estimate'
              : 'Grade on this paper'}
          </span>
          <strong>{gradeText(battle.exam.gradeLabels, battle.grade)}</strong>
        </div>
      )}
      <div>
        <span className={resultLabelCls}>Hunter Rank</span>
        <strong>
          {estimate
            ? `about ${gradeText(battle.exam.gradeLabels, estimate.grade)} (likely ${gradeText(battle.exam.gradeLabels, estimate.low)}–${gradeText(battle.exam.gradeLabels, estimate.high)})`
            : battle.exam.aiMarked
              ? 'Not estimated for this exam'
              : 'Still tracking'}
        </strong>
      </div>
      <div className={rewardPanelCls}>
        {battle.rewardOffer && <p>Reward target: {battle.rewardOffer.target} / {battle.rewardOffer.max}</p>}
        <ArenaRewards
          xp={battle.reward?.xpEarned}
          coins={battle.reward?.coinsEarned}
          rewardPending={battle.reward?.rewardPending}
          markingPending={battle.reward?.markingPending}
          rewardStatus={battle.reward?.rewardStatus}
          scoreBonusXp={battle.reward?.scoreBonusXpEarned}
          scoreBonusCoins={battle.reward?.scoreBonusCoinsEarned}
          emptyNote={battle.mode === 'untimed' ? 'Practice · no rewards' : 'Daily exam reward limit reached'}
        />
      </div>
      {battle.scaleReport && <C1ScoreReview report={battle.scaleReport} />}
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
      {/* after a timed win, optionally send the result to a parent (Mikey
          10-24): Korean, exam terms, a one-time reward when the parent
          confirms a first parent email */}
      {battle.mode === 'battle' && battle.won && (
        <ParentEmailOffer battleId={battle.id} />
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
// “ ” full-width ("It’  s"). 'Arena Old Hangul' covers only archaic jamo (see paperFont.ts).
const PAPER_SERIF =
  "'Times New Roman', Tinos, 'Arena Old Hangul', 'Noto Serif KR', 'Nanum Myeongjo', AppleMyungjo, Batang, serif";

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

const wideItemCls = css`
  column-span: all;
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

const askRowCls = css`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.8rem;
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

const omrWideNoCls = css`
  > div {
    grid-template-columns: 4rem repeat(5, 1fr);
  }
  > div > span:first-of-type {
    font-size: 0.95rem;
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

const dialogueCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const bubbleRowCls = css`
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
`;

const speakerCls = css`
  flex: none;
  min-width: 4.4rem;
  padding-top: 0.5rem;
  font-weight: 700;
  text-align: right;
`;

const dialogueBubbleCls = css`
  flex: 1;
  padding: 0.5rem 0.9rem;
  border: 1px solid #222;
  border-radius: 14px;
  background: #fff;
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

const resultNoteCls = css`
  font-size: 1.1rem;
  font-weight: 700;
  opacity: 0.9;
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

// an essay or spoken answer's line in the OMR panel
const omrMarkedCls = css`
  grid-column: 2 / -1;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.1rem;
  font-weight: 800;
  color: #a1221f;
`;

const strongAnswerCls = css`
  margin: 0.6rem 0 0;
  font-family: system-ui, sans-serif;
  font-size: 1.25rem;
  line-height: 1.5;
  color: #444;
`;

// 단답형: the answer box under the stem, as the booklet leaves room for work
const typedRowCls = css`
  margin: 1.2rem 0 0.4rem;
`;

const typedKeyCls = css`
  font-variant-numeric: tabular-nums;
  font-weight: 900;
`;

// 수학's problem text: inline after the number, no box
const problemCls = css`
  margin: 0 0 0.6rem;
  line-height: 1.9;
`;

const rewardPanelCls = css`
  padding: 0.8rem 1rem;
  border-radius: 8px;
  background: ${ARENA.paper};
`;
