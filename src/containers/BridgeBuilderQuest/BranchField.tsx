import React, { useEffect, useState } from 'react';
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
  const otherActive =
    !notStudent &&
    (!hasOptions ||
      othersClicked ||
      (!!selectedKey && !officialKeys.includes(selectedKey)));
  const selectValue = notStudent
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
        Choose your Twinkle branch or “Not a Twinkle student.” Non-Twinkle
        members are welcome; each crew needs at least {MEETUP_CREW_MIN_MEMBERS}{' '}
        Twinkle students.
        {otherActive && ' The administrator approves new branch names.'}
        {help && ` ${help}`}
      </div>
    </div>
  );
}
