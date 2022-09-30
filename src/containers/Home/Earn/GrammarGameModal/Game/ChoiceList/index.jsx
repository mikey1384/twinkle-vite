import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ListItem from './ListItem';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
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
  selectedChoiceIndex: PropTypes.number,
  style: PropTypes.object
};
export default function ChoiceList({
  answerIndex,
  listItems,
  onSelect,
  selectedChoiceIndex,
  style
}) {
  const {
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
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
        .correct {
          font-weight: bold;
          border: 0;
          color: #fff;
          background: ${Color[successColor]()};
          box-shadow: 0 0 0 0 rgba(#5a99d4, 0.5);
          animation: pulse 1.5s;
        }
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 ${Color[successColor](0.7)};
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 20px ${Color[successColor](0)};
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 ${Color[successColor](0)};
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
            selectedChoiceIndex={selectedChoiceIndex}
            listItem={listItem}
            onSelect={onSelect}
            index={index}
          />
        );
      })}
    </div>
  );
}
