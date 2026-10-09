import React, { useId, useState } from 'react';
import { questHelpClass, questInputClass, questLabelClass } from './StepCard';

const keyOf = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();

export default function ClassField({
  value,
  onChange,
  branch,
  officialClasses
}: {
  value: string;
  onChange: (value: string) => void;
  branch: string;
  officialClasses: { id: number; name: string }[];
}) {
  const id = useId();
  const [typing, setTyping] = useState(false);
  const selected = officialClasses.find((item) => keyOf(item.name) === keyOf(value));
  const hasChoices = officialClasses.length > 0;
  const other = typing || (!!value && !selected);
  return (
    <div>
      <label className={questLabelClass} htmlFor={id}>Your class name</label>
      {hasChoices && (
        <select
          id={id}
          className={questInputClass}
          value={other ? 'other' : selected ? String(selected.id) : ''}
          onChange={(event) => {
            const choice = officialClasses.find((item) => String(item.id) === event.target.value);
            setTyping(event.target.value === 'other');
            onChange(choice?.name || '');
          }}
        >
          <option value="">Choose your class…</option>
          {officialClasses.map((item) => (
            <option key={item.id} value={String(item.id)}>{item.name}</option>
          ))}
          <option value="other">My class isn’t listed</option>
        </select>
      )}
      {(!hasChoices || other) && (
        <input
          id={hasChoices ? `${id}-other` : id}
          aria-label={hasChoices ? 'Type your class name' : undefined}
          className={questInputClass}
          style={{ marginTop: hasChoices ? '0.6rem' : 0 }}
          value={value}
          maxLength={60}
          placeholder="e.g. Wednesday Debate"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hasChoices && (
        <span className={questHelpClass}>
          Classes checked by Mikey for {branch}. If yours isn’t listed, you can type it.
        </span>
      )}
    </div>
  );
}
