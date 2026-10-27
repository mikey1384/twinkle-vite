import React from 'react';
import { css } from '@emotion/css';
import { ARENA } from './theme';

export default function ExamScope({ examKey }: { examKey: string }) {
  // The E6 label identifies the intended pupils, not an elementary-only syllabus.
  // Its blueprint includes a middle-school 선행 slot in every length and mode.
  if (examKey !== 'lt-math-e6') return null;

  return (
    <p className={scopeCls} lang="ko">
      <span className={labelCls}>출제 범위</span>
      <span>초등 심화 + 중1-1 선행 일부</span>
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
