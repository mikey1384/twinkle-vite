import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import {
  lessonSteps,
  questionParts,
  stepIndexOf,
  type LessonStep
} from './lessonText';
import type { QuestLesson } from './types';
import { scrollToMore, useMoreBelow } from './moreBelow';
import {
  GOLD,
  INK,
  PARCHMENT,
  PIXEL_FONT,
  TAG,
  button,
  frame
} from './pixelUi';

// A rule-first stop's lesson card (Mikey 10-11: the old "Watch this first"
// card "genuinely confuses" him; it showed a filled-in sentence and notes
// on wrong choices nobody had seen). One page per point the stop teaches:
// its title, its rule, right/wrong pairs, then a worked question shown as a
// question, with its blank, its four choices, the key marked and each
// wrong choice's trap under it. Korean (the point's note) is a secondary
// line behind the toggle. Enter (or Next) turns the page; the last page's
// Got it starts the questions.
// Every page fits one screen (Mikey's rule): a lesson too long for this
// screen is measured once, hidden, and split into its rule page and its
// worked-question page. The footer (page dots, Back, Next / Got it) is
// pinned to the bottom of the card, so it is always in view; a page still
// too tall after the split (a phone held sideways) scrolls only the lesson
// above it, and says so: the lesson fades out at the footer and a "More"
// chip above it scrolls on (an iPhone shows no scrollbar until you scroll).
export default function LessonCard({
  lessons,
  scrollerRef,
  onDone,
  koreanShown,
  onToggleKorean
}: {
  lessons: QuestLesson[];
  // the card that scrolls when its content is taller than the room left
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  onDone: () => void;
  koreanShown: boolean;
  onToggleKorean: () => void;
}) {
  const [split, setSplit] = useState<ReadonlySet<number>>(() => new Set());
  const [step, setStep] = useState<LessonStep>({ lesson: 0, part: 'whole' });
  // lessons already measured on this screen size (a turned phone remeasures)
  const [measured, setMeasured] = useState<ReadonlySet<number>>(
    () => new Set()
  );
  const steps = useMemo(() => lessonSteps(lessons, split), [lessons, split]);
  const at = stepIndexOf(steps, step);
  const current = steps[at];
  const lesson = lessons[current.lesson];
  const last = at === steps.length - 1;
  const hasKorean = lessons.some((l) => !!l.ruleKo);
  const q = current.part === 'rule' ? null : lesson.question;
  const parts = q ? questionParts(q.text) : [];
  const showRule = current.part !== 'worked';
  const measuring = current.part === 'whole' && !measured.has(current.lesson);
  const footRef = useRef<HTMLDivElement>(null);
  // (not while a whole lesson is being measured: it may yet be split)
  const more =
    useMoreBelow(scrollerRef, `${at}:${koreanShown}:${measuring}`) &&
    !measuring;

  function go(index: number) {
    const next = steps[Math.max(0, Math.min(steps.length - 1, index))];
    if (next) setStep(next);
  }
  function forward() {
    if (last) onDone();
    else go(at + 1);
  }

  // a new page starts at its top
  useLayoutEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [at, scrollerRef]);

  // measure a whole lesson once the level has taken its size around it
  useEffect(() => {
    if (!measuring) return;
    const lessonIndex = current.lesson;
    const timer = setTimeout(() => {
      const el = scrollerRef.current;
      // (a phone on its side too: unsplit, Next fell below the card's fold)
      const tooTall = !!el && el.scrollHeight > el.clientHeight + 2;
      if (tooTall && lessons[lessonIndex]?.question)
        setSplit((s) => new Set(s).add(lessonIndex));
      setMeasured((m) => new Set(m).add(lessonIndex));
    }, 160);
    return () => clearTimeout(timer);
  }, [measuring, current.lesson, lessons, scrollerRef]);

  // the screen turned or resized: measure again
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function onResize() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSplit(new Set());
        setMeasured(new Set());
      }, 200);
    }
    addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      removeEventListener('resize', onResize);
    };
  }, []);

  // Enter turns the page (the last one starts the questions); arrows page
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /INPUT|TEXTAREA/.test(target.tagName)) return;
      // a focused button (Back, the Korean toggle) takes its own Enter
      if (target?.tagName === 'BUTTON' && e.key === 'Enter') return;
      if (e.key === 'Enter') forward();
      else if (e.key === 'ArrowRight' && !last) go(at + 1);
      else if (e.key === 'ArrowLeft' && at > 0) go(at - 1);
    }
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  return (
    <div className={cx(wrapCls, measuring && measuringCls)}>
      <div className={headCls}>
        <div className={labelCls}>
          Learn this first
          {lessons.length > 1 && ` · ${current.lesson + 1} / ${lessons.length}`}
        </div>
        {hasKorean && (
          <button className={toggleCls} onClick={onToggleKorean}>
            {koreanShown ? '한국어 숨기기' : '한국어'}
          </button>
        )}
      </div>
      <div className={titleCls}>{lesson.title}</div>
      {showRule && (
        <>
          <div className={ruleCls}>{lesson.rule}</div>
          {koreanShown && lesson.ruleKo && (
            <div className={koCls} lang="ko">
              {lesson.ruleKo}
            </div>
          )}
          {lesson.pairs.length > 0 && (
            <div className={pairsCls}>
              {lesson.pairs.map((p, i) => (
                <div key={i} className={pairCls}>
                  <div className={cx(rowCls, rightRowCls)}>
                    <span
                      className={cx(markCls, rightMarkCls)}
                      aria-label="Right"
                    >
                      ✓
                    </span>
                    <span>{p.right}</span>
                  </div>
                  <div className={cx(rowCls, wrongRowCls)}>
                    <span
                      className={cx(markCls, wrongMarkCls)}
                      aria-label="Wrong"
                    >
                      ✗
                    </span>
                    <span className={wrongTextCls}>{p.wrong}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {q && (
        <div className={workedCls}>
          <div className={labelCls}>Worked example</div>
          <div className={questionCls}>
            {parts.map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <span className={slotCls} aria-label="blank">
                    {'\u00a0'}
                  </span>
                )}
                {part}
              </React.Fragment>
            ))}
          </div>
          <div className={choicesCls}>
            {q.choices.map((choice, i) => {
              const isKey = i === q.key;
              const note = q.notes[i];
              return (
                <div
                  key={i}
                  className={cx(choiceCls, isKey ? keyCls : otherCls)}
                >
                  <div className={choiceLineCls}>
                    <span
                      className={cx(
                        markCls,
                        isKey ? rightMarkCls : wrongMarkCls
                      )}
                      aria-label={isKey ? 'Right' : 'Wrong'}
                    >
                      {isKey ? '✓' : '✗'}
                    </span>
                    <span className={letterCls}>{'abcd'[i]}</span>
                    <span className={choiceTextCls}>{choice}</span>
                  </div>
                  {!isKey && note && <div className={noteCls}>{note}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className={footCls} ref={footRef}>
        {/* the lesson goes on under the footer: a fade and a chip say so */}
        <span className={cx(fadeCls, more && shownCls)} aria-hidden />
        <button
          className={cx(moreCls, more && shownCls)}
          tabIndex={more ? 0 : -1}
          aria-hidden={!more}
          aria-label="Scroll down for more"
          onClick={() =>
            scrollToMore(scrollerRef.current, footRef.current?.offsetHeight)
          }
        >
          More ▼
        </button>
        {steps.length > 1 && (
          <span className={dotsCls} aria-hidden>
            {steps.map((s, i) => (
              <span
                key={`${s.lesson}-${s.part}`}
                className={cx(dotCls, i === at && dotOnCls)}
              />
            ))}
          </span>
        )}
        {at > 0 && (
          <button className={backCls} onClick={() => go(at - 1)}>
            Back
          </button>
        )}
        <button className={nextCls} onClick={forward}>
          {last ? 'Got it (Enter)' : 'Next (Enter)'}
        </button>
      </div>
    </div>
  );
}

// hidden (not removed: it is being measured) for its first moment
const measuringCls = css`
  opacity: 0;
`;
const SHORT = '@media (max-height: 520px) and (orientation: landscape)';
const PHONE = `@media (max-width: ${mobileMaxWidth})`;

const wrapCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  color: ${INK};
  ${SHORT} {
    gap: 0.4rem;
  }
`;
const headCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
`;
const labelCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 0.95rem;
  line-height: 1.6;
  color: #8a5200;
  ${PHONE} {
    font-size: 0.9rem;
  }
`;
const toggleCls = css`
  ${frame(TAG, 2)}
  position: relative;
  flex-shrink: 0;
  padding: 0.2rem 0.9rem;
  font-family: ${PIXEL_FONT};
  font-size: 0.85rem;
  white-space: nowrap;
  color: ${INK};
  cursor: pointer;
  /* a 44px tap box around the small chip, so the header stays short */
  &::before {
    content: '';
    position: absolute;
    inset: -14px -10px;
  }
`;
const titleCls = css`
  font-size: 2rem;
  font-weight: 900;
  line-height: 1.25;
  overflow-wrap: anywhere;
  ${PHONE} {
    font-size: 1.9rem;
  }
  ${SHORT} {
    font-size: 1.6rem;
  }
`;
const ruleCls = css`
  font-size: 1.55rem;
  font-weight: 600;
  line-height: 1.45;
  ${PHONE} {
    font-size: 1.6rem;
  }
  ${SHORT} {
    font-size: 1.35rem;
  }
`;
const koCls = css`
  margin-top: -0.3rem;
  font-size: 1.3rem;
  line-height: 1.45;
  color: #6b5a3a;
`;
// right/wrong pairs: side by side on wide cards, stacked on phones
const pairsCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;
const pairCls = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  ${PHONE} {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
`;
const rowCls = css`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
  ${PHONE} {
    font-size: 1.55rem;
    padding: 0.3rem 0.6rem;
  }
  ${SHORT} {
    font-size: 1.3rem;
    padding: 0.2rem 0.5rem;
  }
`;
const rightRowCls = css`
  background: #dcf5e3;
  border: 2px solid #3fae66;
  color: #0f4a26;
`;
const wrongRowCls = css`
  background: #ffe3e8;
  border: 2px solid #e0647e;
  color: #5c0f22;
`;
// the wrong sentence is struck through in red; its ink stays dark to read
const wrongTextCls = css`
  text-decoration: line-through;
  text-decoration-color: rgba(200, 30, 60, 0.85);
  text-decoration-thickness: 2px;
`;
const markCls = css`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.3em;
  height: 1.3em;
  margin-top: 0.05em;
  border-radius: 4px;
  color: #fff;
  font-weight: 900;
  font-size: 0.95em;
  line-height: 1;
`;
const rightMarkCls = css`
  background: #23944b;
`;
const wrongMarkCls = css`
  background: #d0284a;
`;
const workedCls = css`
  ${frame(TAG, 2)}
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0.8rem 0.7rem;
  ${PHONE} {
    padding: 0.4rem 0.5rem 0.6rem;
  }
  ${SHORT} {
    gap: 0.3rem;
    padding: 0.3rem 0.5rem 0.4rem;
  }
`;
const questionCls = css`
  font-size: 1.7rem;
  font-weight: 800;
  line-height: 1.5;
  overflow-wrap: anywhere;
  ${PHONE} {
    font-size: 1.65rem;
  }
  ${SHORT} {
    font-size: 1.4rem;
  }
`;
// the blank: an empty slot, as the question asks it
const slotCls = css`
  display: inline-block;
  min-width: 4.5em;
  height: 1.15em;
  margin: 0 0.2em;
  vertical-align: -0.2em;
  border-radius: 4px;
  border: 2px dashed #8a5200;
  background: #fff3cf;
`;
const choicesCls = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
`;
const choiceCls = css`
  min-width: 0;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  ${SHORT} {
    padding: 0.2rem 0.5rem;
  }
`;
const keyCls = css`
  background: #dcf5e3;
  border: 2px solid #3fae66;
  color: #0f4a26;
`;
const otherCls = css`
  background: #fbf3df;
  border: 2px solid #d9c493;
  color: ${INK};
`;
const choiceLineCls = css`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.4;
  ${PHONE} {
    font-size: 1.5rem;
  }
  ${SHORT} {
    font-size: 1.3rem;
  }
`;
const letterCls = css`
  flex: none;
  opacity: 0.6;
`;
const choiceTextCls = css`
  min-width: 0;
  overflow-wrap: anywhere;
`;
// a wrong choice's trap, right under it
const noteCls = css`
  margin-top: 0.15rem;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.35;
  opacity: 0.85;
  overflow-wrap: anywhere;
  ${PHONE} {
    font-size: 1.3rem;
  }
  ${SHORT} {
    font-size: 1.15rem;
  }
`;
const FOOT_BG = PARCHMENT.f;
const FOOT_RULE = '#dbc18f';
// pinned to the card's bottom edge: the lesson scrolls under it, Next never
// leaves the screen (Korean shown or a long worked page only scrolls more)
const footCls = css`
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.2rem;
  padding-top: 0.5rem;
  /* the parchment behind it, with a thin rule on top, reaches over the
     card's own padding (as shadows: they add no sideways scroll), so no
     scrolled line shows at its sides */
  &::before,
  &::after {
    content: '';
    position: absolute;
    z-index: -1;
    left: 0;
    right: 0;
    top: 0;
  }
  &::before {
    bottom: 0;
    background: ${FOOT_BG};
    box-shadow:
      -2rem 0 0 ${FOOT_BG},
      2rem 0 0 ${FOOT_BG};
  }
  &::after {
    height: 2px;
    background: ${FOOT_RULE};
    box-shadow:
      -2rem 0 0 ${FOOT_RULE},
      2rem 0 0 ${FOOT_RULE};
  }
`;
// the "more below" cue: hidden (no taps, no tab stop) until the lesson
// scrolls under the footer; it fades in once (opacity only, no loop)
const shownCls = css`
  && {
    opacity: 1;
    visibility: visible;
  }
`;
const fadeCls = css`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  height: 3.2rem;
  pointer-events: none;
  background: linear-gradient(${FOOT_BG}00, ${FOOT_BG});
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s,
    visibility 0.2s;
`;
// a small chip over the faded lines; its tap box is 44px tall (40 on a
// phone on its side) and ends above the footer, so it never takes Next's
// taps
const moreCls = css`
  ${frame(TAG, 2)}
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.8rem);
  translate: -50% 0;
  min-height: 28px;
  padding: 0 1rem;
  font-family: inherit;
  font-size: 1.2rem;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
  color: #8a5200;
  cursor: pointer;
  filter: drop-shadow(0 2px 0 rgba(26, 20, 38, 0.3));
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s,
    visibility 0.2s;
  &::before {
    content: '';
    position: absolute;
    inset: -8px -6px;
  }
  ${SHORT} {
    bottom: calc(100% + 0.6rem);
    &::before {
      inset: -6px -6px;
    }
  }
`;
const dotsCls = css`
  display: inline-flex;
  gap: 0.5rem;
  margin-right: auto;
`;
const dotCls = css`
  width: 1rem;
  height: 1rem;
  background: #d6b46f;
  border: 2px solid ${INK};
`;
const dotOnCls = css`
  background: #ffcb32;
  transform: scale(1.3);
`;
const footButton = `
  min-height: 4.8rem;
  margin-bottom: 4px;
  padding: 0.4rem 1.6rem;
  font-size: 1.2rem;
  text-transform: uppercase;
  ${PHONE} {
    min-height: 44px;
  }
  ${SHORT} {
    min-height: 40px;
  }
`;
const nextCls = css`
  ${button(GOLD, '#8a5200')}
  ${footButton}
`;
const backCls = css`
  ${button(TAG, '#a88a4a', INK)}
  ${footButton}
`;
