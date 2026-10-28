import React from 'react';
import { css } from '@emotion/css';

const PRACTICE_NOTES: Record<string, string> = {
  'a2-key-schools': 'Speaking is not included in this practice test.',
  'ielts-academic': 'Speaking is not included in this practice test.',
  'sat-rw': 'This covers Reading and Writing only. Questions use the selected difficulty; the modules are not adaptive.',
  'sat-math': 'This covers Math only. Questions use the selected difficulty; the modules are not adaptive.',
  lsat: 'This practice test contains the three scored sections. It omits the unscored section and the separate writing sample.'
};

export default function ComponentSchedule({
  components,
  examKey
}: {
  components?: { name: string; minutes: number; kind?: 'break' }[];
  examKey?: string;
}) {
  if (!components?.length) return null;
  return (
    <div className={scheduleCls}>
      <ol>
        {components.map((component) => (
          <li key={component.name}>
            <span>{component.name}</span>
            <strong>{component.minutes} min</strong>
          </li>
        ))}
      </ol>
      <p>
        Each section has its own clock. Once submitted, its answers are
        locked. Unused time does not carry over.
      </p>
      {components.some(component => component.kind === 'break') && <p>Breaks are timed too. Each section starts automatically when the previous clock ends.</p>}
      {examKey && PRACTICE_NOTES[examKey] && <p>{PRACTICE_NOTES[examKey]}</p>}
    </div>
  );
}
const scheduleCls = css`
  width: 100%;
  font:
    1.4rem/1.6 Arial,
    sans-serif;
  ol {
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #ddd;
  }
  strong {
    white-space: nowrap;
  }
  p {
    margin: 0.7rem 0;
  }
`;
