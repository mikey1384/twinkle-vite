import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import CrewCover from './CrewCover';
import CrewProfileFields from './CrewProfileFields';
import BranchField from './BranchField';
import KnownPeopleList, { type KnownPerson } from './KnownPeopleList';
import { CREW_COVERS } from './covers';
import { QuestNote, questHelpClass } from './StepCard';

// a crew holds at most 8 people: the founder plus 7 invited friends
const MAX_FRIEND_INVITES = 7;

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
  const inviteToMeetupCrew = useAppContext(
    (v) => v.requestHelpers.inviteToMeetupCrew
  );
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const [friends, setFriends] = useState<KnownPerson[]>([]);
  const [done, setDone] = useState(false);
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
        done ? (
          <Button color="logoBlue" onClick={onHide}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onHide} style={{ marginRight: '0.7rem' }}>
              Cancel
            </Button>
            <Button color="green" loading={busy} disabled={busy} onClick={handleCreate}>
              {friends.length
                ? `Start the crew and invite ${friends.length}`
                : 'Start the crew'}
            </Button>
          </>
        )
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
        {!done && (
          <div>
            <KnownPeopleList
              selectedIds={friends.map((friend) => friend.id)}
              maxSelected={MAX_FRIEND_INVITES}
              onToggle={(person) => {
                setFriends((current) => {
                  if (current.some((friend) => friend.id === person.id)) {
                    return current.filter((friend) => friend.id !== person.id);
                  }
                  trackMeetupQuestView('known_people_picked');
                  return [...current, person];
                });
              }}
            />
            <div className={questHelpClass}>
              Optional. They get an invitation in chat and can say yes or no.
            </div>
          </div>
        )}
        <BranchField
          id="create-crew-branch"
          value={branch}
          onChange={setBranch}
          help="Other members see your username, profile picture and branch."
        />
        <details>
          <summary
            style={{ cursor: 'pointer', fontSize: '1.4rem', fontWeight: 'bold' }}
          >
            Name your crew and pick a cover (optional)
          </summary>
          <div style={{ marginTop: '1.2rem' }}>
            <CrewProfileFields
              idPrefix="create-crew"
              name={name}
              about={about}
              cover={cover}
              onNameChange={setName}
              onAboutChange={setAbout}
              onCoverChange={setCover}
            />
          </div>
        </details>
        {error && <QuestNote tone={done ? 'info' : 'warning'}>{error}</QuestNote>}
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
      const created = await startMeetupCrew({ branch, name, about, cover });
      const crewId = Number(created?.crew?.crewId || 0);
      const failed: string[] = [];
      if (crewId) {
        for (const friend of friends) {
          try {
            await inviteToMeetupCrew({ crewId, username: friend.username });
          } catch (err: any) {
            failed.push(`${friend.username}: ${err?.message || 'could not invite'}`);
          }
        }
      }
      await onCreated();
      if (failed.length) {
        setDone(true);
        setError(`Your crew is ready. These invitations did not go out. ${failed.join(' · ')}`);
        return;
      }
      onHide();
    } catch (err: any) {
      setError(err?.message || 'Could not start the crew.');
    } finally {
      setBusy(false);
    }
  }
}
