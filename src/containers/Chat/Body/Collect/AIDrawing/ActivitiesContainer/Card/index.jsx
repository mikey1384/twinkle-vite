import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { desktopMinWidth } from '~/constants/css';

const color1 = '#54a29e';
const color2 = '#a79d66';

Card.propTypes = {
  frontPicUrl: PropTypes.string.isRequired
};

export default function Card({ frontPicUrl }) {
  return (
    <div
      className={css`
        width: 71.5vw;
        height: 100vw;
        position: relative;
        overflow: hidden;
        margin: 20px;
        overflow: hidden;
        z-index: 10;
        touch-action: none;
        border-radius: 5% / 3.5%;
        box-shadow: -5px -5px 5px -5px ${color1}, 5px 5px 5px -5px ${color2},
          -7px -7px 10px -5px transparent, 7px 7px 10px -5px transparent,
          0 0 5px 0px rgba(255, 255, 255, 0),
          0 55px 35px -20px rgba(0, 0, 0, 0.5);
        transition: transform 0.5s ease, box-shadow 0.2s ease;
        will-change: transform, filter;
        background-color: ${color1};
        background-image: url(${frontPicUrl});
        background-size: contain;
        background-repeat: no-repeat;
        background-position: 50% 50%;
        transform-origin: center;
        &:before,
        &:after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          top: 0;
          background-repeat: no-repeat;
          opacity: 0.5;
          mix-blend-mode: color-dodge;
          transition: all 0.33s ease;
        }
        &:before {
          background-position: 50% 50%;
          background-size: 300% 300%;
          background-image: linear-gradient(
            115deg,
            transparent 0%,
            ${color1} 25%,
            transparent 47%,
            transparent 53%,
            ${color2} 75%,
            transparent 100%
          );
          opacity: 0.5;
          filter: brightness(0.5) contrast(1);
          z-index: 1;
        }
        &:after {
          opacity: 1;
          background-image: url('https://assets.codepen.io/13471/sparkles.gif'),
            url(https://assets.codepen.io/13471/holo.png),
            linear-gradient(
              125deg,
              #ff008450 15%,
              #fca40040 30%,
              #ffff0030 40%,
              #00ff8a20 60%,
              #00cfff40 70%,
              #cc4cfa50 85%
            );
          background-position: 50% 50%;
          background-size: 160%;
          background-blend-mode: overlay;
          z-index: 2;
          filter: brightness(1) contrast(1);
          transition: all 0.33s ease;
          mix-blend-mode: color-dodge;
          opacity: 0.75;
        }
        &:hover {
          box-shadow: -20px -20px 30px -25px ${color1},
            20px 20px 30px -25px ${color2}, -7px -7px 10px -5px ${color1},
            7px 7px 10px -5px ${color2}, 0 0 13px 4px rgba(255, 255, 255, 0.3),
            0 55px 35px -20px rgba(0, 0, 0, 0.5);
        }
        @media (min-width: ${desktopMinWidth}) {
          width: clamp(12.9vw, 61vh, 18vw);
          height: clamp(18vw, 85vh, 25.2vw);
        }
      `}
    ></div>
  );
}
