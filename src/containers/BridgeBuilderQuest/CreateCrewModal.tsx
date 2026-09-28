import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import CrewCover from './CrewCover';
import CrewProfileFields from './CrewProfileFields';
import { CREW_COVERS } from './covers';
import { QuestNote, questHelpClass, questInputClass, questLabelClass } from './StepCard';

export default function CreateCrewModal({
  defaultBranch,
  onHide,
  onCreated
}: {
  defaultBranch: string;
  onHide: () => void;
  onCreated: () => Promise<void>;
}) {
  const startMeetupCrew = useAppContext((v) => v.requestHelpers.startMeetupCrew);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [cover, setCover] = useState(
    () => CREW_COVERS[Math.floor(Math.random() * CREW_COVERS.length)].key
  );
  const [branch, setBranch] = useState(defaultBranch);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <Modal
      modalKey="CreateMeetupCrewModal"
      isOpen
      onClose={onHide}
      hasHeader
      title="Start a crew"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onHide} style={{ marginRight: '0.7rem' }}>
            Cancel
          </Button>
          <Button color="green" loading={busy} disabled={busy} onClick={handleCreate}>
            Start the crew
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%' }}>
        <CrewCover cover={cover} height="7rem" rounded="1rem">
          <span
            style={{
              position: 'absolute',
              left: '1.2rem',
              bottom: '0.8rem',
              color: '#fff',
              fontSize: '2rem',
              fontWeight: 'bold',
              textShadow: '0 1px 3px rgba(0,0,0,0.35)'
            }}
          >
            {name.trim() || 'Your crew'}
          </span>
        </CrewCover>
        <div>
          <label className={questLabelClass} htmlFor="create-crew-branch">
            Your Twinkle branch
          </label>
          <input
            id="create-crew-branch"
            className={questInputClass}
            value={branch}
            maxLength={40}
            placeholder="For example: Daechi"
            onChange={(event) => setBranch(event.target.value)}
          />
          <div className={questHelpClass}>
            Other members see your username, profile picture and branch.
          </div>
        </div>
        <CrewProfileFields
          idPrefix="create-crew"
          name={name}
          about={about}
          cover={cover}
          onNameChange={setName}
          onAboutChange={setAbout}
          onCoverChange={setCover}
        />
        {error && <QuestNote tone="warning">{error}</QuestNote>}
      </div>
    </Modal>
  );

  async function handleCreate() {
    if (busy) return;
    if (!branch.trim()) {
      setError('Type your Twinkle branch first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await startMeetupCrew({ branch, name, about, cover });
      await onCreated();
      onHide();
    } catch (err: any) {
      setError(err?.message || 'Could not start the crew.');
    } finally {
      setBusy(false);
    }
  }
}
