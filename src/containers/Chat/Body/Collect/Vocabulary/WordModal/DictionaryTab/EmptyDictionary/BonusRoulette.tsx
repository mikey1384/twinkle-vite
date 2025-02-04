import React, { useState, useEffect, useMemo } from 'react';
import { css, keyframes } from '@emotion/css';

// Wheel dimensions
const wheelSize = 280;
const wheelRadius = wheelSize / 2;

const wheelContainer = css`
  position: relative;
  width: ${wheelSize}px;
  height: ${wheelSize}px;
  margin: 2rem auto; /* This helps center horizontally */
  border-radius: 50%;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  background: #fff;
  padding: 3px;
  text-align: center; /* Additional centering measure */
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

const spinAnimation = (finalAngle: number) => keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(${finalAngle}deg);
  }
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

export default function BonusRoulette() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  // Define your segments (now with a line-break in the "AI Card" label)
  const segments = useMemo(
    () => [
      {
        label: 'Better luck next time',
        size: 0.4,
        gradient: ['#4A90E2', '#357ABD'] // blue-ish
      },
      {
        label: '1,000 XP',
        size: 0.2,
        gradient: ['#FF1493', '#FF69B4'] // pink-ish
      },
      {
        label: '1,000 Coins',
        size: 0.2,
        gradient: ['#FFD700', '#FFA500'] // gold-ish
      },
      {
        label: 'AI Card',
        size: 0.2,
        gradient: ['#50C878', '#3CB371'] // green-ish
      }
    ],
    []
  );

  /**
   * Build a conic gradient from the segments with their size percentages
   */
  const wheelGradient = (() => {
    let currentAngle = 0;
    return segments
      .map((segment) => {
        const startAngle = currentAngle;
        const endAngle = currentAngle + segment.size * 360;
        currentAngle = endAngle;
        return `${segment.gradient[0]} ${startAngle}deg, ${segment.gradient[1]} ${endAngle}deg`;
      })
      .join(', ');
  })();

  /**
   * Wheel styling + rotation
   */
  const wheelStyles = css`
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(${wheelGradient});
    animation: ${isSpinning ? spinAnimation(angle) : 'none'} 4s
      cubic-bezier(0.21, 0.53, 0.29, 0.99) forwards;
    position: relative;
    transform: rotate(-90deg); /* pointer is at the top */

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

  useEffect(() => {
    // Spin automatically on mount
    const randomSpin = 360 * 5 + Math.floor(Math.random() * 360);
    setAngle(randomSpin);
    setIsSpinning(true);

    // Stop spinning & calculate result after 4s
    const timer = setTimeout(() => {
      setIsSpinning(false);
      const finalAngle = randomSpin % 360;

      let currentAngle = 0;
      for (let i = 0; i < segments.length; i++) {
        currentAngle += segments[i].size * 360;
        // Because the wheel is rotated -90deg, effectively the "0deg" is at top.
        // So we use (360 - finalAngle) to see which slice is under the pointer.
        if (360 - finalAngle <= currentAngle) {
          setResult(segments[i].label.replace(/\n/g, ' ')); // remove newline in final text
          break;
        }
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [segments]);

  return (
    <div>
      <div className={wheelContainer}>
        <div className={pointerStyles} />
        <div className={wheelStyles}>
          <div className={labelContainerStyles}>
            {segments.map((segment, index) => {
              const startAngle = segments
                .slice(0, index)
                .reduce((acc, seg) => acc + seg.size * 360, 0);
              const segmentAngle = segment.size * 360;
              const labelAngle = startAngle + segmentAngle / 2;

              return (
                <div
                  key={index}
                  className={segmentLabelStyles}
                  style={{
                    transform: `translate(${
                      Math.cos(((labelAngle - 90) * Math.PI) / 180) *
                      (segment.size === 0.4
                        ? wheelRadius * 0.6
                        : wheelRadius * 0.7)
                    }px, 
                    ${
                      Math.sin(((labelAngle - 90) * Math.PI) / 180) *
                      (segment.size === 0.4
                        ? wheelRadius * 0.6
                        : wheelRadius * 0.7)
                    }px) 
                    translate(-50%, -50%) 
                    rotate(${labelAngle}deg)`
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
