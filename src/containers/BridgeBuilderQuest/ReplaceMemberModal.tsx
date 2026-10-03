import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import InviteUserPicker from './InviteUserPicker';
import { QuestNote, questHelpClass } from './StepCard';

// The founder swaps a member whose parent hasn't said yes for someone new:
// pick who to invite, and the member is removed in the same step.
export default function ReplaceMemberModal({
  crewId,
  member,
  onHide,
  onReplaced
}: {
  crewId: number;
  member: { userId: number; username: string; parentSaidNo?: boolean };
  onHide: () => void;
  onReplaced: () => Promise<void>;
}) {
  const replaceMeetupCrewMember = useAppContext(
    (v) => v.requestHelpers.replaceMeetupCrewMember
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <Modal
      modalKey="ReplaceMeetupMemberModal"
      isOpen
      onClose={onHide}
      hasHeader
      title={`Replace ${member.username}`}
      size="md"
      footer={
        <Button variant="ghost" onClick={onHide}>
          Cancel
        </Button>
      }
    >
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={questHelpClass} style={{ fontSize: '1.4rem' }}>
          {member.parentSaidNo
            ? `${member.username}'s parent said no this time.`
            : `${member.username}'s parent hasn't answered yet.`}{' '}
          Pick someone to invite instead. {member.username} leaves the crew and
          sees a note on their page. Your plan stays the same: staff check the
          new member&apos;s branch and the crew again, and they ask their own
          parent.
        </div>
        <InviteUserPicker crewId={crewId} busy={busy} onInvite={handleReplace} />
        {error && <QuestNote tone="warning">{error}</QuestNote>}
      </div>
    </Modal>
  );

  async function handleReplace(user: { id: number; username: string }) {
    if (busy) return false;
    setBusy(true);
    setError('');
    try {
      await replaceMeetupCrewMember({
        crewId,
        memberId: member.userId,
        username: user.username
      });
      await onReplaced();
      onHide();
      return true;
    } catch (err: any) {
      setError(err?.message || 'Could not replace this member.');
      return false;
    } finally {
      setBusy(false);
    }
  }
}
