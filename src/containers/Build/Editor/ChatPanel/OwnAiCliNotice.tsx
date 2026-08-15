import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';

export default function OwnAiCliNotice({ buildId }: { buildId: number }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPromptText, setShowPromptText] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);

  const buildUrl = `${window.location.origin}/build/${buildId}`;
  const prompt = [
    `I build apps on Twinkle using an AI called Lumine, but I want my own Codex or Claude Code subscription to power Lumine's workspace loop without using Twinkle AI Energy. Please help me set it up from my computer.`,
    '',
    `1. Ask whether I want to use Codex or Claude Code. If that CLI isn't installed and signed in with my subscription yet, walk me through it. Never ask me to paste a provider token into Twinkle.`,
    `2. Help me log in to the Lumine CLI by running this in a terminal: npx @stage5/lumine@latest login`,
    `3. Download my project: npx @stage5/lumine@latest pull ${buildUrl}`,
    `4. Open the downloaded folder in the terminal. For each change I request, run one of these commands from that folder:`,
    `   Codex: npx @stage5/lumine@latest agent --provider codex "<my request>"`,
    `   Claude Code: npx @stage5/lumine@latest agent --provider claude-code "<my request>"`,
    `5. Explain that the external model can only inspect and change the project through Lumine's tools, Lumine validates before saving, and the normal server filesHash guard prevents stale overwrites.`,
    `6. After the run, show me its short result and any evidence-based Lumine loop feedback saved under .twinkle/agent-runs/. Do not expose private chain-of-thought.`
  ].join('\n');

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={css`
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          padding: 0.55rem 1.1rem;
          border-radius: 999px;
          border: 1px solid rgba(37, 99, 235, 0.22);
          background: rgba(37, 99, 235, 0.07);
          color: var(--chat-text);
          margin-bottom: 0.6rem;
          font-size: var(--build-workshop-body-font-size);
          font-weight: 800;
          cursor: pointer;
          transition:
            background-color 0.16s ease,
            border-color 0.16s ease;
          &:hover,
          &:focus-visible {
            border-color: rgba(37, 99, 235, 0.45);
            background: rgba(37, 99, 235, 0.12);
          }
        `}
      >
        <span>Keep building with your own AI</span>
        <span
          className={css`
            color: #1d4ed8;
            font-weight: 800;
            white-space: nowrap;
          `}
        >
          Show me how
        </span>
      </button>
    );
  }

  return (
    <div
      className={css`
        width: 100%;
        padding: 1rem 1.1rem;
        border-radius: 12px;
        border: 1px solid rgba(37, 99, 235, 0.22);
        background: rgba(37, 99, 235, 0.07);
        color: var(--chat-text);
        margin-bottom: 0.6rem;
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          margin-bottom: 0.35rem;
        `}
      >
        <div
          className={css`
            font-weight: 800;
          `}
        >
          Keep Building With Your Own AI
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className={css`
            border: none;
            background: transparent;
            color: #1d4ed8;
            font-size: var(--build-workshop-small-font-size);
            font-weight: 800;
            cursor: pointer;
            padding: 0.2rem 0.4rem;
            white-space: nowrap;
          `}
        >
          Hide
        </button>
      </div>
      <div
        className={css`
          line-height: 1.5;
          opacity: 0.86;
          font-size: var(--build-workshop-body-font-size);
          margin-bottom: 0.7rem;
        `}
      >
        A Codex or Claude Code subscription can power Lumine&apos;s core workspace
        tools and validation from your computer — no Twinkle AI Energy needed.
        Lumine saves only after the project passes its checks, and records
        evidence-based feedback about the loop. Copy this setup prompt into
        Claude or ChatGPT:
      </div>
      <button
        type="button"
        onClick={handleCopyPrompt}
        className={css`
          border: 1px solid rgba(37, 99, 235, 0.3);
          background: rgba(37, 99, 235, 0.12);
          color: #1d4ed8;
          border-radius: 999px;
          padding: 0.5rem 1rem;
          font-size: var(--build-workshop-body-font-size);
          font-weight: 800;
          cursor: pointer;
          transition:
            background-color 0.16s ease,
            border-color 0.16s ease;
          &:hover,
          &:focus-visible {
            border-color: rgba(37, 99, 235, 0.45);
            background: rgba(37, 99, 235, 0.18);
          }
        `}
      >
        {copied ? 'Copied!' : 'Copy the Prompt'}
      </button>
      {showPromptText ? (
        <pre
          className={css`
            margin: 0.7rem 0 0;
            padding: 0.8rem;
            border-radius: 10px;
            border: 1px solid rgba(148, 163, 184, 0.32);
            background: rgba(148, 163, 184, 0.1);
            font-size: 1.1rem;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-word;
            user-select: all;
          `}
        >
          {prompt}
        </pre>
      ) : null}
    </div>
  );

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);

      if (copyResetTimerRef.current) {
        window.clearTimeout(copyResetTimerRef.current);
      }

      copyResetTimerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setShowPromptText(true);
    }
  }
}
