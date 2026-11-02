import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { css, cx, keyframes } from '@emotion/css';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import type { AssistantAskContext } from '~/containers/App/AssistantDock/dockState';
import MathText from './MathText';
import { equationPieces, explanationSteps, stepParts } from './explanationSteps';

// The review's explanation, one step at a time (Mikey 11-02: "make it more
// intuitive and animated"). A missed or blank question opens on step 1; each
// "Next step" adds the next authored sentence under the ones before it, and
// a chained calculation in the new step builds up one "= ..." at a time.
// "Show all" opens every step at once and is remembered on this device
// (annoyance audit: the member's choice sticks, never re-offered). A
// question they got right opens with every step shown. One-shot transform/
// opacity animations only; none with reduced motion. The heading follows
// the review's language; controls stay English (Arena's Korean exception
// covers the paper, not generic controls).

const SHOW_ALL_KEY = 'arena-review-steps';

function prefersAllSteps() {
  try {
    return window.localStorage.getItem(SHOW_ALL_KEY) === 'all';
  } catch {
    return false;
  }
}

function rememberAllSteps(all: boolean) {
  try {
    if (all) window.localStorage.setItem(SHOW_ALL_KEY, 'all');
    else window.localStorage.removeItem(SHOW_ALL_KEY);
  } catch {
    // private mode: the choice lasts for this page only
  }
}

export default function StepExplanation({
  text,
  ko,
  startOpen = false,
  ask = null,
  assistant
}: {
  text: string;
  ko: boolean;
  // every step shown from the start (a question they got right)
  startOpen?: boolean;
  // "Ask Zero/Ciel about this step": the question's own Ask context
  ask?: AssistantAskContext | null;
  assistant?: 'Zero' | 'Ciel';
}) {
  const steps = useMemo(() => explanationSteps(text), [text]);
  const [shown, setShown] = useState(() =>
    startOpen || prefersAllSteps() ? steps.length : 1
  );
  // the step that just appeared animates; steps opened together do not
  const [fresh, setFresh] = useState(-1);
  if (!steps.length) return null;
  if (steps.length === 1) {
    return (
      <p className={singleCls}>
        <StepText text={steps[0]} animate={!startOpen} />
      </p>
    );
  }
  const count = Math.min(shown, steps.length);
  const allShown = count >= steps.length;
  return (
    <div className={wrapCls} data-arena-steps={steps.length}>
      <div className={headCls}>
        <span>
          {ko ? '풀이' : 'Solution'} · {ko ? `${count}/${steps.length}단계` : `step ${count} of ${steps.length}`}
        </span>
        <span className={dotsCls} aria-hidden="true">
          {steps.map((_, i) => (
            <i key={i} data-on={i < count} />
          ))}
        </span>
      </div>
      <ol className={listCls}>
        {steps.slice(0, count).map((step, i) => (
          <li key={i} className={cx(i === fresh && freshCls)} data-step={i + 1}>
            <b className={numCls}>{i + 1}</b>
            <span>
              <StepText text={step} animate={i === fresh} />
            </span>
          </li>
        ))}
      </ol>
      <div className={controlsCls}>
        {!allShown && (
          <button
            type="button"
            className={nextCls}
            onClick={() => {
              setFresh(count);
              setShown(count + 1);
            }}
          >
            Next step <span aria-hidden="true">▸</span>
          </button>
        )}
        {!allShown ? (
          <button
            type="button"
            className={linkCls}
            onClick={() => {
              rememberAllSteps(true);
              setFresh(-1);
              setShown(steps.length);
            }}
          >
            Show all
          </button>
        ) : (
          steps.length > 1 && (
            <button
              type="button"
              className={linkCls}
              onClick={() => {
                rememberAllSteps(false);
                setFresh(0);
                setShown(1);
              }}
            >
              Step through again
            </button>
          )
        )}
        {ask && (
          <span className={askCls}>
            {/* the newest step, while they are stepping; the whole question
                once every step is open */}
            <AskAgentButton
              assistant={assistant}
              label={allShown ? undefined : `Ask about step ${count}`}
              showLabelOnMobile
              context={
                allShown
                  ? ask
                  : { ...ask, step: count, label: `${ask.label} · step ${count}` }
              }
            />
          </span>
        )}
      </div>
    </div>
  );
}

