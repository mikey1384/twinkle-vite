import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Textarea from '~/components/Texts/Textarea';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';

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
    <div className={panelClass}>
      <strong>Send your changes to {owner}</strong>
      <span>
        They get a message with what you changed, and can merge it or replace
        Main with it from there.
      </span>
      <Textarea
        minRows={2}
        placeholder="Tell them what you changed (optional)"
        value={note}
        onChange={(event: any) => setNote(event.target.value)}
      />
      {error ? <div className={errorClass}>{error}</div> : null}
      {sentAt ? (
        <div className={sentClass}>
          <Icon icon="check" />
          <span>Sent. It is in your chat with {owner}.</span>
        </div>
      ) : null}
      <div>
        <Button
          color="logoBlue"
          variant="soft"
          loading={sending}
          onClick={handleSend}
        >
          <Icon icon="paper-plane" />
          <span style={{ marginLeft: '0.5rem' }}>
            {sentAt ? 'Send again' : 'Send to owner'}
          </span>
        </Button>
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
      if (!result?.message) {
        setError('Failed to send your changes.');
        return;
      }
      setSentAt(Date.now());
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
  border: 2px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  strong {
    font-size: 1.1rem;
    font-weight: 900;
  }
  > span {
    color: #4b5563;
    font-size: 1.1rem;
    font-weight: 800;
    line-height: 1.35;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.75rem;
  }
`;

const errorClass = css`
  color: #b91c1c;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.35;
`;

const sentClass = css`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #0f766e;
  font-size: 1.1rem;
  font-weight: 800;
`;
