import React, { useState, useMemo, useRef } from 'react';
import { css } from '@emotion/css';

const mobileMaxWidth = '600px';
const wheelSize = 280;
const wheelRadius = wheelSize / 2;
const SPIN_DURATION = 6000;
const INITIAL_FAST_SPINS = 15;
const predeterminedResult = 'coins_500';

const wheelContainer = css`
  position: relative;
  width: ${wheelSize}px;
  height: ${wheelSize}px;
  margin: 2rem auto;
  border-radius: 50%;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  background: #fff;
  padding: 3px;
  text-align: center;

  @media (max-width: ${mobileMaxWidth}) {
    transform: scale(0.7);
    transform-origin: top center;
  }
`;

const pointerStyles = css`
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%) rotate(180deg);
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.15));
  z-index: 10;
`;

const wheelCenterStyles = css`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  margin: -20px 0 0 -20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
  z-index: 5;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
  }
`;

const labelContainerStyles = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  opacity: 1;
  transition: opacity 0.3s ease;
`;

const segmentLabelStyles = css`
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center;
  font-size: 1.8rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  text-align: center;
  pointer-events: none;
  white-space: pre-wrap;
`;

const resultTextStyles = css`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 1.6rem;
  font-weight: 600;
  color: #2d3748;
  min-height: 2.4em;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const resultMessageStyles = css`
  opacity: 0;
  transform: translateY(10px);
  animation: fadeIn 0.5s ease forwards;
  animation-delay: 0.5s;

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const spinButtonStyles = css`
  margin-top: 1rem;
  padding: 1.5rem 3rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  background: linear-gradient(45deg, #ffd700, #ff69b4, #9370db, #4169e1);
  background-size: 300% 300%;
  animation: gradient 5s ease infinite;
  transition: all 0.3s ease;

  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 7px 14px rgba(0, 0, 0, 0.2);
  }
`;

export default function BonusRoulette() {
  const [currentAngle, setCurrentAngle] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [labelOpacity, setLabelOpacity] = useState(1);
  const [wheelBlur, setWheelBlur] = useState(0);
  const [whiteOverlay, setWhiteOverlay] = useState(0);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const targetAngleRef = useRef<number>(0);

  const segments = useMemo(
    () => [
      {
        key: 'better_luck',
        label: 'Better luck next time',
        size: 180,
        gradient: ['#4f4f4f', '#2f2f2f'],
        resultMessage: 'Ouch... Better luck on your next spin'
      },
      {
        key: 'coins_500',
        label: '500',
        size: 70,
        gradient: ['#4A90E2', '#357ABD'],
        resultMessage: 'At least your coins are back in your pocket'
      },
      {
        key: 'coins_1000',
        label: '1,000',
        size: 70,
        gradient: ['#FF1493', '#FF69B4'],
        resultMessage: "Nice! You've won 500 extra coins! 🎉"
      },
      {
        key: 'ai_card',
        label: 'Card',
        size: 40,
        gradient: ['#FFD700', '#FFA500'],
        resultMessage: "Incredible! You've won a special Black AI Card! ⭐"
      }
    ],
    []
  );

  const wheelGradient = useMemo(() => {
    let angleStart = 0;
    return segments
      .map((segment) => {
        const startAngle = angleStart;
        const endAngle = angleStart + segment.size;
        angleStart = endAngle;
        return `${segment.gradient[0]} ${startAngle}deg, ${segment.gradient[1]} ${endAngle}deg`;
      })
      .join(', ');
  }, [segments]);

  const wheelStyles = css`
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(${wheelGradient});
    position: relative;
    transform: rotate(${currentAngle}deg);
    transition: transform 0.1s linear, filter 0.3s ease;
    filter: blur(${wheelBlur}px);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, ${whiteOverlay});
      transition: background 0.3s ease;
      z-index: 3;
    }
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 50%;
      background: radial-gradient(
        circle at center,
        rgba(255, 255, 255, 0.3) 0%,
        rgba(255, 255, 255, 0) 70%
      );
    }
  `;

  return (
    <div>
      <div className={wheelContainer}>
        <div className={pointerStyles} />
        <div className={wheelStyles}>
          <div
            className={labelContainerStyles}
            style={{ opacity: labelOpacity }}
          >
            {segments.map((segment, index) => {
              let startAngle = 0;
              for (let i = 0; i < index; i++) {
                startAngle += segments[i].size;
              }
              const labelAngle = startAngle + segment.size / 2;
              const radius = wheelRadius * 0.7;

              return (
                <div
                  key={segment.key}
                  className={segmentLabelStyles}
                  style={{
                    transform: `
                      translate(
                        ${
                          Math.cos(((labelAngle - 90) * Math.PI) / 180) * radius
                        }px,
                        ${
                          Math.sin(((labelAngle - 90) * Math.PI) / 180) * radius
                        }px
                      )
                      translate(-50%, -50%)
                      rotate(${labelAngle}deg)
                    `
                  }}
                >
                  {segment.label}
                </div>
              );
            })}
          </div>
        </div>
        <div className={wheelCenterStyles} />
      </div>

      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
        `}
      >
        <button className={spinButtonStyles} onClick={handleSpin}>
          Spin the Wheel
        </button>
        <div className={resultTextStyles}>
          {result && (
            <div className={resultMessageStyles}>
              {segments.find((s) => s.key === result)?.resultMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function getTargetAngle() {
    const index = segments.findIndex((s) => s.key === predeterminedResult);
    if (index === -1) return 0;
    let startAngle = 0;
    for (let i = 0; i < index; i++) {
      startAngle += segments[i].size;
    }
    const randomFactor = 0.1 + Math.random() * 0.8;
    return -(startAngle + segments[index].size * randomFactor);
  }

  function animate(timestamp: number) {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
      targetAngleRef.current = getTargetAngle();
    }
    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / SPIN_DURATION, 1);

    function customEaseOut(t: number) {
      const fastPhase = Math.pow(1 - t, 2);
      const slowPhase = Math.pow(1 - t, 3);
      return 1 - (fastPhase * 0.7 + slowPhase * 0.3);
    }

    const easedProgress = customEaseOut(progress);

    const newOpacity = progress < 0.7 ? 0 : (progress - 0.7) / 0.3;
    setLabelOpacity(newOpacity);

    const blurAmount = progress < 0.6 ? 3 : (0.8 - progress) * 7.5;
    setWheelBlur(Math.max(0, blurAmount));

    const overlayOpacity =
      progress < 0.37 ? 0.8 : progress < 0.5 ? (0.5 - progress) * 6 : 0;
    setWhiteOverlay(overlayOpacity);

    const totalSpins = INITIAL_FAST_SPINS + 2;
    const newAngle =
      (360 * totalSpins + targetAngleRef.current) * easedProgress;
    setCurrentAngle(newAngle);

    if (progress >= 1) {
      setResult(predeterminedResult);
      return;
    }
    animationRef.current = requestAnimationFrame(animate);
  }

  function handleSpin() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setResult(null);
    setCurrentAngle(0);
    setLabelOpacity(0);
    setWheelBlur(3);
    setWhiteOverlay(0.8);
    startTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);
  }
}
