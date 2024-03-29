import React from 'react';
import PropTypes from 'prop-types';
import ListItem from './ListItem';
import { css } from '@emotion/css';
import { borderRadius, Color, innerBorderRadius } from '~/constants/css';

ChoiceList.propTypes = {
  answerIndex: PropTypes.number,
  conditionPassStatus: PropTypes.string,
  listItems: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  style: PropTypes.object
};
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
        nav {
          border: 1px solid ${Color.borderGray()};
          border-top: none;
        }
        nav:first-of-type {
          border: 1px solid ${Color.borderGray()};
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
