import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ListItem from './ListItem';
import { css } from '@emotion/css';
import {
  borderRadius,
  Color,
  innerBorderRadius,
  mobileMaxWidth
} from '~/constants/css';

ChoiceList.propTypes = {
  answerIndex: PropTypes.number,
  listItems: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  style: PropTypes.object
};
export default function ChoiceList({
  answerIndex,
  listItems,
  onSelect,
  style
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setTimeout(() => setShown(true), 1300);
  }, []);

  return (
    <div
      className={css`
        display: ${shown ? 'flex' : 'none'};
        opacity: ${shown ? 1 : 0};
        transition: opacity 1s;
        flex-direction: column;
        width: 80%;
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

        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
      style={style}
    >
      {listItems.map((listItem, index) => {
        return (
          <ListItem
            key={index}
            answerIndex={answerIndex}
            listItem={listItem}
            onSelect={onSelect}
            index={index}
          />
        );
      })}
    </div>
  );
}
