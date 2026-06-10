import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';

export default function OwnAiCliNotice({ buildId }: { buildId: number }) {
  const [copied, setCopied] = useState(false);
  const [showPromptText, setShowPromptText] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);

  const buildUrl = `${window.location.origin}/build/${buildId}`;
  const prompt = [
    `I build apps on Twinkle using an AI called Lumine, but I'm out of AI Energy there. Please help me keep working on my project from my own computer instead.`,
    '',
    `1. If your CLI coding tool (Claude Code or Codex) isn't installed on my computer yet, walk me through installing it.`,
    `2. Help me log in to the Lumine CLI by running this in a terminal: npx @stage5/lumine@latest login`,
    `3. Download my project: npx @stage5/lumine@latest pull ${buildUrl}`,
    `4. Open the downloaded folder with your CLI tool, read the AGENTS.md (or CLAUDE.md) inside, and follow it while making the changes I ask for.`,
    `5. When I say I'm happy with the changes, save my work back with: npx @stage5/lumine@latest save`
  ].join('\n');

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

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
          font-weight: 800;
          margin-bottom: 0.35rem;
        `}
      >
        Keep Building With Your Own AI
      </div>
      <div
        className={css`
          line-height: 1.5;
          opacity: 0.86;
          font-size: var(--build-workshop-body-font-size);
          margin-bottom: 0.7rem;
        `}
      >
        If you or a parent have a Claude or ChatGPT subscription, it can keep
        working on this project from your computer — no AI Energy needed. Copy
        this prompt and paste it into Claude or ChatGPT:
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
