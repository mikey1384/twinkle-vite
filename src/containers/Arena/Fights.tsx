import React from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { ARENA } from './theme';

// Arena: real fights only. The first fighters (Mikey 2026-10-24) are listed
// with what each one is; the fight runner and the question bank arrive in
// the next rounds, so nothing here is playable yet. Exam and fighter names
// use their real Korean terms so a parent watching recognizes the exam
// (Mikey 10-24: an exception to the English-only UI rule); English sits
// beside them.
const LAUNCH_FIGHTERS = [
  {
    key: 'suneung-eng',
    name: '수능 감독관',
    nameEn: 'The CSAT Proctor',
    exam: '수능 영어',
    examEn: 'CSAT English',
    detail: '45 questions · 70 minutes · listening included',
    color: ARENA.violet
  },
  {
    key: 'hakpyeong-eng',
    name: '학평 담임',
    nameEn: 'The Homeroom Teacher',
    exam: '학력평가 영어',
    examEn: 'Mock Exam English',
    detail: 'Short and medium fights from the reading section',
    color: ARENA.train
  },
  {
    key: 'korean-history',
    name: '한국사 강사',
    nameEn: 'The History Lecturer',
    exam: '수능 한국사 · 한국사능력검정',
    examEn: 'Korean History',
    detail: '20 or 50 questions, absolute grades',
    color: ARENA.coral
  }
];

export default function Fights() {
  return (
    <div className={wrapCls}>
      <p className={introCls}>
        Each fighter is a real exam, with its real time limits and grading.
        The first fighters are on their way.
      </p>
      <div className={gridCls}>
        {LAUNCH_FIGHTERS.map((fighter) => (
          <div key={fighter.key} className={cardCls}>
            <div className={faceCls} style={{ background: fighter.color }}>
              <span className={nameCls}>{fighter.name}</span>
              <span className={nameEnCls}>{fighter.nameEn}</span>
            </div>
            <div className={bodyCls}>
              <strong>
                {fighter.exam} <small>{fighter.examEn}</small>
              </strong>
              <span>{fighter.detail}</span>
              <em>Coming soon</em>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const wrapCls = css`
  max-width: 1100px;
  margin: 0 auto;
`;

const introCls = css`
  margin: 0 0 1.6rem;
  text-align: center;
  font-size: 1.5rem;
  color: ${ARENA.inkSoft};
`;

const gridCls = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const cardCls = css`
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  overflow: hidden;
  background: ${ARENA.paper};
  box-shadow: 4px 4px 0 ${ARENA.line};
`;

const faceCls = css`
  height: 12rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  align-items: center;
  justify-content: center;
  border-bottom: 3px solid ${ARENA.line};
`;

const nameCls = css`
  color: #fff;
  font-size: 2.4rem;
  font-weight: 900;
  text-shadow: 2px 2px 0 ${ARENA.line};
`;

const nameEnCls = css`
  color: #fff;
  font-size: 1.3rem;
  font-weight: 700;
  opacity: 0.9;
`;

const bodyCls = css`
  padding: 1rem 1.2rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  strong {
    font-size: 1.6rem;
    small {
      font-size: 1.2rem;
      font-weight: 600;
      color: ${ARENA.inkSoft};
    }
  }
  span {
    font-size: 1.3rem;
    color: ${ARENA.inkSoft};
  }
  em {
    margin-top: 0.4rem;
    font-style: normal;
    font-size: 1.2rem;
    font-weight: 800;
    color: ${ARENA.accent};
  }
`;
