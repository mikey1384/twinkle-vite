import PropTypes from 'prop-types';
import { desktopMinWidth } from '~/constants/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import Card from './Card';

const color1 = '#ec9bb6';
const color2 = '#ccac6f';
const color3 = '#69e4a5';
const color4 = '#8ec5d6';
const color5 = '#b98cce';
const holoUrl = 'https://assets.codepen.io/13471/holo.png';
const sparklesUrl = 'https://assets.codepen.io/13471/sparkles.gif';

Activity.propTypes = {
  activity: PropTypes.object.isRequired
};

export default function Activity({ activity }) {
  return (
    <div
      style={{
        width: '100%',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
      <div
        className={css`
          > .card {
            width: 71.5vw;
            position: relative;
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
            background-color: ${color2};
            transform-origin: center;

            &:hover {
              box-shadow: -20px -20px 30px -25px ${color1},
                20px 20px 30px -25px ${color2}, -7px -7px 10px -5px ${color1},
                7px 7px 10px -5px ${color2},
                0 0 13px 4px rgba(255, 255, 255, 0.3),
                0 55px 35px -20px rgba(0, 0, 0, 0.5);
              background-image: linear-gradient(
                115deg,
                transparent 20%,
                ${color1} 36%,
                ${color2} 43%,
                ${color3} 50%,
                ${color4} 57%,
                ${color5} 64%,
                transparent 80%
              );
              animation: none;
              transition: box-shadow 0.1s ease-out;
            }

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
              background-image: url(${sparklesUrl}), url(${holoUrl}),
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
              z-index: 3;
              filter: brightness(1) contrast(1);
              transition: all 0.33s ease;
              opacity: 0.75;
            }

            &:hover:after {
              filter: brightness(1) contrast(1);
              opacity: 1;
            }

            &:hover {
              animation: none;
              transition: box-shadow 0.1s ease-out;
            }

            &:hover:before {
              animation: none;
              background-image: linear-gradient(
                110deg,
                transparent 25%,
                ${color1} 48%,
                ${color2} 52%,
                transparent 75%
              );
              background-position: 50% 50%;
              background-size: 250% 250%;
              opacity: 0.88;
              filter: brightness(0.66) contrast(1.33);
              transition: none;
            }

            &:hover:before,
            &:hover:after {
              animation: none;
              transition: none;
            }

            &.animated {
              transition: none;
              animation: holoCard 12s ease 0s 1;
              &:before {
                transition: none;
                animation: holoGradient 12s ease 0s 1;
              }
              &:after {
                transition: none;
                animation: holoSparkle 12s ease 0s 1;
              }
            }

            @media (min-width: ${desktopMinWidth}) {
              width: clamp(12.9vw, 61vh, 18vw);
              height: clamp(18vw, 85vh, 25.2vw);
            }
          }

          @keyframes holoSparkle {
            0%,
            100% {
              opacity: 0.75;
              background-position: 50% 50%;
              filter: brightness(1.2) contrast(1.25);
            }
            5%,
            8% {
              opacity: 1;
              background-position: 40% 40%;
              filter: brightness(0.8) contrast(1.2);
            }
            13%,
            16% {
              opacity: 0.5;
              background-position: 50% 50%;
              filter: brightness(1.2) contrast(0.8);
            }
            35%,
            38% {
              opacity: 1;
              background-position: 60% 60%;
              filter: brightness(1) contrast(1);
            }
            55% {
              opacity: 0.33;
              background-position: 45% 45%;
              filter: brightness(1.2) contrast(1.25);
            }
          }

          @keyframes holoGradient {
            0%,
            100% {
              opacity: 0.5;
              background-position: 50% 50%;
              filter: brightness(0.5) contrast(1);
            }
            5%,
            9% {
              background-position: 100% 100%;
              opacity: 1;
              filter: brightness(0.75) contrast(1.25);
            }
            13%,
            17% {
              background-position: 0% 0%;
              opacity: 0.88;
            }
            35%,
            39% {
              background-position: 100% 100%;
              opacity: 1;
              filter: brightness(0.5) contrast(1);
            }
            55% {
              background-position: 0% 0%;
              opacity: 1;
              filter: brightness(0.75) contrast(1.25);
            }
          }

          @keyframes holoCard {
            0%,
            100% {
              transform: rotateZ(0deg) rotateX(0deg) rotateY(0deg);
            }
            5%,
            8% {
              transform: rotateZ(0deg) rotateX(6deg) rotateY(-20deg);
            }
            13%,
            16% {
              transform: rotateZ(0deg) rotateX(-9deg) rotateY(32deg);
            }
            35%,
            38% {
              transform: rotateZ(3deg) rotateX(12deg) rotateY(20deg);
            }
            55% {
              transform: rotateZ(-3deg) rotateX(-12deg) rotateY(-27deg);
            }
          }
        `}
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <Card frontPicUrl={`${cloudFrontURL}${activity.images[0]}`} />
      </div>
      <div style={{ padding: '1rem' }}>
        <div>{activity.prompt}</div>
      </div>
    </div>
  );
}
