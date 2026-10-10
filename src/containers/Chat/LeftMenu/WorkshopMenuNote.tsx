import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';

// How often the note checks whether Lumine helpers are open (the note shows
// only while they are, or while this member has Workshop work going on).
const NOTE_REFRESH_MS = 60_000;

// The one standing Lumine Workshop note for the Zero/Ciel chat's left menu,
// instead of warnings inside the conversation (Mikey, 2026-10-10). The text
// is the server's; empty while the Workshop is not open to this member.
export function useWorkshopMenuNote(persona: 'zero' | 'ciel' | null) {
  const loadBuildWorkshopStatus = useAppContext(
    (v) => v.requestHelpers.loadBuildWorkshopStatus
  );
  const [note, setNote] = useState('');

  useEffect(() => {
    setNote('');
    if (!persona) return;
    let disposed = false;
    async function refresh() {
      try {
        const status = await loadBuildWorkshopStatus({ persona });
        if (disposed) return;
        const visible = status?.featureVisible && status?.persona === persona;
        setNote(visible ? String(status?.menuNote || '') : '');
      } catch {
        if (!disposed) setNote('');
      }
    }
    void refresh();
    const interval = window.setInterval(refresh, NOTE_REFRESH_MS);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
    // Context request helpers are stable and intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona]);

  return note;
}

export default function WorkshopMenuNote({ note }: { note: string }) {
  // Open where the column has room; on a phone the narrow menu shows just
  // the title, and a tap opens it.
  const [initiallyOpen] = useState(
    () => !window.matchMedia(`(max-width: ${mobileMaxWidth})`).matches
  );
  return (
    <details
      open={initiallyOpen}
      aria-label="About Lumine helpers"
      data-workshop-menu-note
      className={css`
        flex: 0 0 auto;
        margin: 1.2rem 1rem 0;
        padding: 1rem 1.1rem;
        border-radius: 10px;
        background: var(--chat-bg, #f8fafc);
        border: 1px solid var(--chat-panel-border, #e2e8f0);
        color: var(--chat-muted-text, #475569);
        font-size: 1.2rem;
        line-height: 1.5;
        @container chat-context (max-width: 180px) {
          margin: 0.8rem 0.4rem 0;
          padding: 0.8rem 0.7rem;
        }
        @media (max-width: ${mobileMaxWidth}) {
          margin: 0.6rem 0.4rem 0;
          padding: 0.7rem 0.6rem;
          font-size: max(12px, 1.1rem);
        }
      `}
    >
      <summary
        className={css`
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-weight: 700;
          color: var(--chat-text, #334155);
          cursor: pointer;
          list-style: none;
          &::-webkit-details-marker {
            display: none;
          }
          @media (pointer: coarse) {
            min-height: 36px;
          }
        `}
      >
        <Icon icon="info-circle" />
        <span>Lumine helpers</span>
      </summary>
      <p
        className={css`
          margin: 0.4rem 0 0;
        `}
      >
        {note}
      </p>
    </details>
  );
}
