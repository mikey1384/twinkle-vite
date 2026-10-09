import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';
import RuleCard from '../Review/RuleCard';
import ChallengeModal from '../Review/ChallengeModal';
import useChallengeReviews from '../Review/useChallengeReviews';
import {
  challengeReviewLabel,
  getSavedChallengeReview
} from '../Review/challengeReviews';
import {
  initialKoreanShown,
  saveKoreanShown
} from '~/helpers/grammarblesRuleCard';
import Stage from './MarbleRun/Stage';
import AudioToggles from './AudioToggles';
import PixelIcon from './PixelIcon';
import { musicForNode, playMusic, stopMusic } from './MarbleRun/music';
import { useReadCooldown } from './readCooldown';
import { PracticeRun } from './MarbleRun/level/runner';
import { themeFor } from './MarbleRun/level/themes';
import { BossFight } from './MarbleRun/boss/fight';
import { bossFor } from './MarbleRun/boss/catalog';
import { LADDER, type Grade } from './MarbleRun/marble';
import type {
  QuestAnswer,
  QuestQuestion,
  QuestResult,
  QuestRun
} from './types';
import {
  GOLD,
  INK,
  NIGHT,
  PARCHMENT,
  PIXEL_FONT,
  PLATE,
  WOOD,
  button,
  challengeButton,
  discRows,
  frame,
  inkShadow,
  pixelSvg,
  spriteUri
} from './pixelUi';

