import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import {
  MEETUP_CREW_MIN_MEMBERS,
  MEETUP_NON_STUDENT_BRANCH
} from '~/constants/meetupQuest';
import { questHelpClass, questInputClass, questLabelClass } from './StepCard';

interface BranchChoices {
  official: { id: number; name: string }[];
  pendingMine: string[];
}

const keyOf = (value: string) =>
  value.replace(/\s+/g, ' ').trim().toLowerCase();

// Shared by start, join and edit. Non-Twinkle members explicitly opt out of a
// branch; a new Twinkle branch name still needs the administrator's approval.
// Former Twinkle students count as Twinkle students, so "Not a Twinkle
// student" first asks whether they ever were one: a former student picks the
// branch they went to instead.
export default function BranchField({
  id,
  value,
  onChange,
  placeholder,
  help
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  help?: string;
}) {
  const loadMeetupBranchChoices = useAppContext(
    (v) => v.requestHelpers.loadMeetupBranchChoices
  );
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const [choices, setChoices] = useState<BranchChoices | null>(null);
  const [othersClicked, setOthersClicked] = useState(false);
  // 'asking': "Not a Twinkle student" was picked and awaits the follow-up;
  // 'former': they used to be a student and now choose their old branch.
  const [formerCheck, setFormerCheck] = useState<'asking' | 'former' | null>(
    null
  );

  useEffect(() => {
    let active = true;
    loadMeetupBranchChoices()
      .then((data: BranchChoices) => {
        if (active) setChoices(data || null);
      })
      .catch(() => {
        if (active) setChoices(null);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedKey = keyOf(value);
  const notStudent = selectedKey === keyOf(MEETUP_NON_STUDENT_BRANCH);
  const officialKeys = (choices?.official || []).map((branch) =>
    keyOf(branch.name)
  );
  const hasOptions = !!choices?.official.length;
  // Keep the non-student choice available even if the branch list fails to load.
  const asking = formerCheck === 'asking';
  const otherActive =
    !notStudent &&
    !asking &&
    (!hasOptions ||
      othersClicked ||
      (!!selectedKey && !officialKeys.includes(selectedKey)));
  const selectValue =
    notStudent || asking
    ? MEETUP_NON_STUDENT_BRANCH
    : otherActive
      ? '__other__'
      : (choices?.official.find((branch) => keyOf(branch.name) === selectedKey)
          ?.name ?? '');
  return (
    <div>
      <label className={questLabelClass} htmlFor={id}>
        Your Twinkle branch
      </label>
      <select
        id={id}
        className={questInputClass}
        value={selectValue}
        onChange={(event) => {
          const next = event.target.value;
          if (next === MEETUP_NON_STUDENT_BRANCH) {
            // Nothing is chosen until they answer, so the form cannot be
            // submitted with the previous branch still set.
            setOthersClicked(false);
            setFormerCheck('asking');
            if (selectedKey) onChange('');
            return;
          }
          setFormerCheck((current) => (current === 'former' ? current : null));
          if (next === '__other__') {
            setOthersClicked(true);
            if (notStudent || officialKeys.includes(selectedKey)) onChange('');
            return;
          }
          setOthersClicked(false);
          if (officialKeys.includes(keyOf(next)))
            trackMeetupQuestView('branch_pick_official');
          onChange(next);
        }}
        style={{ marginBottom: otherActive ? '0.7rem' : 0 }}
      >
        <option value="">Choose your branch…</option>
        {(choices?.official || []).map((branch) => (
          <option key={branch.id} value={branch.name}>
            {branch.name}
          </option>
        ))}
        <option value={MEETUP_NON_STUDENT_BRANCH}>
          {MEETUP_NON_STUDENT_BRANCH}
        </option>
        <option value="__other__">My Twinkle branch is not listed</option>
      </select>
      {asking && (
        <div className={formerQuestionClass} role="group" aria-label="Former student check">
          <strong>Have you ever been a Twinkle student?</strong>
          <span>Former Twinkle students count as Twinkle students.</span>
          <div className={formerButtonsClass}>
            <Button
              color="logoBlue"
              variant="soft"
              onClick={() => {
                setFormerCheck('former');
                trackMeetupQuestView('branch_former_student');
              }}
            >
              Yes, I used to be
            </Button>
            <Button
              color="darkerGray"
              variant="soft"
              onClick={() => {
                setFormerCheck(null);
                trackMeetupQuestView('branch_never_student');
                onChange(MEETUP_NON_STUDENT_BRANCH);
              }}
            >
              No, never
            </Button>
          </div>
        </div>
      )}
      {formerCheck === 'former' && !notStudent && !selectedKey && (
        <div className={formerNoteClass} role="status">
          Great, you count as a Twinkle student. Choose the branch you went to
          above (or “My Twinkle branch is not listed”).
        </div>
      )}
      {otherActive && (
        <input
          id={`${id}-other`}
          aria-label="Your branch's name"
          className={questInputClass}
          value={value}
          maxLength={40}
          placeholder={
            placeholder ||
            (hasOptions ? "Your branch's name" : 'Type your branch')
          }
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            if (
              !notStudent &&
              selectedKey &&
              choices &&
              !officialKeys.includes(selectedKey)
            ) {
              trackMeetupQuestView('branch_typed_other');
            }
          }}
        />
      )}
      <div className={questHelpClass}>
        Choose your Twinkle branch or “Not a Twinkle student.” Former students
        choose the branch they went to. Non-Twinkle members are welcome; each
        crew needs at least {MEETUP_CREW_MIN_MEMBERS} Twinkle students.
        {otherActive && ' The administrator approves new branch names.'}
        {help && ` ${help}`}
      </div>
    </div>
  );
}

const formerQuestionClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.7rem;
  padding: 0.9rem 1rem;
  border: 2px solid rgba(65, 140, 235, 0.45);
  border-radius: 10px;
  background: #eff6ff;
  color: #172554;
  font-size: 1.3rem;
  strong {
    font-size: 1.4rem;
    font-weight: 800;
  }
  span {
    color: #475569;
  }
`;

const formerButtonsClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.4rem;
`;

const formerNoteClass = css`
  margin-top: 0.7rem;
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  background: #f0fdf4;
  color: #166534;
  font-size: 1.3rem;
  font-weight: 700;
`;
