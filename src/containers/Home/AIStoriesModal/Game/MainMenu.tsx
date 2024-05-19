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

const modeOptions = [
  { label: 'Read', value: 'read' },
  { label: 'Listen', value: 'listen' }
];

export default function MainMenu({
  difficulty,
  onSetDifficulty,
  mode,
  onSetMode,
  onSetDropdownShown,
  onStart
}: {
  difficulty: number;
  onSetDifficulty: (difficulty: number) => void;
  onSetDropdownShown: (shown: boolean) => void;
  mode: string;
  onSetMode: (mode: string) => void;
  onStart: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem'
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
      <DropdownButton
        skeuomorphic
        color="darkerGray"
        icon="caret-down"
        text={
          modeOptions.find((option) => option.value === mode)?.label ||
          'Select Mode'
        }
        onDropdownShown={onSetDropdownShown}
        menuProps={modeOptions.map((option) => ({
          label: option.label,
          onClick: () => onSetMode(option.value)
        }))}
      />
      <GradientButton onClick={onStart}>Start</GradientButton>
    </div>
  );
}
