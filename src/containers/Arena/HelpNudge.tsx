import React, { useEffect, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import type { AssistantAskContext } from '~/containers/App/AssistantDock/dockState';
import { shouldNudge } from './helpNudgeRule';

// A stuck member is told, once, that Zero and Ciel can teach the next step
// (Mikey 11-02, after Acrux left two whole papers blank without asking: "if
// we need to improve anything improve on how user is guided via ciel/zero").
// Ordinary exams only, and never when the member chose "I'll take it on
// alone" on the cover (Mikey 11-02); none for solo mastery or a timed
// rematch. Annoyance audit: it appears at most once per paper, only
// after real thinking time with nothing (or almost nothing) answered, and
// "Not now" turns it off on this device for good; the Ask buttons on every
// question stay. Showing it is not help; pressing Ask is (assisted.ts).

const OFF_KEY = 'arena-help-nudge';
const DONE_KEY = 'arena-help-nudge-done';
function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // private mode: it stays hidden for this page only
  }
}

export default function HelpNudge({
  battleId,
  startedAt,
  limitSeconds,
  serverNow,
  answered,
  total,
  question,
  assistant
}: {
  battleId: number;
  startedAt: number;
  limitSeconds: number | null;
  // the server's clock in seconds
  serverNow: () => number;
  answered: number;
  total: number;
  // the first question still blank: what Ask attaches
  question: AssistantAskContext | null;
  assistant?: 'Zero' | 'Ciel';
}) {
  const [hidden, setHidden] = useState(
    () => read(OFF_KEY) === 'off' || read(DONE_KEY) === String(battleId)
  );
  const [due, setDue] = useState(false);
  useEffect(() => {
    if (hidden || due) return;
    const check = () =>
      setDue(
        shouldNudge({ elapsed: serverNow() - startedAt, limit: limitSeconds, answered, total })
      );
    check();
    const timer = window.setInterval(check, 15000);
    return () => window.clearInterval(timer);
  }, [hidden, due, startedAt, limitSeconds, answered, total, serverNow]);
  // once shown it stays for this paper until they act on it
  if (hidden || !due || !question) return null;
  const who = assistant || 'Zero or Ciel';
  return (
    <aside className={nudgeCls} role="status" aria-label="Help with this exam">
      <p>
        <b>Stuck?</b> That happens on hard papers. {who} can teach you the
        first step of {question.label}. You still choose the answer, and the
        rewards stay the same.
      </p>
      <div className={buttonsCls}>
        <AskAgentButton
          assistant={assistant}
          context={question}
          showLabelOnMobile
          label={`Ask about ${question.label}`}
          onClick={() => {
            write(DONE_KEY, String(battleId));
            setHidden(true);
          }}
        />
        <button
          type="button"
          className={laterCls}
          onClick={() => {
            write(OFF_KEY, 'off');
            setHidden(true);
          }}
        >
          Not now
        </button>
      </div>
    </aside>
  );
}

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(-0.6rem); }
  to { opacity: 1; transform: none; }
`;

const nudgeCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 1rem;
  margin: 0.6rem auto 0;
  width: calc(100% - 1.6rem);
  max-width: 96rem;
  box-sizing: border-box;
  padding: 0.8rem 1rem;
  border: 2px solid #1f6f8b;
  border-radius: 8px;
  background: #eef6fa;
  color: #192527;
  font-family: system-ui, sans-serif;
  font-size: 1.3rem;
  line-height: 1.45;
  animation: ${slideIn} 300ms ease-out both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
  p {
    flex: 1 1 24rem;
    margin: 0;
  }
`;
const buttonsCls = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;
const laterCls = css`
  padding: 0.5rem 0.4rem;
  border: 0;
  background: none;
  color: #1f6f8b;
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
`;
