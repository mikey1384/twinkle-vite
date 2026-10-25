import React, { useState } from 'react';
import { css } from '@emotion/css';
import { PaperItem } from './BattleRunner';
import { useArenaPaperFonts } from './paperFont';
import type { ArenaBattle } from './types';

export type ParentPaper = Pick<ArenaBattle, 'items' | 'passages'> & {
  exam: ArenaBattle['battle']['exam'];
};

export default function ParentPaperReview({ paper }: { paper: ParentPaper }) {
  useArenaPaperFonts();
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const shownPassages = new Set<number>();
  return (
    <section className={wrapCls} aria-label="시험지와 학생 답안">
      <h2>시험지와 학생 답안</h2>
      <p>응시 당시의 문제와 저장된 답안입니다. 답안을 변경하거나 다시 응시할 수 없습니다.</p>
      <label>
        해설 언어{' '}
        <select value={language} onChange={(event) => setLanguage(event.target.value as 'ko' | 'en')}>
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </label>
      {paper.items.map((item) => {
        const passage = item.passageId != null && !shownPassages.has(item.passageId)
          ? paper.passages[String(item.passageId)] || null : null;
        if (item.passageId != null) shownPassages.add(item.passageId);
        return <PaperItem
          key={item.no}
          item={item}
          passage={passage}
          marked={item.answer ?? null}
          finished
          audioControls
          allPointTags={paper.exam.pointTags === 'all'}
          letters={paper.exam.optionMarkers === 'letters'}
          problemLayout={paper.exam.layout === 'problem'}
          reviewLang={language}
          korean
          onMark={() => {}}
        />;
      })}
    </section>
  );
}

const wrapCls = css`
  width: 100%;
  min-width: 0;
  padding: 1.4rem;
  background: #fff;
  border: 1px solid #ccc;
  font-size: 1.5rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  h2 { font-size: 1.9rem; }
  select { padding: 0.4rem; font: inherit; }
  article { margin-top: 1.6rem; }
`;
