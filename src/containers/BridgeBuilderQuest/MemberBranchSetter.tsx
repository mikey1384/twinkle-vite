import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { MEETUP_NON_STUDENT_BRANCH } from '~/constants/meetupQuest';
import useQuestAction from './useQuestAction';
import { QuestNote, questHelpClass, questInputClass, questLabelClass } from './StepCard';
import type { CrewMember, CrewView } from './types';

// Admins correct a member's branch (Mikey 2026-10-10) instead of a database
// write: an official branch, or "Not a Twinkle student". Former students get
// the branch they went to. The note and the history are staff-only; nobody is
// messaged. The server answers with the crew, so the page reloads canonical
// state (progress, tier, verified flags).
export default function MemberBranchSetter({
  crew,
  member,
  onChanged
}: {
  crew: CrewView;
  member: CrewMember;
  onChanged: () => Promise<void>;
}) {
  const loadMeetupBranchChoices = useAppContext(
    (v) => v.requestHelpers.loadMeetupBranchChoices
  );
  const setMeetupMemberBranch = useAppContext(
    (v) => v.requestHelpers.setMeetupMemberBranch
  );
  const { busy, error, run } = useQuestAction(onChanged);
  const [open, setOpen] = useState(false);
  const [official, setOfficial] = useState<string[] | null>(null);
  const [branch, setBranch] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open || official) return;
    let active = true;
    loadMeetupBranchChoices()
      .then((data: { official?: { name: string }[] }) => {
        if (active) setOfficial((data?.official || []).map((b) => b.name));
      })
      .catch(() => {
        if (active) setOfficial([]);
      });
    return () => {
      active = false;
    };
    // request helpers stay out of dependency arrays
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, official]);

  const changes = (crew.branchChanges || []).filter(
    (change) => change.userId === member.userId
  );
  const current = String(member.branch || '');
  const unchanged = !branch || branch === current;
  const fieldId = `member-branch-${crew.crewId}-${member.userId}`;

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      `}
    >
      {changes.map((change) => (
        <span
          key={change.id}
          style={{ color: Color.darkGray(), fontSize: '1.2rem' }}
        >
          Branch changed by {change.actorUsername || 'staff'}{' '}
          {new Date(change.createdAt * 1000).toLocaleDateString()}:{' '}
          {change.oldBranch || 'no branch'} → {change.newBranch}
          {change.note ? ` · private note: ${change.note}` : ''}
        </span>
      ))}
      {open ? (
        <div
          className={css`
            background: #fff;
            border-radius: 0.8rem;
            padding: 0.9rem 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.7rem;
          `}
        >
          <label className={questLabelClass} htmlFor={fieldId}>
            {member.username}&apos;s branch
          </label>
          <select
            id={fieldId}
            className={questInputClass}
            value={branch}
            disabled={!official}
            onChange={(event) => setBranch(event.target.value)}
          >
            <option value="">
              {official ? 'Choose a branch…' : 'Loading branches…'}
            </option>
            {(official || []).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value={MEETUP_NON_STUDENT_BRANCH}>
              {MEETUP_NON_STUDENT_BRANCH}
            </option>
          </select>
          <span className={questHelpClass}>
            Former Twinkle students count as students: pick the branch they
            went to. An official branch is approved at once.
          </span>
          <label className={questLabelClass}>
            Private note (staff only, optional)
            <textarea
              className={questInputClass}
              rows={2}
              maxLength={1000}
              value={note}
              placeholder="Why the branch changed"
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Button
              size="sm"
              color="logoBlue"
              loading={busy}
              disabled={busy || unchanged}
              onClick={handleSave}
            >
              Save branch
            </Button>
            <Button
              size="sm"
              variant="ghost"
              color="darkerGray"
              disabled={busy}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
          {error && <QuestNote tone="warning">{error}</QuestNote>}
        </div>
      ) : (
        <div>
          <Button
            size="sm"
            variant="ghost"
            color="logoBlue"
            disabled={busy}
            onClick={() => setOpen(true)}
          >
            Change branch
          </Button>
        </div>
      )}
    </div>
  );

  async function handleSave() {
    const saved = await run(() =>
      setMeetupMemberBranch({
        crewId: crew.crewId,
        userId: member.userId,
        branch,
        note
      })
    );
    if (saved) handleCancel();
  }

  function handleCancel() {
    setOpen(false);
    setBranch('');
    setNote('');
  }
}
