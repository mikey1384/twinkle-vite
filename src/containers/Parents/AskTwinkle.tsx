import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import type { ParentsLang, ParentsText } from './text';

// "Ask about Twinkle": a small chat grounded in the published parent guide.
// No account needed. Nothing is saved on our side except daily counters; the
// conversation lives only in this tab.

const VISITOR_KEY = 'twinkle-parents-visitor';
const GUIDE_URL = 'https://www.twin-kle.com/parents/guide';
const MAX_QUESTION_CHARS = 600;

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

type AskError = keyof ParentsText['askErrors'];

export default function AskTwinkle({
  lang,
  t
}: {
  lang: ParentsLang;
  t: ParentsText;
}) {
  const askParentGuide = useAppContext(
    (v) => v.requestHelpers.askParentGuide
  );
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<AskError | ''>('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [turns, asking, error]);

  return (
    <div className={boxClass} aria-label={t.askBoxTitle} role="region">
      <div className={boxHeaderClass}>
        <span className={dotClass} aria-hidden="true">
          <Icon icon="sparkles" />
        </span>
        <div>
          <h3>{t.askBoxTitle}</h3>
          <p>{t.askBoxSub}</p>
        </div>
      </div>
      <div className={logClass} ref={logRef} aria-live="polite">
        {turns.length === 0 && !asking && (
          <div className={suggestionsClass}>
            {t.askSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleAsk(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        {turns.map((turn, index) => (
          <div
            key={index}
            className={turn.role === 'user' ? userBubbleClass : answerClass}
          >
            <span className={whoClass}>
              {turn.role === 'user' ? t.askYou : t.askAssistant}
            </span>
            {turn.role === 'user' ? (
              <p>{turn.content}</p>
            ) : (
              renderAnswer(turn.content)
            )}
          </div>
        ))}
        {asking && (
          <div className={answerClass}>
            <span className={whoClass}>{t.askAssistant}</span>
            <p className={thinkingClass}>
              <Icon icon="spinner" pulse /> {t.askThinking}
            </p>
          </div>
        )}
        {error && (
          <p role="alert" className={errorClass}>
            {t.askErrors[error]}
          </p>
        )}
      </div>
      <form
        className={formClass}
        onSubmit={(event) => {
          event.preventDefault();
          handleAsk(draft);
        }}
      >
        <textarea
          ref={inputRef}
          value={draft}
          rows={2}
          maxLength={MAX_QUESTION_CHARS}
          placeholder={t.askPlaceholder}
          aria-label={t.askPlaceholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              handleAsk(draft);
            }
          }}
        />
        <button type="submit" disabled={asking || !draft.trim()}>
          <Icon icon="paper-plane" />
          <span>{t.askSend}</span>
        </button>
      </form>
      <div className={noteClass}>
        <p>
          {t.askNote}{' '}
          <a href="/parents/guide" target="_blank" rel="noopener">
            {t.askGuideLink}
          </a>
          <button type="button" onClick={handleCopy} className={copyClass}>
            <Icon icon={copied ? 'check' : 'copy'} />
            {copied ? t.askCopied : t.askCopy}
          </button>
        </p>
        {remaining !== null && <p>{t.askRemaining(remaining)}</p>}
      </div>
    </div>
  );

  async function handleAsk(text: string) {
    const question = text.trim();
    if (!question || asking) return;
    if (question.length > MAX_QUESTION_CHARS) {
      setError('too_long');
      return;
    }
    const history = turns.slice(-6);
    setTurns((prev) => [...prev, { role: 'user', content: question }]);
    setDraft('');
    setError('');
    setAsking(true);
    try {
      const result = await askParentGuide({
        question,
        history,
        lang,
        visitorId: getVisitorId()
      });
      if (result?.answer) {
        setTurns((prev) => [
          ...prev,
          { role: 'assistant', content: result.answer as string }
        ]);
        if (typeof result.remainingToday === 'number') {
          setRemaining(result.remainingToday);
        }
      } else {
        const code = String(result?.error || 'failed') as AskError;
        setError(code in t.askErrors ? code : 'failed');
        if (code === 'visitor') setRemaining(0);
      }
    } catch {
      setError('failed');
    } finally {
      setAsking(false);
      inputRef.current?.focus();
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(GUIDE_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.askCopy, GUIDE_URL);
    }
  }
}

function getVisitorId() {
  try {
    const stored = localStorage.getItem(VISITOR_KEY);
    if (stored && /^[A-Za-z0-9_-]{8,64}$/.test(stored)) return stored;
    const fresh =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VISITOR_KEY, fresh);
    return fresh;
  } catch {
    return '';
  }
}

// The assistant replies in plain text: paragraphs and "- " bullets.
function renderAnswer(text: string) {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`}>
        {bullets.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
    bullets = [];
  };
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    const bullet = /^[-•*]\s+(.+)$/.exec(trimmed);
    if (bullet) {
      bullets.push(bullet[1].replace(/\*\*/g, ''));
    } else {
      flush();
      if (trimmed) {
        blocks.push(
          <p key={`p-${blocks.length}`}>{trimmed.replace(/\*\*/g, '')}</p>
        );
      }
    }
  }
  flush();
  return blocks;
}

const boxClass = css`
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #d9e3f3;
  border-radius: 1.8rem;
  background: #fff;
  box-shadow: 0 1.8rem 4rem rgba(31, 52, 94, 0.12);
  overflow: hidden;
`;

const boxHeaderClass = css`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.6rem 2rem;
  border-bottom: 1px solid #e7edf7;
  background: #f4f8ff;
  h3 {
    margin: 0;
    font-size: 1.8rem;
    color: #1d2742;
  }
  p {
    margin: 0.2rem 0 0;
    font-size: 1.35rem;
    color: #56627a;
  }
`;

const dotClass = css`
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 3.8rem;
  height: 3.8rem;
  border-radius: 50%;
  background: #418ceb;
  color: #fff;
  font-size: 1.7rem;
`;

const logClass = css`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  height: 34rem;
  padding: 1.8rem 2rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  @media (max-width: ${mobileMaxWidth}) {
    height: 30rem;
    padding: 1.4rem 1.4rem;
  }
`;

const suggestionsClass = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.9rem;
  margin-top: auto;
  button {
    max-width: 100%;
    padding: 1rem 1.4rem;
    border: 1px solid #cfdcf2;
    border-radius: 1.4rem;
    background: #fff;
    color: #24406f;
    font-size: 1.5rem;
    text-align: left;
    line-height: 1.4;
    cursor: pointer;
    transition:
      background 0.15s,
      transform 0.15s;
    &:hover {
      background: #eef4ff;
      transform: translateY(-1px);
    }
    &:focus-visible {
      outline: 3px solid #99c2ff;
      outline-offset: 2px;
    }
  }
`;

const bubbleBase = `
  max-width: 88%;
  padding: 1.1rem 1.4rem;
  border-radius: 1.4rem;
  font-size: 1.55rem;
  line-height: 1.55;
  p { margin: 0; }
  p + p, ul + p, p + ul { margin-top: 0.7rem; }
  ul { margin: 0; padding-left: 2rem; }
  li + li { margin-top: 0.3rem; }
`;

const userBubbleClass = css`
  ${bubbleBase}
  align-self: flex-end;
  background: #418ceb;
  color: #fff;
  border-bottom-right-radius: 0.4rem;
  span {
    color: rgba(255, 255, 255, 0.85);
  }
`;

const answerClass = css`
  ${bubbleBase}
  align-self: flex-start;
  background: #f3f5f9;
  color: #1f2638;
  border-bottom-left-radius: 0.4rem;
`;

const whoClass = css`
  display: block;
  margin-bottom: 0.3rem;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #5d6983;
`;

const thinkingClass = css`
  color: #56627a;
`;

const errorClass = css`
  margin: 0;
  padding: 1rem 1.3rem;
  border-radius: 1rem;
  background: #fff4e5;
  color: #7a4a00;
  font-size: 1.45rem;
`;

const formClass = css`
  display: flex;
  gap: 1rem;
  padding: 1.2rem 1.6rem;
  border-top: 1px solid #e7edf7;
  textarea {
    flex: 1;
    min-width: 0;
    resize: none;
    padding: 1rem 1.2rem;
    border: 1px solid #cdd6e6;
    border-radius: 1.2rem;
    font: inherit;
    font-size: 1.55rem;
    line-height: 1.45;
    color: #1f2638;
    background: #fbfcfe;
    &:focus {
      outline: none;
      border-color: #418ceb;
      box-shadow: 0 0 0 3px rgba(65, 140, 235, 0.2);
    }
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    align-self: stretch;
    padding: 0 1.8rem;
    border: none;
    border-radius: 1.2rem;
    background: #1f5fbf;
    color: #fff;
    font-size: 1.55rem;
    font-weight: 700;
    cursor: pointer;
    &:hover:not(:disabled) {
      background: #184f9f;
    }
    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
    &:focus-visible {
      outline: 3px solid #99c2ff;
      outline-offset: 2px;
    }
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1rem 1.2rem;
    button span {
      display: none;
    }
    button {
      padding: 0 1.5rem;
    }
  }
`;

const noteClass = css`
  padding: 1.2rem 2rem 1.6rem;
  background: #fafbfd;
  border-top: 1px solid #eef1f6;
  font-size: 1.35rem;
  color: #56627a;
  p {
    margin: 0;
    line-height: 1.6;
  }
  p + p {
    margin-top: 0.4rem;
  }
  a {
    color: #1f5fbf;
    font-weight: 700;
    white-space: nowrap;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.2rem 1.4rem 1.4rem;
  }
`;

const copyClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.8rem;
  padding: 0.3rem 0.9rem;
  border: 1px solid #cfdcf2;
  border-radius: 999px;
  background: #fff;
  color: #24406f;
  font-size: 1.25rem;
  cursor: pointer;
  vertical-align: middle;
  &:hover {
    background: #eef4ff;
  }
`;
