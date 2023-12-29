import React, { useMemo } from 'react';
import CheckListGroup from '~/components/CheckListGroup';

export default function Question({
  question,
  choices,
  isGraded,
  selectedChoiceIndex,
  onSelectChoice,
  answerIndex,
  style
}: {
  question: string;
  choices: string[];
  isGraded: boolean;
  selectedChoiceIndex?: number;
  onSelectChoice: (index: number) => void;
  answerIndex: number;
  style?: React.CSSProperties;
}) {
  const listItems = useMemo(
    () =>
      choices.map((choice, index) => ({
        label: choice,
        checked: index === selectedChoiceIndex,
        isCorrect:
          isGraded &&
          typeof selectedChoiceIndex === 'number' &&
          index === selectedChoiceIndex &&
          selectedChoiceIndex === answerIndex,
        isWrong:
          isGraded &&
          typeof selectedChoiceIndex === 'number' &&
          index === selectedChoiceIndex &&
          selectedChoiceIndex !== answerIndex
      })),
    [choices, selectedChoiceIndex, isGraded, answerIndex]
  );

  return (
    <div style={style}>
      <div>
        <p style={{ fontWeight: 'bold' }}>{question}</p>
      </div>
      <CheckListGroup
        inputType="checkbox"
        listItems={listItems}
        onSelect={onSelectChoice}
        style={{ marginTop: '1.5rem', paddingRight: '1rem' }}
      />
    </div>
  );
}