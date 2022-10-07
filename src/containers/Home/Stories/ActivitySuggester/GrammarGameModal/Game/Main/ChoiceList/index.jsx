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
  gotWrong: PropTypes.bool,
  listItems: PropTypes.array.isRequired,
  onCorrectAnswer: PropTypes.func.isRequired,
  onCountdownStart: PropTypes.func.isRequired,
  onSetGotWrong: PropTypes.func.isRequired,
  questionLength: PropTypes.number,
  selectedChoiceIndex: PropTypes.number,
  style: PropTypes.object
};
export default function ChoiceList({
  answerIndex,
  gotWrong,
  listItems,
  onCorrectAnswer,
  onCountdownStart,
  onSetGotWrong,
  questionLength = 0,
  selectedChoiceIndex,
  style
}) {
  const {
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setShown(true);
      onCountdownStart();
    }, Math.max(1500, questionLength * 35));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const listener = (e) => {
      if (e.key === '1') {
        handleSelect(0);
      } else if (e.key === '2') {
        handleSelect(1);
      } else if (e.key === '3') {
        handleSelect(2);
      } else if (e.key === '4') {
        handleSelect(3);
      }
      return;
    };
    window.addEventListener('keydown', listener);
    return function cleanUp() {
      window.removeEventListener('keydown', listener);
    };
  }, [handleSelect]);

  return (
    <div
      className={`${gotWrong ? 'jiggle-jiggle-jiggle ' : ''}${css`
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
          border: 0;
          background: linear-gradient(
            to right,
            ${Color[successColor](1)} 0%,
            ${Color[successColor](0.6)} 50%,
            ${Color[successColor](1)} 100%
          );
          background-size: 200% auto;
          background-position: left top;
          font-weight: bold;
          color: #fff;
          box-shadow: 0 0 0 0 rgba(#5a99d4, 0.5);
          animation: pulse 1.5s;
        }
        .wrong {
          color: #fff;
          border: 1px solid ${Color.red()};
          background: ${Color.red()};
          box-shadow: 0 0 10px ${Color.red()};
        }
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 ${Color[successColor](0.7)};
            background-position: left top;
          }
          70% {
            box-shadow: 0 0 0 10px ${Color[successColor](0)};
            background-position: right center;
          }
          100% {
            box-shadow: 0 0 0 0 ${Color[successColor](0)};
            background-position: right center;
          }
        }
      `}`}
      style={style}
    >
      {listItems.map((listItem, index) => {
        return (
          <ListItem
            key={index}
            answerIndex={answerIndex}
            selectedChoiceIndex={selectedChoiceIndex}
            listItem={listItem}
            onSelect={handleSelect}
            gotWrong={gotWrong}
            index={index}
          />
        );
      })}
    </div>
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleSelect(selectedIndex) {
    if (selectedIndex === answerIndex) {
      onCorrectAnswer();
    } else {
      onSetGotWrong(selectedIndex);
    }
  }
}