// A step's words and math. When it is new, each "= ..." of a calculation
// appears after the one before it. Pieces are rendered only if every piece
// is valid TeX on its own; otherwise the whole expression shows at once.
function StepText({ text, animate }: { text: string; animate: boolean }) {
  const parts = useMemo(() => stepParts(text), [text]);
  let order = 0;
  return (
    <>
      {parts.map((part, i) => {
        if (!part.math) return <React.Fragment key={i}>{part.text}</React.Fragment>;
        const pieces = animate ? renderPieces(part.tex) : null;
        if (!pieces) return <MathText key={i} text={part.text} />;
        return (
          <span key={i} className={part.display ? displayCls : inlineCls} data-pieces={pieces.length}>
            {pieces.map((html, j) => (
              <span
                key={j}
                className={pieceCls}
                style={{ animationDelay: `${280 + order++ * 420}ms` }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ))}
          </span>
        );
      })}
    </>
  );
}

// KaTeX output from our own reviewed bank, trust off (as MathText).
function renderPieces(tex: string): string[] | null {
  const pieces = equationPieces(tex);
  if (pieces.length < 2) return null;
  try {
    return pieces.map((piece) =>
      katex.renderToString(piece, {
        displayMode: false,
        output: 'mathml',
        throwOnError: true,
        trust: false,
        strict: 'ignore'
      })
    );
  } catch {
    return null;
  }
}

const stepIn = keyframes`
  from { opacity: 0; transform: translateY(0.7rem); }
  to { opacity: 1; transform: none; }
`;
const pieceIn = keyframes`
  from { opacity: 0; transform: translateX(-0.5rem); }
  to { opacity: 1; transform: none; }
`;

const wrapCls = css`
  margin-top: 0.6rem;
`;
const singleCls = css`
  margin: 0.4rem 0 0;
`;
const headCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: #4a5257;
`;
const dotsCls = css`
  display: inline-flex;
  gap: 0.35rem;
  i {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    background: #cfd5d9;
    transform: scale(0.8);
    transition: transform 200ms ease, background-color 200ms ease;
  }
  i[data-on='true'] {
    background: #1f6f8b;
    transform: scale(1);
  }
  @media (prefers-reduced-motion: reduce) {
    i { transition: none; }
  }
`;
const listCls = css`
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  li {
    display: flex;
    gap: 0.7rem;
    align-items: flex-start;
    padding: 0.6rem 0.8rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.75);
    overflow-wrap: anywhere;
  }
  li:last-child {
    box-shadow: inset 3px 0 0 #1f6f8b;
  }
`;
const freshCls = css`
  animation: ${stepIn} 300ms ease-out both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
const numCls = css`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: #1f6f8b;
  color: #fff;
  font-size: 1.1rem;
`;
const pieceCls = css`
  display: inline-block;
  animation: ${pieceIn} 320ms ease-out both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
const inlineCls = css`
  math { font-size: 1.08em; }
`;
const displayCls = css`
  display: block;
  margin: 0.3rem 0;
  text-align: center;
  math { font-size: 1.15em; }
`;
const controlsCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 1rem;
  margin-top: 0.7rem;
`;
const nextCls = css`
  padding: 0.6rem 1.3rem;
  border: 2px solid #1f6f8b;
  border-radius: 999px;
  background: #1f6f8b;
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  &:active { transform: scale(0.97); }
`;
const linkCls = css`
  padding: 0.4rem 0.2rem;
  border: 0;
  background: none;
  color: #1f6f8b;
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
`;
const askCls = css`
  margin-left: auto;
`;
