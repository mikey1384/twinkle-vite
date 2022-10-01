import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export const gridContainer = css`
  .correct {
    border-color: ${Color.limeGreen()};
    background: ${Color.limeGreen()};
    text-shadow: rgb(0, 0, 0) 1px 1px 1px;
  }

  .present {
    border-color: ${Color.brownOrange()};
    background: ${Color.brownOrange()};
    text-shadow: rgb(0, 0, 0) 1px 1px 1px;
  }

  .absent {
    border-color: ${Color.blueGray()};
    background: ${Color.blueGray()};
    text-shadow: rgb(0, 0, 0) 1px 1px 1px;
  }

  .cell-fill-animation {
    animation: onTypeCell linear;
    animation-duration: 0.35s;
  }

  .cell-waving {
    animation: wave ease-in-out;
    animation-duration: 200ms;
  }

  .cell-reveal {
    animation-duration: 0.35s;
    animation-timing-function: linear;
    animation-fill-mode: backwards;
  }

  .cell-reveal.absent {
    animation-name: revealAbsentCharCell;
  }

  .cell-reveal.correct {
    animation-name: revealCorrectCharCell;
  }

  .cell-reveal.present {
    animation-name: revealPresentCharCell;
  }

  .cell-reveal > .letter-container {
    animation: offsetLetterFlip 0.35s linear;
    animation-fill-mode: backwards;
  }

  .jiggle {
    animation: jiggle linear;
    animation-duration: 250ms;
  }

  @keyframes revealAbsentCharCell {
    0% {
      transform: rotateX(0deg);
      background-color: ${Color.lightBlueGray()};
      border-color: ${Color.lightBlueGray()};
      text-shadow: none;
    }
    50% {
      background-color: ${Color.lightBlueGray()};
      border-color: ${Color.lightBlueGray()};
      text-shadow: none;
    }
    50.1% {
      background-color: ${Color.blueGray()};
      border-color: ${Color.blueGray()};
    }
    100% {
      transform: rotateX(180deg);
    }
  }

  @keyframes revealCorrectCharCell {
    0% {
      transform: rotateX(0deg);
      background-color: ${Color.lightBlueGray()};
      border-color: ${Color.lightBlueGray()};
      text-shadow: none;
    }
    50% {
      background-color: ${Color.lightBlueGray()};
      border-color: ${Color.lightBlueGray()};
      text-shadow: none;
    }
    50.1% {
      background-color: ${Color.limeGreen()};
      border-color: ${Color.limeGreen()};
    }
    100% {
      transform: rotateX(180deg);
    }
  }

  @keyframes revealPresentCharCell {
    0% {
      transform: rotateX(0deg);
      background-color: ${Color.lightBlueGray()};
      border-color: ${Color.lightBlueGray()};
      text-shadow: none;
    }
    50% {
      background-color: ${Color.lightBlueGray()};
      border-color: ${Color.lightBlueGray()};
      text-shadow: none;
    }
    50.1% {
      background-color: ${Color.brownOrange()};
      border-color: ${Color.brownOrange()};
    }
    100% {
      transform: rotateX(180deg);
    }
  }

  @keyframes offsetLetterFlip {
    0% {
      transform: rotateX(0deg);
    }
    100% {
      transform: rotateX(180deg);
    }
  }

  @keyframes onTypeCell {
    0% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.1);
    }

    100% {
      transform: scale(1);
    }
  }
`;
