import React, { useEffect, useRef, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import SwitchButton from '~/components/Buttons/SwitchButton';
import { mobileMaxWidth } from '~/constants/css';
import API_URL from '~/constants/URL';
import { createAppHelperInvitation } from './helpers/appHelperInvitation';
import type { AppHelperPairing } from './hooks/useAppHelperPairing';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55); }
  70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
`;

const waitPulse = keyframes`
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
`;

const toolbarButtonClass = css`
  position: relative;
  border: 1px solid var(--ui-border);
  background: rgba(124, 58, 237, 0.08);
  color: #6d28d9;
  border-radius: 999px;
  height: 2.65rem;
  min-width: 2.65rem;
  padding: 0 0.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
  &:hover {
    background: rgba(124, 58, 237, 0.14);
    border-color: rgba(124, 58, 237, 0.3);
    transform: translateY(-1px);
  }
  &[data-compact='true'] {
    padding: 0;
    width: 2.65rem;
  }
  &[data-attached='true'] {
    background: rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.4);
    color: #166534;
  }
`;

const toolbarDotClass = css`
  position: absolute;
  top: 0.15rem;
  right: 0.15rem;
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid #fff;
  animation: ${pulse} 2s ease-out infinite;
`;

const badgeClass = css`
  position: absolute;
  left: 0.6rem;
  bottom: 0.6rem;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  max-width: calc(100% - 1.2rem);
  padding: 0.32rem 0.7rem 0.32rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.45);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.14);
  color: #14532d;
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.2;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: transform 0.18s ease;
  &:hover {
    transform: translateY(-1px);
  }
  > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const badgeDotClass = css`
  flex: 0 0 auto;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: #22c55e;
  animation: ${pulse} 2s ease-out infinite;
`;

const editsTagClass = css`
  flex: 0 0 auto;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 900;
  background: rgba(100, 116, 139, 0.14);
  color: #475569;
  &[data-on='true'] {
    background: rgba(245, 158, 11, 0.18);
    color: #92400e;
  }
`;

const bodyClass = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  gap: 1.4rem;
  color: var(--chat-text, #1f2937);
  font-size: 1.35rem;
  line-height: 1.5;
  p {
    margin: 0;
  }
`;

const codeRowClass = css`
  display: flex;
  justify-content: center;
  gap: 0.45rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.3rem;
  }
`;

const codeCharClass = css`
  width: 3.2rem;
  height: 4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.8rem;
  background: #f5f3ff;
  border: 2px solid rgba(124, 58, 237, 0.28);
  color: #4c1d95;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 2.3rem;
  font-weight: 800;
  @media (max-width: ${mobileMaxWidth}) {
    width: 2.7rem;
    height: 3.5rem;
    font-size: 2rem;
  }
`;

const copyCodeRowClass = css`
  display: flex;
  justify-content: center;
  margin-top: -0.4rem;
`;

const hintClass = css`
  color: #64748b;
  font-size: 1.15rem;
