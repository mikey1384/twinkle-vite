import React, { useMemo } from 'react';
import ChoiceList from '~/components/ChoiceList';
import { css } from '@emotion/css';

export default function MultipleChoiceQuestion({
  question,
  choices,
  listItems: listItemsProp,
  isGraded,
  selectedChoiceIndex,
  answerIndex,
  onSelectChoice,
  style,
  conditionPassStatus: conditionPassStatusProp,
  allowReselect = false
}: {
  question: React.ReactNode;
  choices?: string[];
  listItems?: { label: string; checked: boolean }[];
  isGraded: boolean;
  selectedChoiceIndex?: number | null;
  onSelectChoice: (index: number) => void;
  answerIndex: number;
  style?: React.CSSProperties;
  conditionPassStatus?: string;
  allowReselect?: boolean;
}) {
  const listItems = useMemo(() => {
    if (listItemsProp && Array.isArray(listItemsProp)) return listItemsProp;
    const safeChoices = Array.isArray(choices) ? choices : [];
    return safeChoices.map((choice, index) => ({
      label: choice,
      checked:
        typeof selectedChoiceIndex === 'number' && index === selectedChoiceIndex
    }));
  }, [listItemsProp, choices, selectedChoiceIndex]);

  const conditionPassStatus = useMemo(() => {
    if (typeof conditionPassStatusProp === 'string') {
      return conditionPassStatusProp;
    }
    if (!isGraded) return '';
    if (typeof selectedChoiceIndex !== 'number') return 'fail';
    return selectedChoiceIndex === answerIndex ? 'pass' : 'fail';
  }, [conditionPassStatusProp, isGraded, selectedChoiceIndex, answerIndex]);

  return (
    <div
      className={css`
        width: 100%;
      `}
      style={style}
    >
      <div>
        <div>
          <div>{question}</div>
        </div>
        <ChoiceList
          answerIndex={answerIndex}
          conditionPassStatus={conditionPassStatus}
          listItems={listItems}
          onSelect={onSelectChoice}
          allowReselect={allowReselect}
          style={{ marginTop: '1.5rem', paddingRight: '1rem' }}
        />
      </div>
    </div>
  );
}
