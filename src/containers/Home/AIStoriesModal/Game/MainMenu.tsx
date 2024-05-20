import React from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import GradientButton from '~/components/Buttons/GradientButton';

const levelHash: Record<string, string> = {
  1: 'Level 1 (AR 1)',
  2: 'Level 2 (AR 5)',
  3: 'Level 3 (TOEFL JR)',
  4: 'Level 4 (TOEFL)',
  5: 'Level 5 (SAT)'
};

export default function MainMenu({
  difficulty,
  loadingTopic,
  onSetDifficulty,
  onSetDropdownShown,
  onStart
}: {
  difficulty: number;
  loadingTopic: boolean;
  onSetDifficulty: (difficulty: number) => void;
  onSetDropdownShown: (shown: boolean) => void;
  onStart: (mode: string) => void;
}) {
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
