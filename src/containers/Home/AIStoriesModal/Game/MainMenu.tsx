import React, { useMemo } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import GradientButton from '~/components/Buttons/GradientButton';
import { AI_STORY_LISTENING_MULTIPLIER } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { useNotiContext } from '~/contexts';
import Countdown from 'react-countdown';

const levelHash: Record<string, string> = {
  '1': 'Level 1 (AR 1)',
  '2': 'Level 2 (AR 5)',
  '3': 'Level 3 (TOEFL JR)',
  '4': 'Level 4 (TOEFL)',
  '5': 'Level 5 (SAT)'
};

const difficultyExplanation: Record<
  string,
  { reading: (JSX.Element | string)[]; listening: (JSX.Element | string)[] }
> = {
  '1': {
    reading: [
      'Suitable for beginners with basic reading skills. ',
      <b key="1">AR 1</b>,
      ' level passage.'
    ],
    listening: [
      'Focuses on ',
      <b key="2">AR 1</b>,
      ' level vocabulary with simple phrases.'
    ]
  },
  '2': {
    reading: [
      'Ideal for intermediate readers. ',
      <b key="1">AR 5</b>,
      ' level passage.'
    ],
    listening: [
      'Includes ',
      <b key="2">AR 5</b>,
      ' level vocabulary with everyday conversational phrases.'
    ]
  },
  '3': {
    reading: [
      'Good for advanced readers. Passage for those preparing for ',
      <b key="1">TOEFL JR</b>,
      ' with more challenging vocabulary and concepts.'
    ],
    listening: [
      'Zero and Ciel use ',
      <b key="2">TOEFL JR</b>,
      ' level vocabulary while engaging in nuanced discussions.'
    ]
  },
  '4': {
    reading: [
      'Challenging passage for those preparing for ',
      <b key="1">TOEFL</b>,
      '. Texts include advanced topics and complex structures.'
    ],
    listening: [
      'Features academic topics and a variety of discussions. Zero and Ciel engage in nuanced and detailed discussions with ',
      <b key="2">TOEFL</b>,
      ' level vocabulary.'
    ]
  },
  '5': {
    reading: [
      'Very challenging passage meant for ',
      <b key="1">SAT</b>,
      ' preparation.'
    ],
    listening: [
      'Includes in-depth and nuanced discussions on complex topics. Longer dialogues with ',
      <b key="2">SAT</b>,
      ' level vocabulary.'
    ]
  }
};

const Explanation = ({ level }: { level: number }) => (
  <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
    <div
      style={{
        marginTop: '1rem',
        fontSize: '1rem',
        textAlign: 'left',
        width: '80%'
      }}
    >
      <strong>Reading:</strong> {difficultyExplanation[level].reading}
      <br />
      <strong>
        Listening ({AI_STORY_LISTENING_MULTIPLIER}x rewards):
      </strong>{' '}
      {difficultyExplanation[level].listening}
    </div>
  </div>
);

export default function MainMenu({
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
  topicLoadError,
  onSetReadCount,
  onSetListenCount
}: {
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
  listenCount?: number;
  topicLoadError: boolean;
  onSetReadCount: (count: number) => void;
  onSetListenCount: (count: number) => void;
}) {
  const { timeDifference, nextDayTimeStamp } = useNotiContext(
    (v) => v.state.todayStats
  );

  const maxReadAttemptsReached = useMemo(
    () => readCount >= maxReadAttempts,
    [readCount, maxReadAttempts]
  );

  const maxListenAttemptsReached = useMemo(
    () => listenCount >= maxListenAttempts,
    [listenCount, maxListenAttempts]
  );

  const readButtonLabel = useMemo(() => {
    if (maxReadAttemptsReached) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: '1.5rem'
          }}
        >
          Available in{' '}
          <Countdown
            key={nextDayTimeStamp}
            className={css`
              margin-top: 0.5rem;
            `}
            date={nextDayTimeStamp}
            daysInHours={true}
            now={() => {
              return Date.now() + timeDifference;
            }}
            onComplete={() => onSetReadCount(0)}
          />
        </div>
      );
    }
    return 'Read';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxReadAttemptsReached, nextDayTimeStamp, timeDifference]);

  const listenButtonLabel = useMemo(() => {
    if (maxListenAttemptsReached) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: '1.5rem'
          }}
        >
          Available in{' '}
          <Countdown
            key={nextDayTimeStamp}
            className={css`
              margin-top: 0.5rem;
            `}
            date={nextDayTimeStamp}
            daysInHours={true}
            now={() => {
              return Date.now() + timeDifference;
            }}
            onComplete={() => onSetListenCount(0)}
          />
        </div>
      );
    }
    return 'Listen';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxListenAttemptsReached, nextDayTimeStamp, timeDifference]);

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
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <DropdownButton
        skeuomorphic
        color="darkerGray"
        icon="caret-down"
        text={levelHash[difficulty]}
        onDropdownShown={onSetDropdownShown}
        menuProps={Object.keys(levelHash).map((level: string) => ({
          label: levelHash[level],
          onClick: () => onSetDifficulty(Number(level))
        }))}
      />
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
            disabled={maxReadAttemptsReached}
            loading={loadingTopic}
            onClick={() => {
              onStart('read');
            }}
          >
            {readButtonLabel}
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
            disabled={maxListenAttemptsReached}
            loading={loadingTopic}
            onClick={() => {
              onStart('listen');
            }}
          >
            {listenButtonLabel}
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
          fontSize: '0.875rem',
          textAlign: 'center',
          width: '80%'
        }}
      >
        <Explanation level={difficulty} />
      </div>
    </div>
  );
}
