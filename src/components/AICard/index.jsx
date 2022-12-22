import { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { cardProps, cloudFrontURL } from '~/constants/defaultValues';
import { useSpring, animated } from 'react-spring';
import { useGesture } from '@use-gesture/react';
import useAICard from '~/helpers/hooks/useAICard';
import $ from 'jquery';

AICard.propTypes = {
  animateOnMouseLeave: PropTypes.bool,
  card: PropTypes.object.isRequired,
  onClick: PropTypes.func
};

const MAX_ROTATE_X = 15;
const MAX_ROTATE_Y = 15;

// Constants used to calculate the card's rotation.
const ROTATE_X_FACTOR = -0.05;
const ROTATE_Y_FACTOR = 0.1;

const $style = $('#animation');

export default function AICard({ animateOnMouseLeave, card, onClick }) {
  const imageExists = useMemo(() => !!card.imagePath, [card.imagePath]);
  const frontPicUrl = `${cloudFrontURL}${card.imagePath}`;
  const timerRef = useRef(null);
  const CardRef = useRef(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const { cardCss } = useAICard(card);
  const [{ x, y, rotateX, rotateY, rotateZ }, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    zoom: 0,
    x: 0,
    y: 0,
    config: { mass: 2, tension: 250, friction: 20 }
  }));
  const bind = useGesture({
    onMove: ({ xy: [px, py] }) => {
      const { left, top, width, height } =
        CardRef.current.getBoundingClientRect();

      // Calculate the position of the center of the card.
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      // Calculate the position of the mouse relative to the center of the card.
      const relativeX = px - centerX;
      const relativeY = py - centerY;

      return api.start({
        rotateX: calcX(relativeY),
        rotateY: calcY(relativeX),
        scale: 1.1
      });
    },
    onHover: ({ hovering }) =>
      !hovering && api.start({ rotateX: 0, rotateY: 0, scale: 1 })
  });

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default'
      }}
      className={`unselectable`}
      onClick={onClick}
    >
      {card.isBurned ? (
        <div>burned</div>
      ) : (
        <div className={cardCss}>
          <animated.div
            {...bind()}
            ref={CardRef}
            onMouseMove={(event) => {
              const { left, top, width, height } =
                CardRef.current.getBoundingClientRect();
              const px = event.clientX - left;
              const py = event.clientY - top;
              const percentageX = 50 - (px / width) * 100;
              const percentageY = 50 - (py / height) * 100;
              let grad_pos = `background-position: ${
                50 + (percentageX - 50) / 3
              }% ${50 + (percentageY - 50) / 2}% !important;`;
              const sprk_pos = `background-position: ${
                50 + (percentageX - 50) / 15
              }% ${50 + (percentageY - 50) / 15}% !important;`;
              const pa = 50 - px + (50 - py);
              const p_opc = 20 + Math.abs(pa) * 1.5;
              const opc = `opacity: ${p_opc / 100} !important;`;
              const style = `
          .card:hover:before { ${grad_pos} }
          .card:hover:after { ${sprk_pos} ${opc} }
        `;
              if (cardProps[card.quality].includes('glossy')) {
                $style.html(style);
              }
              clearTimeout(timerRef.current);
              setIsAnimated(false);
            }}
            onMouseLeave={() => {
              $style.html('');
              if (animateOnMouseLeave) {
                timerRef.current = setTimeout(() => {
                  setIsAnimated(true);
                }, 500);
              }
            }}
            style={{
              transform: 'perspective(600px)',
              x,
              y,
              rotateX,
              rotateY,
              rotateZ,
              display: 'flex',
              alignItems: 'center'
            }}
            className={`card${isAnimated ? ' animated' : ''} ${
              card.isBurning
                ? css`
                    animation: burning 2s linear;
                    animation-fill-mode: forwards;
                    @keyframes burning {
                      0% {
                        background-color: red;
                        box-shadow: 0 0 10px red;
                        filter: blur(0);
                      }

                      50% {
                        background-color: yellow;
                        box-shadow: 0 0 10px yellow;
                        filter: blur(5px);
                      }

                      100% {
                        background-color: red;
                        box-shadow: 0 0 10px red;
                        filter: blur(10px);
                        opacity: 0;
                      }
                    }
                  `
                : ''
            }`}
          >
            <div
              className={css`
                width: 100%;
              `}
            >
              {imageExists ? (
                <img
                  style={{
                    width: '100%'
                  }}
                  src={frontPicUrl}
                />
              ) : null}
            </div>
          </animated.div>
        </div>
      )}
    </div>
  );

  function calcX(py) {
    // Calculate the rotation value based on the mouse position.
    // This should be proportional to the mouse position.
    let rotateX = py * ROTATE_X_FACTOR;

    // Cap the maximum absolute value of the rotateX value.
    if (Math.abs(rotateX) > MAX_ROTATE_X) {
      rotateX = rotateX < 0 ? -MAX_ROTATE_X : MAX_ROTATE_X;
    }

    return rotateX;
  }

  function calcY(px) {
    // Calculate the rotation value based on the mouse position.
    // This should be proportional to the mouse position.
    let rotateY = px * ROTATE_Y_FACTOR;

    // Cap the maximum absolute value of the rotateY value.
    if (Math.abs(rotateY) > MAX_ROTATE_Y) {
      rotateY = rotateY < 0 ? -MAX_ROTATE_Y : MAX_ROTATE_Y;
    }

    return rotateY;
  }
}
