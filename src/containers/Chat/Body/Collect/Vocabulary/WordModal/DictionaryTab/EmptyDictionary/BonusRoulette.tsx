import React, { useState, useEffect, useMemo, useRef } from 'react';
import { css } from '@emotion/css';

const wheelSize = 280;
const wheelRadius = wheelSize / 2;
const SPIN_DURATION = 6000;

const predeterminedResult = 'better_luck';

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
  opacity: 0;
  transform: translateY(10px);
  animation: fadeIn 0.5s ease forwards;
  animation-delay: 4s;

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

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
`;

export default function BonusRoulette() {
  const [currentAngle, setCurrentAngle] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const targetAngleRef = useRef<number>(0);

  // Define your segments - order matters! They go clockwise from 12 o'clock
  const segments = useMemo(
    () => [
      {
        key: 'better_luck',
        label: 'Better luck next time',
        size: 180, // 50% = 180 degrees
        gradient: ['#4f4f4f', '#2f2f2f']
      },
      {
        key: 'coins_500',
        label: '500',
        size: 70, // 25% = 90 degrees
        gradient: ['#4A90E2', '#357ABD']
      },
      {
        key: 'coins_1000',
        label: '1,000',
        size: 70,
        gradient: ['#50C878', '#3CB371']
      },
      {
        key: 'ai_card',
        label: 'Card',
        size: 40,
        gradient: ['#FFD700', '#FFA500']
      }
    ],
    []
  );

  // Build conic gradient using actual segment sizes
  const wheelGradient = useMemo(() => {
    let currentAngle = 0;
    return segments
      .map((segment) => {
        const startAngle = currentAngle;
        const endAngle = currentAngle + segment.size;
        currentAngle = endAngle;
        return `${segment.gradient[0]} ${startAngle}deg, ${segment.gradient[1]} ${endAngle}deg`;
      })
      .join(', ');
  }, [segments]);

  // Get the target angle - calculate a random position within the segment
  const getTargetAngle = () => {
    const index = segments.findIndex((s) => s.key === predeterminedResult);
    if (index === -1) return 0;

    // Calculate the starting angle of our target segment
    let startAngle = 0;
    for (let i = 0; i < index; i++) {
      startAngle += segments[i].size;
    }

    // Get a random position within the segment (between 0.1 and 0.9 of the segment size)
    const randomFactor = 0.1 + Math.random() * 0.8;
    return -(startAngle + segments[index].size * randomFactor);
  };

  // Animation frame callback
  const animate = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
      targetAngleRef.current = getTargetAngle();
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / SPIN_DURATION, 1);

    // Easing function for smooth deceleration
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const easedProgress = easeOut(progress);

    // Calculate current rotation
    // We do 5 full spins plus the target angle
    const newAngle = (360 * 5 + targetAngleRef.current) * easedProgress;
    setCurrentAngle(newAngle);

    if (progress >= 1) {
      setResult(predeterminedResult);
      return;
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // Start spinning on mount
  useEffect(() => {
    startTimeRef.current = 0; // Reset start time for new spins
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wheelStyles = css`
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(${wheelGradient});
    position: relative;
    transform: rotate(${currentAngle}deg);
    transition: transform 0.1s linear;

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
          <div className={labelContainerStyles}>
            {segments.map((segment, index) => {
              // Calculate the middle angle for this segment
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
      {result && <div className={resultTextStyles}>{result}!</div>}
    </div>
  );
}
