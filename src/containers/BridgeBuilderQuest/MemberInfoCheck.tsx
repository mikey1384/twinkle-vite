import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import useQuestAction from './useQuestAction';
import { QuestNote, questHelpClass, questInputClass, questLabelClass } from './StepCard';
import type { CrewMember, CrewView, MemberCheckRecord } from './types';

// Staff's "who are you" check on a crew member (ruled 2026-10-07). When staff
// can't place a member, that member gives their teacher's name and class name,
// or, if they can't, says how they know the crew. Nobody is contacted: this is
// the condition for the crew's next step. The answer is the member's and
// staff's only; the rest of the crew sees that staff are waiting on it.

const TEACHER_MAX = 60;
const CLASS_MAX = 60;
const STORY_MIN = 20;
const STORY_MAX = 600;

export function InfoCheckBadge({ member }: { member: CrewMember }) {
  if (!member.infoCheck) return null;
  const asked = member.infoCheck === 'requested';
  return (
    <span
      title={
        asked
          ? 'Staff need this member to tell them their teacher and class'
          : 'Staff are reading this member’s answer'
      }
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 1.15rem;
        font-weight: bold;
        color: ${asked ? Color.red() : Color.orange()};
      `}
    >
      <Icon icon={asked ? 'question-circle' : 'hourglass-half'} />
      {asked ? 'details needed' : 'staff checking'}
    </span>
  );
}

/** The asked member's own box: teacher + class, or how they know the crew. */
export function MyInfoCheckCard({
  crew,
  onChanged
}: {
  crew: CrewView;
  onChanged: () => Promise<void>;
}) {
  const check = crew.viewer.infoCheck;
  const answerMeetupInfoCheck = useAppContext(
    (v) => v.requestHelpers.answerMeetupInfoCheck
  );
  const { busy, error, run } = useQuestAction(onChanged);
  const [teacherName, setTeacherName] = useState(check?.answer.teacherName || '');
  const [className, setClassName] = useState(check?.answer.className || '');
  const [relationship, setRelationship] = useState(check?.answer.relationship || '');
  const [editing, setEditing] = useState(check?.status !== 'answered');
  const [noClass, setNoClass] = useState(
    !!check?.answer.relationship && !check?.answer.teacherName
  );
  useEffect(() => {
    setTeacherName(check?.answer.teacherName || '');
    setClassName(check?.answer.className || '');
    setRelationship(check?.answer.relationship || '');
    setEditing(check?.status !== 'answered');
  }, [
    check?.status,
    check?.answeredAt,
    check?.answer.teacherName,
    check?.answer.className,
    check?.answer.relationship
  ]);
  if (!check) return null;

  const hasClass = !!teacherName.trim() && !!className.trim();
  const storyOk = relationship.trim().length >= STORY_MIN;
  const ready = noClass ? storyOk : hasClass;

  return (
    <div
      className={css`
        padding: 1.2rem 1.4rem;
        border-radius: 1rem;
        border: 2px solid ${check.status === 'answered' ? Color.orange() : Color.red()};
        background: #fff;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      `}
    >
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        {check.status === 'answered'
          ? 'Thanks! Staff are reading your answer'
          : 'Staff need to know who you are'}
      </div>
      <p className={questHelpClass} style={{ margin: 0, fontSize: '1.3rem' }}>
        {check.status === 'answered'
          ? 'Your crew moves on once staff have read it. Only you and staff can see what you wrote.'
          : "To move your crew to the next step, tell us your Twinkle teacher's name and your class name. If you don't have them, tell us how you know your crew. Only you and staff can see this."}
      </p>
      {check.askNote && (
        <QuestNote tone="info">
          <b>Staff:</b> {check.askNote}
        </QuestNote>
      )}
      {editing ? (
        <>
          {!noClass && (
            <>
              <label className={questLabelClass}>
                Your Twinkle teacher&apos;s name
                <input
                  className={questInputClass}
                  value={teacherName}
                  maxLength={TEACHER_MAX}
                  placeholder="e.g. Teacher Jenny"
                  onChange={(e) => setTeacherName(e.target.value)}
                />
              </label>
              <label className={questLabelClass}>
                Your class name
                <input
                  className={questInputClass}
                  value={className}
                  maxLength={CLASS_MAX}
                  placeholder="e.g. Wednesday Debate"
                  onChange={(e) => setClassName(e.target.value)}
                />
              </label>
            </>
          )}
          {noClass && (
            <label className={questLabelClass}>
              How do you know your crew?
              <textarea
                className={questInputClass}
                value={relationship}
                maxLength={STORY_MAX}
                rows={4}
                placeholder="e.g. We go to the same school, and we met on Twinkle in the Daily Question."
                onChange={(e) => setRelationship(e.target.value)}
              />
              <span className={questHelpClass}>
                {relationship.trim().length < STORY_MIN
                  ? `At least ${STORY_MIN} characters.`
                  : 'Names only, please: no phone numbers, addresses or links.'}
              </span>
            </label>
          )}
          <div
            className={css`
              display: flex;
              gap: 0.8rem;
              flex-wrap: wrap;
              align-items: center;
            `}
          >
            <Button
              color="logoBlue"
              loading={busy}
              disabled={busy || !ready}
              onClick={() =>
                run(() =>
                  answerMeetupInfoCheck({
                    crewId: crew.crewId,
                    teacherName: noClass ? '' : teacherName,
                    className: noClass ? '' : className,
                    relationship: noClass ? relationship : ''
                  })
                )
              }
            >
              Send to staff
            </Button>
            <Button
              variant="ghost"
              color="darkerGray"
              disabled={busy}
              onClick={() => setNoClass((value) => !value)}
            >
              {noClass
                ? 'I can give my teacher and class'
                : "I don't have a teacher or class"}
            </Button>
          </div>
        </>
      ) : (
        <div>
          <Button variant="ghost" color="logoBlue" onClick={() => setEditing(true)}>
            Change my answer
          </Button>
        </div>
      )}
      {error && <QuestNote tone="warning">{error}</QuestNote>}
    </div>
  );
}

