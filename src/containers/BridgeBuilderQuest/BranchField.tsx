import React, { useEffect, useState } from 'react';
import { useAppContext } from '~/contexts';
import { questHelpClass, questInputClass, questLabelClass } from './StepCard';

interface BranchChoices {
  official: { id: number; name: string }[];
  pendingMine: string[];
}

const keyOf = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();

// "Your Twinkle branch": a dropdown of the official branches (staff have
// checked them), plus "Other" with a text box for a branch that is not listed.
// A new name waits for staff approval, and the crew's steps wait with it. Used
// wherever a branch is picked (start, join, edit).
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
  const officialKeys = (choices?.official || []).map((branch) => keyOf(branch.name));
  const hasOptions = !!choices?.official.length;
  // "Other": a branch that is not on the official list; staff approve new names.
  const otherActive =
    !hasOptions || othersClicked || (!!selectedKey && !officialKeys.includes(selectedKey));
  const selectValue = otherActive
    ? '__other__'
    : (choices?.official.find((branch) => keyOf(branch.name) === selectedKey)?.name ?? '');
  return (
    <div>
      <label className={questLabelClass} htmlFor={id}>
        Your Twinkle branch
      </label>
      {hasOptions && (
        <select
          id={id}
          className={questInputClass}
          value={selectValue}
          onChange={(event) => {
            const next = event.target.value;
            if (next === '__other__') {
              setOthersClicked(true);
              if (officialKeys.includes(selectedKey)) onChange('');
              return;
            }
            setOthersClicked(false);
            if (next) trackMeetupQuestView('branch_pick_official');
            onChange(next);
          }}
          style={{ marginBottom: otherActive ? '0.7rem' : 0 }}
        >
          <option value="">Choose your branch…</option>
          {choices!.official.map((branch) => (
            <option key={branch.id} value={branch.name}>
              {branch.name}
            </option>
          ))}
          <option value="__other__">Other (not listed)</option>
        </select>
      )}
      {otherActive && (
        <input
          id={hasOptions ? `${id}-other` : id}
          aria-label="Your branch's name"
          className={questInputClass}
          value={value}
          maxLength={40}
          placeholder={placeholder || (hasOptions ? "Your branch's name" : 'Type your branch')}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            if (selectedKey && choices && !officialKeys.includes(selectedKey)) {
              trackMeetupQuestView('branch_typed_other');
            }
          }}
        />
      )}
      <div className={questHelpClass}>
        {help ||
          (hasOptions
            ? 'Pick your branch from the list. If it is not there, choose Other and type its name: staff have to approve a new name before your crew can move on.'
            : 'Type your branch. Staff have to approve a new branch name before your crew can move on.')}
      </div>
    </div>
  );
}
