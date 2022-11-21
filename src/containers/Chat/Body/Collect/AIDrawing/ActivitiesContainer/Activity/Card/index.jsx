import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { useSpring, animated } from 'react-spring';
import { useGesture } from '@use-gesture/react';
import $ from 'jquery';

Card.propTypes = {
  animateOnMouseLeave: PropTypes.bool,
  cardProps: PropTypes.object.isRequired,
  frontPicUrl: PropTypes.string.isRequired,
  quality: PropTypes.string
};

const $style = $('#animation');

export default function Card({
  animateOnMouseLeave,
  cardProps,
  frontPicUrl,
  quality
}) {
  const timerRef = useRef(null);
  const CardRef = useRef(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [{ x, y, rotateX, rotateY, rotateZ }, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    zoom: 0,
    x: 0,
    y: 0,
    config: { mass: 5, tension: 350, friction: 40 }
  }));
  const bind = useGesture({
    onMove: ({ xy: [px, py] }) => {
      return api.start({
        rotateX: calcX(py, y.get()),
        rotateY: calcY(px, x.get()),
        scale: 1.1
      });
    },
    onHover: ({ hovering }) =>
      !hovering && api.start({ rotateX: 0, rotateY: 0, scale: 1 })
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
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
          }% ${50 + (percentageY - 50) / 3}% !important;`;
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
          if (cardProps[quality].includes('glossy')) {
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
          rotateZ
        }}
        className={`card${isAnimated ? ' animated' : ''}`}
      >
        <div
          className={css`
            touch-action: none;
            width: 100%;
            height: 100%;
            background-repeat: no-repeat;
            background-position: 50% 50%;
            transform-origin: center;
            background-size: contain;
            background-image: url(${frontPicUrl});
          `}
        />
      </animated.div>
    </div>
  );

  function calcX(y, ly) {
    return -(y - ly - window.innerHeight / 2) / 20;
  }
  function calcY(x, lx) {
    return (x - lx - window.innerWidth / 2) / 20;
  }
}
