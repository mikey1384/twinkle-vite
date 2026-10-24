import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { ARENA } from './theme';
import ArenaButton from './ArenaButton';

interface ParentPrompt {
  eligible: boolean;
  dismissed?: boolean;
  onFile?: { toMasked: string } | null;
  rewardXp?: number;
  sent?: {
    status: 'pending' | 'confirmed' | 'report' | 'superseded';
    delivery: string;
    toMasked: string;
  } | null;
}

// After a timed win (Mikey 10-24, SPEC §10): optionally send the result to a
// parent. The email is Korean, in exam terms; a new address gets a confirm
// link, and the parent's confirmation pays the one-time reward when no parent
// email was on file. "Not now" is remembered for this battle, so it never
// asks again here. Everything shown comes from the server.
export default function ParentEmailOffer({ battleId }: { battleId: number }) {
  const loadArenaParentPrompt = useAppContext(
    (v) => v.requestHelpers.loadArenaParentPrompt
  );
  const sendArenaParentReport = useAppContext(
    (v) => v.requestHelpers.sendArenaParentReport
  );
  const dismissArenaParentPrompt = useAppContext(
    (v) => v.requestHelpers.dismissArenaParentPrompt
  );
  const [prompt, setPrompt] = useState<ParentPrompt | null>(null);
  const [typing, setTyping] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<'send' | 'dismiss' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadArenaParentPrompt(battleId)
      .then((data: ParentPrompt) => {
        if (!cancelled) setPrompt(data);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleId]);

  if (!prompt?.eligible) return null;
  const { sent } = prompt;
  if (sent) {
    return (
      <div className={boxCls}>
        <span className={statusCls}>{sentText(sent, prompt.rewardXp || 0)}</span>
      </div>
    );
  }
  if (prompt.dismissed) return null;

  const showInput = typing || !prompt.onFile;
  return (
    <div className={boxCls}>
      <strong className={titleCls}>Send this result to a parent?</strong>
      <span className={noteCls}>
        It goes in Korean, in exam terms (시험명, 원점수, 추정 등급), with a
        note that it is a mock-exam estimate.
        {prompt.rewardXp
          ? ` +${prompt.rewardXp.toLocaleString()} XP once your parent confirms their email.`
          : ''}
      </span>
      {showInput ? (
        <form
          className={rowCls}
          onSubmit={(event) => {
            event.preventDefault();
            handleSend({ email });
          }}
        >
          <input
            className={inputCls}
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="Parent's email"
            aria-label="Parent's email"
            value={email}
            maxLength={254}
            onChange={(event) => setEmail(event.target.value)}
          />
          <ArenaButton
            tone="red"
            size="md"
            loading={busy === 'send'}
            disabled={!email.trim() || !!busy}
            onClick={() => handleSend({ email })}
          >
            Send
          </ArenaButton>
        </form>
      ) : (
        <div className={rowCls}>
          <ArenaButton
            tone="red"
            size="md"
            loading={busy === 'send'}
            disabled={!!busy}
            onClick={() => handleSend({ useOnFile: true })}
          >
            Send to {prompt.onFile!.toMasked}
          </ArenaButton>
          <ArenaButton
            tone="paper"
            size="md"
            disabled={!!busy}
            onClick={() => setTyping(true)}
          >
            Use a different email
          </ArenaButton>
        </div>
      )}
      <div className={rowCls}>
        <ArenaButton
          tone="paper"
          size="md"
          loading={busy === 'dismiss'}
          disabled={!!busy}
          onClick={handleDismiss}
        >
          Not now
        </ArenaButton>
      </div>
      {error && <span className={statusCls}>{error}</span>}
    </div>
  );

  async function handleSend(body: { email?: string; useOnFile?: boolean }) {
    setBusy('send');
    setError('');
    try {
      await sendArenaParentReport(battleId, body);
      // the canonical state (held for review, sent, reward) from the server
      setPrompt(await loadArenaParentPrompt(battleId));
    } catch (err: any) {
      setError(err?.message || 'Could not send it. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function handleDismiss() {
    setBusy('dismiss');
    setError('');
    try {
      await dismissArenaParentPrompt(battleId);
      setPrompt(await loadArenaParentPrompt(battleId));
    } catch (err: any) {
      setError(err?.message || 'Please try again.');
    } finally {
      setBusy(null);
    }
  }
}

function sentText(sent: NonNullable<ParentPrompt['sent']>, rewardXp: number) {
  const to = sent.toMasked;
  // held (or a send that failed and waits in the same queue): Twinkle reads
  // emails to a newly typed address before they go out
  if (sent.delivery === 'held' || sent.delivery === 'failed') {
    return `Twinkle checks this email before it goes to ${to}. You'll see it here once it's sent.`;
  }
  if (sent.status === 'confirmed') return `Sent to ${to} · your parent confirmed ✓`;
  if (sent.status === 'pending') {
    return `Sent to ${to}. Ask your parent to check their inbox (and spam) and confirm${
      rewardXp ? ` for +${rewardXp.toLocaleString()} XP` : ''
    }.`;
  }
  if (sent.status === 'superseded') return `Sent to ${to} earlier.`;
  return `Sent to ${to} ✓`;
}

const boxCls = css`
  flex-basis: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 1.2rem;
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  max-width: 56rem;
  text-align: center;
`;

const titleCls = css`
  font-size: 1.6rem !important;
`;

const noteCls = css`
  font-size: 1.25rem;
  color: ${ARENA.inkSoft};
  line-height: 1.5;
`;

const statusCls = css`
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.5;
`;

const rowCls = css`
  display: flex;
  flex-direction: row !important;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
`;

const inputCls = css`
  flex: 1;
  min-width: 18rem;
  max-width: 32rem;
  padding: 0.7rem 1rem;
  border: 3px solid ${ARENA.line};
  border-radius: 10px;
  font: inherit;
  font-size: 1.5rem;
  background: #fff;
  color: ${ARENA.ink};
  @media (max-width: ${mobileMaxWidth}) {
    min-width: 0;
    width: 100%;
  }
`;