/** Admins: ask a member who they are, read the answer, accept / ask again / withdraw. */
export function AdminInfoChecks({
  crew,
  onChanged
}: {
  crew: CrewView;
  onChanged: () => Promise<void>;
}) {
  const decideMeetupInfoCheck = useAppContext(
    (v) => v.requestHelpers.decideMeetupInfoCheck
  );
  const { busy, error, run } = useQuestAction(onChanged);
  const [openFor, setOpenFor] = useState<number | null>(null);
  const [note, setNote] = useState('');
  if (!crew.viewer.isAdmin || crew.status !== 'active') return null;
  const records = crew.memberChecks || [];

  return (
    <div
      className={css`
        border: 2px dashed ${Color.logoBlue(0.5)};
        border-radius: 1rem;
        padding: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background: ${Color.logoBlue(0.04)};
      `}
    >
      <b style={{ fontSize: '1.4rem', color: Color.logoBlue() }}>
        Staff only: who are these members?
      </b>
      <span className={questHelpClass}>
        Asking a member makes the crew wait at this step until you accept their answer
        (teacher and class, or how they know the crew). The question and answer are
        visible only to that member and staff. For instructions everyone must see,
        use “Request changes” above. Nobody outside Twinkle is contacted.
      </span>
      {crew.members.map((member) => {
        const mine = records.filter((r) => r.userId === member.userId);
        const current = mine.find((r) => r.crewId === crew.crewId);
        const open = current && (current.status === 'requested' || current.status === 'answered')
          ? current
          : null;
        const history = mine.filter((r) => r !== open && r.status !== 'requested');
        const act = (action: string) =>
          run(async () => {
            await decideMeetupInfoCheck({
              crewId: crew.crewId,
              userId: member.userId,
              action,
              note
            });
            setOpenFor(null);
            setNote('');
          });
        const noteOpen = openFor === member.userId;
        return (
          <div
            key={member.userId}
            className={css`
              border-top: 1px solid ${Color.borderGray()};
              padding-top: 0.8rem;
              display: flex;
              flex-direction: column;
              gap: 0.6rem;
              font-size: 1.3rem;
            `}
          >
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <b>{member.username}</b>
              <span style={{ color: Color.darkGray() }}>{member.branch || 'no branch'}</span>
              <InfoCheckBadge member={member} />
            </div>
            {open?.status === 'answered' && <AnswerView record={open} />}
            {open?.status === 'requested' && (
              <span style={{ color: Color.darkGray() }}>
                Asked by {open.requestedBy || 'staff'}
                {open.askNote ? `: "${open.askNote}"` : ''}. No answer yet.
              </span>
            )}
            {history.length > 0 && (
              <details>
                <summary style={{ cursor: 'pointer', color: Color.darkGray() }}>
                  Earlier answers ({history.length})
                </summary>
                {history.map((record) => (
                  <AnswerView key={record.checkId} record={record} />
                ))}
              </details>
            )}
            {noteOpen && (
              <label className={questLabelClass}>
                {open?.status === 'answered'
                  ? 'Note (asking again shows it to the member; accepting keeps it private)'
                  : 'Note to the member (optional)'}
                <textarea
                  className={questInputClass}
                  rows={2}
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
            )}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {!open && !noteOpen && (
                <Button size="sm" color="orange" disabled={busy} onClick={() => setOpenFor(member.userId)}>
                  Ask who they are
                </Button>
              )}
              {!open && noteOpen && (
                <Button size="sm" color="orange" loading={busy} disabled={busy} onClick={() => act('request')}>
                  Ask {member.username}
                </Button>
              )}
              {open?.status === 'answered' && (
                <>
                  <Button size="sm" color="green" loading={busy} disabled={busy} onClick={() => act('accept')}>
                    Accept
                  </Button>
                  {noteOpen ? (
                    <Button size="sm" color="orange" disabled={busy || !note.trim()} onClick={() => act('ask-again')}>
                      Ask again with this note
                    </Button>
                  ) : (
                    <Button size="sm" color="orange" disabled={busy} onClick={() => setOpenFor(member.userId)}>
                      Add a note / ask again
                    </Button>
                  )}
                </>
              )}
              {open && (
                <Button size="sm" variant="ghost" color="darkerGray" disabled={busy} onClick={() => act('withdraw')}>
                  Withdraw the question
                </Button>
              )}
              {noteOpen && (
                <Button
                  size="sm"
                  variant="ghost"
                  color="darkerGray"
                  disabled={busy}
                  onClick={() => {
                    setOpenFor(null);
                    setNote('');
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        );
      })}
      {error && <QuestNote tone="warning">{error}</QuestNote>}
    </div>
  );
}

function AnswerView({ record }: { record: MemberCheckRecord }) {
  const when = (seconds: number) =>
    seconds ? new Date(seconds * 1000).toLocaleDateString() : '';
  return (
    <div
      className={css`
        background: #fff;
        border-radius: 0.8rem;
        padding: 0.8rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin-top: 0.4rem;
      `}
    >
      {record.teacherName && (
        <span>
          <b>Teacher:</b> {record.teacherName} · <b>Class:</b> {record.className}
        </span>
      )}
      {record.relationship && (
        <span>
          <b>How they know the crew:</b> {record.relationship}
        </span>
      )}
      <span style={{ color: Color.darkGray(), fontSize: '1.2rem' }}>
        {record.status === 'answered' ? 'Answered' : record.status}
        {record.answeredAt ? ` ${when(record.answeredAt)}` : ''}
        {` · crew #${record.crewId}`}
        {record.reviewedBy ? ` · ${record.status} by ${record.reviewedBy} ${when(record.reviewedAt)}` : ''}
        {record.staffNote ? ` · note: ${record.staffNote}` : ''}
      </span>
    </div>
  );
}
