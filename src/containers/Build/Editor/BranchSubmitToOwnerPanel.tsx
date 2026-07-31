import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import Textarea from '~/components/Texts/Textarea';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { timeSince } from '~/helpers/timeStampHelpers';

// The contributor's side of handing work over: one button that puts the change
// in front of the project owner as a chat message they can act on, instead of a
// forum entry nobody is told about.
export default function BranchSubmitToOwnerPanel({
  rootBuildId,
  branchBuildId,
  hasWorkToSend,
  revisionHash,
  ownerUsername
}: {
  rootBuildId: number;
  branchBuildId: number;
  hasWorkToSend: boolean;
  revisionHash?: string | null;
  ownerUsername?: string | null;
}) {
  const notifyBuildOwnerOfContribution = useAppContext(
    (v) => v.requestHelpers.notifyBuildOwnerOfContribution
  );
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState(0);
  const [error, setError] = useState('');

  // "Sent" describes one particular set of changes, so it cannot outlive them.
  // The panel hides itself by returning null rather than unmounting, so without
  // this the confirmation survives a save or a reset and claims work was handed
  // over that never was. Keyed on the work's own identity, which is exactly what
  // changes when there is something new to send.
  useEffect(() => {
    setSentAt(0);
    setError('');
  }, [revisionHash, branchBuildId]);

  if (!rootBuildId || !branchBuildId || !hasWorkToSend) return null;

  const owner = String(ownerUsername || '').trim() || 'the project owner';

  return (
    <div className={panelClass} aria-live="polite">
      <div className={headingClass}>
        <div className={iconClass} aria-hidden="true">
          <Icon icon="paper-plane" />
        </div>
        <div className={copyClass}>
          <strong>Ready to send this update?</strong>
          <span>
            Send {owner} a message with what changed. They can review it, merge
            it, or replace Main from chat.
          </span>
        </div>
      </div>
      <Textarea
        className={noteClass}
        minRows={2}
        placeholder="Tell them what you changed (optional)"
        value={note}
        onChange={(event: any) => setNote(event.target.value)}
      />
      {error ? (
        <div className={errorClass} role="alert">
          {error}
        </div>
      ) : null}
      {sentAt ? (
        <div className={sentClass} role="status">
          <Icon icon="check" />
          <span>
            Sent to {owner} {timeSince(sentAt)}. It is ready for review in your
            chat.
          </span>
        </div>
      ) : null}
      <div className={actionClass}>
        <GameCTAButton
          variant={sentAt ? 'neutral' : 'logoBlue'}
          size="md"
          icon={sentAt ? 'redo' : 'paper-plane'}
          shiny={!sentAt}
          loading={sending}
          disabled={sending}
          onClick={handleSend}
        >
          {sentAt ? 'Send again' : `Send update to ${owner}`}
        </GameCTAButton>
      </div>
    </div>
  );

  async function handleSend() {
    if (sending) return;
    setSending(true);
    setError('');
    try {
      const result = await notifyBuildOwnerOfContribution({
        buildId: rootBuildId,
        contributionBuildId: branchBuildId,
        note: note.trim()
      });
      const canonicalMessageId = Number(result?.message?.id || 0);
      const canonicalSentAt = Math.floor(
        Number(result?.message?.timeStamp || 0)
      );
      if (!canonicalMessageId || !canonicalSentAt) {
        setError('Failed to send your changes.');
        return;
      }
      setSentAt(canonicalSentAt);
      setNote('');
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Failed to send your changes.'
      );
    } finally {
      setSending(false);
    }
  }
}

const panelClass = css`
  border: 2px solid rgba(65, 140, 235, 0.72);
  border-radius: 12px;
  background: #eff6ff;
  color: #172554;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  box-shadow: 0 3px 0 rgba(29, 78, 216, 0.18);
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.85rem;
  }
`;

const headingClass = css`
  display: flex;
  align-items: center;
  gap: 0.85rem;
`;

const iconClass = css`
  width: 3rem;
  height: 3rem;
  flex: 0 0 3rem;
  border-radius: 10px;
  background: #418ceb;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  box-shadow: 0 2px 0 #1d4ed8;
`;

const copyClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  strong {
    color: #172554;
    font-size: 1.25rem;
    font-weight: 900;
  }
  span {
    color: #4b5563;
    font-size: 1.1rem;
    font-weight: 800;
    line-height: 1.35;
  }
  @media (max-width: ${mobileMaxWidth}) {
    strong {
      font-size: 1.15rem;
    }
  }
`;

const noteClass = css`
  background: #fff;
  border: 2px solid rgba(65, 140, 235, 0.3);
  border-radius: 10px;
  font-size: 1.1rem;
`;

const errorClass = css`
  border: 1px solid rgba(185, 28, 28, 0.3);
  border-radius: 8px;
  background: #fff1f2;
  color: #b91c1c;
  padding: 0.65rem 0.75rem;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.35;
`;

const sentClass = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid rgba(15, 118, 110, 0.3);
  border-radius: 8px;
  background: #f0fdfa;
  color: #0f766e;
  padding: 0.65rem 0.75rem;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.35;
`;

const actionClass = css`
  display: flex;
  justify-content: flex-end;
  @media (max-width: ${mobileMaxWidth}) {
    > button {
      width: 100%;
    }
  }
`;