// A practice stop or a boss fight played as the marble run (Mikey 10-07).
// The canvas shows the level; the card below asks the questions. Every pick
// is graded on the server; the engine only animates what the server said.
//   Practice: accuracy only. Right = past the obstacle and promoted; wrong =
//   the obstacle wins this time, the rule card shows, and the question comes
//   back at the end of the run. S finishes the stop.
//   Boss: seven hits graded like Classic (reading pause, then the clock;
//   keep picking until right). Points are damage; 490 beats it.
export default function MarbleRunScreen({
  run,
  onFinished,
  onQuit
}: {
  run: QuestRun;
  onFinished: (result: QuestResult, answers: QuestAnswer[]) => void;
  onQuit: () => void;
}) {
  const answerQuestion = useAppContext(
    (v) => v.requestHelpers.answerGrammarQuestQuestion
  );
  const finishRun = useAppContext(
    (v) => v.requestHelpers.finishGrammarQuestRun
  );
  const loadRun = useAppContext((v) => v.requestHelpers.loadGrammarQuestRun);
  const boss = run.rules.mode === 'boss';
  const [questions, setQuestions] = useState<QuestQuestion[]>(run.questions);
  const [answers, setAnswers] = useState<Record<number, QuestAnswer>>(() =>
    Object.fromEntries((run.answers || []).map((a) => [a.position, a]))
  );
  // boss: wrong picks on the current question (keep picking until right)
  const [wrongPicks, setWrongPicks] = useState<number[]>(
    () => run.wrongPicks || []
  );
  const [phase, setPhase] = useState<
    | 'waiting'
    | 'reading'
    | 'asking'
    | 'sending'
    | 'review'
    | 'bossReview'
    | 'finishing'
  >('waiting');
  // practice: the marble can take the next question (bosses say so per hit)
  const [ready, setReady] = useState(!boss);
  const [error, setError] = useState('');
  // practice: the fifth right answer sends the S marble to the flag
  // a stop reopened after its fifth right answer just rolls to the flag
  const [toFlag, setToFlag] = useState(
    () => run.rules.mode === 'practice' && (run.rights || 0) >= run.rules.goal
  );
  const [koreanShown, setKoreanShown] = useState(initialKoreanShown);
  // the question being challenged (Classic's Challenge, opened from a miss)
  const [challengeId, setChallengeId] = useState<number | null>(null);
  const { reviews } = useChallengeReviews();
  const appliedReviews = useRef(new Set<number>());
  const challengeOpenRef = useRef(false);
  challengeOpenRef.current = challengeId != null;
  const layerRef = useRef<HTMLDivElement>(null);
  // boss: the last wrong pick, for the explanation shown after the hit lands
  const [bossMissPick, setBossMissPick] = useState<number | null>(null);
  const shownAt = useRef(0);
  const finishedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // the next question to ask; the card keeps showing the one just answered
  // (with its rule card after a miss) until the marble is ready to move on
  const nextOpen = useMemo(() => {
    if (boss) return questions.findIndex((q) => !answers[q.position]?.grade);
    return questions.findIndex((q) => !answers[q.position]);
  }, [boss, questions, answers]);
  const [shown, setShown] = useState(nextOpen);
  const position = shown;
  const question = position >= 0 ? questions[position] : null;
  const answer = question ? answers[question.position] : undefined;
  const challengeReview = answer?.challenge
    ? reviews[answer.challenge.questionId]
    : undefined;
  const savedReview = getSavedChallengeReview(
    answer?.challenge?.checked,
    answer?.challenge?.review
  );
  // a miss's explanation holds Continue for its read time (practice), or
  // holds the next boss hit (the server's clock waits the same time)
  const { reading, secondsLeft } = useReadCooldown(
    phase === 'review' && answer && !answer.isCorrect && question
      ? `miss-${question.position}`
      : phase === 'bossReview' && question
        ? `hit-${question.position}`
        : null,
    answer?.readMs
  );

  useEffect(() => {
    for (const a of Object.values(answers)) {
      const id = a.challenge?.questionId;
      const review = id ? reviews[id] : undefined;
      if (
        !id ||
        review?.status !== 'complete' ||
        appliedReviews.current.has(id)
      )
        continue;
      appliedReviews.current.add(id);
      setAnswers((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([key, value]) => [
            key,
            value.challenge?.questionId === id
              ? {
                  ...value,
                  challenge: {
                    ...value.challenge,
                    checked: true,
                    upheld: review.result.justified
                  }
                }
              : value
          ])
        )
      );
      // This also runs if the learner closed the review before it finished.
      if (review.result.justified) void refreshQueued();
    }
    // The request helper isn't an effect dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, reviews]);

  const engine = useMemo(() => {
    const [, world, kind, index] =
      /^w(\d+)([sfc])(\d*)$/.exec(run.nodeId) || [];
    if (boss) {
      const fight = new BossFight(
        bossFor(
          Number(world) || 1,
          kind === 'c' ? 'castle' : 'fort',
          Number(index) || 1
        ),
        {
          onReady: () => {
            setPhase('reading');
            setReady(true);
          },
          onFinish: () => finish()
        }
      );
      const graded = (run.answers || [])
        .map((a) => a.grade)
        .filter(Boolean) as Grade[];
      if (graded.length) fight.resume(graded);
      const next = run.questions[graded.length];
      if (next?.baseTimeMs) {
        fight.setQuestion({
          baseTimeMs: next.baseTimeMs,
          revealDelayMs: next.revealDelayMs || 1500,
          usedMs: run.usedMs || 0
        });
      }
      return fight;
    }
    const practice = new PracticeRun(
      themeFor(Number(world) || 1, Number(index) || 1),
      run.nodeId,
      {
        onReady: () => setReady(true),
        onFinish: () => finish()
      }
    );
    const rights = run.rights || 0;
    practice.resume(rights, Math.max(0, (run.answers || []).length - rights));
    return practice;
    // one engine per run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.runId]);

  // the world's theme for a stop, the fort/castle/final theme for a boss
  useEffect(() => {
    playMusic(musicForNode(run.nodeId));
    return () => stopMusic(0.6);
  }, [run.nodeId]);

  // practice: a question can be answered while the marble is still rolling
  // up to its obstacle; it plays out when the marble gets there
  useEffect(() => {
    if (!boss && phase === 'waiting' && ready && nextOpen >= 0) {
      setShown(nextOpen);
      setPhase('asking');
      shownAt.current = performance.now();
    }
  }, [boss, phase, ready, nextOpen]);

  // boss: Classic's reading pause, then the choices and the clock
  useEffect(() => {
    if (!boss || phase !== 'reading') return;
    if (shown !== nextOpen) {
      setShown(nextOpen);
      return;
    }
    if (!question) return;
    const timer = setTimeout(() => {
      setPhase('asking');
      shownAt.current = performance.now();
    }, question.revealDelayMs || 1500);
    return () => clearTimeout(timer);
  }, [boss, phase, question, shown, nextOpen]);

  // keyboard: 1–4 or A–D picks, Enter continues
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /INPUT|TEXTAREA/.test(target.tagName)) return;
      if (challengeOpenRef.current) return;
      const n =
        '1234'.indexOf(e.key) + 1 || 'abcd'.indexOf(e.key.toLowerCase()) + 1;
      if (n && phase === 'asking') handlePick(n - 1);
      if (e.key === 'Enter' && phase === 'review' && ready && !reading)
        handleContinue();
    }
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  // Escape leaves the run for the map. Caught before the modal's own
  // Escape handler (which would close Grammarbles outright); the modal
  // skips events that are already handled.
  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      // an open challenge closes first, by its own Escape
      if (challengeOpenRef.current) return;
      e.preventDefault();
      onQuit();
    }
    document.addEventListener('keydown', onEscape, true);
    return () => document.removeEventListener('keydown', onEscape, true);
  }, [onQuit]);

  // the run plays on its own full-screen layer (Mikey 10-07: inside the
  // modal the card got cut off and Continue hid behind the footer), so the
  // page under it must not scroll while it is open. The modal behind
  // normally holds that lock already; take it only when nobody does, so
  // unmount order can never leave the page locked.
  useEffect(() => {
    const body = document.body;
    if (getComputedStyle(body).overflow === 'hidden') return;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, []);

  // the stage is as big as fits next to the progress marbles and the
  // question card at their full height (the card never gets squeezed),
  // keeping the stage's 960×380 shape. Short landscape screens put the
  // stage and the card side by side.
  const bodyRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const body = bodyRef.current;
    const dock = dockRef.current;
    if (!body || !dock) return;
    function fit() {
      if (!body || !dock) return;
      const style = getComputedStyle(body);
      const innerW =
        body.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const innerH =
        body.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
      const ratio = 960 / 380;
      let width: number;
      if (style.flexDirection === 'row') {
        const gap = parseFloat(style.columnGap) || 0;
        width = Math.min((innerW - gap) * 0.55, innerH * ratio);
      } else {
        // the dock's natural height: every child at its content height
        let need = 0;
        const dockGap = parseFloat(getComputedStyle(dock).rowGap) || 0;
        Array.from(dock.children).forEach((child, i) => {
          const el = child as HTMLElement;
          need +=
            el.scrollHeight +
            (el.offsetHeight - el.clientHeight) +
            (i ? dockGap : 0);
        });
        const gap = parseFloat(style.rowGap) || 0;
        width = Math.min(innerW, 1320, (innerH - need - gap) * ratio);
      }
      setStageWidth(Math.max(160, Math.floor(width)));
    }
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(body);
    observer.observe(dock);
    const mutations = new MutationObserver(fit);
    mutations.observe(dock, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  const practice = engine instanceof PracticeRun ? engine : null;
  const grade = practice?.grade || null;
  const promotions = grade ? LADDER.indexOf(grade) + 1 : 0;

  return createPortal(
    <div
      className={cx(wrapCls, boss && bossCls)}
      onKeyDown={handleLayerKeyDown}
      ref={layerRef}
    >
      <div className={cx(hudCls, boss && bossHudCls)}>
        <button className={quitCls} onClick={onQuit}>
          ← Map
        </button>
        <span className={labelCls}>
          {boss ? 'BOSS · THE TEST' : 'PRACTICE'}
        </span>
        <AudioToggles className={audioCls} />
      </div>
      {/* the stage, the progress marbles and the question card sit together;
          the stage takes the size the card leaves (one screen, any device) */}
      <div className={bodyCls} ref={bodyRef}>
        <div className={stageFitCls} style={{ width: stageWidth }}>
          <Stage engine={engine} />
        </div>
        <div className={dockCls} ref={dockRef}>
          <span className={slotsCls}>
            {boss
              ? Array.from({ length: 7 }, (_, i) => {
                  const g = Object.values(answers)
                    .map((a) => a.grade)
                    .filter(Boolean)[i] as Grade | undefined;
                  return (
                    <span
                      key={i}
                      className={cx(slotCls, !g && emptySlotCls)}
                      style={
                        g
                          ? { backgroundImage: `url(${spriteUri(g)})` }
                          : undefined
                      }
                    >
                      {g || ''}
                    </span>
                  );
                })
              : // practice counts right answers, not speed (Mikey 10-07:
                // grade marbles here read like Classic's speed grades)
                [
                  <span key="label" className={pipLabelCls}>
                    Right answers
                  </span>,
                  ...LADDER.map((g, i) => (
                    <span
                      key={g}
                      className={cx(pipCls, i < promotions && pipOnCls)}
                      aria-hidden
                    />
                  )),
                  <span key="count" className={pipLabelCls}>
                    {promotions}/{LADDER.length}
                  </span>
                ]}
          </span>
          <div className={cx(cardCls, boss && bossCardCls)}>
            <div className={cardInnerCls}>
              {phase === 'finishing' || toFlag || !question ? (
                <div className={readyCls}>
                  {phase === 'finishing'
                    ? 'SAVING…'
                    : boss
                      ? 'THE LAST HIT…'
                      : 'TO THE FLAG…'}
                </div>
              ) : boss && phase === 'waiting' ? (
                <div className={readyCls}>GET READY…</div>
              ) : (
                <>
                  <div className={metaCls}>
                    {/* just the grammar point: the level shows what a right answer does */}
                    {boss
                      ? `Hit ${Math.min(position + 1, 7)} of 7 · ${question.skillName}`
                      : question.retryOf != null
                        ? `Again · ${question.skillName}`
                        : question.skillName}
                  </div>
                  <div className={questionCls}>{question.question}</div>
                  {boss && phase === 'reading' ? null : (
                    <div className={choicesCls}>
                      {question.choices.map((choice, i) => {
                        const picked =
                          answer?.selectedIndex === i && !answer?.isCorrect;
                        const right =
                          answer?.correctIndex === i &&
                          (answer.isCorrect || !boss);
                        const crossed =
                          wrongPicks.includes(i) || (picked && !boss);
                        return (
                          <button
                            key={i}
                            className={cx(
                              choiceCls,
                              boss && bossChoiceCls,
                              right && rightCls,
                              crossed && wrongCls
                            )}
                            disabled={
                              phase !== 'asking' || wrongPicks.includes(i)
                            }
                            onClick={() => handlePick(i)}
                          >
                            <span className={keyCls}>{'ABCD'[i]}</span>
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {error && <div className={errorCls}>{error}</div>}
                  {((phase === 'review' && answer && !answer.isCorrect) ||
                    (phase === 'bossReview' && answer)) && (
                    <div className={reviewCls}>
                      {answer.ruleCard && (
                        <div className={ruleScrollCls}>
                          <RuleCard
                            card={answer.ruleCard}
                            look={boss ? 'boss' : 'quest'}
                            pickedChoice={
                              question.choices[
                                boss
                                  ? (bossMissPick ?? -1)
                                  : answer.selectedIndex
                              ] ?? null
                            }
                            koreanShown={koreanShown}
                            onToggleKorean={handleToggleKorean}
                          />
                        </div>
                      )}
                      {boss ? (
                        <div className={nextRowCls}>
                          <span className={cx(nextNoteCls, bossNoteCls)}>
                            {reading
                              ? `Next hit in ${secondsLeft}…`
                              : 'Get ready…'}
                          </span>
                        </div>
                      ) : (
                        <div className={nextRowCls}>
                          {/* Mikey 10-07: a learner who thinks the key is
                              wrong challenges it right here, by Continue (in
                              this row so the card keeps its height). Bosses
                              run on a clock, so theirs wait for the result. */}
                          {answer.challenge && (
                            <button
                              className={challengeCls}
                              title={
                                savedReview ||
                                challengeReview?.status === 'complete'
                                  ? 'Read the reviewer’s explanation'
                                  : 'Think the answer key is wrong? Challenge it'
                              }
                              onClick={() =>
                                setChallengeId(answer.challenge!.questionId)
                              }
                            >
                              <PixelIcon
                                name={
                                  savedReview ||
                                  challengeReview?.status === 'complete'
                                    ? 'check'
                                    : 'flag'
                                }
                                scale={2}
                              />{' '}
                              {challengeReviewLabel(
                                challengeReview,
                                savedReview
                              )}
                            </button>
                          )}
                          <span className={nextNoteCls}>
                            {/* an upheld challenge forgives a practice miss (nemesis misses stay) */}
                            {answer.challenge?.upheld &&
                            run.rules.mode !== 'practice'
                              ? 'Upheld! The answer key is fixed.'
                              : answer.challenge?.upheld
                                ? answer.retry
                                  ? "Upheld! This miss doesn't count; the fixed question comes back later."
                                  : "Upheld! This miss doesn't count."
                                : answer.retry
                                  ? 'It comes back later in this run.'
                                  : 'That was the last try in this run.'}
                          </span>
                          <button
                            className={nextCls}
                            disabled={!ready || reading}
                            onClick={handleContinue}
                          >
                            {reading
                              ? `Read it · ${secondsLeft}`
                              : 'Continue (Enter)'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {challengeId != null && layerRef.current && (
        <ChallengeModal
          isOpen
          portalTarget={layerRef.current}
          questionId={challengeId}
          questionText={question?.question}
          savedReview={savedReview}
          questKind={run.kind}
          returnLabel="Back to question"
          continueLabel={ready && !reading ? 'Continue' : undefined}
          onContinue={
            ready && !reading
              ? () => {
                  setChallengeId(null);
                  handleContinue();
                }
              : undefined
          }
          onClose={() => setChallengeId(null)}
        />
      )}
    </div>,
    document.body
  );

  async function handlePick(choiceIndex: number) {
    if (!question || phase !== 'asking') return;
    if (boss && wrongPicks.includes(choiceIndex)) return;
    if (practice?.busy) return;
    const responseMs = Math.round(performance.now() - shownAt.current);
    setPhase('sending');
    setError('');
    try {
      const result: QuestAnswer = await answerQuestion({
        runId: run.runId,
        position: question.position,
        choiceIndex,
        responseMs
      });
      if (boss) {
        const fight = engine as BossFight;
        if (!result.isCorrect) {
          setWrongPicks((w) => [...w, choiceIndex]);
          fight.answerWrong();
          setPhase('asking');
          return;
        }
        setAnswers((prev) => ({ ...prev, [result.position]: result }));
        setBossMissPick(
          wrongPicks.length ? wrongPicks[wrongPicks.length - 1] : null
        );
        setWrongPicks([]);
        const next = questions[position + 1];
        if (next?.baseTimeMs) {
          fight.setQuestion({
            baseTimeMs: next.baseTimeMs,
            revealDelayMs: next.revealDelayMs || 1500
          });
        }
        // a hit that took wrong clicks: its explanation shows while the next
        // question waits (the same read time the server adds to its clock)
        const holdMs = result.readMs || 0;
        fight.answerRight((result.grade || 'F') as Grade, holdMs);
        setReady(false);
        setPhase(holdMs ? 'bossReview' : 'waiting');
        return;
      }
      const run_ = engine as PracticeRun;
      setAnswers((prev) => ({ ...prev, [result.position]: result }));
      const retry = result.retry;
      if (retry)
        setQuestions((qs) =>
          qs.some((q) => q.position === retry.position) ? qs : [...qs, retry]
        );
      setReady(false);
      run_.answer(result.isCorrect);
      if (result.isCorrect && (result.rights || 0) >= (result.goal || 5))
        setToFlag(true);
      setPhase(result.isCorrect ? 'waiting' : 'review');
    } catch (e: any) {
      setError(
        e?.response?.data?.error ||
          'That answer did not reach the server. Try again.'
      );
      setPhase('asking');
    }
  }

  // the modal behind keeps its own Tab trap; keep focus on this layer
  function handleLayerKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // the Challenge modal traps Tab itself
    if (challengeOpenRef.current) return;
    if (e.key !== 'Tab') return;
    const items = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (!items.length) return;
    e.preventDefault();
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.shiftKey
      ? i <= 0
        ? items.length - 1
        : i - 1
      : i === -1 || i === items.length - 1
        ? 0
        : i + 1;
    items[next].focus();
  }

  function handleContinue() {
    if (reading) return;
    // practice: the run has room for only so many re-asks; a miss with none
    // left (and nothing else open) ends the stop here, uncleared
    if (!boss && !toFlag && nextOpen < 0) {
      finish();
      return;
    }
    setPhase('waiting');
  }

  async function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase('finishing');
    // let the flag or the boss's last moment play before the result
    await new Promise((resolve) => setTimeout(resolve, 1400));
    try {
      const result = await finishRun(run.runId);
      // the result lists missed questions to challenge, so it needs their text
      const byPosition = new Map(
        questions.map((q) => [q.position, q.question])
      );
      onFinished(
        result,
        Object.values(answersRef.current).map((a) => ({
          ...a,
          questionText: byPosition.get(a.position)
        }))
      );
    } catch {
      finishedRef.current = false;
      setError('Could not save the run. Try again from the map.');
    }
  }

  async function refreshQueued() {
    try {
      const fresh = await loadRun(run.runId);
      const byPosition = new Map<number, QuestQuestion>(
        (fresh?.questions || []).map((q: QuestQuestion) => [q.position, q])
      );
      setQuestions((qs) =>
        qs.map((q) =>
          answersRef.current[q.position] ? q : byPosition.get(q.position) || q
        )
      );
    } catch {
      // reopening the run shows the new wording
    }
  }

  function handleToggleKorean() {
    setKoreanShown((shown) => {
      saveKoreanShown(!shown);
      return !shown;
    });
  }
}

// A full-screen layer above the modal (getZIndex in Modal starts at
// 9,999,999; achievement toasts sit at 2147483000 and stay on top):
// HUD, then the level shrunk to fit, then the question card.
const wrapCls = css`
  position: fixed;
  inset: 0;
  z-index: 2147482000;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: ${INK};
  background:
    radial-gradient(
      ellipse at 50% 30%,
      rgba(90, 70, 140, 0.35) 0,
      rgba(26, 20, 38, 0) 60%
    ),
    #1a1426;
`;
const bossCls = css`
  color: #f3eefc;
  background:
    radial-gradient(
      ellipse at 50% 30%,
      rgba(140, 40, 90, 0.3) 0,
      rgba(20, 13, 34, 0) 60%
    ),
    #140d22;
`;
// the level keeps 960:380 and fits both the width and the height left over
// stage + marbles + card, centered together under the top bar
const bodyCls = css`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 0.8rem 1rem 1rem;
  overflow: hidden;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.5rem;
    padding: 0.5rem 0.4rem 0.6rem;
  }
  @media (max-height: 520px) {
    gap: 0.4rem;
    padding: 0.3rem 0.6rem 0.4rem;
  }
  /* short landscape screens (phones on their side): stage beside the card */
  @media (max-height: 520px) and (orientation: landscape) {
    flex-direction: row;
    align-items: center;
    gap: 0.8rem;
  }
`;
// the progress marbles and the question card; the card scrolls inside
// itself only if a screen is too short even for it
const dockCls = css`
  flex: 0 1 auto;
  min-height: 0;
  width: 100%;
  max-width: 1000px;
  max-height: 100%;
  @media (max-height: 520px) and (orientation: landscape) {
    flex: 1;
    width: auto;
    min-width: 0;
  }
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  @media (max-height: 520px) {
    gap: 0.3rem;
  }
`;
const audioCls = css`
  margin-left: auto;
`;
const stageFitCls = css`
  flex: none;
  max-width: 1320px;
  canvas {
    border-radius: 0;
  }
`;
// the status bar above the level, like the canvas HUD
const hudCls = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem 0.8rem;
  background: #2a2140;
  border-bottom: 3px solid ${INK};
  color: #fff3d0;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
  }
`;
const bossHudCls = css`
  background: #2a1838;
`;
const quitCls = css`
  ${button(WOOD, '#3b1f0c', '#fff3d0')}
  flex-shrink: 0;
  min-height: 4.4rem;
  margin-bottom: 4px;
  padding: 0 0.8rem;
  font-family: inherit;
  font-size: 1.3rem;
  font-weight: 800;
  text-shadow: 1px 1px 0 ${INK};
`;
const labelCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 1rem;
  color: #ffd84a;
  ${inkShadow(1)}
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.8rem;
  }
`;
// the progress marbles on their own row (Mikey 10-07): a dark plate as wide
// as the card, the marbles centered both ways with room around them
const slotsCls = css`
  ${frame(NIGHT, 2)}
  flex: none;
  width: 100%;
  min-height: 5.2rem;
  padding: 0.8rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    min-height: 4.4rem;
    padding: 0.6rem 0.6rem;
    gap: 0.5rem;
  }
  @media (max-height: 520px) {
    min-height: 3.6rem;
    padding: 0.4rem 0.6rem;
  }
`;
// filled slots show the run's pixel marble (its letter is drawn on it)
const pipLabelCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 1rem;
  color: #c9bfa3;
  white-space: nowrap;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.85rem;
  }
`;
// a practice stop's progress: one pip per right answer (5 clear the stop)
const pipCls = css`
  ${frame(PLATE, 1)}
  width: 2.2rem;
  height: 2.2rem;
  flex: none;
  @media (max-width: ${mobileMaxWidth}) {
    width: 1.8rem;
    height: 1.8rem;
  }
`;
const pipOnCls = css`
  ${frame(GOLD, 1)}
`;
const slotCls = css`
  width: 28px;
  height: 28px;
  @media (max-width: ${mobileMaxWidth}) {
    width: 24px;
    height: 24px;
  }
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  font-size: 0;
  color: transparent;
`;
const emptySlotCls = css`
  background-image: url('${pixelSvg(discRows(12, { dotted: true }), {
    k: '#8d8aa0',
    f: '#4a4160',
    l: '#5a5072',
    s: '#3d3552',
    g: '#6b6286'
  })}');
  font-family: ${PIXEL_FONT};
  font-size: 0.8rem;
  color: #a39cb8;
`;
// the question card: natural height, pinned under the level
const cardCls = css`
  ${frame(PARCHMENT, 3)}
  flex: 0 1 auto;
  min-height: 0;
  overflow-y: auto;
  width: 100%;
  max-width: 980px;
  @media (max-width: ${mobileMaxWidth}) {
    ${frame(PARCHMENT, 2)}
  }
`;
const bossCardCls = css`
  ${frame(NIGHT, 3)}
  @media (max-width: ${mobileMaxWidth}) {
    ${frame(NIGHT, 2)}
  }
`;
const cardInnerCls = css`
  padding: 0.8rem 1.2rem 1rem;
  @media (min-height: 760px) {
    min-height: 15rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.6rem 0.6rem 0.8rem;
  }
  @media (max-height: 520px) {
    padding: 0.4rem 0.8rem 0.6rem;
  }
`;
// a long rule card scrolls on its own; choices and Continue stay put
const challengeCls = css`
  ${challengeButton()}
  flex: none;
  margin-right: auto;
  @media (max-height: 520px) and (orientation: landscape) {
    min-height: 3.4rem;
  }
  min-height: 4rem;
  padding: 0.3rem 1.2rem;
  font-size: 1.1rem;
`;
const ruleScrollCls = css`
  max-height: 26vh;
  max-height: 26dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  @media (max-height: 520px) {
    max-height: 22vh;
    max-height: 22dvh;
  }
`;
const readyCls = css`
  padding: 4rem 0;
  text-align: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 1.3rem;
  opacity: 0.7;
  @media (max-height: 520px) {
    padding: 1.6rem 0;
  }
`;
const metaCls = css`
  font-size: 1.25rem;
  font-weight: 700;
  opacity: 0.7;
`;
const questionCls = css`
  margin: 0.3rem 0 1.3rem;
  font-size: 2.1rem;
  font-weight: 800;
  line-height: 1.35;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.8rem;
  }
  /* short screens (phone landscape): keep all four choices in view */
  @media (max-height: 520px) {
    margin: 0.2rem 0 0.6rem;
    font-size: 1.6rem;
  }
`;
const choicesCls = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    gap: 0.7rem;
  }
  @media (max-height: 520px) {
    gap: 0.6rem;
  }
`;
// Classic's chunky game buttons; bosses switch to red-purple
const choiceCls = css`
  display: flex;
  align-items: center;
  padding: 1.2rem 1.4rem;
  border-radius: 14px;
  border: 2px solid #2f6fd1;
  background: linear-gradient(#5aa0f2, #3f86e6);
  color: #fff;
  font-size: 1.7rem;
  font-weight: 800;
  text-align: left;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
  box-shadow: 0 4px 0 #2a5fb0;
  cursor: pointer;
  transition:
    transform 0.06s,
    box-shadow 0.06s;
  &:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #2a5fb0;
  }
  &:disabled {
    cursor: default;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.9rem 1.2rem;
    font-size: 1.6rem;
  }
  @media (max-height: 520px) {
    padding: 0.7rem 1rem;
    font-size: 1.4rem;
  }
`;
const bossChoiceCls = css`
  border-color: #9b2d5c;
  background: linear-gradient(#c0407a, #9b2d6a);
  box-shadow: 0 4px 0 #6d1f4b;
`;
const rightCls = css`
  && {
    border-color: #1f9a4c;
    background: linear-gradient(#4fd17c, #2fb862);
    box-shadow: 0 4px 0 #18803e;
  }
`;
const wrongCls = css`
  && {
    border-color: #3a3442;
    background: linear-gradient(#ff8fa8, #f0607f);
    box-shadow: 0 4px 0 #b02c4b;
    opacity: 0.85;
  }
`;
const keyCls = css`
  display: inline-flex;
  flex-shrink: 0;
  width: 2.6rem;
  height: 2.6rem;
  margin-right: 1rem;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.25);
`;
const errorCls = css`
  margin-top: 1rem;
  color: #f0607f;
  font-size: 1.3rem;
`;
const reviewCls = css`
  margin-top: 0.8rem;
  color: #1f2937;
`;
const nextRowCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.6rem;
  @media (max-height: 520px) and (orientation: landscape) {
    margin-top: 0.3rem;
  }
`;
const nextNoteCls = css`
  font-size: 1.25rem;
  font-weight: 700;
  opacity: 0.7;
  flex: 1 1 10rem;
`;
// the boss card is dark: its notes read light (Mikey 10-08: "Get ready…"
// vanished on it)
const bossNoteCls = css`
  color: #f3eefc;
  opacity: 0.85;
`;
const nextCls = css`
  ${button(GOLD, '#8a5200')}
  min-height: 4.8rem;
  margin-bottom: 4px;
  padding: 0.4rem 1.6rem;
  font-size: 1.2rem;
  text-transform: uppercase;
  /* phones on their side: the miss card's row stays as short as the chips */
  @media (max-height: 520px) and (orientation: landscape) {
    min-height: 3.4rem;
  }
`;
