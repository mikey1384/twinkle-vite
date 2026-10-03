import React, { useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { QuestNote, questHelpClass, questInputClass } from '../StepCard';

export interface ParentConsentState {
  status: 'none' | 'pending' | 'approved' | 'declined' | 'question' | 'expired';
  toMasked: string;
  hasGuardian: boolean;
  askedAt: number;
  // the email waits for staff to read it before it goes out
  held?: boolean;
}

// Step 3, the member's side: "Ask my parent". A parent says yes on a link we
// email them (a guardian on file gets it directly; otherwise the member types
// an address), so the tick is the parent's, never the child's own. The server
// never sends back the address, only a masked one.
export default function AskParentPanel({
  crewId,
  state,
  onChanged
}: {
  crewId: number;
  state: ParentConsentState;
  onChanged: () => Promise<void>;
}) {
  const askMeetupParent = useAppContext((v) => v.requestHelpers.askMeetupParent);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [devLinks, setDevLinks] = useState<string[]>([]);

  const status = state.status;
  const ask = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await askMeetupParent({
        crewId,
        email: state.hasGuardian ? undefined : email,
        language: navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'ko'
      });
      setDevLinks(data?.result?.devLinks || []);
      await onChanged();
    } catch (err: any) {
      setError(err?.message || 'We could not send that. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'approved') {
    return (
      <div style={{ color: Color.green(), fontSize: '1.4rem', fontWeight: 700 }}>
        <Icon icon="circle-check" style={{ marginRight: '0.6rem' }} />
        Your parent said yes
      </div>
    );
  }

  const waiting = status === 'pending';
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        padding: 1.2rem 1.4rem;
        border-radius: 1rem;
        border: 1px solid ${Color.logoBlue(0.35)};
        background: ${Color.logoBlue(0.05)};
      `}
    >
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        <Icon icon="user-shield" style={{ marginRight: '0.6rem', color: Color.logoBlue() }} />
        {waiting && state.held
          ? 'Almost sent'
          : waiting
          ? 'Waiting for your parent'
          : status === 'question'
            ? 'Your parent has a question'
            : status === 'declined'
              ? 'Your parent said no'
              : 'Ask your parent'}
      </div>
      <div className={questHelpClass} style={{ marginTop: 0 }}>
        {waiting && state.held
          ? `Staff are taking a quick look first, then it goes to ${state.toMasked}. This is usually within a day.`
          : waiting
          ? `We sent it to ${state.toMasked}. They open it, see everything on one screen, and tap Yes. They do not need an account.`
          : status === 'question'
            ? 'Staff will answer them. You can send the link again if it got lost.'
            : status === 'declined'
              ? 'You can send a new link if they change their mind.'
              : status === 'expired'
                ? 'The last link ran out. Send a new one.'
                : 'We send them a short message (Korean and English) with who is coming, what you will do, where, and which grown-up is there. They do not need an account.'}
      </div>
      {!state.hasGuardian && (
        <input
          className={questInputClass}
          type="email"
          inputMode="email"
          value={email}
          maxLength={254}
          placeholder="Your parent's email"
          aria-label="Your parent's email"
          onChange={(event) => setEmail(event.target.value)}
        />
      )}
      {!(waiting && state.held) && (
      <div>
          <Button
            color="logoBlue"
            loading={busy}
            disabled={busy || (!state.hasGuardian && !email.includes('@'))}
            onClick={ask}
          >
            {waiting || status === 'question' ? 'Send it again' : 'Send to my parent'}
          </Button>
        </div>
      )}
      {error && <QuestNote tone="warning">{error}</QuestNote>}
      {devLinks.map((link) => (
        <a key={link} href={link} target="_blank" rel="noreferrer" style={{ fontSize: '1.2rem' }}>
          (local only) open the parent&apos;s page
        </a>
      ))}
    </div>
  );
}
