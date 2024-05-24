import React from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import GradientButton from '~/components/Buttons/GradientButton';

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
      'Speakers use ',
      <b key="2">TOEFL JR</b>,
      ' level vocabulary and engage in more nuanced discussions.'
    ]
  },
  '4': {
    reading: [
      'Challenging passage for those preparing for ',
      <b key="1">TOEFL</b>,
      '. Texts include advanced topics and complex structures.'
    ],
    listening: [
      'Features academic topics and a variety of discussions. Speakers engage in nuanced and detailed discussions with ',
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
      <strong>Listening:</strong> {difficultyExplanation[level].listening}
    </div>
  </div>
);

export default function MainMenu({
  difficulty,
  loadingTopic,
  onLoadTopic,
  onSetDifficulty,
  onSetDropdownShown,
  onSetTopicLoadError,
  onStart,
  topicLoadError
}: {
  difficulty: number;
  loadingTopic: boolean;
  onLoadTopic: (v: any) => void;
  onSetDifficulty: (difficulty: number) => void;
  onSetDropdownShown: (shown: boolean) => void;
  onSetTopicLoadError: (v: boolean) => void;
  onStart: (mode: string) => void;
  topicLoadError: boolean;
}) {
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
        <GradientButton
          theme="pink"
          loading={loadingTopic}
          onClick={() => {
            onStart('read');
          }}
        >
          Read
        </GradientButton>
        <GradientButton
          theme="blue"
          loading={loadingTopic}
          onClick={() => {
            onStart('listen');
          }}
        >
          Listen
        </GradientButton>
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
