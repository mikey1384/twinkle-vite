import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { QuestNote, questHelpClass, questInputClass, questLabelClass } from './StepCard';

// Joining asks for your branch: from the directory, or accepting an invite.
export default function JoinCrewModal({
  crewId,
  crewName,
  inviteId = 0,
  defaultBranch,
  onHide,
  onJoined
}: {
  crewId: number;
  crewName: string;
  inviteId?: number;
  defaultBranch: string;
  onHide: () => void;
  onJoined: () => Promise<void>;
}) {
  const joinMeetupCrew = useAppContext((v) => v.requestHelpers.joinMeetupCrew);
  const acceptMeetupInvite = useAppContext((v) => v.requestHelpers.acceptMeetupInvite);
  const [branch, setBranch] = useState(defaultBranch);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <Modal
      modalKey="JoinMeetupCrewModal"
      isOpen
      onClose={onHide}
      hasHeader
      title={`Join ${crewName}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onHide} style={{ marginRight: '0.7rem' }}>
            Cancel
          </Button>
          <Button color="logoBlue" loading={busy} disabled={busy} onClick={handleJoin}>
            Join
          </Button>
        </>
      }
    >
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label className={questLabelClass} htmlFor="join-crew-branch">
            Your Twinkle branch
          </label>
          <input
            id="join-crew-branch"
            className={questInputClass}
            value={branch}
            maxLength={40}
            placeholder="For example: Busan"
            onChange={(event) => setBranch(event.target.value)}
          />
          <div className={questHelpClass}>
            The crew sees your username, profile picture and branch. You can
            be in one crew at a time.
          </div>
        </div>
        {error && <QuestNote tone="warning">{error}</QuestNote>}
      </div>
    </Modal>
  );

  async function handleJoin() {
    if (busy) return;
    if (!branch.trim()) {
      setError('Type your Twinkle branch first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (inviteId) {
        await acceptMeetupInvite({ inviteId, branch });
      } else {
        await joinMeetupCrew({ crewId, branch });
      }
      await onJoined();
      onHide();
    } catch (err: any) {
      setError(err?.message || 'Could not join the crew.');
    } finally {
      setBusy(false);
    }
  }
}
