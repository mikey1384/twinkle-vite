import React, { ReactNode } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import GradientButton from '~/components/Buttons/GradientButton';
import DailyRewardBoostStrip from '~/components/DailyRewardBoostStrip';
import { useNotiContext } from '~/contexts';
import { getDailyRewardPreviewStreak } from '~/helpers';

// Level names (Mikey 10-06): what Korean parents already know — AR reading
// levels for the easier stories, then the exams. "-style" names the kind of
// reading each level aims at; the levels were never calibrated against those
// tests, so they never claim a score. The CEFR band each prompt targets
// (helpers/english/storyLevels.ts) is noted in the description.
const levelHash: Record<string, string> = {
  '1': 'Level 1 (AR 1–2 style)',
  '2': 'Level 2 (AR 3–5 style)',
  '3': 'Level 3 (TOEFL Junior–style)',
  '4': 'Level 4 (TOEFL-style)',
  '5': 'Level 5 (SAT-style)'
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
      'Longer passages in the style of ',
      <b key="1">TOEFL Junior</b>,
      ' reading (about CEFR B1–B2): main idea, details and what the text implies.'
    ],
    listening: [
      'Zero and Ciel discuss a topic with ',
      <b key="2">TOEFL Junior</b>,
      '–style vocabulary.'
    ]
  },
  '4': {
    reading: [
      'Academic passages in the style of ',
      <b key="1">TOEFL</b>,
      " reading (about CEFR B2–C1), including word meaning in context and the writer's purpose."
    ],
    listening: [
      'Academic topics discussed in depth with ',
      <b key="2">TOEFL</b>,
      '–style vocabulary.'
    ]
  },
  '5': {
    reading: [
      'Dense passages in the style of ',
      <b key="1">SAT</b>,
      ' reading (about CEFR C1 and above), with reasoning left for you to work out.'
    ],
    listening: [
      'Long, in-depth discussions with ',
      <b key="2">SAT</b>,
      '–style vocabulary.'
    ]
  }
};

const Explanation = ({ level }: { level: number }) => {
  const entry =
    difficultyExplanation[String(level)] || difficultyExplanation['1'];
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          marginTop: '1rem',
          fontSize: '1.1rem',
          textAlign: 'center',
          width: '80%'
        }}
      >
        <strong>Reading:</strong> {entry.reading}
        <br />
        <strong>Listening (2x rewards):</strong> {entry.listening}
      </div>
    </div>
  );
};

export default function MainMenu({
  dailyTask,
  difficulty,
  loadingTopic,
  maxReadAttempts,
  maxListenAttempts,
  onLoadTopic,
  onSetDifficulty,
  onSetDropdownShown,
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
  onSetDropdownShown: (shown: boolean) => void;
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
            <GradientButton
              style={{ marginTop: '3rem' }}
              onClick={() => {
                onSetTopicLoadError(false);
                onLoadTopic({ difficulty });
              }}
            >
              Retry
            </GradientButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          marginTop: '2rem',
          width: '100%',
          maxWidth: '46rem',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <DailyRewardBoostStrip
          focus="aiStory"
          streak={dailyRewardPreviewStreak}
          aiStory={dailyTask}
          loadingStates={{ aiStory: loadingTopic }}
        />
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <DropdownButton
          variant="solid"
          tone="raised"
          color="darkerGray"
          icon="caret-down"
          listStyle={{ minWidth: '18rem', whiteSpace: 'nowrap' }}
          text={levelHash[difficulty]}
          onDropdownShown={onSetDropdownShown}
          menuProps={Object.keys(levelHash).map((level: string) => ({
            label: levelHash[level],
            onClick: () => onSetDifficulty(Number(level))
          }))}
        />
      </div>
      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '2rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'center'
          }}
        >
          <GradientButton
            theme="pink"
            disabled={readCount >= maxReadAttempts}
            loading={loadingTopic}
            onClick={() => {
              onStart('read');
            }}
          >
            Read
          </GradientButton>
          <p
            style={{
              fontFamily: 'Poppins',
              marginTop: '0.5rem',
              fontSize: '1.2rem'
            }}
          >
            {readCount} / {maxReadAttempts} cleared
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'center'
          }}
        >
          <GradientButton
            theme="blue"
            loading={loadingTopic}
            disabled={listenCount >= maxListenAttempts}
            onClick={() => {
              onStart('listen');
            }}
          >
            Listen
          </GradientButton>
          <p
            style={{
              fontFamily: 'Poppins',
              marginTop: '0.5rem',
              fontSize: '1.2rem'
            }}
          >
            {listenCount} / {maxListenAttempts} cleared
          </p>
        </div>
      </div>
      <div
        style={{
          marginTop: '1rem',
          fontSize: '1.1rem',
          textAlign: 'center',
          width: '80%'
        }}
      >
        <Explanation level={difficulty} />
      </div>
    </div>
  );
}
