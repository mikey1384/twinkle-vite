import React from 'react';
import ListItem from './ListItem';
import { css } from '@emotion/css';
import { borderRadius, Color, innerBorderRadius } from '~/constants/css';

export default function ChoiceList({
  answerIndex,
  conditionPassStatus,
  listItems,
  onSelect,
  style
}: {
  answerIndex?: number;
  conditionPassStatus: string;
  listItems: any[];
  onSelect: (v: any) => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        width: 100%;
        nav {
          border: 1px solid var(--ui-border);
          border-top: none;
        }
        nav:first-of-type {
          border: 1px solid var(--ui-border);
          border-top-left-radius: ${borderRadius};
          border-top-right-radius: ${borderRadius};
          section {
            border-top-left-radius: ${innerBorderRadius};
          }
        }
        nav:last-child {
          border-bottom-left-radius: ${borderRadius};
          border-bottom-right-radius: ${borderRadius};
          section {
            border-bottom-left-radius: ${innerBorderRadius};
          }
        }
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
