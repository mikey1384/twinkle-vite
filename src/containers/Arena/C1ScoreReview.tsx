import React from 'react';
import { css } from '@emotion/css';
import type { C1ScaleReport } from './types';

const rangeText = (range: { low: number; high: number }) =>
  range.low === range.high ? String(range.low) : `${range.low}–${range.high}`;

export default function C1ScoreReview({ report }: { report: C1ScaleReport }) {
  return (
    <section className={wrapCls} aria-label="C1 practice scale estimates">
      <h3>Practice scale estimates · unofficial</h3>
      <ul>
        {report.skills.map((skill) => (
          <li key={skill.key}>
            <b>{skill.label}: </b>
            {skill.pending ? 'Waiting for marking' : `${skill.raw}/${skill.max} marks · ${skill.range ? rangeText(skill.range) : 'below 142'}`}
            {skill.key === 'writing' && !skill.pending && ' · AI estimate'}
          </li>
        ))}
      </ul>
      <p>
        {report.average
          ? `Average of ${report.average.skills} assessed skills: ${rangeText(report.average)}.${report.average.skills === 3 ? ' Writing is still pending.' : ''}`
          : 'An average is unavailable at this score.'}
      </p>
      <p>
        Speaking is not included. These original papers are not calibrated to
        Cambridge results; the estimates are unofficial. Practice A/B/C grades
        use raw marks.
      </p>
    </section>
  );
}

const wrapCls = css`
  flex-basis: 100%;
  min-width: 0;
  font-size: 1.2rem;
  line-height: 1.6;
  h3 { margin: 0 0 0.5rem; }
  p { margin: 0.6rem 0; }
`;
