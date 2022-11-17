import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { useSpring, animated } from 'react-spring';
import { useGesture } from '@use-gesture/react';

Card.propTypes = {
  frontPicUrl: PropTypes.string.isRequired
};

export default function Card({ frontPicUrl }) {
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
    <animated.div
      {...bind()}
      style={{
        transform: 'perspective(600px)',
        x,
        y,
        rotateX,
        rotateY,
        rotateZ
      }}
      className={`card`}
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
  );

  function calcX(y, ly) {
    return -(y - ly - window.innerHeight / 2) / 20;
  }
  function calcY(x, lx) {
    return (x - lx - window.innerWidth / 2) / 20;
  }
}
