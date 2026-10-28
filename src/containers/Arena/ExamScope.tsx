import React from 'react';
import { css } from '@emotion/css';
import { ARENA } from './theme';

const SSAT_GRADES: Record<string, string> = {
  'ssat-elementary-3': 'Current US Grade 3',
  'ssat-elementary-4': 'Current US Grade 4',
  'ssat-middle': 'Current US Grades 5–7',
  'ssat-upper': 'Current US Grades 8–11'
};

export default function ExamScope({ examKey }: { examKey: string }) {
  // The E6 label identifies the intended pupils, not an elementary-only syllabus.
  // Its blueprint includes a middle-school 선행 slot in every length and mode.
  const grades = SSAT_GRADES[examKey];
  if (examKey !== 'lt-math-e6' && !grades) return null;

  return (
    <p className={scopeCls} lang={grades ? 'en' : 'ko'}>
      <span className={labelCls}>{grades ? 'Who this level is for' : '출제 범위'}</span>
      <span>{grades || '초등 심화 + 중1-1 선행 일부'}</span>
    </p>
  );
}

const scopeCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin: 0;
  padding: 0.8rem 1rem;
  border-radius: 6px;
  background: ${ARENA.background};
  color: ${ARENA.inkSoft};
  font-size: max(1.2rem, 14px);
  line-height: 1.5;
  text-align: left;
  word-break: keep-all;
`;

const labelCls = css`
  font-weight: 700;
`;
