import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import LiveCard from './LiveCard';
import { useGesture } from '@use-gesture/react';
import { cardProps } from '~/constants/defaultValues';
import { useSpring } from 'react-spring';
import $ from 'jquery';

AICard.propTypes = {
  animateOnMouseLeave: PropTypes.bool,
  card: PropTypes.object.isRequired,
  onClick: PropTypes.func
};

const $style = $('#animation');
const MAX_ROTATE_X = 15;
const MAX_ROTATE_Y = 15;

// Constants used to calculate the card's rotation.
const ROTATE_X_FACTOR = -0.05;
const ROTATE_Y_FACTOR = 0.1;

export default function AICard({ animateOnMouseLeave, card, onClick }) {
  const [isAnimated, setIsAnimated] = useState(false);
  const timerRef = useRef(null);
  const CardRef = useRef(null);
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

  const cardStyle = {
    transform: 'perspective(600px)',
    x,
    y,
    rotateX,
    rotateY,
    rotateZ,
    display: 'flex',
    alignItems: 'center'
  };

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
        <LiveCard
          card={card}
          bind={bind}
          innerRef={CardRef}
          isAnimated={isAnimated}
          cardStyle={cardStyle}
          animateOnMouseLeave={animateOnMouseLeave}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        />
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

  function handleMouseLeave() {
    $style.html('');
    if (animateOnMouseLeave) {
      timerRef.current = setTimeout(() => {
        setIsAnimated(true);
      }, 500);
    }
  }

  function handleMouseMove(event) {
    const { left, top, width, height } =
      CardRef.current.getBoundingClientRect();
    const px = event.clientX - left;
    const py = event.clientY - top;
    const percentageX = 50 - (px / width) * 100;
    const percentageY = 50 - (py / height) * 100;
    let grad_pos = `background-position: ${50 + (percentageX - 50) / 3}% ${
      50 + (percentageY - 50) / 2
    }% !important;`;
    const sprk_pos = `background-position: ${50 + (percentageX - 50) / 15}% ${
      50 + (percentageY - 50) / 15
    }% !important;`;
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
  }
}
