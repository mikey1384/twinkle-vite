import React, { useMemo, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import { Color } from '~/constants/css';

// Twinkle's word workshop: little original pixel robots registering a newly
// discovered word. One carries the word's letters to the desk, one stamps a
// NEW card, one files it into Twinkle's word vault. Drawn in flat SVG
// rectangles (no gradients), every loop seamless so any wait looks natural.

const INK = '#2f3a4f';
const EYE = '#8ff3ff';
const BLUE = Color.logoBlue();
const BLUE_DARK = 'rgb(40, 104, 186)';
const ORANGE = Color.orange();
const ORANGE_DARK = 'rgb(214, 112, 0)';
const PINK = 'rgb(255, 105, 180)';
const PINK_DARK = 'rgb(214, 70, 142)';
const GOLD = 'rgb(255, 207, 52)';
const GOLD_DARK = 'rgb(222, 166, 20)';

export const robotColors = {
  blue: [BLUE, BLUE_DARK],
  orange: [ORANGE, ORANGE_DARK],
  pink: [PINK, PINK_DARK],
  gold: [GOLD, GOLD_DARK]
} as const;

const blink = keyframes`
  0%, 92%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
`;
const bulb = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;
const walkBob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
`;
const carryWalk = keyframes`
  0% { transform: translateX(0); }
  42% { transform: translateX(104px); }
  58% { transform: translateX(104px); }
  100% { transform: translateX(0); }
`;
const carriedTile = keyframes`
  0%, 46% { opacity: 1; transform: translateY(0); }
  52% { opacity: 1; transform: translateY(14px); }
  54%, 96% { opacity: 0; transform: translateY(14px); }
  100% { opacity: 1; transform: translateY(0); }
`;
const stampPress = keyframes`
  0% { transform: translateY(-15px); }
  48% { transform: translateY(-19px); }
  60% { transform: translateY(0); }
  72% { transform: translateY(0); }
  100% { transform: translateY(-15px); }
`;
const stampMark = keyframes`
  0%, 59% { opacity: 0; transform: scale(1.4); }
  62% { opacity: 1; transform: scale(1); }
  94% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1); }
`;
const impact = keyframes`
  0%, 59% { opacity: 0; transform: scale(0.6); }
  62% { opacity: 1; transform: scale(1); }
  76%, 100% { opacity: 0; transform: scale(1.3); }
`;
const fileCard = keyframes`
  0%, 20% { opacity: 1; transform: translateX(0); }
  55% { opacity: 1; transform: translateX(26px); }
  62%, 100% { opacity: 0; transform: translateX(30px); }
`;
const fileArm = keyframes`
  0%, 20% { transform: translateX(0); }
  55% { transform: translateX(10px); }
  75%, 100% { transform: translateX(0); }
`;
const drawer = keyframes`
  0%, 15% { transform: translateX(0); }
  30%, 62% { transform: translateX(-12px); }
  78%, 100% { transform: translateX(0); }
`;
const twinkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(45deg); }
`;
const cheer = keyframes`
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-12px); }
  60% { transform: translateY(-12px); }
`;
const cheerArm = keyframes`
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-150deg); }
`;

const box = css`
  transform-box: fill-box;
  transform-origin: center;
`;
const reducedMotion = css`
  @media (prefers-reduced-motion: reduce) {
    *,
    & {
      animation: none !important;
    }
  }
`;

const SPARKLE_PATH = 'M8 0 L10 6 L16 8 L10 10 L8 16 L6 10 L0 8 L6 6 Z';

export function Sparkle({
  size = 16,
  color = GOLD
}: {
  size?: number | string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path d={SPARKLE_PATH} fill={color} />
    </svg>
  );
}

/**
 * One robot, 26 x 46 units, feet on y = 46. Arms are separate so scenes can
 * animate them; `leftArm` / `rightArm` replace the default resting arms.
 */
export function Robot({
  color,
  x = 0,
  y = 0,
  className,
  leftArm,
  rightArm,
  children
}: {
  color: keyof typeof robotColors;
  x?: number;
  y?: number;
  className?: string;
  leftArm?: React.ReactNode;
  rightArm?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [head, bodyColor] = robotColors[color];
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className}>
        <rect x={12} y={1} width={2} height={6} fill={INK} />
        <rect
          x={10}
          y={-2}
          width={6}
          height={4}
          rx={1}
          fill={GOLD}
          className={css`
            animation: ${bulb} 1.4s ease-in-out infinite;
          `}
        />
        <rect x={2} y={6} width={22} height={16} rx={3} fill={head} />
        <rect x={5} y={9} width={16} height={10} rx={2} fill={INK} />
        <g
          className={`${box} ${css`
            animation: ${blink} 3.6s linear infinite;
          `}`}
        >
          <rect x={8} y={12} width={3} height={4} fill={EYE} />
          <rect x={15} y={12} width={3} height={4} fill={EYE} />
        </g>
        <rect x={10} y={22} width={6} height={2} fill={INK} />
        <rect x={3} y={24} width={20} height={14} rx={2} fill={bodyColor} />
        <rect x={11} y={28} width={4} height={4} fill={Color.white(0.85)} />
        <rect x={6} y={38} width={5} height={6} fill={INK} />
        <rect x={15} y={38} width={5} height={6} fill={INK} />
        <rect x={4} y={44} width={8} height={2} rx={1} fill={INK} />
        <rect x={14} y={44} width={8} height={2} rx={1} fill={INK} />
        {leftArm ?? (
          <rect x={-2} y={25} width={5} height={10} rx={2} fill={head} />
        )}
        {rightArm ?? (
          <rect x={23} y={25} width={5} height={10} rx={2} fill={head} />
        )}
        {children}
      </g>
    </g>
  );
}

