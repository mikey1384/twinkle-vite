import React, { ReactNode } from 'react';
import ArenaButton from '../../ArenaButton';
import Icon from '~/components/Icon';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useNotiContext } from '~/contexts';
import { getDailyRewardPreviewStreak } from '~/helpers';
import { ARENA } from '../../theme';
import ArenaGoals from './ArenaGoals';

// Level names (Mikey 10-06/07): what Korean parents already know — AR reading
// levels for the easier stories, then the exams, with no "-style" suffix. The
// descriptions say "level" reading, never a score: the levels were not
// calibrated against those tests. The CEFR band each prompt targets
// (helpers/english/storyLevels.ts) is noted in the description.
const levelHash: Record<string, string> = {
  '1': 'Level 1 (AR 1–2)',
  '2': 'Level 2 (AR 3–5)',
  '3': 'Level 3 (TOEFL Junior)',
  '4': 'Level 4 (TOEFL)',
  '5': 'Level 5 (SAT)'
};

// the chip's short name: what each level reads like
const LEVEL_NAMES: Record<string, string> = {
  '1': 'AR 1–2',
  '2': 'AR 3–5',
  '3': 'TOEFL Jr',
  '4': 'TOEFL',
  '5': 'SAT'
};

const difficultyExplanation: Record<
  string,
  { reading: ReactNode[]; listening: ReactNode[] }
> = {
  '1': {
    reading: [
      'Short, simple sentences and everyday words, like an ',
      <b key="1">AR 1–2</b>,
      ' book (about CEFR A1–A2). 1 question to pass, plus up to 2 bonus questions.'
    ],
    listening: [
      'Zero or Ciel tells a short, simple story with ',
      <b key="2">AR 1–2</b>,
      ' level words.'
    ]
  },
  '2': {
    reading: [
      'Everyday and school topics, like an ',
      <b key="1">AR 3–5</b>,
      ' book (about CEFR A2–B1). 2 questions to pass, plus up to 1 bonus question.'
    ],
    listening: [
      'A short talk with ',
      <b key="2">AR 3–5</b>,
      ' level words and everyday phrases.'
    ]
  },
  '3': {
    reading: [
      'Longer passages at ',
      <b key="1">TOEFL Junior</b>,
      ' reading level (about CEFR B1–B2): main idea, details and what the text implies.'
    ],
    listening: [
      'Zero and Ciel discuss a topic with ',
      <b key="2">TOEFL Junior</b>,
      ' level vocabulary.'
    ]
  },
  '4': {
    reading: [
      'Academic passages at ',
      <b key="1">TOEFL</b>,
      " reading level (about CEFR B2–C1), including word meaning in context and the writer's purpose."
    ],
    listening: [
      'Academic topics discussed in depth with ',
      <b key="2">TOEFL</b>,
      ' level vocabulary.'
    ]
  },
  '5': {
    reading: [
      'Dense passages at ',
      <b key="1">SAT</b>,
      ' reading level (about CEFR C1 and above), with reasoning left for you to work out.'
    ],
    listening: [
      'Long, in-depth discussions with ',
      <b key="2">SAT</b>,
      ' level vocabulary.'
    ]
  }
};

