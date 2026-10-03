import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import useQuestAction from './useQuestAction';
import { QuestNote, questInputClass, questLabelClass } from './StepCard';
import type { CrewView } from './types';


// Admin-only controls on the quest page. The same decisions exist in the CLI:
// `lumine admin meetup approve-crew | approve-grownup | approve-plan | send-back | approve`.
export default function AdminReview({
  crew,
  stage,
  onChanged
}: {
  crew: CrewView;
  stage: 'crew' | 'grownUp' | 'plan' | 'video';
  onChanged: () => Promise<void>;
}) {
  const reviewMeetupCrew = useAppContext(
    (v) => v.requestHelpers.reviewMeetupCrew
  );
  const [note, setNote] = useState('');
  const [attended, setAttended] = useState<number[]>([]);
  const { busy, error, setError, run } = useQuestAction(onChanged);

  // The crew step and the grown-up step: one approve button (every step passes
  // through the owner; nothing to send back, the crew just keeps waiting).
  if (stage === 'crew' || stage === 'grownUp') {
    const notYet = stage === 'crew' ? crew.progress.crewAwaitingApproval : crew.progress.grownUpAwaitingApproval;
    if (!notYet) return null;
    return (
      <div
        className={css`
          border: 2px dashed ${Color.logoBlue(0.5)};
          border-radius: 1rem;
          padding: 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          background: ${Color.logoBlue(0.04)};
        `}
      >
        <b style={{ fontSize: '1.4rem', color: Color.logoBlue() }}>
          Your approval: {stage === 'crew' ? 'the crew' : 'parents and the adult'}
        </b>
        <div>
          <Button
            color="green"
            loading={busy}
            disabled={busy}
            onClick={() =>
              run(() =>
                reviewMeetupCrew({
                  crewId: crew.crewId,
                  action: stage === 'crew' ? 'approve-crew' : 'approve-grownup'
                })
              )
            }
          >
            {stage === 'crew' ? 'Approve crew' : 'Approve parents and adult'}
          </Button>
        </div>
        {error && <QuestNote tone="warning">{error}</QuestNote>}
      </div>
    );
  }

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
        Admin review: {stage === 'plan' ? 'the plan' : 'the video'}
      </b>
      {stage === 'video' && (
        <div>
          <span className={questLabelClass}>Who showed up in the video?</span>
          {crew.members.map((member) => (
            <label
              key={member.userId}
              className={css`
                display: flex;
                align-items: center;
                gap: 0.8rem;
                font-size: 1.4rem;
                padding: 0.3rem 0;
                cursor: pointer;
              `}
            >
              <input
                type="checkbox"
                checked={attended.includes(member.userId)}
                onChange={() =>
                  setAttended((ids) =>
                    ids.includes(member.userId)
                      ? ids.filter((id) => id !== member.userId)
                      : [...ids, member.userId]
                  )
                }
              />
              {member.username} ({member.branch})
            </label>
          ))}
        </div>
      )}
      <div>
        <label className={questLabelClass} htmlFor={`meetup-admin-note-${crew.crewId}`}>
          Note to the crew (needed to send back)
        </label>
        <textarea
          id={`meetup-admin-note-${crew.crewId}`}
          className={questInputClass}
          rows={3}
          maxLength={1000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      <div
        className={css`
          display: flex;
          gap: 0.8rem;
          flex-wrap: wrap;
        `}
      >
        {stage === 'plan' && /^twinkle .+ branch classroom$/i.test(crew.plan.area || '') ? (
          // a classroom plan is approved with its room and times, which only
          // the headmaster desk picks
          <Link
            to="/achievements/bridge-builder/desk"
            style={{ alignSelf: 'center', fontWeight: 700 }}
          >
            Approve at the headmaster desk (pick the room and times) →
          </Link>
        ) : (
        <Button
          color="green"
          loading={busy}
          disabled={busy}
          onClick={() =>
            run(() =>
              reviewMeetupCrew({
                crewId: crew.crewId,
                action: stage === 'plan' ? 'approve-plan' : 'approve',
                note,
                attendedUserIds: stage === 'video' ? attended : undefined
              })
            )
          }
        >
          {stage === 'plan' ? 'Approve plan' : 'Approve and unlock'}
        </Button>
        )}
        <Button
          color="orange"
          variant="soft"
          disabled={busy}
          onClick={() => {
            if (!note.trim()) {
              setError('Write a note so the crew knows what to change.');
              return;
            }
            run(() =>
              reviewMeetupCrew({
                crewId: crew.crewId,
                action: 'send-back',
                note
              })
            );
          }}
        >
          Send back
        </Button>
      </div>
      {error && <QuestNote tone="warning">{error}</QuestNote>}
    </div>
  );
}