function TwinkleSparkle({
  x,
  y,
  size,
  delay
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
}) {
  return (
    <path
      d={SPARKLE_PATH}
      fill={GOLD}
      transform={`translate(${x} ${y}) scale(${size / 16})`}
      className={`${box} ${css`
        opacity: 0;
        animation: ${twinkle} 2.2s ease-in-out ${delay}s infinite;
      `}`}
    />
  );
}

export default function RobotWorkshop({
  word,
  level
}: {
  word: string;
  level: number;
}) {
  const letters = useMemo(
    () => Array.from(word).filter((letter) => letter.trim()),
    [word]
  );
  const [letterIndex, setLetterIndex] = useState(0);
  const carried = letters[letterIndex % Math.max(letters.length, 1)] || '';
  const levelColor = useMemo(
    () => [BLUE, BLUE, PINK, ORANGE, 'rgb(255, 50, 50)', GOLD][level] || ORANGE,
    [level]
  );

  return (
    <svg
      viewBox="4 12 352 112"
      role="img"
      aria-label="Twinkle's robots are registering your word"
      shapeRendering="crispEdges"
      className={`${reducedMotion} ${css`
        display: block;
        width: 100%;
        height: auto;
        max-height: 17rem;
        overflow: visible;
        text {
          font-family: 'Press Start 2P', monospace;
        }
      `}`}
    >
      {/* floor */}
      <rect x={0} y={116} width={360} height={3} fill={Color.borderGray()} />
      {[20, 70, 120, 170, 220, 270, 320].map((tick) => (
        <rect
          key={tick}
          x={tick}
          y={120}
          width={14}
          height={2}
          fill={Color.borderGray(0.6)}
        />
      ))}

      {/* 1. the carrier brings the word's letters, one per trip */}
      <g
        className={css`
          animation: ${carryWalk} 3.4s ease-in-out infinite;
        `}
        onAnimationIteration={(event) => {
          // Only the walk's own loop; the bob and blink inside bubble here too.
          if (event.target === event.currentTarget) {
            setLetterIndex((index) => index + 1);
          }
        }}
      >
        <Robot
          color="blue"
          x={14}
          y={70}
          className={css`
            animation: ${walkBob} 0.42s ease-in-out infinite;
          `}
          leftArm={
            <rect x={-1} y={8} width={5} height={18} rx={2} fill={BLUE} />
          }
          rightArm={
            <rect x={22} y={8} width={5} height={18} rx={2} fill={BLUE} />
          }
        >
          <g
            className={css`
              animation: ${carriedTile} 3.4s ease-in-out infinite;
            `}
          >
            <rect
              x={1}
              y={-14}
              width={24}
              height={22}
              rx={3}
              fill={Color.white()}
              stroke={levelColor}
              strokeWidth={2.5}
            />
            <text
              x={13}
              y={2}
              textAnchor="middle"
              fontSize={12}
              fill={INK}
              fontWeight={700}
            >
              {carried}
            </text>
          </g>
        </Robot>
      </g>

      {/* 2. the stamping desk */}
      <rect x={134} y={96} width={74} height={6} fill="rgb(176, 120, 70)" />
      <rect x={140} y={102} width={5} height={14} fill="rgb(150, 98, 54)" />
      <rect x={197} y={102} width={5} height={14} fill="rgb(150, 98, 54)" />
      <rect
        x={150}
        y={80}
        width={42}
        height={16}
        rx={2}
        fill={Color.white()}
        stroke={Color.borderGray()}
        strokeWidth={1.5}
      />
      <rect x={154} y={85} width={14} height={2} fill={Color.borderGray()} />
      <rect x={154} y={89} width={22} height={2} fill={Color.borderGray()} />
      <g
        className={`${box} ${css`
          animation: ${stampMark} 1.3s ease-out infinite;
        `}`}
      >
        <rect
          x={172}
          y={82}
          width={18}
          height={12}
          rx={2}
          fill="none"
          stroke={Color.rose()}
          strokeWidth={1.5}
        />
        <text
          x={181}
          y={91}
          textAnchor="middle"
          fontSize={5.5}
          fill={Color.rose()}
        >
          NEW
        </text>
      </g>
      <g
        className={`${box} ${css`
          animation: ${impact} 1.3s ease-out infinite;
        `}`}
      >
        <rect x={166} y={70} width={2} height={5} fill={GOLD_DARK} />
        <rect x={194} y={70} width={2} height={5} fill={GOLD_DARK} />
        <rect x={160} y={77} width={5} height={2} fill={GOLD_DARK} />
        <rect x={196} y={77} width={5} height={2} fill={GOLD_DARK} />
      </g>
      {/* The stamper holds the stamp up in its raised arm. The arm is drawn
          behind the robot so its lower end stays hidden behind the head and
          body at every point of the press. */}
      <g
        className={css`
          animation: ${stampPress} 1.3s cubic-bezier(0.6, 0, 0.9, 0.5) infinite;
        `}
      >
        <rect x={214} y={62} width={6} height={44} rx={2} fill={ORANGE} />
        <rect x={186} y={62} width={34} height={5} rx={2} fill={ORANGE} />
        <rect x={178} y={58} width={8} height={12} rx={2} fill={INK} />
        <rect
          x={172}
          y={70}
          width={20}
          height={10}
          rx={1}
          fill={Color.rose()}
        />
      </g>
      <Robot color="orange" x={214} y={70} rightArm={<g />} leftArm={<g />} />

      {/* 3. filing it into Twinkle's word vault */}
      <rect
        x={292}
        y={50}
        width={62}
        height={66}
        rx={3}
        fill="rgb(91, 107, 140)"
      />
      <rect
        x={292}
        y={44}
        width={62}
        height={8}
        rx={2}
        fill="rgb(71, 85, 115)"
      />
      {[
        [296, BLUE, 16],
        [302, ORANGE, 20],
        [308, PINK, 14],
        [314, GOLD, 18],
        [320, BLUE_DARK, 15],
        [326, 'rgb(34, 197, 94)', 19],
        [332, PINK_DARK, 17]
      ].map(([bookX, bookColor, height]) => (
        <rect
          key={bookX as number}
          x={bookX as number}
          y={44 - (height as number)}
          width={5}
          height={height as number}
          fill={bookColor as string}
        />
      ))}
      <rect x={306} y={55} width={34} height={9} rx={1} fill={Color.white()} />
      <text x={323} y={62} textAnchor="middle" fontSize={5} fill={INK}>
        WORDS
      </text>
      <rect x={296} y={70} width={54} height={2} fill="rgb(71, 85, 115)" />
      <rect x={296} y={96} width={54} height={2} fill="rgb(71, 85, 115)" />
      <rect x={318} y={102} width={10} height={3} fill={Color.white(0.7)} />
      <g
        className={css`
          animation: ${drawer} 2.6s ease-in-out infinite;
        `}
      >
        <rect
          x={296}
          y={75}
          width={54}
          height={18}
          rx={1}
          fill="rgb(120, 138, 175)"
        />
        <rect
          x={316}
          y={82}
          width={14}
          height={3}
          rx={1}
          fill={Color.white(0.85)}
        />
      </g>
      <Robot
        color="pink"
        x={252}
        y={70}
        rightArm={
          <g
            className={css`
              animation: ${fileArm} 2.6s ease-in-out infinite;
            `}
          >
            <rect x={20} y={14} width={14} height={5} rx={2} fill={PINK} />
          </g>
        }
      >
        <g
          className={css`
            animation: ${fileCard} 2.6s ease-in-out infinite;
          `}
        >
          <rect
            x={30}
            y={8}
            width={18}
            height={12}
            rx={1}
            fill={Color.white()}
            stroke={Color.rose()}
            strokeWidth={1.2}
          />
          <rect x={33} y={12} width={10} height={1.5} fill={Color.rose()} />
          <rect
            x={33}
            y={15}
            width={7}
            height={1.5}
            fill={Color.borderGray()}
          />
        </g>
      </Robot>

      <TwinkleSparkle x={64} y={18} size={11} delay={0} />
      <TwinkleSparkle x={150} y={26} size={8} delay={0.7} />
      <TwinkleSparkle x={238} y={12} size={10} delay={1.3} />
      <TwinkleSparkle x={350} y={10} size={8} delay={0.4} />
    </svg>
  );
}

/** The robots celebrating together once the word is registered. */
export function CheeringRobots() {
  const crew: Array<keyof typeof robotColors> = [
    'blue',
    'orange',
    'pink',
    'gold'
  ];
  return (
    <svg
      viewBox="0 0 160 56"
      aria-hidden="true"
      shapeRendering="crispEdges"
      className={`${reducedMotion} ${css`
        display: block;
        width: 15rem;
        height: auto;
        overflow: visible;
      `}`}
    >
      {crew.map((color, index) => (
        <Robot
          key={color}
          color={color}
          x={8 + index * 38}
          y={8}
          className={css`
            animation: ${cheer} 0.9s ease-in-out ${index * 0.12}s infinite;
          `}
          leftArm={
            <rect
              x={-2}
              y={25}
              width={5}
              height={10}
              rx={2}
              fill={robotColors[color][0]}
              className={`${css`
                transform-box: fill-box;
                transform-origin: top center;
                animation: ${cheerArm} 0.9s ease-in-out ${index * 0.12}s
                  infinite;
              `}`}
            />
          }
        />
      ))}
    </svg>
  );
}