export default function MainMenu({
  dailyTask,
  difficulty,
  loadingTopic,
  maxReadAttempts,
  maxListenAttempts,
  onLoadTopic,
  onSetDifficulty,
  onSetTopicLoadError,
  onStart,
  readCount = 0,
  listenCount = 0,
  topicLoadError
}: {
  dailyTask: any;
  difficulty: number;
  loadingTopic: boolean;
  maxReadAttempts: number;
  maxListenAttempts: number;
  onLoadTopic: (v: any) => void;
  onSetDifficulty: (difficulty: number) => void;
  // the old level dropdown reported when it was open; the chips don't
  onSetDropdownShown?: (shown: boolean) => void;
  onSetTopicLoadError: (v: boolean) => void;
  onStart: (mode: string) => void;
  readCount: number;
  listenCount: number;
  topicLoadError: boolean;
}) {
  const dailyRewardPreviewStreak = useNotiContext((v) =>
    getDailyRewardPreviewStreak(v.state.todayStats)
  );

  if (topicLoadError) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            marginTop: '5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <p style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>
            There was an error initializing AI Story
          </p>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <ArenaButton
              style={{ marginTop: '3rem' }}
              onClick={() => {
                onSetTopicLoadError(false);
                onLoadTopic({ difficulty });
              }}
            >
              Retry
            </ArenaButton>
          </div>
        </div>
      </div>
    );
  }

  const entry =
    difficultyExplanation[String(difficulty)] || difficultyExplanation['1'];
  const modes = [
    {
      key: 'read',
      label: 'Read',
      color: '#e8577e',
      count: readCount,
      max: maxReadAttempts,
      note: entry.reading
    },
    {
      key: 'listen',
      label: 'Listen',
      color: ARENA.sky,
      count: listenCount,
      max: maxListenAttempts,
      tag: '2× rewards',
      note: entry.listening
    }
  ];
  return (
    <div className={menuCls}>
      <ArenaGoals
        dailyTask={dailyTask}
        loading={loadingTopic}
        streak={dailyRewardPreviewStreak}
      />
      <div className={playCls}>
        <div className={levelRowCls}>
          <span className={levelLabelCls}>Story level</span>
          <span className={levelNowCls}>{levelHash[difficulty]}</span>
        </div>
        <div className={levelsCls} role="radiogroup" aria-label="Story level">
          {Object.keys(levelHash).map((level) => {
            const on = Number(level) === difficulty;
            return (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={loadingTopic}
                className={cx(levelCls, on && levelOnCls)}
                onClick={() => onSetDifficulty(Number(level))}
              >
                <b>Lv{level}</b>
                <span>{LEVEL_NAMES[level]}</span>
              </button>
            );
          })}
        </div>
        <div className={tilesCls}>
          {modes.map((mode) => {
            const done = mode.count >= mode.max;
            return (
              <button
                key={mode.key}
                type="button"
                className={tileCls}
                disabled={done || loadingTopic}
                onClick={() => onStart(mode.key)}
              >
                <span
                  className={tileFaceCls}
                  style={{ background: mode.color }}
                >
                  <span className={tileLabelCls}>
                    {loadingTopic ? <Icon icon="spinner" pulse /> : mode.label}
                  </span>
                  {mode.tag && <span className={tileTagCls}>{mode.tag}</span>}
                </span>
                <span className={tileBodyCls}>
                  <span className={tileCountCls}>
                    {mode.count} / {mode.max} cleared
                  </span>
                  <span className={tileNoteCls}>{mode.note}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Arena's layout (Mikey 10-24): goals on the left, the level and the two
// modes on the right as eraser-style tiles; stacked on phones
const menuCls = css`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 2rem 2.4rem;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr);
  gap: 2.4rem;
  align-items: start;
  color: ${ARENA.ink};
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    padding: 1.2rem 1rem 1.6rem;
    gap: 1.6rem;
  }
`;

const playCls = css`
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
`;

const levelRowCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const levelLabelCls = css`
  font-size: 1.6rem;
  font-weight: 900;
`;

const tilesCls = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1rem;
  }
`;

const tileCls = css`
  display: flex;
  flex-direction: column;
  padding: 0;
  text-align: left;
  background: ${ARENA.paper};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 4px 4px 0 ${ARENA.line};
  overflow: hidden;
  cursor: pointer;
  color: ${ARENA.ink};
  transition:
    transform 0.12s,
    box-shadow 0.12s;
  &:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 ${ARENA.line};
  }
  &:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 ${ARENA.line};
  }
  &:disabled {
    cursor: default;
    opacity: 0.55;
  }
`;

const tileFaceCls = css`
  position: relative;
  height: 9rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: center;
  justify-content: center;
  border-bottom: 3px solid ${ARENA.line};
  @media (max-width: ${mobileMaxWidth}) {
    height: 7rem;
  }
`;

const tileLabelCls = css`
  color: #fff;
  font-size: 3.4rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-shadow: 3px 3px 0 ${ARENA.line};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2.6rem;
  }
`;

// under the label, never over it (on phones a corner badge hit LISTEN)
const tileTagCls = css`
  padding: 0.15rem 0.6rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  font-size: 1.1rem;
  font-weight: 800;
`;

const tileBodyCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem 1.2rem 1.2rem;
`;

const tileCountCls = css`
  font-size: 1.4rem;
  font-weight: 900;
`;

const tileNoteCls = css`
  font-size: 1.25rem;
  line-height: 1.45;
  color: ${ARENA.inkSoft};
`;

const levelNowCls = css`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${ARENA.inkSoft};
`;

// the five levels as chips in one row, the chosen one inked in
const levelsCls = css`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: -0.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.5rem;
  }
`;

const levelCls = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding: 0.7rem 0.3rem;
  border: 2px solid ${ARENA.line};
  border-radius: 10px;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  box-shadow: 2px 2px 0 ${ARENA.line};
  cursor: pointer;
  b {
    font-size: 1.6rem;
    font-weight: 900;
  }
  span {
    font-size: 1.1rem;
    font-weight: 700;
    color: ${ARENA.inkSoft};
    white-space: nowrap;
  }
  &:hover:not(:disabled) {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 ${ARENA.line};
  }
  &:disabled {
    cursor: default;
  }
  @media (max-width: ${mobileMaxWidth}) {
    b {
      font-size: 1.4rem;
    }
    span {
      font-size: 0.95rem;
    }
  }
`;

const levelOnCls = css`
  background: ${ARENA.ink};
  color: #fff;
  box-shadow: 2px 2px 0 ${ARENA.train};
  span {
    color: #fff;
  }
`;
