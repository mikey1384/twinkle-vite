import React, { ReactNode } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import GradientButton from '~/components/Buttons/GradientButton';
import DailyRewardBoostStrip from '~/components/DailyRewardBoostStrip';
import { useNotiContext } from '~/contexts';
import { getDailyRewardPreviewStreak } from '~/helpers';

// One level table with the API (helpers/english/storyLevels.ts, 10-06): a
// friendly name for players plus the CEFR band each level targets. The old
// AR / TOEFL / SAT labels were never calibrated, so they are gone.
const levelHash: Record<string, string> = {
  '1': 'Level 1 · Starter (A1–A2)',
  '2': 'Level 2 · Explorer (A2–B1)',
  '3': 'Level 3 · Adventurer (B1–B2)',
  '4': 'Level 4 · Scholar (B2–C1)',
  '5': 'Level 5 · Master (C1+)'
};

const difficultyExplanation: Record<
  string,
  { reading: ReactNode[]; listening: ReactNode[] }
> = {
  '1': {
    reading: [
      'Short, simple sentences and everyday words. ',
      <b key="1">1 question</b>,
      ' to pass, plus up to 2 bonus questions.'
    ],
    listening: [
      'Zero or Ciel tells a short, simple story with ',
      <b key="2">everyday words</b>,
      '.'
    ]
  },
  '2': {
    reading: [
      'Everyday and school topics with common tenses. ',
      <b key="1">2 questions</b>,
      ' to pass, plus up to 1 bonus question.'
    ],
    listening: [
      'A short talk with ',
      <b key="2">everyday and school words</b>,
      ' and conversational phrases.'
    ]
  },
  '3': {
    reading: [
      'Longer sentences and some ',
      <b key="1">abstract ideas</b>,
      '. Questions ask for the main idea, details and what the text implies.'
    ],
    listening: [
      'Zero and Ciel discuss a topic with ',
      <b key="2">more challenging vocabulary</b>,
      '.'
    ]
  },
  '4': {
    reading: [
      'Complex sentences and ',
      <b key="1">academic vocabulary</b>,
      ". Questions include word meaning in context and the writer's purpose."
    ],
    listening: [
      'Academic topics with nuanced, detailed discussion and ',
      <b key="2">advanced vocabulary</b>,
      '.'
    ]
  },
  '5': {
    reading: [
      'Dense, ',
      <b key="1">advanced academic</b>,
      ' passages with reasoning left for you to work out.'
    ],
    listening: [
      'Long, in-depth discussions of complex topics with ',
      <b key="2">advanced vocabulary</b>,
      '.'
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
