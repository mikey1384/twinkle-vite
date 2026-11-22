import React, { useEffect, useMemo, useRef } from 'react';
import { css, keyframes } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { blinkAnimation } from '~/components/StreamingThoughtContent/animations';
import { Robot, robotColors } from './RobotWorkshop';

const quill = keyframes`
  0%, 100% { transform: rotate(0deg) translateX(0); }
  25% { transform: rotate(-14deg) translateX(1px); }
  50% { transform: rotate(6deg) translateX(2px); }
  75% { transform: rotate(-8deg) translateX(1px); }
`;
const lineGrow = keyframes`
  0% { transform: scaleX(0.15); opacity: 0.4; }
  60% { opacity: 1; }
  100% { transform: scaleX(1); opacity: 0.4; }
`;

const SCROLL_EDGE = 'rgb(214, 186, 128)';
const ROLLER = 'rgb(176, 120, 70)';

/**
 * The definition as the AI writes it: the server streams the discovery's
 * definition lines ("adjective", "1. ...") and they appear here on the writer
 * robot's scroll. Before the first words, faint lines are being drawn.
 */
export default function StreamScroll({
  text,
  writing
}: {
  text: string;
  writing: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(
    () =>
      text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({
          line,
          isDefinition: /^\d+\.\s/.test(line)
        })),
    [text]
  );

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [text]);

  return (
    <div
      className={css`
        display: flex;
        align-items: flex-end;
        gap: 0.6rem;
        width: 100%;
      `}
    >
      <svg
        viewBox="-6 -6 46 56"
        aria-hidden="true"
        shapeRendering="crispEdges"
        className={css`
          flex-shrink: 0;
          width: 5.6rem;
          height: auto;
          @media (max-width: ${mobileMaxWidth}) {
            width: 4.4rem;
          }
        `}
      >
        <Robot
          color="gold"
          rightArm={
            <g
              className={css`
                transform-box: fill-box;
                transform-origin: left center;
                animation: ${writing ? `${quill} 0.6s ease-in-out infinite` : 'none'};
                @media (prefers-reduced-motion: reduce) {
                  animation: none;
                }
              `}
            >
              <rect
                x={22}
                y={26}
                width={10}
                height={5}
                rx={2}
                fill={robotColors.gold[0]}
              />
              <rect
                x={31}
                y={14}
                width={2}
                height={16}
                fill={Color.darkBlueGray()}
              />
              <rect
                x={32}
                y={10}
                width={5}
                height={8}
                rx={2}
                fill={Color.white()}
                stroke={Color.borderGray()}
                strokeWidth={0.8}
              />
            </g>
          }
        />
      </svg>
      <div
        className={css`
          position: relative;
          flex: 1;
          min-width: 0;
          padding: 0.5rem 0;
          &::before,
          &::after {
            content: '';
            position: absolute;
            left: -0.4rem;
            right: -0.4rem;
            height: 0.7rem;
            border-radius: 1rem;
            background: ${ROLLER};
          }
          &::before {
            top: 0;
          }
          &::after {
            bottom: 0;
          }
        `}
      >
        <div
          ref={scrollRef}
          aria-live="polite"
          className={css`
            background: ${Color.ivory()};
            border-left: 0.2rem solid ${SCROLL_EDGE};
            border-right: 0.2rem solid ${SCROLL_EDGE};
            padding: 1rem 1.4rem;
            min-height: 7.5rem;
            max-height: 11rem;
            overflow-y: auto;
            font-size: 1.45rem;
            line-height: 1.5;
            color: ${Color.darkerGray()};
            word-break: break-word;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.3rem;
              padding: 0.8rem 1rem;
              max-height: 9rem;
            }
          `}
        >
          {lines.length === 0 ? (
            <div aria-hidden="true">
              {[0.9, 0.7, 0.8].map((width, index) => (
                <div
                  key={index}
                  className={css`
                    height: 0.6rem;
                    width: ${width * 100}%;
                    margin: 0.7rem 0;
                    border-radius: 1rem;
                    background: ${SCROLL_EDGE};
                    transform-origin: left center;
                    animation: ${lineGrow} 1.8s ease-in-out ${index * 0.3}s
                      infinite;
                    @media (prefers-reduced-motion: reduce) {
                      animation: none;
                      opacity: 0.4;
                    }
                  `}
                />
              ))}
            </div>
          ) : (
            lines.map(({ line, isDefinition }, index) => (
              <div
                key={index}
                className={css`
                  ${
                    isDefinition
                      ? ''
                      : `font-style: italic; font-weight: 700; color: ${Color.darkGray()}; margin-top: ${
                          index ? '0.4rem' : 0
                        };`
                  }
                `}
              >
                {line}
                {writing && index === lines.length - 1 && (
                  <span
                    className={css`
                      margin-left: 2px;
                      animation: ${blinkAnimation} 1s infinite;
                    `}
                  >
                    |
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
