import React from 'react';
import ListItem from './ListItem';
import { css } from '@emotion/css';

export default function ChoiceList({
  answerIndex,
  conditionPassStatus,
  listItems,
  onSelect,
  style
}: {
  answerIndex: number;
  conditionPassStatus: string;
  listItems: any[];
  onSelect: (index: number) => any;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 1rem;
      `}
      style={style}
    >
      {listItems.map((listItem, index) => {
        return (
          <ListItem
            key={index}
            answerIndex={answerIndex}
            conditionPassStatus={conditionPassStatus}
            listItem={listItem}
            onSelect={onSelect}
            index={index}
          />
        );
      })}
    </div>
  );
}
