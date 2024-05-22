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

export default function MainMenu({
  difficulty,
  onSetDifficulty,
  onSetDropdownShown,
  onSetTopicLoadError,
  topicLoadError,
  onStart
}: {
  difficulty: number;
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
    </div>
  );
}
