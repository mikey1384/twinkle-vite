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
        @media (min-width: ${desktopMinWidth}) {
          width: clamp(12.9vw, 61vh, 18vw);
          height: clamp(18vw, 85vh, 25.2vw);
        }
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
        background-color: #fff;
        background-image: url(${frontPicUrl});
        background-size: contain;
        background-repeat: no-repeat;
        background-position: 50% 50%;
        transform-origin: center;
      `}
    ></div>
  );
}