`;

const detailsClass = css`
  min-width: 0;
  summary {
    color: #6d28d9;
    cursor: pointer;
    font-size: 1.15rem;
    font-weight: 700;
  }
  > div {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    padding-top: 1.2rem;
  }
  textarea {
    display: block;
    width: 100%;
    box-sizing: border-box;
    margin-top: 1rem;
    padding: 0.8rem;
    border: 1px solid var(--ui-border, #cbd5e1);
    border-radius: 0.7rem;
    background: #f8fafc;
    color: #334155;
    font: inherit;
    font-size: 1.1rem;
    line-height: 1.5;
    resize: vertical;
  }
`;

const commandClass = css`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.8rem;
  border-radius: 0.8rem;
  background: #0f172a;
  color: #e2e8f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 1.15rem;
  code {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    white-space: nowrap;
  }
`;

const copyButtonClass = css`
  flex: 0 0 auto;
  border: 1px solid rgba(226, 232, 240, 0.3);
  background: rgba(226, 232, 240, 0.08);
  color: #e2e8f0;
  border-radius: 0.55rem;
  padding: 0.35rem 0.6rem;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  &:hover {
    background: rgba(226, 232, 240, 0.16);
  }
`;

const statusLineClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  color: #64748b;
  font-size: 1.2rem;
  font-weight: 700;
`;

const waitDotClass = css`
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #7c3aed;
  animation: ${waitPulse} 1.4s ease-in-out infinite;
`;

const connectedCardClass = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border-radius: 0.9rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #14532d;
  font-weight: 800;
`;

const switchRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid var(--ui-border);
  strong {
    display: block;
    font-size: 1.3rem;
  }
  small {
    display: block;
    color: #64748b;
    font-size: 1.1rem;
  }
`;

const noticeClass = css`
  padding: 0.7rem 0.9rem;
  border-radius: 0.8rem;
  background: rgba(100, 116, 139, 0.1);
  color: #334155;
  font-size: 1.2rem;
`;

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function formatRemaining(expiresAt: number | null, now: number) {
  if (!expiresAt) return '';
  // Clamp to the 10-minute lifetime so a slightly slow clock never shows 10:01.
  const seconds = Math.min(
    600,
    Math.max(0, Math.floor(expiresAt - now / 1000))
  );
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function AppHelperToolbarButton({
  pairing,
  compact = false,
  hideWhenIdle = false
}: {
  pairing: AppHelperPairing;
  compact?: boolean;
  // Phone portrait: the toolbar has no room left, so the entry point only
  // appears while a helper session exists (to manage or disconnect it).
  hideWhenIdle?: boolean;
}) {
  const { state } = pairing;
  const attached = state.phase === 'attached';
  if (!pairing.available && !state.sessionId) return null;
  if (hideWhenIdle && !state.sessionId) return null;
  const label = attached ? 'AI helper connected' : 'Connect AI helper';
  return (
    <button
      type="button"
      className={toolbarButtonClass}
      data-compact={compact ? 'true' : 'false'}
      data-attached={attached ? 'true' : 'false'}
      onClick={() => {
        pairing.openPanel();
        if (!state.sessionId && state.phase !== 'creating') {
          void pairing.start();
        }
      }}
      title={label}
      aria-label={label}
    >
      <Icon icon="robot" />
      {compact ? null : <span>{attached ? 'AI helper' : 'Connect AI helper'}</span>}
      {attached ? <span className={toolbarDotClass} /> : null}
    </button>
  );
}

export function AppHelperBadge({ pairing }: { pairing: AppHelperPairing }) {
  const { state } = pairing;
  if (state.phase !== 'attached') return null;
  const name = state.helperName || 'AI helper';
  return (
    <button
      type="button"
      className={badgeClass}
      onClick={pairing.openPanel}
      title="AI helper connected. Click to manage."
      aria-label={`${name} connected. Edits ${state.allowEdits ? 'on' : 'off'}.`}
    >
      <span className={badgeDotClass} />
      <span>{name} connected</span>
      <span
        className={editsTagClass}
        data-on={state.allowEdits ? 'true' : 'false'}
      >
        {state.allowEdits ? 'Edits on' : 'Look only'}
      </span>
    </button>
  );
}

export function AppHelperModal({ pairing }: { pairing: AppHelperPairing }) {
  const { state } = pairing;
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState<'' | 'message' | 'code' | 'command'>('');
  const [copyFailed, setCopyFailed] = useState(false);
  const [messageShown, setMessageShown] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const waiting = state.phase === 'waiting';

  useEffect(() => {
    if (!pairing.panelOpen || !waiting) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [pairing.panelOpen, waiting]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(''), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    setCopied('');
    setCopyFailed(false);
    setMessageShown(false);
  }, [state.code, state.phase]);

  useEffect(() => {
    if (copyFailed && messageShown) messageRef.current?.focus();
  }, [copyFailed, messageShown]);

  if (!pairing.panelOpen) return null;
  const invitation = createAppHelperInvitation({
    buildId: pairing.buildId,
    code: state.code,
    codeExpiresAt: state.codeExpiresAt,
    tabUrl: window.location.href,
    apiUrl: API_URL
  });
  const attached = state.phase === 'attached';

  return (
    <Modal
      modalKey="AppHelperModal"
      isOpen
      onClose={pairing.closePanel}
      title={attached ? 'AI helper connected' : 'Connect AI helper'}
      size="sm"
      modalLevel={2}
      footer={
        attached ? (
          <>
            <Button variant="ghost" onClick={pairing.closePanel}>
              Close
            </Button>
            <Button
              color="rose"
              onClick={() => void pairing.disconnect()}
            >
              Disconnect
            </Button>
          </>
        ) : waiting ? (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                void pairing.disconnect();
                pairing.closePanel();
              }}
            >
              Cancel
            </Button>
            <Button variant="ghost" onClick={pairing.closePanel}>
              Hide
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={pairing.closePanel}>
              Close
            </Button>
            {state.phase !== 'creating' ? (
              <Button color="purple" onClick={() => void pairing.start()}>
                {state.phase === 'idle' ? 'Get a code' : 'Get a new code'}
              </Button>
            ) : null}
          </>
        )
      }
    >
      <div className={bodyClass}>
        {state.phase === 'creating' ? (
          <div className={statusLineClass}>
            <span className={waitDotClass} />
            Making a code…
          </div>
        ) : null}

        {waiting ? (
          <>
            <p>
              Copy this message into your AI agent on your computer. It tells
              your agent how to connect and read this tab.
            </p>
            <Button
              color="purple"
              uppercase={false}
              onClick={() => void handleCopy('message', invitation.message)}
            >
              <Icon icon={copied === 'message' ? 'check' : 'copy'} />
              <span style={{ marginLeft: '0.5rem' }}>
                {copied === 'message'
                  ? 'Copied — paste into your AI'
                  : 'Copy instructions for my AI'}
              </span>
            </Button>
            <p className={hintClass}>
              Keep this Twinkle tab open. Use an AI that can work on your
              computer. The message includes setup steps if needed.
            </p>
            {copyFailed ? (
              <div className={noticeClass} role="alert">
                Copy didn’t work in this browser. Select and copy the message
                below, then paste it into your AI.
              </div>
            ) : null}
            <details
              className={detailsClass}
              open={messageShown}
              onToggle={(event) => setMessageShown(event.currentTarget.open)}
            >
              <summary tabIndex={0}>View the message</summary>
              <textarea
                ref={messageRef}
                aria-label="Message for your AI"
                readOnly
                rows={8}
                value={invitation.message}
                onFocus={(event) => event.currentTarget.select()}
              />
            </details>
            <details className={detailsClass}>
              <summary tabIndex={0}>Manual connection</summary>
              <div>
                <p className={hintClass}>
                  Use the full message above unless your agent already knows
                  how to connect with Lumine.
                </p>
                <div className={codeRowClass} aria-label={`Code ${state.code}`}>
                  {state.code.split('').map((char, index) => (
                    <span key={index} className={codeCharClass}>
                      {char}
                    </span>
                  ))}
                </div>
                <div className={copyCodeRowClass}>
                  <Button
                    variant="soft"
                    color="purple"
                    size="sm"
                    uppercase={false}
                    onClick={() => void handleCopy('code', state.code)}
                  >
                    <Icon icon={copied === 'code' ? 'check' : 'copy'} />
                    <span style={{ marginLeft: '0.5rem' }}>
                      {copied === 'code' ? 'Copied' : 'Copy code only'}
                    </span>
                  </Button>
                </div>
                <p className={hintClass}>Command for an MCP client:</p>
                <div className={commandClass}>
                  <code>{invitation.command}</code>
                  <button
                    type="button"
                    className={copyButtonClass}
                    onClick={() =>
                      void handleCopy('command', invitation.command)
                    }
                  >
                    <Icon icon={copied === 'command' ? 'check' : 'copy'} />
                    {copied === 'command' ? 'Copied' : 'Copy command'}
                  </button>
                </div>
              </div>
            </details>
            <div className={statusLineClass}>
              <span className={waitDotClass} />
              Waiting for your helper · expires in{' '}
              {formatRemaining(state.codeExpiresAt, now)}
            </div>
          </>
        ) : null}

        {attached ? (
          <>
            <div className={connectedCardClass}>
              <Icon icon="robot" />
              <span>
                {state.helperName || 'Your AI helper'} can see this tab and
                what you select.
              </span>
            </div>
            <div className={switchRowClass}>
              <div>
                <strong>Allow edits</strong>
                <small>
                  {state.allowEdits
                    ? 'It can change things here. Switch off any time.'
                    : 'Off: it can look but not change anything.'}
                </small>
              </div>
              <SwitchButton
                checked={state.allowEdits}
                disabled={state.allowEditsPending}
                ariaLabel="Allow edits"
                small
                onChange={() => void pairing.setAllowEdits(!state.allowEdits)}
              />
            </div>
          </>
        ) : null}

        {state.phase === 'idle' && !state.message ? (
          <p>
            Connect an AI agent on your computer to see this tab and help you.
            We’ll give you a message to copy into your AI.
          </p>
        ) : null}

        {state.message ? (
          <div className={noticeClass} role="status">
            {state.message}
          </div>
        ) : null}
      </div>
    </Modal>
  );

  async function handleCopy(kind: 'message' | 'code' | 'command', text: string) {
    const succeeded = await copyText(text);
    setCopied(succeeded ? kind : '');
    setCopyFailed(!succeeded);
    if (!succeeded) setMessageShown(true);
  }
}
